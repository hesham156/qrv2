import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Check, Calendar, Clock, AlertCircle, CheckCircle2,
    ChevronRight, Save, Trash2, Plus,
    LayoutList, MoreVertical
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';

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

    // Stages Structure (Default if empty)
    const [stages, setStages] = useState(employee?.projectManagement?.stages || [
        { id: 'data', label: t.dataCollection || 'Data Collection', steps: [{ id: 1, label: t.receiveLogo || 'Receive Logo', checked: false }, { id: 2, label: t.getColors || 'Get Brand Colors', checked: false }] },
        { id: 'design', label: t.designBuild || 'Design & Build', steps: [{ id: 3, label: t.createLayout || 'Create Layout', checked: false }, { id: 4, label: t.addProducts || 'Add Products', checked: false }] },
        { id: 'review', label: t.finalReview || 'Final Review', steps: [{ id: 5, label: t.clientApproval || 'Client Approval', checked: false }] }
    ]);

    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            const updateData = {
                projectManagement: {
                    status,
                    estimatedHours: Number(estimatedHours),
                    dueDate: dueDate ? new Date(dueDate) : null,
                    notes,
                    stages
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

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Top Row: Status & Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">{t.leadStatus || 'Status'}</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-500"
                            >
                                {STATUS_OPTIONS.map(opt => (
                                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">{t.dueDate || 'Due Date'}</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-brand-500"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">{t.estHours || 'Est. Hours'}</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={estimatedHours}
                                    onChange={(e) => setEstimatedHours(e.target.value)}
                                    className="w-full p-2.5 ltr:pl-9 rtl:pr-9 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-brand-500"
                                />
                                <Clock size={16} className="absolute ltr:left-3 rtl:right-3 top-3 text-slate-400" />
                            </div>
                        </div>
                    </div>

                    {/* Checklist / Stages */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <CheckCircle2 size={18} className="text-emerald-500" />
                                {t.projectChecklist || 'Project Checklist'}
                            </h3>
                        </div>

                        <div className="space-y-6">
                            {stages.map((stage, stageIdx) => (
                                <div key={stage.id} className="bg-slate-50/50 border border-slate-100 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-bold text-sm text-slate-700 uppercase tracking-wide">{stage.label}</h4>
                                        <button onClick={() => addStep(stageIdx)} className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                                            <Plus size={12} /> {t.addStep || 'Add Step'}
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {stage.steps.map((step, stepIdx) => (
                                            <div key={step.id} className="flex items-center group">
                                                <button
                                                    onClick={() => toggleStep(stageIdx, stepIdx)}
                                                    className={`w-5 h-5 rounded border flex items-center justify-center ltr:mr-3 rtl:ml-3 transition-all ${step.checked
                                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                                        : 'bg-white border-slate-300 hover:border-emerald-400'
                                                        }`}
                                                >
                                                    {step.checked && <Check size={12} strokeWidth={3} />}
                                                </button>
                                                <span className={`text-sm flex-1 ${step.checked ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-700'}`}>
                                                    {step.label}
                                                </span>
                                                <button onClick={() => deleteStep(stageIdx, stepIdx)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        {stage.steps.length === 0 && (
                                            <div className="text-xs text-slate-400 italic ltr:pl-8 rtl:pr-8">No steps yet.</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{t.internalNotes || 'Internal Notes'}</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={t.notesPlaceholder || "Add notes about client requirements, specific needs, etc..."}
                            className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                        />
                    </div>

                </div>

                {/* Footer */}
                <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors"
                    >
                        {t.cancel || 'Cancel'}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg flex items-center gap-2"
                    >
                        {loading ? t.saving || 'Saving...' : (
                            <>
                                <Save size={16} />
                                {t.save || 'Save Changes'}
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
