import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, increment, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2, Clock, Loader, ShieldCheck, ExternalLink,
    AlertCircle, PartyPopper, Lock, ChevronRight, MessageSquare,
    Send, Star, ThumbsUp, Calendar, User, Moon, Sun, Monitor,
    Download, FileText as FileIcon, Video as VideoIcon
} from 'lucide-react';

const STATUS_MAP = {
    new: { label: 'Request Received', percentage: 5, color: 'text-blue-500', bg: 'bg-blue-600' },
    data_received: { label: 'Data Collected', percentage: 25, color: 'text-indigo-500', bg: 'bg-indigo-600' },
    design: { label: 'In Design', percentage: 50, color: 'text-purple-500', bg: 'bg-purple-600' },
    review: { label: 'Under Review', percentage: 80, color: 'text-amber-500', bg: 'bg-amber-600' },
    completed: { label: 'Project Completed', percentage: 100, color: 'text-emerald-500', bg: 'bg-emerald-600' }
};

export default function TrackerPage() {
    const { uid, tid } = useParams();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [sendingFeedback, setSendingFeedback] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [approvingStage, setApprovingStage] = useState(null);

    useEffect(() => {
        if (!uid || !tid) {
            setError("Invalid tracking link");
            setLoading(false);
            return;
        }

        const taskRef = doc(db, 'artifacts', appId, 'users', uid, 'employees', tid);
        const unsub = onSnapshot(taskRef, (snap) => {
            if (snap.exists()) {
                const data = snap.id ? { id: snap.id, ...snap.data() } : snap.data();
                setTask(data);

                // Analytics - Only increment on first load of the session
                if (!window.sessionStorage.getItem(`viewed_${tid}`)) {
                    updateDoc(taskRef, {
                        'projectManagement.analytics.views': increment(1),
                        'projectManagement.analytics.lastViewed': new Date().toISOString()
                    });
                    window.sessionStorage.setItem(`viewed_${tid}`, 'true');
                }

                // Check security
                const settings = data.projectManagement?.trackingSettings;
                if (!settings?.password) setIsAuthenticated(true);

                setError(null);
            } else {
                setError("Project not found or link expired");
            }
            setLoading(false);
        });

        return () => unsub();
    }, [uid, tid]);

    const handleUnlock = (e) => {
        e.preventDefault();
        if (password === task.projectManagement?.trackingSettings?.password) {
            setIsAuthenticated(true);
        } else {
            alert("Incorrect password");
        }
    };

    const handleSendFeedback = async () => {
        if (!feedback.trim()) return;
        setSendingFeedback(true);
        try {
            const taskRef = doc(db, 'artifacts', appId, 'users', uid, 'employees', tid);
            await updateDoc(taskRef, {
                'projectManagement.comments': arrayUnion({
                    id: Date.now(),
                    text: feedback,
                    createdAt: new Date().toISOString(),
                    userName: 'Client (via Portal)',
                    isClient: true
                })
            });
            setFeedback('');
            alert("Feedback sent successfully!");
        } catch (e) {
            console.error("Feedback error:", e);
            alert(`Failed to send feedback: ${e.message}`);
        } finally {
            setSendingFeedback(false);
        }
    };

    const handleApproveStage = async (stageId) => {
        setApprovingStage(stageId);
        try {
            const taskRef = doc(db, 'artifacts', appId, 'users', uid, 'employees', tid);
            const newStages = task.projectManagement.stages.map(s => {
                if (s.id === stageId) {
                    return { ...s, approvalStatus: 'approved', approvalTimestamp: new Date().toISOString() };
                }
                return s;
            });

            await updateDoc(taskRef, {
                'projectManagement.stages': newStages,
                'projectManagement.comments': arrayUnion({
                    id: Date.now(),
                    text: `✅ Client approved stage: ${task.projectManagement.stages.find(s => s.id === stageId)?.label}`,
                    createdAt: new Date().toISOString(),
                    userName: 'System',
                    isSystem: true
                })
            });
            alert(isRtl ? 'تم اعتماد المرحلة بنجاح' : 'Stage approved successfully!');
        } catch (e) {
            console.error("Approval error:", e);
            alert("Failed to approve stage");
        } finally {
            setApprovingStage(null);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="mb-4 text-brand-600"><Loader size={48} /></motion.div>
            <h2 className="text-xl font-bold text-slate-800">Establishing Secure Connection...</h2>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle size={48} className="text-red-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-slate-500 max-w-sm">{error}</p>
        </div>
    );

    if (!isAuthenticated) return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] p-8 sm:p-12 w-full max-w-md text-center shadow-2xl">
                <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><Lock size={32} /></div>
                <h1 className="text-2xl font-black text-slate-900 mb-2">Protected Portal</h1>
                <p className="text-slate-500 mb-8 text-sm">Please enter the password provided to access your project tracker.</p>
                <form onSubmit={handleUnlock} className="space-y-4">
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Project Password"
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-brand-500/10 transition-all font-bold text-center"
                    />
                    <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl hover:bg-black transition-all">Unlock Track</button>
                </form>
            </motion.div>
        </div>
    );

    const currentStatus = task.projectManagement?.status || 'new';
    const settings = task.projectManagement?.trackingSettings || {};
    const branding = task.projectManagement?.branding || {};
    const statusInfo = STATUS_MAP[currentStatus] || STATUS_MAP.new;
    const progress = statusInfo.percentage;
    const isRtl = settings.language === 'ar';

    // Apply branding color dynamically
    const primaryColor = branding.primaryColor || '#4f46e5';

    return (
        <div
            className={`min-h-screen bg-slate-50/50 ${isRtl ? 'font-arabic' : ''}`}
            dir={isRtl ? 'rtl' : 'ltr'}
            style={{ '--brand-primary': primaryColor }}
        >
            <div className="max-w-4xl mx-auto px-4 py-12">

                {/* Modern Header */}
                <div className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white'} rounded-[2.5rem] shadow-xl p-8 sm:p-12 mb-8 relative overflow-hidden backdrop-blur-md border`}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50/5 rounded-full -mr-32 -mt-32 -z-1" />
                    <div className="absolute top-4 right-4 ltr:right-4 rtl:left-4 z-20">
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className={`p-3 rounded-2xl transition-all ${darkMode ? 'bg-slate-800 text-yellow-500 hover:bg-slate-700' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-brand-600'}`}
                        >
                            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="text-center md:text-left rtl:md:text-right">
                            {branding.logoUrl ? (
                                <img src={branding.logoUrl} alt="Logo" className="h-12 w-auto mb-6 mx-auto md:mx-0 object-contain" />
                            ) : null}
                            <span
                                className={`inline-block px-4 py-1.5 rounded-full bg-opacity-10 text-xs font-black uppercase tracking-widest mb-4`}
                                style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                            >
                                {statusInfo.label}
                            </span>
                            <h1 className={`text-3xl sm:text-5xl font-black mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{task.name}</h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-400 text-sm font-bold">
                                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> LIVE Tracking</div>
                                {task.projectManagement?.estimatedDelivery && (
                                    <div className="flex items-center gap-2 border-l rtl:border-r border-slate-200 pl-4 rtl:pr-4">
                                        <Calendar size={14} style={{ color: primaryColor }} />
                                        {isRtl ? 'موعد التسليم المتوقع:' : 'Expected:'} {new Date(task.projectManagement.estimatedDelivery.seconds * 1000).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90">
                                <circle cx="64" cy="64" r="58" className={`${darkMode ? 'stroke-slate-800' : 'stroke-slate-100'} fill-none`} strokeWidth="12" />
                                <motion.circle
                                    cx="64" cy="64" r="58"
                                    className={`fill-none`}
                                    style={{ stroke: primaryColor }}
                                    strokeWidth="12" strokeDasharray="364.4"
                                    initial={{ strokeDashoffset: 364.4 }}
                                    animate={{ strokeDashoffset: 364.4 - (364.4 * progress) / 100 }}
                                    transition={{ duration: 2, ease: "easeOut" }}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <span className={`absolute text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{progress}%</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Progression & Phases */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Video Greeting (If enabled) */}
                        {task.projectManagement?.videoGreetingUrl && (
                            <div className="bg-white rounded-[2rem] p-6 shadow-lg border-2 border-slate-100 overflow-hidden">
                                <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3 px-2">
                                    <div className="p-2 rounded-xl bg-red-50 text-red-600"><VideoIcon size={20} /></div>
                                    {isRtl ? 'رسالة ترحيب خاصة' : 'Video Greeting'}
                                </h3>
                                <div className="aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-inner">
                                    {task.projectManagement.videoGreetingUrl.includes('youtube.com') || task.projectManagement.videoGreetingUrl.includes('youtu.be') ? (
                                        <iframe
                                            width="100%" height="100%"
                                            src={`https://www.youtube.com/embed/${task.projectManagement.videoGreetingUrl.split('v=')[1]?.split('&')[0] || task.projectManagement.videoGreetingUrl.split('/').pop()}`}
                                            title="YouTube video player" frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen>
                                        </iframe>
                                    ) : (
                                        <video src={task.projectManagement.videoGreetingUrl} controls className="w-full h-full object-cover" />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Status Timeline */}
                        <div className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white'} border rounded-[2rem] p-8 shadow-lg`}>
                            <h3 className={`text-lg font-black mb-8 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                <Clock size={20} style={{ color: primaryColor }} />
                                {isRtl ? 'الجدول الزمني للمشروع' : 'Project Timeline'}
                            </h3>
                            <div className="space-y-4">
                                {Object.entries(STATUS_MAP).map(([key, info], idx) => {
                                    const isPast = Object.keys(STATUS_MAP).indexOf(currentStatus) >= idx;
                                    const isNext = Object.keys(STATUS_MAP).indexOf(currentStatus) + 1 === idx;
                                    const hist = task.projectManagement?.history?.find(h => h.status === key);

                                    return (
                                        <div key={key} className="flex gap-4 group">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all ${isPast ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : (darkMode ? 'bg-slate-800 text-slate-600' : 'bg-slate-100 text-slate-400')}`}>
                                                    {isPast ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-current" />}
                                                </div>
                                                {idx < 4 && <div className={`w-0.5 h-12 -my-1 transition-colors ${isPast ? 'bg-emerald-500' : (darkMode ? 'bg-slate-800' : 'bg-slate-100')}`} />}
                                            </div>
                                            <div className={`flex-1 pb-8 transition-all ${isPast ? 'opacity-100' : 'opacity-40'}`}>
                                                <div className="flex justify-between items-start">
                                                    <h4 className={`font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{info.label}</h4>
                                                    {hist && <span className={`text-[10px] px-2 py-1 rounded ${darkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>{new Date(hist.timestamp).toLocaleDateString()}</span>}
                                                </div>
                                                {isNext && <p className="text-xs text-brand-500 mt-1 font-bold">● {isRtl ? 'المرحلة القادمة' : 'Up Next'}</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Detailed Phases (If enabled) */}
                        {settings.showPhases && task.projectManagement?.stages && (
                            <div className="space-y-4">
                                {task.projectManagement.stages.map((stage, sIdx) => {
                                    const allChecked = stage.steps?.every(s => s.checked);
                                    const isApproved = stage.approvalStatus === 'approved';
                                    const canApprove = allChecked && !isApproved;

                                    return (
                                        <div key={stage.id} className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} border rounded-3xl p-6 shadow-sm overflow-hidden relative`}>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <h4 className={`font-black text-sm uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{stage.label}</h4>
                                                    {isApproved && <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full"><ShieldCheck size={10} /> {isRtl ? 'معتمد' : 'APPROVED'}</span>}
                                                </div>
                                                <span className="text-xs text-slate-400 font-bold">
                                                    {stage.steps?.filter(s => s.checked).length || 0}/{stage.steps?.length || 0} COMPLETED
                                                </span>
                                            </div>
                                            <div className="space-y-3 mb-6">
                                                {stage.steps?.map((step, idx) => (
                                                    <div key={idx} className="flex items-center gap-3">
                                                        <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${step.checked ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-200'}`}>
                                                            {step.checked ? <CheckCircle2 size={14} /> : <Clock size={12} />}
                                                        </div>
                                                        <span className={`text-sm font-medium ${step.checked ? 'text-slate-500 line-through' : (darkMode ? 'text-slate-300' : 'text-slate-600')}`}>{step.label}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {canApprove && (
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => handleApproveStage(stage.id)}
                                                    disabled={approvingStage === stage.id}
                                                    className="w-full py-3 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-200/50 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                                                >
                                                    {approvingStage === stage.id ? <Loader size={14} className="animate-spin" /> : <><CheckCircle2 size={14} /> {isRtl ? 'اعتماد هذه المرحلة' : 'Approve this Stage'}</>}
                                                </motion.button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Project Files */}
                        {task.projectManagement?.files && task.projectManagement.files.length > 0 && (
                            <div className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} border rounded-[2rem] p-8 shadow-lg`}>
                                <h3 className={`text-lg font-black mb-6 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    <Download size={20} style={{ color: primaryColor }} />
                                    {isRtl ? 'ملفات المشروع' : 'Project Files'}
                                </h3>
                                <div className="space-y-3">
                                    {task.projectManagement.files.map((file) => (
                                        <a
                                            key={file.id}
                                            href={file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`${darkMode ? 'bg-slate-800 hover:bg-slate-700 border-slate-700' : 'bg-slate-50 hover:bg-slate-100 border-slate-100'} p-4 rounded-2xl border transition-all flex items-center justify-between group`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl ${darkMode ? 'bg-slate-700 text-slate-400' : 'bg-white text-slate-400'}`}><FileIcon size={18} /></div>
                                                <div>
                                                    <p className={`text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{file.name}</p>
                                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{file.type} • {new Date(file.uploadedAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Side: Feedback & Support */}
                    <div className="space-y-8">

                        {/* Feedback Section */}
                        {settings.allowFeedback && (
                            <div className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-brand-100 shadow-brand-500/5 ring-1 ring-brand-100'} border rounded-[2rem] p-8 shadow-lg relative overflow-hidden`}>
                                <div className="absolute top-0 right-0 p-4 opacity-10"><MessageSquare size={48} style={{ color: primaryColor }} /></div>
                                <h3 className={`text-lg font-black mb-6 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    <ThumbsUp size={20} style={{ color: primaryColor }} />
                                    {isRtl ? 'إرسال ملاحظة' : 'Send Feedback'}
                                </h3>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder={isRtl ? 'اكتب ملاحظاتك هنا...' : 'Write your notes or feedback here...'}
                                    className={`${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-100'} w-full h-32 p-4 rounded-2xl outline-none focus:ring-4 focus:ring-brand-500/10 transition-all text-sm mb-4 resize-none`}
                                />
                                <button
                                    onClick={handleSendFeedback}
                                    disabled={sendingFeedback || !feedback.trim()}
                                    className="w-full py-4 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl disabled:opacity-50"
                                    style={{ backgroundColor: primaryColor, boxShadow: `0 10px 20px ${primaryColor}40` }}
                                >
                                    {sendingFeedback ? <Loader size={18} className="animate-spin" /> : <><Send size={18} /> {isRtl ? 'إرسال' : 'Send Feedback'}</>}
                                </button>
                            </div>
                        )}

                        {/* Project Info */}
                        <div className={`${darkMode ? 'bg-slate-800' : 'bg-slate-900'} rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden`}>
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white opacity-[0.03] rounded-full translate-x-12 translate-y-12" />
                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Contact Manager</h4>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><User size={24} /></div>
                                <div>
                                    <p className="font-bold text-slate-200">QRv2 Support Team</p>
                                    <p className="text-xs text-slate-500">Project Liaison</p>
                                </div>
                            </div>
                            <a href="#" className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 group">
                                <span className="text-sm font-bold">Request Callback</span>
                                <ChevronRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
                            </a>
                        </div>

                        {/* Security Badge */}
                        <div className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} p-6 rounded-3xl border text-center`}>
                            <div className={`flex items-center justify-center gap-2 text-emerald-500 mb-2`}>
                                <ShieldCheck size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">End-to-End Secure Tracking</span>
                            </div>
                            <p className="text-[10px] text-slate-400">Data provided is confidential and only accessible via this authorized link.</p>
                        </div>
                    </div>
                </div>

                {/* Footer Brand */}
                <div className="mt-16 flex flex-col items-center text-slate-300">
                    <img src="/logo.svg" className="h-6 grayscale opacity-30 mb-4" alt="QRv2" />
                    <p className="text-xs font-bold uppercase tracking-widest">Powered by QRv2 Digital Assets</p>
                </div>
            </div>
        </div>
    );
}
