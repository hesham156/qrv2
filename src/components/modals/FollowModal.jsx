import { useState } from "react";
import { collection, addDoc, serverTimestamp, doc, setDoc, increment } from 'firebase/firestore';
import { appId, db } from "../../config/firebase";
import { Bell, X, Mail, CheckCircle } from "lucide-react";

export default function FollowModal({ adminId, employeeId, themeColor, onClose, onSuccess, t }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Add to followers collection
            await addDoc(collection(db, 'artifacts', appId, 'users', adminId, 'employees', employeeId, 'followers'), {
                name,
                email,
                createdAt: serverTimestamp()
            });

            // 2. Increment Stats
            const docRef = doc(db, 'artifacts', appId, 'users', adminId, 'employees', employeeId);
            await setDoc(docRef, { stats: { followers: increment(1) } }, { merge: true });

            setSubmitted(true);

            // 3. Trigger Success in ProfileView (to update UI/Local Storage)
            if (onSuccess) onSuccess();

            // Auto Close
            setTimeout(onClose, 2500);
        } catch (error) {
            console.error("Follow error:", error);
            alert("Error subscribing. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative overflow-hidden">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>

                {submitted ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{t.subscribed || "Subscribed!"}</h3>
                        <p className="text-slate-500">{t.subscribedMsg || "You will now receive updates from this profile."}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Bell size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">{t.stayUpdated || "Stay Updated"}</h3>
                            <p className="text-sm text-slate-500 mt-1">{t.subscribeDesc || "Subscribe to get notified about new projects and products."}</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">{t.name || "Name"} <span className="text-slate-400 font-normal">({t.optional || "Optional"})</span></label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                                placeholder={t.namePlaceholder || "Your Name"}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">{t.email || "Email Address"}</label>
                            <div className="relative">
                                <Mail size={16} className="absolute top-3.5 left-3 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                                    placeholder="name@example.com"
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full text-white font-bold py-3.5 rounded-xl text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                            style={{ backgroundColor: themeColor || '#4f46e5' }}
                        >
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Bell size={18} />
                                    {t.subscribeBtn || "Subscribe"}
                                </>
                            )}
                        </button>

                        <p className="text-[10px] text-center text-slate-400 mt-2">
                            {t.spamPromise || "We don't spam. Unsubscribe anytime."}
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}
