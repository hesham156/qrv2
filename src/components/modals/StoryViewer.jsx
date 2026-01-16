import { X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { logAnalyticsEvent } from "../../utils/analytics";

export default function StoryViewer({ stories, adminId, employeeId, onClose, products, trackLead, t }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const currentStory = stories[currentIndex];

  // Analytics Tracking
  useEffect(() => {
    if (currentStory) {
      logAnalyticsEvent(adminId, employeeId, 'story_view', currentStory.type, {
        storyId: currentStory.id,
        productId: currentStory.productId || null
      });
    }
  }, [currentIndex, currentStory, adminId, employeeId]);

  useEffect(() => {
    setProgress(0);
    const duration = currentStory?.type === 'video' ? 15000 : 5000;
    const interval = 50;
    const increment = (interval / duration) * 100;

    timerRef.current = setInterval(() => {
      setProgress(prev => {
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
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleProductClick = (productId) => {
    if (trackLead) {
      trackLead('product_interest', productId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="w-full h-full max-w-md relative">
        <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
          {stories.map((_, idx) => (
            <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100"
                style={{ width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%' }}
              />
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-white bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="w-full h-full" onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          if (x < rect.width / 2) handlePrev();
          else handleNext();
        }}>
          {currentStory?.type === 'video' ? (
            <video
              key={currentStory.id}
              src={currentStory.mediaUrl}
              className="w-full h-full object-contain"
              autoPlay
              muted
              playsInline
            />
          ) : (
            <img
              key={currentStory.id}
              src={currentStory.mediaUrl}
              alt="Story"
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {currentStory?.productId && products && (
          <div className="absolute bottom-20 left-4 right-4">
            {products
              .filter(p => p.id === currentStory.productId)
              .map(product => (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product.id)}
                  className="bg-white/90 backdrop-blur-sm rounded-xl p-4 flex gap-3 cursor-pointer hover:bg-white transition-colors"
                >
                  {product.imageUrl && (
                    <img src={product.imageUrl} className="w-16 h-16 rounded-lg object-cover" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800">{product.name}</h3>
                    {product.price && (
                      <p className="text-sm font-bold text-blue-600">{product.price}</p>
                    )}
                  </div>
                  <ArrowRight className="text-slate-400" size={20} />
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}