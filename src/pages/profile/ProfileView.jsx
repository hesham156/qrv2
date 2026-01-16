import React, { useState, useEffect, useRef, useMemo, lazy, Suspense, useCallback } from 'react';
import { doc, getDoc, collection, setDoc, increment, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import { logAnalyticsEvent } from '../../utils/analytics';
import {
  Phone,
  Mail,
  Globe,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  MessageCircle,
  UserPlus,
  Wallet,
  CreditCard,
  FileText,
  ShoppingBag,
  ExternalLink,
  ShoppingCart,
  ImageIcon,
  ShieldCheck,
  Sparkles,
  Briefcase // ✅
} from 'lucide-react';

import { isPlanActive } from '../../utils/planHelpers';
import ProfileSkeleton from '../../components/skeletons/ProfileSkeleton';

// Lazy Load Modals
const LeadCaptureModal = lazy(() => import('../../components/modals/LeadCaptureModal'));
const WalletPreviewModal = lazy(() => import('../../components/modals/WalletPreviewModal'));



export default function ProfileView({ data: profileData, user, lang, toggleLang, t }) {
  const [data, setData] = useState(null);
  const [products, setProducts] = useState([]);
  const [portfolio, setPortfolio] = useState([]); // ✅
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info'); // info, products, portfolio
  const [error, setError] = useState(null);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [leadInterest, setLeadInterest] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(null);
  const isLogged = useRef(false);
  const productsLoaded = useRef(false);
  const portfolioLoaded = useRef(false); // ✅

  // ---------- Helpers (Multilingual + Safe Text) ----------
  const L = (lang || 'ar').toLowerCase() === 'en' ? 'en' : 'ar';

  // ... (rest of the file content)


  const toText = useCallback((v) => {
    if (v == null) return '';
    if (typeof v === 'string' || typeof v === 'number') return String(v);
    if (typeof v === 'object') return String(v?.[L] ?? v?.ar ?? v?.en ?? '');
    return '';
  }, [L]);

  const pick = (arField, enField, legacyField) => {
    const ar = toText(arField);
    const en = toText(enField);
    const legacy = toText(legacyField);
    if (L === 'en') return en || legacy || ar || '';
    return ar || legacy || en || '';
  };

  // ✅ لازم يكون فوق قبل أي return
  const themeColor = data?.themeColor || '#2563eb';
  const template = data?.template || 'classic';

  const palette = useMemo(() => {
    return {
      primary: themeColor,
      ring: themeColor,
      glow: `0 10px 30px ${themeColor}33`
    };
  }, [themeColor]);

  const nameText = pick(data?.name_ar, data?.name_en, data?.name);
  const jobTitleText = pick(data?.jobTitle_ar, data?.jobTitle_en, data?.jobTitle);
  const companyText = toText(data?.company);
  const isCompany = data?.profileType === 'company';

  const totalViews = data?.stats?.views || 0;
  const totalScans = data?.stats?.scans || 0;

  // ---------- Fetch Employee (fast) + Analytics (background) ----------
  useEffect(() => {
    if (!profileData?.adminId || !profileData?.id) return;

    let cancelled = false;

    const empRef = doc(
      db,
      'artifacts',
      appId,
      'users',
      profileData.adminId,
      'employees',
      profileData.id
    );

    const userRef = doc(db, 'artifacts', appId, 'users', profileData.adminId);

    const fetchEmployee = async () => {
      try {
        setLoading(true);

        const [empSnap, userSnap] = await Promise.all([
          getDoc(empRef),
          getDoc(userRef)
        ]);

        if (!empSnap.exists()) {
          if (!cancelled) {
            setError('لم يتم العثور على البطاقة');
            setLoading(false);
          }
          return;
        }

        const emp = empSnap.data();
        const owner = userSnap.exists() ? userSnap.data() : null;

        // Check Plan & Lock Status
        let isLocked = emp.isLocked || false;

        if (owner) {
          const active = isPlanActive(owner);

          if (!active) {
            // Plan is expired/free. Check if this is the LATEST card.
            const q = query(
              collection(db, 'artifacts', appId, 'users', profileData.adminId, 'employees'),
              orderBy('createdAt', 'desc'),
              limit(1)
            );
            const firstCardSnap = await getDocs(q);

            if (!firstCardSnap.empty) {
              const firstCardId = firstCardSnap.docs[0].id;
              // If this card is NOT the first card, LOCK IT.
              if (profileData.id !== firstCardId) {
                isLocked = true;
              }
            }
          }
        }

        if (!cancelled) setData({ ...emp, isLocked });
        if (!cancelled) setLoading(false);

        // ✅ analytics في الخلفية (بدون ما يوقف الواجهة)
        if (!isLogged.current) {
          isLogged.current = true;

          setTimeout(async () => {
            const hash = window.location.hash || '';
            const fromQR = hash.includes('src=qr');

            try {
              // ✅ timeout سريع للـ ipwho عشان مايتعلقش
              const controller = new AbortController();
              const timer = setTimeout(() => controller.abort(), 1200);

              const res = await fetch('https://ipwho.is/', { signal: controller.signal });
              clearTimeout(timer);

              const geo = await res.json();
              const countryCode = geo?.success ? geo.country_code : 'Unknown';
              const lat = geo?.success ? geo.latitude : 0;
              const lng = geo?.success ? geo.longitude : 0;
              const locationKey = `${Math.round(lat * 10) / 10}_${Math.round(lng * 10) / 10}`;

              // Log Detailed Event
              logAnalyticsEvent(
                profileData.adminId,
                profileData.id,
                'view',
                fromQR ? 'qr_scan' : 'link',
                { country: countryCode }
              );

              const statsUpdate = {
                views: increment(1),
                countries: { [countryCode]: increment(1) },
                heatmap: { [locationKey]: increment(1) },
                ...(fromQR ? { scans: increment(1) } : {})
              };

              await setDoc(empRef, { stats: statsUpdate }, { merge: true });
            } catch (e) {
              // fallback سريع
              try {
                await setDoc(
                  empRef,
                  { stats: { views: increment(1), ...(fromQR ? { scans: increment(1) } : {}) } },
                  { merge: true }
                );
              } catch (_) { }
            }
          }, 0);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error in fetchEmployee:", err);
          setError('حدث خطأ أثناء تحميل البيانات');
          setLoading(false);
        }
      }
    };

    fetchEmployee();

    return () => {
      cancelled = true;
    };
  }, [profileData?.adminId, profileData?.id]);

  // ---------- Tracking Scripts Injection ----------
  useEffect(() => {
    if (!data?.pixels) return;

    const { facebook, tiktok, snapchat, google } = data.pixels;

    // Helper to inject script
    const injectScript = (id, scriptContent) => {
      const existing = document.getElementById(id);
      if (existing) return;
      const script = document.createElement('script');
      script.id = id;
      script.innerHTML = scriptContent;
      document.head.appendChild(script);
    };

    // Helper for external script (like GTM/GA)
    const injectExternalScript = (id, src) => {
      const existing = document.getElementById(id);
      if (existing) return;
      const script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.async = true;
      document.head.appendChild(script);
    };

    // Facebook Pixel
    if (facebook) {
      injectScript('fb-pixel', `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${facebook}');
        fbq('track', 'PageView');
      `);
    }

    // TikTok Pixel
    if (tiktok) {
      injectScript('tiktok-pixel', `
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t.align=2,ttq.chars=t.chars||[],ttq.methods.forEach(function(t){ttq[t]=function(){var e=Array.prototype.slice.call(arguments);ttq.push([t,e])}})};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
          ttq.load('${tiktok}');
          ttq.page();
        }(window, document, 'ttq');
      `);
    }

    // Snapchat Pixel
    if (snapchat) {
      injectScript('snap-pixel', `
        (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
        {a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
        a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;
        r.src=n;var u=t.getElementsByTagName(s)[0];
        u.parentNode.insertBefore(r,u);})(window,document,
        'https://sc-static.net/scevent.min.js');
        snaptr('init', '${snapchat}', {
          'user_email': '__INSERT_USER_EMAIL__'
        });
        snaptr('track', 'PAGE_VIEW');
      `);
    }

    // Google Analytics 4
    if (google) {
      injectExternalScript('ga-script', `https://www.googletagmanager.com/gtag/js?id=${google}`);
      injectScript('ga-config', `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${google}');
      `);
    }

    // No Cleanup intended to keep tracking active during session, 
    // potentially we could remove them but usually pixels stick around.

  }, [data]);

  // ---------- Lazy Load Products (only when tab is products) ----------
  useEffect(() => {
    if (!profileData?.adminId || !profileData?.id) return;
    if (activeTab !== 'products') return;
    if (productsLoaded.current) return;

    let cancelled = false;

    const loadProducts = async () => {
      try {
        const prodRef = collection(
          db,
          'artifacts',
          appId,
          'users',
          profileData.adminId,
          'employees',
          profileData.id,
          'products'
        );

        const prodSnap = await getDocs(prodRef);
        let prods = [];
        prodSnap.forEach((d) => prods.push({ id: d.id, ...d.data() }));

        // Sort by createdAt
        prods.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        // TODO: Re-implement product limiting with proper auth

        if (!cancelled) {
          setProducts(prods);
          productsLoaded.current = true;
        }
      } catch (e) {
        // لو فشل تحميل المنتجات، ما نوقف الصفحة
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [activeTab, profileData?.adminId, profileData?.id]);

  // ---------- Lazy Load Portfolio (only when tab is portfolio) ----------
  useEffect(() => {
    if (!profileData?.adminId || !profileData?.id) return;
    if (activeTab !== 'portfolio') return;
    if (portfolioLoaded.current) return;

    let cancelled = false;

    const loadPortfolio = async () => {
      try {
        const portRef = collection(
          db,
          'artifacts',
          appId,
          'users',
          profileData.adminId,
          'employees',
          profileData.id,
          'portfolio'
        );

        const portSnap = await getDocs(portRef);
        let items = [];
        portSnap.forEach((d) => items.push({ id: d.id, ...d.data() }));

        // Sort by createdAt
        items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        if (!cancelled) {
          setPortfolio(items);
          portfolioLoaded.current = true;
        }
      } catch (e) {
        console.error(e);
      }
    };

    loadPortfolio();

    return () => {
      cancelled = true;
    };
  }, [activeTab, profileData?.adminId, profileData?.id]);

  const trackClick = useCallback(async (action) => {
    // Log Detailed Event
    logAnalyticsEvent(profileData.adminId, profileData.id, 'click', action);

    try {
      const docRef = doc(db, 'artifacts', appId, 'users', profileData.adminId, 'employees', profileData.id);
      await setDoc(docRef, { stats: { clicks: { [action]: increment(1) } } }, { merge: true });
    } catch (e) { }
  }, [profileData?.adminId, profileData?.id]);

  const handleBuyProduct = useCallback((prod) => {
    trackClick(`buy_${toText(prod?.name) || 'product'}`);
    if (prod?.link) window.open(toText(prod.link), '_blank');
    else {
      setLeadInterest(`${t.orderInterest} ${toText(prod?.name) || ''}`);
      setIsLeadFormOpen(true);
    }
  }, [trackClick, t, toText]);

  // ---------- vCard ----------
  const downloadVCard = useCallback(() => {
    trackClick('save_contact');
    if (!data) return;

    const fullName = nameText || 'Contact';
    const org = isCompany ? fullName : (companyText || '');
    const title = isCompany ? '' : (jobTitleText || '');
    const note = isCompany ? (jobTitleText || '') : '';
    const companyField = isCompany ? 'X-ABShowAs:COMPANY\n' : '';

    const vcard =
      `BEGIN:VCARD
VERSION:3.0
N;CHARSET=UTF-8:${fullName};;;;
FN;CHARSET=UTF-8:${fullName}
${companyField}TEL;TYPE=CELL:${toText(data.phone)}
${data.email ? `EMAIL:${toText(data.email)}\n` : ''}${title ? `TITLE;CHARSET=UTF-8:${title}\n` : ''}${org ? `ORG;CHARSET=UTF-8:${org}\n` : ''}${note ? `NOTE;CHARSET=UTF-8:${note}\n` : ''}${data.website ? `URL:${toText(data.website)}\n` : ''}END:VCARD`;

    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${fullName}.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [data, nameText, isCompany, companyText, jobTitleText, trackClick, toText]);



  // ---------- UI building blocks ----------
  const btnBase =
    "flex items-center justify-center gap-2 rounded-2xl font-extrabold transition-all active:scale-[0.99] focus:outline-none";

  const softCard = template === 'modern_pro'
    ? "bg-white/10 backdrop-blur-xl border border-white/20 rounded-[40px] shadow-2xl overflow-hidden ring-1 ring-white/20"
    : "bg-white/90 backdrop-blur border border-white/40 rounded-3xl shadow-xl overflow-hidden";

  const headerStyle = (() => {
    if (template === 'minimal') return { background: '#0f172a' };
    if (template === 'elegant') return { background: `linear-gradient(135deg, ${themeColor}, #0f172a)` };
    if (template === 'creative') return { background: `radial-gradient(circle at 20% 10%, ${themeColor}, #0f172a 70%)` };
    if (template === 'professional') return { background: `linear-gradient(90deg, #0f172a, ${themeColor})` };
    if (template === 'modern') return { background: `linear-gradient(135deg, ${themeColor}, #1e293b)` };
    if (template === 'modern_pro') return { background: `linear-gradient(135deg, ${themeColor}aa, #0f172a)` }; // Frosted dark
    return { background: `linear-gradient(90deg, ${themeColor}, #1e293b)` };
  })();

  const tabActiveStyle = (isActive) =>
    isActive ? "text-white shadow-md" : "text-white/70 hover:text-white hover:bg-white/10";

  const StatPill = ({ icon, label, value }) => (
    <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/10 border border-white/10">
      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">{icon}</div>
      <div className="leading-tight">
        <div className="text-[10px] text-white/70 font-bold">{label}</div>
        <div className="text-sm text-white font-extrabold">{value}</div>
      </div>
    </div>
  );

  const HeaderView = useMemo(() => (
    <div className={`relative ${template === 'modern_pro' ? 'h-64' : 'h-44'} overflow-hidden transition-all duration-500`} style={template === 'modern_pro' ? {} : headerStyle}>
      {/* Modern Pro Custom Header Background */}
      {template === 'modern_pro' && (
        <>
          <div className="absolute inset-0 bg-slate-900" />
          <div className="absolute inset-0 opacity-40" style={{ background: `radial-gradient(circle at 50% 0%, ${themeColor}, transparent 70%)` }} />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-900/50 to-transparent" />
        </>
      )}

      {template !== 'modern_pro' && <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />}

      {data?.bgVideoUrl && (
        <video
          src={toText(data.bgVideoUrl)}
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
      )}

      <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
        <div className="px-3 py-2 rounded-2xl bg-white/10 border border-white/10 text-white text-xs font-extrabold flex items-center gap-2">
          <ShieldCheck size={16} />
          {t?.verified || "Verified Profile"}
        </div>
      </div>

      <button
        onClick={toggleLang}
        className="absolute top-4 right-4 z-20 bg-white/15 border border-white/15 text-white px-3 py-2 rounded-2xl shadow-sm font-extrabold text-xs flex items-center gap-2 hover:bg-white/20"
      >
        <Globe size={16} /> {L === 'ar' ? 'English' : 'عربي'}
      </button>

      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
        <StatPill icon={<Sparkles size={16} />} label={t?.views || "Views"} value={totalViews} />
        <StatPill icon={<ImageIcon size={16} />} label={t?.scans || "Scans"} value={totalScans} />
      </div>
    </div>
  ), [headerStyle, data?.bgVideoUrl, t, toggleLang, L, totalViews, totalScans, template, themeColor, toText]);

  const AvatarView = useMemo(() => (
    <div className={`absolute right-1/2 translate-x-1/2 ${template === 'modern_pro' ? '-top-20 w-32 h-32 rounded-[2rem] border-8' : '-top-10 w-24 h-24 rounded-3xl border-4'} border-white/10 shadow-2xl bg-white overflow-hidden flex items-center justify-center transition-all duration-500`}>
      {/* Modern Pro: Glass border effect manually added via styles if needed, but border-white/10 works well with dark bg */}
      <div className="w-full h-full bg-white relative overflow-hidden">
        {data?.profileVideoUrl ? (
          <video
            src={toText(data.profileVideoUrl)}
            autoPlay
            loop
            muted
            playsInline
            preload="none"
            className="w-full h-full object-cover"
          />
        ) : data?.photoUrl ? (
          <img src={toText(data.photoUrl)} className="w-full h-full object-cover" alt="" fetchPriority="high" loading="eager" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl font-extrabold text-slate-600">
            {nameText ? nameText.charAt(0) : '?'}
          </div>
        )}
      </div>
    </div>
  ), [data?.profileVideoUrl, data?.photoUrl, nameText, template, toText]);

  const ActionButton = ({ icon, label, onClick, href, className = "", targetBlank = false }) => {
    const content = (
      <div
        className={`w-full ${btnBase} ${template === 'modern_pro' ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'} border px-4 py-3 ${className}`}
        style={{ boxShadow: template === 'elegant' ? palette.glow : undefined }}
      >
        <span className="text-slate-700">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
    );

    if (href) {
      return (
        <a
          href={href}
          target={targetBlank ? "_blank" : undefined}
          rel={targetBlank ? "noreferrer" : undefined}
          onClick={onClick}
          className="block"
        >
          {content}
        </a>
      );
    }

    return (
      <button onClick={onClick} className="w-full">
        {content}
      </button>
    );
  };

  const PrimaryButton = ({ icon, label, onClick }) => (
    <button
      onClick={onClick}
      className={`w-full ${btnBase} px-4 py-4 text-white text-sm shadow-xl`}
      style={{ backgroundColor: themeColor, boxShadow: palette.glow }}
    >
      {icon}
      {label}
    </button>
  );

  // --- Tabs Content ---
  const InfoTabView = useMemo(() => (
    <div className={`pt-16 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ${template === 'modern_pro' ? 'text-white' : ''}`}>
      <div className="text-center mt-2 mb-6">
        <h1 className={`text-3xl font-black tracking-tighter mb-2 ${template === 'modern_pro' ? 'text-white drop-shadow-lg' : 'text-slate-900'}`}>{nameText}</h1>
        <p className={`mt-1 text-sm font-bold ${template === 'modern_pro' ? 'text-white/70' : 'text-slate-500'}`}>
          {jobTitleText}
          {companyText ? <span className="mx-2 opacity-50">•</span> : null}
          {companyText}
        </p>
      </div>

      <div className="flex justify-center gap-2 mb-6 flex-wrap">
        {data?.facebook && (
          <a
            href={toText(data.facebook)}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackClick('facebook')}
            className="p-2.5 rounded-2xl bg-slate-900 text-white hover:opacity-90 transition-opacity"
          >
            <Facebook size={18} />
          </a>
        )}
        {data?.twitter && (
          <a
            href={toText(data.twitter)}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackClick('twitter')}
            className="p-2.5 rounded-2xl bg-black text-white hover:opacity-90 transition-opacity"
          >
            <Twitter size={18} />
          </a>
        )}
        {data?.instagram && (
          <a
            href={toText(data.instagram)}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackClick('instagram')}
            className="p-2.5 rounded-2xl bg-pink-600 text-white hover:opacity-90 transition-opacity"
          >
            <Instagram size={18} />
          </a>
        )}
        {data?.linkedin && (
          <a
            href={toText(data.linkedin)}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackClick('linkedin')}
            className="p-2.5 rounded-2xl bg-blue-700 text-white hover:opacity-90 transition-opacity"
          >
            <Linkedin size={18} />
          </a>
        )}
        {data?.youtube && (
          <a
            href={toText(data.youtube)}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackClick('youtube')}
            className="p-2.5 rounded-2xl bg-red-600 text-white hover:opacity-90 transition-opacity"
          >
            <Youtube size={18} />
          </a>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {data?.phone && (
          <ActionButton
            icon={<Phone size={18} style={{ color: themeColor }} />}
            label={t.call}
            href={`tel:${toText(data.phone)}`}
            onClick={() => trackClick('call')}
          />
        )}

        {data?.whatsapp && (
          <ActionButton
            icon={<MessageCircle size={18} className="text-emerald-500" />}
            label={t.whatsapp}
            href={`https://wa.me/${toText(data.whatsapp)}`}
            targetBlank
            onClick={() => trackClick('whatsapp')}
          />
        )}

        {data?.email && (
          <ActionButton
            icon={<Mail size={18} style={{ color: themeColor }} />}
            label={t.emailAction}
            href={`mailto:${toText(data.email)}`}
            onClick={() => trackClick('email')}
          />
        )}

        {data?.website && (
          <ActionButton
            icon={<Globe size={18} style={{ color: themeColor }} />}
            label={t.websiteAction}
            href={toText(data.website)}
            targetBlank
            onClick={() => trackClick('website')}
          />
        )}
      </div>

      <div className="mt-4 space-y-3">
        <PrimaryButton
          icon={<UserPlus size={18} />}
          label={t.exchangeContact}
          onClick={() => {
            setLeadInterest('');
            setIsLeadFormOpen(true);
          }}
        />

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowWalletModal('apple')}
            className={`w-full ${btnBase} bg-black text-white px-4 py-3`}
          >
            <Wallet size={18} />
            <span className="text-xs font-extrabold">Apple</span>
          </button>

          <button
            onClick={() => setShowWalletModal('google')}
            className={`w-full ${btnBase} bg-white text-slate-900 border border-slate-200 px-4 py-3`}
          >
            <CreditCard size={18} style={{ color: themeColor }} />
            <span className="text-xs font-extrabold">Google</span>
          </button>
        </div>

        {data?.cvUrl && (
          <ActionButton
            icon={<FileText size={18} className="text-orange-500" />}
            label={t.downloadCv}
            href={toText(data.cvUrl)}
            targetBlank
            onClick={() => trackClick('download_cv')}
            className="col-span-2"
          />
        )}

        <button
          onClick={downloadVCard}
          className={`w-full ${btnBase} px-4 py-4 text-white text-sm shadow-xl`}
          style={{ backgroundColor: themeColor, boxShadow: palette.glow }}
        >
          <UserPlus size={18} />
          {t.saveContact}
        </button>
      </div>
    </div>
  ), [nameText, jobTitleText, companyText, data, themeColor, t, trackClick, btnBase, palette.glow, downloadVCard, template, toText]);

  const ProductsTabView = useMemo(() => (
    <div className="pt-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {products.length === 0 ? (
        <div className="text-center text-slate-400 py-12">
          <ShoppingBag size={48} className="mx-auto mb-3 opacity-20" />
          <p className="font-bold">{t.noProducts}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {products.map((prod) => (
            <div key={prod.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
              <div className="h-44 w-full bg-slate-100 relative overflow-hidden">
                {prod.imageUrl ? (
                  <img src={toText(prod.imageUrl)} className="w-full h-full object-cover" alt="" loading="lazy" />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-300">
                    <ImageIcon size={32} />
                  </div>
                )}

                {prod.price && (
                  <div className="absolute top-3 right-3 bg-black/70 text-white text-xs font-extrabold px-2.5 py-1 rounded-2xl backdrop-blur-sm">
                    {toText(prod.price)} {t.currency}
                  </div>
                )}
              </div>

              <div className="p-5">
                <h3 className="font-extrabold text-slate-900 text-lg mb-1">{toText(prod.name)}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">{toText(prod.description)}</p>

                <button
                  onClick={() => handleBuyProduct(prod)}
                  className={`w-full ${btnBase} py-3 text-white text-sm`}
                  style={{ backgroundColor: themeColor, boxShadow: palette.glow }}
                >
                  {prod.link ? <ExternalLink size={18} /> : <ShoppingCart size={18} />}
                  {t.buy}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  ), [products, t, themeColor, palette.glow, btnBase, handleBuyProduct, toText]);

  const PortfolioTabView = useMemo(() => (
    <div className="pt-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {portfolio.length === 0 ? (
        <div className="text-center text-slate-400 py-12">
          <Briefcase size={48} className="mx-auto mb-3 opacity-20" />
          <p className="font-bold">{t.noProjects || "No projects yet"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {portfolio.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
              <div className="h-44 w-full bg-slate-100 relative overflow-hidden group">
                {item.imageUrl ? (
                  <img src={toText(item.imageUrl)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" loading="lazy" />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-300">
                    <ImageIcon size={32} />
                  </div>
                )}
              </div>

              <div className="p-5">
                <h3 className="font-extrabold text-slate-900 text-lg mb-1">{toText(item.title)}</h3>
                <p className="text-sm text-slate-500 line-clamp-3 mb-4">{toText(item.description)}</p>

                {item.link && (
                  <a
                    href={toText(item.link)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackClick(`view_project_${item.id}`)}
                    className={`w-full ${btnBase} py-3 text-white text-sm block text-center`}
                    style={{ backgroundColor: themeColor, boxShadow: palette.glow }}
                  >
                    <ExternalLink size={18} />
                    {t.viewProject || "View Project"}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  ), [portfolio, t, themeColor, palette.glow, btnBase, trackClick, toText]);




  // ---------- Loading / Error (Moved down to fix hooks order) ----------
  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-red-500 bg-slate-100">
        {error}
      </div>
    );
  }

  // ---------- Main Render ----------
  if (data?.isLocked) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden p-8 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={40} className="text-slate-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">{t.profileLocked || "Profile Locked"}</h1>
          <p className="text-slate-500 mb-6">
            {t.profileLockedMsg || "This profile is locked due to subscription plan limits. The owner needs to upgrade their plan to unlock it."}
          </p>
          <a href="/" className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
            {t.createYourOwn || "Create Your Own Card"}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${template === 'modern_pro' ? 'bg-[#050511]' : 'bg-slate-100'}`}>
      <div className={`w-full max-w-md relative ${softCard}`}>
        {HeaderView}

        <div className="relative px-6">
          {AvatarView}

          <div className="mt-16">
            {/* ✅ لو عايز التبويب يظهر حتى قبل تحميل المنتجات، سيبه زي ما هو */}
            <div className={`sticky top-0 z-10 -mx-6 px-6 py-3 border-b backdrop-blur ${template === 'modern_pro' ? 'bg-[#0f172a]/80 border-white/5' : 'bg-white/70 border-slate-100'}`}>
              <div className={`flex items-center gap-2 p-1 rounded-2xl ${template === 'modern_pro' ? 'bg-white/5 border border-white/5' : 'bg-slate-900'}`}>
                <button
                  onClick={() => setActiveTab('info')}
                  className={`flex-1 py-2 rounded-2xl text-xs font-extrabold transition-all ${tabActiveStyle(activeTab === 'info')}`}
                  style={activeTab === 'info' ? { backgroundColor: themeColor } : undefined}
                >
                  {t.tabInfo}
                </button>
                <button
                  onClick={() => setActiveTab('products')}
                  className={`flex-1 py-2 rounded-2xl text-xs font-extrabold transition-all ${tabActiveStyle(activeTab === 'products')}`}
                  style={activeTab === 'products' ? { backgroundColor: themeColor } : undefined}
                >
                  {t.tabProducts}
                </button>
                <button
                  onClick={() => setActiveTab('portfolio')}
                  className={`flex-1 py-2 rounded-2xl text-xs font-extrabold transition-all ${tabActiveStyle(activeTab === 'portfolio')}`}
                  style={activeTab === 'portfolio' ? { backgroundColor: themeColor } : undefined}
                >
                  {t.portfolioTitle || "Works"}
                </button>
              </div>
            </div>

            {activeTab === 'info' && InfoTabView}
            {activeTab === 'products' && ProductsTabView}
            {activeTab === 'portfolio' && PortfolioTabView}
          </div>
        </div>

        <div className={`py-4 text-center text-xs mt-auto ${template === 'modern_pro' ? 'bg-black/20 text-white/30' : 'bg-slate-50 text-slate-400'}`}>Digital Card System © 2024</div>
      </div>

      {isLeadFormOpen && (
        <Suspense fallback={null}>
          <LeadCaptureModal
            adminId={profileData.adminId}
            employeeId={profileData.id}
            themeColor={themeColor}
            onClose={() => setIsLeadFormOpen(false)}
            onSuccess={() => trackClick('exchange_contact')}
            t={t}
            initialInterest={leadInterest}
          />
        </Suspense>
      )}

      {showWalletModal && (
        <Suspense fallback={null}>
          <WalletPreviewModal type={showWalletModal} data={data} onClose={() => setShowWalletModal(null)} t={t} />
        </Suspense>
      )}
    </div>
  );
}
