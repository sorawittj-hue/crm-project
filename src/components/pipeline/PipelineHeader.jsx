import { TrendingUp, TrendingDown, Target, Activity, ChevronLeft, ChevronRight, CalendarDays, AlertTriangle, Download, Zap, Sparkles, Briefcase } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import { downloadCsv } from '../../utils/exportUtils';

const MONTHS_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

function AnimatedNumber({ value, prefix = '', suffix = '' }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {prefix}{value}{suffix}
    </motion.span>
  );
}

export default function PipelineHeader({
  deals = [],
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
  weightedPipelineValue = 0,
}) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const progress = monthlyTarget > 0 ? (monthlyTotal / monthlyTarget) * 100 : 0;
  const trend = lastMonthTotal > 0 ? ((monthlyTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
  const isPositiveTrend = trend >= 0;
  const isCurrent = selectedMonth === currentMonth && selectedYear === currentYear;

  const goPrev = () => {
    if (selectedMonth === 0) { onMonthChange(11); onYearChange(selectedYear - 1); }
    else { onMonthChange(selectedMonth - 1); }
  };
  const goNext = () => {
    if (selectedMonth === 11) { onMonthChange(0); onYearChange(selectedYear + 1); }
    else { onMonthChange(selectedMonth + 1); }
  };
  const goToday = () => { onMonthChange(currentMonth); onYearChange(currentYear); };

  const formatValue = (val) =>
    new Intl.NumberFormat('th-TH', {
      style: 'currency', currency: 'THB',
      notation: 'compact', maximumFractionDigits: 1,
    }).format(val || 0);

  return (
    <div className="space-y-4">
      {/* MONTH NAVIGATOR */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white/80 dark:bg-[#0f111a]/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-2xl p-1 shadow-2xs gap-1">
            <button
              onClick={goPrev}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-violet-50 dark:hover:bg-white/10 hover:text-violet-600 dark:hover:text-white transition-all cursor-pointer"
              aria-label="เดือนก่อน"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-2 px-3 min-w-[190px] justify-center select-none">
              <div className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <CalendarDays size={13} />
              </div>
              <span className="text-xs md:text-sm font-extrabold text-slate-900 dark:text-white tracking-wide">
                {MONTHS_TH[selectedMonth]} {selectedYear + 543}
              </span>
              {isCurrent && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-violet-600 text-white rounded-full">
                  ปัจจุบัน
                </span>
              )}
            </div>
            <button
              onClick={goNext}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-violet-50 dark:hover:bg-white/10 hover:text-violet-600 dark:hover:text-white transition-all cursor-pointer"
              aria-label="เดือนถัดไป"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {!isCurrent && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={goToday}
              className="h-9 px-3 rounded-xl bg-violet-600 text-white hover:bg-violet-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Target size={13} /> กลับเดือนปัจจุบัน
            </motion.button>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            const dataToExport = deals.map(d => ({
              'หัวข้อดีล': d.title || '', 'ชื่อบริษัท': d.company || '',
              'มูลค่าดีล': d.value || 0, 'ขั้นตอน': d.stage || '',
              'โอกาสสำเร็จ (%)': d.probability || 0,
              'วันที่สร้าง': d.created_at ? new Date(d.created_at).toLocaleDateString('th-TH') : '',
              'วันที่คาดว่าจะปิด': d.expected_close_date ? new Date(d.expected_close_date).toLocaleDateString('th-TH') : '',
            }));
            downloadCsv(dataToExport, `Deals_Export_${MONTHS_TH[selectedMonth]}_${selectedYear}`);
          }}
          className="h-9 px-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.08] text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
        >
          <Download size={13} /> ส่งออก CSV
        </button>
      </div>

      {/* KPI STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
        {/* Monthly Target — Hero Card with Aurora background */}
        <div className="col-span-2 relative overflow-hidden rounded-2xl md:rounded-3xl p-5 md:p-6 aurora-bg text-white border border-white/[0.08] card-inset-highlight group hover:-translate-y-0.5 transition-all duration-300">
          <div className="noise-overlay absolute inset-0 rounded-2xl md:rounded-3xl" />
          <div className="glow-orb glow-orb-violet absolute -top-12 -left-12 w-40 h-40 opacity-40 pointer-events-none" />
          <div className="glow-orb glow-orb-cyan absolute -bottom-8 -right-8 w-32 h-32 opacity-25 pointer-events-none" />

          <div className="relative z-10 space-y-3 md:space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center shadow-xs">
                  <Zap size={15} className="text-amber-300 fill-amber-300" />
                </div>
                <div>
                  <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest flex items-center gap-1">
                    ยอดขายเดือนนี้ <Sparkles size={11} className="text-amber-300" />
                  </p>
                  <p className="text-[10px] text-white/80 font-medium">เป้าหมายประจำเดือน</p>
                </div>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-black">
                <Target size={12} className="text-amber-300" />
                <AnimatedNumber value={Math.round(progress)} suffix="%" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 flex-wrap pt-1">
              <span className="number-display text-2xl md:text-3xl lg:text-4xl text-white">
                <AnimatedNumber value={formatValue(monthlyTotal)} />
              </span>
              <span className="text-xs text-white/50 font-medium">จากเป้า {formatValue(monthlyTarget)}</span>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="h-2 bg-black/40 backdrop-blur-md rounded-full overflow-hidden p-0.5 border border-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, progress)}%` }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    progress >= 100
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-300'
                      : 'bg-gradient-to-r from-amber-300 via-violet-300 to-fuchsia-300'
                  )}
                />
              </div>
              {progress >= 100 ? (
                <p className="text-[11px] text-emerald-300 font-bold tracking-wide flex items-center gap-1">
                  🎉 ปิดเป้าหมายสำเร็จแล้ว
                </p>
              ) : (
                <p className="text-[10px] text-white/50 font-medium">
                  เหลืออีก {formatValue(Math.max(0, monthlyTarget - monthlyTotal))} เพื่อพิชิตเป้า
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Growth MoM — KPI Emerald / Rose */}
        <div className={cn(
          "p-4 md:p-5 rounded-2xl md:rounded-3xl border border-white/[0.07] ring-1 card-inset-highlight relative overflow-hidden flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-300",
          isPositiveTrend ? "kpi-emerald ring-emerald-500/20" : "kpi-rose ring-rose-500/20"
        )}>
          <div className="noise-overlay absolute inset-0 rounded-2xl md:rounded-3xl" />
          <div className="relative z-10 flex justify-between items-start">
            <p className={cn("text-[10px] font-bold tracking-widest uppercase", isPositiveTrend ? "text-emerald-300/80" : "text-rose-300/80")}>
              การเติบโต
            </p>
            <div className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-xs',
              isPositiveTrend ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
            )}>
              {isPositiveTrend ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            </div>
          </div>
          <div className="relative z-10 mt-3">
            <h3 className={cn('number-display text-2xl', isPositiveTrend ? 'text-emerald-50' : 'text-rose-50')}>
              {trend > 0 ? '+' : ''}
              <AnimatedNumber value={trend.toFixed(1)} suffix="%" />
            </h3>
            <p className="text-[10px] mt-1 font-medium text-white/35">เทียบกับเดือนก่อน</p>
          </div>
        </div>

        {/* Won deals count — KPI Amber */}
        <div className="p-4 md:p-5 rounded-2xl md:rounded-3xl border border-white/[0.07] ring-1 ring-amber-500/20 kpi-amber card-inset-highlight relative overflow-hidden flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-300">
          <div className="noise-overlay absolute inset-0 rounded-2xl md:rounded-3xl" />
          <div className="relative z-10 flex justify-between items-start">
            <p className="text-[10px] text-amber-300/80 font-bold tracking-widest uppercase">ปิดได้เดือนนี้</p>
            <div className="w-7 h-7 rounded-lg bg-amber-500/30 border border-amber-500/40 text-amber-300 flex items-center justify-center shadow-xs">
              <Activity size={14} />
            </div>
          </div>
          <div className="relative z-10 mt-3">
            <h3 className="number-display text-2xl text-amber-50">
              <AnimatedNumber value={monthlyCount} />
              <span className="text-xs font-bold text-amber-300/60 ml-1 font-sans">ดีล</span>
            </h3>
            <p className="text-[10px] text-white/35 mt-1 font-medium">ในระบบ {totalDeals} ดีล</p>
          </div>
        </div>

        {/* At risk — KPI Rose */}
        <div className="col-span-2 lg:col-span-1 p-4 md:p-5 rounded-2xl md:rounded-3xl border border-white/[0.07] ring-1 ring-rose-500/20 kpi-rose card-inset-highlight relative overflow-hidden flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-300">
          <div className="noise-overlay absolute inset-0 rounded-2xl md:rounded-3xl" />
          <div className="relative z-10 flex justify-between items-start">
            <p className="text-[10px] text-rose-300/80 font-bold tracking-widest uppercase">ดีลค้าง/เสี่ยง</p>
            <div className="w-7 h-7 rounded-lg bg-rose-500/30 border border-rose-500/40 text-rose-300 flex items-center justify-center shadow-xs">
              <AlertTriangle size={14} />
            </div>
          </div>
          <div className="relative z-10 mt-3">
            <h3 className="number-display text-2xl text-rose-50">
              <AnimatedNumber value={formatValue(atRiskValue)} />
            </h3>
            <p className="text-[10px] text-rose-300/60 mt-1 font-medium flex items-center gap-1">
              {atRiskCount} ดีล (&gt;7 วัน)
            </p>
          </div>
        </div>

        {/* Weighted Pipeline — KPI Violet */}
        <div className="col-span-2 lg:col-span-1 p-4 md:p-5 rounded-2xl md:rounded-3xl border border-white/[0.07] ring-1 ring-violet-500/20 kpi-violet card-inset-highlight relative overflow-hidden flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-300">
          <div className="noise-overlay absolute inset-0 rounded-2xl md:rounded-3xl" />
          <div className="relative z-10 flex justify-between items-start">
            <p className="text-[10px] text-violet-300/80 font-bold tracking-widest uppercase">Weighted</p>
            <div className="w-7 h-7 rounded-lg bg-violet-500/30 border border-violet-500/40 text-violet-300 flex items-center justify-center shadow-xs">
              <Briefcase size={14} />
            </div>
          </div>
          <div className="relative z-10 mt-3">
            <h3 className="number-display text-2xl text-white">
              <AnimatedNumber value={formatValue(weightedPipelineValue)} />
            </h3>
            <p className="text-[10px] text-white/35 mt-1 font-medium">มูลค่าถ่วงน้ำหนัก</p>
          </div>
        </div>
      </div>
    </div>
  );
}
