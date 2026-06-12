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
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[400px] bg-white/90 backdrop-blur-xl border border-slate-200/60 shadow-2xl shadow-slate-200/50 rounded-2xl p-5 z-[100]"
        >
          <button 
            onClick={handleDecline}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
          
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center shrink-0 text-violet-600">
              <Cookie size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">เราใช้คุกกี้ (Cookies)</h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                เว็บไซต์นี้ใช้คุกกี้เพื่อประสบการณ์การใช้งานที่ดีขึ้น การใช้งานเว็บไซต์ต่อถือเป็นการยอมรับนโยบายความเป็นส่วนตัวของเรา
              </p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleAccept}
                  className="flex-1 h-9 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-500/20"
                >
                  ยอมรับทั้งหมด
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleDecline}
                  className="flex-1 h-9 text-xs font-bold text-slate-600"
                >
                  ตั้งค่าคุกกี้
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
