import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

const ToastContext = createContext(null);

const icons = {
  success: CheckCircle2,
  error:   AlertCircle,
  warning: AlertTriangle,
  info:    Info,
};

const toastStyles = {
  success: {
    container: 'bg-white border-emerald-200 shadow-emerald-500/10',
    icon:      'text-emerald-500 bg-emerald-50',
    text:      'text-slate-800',
    sub:       'text-emerald-600',
    bar:       'bg-gradient-to-r from-emerald-400 to-teal-400',
  },
  error: {
    container: 'bg-white border-rose-200 shadow-rose-500/10',
    icon:      'text-rose-500 bg-rose-50',
    text:      'text-slate-800',
    sub:       'text-rose-600',
    bar:       'bg-gradient-to-r from-rose-400 to-pink-400',
  },
  warning: {
    container: 'bg-white border-amber-200 shadow-amber-500/10',
    icon:      'text-amber-500 bg-amber-50',
    text:      'text-slate-800',
    sub:       'text-amber-600',
    bar:       'bg-gradient-to-r from-amber-400 to-orange-400',
  },
  info: {
    container: 'bg-white border-blue-200 shadow-blue-500/10',
    icon:      'text-blue-500 bg-blue-50',
    text:      'text-slate-800',
    sub:       'text-blue-600',
    bar:       'bg-gradient-to-r from-blue-400 to-sky-400',
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4500) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg, dur) => addToast(msg, 'success', dur), [addToast]);
  const error   = useCallback((msg, dur) => addToast(msg, 'error',   dur), [addToast]);
  const warning = useCallback((msg, dur) => addToast(msg, 'warning', dur), [addToast]);
  const info    = useCallback((msg, dur) => addToast(msg, 'info',    dur), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, warning, info, addToast, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] space-y-2.5 max-w-sm w-full pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            const Icon = icons[toast.type];
            const s = toastStyles[toast.type] || toastStyles.info;
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 60, scale: 0.92, y: -8 }}
                animate={{ opacity: 1, x: 0, scale: 1, y: 0 }}
                exit={{ opacity: 0, x: 60, scale: 0.92, transition: { duration: 0.18 } }}
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                className={cn(
                  "relative flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-xl overflow-hidden pointer-events-auto",
                  s.container
                )}
              >
                {/* Color accent bar */}
                <div className={cn("absolute bottom-0 left-0 right-0 h-0.5", s.bar)} />

                {/* Icon */}
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", s.icon)}>
                  <Icon size={18} strokeWidth={2.5} />
                </div>

                {/* Message */}
                <p className={cn("text-sm font-semibold flex-1 leading-snug pt-1.5", s.text)}>
                  {toast.message}
                </p>

                {/* Close */}
                <button
                  onClick={() => removeToast(toast.id)}
                  className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-all duration-150 mt-0.5"
                >
                  <X size={13} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
