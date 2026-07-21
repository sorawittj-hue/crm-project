import { useState, useEffect, useMemo, useRef, Suspense, useCallback } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  LayoutDashboard, ListTree, Users, BarChart3,
  Menu, X, Wrench, Loader2,
  Search, Settings, Bell,
  ChevronRight, Target, TrendingUp,
  AlertCircle, Clock, CheckCircle2, CalendarClock, Briefcase,
  BarChart2, Trash2, CheckCheck, Plus, Sparkles, Lock, Crown,
  Timer, RotateCcw, ChevronDown, Zap,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useDeals } from '../../hooks/useDeals';
import { useCustomers } from '../../hooks/useCustomers';
import { useSettings } from '../../hooks/useSettings';
import { useActivities } from '../../hooks/useActivities';
import { useAuth } from '../../hooks/useAuth';
import { useMyProfile } from '../../hooks/useUserProfiles';
import { useSubscription } from '../../hooks/useSubscription';
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

// Priority config for notification rows
const PRIORITY_CONFIG = {
  critical: { dot: 'bg-rose-600',   bar: 'border-l-rose-500',   bg: 'bg-rose-50/40' },
  high:     { dot: 'bg-orange-500', bar: 'border-l-orange-400', bg: 'bg-orange-50/20' },
  medium:   { dot: 'bg-amber-400',  bar: 'border-l-amber-300',  bg: '' },
  low:      { dot: 'bg-slate-300',  bar: 'border-l-slate-200',  bg: '' },
  info:     { dot: 'bg-blue-400',   bar: 'border-l-blue-300',   bg: '' },
};

