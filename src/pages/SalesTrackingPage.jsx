import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell,
  AreaChart, Area, ResponsiveContainer
} from 'recharts';
import SafeResponsiveContainer from '../components/charts/SafeResponsiveContainer';
import { buildPipelineIntelligence } from '../utils/salesIntelligence';
import {
  BadgeDollarSign, TrendingUp, Target, Save, Loader2, Calendar,
  BarChart3, Edit2, Trophy, Zap, ArrowUpRight, ArrowDownRight,
  CheckCircle2, Clock, X, ChevronRight
} from 'lucide-react';
import { useDeals } from '../hooks/useDeals';
import { useMonthlySales, useUpsertMonthlySale } from '../hooks/useSales';
import { useAppStore } from '../store/useAppStore';
import { useSubscription } from '../hooks/useSubscription';
import { formatCurrency } from '../lib/formatters';
import { cn } from '../lib/utils';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import PageHeader from '../components/layout/PageHeader';

const MONTHS = [
  { value: 1, label: 'ม.ค.', full: 'มกราคม' },
  { value: 2, label: 'ก.พ.', full: 'กุมภาพันธ์' },
  { value: 3, label: 'มี.ค.', full: 'มีนาคม' },
  { value: 4, label: 'เม.ย.', full: 'เมษายน' },
  { value: 5, label: 'พ.ค.', full: 'พฤษภาคม' },
  { value: 6, label: 'มิ.ย.', full: 'มิถุนายน' },
  { value: 7, label: 'ก.ค.', full: 'กรกฎาคม' },
  { value: 8, label: 'ส.ค.', full: 'สิงหาคม' },
  { value: 9, label: 'ก.ย.', full: 'กันยายน' },
  { value: 10, label: 'ต.ค.', full: 'ตุลาคม' },
  { value: 11, label: 'พ.ย.', full: 'พฤศจิกายน' },
  { value: 12, label: 'ธ.ค.', full: 'ธันวาคม' },
];

const pageMotion = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.19, 1, 0.22, 1] } },
  exit: { opacity: 0, y: -15, transition: { duration: 0.2 } }
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-violet-100/50 flex flex-col gap-1 z-50 min-w-[160px]">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{data.fullMonth} {data.year}</p>
        <p className="text-xl font-black text-violet-600 mt-0.5">{formatCurrency(data.amount)}</p>
        {data.isCurrentMonth && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
            <Zap size={9} /> Live Pipeline
          </span>
        )}
      </div>
    );
  }
  return null;
};

