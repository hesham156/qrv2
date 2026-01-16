import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, appId } from './config/firebase';
import { translations } from './utils/translations';
import ProfileSkeleton from './components/skeletons/ProfileSkeleton';

// Lazy Load Pages
const LoginView = lazy(() => import('./pages/auth/LoginView'));
const RegisterView = lazy(() => import('./pages/auth/RegisterView'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const ProfileView = lazy(() => import('./pages/profile/ProfileView'));
const Home = lazy(() => import('./pages/landing/Home'));
const Pricing = lazy(() => import('./pages/landing/Pricing'));
const Features = lazy(() => import('./pages/landing/Features'));
const Contact = lazy(() => import('./pages/landing/Contact'));
const NotFound = lazy(() => import('./pages/utility/NotFound'));



// Component to show while lazy components load
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);


// --- Helper Component for PWA & Global Logic ---
function AppLogic({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const location = useLocation();

  // PWA & Manifest Logic
  useEffect(() => {
    // ... (Preserve existing PWA logic here if needed, shortened for brevity but keeping core)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Handle Legacy Hash Routing & Slug/ID Detection
  useEffect(() => {
    const checkLegacyRoute = async () => {
      const hashString = window.location.hash.substring(1);
      if (hashString.includes('uid=') && hashString.includes('pid=')) {
        // Convert to new route params if we were doing a rewrite, but here we might just render ProfileView directly
        // For now, let's keep it simple: if profile detected, handled by Profile Route logic
      }
      // For slug detection, we might want a specific route wrapper or check here.
      // But React Router is better for this.
    };
    checkLegacyRoute();
  }, [location]);

  return children(deferredPrompt);
}

// --- Protected Route Wrapper ---
const ProtectedRoute = ({ user, children }) => {
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// --- Profile Route Wrapper (Handles Slugs & IDs) ---
function ProfileRoute({ user, lang, toggleLang, t }) {
  const { slug } = useParams();
  const location = useLocation();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      // 1. Query Params (uid, pid)
      const params = new URLSearchParams(location.search);
      const pid = params.get('pid');
      const uid = params.get('uid');

      if (pid && uid) {
        setProfileData({ id: pid, adminId: uid });
        setLoading(false);
        return;
      }

      // 2. Slug
      if (slug) {
        try {
          const slugRef = doc(db, 'artifacts', appId, 'public', 'data', 'slugs', slug);

          // Race with timeout
          const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000));
          const fetchPromise = getDoc(slugRef);

          const slugSnap = await Promise.race([fetchPromise, timeout]);

          if (slugSnap.exists()) {
            const data = slugSnap.data();
            setProfileData({ id: data.targetEmpId, adminId: data.targetUid });
          } else {
            console.error("Slug not found");
          }
        } catch (e) {
          console.error("Error fetching slug:", e);
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [slug, location.search, user]);

  if (loading) return <ProfileSkeleton />;
  if (!profileData) return (
    <Suspense fallback={null}>
      <NotFound
        title="Oops!"
        subtitle="Profile Unavailable"
        msg="The digital card you are looking for does not exist, has been removed, or the link is incorrect."
        code="PROFILE_NOT_FOUND"
      />
    </Suspense>
  );

  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileView data={profileData} user={user} lang={lang} toggleLang={toggleLang} t={t} />
    </Suspense>
  );
}


export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [lang, setLang] = useState('ar');
  const t = translations[lang];

  const toggleLang = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');

  // Ref to hold the user document unsubscribe function
  const userUnsubRef = React.useRef(null);

  // Custom Domain State
  const [customDomainData, setCustomDomainData] = useState(null);
  const [domainCheckLoading, setDomainCheckLoading] = useState(true);

  useEffect(() => {
    const checkDomain = async () => {
      const hostname = window.location.hostname;
      // Identify if we are on the main app or a custom domain
      // You might want to add your production domain here e.g. 'wafarle.com'
      const isMainApp = hostname.includes('localhost') || hostname.includes('firebaseapp.com') || hostname.includes('web.app');

      if (!isMainApp) {
        try {
          // Check if this domain is registered
          const domainRef = doc(db, 'artifacts', appId, 'public', 'data', 'domains', hostname.replace(/\./g, '_'));
          const snap = await getDoc(domainRef);
          if (snap.exists()) {
            setCustomDomainData(snap.data());
          }
        } catch (error) {
          console.error("Domain check error:", error);
        }
      }
      setDomainCheckLoading(false);
    };
    checkDomain();
  }, []);

  useEffect(() => {
    // Failsafe timeout for slow connections/auth
    const timer = setTimeout(() => {
      setAuthLoading(false);
    }, 2500);

    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      clearTimeout(timer);

      // 1. Unsubscribe from previous user listener if exists
      if (userUnsubRef.current) {
        userUnsubRef.current();
        userUnsubRef.current = null;
      }

      if (u) {
        // Set initial basic user to prevent login flash
        setUser(u);

        try {
          const userDocRef = doc(db, 'artifacts', appId, 'users', u.uid);
          const unsubUser = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              setUser({ ...u, ...docSnap.data() });
            } else {
              setUser(u);
            }
          }, (error) => {
            // If permission denied happens (e.g. logout race condition), just log it
            console.log("User listener stopped:", error.code);
          });

          userUnsubRef.current = unsubUser;
        } catch (e) {
          console.error("Error setting up user listener", e);
          setUser(u);
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (userUnsubRef.current) userUnsubRef.current();
    };
  }, []);

  if (authLoading || domainCheckLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  // --- CUSTOM DOMAIN RENDER ---
  if (customDomainData) {
    return (
      <Suspense fallback={<PageLoader />}>
        <ProfileView
          data={{ id: customDomainData.targetEmpId, adminId: customDomainData.targetUid }}
          user={user}
          lang={lang}
          toggleLang={toggleLang}
          t={t}
        />
      </Suspense>
    );
  }

  return (
    <BrowserRouter>
      <AppLogic>
        {(installPrompt) => (
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Marketing Pages */}
              <Route path="/" element={<Home />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/features" element={<Features />} />
              <Route path="/contact" element={<Contact />} />

              {/* Auth */}
              <Route path="/login" element={user && !user.isAnonymous ? <Navigate to="/dashboard" /> : <LoginView lang={lang} toggleLang={toggleLang} t={t} />} />
              <Route path="/register" element={user && !user.isAnonymous ? <Navigate to="/dashboard" /> : <RegisterView lang={lang} toggleLang={toggleLang} t={t} />} />

              {/* App */}
              <Route path="/dashboard" element={
                <ProtectedRoute user={user}>
                  <Dashboard
                    user={user}
                    onLogout={() => auth.signOut()}
                    lang={lang}
                    toggleLang={toggleLang}
                    t={t}
                    installPrompt={installPrompt}
                    onInstall={() => {
                      if (installPrompt) {
                        installPrompt.prompt();
                        installPrompt.userChoice.then(res => {
                          // if (res.outcome === 'accepted') console.log('Accepted');
                        });
                      }
                    }}
                  />
                </ProtectedRoute>
              } />

              {/* Profile Routes */}
              <Route path="/p/:slug" element={<ProfileRoute user={user} lang={lang} toggleLang={toggleLang} t={t} />} />
              <Route path="/profile" element={<ProfileRoute user={user} lang={lang} toggleLang={toggleLang} t={t} />} />


              {/* Fallback for legacy hash routes or 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        )}
      </AppLogic>
    </BrowserRouter>
  );
}

