import React, { useState, useEffect } from 'react';
import { Smartphone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InstallAppBanner({ installPrompt, lang }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    const isDismissed = localStorage.getItem('pwa_banner_dismissed');
    
    // Only show if not dismissed and not already installed
    if (!isStandalone && !isDismissed) {
      setShow(true);
    }
  }, [installPrompt]);

  const handleInstall = async () => {
    if (installPrompt) {
      try {
        installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setShow(false);
        }
      } catch (e) {
        console.error('Install prompt error:', e);
      }
    } else {
      // Fallback for iOS or desktop where prompt is null
      const msg = lang === 'ar' 
        ? 'لتحميل التطبيق، اضغط على زر المشاركة أو القائمة في متصفحك واختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).'
        : 'To install the app, tap the Share or Menu button in your browser and select "Add to Home Screen".';
      alert(msg);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_banner_dismissed', 'true');
    setShow(false);
  };

  const isRtl = lang === 'ar';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-[#0f172a] border-b border-white/10 shadow-2xl safe-area-top"
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            
            <div className="flex items-center gap-3 overflow-hidden">
              <button 
                onClick={handleDismiss} 
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors shrink-0"
              >
                <X size={16} />
              </button>
              
              <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/20">
                <Smartphone size={20} className="text-white" />
              </div>
              
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-white truncate">
                  {isRtl ? 'تطبيق Getin.click' : 'Getin.click App'}
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  {isRtl ? 'احصل على تجربة أسرع وأفضل' : 'Get a faster, better experience'}
                </span>
              </div>
            </div>

            <button
              onClick={handleInstall}
              className="shrink-0 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg shadow-brand-600/30 transition-all hover:scale-105 active:scale-95"
            >
              {isRtl ? 'فتح في التطبيق' : 'Open in App'}
            </button>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
