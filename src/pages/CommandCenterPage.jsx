import { useMemo, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeals } from '../hooks/useDeals';
import { useTeam } from '../hooks/useTeam';
import { useSettings } from '../hooks/useSettings';
import { useActivities, useUpdateActivity } from '../hooks/useActivities';
import { useCustomers } from '../hooks/useCustomers';
import { useSubscription } from '../hooks/useSubscription';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from '../hooks/useAuth';
import { useMyProfile } from '../hooks/useUserProfiles';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { motion, animate, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '../lib/utils';
import { formatCurrency, formatFullCurrency, daysSince } from '../lib/formatters';
import { buildPipelineIntelligence, buildCustomerHealth, DEFAULT_STAGE_PROBABILITY } from '../utils/salesIntelligence';
import { STAGE_COLORS, STAGE_LABELS } from '../lib/constants';
import CustomTooltip from '../components/ui/CustomTooltip';
import SafeResponsiveContainer from '../components/charts/SafeResponsiveContainer';
import QuickWinModal from '../components/pipeline/QuickWinModal';
import {
  TrendingUp,
  Users, AlertCircle,
  ArrowUpRight, ArrowDownRight, Briefcase,
  Target, Clock, CalendarClock, ChevronRight, CheckCircle2,
  Phone, Mail, FileText, MessageSquare, Activity, Trophy,
  Star, Flame, BarChart3, Sparkles, Shield, Zap,
  PieChart as PieChartIcon, Wrench, Settings, ShieldCheck,
  Crown, Loader2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip
} from 'recharts';

// --- Animated Number Component ---
function AnimatedNumber({ value, formatter, duration = 0.4, className = '', animate: shouldAnimate = true }) {
  const ref = useRef(null);
  const isReduced = useReducedMotion();
  useEffect(() => {
    if (!shouldAnimate || isReduced) return;
    const numericValue = typeof value === 'number' ? value : parseFloat(value?.toString().replace(/[^0-9.-]+/g, "") || 0);
    if (isNaN(numericValue)) return;
    const controls = animate(0, numericValue, {
      duration,
      ease: [0.19, 1, 0.22, 1],
      onUpdate(val) {
        if (ref.current) {
          ref.current.textContent = formatter ? formatter(val) : Math.round(val).toLocaleString();
        }
      }
    });
    return () => controls.stop();
  }, [value, formatter, duration, shouldAnimate, isReduced]);

  return <span ref={ref} className={cn("font-display", className)}>{formatter ? formatter(value) : Math.round(value || 0).toLocaleString()}</span>;
}

const ACTIVITY_ICON = {
  call: { Icon: Phone, color: 'bg-blue-50 text-blue-500' },
  email: { Icon: Mail, color: 'bg-violet-50 text-violet-500' },
  meeting: { Icon: Clock, color: 'bg-amber-50 text-amber-600' },
  note: { Icon: FileText, color: 'bg-slate-50 text-slate-500' },
  task: { Icon: CalendarClock, color: 'bg-amber-50 text-amber-700' },
  whatsapp: { Icon: MessageSquare, color: 'bg-emerald-50 text-emerald-600' },
};

const FUNNEL_STAGES = ['lead', 'contact', 'proposal', 'negotiation'];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'สวัสดีตอนเช้า';
  if (hour < 17) return 'สวัสดีตอนบ่าย';
  return 'สวัสดีตอนเย็น';
};

