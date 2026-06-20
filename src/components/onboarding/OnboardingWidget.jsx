import { useState } from 'react';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Trophy, ChevronDown, Sparkles, Play, RotateCcw } from 'lucide-react';

export default function OnboardingWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { completedTasks, startTour, isDemoMode, toggleDemoMode, resetOnboarding } = useOnboardingStore();

  const tasks = [
    { key: 'setTarget', label: 'กำหนดเป้าหมายการขายประจำเดือน', desc: 'ตั้งค่า target เพื่อใช้ forecast ยอดปิด' },
    { key: 'addCustomer', label: 'เพิ่มข้อมูลลูกค้ารายแรก', desc: 'บันทึกโปรไฟล์ลูกค้าสำหรับจับคู่ดีล' },
    { key: 'addDeal', label: 'สร้างดีลและกำหนดขั้นตอนขาย', desc: 'เพิ่มมูลค่าดีลลงใน Kanban pipeline' },
    { key: 'logActivity', label: 'บันทึกนัดหมายหรือกิจกรรมติดตาม', desc: 'ลงข้อมูลสายด่วน เมล หรือนัดประชุมลูกค้า' },
    { key: 'useCalculator', label: 'ทดลองเครื่องมือคำนวณกำไร / ROI', desc: 'ใช้ Deal Calculator เพื่อวิเคราะห์กำไรขั้นต้น' },
  ];

  const completedCount = Object.values(completedTasks).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  return (
    <div className="fixed bottom-6 right-6 z-[9990] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-80 sm:w-96 bg-white border border-slate-100 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-violet-600 to-indigo-700 text-white p-5 relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Trophy size={80} />
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">Nova Onboarding</span>
                <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
                  <ChevronDown size={18} />
                </button>
              </div>
              <h3 className="text-lg font-black tracking-tight flex items-center gap-1.5">
                ยินดีต้อนรับสู่ Nova Pipeline
              </h3>
              <p className="text-xs text-indigo-100 font-medium mt-1">
                ทำภารกิจด้านล่างให้ครบเพื่อทำความเข้าใจการทำงานของระบบ
              </p>

              {/* Progress Bar */}
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-indigo-50">
                  <span>ความคืบหน้า</span>
                  <span>{progressPercent}% ({completedCount}/{tasks.length})</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            </div>

            {/* Checklist Items */}
            <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar-thin">
              {tasks.map((task) => {
                const isCompleted = completedTasks[task.key];
                return (
                  <div key={task.key} className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors ${isCompleted ? 'bg-slate-50' : 'hover:bg-slate-50'}`}>
                    <div className="mt-0.5 text-violet-600 shrink-0">
                      {isCompleted ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} className="text-slate-300" />}
                    </div>
                    <div>
                      <p className={`text-xs font-bold leading-snug ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {task.label}
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold leading-tight mt-0.5">{task.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-col gap-2">
              {/* Tour Trigger */}
              <button
                onClick={() => { setIsOpen(false); startTour(); }}
                className="w-full h-9 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Play size={12} className="fill-current text-slate-500" />
                <span>เริ่มต้นทัวร์แนะนำหน้าจอ</span>
              </button>

              {/* Demo Sandbox Mode */}
              <div className="flex justify-between items-center p-2 bg-white rounded-xl border border-slate-100 mt-1">
                <div>
                  <p className="text-[10px] font-bold text-slate-800">โหมดสาธิต (Demo Sandbox)</p>
                  <p className="text-[8px] text-slate-400 font-semibold leading-none">ทดลองระบบด้วยข้อมูลตัวอย่าง</p>
                </div>
                <button
                  onClick={toggleDemoMode}
                  className={`w-10 h-6 rounded-full flex items-center p-0.5 transition-all duration-300 ${isDemoMode ? 'bg-violet-600 justify-end' : 'bg-slate-200 justify-start'}`}
                >
                  <motion.div layout className="w-5 h-5 rounded-full bg-white shadow-md" />
                </button>
              </div>

              <div className="flex justify-between items-center text-[9px] text-slate-400 font-semibold pt-1">
                <span>เรียนรู้สำเร็จ ยอดขายเพิ่มขึ้น 🚀</span>
                <button onClick={resetOnboarding} className="hover:text-slate-600 flex items-center gap-0.5">
                  <RotateCcw size={10} /> รีเซ็ตใหม่
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button */}
      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-500/30 flex items-center justify-center relative border border-white/20"
        >
          {progressPercent < 100 ? (
            <div className="relative">
              <Trophy size={20} />
              <span className="absolute -top-2.5 -right-2.5 bg-rose-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full border border-white min-w-[16px] text-center">
                {tasks.length - completedCount}
              </span>
            </div>
          ) : (
            <Sparkles size={20} className="text-amber-300 fill-amber-300/20" />
          )}

          {/* Glowing Outer Ring */}
          <div className="absolute inset-0 rounded-full border border-violet-400 animate-ping opacity-20 pointer-events-none" />
        </motion.button>
      )}
    </div>
  );
}
