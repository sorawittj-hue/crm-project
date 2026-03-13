import { ChevronRight, Target, TrendingUp, TrendingDown, Calendar, DollarSign, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';

const MONTHS = [
  { value: 0, label: 'January', short: 'Jan' },
  { value: 1, label: 'February', short: 'Feb' },
  { value: 2, label: 'March', short: 'Mar' },
  { value: 3, label: 'April', short: 'Apr' },
  { value: 4, label: 'May', short: 'May' },
  { value: 5, label: 'June', short: 'Jun' },
  { value: 6, label: 'July', short: 'Jul' },
  { value: 7, label: 'August', short: 'Aug' },
  { value: 8, label: 'September', short: 'Sep' },
  { value: 9, label: 'October', short: 'Oct' },
  { value: 10, label: 'November', short: 'Nov' },
  { value: 11, label: 'December', short: 'Dec' },
];

export default function PipelineHeader({ 
  selectedMonth, 
  selectedYear, 
  monthlyTotal, 
  monthlyCount, 
  totalDeals,
  monthlyTarget,
  lastMonthTotal 
}) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const progress = monthlyTarget > 0 ? (monthlyTotal / monthlyTarget) * 100 : 0;
  const trend = lastMonthTotal > 0 ? ((monthlyTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
  const isPositiveTrend = trend >= 0;

  return (
    <div className="space-y-6">
      {/* MAIN HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
            <div>
              <h1 className="text-4xl font-black tracking-tighter uppercase italic bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                Tactical Matrix
              </h1>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1">
                Pipeline Board • Real-time deal orchestration
              </p>
            </div>
          </div>
        </div>

        {/* MONTH SELECTOR */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1.5 border border-white/10">
            <Calendar size={16} className="text-muted-foreground ml-2" />
            <span className="text-sm font-black uppercase tracking-wider px-2">
              {MONTHS[selectedMonth].label} {selectedYear}
            </span>
            {(selectedMonth !== currentMonth || selectedYear !== currentYear) && (
              <button
                onClick={() => {}}
                className="text-[9px] font-black uppercase tracking-wider text-primary hover:text-primary/80 px-2 py-1 rounded-lg bg-primary/10 transition-colors"
              >
                Current
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Volume with Progress */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 relative overflow-hidden">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                Monthly Volume vs Target
              </p>
              <p className="text-2xl font-black tabular-nums">
                {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', notation: 'compact' }).format(monthlyTotal)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <Target size={20} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-primary">{progress.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-wider">
              Target: {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', notation: 'compact' }).format(monthlyTarget)}
            </p>
          </div>
        </div>

        {/* Trend vs Last Month */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                vs Last Month
              </p>
              <p className="text-2xl font-black tabular-nums">
                {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', notation: 'compact' }).format(lastMonthTotal || 0)}
              </p>
            </div>
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              isPositiveTrend ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500"
            )}>
              {isPositiveTrend ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
          </div>
          <div className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider",
            isPositiveTrend ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500"
          )}>
            {isPositiveTrend ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        </div>

        {/* Active Deals */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                Active Deals
              </p>
              <p className="text-2xl font-black tabular-nums">{monthlyCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
              <Activity size={20} />
            </div>
          </div>
          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-wider">
            Total: {totalDeals} deals
          </p>
        </div>
      </div>
    </div>
  );
}
