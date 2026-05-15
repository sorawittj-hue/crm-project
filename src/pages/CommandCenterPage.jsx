import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeals } from '../hooks/useDeals';
import { useTeam } from '../hooks/useTeam';
import { useSettings } from '../hooks/useSettings';
import { useActivities } from '../hooks/useActivities';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from '../hooks/useAuth';
import { useMyProfile } from '../hooks/useUserProfiles';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { formatCurrency, formatFullCurrency, daysSince } from '../lib/formatters';
import { buildPipelineIntelligence } from '../utils/salesIntelligence';
import CustomTooltip from '../components/ui/CustomTooltip';
import {
  TrendingUp,
  Users, AlertCircle,
  ArrowUpRight, Briefcase,
  Target, Clock, CalendarClock, ChevronRight, CheckCircle2,
  Phone, Mail, FileText, MessageSquare, Activity, Trophy,
  Star, Flame
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip
} from 'recharts';

const ACTIVITY_ICON = {
  call: { Icon: Phone, color: 'bg-blue-50 text-blue-500' },
  email: { Icon: Mail, color: 'bg-violet-50 text-violet-500' },
  meeting: { Icon: Clock, color: 'bg-amber-50 text-amber-600' },
  note: { Icon: FileText, color: 'bg-slate-50 text-slate-500' },
  task: { Icon: CalendarClock, color: 'bg-amber-50 text-amber-700' },
  whatsapp: { Icon: MessageSquare, color: 'bg-emerald-50 text-emerald-600' },
};

