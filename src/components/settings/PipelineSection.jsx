import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import { STAGES } from '../../lib/constants';

const STAGE_COLORS = {
  lead: 'bg-indigo-100 text-indigo-700',
  contact: 'bg-violet-100 text-violet-700',
  proposal: 'bg-pink-100 text-pink-700',
  negotiation: 'bg-orange-100 text-orange-700',
  won: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-rose-100 text-rose-600',
};

export function PipelineSection() {
  return (
    <Card className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-3xl border border-white shadow-xl shadow-slate-200/50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-400/10 to-transparent rounded-bl-full -z-0 pointer-events-none" />
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight relative z-10">ขั้นตอนดีล (Pipeline Stages)</h2>
          <p className="text-sm font-medium text-slate-500 mt-1 relative z-10">{STAGES.length} ขั้นตอนที่ใช้ในระบบ Pipeline</p>
        </div>
      </div>
      <div className="space-y-3 relative z-10">
        {STAGES.map((s, i) => (
          <div key={s.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 border border-white/50 backdrop-blur-sm">
            <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-400">
              {i + 1}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">{s.label}</p>
              <p className="text-xs text-slate-400 font-mono">{s.id}</p>
            </div>
            <span className={cn('px-3 py-1 rounded-full text-xs font-semibold', STAGE_COLORS[s.id])}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl">
        การปรับแต่งขั้นตอนสามารถทำได้ในรุ่นถัดไป
      </p>
    </Card>
  );
}
