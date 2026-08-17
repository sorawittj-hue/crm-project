import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeals } from '../hooks/useDeals';
import { useTeam } from '../hooks/useTeam';
import { useActivities, useUpdateActivity } from '../hooks/useActivities';
import { useCustomers } from '../hooks/useCustomers';
import { useSubscription } from '../hooks/useSubscription';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from '../hooks/useAuth';
import { useMyProfile } from '../hooks/useUserProfiles';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { formatCurrency, daysSince } from '../lib/formatters';
import { buildCustomerHealth } from '../utils/customerIntelligence';
import CustomTooltip from '../components/ui/CustomTooltip';
import SafeResponsiveContainer from '../components/charts/SafeResponsiveContainer';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { useCommandCenterStats } from '../hooks/useCommandCenterStats';
import FocusDealsCard from '../components/command-center/FocusDealsCard';
import QuickWinModal from '../components/pipeline/QuickWinModal';
import MetricTooltip from '../components/ui/MetricTooltip';
import PageHeader from '../components/layout/PageHeader';
import {
  Users, AlertCircle, LayoutDashboard,
  ArrowUpRight, ArrowDownRight, Briefcase,
  Target, Clock, CalendarClock, ChevronRight, CheckCircle2,
  Phone, Mail, FileText, MessageSquare, Activity, Trophy,
  Star, Flame, BarChart3, Sparkles, Shield, Zap,
  Wrench, ShieldCheck, Loader2, RefreshCw
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
  const { data: customers = [] } = useCustomers();
  const { setPendingOpenDeal, openPaywall } = useAppStore();
  const { shouldBlockBasic, isGuestAccount } = useSubscription();

  const [isQuickWinOpen, setIsQuickWinOpen] = useState(false);

  const hasPersonalTarget = myProfile?.personal_target > 0;
  const monthlyGoal = hasPersonalTarget ? myProfile.personal_target : 0;

  const [viewMode, setViewMode] = useState('team');
  const baseStats = useCommandCenterStats(deals, monthlyGoal, user?.id);
  const stats = viewMode === 'personal' && baseStats?.myStats ? baseStats.myStats : baseStats;

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
      
      {/* Dynamic atmospheric ambient glows */}
      <div className="ambient-glow-brand -top-20 left-1/4 w-96 h-96" />
      <div className="ambient-glow-cyan top-96 right-1/4 w-96 h-96" />

      {/* HEADER */}
      <PageHeader
        icon={LayoutDashboard}
        title={
          <div className="flex items-center gap-2 flex-wrap">
            <span>{getGreeting()},</span>
            <span className="gradient-text-brand font-black">{userName}</span>
          </div>
        }
        description={
          <span className="flex items-center gap-1.5 font-medium">
            <CalendarClock size={14} className="text-violet-500" /> {getDateString()}
          </span>
        }
        badge={
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-white/10 p-0.5 rounded-xl border border-slate-200/80 dark:border-white/10">
              <button
                onClick={() => setViewMode('team')}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-lg transition-all",
                  viewMode === 'team'
                    ? "bg-white dark:bg-violet-600 text-violet-700 dark:text-white shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                )}
              >
                ทีม
              </button>
              <button
                onClick={() => setViewMode('personal')}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-lg transition-all",
                  viewMode === 'personal'
                    ? "bg-white dark:bg-violet-600 text-violet-700 dark:text-white shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                )}
              >
                ของฉัน
              </button>
            </div>
          </div>
        }
        rightContent={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={() => shouldBlockBasic ? openPaywall(isGuestAccount ? 'default' : 'trial_ended') : setIsQuickWinOpen(true)}
              variant="emerald"
              size="sm"
            >
              <Zap size={14} className="mr-1.5" />
              บันทึกยอดด่วน
            </Button>
          </div>
        }
      >
        <div className="flex items-center gap-2 w-full overflow-x-auto pb-1">
          {[
            { label: 'Pipeline', icon: Briefcase, to: '/pipeline', primary: true },
            { label: 'ลูกค้า', icon: Users, to: '/customers' },
            { label: 'ยอดขาย', icon: TrendingUp, to: '/sales' },
            { label: 'Analytics', icon: BarChart3, to: '/analytics' },
            { label: 'เครื่องมือ', icon: Wrench, to: '/tools' },
          ].map(btn => (
            <Button
              key={btn.to}
              onClick={() => navigate(btn.to)}
              variant={btn.primary ? 'primary' : 'outline'}
              size="sm"
              className="shrink-0"
            >
              <btn.icon size={13} className="mr-1.5" />
              {btn.label}
            </Button>
          ))}
        </div>
      </PageHeader>

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
        <div className="lg:col-span-2 space-y-6">
          
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

        {/* RIGHT COLUMN: METRICS, GOALS, LEADERBOARD (1/3 width) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* GOAL radial progress */}
          <Card className="p-6 relative overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-700 to-slate-900 text-white border-0 shadow-lg dark:shadow-violet-950/40">
            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">เป้าหมายเดือนนี้</p>
                  <p className="text-[11px] text-white/90 mt-0.5 font-bold">
                    {stats?.hasPersonalTarget ? `เป้าหมายส่วนตัว ${formatCurrency(monthlyGoal)}` : 'ยังไม่ได้ตั้งเป้าหมายส่วนตัว'}
                  </p>
                </div>
                <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs',
                  Number(stats?.growthPercent) >= 0 ? 'bg-emerald-500/25 text-emerald-200' : 'bg-rose-500/25 text-rose-200'
                )}>
                  {Number(stats?.growthPercent) >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                  {stats?.growthPercent > 0 ? '+' : ''}{stats?.growthPercent}%
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* SVG Radial Gauge */}
                <div className="relative w-20 h-20 shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,0.15)" strokeWidth="7" fill="transparent" />
                    <motion.circle cx="40" cy="40" r="34"
                      stroke="#38bdf8"
                      strokeWidth="7" fill="transparent"
                      strokeDasharray={2 * Math.PI * 34}
                      animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - Math.min(100, stats?.achievementPercent || 0) / 100) }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-black text-white tabular-nums leading-none tracking-tight">
                      <AnimatedNumber value={stats?.achievementPercent || 0} />%
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">ยอดขายปัจจุบัน</p>
                  <p className="text-xl md:text-2xl font-black text-white tabular-nums tracking-tight leading-none mt-1 truncate">
                    {formatCurrency(stats?.totalWonValue || 0)}
                  </p>
                  <p className="text-[10px] font-bold text-white/70 mt-1.5">เป้า: {formatCurrency(monthlyGoal)}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* WEEKLY PULSE */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">ยอดสัปดาห์นี้ (Weekly Pulse)</p>
            {[
              { label: 'ดีลใหม่สัปดาห์นี้', value: stats?.newDealsThisWeek || 0, icon: Flame, iconBg: 'bg-violet-500', valueColor: 'text-slate-900 dark:text-white' },
              { label: 'ปิดได้สัปดาห์นี้', value: stats?.wonThisWeek || 0, icon: Trophy, iconBg: 'bg-emerald-500', valueColor: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'มูลค่าปิดสัปดาห์นี้', value: formatCurrency(stats?.wonThisWeekValue), icon: Star, iconBg: 'bg-cyan-500', valueColor: 'text-cyan-600 dark:text-cyan-400', isText: true },
            ].map((item) => (
              <motion.div key={item.label} whileHover={{ y: -2, scale: 1.01 }}>
                <Card className="p-3.5 flex items-center gap-3.5 cursor-pointer">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs text-white", item.iconBg)}>
                    <item.icon size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{item.label}</p>
                    <p className={cn("text-lg md:text-xl font-black tabular-nums leading-none mt-1", item.valueColor)}>
                      {item.isText ? item.value : <AnimatedNumber value={item.value} />}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* KPI CARDS */}
          <div id="kpi-ribbon" className="space-y-3">
            {[
              { title: 'Active Pipeline', value: stats?.totalPipelineValue, formatter: v => formatCurrency(v), sub: `${stats?.activeCount || 0} active deals`, icon: Briefcase, color: 'text-violet-500' },
              { title: 'Win Rate', value: stats?.winRate, formatter: v => `${Math.round(v)}%`, sub: 'สัดส่วนดีลสำเร็จทั้งหมด', icon: ShieldCheck, color: 'text-emerald-500' },
              { title: 'Avg Velocity', value: stats?.avgDaysToClose, formatter: v => `${Math.round(v)} วัน`, sub: 'ระยะเวลาเฉลี่ยถึงปิดดีล', icon: Zap, color: 'text-amber-500' },
            ].map((kpi) => (
              <Card key={kpi.title} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-slate-100 dark:bg-white/5">
                    <kpi.icon size={18} className={kpi.color} strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      <MetricTooltip label={kpi.title} />
                    </span>
                    <p className="text-xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight leading-none mt-1">
                      <AnimatedNumber value={kpi.value || 0} formatter={kpi.formatter} />
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* TEAM LEADERBOARD */}
          {teamLeaderboard.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Trophy size={16} className="text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xs md:text-sm font-bold text-slate-900 dark:text-white tracking-tight">Team Leaderboard</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">อันดับยอดขายทีมเดือนนี้</p>
                </div>
              </div>
              <div className="space-y-2">
                {teamLeaderboard.slice(0, 4).map((m, i) => {
                  const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                  const goalPct = Math.min(100, m.goalAchievement || 0);
                  return (
                    <div key={m.id} className="p-2.5 rounded-xl border border-slate-200/70 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="relative shrink-0">
                            <div className="w-7 h-7 rounded-full bg-violet-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                              {m.name.charAt(0)}
                            </div>
                            {medal && <span className="absolute -top-1.5 -right-1.5 text-xs">{medal}</span>}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate leading-none">{m.name}</h4>
                            <p className="text-[9px] text-slate-400 font-medium mt-0.5">{m.role}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">{formatCurrency(m.wonThisMonthValue)}</span>
                          <span className="text-[9px] text-slate-400 block font-bold">{m.goalAchievement}% Goal</span>
                        </div>
                      </div>
                      <div className="h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500"
                          style={{ width: `${goalPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

        </div>

      </div>

      <QuickWinModal open={isQuickWinOpen} onOpenChange={setIsQuickWinOpen} />
    </div>
  );
}
