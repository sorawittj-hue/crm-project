import { TrendingUp, TrendingDown, Target, Activity, ChevronLeft, ChevronRight, CalendarDays, AlertTriangle, Download, Zap, Sparkles } from 'lucide-react';
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
      transition={{ duration: 0.4, ease: 'easeOut' }}
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
          <div className="flex items-center bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-1 shadow-[0_2px_12px_rgba(0,0,0,0.03)] gap-1">
            <button
              onClick={goPrev}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-violet-50 hover:text-violet-600 transition-all duration-200"
              aria-label="เดือนก่อน"
            >
              <ChevronLeft size={17} />
            </button>
            <div className="flex items-center gap-2 px-4 min-w-[200px] justify-center select-none">
              <div className="w-6 h-6 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
                <CalendarDays size={13} />
              </div>
              <span className="text-sm font-extrabold text-slate-900 tracking-wide">
                {MONTHS_TH[selectedMonth]} {selectedYear + 543}
              </span>
              {isCurrent && (
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full shadow-sm shadow-violet-500/20">
                  ปัจจุบัน
                </span>
              )}
            </div>
            <button
              onClick={goNext}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-violet-50 hover:text-violet-600 transition-all duration-200"
              aria-label="เดือนถัดไป"
            >
              <ChevronRight size={17} />
            </button>
          </div>

          {!isCurrent && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={goToday}
              className="h-10 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-violet-500/20 active:scale-95"
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
          className="h-10 px-4 rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-md text-slate-600 hover:bg-violet-50/50 hover:border-violet-200 hover:text-violet-600 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
        >
          <Download size={14} /> ส่งออก CSV
        </button>
      </div>

      {/* KPI STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Monthly Target — Hero Card */}
        <div className="col-span-2 relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-violet-700 via-indigo-800 to-slate-900 text-white shadow-xl shadow-violet-600/20 border border-violet-400/20 group hover:-translate-y-0.5 transition-all duration-500">
          {/* Animated Glow Blobs */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-violet-400/20 blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
          <div className="absolute -bottom-16 -left-10 w-40 h-40 rounded-full bg-fuchsia-500/15 blur-2xl pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-violet-300/40 to-transparent" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                  <Zap size={16} className="text-amber-300 fill-amber-300" />
                </div>
                <div>
                  <p className="text-[11px] text-violet-200 font-extrabold uppercase tracking-widest flex items-center gap-1">
                    ยอดขายเดือนนี้ <Sparkles size={11} className="text-amber-300" />
                  </p>
                  <p className="text-[10px] text-violet-300/80">เป้าหมายประจำเดือน</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-xs font-black">
                <Target size={12} className="text-amber-300" />
                <AnimatedNumber value={Math.round(progress)} suffix="%" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 flex-wrap pt-1">
              <span className="text-3xl lg:text-4xl font-black tabular-nums leading-none tracking-tight">
                <AnimatedNumber value={formatValue(monthlyTotal)} />
              </span>
              <span className="text-xs text-violet-200 font-medium">จากเป้า {formatValue(monthlyTarget)}</span>
            </div>

            <div className="space-y-2 pt-1">
              <div className="h-2.5 bg-black/20 backdrop-blur-md rounded-full overflow-hidden p-0.5 border border-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, progress)}%` }}
                  transition={{ duration: 1.4, ease: [0.19, 1, 0.22, 1] }}
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    progress >= 100
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-300 shadow-[0_0_12px_rgba(52,211,153,0.8)]'
                      : 'bg-gradient-to-r from-amber-300 via-violet-300 to-fuchsia-300 shadow-[0_0_10px_rgba(255,255,255,0.6)]'
                  )}
                />
              </div>
              {progress >= 100 ? (
                <p className="text-[11px] text-emerald-300 font-extrabold tracking-wide flex items-center gap-1">
                  🎉 ยินดีด้วย! ปิดเป้าหมายสำเร็จแล้ว
                </p>
              ) : (
                <p className="text-[10px] text-violet-200/80 font-medium">
                  เหลืออีก {formatValue(Math.max(0, monthlyTarget - monthlyTotal))} เพื่อพิชิตเป้าหมาย
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Growth MoM */}
        <div className={cn(
          'p-5 rounded-3xl border flex flex-col justify-between relative overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 bg-white/80 backdrop-blur-md',
          isPositiveTrend
            ? 'border-emerald-200/80 shadow-[0_8px_30px_rgba(16,185,129,0.06)] hover:border-emerald-300'
            : 'border-rose-200/80 shadow-[0_8px_30px_rgba(244,63,94,0.06)] hover:border-rose-300'
        )}>
          <div
            className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full opacity-15 pointer-events-none group-hover:scale-125 transition-transform duration-500"
            style={{ backgroundColor: isPositiveTrend ? '#10b981' : '#f43f5e' }}
          />
          <div className="flex justify-between items-start relative z-10">
            <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: isPositiveTrend ? '#059669' : '#e11d48' }}>
              การเติบโต
            </p>
            <div className={cn(
              'w-9 h-9 rounded-2xl flex items-center justify-center shadow-md',
              isPositiveTrend
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/20'
                : 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/20'
            )}>
              {isPositiveTrend ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <h3 className={cn('text-2xl font-black tabular-nums leading-none tracking-tight', isPositiveTrend ? 'text-emerald-600' : 'text-rose-600')}>
              {trend > 0 ? '+' : ''}
              <AnimatedNumber value={trend.toFixed(1)} suffix="%" />
            </h3>
            <p className="text-[11px] mt-2 font-bold text-slate-400">เทียบกับเดือนก่อน</p>
          </div>
        </div>

        {/* Won deals count */}
        <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-md border border-amber-200/80 shadow-[0_8px_30px_rgba(245,158,11,0.06)] hover:border-amber-300 flex flex-col justify-between relative overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-amber-400/10 pointer-events-none group-hover:scale-125 transition-transform duration-500" />
          <div className="flex justify-between items-start relative z-10">
            <p className="text-[10px] text-amber-700 font-black tracking-widest uppercase">ปิดได้เดือนนี้</p>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Activity size={16} />
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <h3 className="text-2xl font-black text-slate-900 tabular-nums leading-none tracking-tight">
              <AnimatedNumber value={monthlyCount} />
              <span className="text-xs font-extrabold text-slate-400 ml-1.5">ดีล</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-2 font-bold">ในระบบทั้งหมด {totalDeals} ดีล</p>
          </div>
        </div>

        {/* At risk */}
        <div className="col-span-2 lg:col-span-1 p-5 rounded-3xl bg-white/80 backdrop-blur-md border border-rose-200/80 shadow-[0_8px_30px_rgba(244,63,94,0.06)] hover:border-rose-300 flex flex-col justify-between relative overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-rose-400/10 pointer-events-none group-hover:scale-125 transition-transform duration-500" />
          <div className="flex justify-between items-start relative z-10">
            <p className="text-[10px] text-rose-700 font-black tracking-widest uppercase">ดีลค้าง/เสี่ยงสูง</p>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <AlertTriangle size={16} className={atRiskCount > 0 ? 'animate-pulse' : ''} />
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <h3 className="text-2xl font-black text-rose-600 tabular-nums leading-none tracking-tight">
              <AnimatedNumber value={formatValue(atRiskValue)} />
            </h3>
            <p className="text-[11px] text-rose-500/80 mt-2 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              {atRiskCount} ดีล (&gt;7 วัน ไม่มีกิจกรรม)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
