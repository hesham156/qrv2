import React, { useState, useEffect, useRef, useMemo, lazy, Suspense, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, collection, setDoc, increment, getDocs, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
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
const StoryViewer = lazy(() => import('../../components/modals/StoryViewer'));
const EmployeeCardTemplate = lazy(() => import('../../components/templates/EmployeeCardTemplate'));

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
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [rateModalOpen, setRateModalOpen] = useState(false);
  // Enhanced Rating
  const [rateStep, setRateStep] = useState(1); // 1=stars, 2=comment+name
  const [rateStars, setRateStars] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  const [rateComment, setRateComment] = useState('');
  const [rateName, setRateName] = useState('');
  const [rateAnon, setRateAnon] = useState(true);
  const [rateLoading, setRateLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [stories, setStories] = useState([]);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const isLogged = useRef(false);
  const productsLoaded = useRef(false);
  const portfolioLoaded = useRef(false);
  const storiesLoaded = useRef(false);

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

  // ---------- Template Theme Config ----------
  const tpl = useMemo(() => {
    const configs = {
      classic: {
        // Dark navy — the current default
        outerBg: '#000000',
        glowOpacity: '0.20',
        cardBg: '#0f172a',
        cardBgSm: 'rgba(15,23,42,0.80)',
        cardBorder: '#1e293b',
        headerGradient: `radial-gradient(circle at 50% -20%, ${themeColor}, transparent 70%), radial-gradient(circle at 100% 100%, #1e293b, transparent 50%)`,
        avatarBorder: '#0f172a',
        avatarGlow: themeColor,
        textPrimary: '#ffffff',
        textSecondary: '#94a3b8',
        statPillBg: 'rgba(255,255,255,0.05)',
        statPillBorder: 'rgba(255,255,255,0.05)',
        statPillTextPrimary: '#ffffff',
        statPillTextSecondary: 'rgba(255,255,255,0.40)',
        tabBarBg: 'rgba(255,255,255,0.05)',
        tabBarBorder: 'rgba(255,255,255,0.05)',
        tabActiveBg: '#1e293b',
        tabActiveText: '#ffffff',
        tabInactiveText: '#64748b',
        actionBtnBg: 'rgba(255,255,255,0.05)',
        actionBtnBorder: 'rgba(255,255,255,0.10)',
        actionBtnText: '#e2e8f0',
        footerBg: 'rgba(0,0,0,0.20)',
        footerBorder: 'rgba(255,255,255,0.05)',
        footerText: '#475569',
        isDark: true,
      },
      modern: {
        // Pure black & white high contrast
        outerBg: '#0a0a0a',
        glowOpacity: '0.10',
        cardBg: '#111111',
        cardBgSm: 'rgba(17,17,17,0.92)',
        cardBorder: '#2a2a2a',
        headerGradient: `radial-gradient(circle at 50% 0%, rgba(255,255,255,0.08), transparent 70%)`,
        avatarBorder: '#111111',
        avatarGlow: '#ffffff',
        textPrimary: '#ffffff',
        textSecondary: '#999999',
        statPillBg: 'rgba(255,255,255,0.04)',
        statPillBorder: 'rgba(255,255,255,0.08)',
        statPillTextPrimary: '#ffffff',
        statPillTextSecondary: 'rgba(255,255,255,0.35)',
        tabBarBg: 'rgba(255,255,255,0.04)',
        tabBarBorder: 'rgba(255,255,255,0.08)',
        tabActiveBg: '#ffffff',
        tabActiveText: '#000000',
        tabInactiveText: '#666666',
        actionBtnBg: 'rgba(255,255,255,0.06)',
        actionBtnBorder: 'rgba(255,255,255,0.12)',
        actionBtnText: '#dddddd',
        footerBg: 'rgba(255,255,255,0.03)',
        footerBorder: 'rgba(255,255,255,0.06)',
        footerText: '#444444',
        isDark: true,
      },
      creative: {
        // Vibrant gradient — purple → pink background, white text
        outerBg: '#1a0533',
        glowOpacity: '0.35',
        cardBg: 'linear-gradient(160deg, #2d0a4f 0%, #4a0e6e 40%, #6b1a8a 70%, #8b1e7a 100%)',
        cardBgSm: 'rgba(45,10,79,0.92)',
        cardBorder: 'rgba(255,255,255,0.15)',
        headerGradient: `radial-gradient(circle at 30% -10%, rgba(255,100,200,0.6), transparent 60%), radial-gradient(circle at 80% 80%, rgba(100,0,200,0.4), transparent 50%)`,
        avatarBorder: '#2d0a4f',
        avatarGlow: '#e879f9',
        textPrimary: '#ffffff',
        textSecondary: 'rgba(255,220,255,0.70)',
        statPillBg: 'rgba(255,255,255,0.10)',
        statPillBorder: 'rgba(255,255,255,0.15)',
        statPillTextPrimary: '#ffffff',
        statPillTextSecondary: 'rgba(255,255,255,0.50)',
        tabBarBg: 'rgba(255,255,255,0.08)',
        tabBarBorder: 'rgba(255,255,255,0.12)',
        tabActiveBg: 'rgba(255,255,255,0.20)',
        tabActiveText: '#ffffff',
        tabInactiveText: 'rgba(255,255,255,0.50)',
        actionBtnBg: 'rgba(255,255,255,0.08)',
        actionBtnBorder: 'rgba(255,255,255,0.18)',
        actionBtnText: '#f0d0ff',
        footerBg: 'rgba(0,0,0,0.20)',
        footerBorder: 'rgba(255,255,255,0.08)',
        footerText: 'rgba(255,255,255,0.35)',
        isDark: true,
        useGradientCard: true,
      },
      elegant: {
        // Warm charcoal + gold accents
        outerBg: '#14110a',
        glowOpacity: '0.25',
        cardBg: '#1c1811',
        cardBgSm: 'rgba(28,24,17,0.92)',
        cardBorder: '#3d3020',
        headerGradient: `radial-gradient(circle at 50% -10%, rgba(212,175,55,0.35), transparent 65%), radial-gradient(circle at 90% 90%, rgba(80,60,20,0.4), transparent 50%)`,
        avatarBorder: '#1c1811',
        avatarGlow: '#d4af37',
        textPrimary: '#f5e6c8',
        textSecondary: '#a08050',
        statPillBg: 'rgba(212,175,55,0.08)',
        statPillBorder: 'rgba(212,175,55,0.15)',
        statPillTextPrimary: '#f5e6c8',
        statPillTextSecondary: 'rgba(212,175,55,0.60)',
        tabBarBg: 'rgba(212,175,55,0.06)',
        tabBarBorder: 'rgba(212,175,55,0.12)',
        tabActiveBg: 'rgba(212,175,55,0.18)',
        tabActiveText: '#f5e6c8',
        tabInactiveText: '#7a6040',
        actionBtnBg: 'rgba(212,175,55,0.07)',
        actionBtnBorder: 'rgba(212,175,55,0.18)',
        actionBtnText: '#d4af37',
        footerBg: 'rgba(0,0,0,0.25)',
        footerBorder: 'rgba(212,175,55,0.10)',
        footerText: '#5a4820',
        isDark: true,
      },
      professional: {
        // Clean white card with dark text — light mode
        outerBg: '#f1f5f9',
        glowOpacity: '0.08',
        cardBg: '#ffffff',
        cardBgSm: 'rgba(255,255,255,0.97)',
        cardBorder: '#e2e8f0',
        headerGradient: `radial-gradient(circle at 50% -20%, ${themeColor}30, transparent 70%), linear-gradient(180deg, ${themeColor}15 0%, transparent 100%)`,
        avatarBorder: '#ffffff',
        avatarGlow: themeColor,
        textPrimary: '#0f172a',
        textSecondary: '#64748b',
        statPillBg: '#f8fafc',
        statPillBorder: '#e2e8f0',
        statPillTextPrimary: '#0f172a',
        statPillTextSecondary: '#94a3b8',
        tabBarBg: '#f1f5f9',
        tabBarBorder: '#e2e8f0',
        tabActiveBg: '#ffffff',
        tabActiveText: '#0f172a',
        tabInactiveText: '#94a3b8',
        actionBtnBg: '#f8fafc',
        actionBtnBorder: '#e2e8f0',
        actionBtnText: '#334155',
        footerBg: '#f8fafc',
        footerBorder: '#e2e8f0',
        footerText: '#94a3b8',
        isDark: false,
      },
      minimal: {
        // Ultra-clean white minimal
        outerBg: '#ffffff',
        glowOpacity: '0.04',
        cardBg: '#ffffff',
        cardBgSm: '#ffffff',
        cardBorder: '#f0f0f0',
        headerGradient: `linear-gradient(180deg, ${themeColor}20 0%, transparent 100%)`,
        avatarBorder: '#ffffff',
        avatarGlow: themeColor,
        textPrimary: '#18181b',
        textSecondary: '#71717a',
        statPillBg: '#fafafa',
        statPillBorder: '#e4e4e7',
        statPillTextPrimary: '#18181b',
        statPillTextSecondary: '#a1a1aa',
        tabBarBg: '#f4f4f5',
        tabBarBorder: '#e4e4e7',
        tabActiveBg: '#ffffff',
        tabActiveText: '#18181b',
        tabInactiveText: '#a1a1aa',
        actionBtnBg: '#fafafa',
        actionBtnBorder: '#e4e4e7',
        actionBtnText: '#3f3f46',
        footerBg: '#fafafa',
        footerBorder: '#e4e4e7',
        footerText: '#a1a1aa',
        isDark: false,
      },
      modern_pro: {
        // Glassmorphism on rich dark-indigo gradient
        outerBg: '#06040f',
        glowOpacity: '0.30',
        cardBg: 'linear-gradient(145deg, rgba(30,10,70,0.95) 0%, rgba(15,5,40,0.98) 100%)',
        cardBgSm: 'rgba(20,8,55,0.85)',
        cardBorder: 'rgba(139,92,246,0.25)',
        headerGradient: `radial-gradient(circle at 30% -20%, rgba(139,92,246,0.6), transparent 60%), radial-gradient(circle at 80% 80%, rgba(59,130,246,0.3), transparent 50%)`,
        avatarBorder: 'rgba(20,8,55,0.9)',
        avatarGlow: '#8b5cf6',
        textPrimary: '#ffffff',
        textSecondary: 'rgba(196,181,253,0.70)',
        statPillBg: 'rgba(139,92,246,0.10)',
        statPillBorder: 'rgba(139,92,246,0.20)',
        statPillTextPrimary: '#ffffff',
        statPillTextSecondary: 'rgba(196,181,253,0.55)',
        tabBarBg: 'rgba(139,92,246,0.08)',
        tabBarBorder: 'rgba(139,92,246,0.20)',
        tabActiveBg: 'rgba(139,92,246,0.25)',
        tabActiveText: '#ffffff',
        tabInactiveText: 'rgba(196,181,253,0.50)',
        actionBtnBg: 'rgba(139,92,246,0.08)',
        actionBtnBorder: 'rgba(139,92,246,0.22)',
        actionBtnText: '#c4b5fd',
        footerBg: 'rgba(0,0,0,0.30)',
        footerBorder: 'rgba(139,92,246,0.15)',
        footerText: 'rgba(139,92,246,0.45)',
        isDark: true,
        useGradientCard: true,
      },
    };
    return configs[template] || configs.classic;
  }, [template, themeColor]);



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

        const empSnap = await getDoc(empRef);

        // Fetch owner/admin doc best-effort (may fail for visitors if rules restrict it)
        let owner = null;
        try {
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) owner = userSnap.data();
        } catch (_) { /* visitor can't read admin doc — that's fine */ }

        if (!empSnap.exists()) {
          if (!cancelled) {
            setError('لم يتم العثور على البطاقة');
            setLoading(false);
          }
          return;
        }

        const emp = empSnap.data();

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
          setData({
            ...emp,
            isLocked,
            showAppleWallet: owner?.showAppleWallet !== false,
            showGoogleWallet: owner?.showGoogleWallet !== false
          });
          setLoading(false);

          // ✅ analytics في الخلفية (مرة واحدة فقط)
          if (!isLogged.current) {
            isLogged.current = true;
            const hash = window.location.hash || '';
            const fromQR = hash.includes('src=qr');

            (async () => {
              try {
                // Fetch basic geo for stats (faster and doesn't block UI)
                let countryCode = 'Unknown';
                let lat = 0;
                let lng = 0;
                try {
                  // api.country.is is extremely lenient with CORS on localhost and AdBlockers
                  const res = await fetch('https://api.country.is/');
                  if (res.ok) {
                    const geo = await res.json();
                    countryCode = geo.country || 'Unknown';
                  }
                } catch (e) {
                  // silent catch to prevent console panic
                }
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

    fetchPaymentConfig();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // ---------- Load Stories ----------
  useEffect(() => {
    if (!profileData?.adminId || !profileData?.id) return;
    if (storiesLoaded.current) return;

    let cancelled = false;

    const loadStories = async () => {
      try {
        const storiesRef = collection(
          db, 'artifacts', appId, 'users', profileData.adminId,
          'employees', profileData.id, 'stories'
        );
        const snap = await getDocs(query(storiesRef, orderBy('createdAt', 'desc')));
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (!cancelled) {
          setStories(items);
          storiesLoaded.current = true;
        }
      } catch (e) {
        // silently fail — stories are optional
      }
    };

    loadStories();
    return () => { cancelled = true; };
  }, [profileData?.adminId, profileData?.id]);


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

  const handleUnfollowClick = async () => {
    if (!isFollowing) return;
    setIsFollowing(false);
    localStorage.removeItem(`followed_${profileData.id}`);

    setData(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        followers: Math.max(0, (prev.stats?.followers || 0) - 1)
      }
    }));
    trackClick('unfollow');

    try {
      const empRef = doc(db, 'artifacts', appId, 'users', profileData.adminId, 'employees', profileData.id);
      await setDoc(empRef, { stats: { followers: increment(-1) } }, { merge: true });
    } catch (e) {}
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

  // Load reviews
  const loadReviews = useCallback(async () => {
    if (!profileData?.adminId || !profileData?.id) return;
    try {
      const reviewsRef = collection(db, 'artifacts', appId, 'users', profileData.adminId, 'employees', profileData.id, 'reviews');
      const snap = await getDocs(query(reviewsRef, orderBy('createdAt', 'desc'), limit(20)));
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.warn('Reviews load error', e); }
  }, [profileData?.adminId, profileData?.id]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const openRateModal = () => {
    const alreadyRated = localStorage.getItem(`rated_${profileData.id}`);
    if (alreadyRated) { alert(t.rateAlreadyDone || 'You already rated this!'); return; }
    setRateStep(1); setRateStars(0); setHoverStar(0);
    setRateComment(''); setRateName(''); setRateAnon(true);
    setRateModalOpen(true);
  };

  const handleRateSubmit = async () => {
    if (!rateStars) return;
    setRateLoading(true);
    try {
      const empRef = doc(db, 'artifacts', appId, 'users', profileData.adminId, 'employees', profileData.id);
      const reviewsRef = collection(db, 'artifacts', appId, 'users', profileData.adminId, 'employees', profileData.id, 'reviews');
      await addDoc(reviewsRef, {
        stars: rateStars,
        comment: rateComment.trim(),
        authorName: rateAnon ? '' : rateName.trim(),
        isAnonymous: rateAnon,
        createdAt: serverTimestamp()
      });
      // Update aggregate stats
      await setDoc(empRef, { stats: { rating: increment(rateStars), ratingCount: increment(1) } }, { merge: true });
      // Optimistic update
      setData(prev => ({ ...prev, stats: { ...prev.stats, rating: (prev.stats?.rating || 0) + rateStars, ratingCount: (prev.stats?.ratingCount || 0) + 1 } }));
      localStorage.setItem(`rated_${profileData.id}`, '1');
      setRateModalOpen(false);
      await loadReviews();
    } catch (e) { console.error('Rate error', e); }
    finally { setRateLoading(false); }
  };

  /* --- PREMIUM UI COMPONENTS --- */
  const btnBase = "flex items-center justify-center gap-2 rounded-2xl font-bold transition-all active:scale-[0.95] duration-200 outline-none select-none";

  // Card shell — driven by template config
  const softCard = `overflow-hidden w-full max-w-md mx-auto relative z-10 min-h-screen sm:min-h-[85vh] sm:h-auto flex flex-col shadow-2xl sm:rounded-[40px] border-0 sm:border`;

  const palette = useMemo(() => ({
    primary: themeColor,
    ring: themeColor,
    glow: `0 0 20px ${themeColor}66`,
    glass: "bg-white/5 backdrop-blur-lg border border-white/10"
  }), [themeColor]);

  // Stat Pill — template-aware
  const StatPill = ({ icon, label, value }) => (
    <motion.div
      whileHover={{ y: -2 }}
      className="flex flex-col items-center justify-center p-3 rounded-2xl backdrop-blur-md flex-1 min-w-[80px]"
      style={{ background: tpl.statPillBg, border: `1px solid ${tpl.statPillBorder}` }}
    >
      <div className="mb-1" style={{ color: tpl.statPillTextSecondary }}>{icon}</div>
      <div className="text-xl font-black tracking-tight" style={{ color: tpl.statPillTextPrimary }}>{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: tpl.statPillTextSecondary }}>{label}</div>
    </motion.div>
  );

  /* --- HEADER VIEW (Clean, Taller) --- */
  const HeaderView = useMemo(() => (
    <div className="relative h-56 overflow-hidden">
      {/* Base bg */}
      <div className="absolute inset-0" style={{ background: tpl.outerBg }} />

      {/* Template-specific gradient mesh */}
      <div
        className="absolute inset-0 opacity-70"
        style={{ background: tpl.headerGradient }}
      />

      {/* Subtle texture for dark templates */}
      {tpl.isDark && (
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
      )}

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
        <div
          className={`px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-2 ${data?.isVerified ? 'text-blue-300' : ''}`}
          style={{
            background: tpl.isDark ? (data?.isVerified ? 'rgba(59,130,246,0.20)' : 'rgba(255,255,255,0.10)') : 'rgba(0,0,0,0.08)',
            border: `1px solid ${tpl.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'}`,
            color: tpl.isDark ? (data?.isVerified ? '#93c5fd' : 'rgba(255,255,255,0.70)') : (data?.isVerified ? '#2563eb' : '#64748b'),
          }}
        >
          <ShieldCheck size={14} className={data?.isVerified ? 'text-blue-400' : ''} />
          <span className="text-[10px] font-bold uppercase tracking-wider">{t?.verified || "Verified"}</span>
        </div>

        <button
          onClick={toggleLang}
          className="w-9 h-9 flex items-center justify-center rounded-full backdrop-blur-md transition-all font-bold text-xs"
          style={{
            background: tpl.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)',
            border: `1px solid ${tpl.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'}`,
            color: tpl.textPrimary,
          }}
        >
          {L === 'ar' ? 'En' : 'ع'}
        </button>
      </div>
    </div>
  ), [data?.bgVideoUrl, t, toggleLang, L, toText, data?.isVerified, tpl]);

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
        <div className="absolute inset-0 rounded-[2.5rem] blur-2xl opacity-60" style={{ backgroundColor: tpl.avatarGlow }} />

        {/* Avatar Container with Instagram Story Ring */}
        <button
          onClick={() => stories.length > 0 && setStoryViewerOpen(true)}
          className={`relative rounded-full flex items-center justify-center transition-transform ${stories.length > 0 ? 'cursor-pointer hover:scale-105 p-1' : 'cursor-default'}`}
          style={{ background: stories.length > 0 ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' : 'transparent' }}
        >
          <div className={`w-36 h-36 border-4 shadow-2xl relative overflow-hidden flex items-center justify-center group ${stories.length > 0 ? 'rounded-full' : 'rounded-[2.5rem]'}`} style={{ borderColor: tpl.avatarBorder, backgroundColor: tpl.isDark ? '#1e293b' : '#f1f5f9' }}>
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
        </button>
      </motion.div>
    </div>
  ), [data?.profileVideoUrl, data?.photoUrl, nameText, themeColor, tpl, toText, stories.length]);

  const ActionButton = ({ icon, label, onClick, href, className = "", targetBlank = false, highlight = false }) => {
    const Wrapper = href ? motion.a : motion.button;
    const props = href ? { href, target: targetBlank ? "_blank" : undefined, rel: targetBlank ? "noreferrer" : undefined } : { onClick };

    return (
      <Wrapper
        {...props}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full ${btnBase} py-4 px-4 relative overflow-hidden group ${highlight ? 'text-white border-0 shadow-lg' : ''} ${className}`}
        style={highlight
          ? { backgroundColor: themeColor, boxShadow: palette.glow }
          : { background: tpl.actionBtnBg, border: `1px solid ${tpl.actionBtnBorder}`, color: tpl.actionBtnText }
        }
      >
        {highlight && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
        )}
        <span style={highlight ? { color: '#ffffff' } : { color: tpl.actionBtnText }}>{icon}</span>
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
          <button
            onClick={handleUnfollowClick}
            className={`w-full ${btnBase} px-4 py-4 text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors group`}
          >
            <Heart size={18} className="fill-emerald-500 text-emerald-500 group-hover:hidden" />
            <span className="group-hover:hidden">{t.following || "Following"}</span>
            <Heart size={18} className="hidden group-hover:block text-rose-500" />
            <span className="hidden group-hover:block">{t.unfollow || (L === 'ar' ? 'إلغاء المتابعة' : 'Unfollow')}</span>
          </button>
        )}

        {(data?.showAppleWallet !== false || data?.showGoogleWallet !== false) && (
          <div className="grid grid-cols-2 gap-3">
            {data?.showAppleWallet !== false && (
              <button
                onClick={() => setShowWalletModal('apple')}
                className={`w-full ${btnBase} bg-black text-white px-4 py-3`}
              >
                <Wallet size={18} />
                <span className="text-xs font-extrabold">{t.apple || "Apple"}</span>
              </button>
            )}

            {data?.showGoogleWallet !== false && (
              <button
                onClick={() => setShowWalletModal('google')}
                className={`w-full ${btnBase} bg-white text-slate-900 border border-slate-200 px-4 py-3`}
              >
                <CreditCard size={18} style={{ color: themeColor }} />
                <span className="text-xs font-extrabold">{t.google || "Google"}</span>
              </button>
            )}
          </div>
        )}

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <motion.div variants={itemVariants} className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-black text-white/70 uppercase tracking-widest">{t.reviewsTitle || 'Reviews'}</h4>
              {reviews.length > 3 && (
                <button onClick={() => setShowAllReviews(v => !v)} className="text-[10px] font-bold text-white/40 hover:text-white/70 transition-colors uppercase tracking-widest">
                  {showAllReviews ? (t.cancel || 'Less') : (t.viewAllReviews || 'View All')}
                </button>
              )}
            </div>
            <div className="space-y-3">
              {(showAllReviews ? reviews : reviews.slice(0, 3)).map(rv => (
                <motion.div
                  key={rv.id}
                  variants={itemVariants}
                  className="bg-white/5 border border-white/8 rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={12} className={s <= rv.stars ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'} />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-white/30">
                      {rv.isAnonymous || !rv.authorName ? (t.anonymous || 'Anonymous') : rv.authorName}
                    </span>
                  </div>
                  {rv.comment && (
                    <p className="text-xs text-white/60 leading-relaxed">{rv.comment}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

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
  ), [nameText, jobTitleText, companyText, data, themeColor, t, trackClick, btnBase, palette.glow, downloadVCard, template, toText, containerVariants, itemVariants, reviews, showAllReviews, setShowAllReviews, L, handleFollowClick, handleUnfollowClick, isFollowing]);

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
  ), [products, t, themeColor, palette.glow, btnBase, handleBuyProduct, toText, containerVariants, itemVariants]);

  /* --- PORTFOLIO TAB VIEW (Dark) --- */
  const PortfolioTabView = useMemo(() => {
    const categories = [
      { id: 'all', label: t.catAll || (L === 'ar' ? 'الكل' : 'All') },
      { id: 'development', label: t.catDev || (L === 'ar' ? 'تطوير' : 'Dev') },
      { id: 'design', label: t.catDesign || (L === 'ar' ? 'تصميم' : 'Design') },
      { id: 'video', label: t.catVideo || (L === 'ar' ? 'فيديو' : 'Video') },
      { id: 'marketing', label: t.catMarketing || (L === 'ar' ? 'تسويق' : 'Marketing') },
      { id: 'other', label: t.catOther || (L === 'ar' ? 'أخرى' : 'Other') }
    ];

    const filteredItems = portfolio.filter(item =>
      portfolioCategory === 'all' ? true : (item.category || 'other') === portfolioCategory
    );

    const getEmbedUrl = (url) => {
      if (!url) return null;
      // eslint-disable-next-line no-useless-escape
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
  }, [portfolio, portfolioCategory, t, themeColor, palette.glow, btnBase, trackClick, toText, L, containerVariants, itemVariants, profileData.adminId, profileData.id]);




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
    );
  }

  // ===================== EMPLOYEE CARD TEMPLATE =====================
  if (template === 'employee_card') {
    return (
      <>
        <Suspense fallback={<ProfileSkeleton />}>
          <EmployeeCardTemplate 
            data={data}
            t={t}
            L={L}
            toText={toText}
            trackClick={trackClick}
            downloadVCard={downloadVCard}
            themeColor={themeColor}
            reviews={reviews}
            stories={stories}
            products={products}
            portfolio={portfolio}
            handleBuyProduct={handleBuyProduct}
            setBookingModalOpen={setBookingModalOpen}
            setRateModalOpen={setRateModalOpen}
            isFollowing={isFollowing}
            handleFollowClick={handleFollowClick}
            handleUnfollowClick={handleUnfollowClick}
            setStoryViewerOpen={setStoryViewerOpen}
          />
        </Suspense>
        {followModalOpen && <Suspense fallback={null}><FollowModal adminId={profileData.adminId} employeeId={profileData.id} themeColor={themeColor} onClose={() => setFollowModalOpen(false)} onSuccess={handleSmartFollowSuccess} t={t} /></Suspense>}
        {bookingModalOpen && <Suspense fallback={null}><BookingModal adminId={profileData.adminId} employeeId={profileData.id} themeColor={themeColor} onClose={() => setBookingModalOpen(false)} t={t} bookingSettings={profileData.bookingSettings} /></Suspense>}
        {rateModalOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm" onClick={() => setRateModalOpen(false)}>
            <div className="bg-[#0f172a] rounded-3xl w-full max-w-sm border border-slate-800 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="h-1 bg-white/5"><div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" style={{ width: rateStep === 1 ? '50%' : '100%' }} /></div>
              <div className="p-7">
                {rateStep === 1 ? (
                  <>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1 text-center">{t.rateStepOf ? `1 ${t.rateStepOf} 2` : '1 of 2'}</p>
                    <h3 className="text-white text-lg font-black mb-7 text-center">{t.rateStep1 || 'How was your experience?'}</h3>
                    <div className="flex justify-center gap-2 mb-8">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} onMouseEnter={() => setHoverStar(star)} onMouseLeave={() => setHoverStar(0)} onClick={() => setRateStars(star)} className="transition-transform duration-150 hover:scale-125 active:scale-110">
                          <Star size={42} className={(star <= (hoverStar || rateStars) ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 'text-white/20') + ' transition-all duration-150'} />
                        </button>
                      ))}
                    </div>
                    <button onClick={() => rateStars > 0 && setRateStep(2)} disabled={!rateStars} className="w-full py-3.5 rounded-2xl font-black text-sm transition-all disabled:opacity-30 disabled:pointer-events-none text-white" style={{ backgroundColor: themeColor }}>{t.rateNext || 'Next'} →</button>
                    <button onClick={() => setRateModalOpen(false)} className="w-full mt-3 text-slate-600 text-xs font-bold uppercase tracking-widest">{t.cancel}</button>
                  </>
                ) : (
                  <>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1 text-center">{t.rateStepOf ? `2 ${t.rateStepOf} 2` : '2 of 2'}</p>
                    <h3 className="text-white text-lg font-black mb-1 text-center">{t.rateStep2 || 'Tell us more'}</h3>
                    <div className="flex justify-center gap-1 mb-5">{[1,2,3,4,5].map(s => <Star key={s} size={18} className={s <= rateStars ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'} />)}</div>
                    <textarea value={rateComment} onChange={e => setRateComment(e.target.value)} rows={3} placeholder={t.rateCommentPlaceholder || 'Share your experience...'} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none outline-none focus:border-white/30 transition-colors mb-3" />
                    {!rateAnon && <input type="text" value={rateName} onChange={e => setRateName(e.target.value)} placeholder={t.rateNamePlaceholder || 'Your name'} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-white/30 transition-colors mb-3" />}
                    <button type="button" onClick={() => setRateAnon(v => !v)} className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border mb-5 transition-all ${rateAnon ? 'bg-white/5 border-white/10 text-white/60' : 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'}`}>
                      <span className="text-xs font-bold">{rateAnon ? (t.rateAnonymous || 'Post Anonymously') : (t.rateWithName || 'Post with Name')}</span>
                      <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${rateAnon ? 'bg-white/20' : 'bg-indigo-500'}`}><span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${rateAnon ? 'translate-x-0' : 'translate-x-5'}`} /></div>
                    </button>
                    <button onClick={handleRateSubmit} disabled={rateLoading} className="w-full py-3.5 rounded-2xl font-black text-sm text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: themeColor }}>
                      {rateLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (t.rateSubmit || 'Submit Review')}
                    </button>
                    <button onClick={() => setRateStep(1)} className="w-full mt-3 text-slate-600 text-xs font-bold uppercase tracking-widest">← {t.cancel}</button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        {storyViewerOpen && stories.length > 0 && (
          <Suspense fallback={null}>
            <StoryViewer
              stories={stories}
              adminId={profileData.adminId}
              employeeId={profileData.id}
              onClose={() => setStoryViewerOpen(false)}
              products={products}
              trackLead={(type, id) => trackClick(`story_${type}_${id}`)}
              t={t}
            />
          </Suspense>
        )}
      </>
    );
  }

  // ===================== PORTFOLIO SIDEBAR TEMPLATE =====================
  if (template === 'portfolio') {
    const accent = themeColor;
    const socialLinks = [
      { key: 'facebook', icon: <Facebook size={18} />, href: toText(data.facebook) },
      { key: 'twitter', icon: <Twitter size={18} />, href: toText(data.twitter) },
      { key: 'instagram', icon: <Instagram size={18} />, href: toText(data.instagram) },
      { key: 'linkedin', icon: <Linkedin size={18} />, href: toText(data.linkedin) },
      { key: 'youtube', icon: <Youtube size={18} />, href: toText(data.youtube) },
    ].filter(s => s.href);

    const navItems = [
      { id: 'info', label: t.tabInfo || (L === 'ar' ? 'المعلومات' : 'Home'), icon: <Sparkles size={14} /> },
      ...(products.length > 0 ? [{ id: 'products', label: t.tabProducts || (L === 'ar' ? 'المنتجات' : 'Services'), icon: <ShoppingBag size={14} /> }] : []),
      ...(portfolio.length > 0 ? [{ id: 'portfolio', label: t.portfolioTitle || (L === 'ar' ? 'أعمالي' : 'Projects'), icon: <Briefcase size={14} /> }] : []),
    ];

    return (
      <div
        dir={L === 'ar' ? 'rtl' : 'ltr'}
        lang={L}
        className="profile-view-container min-h-screen flex"
        style={{ background: '#eef0f8' }}
      >
        {/* ---- SIDEBAR ---- */}
        <motion.aside variants={containerVariants} initial="hidden" animate="show" className="hidden md:flex w-56 min-h-screen bg-white flex-col items-center py-8 shadow-lg shrink-0 sticky top-0 h-screen overflow-y-auto" style={{ [L === 'ar' ? 'borderLeft' : 'borderRight']: `3px solid ${accent}20` }}>

          {/* Avatar */}
          <motion.div variants={itemVariants} className="mb-4" style={{ padding: '3px', borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, #a855f7)` }}>
            <div style={{ padding: '3px', borderRadius: '50%', background: '#fff' }}>
              <div className="w-24 h-24 rounded-full overflow-hidden">
                {data.photoUrl ? (
                  <img src={toText(data.photoUrl)} className="w-full h-full object-cover" alt={nameText} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-black" style={{ background: `${accent}20`, color: accent }}>
                    {nameText?.charAt(0) || '?'}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Name */}
          <motion.h2 variants={itemVariants} className="text-base font-black text-slate-800 text-center mb-6 px-2">
            {nameText}<span style={{ color: accent }}>.</span>
          </motion.h2>

          {/* Nav Items */}
          <motion.nav variants={itemVariants} className="w-full px-3 space-y-2 mb-6">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(item.id)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-black transition-all"
                  style={isActive
                    ? { background: `linear-gradient(90deg, ${accent}, #a855f7)`, color: '#fff', boxShadow: `0 4px 14px ${accent}50` }
                    : { background: '#f1f5f9', color: '#64748b' }
                  }
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: isActive ? 'rgba(255,255,255,0.6)' : accent }} />
                  <span className="flex-1 text-center uppercase tracking-widest">{item.label}</span>
                  <span>{item.icon}</span>
                </motion.button>
              );
            })}
          </motion.nav>

          {/* Social Icons */}
          {socialLinks.length > 0 && (
            <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-2 px-3 mb-6">
              {socialLinks.map(s => (
                <motion.a 
                  key={s.key} 
                  href={s.href} 
                  target="_blank" 
                  rel="noreferrer"
                  onClick={() => trackClick(s.key)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                  style={{ background: `${accent}15`, color: accent }}
                >
                  {s.icon}
                </motion.a>
              ))}
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="mt-auto text-[9px] text-slate-400 text-center px-2">Powered by DigiCard</motion.div>
        </motion.aside>

        {/* ---- MAIN CONTENT ---- */}
        <main className="flex-1 relative overflow-y-auto min-h-screen pb-24 md:pb-0">
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `radial-gradient(${accent}22 1px, transparent 1px)`, backgroundSize: '28px 28px' }} />
          {/* Lang + mobile top bar */}
          <div className="flex items-center justify-between px-4 pt-4 pb-0 md:hidden">
            <button 
              onClick={() => stories.length > 0 && setStoryViewerOpen(true)}
              className={`flex items-center gap-2 ${stories.length > 0 ? 'cursor-pointer hover:scale-105 transition-transform' : 'cursor-default'}`}
            >
              <div style={{ padding: stories.length > 0 ? '2.5px' : '0', borderRadius: '50%', background: stories.length > 0 ? 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' : 'transparent' }}>
                <div style={{ padding: stories.length > 0 ? '2px' : '0', borderRadius: '50%', background: '#f8fafc' }}>
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200">
                    {data.photoUrl ? (
                      <img src={toText(data.photoUrl)} className="w-full h-full object-cover" alt={nameText} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-base font-black" style={{ background: `${accent}20`, color: accent }}>{nameText?.charAt(0) || '?'}</div>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-xs font-black text-slate-700">{nameText}</span>
            </button>
            <button onClick={toggleLang} className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow" style={{ background: '#fff', border: `1.5px solid ${accent}30`, color: accent }}>
              {L === 'ar' ? 'En' : 'ع'}
            </button>
          </div>

          <div className="hidden md:block absolute top-5 z-50" style={{ [L === 'ar' ? 'left' : 'right']: '20px' }}>
            <button onClick={toggleLang} className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow" style={{ background: '#fff', border: `1.5px solid ${accent}30`, color: accent }}>
              {L === 'ar' ? 'En' : 'ع'}
            </button>
          </div>

          <div className="relative z-10 p-6 pt-14 md:px-12 max-w-5xl mx-auto w-full">
            {activeTab === 'info' && (
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">

                {/* Two-Column Desktop Layout */}
                <div className={`flex flex-col md:flex-row items-center md:items-start gap-8 lg:gap-14 w-full`}>
                  
                  {/* Column 1: Info and Buttons */}
                  <div className="flex-1 min-w-0 w-full flex flex-col items-center md:items-start text-center md:text-start">
                    <motion.p variants={itemVariants} className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t.hiMyName || (L === 'ar' ? 'مرحباً، أنا' : 'Hi, My Name Is')}</motion.p>
                    <motion.h1 variants={itemVariants} className="text-3xl md:text-5xl font-black text-slate-800 leading-tight mb-1">{nameText}<span style={{ color: accent }}>.</span></motion.h1>
                    <motion.h2 variants={itemVariants} className="text-lg md:text-xl font-bold mb-4" style={{ color: accent }}>{jobTitleText}</motion.h2>
                    {(data.bio_ar || data.bio_en) && (
                      <motion.p variants={itemVariants} className="text-sm md:text-base text-slate-500 leading-relaxed mb-6 max-w-xl">{L === 'ar' ? toText(data.bio_ar) : toText(data.bio_en)}</motion.p>
                    )}

                    {/* Stats */}
                    <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center md:justify-start gap-6 md:gap-8 mb-8 w-full">
                      {[
                        { value: totalViews, label: t?.views || (L === 'ar' ? 'زيارة' : 'Views') },
                        { value: data?.stats?.followers || 0, label: t?.followers || (L === 'ar' ? 'متابعين' : 'Fans'), onClick: handleFollowClick },
                        { value: data?.stats?.ratingCount > 0 ? (data.stats.rating / data.stats.ratingCount).toFixed(1) : '5.0', label: t?.rating || (L === 'ar' ? 'التقييم' : 'Rating'), onClick: openRateModal },
                      ].map((s, i) => (
                        <div key={i} className={`text-center ${s.onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`} onClick={s.onClick}>
                          <div className="text-2xl md:text-3xl font-black" style={{ color: accent }}>{s.value}</div>
                          <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">{s.label}</div>
                        </div>
                      ))}
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center md:justify-start gap-3 w-full max-w-2xl mb-3">
                      {data.phone && (
                        <motion.a href={`tel:${toText(data.phone)}`} onClick={() => trackClick('call')}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-shadow border-2"
                          style={{ borderColor: accent, color: accent, background: '#fff' }}>
                          <Phone size={15} />{t.call || 'Call'}
                        </motion.a>
                      )}
                      {data.whatsapp && (
                        <motion.a href={`https://wa.me/${toText(data.whatsapp)}`} target="_blank" rel="noreferrer" onClick={() => trackClick('whatsapp')}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-shadow border-2"
                          style={{ borderColor: '#22c55e', color: '#22c55e', background: '#fff' }}>
                          <MessageCircle size={15} />WhatsApp
                        </motion.a>
                      )}
                      {data.email && (
                        <motion.a href={`mailto:${toText(data.email)}`} onClick={() => trackClick('email')}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-shadow border-2"
                          style={{ borderColor: accent, color: accent, background: '#fff' }}>
                          <Mail size={15} />{t.emailAction || 'Email'}
                        </motion.a>
                      )}
                      {data.website && (
                        <motion.a href={toText(data.website)} target="_blank" rel="noreferrer" onClick={() => trackClick('website')}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-shadow border-2"
                          style={{ borderColor: accent, color: accent, background: '#fff' }}>
                          <Globe size={15} />{t.websiteAction || 'Website'}
                        </motion.a>
                      )}
                      {data.cvUrl && (
                        <motion.a href={toText(data.cvUrl)} target="_blank" rel="noreferrer" onClick={() => trackClick('download_cv')}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex-[2] min-w-[200px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white transition-shadow shadow-lg"
                          style={{ background: `linear-gradient(90deg, ${accent}, #a855f7)`, boxShadow: `0 4px 15px ${accent}40` }}>
                          <FileText size={15} />{t.downloadCv || 'CV'}
                        </motion.a>
                      )}
                    </motion.div>

                    {/* Save Contact + Booking + Rate row */}
                    <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center md:justify-start gap-3 w-full max-w-2xl">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setLeadInterest(''); setIsLeadFormOpen(true); }}
                        className="flex-1 min-w-[170px] flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white shadow-lg transition-shadow"
                        style={{ background: `linear-gradient(90deg, ${accent}, #a855f7)`, boxShadow: `0 4px 15px ${accent}40` }}
                      >
                        <UserPlus size={16} />{t.exchangeContact || 'Save Contact'}
                      </motion.button>
                      {data.bookingUrl !== undefined && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setBookingModalOpen(true)}
                          className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white shadow-lg transition-shadow"
                          style={{ background: `linear-gradient(90deg, #f97316, #ef4444)`, boxShadow: `0 4px 15px #f9731640` }}
                        >
                          <Calendar size={16} />{t.bookingTitle || 'Book'}
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={openRateModal}
                        className="flex-1 min-w-[100px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold border-2 transition-shadow"
                        style={{ borderColor: '#f59e0b', color: '#f59e0b', background: '#fff' }}
                      >
                        <Star size={15} className="fill-yellow-400 text-yellow-400" />
                        {data?.stats?.ratingCount > 0 ? (data.stats.rating / data.stats.ratingCount).toFixed(1) : '5.0'}
                      </motion.button>
                      {!isFollowing ? (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleFollowClick}
                          className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold border-2 transition-shadow"
                          style={{ borderColor: '#ec4899', color: '#ec4899', background: '#fff' }}
                        >
                          <Heart size={15} />{t.follow || (L === 'ar' ? 'متابعة' : 'Follow')}
                        </motion.button>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleUnfollowClick}
                          className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white shadow-lg transition-shadow"
                          style={{ background: '#ec4899' }}
                        >
                          <Heart size={15} className="fill-white" />{t.unfollow || (L === 'ar' ? 'إلغاء المتابعة' : 'Unfollow')}
                        </motion.button>
                      )}
                    </motion.div>
                  </div>

                  {/* Photo — Column 2 */}
                  {(data.photoUrl || nameText) && (
                    <motion.button 
                      variants={itemVariants}
                      whileHover={stories.length > 0 ? { scale: 1.05 } : {}}
                      whileTap={stories.length > 0 ? { scale: 0.95 } : {}}
                      onClick={() => stories.length > 0 && setStoryViewerOpen(true)}
                      className={`shrink-0 hidden md:block ${stories.length > 0 ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <div style={{ background: stories.length > 0 ? 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' : `linear-gradient(135deg, ${accent}, #a855f7)`, borderRadius: stories.length > 0 ? '50%' : '60% 40% 55% 45% / 45% 55% 45% 55%', padding: '5px', width: 220, height: 220 }}>
                        <div style={{ padding: stories.length > 0 ? '4px' : '0', borderRadius: stories.length > 0 ? '50%' : '58% 42% 53% 47% / 43% 53% 47% 57%', background: '#fff', width: '100%', height: '100%' }}>
                          <div className="w-full h-full overflow-hidden" style={{ borderRadius: stories.length > 0 ? '50%' : '58% 42% 53% 47% / 43% 53% 47% 57%' }}>
                            {data.photoUrl ? (
                              <img src={toText(data.photoUrl)} className="w-full h-full object-cover" alt={nameText} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-7xl font-black bg-slate-100 text-slate-400">{nameText?.charAt(0) || '?'}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  )}
                </div>

                {/* Reviews preview */}
                {reviews.length > 0 && (
                  <motion.div variants={itemVariants} className="max-w-4xl">
                    <h3 className="text-sm font-black text-slate-700 mb-3 flex items-center gap-2">
                      <Star size={14} className="text-yellow-400 fill-yellow-400" />
                      {t.reviews || (L === 'ar' ? 'التقييمات' : 'Reviews')}
                    </h3>
                    <div className="space-y-2">
                      {(showAllReviews ? reviews : reviews.slice(0, 2)).map(r => (
                        <div key={r.id} className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm transition-transform hover:scale-[1.01]">
                          <div className="flex items-center gap-1 mb-1">
                            {[1,2,3,4,5].map(s => <Star key={s} size={11} className={s <= r.stars ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'} />)}
                            <span className="text-[10px] text-slate-400 ms-1">{r.isAnonymous ? (t.anonymous || (L === 'ar' ? 'مجهول' : 'Anonymous')) : r.authorName}</span>
                          </div>
                          {r.comment && <p className="text-xs text-slate-500 line-clamp-2">{r.comment}</p>}
                        </div>
                      ))}
                      {reviews.length > 2 && (
                        <button onClick={() => setShowAllReviews(v => !v)} className="text-xs font-bold transition-opacity hover:opacity-80" style={{ color: accent }}>
                          {showAllReviews ? (t.showLess || (L === 'ar' ? 'عرض أقل' : 'Show less')) : `+ ${reviews.length - 2} ${t.moreReviews || (L === 'ar' ? 'تقييمات أخرى' : 'more reviews')}`}
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'products' && (
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-2xl">
                <motion.h2 variants={itemVariants} className="text-2xl font-black text-slate-800 mb-6">{t.tabProducts}<span style={{ color: accent }}>.</span></motion.h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {products.map(prod => (
                    <motion.div variants={itemVariants} key={prod.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-all">
                      {prod.imageUrl && <img src={toText(prod.imageUrl)} className="w-full h-36 object-cover" alt="" />}
                      <div className="p-4">
                        <h3 className="font-black text-slate-800 mb-1">{toText(prod.name)}</h3>
                        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{toText(prod.description)}</p>
                        <button onClick={() => handleBuyProduct(prod)} className="text-xs font-black px-4 py-2 rounded-full text-white" style={{ background: `linear-gradient(90deg, ${accent}, #a855f7)` }}>{t.buyNow || (L === 'ar' ? 'طلب' : 'Order')}</button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
            {activeTab === 'portfolio' && (
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-2xl">
                <motion.h2 variants={itemVariants} className="text-2xl font-black text-slate-800 mb-6">{t.portfolioTitle}<span style={{ color: accent }}>.</span></motion.h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {portfolio.map(item => (
                    <motion.div variants={itemVariants} key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                      {item.imageUrl && <div className="h-40 overflow-hidden"><img src={toText(item.imageUrl)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" /></div>}
                      <div className="p-4">
                        <h3 className="font-black text-slate-800 mb-1">{toText(item.title)}</h3>
                        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{toText(item.description)}</p>
                        {item.link && <a href={toText(item.link)} target="_blank" rel="noreferrer" className="text-xs font-black px-4 py-2 rounded-full text-white inline-flex items-center gap-1" style={{ background: `linear-gradient(90deg, ${accent}, #a855f7)` }}><ExternalLink size={12} />{t.viewProject || (L === 'ar' ? 'عرض' : 'View')}</a>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Mobile bottom nav */}
          {navItems.length > 1 && (
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-[60] pb-[env(safe-area-inset-bottom,0px)]">
              {navItems.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className="flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-black transition-all"
                    style={isActive ? { color: accent } : { color: '#94a3b8' }}
                  >
                    {item.icon}
                    <span className="uppercase tracking-widest">{item.label}</span>
                    {isActive && <span className="w-4 h-0.5 rounded-full" style={{ background: accent }} />}
                  </button>
                );
              })}
            </div>
          )}
        </main>

        {isLeadFormOpen && <Suspense fallback={null}><LeadCaptureModal adminId={profileData.adminId} employeeId={profileData.id} themeColor={accent} onClose={() => setIsLeadFormOpen(false)} onSuccess={() => trackClick('exchange_contact')} t={t} initialInterest={leadInterest} /></Suspense>}
        {storyViewerOpen && stories.length > 0 && <Suspense fallback={null}><StoryViewer stories={stories} adminId={profileData.adminId} employeeId={profileData.id} onClose={() => setStoryViewerOpen(false)} products={products} trackLead={(type, id) => trackClick(`story_${type}_${id}`)} t={t} /></Suspense>}
        {bookingModalOpen && <Suspense fallback={null}><BookingModal adminId={profileData.adminId} employeeId={profileData.id} themeColor={accent} onClose={() => setBookingModalOpen(false)} t={t} bookingSettings={data?.bookingSettings} /></Suspense>}
        {followModalOpen && <Suspense fallback={null}><FollowModal adminId={profileData.adminId} employeeId={profileData.id} themeColor={accent} onClose={() => setFollowModalOpen(false)} onSuccess={handleSmartFollowSuccess} t={t} /></Suspense>}

        {/* Rating Modal */}
        {rateModalOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm" onClick={() => setRateModalOpen(false)}>
            <div className="bg-[#0f172a] rounded-3xl w-full max-w-sm border border-slate-800 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="h-1 bg-white/5">
                <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" style={{ width: rateStep === 1 ? '50%' : '100%' }} />
              </div>
              <div className="p-7">
                {rateStep === 1 ? (
                  <>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1 text-center">{t.rateStepOf ? `1 ${t.rateStepOf} 2` : '1 of 2'}</p>
                    <h3 className="text-white text-lg font-black mb-7 text-center">{t.rateStep1 || 'How was your experience?'}</h3>
                    <div className="flex justify-center gap-2 mb-8">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} onMouseEnter={() => setHoverStar(star)} onMouseLeave={() => setHoverStar(0)} onClick={() => setRateStars(star)} className="transition-transform duration-150 hover:scale-125 active:scale-110">
                          <Star size={42} className={(star <= (hoverStar || rateStars) ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 'text-white/20') + ' transition-all duration-150'} />
                        </button>
                      ))}
                    </div>
                    <button onClick={() => rateStars > 0 && setRateStep(2)} disabled={!rateStars} className="w-full py-3.5 rounded-2xl font-black text-sm transition-all disabled:opacity-30 disabled:pointer-events-none text-white" style={{ backgroundColor: accent }}>
                      {t.rateNext || 'Next'} →
                    </button>
                    <button onClick={() => setRateModalOpen(false)} className="w-full mt-3 text-slate-600 text-xs font-bold uppercase tracking-widest">{t.cancel}</button>
                  </>
                ) : (
                  <>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1 text-center">{t.rateStepOf ? `2 ${t.rateStepOf} 2` : '2 of 2'}</p>
                    <h3 className="text-white text-lg font-black mb-1 text-center">{t.rateStep2 || 'Tell us more'}</h3>
                    <div className="flex justify-center gap-1 mb-5">{[1,2,3,4,5].map(s => <Star key={s} size={18} className={s <= rateStars ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'} />)}</div>
                    <textarea value={rateComment} onChange={e => setRateComment(e.target.value)} rows={3} placeholder={t.rateCommentPlaceholder || 'Share your experience...'} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none outline-none focus:border-white/30 transition-colors mb-3" />
                    {!rateAnon && <input type="text" value={rateName} onChange={e => setRateName(e.target.value)} placeholder={t.rateNamePlaceholder || 'Your name'} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-white/30 transition-colors mb-3" />}
                    <button type="button" onClick={() => setRateAnon(v => !v)} className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border mb-5 transition-all ${rateAnon ? 'bg-white/5 border-white/10 text-white/60' : 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'}`}>
                      <span className="text-xs font-bold">{rateAnon ? (t.rateAnonymous || 'Post Anonymously') : (t.rateWithName || 'Post with Name')}</span>
                      <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${rateAnon ? 'bg-white/20' : 'bg-indigo-500'}`}>
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${rateAnon ? 'translate-x-0' : 'translate-x-5'}`} />
                      </div>
                    </button>
                    <button onClick={handleRateSubmit} disabled={rateLoading} className="w-full py-3.5 rounded-2xl font-black text-sm text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: accent }}>
                      {rateLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (t.rateSubmit || 'Submit Review')}
                    </button>
                    <button onClick={() => setRateStep(1)} className="w-full mt-3 text-slate-600 text-xs font-bold uppercase tracking-widest">← {t.cancel}</button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <ProfileChatbot profileData={{ ...profileData, products, portfolio }} themeColor={accent} t={t} bottomOffset={true} />
      </div>
    );
  }
  // ===================== END PORTFOLIO TEMPLATE =====================

  return (
    <div
      dir={L === 'ar' ? 'rtl' : 'ltr'}
      lang={L}
      className="profile-view-container min-h-screen flex items-center justify-center sm:p-4 transition-colors duration-500"
      style={{ backgroundColor: tpl.outerBg }}
    >

      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[100px]"
          style={{ background: themeColor, opacity: tpl.glowOpacity }}
        />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[100px]"
          style={{ background: tpl.isDark ? '#1e3a8a' : themeColor, opacity: tpl.isDark ? '0.10' : '0.04' }}
        />
      </div>

      {/* Card shell */}
      <div
        className={`profile-card-main ${softCard}`}
        style={{
          background: tpl.useGradientCard ? tpl.cardBg : tpl.cardBg,
          borderColor: tpl.cardBorder,
        }}
      >
        {HeaderView}

        <div className="flex-1 flex flex-col relative" style={{ background: tpl.useGradientCard ? tpl.cardBg : undefined }}>

          <div className="px-6 relative z-10 pb-12">
            {AvatarView}



            {/* Main Info */}
            <motion.div variants={itemVariants} initial="hidden" animate="show" className="text-center mb-8">
              <h1 className="text-3xl font-black tracking-tight mb-2 drop-shadow-lg" style={{ color: tpl.textPrimary }}>{nameText}</h1>
              <p className="text-sm font-medium flex items-center justify-center gap-2" style={{ color: tpl.textSecondary }}>
                {jobTitleText}
                {companyText && <span className="w-1 h-1 rounded-full" style={{ backgroundColor: tpl.textSecondary }} />}
                {companyText}
              </p>

              {/* Stats Grid */}
              <div className="flex items-center justify-center gap-3 mt-6">
                <StatPill icon={<Sparkles size={16} />} label={t?.views || "Views"} value={totalViews} />
                <button className="flex-1 min-w-[80px]" onClick={handleFollowClick}>
                  <StatPill icon={<Briefcase size={16} />} label={t.followers || "Fans"} value={data?.stats?.followers || 0} />
                </button>
                <button className="flex-1 min-w-[80px]" onClick={openRateModal}>
                  <StatPill icon={<Star size={16} className="text-yellow-500 fill-yellow-500" />} label="Rating" value={(data?.stats?.ratingCount > 0 ? (data.stats.rating / data.stats.ratingCount).toFixed(1) : '5.0')} />
                </button>
              </div>
            </motion.div>

            {/* Tabs */}
            <div
              className="p-1 mb-6 rounded-2xl flex items-center backdrop-blur-md"
              style={{ background: tpl.tabBarBg, border: `1px solid ${tpl.tabBarBorder}` }}
            >
              {[{ id: 'info', label: t.tabInfo }, ...(products.length > 0 ? [{ id: 'products', label: t.tabProducts }] : []), ...(portfolio.length > 0 ? [{ id: 'portfolio', label: t.portfolioTitle }] : [])].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-1 py-3 rounded-xl text-xs font-bold transition-all"
                  style={activeTab === tab.id
                    ? { background: tpl.tabActiveBg, color: tpl.tabActiveText, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }
                    : { color: tpl.tabInactiveText }}
                >
                  {tab.label}
                </button>
              ))}
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

          <div
            className="mt-auto py-6 text-center text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border-t"
            style={{ background: tpl.footerBg, borderColor: tpl.footerBorder, color: tpl.footerText }}
          >
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
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm" onClick={() => setRateModalOpen(false)}>
          <div
            className="bg-[#0f172a] rounded-3xl w-full max-w-sm border border-slate-800 shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Progress bar */}
            <div className="h-1 bg-white/5">
              <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" style={{ width: rateStep === 1 ? '50%' : '100%' }} />
            </div>

            <div className="p-7">
              {rateStep === 1 ? (
                /* Step 1: Stars */
                <>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1 text-center">{t.rateStepOf ? `1 ${t.rateStepOf} 2` : '1 of 2'}</p>
                  <h3 className="text-white text-lg font-black mb-7 text-center">{t.rateStep1 || 'How was your experience?'}</h3>
                  <div className="flex justify-center gap-2 mb-8">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onMouseEnter={() => setHoverStar(star)}
                        onMouseLeave={() => setHoverStar(0)}
                        onClick={() => setRateStars(star)}
                        className="transition-transform duration-150 hover:scale-125 active:scale-110"
                      >
                        <Star
                          size={42}
                          className={(
                            star <= (hoverStar || rateStars)
                              ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]'
                              : 'text-white/20'
                          ) + ' transition-all duration-150'}
                        />
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => rateStars > 0 && setRateStep(2)}
                    disabled={!rateStars}
                    className="w-full py-3.5 rounded-2xl font-black text-sm transition-all disabled:opacity-30 disabled:pointer-events-none text-white"
                    style={{ backgroundColor: themeColor }}
                  >
                    {t.rateNext || 'Next'} →
                  </button>
                  <button onClick={() => setRateModalOpen(false)} className="w-full mt-3 text-slate-600 text-xs font-bold uppercase tracking-widest">{t.cancel}</button>
                </>
              ) : (
                /* Step 2: Comment + Name */
                <>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1 text-center">{t.rateStepOf ? `2 ${t.rateStepOf} 2` : '2 of 2'}</p>
                  <h3 className="text-white text-lg font-black mb-1 text-center">{t.rateStep2 || 'Tell us more'}</h3>
                  {/* Stars summary */}
                  <div className="flex justify-center gap-1 mb-5">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={18} className={s <= rateStars ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'} />)}
                  </div>

                  {/* Comment */}
                  <textarea
                    value={rateComment}
                    onChange={e => setRateComment(e.target.value)}
                    rows={3}
                    placeholder={t.rateCommentPlaceholder || 'Share your experience...'}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none outline-none focus:border-white/30 transition-colors mb-3"
                  />

                  {/* Name (shown only when not anonymous) */}
                  {!rateAnon && (
                    <input
                      type="text"
                      value={rateName}
                      onChange={e => setRateName(e.target.value)}
                      placeholder={t.rateNamePlaceholder || 'Your name'}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-white/30 transition-colors mb-3"
                    />
                  )}

                  {/* Anonymous Toggle */}
                  <button
                    type="button"
                    onClick={() => setRateAnon(v => !v)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border mb-5 transition-all ${rateAnon ? 'bg-white/5 border-white/10 text-white/60' : 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                      }`}
                  >
                    <span className="text-xs font-bold">{rateAnon ? (t.rateAnonymous || 'Post Anonymously') : (t.rateWithName || 'Post with Name')}</span>
                    <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${rateAnon ? 'bg-white/20' : 'bg-indigo-500'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${rateAnon ? 'translate-x-0' : 'translate-x-5'}`} />
                    </div>
                  </button>

                  <button
                    onClick={handleRateSubmit}
                    disabled={rateLoading}
                    className="w-full py-3.5 rounded-2xl font-black text-sm text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ backgroundColor: themeColor }}
                  >
                    {rateLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (t.rateSubmit || 'Submit Review')}
                  </button>
                  <button onClick={() => setRateStep(1)} className="w-full mt-3 text-slate-600 text-xs font-bold uppercase tracking-widest">← {t.cancel}</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {followModalOpen && <Suspense fallback={null}><FollowModal adminId={profileData.adminId} employeeId={profileData.id} themeColor={themeColor} onClose={() => setFollowModalOpen(false)} onSuccess={handleSmartFollowSuccess} t={t} /></Suspense>}
      {bookingModalOpen && <Suspense fallback={null}><BookingModal adminId={profileData.adminId} employeeId={profileData.id} themeColor={themeColor} onClose={() => setBookingModalOpen(false)} t={t} bookingSettings={profileData.bookingSettings} /></Suspense>}
      {storyViewerOpen && stories.length > 0 && (
        <Suspense fallback={null}>
          <StoryViewer
            stories={stories}
            adminId={profileData.adminId}
            employeeId={profileData.id}
            onClose={() => setStoryViewerOpen(false)}
            products={products}
            trackLead={(type, id) => trackClick(`story_${type}_${id}`)}
            t={t}
          />
        </Suspense>
      )}
      <ProfileChatbot profileData={{ ...profileData, products, portfolio }} themeColor={themeColor} t={t} />
    </div >
  );
  /* END OF PREMIUM PROFILE RENDER */
}
