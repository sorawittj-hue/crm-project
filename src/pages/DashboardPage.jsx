import { useMemo, useState } from 'react';
import { useDeals } from '../hooks/useDeals';
import { useSettings } from '../hooks/useSettings';
import { useTeam } from '../hooks/useTeam';
import { 
  Loader2, TrendingUp, Target, 
  Layers, Activity, Zap, Sparkles, ArrowUpRight,
  Users, Orbit, PieChart as PieChartIcon
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, PieChart, Pie, Cell, 
  BarChart, Bar
} from 'recharts';
import { cn } from '../lib/utils';
import { callGeminiAPI } from '../services/ai';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const formatCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', notation: 'compact' }).format(amount || 0);
const formatFullCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount || 0);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl shadow-2xl">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">{label}</p>
        <div className="space-y-3">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{entry.name}</span>
              </div>
              <p className="text-sm font-black tabular-nums">
                {formatFullCurrency(entry.value)}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const StatCard = ({ title, value, subValue, icon: Icon, trend, color = "primary" }) => (
  <Card className="bg-black/20 border-white/5 rounded-[2.5rem] p-8 backdrop-blur-xl relative overflow-hidden group">
    <div className="relative z-10">
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110",
        color === "primary" ? "bg-primary/20 text-primary" : "bg-emerald-500/20 text-emerald-500"
      )}>
        <Icon size={24} />
      </div>
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2">{title}</p>
      <div className="flex items-baseline gap-3">
        <h3 className="text-4xl font-black tabular-nums tracking-tighter">{value}</h3>
        {trend !== undefined && (
          <span className={cn(
            "text-[10px] font-black px-2 py-0.5 rounded-full",
            trend >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
          )}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 opacity-40">{subValue}</p>
    </div>
    <div className={cn(
      "absolute -right-8 -bottom-8 w-32 h-32 blur-[60px] opacity-20",
      color === "primary" ? "bg-primary" : "bg-emerald-500"
    )} />
  </Card>
);

export default function DashboardPage() {
  const { data: deals, isLoading: dealsLoading } = useDeals();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: teamMembers, isLoading: teamLoading } = useTeam();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiPrognosis, setAiPrognosis] = useState(null);

  const monthlyTarget = settings?.monthly_target || 10000000;

  const analytics = useMemo(() => {
    if (!deals) return null;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // 1. Revenue Stream (Last 6 Months)
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      months.push({
        name: d.toLocaleDateString('en-US', { month: 'short' }),
        month: d.getMonth(),
        year: d.getFullYear(),
        actual: 0,
        forecast: 0,
        target: monthlyTarget
      });
    }

    deals.forEach(deal => {
      const dealDate = new Date(deal.createdAt);
      const mIdx = months.findIndex(m => m.month === dealDate.getMonth() && m.year === dealDate.getFullYear());
      if (mIdx !== -1) {
        if (deal.stage === 'won') {
          months[mIdx].actual += Number(deal.value || 0);
        } else if (deal.stage !== 'lost') {
          months[mIdx].forecast += (Number(deal.value || 0) * (Number(deal.probability || 0) / 100));
        }
      }
    });

    // Calculate Growth
    const currentMonthActual = months[5].actual;
    const prevMonthActual = months[4].actual;
    const growth = prevMonthActual > 0 ? Math.round(((currentMonthActual - prevMonthActual) / prevMonthActual) * 100) : 0;

    // 2. Stage Distribution
    const stages = {};
    deals.forEach(deal => {
      stages[deal.stage] = (stages[deal.stage] || 0) + 1;
    });

    // 3. Team Velocity
    const teamStats = (teamMembers || []).map(m => {
      const mDeals = deals.filter(d => d.assigned_to === m.id && new Date(d.createdAt).getMonth() === currentMonth);
      const won = mDeals.filter(d => d.stage === 'won').reduce((s, d) => s + Number(d.value || 0), 0);
      return { name: m.name, won, target: m.goal || 2000000 };
    });

    return {
      revenueStream: months,
      stageDist: Object.entries(stages).map(([name, value]) => ({ name: name.toUpperCase(), value })),
      teamStats,
      currentMonthActual,
      growth,
      totalPipeline: deals.filter(d => d.stage !== 'won' && d.stage !== 'lost').reduce((s, d) => s + Number(d.value || 0), 0)
    };
  }, [deals, monthlyTarget, teamMembers]);

  const handleAIPrognosis = async () => {
    if (!analytics) return;
    setIsAnalyzing(true);
    const prompt = `Perform a high-level strategic sales prognosis for a CRM system.
    Current Month Revenue: ${formatFullCurrency(analytics.currentMonthActual)}
    Growth vs Last Month: ${analytics.growth}%
    Target: ${formatFullCurrency(monthlyTarget)}
    Pipeline Total: ${formatFullCurrency(analytics.totalPipeline)}
    Pipeline Weighted: ${formatFullCurrency(analytics.revenueStream[5].forecast)}
    Stage Distribution: ${JSON.stringify(analytics.stageDist)}
    Team Performance: ${JSON.stringify(analytics.teamStats)}
    
    Provide a professional Thai summary:
    1. Overall Status (Trajectory)
    2. Main Risk Factor
    3. Three specific action directives for the team
    Return ONLY JSON: { "summary": "...", "trajectory": "positive|neutral|negative", "score": 0-100 }`;

    try {
      const result = await callGeminiAPI(prompt);
      if (result) setAiPrognosis(result);
    } catch (err) {
      console.error("AI Analysis failed", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (dealsLoading || settingsLoading || teamLoading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
      <Loader2 className="animate-spin text-primary" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground animate-pulse">Processing Neural Analytics...</p>
    </div>
  );

  return (
    <div className="max-w-[1800px] mx-auto space-y-12 pb-20 animate-fade-up">
      {/* ANALYTICS HUD HEADER */}
      <header className="bg-white/5 p-10 rounded-[3rem] border border-white/5 backdrop-blur-3xl relative overflow-hidden group shadow-2xl">
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-12">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/40 rotate-3 group-hover:rotate-0 transition-transform duration-500">
              <Activity size={32} className="text-white fill-current" />
            </div>
            <div>
              <h1 className="text-6xl font-black tracking-tighter leading-none uppercase italic">Strategic Insights</h1>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.5em] mt-3 ml-1">Market Trajectory & Forecasting • OS v2.0</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <Button 
              onClick={handleAIPrognosis} 
              disabled={isAnalyzing}
              className="h-16 px-10 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-primary/20 hover:scale-105 transition-all"
             >
               {isAnalyzing ? <Loader2 className="animate-spin mr-3" /> : <Sparkles className="mr-3" />}
               Run AI Prognosis
             </Button>
          </div>
        </div>
      </header>

      {/* TOP METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          title="Revenue Capture" 
          value={formatCurrency(analytics?.currentMonthActual)} 
          subValue="Current Month Actual"
          trend={analytics?.growth}
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard 
          title="Pipeline Depth" 
          value={formatCurrency(analytics?.totalPipeline)} 
          subValue="Active Opportunities"
          icon={Layers}
        />
        <StatCard 
          title="Objective Alignment" 
          value={`${Math.round((analytics?.currentMonthActual / monthlyTarget) * 100)}%`} 
          subValue={`Target: ${formatCurrency(monthlyTarget)}`}
          icon={Target}
        />
        <StatCard 
          title="Neural Score" 
          value={aiPrognosis?.score || 'N/A'} 
          subValue="AI Health Assessment"
          icon={Zap}
          color={aiPrognosis?.trajectory === 'positive' ? 'emerald' : 'primary'}
        />
      </div>

      {/* REVENUE COMMAND CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-8 bg-black/20 border-white/5 rounded-[2.5rem] p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between mb-10 px-4">
            <div>
              <h3 className="text-xl font-black uppercase tracking-widest italic">Revenue Flow Matrix</h3>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1 opacity-60">Last 6 Operational Cycles</p>
            </div>
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Actual</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Forecast</span>
               </div>
            </div>
          </div>
          <div className="w-full">
            <ResponsiveContainer width="100%" height={400} aspect={2}>
              <AreaChart data={analytics?.revenueStream}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900 }} 
                  tickFormatter={(val) => `${val/1000000}M`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="actual" 
                  name="Captured"
                  stroke="hsl(var(--primary))" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorActual)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="forecast" 
                  name="Projected"
                  stroke="#10b981" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fillOpacity={1} 
                  fill="url(#colorForecast)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* AI PROGNOSIS OUTPUT */}
        <div className="lg:col-span-4 space-y-8">
          <Card className={cn(
            "h-full border-none p-10 rounded-[2.5rem] flex flex-col justify-between relative overflow-hidden transition-all duration-700 shadow-2xl",
            aiPrognosis?.trajectory === 'positive' ? "bg-emerald-600 text-white" : 
            aiPrognosis?.trajectory === 'negative' ? "bg-red-600 text-white" : "bg-primary text-primary-foreground"
          )}>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-10">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Orbit size={28} className="animate-spin-slow" />
                </div>
                <Badge className="bg-white/20 text-white border-none font-black px-4 py-1 tracking-widest text-[10px]">AI ADVISORY</Badge>
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-6">Market Prognosis</h3>
              <p className="text-sm font-bold leading-relaxed opacity-90 whitespace-pre-wrap min-h-[200px]">
                {aiPrognosis ? aiPrognosis.summary : "Initialize neural analysis to synchronize market trajectory intelligence."}
              </p>
            </div>
            <div className="relative z-10 pt-10 border-t border-white/10 flex items-center justify-between">
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">Trajectory: {aiPrognosis?.trajectory || 'READY'}</span>
               <ArrowUpRight size={24} className="opacity-50" />
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* FUNNEL DISTRIBUTION */}
        <Card className="bg-black/20 border-white/5 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-xl">
          <CardHeader className="p-0 mb-8">
            <CardTitle className="text-xs font-black uppercase tracking-[0.4em] flex items-center gap-3">
              <PieChartIcon size={18} className="text-primary" /> Signal Distribution
            </CardTitle>
          </CardHeader>
          <div className="w-full">
            <ResponsiveContainer width="100%" height={300} aspect={1}>
              <PieChart>
                <Pie
                  data={analytics?.stageDist}
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {analytics?.stageDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#ef4444'][index % 6]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            {analytics?.stageDist.slice(0, 4).map((stage, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#f97316'][i % 4] }} />
                <span className="text-[9px] font-black uppercase tracking-widest opacity-40 truncate">{stage.name}</span>
                <span className="text-[9px] font-black ml-auto">{stage.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* TEAM PERFORMANCE */}
        <Card className="bg-black/20 border-white/5 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-xl lg:col-span-2">
          <CardHeader className="p-0 mb-10 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-black uppercase tracking-[0.4em] flex items-center gap-3">
              <Users size={18} className="text-blue-500" /> Unit Deployment Success
            </CardTitle>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Monthly Extraction Performance</p>
          </CardHeader>
          <div className="w-full">
            <ResponsiveContainer width="100%" height={300} aspect={2}>
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
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="won" 
                  name="Captured"
                  fill="hsl(var(--primary))" 
                  radius={[0, 12, 12, 0]} 
                  barSize={32}
                />
                <Bar 
                  dataKey="target" 
                  name="Objective"
                  fill="rgba(255,255,255,0.05)" 
                  radius={[0, 12, 12, 0]} 
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
