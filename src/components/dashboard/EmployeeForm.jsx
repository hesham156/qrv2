
import { useEffect, useState } from "react";
import { collection, addDoc, doc, getDoc, deleteDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { uploadToWordPress } from "../../services/wordpressStorage";
import { extractTextFromPDF, parseCVWithAI } from "../../services/cvParser";
import { optimizeTextWithAI } from "../../services/aiService";
import { appId, db } from "../../config/firebase";
import {
  Phone, Mail, Share2, Image as ImageIcon, Briefcase, Activity, Upload, Loader2, CreditCard, Type, Copy, Wand, Search,
  Building2, Crown, LayoutTemplate, Link, Palette, User, X, Globe, ShieldCheck, Edit, CheckCircle, XCircle
} from "lucide-react";
import { translations } from "../../utils/translations";

const Wrapper = ({ children, isEmbedded }) => {
  if (isEmbedded) {
    return (
      <div className="bg-white rounded-2xl w-full border border-slate-200 shadow-sm h-full flex flex-col animate-in fade-in duration-500">
        {children}
      </div>
    )
  }
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {children}
      </div>
    </div>
  )
};

export default function EmployeeForm({ onClose, initialData, userId, user, t, isEmbedded, initialTab }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'general');
  const [formData, setFormData] = useState({
    profileType: 'employee',
    name: '', name_ar: '', name_en: '',
    phone: '', email: '',
    jobTitle: '', jobTitle_ar: '', jobTitle_en: '',
    bio_ar: '', bio_en: '',
    company: '', website: '', whatsapp: '',
    photoUrl: '', cvUrl: '', slug: '',
    themeColor: '#2563eb', qrColor: '#000000', qrBgColor: '#ffffff',
    template: 'classic',
    bgVideoUrl: '',
    profileVideoUrl: '',
    facebook: '', twitter: '', instagram: '', linkedin: '', youtube: '',
    bookingUrl: '',
    stats: { views: 0, clicks: {}, countries: {}, heatmap: {} },
    pixels: { facebook: '', tiktok: '', snapchat: '', google: '' },
    customDomain: '',
    googleFont: '',
    customFont: '',
    seoTitle: '',
    seoDescription: '',
    seoImage: '',
    bookingSettings: {
      days: [0, 1, 2, 3, 4], // Sun-Thu default
      start: '09:00',
      end: '17:00',
      slotDuration: 30
    }
  });

  const GOOGLE_FONTS = [
    { name: 'Default', value: '' },
    { name: 'Inter', value: 'Inter' },
    { name: 'Roboto', value: 'Roboto' },
    { name: 'Cairo', value: 'Cairo' },
    { name: 'Almarai', value: 'Almarai' },
    { name: 'Tajawal', value: 'Tajawal' },
    { name: 'Outfit', value: 'Outfit' },
    { name: 'Montserrat', value: 'Montserrat' },
    { name: 'Open Sans', value: 'Open Sans' },
    { name: 'Lato', value: 'Lato' },
  ];

  const [loading, setLoading] = useState(false);
  const [slugError, setSlugError] = useState('');
  const [domainError, setDomainError] = useState('');
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Local UI state for input toggles
  const [nameLang, setNameLang] = useState('ar');
  const [jobLang, setJobLang] = useState('ar');

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        // Initialize multilingual fields if they exist, otherwise fallback to legacy field for AR
        name_ar: initialData.name_ar || initialData.name || '',
        name_en: initialData.name_en || '',
        jobTitle_ar: initialData.jobTitle_ar || initialData.jobTitle || '',
        jobTitle_en: initialData.jobTitle_en || '',
        bio_ar: initialData.bio_ar || initialData.bio || '',
        bio_en: initialData.bio_en || '',
        customDomain: initialData.customDomain || '',
        googleFont: initialData.googleFont || '',
        customFont: initialData.customFont || '',
        seoTitle: initialData.seoTitle || '',
        seoDescription: initialData.seoDescription || '',
        seoImage: initialData.seoImage || '',
        bookingUrl: initialData.bookingUrl || '',
        bookingSettings: initialData.bookingSettings || {
          days: [0, 1, 2, 3, 4],
          start: '09:00',
          end: '17:00',
          slotDuration: 30
        }
      }));
    }
  }, [initialData]);

  // --- Magic Upload Handler ---
  const handleMagicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      // 1. Upload CV file to WordPress first (so we have the URL)
      const cvUrl = await uploadToWordPress(file);

      // 2. Parse PDF Text with AI
      const text = await extractTextFromPDF(file);
      const parsed = await parseCVWithAI(text);

      // 3. Auto-fill Form
      setFormData(prev => ({
        ...prev,
        cvUrl: cvUrl,
        name: parsed.name || prev.name,
        name_en: parsed.name || prev.name_en,
        email: parsed.email || prev.email,
        phone: parsed.phone || prev.phone,
        jobTitle: parsed.jobTitle || prev.jobTitle,
        jobTitle_en: parsed.jobTitle || prev.jobTitle_en,
        jobTitle_ar: parsed.jobTitle_ar || prev.jobTitle_ar,
        bio_en: parsed.bio_en || prev.bio_en,
        bio_ar: parsed.bio_ar || prev.bio_ar,
        website: parsed.website || prev.website,
        skills: parsed.skills || prev.skills
      }));

      showToast(t?.magicSuccess || "Magic! Data extracted from CV ✨");
    } catch (err) {
      console.error(err);
      showToast(t?.magicError || "Could not parse CV. Please fill manually.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeText = async (field, lang) => {
    const currentText = field === 'bio'
      ? (lang === 'ar' ? formData.bio_ar : formData.bio_en)
      : (lang === 'ar' ? formData.jobTitle_ar : formData.jobTitle_en);

    if (!currentText) return;

    setLoading(true);
    try {
      const optimized = await optimizeTextWithAI(currentText, field, lang);
      const stateKey = field === 'bio'
        ? (lang === 'ar' ? 'bio_ar' : 'bio_en')
        : (lang === 'ar' ? 'jobTitle_ar' : 'jobTitle_en');

      setFormData(prev => ({ ...prev, [stateKey]: optimized }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const handleFontUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (user?.plan !== 'pro') {
      window.alert(t.proFeature || "Pro Feature Required");
      return;
    }

    setLoading(true);
    try {
      const url = await uploadToWordPress(file);
      setFormData(prev => ({ ...prev, customFont: url, googleFont: '' }));
      showToast(t.fontUploadSuccess || "Font uploaded successfully!");
    } catch (err) {
      console.error(err);
      showToast(t.fontUploadError || "Failed to upload font.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGenericFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const url = await uploadToWordPress(file);
      setFormData(prev => ({ ...prev, [field]: url }));
      showToast(t.uploadSuccess || "File uploaded successfully!");
    } catch (err) {
      console.error(err);
      showToast(t.uploadError || "Failed to upload file.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSlugError('');

    // Sync legacy fields for backward compatibility (Prefer Arabic, fallback to English)
    const finalData = {
      ...formData,
      name: formData.name_ar || formData.name_en || formData.name,
      jobTitle: formData.jobTitle_ar || formData.jobTitle_en || formData.jobTitle
    };

    try {
      const collectionRef = collection(db, 'artifacts', appId, 'users', userId, 'employees');

      let empId = initialData?.id;
      let oldSlug = initialData?.slug;
      let oldDomain = initialData?.customDomain;

      if (finalData.slug) {
        const cleanSlug = finalData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
        if (cleanSlug !== finalData.slug) {
          setSlugError('يجب أن يحتوي الاسم المميز على أحرف إنجليزية وأرقام وشرطة فقط.');
          setActiveTab('general'); // Switch to tab with error
          setLoading(false); return;
        }
        if (cleanSlug !== oldSlug) {
          const slugDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'slugs', cleanSlug);
          const slugDocSnap = await getDoc(slugDocRef);
          if (slugDocSnap.exists()) {
            setSlugError('هذا الاسم المميز مستخدم بالفعل.');
            setActiveTab('general'); // Switch to tab with error
            setLoading(false); return;
          }
        }
      }

      if (empId) {
        await updateDoc(doc(collectionRef, empId), { ...finalData, slug: finalData.slug || '', updatedAt: serverTimestamp() });
      } else {
        const docRef = await addDoc(collectionRef, { ...finalData, createdAt: serverTimestamp() });
        empId = docRef.id;
      }

      if (finalData.slug && finalData.slug !== oldSlug) {
        if (oldSlug) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slugs', oldSlug));
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slugs', finalData.slug), { targetUid: userId, targetEmpId: empId });
      } else if (!finalData.slug && oldSlug) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slugs', oldSlug));
      }

      // --- Custom Domain Saving (Added) ---
      if (finalData.customDomain && finalData.customDomain !== oldDomain) {
        if (oldDomain) {
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'domains', oldDomain.replace(/\./g, '_')));
        }
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'domains', finalData.customDomain.replace(/\./g, '_')), {
          targetUid: userId,
          targetEmpId: empId,
          domain: finalData.customDomain
        });
      } else if (!finalData.customDomain && oldDomain) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'domains', oldDomain.replace(/\./g, '_')));
      }



      if (!isEmbedded) {
        onClose();
      } else {
        showToast(t.saved || "Saved successfully!");
      }
    } catch (error) {
      console.error("Error saving:", error);
      if (error.code === 'permission-denied') {
        showToast(t.permissionError || "Permission denied", "error");
      } else {
        showToast(t.saveError || "Error saving", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const templates = [
    { id: 'classic', name: t.classic },
    { id: 'modern', name: t.modern },
    { id: 'creative', name: t.creative },
    { id: 'elegant', name: t.elegant },
    { id: 'professional', name: t.professional },
    { id: 'minimal', name: t.minimal },
    { id: 'modern_pro', name: t.modernv2 || "Modern Pro (New)" }, // New Template
  ];

  const isCompany = formData.profileType === 'company';

  const tabs = [
    { id: 'general', label: t.tabGeneral || 'General', icon: Briefcase },
    { id: 'contact', label: t.tabContact || 'Contact', icon: Phone },
    { id: 'social', label: t.tabSocial || 'Social', icon: Share2 },
    { id: 'design', label: t.tabDesign || 'Design', icon: Palette },
    { id: 'seo', label: 'SEO Settings', icon: Search },
    { id: 'availability', label: t.bookingAvailability || 'Booking', icon: ShieldCheck },
    { id: 'tracking', label: t.tabTracking || 'Tracking', icon: Activity },
  ].filter(tab => {
    if (isEmbedded) {
      // If we are in 'Edit Data' mode (General), hide SEO and Booking (availability) tabs because they are in the sidebar
      if (initialTab !== 'seo' && tab.id === 'seo') return false;
      if (initialTab !== 'availability' && tab.id === 'availability') return false;

      // If we are IN 'SEO' mode, we usually only want to see SEO.
      // But actually, if we are in SEO mode, we probably don't want ANY tabs, just the content.
      // Or maybe we hide everything EXCEPT seo?
      // Let's rely on the Sidebar for navigation. 
      // If initialTab is 'seo', we are likely in the /seo route.
    }
    return true;
  });



  const getHeaderTitle = () => {
    if (activeTab === 'seo') return t.seoSettings || 'SEO Settings';
    if (activeTab === 'tracking') return t.tabTracking || 'Tracking';
    if (activeTab === 'availability') return t.bookingAvailability || 'Booking';
    return t.editData || 'Edit Data';
  };

  const currentTitle = getHeaderTitle();

  // --- STANDARD MODAL RENDER ---


  return (
    <Wrapper isEmbedded={isEmbedded}>

      {/* Header - Only for Modal */}
      {/* Header - Always Show */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white z-10 shrink-0 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <Edit size={20} className="text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-800">{initialData ? currentTitle : t.createCard}</h2>
        </div>
        {!isEmbedded && (
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Tabs */}
      {!(isEmbedded && (initialTab === 'seo' || activeTab === 'seo' || initialTab === 'availability' || activeTab === 'availability')) && (
        <div className="flex bg-slate-50 border-b border-slate-200 overflow-x-auto hide-scrollbar shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap
                  ${isActive ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'} `}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Form Body - Scrollable */}
      <div className="overflow-y-auto flex-1 p-6 bg-slate-50/30 pb-24">
        <form id="empForm" onSubmit={handleSubmit} className="space-y-6">

          {/* --- GENERAL TAB --- */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

              {/* Magic Upload Button */}
              {!initialData && (
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-1 rounded-xl shadow-lg mb-6">
                  <label className="flex items-center justify-between bg-white/10 hover:bg-white/20 transition-colors p-4 rounded-lg cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                        <Wand size={20} className="group-hover:animate-pulse" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">
                          {t?.magicUpload || "Resume Auto-fill ✨"}
                        </h3>
                        <p className="text-white/80 text-xs">
                          {t?.magicDesc || "Upload a PDF CV to automatically fill this form."}
                        </p>
                      </div>
                    </div>
                    <div className="bg-white text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                      {t?.uploadCV || "Upload PDF"}
                    </div>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={handleMagicUpload}
                    />
                  </label>
                </div>
              )}

              {/* Profile Type */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button type="button" onClick={() => setFormData({ ...formData, profileType: 'employee' })} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${formData.profileType === 'employee' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'} `}><User size={16} /> {t.profileTypeEmp}</button>
                <button type="button" onClick={() => setFormData({ ...formData, profileType: 'company' })} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${formData.profileType === 'company' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'} `}><Building2 size={16} /> {t.profileTypeComp}</button>
              </div>

              {/* Name & Job */}
              <div className="space-y-4">
                {/* Name Field */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-700">{isCompany ? t.compName : t.fullName} <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select
                        value={nameLang}
                        onChange={(e) => setNameLang(e.target.value)}
                        className="bg-slate-100 border-none text-xs font-bold text-slate-600 py-1 pl-2 pr-6 rounded-md focus:ring-0 cursor-pointer hover:bg-slate-200"
                        style={{ appearance: 'none' }}
                      >
                        <option value="ar">{t.ar}</option>
                        <option value="en">{t.en}</option>
                      </select>
                      <Globe size={12} className="absolute right-2 top-1.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <input
                    required={!formData.name_ar && !formData.name_en}
                    type="text"
                    dir={nameLang === 'ar' ? 'rtl' : 'ltr'}
                    value={nameLang === 'ar' ? formData.name_ar : formData.name_en}
                    onChange={e => setFormData({ ...formData, [nameLang === 'ar' ? 'name_ar' : 'name_en']: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                    placeholder={nameLang === 'ar' ? (isCompany ? t.companyNamePlaceholder : t.fullNamePlaceholder) : (isCompany ? translations.en.companyNamePlaceholder : translations.en.fullNamePlaceholder)}
                  />
                </div>

                {/* Job Title Field */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-700">{isCompany ? t.slogan : t.jobTitle}</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOptimizeText('jobTitle', jobLang)}
                        className="bg-indigo-50 text-indigo-600 p-1 rounded-md hover:bg-indigo-100 transition-colors"
                        title="Optimize with AI"
                      >
                        <Wand size={14} />
                      </button>
                      <div className="relative">
                        <select
                          value={jobLang}
                          onChange={(e) => setJobLang(e.target.value)}
                          className="bg-slate-100 border-none text-xs font-bold text-slate-600 py-1 pl-2 pr-6 rounded-md focus:ring-0 cursor-pointer hover:bg-slate-200"
                          style={{ appearance: 'none' }}
                        >
                          <option value="ar">{t.ar}</option>
                          <option value="en">{t.en}</option>
                        </select>
                        <Globe size={12} className="absolute right-2 top-1.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    dir={jobLang === 'ar' ? 'rtl' : 'ltr'}
                    value={jobLang === 'ar' ? formData.jobTitle_ar : formData.jobTitle_en}
                    onChange={e => setFormData({ ...formData, [jobLang === 'ar' ? 'jobTitle_ar' : 'jobTitle_en']: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                    placeholder={jobLang === 'ar' ? (isCompany ? t.sloganPlaceholder : t.jobTitlePlaceholder) : (isCompany ? translations.en.sloganPlaceholder : translations.en.jobTitlePlaceholder)}
                  />
                </div>

                {/* Bio Field (New) */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-700">{t.bio || 'Bio'}</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOptimizeText('bio', jobLang)}
                        className="bg-purple-50 text-purple-600 p-1 rounded-md hover:bg-purple-100 transition-colors"
                        title="Optimize with AI"
                      >
                        <Wand size={14} />
                      </button>
                      {/* We reuse jobLang for Bio as well for simplicity */}
                    </div>
                  </div>
                  <textarea
                    rows="3"
                    dir={jobLang === 'ar' ? 'rtl' : 'ltr'}
                    value={jobLang === 'ar' ? formData.bio_ar : formData.bio_en}
                    onChange={e => setFormData({ ...formData, [jobLang === 'ar' ? 'bio_ar' : 'bio_en']: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none resize-none"
                    placeholder={t.bioPlaceholder || "Tell your story..."}
                  />
                </div>

                {/* Company Field (Legacy/Extra) */}
                {!isCompany && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">{t.company}</label>
                    <input type="text" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none" placeholder={t.company} />
                  </div>
                )}
              </div>

              {/* Slug */}
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <label className="block text-sm font-bold text-indigo-900 mb-1 flex items-center gap-2"><Link size={16} /> {t.slugLabel}</label>
                <p className="text-xs text-indigo-600 mb-2">{t.slugHint}</p>
                <div className="flex items-center bg-white border border-indigo-200 rounded-lg overflow-hidden group focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                  <span className="bg-indigo-100/50 text-indigo-600 text-xs px-3 py-3.5 font-mono border-l border-indigo-100">/ #</span>
                  <input type="text" dir="ltr" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} className="w-full px-3 py-2 text-sm outline-none font-mono text-indigo-700 placeholder-indigo-300" placeholder="your-name" />
                </div>
                {slugError && <p className="text-xs text-red-500 mt-2 font-bold flex items-center gap-1"><X size={12} />{slugError}</p>}
                {slugError && <p className="text-xs text-red-500 mt-2 font-bold flex items-center gap-1"><X size={12} />{slugError}</p>}
              </div>

              {/* Custom Domain (PRO) */}
              <div className={`p - 4 rounded - xl border ${user?.plan !== 'pro' ? 'bg-slate-50 border-slate-200 opacity-70 relative overflow-hidden' : 'bg-purple-50 border-purple-100'} `}>
                {user?.plan !== 'pro' && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100/50 backdrop-blur-[1px]">
                    <div className="bg-white px-4 py-2 rounded-full shadow-lg border border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-800">
                      <Crown size={14} className="text-yellow-500" />
                      {t.proFeature || "Pro Feature"}
                    </div>
                  </div>
                )}
                <label className="block text-sm font-bold text-purple-900 mb-1 flex items-center gap-2"><Globe size={16} /> {t.customDomain}</label>
                <p className="text-xs text-purple-600 mb-2">{t.customDomainHint}</p>
                <input
                  type="text"
                  dir="ltr"
                  disabled={user?.plan !== 'pro'}
                  value={formData.customDomain}
                  onChange={e => {
                    setFormData({ ...formData, customDomain: e.target.value });
                    setDomainError('');
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 outline-none text-purple-800 placeholder-purple-300 focus:ring-2 ring-purple-500/20"
                  placeholder="profile.yourdomain.com"
                />
                {domainError && <p className="text-xs text-red-500 mt-2 font-bold flex items-center gap-1"><X size={12} />{domainError}</p>}
              </div>
            </div>
          )}

          {/* --- CONTACT TAB --- */}
          {activeTab === 'contact' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{t.mobile}</label>
                  <div className="relative">
                    <Phone size={16} className="absolute top-3.5 left-3 text-slate-400" />
                    <input required type="tel" dir="ltr" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none" placeholder="+966..." />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{t.whatsapp}</label>
                  <div className="relative">
                    <Phone size={16} className="absolute top-3.5 left-3 text-green-500" />
                    <input type="tel" dir="ltr" value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none" placeholder="+966..." />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">{t.email}</label>
                <div className="relative">
                  <Mail size={16} className="absolute top-3.5 left-3 text-slate-400" />
                  <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none" placeholder="name@example.com" />
                </div>
              </div>

              <div>
                <div className="relative">
                  <Globe size={16} className="absolute top-3.5 left-3 text-slate-400" />
                  <input type="url" dir="ltr" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none" placeholder="https://" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">{t.bookingUrl || 'Booking Password (Optional)'}</label>
                <div className="relative">
                  <ShieldCheck size={16} className="absolute top-3.5 left-3 text-indigo-500" />
                  <input type="text" dir="ltr" value={formData.bookingUrl} onChange={e => setFormData({ ...formData, bookingUrl: e.target.value })} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none" placeholder="1234..." />
                </div>
              </div>
            </div>
          )}

          {/* --- SOCIAL TAB --- */}
          {activeTab === 'social' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-sm text-slate-500 mb-4 bg-slate-100 p-3 rounded-lg border border-slate-200">
                {t.shareData} (Paste full URLs)
              </p>

              {[
                { key: 'facebook', label: 'Facebook', color: 'text-blue-600' },
                { key: 'twitter', label: 'Twitter / X', color: 'text-black' },
                { key: 'instagram', label: 'Instagram', color: 'text-pink-600' },
                { key: 'linkedin', label: 'LinkedIn', color: 'text-blue-700' },
                { key: 'youtube', label: 'YouTube', color: 'text-red-600' },
              ].map(social => (
                <div key={social.key}>
                  <label className={`block text - xs font - bold mb - 1 ${social.color} `}>{social.label}</label>
                  <input
                    type="url"
                    dir="ltr"
                    value={formData[social.key]}
                    onChange={e => setFormData({ ...formData, [social.key]: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm"
                    placeholder={`https://${social.key.toLowerCase()}.com/...`}
                  />
                </div >
              ))}
            </div >
          )}

          {/* --- DESIGN TAB --- */}
          {activeTab === 'design' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

              {/* Visuals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2"><ImageIcon size={16} /> {isCompany ? t.logoUrl : t.photoUrl}</label>
                  <div className="flex gap-2">
                    <input type="url" dir="ltr" value={formData.photoUrl} onChange={e => setFormData({ ...formData, photoUrl: e.target.value })} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm" placeholder="https://" />
                    <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 rounded-xl flex items-center justify-center transition-colors">
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleGenericFileUpload(e, 'photoUrl')} />
                      <Upload size={18} />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2"><Link size={16} /> {isCompany ? t.profilePdf : t.cvPdf}</label>
                  <div className="flex gap-2">
                    <input type="url" dir="ltr" value={formData.cvUrl} onChange={e => setFormData({ ...formData, cvUrl: e.target.value })} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm" placeholder="https://" />
                    <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 rounded-xl flex items-center justify-center transition-colors">
                      <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => handleGenericFileUpload(e, 'cvUrl')} />
                      <Upload size={18} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Templates */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><LayoutTemplate size={18} /> {t.template}</label>
                <div className="grid grid-cols-3 gap-2">
                  {templates.map(tmp => (
                    <button key={tmp.id} type="button" onClick={() => setFormData({ ...formData, template: tmp.id })} className={`py-3 px-2 text-xs font-bold rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 relative ${formData.template === tmp.id ? 'border-primary-500 bg-white text-primary-700 shadow-md transform scale-105' : 'border-slate-200 bg-slate-100 text-slate-500 hover:bg-white'}`} style={formData.template === tmp.id ? { borderColor: formData.themeColor, color: formData.themeColor } : {}}>
                      {tmp.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-bold text-slate-700 flex items-center gap-2"><Palette size={18} /> {t.cardColor}</label>
                  <input type="color" value={formData.themeColor} onChange={e => setFormData({ ...formData, themeColor: e.target.value })} className="w-8 h-8 rounded-lg cursor-pointer border-none" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c', '#000000', '#4f46e5'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData({ ...formData, themeColor: c })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${formData.themeColor === c ? 'border-slate-600 scale-110' : 'border-transparent hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              {/* Font Control (New) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <Type size={18} /> {t.fontControl || "Font & Typography"}
                </label>

                <div className="space-y-4">
                  {/* Google Font Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{t.chooseFont || "Select Google Font"}</label>
                    <select
                      value={formData.googleFont}
                      onChange={(e) => setFormData({ ...formData, googleFont: e.target.value, customFont: '' })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white"
                    >
                      {GOOGLE_FONTS.map(f => (
                        <option key={f.value} value={f.value}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Font Upload (Pro) */}
                  <div className={`p-3 rounded-lg border ${user?.plan !== 'pro' ? 'bg-slate-100 opacity-60' : 'bg-white border-blue-100'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                        <Upload size={14} /> {t.uploadCustomFont || "Upload Custom Font (.ttf, .otf)"}
                      </label>
                      {user?.plan !== 'pro' && <Crown size={14} className="text-yellow-500" />}
                    </div>

                    <div className="flex items-center gap-3">
                      <label className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 transition-all ${user?.plan === 'pro' ? 'border-blue-200 hover:border-blue-400 bg-blue-50/30 cursor-pointer' : 'border-slate-300'}`}>
                        <span className="text-xs font-bold text-blue-600">
                          {formData.customFont ? 'Font Uploaded ✅' : 'Click to Upload'}
                        </span>
                        {user?.plan === 'pro' && (
                          <input type="file" accept=".ttf,.otf" className="hidden" onChange={handleFontUpload} />
                        )}
                      </label>
                      {formData.customFont && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, customFont: '' })}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">
                      {t.customFontHint || "A custom font will override any selected Google Font."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase flex items-center gap-1"><Upload size={10} /> {t.bgVideo}</label>
                  <div className="flex gap-1">
                    <input type="url" dir="ltr" value={formData.bgVideoUrl} onChange={e => setFormData({ ...formData, bgVideoUrl: e.target.value })} className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none" placeholder="MP4 URL" />
                    <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 rounded-lg flex items-center justify-center transition-colors">
                      <input type="file" className="hidden" accept="video/*" onChange={(e) => handleGenericFileUpload(e, 'bgVideoUrl')} />
                      <Upload size={14} />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase flex items-center gap-1"><Upload size={10} /> {t.profileVideo}</label>
                  <div className="flex gap-1">
                    <input type="url" dir="ltr" value={formData.profileVideoUrl} onChange={e => setFormData({ ...formData, profileVideoUrl: e.target.value })} className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none" placeholder="MP4 URL" />
                    <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 rounded-lg flex items-center justify-center transition-colors">
                      <input type="file" className="hidden" accept="video/*" onChange={(e) => handleGenericFileUpload(e, 'profileVideoUrl')} />
                      <Upload size={14} />
                    </label>
                  </div>
                </div>
              </div>
            </div>

          )}

          {/* --- SEO TAB --- */}
          {activeTab === 'seo' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <h3 className="font-bold text-blue-800 text-sm mb-1 flex items-center gap-2">
                  <Search size={16} /> Search Engine Optimization
                </h3>
                <p className="text-xs text-blue-600">
                  Customize how your card appears on Google and when shared on social media (WhatsApp, LinkedIn, etc).
                </p>
              </div>

              <div className="space-y-4">
                {/* SEO Title */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    dir="auto"
                    value={formData.seoTitle}
                    onChange={e => setFormData({ ...formData, seoTitle: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                    placeholder={formData.name || "e.g. Ahmed Ali - Senior Engineer"}
                  />
                  <p className="text-[10px] text-slate-400 mt-1 text-right">Recommended: 60 chars</p>
                </div>

                {/* SEO Description */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Meta Description
                  </label>
                  <textarea
                    rows="3"
                    dir="auto"
                    value={formData.seoDescription}
                    onChange={e => setFormData({ ...formData, seoDescription: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none resize-none"
                    placeholder={formData.bio_en || "e.g. Professional digital business card for Ahmed Ali..."}
                  />
                  <p className="text-[10px] text-slate-400 mt-1 text-right">Recommended: 160 chars</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                    <ImageIcon size={16} /> Social Share Image
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      dir="ltr"
                      value={formData.seoImage}
                      onChange={e => setFormData({ ...formData, seoImage: e.target.value })}
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm"
                      placeholder={formData.photoUrl || "https://..."}
                    />
                    <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 rounded-xl flex items-center justify-center transition-colors">
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleGenericFileUpload(e, 'seoImage')} />
                      <Upload size={18} />
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Leave empty to use your profile photo automatically.
                  </p>
                </div>

                {/* Preview Box */}
                <div className="mt-6 border border-slate-200 rounded-xl p-4 bg-white">
                  <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Google Search Preview</h4>
                  <div className="space-y-1">
                    <div className="text-blue-800 text-lg font-medium hover:underline cursor-pointer truncate">
                      {formData.seoTitle || formData.name || "Your Name"} - Digital Business Card
                    </div>
                    <div className="text-green-700 text-xs flex items-center gap-1">
                      https://wafarle.com/p/{formData.slug || "your-name"}
                    </div>
                    <div className="text-slate-600 text-sm leading-snug line-clamp-2">
                      {formData.seoDescription || formData.bio_en || formData.jobTitle || "Connect with me digitally. View my portfolio, contact info, and more."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'availability' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Activity size={18} className="text-indigo-600" />
                  {t.workDays || 'Working Days'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const days = formData.bookingSettings?.days?.includes(idx)
                          ? formData.bookingSettings.days.filter(d => d !== idx)
                          : [...(formData.bookingSettings?.days || []), idx];
                        setFormData({ ...formData, bookingSettings: { ...formData.bookingSettings, days } });
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${formData.bookingSettings?.days?.includes(idx) ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'}`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{t.from || 'Start Time'}</label>
                  <input
                    type="time"
                    value={formData.bookingSettings?.start || '09:00'}
                    onChange={e => setFormData({ ...formData, bookingSettings: { ...formData.bookingSettings, start: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{t.to || 'End Time'}</label>
                  <input
                    type="time"
                    value={formData.bookingSettings?.end || '17:00'}
                    onChange={e => setFormData({ ...formData, bookingSettings: { ...formData.bookingSettings, end: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">{t.slotDuration || 'Slot Duration (min)'}</label>
                <div className="flex gap-2">
                  {[15, 30, 45, 60].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setFormData({ ...formData, bookingSettings: { ...formData.bookingSettings, slotDuration: mins } })}
                      className={`flex-1 py-3 rounded-xl font-bold border ${formData.bookingSettings?.slotDuration === mins ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-500'}`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --- TRACKING TAB --- */}
          {activeTab === 'tracking' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <h3 className="font-bold text-blue-800 text-sm mb-1">{t.trackingTitle}</h3>
                <p className="text-xs text-blue-600">
                  {t.trackingDesc}
                </p>
              </div>

              <div className="space-y-4">
                {/* Facebook */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#1877F2]"></span>
                    Facebook Pixel ID
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={formData.pixels?.facebook || ''}
                    onChange={e => setFormData({ ...formData, pixels: { ...formData.pixels, facebook: e.target.value } })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm font-mono"
                    placeholder="e.g. 1234567890123456"
                  />
                </div>

                {/* TikTok */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-black"></span>
                    TikTok Pixel ID
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={formData.pixels?.tiktok || ''}
                    onChange={e => setFormData({ ...formData, pixels: { ...formData.pixels, tiktok: e.target.value } })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm font-mono"
                    placeholder="e.g. C5N8V..."
                  />
                </div>

                {/* Snapchat */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#FFFC00] border border-gray-200"></span>
                    Snapchat Pixel ID
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={formData.pixels?.snapchat || ''}
                    onChange={e => setFormData({ ...formData, pixels: { ...formData.pixels, snapchat: e.target.value } })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm font-mono"
                    placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                </div>

                {/* Google */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#4285F4]"></span>
                    Google Analytics (G-XXXX)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={formData.pixels?.google || ''}
                    onChange={e => setFormData({ ...formData, pixels: { ...formData.pixels, google: e.target.value } })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm font-mono"
                    placeholder="e.g. G-MEASUREMENT_ID"
                  />
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Footer Actions */}
      <div className="p-5 border-t border-slate-100 bg-white shrink-0 flex gap-3 z-10 sticky bottom-0 rounded-b-2xl">
        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">{t.cancel}</button>
        <button form="empForm" type="submit" disabled={loading} className="flex-[2] text-white font-bold py-3 rounded-xl shadow-lg transition-all hover:opacity-90 active:scale-[0.98]" style={{ backgroundColor: formData.themeColor }}>
          {loading ? t.saving : t.save}
        </button>
      </div>


      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-[60] animate-in slide-in-from-bottom-5 fade-in duration-300 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'}`}>
          {toast.type === 'error' ? <XCircle size={20} /> : <CheckCircle size={20} className="text-emerald-400" />}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

    </Wrapper >
  );
}