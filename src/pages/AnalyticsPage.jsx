import { useMemo, useState, useEffect, useRef } from 'react';
import { useDeals } from '../hooks/useDeals';
import { useSettings } from '../hooks/useSettings';
import { useTeam } from '../hooks/useTeam';
import { useAuth } from '../hooks/useAuth';
import { useMyProfile } from '../hooks/useUserProfiles';
import { Card } from '../components/ui/Card';
import { motion, animate } from 'framer-motion';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/formatters';
import { STAGE_COLORS, STAGE_LABELS } from '../lib/constants';
import { buildPipelineIntelligence, DEFAULT_STAGE_PROBABILITY } from '../utils/salesIntelligence';
import CustomTooltip from '../components/ui/CustomTooltip';
import SafeResponsiveContainer from '../components/charts/SafeResponsiveContainer';
import {
  Area, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell,
  ComposedChart, Line, BarChart
} from 'recharts';
import {
  Target, ArrowUpRight, ArrowDownRight, Loader2,
  Activity, DollarSign, ShieldCheck, ThumbsUp, ThumbsDown, AlertCircle,
  Trophy, Zap, Clock, Sparkles, TrendingUp
} from 'lucide-react';

// --- Premium Animated Number Component ---
function AnimatedNumber({ value, formatter, duration = 1.2 }) {
  const ref = useRef(null);
  
  useEffect(() => {
    const numericValue = typeof value === 'number' ? value : parseFloat(value?.toString().replace(/[^0-9.-]+/g,"") || 0);
    if (isNaN(numericValue)) return;
    
    const controls = animate(0, numericValue, {
      duration,
      ease: [0.19, 1, 0.22, 1], // Apple-like ease-out
      onUpdate(val) {
        if (ref.current) {
          ref.current.textContent = formatter ? formatter(val) : Math.round(val).toLocaleString();
        }
      }
    });
    return () => controls.stop();
  }, [value, duration, formatter]);

  return <span ref={ref}>{formatter ? formatter(0) : 0}</span>;
}

