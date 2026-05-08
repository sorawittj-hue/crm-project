import { useMemo, useState } from 'react';
import { useDeals } from '../hooks/useDeals';
import { useSettings } from '../hooks/useSettings';
import { useTeam } from '../hooks/useTeam';
import { useAuth } from '../hooks/useAuth';
import { useMyProfile } from '../hooks/useUserProfiles';
import { Card } from '../components/ui/Card';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/formatters';
import { STAGE_COLORS, STAGE_LABELS } from '../lib/constants';
import { buildPipelineIntelligence, DEFAULT_STAGE_PROBABILITY } from '../utils/salesIntelligence';
import CustomTooltip from '../components/ui/CustomTooltip';
import {
  ResponsiveContainer, Area, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell,
  ComposedChart, Line, BarChart
} from 'recharts';
import {
  Target,
  ArrowUpRight, ArrowDownRight, Loader2,
  Activity, DollarSign,
  ShieldCheck, ThumbsUp, ThumbsDown, AlertCircle,
  Trophy, Zap, Clock
} from 'lucide-react';

const MetricCard = ({ title, value, subValue, icon: Icon, trend, color = "primary" }) => {
  const colorStyles = {
    primary: "text-violet-600 bg-violet-50 border-violet-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    rose: "text-rose-600 bg-rose-50 border-rose-100",
    slate: "text-slate-600 bg-slate-50 border-slate-100"
  };
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="group">
      <Card className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colorStyles[color])}>
              <Icon size={18} />
            </div>
            {trend !== undefined && (
              <div className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
                trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              )}>
                {trend >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {Math.abs(trend)}%
              </div>
            )}
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-slate-400">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900 tabular-nums leading-none">{value}</h3>
            {subValue && <p className="text-xs text-slate-400 mt-1.5">{subValue}</p>}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

