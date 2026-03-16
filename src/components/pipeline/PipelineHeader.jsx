import { TrendingUp, TrendingDown, Target, Activity } from 'lucide-react';
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
           <div className="w-1.5 h-10 bg-primary/40 rounded-full" />
           <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Pipeline Performance</h2>
              <div className="flex items-center gap-2 mt-0.5">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Global Overview • Real-time Data</p>
              </div>
           </div>
        </div>

        {/* TIME NAVIGATION */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-border/60 p-1 rounded-full shadow-sm">
             {MONTHS.map((m) => {
               const isActive = selectedMonth === m.value;
               const isToday = currentMonth === m.value && currentYear === selectedYear;
               return (
                 <button
                   key={m.value}
                   onClick={() => onMonthChange(m.value)}
                   className={cn(
                     "px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                     isActive 
                      ? "bg-primary text-white shadow-md shadow-primary/10" 
                      : "text-muted-foreground hover:text-foreground hover:bg-slate-50",
                     isToday && !isActive && "text-primary bg-primary/5"
                   )}
                 >
                   {m.short}
                 </button>
               );
             })}
          </div>
          
          <div className="relative">
            <select 
              value={selectedYear} 
              onChange={(e) => onYearChange(Number(e.target.value))}
              className="h-10 bg-white border border-border/60 rounded-full px-4 pr-8 text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer appearance-none shadow-sm"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {(selectedMonth !== currentMonth || selectedYear !== currentYear) && (
            <button
              onClick={handleResetToCurrent}
              className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/5 text-primary border border-primary/10 hover:bg-primary hover:text-white transition-all shadow-sm"
              title="Return to Today"
            >
              <Target size={18} />
            </button>
          )}
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="premium-card bg-white border-primary/10 shadow-sm lg:col-span-2 hover:shadow-md">
          <CardContent className="p-0">
            <div className="flex justify-between items-start mb-6">
               <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Monthly Sales Target</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tight">{formatValue(monthlyTotal)}</h3>
               </div>
               <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                  <Target size={28} />
               </div>
            </div>
            
            <div className="space-y-4">
               <div className="flex justify-between items-end">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Progress Status</span>
                  <span className="text-2xl font-black text-slate-900">{Math.round(progress)}%</span>
               </div>
               <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-primary relative rounded-full"
                  />
               </div>
               <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  <span>Current Revenue</span>
                  <span>Target: {formatValue(monthlyTarget)}</span>
               </div>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card bg-white shadow-sm hover:shadow-md">
           <CardContent className="p-0">
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Growth Index</p>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                       {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                    </h3>
                 </div>
                 <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center border",
                    isPositiveTrend ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
                 )}>
                    {isPositiveTrend ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                 </div>
              </div>
              <p className="text-[10px] font-medium text-muted-foreground leading-relaxed uppercase tracking-wider">
                 Revenue change compared to last month ({formatValue(lastMonthTotal)}).
              </p>
           </CardContent>
        </Card>

        <Card className="premium-card bg-white shadow-sm hover:shadow-md">
           <CardContent className="p-0">
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Active Deals</p>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{monthlyCount} Projects</h3>
                 </div>
                 <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                    <Activity size={24} />
                 </div>
              </div>
              <p className="text-[10px] font-medium text-muted-foreground leading-relaxed uppercase tracking-wider">
                 Deals currently in progress for this month. Lifetime deals: {totalDeals}.
              </p>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
