import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, QrCode, Lock, Globe, Check, Share2 } from 'lucide-react';

export default function ShareModal({ isOpen, onClose, task, user, t }) {
    const trackingUrl = `${window.location.origin}/tracker/${user.uid}/${task?.id}`;
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(trackingUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen || !task) return null;

    // Use a reliable QR Code API for zero dependencies (QuickChart or similar)
    const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(trackingUrl)}&size=200&margin=2`;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
                                <Share2 size={20} />
                            </div>
                            <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">{t.shareTrackingLink || 'Share Tracking Link'}</h3>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* URL Box */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
                                <span>{t.copyLink || 'Direct Link'}</span>
                                {copied && <span className="text-emerald-500 flex items-center gap-1"><Check size={12} /> {t.copied || 'Copied'}</span>}
                            </div>
                            <div className="relative group">
                                <input
                                    readOnly
                                    value={trackingUrl}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 pr-12 text-sm font-medium text-slate-600 truncate focus:outline-none"
                                />
                                <button
                                    onClick={handleCopy}
                                    className="absolute right-2 top-2 p-2.5 bg-white shadow-sm border border-slate-100 rounded-xl text-brand-600 hover:bg-brand-50 transition-all active:scale-90"
                                >
                                    <Copy size={16} />
                                </button>
                            </div>
                        </div>

                        {/* QR Code */}
                        <div className="flex flex-col items-center">
                            <div className="p-4 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner group">
                                <img
                                    src={qrUrl}
                                    alt="QR Code"
                                    className="w-40 h-40 rounded-xl mix-blend-multiply group-hover:scale-105 transition-transform"
                                />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4 flex items-center gap-2">
                                <QrCode size={12} /> {t.qrCode || 'Scan to Track'}
                            </p>
                        </div>

                        {/* Security Preview */}
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600">
                                {task.projectManagement?.trackingSettings?.password ? <Lock size={20} /> : <Globe size={20} />}
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-emerald-800">
                                    {task.projectManagement?.trackingSettings?.password ? (t.passwordProtected || 'Password Protected') : (t.publicLink || 'Public Link')}
                                </p>
                                <p className="text-[10px] text-emerald-600 opacity-70">
                                    {task.projectManagement?.trackingSettings?.password ? 'Client needs password to view' : 'Accessible via link'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
                        <button
                            onClick={onClose}
                            className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                        >
                            {t.close || 'Done'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
