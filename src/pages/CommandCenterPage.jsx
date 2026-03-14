import { useState, useEffect, useMemo } from 'react';
import { useDeals } from '../hooks/useDeals';
import { useTeam } from '../hooks/useTeam';
import { useSettings } from '../hooks/useSettings';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import {
  Zap, Target, Users, AlertCircle,
  Sparkles, Loader2,
  TrendingUp, ShieldCheck, Crosshair, Trophy
} from 'lucide-react';

const formatCurrency = (n) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', notation: 'compact' }).format(n || 0);
const daysSince = (dateStr) => Math.floor((Date.now() - new Date(dateStr || Date.now())) / 86400000);

// Rule Engine - Strategic Intelligence
const RuleEngine = {
  generateBattlePlan: (deals) => {
    const today = new Date();
    const currentMonth = today.getMonth();

    const urgentDeals = deals
      .filter(d => !['won', 'lost'].includes(d.stage))
      .filter(d => daysSince(d.last_activity || d.created_at) >= 3)
      .sort((a, b) => daysSince(b.last_activity || b.created_at) - daysSince(a.last_activity || a.created_at))
      .slice(0, 5);

    const highValueDeals = deals
      .filter(d => d.stage === 'negotiation' && Number(d.value) >= 500000)
      .slice(0, 3);

    const monthDeals = deals.filter(d =>
      d.stage === 'won' &&
      new Date(d.created_at).getMonth() === currentMonth
    );
    const totalWon = monthDeals.reduce((s, d) => s + Number(d.value), 0);

    const plan = [];

    if (urgentDeals.length > 0) {
      plan.push(`Critical: Execute immediate follow-up on ${urgentDeals.length} high-risk assets.`);
    }

    if (highValueDeals.length > 0) {
      plan.push(`High Value: Prioritize closing sequence for ${highValueDeals.length} premium contracts.`);
    }

    plan.push(`Trajectory: Monthly capture is at ${formatCurrency(totalWon)}. Accelerate pipeline conversion.`);

    return {
      plan: plan.join('\n\n'),
      urgentCount: urgentDeals.length,
      highValueCount: highValueDeals.length,
      totalWon
    };
  },

  generateStrategicMandates: (deals) => {
    const mandates = [];
    const wonDeals = deals.filter(d => d.stage === 'won');
    const lostDeals = deals.filter(d => d.stage === 'lost');
    const winRate = (wonDeals.length / (wonDeals.length + lostDeals.length)) * 100 || 0;

    if (winRate < 40) {
      mandates.push({
        mandate: "Optimize Strike Rate",
        desc: `Current efficiency: ${Math.round(winRate)}%. Mandate: Refine lead qualification protocols.`,
        urgency: "high",
        metric: `${Math.round(winRate)}% Efficiency`
      });
    }

    const staleDeals = deals.filter(d =>
      !['won', 'lost'].includes(d.stage) &&
      daysSince(d.last_activity || d.created_at) > 5
    );

    if (staleDeals.length > 3) {
      mandates.push({
        mandate: "Asset Reclamation",
        desc: `${staleDeals.length} assets are nearing expiration. Initiate re-engagement sequence.`,
        urgency: "high",
        metric: `${staleDeals.length} Assets`
      });
    }

    const activeDeals = deals.filter(d => !['won', 'lost'].includes(d.stage));
    const pipelineValue = activeDeals.reduce((s, d) => s + Number(d.value), 0);

    if (pipelineValue < 5000000) {
      mandates.push({
        mandate: "Pipeline Saturation",
        desc: `Reserve levels below threshold (${formatCurrency(pipelineValue)}). Deploy outreach initiatives.`,
        urgency: "medium",
        metric: formatCurrency(pipelineValue)
      });
    }

    if (mandates.length === 0) {
      mandates.push({
        mandate: "Operational Excellence",
        desc: "All systems nominal. Maintain current velocity and monitor edge cases.",
        urgency: "low",
        metric: "Operational"
      });
    }

    return mandates.slice(0, 3);
  }
};