const TYPE_SECTION = {
  deal_at_risk:        { label: 'ดีลเสี่ยงหลุด',         icon: AlertCircle,   color: 'text-rose-600',   bg: 'bg-rose-50/80',   border: 'border-rose-200' },
  follow_up_overdue:   { label: 'นัดติดตาม',              icon: CalendarClock, color: 'text-amber-600',  bg: 'bg-amber-50/60',  border: 'border-amber-100' },
  deal_closing_soon:   { label: 'คาดปิดเร็วๆ นี้',       icon: Briefcase,     color: 'text-violet-600', bg: 'bg-violet-50/60', border: 'border-violet-100' },
  deal_closing_overdue:{ label: 'เลยกำหนดปิด',            icon: Clock,         color: 'text-rose-600',   bg: 'bg-rose-50/60',   border: 'border-rose-100' },
  deal_stale:          { label: 'ดีลหยุดนิ่ง',            icon: Clock,         color: 'text-slate-500',  bg: 'bg-slate-50',     border: 'border-slate-100' },
  monthly_goal_at_risk:{ label: 'เป้าหมายเดือนนี้',       icon: BarChart2,     color: 'text-blue-600',   bg: 'bg-blue-50/60',   border: 'border-blue-100' },
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
        'mb-6 rounded-2xl border p-4 shadow-sm',
        legacyDataMode
          ? 'border-amber-200 bg-amber-50 text-amber-950'
          : 'border-violet-100 bg-white text-slate-900'
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className={cn(
            'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            legacyDataMode ? 'bg-amber-100 text-amber-700' : 'bg-violet-50 text-violet-600'
          )}>
            {legacyDataMode ? <AlertCircle size={17} /> : <Target size={17} />}
          </div>
          <div>
            <p className="text-sm font-bold">
              {legacyDataMode ? 'ฐานข้อมูลยังอยู่โหมด Legacy' : 'ตั้งค่า flow เริ่มต้นให้ครบ'}
            </p>
            <p className={cn('mt-1 text-xs leading-5', legacyDataMode ? 'text-amber-800' : 'text-slate-500')}>
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
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-500'
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
    // Restore dismiss state only for current session
    return sessionStorage.getItem('nova_banner_dismissed') === '1';
  });
  const [countdown, setCountdown] = useState(trialMsLeft);

  // Real-time countdown update (every 1 second)
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

  // Format countdown to h:mm:ss or d days h hrs
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

  // Progress (0–1) = time elapsed / total
  const TOTAL_MS = 3 * 24 * 60 * 60 * 1000;
  const progressRatio = isGuestAccount ? Math.max(0, Math.min(1, 1 - countdown / TOTAL_MS)) : 0;

  // Urgency level drives color theme
  const urgency = countdown < 3600000 ? 'critical' // < 1 hr
    : countdown < 86400000 ? 'warning' // < 1 day
    : 'normal';

  const themes = {
    normal:   { bg: 'from-indigo-900 to-violet-900',   bar: 'bg-emerald-400', text: 'text-emerald-300',  badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    warning:  { bg: 'from-amber-800 to-orange-900',    bar: 'bg-amber-400',   text: 'text-amber-300',   badge: 'bg-amber-500/20 text-amber-200 border-amber-500/30' },
    critical: { bg: 'from-rose-900 to-red-900',        bar: 'bg-rose-400',    text: 'text-rose-300',    badge: 'bg-rose-500/20 text-rose-200 border-rose-500/30' },
  };
  const theme = isExpired ? themes.critical : themes[urgency];

  return (
    <motion.section
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      className={cn(
        'mb-6 rounded-2xl bg-gradient-to-r p-0 shadow-lg relative overflow-hidden',
        theme.bg
      )}
    >
      {/* Animated glow orb */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-500/20 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-500/20 blur-[60px] rounded-full pointer-events-none" />

      {/* Progress bar along the top */}
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

      <div className="relative z-10 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center border border-white/15 shrink-0 mt-0.5">
              {isExpired ? <AlertCircle className="text-rose-300" size={22} /> : <Timer className={theme.text} size={22} />}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-white font-black text-base tracking-tight">
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

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => openPaywall(isExpired ? 'trial_ended' : isGuestAccount ? 'guest_upgrade' : 'default')}
              className="whitespace-nowrap px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black rounded-xl shadow-lg transition-all active:scale-95 text-sm"
            >
              {isGuestAccount ? '✨ สมัครสมาชิก' : isExpired ? 'อัปเกรดทันที' : 'อัปเกรด Pro'}
            </button>
            {!isExpired && (
              <button
                onClick={handleDismiss}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white transition-all"
                title="ซ่อนแบนเนอร์"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}


export default function AppLayout() {
  const shouldReduceMotion = useReducedMotion();
  const isSidebarOpen = useAppStore(state => state.isSidebarOpen);
  const closeSidebar = useAppStore(state => state.closeSidebar);
  const toggleSidebar = useAppStore(state => state.toggleSidebar);
  const openPaywall = useAppStore(state => state.openPaywall);
  const monthlyTarget = useAppStore(state => state.monthlyTarget);
  const setMonthlyTarget = useAppStore(state => state.setMonthlyTarget);
  const setPendingOpenDeal = useAppStore(state => state.setPendingOpenDeal);
  const openQuickAdd = useAppStore(state => state.openQuickAdd);
  const { data: deals = [] } = useDeals();
  const { data: customers = [] } = useCustomers();
  const { data: settings } = useSettings();
  const { data: activities = [] } = useActivities();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState('all');
  const notifRef = useRef(null);
  const sidebarRef = useRef(null);

  useEffect(() => {
    if (!isDesktop && isSidebarOpen) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          closeSidebar();
          return;
        }
        if (e.key === 'Tab' && sidebarRef.current) {
          const focusableElements = sidebarRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length === 0) return;
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isSidebarOpen, isDesktop, closeSidebar]);

  const userId = user?.id;

  const { data: myProfile } = useMyProfile(userId);
  const { isGuestAccount, isTrialActive, isExpired, trialDaysLeft, trialMsLeft, isPro, isSuspended } = useSubscription();
  const hasPersonalTarget = myProfile?.personal_target > 0 && !isGuestAccount;
  const effectiveTarget = hasPersonalTarget ? myProfile.personal_target : 0;

  const { data: notifications = [] } = useNotifications(userId);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const dismiss = useDismissNotification();
  const dismissAll = useDismissAllNotifications();

  useProactiveEngine({ userId, deals, activities, monthlyTarget: effectiveTarget });
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

  // Auto-mark read on open disabled to prevent immediate badge loss

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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.08),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(244,63,94,0.05),transparent)] pointer-events-none" />
        <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-2xl border border-slate-800/80 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden space-y-6">
          <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-rose-500/5 animate-pulse">
            <Lock size={36} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white tracking-tight">บัญชีของคุณถูกระงับการใช้งาน</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              ขออภัย บัญชีนี้ถูกสั่งระงับการเข้าใช้งานโดยผู้ดูแลระบบ กรุณาติดต่อผู้ดูแลระบบของคุณเพื่อขอข้อมูลเพิ่มเติม
            </p>
          </div>
          <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
            <div className="text-xs text-slate-500">
              อีเมลที่เข้าใช้งาน: <span className="font-bold text-slate-400">{user?.email}</span>
            </div>
            <button
              onClick={() => signOut()}
              className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all active:scale-95 text-xs font-bold"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isGuestAccount && isExpired) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="bg-white rounded-[2rem] p-10 max-w-md w-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 to-rose-500" />
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-red-50/50">
            <Lock size={40} strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">หมดเวลาทดลองใช้งาน</h2>
          <p className="text-slate-500 mb-8 leading-relaxed font-medium">ระยะเวลาทดลองใช้งาน 3 วันของคุณสิ้นสุดลงแล้ว กรุณาอัปเกรดเป็น <strong className="text-violet-600">Nova Pro</strong> เพื่อเก็บรักษาข้อมูลทั้งหมดและย้ายขึ้นสู่ระบบ Cloud ทันที</p>
          <button 
            onClick={() => openPaywall('trial_ended')}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-violet-500/25 transition-all hover:-translate-y-1 active:translate-y-0"
          >
            อัปเกรดแบบรายเดือน (299฿)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans" style={{background: '#0f0a2e'}}>

      {/* SIDEBAR — backdrop (mobile only, own AnimatePresence) */}
      <AnimatePresence>
        {isSidebarOpen && !isDesktop && (
          <motion.button
            key="sidebar-backdrop"
            type="button"
            aria-label="ปิดเมนู"
            className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-sm lg:hidden"
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR — desktop: static aside */}
      {isDesktop ? (
        <aside
          ref={sidebarRef}
          className="w-72 flex flex-col flex-shrink-0 relative bg-slate-950 border-r border-slate-800/80 shadow-[8px_0_36px_rgba(0,0,0,0.4)] z-30 select-none"
        >
          {/* Ambient Glows */}
          <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-violet-600/15 via-indigo-600/5 to-transparent pointer-events-none" />
          <div className="absolute top-12 -left-12 w-40 h-40 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

          {/* Logo / Brand Header */}
          <div className="h-20 flex items-center justify-between px-5 mb-2 relative shrink-0 border-b border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/30 ring-2 ring-white/10 shrink-0">
                <Zap size={20} className="fill-current text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-white text-lg tracking-tight leading-none">Nova Sales</span>
                  {isPro ? (
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-sm shadow-amber-500/30 uppercase tracking-widest">
                      PRO
                    </span>
                  ) : (
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      FREE
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-extrabold text-violet-400 leading-none mt-1 uppercase tracking-widest">
                  CRM Enterprise
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav id="sidebar-nav" className="flex-1 px-3.5 py-4 space-y-1.5 overflow-y-auto custom-scrollbar-thin relative z-10">
            <p className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">เมนูหลัก</p>
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => !isDesktop && closeSidebar()}
                  className={cn(
                    "group flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-300 relative overflow-hidden",
                    isActive
                      ? "bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white font-extrabold shadow-lg shadow-violet-600/30 border border-violet-400/30 scale-[1.02]"
                      : "text-slate-400 hover:text-white hover:bg-slate-900/80 border border-transparent"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300",
                    isActive
                      ? "bg-white/20 backdrop-blur-md text-white shadow-inner"
                      : "bg-slate-900 text-slate-400 group-hover:text-violet-300 group-hover:bg-slate-800"
                  )}>
                    <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="leading-tight text-sm tracking-tight">{item.label}</span>
                    <span className={cn("text-[10px] font-medium leading-none mt-0.5", isActive ? "text-violet-200" : "text-slate-500 group-hover:text-slate-400")}>
                      {item.sub}
                    </span>
                  </div>
                  {!isActive && (
                    <ChevronRight size={13} className="text-slate-600 opacity-0 -translate-x-1 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Onboarding checklist */}
          {!isGuestAccount && <OnboardingChecklist />}

          {/* Monthly Goal Card */}
          <div className="px-3.5 pb-3 pt-2 relative z-10">
            <div className="rounded-2xl p-4 bg-slate-900/90 border border-slate-800/80 space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">เป้าหมายเดือนนี้</p>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  {goalProgress}%
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <p className="text-base font-black tracking-tight text-white tabular-nums">
                  {hasPersonalTarget ? formatCurrency(effectiveTarget) : 'ยังไม่ได้ตั้ง'}
                </p>
                <TrendingUp size={14} className={goalProgress >= 75 ? 'text-emerald-400' : 'text-slate-500'} />
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${goalProgress}%` }}
                  transition={{ duration: 1.2, ease: [0.19, 1, 0.22, 1] }}
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    goalProgress >= 75
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                      : 'bg-gradient-to-r from-violet-500 to-indigo-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]'
                  )}
                />
              </div>
            </div>
          </div>

          {/* User Profile Footer */}
          <div className="px-3.5 pb-4 pt-2 border-t border-slate-800/80 relative z-10">
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/60 border border-slate-800/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shrink-0">
                  {displayInitial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-white truncate leading-tight">{displayName}</p>
                  <p className="text-[10px] text-slate-400 truncate leading-none mt-0.5">{user?.email || 'sales@company.com'}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      ) : (
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.aside
              key="sidebar-mobile"
              ref={sidebarRef}
              {...mobileSidebarMotion}
              variants={sidebarVariants}
              className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-slate-950 border-r border-slate-800/80 shadow-2xl select-none"
            >
              {/* Ambient Glows */}
              <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-violet-600/15 via-indigo-600/5 to-transparent pointer-events-none" />

              {/* Logo / Brand Header */}
              <div className="h-20 flex items-center justify-between px-5 mb-2 relative shrink-0 border-b border-slate-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/30 ring-2 ring-white/10 shrink-0">
                    <Zap size={20} className="fill-current text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white text-lg tracking-tight leading-none">Nova Sales</span>
                      {isPro && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-sm shadow-amber-500/30 uppercase tracking-widest">
                          PRO
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-extrabold text-violet-400 leading-none mt-1 uppercase tracking-widest">
                      CRM Enterprise
                    </p>
                  </div>
                </div>
                <button onClick={closeSidebar} aria-label="ปิดเมนู" className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                  <X size={18} />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-3.5 py-4 space-y-1.5 overflow-y-auto custom-scrollbar-thin relative z-10">
                <p className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">เมนูหลัก</p>
                {navItems.map((item) => {
                  const isActive = location.pathname === item.to;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => closeSidebar()}
                      className={cn(
                        "group flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-300 relative overflow-hidden",
                        isActive
                          ? "bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white font-extrabold shadow-lg shadow-violet-600/30 border border-violet-400/30"
                          : "text-slate-400 hover:text-white hover:bg-slate-900/80 border border-transparent"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300",
                        isActive
                          ? "bg-white/20 backdrop-blur-md text-white shadow-inner"
                          : "bg-slate-900 text-slate-400 group-hover:text-violet-300 group-hover:bg-slate-800"
                      )}>
                        <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="leading-tight text-sm tracking-tight">{item.label}</span>
                        <span className={cn("text-[10px] font-medium leading-none mt-0.5", isActive ? "text-violet-200" : "text-slate-500 group-hover:text-slate-400")}>
                          {item.sub}
                        </span>
                      </div>
                    </NavLink>
                  );
                })}
              </nav>

              {!isGuestAccount && <OnboardingChecklist />}

              {/* Monthly Goal Card */}
              <div className="px-3.5 pb-3 pt-2 relative z-10">
                <div className="rounded-2xl p-4 bg-slate-900/90 border border-slate-800/80 space-y-2.5 shadow-inner">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">เป้าหมายเดือนนี้</p>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      {goalProgress}%
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <p className="text-base font-black tracking-tight text-white tabular-nums">
                      {hasPersonalTarget ? formatCurrency(effectiveTarget) : 'ยังไม่ได้ตั้ง'}
                    </p>
                    <TrendingUp size={14} className={goalProgress >= 75 ? 'text-emerald-400' : 'text-slate-500'} />
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${goalProgress}%` }}
                      transition={{ duration: 1.2, ease: [0.19, 1, 0.22, 1] }}
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        goalProgress >= 75
                          ? 'bg-gradient-to-r from-emerald-400 to-teal-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                          : 'bg-gradient-to-r from-violet-500 to-indigo-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]'
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* User Profile Footer */}
              <div className="px-3.5 pb-4 pt-2 border-t border-slate-800/80 relative z-10">
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/60 border border-slate-800/60">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shrink-0">
                      {displayInitial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-white truncate leading-tight">{displayName}</p>
                      <p className="text-[10px] text-slate-400 truncate leading-none mt-0.5">{user?.email || 'sales@company.com'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      )}

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{background: '#f5f4fb'}}>
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 z-20 shrink-0" style={{
          background: 'rgba(245,244,251,0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(139,92,246,0.08)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.8), 0 4px 24px rgba(100,80,200,0.04)'
        }}>
          <div className="flex items-center gap-3">
            <button onClick={toggleSidebar} aria-label="เปิด/ปิดเมนู" className="lg:hidden p-2 rounded-xl transition-all" style={{color: '#64748b'}} onMouseOver={e => e.currentTarget.style.background='rgba(139,92,246,0.08)'} onMouseOut={e => e.currentTarget.style.background='transparent'}>
              <Menu size={20} />
            </button>
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden md:flex items-center gap-2.5 px-3.5 py-2 rounded-xl transition-all group text-sm"
              style={{background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(139,92,246,0.1)', boxShadow: '0 1px 4px rgba(100,80,200,0.06)'}}
            >
              <Search size={14} className="text-slate-400" />
              <span className="text-slate-400 text-xs">ค้นหา...</span>
              <kbd className="text-[10px] px-1.5 py-0.5 bg-white rounded border border-slate-200 text-slate-400 ml-2">⌘K</kbd>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Quick Add Button */}
            <button
              onClick={() => openQuickAdd()}
              className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-xs transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                color: 'white',
                boxShadow: '0 4px 14px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
              title="สร้างดีลใหม่ (กด C)"
              onMouseOver={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseOut={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <Plus size={13} />
              <span>สร้างดีล</span>
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                aria-label="การแจ้งเตือน"
                onClick={() => setIsNotifOpen(v => !v)}
                className="relative p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <motion.span
                    key={unreadCount}
                    initial={{ scale: 1.4 }}
                    animate={{ scale: 1 }}
                    className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center"
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
                    transition={{ duration: 0.16, ease: [0.19, 1, 0.22, 1] }}
                    className="absolute right-0 top-10 w-[420px] max-w-[400px] bg-white rounded-2xl border border-slate-100 shadow-[0_8px_40px_rgba(0,0,0,0.12)] z-50 overflow-hidden"
                  >
                    {/* Panel header */}
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell size={14} className="text-violet-600" />
                        <span className="text-sm font-bold text-slate-800">การแจ้งเตือน</span>
                        {unreadCount > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 animate-pulse">{unreadCount} ใหม่</span>
                        )}
                      </div>
                      {totalCount > 0 && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => markAllRead.mutate(userId)}
                            className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-violet-600 px-2 py-1 rounded-lg hover:bg-violet-50 transition-all"
                            title="อ่านทั้งหมด"
                          >
                            <CheckCheck size={12} />
                            <span className="hidden sm:inline">อ่านทั้งหมด</span>
                          </button>
                          <button
                            onClick={() => dismissAll.mutate(userId)}
                            className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50 transition-all"
                            title="ล้างทั้งหมด"
                          >
                            <Trash2 size={12} />
                            <span className="hidden sm:inline">ล้าง</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Filter tabs */}
                    <div className="px-4 py-2 border-b border-slate-50 flex items-center gap-1.5 bg-slate-50/50">
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
                                ? "bg-white text-violet-600 shadow-sm border border-slate-200/50"
                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/55"
                            )}
                          >
                            <span>{tab.label}</span>
                            {count > 0 && (
                              <span className={cn(
                                "text-[9px] px-1 rounded-full",
                                isActive ? "bg-violet-100 text-violet-700" : "bg-slate-200 text-slate-500"
                              )}>
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Notification list */}
                    <div className="max-h-[min(560px,calc(100vh-120px))] overflow-y-auto custom-scrollbar-thin">
                      {filteredNotifications.length === 0 ? (
                        <div className="py-14 text-center space-y-2">
                          <CheckCircle2 size={28} className="text-emerald-400 mx-auto" />
                          <p className="text-sm font-semibold text-slate-400">ไม่มีการแจ้งเตือนในหมวดหมู่นี้ 🎉</p>
                          <p className="text-xs text-slate-300">ทุกอย่างอัพเดทแล้ว</p>
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
                                <span className={cn('text-[9px] font-black uppercase tracking-widest', section.color)}>
                                  {section.label}
                                </span>
                                <span className={cn('ml-auto text-[9px] font-bold', section.color)}>{items.length}</span>
                              </div>
                              <div className="divide-y divide-slate-50">
                                {items.map(notif => {
                                  const pcfg = PRIORITY_CONFIG[notif.priority] || PRIORITY_CONFIG.medium;
                                  return (
                                    <div
                                      key={notif.id}
                                      className={cn(
                                        'group flex items-start gap-3 px-4 py-2.5 border-l-2 transition-colors relative',
                                        pcfg.bar, pcfg.bg,
                                        !notif.is_read && 'bg-violet-50/20',
                                      )}
                                    >
                                      {/* Read/Unread Checkbox button */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (!notif.is_read) {
                                            markRead.mutate(notif.id);
                                          }
                                        }}
                                        className="flex-none mt-1 text-slate-300 hover:text-violet-600 transition-colors"
                                        title={notif.is_read ? "อ่านแล้ว" : "ทำเครื่องหมายว่าอ่านแล้ว"}
                                      >
                                        {notif.is_read ? (
                                          <CheckCircle2 size={14} className="text-emerald-500 fill-emerald-50" />
                                        ) : (
                                          <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 hover:border-violet-500 flex items-center justify-center transition-all group/btn">
                                            <div className="w-1.5 h-1.5 rounded-full bg-violet-600 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                          </div>
                                        )}
                                      </button>

                                      {/* Content — clickable to navigate */}
                                      <button
                                        className="flex-1 min-w-0 text-left"
                                        onClick={() => {
                                          if (!notif.is_read) {
                                            markRead.mutate(notif.id);
                                          }
                                          if (notif.related_deal_id) {
                                            const deal = deals.find(d => d.id === notif.related_deal_id);
                                            if (deal) setPendingOpenDeal(deal);
                                            navigate('/pipeline');
                                          }
                                          setIsNotifOpen(false);
                                        }}
                                      >
                                        <p className={cn(
                                          'text-[13px] leading-snug truncate',
                                          notif.is_read ? 'font-medium text-slate-500' : 'font-bold text-slate-800'
                                        )}>
                                          {notif.title}
                                        </p>
                                        <p className={cn("text-xs truncate mt-0.5", notif.is_read ? "text-slate-400" : "text-slate-500")}>
                                          {notif.message}
                                        </p>
                                        <p className="text-[9px] text-slate-350 mt-1">{relativeTime(notif.created_at)}</p>
                                      </button>

                                      {/* Dismiss */}
                                      <button
                                        onClick={(e) => { e.stopPropagation(); dismiss.mutate(notif.id); }}
                                        className="flex-none p-1 text-slate-200 hover:text-slate-500 hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all mt-0.5"
                                        title="ปิด"
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

                    {/* Footer */}
                    {totalCount > 0 && (
                      <div className="px-4 py-2.5 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => { navigate('/pipeline'); setIsNotifOpen(false); }}
                          className="text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors"
                        >
                          ดูดีลทั้งหมดใน Pipeline →
                        </button>
                        <span className="text-[10px] text-slate-300">อัพเดทอัตโนมัติทุก 60 วิ</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="h-4 w-px bg-slate-100" />
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-800 leading-none">{displayName}</p>
                <p className="text-[10px] text-violet-500 font-medium mt-0.5">{user?.email || ''}</p>
              </div>
              {(() => {
                const colorKey = user?.user_metadata?.avatar_color || 'violet';
                const themes = {
                  violet: 'bg-violet-50 border-violet-200 text-violet-700',
                  emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
                  amber: 'bg-amber-50 border-amber-200 text-amber-750',
                  rose: 'bg-rose-50 border-rose-200 text-rose-700',
                  blue: 'bg-blue-50 border-blue-200 text-blue-700',
                  purple: 'bg-purple-50 border-purple-200 text-purple-700',
                };
                const activeTheme = themes[colorKey] || themes.violet;
                return (
                  <div className={cn("w-8 h-8 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 transition-all", activeTheme)}>
                    {displayInitial}
                  </div>
                );
              })()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto" style={{
          background: 'linear-gradient(180deg, #f5f4fb 0%, #f8f7fe 100%)',
          backgroundImage: `
            radial-gradient(ellipse 80% 40% at 50% -5%, rgba(139,92,246,0.05) 0%, transparent 60%),
            radial-gradient(circle at 1px 1px, rgba(148,163,184,0.06) 1px, transparent 0)
          `,
          backgroundSize: '100% 100%, 28px 28px',
        }}>
          <div className="p-6 min-h-full">
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
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.12)'}}>
                      <Loader2 className="animate-spin" size={24} style={{color: '#7c3aed'}} />
                    </div>
                    <div className="absolute inset-0 rounded-2xl" style={{background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', filter: 'blur(8px)'}} />
                  </div>
                  <p className="text-sm font-semibold" style={{color: 'rgba(124,58,237,0.6)'}}>กำลังโหลด...</p>
                </div>
              </div>
            }>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        deals={deals}
        customers={customers}
      />
      <GlobalAddDealModal />

      
      

      {/* Paywall Modal */}
      <PaywallModal />
      <WelcomeModal />

      {/* Floating action widgets — separated to prevent overlap */}
      <div className="fixed bottom-6 left-6 lg:left-[312px] z-[9990] font-sans">
        
      </div>

    </div>
  );
}
