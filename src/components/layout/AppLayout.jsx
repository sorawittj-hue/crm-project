import { useState, useEffect, useMemo, useRef, Suspense, useCallback } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  LayoutDashboard, ListTree, Users, BarChart3,
  Menu, X, Wrench, Loader2,
  Search, Settings, Bell,
  ChevronRight, Target, TrendingUp,
  AlertCircle, Clock, CheckCircle2, CalendarClock, Briefcase,
  BarChart2, Trash2, CheckCheck, Plus, Lock,
  Timer, Zap, Sun, Moon,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useDeals } from '../../hooks/useDeals';
import { useCustomers } from '../../hooks/useCustomers';
import { useSettings } from '../../hooks/useSettings';
import { useActivities } from '../../hooks/useActivities';
import { useAuth } from '../../hooks/useAuth';
import { useMyProfile } from '../../hooks/useUserProfiles';
import { useSubscription } from '../../hooks/useSubscription';
import PageTransition from '../ui/PageTransition';
import {
  useNotifications,
  useProactiveEngine,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDismissNotification,
  useDismissAllNotifications,
} from '../../hooks/useNotifications';
import { useAutoBackup } from '../../hooks/useAutoBackup';
import { cn, parseYearMonth } from '../../lib/utils';
import { formatCurrency } from '../../lib/formatters';
import { springSmooth } from '../../lib/motion';
import CommandPalette from '../ui/CommandPalette';
import PaywallModal from '../ui/PaywallModal';
import WelcomeModal from '../ui/WelcomeModal';
import OnboardingChecklist from '../ui/OnboardingChecklist';
import GlobalAddDealModal from '../pipeline/GlobalAddDealModal';
import GlobalSearch from '../ui/GlobalSearch';

const sidebarVariants = {
  open: { x: 0, opacity: 1, transition: springSmooth },
  closed: { x: '-100%', opacity: 0, transition: { duration: 0.2, ease: [0.19, 1, 0.22, 1] } }
};

const navItems = [
  { to: '/command',   icon: LayoutDashboard, label: 'หน้าหลัก',      sub: 'Command Center' },
  { to: '/pipeline',  icon: ListTree,         label: 'ดีลทั้งหมด',   sub: 'Pipeline' },
  { to: '/customers', icon: Users,            label: 'ลูกค้า',        sub: 'Customers' },
  { to: '/sales',     icon: TrendingUp,       label: 'ยอดขาย',        sub: 'Sales Tracking' },
  { to: '/analytics', icon: BarChart3,        label: 'รายงาน',        sub: 'Analytics' },
  { to: '/tools',     icon: Wrench,           label: 'เครื่องมือ',    sub: 'Tools' },
  { to: '/settings',  icon: Settings,         label: 'ตั้งค่า',        sub: 'Settings' },
];

const PRIORITY_CONFIG = {
  critical: { dot: 'bg-rose-600',   bar: 'border-l-rose-500',   bg: 'bg-rose-50/40 dark:bg-rose-950/20' },
  high:     { dot: 'bg-orange-500', bar: 'border-l-orange-400', bg: 'bg-orange-50/20 dark:bg-orange-950/20' },
  medium:   { dot: 'bg-amber-400',  bar: 'border-l-amber-300',  bg: '' },
  low:      { dot: 'bg-slate-300 dark:bg-slate-700',  bar: 'border-l-slate-200 dark:border-l-slate-700',  bg: '' },
  info:     { dot: 'bg-blue-400',   bar: 'border-l-blue-300',   bg: '' },
};

