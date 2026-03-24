import { useState, useEffect, useMemo } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ListTree, Users, BarChart3,
  Menu, X, Wrench,
  Search, Sliders, Bell,
  ChevronRight, Target, ArrowUpCircle
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useDeals } from '../../hooks/useDeals';
import { useSettings } from '../../hooks/useSettings';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/formatters';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Input } from '../ui/Input';

const sidebarVariants = {
  open: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  closed: { x: '-100%', opacity: 0, transition: { duration: 0.3, ease: 'easeInOut' } }
};

export default function AppLayout() {
  const { isSidebarOpen, closeSidebar, toggleSidebar, zenithMode, toggleZenithMode, monthlyTarget, setMonthlyTarget, globalSearchTerm, setGlobalSearchTerm } = useAppStore();
  const { data: deals } = useDeals();
  const { data: settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [localTarget, setLocalTarget] = useState(monthlyTarget);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  // Sync monthly target from DB settings on first load
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

  useEffect(() => {
    if (zenithMode) {
      document.documentElement.classList.add('zenith-theme');
    } else {
      document.documentElement.classList.remove('zenith-theme');
    }
  }, [zenithMode]);

  // Calculate real goal progress
  const goalProgress = useMemo(() => {
    if (!deals || !monthlyTarget) return 0;
    const now = new Date();
    const wonThisMonth = deals
      .filter(d => d.stage === 'won' && new Date(d.created_at).getMonth() === now.getMonth() && new Date(d.created_at).getFullYear() === now.getFullYear())
      .reduce((s, d) => s + Number(d.value || 0), 0);
    return Math.min(100, Math.round((wonThisMonth / monthlyTarget) * 100));
  }, [deals, monthlyTarget]);

  // Header search navigation
  const handleSearch = (e) => {
    if (e.key === 'Enter' && globalSearchTerm.trim()) {
      navigate('/pipeline');
    }
  };

  const navItems = [
    { to: '/command', icon: LayoutDashboard, label: 'Command Center' },
    { to: '/pipeline', icon: ListTree, label: 'Sales Matrix' },
    { to: '/customers', icon: Users, label: 'Intelligence Index' },
    { to: '/analytics', icon: BarChart3, label: 'Performance Matrix' },
    { to: '/tools', icon: Wrench, label: 'Strategic Lab' },
  ];

  return (
    <div className="flex h-screen w-screen bg-[#FDFCFB] text-slate-900 overflow-hidden font-sans selection:bg-primary/10">
      {/* PREMIUM MINIMAL SIDEBAR */}
      <AnimatePresence mode="wait">
        {(isSidebarOpen || isDesktop) && (
          <motion.aside
            initial="closed"
            animate="open"
            exit="closed"
            variants={sidebarVariants}
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-72 bg-white/70 backdrop-blur-3xl border-r border-slate-200/60 px-6 flex flex-col transition-all duration-500",
              "lg:static lg:translate-x-0 lg:opacity-100",
              "shadow-[20px_0_40px_-20px_rgba(0,0,0,0.02)]"
            )}
          >
            {/* Header */}
            <div className="h-28 flex items-center justify-between border-b border-slate-100/10 mb-6">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <Target size={20} className="text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black tracking-tight text-slate-900 leading-none">ZENITH</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Rule Engine Alpha</span>
                </div>
              </div>
              <button onClick={closeSidebar} className="lg:hidden p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2 py-4">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => !isDesktop && closeSidebar()}
                    className={cn(
                      "group flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm transition-all duration-300 relative",
                      isActive
                        ? "bg-slate-900 text-white shadow-xl shadow-slate-900/10"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={cn(
                        "transition-transform duration-500 group-hover:scale-110",
                        isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-900"
                      )}>
                        <item.icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                      </div>
                      <span className={cn("font-bold tracking-tight", isActive ? "text-white" : "text-inherit")}>{item.label}</span>
                    </div>
                    {isActive && (
                      <motion.div layoutId="nav-glow" className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
                    )}
                    <ChevronRight size={14} className={cn("transition-all duration-300 opacity-0 group-hover:opacity-40 group-hover:translate-x-1", isActive && "hidden")} />
                  </NavLink>
                );
              })}
            </nav>

            {/* Bottom Insight Section — Real Goal Progress */}
            <div className="py-8 space-y-6 border-t border-slate-100">
               <div className="bg-slate-50/50 p-5 rounded-[2rem] border border-slate-100/50 space-y-4">
                  <div className="flex items-center justify-between">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Goal</p>
                     <p className="text-[10px] font-black text-primary">{goalProgress}%</p>
                  </div>
                  <div className="space-y-2">
                     <div className="flex justify-between items-end">
                        <p className="text-lg font-black text-slate-900 leading-none">{formatCurrency(monthlyTarget)}</p>
                        <ArrowUpCircle size={16} className={goalProgress >= 100 ? "text-emerald-500" : "text-slate-300"} />
                     </div>
                     <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${goalProgress}%` }}
                          className={cn("h-full rounded-full", goalProgress >= 75 ? "bg-emerald-500" : goalProgress >= 50 ? "bg-primary" : "bg-slate-900")}
                        />
                     </div>
                  </div>
               </div>

               {/* Action Center */}
               <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    className={cn("flex-1 h-12 rounded-2xl transition-all font-bold text-[10px] uppercase tracking-widest", zenithMode ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-500")}
                    onClick={toggleZenithMode}
                  >
                    <Sliders size={14} className="mr-2" /> Logic Engine
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400"
                    onClick={() => { setLocalTarget(monthlyTarget); setIsSettingsOpen(true); }}
                  >
                    <Sliders size={18} />
                  </Button>
               </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT SURFACE */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-white shadow-[0_0_80px_rgba(0,0,0,0.02)]">
        {/* Dynamic Header with working search */}
        <header className="h-20 flex items-center justify-between px-10 z-20 border-b border-slate-50">
          <div className="flex items-center gap-6">
            <button onClick={toggleSidebar} className="lg:hidden p-2 text-slate-400">
              <Menu size={22} />
            </button>
            <div className="hidden md:flex items-center gap-3">
               <Search size={18} className="text-slate-300" />
               <input
                 type="text"
                 placeholder="Search portfolio..."
                 value={globalSearchTerm}
                 onChange={(e) => setGlobalSearchTerm(e.target.value)}
                 onKeyDown={handleSearch}
                 className="text-xs font-bold uppercase tracking-widest text-slate-700 bg-transparent border-none outline-none placeholder:text-slate-300 w-48"
               />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="p-2 text-slate-400 relative">
              <Bell size={20} />
              <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full border-2 border-white" />
            </button>
            <div className="h-4 w-px bg-slate-100" />
            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-black text-slate-900 leading-none">Sorawit T.</p>
                  <p className="text-[9px] font-bold text-primary uppercase tracking-widest mt-1">System Architect</p>
                </div>
               <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-[10px] text-slate-900">
                  ST
               </div>
            </div>
          </div>
        </header>

        {/* Content View */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#FDFCFB]/50">
           <AnimatePresence mode="wait">
             <motion.div
               key={location.pathname}
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -15 }}
               transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
               className="p-10 min-h-full"
             >
               <Outlet />
             </motion.div>
           </AnimatePresence>
        </main>
      </div>

      {/* Settings Modal — Fixed with DialogContent and working setMonthlyTarget */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-sm rounded-[2.5rem] p-8 bg-white border-0 shadow-2xl">
          <DialogHeader className="mb-6 text-center">
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase">Configurations</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Monthly Target (THB)</label>
              <Input
                type="number"
                value={localTarget}
                onChange={(e) => setLocalTarget(Number(e.target.value))}
                className="h-14 bg-slate-50 border-none rounded-2xl font-black text-lg text-center"
              />
            </div>
            <Button 
              onClick={() => {
                setMonthlyTarget(localTarget);
                setIsSettingsOpen(false);
              }} 
              className="w-full h-14 rounded-full font-black uppercase tracking-widest shadow-xl shadow-primary/20"
            >
              Apply Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
