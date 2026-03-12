import { motion } from 'framer-motion';
import React, { useMemo } from 'react';
import {
  Sparkles,
  UserCheck, ShieldCheck, Flame, Cpu,
  Zap, Target
} from 'lucide-react';
import { CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

const formatCurrency = (n) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', notation: 'compact' }).format(n || 0);
const formatFullCurrency = (n) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(n || 0);
const daysSince = (dateStr) => Math.floor((Date.now() - new Date(dateStr || Date.now())) / 86400000);

// --- Elite War Room UI (Simplified for Performance) ---

const WarCard = ({ children, className, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3, delay }}
    className={cn(
      "relative overflow-hidden rounded-3xl border border-white/5 bg-black/40 shadow-xl",
      className
    )}
  >
    {children}
  </motion.div>
);

const TeamUnitStatus = ({ name, role, won, target, color, icon_type }) => {
  const pct = Math.round((won / target) * 100);
  const gap = Math.max(0, target - won);
  const Icon = icon_type === 'ShieldCheck' ? ShieldCheck : UserCheck;
  
  return (
    <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 space-y-4 relative overflow-hidden group hover:bg-white/10 transition-colors">
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-lg", color)}>
            <Icon size={24} className="text-white" />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-tight">{name}</h4>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">{role}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black tabular-nums">{pct}%</p>
        </div>
      </div>

      <div className="space-y-2 relative z-10">
        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-60">
          <span>Gap: {formatCurrency(gap)}</span>
          <span>{formatCurrency(won)} / {formatCurrency(target)}</span>
        </div>
        <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, pct)}%` }}
            transition={{ duration: 1 }}
            className={cn("h-full rounded-full", color.split(' ')[0])}
          />
        </div>
      </div>
    </div>
  );
};

const UrgentDealNode = React.memo(({ deal, onClick }) => {
  const days = daysSince(deal.lastActivity || deal.createdAt);
  const isUrgent = days >= 2;
  
  return (
    <div
      onClick={() => onClick(deal)}
      className="flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-colors border border-transparent hover:border-white/10 hover:bg-white/5"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className={cn(
          "w-3 h-3 rounded-full shrink-0",
          isUrgent ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse" : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
        )} />
        <div className="min-w-0">
          <p className="text-sm font-black tracking-tight truncate uppercase">{deal.title}</p>
          <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase mt-1">
            <span className="truncate">{deal.company}</span>
            <span className="text-primary font-black">{formatFullCurrency(deal.value)}</span>
          </div>
        </div>
      </div>
      <Badge variant="outline" className={cn(
        "text-[9px] font-black border-white/10 shrink-0",
        isUrgent ? "text-red-400" : "text-emerald-400"
      )}>
        {days}D IDLE
      </Badge>
    </div>
  );
});
UrgentDealNode.displayName = "UrgentDealNode";

const CommandCenter = ({
  deals,
  teamMembers = [],
  monthlyGoal,
  onDealClick,
  onGeneratePlan,
  isGeneratingPlan,
  battlePlan,
  strategicMandates = [],
  zenithMode
}) => {
  const stats = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    
    const wonDeals = deals.filter(d => d.stage === 'won' && new Date(d.createdAt).getMonth() === currentMonth);
    const totalWonValue = wonDeals.reduce((s, d) => s + (d.value || 0), 0);
    const activePipeline = deals.filter(d => !['won', 'lost'].includes(d.stage));
    const urgentDeals = activePipeline
      .sort((a, b) => daysSince(b.lastActivity || b.createdAt) - daysSince(a.lastActivity || a.createdAt))
      .slice(0, 10);

    const pct = Math.round((totalWonValue / monthlyGoal) * 100);
    const pace = Math.round((totalWonValue / (today.getDate() / 30 * monthlyGoal)) * 100);

    return { totalWonValue, urgentDeals, pct, pace };
  }, [deals, monthlyGoal]);

  return (
    <div className={cn(
      "max-w-[1600px] mx-auto space-y-8",
      zenithMode && "zenith-theme"
    )}>
      {/* COMPACT HUD */}
      <header className="bg-primary/10 p-8 rounded-[2rem] border border-primary/20 backdrop-blur-xl relative overflow-hidden group shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Flame size={28} className="text-primary-foreground fill-current animate-pulse" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter uppercase italic text-white">Sales War Room</h1>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mt-1">Target: {formatFullCurrency(monthlyGoal)}</p>
            </div>
          </div>

          <div className="flex-1 max-w-md w-full space-y-2 text-center md:text-left">
            <div className="flex justify-between items-end px-1">
              <span className="text-xs font-black uppercase text-muted-foreground">Captured: {formatCurrency(stats.totalWonValue)}</span>
              <span className={cn("text-lg font-black", stats.pace >= 100 ? "text-emerald-400" : "text-amber-400")}>Pace: {stats.pace}%</span>
            </div>
            <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, stats.pct)}%` }}
                className="h-full rounded-full bg-primary"
              />
            </div>
          </div>

          <Button 
            onClick={onGeneratePlan} 
            disabled={isGeneratingPlan}
            className="h-16 w-16 rounded-2xl bg-white text-black hover:bg-primary hover:text-white transition-all shadow-xl flex-shrink-0"
          >
            {isGeneratingPlan ? <Cpu className="animate-spin" size={24} /> : <Zap size={24} />}
          </Button>
        </div>
      </header>

      {/* UNIT STATUS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teamMembers.map(m => {
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
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <WarCard className="h-full">
            <CardHeader className="border-b border-white/5 px-6 py-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black uppercase text-red-400 italic">Follow-up Matrix</CardTitle>
                <p className="text-[9px] font-black text-muted-foreground uppercase mt-1">Stagnant Signal Monitor</p>
              </div>
              <Badge className="bg-red-500/20 text-red-400 border border-red-500/20 font-black">LEAK ALERT</Badge>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-1 max-h-[500px] overflow-y-auto custom-scrollbar">
                {stats.urgentDeals.length > 0 ? (
                  stats.urgentDeals.map((deal) => (
                    <UrgentDealNode key={deal.id} deal={deal} onClick={onDealClick} />
                  ))
                ) : (
                  <div className="py-20 text-center opacity-20"><ShieldCheck size={40} className="mx-auto mb-2" /><p className="text-xs font-black uppercase">Cleared</p></div>
                )}
              </div>
            </CardContent>
          </WarCard>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <WarCard className="bg-primary text-primary-foreground border-none">
            <CardHeader className="px-6 py-6 border-b border-white/10">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-3">
                <Sparkles size={18} /> Battle Directives
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-sm font-bold leading-relaxed italic uppercase italic">
              {battlePlan || "Awaiting intelligence cycle..."}
            </CardContent>
          </WarCard>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-muted-foreground px-2">Strategic Directives</h3>
            <div className="space-y-3">
              {strategicMandates.slice(0, 3).map((m, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 border border-primary/20">
                    <Target size={20} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="text-[9px] font-black uppercase text-white leading-tight">{m.mandate}</h4>
                    <p className="text-[11px] text-muted-foreground font-bold mt-1">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;
