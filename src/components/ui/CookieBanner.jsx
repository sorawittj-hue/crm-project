import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { Cookie, X } from 'lucide-react';

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasConsented = localStorage.getItem('cookie_consent');
    if (!hasConsented) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'declined');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-3 left-3 right-3 md:bottom-4 md:left-auto md:right-4 md:w-[360px] bg-white dark:bg-[#111522] border border-slate-200 dark:border-white/10 shadow-xl rounded-xl p-4 z-[100]"
        >
          <button 
            onClick={handleDecline}
            aria-label="ปฏิเสธคุกกี้ที่ไม่จำเป็น"
            className="absolute top-3 right-3 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
          
          <div className="flex gap-4">
            <div className="w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-500/15 flex items-center justify-center shrink-0 text-violet-700 dark:text-violet-300">
              <Cookie size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">การตั้งค่าคุกกี้</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
                เลือกยอมรับคุกกี้ทั้งหมด หรือใช้เฉพาะคุกกี้ที่จำเป็นต่อการทำงานของแอป
              </p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleAccept}
                  className="flex-1 h-9 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-sm"
                >
                  ยอมรับทั้งหมด
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleDecline}
                  className="flex-1 h-9 text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  ใช้เฉพาะที่จำเป็น
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
