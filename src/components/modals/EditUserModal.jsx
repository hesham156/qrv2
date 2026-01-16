import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import { X, Save, Calendar } from 'lucide-react';

export default function EditUserModal({ user, onClose, onUpdate, t }) {
    const [plan, setPlan] = useState(user.plan || 'free');
    const [expiry, setExpiry] = useState(
        user.planExpiresAt ? new Date(user.planExpiresAt.toDate()).toISOString().split('T')[0] : ''
    );
    const [loading, setLoading] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const userRef = doc(db, 'artifacts', appId, 'users', user.id);
            const updates = {
                plan,
                planExpiresAt: expiry ? new Date(expiry) : null
            };
            await updateDoc(userRef, updates);
            onUpdate({ ...user, ...updates }); // Optimistic update
            onClose();
        } catch (error) {
            console.error("Error updating user:", error);
            alert(t.saveError || "Error saving");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-lg text-slate-800">{t.editUser}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full"><X size={20} /></button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">{t.currentPlan}</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['free', 'pro', 'enterprise'].map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPlan(p)}
                                    className={`py-2 px-2 text-xs font-bold rounded-lg border-2 capitalize transition-all ${plan === p
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                        : 'border-slate-200 text-slate-500 hover:border-indigo-200'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <Calendar size={16} className="text-slate-400" />
                            {t.planExpiry || 'Plan Expiry'}
                        </label>
                        <input
                            type="date"
                            value={expiry}
                            onChange={(e) => setExpiry(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                        />
                        <p className="text-xs text-slate-400 mt-1">{t.forever || 'Leave empty for lifetime'}</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? t.saving : (
                            <><Save size={18} /> {t.saveChanges || 'Save'}</>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
