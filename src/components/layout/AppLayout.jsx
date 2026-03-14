import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ListTree, Users, BarChart3,
  Menu, X, Sun, Moon, Wrench, Zap,
  Search, Sliders, Bell, Sparkles, DollarSign
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Dialog, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Input } from '../ui/Input';

const sidebarVariants = {
  open: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  closed: { x: '-100%', opacity: 0, transition: { duration: 0.3, ease: 'easeInOut' } }
};

const navItemVariants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  hover: { scale: 1.02, x: 5, transition: { duration: 0.2 } }
};

export default function AppLayout() {
  const { isSidebarOpen, closeSidebar, toggleSidebar, theme, setTheme, zenithMode, toggleZenithMode, monthlyTarget, setMonthlyTarget } = useAppStore();
  const location = useLocation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  useEffect(() => {
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
    { to: '/command', icon: LayoutDashboard, label: 'Command Room', badge: 'Active' },
    { to: '/pipeline', icon: ListTree, label: 'Sales Pipeline' },
    { to: '/customers', icon: Users, label: 'Customer Matrix' },
    { to: '/analytics', icon: BarChart3, label: 'Performance' },
    { to: '/tools', icon: Wrench, label: 'Strategy Tools' },
  ];

  return (
    <div className={cn(
      "flex h-screen w-screen bg-background text-foreground overflow-hidden font-sans",
      zenithMode && "zenith-theme"
    )}>
      {/* Premium Sidebar */}
      <AnimatePresence mode="wait">
        {(isSidebarOpen || isDesktop) && (
          <motion.aside
            initial="closed"
            animate="open"
            exit="closed"
            variants={sidebarVariants}
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-72 bg-card/80 backdrop-blur-3xl border-r border-border/40 px-6 flex flex-col shadow-2xl transition-colors duration-500",
              "lg:static lg:translate-x-0 lg:opacity-100"
            )}
          >
            {/* Logo Section */}
            <div className="h-24 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25 relative overflow-hidden group">
                  <Sparkles size={22} className="text-primary-foreground relative z-10 group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <span className="text-xl font-black tracking-tight block premium-gradient-text uppercase">Zenith</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Intelligence v4.0</p>
                  </div>
                </div>
              </div>
              <button onClick={closeSidebar} className="lg:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-8 space-y-1">
              {navItems.map((item, index) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => !isDesktop && closeSidebar()}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 relative overflow-hidden",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )
                  }
                >
                  <motion.div
                    variants={navItemVariants}
                    initial="initial"
                    animate="animate"
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3.5"
                  >
                    <item.icon size={20} className={cn("transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3")} />
                    <span>{item.label}</span>
                  </motion.div>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Bottom Section */}
            <div className="py-8 border-t border-border/40 mt-auto space-y-6">
              {/* System Stats */}
              <div className="px-4 py-4 rounded-3xl bg-muted/30 border border-border/20 space-y-3">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span>Engine Load</span>
                  <span className="text-primary">Optimized</span>
                </div>
                <div className="h-1.5 bg-background rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '65%' }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                  />
                </div>
              </div>

              {/* Utility Actions */}
              <div className="flex justify-between items-center bg-muted/50 p-1.5 rounded-[1.5rem]">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("w-12 h-12 rounded-2xl transition-all", zenithMode && "bg-primary text-primary-foreground shadow-lg shadow-primary/20")}
                  onClick={toggleZenithMode}
                >
                  <Zap size={20} className={zenithMode ? "fill-current" : ""} />
                </Button>
                <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl" onClick={() => setIsSettingsOpen(true)}>
                  <Sliders size={20} />
                </Button>
                <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl" onClick={toggleTheme}>
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </Button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Modern Header */}
        <header className="h-20 bg-background/60 backdrop-blur-3xl flex items-center justify-between px-8 z-20 border-b border-border/40">
          <div className="flex items-center gap-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleSidebar}
              className="lg:hidden p-3 bg-muted rounded-2xl text-foreground"
            >
              <Menu size={22} />
            </motion.button>

            {/* Search Interface */}
            <div className="hidden md:flex items-center gap-3 px-6 py-3 bg-muted/50 rounded-2xl border border-transparent hover:border-border/50 transition-all group min-w-[360px] cursor-text">
              <Search size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium text-muted-foreground">Neural Intelligence Search...</span>
              <kbd className="ml-auto px-2 py-0.5 rounded-md bg-background text-[10px] font-bold text-muted-foreground border border-border shadow-sm">⌘K</kbd>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Center */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-3 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-2xl transition-all relative"
              >
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full ring-2 ring-background ring-offset-0" />
              </motion.button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    className="absolute right-0 top-full mt-4 w-96 bg-card rounded-[2rem] shadow-2xl border border-border p-2 z-50"
                  >
                    <div className="p-4 border-b border-border/50">
                      <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Mission Logs</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto p-2 space-y-1">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 rounded-2xl hover:bg-muted transition-colors cursor-pointer group">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-bold">New Prospect Target</p>
                            <span className="text-[10px] font-bold text-primary">Just now</span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">Enterprise Cloud License - $450k Estimated Value</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-8 w-px bg-border/40 mx-2" />

            {/* Profile Section */}
            <div className="flex items-center gap-4 p-1.5 bg-muted/50 border border-border/40 rounded-2xl">
              <div className="hidden sm:block text-right px-2">
                <p className="text-sm font-black leading-none">Sorawit T.</p>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">Lead Architect</p>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent p-[2px]"
              >
                <div className="w-full h-full rounded-[9px] bg-background flex items-center justify-center font-black text-xs">
                  ST
                </div>
              </motion.div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Container */}
        <main className="flex-1 overflow-y-auto bg-background custom-scrollbar relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="p-8 min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>

          {/* Luxury Background Effects */}
          <div className="absolute top-0 right-0 -z-10 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
        </main>
      </div>

      {/* Modern Settings Overlay */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 bg-card rounded-[2.5rem] shadow-2xl border border-border max-w-lg mx-auto"
        >
          <DialogHeader className="mb-8">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">System Configuration</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Monthly Revenue Target</label>
              <div className="relative group">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                <Input
                  type="number"
                  defaultValue={monthlyTarget}
                  onChange={(e) => setMonthlyTarget(Number(e.target.value))}
                  className="h-14 pl-12 bg-muted/50 border-transparent rounded-[1.25rem] font-black text-lg"
                />
              </div>
            </div>
            <Button
              onClick={() => setIsSettingsOpen(false)}
              className="w-full h-14 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-[1.25rem] shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-95"
            >
              Apply Strategy
            </Button>
          </div>
        </motion.div>
      </Dialog>
    </div>
  );
}