const TYPE_SECTION = {
  deal_at_risk:        { label: 'ดีลเสี่ยงหลุด',         icon: AlertCircle,   color: 'text-rose-600 dark:text-rose-400',   bg: 'bg-rose-50/80 dark:bg-rose-950/40',   border: 'border-rose-200 dark:border-rose-900/40' },
  follow_up_overdue:   { label: 'นัดติดตาม',              icon: CalendarClock, color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50/60 dark:bg-amber-950/40',  border: 'border-amber-100 dark:border-amber-900/40' },
  deal_closing_soon:   { label: 'คาดปิดเร็วๆ นี้',       icon: Briefcase,     color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50/60 dark:bg-violet-950/40', border: 'border-violet-100 dark:border-violet-900/40' },
  deal_closing_overdue:{ label: 'เลยกำหนดปิด',            icon: Clock,         color: 'text-rose-600 dark:text-rose-400',   bg: 'bg-rose-50/60 dark:bg-rose-950/40',   border: 'border-rose-100 dark:border-rose-900/40' },
  deal_stale:          { label: 'ดีลหยุดนิ่ง',            icon: Clock,         color: 'text-slate-500 dark:text-slate-400',  bg: 'bg-slate-50 dark:bg-slate-900/40',     border: 'border-slate-100 dark:border-slate-800' },
  monthly_goal_at_risk:{ label: 'เป้าหมายเดือนนี้',       icon: BarChart2,     color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50/60 dark:bg-blue-950/40',   border: 'border-blue-100 dark:border-blue-900/40' },
};

const TYPE_ORDER = [
  'deal_at_risk',
  'deal_closing_overdue',
  'follow_up_overdue',
  'deal_closing_soon',
  'monthly_goal_at_risk',
  'deal_stale',
];

function relativeTime(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'เมื่อกี้';
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชม.ที่แล้ว`;
  const days = Math.floor(hrs / 24);
  return `${days} วันที่แล้ว`;
}

function hasRowsWithoutOwnerColumn(rows) {
  return (rows || []).length > 0 && rows.some((row) => !Object.prototype.hasOwnProperty.call(row, 'owner_id'));
}

function SystemStatusBanner({ deals, customers, activities, effectiveTarget, navigate }) {
  const legacyDataMode = hasRowsWithoutOwnerColumn(deals) || hasRowsWithoutOwnerColumn(customers) || hasRowsWithoutOwnerColumn(activities);
  const setupItems = [
    { label: 'เป้าหมาย', done: Number(effectiveTarget || 0) > 0 },
    { label: 'ลูกค้า', done: (customers || []).length > 0 },
    { label: 'ดีล', done: (deals || []).length > 0 },
    { label: 'กิจกรรม', done: (activities || []).length > 0 },
  ];
  const completed = setupItems.filter((item) => item.done).length;
  const isSetupComplete = completed === setupItems.length;

  if (!legacyDataMode && isSetupComplete) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'mb-6 rounded-2xl border p-4 shadow-sm backdrop-blur-xl transition-all',
        legacyDataMode
          ? 'border-amber-200 bg-amber-50/90 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100'
          : 'border-slate-200 bg-white/80 text-slate-900 dark:border-white/10 dark:bg-[#0f111a]/80 dark:text-white'
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className={cn(
            'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            legacyDataMode ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' : 'bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300'
          )}>
            {legacyDataMode ? <AlertCircle size={17} /> : <Target size={17} />}
          </div>
          <div>
            <p className="text-sm font-bold">
              {legacyDataMode ? 'ฐานข้อมูลยังอยู่โหมด Legacy' : 'ตั้งค่า flow เริ่มต้นให้ครบ'}
            </p>
            <p className={cn('mt-1 text-xs leading-5', legacyDataMode ? 'text-amber-800 dark:text-amber-300/80' : 'text-slate-500 dark:text-slate-400')}>
              {legacyDataMode
                ? 'แอปใช้งานได้ แต่การแยกข้อมูลรายผู้ใช้จะสมบูรณ์หลังรัน migration ใน Supabase'
                : `พร้อมใช้งานแล้ว ${completed}/${setupItems.length} ส่วน`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {setupItems.map((item) => (
            <span
              key={item.label}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                item.done
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'border-slate-200 bg-white text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400'
              )}
            >
              {item.done ? <CheckCircle2 size={11} /> : <Clock size={11} />}
              {item.label}
            </span>
          ))}
          <button
            type="button"
            onClick={() => navigate(legacyDataMode ? '/settings' : '/pipeline')}
            className={cn(
              'ml-1 inline-flex h-8 items-center gap-1.5 rounded-xl px-3 text-xs font-bold shadow-sm transition-all',
              legacyDataMode
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-violet-600 text-white hover:bg-violet-700'
            )}
          >
            {legacyDataMode ? 'เปิดตั้งค่า' : 'เริ่มเพิ่มดีล'}
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </motion.section>
  );
}

function TrialBanner({ isTrialActive, isExpired, trialDaysLeft, trialMsLeft, isGuestAccount, openPaywall }) {
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('nova_banner_dismissed') === '1';
  });
  const [countdown, setCountdown] = useState(trialMsLeft);

  useEffect(() => {
    if (!isGuestAccount || !isTrialActive) return;
    setCountdown(trialMsLeft);
    const interval = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isGuestAccount, isTrialActive, trialMsLeft]);

  const handleDismiss = useCallback(() => {
    sessionStorage.setItem('nova_banner_dismissed', '1');
    setDismissed(true);
  }, []);

  if (dismissed && !isExpired) return null;
  if (!isTrialActive && !isExpired && !isGuestAccount) return null;

  const formatCountdown = (ms) => {
    if (ms <= 0) return 'หมดเวลา';
    const totalSecs = Math.floor(ms / 1000);
    const days = Math.floor(totalSecs / 86400);
    const hrs = Math.floor((totalSecs % 86400) / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (days > 0) return `${days} วัน ${hrs} ชม. ${mins} นาที`;
    if (hrs > 0) return `${hrs}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')} ชม.`;
    return `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')} นาที`;
  };

  const TOTAL_MS = 3 * 24 * 60 * 60 * 1000;
  const progressRatio = isGuestAccount ? Math.max(0, Math.min(1, 1 - countdown / TOTAL_MS)) : 0;

  const urgency = countdown < 3600000 ? 'critical'
    : countdown < 86400000 ? 'warning'
    : 'normal';

  const themes = {
    normal:   { bg: 'from-indigo-950 via-slate-900 to-violet-950 border-violet-800/40', bar: 'bg-emerald-400', text: 'text-emerald-300', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    warning:  { bg: 'from-amber-950 via-slate-900 to-orange-950 border-amber-800/40',   bar: 'bg-amber-400',   text: 'text-amber-300',   badge: 'bg-amber-500/20 text-amber-200 border-amber-500/30' },
    critical: { bg: 'from-rose-950 via-slate-900 to-red-950 border-rose-800/40',       bar: 'bg-rose-400',    text: 'text-rose-300',    badge: 'bg-rose-500/20 text-rose-200 border-rose-500/30' },
  };
  const theme = isExpired ? themes.critical : themes[urgency];

  return (
    <motion.section
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      className={cn(
        'mb-6 rounded-2xl bg-gradient-to-r p-0 shadow-lg relative overflow-hidden border',
        theme.bg
      )}
    >
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-500/20 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-500/20 blur-[60px] rounded-full pointer-events-none" />

      {isGuestAccount && isTrialActive && (
        <div className="h-1 w-full bg-white/10">
          <motion.div
            className={cn('h-full', theme.bar)}
            initial={{ width: 0 }}
            animate={{ width: `${progressRatio * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      )}

      <div className="relative z-10 p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/15 shrink-0 mt-0.5">
              {isExpired ? <AlertCircle className="text-rose-300" size={20} /> : <Timer className={theme.text} size={20} />}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-white font-bold text-sm md:text-base tracking-tight">
                  {isExpired
                    ? 'หมดเวลาทดลองใช้งาน'
                    : isGuestAccount
                      ? 'โหมด Sandbox (ทดลองใช้ฟรี)'
                      : `ช่วงทดลองใช้งาน — เหลือ ${trialDaysLeft} วัน`}
                </h3>
                {isGuestAccount && isTrialActive && (
                  <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full border', theme.badge)}>
                    {formatCountdown(countdown)}
                  </span>
                )}
              </div>
              <p className="text-white/60 text-xs font-medium mt-1 leading-relaxed">
                {isExpired
                  ? 'สมัครสมาชิกเพื่อเข้าถึงฐานข้อมูลส่วนตัวและฟีเจอร์ Pro อย่างต่อเนื่อง'
                  : isGuestAccount
                    ? 'ข้อมูลทดลองเล่นบันทึกชั่วคราวในเบราว์เซอร์ · สมัครสมาชิกเพื่อบันทึก Cloud และรับสิทธิ์ Pro'
                    : 'ทดลองใช้ครบ 3 วันฟรี! ปลดล็อคระบบ Premium ไม่มีข้อผูกมัด'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => openPaywall(isExpired ? 'trial_ended' : isGuestAccount ? 'guest_upgrade' : 'default')}
              className="whitespace-nowrap px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black rounded-xl shadow-md transition-all active:scale-95 text-xs md:text-sm"
            >
              {isGuestAccount ? '✨ สมัครสมาชิก' : isExpired ? 'อัปเกรดทันที' : 'อัปเกรด Pro'}
            </button>
            {!isExpired && (
              <button
                onClick={handleDismiss}
                className="p-2 text-white/40 hover:text-white rounded-lg transition-all"
                title="ปิด"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const sidebarRef = useRef(null);
  const notifRef = useRef(null);

  const {
    isSidebarOpen,
    toggleSidebar,
    closeSidebar,
    monthlyTarget,
    setMonthlyTarget,
    setPendingOpenDeal,
    openQuickAdd,
    theme,
    toggleTheme,
  } = useAppStore();

  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState('all');
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);

  const { user, signOut } = useAuth();
  const userId = user?.id;
  const { data: myProfile } = useMyProfile(userId);
  const { data: deals = [] } = useDeals();
  const { data: customers = [] } = useCustomers();
  const { data: settings } = useSettings();
  const { data: activities = [] } = useActivities();

  const { isPro, isTrialActive, isExpired, trialDaysLeft, trialMsLeft, isGuestAccount, isSuspended, openPaywall } = useSubscription();

  const hasPersonalTarget = myProfile?.personal_target > 0;
  const effectiveTarget = hasPersonalTarget ? myProfile.personal_target : monthlyTarget;

  const { data: notifications = [] } = useNotifications(userId);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const dismiss = useDismissNotification();
  const dismissAll = useDismissAllNotifications();

  useProactiveEngine({ deals, customers, activities, monthlyTarget: effectiveTarget, userId });
  useAutoBackup();

  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);
  const totalCount = notifications.length;

  const filteredNotifications = useMemo(() => {
    if (notifFilter === 'critical') {
      return notifications.filter(n => n.priority === 'critical' || n.priority === 'high' || n.type === 'deal_at_risk' || n.type === 'deal_closing_overdue');
    }
    if (notifFilter === 'activities') {
      return notifications.filter(n => n.type === 'follow_up_overdue');
    }
    if (notifFilter === 'goals') {
      return notifications.filter(n => n.type === 'monthly_goal_at_risk' || n.type === 'deal_stale' || n.type === 'deal_closing_soon');
    }
    return notifications;
  }, [notifications, notifFilter]);

  const grouped = useMemo(() => {
    const map = {};
    for (const n of filteredNotifications) {
      if (!map[n.type]) map[n.type] = [];
      map[n.type].push(n);
    }
    const PRIO = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    for (const type of Object.keys(map)) {
      map[type].sort((a, b) => (PRIO[a.priority] ?? 5) - (PRIO[b.priority] ?? 5) || new Date(b.created_at) - new Date(a.created_at));
    }
    return map;
  }, [filteredNotifications]);

  const displayName = useMemo(() => {
    if (!user) return 'User';
    return user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  }, [user]);

  const displayInitial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      if (e.key.toLowerCase() === 'c' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        e.preventDefault();
        openQuickAdd();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openQuickAdd]);

  useEffect(() => {
    if (settings?.monthly_target && settings.monthly_target !== monthlyTarget) {
      setMonthlyTarget(settings.monthly_target);
    }
  }, [settings, monthlyTarget, setMonthlyTarget]);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isNotifOpen) return;
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setIsNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isNotifOpen]);

  const goalProgress = useMemo(() => {
    if (!deals || !effectiveTarget) return 0;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const wonThisMonth = deals
      .filter(d => {
        if (d.stage !== 'won') return false;
        const parsed = parseYearMonth(d.actual_close_date || d.created_at);
        return parsed ? parsed.month === currentMonth && parsed.year === currentYear : false;
      })
      .reduce((s, d) => s + Number(d.value || 0), 0);
    return Math.min(100, Math.round((wonThisMonth / effectiveTarget) * 100));
  }, [deals, effectiveTarget]);

  const mobileSidebarMotion = shouldReduceMotion
    ? { initial: false, animate: 'open', exit: undefined }
    : { initial: 'closed', animate: 'open', exit: 'closed' };

  if (isSuspended) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-6 text-center select-none">
        <div className="max-w-md w-full bg-slate-900/70 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden space-y-6">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
            <Lock size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white tracking-tight">บัญชีของคุณถูกระงับการใช้งาน</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              ขออภัย บัญชีนี้ถูกสั่งระงับการเข้าใช้งานโดยผู้ดูแลระบบ กรุณาติดต่อผู้ดูแลระบบของคุณเพื่อขอข้อมูลเพิ่มเติม
            </p>
          </div>
          <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
            <button
              onClick={() => signOut()}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all active:scale-95 text-xs"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-300">

      {/* MOBILE BACKDROP */}
      <AnimatePresence>
        {isSidebarOpen && !isDesktop && (
          <motion.button
            key="sidebar-backdrop"
            type="button"
            aria-label="ปิดเมนู"
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <aside
        ref={sidebarRef}
        className={cn(
          "w-64 md:w-72 flex flex-col flex-shrink-0 relative border-r transition-colors duration-300 z-30 select-none",
          // Light Mode
          "bg-white/95 border-slate-200/80 shadow-[2px_0_24px_rgba(0,0,0,0.03)] backdrop-blur-2xl",
          // Dark Mode
          "dark:bg-[#070b14]/95 dark:border-white/[0.08] dark:shadow-[4px_0_36px_rgba(0,0,0,0.5)]",
          !isDesktop && "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300",
          !isDesktop && !isSidebarOpen && "-translate-x-full",
          !isDesktop && isSidebarOpen && "translate-x-0"
        )}
      >
        {/* Subtle Aurora Ambient Glow in Sidebar */}
        <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-violet-500/5 dark:from-violet-500/10 via-transparent to-transparent pointer-events-none" />

        {/* Logo / Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 shrink-0 border-b border-slate-200/60 dark:border-white/[0.06] relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20 shrink-0">
              <Zap size={18} className="fill-current text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight leading-none">Nova Sales</span>
                {isPro ? (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-xs uppercase tracking-wider">
                    PRO
                  </span>
                ) : (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10">
                    FREE
                  </span>
                )}
              </div>
              <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 leading-none mt-1 uppercase tracking-widest">
                CRM Enterprise
              </p>
            </div>
          </div>
          {!isDesktop && (
            <button onClick={closeSidebar} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav id="sidebar-nav" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto relative z-10">
          <p className="px-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
            เมนูหลัก
          </p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => !isDesktop && closeSidebar()}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 relative overflow-hidden",
                  isActive
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/25 font-bold scale-[1.01]"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 group-hover:text-violet-600 dark:group-hover:text-violet-300"
                )}>
                  <item.icon size={15} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="leading-tight text-sm tracking-tight">{item.label}</span>
                  <span className={cn("text-[10px] font-medium leading-none mt-0.5", isActive ? "text-violet-100" : "text-slate-400 dark:text-slate-500")}>
                    {item.sub}
                  </span>
                </div>
                {!isActive && (
                  <ChevronRight size={12} className="text-slate-400 dark:text-slate-600 opacity-0 -translate-x-1 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {!isGuestAccount && <OnboardingChecklist />}

        {/* Monthly Target Progress Card */}
        <div className="px-3 pb-3 pt-2 relative z-10">
          <div className="rounded-xl p-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.07] space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">เป้าหมายเดือนนี้</p>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/20">
                {goalProgress}%
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <p className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
                {hasPersonalTarget ? formatCurrency(effectiveTarget) : 'ยังไม่ได้ตั้ง'}
              </p>
              <TrendingUp size={13} className={goalProgress >= 75 ? 'text-emerald-500' : 'text-slate-400'} />
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${goalProgress}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  goalProgress >= 75
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : 'bg-gradient-to-r from-violet-600 to-indigo-500'
                )}
              />
            </div>
          </div>
        </div>

        {/* Sidebar Footer with Theme Switcher & User Profile */}
        <div className="px-3 pb-3 pt-2 border-t border-slate-200/60 dark:border-white/[0.06] relative z-10 flex flex-col gap-2">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.07]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                {displayInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">{displayName}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate leading-none mt-0.5">{user?.email || 'sales@company.com'}</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'เปลี่ยนเป็น Light Mode' : 'เปลี่ยนเป็น Dark Mode'}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
              {theme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-violet-600" />}
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        
        {/* TOPBAR */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 z-20 shrink-0 border-b border-slate-200/70 dark:border-white/[0.07] bg-white/80 dark:bg-[#070b14]/80 backdrop-blur-xl transition-colors duration-300">
          <div className="flex items-center gap-3">
            <button onClick={toggleSidebar} aria-label="เปิด/ปิดเมนู" className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
              <Menu size={19} />
            </button>
            <button
              onClick={() => setGlobalSearchOpen(true)}
              className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/[0.08] transition-all group text-xs text-slate-500 dark:text-slate-400 shadow-2xs"
            >
              <Search size={14} className="text-slate-400 group-hover:text-violet-500" />
              <span>ค้นหาดีล ลูกค้า รายงาน...</span>
              <kbd className="text-[10px] px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-400 ml-3">⌘K</kbd>
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Quick Add Button */}
            <button
              onClick={() => openQuickAdd()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-xs shadow-violet-500/20 active:scale-95 transition-all cursor-pointer"
              title="สร้างดีลใหม่ (กด C)"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">สร้างดีล</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all cursor-pointer"
              title={theme === 'dark' ? 'เปลี่ยนเป็น Light Mode' : 'เปลี่ยนเป็น Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-violet-600" />}
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                aria-label="การแจ้งเตือน"
                onClick={() => setIsNotifOpen(v => !v)}
                className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all cursor-pointer border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.04]"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <motion.span
                    key={unreadCount}
                    initial={{ scale: 1.4 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={shouldReduceMotion ? undefined : { opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-12 w-[380px] max-w-[90vw] bg-white dark:bg-[#0f111a] rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl z-50 overflow-hidden"
                  >
                    {/* Panel header */}
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell size={14} className="text-violet-600 dark:text-violet-400" />
                        <span className="text-sm font-bold text-slate-900 dark:text-white">การแจ้งเตือน</span>
                        {unreadCount > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 animate-pulse">{unreadCount} ใหม่</span>
                        )}
                      </div>
                      {totalCount > 0 && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => markAllRead.mutate(userId)}
                            className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 px-2 py-1 rounded-lg transition-all"
                            title="อ่านทั้งหมด"
                          >
                            <CheckCheck size={12} />
                            <span className="hidden sm:inline">อ่านทั้งหมด</span>
                          </button>
                          <button
                            onClick={() => dismissAll.mutate(userId)}
                            className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-rose-600 px-2 py-1 rounded-lg transition-all"
                            title="ล้างทั้งหมด"
                          >
                            <Trash2 size={12} />
                            <span className="hidden sm:inline">ล้าง</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Filter tabs */}
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-1 bg-slate-50/50 dark:bg-white/[0.02]">
                      {[
                        { id: 'all', label: 'ทั้งหมด' },
                        { id: 'critical', label: 'เสี่ยง/วิกฤต' },
                        { id: 'activities', label: 'นัดหมาย' },
                        { id: 'goals', label: 'เป้าหมาย' },
                      ].map(tab => {
                        const count = tab.id === 'all' ? totalCount : 
                                      tab.id === 'critical' ? notifications.filter(n => n.priority === 'critical' || n.priority === 'high' || n.type === 'deal_at_risk' || n.type === 'deal_closing_overdue').length :
                                      tab.id === 'activities' ? notifications.filter(n => n.type === 'follow_up_overdue').length :
                                      notifications.filter(n => n.type === 'monthly_goal_at_risk' || n.type === 'deal_stale' || n.type === 'deal_closing_soon').length;

                        const isActive = notifFilter === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setNotifFilter(tab.id)}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1",
                              isActive
                                ? "bg-white dark:bg-white/10 text-violet-600 dark:text-violet-300 shadow-2xs border border-slate-200/50 dark:border-white/10"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                            )}
                          >
                            <span>{tab.label}</span>
                            {count > 0 && (
                              <span className={cn(
                                "text-[9px] px-1 rounded-full",
                                isActive ? "bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                              )}>
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Notification list */}
                    <div className="max-h-[min(480px,calc(100vh-140px))] overflow-y-auto">
                      {filteredNotifications.length === 0 ? (
                        <div className="py-12 text-center space-y-2">
                          <CheckCircle2 size={26} className="text-emerald-500 mx-auto" />
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">ไม่มีการแจ้งเตือน 🎉</p>
                        </div>
                      ) : (
                        TYPE_ORDER.map(type => {
                          const items = grouped[type];
                          if (!items?.length) return null;
                          const section = TYPE_SECTION[type];
                          const Icon = section.icon;
                          return (
                            <div key={type}>
                              <div className={cn('px-4 py-1.5 border-b flex items-center gap-2', section.bg, section.border)}>
                                <Icon size={11} className={section.color} />
                                <span className={cn('text-[9px] font-bold uppercase tracking-wider', section.color)}>
                                  {section.label}
                                </span>
                                <span className={cn('ml-auto text-[9px] font-bold', section.color)}>{items.length}</span>
                              </div>
                              <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                                {items.map(notif => {
                                  const pcfg = PRIORITY_CONFIG[notif.priority] || PRIORITY_CONFIG.medium;
                                  return (
                                    <div
                                      key={notif.id}
                                      className={cn(
                                        'group flex items-start gap-3 px-4 py-2.5 border-l-2 transition-colors relative hover:bg-slate-50 dark:hover:bg-white/[0.04]',
                                        pcfg.bar, pcfg.bg,
                                      )}
                                    >
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (!notif.is_read) markRead.mutate(notif.id);
                                        }}
                                        className="flex-none mt-1 text-slate-400 hover:text-violet-600 transition-colors"
                                      >
                                        {notif.is_read ? (
                                          <CheckCircle2 size={14} className="text-emerald-500" />
                                        ) : (
                                          <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 dark:border-slate-600 hover:border-violet-500" />
                                        )}
                                      </button>

                                      <button
                                        className="flex-1 min-w-0 text-left"
                                        onClick={() => {
                                          if (!notif.is_read) markRead.mutate(notif.id);
                                          if (notif.related_deal_id) {
                                            const deal = deals.find(d => d.id === notif.related_deal_id);
                                            if (deal) setPendingOpenDeal(deal);
                                            navigate('/pipeline');
                                          }
                                          setIsNotifOpen(false);
                                        }}
                                      >
                                        <p className={cn(
                                          'text-xs leading-snug truncate',
                                          notif.is_read ? 'font-medium text-slate-500 dark:text-slate-400' : 'font-bold text-slate-900 dark:text-white'
                                        )}>
                                          {notif.title}
                                        </p>
                                        <p className="text-[11px] truncate mt-0.5 text-slate-500 dark:text-slate-400">
                                          {notif.message}
                                        </p>
                                        <p className="text-[9px] text-slate-400 mt-1">{relativeTime(notif.created_at)}</p>
                                      </button>

                                      <button
                                        onClick={(e) => { e.stopPropagation(); dismiss.mutate(notif.id); }}
                                        className="flex-none p-1 text-slate-300 dark:text-slate-600 hover:text-slate-500 rounded opacity-0 group-hover:opacity-100 transition-all"
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8 min-h-full max-w-[1700px] mx-auto">
            <TrialBanner 
              isTrialActive={isTrialActive} 
              isExpired={isExpired} 
              trialDaysLeft={trialDaysLeft}
              trialMsLeft={trialMsLeft}
              isGuestAccount={isGuestAccount} 
              openPaywall={openPaywall} 
            />
            <SystemStatusBanner
              deals={deals}
              customers={customers}
              activities={activities}
              effectiveTarget={effectiveTarget}
              navigate={navigate}
            />
            <Suspense fallback={
              <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-violet-500/10 border border-violet-500/20">
                    <Loader2 className="animate-spin text-violet-600 dark:text-violet-400" size={22} />
                  </div>
                  <p className="text-xs font-bold text-slate-400">กำลังโหลด...</p>
                </div>
              </div>
            }>
              <PageTransition key={location.pathname}>
                <Outlet />
              </PageTransition>
            </Suspense>
          </div>
        </main>
      </div>

      {/* MODALS */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        deals={deals}
        customers={customers}
      />
      <GlobalAddDealModal />
      <PaywallModal />
      <WelcomeModal />

      <AnimatePresence>
        {globalSearchOpen && (
          <GlobalSearch
            deals={deals || []}
            customers={customers || []}
            onNavigate={(type) => {
              setGlobalSearchOpen(false);
              if (type === 'deal') navigate('/pipeline');
              if (type === 'customer') navigate('/customers');
            }}
            onClose={() => setGlobalSearchOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
