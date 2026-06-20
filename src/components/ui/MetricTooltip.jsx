import { useState } from 'react';
import { Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MetricTooltip({ label, explanation, formula, position = 'top' }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-flex items-center gap-1 group">
      <span className="cursor-help border-b border-dashed border-slate-300 group-hover:border-violet-400 transition-colors">
        {label}
      </span>
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        className="text-slate-400 hover:text-violet-600 transition-colors p-0.5 rounded focus:outline-none"
        aria-label={`ข้อมูลเพิ่มเติมสำหรับ ${label}`}
      >
        <Info size={12} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`absolute z-[100] w-64 p-3.5 bg-slate-950/95 text-white backdrop-blur-md rounded-2xl shadow-xl text-xs leading-relaxed font-sans pointer-events-none border border-white/10
              ${position === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2.5' : ''}
              ${position === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-2.5' : ''}
            `}
          >
            <p className="font-bold text-violet-300 mb-1">{label}</p>
            <p className="text-slate-200 font-medium">{explanation}</p>
            {formula && (
              <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-indigo-200 font-mono">
                <span className="font-bold uppercase text-[9px] block text-slate-400 mb-0.5">สูตรคำนวณ:</span>
                {formula}
              </div>
            )}
            <div className={`absolute left-1/2 -translate-x-1/2 border-[6px] border-transparent 
              ${position === 'top' ? 'top-full border-t-slate-950/95' : ''}
              ${position === 'bottom' ? 'bottom-full border-b-slate-950/95' : ''}
            `} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