// Animated counter
function AnimatedNumber({ value, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) { setDisplay(end); return; }
    const duration = 900;
    const step = Math.ceil((end - start) / (duration / 16));
    const timer = setInterval(() => {
      start = Math.min(start + step, end);
      setDisplay(start);
      if (start >= end) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{prefix}{display.toLocaleString('th-TH')}{suffix}</span>;
}

export default function SalesTrackingPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const { monthlyTarget, openPaywall } = useAppStore();
  const { shouldBlockBasic, isGuestAccount } = useSubscription();
  const annualTarget = monthlyTarget * 12;

  const { data: deals = [] } = useDeals();
  const { data: dbSales = [] } = useMonthlySales(currentYear);
  const upsertSale = useUpsertMonthlySale();

  const [editValues, setEditValues] = useState({});
  const [editingMonth, setEditingMonth] = useState(null);
  const [showChart, setShowChart] = useState(false);
  const [chartType, setChartType] = useState('bar'); // 'bar' | 'area'

  useEffect(() => {
    const timer = setTimeout(() => setShowChart(true), 350);
    return () => clearTimeout(timer);
  }, []);

  const currentMonthPipelineSales = useMemo(() => {
    const intelligence = buildPipelineIntelligence(deals, { monthlyGoal: monthlyTarget, now: new Date() });
    return intelligence.currentMonthWonValue;
  }, [deals, monthlyTarget]);

  const mergedSalesData = useMemo(() => {
    const data = [];
    let cumulative = 0;
    for (const m of MONTHS) {
      const isCurrentMonth = m.value === currentMonth;
      let amount = 0;
      if (isCurrentMonth) {
        amount = currentMonthPipelineSales;
      } else {
        const dbRecord = dbSales.find(s => s.month === m.value);
        amount = dbRecord ? Number(dbRecord.amount) : 0;
      }
      cumulative += amount;
      data.push({
        month: m.value, shortMonth: m.label, fullMonth: m.full,
        year: currentYear, amount, cumulative, isCurrentMonth
      });
    }
    return data;
  }, [dbSales, currentMonthPipelineSales, currentMonth, currentYear]);

  const totalYearlySales = mergedSalesData[mergedSalesData.length - 1].cumulative;
  const annualProgress = annualTarget > 0 ? Math.min(100, Math.round((totalYearlySales / annualTarget) * 100)) : 0;
  const currentMonthProgress = monthlyTarget > 0 ? Math.min(100, Math.round((currentMonthPipelineSales / monthlyTarget) * 100)) : 0;

  // MOM growth
  const lastMonthAmount = currentMonth > 1 ? (mergedSalesData[currentMonth - 2]?.amount || 0) : 0;
  const momGrowth = lastMonthAmount > 0 ? Math.round(((currentMonthPipelineSales - lastMonthAmount) / lastMonthAmount) * 100) : null;

  const quarterlySales = useMemo(() => {
    const q1 = mergedSalesData.slice(0, 3).reduce((sum, item) => sum + item.amount, 0);
    const q2 = mergedSalesData.slice(3, 6).reduce((sum, item) => sum + item.amount, 0);
    const q3 = mergedSalesData.slice(6, 9).reduce((sum, item) => sum + item.amount, 0);
    const q4 = mergedSalesData.slice(9, 12).reduce((sum, item) => sum + item.amount, 0);
    return [
      { id: 'Q1', label: 'Q1', sub: 'ม.ค. – มี.ค.', amount: q1, color: 'violet' },
      { id: 'Q2', label: 'Q2', sub: 'เม.ย. – มิ.ย.', amount: q2, color: 'blue' },
      { id: 'Q3', label: 'Q3', sub: 'ก.ค. – ก.ย.', amount: q3, color: 'emerald' },
      { id: 'Q4', label: 'Q4', sub: 'ต.ค. – ธ.ค.', amount: q4, color: 'amber' },
    ];
  }, [mergedSalesData]);

  const quarterColors = {
    violet: { bg: 'bg-violet-50', border: 'border-violet-100', text: 'text-violet-700', badge: 'bg-violet-600', bar: 'bg-violet-400' },
    blue:   { bg: 'bg-blue-50',   border: 'border-blue-100',   text: 'text-blue-700',   badge: 'bg-blue-600',   bar: 'bg-blue-400' },
    emerald:{ bg: 'bg-emerald-50',border: 'border-emerald-100',text: 'text-emerald-700',badge: 'bg-emerald-600',bar: 'bg-emerald-400' },
    amber:  { bg: 'bg-amber-50',  border: 'border-amber-100',  text: 'text-amber-700',  badge: 'bg-amber-600',  bar: 'bg-amber-400' },
  };

  const maxQuarter = Math.max(...quarterlySales.map(q => q.amount), 1);

  const handleEditChange = (month, value) => {
    const cleanValue = value.replace(/[^0-9.]/g, '');
    setEditValues(prev => ({ ...prev, [month]: cleanValue }));
  };

  const handleSave = async (month) => {
    if (shouldBlockBasic) { openPaywall(isGuestAccount ? 'default' : 'trial_ended'); return; }
    const value = editValues[month];
    if (value !== undefined) {
      const amount = Number(value) || 0;
      await upsertSale.mutateAsync({ year: currentYear, month, amount });
    }
    setEditingMonth(null);
  };

  return (
    <motion.div {...pageMotion} className="max-w-6xl mx-auto space-y-6 pb-20 relative">
        {/* Ambient Glows */}
        <div className="fixed top-20 right-0 w-[500px] h-[500px] bg-violet-400/5 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Ambient Orbs */}
      <div className="pointer-events-none fixed top-10 left-1/4 w-[500px] h-[500px] bg-violet-400/10 rounded-full blur-[120px] -z-10" />
      <div className="pointer-events-none fixed bottom-0 right-0 w-[400px] h-[400px] bg-indigo-400/10 rounded-full blur-[100px] -z-10" />

      {/* ── HEADER ── */}
      <PageHeader
        icon={BadgeDollarSign}
        title={`ยอดขายปี ${currentYear}`}
        description="ติดตามเป้าหมายรายเดือนและรวมทั้งปี"
        rightContent={
          <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl border border-violet-100/50 text-xs font-bold shadow-inner">
            {[['bar', 'แท่ง'], ['area', 'พื้นที่']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setChartType(val)}
                className={cn('px-3 py-1.5 rounded-lg transition-all', chartType === val ? 'bg-white shadow text-violet-700 ring-1 ring-slate-200/60' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50')}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Card 1: Total */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.05)] border border-violet-100/50 flex flex-col justify-between overflow-hidden relative group hover:shadow-[0_8px_32px_rgba(139,92,246,0.12)] hover:-translate-y-1 transition-all duration-300 transition-shadow duration-300">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br from-violet-200/40 to-indigo-200/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-violet-600">
                  <BarChart3 size={16} />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">ยอดขายรวมทั้งปี</span>
              </div>
              <span className="text-[10px] font-black bg-violet-50 text-violet-600 px-2 py-1 rounded-lg">{currentYear}</span>
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(totalYearlySales)}</h3>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-slate-400">เทียบเป้าหมายรายปี</span>
              <span className="text-violet-600">{annualProgress}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${annualProgress}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" />
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-1">เป้ารายปี: {formatCurrency(annualTarget)}</p>
          </div>
        </motion.div>

        {/* Card 2: Current Month */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.05)] border border-violet-100/50 flex flex-col justify-between overflow-hidden relative group hover:shadow-[0_8px_32px_rgba(139,92,246,0.12)] hover:-translate-y-1 transition-all duration-300 transition-shadow duration-300">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br from-emerald-200/40 to-cyan-200/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 flex items-center justify-center text-emerald-600">
                  <Calendar size={16} />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{MONTHS[currentMonth - 1].full}</span>
              </div>
              <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Live
              </span>
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(currentMonthPipelineSales)}</h3>
            {momGrowth !== null && (
              <div className={cn('flex items-center gap-1 text-xs font-bold mt-1', momGrowth >= 0 ? 'text-emerald-600' : 'text-rose-500')}>
                {momGrowth >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(momGrowth)}% MoM
              </div>
            )}
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-slate-400">เทียบเป้าเดือนนี้</span>
              <span className="text-emerald-600">{currentMonthProgress}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${currentMonthProgress}%` }} transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
                className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full" />
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-1">เป้ารายเดือน: {formatCurrency(monthlyTarget)}</p>
          </div>
        </motion.div>

        {/* Card 3: Annual Achievement */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 p-6 rounded-3xl shadow-xl shadow-violet-500/25 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute top-4 right-4 opacity-20">
            <Trophy size={60} strokeWidth={1} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Target size={18} className="text-violet-200" />
              <span className="text-xs font-bold text-violet-200 uppercase tracking-widest">Annual Achievement</span>
            </div>
            <h3 className="text-4xl font-black tracking-tight">{annualProgress}<span className="text-2xl text-violet-300">%</span></h3>
            <p className="text-sm text-violet-300 font-semibold mt-1">ของเป้าหมายรายปี</p>
          </div>
          <div className="relative z-10 mt-6 space-y-2">
            <div className="h-3 bg-black/20 rounded-full overflow-hidden shadow-inner">
              <motion.div initial={{ width: 0 }} animate={{ width: `${annualProgress}%` }} transition={{ duration: 1.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.6)]" />
            </div>
            <div className="flex justify-between text-[10px] text-violet-300 font-semibold">
              <span>{formatCurrency(totalYearlySales)}</span>
              <span>{formatCurrency(annualTarget)}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── QUARTERLY BREAKDOWN ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white p-6 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-violet-100/50">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">สรุปรายไตรมาส</h3>
          <span className="text-xs text-slate-400 font-medium">Q{Math.floor((currentMonth - 1) / 3) + 1} กำลังดำเนินอยู่</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quarterlySales.map((q, idx) => {
            const currentQ = Math.floor((currentMonth - 1) / 3) + 1;
            const isCurrentQ = q.id === `Q${currentQ}`;
            const c = quarterColors[q.color];
            const pct = Math.round((q.amount / maxQuarter) * 100);
            return (
              <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * idx }}
                className={cn('p-4 rounded-2xl border flex flex-col gap-3 relative overflow-hidden transition-all', isCurrentQ ? `${c.bg} ${c.border} ring-1 ring-offset-1 ring-violet-200` : 'bg-slate-50/50 border-violet-100/50')}>
                {isCurrentQ && <div className={cn('absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 blur-2xl opacity-30', c.bar)} />}
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <span className={cn('text-lg font-black', isCurrentQ ? c.text : 'text-slate-700')}>{q.label}</span>
                    <p className="text-[10px] text-slate-400 font-medium">{q.sub}</p>
                  </div>
                  {isCurrentQ && <span className={cn('text-[10px] font-black text-white px-2 py-0.5 rounded-lg', c.badge)}>NOW</span>}
                </div>
                <div className="relative z-10">
                  <p className={cn('text-lg font-black tracking-tight', isCurrentQ ? c.text : 'text-slate-800')}>{formatCurrency(q.amount)}</p>
                  <div className="mt-2 h-1.5 bg-white/70 rounded-full overflow-hidden border border-violet-100/50">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.15 * idx }}
                      className={cn('h-full rounded-full', c.bar)} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── CHART + TABLE ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

        {/* Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="xl:col-span-8 bg-white p-6 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-violet-100/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">เทรนด์ยอดขายรายเดือน</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">เดือนปัจจุบันดึงข้อมูลจาก Pipeline โดยตรง</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-gradient-to-r from-violet-600 to-indigo-500" />บันทึก</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-gradient-to-r from-emerald-400 to-cyan-400" />ปัจจุบัน</div>
            </div>
          </div>
          <div className="h-[340px] w-full">
            {showChart ? (
              <SafeResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={mergedSalesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.6} />
                      </linearGradient>
                      <linearGradient id="gCurrent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="shortMonth" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                      tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 8 }} />
                    <Bar dataKey="amount" radius={[8, 8, 4, 4]} maxBarSize={44} isAnimationActive={true} animationDuration={800}>
                      {mergedSalesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.isCurrentMonth ? 'url(#gCurrent)' : 'url(#gSales)'} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <AreaChart data={mergedSalesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="shortMonth" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                      tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="cumulative" stroke="#7c3aed" strokeWidth={2.5} fill="url(#areaGrad)" dot={false} activeDot={{ r: 5, fill: '#7c3aed' }} />
                  </AreaChart>
                )}
              </SafeResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border border-violet-100/50 border-dashed">
                <Loader2 className="w-6 h-6 text-violet-300 animate-spin mb-2" />
                <p className="text-xs font-semibold text-slate-400">กำลังโหลดกราฟ...</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Manual Entry Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="xl:col-span-4 bg-white p-6 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-violet-100/50 flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">บันทึกยอดขาย</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">กดไอคอนดินสอเพื่อแก้ไขรายเดือน</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1" style={{ maxHeight: 380 }}>
            {mergedSalesData.map((data) => {
              const isEditing = editingMonth === data.month;
              return (
                <motion.div key={data.month} layout
                  className={cn(
                    'p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-2',
                    data.isCurrentMonth ? 'bg-gradient-to-r from-emerald-50 to-cyan-50/50 border-emerald-100' :
                      isEditing ? 'bg-violet-50 border-violet-200 ring-2 ring-violet-100' : 'bg-slate-50/40 border-violet-100/50 hover:border-violet-100 hover:bg-slate-50'
                  )}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0',
                      data.isCurrentMonth ? 'bg-gradient-to-br from-emerald-400 to-cyan-500 text-white shadow-md shadow-emerald-500/25'
                        : data.amount > 0 ? 'bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-700'
                        : 'bg-white text-slate-400 shadow-sm border border-violet-100/50'
                    )}>
                      {data.shortMonth}
                    </div>
                    {data.isCurrentMonth ? (
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />Auto
                        </p>
                        <p className="text-sm font-black text-slate-800 truncate">{formatCurrency(data.amount)}</p>
                      </div>
                    ) : isEditing ? (
                      <Input
                        autoFocus
                        value={editValues[data.month] !== undefined ? editValues[data.month] : data.amount}
                        onChange={(e) => handleEditChange(data.month, e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(data.month); if (e.key === 'Escape') setEditingMonth(null); }}
                        className="h-8 text-sm font-bold w-32"
                        placeholder="0"
                      />
                    ) : (
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium text-slate-400">{data.fullMonth}</p>
                        <p className="text-sm font-black text-slate-800 truncate">{formatCurrency(data.amount)}</p>
                      </div>
                    )}
                  </div>

                  {!data.isCurrentMonth && (
                    isEditing ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="icon" className="h-8 w-8 bg-violet-600 hover:bg-violet-700 rounded-xl"
                          onClick={() => handleSave(data.month)} disabled={upsertSale.isPending}>
                          {upsertSale.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        </Button>
                        <button onClick={() => setEditingMonth(null)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => {
                        if (shouldBlockBasic) { openPaywall(isGuestAccount ? 'default' : 'trial_ended'); return; }
                        setEditValues({ ...editValues, [data.month]: data.amount });
                        setEditingMonth(data.month);
                      }} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors shrink-0">
                        <Edit2 size={14} />
                      </button>
                    )
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
