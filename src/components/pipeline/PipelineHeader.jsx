import { TrendingUp, TrendingDown, Target, Activity, ChevronLeft, ChevronRight, CalendarDays, AlertTriangle, Download, Zap } from 'lucide-react';
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
          <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm gap-1">
            <button onClick={goPrev} className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-violet-50 hover:text-violet-600 transition-colors" aria-label="เดือนก่อน">
              <ChevronLeft size={17} />
            </button>
            <div className="flex items-center gap-2 px-4 min-w-[190px] justify-center select-none">
              <CalendarDays size={15} className="text-violet-500" />
              <span className="text-sm font-black text-slate-900 tracking-wide">
                {MONTHS_TH[selectedMonth]} {selectedYear + 543}
              </span>
              {isCurrent && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full border border-violet-200">
                  ปัจจุบัน
                </span>
              )}
            </div>
            <button onClick={goNext} className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-violet-50 hover:text-violet-600 transition-colors" aria-label="เดือนถัดไป">
              <ChevronRight size={17} />
            </button>
          </div>

          {!isCurrent && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={goToday}
              className="h-10 px-4 rounded-xl bg-violet-600 text-white hover:bg-violet-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-violet-500/20"
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
          className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-violet-600 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
        >
          <Download size={14} /> ส่งออก CSV
        </button>
      </div>

      {/* KPI STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Monthly Target — Hero Card */}
        <div className="col-span-2 relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-violet-600 via-indigo-700 to-purple-800 text-white shadow-xl shadow-violet-500/30 border border-violet-500/20 group hover:-translate-y-0.5 transition-all duration-300">
          {/* decorative blobs */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute -bottom-14 -left-8 w-32 h-32 rounded-full bg-white/5" />
          {/* shimmer stripe */}
          <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-violet-400 to-purple-600 opacity-60 rounded-l-2xl" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                  <Zap size={15} className="text-white" />
                </div>
                <p className="text-xs text-violet-200 font-bold uppercase tracking-widest">ยอดขายเดือนนี้</p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-xs font-black backdrop-blur-sm">
                <Target size={10} />
                <AnimatedNumber value={Math.round(progress)} suffix="%" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl font-black tabular-nums leading-none tracking-tight">
                <AnimatedNumber value={formatValue(monthlyTotal)} />
              </span>
              <span className="text-xs text-violet-300">จากเป้า {formatValue(monthlyTarget)}</span>
            </div>

            <div className="space-y-1.5">
              <div className="h-2 bg-white/15 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, progress)}%` }}
                  transition={{ duration: 1.4, ease: [0.19, 1, 0.22, 1] }}
                  className={cn('h-full rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]',
                    progress >= 100 ? 'bg-emerald-300' : 'bg-white'
                  )}
                />
              </div>
              {progress >= 100 && (
                <p className="text-[10px] text-emerald-200 font-bold tracking-wide">🎉 ทะลุเป้าแล้ว!</p>
              )}
            </div>
          </div>
        </div>

        {/* Growth MoM */}
        <div className={cn(
          'p-5 rounded-2xl border flex flex-col justify-between relative overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300',
          isPositiveTrend
            ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-emerald-100/50'
            : 'bg-gradient-to-br from-rose-50 to-red-50 border-rose-200 shadow-rose-100/50'
        )}>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-20"
            style={{ backgroundColor: isPositiveTrend ? '#10b981' : '#f43f5e' }} />
          <div className="flex justify-between items-start relative z-10">
            <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: isPositiveTrend ? '#059669' : '#e11d48' }}>การเติบโต</p>
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shadow-sm',
              isPositiveTrend ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500'
            )}>
              {isPositiveTrend ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <h3 className={cn('text-2xl font-black tabular-nums leading-none', isPositiveTrend ? 'text-emerald-600' : 'text-rose-500')}>
              {trend > 0 ? '+' : ''}
              <AnimatedNumber value={trend.toFixed(1)} suffix="%" />
            </h3>
            <p className="text-[11px] mt-2 font-semibold" style={{ color: isPositiveTrend ? '#6ee7b7' : '#fca5a5' }}>เทียบกับเดือนก่อน</p>
          </div>
        </div>

        {/* Won deals count */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 shadow-amber-100/50 flex flex-col justify-between relative overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-amber-200/30" />
          <div className="flex justify-between items-start relative z-10">
            <p className="text-[10px] text-amber-700 font-black tracking-widest uppercase">ปิดได้เดือนนี้</p>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-500 flex items-center justify-center shadow-sm">
              <Activity size={16} />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <h3 className="text-2xl font-black text-amber-700 tabular-nums leading-none">
              <AnimatedNumber value={monthlyCount} />
              <span className="text-sm font-bold text-amber-400 ml-1">ดีล</span>
            </h3>
            <p className="text-[11px] text-amber-400 mt-2 font-semibold">ในระบบทั้งหมด {totalDeals} ดีล</p>
          </div>
        </div>

        {/* At risk */}
        <div className="col-span-2 lg:col-span-1 p-5 rounded-2xl bg-gradient-to-br from-rose-50 to-red-50 border border-rose-200 shadow-rose-100/50 flex flex-col justify-between relative overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-rose-200/25" />
          <div className="flex justify-between items-start relative z-10">
            <p className="text-[10px] text-rose-700 font-black tracking-widest uppercase">ดีลค้าง/เสี่ยงสูง</p>
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-500 flex items-center justify-center shadow-sm">
              <AlertTriangle size={16} className={atRiskCount > 0 ? 'animate-pulse' : ''} />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <h3 className="text-2xl font-black text-rose-700 tabular-nums leading-none">
              <AnimatedNumber value={formatValue(atRiskValue)} />
            </h3>
            <p className="text-[11px] text-rose-400 mt-2 font-semibold">
              {atRiskCount} ดีล (&gt;7 วัน ไม่มีกิจกรรม)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