// --- Premium Metric Card ---
const MetricCard = ({ title, value, numericValue, formatter, subValue, icon: Icon, trend, color = "primary", delay = 0 }) => {
  const colorStyles = {
    primary: "text-violet-600 bg-violet-50/80 border-violet-100",
    emerald: "text-emerald-600 bg-emerald-50/80 border-emerald-100",
    rose: "text-rose-600 bg-rose-50/80 border-rose-100",
    amber: "text-amber-600 bg-amber-50/80 border-amber-100",
    slate: "text-slate-600 bg-slate-50/80 border-slate-100"
  };
  
  const glowStyles = {
    primary: "group-hover:shadow-violet-500/10",
    emerald: "group-hover:shadow-emerald-500/10",
    rose: "group-hover:shadow-rose-500/10",
    amber: "group-hover:shadow-amber-500/10",
    slate: "group-hover:shadow-slate-500/10"
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="group"
    >
      <Card className={cn("p-5 rounded-3xl bg-white border border-slate-100/60 shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden", glowStyles[color])}>
        {/* Subtle background glow */}
        <div className={cn("absolute -top-10 -right-10 w-32 h-32 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-full", colorStyles[color].split(' ')[1])} />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-sm", colorStyles[color])}>
              <Icon size={18} strokeWidth={2.5} />
            </div>
            {trend !== undefined && (
              <div className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide",
                trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              )}>
                {trend >= 0 ? <ArrowUpRight size={13} strokeWidth={3} /> : <ArrowDownRight size={13} strokeWidth={3} />}
                {Math.abs(trend)}%
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
            <h3 className="text-2xl font-black text-slate-900 tabular-nums leading-none tracking-tight">
              {numericValue !== undefined ? <AnimatedNumber value={numericValue} formatter={formatter} /> : value}
            </h3>
            {subValue && <p className="text-xs text-slate-500 font-medium mt-1.5">{subValue}</p>}
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

    // Deal Velocity
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
      <Loader2 className="animate-spin text-violet-600" size={40} />
      <p className="text-sm font-medium text-slate-400">Loading Intelligence...</p>
    </div>
  );

  const memberColors = ['#8b5cf6', '#0ea5e9', '#f59e0b', '#10b981', '#ec4899', '#f43f5e'];

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-24 px-4 md:px-6 mt-4">
      
      {/* HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Analytics <span className="text-violet-600">Command Center</span></h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Deep insights and world-class pipeline intelligence.</p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/60 shadow-sm">
          {[['3m', '3 Months'], ['6m', '6 Months'], ['12m', '12 Months']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setTimeRange(val)}
              className={cn(
                "px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300",
                timeRange === val ? "bg-white shadow-md text-violet-700" : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* AI EXECUTIVE SUMMARY (New Premium Widget) */}
      {analytics?.intelligence?.executiveActions?.length > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-0 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Sparkles size={160} />
            </div>
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
                <Sparkles size={20} className="text-violet-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">AI Executive Insights</h3>
                <p className="text-xs text-slate-400 font-medium">Recommended actions to hit quota and reduce risk.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
              {analytics.intelligence.executiveActions.map((action, i) => (
                <div key={action.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full",
                      action.priority === 'critical' ? "bg-rose-500/20 text-rose-300" :
                      action.priority === 'high' ? "bg-amber-500/20 text-amber-300" :
                      "bg-blue-500/20 text-blue-300"
                    )}>
                      {action.priority}
                    </span>
                    <span className="text-xs font-bold text-white tabular-nums">{action.count} Deals</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1.5 leading-snug">{action.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{action.description}</p>
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Value Impact</span>
                    <span className="text-sm font-black text-emerald-400 tabular-nums">{formatCurrency(action.impactValue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* PRIMARY KPI RIBBON */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        <MetricCard
          title="Revenue This Month"
          numericValue={analytics?.currentMonthActual}
          formatter={(v) => formatCurrency(v)}
          subValue={`Target: ${formatCurrency(monthlyTarget)}`}
          trend={analytics?.growth}
          icon={DollarSign}
          color="emerald"
          delay={0.1}
        />
        <MetricCard
          title="Total Pipeline"
          numericValue={analytics?.totalPipeline}
          formatter={(v) => formatCurrency(v)}
          subValue={`${analytics?.activeCount} active deals`}
          icon={Activity}
          color="primary"
          delay={0.2}
        />
        <MetricCard
          title="Weighted Forecast"
          numericValue={analytics?.intelligence?.forecastToGoalValue}
          formatter={(v) => formatCurrency(v)}
          subValue={`${Math.round((analytics?.intelligence?.weightedCoverageRatio || 0) * 100)}% forecast coverage`}
          icon={ShieldCheck}
          color="amber"
          delay={0.3}
        />
        <MetricCard
          title="Global Win Rate"
          numericValue={analytics?.winRate}
          formatter={(v) => `${Math.round(v)}%`}
          subValue="Across all closed deals"
          icon={Target}
          color="emerald"
          delay={0.4}
        />
        <MetricCard
          title="Avg Days to Close"
          numericValue={analytics?.avgDaysToClose}
          formatter={(v) => `${Math.round(v)} Days`}
          subValue={`Avg Size ${formatCurrency(analytics?.avgDealValue)}`}
          icon={Clock}
          color="slate"
          delay={0.5}
        />
      </div>

      {/* REVENUE CHART + STAGE DONUT */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-7 rounded-3xl bg-white border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-8">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Revenue Trend</h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">Actuals vs Forecast vs Goal</p>
            </div>
            <div className="flex items-center gap-5 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" /><span className="text-xs font-semibold text-slate-600">Actual</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-slate-300" /><span className="text-xs font-semibold text-slate-600">Pipeline</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-sm shadow-violet-500/50" /><span className="text-xs font-semibold text-slate-600">Weighted</span></div>
            </div>
          </div>
          <div className="h-[360px] w-full min-w-0 min-h-0">
            <SafeResponsiveContainer>
              <ComposedChart data={analytics?.revenueStream}>
                <defs>
                  <linearGradient id="colorActualAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: '700' }} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: '700' }} tickFormatter={(v) => `${v / 1000000}M`} dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }} />
                <Bar dataKey="unweighted" name="Pipeline Volume" fill="#f1f5f9" radius={[8, 8, 0, 0]} barSize={40} />
                <Area type="monotone" dataKey="actual" name="Actual Revenue" stroke="#10b981" strokeWidth={4} fill="url(#colorActualAnalytics)" animationDuration={1500} />
                <Line type="monotone" dataKey="weighted" name="Weighted Forecast" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="target" name="Goal" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="8 8" dot={false} />
              </ComposedChart>
            </SafeResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-1 p-7 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col items-center">
          <div className="w-full mb-6">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Stage Distribution</h3>
            <p className="text-xs text-slate-400 mt-1 font-medium">Pipeline health by volume</p>
          </div>
          <div className="relative w-full aspect-square max-w-[260px] min-w-0 min-h-0">
            <SafeResponsiveContainer>
              <PieChart>
                <Pie data={analytics?.stageData} innerRadius={85} outerRadius={120} paddingAngle={4} dataKey="value" stroke="none">
                  {analytics?.stageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </SafeResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-4xl font-black text-slate-900 tracking-tighter">
                  <AnimatedNumber value={analytics?.totalDeals || 0} />
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Total Deals</p>
              </div>
            </div>
          </div>
          <div className="w-full mt-auto space-y-3 pt-6 border-t border-slate-100">
            {analytics?.stageData.map((stage) => (
              <div key={stage.name} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: stage.color }} />
                  <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">{stage.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-400 font-medium">{formatCurrency(stage.totalValue)}</span>
                  <span className="text-xs font-black text-slate-900 w-6 text-right tabular-nums">{stage.value}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* CONVERSION FUNNEL & VELOCITY */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100/50">
                <TrendingUp size={22} className="text-amber-500" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Conversion Funnel & Velocity</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Analyze drop-offs and stage bottlenecks</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium bg-slate-50 px-4 py-2 rounded-xl">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40" /> Excellent &gt;60%</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/40" /> Average</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/40" /> Needs Work &lt;30%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Funnel Progress Bars */}
            <div className="col-span-2 space-y-4">
              {analytics?.funnelData.map((item, i) => (
                <div key={item.stage} className="relative">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-28 shrink-0">
                      <span className="text-sm font-bold text-slate-700">{item.label}</span>
                    </div>
                    <div className="flex-1 relative h-10 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100/50">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.widthPct}%` }}
                        transition={{ duration: 1, delay: i * 0.15, ease: [0.19, 1, 0.22, 1] }}
                        className="absolute top-0 left-0 h-full rounded-2xl flex items-center px-4 gap-3 shadow-inner"
                        style={{ backgroundColor: item.color + '20', borderLeft: `4px solid ${item.color}` }}
                      >
                        <span className="text-xs font-black" style={{ color: item.color }}>{item.count} Deals</span>
                        <span className="text-[11px] font-bold text-slate-600 bg-white/50 px-2 py-0.5 rounded-lg">{formatCurrency(item.value)}</span>
                      </motion.div>
                    </div>
                    <div className="w-28 shrink-0 text-right">
                      {i === 0 ? (
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Start</span>
                      ) : (
                        <span className={cn(
                          "text-xs font-black px-3 py-1.5 rounded-xl shadow-sm border",
                          item.conversionRate >= 60 ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                          item.conversionRate >= 30 ? "bg-amber-50 text-amber-600 border-amber-100" :
                          "bg-rose-50 text-rose-600 border-rose-100"
                        )}>
                          <AnimatedNumber value={item.conversionRate} formatter={v => `${Math.round(v)}%`} /> Pass
                        </span>
                      )}
                    </div>
                  </div>
                  {i < (analytics.funnelData.length - 1) && (
                    <div className="ml-28 pl-6 border-l-2 border-dashed border-slate-200 h-4" />
                  )}
                </div>
              ))}
            </div>

            {/* Velocity Grid */}
            <div className="col-span-1 bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
              <div className="flex items-center gap-2.5 mb-6">
                <Clock size={16} className="text-slate-400" strokeWidth={2.5} />
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Stage Velocity</p>
              </div>
              <div className="space-y-4">
                {analytics?.velocityData.map((v) => (
                  <div key={v.name} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <p className="text-sm font-bold text-slate-700">{v.name}</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{v.count} active deals</p>
                    </div>
                    <div className="text-right flex items-baseline gap-1">
                      <p className={cn(
                        "text-3xl font-black tabular-nums tracking-tighter",
                        v.days >= 7 ? "text-rose-500" : v.days >= 4 ? "text-amber-500" : "text-emerald-500"
                      )}>
                        <AnimatedNumber value={v.days} />
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Days</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* TEAM LEADERBOARD */}
      {analytics?.teamLeaderboard && analytics.teamLeaderboard.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center border border-amber-200">
              <Trophy size={22} className="text-amber-600" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Elite Leaderboard</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">Top performers & Quota attainment</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {analytics.teamLeaderboard.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className={cn(
                  "p-6 rounded-3xl border shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group",
                  i === 0 ? "bg-gradient-to-b from-amber-50/50 to-white border-amber-200/60" :
                  i === 1 ? "bg-gradient-to-b from-slate-50/80 to-white border-slate-200/60" :
                  i === 2 ? "bg-gradient-to-b from-orange-50/30 to-white border-orange-200/60" :
                  "bg-white border-slate-100"
                )}
              >
                {/* Ranking Medals */}
                <div className="absolute top-4 right-4">
                  {i === 0 ? <div className="text-4xl drop-shadow-md">🥇</div> :
                   i === 1 ? <div className="text-4xl drop-shadow-md">🥈</div> :
                   i === 2 ? <div className="text-4xl drop-shadow-md">🥉</div> :
                   <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 border border-slate-200">#{i + 1}</div>}
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md border-2 border-white',
                    m.color?.split(' ')[0] || 'bg-violet-600'
                  )}>
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-lg leading-tight">{m.name}</p>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">{m.role}</p>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="text-center p-3 rounded-2xl bg-slate-50/80 border border-slate-100 group-hover:bg-white transition-colors">
                    <p className="text-xl font-black text-slate-900 tabular-nums"><AnimatedNumber value={m.wonThisMonthCount} /></p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Won</p>
                  </div>
                  <div className="text-center p-3 rounded-2xl bg-slate-50/80 border border-slate-100 group-hover:bg-white transition-colors">
                    <p className={cn("text-xl font-black tabular-nums", m.winRate >= 50 ? "text-emerald-500" : m.winRate >= 30 ? "text-amber-500" : "text-rose-500")}>
                      <AnimatedNumber value={m.winRate} />%
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Win Rate</p>
                  </div>
                  <div className="text-center p-3 rounded-2xl bg-slate-50/80 border border-slate-100 group-hover:bg-white transition-colors">
                    <p className="text-xl font-black text-blue-500 tabular-nums"><AnimatedNumber value={m.activeCount} /></p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Active</p>
                  </div>
                </div>

                {/* Quota Progress */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Quota Attainment</p>
                      <p className="text-2xl font-black text-slate-900 tabular-nums tracking-tight">
                        {formatCurrency(m.wonThisMonthValue)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Goal {formatCurrency(m.goal || 0)}</p>
                      <p className={cn(
                        "text-sm font-black tabular-nums px-2 py-0.5 rounded-lg inline-block",
                        m.goalAchievement >= 100 ? "bg-emerald-50 text-emerald-600" :
                        m.goalAchievement >= 70 ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                      )}>
                        <AnimatedNumber value={m.goalAchievement} />%
                      </p>
                    </div>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, m.goalAchievement)}%` }}
                      transition={{ duration: 1.5, delay: i * 0.2, ease: [0.19, 1, 0.22, 1] }}
                      className={cn(
                        "h-full rounded-full relative",
                        m.goalAchievement >= 100 ? "bg-gradient-to-r from-emerald-400 to-emerald-500" :
                        m.goalAchievement >= 70 ? "bg-gradient-to-r from-amber-400 to-amber-500" : 
                        "bg-gradient-to-r from-rose-400 to-rose-500"
                      )}
                    >
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-white/20 w-1/2 skew-x-12 -translate-x-full animate-[shimmer_2s_infinite]" />
                    </motion.div>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-400 mt-2">Active Pipeline: <span className="text-slate-600">{formatCurrency(m.activePipelineValue)}</span></p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* WIN / LOSS REASONS */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100/50">
                <ThumbsUp size={20} className="text-emerald-500" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Win Reasons</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Top {analytics?.wonReasons?.length || 0} factors for success</p>
              </div>
            </div>
            <div className="px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-sm font-black text-emerald-600 tabular-nums">{analytics?.wonCount || 0} Deals</span>
            </div>
          </div>
          <div className="space-y-5">
            {!analytics?.wonReasons?.length ? (
              <p className="text-sm text-slate-400 text-center py-10 font-semibold bg-slate-50 rounded-2xl border border-dashed border-slate-200">Not enough data to analyze win reasons.</p>
            ) : analytics.wonReasons.map((r, i) => {
              const max = analytics.wonReasons[0].count;
              const pct = Math.round((r.count / max) * 100);
              return (
                <div key={i} className="space-y-2 group">
                  <div className="flex justify-between items-end gap-3">
                    <p className="text-sm font-bold text-slate-700 truncate flex-1 group-hover:text-emerald-600 transition-colors">{r.reason}</p>
                    <div className="flex items-baseline gap-3 shrink-0">
                      <span className="text-xs font-black text-slate-400 tabular-nums">{r.count}×</span>
                      <span className="text-sm font-bold text-emerald-600 tabular-nums">{formatCurrency(r.totalValue)}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, delay: i * 0.1, ease: [0.19, 1, 0.22, 1] }}
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center border border-rose-100/50">
                <ThumbsDown size={20} className="text-rose-500" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Loss Reasons</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Top {analytics?.lostReasons?.length || 0} friction points</p>
              </div>
            </div>
            <div className="px-4 py-2 bg-rose-50 rounded-xl border border-rose-100">
              <span className="text-sm font-black text-rose-500 tabular-nums">{analytics?.lostCount || 0} Deals</span>
            </div>
          </div>
          <div className="space-y-5">
            {!analytics?.lostReasons?.length ? (
              <p className="text-sm text-slate-400 text-center py-10 font-semibold bg-slate-50 rounded-2xl border border-dashed border-slate-200">Not enough data to analyze loss reasons.</p>
            ) : analytics.lostReasons.map((r, i) => {
              const max = analytics.lostReasons[0].count;
              const pct = Math.round((r.count / max) * 100);
              return (
                <div key={i} className="space-y-2 group">
                  <div className="flex justify-between items-end gap-3">
                    <p className="text-sm font-bold text-slate-700 truncate flex-1 group-hover:text-rose-500 transition-colors">{r.reason}</p>
                    <div className="flex items-baseline gap-3 shrink-0">
                      <span className="text-xs font-black text-slate-400 tabular-nums">{r.count}×</span>
                      <span className="text-sm font-bold text-rose-500 tabular-nums">{formatCurrency(r.totalValue)}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, delay: i * 0.1, ease: [0.19, 1, 0.22, 1] }}
                      className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
