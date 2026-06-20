import { useEffect, useState } from 'react';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TOUR_STEPS = [
  {
    target: '#sidebar-nav',
    title: '🧭 การนำทางเมนูหลัก',
    content: 'สลับไปมาระหว่าง Dashboard, Pipeline บอร์ดคันบัน, ลูกค้า, และเมนูรายงานวิเคราะห์ยอดขายได้จากตรงนี้',
    path: '/command',
  },
  {
    target: '#goal-card',
    title: '🎯 เป้าหมายรายเดือน',
    content: 'กำหนดเป้าหมายยอดขายส่วนตัวของคุณ เพื่อวิเคราะห์ความแม่นยำของยอดปิดในแต่ละเดือน',
    path: '/command',
  },
  {
    target: '#kpi-ribbon',
    title: '📊 ตัวชี้วัดสำคัญ (KPIs)',
    content: 'แดชบอร์ดจำลองภาพรวม Active Pipeline, Win Rate (อัตราปิดสัญญา), และ Avg Velocity (ระยะเวลาปิดดีลเฉลี่ย)',
    path: '/command',
  },
  {
    target: '#ai-insights-card',
    title: '🧠 AI Executive Insights',
    content: 'ผู้ช่วย AI จะสแกนสถานะดีลเพื่อค้นหากลุ่มเสี่ยงค้างนาน หรือจุดขัดข้อง พร้อมแนะนำขั้นตอนปิดสัญญารายบุคคล',
    path: '/command',
  },
  {
    target: '#pipeline-board',
    title: '🤝 บอร์ด Pipeline',
    content: 'ลากและวางดีลเพื่อเลื่อนสถานะ หรือสร้างดีลใหม่ได้ง่ายๆ พร้อม AI สรุปเอกสารเสนอราคาอัตโนมัติ',
    path: '/pipeline',
  },
];

export default function TourEngine() {
  const { isTourActive, currentStep, nextStep, prevStep, endTour } = useOnboardingStore();
  const [coords, setCoords] = useState(null);
  const navigate = useNavigate();
  const activeStep = TOUR_STEPS[currentStep];

  useEffect(() => {
    if (!isTourActive || !activeStep) return;

    let timer;
    let active = true;

    const updateCoordinates = (attempt = 0) => {
      if (!active) return;
      const el = document.querySelector(activeStep.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        setCoords({
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16,
          right: rect.right + 8,
          bottom: rect.bottom + 8,
        });
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (attempt < 10) {
        timer = setTimeout(() => updateCoordinates(attempt + 1), 100);
      } else {
        setCoords(null);
      }
    };

    if (window.location.pathname !== activeStep.path) {
      navigate(activeStep.path);
      timer = setTimeout(() => updateCoordinates(0), 300);
    } else {
      updateCoordinates(0);
    }

    const handleResize = () => updateCoordinates(0);
    window.addEventListener('resize', handleResize);

    return () => {
      active = false; // Prevents pending timeouts from executing
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [isTourActive, currentStep, navigate, activeStep]);

  if (!isTourActive || !coords) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* SVG Mask Overlay */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] pointer-events-auto">
        <svg className="w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={coords.left}
                y={coords.top}
                width={coords.width}
                height={coords.height}
                rx="16"
                ry="16"
                fill="black"
              />
            </mask>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="currentColor" mask="url(#spotlight-mask)" />
        </svg>
      </div>

      {/* Popover Step Description Box */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="fixed sm:absolute bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 w-[calc(100vw-32px)] sm:w-96 pointer-events-auto z-[10000] flex flex-col gap-4"
        style={{
          top: coords.bottom + 12 > window.innerHeight - 250 ? undefined : coords.bottom + 12,
          bottom: coords.bottom + 12 > window.innerHeight - 250 ? window.innerHeight - coords.top + 12 : undefined,
          left: window.innerWidth < 450
            ? 16
            : Math.min(window.innerWidth - 400, Math.max(16, coords.left)),
        }}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-1.5 text-violet-600 font-bold text-xs uppercase tracking-wider">
            <Sparkles size={14} className="animate-spin" style={{ animationDuration: '3s' }} />
            <span>คำแนะนำการเริ่มใช้งาน ({currentStep + 1}/{TOUR_STEPS.length})</span>
          </div>
          <button onClick={endTour} className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        <div>
          <h4 className="font-black text-slate-900 text-base mb-1">{activeStep.title}</h4>
          <p className="text-slate-500 text-xs leading-relaxed font-semibold">{activeStep.content}</p>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-2">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold disabled:opacity-40 flex items-center gap-1"
          >
            <ChevronLeft size={14} /> ย้อนกลับ
          </button>
          
          {currentStep < TOUR_STEPS.length - 1 ? (
            <button
              onClick={nextStep}
              className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-500/10 flex items-center gap-1"
            >
              ถัดไป <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={endTour}
              className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/10"
            >
              เสร็จสิ้นทัวร์ 🎉
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
