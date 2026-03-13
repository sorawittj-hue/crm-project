import { useMemo, useState, useEffect } from 'react';
import { useDeals } from '../hooks/useDeals';
import { useSettings } from '../hooks/useSettings';
import { useTeam } from '../hooks/useTeam';
import {
  Loader2, TrendingUp, TrendingDown, Target, Layers, Activity, Zap, Sparkles,
  ArrowUpRight, ArrowDownRight, Users, PieChart as PieChartIcon, BarChart3,
  Calendar, DollarSign, Briefcase, CheckCircle, AlertCircle, Clock, Filter,
  Download, RefreshCw, Eye, Brain, Lightbulb, Award, Flame, Star,
  Wallet, UserCheck, Timer, TrendingDown as TrendingDownIcon, GitCommit,
  MoveUpRight, TrendingUp as TrendingUpIcon, Coins, Hourglass, Trophy,
  ZapOff, Gauge, TimerReset, BarChart3 as BarChartIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  ComposedChart, Legend, ScatterChart, Scatter, ZAxis, RadialBarChart, RadialBar
} from 'recharts';
import { cn } from '../lib/utils';
import { callGeminiAPI } from '../services/ai';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';

const formatCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', notation: 'compact' }).format(amount || 0);
const formatFullCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount || 0);
const formatNumber = (num) => new Intl.NumberFormat('th-TH').format(num || 0);
const formatPercent = (num) => `${Math.round(num || 0)}%`;

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/95 backdrop-blur-2xl border border-white/10 p-5 rounded-2xl shadow-2xl">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">{label}</p>
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{entry.name}</span>
              </div>
              <p className="text-sm font-black tabular-nums">
                {formatter ? formatter(entry.value) : formatFullCurrency(entry.value)}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Metric Card Component
const MetricCard = ({ title, value, subValue, icon: Icon, trend, trendValue, color = "primary", onClick }) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -4 }}
    onClick={onClick}
    className={cn(
      "cursor-pointer relative overflow-hidden rounded-[2rem] p-6 backdrop-blur-xl border transition-all duration-300",
      color === "primary" ? "bg-primary/10 border-primary/20" :
      color === "emerald" ? "bg-emerald-500/10 border-emerald-500/20" :
      color === "amber" ? "bg-amber-500/10 border-amber-500/20" :
      color === "rose" ? "bg-rose-500/10 border-rose-500/20" :
      "bg-white/5 border-white/5"
    )}
  >
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-transform",
          color === "primary" ? "bg-primary/20 text-primary" :
          color === "emerald" ? "bg-emerald-500/20 text-emerald-500" :
          color === "amber" ? "bg-amber-500/20 text-amber-500" :
          color === "rose" ? "bg-rose-500/20 text-rose-500" :
          "bg-white/10 text-white"
        )}>
          <Icon size={22} />
        </div>
        {trend !== undefined && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
            trend >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
          )}>
            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em] mb-2">{title}</p>
      <h3 className="text-3xl font-black tabular-nums tracking-tighter mb-1">{value}</h3>
      {subValue && <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">{subValue}</p>}
    </div>
    <div className={cn(
      "absolute -right-8 -bottom-8 w-32 h-32 blur-[80px] opacity-15",
      color === "primary" ? "bg-primary" :
      color === "emerald" ? "bg-emerald-500" :
      color === "amber" ? "bg-amber-500" :
      color === "rose" ? "bg-rose-500" : "bg-white"
    )} />
  </motion.div>
);

// Insight Card Component
const InsightCard = ({ type, title, description, icon: Icon, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      "p-5 rounded-2xl border backdrop-blur-xl flex gap-4 items-start",
      color === "primary" ? "bg-primary/5 border-primary/20" :
      color === "emerald" ? "bg-emerald-500/5 border-emerald-500/20" :
      color === "amber" ? "bg-amber-500/5 border-amber-500/20" :
      "bg-white/5 border-white/5"
    )}
  >
    <div className={cn(
      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
      color === "primary" ? "bg-primary/20 text-primary" :
      color === "emerald" ? "bg-emerald-500/20 text-emerald-500" :
      color === "amber" ? "bg-amber-500/20 text-amber-500" :
      "bg-white/10 text-white"
    )}>
      <Icon size={18} />
    </div>
    <div>
      <h4 className="text-sm font-black uppercase tracking-tight mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground font-medium leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

