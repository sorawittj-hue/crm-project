import { TrendingUp, TrendingDown, Target, Activity, Zap, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card, CardContent } from '../ui/Card';
import { motion } from 'framer-motion';

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
  onMonthChange,
  onYearChange,
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

  const handleResetToCurrent = () => {
    onMonthChange(currentMonth);
    onYearChange(currentYear);
  };

  const formatValue = (val) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', notation: 'compact' }).format(val || 0);

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <div className="w-1.5 h-12 bg-primary rounded-full shadow-[0_0_20px_rgba(var(--primary),0.8)]" />
           <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter italic">Tactical Board</h2>
              <div className="flex items-center gap-2 mt-1">
                 <ShieldCheck size={12} className="text-primary" />
                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Sector Synchronization: Online</p>
              </div>
           </div>
        </div>

        {/* TIME NAVIGATION */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-muted/30 border border-border/40 p-1 rounded-2xl">
             {MONTHS.map((m) => {
               const isActive = selectedMonth === m.value;
               const isToday = currentMonth === m.value && currentYear === selectedYear;
               return (
                 <button
                   key={m.value}
                   onClick={() => onMonthChange(m.value)}
                   className={cn(
                     "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                     isActive 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                     isToday && !isActive && "text-primary border-b border-primary/40 rounded-none"
                   )}
                 >
                   {m.short}
                 </button>
               );
             })}
          </div>
          
          <select 
            value={selectedYear} 
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="h-10 bg-muted/30 border border-border/40 rounded-2xl px-3 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {(selectedMonth !== currentMonth || selectedYear !== currentYear) && (
            <button
              onClick={handleResetToCurrent}
              className="h-10 w-10 flex items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all"
              title="Back to Current Month"
            >
              <Zap size={18} />
            </button>
          )}
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="premium-card bg-gradient-to-br from-primary/10 to-transparent border-primary/20 lg:col-span-2">
          <CardContent className="p-0">
            <div className="flex justify-between items-start mb-6">
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Sector Goal Progress</p>
                  <h3 className="text-4xl font-black tabular-nums">{formatValue(monthlyTotal)}</h3>
               </div>
               <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                  <Target size={28} />
               </div>
            </div>
            
            <div className="space-y-3">
               <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Yield Efficiency</span>
                  <span className="text-2xl font-black text-primary">{Math.round(progress)}%</span>
               </div>
               <div className="h-3 bg-muted rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-primary relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </motion.div>
               </div>
               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <span>Threshold 0.0</span>
                  <span>Target: {formatValue(monthlyTarget)}</span>
               </div>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card">
           <CardContent className="p-0">
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Momentum Trend</p>
                    <h3 className="text-3xl font-black tabular-nums">
                       {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                    </h3>
                 </div>
                 <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shadow-inner",
                    isPositiveTrend ? "bg-emerald-500/20 text-emerald-500" : "bg-destructive/20 text-destructive"
                 )}>
                    {isPositiveTrend ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                 </div>
              </div>
              <p className="text-[10px] font-medium text-muted-foreground leading-relaxed uppercase tracking-wider">
                 Performance delta relative to previous temporal cycle ({formatValue(lastMonthTotal)}).
              </p>
           </CardContent>
        </Card>

        <Card className="premium-card border-blue-500/20">
           <CardContent className="p-0">
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Active Operatives</p>
                    <h3 className="text-3xl font-black tabular-nums">{monthlyCount} Units</h3>
                 </div>
                 <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500 shadow-inner">
                    <Activity size={24} />
                 </div>
              </div>
              <p className="text-[10px] font-medium text-muted-foreground leading-relaxed uppercase tracking-wider">
                 Concurrent high-value operations active in the signal matrix. Total lifetime assets: {totalDeals}.
              </p>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
