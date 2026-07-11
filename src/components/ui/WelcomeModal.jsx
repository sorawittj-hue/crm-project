import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  X, Sparkles, LayoutDashboard, Target, Bot,
  ArrowRight, ChevronLeft, Users, Clock,
  Timer, CheckCircle2,
} from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../lib/utils';

const TOUR_STEPS = [
  {
    id: 'welcome',
    emoji: '👋',
    title: 'ยินดีต้อนรับสู่ Nova Pipeline!',
    subtitle: 'ระบบ CRM อัจฉริยะสำหรับทีมขายมืออาชีพ',
    description: 'คุณกำลังอยู่ใน Sandbox Mode — ข้อมูลตัวอย่างระดับ Enterprise ของบริษัทชั้นนำของไทยพร้อมให้สำรวจแล้ว',
    features: [
      { icon: LayoutDashboard, label: 'Command Center', desc: 'Dashboard real-time พร้อมกราฟวิเคราะห์', color: 'text-blue-500 bg-blue-50' },
      { icon: Target, label: 'Sales Pipeline', desc: 'Kanban board ลากวางได้', color: 'text-violet-500 bg-violet-50' },
      { icon: Users, label: 'Customer Intelligence', desc: 'ประเมิน health score อัตโนมัติ', color: 'text-emerald-500 bg-emerald-50' },
      { icon: Bot, label: 'AI Copilot', desc: 'วิเคราะห์ดีลและแนะนำกลยุทธ์', color: 'text-amber-500 bg-amber-50' },
    ],
  },
  {
    id: 'pipeline',
    emoji: '🎯',
    title: 'ลองดู Pipeline ก่อนเลย',
    subtitle: 'มีดีลจริงๆ 25 รายการ มูลค่ารวมกว่า 50M THB',
    description: 'ไปที่หน้า Pipeline เพื่อดูดีลของบริษัท Enterprise ชั้นนำ ลองลากการ์ดข้ามคอลัมน์เพื่ออัปเดต stage',
    cta: { label: 'ไปดู Pipeline', route: '/pipeline' },
    tips: [
      '🖱️ ลากการ์ดข้ามคอลัมน์เพื่อเปลี่ยน stage',
      '🔍 คลิกที่การ์ดเพื่อดูรายละเอียดและ AI วิเคราะห์',
      '⚡ ดูดีลที่มาร์ก "ด่วน" สีแดง — ต้องปิดใน 4 วัน!',
    ],
  },
  {
    id: 'analytics',
    emoji: '📊',
    title: 'Dashboard ข้อมูลเชิงลึก',
    subtitle: 'ตัวเลขที่ทำให้ทีมขายทำงานได้ฉลาดขึ้น',
    description: 'Command Center แสดง KPI, win rate, pipeline value และ AI insights ทั้งหมดในที่เดียว ใช้ข้อมูลจริงเพื่อการตัดสินใจที่แม่นยำ',
    cta: { label: 'ดู Command Center', route: '/command' },
    tips: [
      '💰 Pipeline value รวม 50M+ THB พร้อมแสดง',
      '📈 Win rate 65% จากดีลจริงในระบบ',
      '🤖 AI แนะนำดีลที่ควรโฟกัสวันนี้',
    ],
  },
  {
    id: 'cta',
    emoji: '🚀',
    title: 'พร้อมเริ่มใช้งานจริงแล้วหรือยัง?',
    subtitle: 'ข้อมูลทดลองอยู่ในเบราว์เซอร์ของคุณ',
    description: 'สมัครสมาชิกฟรีเพื่อย้ายข้อมูลทดลองของคุณขึ้น Cloud และรับสิทธิ์ Pro ครบ 3 วัน ไม่ต้องใส่บัตรเครดิต',
    isCtaStep: true,
  },
];

