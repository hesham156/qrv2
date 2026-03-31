import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { appId, db } from "../../config/firebase";
import { FileText, Plus, Trash2, X, GraduationCap, Briefcase, Code, Loader2, Download } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import ATSCvTemplate from '../cv/ATSCvTemplate';

export default function CVManagerModal({ userId, employee, onClose, t, isEmbedded }) {
    const [activeTab, setActiveTab] = useState('experience');
    const [experiences, setExperiences] = useState(employee?.experiences || []);
    const [education, setEducation] = useState(employee?.education || []);
    const [skills, setSkills] = useState(employee?.skills || []);
    const [showCvOnProfile, setShowCvOnProfile] = useState(employee?.showCvOnProfile || false);
    const [isSaving, setIsSaving] = useState(false);
    const toast = useToast();

    // TEMPORARY STATES FOR NEW ITEMS
    const [newExp, setNewExp] = useState({ title: '', company: '', startDate: '', endDate: '', description: '' });
    const [newEdu, setNewEdu] = useState({ degree: '', institution: '', year: '', description: '' });
    const [newSkill, setNewSkill] = useState('');

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const empRef = doc(db, 'artifacts', appId, 'users', userId, 'employees', employee.id);
            await updateDoc(empRef, {
                experiences,
                education,
                skills,
                showCvOnProfile,
            });
            toast.success(t?.saved || "CV Data Saved Successfully!");
        } catch (error) {
            console.error(error);
            toast.error(t?.saveError || "Failed to save CV data.");
        } finally {
            setIsSaving(false);
        }
    };

    const generateId = () => Math.random().toString(36).substr(2, 9);

    // --- EXPERIENCE ---
    const addExperience = () => {
        if (!newExp.title || !newExp.company) return toast.error("Title and Company are required.");
        setExperiences([{ ...newExp, id: generateId() }, ...experiences]);
        setNewExp({ title: '', company: '', startDate: '', endDate: '', description: '' });
    };
    const removeExperience = (id) => setExperiences(experiences.filter(exp => exp.id !== id));

    // --- EDUCATION ---
    const addEducation = () => {
        if (!newEdu.degree || !newEdu.institution) return toast.error("Degree and Institution are required.");
        setEducation([{ ...newEdu, id: generateId() }, ...education]);
        setNewEdu({ degree: '', institution: '', year: '', description: '' });
    };
    const removeEducation = (id) => setEducation(education.filter(edu => edu.id !== id));

    // --- SKILLS ---
    const addSkill = () => {
        if (!newSkill.trim()) return;
        if (skills.includes(newSkill.trim())) return toast.error("Skill already exists.");
        setSkills([...skills, newSkill.trim()]);
        setNewSkill('');
    };
    const removeSkill = (skillToRemove) => setSkills(skills.filter(s => s !== skillToRemove));

    const handleGenerateCV = () => {
        window.print();
    };

    const renderContent = () => (
        <div className="flex-1 overflow-y-auto w-full flex flex-col">
            {/* TABS */}
            <div className="flex border-b border-slate-200 bg-white shrink-0 sticky top-0 z-10">
                {[
                    { id: 'experience', label: 'Experience', icon: Briefcase },
                    { id: 'education', label: 'Education', icon: GraduationCap },
                    { id: 'skills', label: 'Skills', icon: Code }
                ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-col items-center flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${isActive ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Icon size={18} className="mb-1" />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            <div className="p-5 space-y-6">
                {/* EXPERIENCE TAB */}
                {activeTab === 'experience' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                            <h3 className="font-bold text-slate-700 text-sm">Add Experience</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <input value={newExp.title} onChange={e => setNewExp({ ...newExp, title: e.target.value })} placeholder="Job Title" className="col-span-1 px-3 py-2 border rounded-lg text-sm" />
                                <input value={newExp.company} onChange={e => setNewExp({ ...newExp, company: e.target.value })} placeholder="Company Name" className="col-span-1 px-3 py-2 border rounded-lg text-sm" />
                                <input value={newExp.startDate} onChange={e => setNewExp({ ...newExp, startDate: e.target.value })} placeholder="Start Date (e.g. 2020)" className="col-span-1 px-3 py-2 border rounded-lg text-sm" />
                                <input value={newExp.endDate} onChange={e => setNewExp({ ...newExp, endDate: e.target.value })} placeholder="End Date (e.g. Present)" className="col-span-1 px-3 py-2 border rounded-lg text-sm" />
                                <textarea value={newExp.description} onChange={e => setNewExp({ ...newExp, description: e.target.value })} placeholder="Description / Achievements (dash separated or new lines)" className="col-span-2 px-3 py-2 border rounded-lg text-sm" rows="3"></textarea>
                            </div>
                            <button onClick={addExperience} className="w-full bg-slate-100 text-slate-700 py-2 rounded-lg font-bold text-sm hover:bg-slate-200 flex justify-center items-center gap-2">
                                <Plus size={16} /> Add Experience
                            </button>
                        </div>
                        <div className="space-y-3">
                            {experiences.map(exp => (
                                <div key={exp.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between group">
                                    <div>
                                        <div className="font-bold text-slate-800">{exp.title} <span className="text-slate-500 font-normal">at {exp.company}</span></div>
                                        <div className="text-xs text-slate-500 mb-2">{exp.startDate} - {exp.endDate}</div>
                                        {exp.description && <p className="text-sm text-slate-600 line-clamp-2">{exp.description}</p>}
                                    </div>
                                    <button onClick={() => removeExperience(exp.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg self-start transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* EDUCATION TAB */}
                {activeTab === 'education' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                            <h3 className="font-bold text-slate-700 text-sm">Add Education</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <input value={newEdu.degree} onChange={e => setNewEdu({ ...newEdu, degree: e.target.value })} placeholder="Degree (e.g. BSc Computer Science)" className="col-span-1 px-3 py-2 border rounded-lg text-sm" />
                                <input value={newEdu.institution} onChange={e => setNewEdu({ ...newEdu, institution: e.target.value })} placeholder="Institution" className="col-span-1 px-3 py-2 border rounded-lg text-sm" />
                                <input value={newEdu.year} onChange={e => setNewEdu({ ...newEdu, year: e.target.value })} placeholder="Year (e.g. 2018 - 2022)" className="col-span-2 px-3 py-2 border rounded-lg text-sm" />
                            </div>
                            <button onClick={addEducation} className="w-full bg-slate-100 text-slate-700 py-2 rounded-lg font-bold text-sm hover:bg-slate-200 flex justify-center items-center gap-2">
                                <Plus size={16} /> Add Education
                            </button>
                        </div>
                        <div className="space-y-3">
                            {education.map(edu => (
                                <div key={edu.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between group">
                                    <div>
                                        <div className="font-bold text-slate-800">{edu.degree}</div>
                                        <div className="text-sm text-slate-600">{edu.institution}</div>
                                        <div className="text-xs text-slate-500 mt-1">{edu.year}</div>
                                    </div>
                                    <button onClick={() => removeEducation(edu.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg self-start transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SKILLS TAB */}
                {activeTab === 'skills' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 flex gap-2">
                            <input 
                                value={newSkill} 
                                onChange={e => setNewSkill(e.target.value)} 
                                onKeyDown={e => e.key === 'Enter' && addSkill()}
                                placeholder="Add a skill (e.g. JavaScript)" 
                                className="flex-1 px-3 py-2 border rounded-lg text-sm" 
                            />
                            <button onClick={addSkill} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700">Add</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {skills.map((skill, index) => (
                                <div key={index} className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-2">
                                    {skill}
                                    <button onClick={() => removeSkill(skill)} className="hover:text-red-500 transition-colors bg-indigo-100/50 rounded-full p-0.5"><X size={12} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const ModalWrapper = isEmbedded ? 'div' : 'div';
    const wrapperClass = isEmbedded 
        ? "bg-white rounded-2xl w-full border border-slate-200 shadow-sm overflow-hidden h-[90vh] flex flex-col"
        : "fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm";

    const innerClass = isEmbedded
        ? "flex flex-col h-full w-full"
        : "bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col";

    return (
        <>
            <ModalWrapper className={wrapperClass}>
                <div className={innerClass}>
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <FileText size={20} className="text-indigo-600" />
                            CV Builder / Resume
                        </h2>
                        {!isEmbedded && <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X size={20} /></button>}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden flex bg-slate-50 relative">
                        {renderContent()}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-slate-200 bg-white shrink-0 flex flex-col gap-3">
                        <label className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                            <div>
                                <div className="font-bold text-slate-800 text-sm">Show CV on Digital Card</div>
                                <div className="text-xs text-slate-500">Allow profile visitors to view and download your CV</div>
                            </div>
                            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showCvOnProfile ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={showCvOnProfile}
                                    onChange={(e) => setShowCvOnProfile(e.target.checked)}
                                />
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showCvOnProfile ? 'translate-x-6' : 'translate-x-1'}`} />
                            </div>
                        </label>
                        <div className="flex gap-3">
                            <button onClick={handleSave} disabled={isSaving} className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 flex justify-center items-center gap-2">
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : "Save Data"}
                            </button>
                            <button onClick={handleGenerateCV} className="flex-1 bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-600 flex justify-center items-center gap-2">
                                <Download size={18} /> Print ATS CV
                            </button>
                        </div>
                    </div>
                </div>
            </ModalWrapper>

            {/* Hidden ATS Template for Printing (Portaled to body) */}
            {createPortal(
                <div id="cv-print-container" className="m-0 p-0 bg-white">
                    <ATSCvTemplate data={{ ...employee, experiences, education, skills }} />
                </div>,
                document.body
            )}
        </>
    );
}
