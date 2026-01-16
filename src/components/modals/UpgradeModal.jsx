import React from 'react';
import { Crown, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UpgradeModal({ onClose, t }) {
    const navigate = useNavigate();

    const handleUpgrade = () => {
        navigate('/pricing');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">

                {/* Decorative Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white text-center">
                    <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                        <Crown size={32} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-bold">{t.upgradeTitle}</h3>
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-black/10 hover:bg-black/20 rounded-full p-1"
                >
                    <X size={20} />
                </button>

                <div className="p-8 text-center space-y-6">
                    <p className="text-slate-600 text-lg leading-relaxed">
                        {t.upgradeMsg}
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                            {t.cancel}
                        </button>
                        <button
                            onClick={handleUpgrade}
                            className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 transition-all shadow-lg hover:shadow-indigo-500/25 transform active:scale-95"
                        >
                            {t.upgradeBtn}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
