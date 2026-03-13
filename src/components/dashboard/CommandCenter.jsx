import { motion, AnimatePresence } from 'framer-motion';
import React, { useMemo, useState, useEffect } from 'react';
import {
  Sparkles, UserCheck, ShieldCheck, Flame, Cpu,
  Zap, Target, Bell, MessageSquare, Calendar, Clock,
  TrendingUp, AlertCircle, CheckCircle, ArrowUpRight,
  Users, Briefcase, DollarSign, Activity, BarChart3,
  Play, Pause, RotateCcw, MessageCircle, Mail, Phone,
  MoreVertical, Star, Award, ChevronRight, X
} from 'lucide-react';
import { CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';

const formatCurrency = (n) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', notation: 'compact' }).format(n || 0);
const formatFullCurrency = (n) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(n || 0);
const daysSince = (dateStr) => Math.floor((Date.now() - new Date(dateStr || Date.now())) / 86400000);
const formatTime = (date) => new Date(date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

// War Card Component
const WarCard = ({ children, className, delay = 0, gradient = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className={cn(
      "relative overflow-hidden rounded-3xl border backdrop-blur-xl shadow-xl",
      gradient ? "bg-gradient-to-br from-primary/20 via-purple-500/10 to-primary/20 border-primary/30" :
      "border-white/5 bg-black/40",
      className
    )}
  >
    {children}
  </motion.div>
);

// Team Unit Status Component
const TeamUnitStatus = ({ name, role, won, target, color, icon_type, activeNow }) => {
  const pct = Math.round((won / target) * 100);
  const gap = Math.max(0, target - won);
  const Icon = icon_type === 'ShieldCheck' ? ShieldCheck : UserCheck;

  return (
    <div className="p-5 rounded-[2rem] bg-white/5 border border-white/10 space-y-4 relative overflow-hidden group hover:bg-white/10 transition-all duration-300">
      {activeNow && (
        <div className="absolute top-3 right-3">
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-lg", color?.split(' ')[0] || 'bg-primary')}>
            <Icon size={22} className="text-white" />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-tight">{name}</h4>
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em]">{role}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn("text-2xl font-black tabular-nums", pct >= 100 ? "text-emerald-500" : pct >= 50 ? "text-amber-500" : "text-red-500")}>
            {pct}%
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest opacity-60">
          <span>Gap: {formatCurrency(gap)}</span>
          <span>{formatCurrency(won)} / {formatCurrency(target)}</span>
        </div>
        <div className="h-2 bg-black/60 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, pct)}%` }}
            transition={{ duration: 1, delay: 0.2 }}
            className={cn("h-full rounded-full", pct >= 100 ? "bg-emerald-500" : "bg-primary")}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button size="sm" variant="outline" className="flex-1 h-8 text-[8px] font-black uppercase tracking-widest border-white/10">
          <MessageCircle size={12} className="mr-1" /> Message
        </Button>
        <Button size="sm" className="flex-1 h-8 bg-primary/20 text-primary border border-primary/30 text-[8px] font-black uppercase tracking-widest">
          <BarChart3 size={12} className="mr-1" /> Review
        </Button>
      </div>
    </div>
  );
};

// Urgent Deal Node
const UrgentDealNode = React.memo(({ deal, onClick }) => {
  const days = daysSince(deal.lastActivity || deal.createdAt);
  const isUrgent = days >= 2;
  const isCritical = days >= 5;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.02, x: 4 }}
      onClick={() => onClick(deal)}
      className="flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-white/10 hover:bg-white/5 group"
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className={cn(
          "w-3 h-3 rounded-full shrink-0",
          isCritical ? "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse" :
          isUrgent ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "bg-emerald-500"
        )} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black tracking-tight truncate uppercase group-hover:text-primary transition-colors">{deal.title}</p>
          <div className="flex items-center gap-2 text-[8px] font-black text-muted-foreground uppercase mt-1">
            <span className="truncate">{deal.company}</span>
            <span className="text-primary font-black">{formatFullCurrency(deal.value)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={cn(
          "text-[8px] font-black border-white/10 shrink-0",
          isCritical ? "bg-red-500/20 text-red-400" :
          isUrgent ? "bg-amber-500/20 text-amber-400" :
          "bg-emerald-500/20 text-emerald-400"
        )}>
          {days}D IDLE
        </Badge>
        <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </motion.div>
  );
});
UrgentDealNode.displayName = "UrgentDealNode";

// Activity Feed Item
const ActivityFeedItem = ({ activity, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
  >
    <div className={cn(
      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
      activity.type === 'deal_won' ? "bg-emerald-500/20 text-emerald-500" :
      activity.type === 'deal_created' ? "bg-primary/20 text-primary" :
      activity.type === 'activity' ? "bg-amber-500/20 text-amber-500" :
      "bg-white/10 text-white"
    )}>
      {activity.type === 'deal_won' ? <CheckCircle size={14} /> :
       activity.type === 'deal_created' ? <Briefcase size={14} /> :
       activity.type === 'activity' ? <Activity size={14} /> :
       <Bell size={14} />}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium truncate">{activity.title}</p>
      <p className="text-[8px] text-muted-foreground mt-0.5">{activity.time}</p>
    </div>
  </motion.div>
);

// Quick Action Button
const QuickAction = ({ icon: Icon, label, onClick, color = "primary" }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all",
      color === "primary" ? "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20" :
      color === "emerald" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20" :
      color === "amber" ? "bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20" :
      "bg-white/5 border-white/10 hover:bg-white/10"
    )}
  >
    <Icon size={20} className="mb-2" />
    <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </motion.button>
);

// Notification Bell with Badge
const NotificationBell = ({ count, onClick }) => (
  <button
    onClick={onClick}
    className="relative p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
  >
    <Bell size={18} />
    {count > 0 && (
      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[9px] font-black flex items-center justify-center text-white">
        {count > 9 ? '9+' : count}
      </span>
    )}
  </button>
);

const CommandCenter = ({
  deals = [],
  teamMembers = [],
  monthlyGoal = 10000000,
  onDealClick,
  onAddDeal,
  onGeneratePlan,
  isGeneratingPlan,
  battlePlan,
  strategicMandates = [],
  isGeneratingMandates,
  onGenerateMandates,
  zenithMode
}) => {
  const [notificationCount, setNotificationCount] = useState(3);
  const [showNotifications, setShowNotifications] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  const [isFocusMode, setIsFocusMode] = useState(false);

  const stats = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), currentMonth + 1, 0).getDate();

    const wonDeals = deals.filter(d => d.stage === 'won' && new Date(d.createdAt).getMonth() === currentMonth);
    const totalWonValue = wonDeals.reduce((s, d) => s + (d.value || 0), 0);
    const activePipeline = deals.filter(d => !['won', 'lost'].includes(d.stage));
    const urgentDeals = activePipeline
      .filter(d => daysSince(d.lastActivity || d.createdAt) >= 2)
      .sort((a, b) => daysSince(b.lastActivity || b.createdAt) - daysSince(a.lastActivity || a.createdAt))
      .slice(0, 8);

    const pct = Math.round((totalWonValue / monthlyGoal) * 100);
    const expectedPace = (currentDay / daysInMonth) * 100;
    const pace = Math.round((totalWonValue / ((currentDay / daysInMonth) * monthlyGoal)) * 100);
    const dailyTarget = monthlyGoal / daysInMonth;
    const remaining = monthlyGoal - totalWonValue;
    const dailyNeeded = remaining / (daysInMonth - currentDay);

    // Today's activities (simulated)
    const todayActivities = [
      { id: 1, type: 'deal_won', title: 'Deal won: Enterprise License - ฿2.5M', time: '10:32 AM' },
      { id: 2, type: 'activity', title: 'Call scheduled with Acme Corp', time: '9:15 AM' },
      { id: 3, type: 'deal_created', title: 'New deal created: Cloud Migration', time: '8:45 AM' },
    ];

    return {
      totalWonValue,
      urgentDeals,
      pct,
      pace,
      expectedPace,
      dailyTarget,
      remaining,
      dailyNeeded,
      todayActivities,
      activeCount: activePipeline.length
    };
  }, [deals, monthlyGoal]);

  // Auto-generate battle plan on mount
  useEffect(() => {
    if (!battlePlan && onGeneratePlan) {
      onGeneratePlan();
    }
  }, []);

  return (
    <div className={cn("max-w-[1800px] mx-auto space-y-6 pb-10", zenithMode && "zenith-theme")}>
      {/* HEADER WITH NOTIFICATIONS */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-red-500/30">
            <Flame size={28} className="text-white fill-current animate-pulse" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Sales War Room</h1>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-1">Real-time Battle Command Center</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell count={notificationCount} onClick={() => setShowNotifications(!showNotifications)} />
          <Button
            onClick={onAddDeal}
            className="h-12 px-6 rounded-xl bg-primary font-black uppercase tracking-widest text-[9px] shadow-xl shadow-primary/20 hover:scale-105 transition-all"
          >
            <Briefcase size={16} className="mr-2" /> New Deal
          </Button>
        </div>
      </header>

      {/* MAIN PROGRESS BAR */}
      <WarCard gradient className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Captured</p>
                <p className="text-2xl font-black text-primary">{formatCurrency(stats.totalWonValue)}</p>
              </div>
              <div className="h-12 w-px bg-white/10" />
              <div className="text-center">
                <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Target</p>
                <p className="text-2xl font-black">{formatCurrency(monthlyGoal)}</p>
              </div>
              <div className="h-12 w-px bg-white/10" />
              <div className="text-center">
                <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Remaining</p>
                <p className="text-2xl font-black text-amber-500">{formatCurrency(stats.remaining)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Pace</p>
                <p className={cn("text-2xl font-black", stats.pace >= 100 ? "text-emerald-500" : stats.pace >= 80 ? "text-amber-500" : "text-red-500")}>
                  {stats.pace}%
                </p>
              </div>
              <Button
                onClick={onGeneratePlan}
                disabled={isGeneratingPlan}
                className="h-12 w-12 rounded-xl bg-white text-black hover:bg-primary hover:text-white transition-all shadow-xl"
              >
                {isGeneratingPlan ? <Cpu className="animate-spin" size={20} /> : <Zap size={20} />}
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="h-4 bg-black/40 rounded-full overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, stats.pct)}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full relative overflow-hidden",
                  stats.pct >= 100 ? "bg-gradient-to-r from-emerald-500 to-emerald-400" :
                  stats.pct >= 50 ? "bg-gradient-to-r from-primary to-indigo-400" :
                  "bg-gradient-to-r from-red-500 to-orange-400"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </motion.div>
            </div>
            {/* Pace marker */}
            <div
              className="absolute top-0 w-0.5 h-4 bg-white/50"
              style={{ left: `${stats.expectedPace}%` }}
            >
              <div className="absolute -top-6 -translate-x-1/2 text-[8px] font-black uppercase text-muted-foreground whitespace-nowrap">
                Expected
              </div>
            </div>
          </div>

          <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-muted-foreground">
            <span>Daily Target: {formatCurrency(stats.dailyTarget)}</span>
            <span>Need Daily: {formatCurrency(stats.dailyNeeded)}</span>
            <span>Active Pipeline: {stats.activeCount} deals</span>
          </div>
        </div>
      </WarCard>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN - Team & Urgent Deals */}
        <div className="lg:col-span-7 space-y-6">
          {/* TEAM STATUS */}
          <WarCard delay={0.1}>
            <CardHeader className="border-b border-white/5 px-6 py-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-black uppercase tracking-widest flex items-center gap-2">
                  <Users size={18} className="text-primary" /> Team Deployment Status
                </CardTitle>
                <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mt-1">Real-time performance tracking</p>
              </div>
              <Badge className="bg-primary/20 text-primary border-primary/30 font-black text-[8px]">
                {teamMembers.length} UNITS ACTIVE
              </Badge>
            </CardHeader>
            <CardContent className="p-4 grid md:grid-cols-2 gap-4">
              {teamMembers.map((m, i) => {
                const mWon = deals.filter(d => d.assigned_to === m.id && d.stage === 'won' && new Date(d.createdAt).getMonth() === new Date().getMonth()).reduce((s, d) => s + (d.value || 0), 0);
                return (
                  <TeamUnitStatus
                    key={m.id}
                    name={m.name}
                    role={m.role}
                    won={mWon}
                    target={m.goal}
                    color={m.color}
                    icon_type={m.icon_type}
                    activeNow={true}
                  />
                );
              })}
            </CardContent>
          </WarCard>

          {/* URGENT DEALS */}
          <WarCard delay={0.2}>
            <CardHeader className="border-b border-white/5 px-6 py-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-black uppercase tracking-widest flex items-center gap-2 text-red-400">
                  <AlertCircle size={18} className="text-red-500" /> Follow-up Matrix
                </CardTitle>
                <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mt-1">Stagnant signals requiring immediate action</p>
              </div>
              <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 font-black text-[8px] animate-pulse">
                {stats.urgentDeals.length} LEAK ALERTS
              </Badge>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                {stats.urgentDeals.length > 0 ? (
                  stats.urgentDeals.map((deal) => (
                    <UrgentDealNode key={deal.id} deal={deal} onClick={onDealClick} />
                  ))
                ) : (
                  <div className="py-16 text-center">
                    <CheckCircle size={40} className="mx-auto mb-3 text-emerald-500" />
                    <p className="text-sm font-black uppercase text-emerald-500">All Clear - No Stagnant Deals</p>
                  </div>
                )}
              </div>
            </CardContent>
          </WarCard>
        </div>

        {/* RIGHT COLUMN - AI Insights & Activities */}
        <div className="lg:col-span-5 space-y-6">
          {/* BATTLE PLAN */}
          <WarCard delay={0.3} gradient>
            <CardHeader className="px-6 py-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Sparkles size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-black uppercase tracking-widest">Battle Directives</CardTitle>
                    <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">AI-Generated Strategy</p>
                  </div>
                </div>
                <Button
                  onClick={onGeneratePlan}
                  disabled={isGeneratingPlan}
                  size="sm"
                  className="h-8 bg-white/20 text-white border border-white/30 text-[8px] font-black uppercase tracking-widest"
                >
                  {isGeneratingPlan ? <RotateCcw className="animate-spin" size={12} /> : <RotateCcw size={12} />}
                  Regenerate
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isGeneratingPlan ? (
                <div className="space-y-3">
                  <div className="h-3 bg-white/10 rounded-full animate-pulse" />
                  <div className="h-3 bg-white/10 rounded-full animate-pulse w-5/6" />
                  <div className="h-3 bg-white/10 rounded-full animate-pulse w-4/6" />
                </div>
              ) : battlePlan ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 bg-black/40 rounded-xl border border-white/5"
                >
                  <p className="text-sm font-bold leading-relaxed italic uppercase tracking-wide">
                    {battlePlan}
                  </p>
                </motion.div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Initialize AI strategy generation...</p>
              )}
            </CardContent>
          </WarCard>

          {/* STRATEGIC MANDATES */}
          <WarCard delay={0.4}>
            <CardHeader className="px-6 py-4 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <Target size={16} className="text-amber-500" /> Strategic Mandates
                  </CardTitle>
                  <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mt-1">High-impact action items</p>
                </div>
                <Button
                  onClick={onGenerateMandates}
                  disabled={isGeneratingMandates}
                  size="sm"
                  variant="outline"
                  className="h-8 border-white/10 text-[8px] font-black uppercase tracking-widest"
                >
                  {isGeneratingMandates ? <Cpu className="animate-spin" size={12} /> : <Sparkles size={12} />}
                  Generate
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {strategicMandates.slice(0, 3).map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className={cn(
                    "p-4 rounded-2xl border flex gap-3 items-start",
                    m.urgency === 'high' ? "bg-red-500/10 border-red-500/20" :
                    m.urgency === 'medium' ? "bg-amber-500/10 border-amber-500/20" :
                    "bg-white/5 border-white/10"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    m.urgency === 'high' ? "bg-red-500/20 text-red-500" :
                    m.urgency === 'medium' ? "bg-amber-500/20 text-amber-500" :
                    "bg-primary/20 text-primary"
                  )}>
                    <Target size={16} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[9px] font-black uppercase text-white leading-tight">{m.mandate}</h4>
                    <p className="text-[10px] text-muted-foreground font-medium mt-1">{m.desc}</p>
                  </div>
                  {m.urgency === 'high' && (
                    <Badge className="bg-red-500 text-white text-[7px] font-black uppercase">Urgent</Badge>
                  )}
                </motion.div>
              ))}
            </CardContent>
          </WarCard>

          {/* TODAY'S ACTIVITY FEED */}
          <WarCard delay={0.5}>
            <CardHeader className="px-6 py-4 border-b border-white/5">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Activity size={16} className="text-emerald-500" /> Today's Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              {stats.todayActivities.map((activity, i) => (
                <ActivityFeedItem key={activity.id} activity={activity} index={i} />
              ))}
            </CardContent>
          </WarCard>

          {/* QUICK ACTIONS */}
          <WarCard delay={0.6}>
            <CardHeader className="px-6 py-4 border-b border-white/5">
              <CardTitle className="text-sm font-black uppercase tracking-widest">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-4 gap-3">
                <QuickAction icon={Phone} label="Log Call" color="primary" />
                <QuickAction icon={Mail} label="Send Email" color="emerald" />
                <QuickAction icon={Calendar} label="Schedule" color="amber" />
                <QuickAction icon={MessageSquare} label="Note" color="default" />
              </div>
            </CardContent>
          </WarCard>
        </div>
      </div>

      {/* NOTIFICATIONS DROPDOWN */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 right-4 w-80 bg-black/95 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-3xl"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest">Notifications</h3>
              <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-white/10 rounded-lg">
                <X size={16} />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 hover:bg-white/5 rounded-xl cursor-pointer">
                  <p className="text-xs font-medium">Deal updated: Enterprise Deal #{i}</p>
                  <p className="text-[8px] text-muted-foreground mt-1">{i} hour ago</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommandCenter;