const getDateString = () => {
  return new Date().toLocaleDateString('th-TH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
};

export default function CommandCenterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: myProfile } = useMyProfile(user?.id);
  const { data: deals, isLoading: dealsLoading } = useDeals();
  const { data: teamMembers, isLoading: teamLoading } = useTeam();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: activities = [] } = useActivities();
  const updateActivityMutation = useUpdateActivity();
  const { data: customers = [] } = useCustomers();
  const { setPendingOpenDeal, openPaywall } = useAppStore();
  const { shouldBlockBasic, isGuestAccount } = useSubscription();

  const [isQuickWinOpen, setIsQuickWinOpen] = useState(false);

  const teamGoal = settings?.monthly_target || 10000000;
  const hasPersonalTarget = myProfile?.personal_target > 0;
  const monthlyGoal = hasPersonalTarget ? myProfile.personal_target : 0;

  const stats = useMemo(() => {
    if (!deals) return null;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const intelligence = buildPipelineIntelligence(deals, { monthlyGoal, now });
    const totalWonValue = intelligence.currentMonthWonValue;
    const activePipeline = intelligence.activeDeals;
    const totalPipelineValue = intelligence.activePipelineValue;
    const achievementPercent = monthlyGoal > 0 ? Math.round((totalWonValue / monthlyGoal) * 100) : 0;

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
      const rawDate = deal.stage === 'won'
        ? (deal.actual_close_date || deal.updated_at || deal.created_at)
        : deal.created_at;
      const dealDate = new Date(rawDate);
      const mIdx = months.findIndex(m => m.month === dealDate.getMonth() && m.year === dealDate.getFullYear());
      if (mIdx !== -1) {
        if (deal.stage === 'won') months[mIdx].actual += Number(deal.value || 0);
        else if (deal.stage !== 'lost') {
          months[mIdx].forecast += Number(deal.value || 0) * (Number(deal.probability || 0) / 100);
        }
      }
    });

    const urgentDeals = (intelligence.highImpactRisks.length > 0 ? intelligence.highImpactRisks : activePipeline)
      .filter(d => daysSince(d.last_activity || d.created_at) >= 3)
      .sort((a, b) => (Number(b.value) * (b.probability / 100)) - (Number(a.value) * (a.probability / 100)))
      .slice(0, 3);

    const prevMonthActual = months[months.length - 2]?.actual || 0;
    const currentMonthActual = months[months.length - 1]?.actual || 0;
    const growthPercent = prevMonthActual > 0
      ? ((currentMonthActual - prevMonthActual) / prevMonthActual * 100).toFixed(1)
      : 0;

    const weekAgo = now.getTime() - 7 * 86_400_000;
    const newDealsThisWeek = deals.filter(d => new Date(d.created_at).getTime() >= weekAgo).length;

    const wonThisWeek = deals.filter(d => {
      if (d.stage !== 'won') return false;
      const dt = new Date(d.actual_close_date || d.updated_at || d.created_at);
      return dt.getTime() >= weekAgo;
    });
    const wonThisWeekValue = wonThisWeek.reduce((s, d) => s + Number(d.value || 0), 0);

    const activeDealsArr = activePipeline;
    const commitValue = activeDealsArr
      .filter(d => Number(d.probability) >= 70)
      .reduce((s, d) => s + Number(d.value || 0) * (Number(d.probability) / 100), 0);
    const bestCaseValue = activeDealsArr
      .reduce((s, d) => s + Number(d.value || 0), 0);
    const worstCaseValue = activeDealsArr
      .filter(d => Number(d.probability) >= 90)
      .reduce((s, d) => s + Number(d.value || 0), 0);

    const now30 = now.getTime() + 30 * 86_400_000;
    const hotDeals = activeDealsArr
      .map(d => ({
        ...d,
        score: Number(d.value || 0) * (Number(d.probability || 0) / 100),
        closingSoon: d.expected_close_date && new Date(d.expected_close_date).getTime() <= now30,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // Pipeline mini-funnel
    const funnelData = FUNNEL_STAGES.map(stage => {
      const stageDeals = deals.filter(d => d.stage === stage);
      return {
        stage,
        label: STAGE_LABELS[stage] || stage,
        count: stageDeals.length,
        value: stageDeals.reduce((s, d) => s + Number(d.value || 0), 0),
        color: STAGE_COLORS[stage],
      };
    });

    // Won deals stats
    const wonDeals = deals.filter(d => d.stage === 'won');
    const lostDeals = deals.filter(d => d.stage === 'lost');
    const winRate = (wonDeals.length + lostDeals.length) > 0
      ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100)
      : 0;
    const avgDaysToClose = wonDeals.length > 0
      ? Math.round(wonDeals.reduce((s, d) => {
          const created = new Date(d.created_at);
          const closed = new Date(d.actual_close_date || d.updated_at || d.created_at);
          return s + Math.max(0, (closed - created) / 86400000);
        }, 0) / wonDeals.length)
      : 0;

    return {
      totalWonValue,
      totalPipelineValue,
      achievementPercent,
      activeCount: activePipeline.length,
      urgentDeals,
      revenueStream: months,
      growthPercent,
      intelligence,
      newDealsThisWeek,
      wonThisWeek: wonThisWeek.length,
      wonThisWeekValue,
      commitValue,
      bestCaseValue,
      worstCaseValue,
      hotDeals,
      funnelData,
      winRate,
      avgDaysToClose,
    };
  }, [deals, monthlyGoal]);

  // Customer Health
  const customerStats = useMemo(() => {
    if (!customers.length && !deals?.length) return null;
    const health = buildCustomerHealth(customers, deals || [], { now: new Date() });
    const gradeCount = { A: 0, B: 0, C: 0, D: 0 };
    const atRiskCustomers = [];
    health.forEach(c => {
      if (gradeCount[c.grade] !== undefined) gradeCount[c.grade]++;
      if (c.health?.status === 'at_risk') atRiskCustomers.push(c);
    });
    atRiskCustomers.sort((a, b) => (b.dealStats?.wonValue || 0) - (a.dealStats?.wonValue || 0));
    return { gradeCount, atRiskCustomers: atRiskCustomers.slice(0, 3), total: health.length };
  }, [customers, deals]);

  // Today's Action Plan
  const actionPlan = useMemo(() => {
    if (!deals) return { followUps: [], closingThisWeek: [], stale: [] };
    const now = Date.now();
    const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999);
    const dealMap = Object.fromEntries(deals.map(d => [d.id, d]));

    const followUps = activities
      .filter(a => a.scheduled_at && !a.completed_at && a.deal_id && dealMap[a.deal_id])
      .filter(a => new Date(a.scheduled_at).getTime() <= endOfToday.getTime())
      .map(a => ({
        ...a,
        deal: dealMap[a.deal_id],
        overdue: new Date(a.scheduled_at).getTime() < new Date().setHours(0, 0, 0, 0),
      }))
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));

    const sevenDays = now + 7 * 86_400_000;
    const closingThisWeek = deals
      .filter(d => !['won', 'lost'].includes(d.stage) && d.expected_close_date)
      .filter(d => new Date(d.expected_close_date).getTime() <= sevenDays)
      .sort((a, b) => Number(b.value) - Number(a.value))
      .slice(0, 5);

    const stale = deals
      .filter(d => !['won', 'lost'].includes(d.stage))
      .filter(d => daysSince(d.last_activity || d.created_at) >= 3)
      .sort((a, b) => Number(b.value) - Number(a.value))
      .slice(0, 5);

    return { followUps, closingThisWeek, stale };
  }, [deals, activities]);

  // Activity feed
  const todayActivities = useMemo(() => {
    if (!activities.length) return [];
    const dealMap = Object.fromEntries((deals || []).map(d => [d.id, d]));
    return activities
      .filter(a => a.created_at)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 8)
      .map(a => ({
        ...a,
        deal: a.deal_id ? dealMap[a.deal_id] : null,
        timeLabel: (() => {
          const diff = (Date.now() - new Date(a.created_at).getTime()) / 1000;
          if (diff < 60) return 'เมื่อกี้';
          if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
          if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
          return `${Math.floor(diff / 86400)} วันที่แล้ว`;
        })(),
      }));
  }, [activities, deals]);

  // Team leaderboard
  const teamLeaderboard = useMemo(() => {
    if (!deals || !teamMembers) return [];
    const now = new Date();
    return teamMembers.map(m => {
      const memberDeals = deals.filter(d => d.assigned_to === m.id);
      const wonThisMonth = memberDeals.filter(d => {
        if (d.stage !== 'won') return false;
        const dt = new Date(d.actual_close_date || d.updated_at || d.created_at);
        return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
      });
      const wonAllTime = memberDeals.filter(d => d.stage === 'won');
      const lostAll = memberDeals.filter(d => d.stage === 'lost');
      const active = memberDeals.filter(d => !['won', 'lost'].includes(d.stage));
      const wonThisMonthValue = wonThisMonth.reduce((s, d) => s + Number(d.value || 0), 0);
      const winRate = (wonAllTime.length + lostAll.length) > 0
        ? Math.round(wonAllTime.length / (wonAllTime.length + lostAll.length) * 100)
        : 0;
      const goalAchievement = m.goal > 0 ? Math.min(100, Math.round(wonThisMonthValue / m.goal * 100)) : 0;
      return {
        ...m,
        wonThisMonthValue,
        wonThisMonthCount: wonThisMonth.length,
        activeCount: active.length,
        activePipelineValue: active.reduce((s, d) => s + Number(d.value || 0), 0),
        winRate,
        goalAchievement,
      };
    }).sort((a, b) => b.wonThisMonthValue - a.wonThisMonthValue);
  }, [deals, teamMembers]);

  const openDeal = (deal) => {
    if (!deal) return;
    setPendingOpenDeal(deal);
    navigate('/pipeline');
  };

  const handleCompleteTask = (e, activityId) => {
    e.stopPropagation();
    updateActivityMutation.mutate({
      id: activityId,
      updates: { completed_at: new Date().toISOString() }
    });
  };

  const isLoading = dealsLoading || teamLoading || settingsLoading;
  const hasNoDeals = (deals || []).length === 0;
  const userName = myProfile?.full_name || user?.email?.split('@')[0] || '';

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        className="w-10 h-10 border-4 border-violet-100 border-t-violet-600 rounded-full" />
      <p className="text-sm text-slate-400">กำลังโหลดข้อมูล...</p>
    </div>
  );

  return (
    <div className="relative max-w-[1600px] mx-auto space-y-8 pb-24 px-4 md:px-6 mt-4 overflow-hidden">
      {/* Dynamic atmospheric ambient glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-80 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* PREMIUM HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-violet-500 animate-pulse" />
            <span className="text-xs font-bold text-violet-600 uppercase tracking-widest">Nova Pipeline</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {getGreeting()}, <span className="text-violet-600 bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">{userName}</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-semibold flex items-center gap-1.5">
            <CalendarClock size={14} className="text-slate-400" />
            {getDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={() => shouldBlockBasic ? openPaywall(isGuestAccount ? 'default' : 'trial_ended') : setIsQuickWinOpen(true)}
            className="h-9 px-4 rounded-xl text-xs font-bold border shadow-sm transition-all hover:shadow-md bg-emerald-500 text-white shadow-emerald-500/20 border-emerald-400 hover:bg-emerald-600 active:scale-95">
            <Zap size={14} className="mr-1.5" />
            บันทึกยอดด่วน
          </Button>
          {[
            { label: 'Pipeline', icon: Briefcase, to: '/pipeline', tone: 'bg-violet-600 text-white shadow-violet-500/20 hover:bg-violet-700' },
            { label: 'ลูกค้า', icon: Users, to: '/customers', tone: 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300' },
            { label: 'Analytics', icon: BarChart3, to: '/analytics', tone: 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300' },
            { label: 'เครื่องมือ', icon: Wrench, to: '/tools', tone: 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300' },
          ].map(btn => (
            <Button key={btn.to} onClick={() => navigate(btn.to)}
              className={cn("h-9 px-4 rounded-xl text-xs font-bold border shadow-sm transition-all hover:shadow-md active:scale-95", btn.tone)}>
              <btn.icon size={14} className="mr-1.5" />
              {btn.label}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* ONBOARDING CTA */}
      {hasNoDeals && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 gap-3 md:grid-cols-3"
        >
          {[
            { title: 'เพิ่มดีลแรก', detail: 'สร้าง pipeline ให้ dashboard เริ่มวิเคราะห์ทันที', icon: Briefcase, action: () => navigate('/pipeline'), tone: 'bg-violet-600 text-white shadow-violet-500/20' },
            { title: 'เพิ่มลูกค้า', detail: 'ผูกดีลกับบัญชีลูกค้าเพื่อเห็นมูลค่ารวม', icon: Users, action: () => navigate('/customers'), tone: 'bg-white text-slate-800 border-slate-100' },
            { title: 'ตั้งเป้าหมาย', detail: 'กำหนด target เพื่อให้ forecast มีบริบท', icon: Target, action: () => navigate('/settings'), tone: 'bg-white text-slate-800 border-slate-100' },
          ].map((item) => (
            <button key={item.title} type="button" onClick={item.action}
              className={cn('group rounded-2xl border p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md', item.tone)}>
              <div className="mb-4 flex items-center justify-between">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', item.tone.includes('violet') ? 'bg-white/15 text-white' : 'bg-violet-50 text-violet-600')}>
                  <item.icon size={18} />
                </div>
                <ChevronRight size={16} className={cn('transition-transform group-hover:translate-x-0.5', item.tone.includes('violet') ? 'text-white/70' : 'text-slate-300')} />
              </div>
              <p className="text-sm font-bold">{item.title}</p>
              <p className={cn('mt-1 text-xs leading-5', item.tone.includes('violet') ? 'text-violet-100' : 'text-slate-500')}>{item.detail}</p>
            </button>
          ))}
        </motion.section>
      )}

      {/* GOAL CARD + KPI RIBBON */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Goal Card with SVG Radial Gauge */}
        <Card className="p-7 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white border border-slate-800 shadow-2xl lg:col-span-2 relative overflow-hidden group/goal hover:shadow-violet-950/20 hover:border-violet-900/40 duration-500">
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl pointer-events-none group-hover/goal:bg-violet-600/15 group-hover/goal:scale-110 transition-all duration-700" />
          <div className="absolute -left-12 -top-12 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none group-hover/goal:bg-indigo-600/15 group-hover/goal:scale-110 transition-all duration-700" />
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none text-white group-hover/goal:rotate-6 group-hover/goal:scale-110 transition-transform duration-700">
            <Target size={160} />
          </div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">เป้าหมายเดือนนี้</p>
                <p className="text-xs text-slate-300 mt-1 font-semibold">
                  {stats?.hasPersonalTarget ? `เป้าหมายส่วนตัว ${formatCurrency(monthlyGoal)}` : 'ยังไม่ได้ตั้งเป้าหมายส่วนตัว'}
                </p>
              </div>
              <div className={cn('flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shadow-inner',
                Number(stats?.growthPercent) >= 0 ? 'bg-emerald-500/25 text-emerald-300' : 'bg-rose-500/25 text-rose-300'
              )}>
                {Number(stats?.growthPercent) >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {stats?.growthPercent > 0 ? '+' : ''}{stats?.growthPercent}%
              </div>
            </div>
            <div className="flex items-center gap-6">
              {/* SVG Radial Gauge */}
              <div className="relative w-28 h-28 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                  <defs>
                    <linearGradient id="goalProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#c084fc" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                    <linearGradient id="goalSuccessGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                    <linearGradient id="goalWarnGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>
                  <circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,0.06)" strokeWidth="6.5" fill="transparent" />
                  <motion.circle cx="40" cy="40" r="34"
                    stroke={stats?.achievementPercent >= 100 ? "url(#goalSuccessGradient)" : stats?.achievementPercent >= 70 ? "url(#goalWarnGradient)" : "url(#goalProgressGradient)"}
                    strokeWidth="6.5" fill="transparent"
                    strokeDasharray={2 * Math.PI * 34}
                    animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - Math.min(100, stats?.achievementPercent || 0) / 100) }}
                    transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
                    strokeLinecap="round"
                    className="opacity-30 blur-[1px]"
                  />
                  <motion.circle cx="40" cy="40" r="34"
                    stroke={stats?.achievementPercent >= 100 ? "url(#goalSuccessGradient)" : stats?.achievementPercent >= 70 ? "url(#goalWarnGradient)" : "url(#goalProgressGradient)"}
                    strokeWidth="6.5" fill="transparent"
                    strokeDasharray={2 * Math.PI * 34}
                    animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - Math.min(100, stats?.achievementPercent || 0) / 100) }}
                    transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-white tabular-nums leading-none tracking-tight">
                    <AnimatedNumber value={stats?.achievementPercent || 0} />%
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-wider">Achieved</span>
                </div>
              </div>
              <div className="flex-1 space-y-3.5">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ยอดขายปัจจุบัน</p>
                  <p className="text-2xl font-black text-white tabular-nums tracking-tight leading-none mt-1 bg-clip-text bg-gradient-to-r from-white via-white to-slate-200">
                    <AnimatedNumber value={stats?.totalWonValue || 0} formatter={v => formatCurrency(v)} />
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">เป้าหมาย</p>
                  <p className="text-lg font-bold text-slate-300 tabular-nums leading-none mt-0.5">{formatFullCurrency(monthlyGoal)}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* KPI Cards */}
        {[
          { title: 'Active Pipeline', value: stats?.totalPipelineValue, formatter: v => formatCurrency(v), sub: `${stats?.activeCount || 0} active deals`, icon: Briefcase, color: 'violet', sparkline: stats?.revenueStream?.map(m => m.forecast) },
          { title: 'Win Rate', value: stats?.winRate, formatter: v => `${Math.round(v)}%`, sub: 'All closed deals', icon: ShieldCheck, color: 'emerald', sparkline: [35, 38, 42, 40, 45, stats?.winRate || 40] },
          { title: 'Avg Velocity', value: stats?.avgDaysToClose, formatter: v => `${Math.round(v)} Days`, sub: 'Time to close', icon: Zap, color: 'amber', sparkline: [24, 22, 25, 20, 21, stats?.avgDaysToClose || 20] },
        ].map((kpi, i) => (
          <motion.div key={kpi.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.5 }} className="group">
            <Card className={cn(
              "p-5 h-full rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden",
              kpi.color === 'violet' && 'hover:border-violet-200 hover:shadow-violet-500/5',
              kpi.color === 'emerald' && 'hover:border-emerald-200 hover:shadow-emerald-500/5',
              kpi.color === 'amber' && 'hover:border-amber-200 hover:shadow-amber-500/5'
            )}>
              <div className="absolute -right-6 -bottom-6 w-20 h-20 opacity-5 rounded-full pointer-events-none transition-transform duration-500 group-hover:scale-125"
                style={{ backgroundColor: kpi.color === 'violet' ? '#8b5cf6' : kpi.color === 'emerald' ? '#10b981' : '#f59e0b' }} />
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105",
                    kpi.color === 'violet' ? 'text-violet-600 bg-violet-50' :
                    kpi.color === 'emerald' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50')}>
                    <kpi.icon size={18} strokeWidth={2.5} />
                  </div>
                  {/* Mini sparkline */}
                  {kpi.sparkline && kpi.sparkline.length > 1 && (
                    <div className="w-16 h-8 shrink-0">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 60 20">
                        <defs>
                          <linearGradient id={`kpiGlow-${i}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={kpi.color === 'violet' ? '#8b5cf6' : kpi.color === 'emerald' ? '#10b981' : '#f59e0b'} stopOpacity={0.15} />
                            <stop offset="100%" stopColor={kpi.color === 'violet' ? '#8b5cf6' : kpi.color === 'emerald' ? '#10b981' : '#f59e0b'} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        {/* Glow Fill */}
                        <motion.path
                          d={(() => {
                            const data = kpi.sparkline;
                            const min = Math.min(...data);
                            const max = Math.max(...data);
                            const range = max - min || 1;
                            const points = data.map((val, idx) => {
                              const x = (idx / (data.length - 1)) * 60;
                              const y = 20 - ((val - min) / range) * 16 - 2;
                              return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                            }).join(' ');
                            return `${points} L 60 20 L 0 20 Z`;
                          })()}
                          fill={`url(#kpiGlow-${i})`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                        />
                        {/* Outline stroke */}
                        <motion.path
                          d={(() => {
                            const data = kpi.sparkline;
                            const min = Math.min(...data);
                            const max = Math.max(...data);
                            const range = max - min || 1;
                            return data.map((val, idx) => {
                              const x = (idx / (data.length - 1)) * 60;
                              const y = 20 - ((val - min) / range) * 16 - 2;
                              return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                            }).join(' ');
                          })()}
                          fill="none"
                          stroke={kpi.color === 'violet' ? '#8b5cf6' : kpi.color === 'emerald' ? '#10b981' : '#f59e0b'}
                          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                          transition={{ duration: 1.2, ease: "easeInOut", delay: 0.3 + i * 0.1 }}
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{kpi.title}</p>
                  <p className="text-2xl font-black text-slate-900 tabular-nums leading-none tracking-tight mt-1">
                    <AnimatedNumber value={kpi.value || 0} formatter={kpi.formatter} />
                  </p>
                  <p className="text-xs text-slate-500 font-semibold mt-1.5">{kpi.sub}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* WEEKLY PULSE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'ดีลใหม่สัปดาห์นี้', value: stats?.newDealsThisWeek || 0, icon: Flame, iconColor: 'text-violet-600', iconBg: 'bg-violet-50', valueColor: 'text-slate-900', bgClass: 'bg-gradient-to-br from-violet-500/5 to-purple-500/5 border-violet-100 hover:border-violet-200' },
          { label: 'ปิดได้สัปดาห์นี้', value: stats?.wonThisWeek || 0, icon: Trophy, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50', valueColor: 'text-emerald-600', bgClass: 'bg-gradient-to-br from-emerald-500/5 to-green-500/5 border-emerald-100 hover:border-emerald-200' },
          { label: 'มูลค่าปิดสัปดาห์นี้', value: formatCurrency(stats?.wonThisWeekValue), icon: Star, iconColor: 'text-blue-600', iconBg: 'bg-blue-50', valueColor: 'text-blue-600', isText: true, bgClass: 'bg-gradient-to-br from-blue-500/5 to-sky-500/5 border-blue-100 hover:border-blue-200' },
        ].map((item) => (
          <motion.div
            key={item.label}
            whileHover={{ y: -2, scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <Card className={cn("p-4 rounded-2xl border shadow-sm flex items-center gap-3 transition-all group/pulse cursor-pointer", item.bgClass || "bg-white border-slate-100")}>
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover/pulse:rotate-12", item.iconBg)}>
                <item.icon size={16} className={item.iconColor} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold">{item.label}</p>
                <p className={cn("text-xl font-black tabular-nums leading-none mt-1", item.valueColor)}>
                  {item.isText ? item.value : <AnimatedNumber value={item.value} />}
                </p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* PIPELINE MINI-FUNNEL */}
      {stats?.funnelData && (
        <Card className="p-6 rounded-3xl bg-white border border-slate-100/80 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center">
              <BarChart3 size={18} className="text-violet-600" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Pipeline Snapshot</h3>
              <p className="text-xs text-slate-400 font-medium">สรุปจำนวนดีลและมูลค่าในแต่ละขั้นตอน</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.funnelData.map((item, i) => (
              <motion.div key={item.stage} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="p-4 rounded-2xl border border-slate-100/70 hover:border-violet-100/80 hover:shadow-md transition-all cursor-pointer group hover:bg-slate-50/50"
                onClick={() => navigate('/pipeline')}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-bold text-slate-50 group-hover:text-slate-800 transition-colors uppercase tracking-wider">{item.label}</span>
                </div>
                <p className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter leading-none">
                  {item.count}
                </p>
                <p className="text-xs font-semibold text-slate-400 mt-1.5 tabular-nums">{formatCurrency(item.value)}</p>
                <div className="mt-3.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (item.count / Math.max(1, ...(stats.funnelData.map(f => f.count)))) * 100)}%` }}
                    transition={{ duration: 1, delay: i * 0.1, ease: [0.19, 1, 0.22, 1] }}
                    className="h-full rounded-full bg-gradient-to-r" 
                    style={{ 
                      backgroundColor: item.color,
                      backgroundImage: `linear-gradient(to right, ${item.color}cc, ${item.color})` 
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* CUSTOMER HEALTH SUMMARY */}
      {customerStats && customerStats.total > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Shield size={18} className="text-blue-600" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Customer Health</h3>
              <p className="text-xs text-slate-400 font-medium">ภาพรวมสุขภาพลูกค้าจากระบบเกรด A-D</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { grade: 'A', label: 'VIP', color: 'bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-100 text-blue-700 hover:border-blue-200', dotColor: 'bg-blue-500' },
              { grade: 'B', label: 'เติบโต', color: 'bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-100 text-emerald-700 hover:border-emerald-200', dotColor: 'bg-emerald-500' },
              { grade: 'C', label: 'ทั่วไป', color: 'bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-100 text-amber-700 hover:border-amber-200', dotColor: 'bg-amber-500' },
              { grade: 'D', label: 'เฝ้าระวัง', color: 'bg-gradient-to-br from-rose-50 to-red-50/50 border-rose-100 text-rose-600 hover:border-rose-200', dotColor: 'bg-rose-500' },
            ].map((g, i) => (
              <motion.div key={g.grade} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
                onClick={() => navigate('/customers')}
                className={cn("p-4 rounded-2xl border cursor-pointer hover:shadow-md transition-all group", g.color)}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm animate-pulse", g.dotColor)} />
                  <span className="text-xs font-bold uppercase tracking-wider">เกรด {g.grade}</span>
                </div>
                <p className="text-3xl font-black tabular-nums leading-none group-hover:scale-105 transition-transform duration-300 origin-left">
                  {customerStats.gradeCount[g.grade] || 0}
                </p>
                <p className="text-xs font-semibold mt-1 opacity-70">{g.label}</p>
              </motion.div>
            ))}
          </div>
          {/* At-risk customers */}
          {customerStats.atRiskCustomers.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                <AlertCircle size={12} /> ลูกค้าที่ต้องดูแลเร่งด่วน
              </p>
              {customerStats.atRiskCustomers.map(c => (
                <button key={c.id} onClick={() => navigate('/customers')}
                  className="w-full text-left p-3.5 rounded-2xl bg-gradient-to-r from-rose-50/80 to-white border border-rose-100 hover:border-rose-200 hover:shadow-md transition-all flex items-center gap-3 group/item">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-500 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover/item:scale-105">
                    <AlertCircle size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate group-hover/item:text-rose-600 transition-colors">{c.company || c.name}</p>
                    <p className="text-xs text-rose-500 font-semibold">เกรด {c.grade} · {c.health?.inactiveDays != null ? `${c.health.inactiveDays} วันไม่มีกิจกรรม` : 'ไม่มีข้อมูลกิจกรรม'}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-700 tabular-nums shrink-0">{formatCurrency(c.dealStats?.wonValue || 0)}</span>
                  <ChevronRight size={14} className="text-slate-300 transition-transform group-hover/item:translate-x-0.5" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EXECUTIVE FORECAST STRIP */}
      <Card className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center">
            <Target size={18} className="text-violet-600" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Executive Forecast</h3>
            <p className="text-xs text-slate-400 font-medium">สรุปสถานะพยากรณ์ยอดขายประจำเดือน</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {[
            { label: 'คาดการณ์ถ่วงน้ำหนัก', value: stats?.intelligence?.forecastToGoalValue, detail: `${Math.round((stats?.intelligence?.weightedCoverageRatio || 0) * 100)}% ของเป้าหมาย`, icon: Target, tone: 'text-violet-600 bg-violet-50' },
            { label: '30 วันข้างหน้า', value: stats?.intelligence?.next30DayWeightedValue, detail: `${stats?.intelligence?.closingSoonDeals?.length || 0} ดีลใกล้ปิด`, icon: CalendarClock, tone: 'text-blue-600 bg-blue-50' },
            { label: 'ดีลเสี่ยงหลุด', value: stats?.intelligence?.atRiskValue, detail: `${stats?.intelligence?.highImpactRisks?.length || 0} ดีลต้องช่วยด่วน`, icon: AlertCircle, tone: 'text-rose-600 bg-rose-50' },
            { label: 'มูลค่ามั่นใจสูง', value: stats?.intelligence?.commitValue, detail: `เฉลี่ย ${stats?.intelligence?.averageInactiveDays || 0} วันไม่มีกิจกรรม`, icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-50' },
          ].map((item, i) => (
            <div key={item.label} className={cn("flex items-center gap-3 min-w-0 transition-all duration-300 hover:translate-x-1", i > 0 && "pt-4 md:pt-0 md:pl-4")}>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 hover:scale-105', item.tone)}>
                <item.icon size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{item.label}</p>
                <p className="text-xl font-black text-slate-900 tabular-nums truncate mt-1">
                  <AnimatedNumber value={item.value || 0} formatter={v => formatCurrency(v)} />
                </p>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* FORECAST SCENARIOS */}
      <Card className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-center gap-2 mb-5">
          <Target size={14} className="text-violet-600" />
          <h3 className="text-sm font-bold text-slate-800">Forecast Scenarios — เดือนนี้</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Worst Case', sub: 'ดีล ≥90% prob', value: (stats?.worstCaseValue || 0) + (stats?.totalWonValue || 0), color: 'text-rose-600', bg: 'bg-gradient-to-br from-rose-500/5 to-rose-500/10 border-rose-100', barBg: 'bg-rose-500' },
            { label: 'Commit', sub: 'ดีล ≥70% prob (weighted)', value: (stats?.commitValue || 0) + (stats?.totalWonValue || 0), color: 'text-amber-600', bg: 'bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-100', barBg: 'bg-amber-500' },
            { label: 'Best Case', sub: 'ปิดได้ทุกดีล active', value: (stats?.bestCaseValue || 0) + (stats?.totalWonValue || 0), color: 'text-emerald-600', bg: 'bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-100', barBg: 'bg-emerald-50' },
          ].map(s => {
            const pct = monthlyGoal > 0 ? Math.round((s.value / monthlyGoal) * 100) : 0;
            return (
              <div key={s.label} className={`p-4 rounded-2xl border ${s.bg} text-center space-y-1 relative overflow-hidden group/scenario transition-all hover:shadow-md cursor-pointer`}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{s.label}</p>
                <p className="text-[10px] text-slate-400 font-semibold">{s.sub}</p>
                <p className={`text-xl font-black tabular-nums mt-1 ${s.color}`}>{formatCurrency(s.value)}</p>
                <p className="text-xs text-slate-400 font-semibold">{pct}% ของเป้าหมาย</p>
                <div className="mt-2.5 h-1.5 bg-slate-200/50 rounded-full overflow-hidden w-3/4 mx-auto">
                  <div className={`h-full rounded-full ${s.barBg === 'bg-emerald-55' ? 'bg-emerald-500' : s.barBg} opacity-60`} style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* HOT DEALS */}
      {stats?.hotDeals && stats.hotDeals.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center">
              <Flame size={18} className="text-rose-500" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Hot Deals</h3>
              <p className="text-xs text-slate-400 font-medium">มูลค่าสูงสุด × โอกาสปิด</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.hotDeals.map((d, i) => (
              <motion.button key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => openDeal(d)}
                className={cn(
                  'text-left p-5 rounded-3xl shadow-sm hover:shadow-lg transition-all group duration-300 relative overflow-hidden border', 
                  i === 0 
                    ? 'bg-gradient-to-br from-amber-50/80 via-yellow-50/40 to-white border-amber-200 shadow-amber-500/5 hover:border-amber-300' 
                    : 'bg-white border-slate-100 hover:border-violet-200'
                )}>
                {i === 0 && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-400/10 to-transparent rounded-full blur-xl pointer-events-none" />
                )}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 truncate group-hover:text-violet-700 transition-colors">{d.title}</p>
                    <p className="text-xs text-slate-400 font-semibold truncate mt-0.5">{d.company}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {d.closingSoon && <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 tracking-tight uppercase shadow-sm">ใกล้ปิด</span>}
                    <div className={cn("px-2 py-0.5 rounded-md text-[10px] font-black shadow-sm",
                      d.healthScore >= 70 ? "bg-emerald-100 text-emerald-700" :
                      d.healthScore >= 45 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                    )}>
                      {d.healthScore || 0}HP
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-slate-100/60">
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">มูลค่า</p>
                    <p className="text-sm font-black text-slate-800 tabular-nums mt-0.5">{formatCurrency(Number(d.value))}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">โอกาส</p>
                    <p className={cn("text-sm font-black tabular-nums mt-0.5", Number(d.probability) >= 70 ? "text-emerald-600" : "text-amber-600")}>{d.probability}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Expected</p>
                    <p className="text-sm font-black text-violet-600 tabular-nums mt-0.5">{formatCurrency(d.score)}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* TASKS + CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Today's Action Plan */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center">
              <Target size={18} className="text-violet-600" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">วันนี้ต้องทำ</h3>
              <p className="text-xs text-slate-400 font-medium">งานและนัดหมายที่ต้องจัดการ</p>
            </div>
          </div>

          {stats?.intelligence?.executiveActions?.length === 0 &&
            actionPlan.followUps.length === 0 &&
            actionPlan.closingThisWeek.length === 0 &&
            actionPlan.stale.length === 0 && (
            <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100 text-center shadow-sm">
              <CheckCircle2 size={28} className="text-emerald-400 mx-auto mb-2 animate-bounce" />
              <p className="text-sm font-bold text-emerald-700">ทุกอย่างเรียบร้อยดี!</p>
              <p className="text-xs text-emerald-500 mt-1 font-semibold">ไม่มีงานค้างหรือดีลที่ต้องติดตามเร่งด่วน</p>
            </div>
          )}

          {stats?.intelligence?.executiveActions?.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">งานเร่งด่วน</p>
                <span className="text-xs text-slate-400 font-bold">{stats.intelligence.executiveActions.length}</span>
              </div>
              {stats.intelligence.executiveActions.slice(0, 3).map((action) => (
                <button key={action.id} onClick={() => navigate('/pipeline')}
                  className={cn('w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 hover:shadow-md group/action',
                    action.priority === 'critical' ? 'bg-rose-50/70 border-rose-100 hover:border-rose-200' :
                    action.priority === 'high' ? 'bg-violet-50/70 border-violet-100 hover:border-violet-200' : 'bg-slate-50/70 border-slate-100 hover:border-slate-200')}>
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover/action:scale-105',
                    action.priority === 'critical' ? 'bg-rose-100 text-rose-600 shadow-sm shadow-rose-500/20' :
                    action.priority === 'high' ? 'bg-violet-100 text-violet-600 shadow-sm shadow-violet-500/20' : 'bg-slate-100 text-slate-600 shadow-sm')}>
                    <AlertCircle size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-800 truncate group-hover/action:text-violet-700 transition-colors">{action.title}</p>
                      <span className="text-xs font-black text-slate-700 tabular-nums shrink-0">{formatCurrency(action.impactValue)}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{action.description}</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 mt-1 transition-transform group-hover/action:translate-x-0.5" />
                </button>
              ))}
            </div>
          )}

          {/* My Agenda (Follow-ups) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">My Agenda</p>
              <span className="text-xs text-slate-400 font-bold">{actionPlan.followUps.length}</span>
            </div>
            {actionPlan.followUps.length === 0 ? (
              <div className="p-4 rounded-2xl bg-white border border-slate-100 text-center shadow-sm">
                <CheckCircle2 size={18} className="text-emerald-400 mx-auto mb-1 animate-pulse" />
                <p className="text-xs text-slate-400 font-semibold">ไม่มีงานค้าง หรือสิ่งที่ต้องติดตาม</p>
              </div>
            ) : actionPlan.followUps.slice(0, 4).map((a, i) => {
              const isCompleting = updateActivityMutation.isPending && updateActivityMutation.variables?.id === a.id;
              return (
              <motion.div key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className={cn('w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 hover:shadow-md group/follow',
                  a.overdue ? 'bg-rose-50/70 border-rose-100 hover:border-rose-200' : 'bg-amber-50/70 border-amber-100 hover:border-amber-200',
                  isCompleting && 'opacity-50 pointer-events-none scale-95')}
              >
                <div 
                  onClick={(e) => handleCompleteTask(e, a.id)}
                  className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover/follow:scale-105 cursor-pointer hover:bg-emerald-500 hover:text-white',
                  a.overdue ? 'bg-rose-100 text-rose-500 shadow-sm hover:shadow-emerald-500/30' : 'bg-amber-100 text-amber-600 shadow-sm shadow-amber-500/10 hover:shadow-emerald-500/30',
                  isCompleting && 'bg-emerald-500 text-white')}
                  title="Mark as complete"
                >
                  {isCompleting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                </div>
                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => openDeal(a.deal)}>
                  <div className="flex items-center gap-2">
                    {a.overdue && !isCompleting && <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-700 shadow-sm animate-pulse">เกินกำหนด</span>}
                    <span className={cn("text-[10px] text-slate-500 font-bold uppercase tracking-wider", isCompleting && "line-through")}>{a.deal?.company || a.deal?.title}</span>
                  </div>
                  <p className={cn("text-sm font-bold text-slate-800 truncate mt-0.5 group-hover/follow:text-violet-700 transition-colors", isCompleting && "line-through text-slate-400")}>{a.title}</p>
                </div>
                <button onClick={() => openDeal(a.deal)} className="p-1 rounded-full hover:bg-slate-100 transition-colors">
                  <ChevronRight size={14} className="text-slate-300 mt-1 transition-transform group-hover/follow:translate-x-0.5" />
                </button>
              </motion.div>
              );
            })}
          </div>

          {/* Closing this week */}
          {actionPlan.closingThisWeek.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-violet-700 uppercase tracking-wider">คาดว่าจะปิดสัปดาห์นี้</p>
                <span className="text-xs text-slate-400 font-bold">{actionPlan.closingThisWeek.length}</span>
              </div>
              {actionPlan.closingThisWeek.slice(0, 3).map((d) => (
                <button key={d.id} onClick={() => openDeal(d)}
                  className="w-full text-left p-3.5 rounded-2xl bg-violet-50/70 border border-violet-100 hover:border-violet-200 hover:shadow-md transition-all flex items-center gap-3 group/close">
                  <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0 shadow-sm group-hover/close:scale-105 transition-transform duration-300">
                    <Briefcase size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 truncate group-hover/close:text-violet-700 transition-colors">{d.title}</p>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">{formatCurrency(d.value)} • {d.probability}% โอกาส</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 transition-transform group-hover/close:translate-x-0.5" />
                </button>
              ))}
            </div>
          )}

          {/* Stale */}
          {actionPlan.stale.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">หยุดนิ่ง 3+ วัน</p>
                <span className="text-xs text-slate-400 font-bold">{actionPlan.stale.length}</span>
              </div>
              {actionPlan.stale.slice(0, 3).map((d) => {
                const days = daysSince(d.last_activity || d.created_at);
                return (
                  <button key={d.id} onClick={() => openDeal(d)}
                    className="w-full text-left p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100 hover:border-rose-200 hover:shadow-md transition-all flex items-center gap-3 group/stale">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-500 flex items-center justify-center shrink-0 shadow-sm group-hover/stale:scale-105 transition-transform duration-300">
                      <Clock size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 truncate group-hover/stale:text-rose-600 transition-colors">{d.company || d.title}</p>
                      <p className="text-xs text-rose-500 font-black mt-0.5">{days} วันไม่มีกิจกรรม</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 transition-transform group-hover/stale:translate-x-0.5" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Revenue Chart */}
        <Card className="lg:col-span-2 p-7 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">ยอดขาย 6 เดือนล่าสุด</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">ยอดขายจริง เทียบกับคาดการณ์</p>
            </div>
            <div className="flex items-center gap-5 bg-slate-50/80 px-4 py-2 rounded-2xl border border-slate-100 shadow-inner">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-sm shadow-violet-500/50" />
                <span className="text-xs text-slate-500 font-bold">จริง</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="text-xs text-slate-500 font-bold">คาดการณ์</span>
              </div>
            </div>
          </div>
          <div className="h-[320px] w-full min-w-0 min-h-0">
            <SafeResponsiveContainer>
              <AreaChart data={stats?.revenueStream}>
                <defs>
                  <filter id="glowCmd" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <linearGradient id="colorActualCmd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorForecastCmd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: '700' }} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: '700' }} tickFormatter={(v) => `${v / 1000000}M`} dx={-10} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }} />
                <Area type="monotone" dataKey="actual" name="ยอดขายจริง" stroke="#7c3aed" strokeWidth={3} fill="url(#colorActualCmd)" filter="url(#glowCmd)" isAnimationActive={false} />
                <Area type="monotone" dataKey="forecast" name="คาดการณ์" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" fill="url(#colorForecastCmd)" isAnimationActive={false} />
              </AreaChart>
            </SafeResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ACTIVITY FEED */}
      {todayActivities.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Activity size={18} className="text-slate-600" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">กิจกรรมล่าสุด</h3>
              <p className="text-xs text-slate-400 font-medium">ไทม์ไลน์กิจกรรมของทีม</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todayActivities.map((a) => {
              const cfg = ACTIVITY_ICON[a.type] || ACTIVITY_ICON.note;
              const { Icon, color } = cfg;
              return (
                <div key={a.id} className="relative group">
                  <button onClick={() => a.deal && openDeal(a.deal)}
                    className={cn(
                      "w-full text-left p-4 rounded-2xl bg-white border border-slate-100 hover:border-violet-100 shadow-sm hover:shadow-md transition-all flex items-start gap-3.5 relative z-10 group/item",
                      a.type === 'call' && 'border-l-4 border-l-blue-500',
                      a.type === 'email' && 'border-l-4 border-l-violet-500',
                      a.type === 'meeting' && 'border-l-4 border-l-amber-500',
                      a.type === 'whatsapp' && 'border-l-4 border-l-emerald-500',
                      !['call', 'email', 'meeting', 'whatsapp'].includes(a.type) && 'border-l-4 border-l-slate-400'
                    )}>
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover/item:scale-105 shadow-sm', color)}>
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-slate-800 truncate group-hover/item:text-violet-700 transition-colors">{a.title || a.type}</p>
                        <span className="text-[10px] text-slate-400 shrink-0 font-semibold">{a.timeLabel}</span>
                      </div>
                      {a.deal && <p className="text-xs text-slate-500 font-semibold truncate mt-1">{a.deal.company || a.deal.title}</p>}
                      {a.notes && <p className="text-xs text-slate-400 line-clamp-1 mt-1 font-medium">{a.notes}</p>}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TEAM LEADERBOARD */}
      {teamLeaderboard.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
              <Trophy size={18} className="text-amber-600" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Team Leaderboard</h3>
              <p className="text-xs text-slate-400 font-medium">ผลงานเดือนนี้</p>
            </div>
          </div>

          {/* Team total */}
          {(() => {
            const totalGoal = teamMembers.reduce((s, m) => s + (m.goal || 2500000), 0);
            const teamWon = stats?.totalWonValue || 0;
            const teamPercent = totalGoal > 0 ? Math.round((teamWon / totalGoal) * 100) : 0;
            const wonCount = teamLeaderboard.reduce((s, m) => s + m.wonThisMonthCount, 0);
            return (
              <Card className="p-6 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 shadow-2xl text-white relative overflow-hidden group/team-total">
                <div className="absolute -right-16 -bottom-16 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover/team-total:bg-indigo-500/15 group-hover/team-total:scale-110 transition-all duration-700" />
                <div className="absolute -left-16 -top-16 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none group-hover/team-total:bg-violet-500/15 group-hover/team-total:scale-110 transition-all duration-700" />
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none text-white group-hover/team-total:rotate-6 transition-transform duration-700">
                  <Trophy size={120} />
                </div>
                <div className="relative z-10 flex items-center justify-between mb-4">
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-none">ยอดรวมทีม (เดือนนี้)</p>
                    <p className="text-3xl font-black text-white tabular-nums mt-2 tracking-tight bg-clip-text bg-gradient-to-r from-white via-white to-slate-200">
                      <AnimatedNumber value={teamWon} formatter={v => formatFullCurrency(v)} />
                    </p>
                    <p className="text-slate-400 text-xs mt-2.5 font-semibold">เป้าหมายรวม {formatCurrency(totalGoal)} · {wonCount} ดีลปิดแล้ว</p>
                  </div>
                  <p className="text-5xl font-black text-white/10 tabular-nums select-none">{teamPercent}%</p>
                </div>
                <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden relative z-10 border border-white/5 shadow-inner">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, teamPercent)}%` }}
                    transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }} 
                    className="h-full bg-gradient-to-r from-violet-400 via-indigo-400 to-fuchsia-400 rounded-full shadow-lg shadow-violet-500/30" />
                </div>
              </Card>
            );
          })()}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {teamLeaderboard.map((m, i) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className={cn("p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all relative overflow-hidden group/board duration-300",
                  i === 0 
                    ? "bg-gradient-to-br from-amber-500/5 via-yellow-500/5 to-white border-amber-300/60 shadow-amber-500/5 hover:border-amber-400 hover:shadow-amber-500/10" 
                    : "bg-white border-slate-100 hover:border-violet-200 hover:shadow-violet-500/5")}>
                {i === 0 && (
                  <div className="absolute top-3 right-3 flex items-center justify-center w-6 h-6 rounded-lg bg-amber-100 text-amber-600 shadow-sm border border-amber-200/50 animate-bounce">
                    <Crown size={12} className="fill-amber-400/20 text-amber-600" />
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    {i === 0 ? (
                      <div className="p-0.5 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-400 shadow-sm shadow-amber-500/10 transition-transform duration-300 group-hover/board:scale-105">
                        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-inner',
                          m.color?.split(' ')[0] || 'bg-violet-600')}>{m.name.charAt(0)}</div>
                      </div>
                    ) : (
                      <div className="p-0.5 rounded-xl bg-slate-100 transition-transform duration-300 group-hover/board:scale-105">
                        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-inner',
                          m.color?.split(' ')[0] || 'bg-violet-600')}>{m.name.charAt(0)}</div>
                      </div>
                    )}
                    <div className={cn("absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center shadow-md",
                      i === 0 ? "bg-amber-500 border border-amber-300" : "bg-slate-800 border border-slate-700"
                    )}>{i + 1}</div>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm leading-tight group-hover/board:text-violet-700 transition-colors flex items-center gap-1">
                      {m.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{m.role}</p>
                  </div>
                </div>

                {/* Mini circular gauge */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="relative w-14 h-14 shrink-0 transition-transform duration-300 group-hover/board:scale-105">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="22" stroke="#f8fafc" strokeWidth="5.5" fill="transparent" />
                      <defs>
                        <linearGradient id={`radialGold-${m.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#fbbf24" />
                          <stop offset="100%" stopColor="#f59e0b" />
                        </linearGradient>
                        <linearGradient id={`radialGreen-${m.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#34d399" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                        <linearGradient id={`radialRed-${m.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f87171" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>
                      <motion.circle cx="28" cy="28" r="22"
                        stroke={m.goalAchievement >= 100 ? `url(#radialGreen-${m.id})` : m.goalAchievement >= 70 ? `url(#radialGold-${m.id})` : `url(#radialRed-${m.id})`}
                        strokeWidth="5.5" fill="transparent"
                        strokeDasharray={2 * Math.PI * 22}
                        animate={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - Math.min(100, m.goalAchievement) / 100) }}
                        transition={{ duration: 1, delay: i * 0.1 }} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={cn("text-[10px] font-black tabular-nums",
                        m.goalAchievement >= 100 ? "text-emerald-600" : m.goalAchievement >= 70 ? "text-amber-600" : "text-rose-500"
                      )}>{m.goalAchievement}%</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ยอดเดือนนี้</p>
                    <p className="text-lg font-black text-slate-900 tabular-nums leading-tight truncate mt-0.5">{formatCurrency(m.wonThisMonthValue)}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">เป้า {formatCurrency(m.goal || 0)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-3 border-t border-slate-100/60 text-center">
                  <div>
                    <p className="text-sm font-black text-slate-800 tabular-nums">{m.wonThisMonthCount}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">ปิดได้</p>
                  </div>
                  <div>
                    <p className={cn("text-sm font-black tabular-nums", m.winRate >= 50 ? "text-emerald-600" : m.winRate >= 30 ? "text-amber-500" : "text-rose-500")}>{m.winRate}%</p>
                    <p className="text-[10px] text-slate-400 font-semibold">Win Rate</p>
                  </div>
                  <div>
                    <p className="text-sm font-black text-blue-600 tabular-nums">{m.activeCount}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">Active</p>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex gap-2 pt-3 mt-3 border-t border-slate-100/60">
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-[10px] font-bold" onClick={(e) => { e.stopPropagation(); window.location.href = `mailto:${m.email || 'team@novapipeline.com'}`; }}>
                    <Mail size={12} className="mr-1.5" /> Message
                  </Button>
                  <Button size="sm" className="flex-1 h-8 text-[10px] font-bold bg-violet-50 text-violet-700 hover:bg-violet-100 border-0" onClick={(e) => { e.stopPropagation(); navigate('/pipeline'); }}>
                    <BarChart3 size={12} className="mr-1.5" /> Review
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <QuickWinModal open={isQuickWinOpen} onOpenChange={setIsQuickWinOpen} />
    </div>
  );
}
