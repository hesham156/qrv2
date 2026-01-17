import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Building2, ArrowRight, ArrowLeft, Check, Sparkles,
    Phone, Briefcase, Palette, Wand2, Star, Rocket
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';

const variants = {
    enter: (direction) => ({
        x: direction > 0 ? 50 : -50,
        opacity: 0,
        scale: 0.95
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
        scale: 1
    },
    exit: (direction) => ({
        zIndex: 0,
        x: direction < 0 ? 50 : -50,
        opacity: 0,
        scale: 0.95
    })
};

const StepWrapper = ({ children, title, subtitle, icon: Icon, color = "blue" }) => (
    <motion.div
        custom={1}
        initial="enter"
        animate="center"
        exit="exit"
        variants={variants}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg mx-auto"
    >
        <div className="text-center mb-8">
            <div className={`w-16 h-16 bg-${color}-50 text-${color}-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm`}>
                <Icon size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">{title}</h2>
            <p className="text-slate-500 font-medium">{subtitle}</p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
            {children}
        </div>
    </motion.div>
);

export default function OnboardingWizard({ user, t, onComplete, onSkip }) {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        profileType: 'employee',
        name_ar: '',
        name_en: '',
        jobTitle_ar: '',
        jobTitle_en: '',
        phone: '',
        whatsapp: '',
        email: user?.email || '',
        themeColor: '#2563eb',
        template: 'modern_pro',
        stats: { views: 0, clicks: {}, countries: {}, heatmap: {} }
    });

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const handleFinish = async () => {
        setLoading(true);
        try {
            const collectionRef = collection(db, 'artifacts', appId, 'users', user.uid, 'employees');

            // Sync legacy name field
            const finalData = {
                ...formData,
                name: formData.name_ar || formData.name_en,
                jobTitle: formData.jobTitle_ar || formData.jobTitle_en,
                createdAt: serverTimestamp()
            };

            await addDoc(collectionRef, finalData);
            onComplete();
        } catch (error) {
            console.error("Error creating card:", error);
            alert("Failed to create your card. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const nameText = formData.name_ar || formData.name_en || (t.friend || "Friend");

    return (
        <div className="fixed inset-0 bg-slate-50 z-[100] flex items-center justify-center p-6 overflow-y-auto">
            {/* Background Ornaments */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                <div className="absolute -top-20 -left-20 w-80 h-80 bg-blue-200 rounded-full blur-3xl" />
                <div className="absolute top-1/2 -right-20 w-80 h-80 bg-purple-200 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-4xl relative">
                {/* Progress bar */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 flex gap-1.5 justify-center">
                    {[0, 1, 2, 3, 4].map((s) => (
                        <div
                            key={s}
                            className={`h-1.5 rounded-full transition-all duration-500 ${s <= step ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200'}`}
                        />
                    ))}
                </div>

                <AnimatePresence mode="wait" custom={step}>
                    {step === 0 && (
                        <StepWrapper
                            key="step0"
                            title={t.welcomeWizard || "Welcome to DigiCard!"}
                            subtitle={t.wizardStart || "Let's create your first impressive digital business card."}
                            icon={Sparkles}
                            color="indigo"
                        >
                            <p className="text-center text-sm text-slate-500 mb-6">{t.whoAreYou || "How should your profile look?"}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => { setFormData({ ...formData, profileType: 'employee' }); nextStep(); }}
                                    className={`p-6 rounded-2xl border-2 transition-all text-center flex flex-col items-center gap-3 ${formData.profileType === 'employee' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'}`}
                                >
                                    <div className="p-3 bg-white rounded-xl shadow-sm"><User className="text-blue-600" /></div>
                                    <span className="font-bold text-slate-800">{t.profileTypeEmp || "Personal / Employee"}</span>
                                </button>
                                <button
                                    onClick={() => { setFormData({ ...formData, profileType: 'company' }); nextStep(); }}
                                    className={`p-6 rounded-2xl border-2 transition-all text-center flex flex-col items-center gap-3 ${formData.profileType === 'company' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'}`}
                                >
                                    <div className="p-3 bg-white rounded-xl shadow-sm"><Building2 className="text-blue-600" /></div>
                                    <span className="font-bold text-slate-800">{t.profileTypeComp || "Business / Company"}</span>
                                </button>
                            </div>
                            <div className="mt-8 text-center">
                                <button onClick={onSkip} className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
                                    {t.skipOnboarding || "I'll do this later"}
                                </button>
                            </div>
                        </StepWrapper>
                    )}

                    {step === 1 && (
                        <StepWrapper
                            key="step1"
                            title={formData.profileType === 'company' ? (t.compName || "Company Name") : (t.fullName || "Your Full Name")}
                            subtitle={t.nameDesc || "This will be the main title on your card."}
                            icon={User}
                            color="blue"
                        >
                            <div className="space-y-4">
                                <input
                                    autoFocus
                                    type="text"
                                    value={formData.name_ar}
                                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                                    placeholder={formData.profileType === 'company' ? "اسم الشركة (عربي)" : "الاسم بالكامل (عربي)"}
                                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none font-bold text-lg text-center"
                                    dir="rtl"
                                />
                                <input
                                    type="text"
                                    value={formData.name_en}
                                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                                    placeholder={formData.profileType === 'company' ? "Company Name (EN)" : "Full Name (EN)"}
                                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none font-bold text-lg text-center"
                                    dir="ltr"
                                />
                                <div className="flex gap-3 pt-4">
                                    <button onClick={prevStep} className="p-4 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"><ArrowLeft size={20} /></button>
                                    <button
                                        disabled={!formData.name_ar && !formData.name_en}
                                        onClick={nextStep}
                                        className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2"
                                    >
                                        {t.continue || "Continue"} <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>
                        </StepWrapper>
                    )}

                    {step === 2 && (
                        <StepWrapper
                            key="step2"
                            title={`${t.welcomeWizardPre || "Welcome,"} ${nameText}! ✨`}
                            subtitle={formData.profileType === 'company' ? (t.sloganWizard || "What's your business slogan?") : (t.jobWizard || "What's your professional role?")}
                            icon={Briefcase}
                            color="emerald"
                        >
                            <div className="space-y-4">
                                <input
                                    autoFocus
                                    type="text"
                                    value={formData.jobTitle_ar}
                                    onChange={(e) => setFormData({ ...formData, jobTitle_ar: e.target.value })}
                                    placeholder={formData.profileType === 'company' ? "شعار الشركة" : "المسمى الوظيفي (مثال: مدير تسويق)"}
                                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none font-bold text-lg text-center"
                                    dir="rtl"
                                />
                                <div className="flex gap-3 pt-4">
                                    <button onClick={prevStep} className="p-4 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"><ArrowLeft size={20} /></button>
                                    <button
                                        onClick={nextStep}
                                        className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        {t.continue || "Continue"} <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>
                        </StepWrapper>
                    )}

                    {step === 3 && (
                        <StepWrapper
                            key="step3"
                            title={t.contactWizard || "How should people reach you?"}
                            subtitle={t.contactWizardDesc || "Don't worry, you can add more links later."}
                            icon={Phone}
                            color="orange"
                        >
                            <div className="space-y-4">
                                <div className="relative">
                                    <Phone className="absolute top-4 left-4 text-slate-400" size={20} />
                                    <input
                                        autoFocus
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value, whatsapp: formData.whatsapp || e.target.value })}
                                        placeholder={t.phone || "Phone Number"}
                                        className="w-full pl-12 pr-5 py-4 rounded-2xl border border-slate-200 focus:border-blue-600 outline-none font-bold"
                                        dir="ltr"
                                    />
                                </div>
                                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
                                    <span className="text-xs font-bold text-emerald-700">{t.useForWA || "Use same for WhatsApp?"}</span>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, whatsapp: formData.whatsapp === formData.phone ? '' : formData.phone })}
                                        className={`w-10 h-6 rounded-full transition-all relative ${formData.whatsapp === formData.phone ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.whatsapp === formData.phone ? 'left-5' : 'left-1'}`} />
                                    </button>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button onClick={prevStep} className="p-4 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"><ArrowLeft size={20} /></button>
                                    <button
                                        disabled={!formData.phone}
                                        onClick={nextStep}
                                        className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        {t.continue || "Continue"} <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>
                        </StepWrapper>
                    )}

                    {step === 4 && (
                        <StepWrapper
                            key="step4"
                            title={t.themeWizard || "Choose your identity color"}
                            subtitle={t.themeWizardDesc || "Pick a color that reflects your professional style."}
                            icon={Palette}
                            color="purple"
                        >
                            <div className="space-y-6">
                                <div className="flex justify-center gap-4 flex-wrap">
                                    {['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c', '#000000', '#4f46e5'].map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setFormData({ ...formData, themeColor: c })}
                                            className={`w-12 h-12 rounded-full border-4 transition-all ${formData.themeColor === c ? 'border-slate-800 scale-110' : 'border-transparent hover:scale-105'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>

                                <div className="py-6 border-t border-slate-100 text-center">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full font-bold text-sm mb-4">
                                        <Star size={16} className="fill-blue-600" /> {t.proReady || "Modern Pro Template Selected"}
                                    </div>
                                    <p className="text-xs text-slate-400">{t.changeLater || "You can change your template and colors anytime in the dashboard."}</p>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button onClick={prevStep} className="p-4 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"><ArrowLeft size={20} /></button>
                                    <button
                                        disabled={loading}
                                        onClick={handleFinish}
                                        className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 overflow-hidden relative"
                                    >
                                        {loading ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                {t.creatingCard || "Creating..."}
                                            </div>
                                        ) : (
                                            <>
                                                <Rocket size={18} /> {t.launchCard || "Launch My Card!"}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </StepWrapper>
                    )}
                </AnimatePresence>

                {/* Branding Footer */}
                <div className="mt-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-300 font-bold tracking-tighter text-lg grayscale opacity-50">
                        <Wand2 size={20} />
                        <span>DigiCard</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