export default function CommandCenterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: myProfile } = useMyProfile(user?.id);
  const { data: deals, isLoading: dealsLoading } = useDeals();
  const { data: teamMembers, isLoading: teamLoading } = useTeam();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: activities = [] } = useActivities();
  const { setPendingOpenDeal } = useAppStore();

  const teamGoal = settings?.monthly_target || 10000000;
  // Personal target: use user's own if set, else fall back to team target
  const monthlyGoal = myProfile?.personal_target > 0 ? myProfile.personal_target : teamGoal;

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

    // New deals this week
    const weekAgo = now.getTime() - 7 * 86_400_000;
    const newDealsThisWeek = deals.filter(d => new Date(d.created_at).getTime() >= weekAgo).length;

    // Won deals this week
    const wonThisWeek = deals.filter(d => {
      if (d.stage !== 'won') return false;
      const dt = new Date(d.actual_close_date || d.updated_at || d.created_at);
      return dt.getTime() >= weekAgo;
    });
    const wonThisWeekValue = wonThisWeek.reduce((s, d) => s + Number(d.value || 0), 0);

    // Forecast scenarios
    const activeDealsArr = activePipeline;
    const commitValue = activeDealsArr
      .filter(d => Number(d.probability) >= 70)
      .reduce((s, d) => s + Number(d.value || 0) * (Number(d.probability) / 100), 0);
    const bestCaseValue = activeDealsArr
      .reduce((s, d) => s + Number(d.value || 0), 0);
    const worstCaseValue = activeDealsArr
      .filter(d => Number(d.probability) >= 90)
      .reduce((s, d) => s + Number(d.value || 0), 0);

    // Hot deals — high-value × probability, closing soon
    const now30 = now.getTime() + 30 * 86_400_000;
    const hotDeals = activeDealsArr
      .map(d => ({
        ...d,
        score: Number(d.value || 0) * (Number(d.probability || 0) / 100),
        closingSoon: d.expected_close_date && new Date(d.expected_close_date).getTime() <= now30,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

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
    };
  }, [deals, monthlyGoal]);

  // Today's Action Plan — pulls real data from activities + deals
  const actionPlan = useMemo(() => {
    if (!deals) return { followUps: [], closingThisWeek: [], stale: [] };
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999);
    const dealMap = Object.fromEntries(deals.map(d => [d.id, d]));

    // Pending follow-ups scheduled for today or overdue
    const followUps = activities
      .filter(a => a.scheduled_at && !a.completed_at && a.deal_id && dealMap[a.deal_id])
      .filter(a => new Date(a.scheduled_at).getTime() <= endOfToday.getTime())
      .map(a => ({
        ...a,
        deal: dealMap[a.deal_id],
        overdue: new Date(a.scheduled_at).getTime() < new Date().setHours(0, 0, 0, 0),
      }))
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));

    // Active deals expected to close within 7 days
    const sevenDays = now + 7 * 86_400_000;
    const closingThisWeek = deals
      .filter(d => !['won', 'lost'].includes(d.stage) && d.expected_close_date)
      .filter(d => {
        const t = new Date(d.expected_close_date).getTime();
        return t <= sevenDays;
      })
      .sort((a, b) => Number(b.value) - Number(a.value))
      .slice(0, 5);

    // Stale active deals
    const stale = deals
      .filter(d => !['won', 'lost'].includes(d.stage))
      .filter(d => daysSince(d.last_activity || d.created_at) >= 3)
      .sort((a, b) => Number(b.value) - Number(a.value))
      .slice(0, 5);

    return { followUps, closingThisWeek, stale };
  }, [deals, activities]);

  // Today's real activity feed
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

  // Team leaderboard — actual won this month per member
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

  const isLoading = dealsLoading || teamLoading || settingsLoading;
  const hasNoDeals = (deals || []).length === 0;

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
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/customers')}
            className="h-9 px-4 rounded-xl text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm">
            <Users size={14} className="mr-1.5" />
            ลูกค้า
          </Button>
          <Button onClick={() => navigate('/pipeline')}
            className="h-9 px-5 rounded-xl text-sm bg-violet-600 hover:bg-violet-700 text-white border-0 shadow-md shadow-violet-500/20">
            <ArrowUpRight size={14} className="mr-1.5" />
            ดูดีลทั้งหมด
          </Button>
        </div>
      </div>

      {hasNoDeals && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 gap-3 md:grid-cols-3"
        >
          {[
            {
              title: 'เพิ่มดีลแรก',
              detail: 'สร้าง pipeline ให้ dashboard เริ่มวิเคราะห์ทันที',
              icon: Briefcase,
              action: () => navigate('/pipeline'),
              tone: 'bg-violet-600 text-white shadow-violet-500/20',
            },
            {
              title: 'เพิ่มลูกค้า',
              detail: 'ผูกดีลกับบัญชีลูกค้าเพื่อเห็นมูลค่ารวม',
              icon: Users,
              action: () => navigate('/customers'),
              tone: 'bg-white text-slate-800 border-slate-100',
            },
            {
              title: 'ตั้งเป้าหมาย',
              detail: 'กำหนด target เพื่อให้ forecast มีบริบท',
              icon: Target,
              action: () => navigate('/settings'),
              tone: 'bg-white text-slate-800 border-slate-100',
            },
          ].map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={item.action}
              className={cn(
                'group rounded-2xl border p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
                item.tone
              )}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl',
                  item.tone.includes('violet') ? 'bg-white/15 text-white' : 'bg-violet-50 text-violet-600'
                )}>
                  <item.icon size={18} />
                </div>
                <ChevronRight size={16} className={cn('transition-transform group-hover:translate-x-0.5', item.tone.includes('violet') ? 'text-white/70' : 'text-slate-300')} />
              </div>
              <p className="text-sm font-bold">{item.title}</p>
              <p className={cn('mt-1 text-xs leading-5', item.tone.includes('violet') ? 'text-violet-100' : 'text-slate-500')}>
                {item.detail}
              </p>
            </button>
          ))}
        </motion.section>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Goal Card */}
        <Card className="p-6 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 text-white border-0 shadow-lg shadow-violet-500/20 lg:col-span-2 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-4 w-32 h-32 rounded-full bg-white/5" />
          <div className="relative z-10 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-violet-200 text-xs font-medium">เป้าหมายส่วนตัว</p>
                <p className="text-3xl font-bold text-white mt-1 tabular-nums">{formatFullCurrency(monthlyGoal)}</p>
                {myProfile?.personal_target > 0 && teamGoal !== monthlyGoal && (
                  <p className="text-violet-300 text-[11px] mt-1">ยอดทีม {formatCurrency(teamGoal)}</p>
                )}
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
              {stats?.urgentDeals?.length || 0}
              <span className="text-base text-slate-300 font-normal ml-1.5">ดีล</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">ไม่มีความเคลื่อนไหว 3+ วัน</p>
          </div>
        </Card>
      </div>

      {/* Weekly Pulse */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
            <Flame size={16} className="text-violet-600" />
          </div>
          <div>
            <p className="text-xs text-slate-400">ดีลใหม่สัปดาห์นี้</p>
            <p className="text-2xl font-black text-slate-900 tabular-nums leading-none">{stats?.newDealsThisWeek || 0}</p>
          </div>
        </Card>
        <Card className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Trophy size={16} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-slate-400">ปิดได้สัปดาห์นี้</p>
            <p className="text-2xl font-black text-emerald-600 tabular-nums leading-none">{stats?.wonThisWeek || 0}</p>
          </div>
        </Card>
        <Card className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Star size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-slate-400">มูลค่าปิดสัปดาห์นี้</p>
            <p className="text-xl font-black text-blue-600 tabular-nums leading-none">{formatCurrency(stats?.wonThisWeekValue)}</p>
          </div>
        </Card>
      </div>

      {/* Executive Forecast Strip */}
      <Card className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              label: 'คาดการณ์ถ่วงน้ำหนัก',
              value: formatCurrency(stats?.intelligence?.forecastToGoalValue),
              detail: `${Math.round((stats?.intelligence?.weightedCoverageRatio || 0) * 100)}% ของเป้าหมาย`,
              icon: Target,
              tone: 'text-violet-600 bg-violet-50',
            },
            {
              label: '30 วันข้างหน้า',
              value: formatCurrency(stats?.intelligence?.next30DayWeightedValue),
              detail: `${stats?.intelligence?.closingSoonDeals?.length || 0} ดีลใกล้ปิด`,
              icon: CalendarClock,
              tone: 'text-blue-600 bg-blue-50',
            },
            {
              label: 'ดีลเสี่ยงหลุด',
              value: formatCurrency(stats?.intelligence?.atRiskValue),
              detail: `${stats?.intelligence?.highImpactRisks?.length || 0} ดีลต้องช่วยด่วน`,
              icon: AlertCircle,
              tone: 'text-rose-600 bg-rose-50',
            },
            {
              label: 'มูลค่ามั่นใจสูง',
              value: formatCurrency(stats?.intelligence?.commitValue),
              detail: `เฉลี่ย ${stats?.intelligence?.averageInactiveDays || 0} วันไม่มีกิจกรรม`,
              icon: CheckCircle2,
              tone: 'text-emerald-600 bg-emerald-50',
            },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 min-w-0">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', item.tone)}>
                <item.icon size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-400">{item.label}</p>
                <p className="text-xl font-bold text-slate-900 tabular-nums truncate">{item.value}</p>
                <p className="text-xs text-slate-400">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Forecast Scenarios */}
      <Card className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Target size={14} className="text-violet-600" />
          <h3 className="text-sm font-semibold text-slate-800">Forecast Scenarios — เดือนนี้</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Worst Case', sub: 'ดีล ≥90% prob', value: (stats?.worstCaseValue || 0) + (stats?.totalWonValue || 0), color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
            { label: 'Commit', sub: 'ดีล ≥70% prob (weighted)', value: (stats?.commitValue || 0) + (stats?.totalWonValue || 0), color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
            { label: 'Best Case', sub: 'ปิดได้ทุกดีล active', value: (stats?.bestCaseValue || 0) + (stats?.totalWonValue || 0), color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          ].map(s => {
            const pct = monthlyGoal > 0 ? Math.round((s.value / monthlyGoal) * 100) : 0;
            return (
              <div key={s.label} className={`p-4 rounded-xl border ${s.bg} ${s.border} text-center space-y-1`}>
                <p className="text-xs font-semibold text-slate-600">{s.label}</p>
                <p className="text-[10px] text-slate-400">{s.sub}</p>
                <p className={`text-xl font-black tabular-nums ${s.color}`}>{formatCurrency(s.value)}</p>
                <p className="text-xs text-slate-400">{pct}% ของเป้าหมาย</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Hot Deals */}
      {stats?.hotDeals && stats.hotDeals.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
              <Flame size={14} className="text-rose-500" />
            </div>
            <h3 className="font-semibold text-slate-800">Hot Deals</h3>
            <span className="text-xs text-slate-400">— มูลค่าสูงสุด × โอกาสปิด</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.hotDeals.map((d, i) => (
              <motion.button
                key={d.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => openDeal(d)}
                className="text-left p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-violet-200 transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-violet-700 transition-colors">{d.title}</p>
                    <p className="text-xs text-slate-400 truncate">{d.company}</p>
                  </div>
                  {d.closingSoon && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 shrink-0">ใกล้ปิด</span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-slate-400">มูลค่า</p>
                    <p className="text-sm font-black text-slate-800 tabular-nums">{formatCurrency(Number(d.value))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">โอกาส</p>
                    <p className={cn("text-sm font-black tabular-nums", Number(d.probability) >= 70 ? "text-emerald-600" : "text-amber-600")}>{d.probability}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Expected</p>
                    <p className="text-sm font-black text-violet-600 tabular-nums">{formatCurrency(d.score)}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Tasks + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Today's Action Plan — real follow-ups + closing this week + stale */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
              <Target size={14} className="text-violet-600" />
            </div>
            <h3 className="font-semibold text-slate-800">วันนี้ต้องทำ</h3>
          </div>

          {stats?.intelligence?.executiveActions?.length === 0 &&
            actionPlan.followUps.length === 0 &&
            actionPlan.closingThisWeek.length === 0 &&
            actionPlan.stale.length === 0 && (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
              <CheckCircle2 size={28} className="text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-emerald-700">ทุกอย่างเรียบร้อยดี!</p>
              <p className="text-xs text-emerald-500 mt-1">ไม่มีงานค้างหรือดีลที่ต้องติดตามเร่งด่วน</p>
            </div>
          )}

          {stats?.intelligence?.executiveActions?.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">งานเร่งด่วน</p>
                <span className="text-xs text-slate-400">{stats.intelligence.executiveActions.length}</span>
              </div>
              {stats.intelligence.executiveActions.slice(0, 3).map((action) => (
                <button
                  key={action.id}
                  onClick={() => navigate('/pipeline')}
                  className={cn(
                    'w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3 hover:shadow-sm',
                    action.priority === 'critical'
                      ? 'bg-rose-50 border-rose-100'
                      : action.priority === 'high'
                      ? 'bg-violet-50 border-violet-100'
                      : 'bg-slate-50 border-slate-100'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                      action.priority === 'critical'
                        ? 'bg-rose-100 text-rose-600'
                        : action.priority === 'high'
                        ? 'bg-violet-100 text-violet-600'
                        : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    <AlertCircle size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800 truncate">{action.title}</p>
                      <span className="text-xs font-bold text-slate-500 tabular-nums shrink-0">
                        {formatCurrency(action.impactValue)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{action.description}</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 mt-1" />
                </button>
              ))}
            </div>
          )}

          {/* Today's Follow-ups */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">นัดติดตามถึงกำหนด</p>
              <span className="text-xs text-slate-400">{actionPlan.followUps.length}</span>
            </div>
            {actionPlan.followUps.length === 0 ? (
              <div className="p-4 rounded-2xl bg-white border border-slate-100 text-center">
                <CheckCircle2 size={18} className="text-emerald-400 mx-auto mb-1" />
                <p className="text-xs text-slate-400 font-medium">ไม่มีนัดวันนี้</p>
              </div>
            ) : actionPlan.followUps.slice(0, 4).map((a, i) => (
              <motion.button
                key={a.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => openDeal(a.deal)}
                className={cn(
                  'w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3 hover:shadow-sm',
                  a.overdue ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
                )}
              >
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                  a.overdue ? 'bg-rose-100 text-rose-500' : 'bg-amber-100 text-amber-600'
                )}>
                  <CalendarClock size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {a.overdue && (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">เลยกำหนด</span>
                    )}
                    <span className="text-[10px] text-slate-500 font-semibold">{a.deal?.company || a.deal?.title}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 truncate">{a.title}</p>
                </div>
                <ChevronRight size={14} className="text-slate-300 mt-1" />
              </motion.button>
            ))}
          </div>

          {/* Closing this week */}
          {actionPlan.closingThisWeek.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-violet-700 uppercase tracking-wider">คาดว่าจะปิดสัปดาห์นี้</p>
                <span className="text-xs text-slate-400">{actionPlan.closingThisWeek.length}</span>
              </div>
              {actionPlan.closingThisWeek.slice(0, 3).map((d) => (
                <button
                  key={d.id}
                  onClick={() => openDeal(d)}
                  className="w-full text-left p-3 rounded-2xl bg-violet-50 border border-violet-100 hover:shadow-sm transition-all flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                    <Briefcase size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{d.title}</p>
                    <p className="text-xs text-slate-500">{formatCurrency(d.value)} • {d.probability}%</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-300" />
                </button>
              ))}
            </div>
          )}

          {/* Stale */}
          {actionPlan.stale.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">หยุดนิ่ง 3+ วัน</p>
                <span className="text-xs text-slate-400">{actionPlan.stale.length}</span>
              </div>
              {actionPlan.stale.slice(0, 3).map((d) => {
                const days = daysSince(d.last_activity || d.created_at);
                return (
                  <button
                    key={d.id}
                    onClick={() => openDeal(d)}
                    className="w-full text-left p-3 rounded-2xl bg-rose-50 border border-rose-100 hover:shadow-sm transition-all flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-500 flex items-center justify-center shrink-0">
                      <Clock size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{d.company || d.title}</p>
                      <p className="text-xs text-rose-500 font-bold">{days} วันไม่มีกิจกรรม</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-300" />
                  </button>
                );
              })}
            </div>
          )}
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

          <div className="h-[280px] w-full min-w-0 min-h-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
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

      {/* Recent Activity Feed */}
      {todayActivities.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
              <Activity size={14} className="text-slate-600" />
            </div>
            <h3 className="font-semibold text-slate-800">กิจกรรมล่าสุด</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {todayActivities.map((a) => {
              const cfg = ACTIVITY_ICON[a.type] || ACTIVITY_ICON.note;
              const { Icon, color } = cfg;
              return (
                <button
                  key={a.id}
                  onClick={() => a.deal && openDeal(a.deal)}
                  className="text-left p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-start gap-3"
                >
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', color)}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800 truncate">{a.title || a.type}</p>
                      <span className="text-[10px] text-slate-400 shrink-0">{a.timeLabel}</span>
                    </div>
                    {a.deal && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">{a.deal.company || a.deal.title}</p>
                    )}
                    {a.notes && (
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{a.notes}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Team Leaderboard */}
      {teamLeaderboard.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
              <Trophy size={14} className="text-amber-500" />
            </div>
            <h3 className="font-semibold text-slate-800">Team Leaderboard</h3>
            <span className="text-xs text-slate-400">— ผลงานเดือนนี้</span>
          </div>

          {/* Team total */}
          {(() => {
            const totalGoal = teamMembers.reduce((s, m) => s + (m.goal || 2500000), 0);
            const teamWon = stats?.totalWonValue || 0;
            const teamPercent = totalGoal > 0 ? Math.round((teamWon / totalGoal) * 100) : 0;
            const wonCount = teamLeaderboard.reduce((s, m) => s + m.wonThisMonthCount, 0);
            return (
              <Card className="p-5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-0 shadow-lg text-white">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-slate-400 text-xs font-medium">ยอดรวมทีม (เดือนนี้)</p>
                    <p className="text-2xl font-bold text-white tabular-nums mt-0.5">{formatFullCurrency(teamWon)}</p>
                    <p className="text-slate-400 text-xs mt-0.5">เป้าหมายรวม {formatCurrency(totalGoal)} · {wonCount} ดีลปิดแล้ว</p>
                  </div>
                  <p className="text-5xl font-black text-white/15 tabular-nums">{teamPercent}%</p>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, teamPercent)}%` }}
                    transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
                    className="h-full bg-white rounded-full"
                  />
                </div>
              </Card>
            );
          })()}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {teamLeaderboard.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={cn(
                  "p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all relative overflow-hidden",
                  i === 0 ? "bg-gradient-to-br from-amber-50 to-white border-amber-200" : "bg-white border-slate-100"
                )}
              >
                {i === 0 && <span className="absolute top-3 right-3 text-lg">🏆</span>}
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm',
                      m.color?.split(' ')[0] || 'bg-violet-600')}>
                      {m.name.charAt(0)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-800 text-white text-[9px] font-black flex items-center justify-center">
                      {i + 1}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm leading-tight">{m.name}</h4>
                    <p className="text-xs text-slate-400">{m.role}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-slate-400">ยอดขายเดือนนี้</p>
                      <p className="text-lg font-black text-slate-900 tabular-nums leading-tight">{formatCurrency(m.wonThisMonthValue)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400">เป้า {formatCurrency(m.goal || 0)}</p>
                      <p className={cn("text-sm font-black",
                        m.goalAchievement >= 100 ? "text-emerald-600" :
                        m.goalAchievement >= 70 ? "text-amber-500" : "text-rose-500"
                      )}>{m.goalAchievement}%</p>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${m.goalAchievement}%` }}
                      transition={{ duration: 1, delay: i * 0.1, ease: [0.19, 1, 0.22, 1] }}
                      className={cn("h-full rounded-full",
                        m.goalAchievement >= 100 ? "bg-emerald-500" :
                        m.goalAchievement >= 70 ? "bg-amber-500" : "bg-rose-500"
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-3 border-t border-slate-100">
                  <div className="text-center">
                    <p className="text-sm font-black text-slate-800">{m.wonThisMonthCount}</p>
                    <p className="text-[9px] text-slate-400">ปิดได้</p>
                  </div>
                  <div className="text-center">
                    <p className={cn("text-sm font-black", m.winRate >= 50 ? "text-emerald-600" : m.winRate >= 30 ? "text-amber-500" : "text-rose-500")}>
                      {m.winRate}%
                    </p>
                    <p className="text-[9px] text-slate-400">Win Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-blue-600">{m.activeCount}</p>
                    <p className="text-[9px] text-slate-400">Active</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
