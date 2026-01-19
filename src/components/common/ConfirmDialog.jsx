import React from 'react';
import { AlertTriangle, Trash2, CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
    type = "danger", // danger, warning, info
    isLoading = false
}) {
    if (!isOpen) return null;

    const config = {
        danger: {
            icon: Trash2,
            iconColor: "text-red-500",
            iconBg: "bg-red-50",
            buttonBg: "bg-red-600 hover:bg-red-700",
            buttonText: "text-white"
        },
        warning: {
            icon: AlertTriangle,
            iconColor: "text-amber-500",
            iconBg: "bg-amber-50",
            buttonBg: "bg-amber-600 hover:bg-amber-700",
            buttonText: "text-white"
        },
        info: {
            icon: CheckCircle,
            iconColor: "text-blue-500",
            iconBg: "bg-blue-50",
            buttonBg: "bg-blue-600 hover:bg-blue-700",
            buttonText: "text-white"
        }
    };

    const style = config[type] || config.info;
    const Icon = style.icon;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                >
                    <div className="p-6">
                        <div className="flex gap-4">
                            <div className={`w-12 h-12 rounded-full ${style.iconBg} flex items-center justify-center shrink-0`}>
                                <Icon className={style.iconColor} size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{message}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100">
                        <button
                            onClick={onCancel}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${style.buttonBg} ${style.buttonText} disabled:opacity-50`}
                        >
                            {isLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            {confirmText}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
