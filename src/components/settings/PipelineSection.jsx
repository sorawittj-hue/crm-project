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
    <Card className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">ขั้นตอนดีล</h2>
        <p className="text-xs text-slate-400 mt-0.5">ขั้นตอนที่ใช้ในระบบ Pipeline</p>
      </div>
      <div className="space-y-3">
        {STAGES.map((s, i) => (
          <div key={s.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
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
