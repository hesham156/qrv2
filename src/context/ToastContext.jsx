import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[99999] flex flex-col gap-2 items-center pointer-events-none w-full px-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl pointer-events-auto backdrop-blur-md max-w-sm w-full border"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                borderColor: toast.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : toast.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.1)',
              }}
            >
              {toast.type === 'success' && <CheckCircle2 size={20} className="text-green-400 shrink-0" />}
              {toast.type === 'error' && <AlertCircle size={20} className="text-red-400 shrink-0" />}
              {toast.type === 'info' && <Info size={20} className="text-blue-400 shrink-0" />}
              
              <p className="text-white text-sm font-medium flex-1 tracking-wide">{toast.message}</p>
              
              <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  
  return {
    success: (msg) => context(msg, 'success'),
    error: (msg) => context(msg, 'error'),
    info: (msg) => context(msg, 'info'),
  };
};