// Deal Velocity Scatter Data
const prepareVelocityData = (deals) => {
  const stages = ['lead', 'contact', 'proposal', 'negotiation'];
  const stageOrder = { lead: 0, contact: 1, proposal: 2, negotiation: 3, won: 4, lost: 5 };
  
  return deals
    .filter(d => !['won', 'lost'].includes(d.stage))
    .map((deal, i) => {
      const daysInStage = Math.floor((Date.now() - new Date(deal.createdAt).getTime()) / 86400000);
      return {
        x: stageOrder[deal.stage] || 0,
        y: Number(deal.value) / 100000,
        z: 10,
        name: deal.title,
        company: deal.company,
        stage: deal.stage,
        days: daysInStage
      };
    });
};

export default function AnalyticsPage() {
  const { data: deals, isLoading: dealsLoading } = useDeals();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: teamMembers, isLoading: teamLoading } = useTeam();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiPrognosis, setAiPrognosis] = useState(null);
  const [aiInsights, setAiInsights] = useState([]);
  const [timeRange, setTimeRange] = useState('6m');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMetric, setSelectedMetric] = useState(null);

  const monthlyTarget = settings?.monthly_target || 10000000;

  // Handle time range changes
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  // Handle tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Comprehensive Analytics Calculation
  const analytics = useMemo(() => {
    if (!deals) return null;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Time range calculation
    const monthsBack = timeRange === '3m' ? 2 : timeRange === '6m' ? 5 : 11;

    // 1. Revenue Stream Analysis
    const revenueStream = [];
    for (let i = monthsBack; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      revenueStream.push({
        name: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        month: d.getMonth(),
        year: d.getFullYear(),
        actual: 0,
        forecast: 0,
        target: monthlyTarget,
        wonCount: 0,
        lostCount: 0
      });
    }

    deals.forEach(deal => {
      const dealDate = new Date(deal.createdAt);
      const mIdx = revenueStream.findIndex(m => m.month === dealDate.getMonth() && m.year === dealDate.getFullYear());
      if (mIdx !== -1) {
        if (deal.stage === 'won') {
          revenueStream[mIdx].actual += Number(deal.value || 0);
          revenueStream[mIdx].wonCount++;
        } else if (deal.stage === 'lost') {
          revenueStream[mIdx].lostCount++;
        } else {
          revenueStream[mIdx].forecast += (Number(deal.value || 0) * (Number(deal.probability || 0) / 100));
        }
      }
    });

    // Growth calculations
    const currentMonthActual = revenueStream[revenueStream.length - 1]?.actual || 0;
    const prevMonthActual = revenueStream[revenueStream.length - 2]?.actual || 0;
    const growth = prevMonthActual > 0 ? Math.round(((currentMonthActual - prevMonthActual) / prevMonthActual) * 100) : 0;

    // Quarter over quarter
    const qtdActual = revenueStream.slice(-3).reduce((sum, m) => sum + m.actual, 0);
    const prevQtdActual = revenueStream.slice(-6, -3).reduce((sum, m) => sum + m.actual, 0);
    const qoqGrowth = prevQtdActual > 0 ? Math.round(((qtdActual - prevQtdActual) / prevQtdActual) * 100) : 0;

    // 2. Stage Distribution with Values
    const stageData = [];
    const stageOrder = ['lead', 'contact', 'proposal', 'negotiation', 'won', 'lost'];
    const stageColors = {
      lead: '#6366f1',
      contact: '#8b5cf6',
      proposal: '#ec4899',
      negotiation: '#f97316',
      won: '#10b981',
      lost: '#ef4444'
    };

    stageOrder.forEach(stage => {
      const stageDeals = deals.filter(d => d.stage === stage);
      stageData.push({
        name: stage.toUpperCase(),
        value: stageDeals.length,
        totalValue: stageDeals.reduce((sum, d) => sum + Number(d.value || 0), 0),
        color: stageColors[stage]
      });
    });

    // 3. Team Performance
    const teamStats = (teamMembers || []).map(m => {
      const mDeals = deals.filter(d => d.assigned_to === m.id);
      const monthDeals = mDeals.filter(d => new Date(d.createdAt).getMonth() === currentMonth);
      const won = monthDeals.filter(d => d.stage === 'won').reduce((s, d) => s + Number(d.value || 0), 0);
      const pipeline = monthDeals.filter(d => !['won', 'lost'].includes(d.stage)).reduce((s, d) => s + Number(d.value || 0), 0);
      const winRate = mDeals.filter(d => d.stage === 'won').length / (mDeals.length || 1) * 100;

      return {
        name: m.name,
        role: m.role,
        won,
        pipeline,
        target: m.goal || 2000000,
        winRate: Math.round(winRate),
        totalDeals: mDeals.length,
        color: m.color
      };
    });

    // 4. Pipeline Health Metrics
    const activeDeals = deals.filter(d => !['won', 'lost'].includes(d.stage));
    const totalPipeline = activeDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);
    const weightedPipeline = activeDeals.reduce((sum, d) => sum + (Number(d.value || 0) * (Number(d.probability || 0) / 100)), 0);
    const avgDealSize = activeDeals.length > 0 ? totalPipeline / activeDeals.length : 0;
    const avgProbability = activeDeals.length > 0 ? activeDeals.reduce((sum, d) => sum + Number(d.probability || 0), 0) / activeDeals.length : 0;

    // 5. Conversion Funnel
    const funnelData = [
      { stage: 'LEAD', count: deals.filter(d => d.stage === 'lead').length, value: deals.filter(d => d.stage === 'lead').reduce((s, d) => s + Number(d.value), 0) },
      { stage: 'CONTACT', count: deals.filter(d => d.stage === 'contact').length, value: deals.filter(d => d.stage === 'contact').reduce((s, d) => s + Number(d.value), 0) },
      { stage: 'PROPOSAL', count: deals.filter(d => d.stage === 'proposal').length, value: deals.filter(d => d.stage === 'proposal').reduce((s, d) => s + Number(d.value), 0) },
      { stage: 'NEGOTIATION', count: deals.filter(d => d.stage === 'negotiation').length, value: deals.filter(d => d.stage === 'negotiation').reduce((s, d) => s + Number(d.value), 0) },
    ];

    // 6. Win/Loss Analysis
    const wonDeals = deals.filter(d => d.stage === 'won');
    const lostDeals = deals.filter(d => d.stage === 'lost');
    const totalClosed = wonDeals.length + lostDeals.length;
    const winRate = totalClosed > 0 ? (wonDeals.length / totalClosed) * 100 : 0;
    const avgSalesCycle = wonDeals.length > 0
      ? wonDeals.reduce((sum, d) => {
          const closeDate = d.actual_close_date ? new Date(d.actual_close_date) : new Date();
          const openDate = new Date(d.createdAt);
          return sum + ((closeDate - openDate) / 86400000);
        }, 0) / wonDeals.length
      : 0;

    // 7. Monthly Trend (for line chart)
    const monthlyTrend = revenueStream.map(m => ({
      name: m.name,
      Revenue: m.actual,
      Target: m.target,
      Pipeline: m.forecast
    }));

    // 8. Additional Metrics
    const totalDeals = deals.length;
    const conversionRate = totalDeals > 0 ? (wonDeals.length / totalDeals) * 100 : 0;
    const avgLossTime = lostDeals.length > 0
      ? lostDeals.reduce((sum, d) => {
          const lossDate = new Date();
          const openDate = new Date(d.createdAt);
          return sum + ((lossDate - openDate) / 86400000);
        }, 0) / lostDeals.length
      : 0;

    // 9. Best performing team member
    const topPerformer = teamStats.length > 0 ? teamStats.reduce((prev, current) => 
      (current.won > prev.won) ? current : prev
    ) : null;

    // 10. Deal velocity (average days per stage)
    const dealVelocity = stageOrder.slice(0, 4).map(stage => {
      const stageDeals = deals.filter(d => d.stage === stage);
      const avgDays = stageDeals.length > 0
        ? stageDeals.reduce((sum, d) => {
            const now = Date.now();
            const created = new Date(d.createdAt).getTime();
            return sum + ((now - created) / 86400000);
          }, 0) / stageDeals.length
        : 0;
      return { stage, avgDays: Math.round(avgDays), count: stageDeals.length };
    });

    return {
      revenueStream,
      stageData,
      teamStats,
      totalPipeline,
      weightedPipeline,
      avgDealSize,
      avgProbability,
      currentMonthActual,
      growth,
      qoqGrowth,
      funnelData,
      winRate: Math.round(winRate),
      avgSalesCycle: Math.round(avgSalesCycle),
      monthlyTrend,
      velocityData: prepareVelocityData(deals),
      wonCount: wonDeals.length,
      lostCount: lostDeals.length,
      activeCount: activeDeals.length,
      totalDeals,
      conversionRate: Math.round(conversionRate),
      avgLossTime: Math.round(avgLossTime),
      topPerformer,
      dealVelocity
    };
  }, [deals, monthlyTarget, teamMembers, timeRange]);

  // AI Prognosis Handler
  const handleAIPrognosis = async () => {
    if (!analytics) return;
    setIsAnalyzing(true);

    const prompt = `You are an expert CRM analytics AI. Analyze this sales data and provide strategic insights:

    Current Month Revenue: ${formatFullCurrency(analytics.currentMonthActual)}
    Month-over-Month Growth: ${analytics.growth}%
    Quarter-over-Quarter Growth: ${analytics.qoqGrowth}%
    Target: ${formatFullCurrency(monthlyTarget)}
    Total Pipeline: ${formatFullCurrency(analytics.totalPipeline)}
    Weighted Pipeline: ${formatFullCurrency(analytics.weightedPipeline)}
    Win Rate: ${analytics.winRate}%
    Average Sales Cycle: ${analytics.avgSalesCycle} days
    Average Deal Size: ${formatCurrency(analytics.avgDealSize)}
    Active Deals: ${analytics.activeCount}

    Provide:
    1. Overall trajectory assessment (positive/neutral/negative)
    2. AI confidence score (0-100)
    3. Top 3 strategic recommendations
    4. Key risk factors
    5. Revenue forecast for next month

    Return ONLY JSON: {
      "summary": "Executive summary in Thai",
      "trajectory": "positive|neutral|negative",
      "score": 0-100,
      "recommendations": ["rec1", "rec2", "rec3"],
      "risks": ["risk1", "risk2"],
      "forecast": "Revenue prediction"
    }`;

    try {
      const result = await callGeminiAPI(prompt);
      if (result) {
        setAiPrognosis(result);
        
        // Generate additional insights
        const insights = [];
        if (analytics.winRate < 40) {
          insights.push({ type: 'warning', title: 'Low Win Rate Alert', description: `Your ${analytics.winRate}% win rate is below industry average. Focus on qualification.`, icon: AlertCircle, color: 'amber' });
        }
        if (analytics.growth > 20) {
          insights.push({ type: 'success', title: 'Exceptional Growth', description: `${analytics.growth}% month-over-month growth indicates strong market traction.`, icon: TrendingUp, color: 'emerald' });
        }
        if (analytics.avgSalesCycle > 60) {
          insights.push({ type: 'warning', title: 'Long Sales Cycle', description: `${analytics.avgSalesCycle} day average cycle suggests process optimization needed.`, icon: Clock, color: 'amber' });
        }
        if (result.recommendations) {
          result.recommendations.forEach((rec, i) => {
            insights.push({ type: 'insight', title: `AI Recommendation ${i + 1}`, description: rec, icon: Lightbulb, color: 'primary' });
          });
        }
        setAiInsights(insights);
      }
    } catch (err) {
      console.error("AI Analysis failed", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-run AI analysis on mount
  useEffect(() => {
    if (analytics && !aiPrognosis) {
      handleAIPrognosis();
    }
  }, [analytics]);

  if (dealsLoading || settingsLoading || teamLoading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-primary/20" />
        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" size={32} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground animate-pulse">Processing Neural Analytics...</p>
    </div>
  );

  return (
    <div className="max-w-[1800px] mx-auto space-y-8 pb-10 animate-fade-up">
      {/* HEADER */}
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-gradient-to-r from-primary/10 via-emerald-500/10 to-primary/10 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-2xl shadow-primary/30">
            <Brain size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-5xl font-black tracking-tighter uppercase italic">Analytics Intelligence</h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-2">Real-time Business Intelligence • AI-Powered Insights</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/10">
            {['3m', '6m', '12m'].map(range => (
              <button
                key={range}
                onClick={() => handleTimeRangeChange(range)}
                className={cn(
                  "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                  timeRange === range ? "bg-primary text-white" : "text-muted-foreground hover:text-white"
                )}
              >
                {range}
              </button>
            ))}
          </div>

          <Button
            onClick={handleAIPrognosis}
            disabled={isAnalyzing}
            className="h-14 px-6 rounded-xl bg-primary font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 hover:scale-105 transition-all"
          >
            {isAnalyzing ? <RefreshCw className="animate-spin mr-2" size={16} /> : <Sparkles className="mr-2" size={16} />}
            AI Analysis
          </Button>

          <Button variant="outline" className="h-14 w-14 rounded-xl border-white/10 bg-white/5">
            <Download size={18} />
          </Button>
        </div>
      </header>

      {/* KEY METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Monthly Revenue"
          value={formatCurrency(analytics?.currentMonthActual)}
          subValue={`Target: ${formatCurrency(monthlyTarget)}`}
          icon={DollarSign}
          trend={analytics?.growth}
          color="emerald"
        />
        <MetricCard
          title="Total Pipeline"
          value={formatCurrency(analytics?.totalPipeline)}
          subValue={`${analytics?.activeCount} Active Deals`}
          icon={Layers}
          trend={analytics?.qoqGrowth}
          color="primary"
        />
        <MetricCard
          title="Win Rate"
          value={`${analytics?.winRate}%`}
          subValue={`${analytics?.wonCount} Won / ${analytics?.lostCount} Lost`}
          icon={Target}
          color="amber"
        />
        <MetricCard
          title="Conversion"
          value={`${analytics?.conversionRate}%`}
          subValue={`${analytics?.totalDeals} Total Deals`}
          icon={Trophy}
          trend={analytics?.conversionRate > 20 ? 5 : -5}
          color="primary"
        />
        <MetricCard
          title="Avg Deal Size"
          value={formatCurrency(analytics?.avgDealSize)}
          subValue={`${analytics?.avgProbability ? Math.round(analytics.avgProbability) : 0}% Avg Probability`}
          icon={Coins}
          color="rose"
        />
        <MetricCard
          title="Sales Cycle"
          value={`${analytics?.avgSalesCycle || 0}d`}
          subValue="Avg to Close"
          icon={Hourglass}
          trend={analytics?.avgSalesCycle < 30 ? 10 : -10}
          color="amber"
        />
      </div>

      {/* TABS FOR DIFFERENT VIEWS */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full max-w-4xl grid-cols-5 bg-black/40 border border-white/10 rounded-2xl p-1.5">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Overview</TabsTrigger>
          <TabsTrigger value="pipeline" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Pipeline</TabsTrigger>
          <TabsTrigger value="velocity" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Velocity</TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Team</TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl text-[9px] font-black uppercase tracking-widest">AI Insights</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Revenue Trend Chart */}
            <Card className="lg:col-span-8 bg-black/20 border-white/5 rounded-[2rem] p-6 backdrop-blur-xl">
              <CardHeader className="p-0 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp size={18} className="text-emerald-500" /> Revenue Trajectory
                    </CardTitle>
                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-50">Monthly Performance vs Target</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-[8px] font-black uppercase opacity-60">Actual</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-[8px] font-black uppercase opacity-60">Forecast</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full border-2 border-dashed border-white/50" />
                      <span className="text-[8px] font-black uppercase opacity-60">Target</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <div className="w-full" style={{ height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analytics?.monthlyTrend}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900 }} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
                    <Tooltip content={<CustomTooltip formatter={formatFullCurrency} />} />
                    <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 900 }} />
                    <Area type="monotone" dataKey="Revenue" name="Revenue" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#revenueGradient)" />
                    <Area type="monotone" dataKey="Pipeline" name="Pipeline" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                    <Line type="monotone" dataKey="Target" name="Target" stroke="#f97316" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* AI Prognosis Panel */}
            <Card className={cn(
              "lg:col-span-4 border-none p-6 rounded-[2rem] flex flex-col justify-between relative overflow-hidden transition-all duration-700 shadow-2xl min-h-[400px]",
              aiPrognosis?.trajectory === 'positive' ? "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white" :
              aiPrognosis?.trajectory === 'negative' ? "bg-gradient-to-br from-red-600 to-red-700 text-white" : 
              "bg-gradient-to-br from-primary to-indigo-700 text-white"
            )}>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiIC8+PC9zdmc+')] opacity-30" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Brain size={24} className={cn(isAnalyzing && "animate-pulse")} />
                  </div>
                  <Badge className="bg-white/20 text-white border-none font-black px-3 py-1 tracking-widest text-[8px]">AI ADVISORY</Badge>
                </div>
                
                <h3 className="text-xl font-black uppercase tracking-tighter mb-4">Market Prognosis</h3>
                
                {isAnalyzing ? (
                  <div className="space-y-3">
                    <div className="h-2 bg-white/20 rounded-full animate-pulse" />
                    <div className="h-2 bg-white/20 rounded-full animate-pulse w-5/6" />
                    <div className="h-2 bg-white/20 rounded-full animate-pulse w-4/6" />
                  </div>
                ) : aiPrognosis ? (
                  <div className="space-y-4">
                    <p className="text-sm font-bold leading-relaxed opacity-95">{aiPrognosis.summary}</p>
                    
                    {aiPrognosis.forecast && (
                      <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Next Month Forecast</p>
                        <p className="text-2xl font-black">{aiPrognosis.forecast}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm font-bold opacity-80">Initialize neural analysis to generate market trajectory intelligence.</p>
                )}
              </div>
              
              <div className="relative z-10 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em]">
                    Trajectory: {(aiPrognosis?.trajectory || 'READY').toUpperCase()}
                  </span>
                  <ArrowUpRight size={20} className="opacity-50" />
                </div>
              </div>
            </Card>
          </div>

          {/* AI Insights Grid */}
          {aiInsights.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {aiInsights.map((insight, i) => (
                <InsightCard key={i} {...insight} />
              ))}
            </div>
          )}

          {/* Stage Distribution & Funnel */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Stage Distribution */}
            <Card className="bg-black/20 border-white/5 rounded-[2rem] p-6 backdrop-blur-xl">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <PieChartIcon size={18} className="text-primary" /> Stage Distribution
                </CardTitle>
              </CardHeader>
              <div className="w-full" style={{ height: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics?.stageData.slice(0, 4)}
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {analytics?.stageData.slice(0, 4).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {analytics?.stageData.slice(0, 4).map((stage, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                    <span className="text-[8px] font-black uppercase opacity-50 truncate">{stage.name}</span>
                    <span className="text-[8px] font-black ml-auto">{stage.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Conversion Funnel */}
            <Card className="bg-black/20 border-white/5 rounded-[2rem] p-6 backdrop-blur-xl">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <BarChart3 size={18} className="text-amber-500" /> Conversion Funnel
                </CardTitle>
              </CardHeader>
              <div className="space-y-3">
                {analytics?.funnelData.map((stage, i) => {
                  const maxCount = Math.max(...analytics.funnelData.map(d => d.count));
                  const width = (stage.count / maxCount) * 100;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest mb-1">
                        <span className="opacity-60">{stage.stage}</span>
                        <span>{stage.count} deals</span>
                      </div>
                      <div className="h-3 bg-black/40 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${width}%` }}
                          transition={{ delay: i * 0.1, duration: 0.5 }}
                          className={cn(
                            "h-full rounded-full",
                            i === 0 ? "bg-indigo-500" :
                            i === 1 ? "bg-purple-500" :
                            i === 2 ? "bg-pink-500" : "bg-orange-500"
                          )}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Key Metrics */}
            <Card className="bg-black/20 border-white/5 rounded-[2rem] p-6 backdrop-blur-xl">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <Award size={18} className="text-emerald-500" /> Performance Metrics
                </CardTitle>
              </CardHeader>
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1">Win Rate</p>
                  <p className="text-2xl font-black text-emerald-500">{analytics?.winRate}%</p>
                </div>
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl">
                  <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1">Avg Sales Cycle</p>
                  <p className="text-2xl font-black text-primary">{analytics?.avgSalesCycle} days</p>
                </div>
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1">Avg Deal Size</p>
                  <p className="text-xl font-black text-amber-500">{formatCurrency(analytics?.avgDealSize)}</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* PIPELINE TAB */}
        <TabsContent value="pipeline" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pipeline Velocity Scatter */}
            <Card className="bg-black/20 border-white/5 rounded-[2rem] p-6 backdrop-blur-xl">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Activity size={18} className="text-primary" /> Pipeline Velocity
                </CardTitle>
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-50">Deal Value vs Stage Progression</p>
              </CardHeader>
              <div className="w-full" style={{ height: '350px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" dataKey="x" hide domain={[0, 4]} />
                    <YAxis type="number" dataKey="y" hide />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                      if (active && payload && payload[0]) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-black/95 backdrop-blur-xl border border-white/10 p-4 rounded-xl">
                            <p className="text-sm font-black">{data.name}</p>
                            <p className="text-[9px] text-muted-foreground">{data.company}</p>
                            <p className="text-[9px] text-primary mt-2">Value: {formatFullCurrency(data.y * 100000)}</p>
                            <p className="text-[9px] text-amber-400">Days: {data.days}</p>
                          </div>
                        );
                      }
                      return null;
                    }} />
                    <Scatter name="Deals" data={analytics?.velocityData} fill="#6366f1">
                      {analytics?.velocityData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#ec4899', '#f97316'][index % 4]} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Pipeline Health */}
            <Card className="bg-black/20 border-white/5 rounded-[2rem] p-6 backdrop-blur-xl">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Target size={18} className="text-emerald-500" /> Pipeline Health
                </CardTitle>
              </CardHeader>
              <div className="space-y-6">
                <div className="p-5 bg-primary/10 border border-primary/20 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Total Pipeline Value</span>
                    <Layers size={18} className="text-primary opacity-50" />
                  </div>
                  <p className="text-3xl font-black text-primary">{formatFullCurrency(analytics?.totalPipeline)}</p>
                </div>
                
                <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Weighted Pipeline</span>
                    <CheckCircle size={18} className="text-emerald-500 opacity-50" />
                  </div>
                  <p className="text-3xl font-black text-emerald-500">{formatFullCurrency(analytics?.weightedPipeline)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-2">Active Deals</p>
                    <p className="text-2xl font-black">{analytics?.activeCount}</p>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-2">Avg Probability</p>
                    <p className="text-2xl font-black text-amber-500">{formatPercent(analytics?.avgProbability)}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* VELOCITY TAB */}
        <TabsContent value="velocity" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Deal Velocity by Stage */}
            <Card className="bg-black/20 border-white/5 rounded-[2rem] p-6 backdrop-blur-xl">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Timer size={18} className="text-amber-500" /> Time in Stage
                </CardTitle>
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-50">Average Days per Stage</p>
              </CardHeader>
              <div className="space-y-4">
                {analytics?.dealVelocity.map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          i === 0 ? "bg-indigo-500/20 text-indigo-400" :
                          i === 1 ? "bg-purple-500/20 text-purple-400" :
                          i === 2 ? "bg-pink-500/20 text-pink-400" :
                          "bg-orange-500/20 text-orange-400"
                        )}>
                          <GitCommit size={16} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest">{item.stage}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-white">{item.avgDays}d</span>
                        <span className="text-[8px] text-muted-foreground ml-2">({item.count} deals)</span>
                      </div>
                    </div>
                    <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (item.avgDays / 60) * 100)}%` }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        className={cn(
                          "h-full rounded-full",
                          i === 0 ? "bg-indigo-500" :
                          i === 1 ? "bg-purple-500" :
                          i === 2 ? "bg-pink-500" :
                          "bg-orange-500"
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Velocity Metrics */}
            <Card className="bg-black/20 border-white/5 rounded-[2rem] p-6 backdrop-blur-xl">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Activity size={18} className="text-emerald-500" /> Velocity Metrics
                </CardTitle>
              </CardHeader>
              <div className="space-y-4">
                <div className="p-5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Overall Velocity</span>
                    <MoveUpRight size={16} className="text-indigo-400" />
                  </div>
                  <p className="text-3xl font-black text-white">
                    {analytics?.dealVelocity.reduce((sum, item) => sum + item.avgDays, 0) || 0}d
                  </p>
                  <p className="text-[8px] text-muted-foreground mt-1">Total avg. time through pipeline</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUpIcon size={14} className="text-emerald-400" />
                      <span className="text-[8px] font-black uppercase text-muted-foreground">Fastest Stage</span>
                    </div>
                    <p className="text-lg font-black">
                      {analytics?.dealVelocity.reduce((min, item) => item.avgDays < min.avgDays ? item : min, analytics.dealVelocity[0])?.stage || '-'}
                    </p>
                  </div>

                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChartIcon size={14} className="text-amber-400" />
                      <span className="text-[8px] font-black uppercase text-muted-foreground">Most Active</span>
                    </div>
                    <p className="text-lg font-black">
                      {analytics?.dealVelocity.reduce((max, item) => item.count > max.count ? item : max, analytics.dealVelocity[0])?.stage || '-'}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={14} className="text-amber-400" />
                    <span className="text-[8px] font-black uppercase text-muted-foreground">Bottleneck Alert</span>
                  </div>
                  <p className="text-sm font-black text-amber-400">
                    {analytics?.dealVelocity.reduce((max, item) => item.avgDays > max.avgDays ? item : max, analytics.dealVelocity[0])?.stage || 'None'} has the longest avg. time
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Pipeline Scatter with enhanced data */}
          <Card className="bg-black/20 border-white/5 rounded-[2rem] p-6 backdrop-blur-xl">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Activity size={18} className="text-primary" /> Pipeline Velocity Map
              </CardTitle>
              <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-50">Deal Distribution & Movement Speed</p>
            </CardHeader>
            <div className="w-full" style={{ height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" dataKey="x" hide domain={[0, 4]} />
                  <YAxis type="number" dataKey="y" hide />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-black/95 backdrop-blur-xl border border-white/10 p-4 rounded-xl">
                          <p className="text-sm font-black">{data.name}</p>
                          <p className="text-[9px] text-muted-foreground">{data.company}</p>
                          <p className="text-[9px] text-primary mt-2">Value: {formatFullCurrency(data.y * 100000)}</p>
                          <p className="text-[9px] text-amber-400">Days in Stage: {data.days}d</p>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Scatter name="Deals" data={analytics?.velocityData} fill="#6366f1">
                    {analytics?.velocityData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#ec4899', '#f97316'][index % 4]} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        {/* TEAM TAB */}
        <TabsContent value="team" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Performance Bar Chart */}
            <Card className="bg-black/20 border-white/5 rounded-[2rem] p-6 backdrop-blur-xl">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Users size={18} className="text-blue-500" /> Team Performance
                </CardTitle>
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-50">Monthly Revenue by Team Member</p>
              </CardHeader>
              <div className="w-full" style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.teamStats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 900 }}
                      width={120}
                    />
                    <Tooltip content={<CustomTooltip formatter={formatFullCurrency} />} />
                    <Legend />
                    <Bar dataKey="won" name="Won" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} barSize={24} />
                    <Bar dataKey="pipeline" name="Pipeline" fill="#8b5cf6" radius={[0, 8, 8, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Team Stats Cards */}
            <div className="space-y-4">
              {analytics?.teamStats.map((member, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-5 bg-white/5 border border-white/10 rounded-2xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", member.color?.split(' ')[0] || 'bg-primary')}>
                        <Users size={20} className="text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase">{member.name}</h4>
                        <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest">{member.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-primary">{formatCurrency(member.won)}</p>
                      <p className="text-[8px] text-muted-foreground font-black">of {formatCurrency(member.target)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                      <span>Progress: {Math.round((member.won / member.target) * 100)}%</span>
                      <span>Win Rate: {member.winRate}%</span>
                    </div>
                    <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (member.won / member.target) * 100)}%` }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                        className={cn("h-full rounded-full", member.color?.split(' ')[0] || 'bg-primary')}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* INSIGHTS TAB */}
        <TabsContent value="insights" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiInsights.length > 0 ? (
              aiInsights.map((insight, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <InsightCard {...insight} />
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <Brain size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm font-black uppercase tracking-widest opacity-40">Run AI Analysis to generate insights</p>
              </div>
            )}
          </div>

          {aiPrognosis && (
            <Card className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 border-primary/20 rounded-[2rem] p-8 backdrop-blur-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Brain size={28} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">Complete AI Assessment</h3>
                  <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Comprehensive Strategic Analysis</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-3">Executive Summary</h4>
                  <p className="text-sm font-bold leading-relaxed">{aiPrognosis.summary}</p>
                </div>

                <div>
                  <h4 className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-3">Strategic Recommendations</h4>
                  <div className="space-y-2">
                    {aiPrognosis.recommendations?.map((rec, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-[8px] font-black text-primary">{i + 1}</span>
                        </div>
                        <p className="text-xs font-medium">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-3">Risk Factors</h4>
                  <div className="space-y-2">
                    {aiPrognosis.risks?.map((risk, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                        <AlertCircle size={16} className="text-rose-500 shrink-0" />
                        <p className="text-xs font-medium text-rose-400">{risk}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-3">Revenue Forecast</h4>
                  <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-2">Next Month Prediction</p>
                    <p className="text-3xl font-black text-emerald-500">{aiPrognosis.forecast}</p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
