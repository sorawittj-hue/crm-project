import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeals } from '../hooks/useDeals';
import { useTeam } from '../hooks/useTeam';
import { useSettings } from '../hooks/useSettings';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { formatCurrency, formatFullCurrency, daysSince } from '../lib/formatters';
import CustomTooltip from '../components/ui/CustomTooltip';
import {
  Loader2, TrendingUp,
  Users, AlertCircle,
  ArrowUpRight, Briefcase,
  Target, Clock, RefreshCw, Crosshair, Zap
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip
} from 'recharts';

export default function CommandCenterPage() {
  const navigate = useNavigate();
  const { data: deals, isLoading: dealsLoading } = useDeals();
  const { data: teamMembers, isLoading: teamLoading } = useTeam();
  const { data: settings, isLoading: settingsLoading } = useSettings();

  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [strategicMandates, setStrategicMandates] = useState([]);

  const monthlyGoal = settings?.monthly_target || 10000000;

  const stats = useMemo(() => {
    if (!deals) return null;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const wonDealsThisMonth = deals.filter(d => {
      if (d.stage !== 'won') return false;
      // Use actual_close_date if available, fallback to created_at
      const dt = new Date(d.actual_close_date || d.created_at);
      return dt.getMonth() === currentMonth && dt.getFullYear() === currentYear;
    });
    const totalWonValue = wonDealsThisMonth.reduce((s, d) => s + (Number(d.value) || 0), 0);
    const activePipeline = deals.filter(d => !['won', 'lost'].includes(d.stage));
    const totalPipelineValue = activePipeline.reduce((s, d) => s + (Number(d.value) || 0), 0);
    const achievementPercent = Math.round((totalWonValue / monthlyGoal) * 100);

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      months.push({
        name: d.toLocaleDateString('th-TH', { month: 'short' }),
        month: d.getMonth(),
        year: d.getFullYear(),
        actual: 0,
        forecast: 0
      });
    }

    deals.forEach(deal => {
      const dealDate = new Date(deal.created_at);
      const mIdx = months.findIndex(m => m.month === dealDate.getMonth() && m.year === dealDate.getFullYear());
      if (mIdx !== -1) {
        if (deal.stage === 'won') months[mIdx].actual += Number(deal.value || 0);
        else if (deal.stage !== 'lost') {
          months[mIdx].forecast += Number(deal.value || 0) * (Number(deal.probability || 0) / 100);
        }
      }
    });

    const urgentDeals = activePipeline
      .filter(d => daysSince(d.last_activity || d.created_at) >= 3)
      .sort((a, b) => (Number(b.value) * (b.probability / 100)) - (Number(a.value) * (a.probability / 100)))
      .slice(0, 3);

    const prevMonthActual = months[months.length - 2]?.actual || 0;
    const currentMonthActual = months[months.length - 1]?.actual || 0;
    const growthPercent = prevMonthActual > 0
      ? ((currentMonthActual - prevMonthActual) / prevMonthActual * 100).toFixed(1)
      : 0;

    return { totalWonValue, totalPipelineValue, achievementPercent, activeCount: activePipeline.length, urgentDeals, revenueStream: months, growthPercent };
  }, [deals, monthlyGoal]);

  const handleGenerateRules = useMemo(() => () => {
    if (!deals) return;
    setIsGeneratingPlan(true);
    setTimeout(() => {
      const active = deals.filter(d => !['won', 'lost'].includes(d.stage));
      const staleCount = active.filter(d => daysSince(d.last_activity || d.created_at) >= 3).length;
      const closingCount = active.filter(d => d.stage === 'negotiation').length;
      const leadCount = active.filter(d => d.stage === 'lead').length;

      setStrategicMandates([
        {
          id: 1, icon: Clock,
          title: 'ติดตามดีลที่หยุดนิ่ง',
          desc: `มี ${staleCount} ดีลที่ไม่มีความเคลื่อนไหวมากกว่า 3 วัน — ควรติดต่อลูกค้าภายใน 24 ชม.`,
          urgency: staleCount > 0 ? 'high' : 'medium',
        },
        {
          id: 2, icon: Crosshair,
          title: 'ผลักดันการปิดดีล',
          desc: `มี ${closingCount} ดีลอยู่ในขั้นตอนกำลังปิด — ยอดขายเดือนนี้ ${stats?.achievementPercent ?? 0}% ของเป้า`,
          urgency: closingCount > 0 ? 'high' : 'medium',
        },
        {
          id: 3, icon: Zap,
          title: 'เพิ่ม Lead ใหม่',
          desc: `ปัจจุบันมี ${leadCount} lead — ${leadCount < 5 ? 'ควรเพิ่ม lead ใหม่อีกอย่างน้อย 10 ราย' : 'pipeline อยู่ในระดับดี'}`,
          urgency: leadCount < 5 ? 'medium' : 'low',
        },
      ]);
      setIsGeneratingPlan(false);
    }, 800);
  }, [deals, stats]);

  useEffect(() => {
    if (deals && strategicMandates.length === 0) handleGenerateRules();
  }, [deals, strategicMandates.length, handleGenerateRules]);

  const isLoading = dealsLoading || teamLoading || settingsLoading;

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        className="w-10 h-10 border-4 border-violet-100 border-t-violet-600 rounded-full" />
      <p className="text-sm text-slate-400">กำลังโหลดข้อมูล...</p>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ภาพรวมยอดขาย</h1>
          <p className="text-sm text-slate-500 mt-1">สถานะดีลและงานสำคัญประจำวัน</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleGenerateRules}
            className="h-9 px-4 rounded-xl text-sm border-slate-200 bg-white text-slate-600 hover:bg-slate-50">
            {isGeneratingPlan ? <Loader2 size={14} className="animate-spin mr-2" /> : <RefreshCw size={14} className="mr-2" />}
            รีเฟรช
          </Button>
          <Button onClick={() => navigate('/pipeline')}
            className="h-9 px-5 rounded-xl text-sm bg-violet-600 hover:bg-violet-700 text-white border-0 shadow-md shadow-violet-500/20">
            <ArrowUpRight size={14} className="mr-2" />
            ดูดีลทั้งหมด
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Goal Card */}
        <Card className="p-6 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 text-white border-0 shadow-lg shadow-violet-500/20 lg:col-span-2 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-4 w-32 h-32 rounded-full bg-white/5" />
          <div className="relative z-10 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-violet-200 text-xs font-medium">เป้าหมายเดือนนี้</p>
                <p className="text-3xl font-bold text-white mt-1 tabular-nums">{formatFullCurrency(monthlyGoal)}</p>
              </div>
              <div className={cn('flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
                Number(stats?.growthPercent) >= 0
                  ? 'bg-emerald-400/20 text-emerald-200'
                  : 'bg-rose-400/20 text-rose-200'
              )}>
                <TrendingUp size={11} />
                {stats?.growthPercent > 0 ? '+' : ''}{stats?.growthPercent}% จากเดือนที่แล้ว
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-violet-200 text-xs">ยอดขายปัจจุบัน</p>
                  <p className="text-xl font-bold text-white tabular-nums">{formatFullCurrency(stats?.totalWonValue)}</p>
                </div>
                <p className="text-4xl font-bold text-white/20 tabular-nums">{stats?.achievementPercent}%</p>
              </div>
              <div className="h-2 w-full bg-white/15 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, stats?.achievementPercent)}%` }}
                  transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
                  className="h-full bg-white rounded-full"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
            <Briefcase size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">ดีลที่กำลังดำเนินการ</p>
            <p className="text-3xl font-bold text-slate-800 mt-1 tabular-nums">
              {stats?.activeCount}
              <span className="text-base text-slate-300 font-normal ml-1.5">ดีล</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">มูลค่ารวม {formatCurrency(stats?.totalPipelineValue)}</p>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">ต้องติดตามด่วน</p>
            <p className="text-3xl font-bold text-rose-500 mt-1 tabular-nums">
              {stats?.urgentDeals?.length}
              <span className="text-base text-slate-300 font-normal ml-1.5">ดีล</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">ไม่มีความเคลื่อนไหว 3+ วัน</p>
          </div>
        </Card>
      </div>

      {/* Tasks + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Daily Tasks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                <Target size={14} className="text-violet-600" />
              </div>
              <h3 className="font-semibold text-slate-800">งานสำคัญวันนี้</h3>
            </div>
          </div>

          <div className="space-y-3">
            {strategicMandates.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={cn(
                  'p-4 rounded-2xl border transition-all',
                  m.urgency === 'high'
                    ? 'bg-rose-50 border-rose-100'
                    : m.urgency === 'medium'
                    ? 'bg-amber-50 border-amber-100'
                    : 'bg-white border-slate-100'
                )}
              >
                <div className="flex gap-3">
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                    m.urgency === 'high' ? 'bg-rose-100 text-rose-500' :
                    m.urgency === 'medium' ? 'bg-amber-100 text-amber-500' :
                    'bg-slate-100 text-slate-400'
                  )}>
                    <m.icon size={16} />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                        m.urgency === 'high' ? 'bg-rose-100 text-rose-600' :
                        m.urgency === 'medium' ? 'bg-amber-100 text-amber-600' :
                        'bg-slate-100 text-slate-500'
                      )}>
                        {m.urgency === 'high' ? 'เร่งด่วน' : m.urgency === 'medium' ? 'ปานกลาง' : 'ทั่วไป'}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-800">{m.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{m.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
            {isGeneratingPlan && (
              <div className="p-8 text-center">
                <Loader2 className="animate-spin text-violet-400 mx-auto" size={20} />
                <p className="text-xs text-slate-400 mt-2">กำลังวิเคราะห์...</p>
              </div>
            )}
          </div>
        </div>

        {/* Revenue Chart */}
        <Card className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-semibold text-slate-800">ยอดขาย 6 เดือนล่าสุด</h3>
              <p className="text-xs text-slate-400 mt-0.5">ยอดขายจริง เทียบกับคาดการณ์</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                <span className="text-xs text-slate-400">จริง</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-slate-200" />
                <span className="text-xs text-slate-400">คาดการณ์</span>
              </div>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <AreaChart data={stats?.revenueStream}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#cbd5e1" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#cbd5e1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickFormatter={(v) => `${v / 1000000}M`} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="actual" name="ยอดขายจริง"
                  stroke="#7c3aed" strokeWidth={2.5}
                  fill="url(#colorActual)" animationDuration={1500} />
                <Area type="monotone" dataKey="forecast" name="คาดการณ์"
                  stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5"
                  fill="url(#colorForecast)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Team Performance */}
      {teamMembers && teamMembers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
              <Users size={14} className="text-slate-600" />
            </div>
            <h3 className="font-semibold text-slate-800">ประสิทธิภาพทีมขาย</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {teamMembers.map((m, i) => {
              const nowDate = new Date();
              const mWon = deals?.filter(d => {
                if (d.assigned_to !== m.id || d.stage !== 'won') return false;
                const dt = new Date(d.actual_close_date || d.created_at);
                return dt.getMonth() === nowDate.getMonth() && dt.getFullYear() === nowDate.getFullYear();
              }).reduce((s, d) => s + Number(d.value), 0) || 0;
              const mPercent = Math.round((mWon / (m.goal || 2500000)) * 100);
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm',
                      m.color?.split(' ')[0] || 'bg-violet-600')}>
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm leading-tight">{m.name}</h4>
                      <p className="text-xs text-slate-400">{m.role}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-semibold text-slate-700 tabular-nums">{formatCurrency(mWon)}</p>
                      <p className="text-sm font-bold text-slate-400">{mPercent}%</p>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, mPercent)}%` }}
                        transition={{ duration: 1.2, delay: 0.3 + i * 0.1 }}
                        className={cn('h-full rounded-full', m.color?.split(' ')[0] || 'bg-violet-500')}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
