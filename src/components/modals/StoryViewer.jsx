import { X, ArrowRight, Send } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { logAnalyticsEvent } from "../../utils/analytics";
import { motion, AnimatePresence } from "framer-motion";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, appId } from "../../config/firebase";

export default function StoryViewer({ stories, adminId, employeeId, onClose, products, trackLead, t }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [visitorCountry, setVisitorCountry] = useState(null);

  const timerRef = useRef(null);
  const isPausedRef = useRef(isPaused);
  const currentStory = stories[currentIndex];

  useEffect(() => {
    // Fetch country once to log with interactions
    const fetchGeo = async () => {
        try {
            // Safe CORS-friendly geo fetch via api.country.is
            const res1 = await fetch('https://api.country.is/');
            if (res1.ok) {
              const data1 = await res1.json();
              if (data1 && data1.country) {
                  setVisitorCountry(data1.country);
                  return;
              }
            }
        } catch (error) {
            console.warn("Geo IP fetch failed:", error);
        }
        // If all fails, keep it null so the fallback displays 'غير معروف'
    };
    
    fetchGeo();
  }, []);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Analytics Tracking
  useEffect(() => {
    if (currentStory) {
      logAnalyticsEvent(adminId, employeeId, 'story_view', currentStory.type, {
        storyId: currentStory.id,
        productId: currentStory.productId || null
      });
      if (trackLead) trackLead('view', currentStory.id);
    }
  }, [currentIndex, currentStory, adminId, employeeId, trackLead]);

  useEffect(() => {
    setProgress(0);
    const duration = currentStory?.type === 'video' ? 15000 : 5000;
    const interval = 50;
    const increment = (interval / duration) * 100;

    timerRef.current = setInterval(() => {
      setProgress(prev => {
        if (isPausedRef.current) return prev;
        
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, currentStory]);

  const handleNext = () => {
    setReplyText('');
    setIsPaused(false);
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    setReplyText('');
    setIsPaused(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleProductClick = (productId) => {
    if (trackLead) trackLead('product_interest', productId);
  };

  const saveInteraction = async (type, content) => {
    if (!adminId || !employeeId || !currentStory) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', adminId, 'employees', employeeId, 'story_interactions'), {
        storyId: currentStory.id,
        type, // 'reaction' | 'reply'
        content,
        country: visitorCountry || 'Unknown',
        senderName: t?.anonymous || 'مجهول',
        isReview: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
       console.warn("Could not save story interaction:", error);
    }
  };

  const handleReact = (emoji) => {
    if (trackLead) trackLead('reaction', emoji);
    saveInteraction('reaction', emoji);

    const id = Date.now() + Math.random();
    setFloatingEmojis(prev => [...prev, { id, emoji }]);
    
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    }, 2000);
  };

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    if (trackLead) trackLead('reply', replyText.trim());
    saveInteraction('reply', replyText.trim());
    
    setReplyText('');
    setIsPaused(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-[#111] z-[100] flex items-center justify-center">
      <div className="w-full h-full max-w-md relative sm:rounded-2xl overflow-hidden sm:h-[95vh] bg-black shadow-2xl">
        
        {/* Progress Bars */}
        <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
          {stories.map((_, idx) => (
            <div key={idx} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100"
                style={{ width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%' }}
              />
            </div>
          ))}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-8 right-4 z-30 text-white drop-shadow-md hover:scale-110 transition-transform"
        >
          <X size={24} />
        </button>

        {/* Story Content Area */}
        <div 
          className="absolute inset-0 z-10" 
          onPointerDown={() => setIsPaused(true)}
          onPointerUp={() => !replyText && setIsPaused(false)}
          onPointerCancel={() => !replyText && setIsPaused(false)}
          onContextMenu={(e) => e.preventDefault()}
          onClick={(e) => {
            // Only advance if not clicking on an interactive element
            if (e.target.tagName?.toLowerCase() === 'input' || e.target.closest('button')) return;
            
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            if (x < rect.width / 2) handlePrev();
            else handleNext();
          }}
        >
          {currentStory?.type === 'video' ? (
            <video
              key={currentStory.id}
              src={currentStory.mediaUrl}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
              loop={isPaused} // Prevent video from ending while paused
            />
          ) : (
            <img
              key={currentStory.id}
              src={currentStory.mediaUrl}
              alt="Story"
              className="w-full h-full object-cover select-none"
              draggable="false"
            />
          )}
          {/* Subtle gradient at bottom for text readability */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
        </div>

        {/* Sent Toast */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-20 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-2.5 rounded-full font-bold text-sm z-50 shadow-xl"
            >
              {t?.sent || "Sent!"}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Emojis */}
        <div className="absolute bottom-20 right-4 w-12 h-64 pointer-events-none z-30 overflow-visible">
          <AnimatePresence>
            {floatingEmojis.map(f => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 50, x: 0, scale: 0.5 }}
                animate={{ 
                  opacity: [0, 1, 1, 0], 
                  y: -200 - Math.random() * 80, 
                  x: (Math.random() - 0.5) * 60, 
                  scale: [0.5, 1.5, 1] 
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute bottom-0 text-5xl drop-shadow-xl"
              >
                {f.emoji}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Interaction Footer */}
        <div 
          className="absolute bottom-4 left-4 right-4 z-40 flex flex-col gap-3"
          onClick={(e) => e.stopPropagation()} // Prevent clicking footer from advancing story
        >
          {/* Linked Product UI */}
          {currentStory?.productId && products && (
            <div className="mb-2">
              {products
                .filter(p => p.id === currentStory.productId)
                .map(product => (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product.id)}
                    className="bg-white/95 backdrop-blur-md rounded-2xl p-3 flex items-center gap-3 cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-lg mx-auto max-w-sm"
                  >
                    {product.imageUrl && (
                      <img src={product.imageUrl} className="w-12 h-12 rounded-xl object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-slate-800 text-sm truncate">{product.name}</h3>
                      {product.price && (
                        <p className="text-xs font-bold text-indigo-600 truncate">{product.price}</p>
                      )}
                    </div>
                    <div className="bg-slate-100 p-2 rounded-full">
                      <ArrowRight className="text-slate-600" size={16} />
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Quick Reactions & Input Row */}
          <div className="flex items-center gap-3 w-full">
            <form onSubmit={handleReplySubmit} className="flex-1 relative">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={() => setIsPaused(true)}
                onBlur={() => !replyText && setIsPaused(false)}
                placeholder={t?.replyToStory || "Send message"}
                className="w-full bg-black/30 backdrop-blur-md border border-white/40 text-white placeholder-white/80 text-sm rounded-full py-3 pl-5 pr-12 focus:outline-none focus:border-white focus:bg-black/50 transition-all font-medium"
              />
              <AnimatePresence>
                {replyText && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    type="submit" 
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-white text-black p-2 rounded-full shadow-lg"
                  >
                    <Send size={14} className="ml-0.5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </form>

            <div className="flex items-center gap-1.5">
              {['❤️', '🔥', '😂', '😍'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className="text-2xl hover:scale-125 active:scale-90 transition-transform drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}