import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

const PRESETS = [
  { id: '7days',     label: '7 วัน' },
  { id: '30days',    label: '30 วัน' },
  { id: 'thisMonth', label: 'เดือนนี้' },
  { id: '3months',   label: '3 เดือน' },
  { id: '6months',   label: '6 เดือน' },
  { id: 'thisYear',  label: 'ปีนี้' },
  { id: 'custom',    label: 'กำหนดเอง' },
];

export default function DateRangePicker({ value, onChange, customFrom, customTo, onCustomChange }) {
  const [open, setOpen] = useState(false);
  const current = PRESETS.find(p => p.id === value) || PRESETS[1];

  const handleSelect = (preset) => {
    onChange(preset.id);
    if (preset.id !== 'custom') setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 h-9 px-4 rounded-xl bg-white/80 dark:bg-white/[0.06] backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-violet-300 dark:hover:border-violet-500/40 hover:text-violet-600 dark:hover:text-violet-400 transition-all shadow-sm cursor-pointer"
      >
        <CalendarDays size={13} className="text-violet-500" />
        {value === 'custom' && customFrom && customTo
          ? `${customFrom} — ${customTo}`
          : current.label
        }
        <ChevronDown size={13} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-11 z-50 bg-white/95 dark:bg-[#0f111a]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-2xl shadow-slate-900/10 dark:shadow-black/40 p-3 min-w-[200px]"
            >
              <div className="grid grid-cols-2 gap-1.5 mb-2">
                {PRESETS.filter(p => p.id !== 'custom').map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelect(preset)}
                    className={cn(
                      'px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer',
                      value === preset.id
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:text-violet-600 dark:hover:text-violet-300'
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-100 dark:border-white/[0.06] pt-2 mt-1">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">กำหนดเอง</p>
                <div className="space-y-1.5">
                  <input
                    type="date"
                    value={customFrom || ''}
                    onChange={e => { onChange('custom'); onCustomChange?.('from', e.target.value); }}
                    className="w-full h-8 px-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-white/[0.05] outline-none focus:border-violet-400 transition-colors"
                  />
                  <input
                    type="date"
                    value={customTo || ''}
                    onChange={e => { onChange('custom'); onCustomChange?.('to', e.target.value); }}
                    className="w-full h-8 px-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-white/[0.05] outline-none focus:border-violet-400 transition-colors"
                  />
                </div>
                {value === 'custom' && (
                  <button
                    onClick={() => setOpen(false)}
                    className="mt-2 w-full py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    ยืนยัน
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
