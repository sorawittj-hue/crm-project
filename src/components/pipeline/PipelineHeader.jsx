import { TrendingUp, TrendingDown, Target, Activity, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

const MONTHS_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
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
  lastMonthTotal,
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
    <div className="space-y-5">
      {/* MONTH NAVIGATOR */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
          <button
            onClick={goPrev}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all"
            aria-label="เดือนก่อน"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-2 px-4 min-w-[180px] justify-center select-none">
            <CalendarDays size={15} className="text-violet-500" />
            <span className="text-sm font-bold text-slate-900 tabular-nums">
              {MONTHS_TH[selectedMonth]} {selectedYear + 543}
            </span>
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
          <button
            onClick={goToday}
            className="h-10 px-4 rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <Target size={14} /> กลับไปเดือนปัจจุบัน
          </button>
        )}
      </div>

      {/* COMPACT KPI STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Target progress — prominent */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-700 text-white shadow-md shadow-violet-500/20 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/5" />
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-violet-100 font-medium">ยอดขายเดือนนี้</p>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-bold">
                <Target size={11} />
                {Math.round(progress)}%
              </div>
            </div>

            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl font-bold tabular-nums leading-none">{formatValue(monthlyTotal)}</span>
              <span className="text-xs text-violet-100">จากเป้า {formatValue(monthlyTarget)}</span>
            </div>

            <div className="h-2 bg-white/15 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, progress)}%` }}
                transition={{ duration: 1.2, ease: [0.19, 1, 0.22, 1] }}
                className="h-full bg-white rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Growth */}
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-xs text-slate-400 font-medium">การเติบโต</p>
            <div
              className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center',
                isPositiveTrend ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
              )}
            >
              {isPositiveTrend ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            </div>
          </div>
          <div className="mt-3">
            <h3
              className={cn(
                'text-2xl font-bold tabular-nums leading-none',
                isPositiveTrend ? 'text-emerald-600' : 'text-rose-500'
              )}
            >
              {trend > 0 ? '+' : ''}
              {trend.toFixed(1)}%
            </h3>
            <p className="text-[11px] text-slate-400 mt-1.5">เทียบเดือนที่แล้ว</p>
          </div>
        </div>

        {/* Deal count */}
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-xs text-slate-400 font-medium">จำนวนดีล</p>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Activity size={16} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 tabular-nums leading-none">
              {monthlyCount}
              <span className="text-sm text-slate-400 font-medium ml-1">ดีล</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-1.5">รวมทั้งระบบ {totalDeals} ดีล</p>
          </div>
        </div>
      </div>
    </div>
  );
}
