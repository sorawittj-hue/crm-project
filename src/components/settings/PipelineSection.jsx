import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import { STAGES } from '../../lib/constants';
import { Info, ArrowRight } from 'lucide-react';

const STAGE_STYLES = {
  lead: { bg: 'from-indigo-50 to-indigo-100/50', border: 'border-l-indigo-500', dot: 'bg-indigo-500', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700' },
  contact: { bg: 'from-violet-50 to-violet-100/50', border: 'border-l-violet-500', dot: 'bg-violet-500', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700' },
  proposal: { bg: 'from-pink-50 to-pink-100/50', border: 'border-l-pink-500', dot: 'bg-pink-500', text: 'text-pink-700', badge: 'bg-pink-100 text-pink-700' },
  negotiation: { bg: 'from-orange-50 to-orange-100/50', border: 'border-l-orange-500', dot: 'bg-orange-500', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
  won: { bg: 'from-emerald-50 to-emerald-100/50', border: 'border-l-emerald-500', dot: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  lost: { bg: 'from-rose-50 to-rose-100/50', border: 'border-l-rose-500', dot: 'bg-rose-500', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-700' },
};

export function PipelineSection() {
  return (
    <Card className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-3xl border border-white shadow-xl shadow-slate-200/50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-400/10 to-transparent rounded-bl-full -z-0 pointer-events-none" />
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">ขั้นตอนดีล (Pipeline Stages)</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold mr-2">{STAGES.length} ขั้นตอน</span>
            ลำดับขั้นตอนที่ใช้ในระบบ
          </p>
        </div>
      </div>

      {/* Pipeline Flow */}
      <div className="relative z-10">
        {/* Vertical connector line */}
        <div className="absolute left-[19px] top-6 bottom-6 w-px bg-gradient-to-b from-indigo-200 via-violet-200 to-rose-200" />

        <div className="space-y-3">
          {STAGES.map((s, i) => {
            const style = STAGE_STYLES[s.id] || STAGE_STYLES.lead;
            const isLast = i === STAGES.length - 1;
            return (
              <div
                key={s.id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r border-l-4 transition-all hover:translate-x-1 hover:shadow-md cursor-default group',
                  style.bg, style.border
                )}
              >
                {/* Colored dot */}
                <div className="relative z-10">
                  <div className={cn('w-[10px] h-[10px] rounded-full ring-4 ring-white shadow-sm', style.dot)} />
                </div>

                {/* Stage info */}
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-bold', style.text)}>{s.label}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{s.id}</p>
                </div>

                {/* Step number */}
                <span className={cn('px-2.5 py-1 rounded-full text-[11px] font-bold', style.badge)}>
                  Step {i + 1}
                </span>

                {/* Arrow for non-last items */}
                {!isLast && (
                  <ArrowRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer note */}
      <div className="flex items-start gap-2.5 mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 relative z-10">
        <Info size={14} className="text-slate-400 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-500 leading-relaxed">
          การปรับแต่งลำดับขั้นตอนจะเปิดใช้งานในเวอร์ชั่นถัดไป ขณะนี้ขั้นตอนถูกตั้งค่าไว้แบบคงที่
        </p>
      </div>
    </Card>
  );
}
