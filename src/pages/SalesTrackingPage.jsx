import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell,
  AreaChart, Area
} from 'recharts';
import SafeResponsiveContainer from '../components/charts/SafeResponsiveContainer';
import { buildPipelineIntelligence } from '../utils/salesIntelligence';
import {
  BadgeDollarSign, TrendingUp, Target, Save, Loader2, Calendar,
  BarChart3, Edit2, Trophy, Zap, ArrowUpRight, ArrowDownRight,
  CheckCircle2, Clock, X, ChevronRight, Sparkles, Award, Star
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
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-violet-100/80 flex flex-col gap-1 z-50 min-w-[170px]">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{data.fullMonth} {data.year}</p>
        <p className="text-xl font-black text-slate-900 mt-0.5 tracking-tight">{formatCurrency(data.amount)}</p>
        {data.isCurrentMonth && (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full w-fit mt-1">
            <Zap size={10} className="fill-emerald-500 text-emerald-500" /> Live Pipeline
          </span>
        )}
      </div>
    );
  }
  return null;
};

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
  const [chartType, setChartType] = useState('bar');

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

  const handleSaveMonth = async (monthNum) => {
    if (shouldBlockBasic) {
      openPaywall(isGuestAccount ? 'default' : 'trial_ended');
      return;
    }
    const val = editValues[monthNum];
    if (val === undefined) { setEditingMonth(null); return; }
    const numAmount = parseFloat(String(val).replace(/,/g, '')) || 0;
    try {
      await upsertSale.mutateAsync({ year: currentYear, month: monthNum, amount: numAmount });
      setEditingMonth(null);
    } catch {
      // error handled by mutation
    }
  };

  return (
    <motion.div {...pageMotion} className="max-w-[1600px] mx-auto space-y-6 pb-20 px-4 md:px-6 mt-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-[-5%] left-[-10%] w-[50%] h-[600px] rounded-full bg-violet-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-5%] w-[40%] h-[500px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      {/* PAGE HEADER */}
      <PageHeader
        icon={BadgeDollarSign}
        title={`ติดตามยอดขายประจำปี ${currentYear + 543}`}
        description="วิเคราะห์เป้าหมาย ยอดขายรายเดือน และยอดรวมสะสมแบบเรียลไทม์"
        rightContent={
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 shadow-sm">
            <button
              onClick={() => setChartType('bar')}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5',
                chartType === 'bar' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <BarChart3 size={14} /> กราฟแท่ง
            </button>
            <button
              onClick={() => setChartType('area')}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5',
                chartType === 'area' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <TrendingUp size={14} /> กราฟแนวโน้ม
            </button>
          </div>
        }
      />

      {/* KPI HERO CARDS STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Annual Target Progress — Main Hero */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-violet-600 via-indigo-700 to-slate-900 text-white shadow-xl shadow-violet-600/20 border border-violet-400/20 group hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/10 blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center">
                  <Trophy size={18} className="text-amber-300 fill-amber-300" />
                </div>
                <div>
                  <p className="text-[11px] text-violet-200 font-extrabold uppercase tracking-widest">ยอดขายสะสมทั้งปี</p>
                  <p className="text-[10px] text-violet-300/80">ปี {currentYear + 543}</p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-black">
                {annualProgress}%
              </div>
            </div>

            <div className="pt-1">
              <p className="text-3xl lg:text-4xl font-black tabular-nums tracking-tight leading-none">
                {formatCurrency(totalYearlySales)}
              </p>
              <p className="text-xs text-violet-200/90 font-medium mt-1.5">
                จากเป้าปี {formatCurrency(annualTarget)}
              </p>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="h-2.5 bg-black/20 backdrop-blur-md rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-300 via-violet-300 to-emerald-300 transition-all duration-700 shadow-[0_0_10px_rgba(255,255,255,0.6)]"
                  style={{ width: `${annualProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-violet-200 font-medium">
                {annualProgress >= 100 ? '🎉 พิชิตเป้าหมายรายปีแล้ว!' : `ขาดอีก ${formatCurrency(Math.max(0, annualTarget - totalYearlySales))} เพื่อบรรลุเป้าปี`}
              </p>
            </div>
          </div>
        </div>

        {/* Current Month Live Pipeline */}
        <div className="p-6 rounded-3xl bg-white/80 backdrop-blur-md border border-emerald-200/80 shadow-[0_8px_30px_rgba(16,185,129,0.06)] hover:border-emerald-300 flex flex-col justify-between relative overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-emerald-400/10 pointer-events-none group-hover:scale-125 transition-transform duration-500" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Zap size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black tracking-widest text-emerald-700 uppercase">ยอดปิดได้เดือนนี้</p>
                <p className="text-[10px] text-slate-400 font-medium">{MONTHS[currentMonth - 1].full}</p>
              </div>
            </div>
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
              {currentMonthProgress}% เป้าเดือน
            </span>
          </div>

          <div className="mt-4 relative z-10">
            <h3 className="text-2xl lg:text-3xl font-black text-slate-900 tabular-nums tracking-tight leading-none">
              {formatCurrency(currentMonthPipelineSales)}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              {momGrowth !== null && (
                <span className={cn('text-xs font-extrabold flex items-center gap-0.5 px-2 py-0.5 rounded-full',
                  momGrowth >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                )}>
                  {momGrowth >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {momGrowth > 0 ? `+${momGrowth}%` : `${momGrowth}%`} MoM
                </span>
              )}
              <span className="text-xs text-slate-400 font-medium">เป้าเดือน {formatCurrency(monthlyTarget)}</span>
            </div>
          </div>
        </div>

        {/* Forecast / Quarter Summary Highlight */}
        <div className="p-6 rounded-3xl bg-white/80 backdrop-blur-md border border-violet-200/80 shadow-[0_8px_30px_rgba(139,92,246,0.06)] hover:border-violet-300 flex flex-col justify-between relative overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-violet-400/10 pointer-events-none group-hover:scale-125 transition-transform duration-500" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
                <Target size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black tracking-widest text-violet-700 uppercase">เป้าหมายเฉลี่ย</p>
                <p className="text-[10px] text-slate-400 font-medium">เป้าหมายต่อไตรมาส</p>
              </div>
            </div>
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 border border-violet-200">
              Q Target
            </span>
          </div>

          <div className="mt-4 relative z-10">
            <h3 className="text-2xl lg:text-3xl font-black text-slate-900 tabular-nums tracking-tight leading-none">
              {formatCurrency(monthlyTarget * 3)}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-2">
              เฉลี่ยเดือนละ {formatCurrency(monthlyTarget)} (เป้าทีม)
            </p>
          </div>
        </div>
      </div>

      {/* CHART SECTION */}
      <div className="p-6 rounded-3xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="text-violet-600" size={20} />
              ยอดขายรายเดือนตลอดปี {currentYear + 543}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              เปรียบเทียบยอดขายในแต่ละเดือนกับเป้าหมายรายเดือนที่ตั้งไว้
            </p>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          {showChart && (
            <SafeResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={mergedSalesData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradientViolet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.6} />
                    </linearGradient>
                    <linearGradient id="barGradientEmerald" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="shortMonth" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(val) => `${val / 1000}k`} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" radius={[10, 10, 0, 0]}>
                    {mergedSalesData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isCurrentMonth ? 'url(#barGradientEmerald)' : 'url(#barGradientViolet)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <AreaChart data={mergedSalesData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="shortMonth" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(val) => `${val / 1000}k`} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="cumulative" stroke="#7c3aed" strokeWidth={3} fillOpacity={1} fill="url(#areaGradient)" />
                </AreaChart>
              )}
            </SafeResponsiveContainer>
          )}
        </div>
      </div>

      {/* QUARTERLY BREAKDOWN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quarterlySales.map((q) => {
          const targetForQ = monthlyTarget * 3;
          const qProgress = targetForQ > 0 ? Math.min(100, Math.round((q.amount / targetForQ) * 100)) : 0;
          return (
            <div key={q.id} className="p-5 rounded-3xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-3 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-black text-xs">
                    {q.label}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{q.label}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">{q.sub}</p>
                  </div>
                </div>
                <span className="text-xs font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
                  {qProgress}%
                </span>
              </div>

              <div>
                <p className="text-xl font-black text-slate-900 tabular-nums tracking-tight">
                  {formatCurrency(q.amount)}
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">จากเป้า {formatCurrency(targetForQ)}</p>
              </div>

              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-500"
                  style={{ width: `${qProgress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* MONTHLY GRID & EDITING */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="text-violet-600" size={18} />
            จัดการยอดขายายเดือน
          </h3>
          <p className="text-xs text-slate-400 font-medium hidden sm:block">
            คลิกที่เดือนย้อนหลังเพื่อปรับแก้ไขยอดขายที่เกิดขึ้นจริง
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mergedSalesData.map((m) => {
            const isEditing = editingMonth === m.month;
            const progressMonth = monthlyTarget > 0 ? Math.min(100, Math.round((m.amount / monthlyTarget) * 100)) : 0;
            return (
              <div
                key={m.month}
                className={cn(
                  'p-5 rounded-3xl border transition-all duration-300 bg-white/80 backdrop-blur-md relative overflow-hidden group',
                  m.isCurrentMonth
                    ? 'border-emerald-300 ring-2 ring-emerald-400/20 shadow-md shadow-emerald-500/10'
                    : 'border-slate-200/80 hover:border-violet-200 hover:shadow-md'
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900">{m.fullMonth}</span>
                    {m.isCurrentMonth && (
                      <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                        เดือนนี้ (Live)
                      </span>
                    )}
                  </div>

                  {!m.isCurrentMonth && !isEditing && (
                    <button
                      onClick={() => {
                        setEditingMonth(m.month);
                        setEditValues(prev => ({ ...prev, [m.month]: m.amount }));
                      }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-violet-50 hover:text-violet-600 transition-colors opacity-0 group-hover:opacity-100"
                      title="แก้ไขยอดขาย"
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      type="number"
                      value={editValues[m.month] ?? m.amount}
                      onChange={(e) => setEditValues(prev => ({ ...prev, [m.month]: e.target.value }))}
                      className="h-10 text-sm font-black border-violet-300 focus:border-violet-500 rounded-xl"
                      placeholder="ระบุจำนวนเงิน"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveMonth(m.month)}
                        disabled={upsertSale.isPending}
                        className="flex-1 h-8 rounded-xl bg-violet-600 text-white font-bold text-xs"
                      >
                        {upsertSale.isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                        บันทึก
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingMonth(null)}
                        className="h-8 rounded-xl text-xs font-bold"
                      >
                        ยกเลิก
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xl font-black text-slate-900 tabular-nums tracking-tight">
                      {formatCurrency(m.amount)}
                    </p>
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-extrabold">
                        <span>ความคืบหน้า</span>
                        <span>{progressMonth}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all duration-500',
                            m.isCurrentMonth ? 'bg-emerald-500' : 'bg-violet-600'
                          )}
                          style={{ width: `${progressMonth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
