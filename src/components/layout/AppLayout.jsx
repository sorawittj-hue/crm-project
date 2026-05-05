import { useState, useEffect, useMemo, useRef } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ListTree, Users, BarChart3,
  Menu, X, Wrench,
  Search, Settings, Bell,
  ChevronRight, Target, TrendingUp,
  AlertCircle, Clock, CheckCircle2, CalendarClock, Briefcase
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useDeals } from '../../hooks/useDeals';
import { useCustomers } from '../../hooks/useCustomers';
import { useSettings } from '../../hooks/useSettings';
import { useActivities } from '../../hooks/useActivities';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/formatters';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Input } from '../ui/Input';
import CommandPalette from '../ui/CommandPalette';

const sidebarVariants = {
  open: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  closed: { x: '-100%', opacity: 0, transition: { duration: 0.3, ease: 'easeInOut' } }
};

const navItems = [
  { to: '/command',   icon: LayoutDashboard, label: 'หน้าหลัก',      sub: 'Command Center' },
  { to: '/pipeline',  icon: ListTree,         label: 'ดีลทั้งหมด',   sub: 'Pipeline' },
  { to: '/customers', icon: Users,            label: 'ลูกค้า',        sub: 'Customers' },
  { to: '/analytics', icon: BarChart3,        label: 'รายงาน',        sub: 'Analytics' },
  { to: '/tools',     icon: Wrench,           label: 'เครื่องมือ',    sub: 'Tools' },
];

