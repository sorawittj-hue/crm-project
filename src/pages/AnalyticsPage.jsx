import { useMemo, useState } from 'react';
import { useDeals } from '../hooks/useDeals';
import { useSettings } from '../hooks/useSettings';
import { useTeam } from '../hooks/useTeam';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, DollarSign, Target, Users, PieChart as PieIcon,
  BarChart3, ArrowUpRight, ArrowDownRight, Loader2
} from 'lucide-react';

const formatCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', notation: 'compact' }).format(amount || 0);
const formatFullCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount || 0);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border p-3 rounded-xl shadow-lg">
        <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-xs text-muted-foreground">{entry.name}</span>
              </div>
              <p className="text-sm font-semibold">{formatFullCurrency(entry.value)}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const MetricCard = ({ title, value, subValue, icon: Icon, trend, color = "primary" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2, scale: 1.01 }}
    className={cn(
      "relative overflow-hidden rounded-2xl p-5 backdrop-blur-xl border transition-all duration-300",
      "bg-card border-border"
    )}
  >
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          color === "primary" ? "bg-primary/10 text-primary" :
            color === "emerald" ? "bg-emerald-500/10 text-emerald-500" :
              color === "amber" ? "bg-amber-500/10 text-amber-500" :
                "bg-muted text-foreground"
        )}>
          <Icon size={18} />
        </div>
        {trend !== undefined && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            trend >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
          )}>
            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{title}</p>
      <h3 className="text-xl font-bold tabular-nums tracking-tight">{value}</h3>
      {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
    </div>
  </motion.div>
);

export default function AnalyticsPage() {
  const { data: deals, isLoading: dealsLoading } = useDeals();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: teamMembers, isLoading: teamLoading } = useTeam();

  const [timeRange, setTimeRange] = useState('6m');

  const monthlyTarget = settings?.monthly_target || 10000000;

  const analytics = useMemo(() => {
    if (!deals) return null;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monthsBack = timeRange === '3m' ? 2 : timeRange === '6m' ? 5 : 11;

    // Revenue Stream
    const revenueStream = [];
    for (let i = monthsBack; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      revenueStream.push({
        name: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        month: d.getMonth(),
        year: d.getFullYear(),
        actual: 0,
        forecast: 0,
        target: monthlyTarget
      });
    }

    deals.forEach(deal => {
      const dealDate = new Date(deal.createdAt);
      const mIdx = revenueStream.findIndex(m => m.month === dealDate.getMonth() && m.year === dealDate.getFullYear());
      if (mIdx !== -1) {
        if (deal.stage === 'won') {
          revenueStream[mIdx].actual += Number(deal.value || 0);
        } else if (deal.stage !== 'lost') {
          revenueStream[mIdx].forecast += (Number(deal.value || 0) * (Number(deal.probability || 0) / 100));
        }
      }
    });

    const currentMonthActual = revenueStream[revenueStream.length - 1]?.actual || 0;
    const prevMonthActual = revenueStream[revenueStream.length - 2]?.actual || 0;
    const growth = prevMonthActual > 0 ? Math.round(((currentMonthActual - prevMonthActual) / prevMonthActual) * 100) : 0;

    // Stage Distribution
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

    // Team Performance
    const teamStats = (teamMembers || []).map(m => {
      const mDeals = deals.filter(d => d.assigned_to === m.id);
      const monthDeals = mDeals.filter(d => new Date(d.createdAt).getMonth() === currentMonth);
      const won = monthDeals.filter(d => d.stage === 'won').reduce((s, d) => s + Number(d.value || 0), 0);
      const winRate = mDeals.filter(d => d.stage === 'won').length / (mDeals.length || 1) * 100;

      return {
        name: m.name,
        won,
        target: m.goal || 2000000,
        winRate: Math.round(winRate),
        totalDeals: mDeals.length
      };
    });

    // Pipeline Metrics
    const activeDeals = deals.filter(d => !['won', 'lost'].includes(d.stage));
    const totalPipeline = activeDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);
    const weightedPipeline = activeDeals.reduce((sum, d) => sum + (Number(d.value || 0) * (Number(d.probability || 0) / 100)), 0);
    const wonDeals = deals.filter(d => d.stage === 'won');
    const lostDeals = deals.filter(d => d.stage === 'lost');
    const totalClosed = wonDeals.length + lostDeals.length;
    const winRate = totalClosed > 0 ? (wonDeals.length / totalClosed) * 100 : 0;

    return {
      revenueStream,
      stageData,
      teamStats,
      totalPipeline,
      weightedPipeline,
      currentMonthActual,
      growth,
      wonCount: wonDeals.length,
      lostCount: lostDeals.length,
      activeCount: activeDeals.length,
      winRate: Math.round(winRate)
    };
  }, [deals, monthlyTarget, teamMembers, timeRange]);

  const isLoading = dealsLoading || settingsLoading || teamLoading;

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Loader2 className="animate-spin text-primary" size={40} />
      <p className="text-sm text-muted-foreground">Loading analytics...</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-[1400px] mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Analytics</h1>
          <p className="text-sm text-muted-foreground">Comprehensive sales insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          {['3m', '6m', '12m'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-medium transition-all",
                timeRange === range ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
              )}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Monthly Revenue"
          value={formatCurrency(analytics?.currentMonthActual)}
          subValue={`Target: ${formatCurrency(monthlyTarget)}`}
          trend={analytics?.growth}
          icon={DollarSign}
          color="emerald"
        />
        <MetricCard
          title="Total Pipeline"
          value={formatCurrency(analytics?.totalPipeline)}
          subValue={`${analytics?.activeCount} Active Deals`}
          icon={TrendingUp}
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
          title="Team Members"
          value={teamMembers?.length || 0}
          subValue="Active Sellers"
          icon={Users}
          color="primary"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <TrendingUp size={20} />
              </div>
              <div>
                <CardTitle>Revenue Trend</CardTitle>
                <p className="text-sm text-muted-foreground">Monthly performance over time</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics?.revenueStream}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickFormatter={(val) => `${val / 1000000}M`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="actual"
                  name="Actual"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorActual)"
                />
                <Area
                  type="monotone"
                  dataKey="forecast"
                  name="Forecast"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stage Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <PieIcon size={20} />
              </div>
              <div>
                <CardTitle>Pipeline Distribution</CardTitle>
                <p className="text-sm text-muted-foreground">Deals by stage</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics?.stageData}
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {analytics?.stageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip formatter={(val) => val} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {analytics?.stageData.slice(0, 6).map((stage, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-xs text-muted-foreground truncate">{stage.name}</span>
                  <span className="text-xs font-medium ml-auto">{stage.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center text-info">
                <BarChart3 size={20} />
              </div>
              <div>
                <CardTitle>Team Performance</CardTitle>
                <p className="text-sm text-muted-foreground">Individual sales performance</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.teamStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="won"
                  name="Revenue"
                  fill="hsl(var(--primary))"
                  radius={[0, 4, 4, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