export default function CommandCenterPage() {
  const { data: deals, isLoading: dealsLoading } = useDeals();
  const { data: teamMembers, isLoading: teamLoading } = useTeam();
  const { data: settings, isLoading: settingsLoading } = useSettings();

  const [battlePlan, setBattlePlan] = useState(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [strategicMandates, setStrategicMandates] = useState([]);
  const [isGeneratingMandates, setIsGeneratingMandates] = useState(false);

  const monthlyGoal = settings?.monthly_target || 10000000;

  const stats = useMemo(() => {
    if (!deals) return null;
    const today = new Date();
    const currentMonth = today.getMonth();

    const wonDeals = deals.filter(d => d.stage === 'won' && new Date(d.created_at).getMonth() === currentMonth);
    const totalWonValue = wonDeals.reduce((s, d) => s + (Number(d.value) || 0), 0);
    const activePipeline = deals.filter(d => !['won', 'lost'].includes(d.stage));
    const urgentDeals = activePipeline
      .filter(d => daysSince(d.last_activity || d.created_at) >= 2)
      .sort((a, b) => daysSince(b.last_activity || b.created_at) - daysSince(a.last_activity || a.created_at))
      .slice(0, 5);

    const pct = Math.round((totalWonValue / monthlyGoal) * 100);

    return { totalWonValue, urgentDeals, pct, activeCount: activePipeline.length };
  }, [deals, monthlyGoal]);

  const handleGeneratePlan = () => {
    if (!deals) return;
    setIsGeneratingPlan(true);
    setTimeout(() => {
      const result = RuleEngine.generateBattlePlan(deals);
      setBattlePlan(result);
      setIsGeneratingPlan(false);
    }, 1200);
  };

  const handleGenerateMandates = () => {
    if (!deals) return;
    setIsGeneratingMandates(true);
    setTimeout(() => {
      const result = RuleEngine.generateStrategicMandates(deals);
      setStrategicMandates(result);
      setIsGeneratingMandates(false);
    }, 1200);
  };

  useEffect(() => {
    if (!battlePlan && deals) handleGeneratePlan();
    if (strategicMandates.length === 0 && deals) handleGenerateMandates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deals]);

  const isLoading = dealsLoading || teamLoading || settingsLoading;

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
      <motion.div
        animate={{ rotate: 360, scale: [1, 1.2, 1], borderRadius: ["20%", "50%", "20%"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-16 h-16 bg-primary/20 flex items-center justify-center border-2 border-primary/50"
      >
        <Zap className="text-primary" size={32} />
      </motion.div>
      <p className="text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">Initializing Command...</p>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto space-y-12 pb-20"
    >
      {/* Strategic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-primary" />
              <span className="text-[10px] font-black uppercase tracking-wider text-primary leading-none">Security Level: Alpha</span>
            </div>
          </div>
          <h1 className="text-5xl font-black tracking-tighter premium-gradient-text uppercase">COMMAND CENTER</h1>
          <p className="text-muted-foreground font-medium">Real-time planetary sales overview and strategic intelligence.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => window.location.href = '/pipeline'} className="btn-zenith-primary">
            <Crosshair size={18} className="mr-2" /> Deploy Resource
          </Button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="premium-card bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <CardContent className="p-0">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                <Trophy size={24} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Captured Revenue</p>
                <h2 className="text-3xl font-black tabular-nums">{formatCurrency(stats?.totalWonValue)}</h2>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                <span>Objective Progress</span>
                <span className="text-primary">{stats?.pct}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, stats?.pct || 0)}%` }}
                  transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardContent className="p-0">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Active Pipeline</p>
                <h2 className="text-3xl font-black tabular-nums">{stats?.activeCount} Units</h2>
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">Assets currently in transition through engagement sectors.</p>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardContent className="p-0">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-destructive/20 flex items-center justify-center text-destructive">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">High Urgency</p>
                <h2 className="text-3xl font-black tabular-nums">{stats?.urgentDeals?.length} Risks</h2>
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">Immediate reclamation protocols required for these sectors.</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Battle Intelligence column */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Sparkles size={18} className="text-primary" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight">Battle Intelligence</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={handleGeneratePlan} disabled={isGeneratingPlan} className="rounded-xl font-bold">
              {isGeneratingPlan ? <Loader2 className="animate-spin mr-2" size={14} /> : <Zap size={14} className="mr-2" />} Reload Intel
            </Button>
          </div>

          <div className="space-y-4">
            {battlePlan?.plan.split('\n\n').map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-[2rem] bg-card border border-border/40 hover:border-primary/30 transition-all group"
              >
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                    0{i + 1}
                  </div>
                  <p className="text-sm leading-relaxed font-semibold group-hover:text-foreground transition-colors">{item}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Tactical Status column */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-xl">
                <Target size={18} className="text-accent" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight">Tactical Status</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={handleGenerateMandates} disabled={isGeneratingMandates} className="rounded-xl font-bold">
              {isGeneratingMandates ? <Loader2 className="animate-spin mr-2" size={14} /> : <Target size={14} className="mr-2" />} Deploy Target
            </Button>
          </div>

          <div className="space-y-4">
            {strategicMandates.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "p-6 rounded-[2rem] border relative overflow-hidden group transition-all",
                  m.urgency === 'high' ? "bg-destructive/5 border-destructive/20" : "bg-card border-border/40"
                )}
              >
                <div className="flex items-start justify-between relative z-10">
                  <div className="space-y-1">
                    <p className={cn("text-xs font-black uppercase tracking-widest", m.urgency === 'high' ? "text-destructive" : "text-primary")}>
                      {m.urgency} Priority Mandate
                    </p>
                    <h4 className="text-lg font-black">{m.mandate}</h4>
                    <p className="text-sm text-muted-foreground font-medium">{m.desc}</p>
                  </div>
                  <div className="px-3 py-1 bg-background border border-border rounded-full text-[10px] font-black uppercase tracking-wider">
                    {m.metric}
                  </div>
                </div>
                <div className={cn(
                  "absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 rounded-full -mr-16 -mt-16",
                  m.urgency === 'high' ? "bg-destructive" : "bg-primary"
                )} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Resources & Assets */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-xl">
            <Users size={18} className="text-foreground" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight">Field Operatives</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamMembers?.map((m, i) => {
            const mWon = deals?.filter(d => d.assigned_to === m.id && d.stage === 'won' && new Date(d.created_at).getMonth() === new Date().getMonth()).reduce((s, d) => s + (Number(d.value) || 0), 0) || 0;
            const pct = Math.round((mWon / (m.goal || 1)) * 100);
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="premium-card group"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-xl", m.color?.split(' ')[0] || 'bg-primary')}>
                    {m.name?.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black leading-none group-hover:text-primary transition-colors">{m.name}</h4>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{m.role}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Efficiency</p>
                      <p className="text-xl font-black tabular-nums">{pct}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Metric</p>
                      <p className="text-sm font-black text-primary">{formatCurrency(mWon)}</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, pct)}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="h-full bg-primary rounded-full group-hover:shadow-[0_0_10px_rgba(var(--primary),0.5)] transition-shadow"
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
