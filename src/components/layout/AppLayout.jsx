import { useState, useEffect, useMemo } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ListTree, Users, BarChart3,
  Menu, X, Wrench,
  Search, Settings, Bell,
  ChevronRight, Target, TrendingUp
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useDeals } from '../../hooks/useDeals';
import { useCustomers } from '../../hooks/useCustomers';
import { useSettings } from '../../hooks/useSettings';
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
  const { user } = useAuth();
  const location = useLocation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [localTarget, setLocalTarget] = useState(monthlyTarget);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

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
            <button aria-label="การแจ้งเตือน" className="relative p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
              <Bell size={18} />
              <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-violet-500 rounded-full" />
            </button>
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