export default function AppLayout() {
  const { isSidebarOpen, closeSidebar, toggleSidebar, monthlyTarget, setMonthlyTarget } = useAppStore();
  const { data: deals = [] } = useDeals();
  const { data: customers = [] } = useCustomers();
  const { data: settings } = useSettings();
  const { data: activities = [] } = useActivities();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [localTarget, setLocalTarget] = useState(monthlyTarget);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Derive display name from auth session
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
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (settings?.monthly_target && settings.monthly_target !== monthlyTarget) {
      setMonthlyTarget(settings.monthly_target);
      setLocalTarget(settings.monthly_target);
    }
  }, [settings, monthlyTarget, setMonthlyTarget]);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close notification panel on outside click
  useEffect(() => {
    if (!isNotifOpen) return;
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setIsNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isNotifOpen]);

  // Stale deals = active deals with no activity for 3+ days
  const staleDeals = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    return deals
      .filter(d => {
        if (['won', 'lost'].includes(d.stage)) return false;
        const last = new Date(d.last_activity || d.created_at).getTime();
        return (now - last) / 86_400_000 >= 3;
      })
      .sort((a, b) => Number(b.value) - Number(a.value))
      .slice(0, 6);
  }, [deals]);

  // Pending follow-ups due today or overdue
  const pendingFollowUps = useMemo(() => {
    const dealMap = Object.fromEntries(deals.map(d => [d.id, d]));
    const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);
    return activities
      .filter(a => a.scheduled_at && !a.completed_at && a.deal_id && dealMap[a.deal_id])
      .filter(a => new Date(a.scheduled_at).getTime() <= endOfToday.getTime())
      .map(a => ({ ...a, deal: dealMap[a.deal_id] }))
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
      .slice(0, 6);
  }, [activities, deals]);

  // Deals expected to close in next 7 days
  const closingSoon = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const sevenDays = Date.now() + 7 * 86_400_000;
    return deals
      .filter(d => !['won', 'lost'].includes(d.stage) && d.expected_close_date)
      .filter(d => new Date(d.expected_close_date).getTime() <= sevenDays)
      .sort((a, b) => new Date(a.expected_close_date) - new Date(b.expected_close_date))
      .slice(0, 6);
  }, [deals]);

  const totalNotifs = pendingFollowUps.length + staleDeals.length + closingSoon.length;

  const goalProgress = useMemo(() => {
    if (!deals || !monthlyTarget) return 0;
    const now = new Date();
    const wonThisMonth = deals
      .filter(d => {
        if (d.stage !== 'won') return false;
        // Use actual_close_date if available, fallback to created_at
        const closeDate = new Date(d.actual_close_date || d.created_at);
        return closeDate.getMonth() === now.getMonth() && closeDate.getFullYear() === now.getFullYear();
      })
      .reduce((s, d) => s + Number(d.value || 0), 0);
    return Math.min(100, Math.round((wonThisMonth / monthlyTarget) * 100));
  }, [deals, monthlyTarget]);


  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-900 overflow-hidden font-sans selection:bg-primary/10">

      {/* SIDEBAR */}
      <AnimatePresence mode="wait">
        {(isSidebarOpen || isDesktop) && (
          <motion.aside
            initial="closed"
            animate="open"
            exit="closed"
            variants={sidebarVariants}
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 px-4 flex flex-col",
              "lg:static lg:translate-x-0 lg:opacity-100",
            )}
          >
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-2 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center shadow-md shadow-violet-500/30">
                  <Target size={16} className="text-white" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-base leading-none">Zenith</span>
                  <p className="text-[10px] text-slate-400 leading-none mt-0.5">Sales CRM</p>
                </div>
              </div>
              <button onClick={closeSidebar} aria-label="ปิดเมนู" className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                <X size={18} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 space-y-0.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => !isDesktop && closeSidebar()}
                    className={cn(
                      "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 relative",
                      isActive
                        ? "bg-violet-50 text-violet-700"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-600 rounded-r-full" />
                    )}
                    <item.icon
                      size={18}
                      strokeWidth={isActive ? 2.5 : 2}
                      className={isActive ? 'text-violet-600' : 'text-slate-400 group-hover:text-slate-600'}
                    />
                    <span className={cn('font-medium', isActive && 'font-semibold text-violet-700')}>
                      {item.label}
                    </span>
                    {!isActive && (
                      <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-40 transition-opacity" />
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Monthly Goal */}
            <div className="pb-4 space-y-3 border-t border-slate-100 pt-4">
              <div className="bg-violet-50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500">เป้าหมายเดือนนี้</p>
                  <span className="text-xs font-bold text-violet-600">{goalProgress}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-base font-bold text-slate-800">{formatCurrency(monthlyTarget)}</p>
                  <TrendingUp size={15} className={goalProgress >= 75 ? 'text-emerald-500' : 'text-slate-300'} />
                </div>
                <div className="h-1.5 w-full bg-violet-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${goalProgress}%` }}
                    transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
                    className={cn(
                      "h-full rounded-full",
                      goalProgress >= 100 ? "bg-emerald-500" :
                      goalProgress >= 75  ? "bg-emerald-500" :
                      goalProgress >= 50  ? "bg-violet-500"  : "bg-violet-400"
                    )}
                  />
                </div>
              </div>

              <button
                onClick={() => { setLocalTarget(monthlyTarget); setIsSettingsOpen(true); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all text-xs font-medium"
              >
                <Settings size={15} /> ตั้งค่าเป้าหมาย
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-slate-100 z-20 shrink-0">
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
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                aria-label="การแจ้งเตือน"
                onClick={() => setIsNotifOpen(v => !v)}
                className="relative p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              >
                <Bell size={18} />
                {totalNotifs > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {totalNotifs > 9 ? '9+' : totalNotifs}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-10 w-96 bg-white rounded-2xl border border-slate-100 shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell size={14} className="text-violet-600" />
                        <span className="text-sm font-bold text-slate-800">การแจ้งเตือน</span>
                      </div>
                      <span className="text-xs text-slate-400">{totalNotifs} รายการ</span>
                    </div>

                    <div className="max-h-[460px] overflow-y-auto">
                      {totalNotifs === 0 && (
                        <div className="py-12 text-center space-y-2">
                          <CheckCircle2 size={26} className="text-emerald-400 mx-auto" />
                          <p className="text-xs font-medium text-slate-400">ทุกดีลอัพเดทแล้ว 🎉</p>
                        </div>
                      )}

                      {/* Today's Follow-ups */}
                      {pendingFollowUps.length > 0 && (
                        <div>
                          <div className="px-4 py-2 bg-amber-50/60 border-b border-amber-100 flex items-center gap-2">
                            <CalendarClock size={12} className="text-amber-600" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700">นัดติดตามวันนี้/เลยกำหนด</span>
                            <span className="ml-auto text-[10px] font-bold text-amber-700">{pendingFollowUps.length}</span>
                          </div>
                          <div className="divide-y divide-slate-50">
                            {pendingFollowUps.map(a => {
                              const overdue = new Date(a.scheduled_at).getTime() < new Date().setHours(0, 0, 0, 0);
                              return (
                                <button
                                  key={a.id}
                                  onClick={() => { navigate('/pipeline'); setIsNotifOpen(false); }}
                                  className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-start gap-3"
                                >
                                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                                    overdue ? 'bg-rose-100 text-rose-500' : 'bg-amber-100 text-amber-600'
                                  )}>
                                    <CalendarClock size={13} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-slate-800 truncate">{a.title}</p>
                                    <p className="text-xs text-slate-500 truncate">{a.deal.company || a.deal.title}</p>
                                  </div>
                                  {overdue && <span className="text-[9px] font-bold text-rose-600 uppercase">เลย</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Closing Soon */}
                      {closingSoon.length > 0 && (
                        <div>
                          <div className="px-4 py-2 bg-violet-50/60 border-b border-violet-100 flex items-center gap-2">
                            <Briefcase size={12} className="text-violet-600" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-700">คาดว่าจะปิดใน 7 วัน</span>
                            <span className="ml-auto text-[10px] font-bold text-violet-700">{closingSoon.length}</span>
                          </div>
                          <div className="divide-y divide-slate-50">
                            {closingSoon.map(d => (
                              <button
                                key={d.id}
                                onClick={() => { navigate('/pipeline'); setIsNotifOpen(false); }}
                                className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-start gap-3"
                              >
                                <div className="w-7 h-7 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center shrink-0 mt-0.5">
                                  <Briefcase size={13} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-slate-800 truncate">{d.title}</p>
                                  <div className="flex items-center justify-between text-xs mt-0.5">
                                    <span className="text-slate-500 truncate">{d.company}</span>
                                    <span className="text-violet-600 font-bold">{formatCurrency(d.value)}</span>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Stale */}
                      {staleDeals.length > 0 && (
                        <div>
                          <div className="px-4 py-2 bg-rose-50/60 border-b border-rose-100 flex items-center gap-2">
                            <AlertCircle size={12} className="text-rose-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-rose-700">หยุดนิ่ง 3+ วัน</span>
                            <span className="ml-auto text-[10px] font-bold text-rose-700">{staleDeals.length}</span>
                          </div>
                          <div className="divide-y divide-slate-50">
                            {staleDeals.map(d => {
                              // eslint-disable-next-line react-hooks/purity
                              const days = Math.floor((Date.now() - new Date(d.last_activity || d.created_at).getTime()) / 86_400_000);
                              return (
                                <button
                                  key={d.id}
                                  onClick={() => { navigate('/pipeline'); setIsNotifOpen(false); }}
                                  className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-start gap-3"
                                >
                                  <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                                    <Clock size={13} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-slate-800 truncate">{d.company || d.title}</p>
                                    <div className="flex items-center justify-between text-xs mt-0.5">
                                      <span className="text-rose-500 font-bold">{days} วันที่แล้ว</span>
                                      <span className="text-slate-400">{formatCurrency(d.value)}</span>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {totalNotifs > 0 && (
                      <div className="px-4 py-2.5 border-t border-slate-100">
                        <button
                          onClick={() => { navigate('/pipeline'); setIsNotifOpen(false); }}
                          className="text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors"
                        >
                          ดูดีลทั้งหมดใน Pipeline →
                        </button>
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
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
              className="p-6 min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Settings Modal */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-8 bg-white border-0 shadow-2xl">
          <DialogHeader className="mb-6 text-center">
            <DialogTitle className="text-xl font-bold text-slate-900">ตั้งค่าเป้าหมาย</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">เป้าหมายรายเดือน (บาท)</label>
              <Input
                type="number"
                value={localTarget}
                onChange={(e) => setLocalTarget(Number(e.target.value))}
                className="h-12 bg-slate-50 border-slate-200 rounded-2xl font-semibold text-lg text-center"
              />
            </div>
            <Button
              onClick={() => { setMonthlyTarget(localTarget); setIsSettingsOpen(false); }}
              className="w-full h-12 rounded-2xl font-semibold bg-violet-600 hover:bg-violet-700 text-white border-0 shadow-lg shadow-violet-500/25"
            >
              บันทึก
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Command Palette — now with real customers data */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        deals={deals}
        customers={customers}
      />
    </div>
  );
}
