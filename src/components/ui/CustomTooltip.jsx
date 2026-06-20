import { formatFullCurrency } from '../../lib/formatters';

/**
 * Shared recharts tooltip component used across analytics charts
 */
export default function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/80 border border-slate-700/50 p-4 rounded-[1.25rem] shadow-[0_0_30px_-5px_rgba(0,0,0,0.5)] backdrop-blur-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50 pointer-events-none" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 relative z-10">{label}</p>
        <div className="space-y-1.5 relative z-10">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: entry.color, color: entry.color }} />
                <span className="text-[10px] font-bold text-slate-200 uppercase tracking-tight">{entry.name}</span>
              </div>
              <p className="text-sm font-black text-white tabular-nums drop-shadow-sm">{formatFullCurrency(entry.value)}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}
