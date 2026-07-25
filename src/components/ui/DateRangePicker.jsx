import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, ChevronDown, X } from 'lucide-react';
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
        className="flex items-center gap-2 h-9 px-4 rounded-xl bg-white/80 backdrop-blur-md border border-slate-200/80 text-xs font-bold text-slate-700 hover:border-violet-300 hover:text-violet-600 transition-all shadow-sm"
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
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 z-50 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-2xl shadow-slate-900/10 p-3 min-w-[200px]"
          >
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              {PRESETS.filter(p => p.id !== 'custom').map(preset => (
                <button
                  key={preset.id}
                  onClick={() => handleSelect(preset)}
                  className={cn(
                    'px-3 py-2 rounded-xl text-xs font-bold transition-all text-left',
                    value === preset.id
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20'
                      : 'text-slate-600 hover:bg-violet-50 hover:text-violet-600'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-2 mt-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">กำหนดเอง</p>
              <div className="space-y-1.5">
                <input
                  type="date"
                  value={customFrom || ''}
                  onChange={e => { onChange('custom'); onCustomChange?.('from', e.target.value); }}
                  className="w-full h-8 px-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50"
                />
                <input
                  type="date"
                  value={customTo || ''}
                  onChange={e => { onChange('custom'); onCustomChange?.('to', e.target.value); }}
                  className="w-full h-8 px-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50"
                />
              </div>
              {value === 'custom' && (
                <button
                  onClick={() => setOpen(false)}
                  className="mt-2 w-full py-1.5 rounded-xl bg-violet-600 text-white text-xs font-bold"
                >
                  ยืนยัน
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
