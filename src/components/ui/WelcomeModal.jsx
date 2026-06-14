import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, LayoutDashboard, Target, Bot } from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';
import { useAppStore } from '../../store/useAppStore';

export default function WelcomeModal() {
  const { isGuestAccount } = useSubscription();
  const [isOpen, setIsOpen] = useState(false);
  const { openPaywall } = useAppStore();

  useEffect(() => {
    // Only show once per session for guest accounts
    if (isGuestAccount && !sessionStorage.getItem('nova_welcome_shown')) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        sessionStorage.setItem('nova_welcome_shown', 'true');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isGuestAccount]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden"
          >
            {/* Top Gradient */}
            <div className="h-32 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/30 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-8 pb-8 -mt-12 relative z-10">
              <div className="w-24 h-24 bg-white rounded-3xl p-2 shadow-xl shadow-violet-500/10 mx-auto mb-6 transform -rotate-3">
                <div className="w-full h-full bg-gradient-to-br from-violet-100 to-indigo-50 rounded-2xl flex items-center justify-center border border-violet-100">
                  <Sparkles className="text-violet-600" size={40} />
                </div>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
                  ยินดีต้อนรับสู่ <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">Nova Pipeline</span>
                </h2>
                <p className="text-slate-500 font-medium">
                  นี่คือ Showcase Mode สำหรับผู้เยี่ยมชม ข้อมูลที่เห็นเป็นเพียง Mock Data <br className="hidden sm:block" />เพื่อให้คุณได้สัมผัสประสบการณ์ใช้งานแบบเต็มรูปแบบ!
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <LayoutDashboard className="text-blue-500 mb-3" size={24} />
                  <h4 className="font-bold text-slate-900 text-sm mb-1">Interactive Pipeline</h4>
                  <p className="text-xs text-slate-500">ลองลากและวางการ์ดดีล เพื่อดูความลื่นไหลของระบบ</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <Target className="text-emerald-500 mb-3" size={24} />
                  <h4 className="font-bold text-slate-900 text-sm mb-1">Real-time Analytics</h4>
                  <p className="text-xs text-slate-500">ไปที่หน้า Command Center เพื่อดูกราฟจำลองที่สวยงาม</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <Bot className="text-amber-500 mb-3" size={24} />
                  <h4 className="font-bold text-slate-900 text-sm mb-1">AI Copilot</h4>
                  <p className="text-xs text-slate-500">คลิกที่ดีลเพื่อทดลองให้ AI วิเคราะห์กลยุทธ์แบบสดๆ</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-3.5 px-6 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  เริ่มทดลองเล่นเลย
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    openPaywall('default');
                  }}
                  className="flex-1 py-3.5 px-6 rounded-xl font-black text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.02] active:scale-95"
                >
                  ปลดล็อค Premium (299฿)
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
