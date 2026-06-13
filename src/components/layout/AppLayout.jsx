import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  LayoutDashboard, ListTree, Users, BarChart3,
  Menu, X, Wrench, Loader2,
  Search, Settings, Bell,
  ChevronRight, Target, TrendingUp,
  AlertCircle, Clock, CheckCircle2, CalendarClock, Briefcase,
  BarChart2, Trash2, CheckCheck, Plus,
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
  useMarkAllNotificationsRead,
  useDismissNotification,
  useDismissAllNotifications,
} from '../../hooks/useNotifications';
import { useAutoBackup } from '../../hooks/useAutoBackup';
import { cn, parseYearMonth } from '../../lib/utils';
import { formatCurrency } from '../../lib/formatters';
import { pageMotion, reduceMotionProps, springSmooth } from '../../lib/motion';
import CommandPalette from '../ui/CommandPalette';
import MandateAIOrbs from './MandateAIOrbs';
import PaywallModal from '../ui/PaywallModal';
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

export default function AppLayout() {
  const shouldReduceMotion = useReducedMotion();
  const isSidebarOpen = useAppStore(state => state.isSidebarOpen);
  const closeSidebar = useAppStore(state => state.closeSidebar);
  const toggleSidebar = useAppStore(state => state.toggleSidebar);
  const monthlyTarget = useAppStore(state => state.monthlyTarget);
  const setMonthlyTarget = useAppStore(state => state.setMonthlyTarget);
  const setPendingOpenDeal = useAppStore(state => state.setPendingOpenDeal);
  const openQuickAdd = useAppStore(state => state.openQuickAdd);
  const { data: deals = [] } = useDeals();
  const { data: customers = [] } = useCustomers();
  const { data: settings } = useSettings();
  const { data: activities = [] } = useActivities();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const userId = user?.id;

  const { data: myProfile } = useMyProfile(userId);
  const { shouldBlockBasic, isGuestAccount } = useSubscription();
  const hasPersonalTarget = myProfile?.personal_target > 0 && !isGuestAccount;
  const effectiveTarget = hasPersonalTarget ? myProfile.personal_target : 0;

  const { data: notifications = [] } = useNotifications(userId);
  const markAllRead = useMarkAllNotificationsRead();
  const dismiss = useDismissNotification();
  const dismissAll = useDismissAllNotifications();

  useProactiveEngine({ userId, deals, activities, monthlyTarget: effectiveTarget });
  useAutoBackup();

  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);
  const totalCount = notifications.length;

  const grouped = useMemo(() => {
    const map = {};
    for (const n of notifications) {
      if (!map[n.type]) map[n.type] = [];
      map[n.type].push(n);
    }
    const PRIO = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    for (const type of Object.keys(map)) {
      map[type].sort((a, b) => (PRIO[a.priority] ?? 5) - (PRIO[b.priority] ?? 5) || new Date(b.created_at) - new Date(a.created_at));
    }
    return map;
  }, [notifications]);

  const displayName = useMemo(() => {
    if (!user) return 'User';
    return user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  }, [user]);

  const displayInitial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    if (isNotifOpen && unreadCount > 0 && userId) {
      markAllRead.mutate(userId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNotifOpen]);

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

  const routeMotionProps = shouldReduceMotion ? reduceMotionProps : pageMotion;
  const mobileSidebarMotion = shouldReduceMotion
    ? { initial: false, animate: 'open', exit: undefined }
    : { initial: 'closed', animate: 'open', exit: 'closed' };

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-900 overflow-hidden font-sans selection:bg-primary/10">

      {/* SIDEBAR */}
      <AnimatePresence>
        {isSidebarOpen && !isDesktop && (
          <motion.button
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
        {(isSidebarOpen || isDesktop) && (
          <motion.aside
            {...mobileSidebarMotion}
            variants={sidebarVariants}
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100/80 px-5 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]",
              "lg:static lg:translate-x-0 lg:opacity-100",
            )}
          >
            {/* Logo */}
            <div className="h-20 flex items-center justify-between px-2 mb-2 relative">
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-50" />
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Target size={20} className="text-white" />
                </div>
                <div>
                  <span className="font-black text-slate-900 text-lg tracking-tight leading-none">Nova</span>
                  <p className="text-[10px] text-violet-600 font-bold leading-none mt-1 uppercase tracking-[0.2em]">Pipeline</p>
                </div>
              </div>
              <button onClick={closeSidebar} aria-label="ปิดเมนู" className="lg:hidden p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 rounded-xl transition-all">
                <X size={18} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden no-scrollbar">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => !isDesktop && closeSidebar()}
                    className={cn(
                      "group flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-300 relative",
                      isActive
                        ? "text-white shadow-sm"
                        : "text-slate-500 hover:text-violet-700 hover:bg-violet-50/50"
                    )}
                  >
                    {isActive && (
                      <>
                        <motion.span
                          layoutId="activeNavBackground"
                          className="absolute inset-0 bg-violet-600 shadow-sm rounded-xl"
                          transition={springSmooth}
                        />
                        <motion.span
                          layoutId="activeNavRail"
                          className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-full z-20"
                          transition={springSmooth}
                        />
                      </>
                    )}
                    <item.icon
                      size={18}
                      strokeWidth={isActive ? 2.5 : 2}
                      className={cn('relative z-10 transition-colors', isActive ? 'text-white' : 'text-slate-400 group-hover:text-violet-600')}
                    />
                    <div className="relative z-10 flex flex-col">
                      <span className={cn('font-bold tracking-tight', isActive ? 'text-white' : 'text-slate-700 group-hover:text-violet-700')}>
                        {item.label}
                      </span>
                    </div>
                    {!isActive && (
                      <ChevronRight size={14} className="relative z-10 ml-auto opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-40 transition-all duration-300" />
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Monthly Goal */}
            <div className="pb-5 pt-5 relative mt-2 mb-1">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-50" />
              <div className="bg-gradient-to-br from-violet-50 to-indigo-50/50 border border-violet-100/60 rounded-2xl p-3.5 space-y-3 relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-violet-300/20 to-indigo-300/20 rounded-full transition-all group-hover:scale-110 duration-500" />
                <div className="flex items-center justify-between relative z-10">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">เป้าหมายส่วนตัว</p>
                  <span className="text-xs font-black text-violet-600 bg-white px-2 py-0.5 rounded-full shadow-sm">{goalProgress}%</span>
                </div>
                <div className="flex justify-between items-center relative z-10">
                  <p className="text-lg font-black text-slate-800 tracking-tight">{hasPersonalTarget ? formatCurrency(effectiveTarget) : 'ยังไม่ได้ตั้ง'}</p>
                  <TrendingUp size={16} className={goalProgress >= 75 ? 'text-emerald-500' : 'text-slate-300'} strokeWidth={2.5} />
                </div>
                <div className="h-2 w-full bg-white/60 rounded-full overflow-hidden shadow-inner relative z-10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${goalProgress}%` }}
                    transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
                    className={cn(
                      "h-full rounded-full shadow-sm",
                      goalProgress >= 100 ? "bg-gradient-to-r from-emerald-400 to-emerald-500" :
                      goalProgress >= 75  ? "bg-gradient-to-r from-emerald-400 to-emerald-500" :
                      goalProgress >= 50  ? "bg-gradient-to-r from-violet-500 to-indigo-500"  : "bg-gradient-to-r from-violet-400 to-indigo-400"
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Developer credit */}
            <div className="px-2 pb-6 pt-2 text-center relative">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-50" />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-100/80 z-20 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={toggleSidebar} aria-label="เปิด/ปิดเมนู" className="lg:hidden p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
              <Menu size={20} />
            </button>
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden md:flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all group text-sm"
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
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-sm hover:shadow-md shadow-violet-500/20 transition-all font-semibold text-xs"
              title="สร้างดีลใหม่ (กด C)"
            >
              <Plus size={14} />
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
                        {totalCount > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{totalCount}</span>
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

                    {/* Notification list */}
                    <div className="max-h-[560px] overflow-y-auto">
                      {totalCount === 0 ? (
                        <div className="py-14 text-center space-y-2">
                          <CheckCircle2 size={28} className="text-emerald-400 mx-auto" />
                          <p className="text-sm font-semibold text-slate-400">ทุกอย่างอัพเดทแล้ว 🎉</p>
                          <p className="text-xs text-slate-300">ไม่มีการแจ้งเตือนใหม่</p>
                        </div>
                      ) : (
                        TYPE_ORDER.map(type => {
                          const items = grouped[type];
                          if (!items?.length) return null;
                          const section = TYPE_SECTION[type];
                          const Icon = section.icon;
                          return (
                            <div key={type}>
                              <div className={cn('px-4 py-2 border-b flex items-center gap-2', section.bg, section.border)}>
                                <Icon size={12} className={section.color} />
                                <span className={cn('text-[10px] font-bold uppercase tracking-widest', section.color)}>
                                  {section.label}
                                </span>
                                <span className={cn('ml-auto text-[10px] font-bold', section.color)}>{items.length}</span>
                              </div>
                              <div className="divide-y divide-slate-50">
                                {items.map(notif => {
                                  const pcfg = PRIORITY_CONFIG[notif.priority] || PRIORITY_CONFIG.medium;
                                  return (
                                    <div
                                      key={notif.id}
                                      className={cn(
                                        'group flex items-start gap-3 px-4 py-2.5 border-l-2 transition-colors',
                                        pcfg.bar, pcfg.bg,
                                        !notif.is_read && 'bg-violet-50/30',
                                      )}
                                    >
                                      {/* Priority dot */}
                                      <div className="flex-none mt-1.5">
                                        <div className={cn('w-2 h-2 rounded-full', pcfg.dot)} />
                                      </div>

                                      {/* Content — clickable to navigate */}
                                      <button
                                        className="flex-1 min-w-0 text-left"
                                        onClick={() => {
                                          if (notif.related_deal_id) {
                                            const deal = deals.find(d => d.id === notif.related_deal_id);
                                            if (deal) setPendingOpenDeal(deal);
                                            navigate('/pipeline');
                                          }
                                          setIsNotifOpen(false);
                                        }}
                                      >
                                        <p className={cn(
                                          'text-sm leading-snug truncate',
                                          notif.is_read ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'
                                        )}>
                                          {notif.title}
                                        </p>
                                        <p className="text-xs text-slate-400 truncate mt-0.5">{notif.message}</p>
                                        <p className="text-[10px] text-slate-300 mt-1">{relativeTime(notif.created_at)}</p>
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
              <div className="w-8 h-8 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center font-bold text-xs text-violet-700">
                {displayInitial}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-6 min-h-full">
            <SystemStatusBanner
              deals={deals}
              customers={customers}
              activities={activities}
              effectiveTarget={effectiveTarget}
              navigate={navigate}
            />
            <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin text-violet-500" size={32} /></div>}>
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

      <MandateAIOrbs deals={deals} activities={activities} />
      
      {/* Paywall Modal */}
      <PaywallModal />
    </div>
  );
}
