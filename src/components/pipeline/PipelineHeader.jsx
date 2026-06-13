import { TrendingUp, TrendingDown, Target, Activity, ChevronLeft, ChevronRight, CalendarDays, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

const MONTHS_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

function AnimatedNumber({ value, prefix = '', suffix = '' }) {
  return (
    <motion.span
      key={value}
      className="font-display"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {prefix}{value}{suffix}
    </motion.span>
  );
}

export default function PipelineHeader({
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  monthlyTotal,
  monthlyCount,
  totalDeals,
  monthlyTarget,
  lastMonthTotal,
  atRiskValue,
  atRiskCount,
}) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const progress = monthlyTarget > 0 ? (monthlyTotal / monthlyTarget) * 100 : 0;
  const trend = lastMonthTotal > 0 ? ((monthlyTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
  const isPositiveTrend = trend >= 0;

  const isCurrent = selectedMonth === currentMonth && selectedYear === currentYear;

  const goPrev = () => {
    if (selectedMonth === 0) {
      onMonthChange(11);
      onYearChange(selectedYear - 1);
    } else {
      onMonthChange(selectedMonth - 1);
    }
  };

  const goNext = () => {
    if (selectedMonth === 11) {
      onMonthChange(0);
      onYearChange(selectedYear + 1);
    } else {
      onMonthChange(selectedMonth + 1);
    }
  };

  const goToday = () => {
    onMonthChange(currentMonth);
    onYearChange(currentYear);
  };

  const formatValue = (val) =>
    new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(val || 0);

  return (
    <div className="space-y-4">
      {/* MONTH NAVIGATOR */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm gap-1">
          <button
            onClick={goPrev}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all"
            aria-label="เดือนก่อน"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-2 px-4 min-w-[190px] justify-center select-none">
            <CalendarDays size={15} className="text-violet-500" />
            <span className="text-sm font-bold text-slate-900 tabular-nums">
              {MONTHS_TH[selectedMonth]} {selectedYear + 543}
            </span>
            {isCurrent && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-violet-100 text-violet-600 rounded-full">
                ปัจจุบัน
              </span>
            )}
          </div>

          <button
            onClick={goNext}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all"
            aria-label="เดือนถัดไป"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {!isCurrent && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={goToday}
            className="h-10 px-5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-violet-200"
          >
            <Target size={14} />
            กลับไปเดือนปัจจุบัน
          </motion.button>
        )}
      </div>

      {/* KPI STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Target progress — prominent */}
        <div className="col-span-2 p-5 rounded-2xl bg-gradient-to-br from-violet-600 via-violet-700 to-purple-700 text-white shadow-lg shadow-violet-500/25 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute -bottom-12 -left-6 w-28 h-28 rounded-full bg-white/5" />
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-violet-200 font-semibold tracking-wide uppercase">ยอดขายเดือนนี้</p>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-xs font-bold backdrop-blur-sm">
                <Target size={11} />
                <AnimatedNumber value={Math.round(progress)} suffix="%" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl font-black tabular-nums leading-none tracking-tight">
                <AnimatedNumber value={formatValue(monthlyTotal)} />
              </span>
              <span className="text-xs text-violet-200">จากเป้า {formatValue(monthlyTarget)}</span>
            </div>

            <div className="space-y-1.5">
              <div className="h-2 bg-white/15 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, progress)}%` }}
                  transition={{ duration: 1.4, ease: [0.19, 1, 0.22, 1] }}
                  className={cn(
                    'h-full rounded-full',
                    progress >= 100 ? 'bg-emerald-300' : progress >= 70 ? 'bg-white' : 'bg-white/80'
                  )}
                />
              </div>
              {progress >= 100 && (
                <p className="text-[10px] text-emerald-200 font-bold">🎉 ทะลุเป้าแล้ว!</p>
              )}
            </div>
          </div>
        </div>

        {/* Growth */}
        <div className={cn(
          'p-5 rounded-2xl border shadow-sm flex flex-col justify-between relative overflow-hidden',
          isPositiveTrend
            ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100'
            : 'bg-gradient-to-br from-rose-50 to-red-50 border-rose-100'
        )}>
          <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-20"
            style={{ backgroundColor: isPositiveTrend ? '#10b981' : '#f43f5e' }} />
          <div className="flex justify-between items-start relative z-10">
            <p className="text-xs font-semibold tracking-wide uppercase"
              style={{ color: isPositiveTrend ? '#059669' : '#e11d48' }}>การเติบโต</p>
            <div
              className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center shadow-sm',
                isPositiveTrend ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500'
              )}
            >
              {isPositiveTrend ? <TrendingUp size={17} /> : <TrendingDown size={17} />}
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <h3
              className={cn(
                'text-2xl font-black tabular-nums leading-none',
                isPositiveTrend ? 'text-emerald-600' : 'text-rose-500'
              )}
            >
              {trend > 0 ? '+' : ''}
              <AnimatedNumber value={trend.toFixed(1)} suffix="%" />
            </h3>
            <p className="text-xs mt-1.5" style={{ color: isPositiveTrend ? '#6ee7b7' : '#fca5a5' }}>
              เทียบกับเดือนก่อน
            </p>
          </div>
        </div>

        {/* Deal count */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-amber-200/30" />
          <div className="flex justify-between items-start relative z-10">
            <p className="text-xs text-amber-700 font-semibold tracking-wide uppercase">ปิดได้เดือนนี้</p>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-500 flex items-center justify-center shadow-sm">
              <Activity size={17} />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <h3 className="text-2xl font-black text-amber-700 tabular-nums leading-none">
              <AnimatedNumber value={monthlyCount} />
              <span className="text-sm font-semibold text-amber-400 ml-1">ดีล</span>
            </h3>
            <p className="text-xs text-amber-400 mt-1.5">ทั้งหมดในระบบ {totalDeals} ดีล</p>
          </div>
        </div>

        {/* At risk count / value */}
        <div className="col-span-2 lg:col-span-1 p-5 rounded-2xl bg-gradient-to-br from-rose-50 via-rose-50/50 to-orange-50/30 border border-rose-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-rose-200/25" />
          <div className="flex justify-between items-start relative z-10">
            <p className="text-xs text-rose-800 font-semibold tracking-wide uppercase">ดีลค้าง/เสี่ยงสูง</p>
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-500 flex items-center justify-center shadow-sm">
              <AlertTriangle size={17} className="animate-pulse" />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <h3 className="text-2xl font-black text-rose-800 tabular-nums leading-none">
              <AnimatedNumber value={formatValue(atRiskValue)} />
            </h3>
            <p className="text-xs text-rose-500 mt-1.5 font-semibold">
              จำนวน {atRiskCount} ดีล (&gt;7 วัน)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