const FUNNEL_STAGES = ['lead', 'contact', 'proposal', 'negotiation', 'won'];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { data: myProfile } = useMyProfile(user?.id);
  const { data: deals, isLoading: dealsLoading } = useDeals();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: teamMembers, isLoading: teamLoading } = useTeam();

  const [timeRange, setTimeRange] = useState('6m');

  const teamTarget = settings?.monthly_target || 10000000;
  // Personal target: use user's own if set, else fall back to team target
  const monthlyTarget = myProfile?.personal_target > 0 ? myProfile.personal_target : teamTarget;

  const analytics = useMemo(() => {
    if (!deals) return null;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monthsBack = timeRange === '3m' ? 2 : timeRange === '6m' ? 5 : 11;
    const intelligence = buildPipelineIntelligence(deals, { monthlyGoal: monthlyTarget, now: today });

    // Revenue Stream
    const revenueStream = [];
    for (let i = monthsBack; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      revenueStream.push({
        name: d.toLocaleDateString('th-TH', { month: 'short' }),
        month: d.getMonth(),
        year: d.getFullYear(),
        actual: 0,
        unweighted: 0,
        weighted: 0,
        target: monthlyTarget
      });
    }

    deals.forEach(deal => {
      const dealDate = new Date(deal.created_at);
      const mIdx = revenueStream.findIndex(m => m.month === dealDate.getMonth() && m.year === dealDate.getFullYear());
      if (mIdx !== -1) {
        if (deal.stage === 'won') {
          revenueStream[mIdx].actual += Number(deal.value || 0);
        } else if (deal.stage !== 'lost') {
          const value = Number(deal.value || 0);
          const probability = Number.isFinite(Number(deal.probability))
            ? Number(deal.probability)
            : DEFAULT_STAGE_PROBABILITY[deal.stage] || 0;
          revenueStream[mIdx].unweighted += value;
          revenueStream[mIdx].weighted += Math.round(value * (probability / 100));
        }
      }
    });

    const currentMonthActual = revenueStream[revenueStream.length - 1]?.actual || 0;
    const prevMonthActual = revenueStream[revenueStream.length - 2]?.actual || 0;
    const growth = prevMonthActual > 0 ? Math.round(((currentMonthActual - prevMonthActual) / prevMonthActual) * 100) : 0;

    // Stage Distribution
    const stageData = [];
    const stageOrder = ['lead', 'contact', 'proposal', 'negotiation', 'won', 'lost'];
    stageOrder.forEach(stage => {
      const stageDeals = deals.filter(d => d.stage === stage);
      stageData.push({
        name: STAGE_LABELS[stage] || stage,
        value: stageDeals.length,
        totalValue: stageDeals.reduce((sum, d) => sum + Number(d.value || 0), 0),
        color: STAGE_COLORS[stage]
      });
    });

    // Pipeline Analytics
    const activeDeals = deals.filter(d => !['won', 'lost'].includes(d.stage));
    const totalPipeline = activeDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);
    const wonDeals = deals.filter(d => d.stage === 'won');
    const lostDeals = deals.filter(d => d.stage === 'lost');
    const winRate = (wonDeals.length + lostDeals.length) > 0
      ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100)
      : 0;

    const avgDealValue = wonDeals.length > 0
      ? Math.round(wonDeals.reduce((s, d) => s + Number(d.value || 0), 0) / wonDeals.length)
      : 0;
    const avgDaysToClose = wonDeals.length > 0
      ? Math.round(wonDeals.reduce((s, d) => {
          const created = new Date(d.created_at);
          const closed = new Date(d.actual_close_date || d.updated_at || d.created_at);
          return s + Math.max(0, (closed - created) / 86400000);
        }, 0) / wonDeals.length)
      : 0;

    // Conversion Funnel
    // cumulative "entered stage" = deals currently in this stage + all later stages
    const stageCounts = {};
    FUNNEL_STAGES.forEach(s => { stageCounts[s] = deals.filter(d => d.stage === s).length; });

    const cumulativeEntered = {};
    let running = 0;
    for (let i = FUNNEL_STAGES.length - 1; i >= 0; i--) {
      running += stageCounts[FUNNEL_STAGES[i]];
      cumulativeEntered[FUNNEL_STAGES[i]] = running;
    }

    const funnelData = FUNNEL_STAGES.map((stage, i) => {
      const entered = cumulativeEntered[stage] || 0;
      const prevEntered = i === 0 ? entered : (cumulativeEntered[FUNNEL_STAGES[i - 1]] || 1);
      const conversionRate = i === 0 ? 100 : prevEntered > 0 ? Math.round((entered / prevEntered) * 100) : 0;
      const stageValue = deals.filter(d => d.stage === stage).reduce((s, d) => s + Number(d.value || 0), 0);
      return {
        stage,
        label: STAGE_LABELS[stage],
        count: stageCounts[stage],
        entered,
        value: stageValue,
        conversionRate,
        color: STAGE_COLORS[stage],
        widthPct: entered > 0 ? Math.round((entered / (cumulativeEntered[FUNNEL_STAGES[0]] || 1)) * 100) : 0,
      };
    });

    // Deal Velocity — avg days deals sit in each active stage
    const velocityData = ['lead', 'contact', 'proposal', 'negotiation'].map(stage => {
      const stageDeals = deals.filter(d => d.stage === stage);
      const avgDays = stageDeals.length > 0
        ? Math.round(stageDeals.reduce((s, d) => {
            const ref = new Date(d.last_activity || d.updated_at || d.created_at);
            return s + Math.max(0, (Date.now() - ref.getTime()) / 86400000);
          }, 0) / stageDeals.length)
        : 0;
      return {
        name: STAGE_LABELS[stage],
        days: avgDays,
        count: stageDeals.length,
        color: STAGE_COLORS[stage],
      };
    });

    // Win/Loss reasons
    const reasonCount = (list, getter) => {
      const map = new Map();
      list.forEach((d) => {
        const raw = getter(d);
        if (!raw) return;
        const key = String(raw).trim().toLowerCase();
        if (!key || key.length < 3) return;
        const entry = map.get(key) || { reason: String(raw).trim(), count: 0, totalValue: 0 };
        entry.count += 1;
        entry.totalValue += Number(d.value) || 0;
        map.set(key, entry);
      });
      return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 5);
    };

    const lostReasons = reasonCount(lostDeals, (d) => d.lost_reason || d.metadata?.close_reason);
    const wonReasons = reasonCount(wonDeals, (d) => d.metadata?.win_reason || d.metadata?.close_reason);

    // Team Leaderboard
    const teamLeaderboard = (teamMembers || []).map(m => {
      const memberDeals = deals.filter(d => d.assigned_to === m.id);
      const wonMember = memberDeals.filter(d => d.stage === 'won');
      const lostMember = memberDeals.filter(d => d.stage === 'lost');
      const activeMember = memberDeals.filter(d => !['won', 'lost'].includes(d.stage));
      const wonThisMonth = wonMember.filter(d => {
        const dt = new Date(d.actual_close_date || d.updated_at || d.created_at);
        return dt.getMonth() === currentMonth && dt.getFullYear() === currentYear;
      });
      const wonThisMonthValue = wonThisMonth.reduce((s, d) => s + Number(d.value || 0), 0);
      const wonAllTimeValue = wonMember.reduce((s, d) => s + Number(d.value || 0), 0);
      const memberWinRate = (wonMember.length + lostMember.length) > 0
        ? Math.round(wonMember.length / (wonMember.length + lostMember.length) * 100)
        : 0;
      const goalAchievement = m.goal > 0 ? Math.min(100, Math.round(wonThisMonthValue / m.goal * 100)) : 0;
      return {
        ...m,
        wonThisMonthValue,
        wonAllTimeValue,
        wonThisMonthCount: wonThisMonth.length,
        wonAllTimeCount: wonMember.length,
        activeCount: activeMember.length,
        activePipelineValue: activeMember.reduce((s, d) => s + Number(d.value || 0), 0),
        winRate: memberWinRate,
        goalAchievement,
      };
    }).sort((a, b) => b.wonThisMonthValue - a.wonThisMonthValue);

    // Revenue per member bar chart data (last 6 months)
    const revenueByMember = revenueStream.map(month => {
      const entry = { name: month.name };
      (teamMembers || []).forEach(m => {
        entry[m.name] = deals
          .filter(d => d.stage === 'won' && d.assigned_to === m.id)
          .filter(d => {
            const dt = new Date(d.actual_close_date || d.updated_at || d.created_at);
            return dt.getMonth() === month.month && dt.getFullYear() === month.year;
          })
          .reduce((s, d) => s + Number(d.value || 0), 0);
      });
      return entry;
    });

    return {
      revenueStream,
      stageData,
      totalPipeline,
      currentMonthActual,
      growth,
      winRate,
      wonCount: wonDeals.length,
      lostCount: lostDeals.length,
      activeCount: activeDeals.length,
      avgDealValue,
      avgDaysToClose,
      totalDeals: deals.length,
      lostReasons,
      wonReasons,
      intelligence,
      funnelData,
      velocityData,
      teamLeaderboard,
      revenueByMember,
    };
  }, [deals, monthlyTarget, timeRange, teamMembers]);

  const isLoading = dealsLoading || settingsLoading || teamLoading;

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
      <Loader2 className="animate-spin text-primary" size={40} />
      <p className="text-sm text-slate-400">กำลังโหลดข้อมูล...</p>
    </div>
  );

  const memberColors = ['#7c3aed', '#0ea5e9', '#f97316', '#10b981', '#ec4899', '#f59e0b'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-[1600px] mx-auto space-y-6 pb-20 px-4 md:px-0">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">รายงานยอดขาย</h1>
          <p className="text-sm text-slate-500 mt-1">วิเคราะห์ผลการขายและแนวโน้ม</p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {[['3m', '3 เดือน'], ['6m', '6 เดือน'], ['12m', '12 เดือน']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setTimeRange(val)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all",
                timeRange === val ? "bg-white shadow text-violet-700" : "text-slate-500 hover:text-slate-800"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* PRIMARY KPI RIBBON */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="ยอดขายเดือนนี้"
          value={formatCurrency(analytics?.currentMonthActual)}
          subValue={`เป้า: ${formatCurrency(monthlyTarget)}`}
          trend={analytics?.growth}
          icon={DollarSign}
          color="emerald"
        />
        <MetricCard
          title="Pipeline ทั้งหมด"
          value={formatCurrency(analytics?.totalPipeline)}
          subValue={`${analytics?.activeCount} ดีลที่กำลังดำเนินการ`}
          icon={Activity}
          color="primary"
        />
        <MetricCard
          title="Weighted Forecast"
          value={formatCurrency(analytics?.intelligence?.forecastToGoalValue)}
          subValue={`${Math.round((analytics?.intelligence?.weightedCoverageRatio || 0) * 100)}% forecast coverage`}
          icon={ShieldCheck}
          color="emerald"
        />
        <MetricCard
          title="อัตราปิดดีล"
          value={`${analytics?.winRate}%`}
          subValue="Win Rate ทั้งหมด"
          icon={Target}
          color="primary"
        />
        <MetricCard
          title="เฉลี่ยวันปิดดีล"
          value={`${analytics?.avgDaysToClose || 0} วัน`}
          subValue={`มูลค่าเฉลี่ย ${formatCurrency(analytics?.avgDealValue)}`}
          icon={Clock}
          color="slate"
        />
      </div>

      {/* REVENUE CHART + STAGE DONUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">แนวโน้มยอดขาย</h3>
              <p className="text-xs text-slate-400 mt-0.5">ยอดจริง vs pipeline</p>
            </div>
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-xs text-slate-400">จริง</span></div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-200" /><span className="text-xs text-slate-400">Pipeline</span></div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-violet-500" /><span className="text-xs text-slate-400">Weighted</span></div>
            </div>
          </div>
          <div className="h-[320px] w-full min-w-0 min-h-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
              <ComposedChart data={analytics?.revenueStream}>
                <defs>
                  <linearGradient id="colorActualAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '900' }} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '900' }} tickFormatter={(v) => `${v / 1000000}M`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="actual" name="ยอดจริง" stroke="#D97706" strokeWidth={4} fill="url(#colorActualAnalytics)" animationDuration={1500} />
                <Bar dataKey="unweighted" name="Pipeline Volume" fill="#f1f5f9" radius={[6, 6, 0, 0]} barSize={30} />
                <Line type="monotone" dataKey="weighted" name="Weighted Forecast" stroke="#7c3aed" strokeWidth={3} dot={{ r: 3, fill: '#7c3aed', strokeWidth: 0 }} />
                <Line type="monotone" dataKey="target" name="Goal" stroke="#e2e8f0" strokeWidth={2} strokeDasharray="10 10" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-1 p-6 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col items-center">
          <div className="w-full mb-5">
            <h3 className="text-sm font-semibold text-slate-900">ดีลตามขั้นตอน</h3>
            <p className="text-xs text-slate-400 mt-0.5">จำนวนดีลในแต่ละขั้นตอน</p>
          </div>
          <div className="relative w-full aspect-square max-w-[240px] min-w-0 min-h-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
              <PieChart>
                <Pie data={analytics?.stageData} innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value" stroke="none">
                  {analytics?.stageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-3xl font-black text-slate-900">{analytics?.totalDeals || 0}</p>
                <p className="text-xs text-slate-400">ดีลทั้งหมด</p>
              </div>
            </div>
          </div>
          <div className="w-full mt-auto space-y-2 pt-4 border-t border-slate-100">
            {analytics?.stageData.map((stage) => (
              <div key={stage.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                  <span className="text-xs text-slate-600">{stage.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{formatCurrency(stage.totalValue)}</span>
                  <span className="text-xs font-bold text-slate-900 w-5 text-right">{stage.value}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* CONVERSION FUNNEL */}
      <Card className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
              <Zap size={16} className="text-violet-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Conversion Funnel</h3>
              <p className="text-xs text-slate-400 mt-0.5">อัตราการแปลงระหว่างขั้นตอน</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            ดีสุด &gt;60% &nbsp;
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            ปานกลาง &nbsp;
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            ต้องปรับ &lt;30%
          </div>
        </div>

        <div className="space-y-3">
          {analytics?.funnelData.map((item, i) => (
            <div key={item.stage} className="group">
              <div className="flex items-center gap-4 mb-1.5">
                <div className="w-20 shrink-0">
                  <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                </div>
                <div className="flex-1 relative">
                  <div className="h-9 bg-slate-50 rounded-xl overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.widthPct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1, ease: [0.19, 1, 0.22, 1] }}
                      className="h-full rounded-xl flex items-center px-3 gap-2"
                      style={{ backgroundColor: item.color + '25', borderLeft: `3px solid ${item.color}` }}
                    >
                      <span className="text-xs font-bold" style={{ color: item.color }}>{item.count} ดีล</span>
                      <span className="text-xs text-slate-500">{formatCurrency(item.value)}</span>
                    </motion.div>
                  </div>
                </div>
                <div className="w-24 shrink-0 text-right">
                  {i === 0 ? (
                    <span className="text-xs font-semibold text-slate-400">เริ่มต้น</span>
                  ) : (
                    <span className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full",
                      item.conversionRate >= 60 ? "bg-emerald-50 text-emerald-600" :
                      item.conversionRate >= 30 ? "bg-amber-50 text-amber-600" :
                      "bg-rose-50 text-rose-600"
                    )}>
                      {item.conversionRate}% ผ่าน
                    </span>
                  )}
                </div>
              </div>
              {i < (analytics.funnelData.length - 1) && (
                <div className="ml-20 pl-4 border-l-2 border-dashed border-slate-100 h-2" />
              )}
            </div>
          ))}
        </div>

        {/* Velocity row */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={13} className="text-slate-400" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deal Velocity — เฉลี่ยวันที่หยุดอยู่ต่อขั้นตอน</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {analytics?.velocityData.map((v) => (
              <div key={v.name} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">{v.name}</p>
                  <p className="text-xs text-slate-400">{v.count} ดีล</p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-xl font-black tabular-nums",
                    v.days >= 7 ? "text-rose-500" : v.days >= 4 ? "text-amber-500" : "text-emerald-600"
                  )}>{v.days}</p>
                  <p className="text-[10px] text-slate-400">วัน</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* PERFORMANCE METRICS */}
      <Card className="p-6 rounded-2xl bg-slate-900 text-white border-0 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div>
            <h3 className="text-sm font-semibold text-white">ตัวชี้วัดประสิทธิภาพ</h3>
            <p className="text-xs text-slate-400 mt-0.5">วิเคราะห์อัตราการปิดและค่าเฉลี่ย</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs text-slate-400">Real-time</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
          {[
            { label: "อัตราปิดดีล", val: `${analytics?.winRate || 0}%`, icon: ShieldCheck },
            { label: "มูลค่าดีลเฉลี่ย", val: formatCurrency(analytics?.avgDealValue), icon: Activity },
            { label: "เฉลี่ยวันปิดดีล", val: `${analytics?.avgDaysToClose || 0} วัน`, icon: Clock },
            { label: "ดีลทั้งหมด", val: `${analytics?.totalDeals || 0} ดีล`, icon: Target },
            { label: "At-risk forecast", val: formatCurrency(analytics?.intelligence?.atRiskValue), icon: AlertCircle }
          ].map((m, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <m.icon size={13} className="text-violet-400" />
                <p className="text-xs text-slate-400">{m.label}</p>
              </div>
              <p className="text-xl font-bold text-white tabular-nums">{m.val}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* TEAM LEADERBOARD */}
      {analytics?.teamLeaderboard && analytics.teamLeaderboard.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <Trophy size={16} className="text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Team Leaderboard</h3>
              <p className="text-xs text-slate-400 mt-0.5">ผลงานทีมขายเดือนนี้</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {analytics.teamLeaderboard.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={cn(
                  "p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all relative overflow-hidden",
                  i === 0
                    ? "bg-gradient-to-br from-amber-50 to-white border-amber-200"
                    : "bg-white border-slate-100"
                )}
              >
                {i === 0 && (
                  <div className="absolute top-3 right-3">
                    <span className="text-amber-400 text-lg">🏆</span>
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <div className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm',
                      m.color?.split(' ')[0] || 'bg-violet-600'
                    )}>
                      {m.name.charAt(0)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-800 text-white text-[10px] font-black flex items-center justify-center">
                      {i + 1}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm leading-tight">{m.name}</p>
                    <p className="text-xs text-slate-400">{m.role}</p>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 rounded-xl bg-slate-50">
                    <p className="text-base font-black text-slate-900 tabular-nums">{m.wonThisMonthCount}</p>
                    <p className="text-[10px] text-slate-400 leading-tight">ปิดเดือนนี้</p>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-slate-50">
                    <p className={cn("text-base font-black tabular-nums", m.winRate >= 50 ? "text-emerald-600" : m.winRate >= 30 ? "text-amber-500" : "text-rose-500")}>
                      {m.winRate}%
                    </p>
                    <p className="text-[10px] text-slate-400 leading-tight">Win Rate</p>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-slate-50">
                    <p className="text-base font-black text-blue-600 tabular-nums">{m.activeCount}</p>
                    <p className="text-[10px] text-slate-400 leading-tight">ดีล active</p>
                  </div>
                </div>

                {/* Won this month vs goal */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-slate-400">ยอดขายเดือนนี้</p>
                      <p className="text-lg font-black text-slate-900 tabular-nums leading-tight">{formatCurrency(m.wonThisMonthValue)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400">เป้า {formatCurrency(m.goal || 0)}</p>
                      <p className={cn(
                        "text-sm font-black tabular-nums",
                        m.goalAchievement >= 100 ? "text-emerald-600" :
                        m.goalAchievement >= 70 ? "text-amber-500" : "text-rose-500"
                      )}>
                        {m.goalAchievement}%
                      </p>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${m.goalAchievement}%` }}
                      transition={{ duration: 1, delay: i * 0.1, ease: [0.19, 1, 0.22, 1] }}
                      className={cn(
                        "h-full rounded-full",
                        m.goalAchievement >= 100 ? "bg-emerald-500" :
                        m.goalAchievement >= 70 ? "bg-amber-500" : "bg-rose-500"
                      )}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">Pipeline active: {formatCurrency(m.activePipelineValue)}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Revenue by member stacked chart */}
          {(teamMembers || []).length > 0 && (
            <Card className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-slate-900">ยอดขายตามทีม (รายเดือน)</h3>
                <p className="text-xs text-slate-400 mt-0.5">เปรียบเทียบผลงานแต่ละคน</p>
              </div>
              <div className="flex flex-wrap gap-4 mb-4">
                {(teamMembers || []).map((m, i) => (
                  <div key={m.id} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: memberColors[i % memberColors.length] }} />
                    <span className="text-xs text-slate-500">{m.name}</span>
                  </div>
                ))}
              </div>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%" debounce={50}>
                  <BarChart data={analytics?.revenueByMember} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `${v / 1000000}M`} />
                    <Tooltip content={<CustomTooltip />} />
                    {(teamMembers || []).map((m, i) => (
                      <Bar key={m.id} dataKey={m.name} stackId="team" fill={memberColors[i % memberColors.length]} radius={i === (teamMembers.length - 1) ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* WIN / LOSS REASONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                <ThumbsUp size={15} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">เหตุผลที่ชนะ</h3>
                <p className="text-xs text-slate-400 mt-0.5">Top {analytics?.wonReasons?.length || 0} จากดีลที่ปิดได้</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600 tabular-nums">{analytics?.wonCount || 0} ดีล</span>
          </div>
          <div className="space-y-3">
            {!analytics?.wonReasons?.length ? (
              <p className="text-xs text-slate-300 text-center py-8 font-medium">ยังไม่มีข้อมูลเหตุผลการชนะ</p>
            ) : analytics.wonReasons.map((r, i) => {
              const max = analytics.wonReasons[0].count;
              const pct = Math.round((r.count / max) * 100);
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between items-center gap-3">
                    <p className="text-sm font-semibold text-slate-700 truncate flex-1">{r.reason}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-slate-500 tabular-nums">{r.count}×</span>
                      <span className="text-xs text-emerald-600 tabular-nums">{formatCurrency(r.totalValue)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.08 }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
                <ThumbsDown size={15} className="text-rose-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">เหตุผลที่แพ้</h3>
                <p className="text-xs text-slate-400 mt-0.5">Top {analytics?.lostReasons?.length || 0} จากดีลที่แพ้</p>
              </div>
            </div>
            <span className="text-xs font-bold text-rose-500 tabular-nums">{analytics?.lostCount || 0} ดีล</span>
          </div>
          <div className="space-y-3">
            {!analytics?.lostReasons?.length ? (
              <p className="text-xs text-slate-300 text-center py-8 font-medium">ยังไม่มีข้อมูลเหตุผลการแพ้</p>
            ) : analytics.lostReasons.map((r, i) => {
              const max = analytics.lostReasons[0].count;
              const pct = Math.round((r.count / max) * 100);
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between items-center gap-3">
                    <p className="text-sm font-semibold text-slate-700 truncate flex-1">{r.reason}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-slate-500 tabular-nums">{r.count}×</span>
                      <span className="text-xs text-rose-500 tabular-nums">{formatCurrency(r.totalValue)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.08 }}
                      className="h-full bg-rose-500 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
