import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClipboardList,
    CheckCircle2,
    Clock,
    AlertCircle,
    MoreHorizontal,
    Plus,
    FileText,
    Palette,
    Eye,
    ArrowRight,
    Loader,
    Calendar,
    Trash2,
    XCircle,
    Share2
} from 'lucide-react';
import { doc, updateDoc, deleteDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import ShareModal from '../../components/dashboard/ShareModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

// Helper to get Status Color
const getStatusColor = (status) => {
    switch (status) {
        case 'new': return 'bg-slate-100 text-slate-600 border-slate-200';
        case 'data_received': return 'bg-blue-50 text-blue-600 border-blue-200';
        case 'design': return 'bg-purple-50 text-purple-600 border-purple-200';
        case 'review': return 'bg-amber-50 text-amber-600 border-amber-200';
        case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
        default: return 'bg-slate-100 text-slate-600';
    }
};

export default function TasksView({ employees, user, t, openTaskModal }) {
    // Filter employees to only show those that are 'hidden' (Project Cards) or have specific PM data
    const projectTasks = useMemo(() => {
        return employees.filter(emp => emp.hidden === true || emp.projectManagement);
    }, [employees]);

    const [tasks, setTasks] = useState(projectTasks);
    // Sync locally when props change
    useEffect(() => {
        setTasks(employees.filter(emp => emp.hidden === true || emp.projectManagement));
    }, [employees]);

    const userLang = user?.language || 'en';
    const onTaskClick = openTaskModal;
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(false);
    const [shareModal, setShareModal] = useState({ isOpen: false, task: null });

    // Dialog State
    const [dialog, setDialog] = useState({ isOpen: false, data: null, type: 'info', title: '', message: '', action: null });
    const [actionLoading, setActionLoading] = useState(false);

    // Refs for columns to detecting drop areas
    const columnRefs = useRef({});

    // Toast Logic
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const confirmDeleteTask = (e, task) => {
        e.stopPropagation();
        setDialog({
            isOpen: true,
            data: task,
            type: 'danger',
            title: t.deleteTask || 'Delete Task',
            message: t.deleteTaskConfirm || "Delete this task permanently?",
            action: 'delete_task',
            confirmText: t.delete || 'Delete'
        });
    };

    const handleConfirmAction = async () => {
        if (!dialog.data || !dialog.action) return;

        setActionLoading(true);
        const task = dialog.data;

        try {
            if (dialog.action === 'delete_task') {
                await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'employees', task.id));
                setTasks(prev => prev.filter(t => t.id !== task.id));
                showToast(t.taskDeleted || "Task deleted");
            }
            setDialog({ ...dialog, isOpen: false });
        } catch (error) {
            console.error("Error performing action:", error);
            showToast(t.deleteError || "Action failed", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleQuickAdd = async (status) => {
        const title = window.prompt(t.enterTaskName || "Enter Task Name:");
        if (!title) return;

        try {
            const newCard = {
                name: title,
                jobTitle: 'Project Task',
                hidden: true, // It's a task card
                createdAt: serverTimestamp(),
                projectManagement: {
                    status: status,
                    stages: [
                        { id: 'data', label: t.dataCollection || 'Data Collection', steps: [] },
                        { id: 'design', label: t.designBuild || 'Design & Build', steps: [] },
                        { id: 'review', label: t.finalReview || 'Final Review', steps: [] }
                    ],
                    estimatedHours: 0,
                    notes: ''
                }
            };

            // Optimistic add (optional, but let's wait for firestore for simplicity or push a temp one)
            // Ideally we wait for real time update, but we can show a toast
            await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'employees'), newCard);
            showToast(t.taskCreated || "Task created!");
        } catch (error) {
            console.error("Error creating task:", error);
            showToast(t.createError || "Failed to create task", "error");
        }
    };

    const handleShareLink = (e, task) => {
        e.stopPropagation();
        setShareModal({ isOpen: true, task });
    };

    const handleDragEnd = async (task, info) => {
        const { point } = info;

        // Find which column the task was dropped in
        const droppedColId = Object.keys(columnRefs.current).find(colId => {
            const el = columnRefs.current[colId];
            if (!el) return false;
            const rect = el.getBoundingClientRect();
            // Check if point is inside rect
            return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
        });

        if (droppedColId && droppedColId !== task.projectManagement?.status) {
            // 1. Optimistic Update
            setTasks(prev => prev.map(t => {
                if (t.id === task.id) {
                    return { ...t, projectManagement: { ...t.projectManagement, status: droppedColId } };
                }
                return t;
            }));

            // 2. Update Firestore
            try {
                const taskRef = doc(db, 'artifacts', appId, 'users', user.uid, 'employees', task.id);
                await updateDoc(taskRef, {
                    'projectManagement.status': droppedColId
                });
                showToast(`${t.movedTo || 'Moved to'} ${getStatusLabel(droppedColId, t)}`);
            } catch (error) {
                console.error("Error moving task:", error);
                showToast(t.moveError || "Failed to move task", "error");
                // Revert optimistic update if needed (omitted for brevity)
            }
        }
    };

    // Toast Component
    const Toast = () => (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-[60] animate-in slide-in-from-bottom-5 fade-in duration-300 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'}`}>
            {toast.type === 'error' ? <XCircle size={20} /> : <CheckCircle2 size={20} className="text-emerald-400" />}
            <span className="font-bold text-sm">{toast.message}</span>
        </div>
    );

    const COLUMNS = [
        { id: 'new', title: t.statusNew || 'New Request', icon: Loader, color: 'text-blue-500', bg: 'bg-blue-50' },
        { id: 'data_received', title: t.statusData || 'Data Received', icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { id: 'design', title: t.statusDesign || 'In Design', icon: Palette, color: 'text-purple-500', bg: 'bg-purple-50' },
        { id: 'review', title: t.statusReview || 'Client Review', icon: Eye, color: 'text-amber-500', bg: 'bg-amber-50' },
        { id: 'completed', title: t.statusDone || 'Completed', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    ];

    if (loading) return <div className="p-10 text-center animate-pulse">{t.loadingTasks || 'Loading Board...'}</div>;

    const getColumnTasks = (colId) => {
        return tasks.filter(task => {
            const status = task.projectManagement?.status || 'new';
            // Determine column based on status
            if (colId === 'completed' && status === 'completed') return true;
            if (colId === 'review' && status === 'review') return true;
            if (colId === 'design' && status === 'design') return true;
            if (colId === 'data_received' && status === 'data_received') return true;
            if (colId === 'new' && (!status || status === 'new')) return true;
            return false;
        });
    };

    // Status Label Helper
    const getStatusLabel = (status, t) => {
        const map = {
            new: t.statusNew || 'New',
            data_received: t.statusData || 'Data Received',
            design: t.statusDesign || 'In Design',
            review: t.statusReview || 'In Review',
            completed: t.statusDone || 'Completed'
        };
        return map[status] || status;
    }

    return (
        <div className="p-6 h-[calc(100vh-80px)] overflow-x-auto overflow-y-hidden">
            {toast && <Toast />}

            <ConfirmDialog
                isOpen={dialog.isOpen}
                title={dialog.title}
                message={dialog.message}
                type={dialog.type}
                confirmText={dialog.confirmText}
                cancelText={t.cancel || 'Cancel'}
                onConfirm={handleConfirmAction}
                onCancel={() => setDialog({ ...dialog, isOpen: false })}
                isLoading={actionLoading}
            />

            <div className="flex h-full gap-6 min-w-[1200px] rtl:flex-row-reverse" dir={userLang === 'ar' ? 'rtl' : 'ltr'}>
                {COLUMNS.map(col => {
                    const colTasks = getColumnTasks(col.id);
                    return (
                        <div
                            key={col.id}
                            ref={el => columnRefs.current[col.id] = el}
                            className="flex-1 min-w-[280px] flex flex-col h-full rounded-2xl bg-slate-50 border border-slate-100/60"
                        >
                            {/* Column Header */}
                            <div className="p-4 flex items-center justify-between sticky top-0 bg-slate-50 z-10 rounded-t-2xl group/col">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg ${col.bg} ${col.color} flex items-center justify-center`}>
                                        <col.icon size={18} />
                                    </div>
                                    <h3 className="font-bold text-slate-700">{col.title}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-1 rounded-full bg-white text-slate-500 text-xs font-bold shadow-sm border border-slate-100">
                                        {colTasks.length}
                                    </span>
                                    {/* Quick Add Button Header */}
                                    <button
                                        onClick={() => handleQuickAdd(col.id)}
                                        className="w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 flex items-center justify-center transition-colors"
                                        title={t.quickAdd || "Quick Add Task"}
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Column Body */}
                            <motion.div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar" layoutScroll>
                                <AnimatePresence>
                                    {colTasks.map(task => {
                                        const totalSteps = task.projectManagement?.stages?.reduce((acc, s) => acc + s.steps.length, 0) || 0;
                                        const completedSteps = task.projectManagement?.stages?.reduce((acc, s) => acc + s.steps.filter(st => st.checked).length, 0) || 0;
                                        const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

                                        return (
                                            <motion.div
                                                layout
                                                layoutId={task.id}
                                                key={task.id}
                                                drag
                                                dragSnapToOrigin
                                                dragElastic={0.1}
                                                onDragEnd={(e, info) => handleDragEnd(task, info)}
                                                whileHover={{ y: -4, scale: 1.02, zIndex: 10, cursor: 'grab' }}
                                                whileDrag={{ scale: 1.05, cursor: 'grabbing', zIndex: 100, rotate: 2 }}
                                                className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 group hover:shadow-md transition-shadow relative overflow-hidden"
                                                onClick={() => onTaskClick(task)}
                                            >
                                                {/* Top Strip */}
                                                <div className={`absolute top-0 left-0 w-full h-1 ${col.bg.replace('bg-', 'bg-gradient-to-r from-transparent via-')}`} />

                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 line-clamp-1">{task.name}</h4>
                                                        <p className="text-xs text-slate-400 font-mono mt-0.5">{task.company || task.jobTitle}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            className="text-slate-300 hover:text-brand-500 transition-colors p-1"
                                                            onClick={(e) => handleShareLink(e, task)}
                                                            title={t.shareTracking || "Share Tracking Link"}
                                                            onPointerDown={(e) => e.stopPropagation()}
                                                        >
                                                            <Share2 size={16} />
                                                        </button>
                                                        <button
                                                            className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                                            onClick={(e) => confirmDeleteTask(e, task)}
                                                            title={t.delete || "Delete"}
                                                            onPointerDown={(e) => e.stopPropagation()}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                {totalSteps > 0 && (
                                                    <div className="mb-3">
                                                        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                                                            <span>Progress</span>
                                                            <span>{progress}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-brand-500'}`}
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Footer Info */}
                                                <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 pt-2 border-t border-slate-50">
                                                    <div className="flex items-center gap-1.5 tooltip" title="Due Date">
                                                        <Calendar size={12} className={task.projectManagement?.dueDate ? 'text-brand-500' : 'text-slate-300'} />
                                                        <span>
                                                            {task.projectManagement?.dueDate
                                                                ? new Date(task.projectManagement.dueDate.seconds * 1000).toLocaleDateString()
                                                                : '--/--'
                                                            }
                                                        </span>
                                                    </div>
                                                    {task.projectManagement?.estimatedHours > 0 && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock size={12} className="text-indigo-400" />
                                                            <span>{task.projectManagement?.estimatedHours}h</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>

                                {colTasks.length === 0 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center justify-center h-32 text-slate-300 border-2 border-dashed border-slate-100 rounded-xl m-2"
                                    >
                                        <col.icon size={24} className="mb-2 opacity-50" />
                                        <span className="text-xs font-medium">{t.noTasks || 'No tasks'}</span>
                                        <button
                                            onClick={() => handleQuickAdd(col.id)}
                                            className="mt-2 text-[10px] font-bold text-brand-500 bg-brand-50 px-3 py-1 rounded-full uppercase tracking-wide opacity-100 hover:bg-brand-100 transition-colors"
                                        >
                                            + {t.newTask || 'Add'}
                                        </button>
                                    </motion.div>
                                )}
                            </motion.div>
                        </div>
                    );
                })}
            </div>

            <ShareModal
                isOpen={shareModal.isOpen}
                onClose={() => setShareModal({ isOpen: false, task: null })}
                task={shareModal.task}
                user={user}
                t={t}
            />
        </div>
    );
}
