import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import { X, Save, Building, CreditCard, Check, Calendar, Wallet } from 'lucide-react';
import { Button } from '../ui/Button';
import { connectGoogleCalendar } from '../../services/googleAuthService';

export default function SettingsModal({ onClose, user, t, lang }) {
    const [companyName, setCompanyName] = useState('');
    const [plan, setPlan] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isGoogleLinked, setIsGoogleLinked] = useState(false);
    const [linkingGoogle, setLinkingGoogle] = useState(false);
    const [showAppleWallet, setShowAppleWallet] = useState(true);
    const [showGoogleWallet, setShowGoogleWallet] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return;
            try {
                const docRef = doc(db, 'artifacts', appId, 'users', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setCompanyName(data.companyName || '');
                    // Map plan ID to readable name if needed, or just display ID for now
                    // In RegisterView we saw: free, pro, enterprise
                    setPlan(data.plan || 'free');
                    setIsGoogleLinked(!!data.googleCredentials?.refreshToken);
                    setShowAppleWallet(data.showAppleWallet !== false);
                    setShowGoogleWallet(data.showGoogleWallet !== false);
                }
            } catch (error) {
                console.error("Error fetching user settings:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [user]);

    const handleConnectGoogle = async () => {
        setLinkingGoogle(true);
        try {
            await connectGoogleCalendar();
            setIsGoogleLinked(true);
            alert("Google Calendar connected successfully!");
        } catch (error) {
            console.error("Connection failed:", error);
            alert("Failed to connect Google Calendar. Ensure you approved the permissions.");
        } finally {
            setLinkingGoogle(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const docRef = doc(db, 'artifacts', appId, 'users', user.uid);
            await setDoc(docRef, {
                companyName: companyName,
                showAppleWallet,
                showGoogleWallet
            }, { merge: true });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error("Error saving settings:", error);
            alert(t.saveError);
        } finally {
            setSaving(false);
        }
    };

    const getPlanName = (planId) => {
        switch (planId) {
            case 'free': return 'Free Plan';
            case 'pro': return 'Pro Plan';
            case 'enterprise': return 'Enterprise';
            default: return planId;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-lg text-slate-800">{t.settingsTitle || 'Settings'}</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {loading ? (
                        <div className="py-8 text-center text-slate-500">{t.loading}</div>
                    ) : (
                        <form onSubmit={handleSave} className="space-y-6">

                            {/* Plan Info (Read Only) */}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                                <div className="bg-blue-100 text-blue-600 p-2 rounded-lg shrink-0">
                                    <CreditCard size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-blue-900 text-sm mb-1">{t.currentPlan || 'Current Plan'}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-blue-700 font-bold text-lg capitalize">{getPlanName(plan)}</span>
                                        <span className="bg-blue-200 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                                            {t.active || 'Active'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Company Name Input */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <Building size={16} className="text-slate-400" />
                                    {t.companyNameSettings || 'Company Name'}
                                </label>
                                <input
                                    type="text"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                                    placeholder={t.companyNamePlaceholder || 'Enter your company name'}
                                />
                                <p className="text-xs text-slate-400 mt-2">
                                    {t.companyNameHint || 'This will be displayed on your invoices and reports.'}
                                </p>
                            </div>

                            {/* Wallet Buttons Visibility Section */}
                            <div className="pt-4 border-t border-slate-100">
                                <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    <Wallet size={16} className="text-purple-500" />
                                    {t.walletButtons || 'أزرار المحفظة'}
                                </label>

                                <div className="space-y-2">
                                    {/* Apple Wallet Toggle */}
                                    <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center shadow-sm">
                                                <Wallet size={18} className="text-white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">Apple Wallet</p>
                                                <p className="text-[10px] text-slate-500">{t.showOnProfile || 'إظهار على الملف الشخصي'}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowAppleWallet(v => !v)}
                                            className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${showAppleWallet ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                        >
                                            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${showAppleWallet ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </button>
                                    </div>

                                    {/* Google Wallet Toggle */}
                                    <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-200">
                                                <CreditCard size={18} className="text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">Google Wallet</p>
                                                <p className="text-[10px] text-slate-500">{t.showOnProfile || 'إظهار على الملف الشخصي'}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowGoogleWallet(v => !v)}
                                            className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${showGoogleWallet ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                        >
                                            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${showGoogleWallet ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Integrations Section */}
                            <div className="pt-4 border-t border-slate-100">
                                <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    <Calendar size={16} className="text-indigo-500" />
                                    {t.integrations || 'Integrations'}
                                </label>

                                <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                            <svg viewBox="0 0 24 24" className="w-6 h-6">
                                                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.92 3.24-2.12 4.44-1.2 1.2-3.08 2.44-5.72 2.44-4.44 0-8.04-3.6-8.04-8.04s3.6-8.04 8.04-8.04c2.44 0 4.2.96 5.52 2.2l2.32-2.32C18.24 2.8 15.64 1.2 12.48 1.2 6.64 1.2 1.88 5.96 1.88 11.8s4.76 10.6 10.6 10.6c3.16 0 5.52-1.04 7.36-2.96 1.92-1.88 2.52-4.52 2.52-6.76 0-.64-.04-1.24-.12-1.76h-9.76z" fill="#4285F4" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">Google Calendar</p>
                                            <p className="text-[10px] text-slate-500">Enable Google Meet for bookings</p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleConnectGoogle}
                                        disabled={isGoogleLinked || linkingGoogle}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${isGoogleLinked
                                            ? 'bg-green-50 text-green-600 cursor-default'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md active:scale-95'
                                            }`}
                                    >
                                        {linkingGoogle ? t.loading : (isGoogleLinked ? 'Connected' : 'Connect')}
                                    </button>
                                </div>
                            </div>

                            {/* Dev Only: Promote to Admin */}
                            <div className="mt-4 pt-4 border-t border-slate-100 mb-4">
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (window.confirm("Make this user a Super Admin?")) {
                                            try {
                                                await setDoc(doc(db, 'artifacts', appId, 'users', user.uid), { role: 'super_admin' }, { merge: true });
                                                alert("Success! Refresh the page.");
                                            } catch (e) { alert("Error: " + e.message); }
                                        }
                                    }}
                                    className="text-xs text-slate-400 underline hover:text-slate-600 w-full text-center"
                                >
                                    (Dev) Promote to Super Admin
                                </button>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={onClose}
                                    className="flex-1"
                                >
                                    {t.cancel}
                                </Button>
                                <Button
                                    type="submit"
                                    isLoading={saving}
                                    className="flex-1"
                                >
                                    {success ? (
                                        <span className="flex items-center gap-2">
                                            <Check size={18} /> {t.saved || 'Saved'}
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Save size={18} /> {t.save || 'Save Changes'}
                                        </span>
                                    )}
                                </Button>
                            </div>

                        </form>
                    )}
                </div>

            </div>
        </div>
    );
}
