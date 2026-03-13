import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, ListTree, Users, BarChart3,
  Menu, X, Sun, Moon, Wrench, Zap,
  Search, ChevronRight, Sliders, DollarSign
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Dialog, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Input } from '../ui/Input';

export default function AppLayout() {
  const { isSidebarOpen, closeSidebar, toggleSidebar, theme, setTheme, zenithMode, toggleZenithMode, monthlyTarget, setMonthlyTarget } = useAppStore();
  const location = useLocation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (zenithMode) {
      document.documentElement.classList.add('zenith-theme');
    } else {
      document.documentElement.classList.remove('zenith-theme');
    }
  }, [theme, zenithMode]);

  const navItems = [
    { to: '/command', icon: Home, label: 'Command' },
    { to: '/pipeline', icon: ListTree, label: 'Pipeline' },
    { to: '/customers', icon: Users, label: 'Clients' },
    { to: '/analytics', icon: BarChart3, label: 'Insight' },
    { to: '/tools', icon: Wrench, label: 'Lab' },
  ];

  return (
    <div className={cn(
      "flex h-screen w-screen bg-[#050505] text-foreground overflow-hidden font-sans selection:bg-primary/30",
      zenithMode && "zenith-theme"
    )}>
      {/* HUD SIDEBAR */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-white/5 bg-black/40 backdrop-blur-3xl px-6 flex flex-col transition-all duration-700 ease-[0.23,1,0.32,1] lg:static lg:translate-x-0",
          isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div className="h-28 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-2xl shadow-primary/20">
              <Zap size={22} className="text-white fill-current" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tighter uppercase italic leading-none block">Zenith</span>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em] mt-1 opacity-60">System v2.0</p>
            </div>
          </motion.div>
          <button onClick={closeSidebar} className="lg:hidden text-muted-foreground hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 py-8 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeSidebar}
              className={({ isActive }) =>
                cn(
                  "group flex items-center justify-between px-4 py-3.5 rounded-2xl text-[10px] font-black transition-all duration-500 uppercase tracking-[0.2em]",
                  isActive
                    ? "bg-white text-black shadow-2xl scale-[1.05] translate-x-1"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )
              }
            >
              <div className="flex items-center gap-4">
                <item.icon size={18} className="transition-transform group-hover:scale-110" />
                <span>{item.label}</span>
              </div>
              <ChevronRight size={14} className={cn("opacity-0 transition-all duration-500 -translate-x-2", "group-hover:opacity-100 group-hover:translate-x-0")} />
            </NavLink>
          ))}
        </nav>

        <div className="py-8 border-t border-white/5 mt-auto space-y-6">
           {/* System Status HUD */}
           <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
              <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                <span className="text-muted-foreground/60 tracking-[0.2em]">Neural Pulse</span>
                <span className="text-emerald-500 flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="h-full w-1/2 bg-gradient-to-r from-transparent via-primary to-transparent"
                />
              </div>
           </div>

          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              className={cn("flex-1 justify-center h-12 rounded-xl border border-white/5", zenithMode && "text-primary bg-primary/5")} 
              onClick={toggleZenithMode}
            >
              <Zap size={18} className={zenithMode ? "fill-primary" : ""} />
            </Button>
            <Button variant="ghost" className="flex-1 justify-center h-12 rounded-xl border border-white/5" onClick={() => setIsSettingsOpen(true)}>
              <Sliders size={18} />
            </Button>
            <Button variant="ghost" className="flex-1 justify-center h-12 rounded-xl border border-white/5" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
          </div>
        </div>
      </aside>

      {/* COMMAND INTERFACE */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 border-b border-white/5 bg-black/20 backdrop-blur-3xl flex items-center justify-between px-10 z-20">
          <div className="flex items-center gap-8">
            <button onClick={toggleSidebar} className="lg:hidden p-2 -ml-2 text-muted-foreground hover:bg-white/5 rounded-xl transition-all">
              <Menu size={24} />
            </button>
            <div className="hidden md:flex items-center gap-3 px-5 py-2.5 bg-white/5 rounded-xl border border-white/5 text-muted-foreground hover:text-white cursor-pointer transition-all duration-500 group">
               <Search size={16} className="group-hover:scale-110 transition-transform" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Access Matrix (⌘K)</span>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden sm:flex items-center gap-3 text-right">
               <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Network Status</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Node Secure</span>
               </div>
               <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 p-[1px] shadow-2xl group cursor-pointer">
               <div className="w-full h-full rounded-[11px] bg-[#050505] flex items-center justify-center font-black text-xs uppercase tracking-tighter group-hover:bg-transparent transition-colors duration-500">
                  SW
               </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#0a0a0a] custom-scrollbar relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="p-4 lg:p-8 min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>

          {/* AMBIENT ATMOSPHERE - Simplified for performance */}
          <div className="absolute top-0 right-0 -z-10 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        </main>
      </div>

      {/* SETTINGS HUD */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <div className="p-8">
          <DialogHeader className="mb-8 border-b border-white/5 pb-6">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Command Parameters</DialogTitle>
          </DialogHeader>
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Quota Target (Monthly)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                <Input 
                  type="number" 
                  defaultValue={monthlyTarget} 
                  onChange={(e) => setMonthlyTarget(Number(e.target.value))}
                  className="h-14 pl-12 bg-white/5 border-white/10 rounded-2xl font-black text-xl tabular-nums focus:ring-primary/50"
                />
              </div>
            </div>
            <Button 
              onClick={() => setIsSettingsOpen(false)}
              className="w-full h-14 bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all"
            >
              Sync Matrix Parameters
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
