import React, { useState, useMemo } from 'react';
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
    XCircle
} from 'lucide-react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';

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

export default function TasksView({ employees, user, t, openTaskModal }) {

    // Assuming 'loading', 'tasks', 'userLang', and 'onTaskClick' are defined elsewhere or passed as props.
    // For the purpose of this edit, we'll define dummy values to ensure syntactical correctness.
    const [loading, setLoading] = useState(false); // Dummy loading state
    // Filter employees to only show those that are 'hidden' (Project Cards) or have specific PM data
    // Standard cards (visible on dashboard) should NOT appear here unless they have tasks.
    // Based on user request: "Why when I added an employee card, it added it as a task?" -> imply separation.
    const projectTasks = React.useMemo(() => {
        return employees.filter(emp => emp.hidden === true || emp.projectManagement);
    }, [employees]);

    const [tasks, setTasks] = useState(projectTasks);

    // Sync tasks with filtered employees when employees prop changes
    React.useEffect(() => {
        setTasks(employees.filter(emp => emp.hidden === true || emp.projectManagement));
    }, [employees]);
    const userLang = user?.language || 'en'; // Dummy userLang
    const onTaskClick = openTaskModal; // Map openTaskModal to onTaskClick
    const [toast, setToast] = useState(null);

    // Toast Logic
    React.useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const handleDeleteTask = async (e, task) => {
        e.stopPropagation();
        if (!window.confirm(t.deleteTaskConfirm || "Delete this task permanently?")) return;

        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'employees', task.id));
            // Update local state is a bit tricky if tasks is derived from props. 
            // Ideally we call a parent function, but here we update local state for immediate feedback.
            // If tasks are passed as props (employees), this local filter might be overwritten on re-render, 
            // but since firestore updates, the parent subscription should update eventually.
            // However, we are declaring 'tasks' as local state initialized from props in this file (lines 48).
            // Wait, looking at line 48: const [tasks, setTasks] = useState(employees);
            // This suggests tasks is local state.
            setTasks(prev => prev.filter(t => t.id !== task.id));
            showToast(t.taskDeleted || "Task deleted");
        } catch (error) {
            console.error("Error deleting", error);
            showToast(t.deleteError || "Failed to delete", "error");
        }
    };

    // Toast Component
    const Toast = () => (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'}`}>
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

    return (
        <div className="p-6 h-[calc(100vh-80px)] overflow-x-auto overflow-y-hidden">
            {toast && <Toast />}
            <div className="flex h-full gap-6 min-w-[1200px] rtl:flex-row-reverse" dir={userLang === 'ar' ? 'rtl' : 'ltr'}>
                {COLUMNS.map(col => {
                    const colTasks = getColumnTasks(col.id);
                    return (
                        <div key={col.id} className="flex-1 min-w-[280px] flex flex-col h-full rounded-2xl bg-slate-50 border border-slate-100/60">
                            {/* Column Header */}
                            <div className="p-4 flex items-center justify-between sticky top-0 bg-slate-50 z-10 rounded-t-2xl">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg ${col.bg} ${col.color} flex items-center justify-center`}>
                                        <col.icon size={18} />
                                    </div>
                                    <h3 className="font-bold text-slate-700">{col.title}</h3>
                                </div>
                                <span className="px-2.5 py-1 rounded-full bg-white text-slate-500 text-xs font-bold shadow-sm border border-slate-100">
                                    {colTasks.length}
                                </span>
                            </div>

                            {/* Column Body */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                {colTasks.map(task => {
                                    const totalSteps = task.projectManagement?.stages?.reduce((acc, s) => acc + s.steps.length, 0) || 0;
                                    const completedSteps = task.projectManagement?.stages?.reduce((acc, s) => acc + s.steps.filter(st => st.checked).length, 0) || 0;
                                    const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

                                    return (
                                        <motion.div
                                            layoutId={task.id}
                                            key={task.id}
                                            whileHover={{ y: -4, scale: 1.02 }}
                                            className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 cursor-pointer group hover:shadow-md transition-all relative overflow-hidden"
                                            onClick={() => onTaskClick(task)}
                                        >
                                            {/* Top Strip */}
                                            <div className={`absolute top-0 left-0 w-full h-1 ${col.bg.replace('bg-', 'bg-gradient-to-r from-transparent via-')}`} />

                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h4 className="font-bold text-slate-800 line-clamp-1">{task.name}</h4>
                                                    <p className="text-xs text-slate-400 font-mono mt-0.5">{task.company || task.jobTitle}</p>
                                                </div>
                                                <button
                                                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                                    onClick={(e) => handleDeleteTask(e, task)}
                                                    title={t.delete || "Delete"}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
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

                                            {/* Hover Action */}
                                            <div className="absolute ltr:right-3 rtl:left-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 rtl:rotate-180">
                                                    <ArrowRight size={12} />
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}

                                {colTasks.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-32 text-slate-300 border-2 border-dashed border-slate-100 rounded-xl m-2">
                                        <col.icon size={24} className="mb-2 opacity-50" />
                                        <span className="text-xs font-medium">{t.noTasks || 'No tasks'}</span>
                                        <button className="mt-2 text-[10px] font-bold text-brand-500 bg-brand-50 px-3 py-1 rounded-full uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand-100">
                                            + {t.newTask || 'Add'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const calculateProgress = (pm) => {
    if (!pm?.stages) return 0;
    // Simple logic: % of checked steps across all stages
    let total = 0;
    let checked = 0;
    pm.stages.forEach(stage => {
        if (stage.steps) {
            stage.steps.forEach(step => {
                total++;
                if (step.checked) checked++;
            });
        }
    });
    if (total === 0) return 0;
    return Math.round((checked / total) * 100);
}
