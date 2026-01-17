import React, { useState, useEffect, useRef, useMemo, lazy, Suspense, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, collection, setDoc, increment, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import ProfileChatbot from '../../components/profile/ProfileChatbot';
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
  Briefcase,
  X,
  Heart,
  Star,
  Calendar
} from 'lucide-react';

import { isPlanActive } from '../../utils/planHelpers';
import ProfileSkeleton from '../../components/skeletons/ProfileSkeleton';
import { useSEO } from '../../hooks/useSEO';

// Lazy Load Modals
const LeadCaptureModal = lazy(() => import('../../components/modals/LeadCaptureModal'));

const WalletPreviewModal = lazy(() => import('../../components/modals/WalletPreviewModal'));
const FollowModal = lazy(() => import('../../components/modals/FollowModal'));
const BookingModal = lazy(() => import('../../components/modals/BookingModal'));



export default function ProfileView({ data: profileData, user, lang, toggleLang, t }) {
  const [data, setData] = useState(null);
  const [products, setProducts] = useState([]);
  const [portfolio, setPortfolio] = useState([]); // ✅
  const [portfolioCategory, setPortfolioCategory] = useState('all'); // ✅
  const [paymentConfig, setPaymentConfig] = useState(null); // ✅
  const [paymentModalOpen, setPaymentModalOpen] = useState(false); // ✅
  const [selectedProductForPayment, setSelectedProductForPayment] = useState(null); // ✅
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info'); // info, products, portfolio
  const [error, setError] = useState(null);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [leadInterest, setLeadInterest] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(null);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followModalOpen, setFollowModalOpen] = useState(false); // ✅
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [rateModalOpen, setRateModalOpen] = useState(false); // ✅
  const isLogged = useRef(false);
  const productsLoaded = useRef(false);
  const portfolioLoaded = useRef(false); // ✅

  // ---------- Helpers (Multilingual + Safe Text) ----------
  const L = (lang || 'ar').toLowerCase() === 'en' ? 'en' : 'ar';

  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }), []);

  const itemVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }), []);

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



  const nameText = pick(data?.name_ar, data?.name_en, data?.name);
  const jobTitleText = pick(data?.jobTitle_ar, data?.jobTitle_en, data?.jobTitle);
  const companyText = toText(data?.company);
  const isCompany = data?.profileType === 'company';

  // Custom SEO Hook
  useSEO(
    data?.seoTitle || nameText,
    data?.seoDescription || data?.bio_ar || data?.bio_en || jobTitleText,
    data?.seoImage || data?.photoUrl
  );

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

    // Analytics: Tab Views
    if (activeTab === 'products') {
      logAnalyticsEvent(profileData.adminId, profileData.id, 'product_view', 'tab_active');
    } else if (activeTab === 'portfolio') { // Assuming portfolio tab exists or will exist
      logAnalyticsEvent(profileData.adminId, profileData.id, 'portfolio_view', 'tab_active');
    }

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

        if (!cancelled) {
          setData({ ...emp, isLocked });
          setLoading(false);

          // ✅ analytics في الخلفية (مرة واحدة فقط)
          if (!isLogged.current) {
            isLogged.current = true;
            const hash = window.location.hash || '';
            const fromQR = hash.includes('src=qr');

            (async () => {
              try {
                // Fetch basic geo for stats (faster and doesn't block UI)
                const res = await fetch('https://ipwho.is/');
                const geo = await res.json();
                const countryCode = geo?.success ? geo.country_code : 'Unknown';
                const lat = geo?.success ? geo.latitude : 0;
                const lng = geo?.success ? geo.longitude : 0;
                const locationKey = `${Math.round(lat * 10) / 10}_${Math.round(lng * 10) / 10}`;

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
                console.warn('Analytics error:', e);
                // Fallback: increment views at least
                setDoc(empRef, { stats: { views: increment(1) } }, { merge: true }).catch(() => { });
              }
            })();
          }
        }

        // Check local follow status
        const followed = localStorage.getItem(`followed_${profileData.id}`);
        if (followed) setIsFollowing(true);

      } catch (err) {
        if (!cancelled) {
          console.error("Error in fetchEmployee:", err);
          setError('حدث خطأ أثناء تحميل البيانات');
          setLoading(false);
        }
      }
    };

    const fetchPaymentConfig = async () => {
      try {
        const docRef = doc(db, 'artifacts', appId, 'users', profileData.adminId, 'employees', profileData.id, 'payment_settings', 'config');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setPaymentConfig(snap.data());
        }
      } catch (e) { }
    };

    fetchEmployee();
    fetchPaymentConfig();

    return () => { cancelled = true; };
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

  // ---------- Custom Font Injection (Pro) ----------
  useEffect(() => {
    if (!data?.customFont) return;

    const fontId = 'custom-font-style';
    const fontUrl = toText(data.customFont);

    // Create generic font face
    const styleContent = `
      @font-face {
        font-family: 'CustomProfileFont';
        src: url('${fontUrl}') format('truetype');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
      .profile-view-container {
        font-family: 'CustomProfileFont', sans-serif !important;
      }
      /* Override common text elements */
      h1, h2, h3, h4, h5, h6, p, span, button, a, div {
        font-family: 'CustomProfileFont', sans-serif !important;
      }
    `;

    // Inject style tag
    const existing = document.getElementById(fontId);
    if (!existing) {
      const style = document.createElement('style');
      style.id = fontId;
      style.innerHTML = styleContent;
      document.head.appendChild(style);
    } else {
      existing.innerHTML = styleContent;
    }

    return () => {
      // Cleanup on unmount or change
      const el = document.getElementById(fontId);
      if (el) el.remove();
    };
  }, [data?.customFont, toText]);

  // ---------- Google Font Injection (Free/Pro) ----------
  useEffect(() => {
    // If custom font exists, it takes precedence (handled above).
    // Only proceed if NO custom font and YES google font.
    if (data?.customFont || !data?.googleFont) return;

    const fontName = toText(data.googleFont);
    const linkId = 'google-font-link';
    const styleId = 'google-font-style';

    // 1. Inject Link
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;700&display=swap`;
      document.head.appendChild(link);
    } else {
      // Update href if duplicate ID but different font (basic handling)
      const link = document.getElementById(linkId);
      link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;700&display=swap`;
    }

    // 2. Inject Style
    const styleContent = `
      .profile-view-container {
        font-family: '${fontName}', sans-serif !important;
      }
      /* Override common text elements */
      h1, h2, h3, h4, h5, h6, p, span, button, a, div {
        font-family: '${fontName}', sans-serif !important;
      }
    `;

    const existingStyle = document.getElementById(styleId);
    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = styleContent;
      document.head.appendChild(style);
    } else {
      existingStyle.innerHTML = styleContent;
    }

    return () => {
      // Cleanup style (keep link as it might be cached/useful)
      const s = document.getElementById(styleId);
      if (s) s.remove();
    };
  }, [data?.googleFont, data?.customFont, toText]);

  // ---------- Lazy Load Products (only when tab is products) ----------
  useEffect(() => {
    if (!profileData?.adminId || !profileData?.id) return;
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
  }, [profileData?.adminId, profileData?.id]);

  // ---------- Lazy Load Portfolio (only when tab is portfolio) ----------
  useEffect(() => {
    if (!profileData?.adminId || !profileData?.id) return;
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
  }, [profileData?.adminId, profileData?.id]);

  // Fallback if active tab becomes empty or hidden
  useEffect(() => {
    if (activeTab === 'products' && productsLoaded.current && products.length === 0) {
      setActiveTab('info');
    }
    if (activeTab === 'portfolio' && portfolioLoaded.current && portfolio.length === 0) {
      setActiveTab('info');
    }
  }, [activeTab, products, portfolio]);

  const trackClick = useCallback(async (action) => {
    // Log Detailed Event
    logAnalyticsEvent(profileData.adminId, profileData.id, 'click', action);

    try {
      const docRef = doc(db, 'artifacts', appId, 'users', profileData.adminId, 'employees', profileData.id);
      await setDoc(docRef, { stats: { clicks: { [action]: increment(1) } } }, { merge: true });
    } catch (e) { }
  }, [profileData?.adminId, profileData?.id]);

  const handleBuyProduct = useCallback((prod) => {
    // Analytics: Product Click
    logAnalyticsEvent(profileData.adminId, profileData.id, 'product_click', prod?.link ? 'link' : 'inquiry', {
      productId: prod?.id,
      productName: toText(prod?.name)
    });

    trackClick(`buy_${toText(prod?.name) || 'product'}`);
    if (prod?.link) {
      window.open(toText(prod.link), '_blank');
    } else {
      // Check if any payment method is enabled
      const hasPayment = paymentConfig && (
        paymentConfig.stripe?.enabled ||
        paymentConfig.tabby?.enabled ||
        paymentConfig.tamara?.enabled
      );

      if (hasPayment) {
        setSelectedProductForPayment(prod);
        setPaymentModalOpen(true);
      } else {
        setLeadInterest(`${t.orderInterest} ${toText(prod?.name) || ''}`);
        setIsLeadFormOpen(true);
      }
    }
  }, [trackClick, t, toText, profileData, paymentConfig]);

  const handlePaymentSelect = (method) => {
    setPaymentModalOpen(false);

    if (method === 'cash') {
      setLeadInterest(`${t.orderInterest} ${toText(selectedProductForPayment?.name) || ''} (Cash)`);
      setIsLeadFormOpen(true);
    } else {
      // Simulate Redirect
      const prodName = toText(selectedProductForPayment?.name);
      const price = selectedProductForPayment?.price || '0';

      let logMsg = `Mock Redirect to ${method.toUpperCase()} for ${prodName} - Price: ${price}`;

      if (method === 'stripe') {
        // In a real app, you would call your backend here with paymentConfig.stripe.publishableKey
        alert(`Redirecting to Stripe Checkout...\nProduct: ${prodName}\n(Using Key: ${paymentConfig.stripe.publishableKey})`);
      } else if (method === 'tabby') {
        alert(`Redirecting to Tabby Split Payment...\nProduct: ${prodName}\n(Merchant: ${paymentConfig.tabby.merchantCode})`);
      } else if (method === 'tamara') {
        alert(`Redirecting to Tamara Split Payment...\nProduct: ${prodName}`);
      }
    }
  };

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



  const handleFollowClick = () => {
    if (isFollowing) return;
    setFollowModalOpen(true);
  };

  const handleSmartFollowSuccess = () => {
    setIsFollowing(true);
    localStorage.setItem(`followed_${profileData.id}`, 'true');

    // Optimistic Logic moved inside Modal for server, but we update UI here
    setData(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        followers: (prev.stats?.followers || 0) + 1
      }
    }));
    trackClick('follow_smart');
  };

  const handleRate = async (stars) => {
    setRateModalOpen(false);
    // Optimistic Update is tricky for average, but we can try basic increment
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', profileData.adminId, 'employees', profileData.id);
      await setDoc(docRef, {
        stats: {
          rating: increment(stars),
          ratingCount: increment(1)
        }
      }, { merge: true });

      // Manual optimistic data update so UI reflects immediately
      setData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          rating: (prev.stats?.rating || 0) + stars,
          ratingCount: (prev.stats?.ratingCount || 0) + 1
        }
      }));

      alert(t.thankYouRating || "Thank you for rating!");
    } catch (e) { console.error("Rate error", e); }
  };

  /* --- PREMIUM UI COMPONENTS --- */
  const btnBase = "flex items-center justify-center gap-2 rounded-2xl font-bold transition-all active:scale-[0.95] duration-200 outline-none select-none";

  // Premium Dark Card Style
  const softCard = "bg-[#0f172a] sm:bg-[#0f172a]/80 sm:backdrop-blur-2xl border-0 sm:border sm:border-slate-800 sm:rounded-[40px] shadow-2xl overflow-hidden w-full max-w-md mx-auto relative z-10 min-h-screen sm:min-h-[85vh] sm:h-auto flex flex-col";

  const palette = useMemo(() => ({
    primary: themeColor,
    ring: themeColor,
    glow: `0 0 20px ${themeColor}66`, // Soft glow
    glass: "bg-white/5 backdrop-blur-lg border border-white/10"
  }), [themeColor]);

  // Stat Pill (Glass)
  const StatPill = ({ icon, label, value }) => (
    <motion.div
      whileHover={{ y: -2, backgroundColor: "rgba(255,255,255,0.08)" }}
      className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md flex-1 min-w-[80px]"
    >
      <div className="text-white/50 mb-1">{icon}</div>
      <div className="text-xl font-black text-white tracking-tight">{value}</div>
      <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{label}</div>
    </motion.div>
  );

  /* --- HEADER VIEW (Clean, Taller) --- */
  const HeaderView = useMemo(() => (
    <div className="relative h-56 overflow-hidden">
      {/* Background with Gradient Overlay */}
      <div className="absolute inset-0 bg-[#020617]" />

      {/* Dynamic Gradient Mesh */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background: `
            radial-gradient(circle at 50% -20%, ${themeColor}, transparent 70%),
            radial-gradient(circle at 100% 100%, #1e293b, transparent 50%)
          `
        }}
      />

      {/* Texture */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

      {/* Video Background (Optional) */}
      {data?.bgVideoUrl && (
        <video
          src={toText(data.bgVideoUrl)}
          autoPlay loop muted playsInline preload="none"
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
      )}

      {/* Top Actions */}
      <div className="absolute top-0 left-0 right-0 p-5 flex items-center justify-between z-20">
        <div className={`px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 flex items-center gap-2 ${data?.isVerified ? 'bg-blue-500/20 text-blue-300' : 'bg-white/10 text-white/70'}`}>
          <ShieldCheck size={14} className={data?.isVerified ? 'text-blue-400' : ''} />
          <span className="text-[10px] font-bold uppercase tracking-wider">{t?.verified || "Verified"}</span>
        </div>

        <button
          onClick={toggleLang}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-all font-bold text-xs"
        >
          {L === 'ar' ? 'En' : 'ع'}
        </button>
      </div>
    </div>
  ), [data?.bgVideoUrl, t, toggleLang, L, themeColor, toText, data?.isVerified]);

  /* --- AVATAR VIEW (Modern Squircle) --- */
  const AvatarView = useMemo(() => (
    <div className="relative -mt-[4.5rem] mb-4 flex justify-center z-20">
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className="relative"
      >
        {/* Glow behind Avatar */}
        <div className="absolute inset-0 rounded-[2.5rem] blur-2xl opacity-60" style={{ backgroundColor: themeColor }} />

        {/* Avatar Container */}
        <div className="w-36 h-36 rounded-[2.5rem] border-4 border-[#0f172a] bg-[#1e293b] shadow-2xl relative overflow-hidden flex items-center justify-center group">
          {data?.profileVideoUrl ? (
            <video
              src={toText(data.profileVideoUrl)}
              autoPlay loop muted playsInline preload="none"
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
            />
          ) : data?.photoUrl ? (
            <img src={toText(data.photoUrl)} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" alt="Profile" />
          ) : (
            <span className="text-4xl font-black text-slate-700">{nameText?.charAt(0) || '?'}</span>
          )}

          {/* Glass Gloss */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
        </div>
      </motion.div>
    </div>
  ), [data?.profileVideoUrl, data?.photoUrl, nameText, themeColor, toText]);

  const ActionButton = ({ icon, label, onClick, href, className = "", targetBlank = false, highlight = false }) => {
    const Wrapper = href ? motion.a : motion.button;
    const props = href ? { href, target: targetBlank ? "_blank" : undefined, rel: targetBlank ? "noreferrer" : undefined } : { onClick };

    return (
      <Wrapper
        {...props}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full ${btnBase} py-4 px-4 relative overflow-hidden group ${highlight ? 'text-white border-0 shadow-lg' : 'bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 hover:border-white/20'} ${className}`}
        style={highlight ? { backgroundColor: themeColor, boxShadow: palette.glow } : {}}
      >
        {highlight && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
        )}
        <span className={`${highlight ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'}`}>{icon}</span>
        <span className="text-sm font-bold tracking-wide">{label}</span>
      </Wrapper>
    );
  };

  const PrimaryButton = ({ icon, label, onClick }) => (
    <ActionButton icon={icon} label={label} onClick={onClick} highlight={true} />
  );

  // --- Tabs Content ---
  const InfoTabView = useMemo(() => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="pb-8"
    >
      {/* (Name & Title removed from here as they are now in the main header flow) */}

      <motion.div variants={itemVariants} className="flex justify-center gap-3 mb-8 flex-wrap">
        {data?.facebook && (<a href={toText(data.facebook)} target="_blank" rel="noreferrer" onClick={() => trackClick('facebook')} className="p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-blue-600 hover:border-transparent transition-all"><Facebook size={20} /></a>)}
        {data?.twitter && (<a href={toText(data.twitter)} target="_blank" rel="noreferrer" onClick={() => trackClick('twitter')} className="p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-black hover:border-transparent transition-all"><Twitter size={20} /></a>)}
        {data?.instagram && (<a href={toText(data.instagram)} target="_blank" rel="noreferrer" onClick={() => trackClick('instagram')} className="p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-pink-600 hover:border-transparent transition-all"><Instagram size={20} /></a>)}
        {data?.linkedin && (<a href={toText(data.linkedin)} target="_blank" rel="noreferrer" onClick={() => trackClick('linkedin')} className="p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-blue-700 hover:border-transparent transition-all"><Linkedin size={20} /></a>)}
        {data?.youtube && (<a href={toText(data.youtube)} target="_blank" rel="noreferrer" onClick={() => trackClick('youtube')} className="p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-red-600 hover:border-transparent transition-all"><Youtube size={20} /></a>)}
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
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
      </motion.div>

      <motion.div variants={itemVariants} className="mt-4 space-y-3">
        <PrimaryButton
          icon={<UserPlus size={18} />}
          label={t.exchangeContact}
          onClick={() => {
            setLeadInterest('');
            setIsLeadFormOpen(true);
          }}
        />

        {data?.bookingUrl !== undefined && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setBookingModalOpen(true)}
            className={`w-full ${btnBase} px-4 py-4 text-white text-sm shadow-xl flex items-center justify-center gap-2`}
            style={{
              backgroundColor: themeColor,
              filter: 'brightness(1.1)',
              boxShadow: `0 10px 25px -5px ${themeColor}40`
            }}
          >
            <Calendar size={18} />
            <span className="font-bold">{t.bookingAction || "Book Now"}</span>
          </motion.button>
        )}

        {/* Follow Button (New) */}
        {!isFollowing ? (
          <button
            onClick={handleFollowClick}
            className={`w-full ${btnBase} px-4 py-4 text-slate-700 bg-slate-100/80 border border-slate-200 hover:bg-slate-200 hover:border-slate-300`}
          >
            <Heart size={18} className="text-pink-500" />
            <span>{t.follow || "Follow Profile"}</span>
          </button>
        ) : (
          <div className={`w-full ${btnBase} px-4 py-4 text-emerald-700 bg-emerald-50 border border-emerald-100 opacity-80 cursor-default`}>
            <Heart size={18} className="fill-emerald-500 text-emerald-500" />
            <span>{t.following || "Following"}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowWalletModal('apple')}
            className={`w-full ${btnBase} bg-black text-white px-4 py-3`}
          >
            <Wallet size={18} />
            <span className="text-xs font-extrabold">{t.apple || "Apple"}</span>
          </button>

          <button
            onClick={() => setShowWalletModal('google')}
            className={`w-full ${btnBase} bg-white text-slate-900 border border-slate-200 px-4 py-3`}
          >
            <CreditCard size={18} style={{ color: themeColor }} />
            <span className="text-xs font-extrabold">{t.google || "Google"}</span>
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

      </motion.div>
    </motion.div>
  ), [nameText, jobTitleText, companyText, data, themeColor, t, trackClick, btnBase, palette.glow, downloadVCard, template, toText, containerVariants, itemVariants]);

  /* --- PRODUCTS TAB VIEW (Dark) --- */
  const ProductsTabView = useMemo(() => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="pb-8"
    >
      {products.length === 0 ? (
        <div className="text-center text-slate-500 py-12">
          <ShoppingBag size={48} className="mx-auto mb-3 opacity-20" />
          <p className="font-bold">{t.noProducts}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {products.map((prod) => (
            <motion.div
              variants={itemVariants}
              key={prod.id}
              className="bg-[#1e293b]/50 backdrop-blur-md rounded-3xl overflow-hidden shadow-lg border border-white/5 group"
            >
              <div className="h-44 w-full bg-[#020617] relative overflow-hidden">
                {prod.imageUrl ? (
                  <img src={toText(prod.imageUrl)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" loading="lazy" />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-700">
                    <ImageIcon size={32} />
                  </div>
                )}

                {prod.price && (
                  <div className="absolute top-3 right-3 bg-black/80 text-white text-xs font-black px-3 py-1.5 rounded-xl backdrop-blur-sm border border-white/10">
                    {toText(prod.price)} {t.currency}
                  </div>
                )}
              </div>

              <div className="p-5">
                <h3 className="font-bold text-white text-lg mb-1 leading-tight">{toText(prod.name)}</h3>
                <p className="text-sm text-slate-400 line-clamp-2 mb-4 font-medium">{toText(prod.description)}</p>

                <button
                  onClick={() => handleBuyProduct(prod)}
                  className={`w-full ${btnBase} py-3 text-white text-sm shadow-lg`}
                  style={{ backgroundColor: themeColor, boxShadow: palette.glow }}
                >
                  {prod.link ? <ExternalLink size={18} /> : <ShoppingCart size={18} />}
                  {t.buy}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  ), [products, t, themeColor, palette.glow, btnBase, handleBuyProduct, toText]);

  /* --- PORTFOLIO TAB VIEW (Dark) --- */
  const PortfolioTabView = useMemo(() => {
    const categories = [
      { id: 'all', label: t.catAll || 'All' },
      { id: 'development', label: t.catDev || 'Dev' },
      { id: 'design', label: t.catDesign || 'Design' },
      { id: 'video', label: t.catVideo || 'Video' },
      { id: 'marketing', label: t.catMarketing || 'Marketing' },
      { id: 'other', label: t.catOther || 'Other' }
    ];

    const filteredItems = portfolio.filter(item =>
      portfolioCategory === 'all' ? true : (item.category || 'other') === portfolioCategory
    );

    const getEmbedUrl = (url) => {
      if (!url) return null;
      const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
      const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
      if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
      return null;
    };

    // --- Helpers for Card Styles (Dark) ---

    // 1. Developer Card (Repo Style)
    const DevCard = ({ item }) => (
      <div className="bg-[#1e293b]/50 backdrop-blur rounded-xl overflow-hidden border border-white/5 shadow-lg flex flex-col h-full group hover:border-white/20 transition-all">
        <div className="p-5 flex flex-col h-full">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-white/5 rounded-lg text-blue-400">
              <Briefcase size={20} />
            </div>
            {item.link && (
              <a href={toText(item.link)} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white transition-colors">
                <ExternalLink size={18} />
              </a>
            )}
          </div>

          <h3 className="font-mono font-bold text-white text-lg mb-2 line-clamp-1 group-hover:text-blue-400 transition-colors">{toText(item.title)}</h3>
          <p className="text-slate-400 text-sm line-clamp-3 mb-4 flex-1 font-mono">{toText(item.description)}</p>

          <div className="flex items-center gap-2 mt-auto">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-xs text-slate-500 font-mono">CODE</span>
          </div>
        </div>
      </div>
    );

    // 2. Designer Card (Gallery Style)
    const DesignCard = ({ item }) => (
      <div className="bg-[#1e293b] rounded-2xl overflow-hidden shadow-lg border border-white/5 relative group aspect-[4/3]">
        {item.imageUrl ? (
          <img src={toText(item.imageUrl)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={toText(item.title)} loading="lazy" />
        ) : (
          <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600"><ImageIcon size={32} /></div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <h3 className="text-white font-bold text-lg translate-y-2 group-hover:translate-y-0 transition-transform duration-300">{toText(item.title)}</h3>
          <p className="text-white/70 text-xs line-clamp-2 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">{toText(item.description)}</p>
          {item.link && (
            <a href={toText(item.link)} target="_blank" rel="noreferrer" className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition-all">
              <ExternalLink size={16} />
            </a>
          )}
        </div>
      </div>
    );

    // 3. Video Card (Cinema Style) - kept mostly same as it was already dark
    const VideoCard = ({ item }) => {
      const embedUrl = getEmbedUrl(item.videoUrl);
      return (
        <div className="bg-black rounded-2xl overflow-hidden shadow-lg border border-slate-800 group">
          <div className="aspect-video w-full bg-slate-900 relative">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={toText(item.title)}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-600 font-mono text-xs">NO VIDEO URL</div>
            )}
          </div>
          <div className="p-4 bg-[#020617] border-t border-white/5">
            <h3 className="text-white font-bold mb-1 flex items-center gap-2 group-hover:text-red-500 transition-colors">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              {toText(item.title)}
            </h3>
            <p className="text-slate-500 text-xs line-clamp-1">{toText(item.description)}</p>
          </div>
        </div>
      );
    };

    // 4. Standard Card (Default/Marketing)
    const StandardCard = ({ item }) => (
      <div className="bg-[#1e293b]/50 backdrop-blur rounded-3xl overflow-hidden shadow-lg border border-white/5 hover:border-white/20 transition-all">
        <div className="h-44 w-full bg-[#020617] relative overflow-hidden group">
          {item.imageUrl ? (
            <img src={toText(item.imageUrl)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" loading="lazy" />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-700">
              <ImageIcon size={32} />
            </div>
          )}
        </div>

        <div className="p-5">
          <h3 className="font-extrabold text-white text-lg mb-1">{toText(item.title)}</h3>
          <p className="text-sm text-slate-400 line-clamp-3 mb-4">{toText(item.description)}</p>

          {item.link && (
            <a
              href={toText(item.link)}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                trackClick(`view_project_${item.id}`);
                logAnalyticsEvent(profileData.adminId, profileData.id, 'portfolio_click', 'view_project', { projectId: item.id });
              }}
              className={`w-full ${btnBase} py-3 text-white text-sm block text-center shadow-lg hover:brightness-110 transition-all`}
              style={{ backgroundColor: themeColor, boxShadow: palette.glow }}
            >
              <ExternalLink size={18} />
              {t.viewProject || "View Project"}
            </a>
          )}
        </div>
      </div>
    );


    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="pb-8" // Removed top padding
      >
        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar mb-4 px-1">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setPortfolioCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${portfolioCategory === cat.id
                ? 'text-white'
                : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10 hover:text-white'
                }`}
              style={portfolioCategory === cat.id ? { backgroundColor: themeColor, boxShadow: palette.glow } : undefined}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center text-slate-500 py-12">
            <Briefcase size={48} className="mx-auto mb-3 opacity-20" />
            <p className="font-bold">{t.noProjects || "No projects in this category"}</p>
          </div>
        ) : (
          <div className={`grid gap-4 ${portfolioCategory === 'design' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {filteredItems.map((item) => {
              const cat = item.category || 'other';
              const isVideo = item.mediaType === 'video';

              let Card;
              if (cat === 'development') Card = DevCard;
              else if (cat === 'design') Card = DesignCard;
              else if (cat === 'video' || isVideo) Card = VideoCard;
              else Card = StandardCard;

              return (
                <motion.div variants={itemVariants} key={item.id}>
                  <Card item={item} />
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    );
  }, [portfolio, portfolioCategory, t, themeColor, palette.glow, btnBase, trackClick, toText]);




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
    /* [Keep Locked Logic as is - it's fine for now, or could style it too but low priority] */
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl p-8 text-center">
          {/* Locked Content */}
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={40} className="text-slate-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">{t.profileLocked}</h1>
          <p className="text-slate-400 mb-6">{t.profileLockedMsg}</p>
        </div>
      </div>
    )
  }

  return (
    <div dir={L === 'ar' ? 'rtl' : 'ltr'} lang={L} className={`profile-view-container min-h-screen flex items-center justify-center sm:p-4 bg-black transition-colors duration-500`}>

      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full opacity-20 blur-[100px]" style={{ background: themeColor }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-10 blur-[100px] bg-blue-900" />
      </div>

      <div className={`profile-card-main ${softCard}`}>
        {HeaderView}

        <div className="flex-1 flex flex-col relative">

          <div className="px-6 relative z-10 pb-12">
            {AvatarView}

            {/* Main Info */}
            <motion.div variants={itemVariants} initial="hidden" animate="show" className="text-center mb-8">
              <h1 className="text-3xl font-black text-white tracking-tight mb-2 drop-shadow-lg">{nameText}</h1>
              <p className="text-sm font-medium text-slate-400 flex items-center justify-center gap-2">
                {jobTitleText}
                {companyText && <span className="w-1 h-1 rounded-full bg-slate-600" />}
                {companyText}
              </p>

              {/* Stats Grid (New location) */}
              <div className="flex items-center justify-center gap-3 mt-6">
                <StatPill icon={<Sparkles size={16} />} label={t?.views || "Views"} value={totalViews} />
                <button className="flex-1 min-w-[80px]" onClick={handleFollowClick}>
                  <StatPill icon={<Briefcase size={16} />} label={t.followers || "Fans"} value={data?.stats?.followers || 0} />
                </button>
                <button className="flex-1 min-w-[80px]" onClick={() => setRateModalOpen(true)}>
                  <StatPill icon={<Star size={16} className="text-yellow-500 fill-yellow-500" />} label="Rating" value={(data?.stats?.ratingCount > 0 ? (data.stats.rating / data.stats.ratingCount).toFixed(1) : '5.0')} />
                </button>
              </div>
            </motion.div>

            {/* Tabs (Glass Style) */}
            <div className="p-1 mb-6 rounded-2xl bg-white/5 border border-white/5 flex items-center backdrop-blur-md">
              <button onClick={() => setActiveTab('info')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'info' ? 'bg-[#1e293b] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                {t.tabInfo}
              </button>
              {products.length > 0 && (
                <button onClick={() => setActiveTab('products')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'products' ? 'bg-[#1e293b] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                  {t.tabProducts}
                </button>
              )}
              {portfolio.length > 0 && (
                <button onClick={() => setActiveTab('portfolio')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'portfolio' ? 'bg-[#1e293b] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                  {t.portfolioTitle}
                </button>
              )}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="min-h-[200px]"
              >
                {activeTab === 'info' && InfoTabView}
                {activeTab === 'products' && ProductsTabView}
                {activeTab === 'portfolio' && PortfolioTabView}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-auto py-6 text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest bg-black/20 backdrop-blur-md border-t border-white/5">
            Powered by DigiCard
          </div>

        </div>
      </div>

      {/* Modals & Portals (unchanged logic) */}
      {isLeadFormOpen && (
        <Suspense fallback={null}>
          <LeadCaptureModal adminId={profileData.adminId} employeeId={profileData.id} themeColor={themeColor} onClose={() => setIsLeadFormOpen(false)} onSuccess={() => trackClick('exchange_contact')} t={t} initialInterest={leadInterest} />
        </Suspense>
      )}
      {showWalletModal && (
        <Suspense fallback={null}>
          <WalletPreviewModal type={showWalletModal} data={data} onClose={() => setShowWalletModal(null)} t={t} />
        </Suspense>
      )}
      {paymentModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-end sm:justify-center animate-in fade-in duration-200">
          <div className="bg-[#0f172a] w-full sm:max-w-md p-6 rounded-t-3xl sm:rounded-3xl border border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold text-lg">{t.choosePayment}</h3>
              <button onClick={() => setPaymentModalOpen(false)} className="bg-white/10 p-2 rounded-full text-white"><X size={18} /></button>
            </div>
            {/* Reusing existing payment buttons logic but styled for dark mode */}
            <div className="space-y-3">
              <button onClick={() => handlePaymentSelect('cash')} className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10">{t.cod}</button>
            </div>
          </div>
        </div>
      )}
      {rateModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#0f172a] rounded-3xl p-8 w-full max-w-sm border border-slate-800 text-center">
            <h3 className="text-white text-xl font-bold mb-6">{t.rateProfile}</h3>
            <div className="flex justify-center gap-3 mb-8">
              {[1, 2, 3, 4, 5].map(star => <button key={star} onClick={() => handleRate(star)}><Star size={36} className="text-yellow-500 fill-yellow-500 hover:scale-110 transition-transform" /></button>)}
            </div>
            <button onClick={() => setRateModalOpen(false)} className="text-slate-500 text-sm font-bold uppercase tracking-widest">{t.cancel}</button>
          </div>
        </div>
      )}
      {followModalOpen && <Suspense fallback={null}><FollowModal adminId={profileData.adminId} employeeId={profileData.id} themeColor={themeColor} onClose={() => setFollowModalOpen(false)} onSuccess={handleSmartFollowSuccess} t={t} /></Suspense>}
      {bookingModalOpen && <Suspense fallback={null}><BookingModal adminId={profileData.adminId} employeeId={profileData.id} themeColor={themeColor} onClose={() => setBookingModalOpen(false)} t={t} bookingSettings={profileData.bookingSettings} /></Suspense>}
      <ProfileChatbot profileData={{ ...profileData, products, portfolio }} themeColor={themeColor} t={t} />
    </div >
  );
  /* END OF PREMIUM PROFILE RENDER */
}