export default function WelcomeModal() {
  const { isGuestAccount, isTrialActive, isPro, trialDaysLeft } = useSubscription();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const { openPaywall } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    const shouldShow =
      (isGuestAccount || (isTrialActive && !isPro)) &&
      !sessionStorage.getItem('nova_welcome_shown');

    if (shouldShow) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        sessionStorage.setItem('nova_welcome_shown', 'true');
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isGuestAccount, isTrialActive, isPro]);

  const handleClose = useCallback(() => setIsOpen(false), []);

  const handleNext = useCallback(() => {
    if (step < TOUR_STEPS.length - 1) setStep(s => s + 1);
  }, [step]);

  const handleBack = useCallback(() => {
    if (step > 0) setStep(s => s - 1);
  }, [step]);

  const handleCta = useCallback((route) => {
    setIsOpen(false);
    if (route) navigate(route);
  }, [navigate]);

  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl shadow-slate-900/20 overflow-hidden"
          >
            {/* Gradient header */}
            <div className="h-2 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />

            {/* Step progress dots */}
            <div className="flex items-center justify-between px-7 pt-5 pb-1">
              <div className="flex gap-1.5">
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-300',
                      i === step
                        ? 'w-6 bg-violet-600'
                        : i < step
                          ? 'w-1.5 bg-violet-300'
                          : 'w-1.5 bg-slate-200'
                    )}
                  />
                ))}
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="px-7 pb-7 pt-3">
              {/* Emoji + Title */}
              <div className="text-center mb-6">
                <div className="text-5xl mb-4 select-none">{current.emoji}</div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight mb-1">
                  {current.title}
                </h2>
                <p className="text-sm font-semibold text-violet-600 mb-3">{current.subtitle}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{current.description}</p>
              </div>

              {/* Features grid (step 0) */}
              {current.features && (
                <div className="grid grid-cols-2 gap-2.5 mb-6">
                  {current.features.map(({ icon: Icon, label, desc, color }) => (
                    <div key={label} className="flex gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', color)}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 leading-none mb-1">{label}</p>
                        <p className="text-[11px] text-slate-500 leading-snug">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tips list (steps 1-2) */}
              {current.tips && (
                <div className="space-y-2 mb-6">
                  {current.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-violet-50/60 border border-violet-100/60">
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">{tip}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* CTA Step */}
              {current.isCtaStep && (
                <div className="space-y-3 mb-2">
                  {isGuestAccount && (
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50 border border-amber-100">
                      <Timer className="text-amber-500 shrink-0" size={18} />
                      <div>
                        <p className="text-xs font-bold text-amber-900">เหลือเวลาอีก {trialDaysLeft} วัน</p>
                        <p className="text-[11px] text-amber-700">ข้อมูลจะหายเมื่อปิดเบราว์เซอร์และหมดอายุ</p>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    {[
                      '✓ ย้ายข้อมูล Sandbox ขึ้น Cloud อัตโนมัติ',
                      '✓ ทดลอง Pro ฟรี 3 วัน ไม่ต้องใส่บัตรเครดิต',
                      '✓ เข้าใช้ได้ทุกอุปกรณ์ทุกที่',
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2.5 mt-5">
                {!isFirst && (
                  <button
                    onClick={handleBack}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all flex items-center gap-1.5"
                  >
                    <ChevronLeft size={16} /> ย้อนกลับ
                  </button>
                )}

                {current.isCtaStep ? (
                  <div className="flex flex-col gap-2 flex-1">
                    <button
                      onClick={() => {
                        handleClose();
                        openPaywall('guest_upgrade');
                      }}
                      className="w-full py-3 rounded-xl font-black text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.02] active:scale-95 text-sm"
                    >
                      ✨ สมัครสมาชิกฟรี — ย้ายข้อมูลขึ้น Cloud
                    </button>
                    <button
                      onClick={handleClose}
                      className="w-full py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      ทดลองต่อก่อน (ข้อมูลอยู่ในเบราว์เซอร์)
                    </button>
                  </div>
                ) : current.cta ? (
                  <>
                    <button
                      onClick={() => handleCta(current.cta.route)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      {current.cta.label} <ArrowRight size={15} />
                    </button>
                    <button
                      onClick={handleNext}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-all"
                    >
                      ข้าม
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleNext}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    ถัดไป <ArrowRight size={15} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
