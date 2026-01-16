import { useEffect, useState } from "react";
import { collection, addDoc, doc, getDoc, deleteDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { appId, db } from "../../config/firebase";
import {
  Building2, Crown, LayoutTemplate, LinkIcon, Palette, User, X, Globe,
  Phone, Mail, Share2, Image as ImageIcon, Briefcase, Activity
} from "lucide-react";

export default function EmployeeForm({ onClose, initialData, userId, user, t }) {
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({
    profileType: 'employee',
    name: '', name_ar: '', name_en: '',
    phone: '', email: '',
    jobTitle: '', jobTitle_ar: '', jobTitle_en: '',
    company: '', website: '', whatsapp: '',
    photoUrl: '', cvUrl: '', slug: '',
    themeColor: '#2563eb', qrColor: '#000000', qrBgColor: '#ffffff',
    template: 'classic',
    bgVideoUrl: '',
    profileVideoUrl: '',
    facebook: '', twitter: '', instagram: '', linkedin: '', youtube: '',
    stats: { views: 0, clicks: {}, countries: {}, heatmap: {} },
    pixels: { facebook: '', tiktok: '', snapchat: '', google: '' },
    customDomain: '' // New Field
  });

  const [loading, setLoading] = useState(false);
  const [slugError, setSlugError] = useState('');
  const [domainError, setDomainError] = useState('');

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
        customDomain: initialData.customDomain || '' // Init
      }));
    }
  }, [initialData]);

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



      onClose();
    } catch (error) {
      console.error("Error saving:", error);
      if (error.code === 'permission-denied') {
        window.alert(t.permissionError || "Permission denied");
      } else {
        window.alert(t.saveError || "Error saving");
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
    { id: 'tracking', label: t.tabTracking || 'Tracking', icon: Activity },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white z-10 shrink-0">
          <h2 className="text-lg font-bold text-slate-800">{initialData ? t.editData : t.createCard}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        {/* Tabs */}
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
                  ${isActive ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Form Body - Scrollable */}
        <div className="overflow-y-auto flex-1 p-6 bg-slate-50/30">
          <form id="empForm" onSubmit={handleSubmit} className="space-y-6">

            {/* --- GENERAL TAB --- */}
            {activeTab === 'general' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Profile Type */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button type="button" onClick={() => setFormData({ ...formData, profileType: 'employee' })} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${formData.profileType === 'employee' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}><User size={16} /> {t.profileTypeEmp}</button>
                  <button type="button" onClick={() => setFormData({ ...formData, profileType: 'company' })} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${formData.profileType === 'company' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><Building2 size={16} /> {t.profileTypeComp}</button>
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
                          <option value="ar">عربي</option>
                          <option value="en">English</option>
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
                      placeholder={nameLang === 'ar' ? (isCompany ? 'اسم الشركة' : 'الاسم بالكامل') : (isCompany ? 'Company Name' : 'Full Name')}
                    />
                  </div>

                  {/* Job Title Field */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-bold text-slate-700">{isCompany ? t.slogan : t.jobTitle}</label>
                      <div className="relative">
                        <select
                          value={jobLang}
                          onChange={(e) => setJobLang(e.target.value)}
                          className="bg-slate-100 border-none text-xs font-bold text-slate-600 py-1 pl-2 pr-6 rounded-md focus:ring-0 cursor-pointer hover:bg-slate-200"
                          style={{ appearance: 'none' }}
                        >
                          <option value="ar">عربي</option>
                          <option value="en">English</option>
                        </select>
                        <Globe size={12} className="absolute right-2 top-1.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <input
                      type="text"
                      dir={jobLang === 'ar' ? 'rtl' : 'ltr'}
                      value={jobLang === 'ar' ? formData.jobTitle_ar : formData.jobTitle_en}
                      onChange={e => setFormData({ ...formData, [jobLang === 'ar' ? 'jobTitle_ar' : 'jobTitle_en']: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                      placeholder={jobLang === 'ar' ? (isCompany ? 'الشعار' : 'المسمى الوظيفي') : (isCompany ? 'Slogan' : 'Job Title')}
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
                  <label className="block text-sm font-bold text-indigo-900 mb-1 flex items-center gap-2"><LinkIcon size={16} /> {t.slugLabel}</label>
                  <p className="text-xs text-indigo-600 mb-2">{t.slugHint}</p>
                  <div className="flex items-center bg-white border border-indigo-200 rounded-lg overflow-hidden group focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                    <span className="bg-indigo-100/50 text-indigo-600 text-xs px-3 py-3.5 font-mono border-l border-indigo-100">/ #</span>
                    <input type="text" dir="ltr" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} className="w-full px-3 py-2 text-sm outline-none font-mono text-indigo-700 placeholder-indigo-300" placeholder="your-name" />
                  </div>
                  {slugError && <p className="text-xs text-red-500 mt-2 font-bold flex items-center gap-1"><X size={12} />{slugError}</p>}
                  {slugError && <p className="text-xs text-red-500 mt-2 font-bold flex items-center gap-1"><X size={12} />{slugError}</p>}
                </div>

                {/* Custom Domain (PRO) */}
                <div className={`p-4 rounded-xl border ${user?.plan !== 'pro' ? 'bg-slate-50 border-slate-200 opacity-70 relative overflow-hidden' : 'bg-purple-50 border-purple-100'}`}>
                  {user?.plan !== 'pro' && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100/50 backdrop-blur-[1px]">
                      <div className="bg-white px-4 py-2 rounded-full shadow-lg border border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-800">
                        <Crown size={14} className="text-yellow-500" />
                        {t.proFeature || "Pro Feature"}
                      </div>
                    </div>
                  )}
                  <label className="block text-sm font-bold text-purple-900 mb-1 flex items-center gap-2"><Globe size={16} /> {t.customDomain || "Custom Domain"}</label>
                  <p className="text-xs text-purple-600 mb-2">{t.customDomainHint || "Connect your own domain (e.g. profile.mycompany.com). Add CNAME record pointing to our server."}</p>
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
                  <label className="block text-sm font-bold text-slate-700 mb-1">{t.website}</label>
                  <div className="relative">
                    <Globe size={16} className="absolute top-3.5 left-3 text-slate-400" />
                    <input type="url" dir="ltr" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none" placeholder="https://" />
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
                    <label className={`block text-xs font-bold mb-1 ${social.color}`}>{social.label}</label>
                    <input
                      type="url"
                      dir="ltr"
                      value={formData[social.key]}
                      onChange={e => setFormData({ ...formData, [social.key]: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm"
                      placeholder={`https://${social.key.toLowerCase()}.com/...`}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* --- DESIGN TAB --- */}
            {activeTab === 'design' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                {/* Visuals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2"><ImageIcon size={16} /> {isCompany ? t.logoUrl : t.photoUrl}</label>
                    <input type="url" dir="ltr" value={formData.photoUrl} onChange={e => setFormData({ ...formData, photoUrl: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm" placeholder="https://" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2"><LinkIcon size={16} /> {isCompany ? t.profilePdf : t.cvPdf}</label>
                    <input type="url" dir="ltr" value={formData.cvUrl} onChange={e => setFormData({ ...formData, cvUrl: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm" placeholder="https://" />
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

                {/* Videos */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">{t.bgVideo}</label>
                    <input type="url" dir="ltr" value={formData.bgVideoUrl} onChange={e => setFormData({ ...formData, bgVideoUrl: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none" placeholder="MP4 URL" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">{t.profileVideo}</label>
                    <input type="url" dir="ltr" value={formData.profileVideoUrl} onChange={e => setFormData({ ...formData, profileVideoUrl: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none" placeholder="MP4 URL" />
                  </div>
                </div>
              </div>
            )}

            {/* --- TRACKING TAB --- */}
            {activeTab === 'tracking' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <h3 className="font-bold text-blue-800 text-sm mb-1">{t.trackingTitle || "Marketing & Tracking"}</h3>
                  <p className="text-xs text-blue-600">
                    {t.trackingDesc || "Add your pixel IDs to track visitors and create retargeting audiences."}
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
        <div className="p-5 border-t border-slate-100 bg-white shrink-0 flex gap-3 z-10">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">{t.cancel}</button>
          <button form="empForm" type="submit" disabled={loading} className="flex-[2] text-white font-bold py-3 rounded-xl shadow-lg transition-all hover:opacity-90 active:scale-[0.98]" style={{ backgroundColor: formData.themeColor }}>
            {loading ? t.saving : t.save}
          </button>
        </div>

      </div >
    </div >
  );
}