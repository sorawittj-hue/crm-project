import { formatFullCurrency } from '../../lib/formatters';

/**
 * Shared recharts tooltip component used across analytics charts
 */
export default function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-100 p-4 rounded-[1.5rem] shadow-2xl backdrop-blur-md bg-white/90">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{entry.name}</span>
              </div>
              <p className="text-sm font-black text-slate-900 tabular-nums">{formatFullCurrency(entry.value)}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}
