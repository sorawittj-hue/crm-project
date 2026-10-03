import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeals } from '../hooks/useDeals';
import { useTeam } from '../hooks/useTeam';
import { useActivities, useUpdateActivity } from '../hooks/useActivities';
import { useSubscription } from '../hooks/useSubscription';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from '../hooks/useAuth';
import { useMyProfile } from '../hooks/useUserProfiles';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { formatCurrency, daysSince } from '../lib/formatters';
import CustomTooltip from '../components/ui/CustomTooltip';
import SafeResponsiveContainer from '../components/charts/SafeResponsiveContainer';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { useCommandCenterStats } from '../hooks/useCommandCenterStats';
import FocusDealsCard from '../components/command-center/FocusDealsCard';
import QuickWinModal from '../components/pipeline/QuickWinModal';
import KpiCard from '../components/ui/KpiCard';

import {
  Users, AlertCircle, LayoutDashboard,
  ArrowUpRight, ArrowDownRight, Briefcase,
  Target, Clock, CalendarClock, ChevronRight, CheckCircle2,
  Phone, Mail, FileText, MessageSquare, Activity, Trophy,
  Flame, BarChart3, Zap,
  Wrench, ShieldCheck, Loader2, TrendingUp
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip
} from 'recharts';

const ACTIVITY_ICON = {
  call: { Icon: Phone, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  email: { Icon: Mail, color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
  meeting: { Icon: Clock, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  note: { Icon: FileText, color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400' },
  task: { Icon: CalendarClock, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  whatsapp: { Icon: MessageSquare, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
};

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
  const { data: deals = [], isLoading: dealsLoading } = useDeals();
  const { data: teamMembers = [], isLoading: teamLoading } = useTeam();
  const { data: activities = [] } = useActivities();
  const updateActivityMutation = useUpdateActivity();
  const { setPendingOpenDeal, openPaywall } = useAppStore();
  const { shouldBlockBasic, isGuestAccount } = useSubscription();

  const [currentTime, setCurrentTime] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const [isQuickWinOpen, setIsQuickWinOpen] = useState(false);

  const [viewMode, setViewMode] = useState('team');
  const personalGoal = Number(myProfile?.personal_target) > 0 ? Number(myProfile.personal_target) : 0;
  const teamGoal = teamMembers.reduce((sum, member) => sum + Number(member.goal || 0), 0);
  const monthlyGoal = viewMode === 'personal' ? personalGoal : teamGoal;
  const baseStats = useCommandCenterStats(deals, teamGoal, user?.id, personalGoal);
  const stats = viewMode === 'personal' && baseStats?.myStats ? baseStats.myStats : baseStats;

  // Today's Action Plan
  const actionPlan = useMemo(() => {
    if (!deals) return { followUps: [], closingThisWeek: [], stale: [] };
    const now = currentTime;
    const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999);
    const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
    const dealMap = Object.fromEntries(deals.map(d => [d.id, d]));

    const followUps = activities
      .filter(a => a.scheduled_at && !a.completed_at && a.deal_id && dealMap[a.deal_id])
      .filter(a => new Date(a.scheduled_at).getTime() <= endOfToday.getTime())
      .map(a => ({
        ...a,
        deal: dealMap[a.deal_id],
        overdue: new Date(a.scheduled_at).getTime() < startOfToday.getTime(),
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
  }, [deals, activities, currentTime]);

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
    if (shouldBlockBasic) {
      openPaywall(isGuestAccount ? 'default' : 'trial_ended');
      return;
    }
    updateActivityMutation.mutate({
      id: activityId,
      updates: { completed_at: new Date().toISOString() }
    });
  };

  const isLoading = dealsLoading || teamLoading;
  const hasNoDeals = (deals || []).length === 0;
  const userName = myProfile?.full_name || user?.email?.split('@')[0] || '';

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
      <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
        <Loader2 className="animate-spin text-violet-600 dark:text-violet-400" size={24} />
      </div>
      <p className="text-xs font-semibold text-slate-400">กำลังโหลดข้อมูล...</p>
    </div>
  );

  return (
    <div className="relative max-w-[1600px] mx-auto space-y-6 pb-20">
      
      {/* HEADER */}
      <header className="relative isolate overflow-hidden rounded-[1.75rem] bg-[#111827] px-5 py-5 text-white shadow-sm sm:px-7 sm:py-6">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-violet-600/15 blur-3xl" />
        <div className="relative flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300">
                <LayoutDashboard size={13} /> Revenue command center
              </p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {getGreeting()}{userName ? `, ${userName}` : ''}
              </h1>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-300">
                <CalendarClock size={13} className="text-violet-300" /> {getDateString()}
                <span aria-hidden="true" className="mx-1 text-slate-600">·</span>
                <span>ภาพรวมผลการขายและงานที่ควรโฟกัส</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.06] p-1">
                {[
                  { id: 'team', label: 'ทีม' },
                  { id: 'personal', label: 'ของฉัน' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setViewMode(mode.id)}
                    aria-pressed={viewMode === mode.id}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                      viewMode === mode.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'
                    )}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
              <Button
                onClick={() => shouldBlockBasic ? openPaywall(isGuestAccount ? 'default' : 'trial_ended') : setIsQuickWinOpen(true)}
                variant="primary"
                size="sm"
                className="border border-white/10 bg-violet-500 text-white hover:bg-violet-400"
              >
                <Zap size={14} className="mr-1.5" /> บันทึกยอดด่วน
              </Button>
            </div>
          </div>

          <nav aria-label="ทางลัด" className="flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-3">
            {[
              { label: 'Pipeline', icon: Briefcase, to: '/pipeline', primary: true },
              { label: 'ลูกค้า', icon: Users, to: '/customers' },
              { label: 'ยอดขาย', icon: TrendingUp, to: '/sales' },
              { label: 'Analytics', icon: BarChart3, to: '/analytics' },
              { label: 'เครื่องมือ', icon: Wrench, to: '/tools' },
            ].map((link) => (
              <button
                key={link.to}
                type="button"
                onClick={() => navigate(link.to)}
                className={cn(
                  'inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-medium transition-colors',
                  link.primary ? 'bg-white text-slate-900' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                )}
              >
                <link.icon size={14} /> {link.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ONBOARDING CTA */}
      {hasNoDeals && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 gap-3 md:grid-cols-3"
        >
          {[
            { title: 'เพิ่มดีลแรก', detail: 'สร้าง pipeline ให้ dashboard เริ่มวิเคราะห์ทันที', icon: Briefcase, action: () => navigate('/pipeline'), tone: 'bg-violet-600 text-white' },
            { title: 'เพิ่มลูกค้า', detail: 'ผูกดีลกับบัญชีลูกค้าเพื่อเห็นมูลค่ารวม', icon: Users, action: () => navigate('/customers'), tone: 'bg-white dark:bg-white/5 text-slate-800 dark:text-white border-slate-200 dark:border-white/10' },
            { title: 'ตั้งเป้าหมาย', detail: 'กำหนด target เพื่อให้ forecast มีบริบท', icon: Target, action: () => navigate('/settings'), tone: 'bg-white dark:bg-white/5 text-slate-800 dark:text-white border-slate-200 dark:border-white/10' },
          ].map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={item.action}
              className={cn('group rounded-2xl border p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer', item.tone)}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', item.tone.includes('violet') ? 'bg-white/15 text-white' : 'bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400')}>
                  <item.icon size={18} />
                </div>
                <ChevronRight size={16} className={cn('transition-transform group-hover:translate-x-0.5', item.tone.includes('violet') ? 'text-white/70' : 'text-slate-400')} />
              </div>
              <p className="text-sm font-bold">{item.title}</p>
              <p className={cn('mt-1 text-xs leading-5', item.tone.includes('violet') ? 'text-violet-100' : 'text-slate-500 dark:text-slate-400')}>{item.detail}</p>
            </button>
          ))}
        </motion.section>
      )}

      {/* TWO-COLUMN GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: ACTION & DATA VISUALS (2/3 width) */}
        <div className="order-2 space-y-6 lg:order-2 lg:col-span-3">
          
          <FocusDealsCard focusDeals={stats?.focusDeals} onOpenDeal={openDeal} />

          {/* TODAY'S FOCUS / ACTIONS */}
          <div id="ai-insights-card" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                <Target size={18} className="text-violet-600 dark:text-violet-400" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white tracking-tight">วันนี้ต้องทำ</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">งานและดีลเร่งด่วนที่ต้องจัดการเพื่อดันยอดปิด</p>
              </div>
            </div>

            {stats?.intelligence?.executiveActions?.length === 0 &&
              actionPlan.followUps.length === 0 &&
              actionPlan.closingThisWeek.length === 0 &&
              actionPlan.stale.length === 0 && (
              <Card className="p-6 text-center border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20">
                <CheckCircle2 size={28} className="text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">ทุกอย่างเรียบร้อยดี!</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">ไม่มีงานค้างหรือดีลที่ต้องติดตามเร่งด่วน</p>
              </Card>
            )}

            {stats?.intelligence?.executiveActions?.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">งานเร่งด่วน</p>
                  <span className="text-xs text-slate-400 font-bold">{stats.intelligence.executiveActions.length}</span>
                </div>
                {stats.intelligence.executiveActions.slice(0, 3).map((action) => (
                  <button
                    key={action.id}
                    onClick={() => navigate('/pipeline')}
                    className={cn(
                      'w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 hover:shadow-md group/action cursor-pointer',
                      action.priority === 'critical'
                        ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 hover:border-rose-300'
                        : 'bg-violet-50/70 dark:bg-violet-950/30 border-violet-200 dark:border-violet-900/40 hover:border-violet-300'
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs',
                      action.priority === 'critical' ? 'bg-rose-500 text-white' : 'bg-violet-600 text-white'
                    )}>
                      <AlertCircle size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-white truncate group-hover/action:text-violet-600 dark:group-hover/action:text-violet-400 transition-colors">
                          {action.title}
                        </p>
                        <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums shrink-0">{formatCurrency(action.impactValue)}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed font-medium">{action.description}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-400 mt-1 transition-transform group-hover/action:translate-x-0.5" />
                  </button>
                ))}
              </div>
            )}

            {/* My Agenda (Follow-ups) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">My Agenda (งานติดตามลูกค้า)</p>
                <span className="text-xs text-slate-400 font-bold">{actionPlan.followUps.length}</span>
              </div>
              {actionPlan.followUps.length === 0 ? (
                <Card className="p-4 text-center">
                  <CheckCircle2 size={18} className="text-emerald-500 mx-auto mb-1" />
                  <p className="text-xs text-slate-400 font-medium">ไม่มีงานค้าง หรือสิ่งที่ต้องติดตาม</p>
                </Card>
              ) : actionPlan.followUps.slice(0, 4).map((a, i) => {
                const isCompleting = updateActivityMutation.isPending && updateActivityMutation.variables?.id === a.id;
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      'w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 hover:shadow-md group/follow',
                      a.overdue
                        ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 hover:border-rose-300'
                        : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 hover:border-amber-300',
                      isCompleting && 'opacity-50 pointer-events-none scale-95'
                    )}
                  >
                    <div 
                      onClick={(e) => handleCompleteTask(e, a.id)}
                      className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover/follow:scale-105 cursor-pointer',
                        a.overdue ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300' : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300'
                      )}
                      title="ทำเครื่องหมายว่าเสร็จแล้ว"
                    >
                      {isCompleting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                    </div>
                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => openDeal(a.deal)}>
                      <div className="flex items-center gap-2">
                        {a.overdue && !isCompleting && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300">
                            เกินกำหนด
                          </span>
                        )}
                        <span className={cn("text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider", isCompleting && "line-through")}>
                          {a.deal?.company || a.deal?.title}
                        </span>
                      </div>
                      <p className={cn("text-xs md:text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5 group-hover/follow:text-violet-600 transition-colors", isCompleting && "line-through text-slate-400")}>
                        {a.title}
                      </p>
                    </div>
                    <button onClick={() => openDeal(a.deal)} className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white">
                      <ChevronRight size={14} />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* HOT DEALS */}
          {stats?.hotDeals && stats.hotDeals.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                  <Flame size={18} className="text-rose-500" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white tracking-tight">Hot Deals (ดีลเด่นเน้นปิด)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">มูลค่าสูงสุดคูณความน่าจะเป็นในการปิด</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.hotDeals.slice(0, 4).map((d, i) => (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => openDeal(d)}
                  >
                    <Card className="p-5 cursor-pointer group">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                            {d.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">{d.company}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {d.closingSoon && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/20 uppercase">
                              ใกล้ปิด
                            </span>
                          )}
                          <div className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold",
                            d.healthScore >= 70 ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" :
                            d.healthScore >= 45 ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                          )}>
                            {d.healthScore || 0}HP
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-slate-100 dark:border-white/5">
                        <div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">มูลค่า</p>
                          <p className="text-xs md:text-sm font-black text-slate-900 dark:text-white tabular-nums mt-0.5">{formatCurrency(Number(d.value))}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">โอกาส</p>
                          <p className={cn("text-xs md:text-sm font-black tabular-nums mt-0.5", Number(d.probability) >= 70 ? "text-emerald-500" : "text-amber-500")}>
                            {d.probability}%
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Expected</p>
                          <p className="text-xs md:text-sm font-black text-violet-600 dark:text-violet-400 tabular-nums mt-0.5">{formatCurrency(d.score)}</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* REVENUE STREAM CHART */}
          <Card className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white tracking-tight">ยอดขาย 6 เดือนล่าสุด</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">ยอดขายจริง เทียบกับคาดการณ์</p>
              </div>
              <div className="flex items-center gap-3 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-white/5">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-violet-500 shadow-xs" />
                  <span className="text-[10px] text-slate-600 dark:text-slate-300 font-bold">ยอดจริง</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                  <span className="text-[10px] text-slate-600 dark:text-slate-300 font-bold">คาดการณ์</span>
                </div>
              </div>
            </div>
            <div className="h-[280px] w-full min-w-0 min-h-0">
              <SafeResponsiveContainer>
                <AreaChart data={stats?.revenueStream}>
                  <defs>
                    <linearGradient id="colorActualCmd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorForecastCmd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: '700' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: '700' }} tickFormatter={(v) => `${v / 1000000}M`} dx={-10} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="actual" name="ยอดขายจริง" stroke="#7c3aed" strokeWidth={3} fill="url(#colorActualCmd)" isAnimationActive={false} />
                  <Area type="monotone" dataKey="forecast" name="คาดการณ์" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" fill="url(#colorForecastCmd)" isAnimationActive={false} />
                </AreaChart>
              </SafeResponsiveContainer>
            </div>
          </Card>

          {/* RECENT ACTIVITIES */}
          {todayActivities.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-500/10 flex items-center justify-center">
                  <Activity size={18} className="text-slate-600 dark:text-slate-300" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white tracking-tight">กิจกรรมล่าสุด</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">ไทม์ไลน์กิจกรรมของทีม</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {todayActivities.slice(0, 6).map((a) => {
                  const cfg = ACTIVITY_ICON[a.type] || ACTIVITY_ICON.note;
                  const { Icon, color } = cfg;
                  return (
                    <Card
                      key={a.id}
                      onClick={() => a.deal && openDeal(a.deal)}
                      className="p-4 cursor-pointer group flex items-start gap-3.5"
                    >
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs', color)}>
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                            {a.title || a.type}
                          </p>
                          <span className="text-[10px] text-slate-400 font-semibold">{a.timeLabel}</span>
                        </div>
                        {a.deal && <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">{a.deal.company || a.deal.title}</p>}
                        {a.notes && <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{a.notes}</p>}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: KPI CARDS 3.0, GOAL, LEADERBOARD */}
        <div className="order-1 space-y-4 lg:order-1 lg:col-span-3">

          {/* MONTHLY GOAL — primary business outcome */}
          <div className="relative overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-white via-violet-50/70 to-indigo-50/60 p-5 shadow-sm dark:border-violet-300/10 dark:from-[#111827] dark:via-[#151a2b] dark:to-[#17172b]">
            <div aria-hidden="true" className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-violet-300/15 blur-3xl dark:bg-violet-400/10" />
            <div className="relative z-10 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="flex items-start justify-between gap-4 sm:mb-0">
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">เป้าหมายเดือนนี้</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    {monthlyGoal > 0 ? `เป้า ${formatCurrency(monthlyGoal)}` : 'ยังไม่ได้ตั้งเป้าหมาย'}
                  </p>
                </div>
                {stats?.growthPercent !== null && stats?.growthPercent !== undefined && (
                  <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold',
                    stats.growthPercent >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                  )}>
                    {stats.growthPercent >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {stats.growthPercent > 0 ? '+' : ''}{stats.growthPercent}%
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                {/* Radial gauge */}
                <div className="relative w-[72px] h-[72px] shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" className="stroke-slate-200 dark:stroke-white/10" strokeWidth="7" fill="transparent" />
                    <motion.circle cx="40" cy="40" r="34"
                      stroke="url(#gaugeGrad)"
                      strokeWidth="7" fill="transparent"
                      strokeDasharray={2 * Math.PI * 34}
                      animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - Math.min(100, stats?.achievementPercent || 0) / 100) }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#38bdf8" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums leading-none">
                      {monthlyGoal > 0 ? <><AnimatedNumber value={stats?.achievementPercent || 0} />%</> : '—'}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">ยอดขายปัจจุบัน</p>
                  <p className="number-display text-2xl font-semibold text-slate-950 dark:text-white mt-1 truncate">
                    {formatCurrency(stats?.totalWonValue || 0)}
                  </p>
                  {monthlyGoal > 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">เป้า {formatCurrency(monthlyGoal)}</p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate('/settings')}
                      className="mt-1 text-left text-xs font-semibold text-violet-700 hover:text-violet-900 dark:text-violet-300 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 rounded"
                    >
                      ตั้งเป้าหมายเพื่อดูความคืบหน้า <span aria-hidden="true">→</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* KPI CARDS 3.0 — 2-column grid */}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <KpiCard
              title="Active Pipeline"
              value={stats?.totalPipelineValue}
              formatter={formatCurrency}
              sub={`${stats?.activeCount || 0} ดีล`}
              color="violet"
              icon={Briefcase}
              sparkline={stats?.revenueStream?.map(r => r.forecast || 0)}
              trend={null}
            />
            <KpiCard
              title="Win Rate"
              value={stats?.winRate}
              formatter={v => `${Math.round(v)}%`}
              sub="สัดส่วนดีลสำเร็จ"
              color="emerald"
              icon={ShieldCheck}
              sparkline={undefined}
              trend={null}
            />
            <KpiCard
              title="Avg Velocity"
              value={stats?.avgDaysToClose}
              formatter={() => stats?.avgDaysToClose == null ? '—' : `${Math.round(stats.avgDaysToClose)} วัน`}
              sub={stats?.avgDaysToClose == null ? 'ยังไม่มีดีลที่ปิดแล้ว' : 'ระยะเวลาเฉลี่ย'}
              color="amber"
              icon={Zap}
              sparkline={undefined}
              trend={null}
            />
            <KpiCard
              title="Won This Week"
              value={stats?.wonThisWeekValue}
              formatter={formatCurrency}
              sub={`${stats?.wonThisWeek || 0} ดีล`}
              color="cyan"
              icon={Trophy}
              sparkline={stats?.revenueStream?.map(r => r.actual || 0)}
              trend={null}
            />
          </div>

          {/* TEAM LEADERBOARD */}
          {teamLeaderboard.length > 0 && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-white/80 dark:bg-[#0d0f1a] backdrop-blur-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Trophy size={14} className="text-amber-500 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Team Leaderboard</h3>
                  <p className="text-[10px] text-slate-500 dark:text-white/35 font-medium">อันดับยอดขายเดือนนี้</p>
                </div>
              </div>
              <div className="p-3 space-y-2">
                {teamLeaderboard.slice(0, 4).map((m, i) => {
                  const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                  const goalPct = Math.min(100, m.goalAchievement || 0);
                  const barColor = i === 0 ? 'from-amber-500 to-orange-400' : i === 1 ? 'from-slate-400 to-slate-300' : 'from-violet-600 to-indigo-500';
                  return (
                    <div key={m.id} className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05] hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="relative shrink-0">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                              {m.name.charAt(0)}
                            </div>
                            {medal && <span className="absolute -top-1.5 -right-1.5 text-xs">{medal}</span>}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate leading-none">{m.name}</h4>
                            <p className="text-[9px] text-slate-500 dark:text-white/30 font-medium mt-0.5">{m.role}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">{formatCurrency(m.wonThisMonthValue)}</span>
                          <span className="text-[9px] text-slate-500 dark:text-white/30 block font-medium">{m.goalAchievement}% Goal</span>
                        </div>
                      </div>
                      <div className="h-1 rounded-full bg-slate-200 dark:bg-white/[0.08] overflow-hidden">
                        <div className={cn("h-full rounded-full bg-gradient-to-r", barColor)} style={{ width: `${goalPct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>

      <QuickWinModal open={isQuickWinOpen} onOpenChange={setIsQuickWinOpen} />
    </div>
  );
}
