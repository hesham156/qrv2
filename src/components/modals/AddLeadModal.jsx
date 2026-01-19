import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, FileText, Briefcase, Loader2, Save } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';

export default function AddLeadModal({ isOpen, onClose, employees, user, t, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        interest: '',
        empId: employees.length > 0 ? employees[0].id : ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Find selected employee to get correct IDs
            const selectedEmp = employees.find(e => e.id === formData.empId);
            if (!selectedEmp) throw new Error("No card selected");

            const leadData = {
                name: formData.name,
                phone: formData.phone,
                interest: formData.interest,
                empId: selectedEmp.id,
                empName: selectedEmp.name,
                userId: user.uid, // Owner of the card
                createdAt: serverTimestamp(),
                status: 'new',
                source: 'manual'
            };

            await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'employees', selectedEmp.id, 'leads'), leadData);

            if (onSuccess) onSuccess();
            onClose();
            // Reset form
            setFormData({
                name: '',
                phone: '',
                interest: '',
                empId: employees.length > 0 ? employees[0].id : ''
            });
        } catch (error) {
            console.error("Error adding lead:", error);
            alert(t.addLeadError || "Failed to add client");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                    <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <User size={20} className="text-emerald-500" />
                        {t.addClient || "Add New Client"}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Card Selection (if multiple) */}
                    {employees.length > 1 && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                <Briefcase size={12} /> {t.selectCard || "Select Card"}
                            </label>
                            <select
                                value={formData.empId}
                                onChange={(e) => setFormData({ ...formData, empId: e.target.value })}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                required
                            >
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                            <User size={12} /> {t.clientName || "Client Name"}
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder={t.namePlaceholder || "e.g. Ahmed Ali"}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                            <Phone size={12} /> {t.phoneNumber || "Phone Number"}
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder={t.phonePlaceholder || "+966..."}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                            <FileText size={12} /> {t.notes || "Interest / Notes"}
                        </label>
                        <textarea
                            value={formData.interest}
                            onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                            placeholder={t.notesPlaceholder || "Interested in..."}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px]"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-70"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            {t.saveClient || "Save Client"}
                        </button>
                    </div>

                </form>
            </motion.div>
        </div>
    );
}
