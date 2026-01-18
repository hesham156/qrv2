import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Check, Calendar, Clock, AlertCircle, CheckCircle2,
    ChevronRight, Save, Trash2, Plus,
    LayoutList, MoreVertical, Globe, Lock, Eye, MessageSquare, History, Settings2,
    Palette, Video, Bell, Image, FileText, Upload, Loader2 as Loader
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import { uploadToWordPress } from '../../services/wordpressStorage';

export default function TaskDetailsModal({ employee, onClose, t, userId }) {
    const STATUS_OPTIONS = [
        { id: 'new', label: t.statusNew || 'New Request' },
        { id: 'data_received', label: t.statusData || 'Data Received' },
        { id: 'design', label: t.statusDesign || 'In Design' },
        { id: 'review', label: t.statusReview || 'Client Review' },
        { id: 'completed', label: t.statusDone || 'Completed' }
    ];

    const [status, setStatus] = useState(employee?.projectManagement?.status || 'new');
    const [estimatedHours, setEstimatedHours] = useState(employee?.projectManagement?.estimatedHours || 0);
    const [dueDate, setDueDate] = useState(
        employee?.projectManagement?.dueDate
            ? new Date(employee.projectManagement.dueDate.seconds * 1000).toISOString().substr(0, 10)
            : ''
    );
    const [notes, setNotes] = useState(employee?.projectManagement?.notes || '');
    const [priority, setPriority] = useState(employee?.projectManagement?.priority || 'normal');
    const [comments, setComments] = useState(employee?.projectManagement?.comments || []);
    const [newComment, setNewComment] = useState('');
    const [activeTab, setActiveTab] = useState('details'); // 'details' or 'tracking'

    // Tracking Specific Settings
    const [trackingSettings, setTrackingSettings] = useState(employee?.projectManagement?.trackingSettings || {
        password: '',
        language: 'auto',
        showPhases: true,
        allowFeedback: true
    });
    const [estimatedDelivery, setEstimatedDelivery] = useState(
        employee?.projectManagement?.estimatedDelivery
            ? new Date(employee.projectManagement.estimatedDelivery.seconds * 1000).toISOString().substr(0, 10)
            : ''
    );
    const [history, setHistory] = useState(employee?.projectManagement?.history || []);
    const [loading, setLoading] = useState(false);

    // Advanced Branding & Content
    const [branding, setBranding] = useState(employee?.projectManagement?.branding || {
        primaryColor: '#4f46e5', // default indigo-600
        logoUrl: '',
        darkModeEnabled: false
    });
    const [videoGreetingUrl, setVideoGreetingUrl] = useState(employee?.projectManagement?.videoGreetingUrl || '');
    const [notifications, setNotifications] = useState(employee?.projectManagement?.notificationSettings || {
        onStatusChange: true,
        onVisit: false
    });
    const [files, setFiles] = useState(employee?.projectManagement?.files || []);
    const [uploading, setUploading] = useState(null); // null, 'logo', 'file' or file id

    // Stages Structure (Default if empty)
    const [stages, setStages] = useState(employee?.projectManagement?.stages || [
        { id: 'data', label: t.dataCollection || 'Data Collection', steps: [{ id: 1, label: t.receiveLogo || 'Receive Logo', checked: false }, { id: 2, label: t.getColors || 'Get Brand Colors', checked: false }] },
        { id: 'design', label: t.designBuild || 'Design & Build', steps: [{ id: 3, label: t.createLayout || 'Create Layout', checked: false }, { id: 4, label: t.addProducts || 'Add Products', checked: false }] },
        { id: 'review', label: t.finalReview || 'Final Review', steps: [{ id: 5, label: t.clientApproval || 'Client Approval', checked: false }] }
    ]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const updateData = {
                projectManagement: {
                    status,
                    estimatedHours: Number(estimatedHours),
                    dueDate: dueDate ? new Date(dueDate) : null,
                    notes,
                    priority,
                    comments,
                    stages,
                    trackingSettings,
                    estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
                    history: [...history, { status, timestamp: new Date().toISOString() }].filter((v, i, a) => i === 0 || a[i - 1].status !== v.status),
                    branding,
                    videoGreetingUrl,
                    notificationSettings: notifications,
                    files
                }
            };

            await updateDoc(doc(db, "artifacts", appId, "users", userId, "employees", employee.id), updateData);
            onClose();
        } catch (error) {
            console.error("Error saving task:", error);
            alert(t.saveError || "Failed to save changes");
        } finally {
            setLoading(false);
        }
    };

    const toggleStep = (stageIndex, stepIndex) => {
        const newStages = [...stages];
        newStages[stageIndex].steps[stepIndex].checked = !newStages[stageIndex].steps[stepIndex].checked;
        setStages(newStages);
    };

    const addStep = (stageIndex) => {
        const text = prompt(t.addStep || "Enter step name:");
        if (!text) return;
        const newStages = [...stages];
        newStages[stageIndex].steps.push({
            id: Date.now(),
            label: text,
            checked: false
        });
        setStages(newStages);
    };

    const deleteStep = (stageIndex, stepIndex) => {
        if (!window.confirm(t.deleteStepConfirm || "Delete this step?")) return;
        const newStages = [...stages];
        newStages[stageIndex].steps.splice(stepIndex, 1);
        setStages(newStages);
    };

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        const comment = {
            id: Date.now(),
            text: newComment,
            createdAt: new Date().toISOString(),
            userId: userId,
            userName: t.me || 'Me'
        };
        setComments([...comments, comment]);
        setNewComment('');
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
                            <LayoutList size={20} />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg text-slate-800">{employee.name || 'Untitled Card'}</h2>
                            <p className="text-xs text-slate-500 font-mono">ID: {employee.id.substr(0, 8)}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 px-6 bg-slate-50/50">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`px-4 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'details' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        {t.taskDetails || 'Task Details'}
                    </button>
                    <button
                        onClick={() => setActiveTab('tracking')}
                        className={`px-4 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${activeTab === 'tracking' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        <Globe size={14} />
                        {t.trackingPortal || 'Tracking Portal'}
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {activeTab === 'details' ? (
                        <>
                            {/* Status, Dates, Priority */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">{t.leadStatus || 'Status'}</label>
                                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500">
                                        {STATUS_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">{t.dueDate || 'Due Date'}</label>
                                    <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">{t.estHours || 'Est. Hours'}</label>
                                    <div className="relative">
                                        <input type="number" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} className="w-full p-2.5 ltr:pl-9 rtl:pr-9 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500" />
                                        <Clock size={16} className="absolute ltr:left-3 rtl:right-3 top-3 text-slate-400" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <AlertCircle size={20} className="text-slate-400" />
                                    <div>
                                        <h3 className="font-bold text-sm text-slate-700">{t.priority || 'Priority Level'}</h3>
                                        <p className="text-xs text-slate-500">{t.priorityDesc || 'Set urgency'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {['low', 'normal', 'high'].map(p => (
                                        <button key={p} onClick={() => setPriority(p)} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${priority === p ? 'bg-brand-600 text-white shadow-md scale-105' : 'bg-white border text-slate-500'}`}>{p}</button>
                                    ))}
                                </div>
                            </div>

                            {/* Checklist */}
                            <div>
                                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><CheckCircle2 size={18} className="text-emerald-500" />{t.projectChecklist || 'Project Checklist'}</h3>
                                <div className="space-y-6">
                                    {stages.map((stage, sIdx) => (
                                        <div key={stage.id} className="bg-slate-50/50 border rounded-xl p-4">
                                            <div className="flex justify-between mb-3">
                                                <h4 className="font-bold text-sm text-slate-700 uppercase">{stage.label}</h4>
                                                <button onClick={() => addStep(sIdx)} className="text-xs font-bold text-brand-600 flex items-center gap-1"><Plus size={12} /> {t.addStep}</button>
                                            </div>
                                            <div className="space-y-2">
                                                {stage.steps.map((step, stepIdx) => (
                                                    <div key={step.id} className="flex items-center group">
                                                        <button onClick={() => toggleStep(sIdx, stepIdx)} className={`w-5 h-5 rounded border ltr:mr-3 rtl:ml-3 flex items-center justify-center ${step.checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300'}`}>{step.checked && <Check size={12} />}</button>
                                                        <span className={`text-sm flex-1 ${step.checked ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{step.label}</span>
                                                        <button onClick={() => deleteStep(sIdx, stepIdx)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1"><Trash2 size={14} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Notes & Comments */}
                            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.notesPlaceholder} className="w-full h-24 p-4 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500" />

                            <div>
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><MoreVertical size={18} />{t.comments}</h3>
                                <div className="bg-slate-50 border rounded-xl p-4 space-y-4">
                                    <div className="space-y-4 max-h-40 overflow-y-auto">
                                        {comments.map(c => (
                                            <div key={c.id} className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">{c.userName.charAt(0)}</div>
                                                <div className="bg-white p-3 rounded-lg border flex-1">
                                                    <p className="text-sm text-slate-600">{c.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder={t.writeComment} className="flex-1 bg-white border rounded-lg px-4 py-2 text-sm outline-none" onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} />
                                        <button onClick={handleAddComment} disabled={!newComment.trim()} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Send</button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-8">
                            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex items-center gap-4">
                                <Globe size={24} className="text-emerald-600" />
                                <div><h3 className="font-bold text-slate-800">{t.projectMagicLink}</h3><p className="text-xs text-slate-500">{t.magicLinkDesc}</p></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 flex items-center gap-2"><Lock size={12} /> {t.linkPassword}</label>
                                    <input type="text" value={trackingSettings.password} onChange={(e) => setTrackingSettings({ ...trackingSettings, password: e.target.value })} placeholder="Optional password" className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 flex items-center gap-2"><Globe size={12} /> Portal Language</label>
                                    <select value={trackingSettings.language} onChange={(e) => setTrackingSettings({ ...trackingSettings, language: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm font-bold">
                                        <option value="auto">Auto-detect</option><option value="ar">Arabic</option><option value="en">English</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 flex items-center gap-2"><Calendar size={12} /> Expected Delivery</label>
                                    <input type="date" value={estimatedDelivery} onChange={(e) => setEstimatedDelivery(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 flex items-center gap-2"><Video size={12} /> Video Greeting URL</label>
                                    <input type="text" value={videoGreetingUrl} onChange={(e) => setVideoGreetingUrl(e.target.value)} placeholder="YouTube or Video Link" className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm" />
                                </div>
                            </div>

                            {/* Branding Section */}
                            <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <Palette size={14} /> Portal Branding
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">Primary Branding Color</label>
                                        <div className="flex gap-3">
                                            <input
                                                type="color"
                                                value={branding.primaryColor}
                                                onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                                                className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                                            />
                                            <input
                                                type="text"
                                                value={branding.primaryColor}
                                                onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                                                className="flex-1 p-2 bg-white border rounded-lg text-xs font-mono"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                            <Image size={12} /> Custom Logo
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={branding.logoUrl}
                                                onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                                                placeholder="https://..."
                                                className="flex-1 p-2 bg-white border rounded-lg text-xs"
                                            />
                                            <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 rounded-lg flex items-center justify-center transition-colors">
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    inputMode="logo"
                                                    onChange={async (e) => {
                                                        const file = e.target.files[0];
                                                        if (!file) return;
                                                        setUploading('logo');
                                                        try {
                                                            const url = await uploadToWordPress(file);
                                                            setBranding({ ...branding, logoUrl: url });
                                                        } catch (err) {
                                                            alert("Upload failed");
                                                        } finally {
                                                            setUploading(null);
                                                        }
                                                    }}
                                                    disabled={uploading === 'logo'}
                                                />
                                                {uploading === 'logo' ? <Loader size={16} className="animate-spin" /> : <Upload size={16} />}
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <Settings2 size={14} /> Portal Behavior
                                </h4>
                                <div className="flex items-center justify-between">
                                    <div><p className="text-sm font-bold">Show Phase Details</p><p className="text-[10px] text-slate-500">Allow client to see checklist items.</p></div>
                                    <button onClick={() => setTrackingSettings({ ...trackingSettings, showPhases: !trackingSettings.showPhases })} className={`w-12 h-6 rounded-full p-1 transition-colors ${trackingSettings.showPhases ? 'bg-brand-600' : 'bg-slate-300'}`}><div className={`w-4 h-4 bg-white rounded-full transition-transform ${trackingSettings.showPhases ? 'translate-x-6' : 'translate-x-0'}`} /></button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div><p className="text-sm font-bold">Allow Client Feedback</p><p className="text-[10px] text-slate-500">Client can leave comments on the portal.</p></div>
                                    <button onClick={() => setTrackingSettings({ ...trackingSettings, allowFeedback: !trackingSettings.allowFeedback })} className={`w-12 h-6 rounded-full p-1 transition-colors ${trackingSettings.allowFeedback ? 'bg-brand-600' : 'bg-slate-300'}`}><div className={`w-4 h-4 bg-white rounded-full transition-transform ${trackingSettings.allowFeedback ? 'translate-x-6' : 'translate-x-0'}`} /></button>
                                </div>
                            </div>

                            {/* Notifications Section */}
                            <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <Bell size={14} /> Automation & Notifications
                                </h4>
                                <div className="flex items-center justify-between">
                                    <div><p className="text-sm font-bold">Notify Client on Status Change</p><p className="text-[10px] text-slate-500">Auto-send updates (requires backend).</p></div>
                                    <button onClick={() => setNotifications({ ...notifications, onStatusChange: !notifications.onStatusChange })} className={`w-12 h-6 rounded-full p-1 transition-colors ${notifications.onStatusChange ? 'bg-emerald-600' : 'bg-slate-300'}`}><div className={`w-4 h-4 bg-white rounded-full transition-transform ${notifications.onStatusChange ? 'translate-x-6' : 'translate-x-0'}`} /></button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div><p className="text-sm font-bold">Notify Me on Portal Visit</p><p className="text-[10px] text-slate-500">Get alerted when client opens the link.</p></div>
                                    <button onClick={() => setNotifications({ ...notifications, onVisit: !notifications.onVisit })} className={`w-12 h-6 rounded-full p-1 transition-colors ${notifications.onVisit ? 'bg-emerald-600' : 'bg-slate-300'}`}><div className={`w-4 h-4 bg-white rounded-full transition-transform ${notifications.onVisit ? 'translate-x-6' : 'translate-x-0'}`} /></button>
                                </div>
                            </div>

                            {/* File Management Section */}
                            <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <FileText size={14} /> Project Files
                                    </h4>
                                    <button
                                        onClick={() => {
                                            const fileInput = document.createElement('input');
                                            fileInput.type = 'file';
                                            fileInput.onchange = async (e) => {
                                                const file = e.target.files[0];
                                                if (!file) return;
                                                setUploading('file');
                                                try {
                                                    const url = await uploadToWordPress(file);
                                                    setFiles(prev => [...prev, { id: Date.now(), name: file.name, url, type: file.name.split('.').pop(), uploadedAt: new Date().toISOString() }]);
                                                } catch (err) {
                                                    alert("Upload failed");
                                                } finally {
                                                    setUploading(null);
                                                }
                                            };
                                            fileInput.click();
                                        }}
                                        disabled={uploading === 'file'}
                                        className="text-[10px] font-black text-brand-600 bg-brand-50 px-2 py-1 rounded-lg uppercase tracking-tighter flex items-center gap-1"
                                    >
                                        {uploading === 'file' ? <Loader size={10} className="animate-spin" /> : <Plus size={10} />}
                                        {t.addFile || "Add File"}
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {files.length === 0 ? (
                                        <p className="text-[10px] text-slate-400 text-center py-4">No files shared yet.</p>
                                    ) : (
                                        files.map((file, idx) => (
                                            <div key={file.id} className="flex items-center justify-between p-3 bg-white border rounded-xl group/file">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><FileText size={14} /></div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-xs font-bold text-slate-700 truncate">{file.name}</p>
                                                        <p className="text-[10px] text-slate-400 uppercase">{file.type} • {new Date(file.uploadedAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setFiles(files.filter(f => f.id !== file.id))}
                                                    className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover/file:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-indigo-50 rounded-xl border"><h4 className="text-[10px] font-black text-indigo-400">Portal Views</h4><p className="text-2xl font-black text-indigo-600">{employee.projectManagement?.analytics?.views || 0}</p></div>
                                <div className="p-4 bg-slate-50 rounded-xl border text-[10px] space-y-1"><h4 className="font-black text-slate-400">Recent History</h4>{history.slice(-2).map((h, i) => <div key={i} className="flex justify-between"><span>{h.status}</span><span>{new Date(h.timestamp).toLocaleDateString()}</span></div>)}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-600">Cancel</button>
                    <button onClick={handleSave} disabled={loading} className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center gap-2">
                        {loading ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
