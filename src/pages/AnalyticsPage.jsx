import { useMemo, useState } from 'react';
import { useDeals } from '../hooks/useDeals';
import { useSettings } from '../hooks/useSettings';
import { useTeam } from '../hooks/useTeam';
import { Card } from '../components/ui/Card';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/formatters';
import { STAGE_COLORS } from '../lib/constants';
import CustomTooltip from '../components/ui/CustomTooltip';
import {
  ResponsiveContainer, Area, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell,
  ComposedChart, Line
} from 'recharts';
import {
  TrendingUp, Target, Users, BarChart3, 
  ArrowUpRight, ArrowDownRight, Loader2,
  Activity, DollarSign, Zap, PieChart as PieIcon,
  ShieldCheck
} from 'lucide-react';

const MetricCard = ({ title, value, subValue, icon: Icon, trend, color = "primary" }) => {
    const colorStyles = {
        primary: "text-primary bg-primary/5 border-primary/10",
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
        rose: "text-rose-600 bg-rose-50 border-rose-100",
        slate: "text-slate-600 bg-slate-50 border-slate-100"
    };
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        className="group"
      >
        <Card className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-8">
              <div className={cn("w-14 h-14 rounded-[1.5rem] flex items-center justify-center transition-all duration-500", colorStyles[color])}>
                <Icon size={24} />
              </div>
              {trend !== undefined && (
                <div className={cn(
                  "flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                )}>
                  {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {Math.abs(trend)}%
                </div>
              )}
            </div>
            
            <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{title}</p>
                <h3 className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter leading-none">{value}</h3>
                {subValue && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{subValue}</p>}
            </div>
          </div>
          <div className={cn("absolute -bottom-10 -right-10 w-32 h-32 blur-[60px] opacity-20 rounded-full", color === 'primary' ? 'bg-primary' : color === 'emerald' ? 'bg-emerald-500' : 'bg-slate-300')} />
        </Card>
      </motion.div>
    );
};

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
        name: d.toLocaleDateString('en-US', { month: 'short' }),
        month: d.getMonth(),
        year: d.getFullYear(),
        actual: 0,
        unweighted: 0,
        target: monthlyTarget
      });
    }

    deals.forEach(deal => {
      const dealDate = new Date(deal.created_at);
      const mIdx = revenueStream.findIndex(m => m.month === dealDate.getMonth() && m.year === dealDate.getFullYear());
      if (mIdx !== -1) {
        if (deal.stage === 'won') {
          revenueStream[mIdx].actual += Number(deal.value || 0);
        } else if (deal.stage !== 'lost') {
          revenueStream[mIdx].unweighted += Number(deal.value || 0);
        }
      }
    });

    const currentMonthActual = revenueStream[revenueStream.length - 1]?.actual || 0;
    const prevMonthActual = revenueStream[revenueStream.length - 2]?.actual || 0;
    const growth = prevMonthActual > 0 ? Math.round(((currentMonthActual - prevMonthActual) / prevMonthActual) * 100) : 0;

    // Stage Distribution
    const stageData = [];
    const stageOrder = ['lead', 'contact', 'proposal', 'negotiation', 'won', 'lost'];

    stageOrder.forEach(stage => {
      const stageDeals = deals.filter(d => d.stage === stage);
      stageData.push({
        name: stage.toUpperCase(),
        value: stageDeals.length,
        totalValue: stageDeals.reduce((sum, d) => sum + Number(d.value || 0), 0),
        color: STAGE_COLORS[stage]
      });
    });

    // Pipeline Analytics
    const activeDeals = deals.filter(d => !['won', 'lost'].includes(d.stage));
    const totalPipeline = activeDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);
    const wonDeals = deals.filter(d => d.stage === 'won');
    const lostDeals = deals.filter(d => d.stage === 'lost');
    const winRate = (wonDeals.length + lostDeals.length) > 0 ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100) : 0;

    // Real system health metrics
    const avgDealValue = wonDeals.length > 0 ? Math.round(wonDeals.reduce((s, d) => s + Number(d.value || 0), 0) / wonDeals.length) : 0;
    const avgDaysToClose = wonDeals.length > 0 
      ? Math.round(wonDeals.reduce((s, d) => {
          const created = new Date(d.created_at);
          const closed = new Date(d.actual_close_date || d.updated_at || d.created_at);
          return s + Math.max(0, (closed - created) / 86400000);
        }, 0) / wonDeals.length) 
      : 0;

    return {
      revenueStream,
      stageData,
      totalPipeline,
      currentMonthActual,
      growth,
      winRate,
      wonCount: wonDeals.length,
      activeCount: activeDeals.length,
      avgDealValue,
      avgDaysToClose,
      totalDeals: deals.length
    };
  }, [deals, monthlyTarget, timeRange]);

  const isLoading = dealsLoading || settingsLoading || teamLoading;

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
      <Loader2 className="animate-spin text-primary" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Processing Matrix Data...</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-[1600px] mx-auto space-y-12 pb-20 px-4 md:px-0">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-slate-900 rounded-xl text-white shadow-xl shadow-slate-900/20"><BarChart3 size={18} /></div>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Performance Matrix Analytics</p>
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            Performance <span className="text-primary italic">Matrix</span>
          </h1>
          <p className="text-sm font-bold text-slate-400 leading-relaxed max-w-lg">Advanced longitudinal metrics, stage velocity, and conversion intelligence mapping.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-full border border-slate-100">
          {['3m', '6m', '12m'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                timeRange === range ? "bg-white shadow-xl text-primary" : "text-slate-400 hover:text-slate-900"
              )}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* PRIMARY KPI RIBBON */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Monthly Yield"
          value={formatCurrency(analytics?.currentMonthActual)}
          subValue={`Target: ${formatCurrency(monthlyTarget)}`}
          trend={analytics?.growth}
          icon={DollarSign}
          color="emerald"
        />
        <MetricCard
          title="Global Pipeline"
          value={formatCurrency(analytics?.totalPipeline)}
          subValue={`${analytics?.activeCount} Active Transitions`}
          icon={Activity}
          color="primary"
        />
        <MetricCard
          title="Conversion Velocity"
          value={`${analytics?.winRate}%`}
          subValue={`Strike Rate across all sectors`}
          icon={Target}
          color="primary"
        />
        <MetricCard
          title="Operative Force"
          value={teamMembers?.length || 0}
          subValue="Active Sales Personnel"
          icon={Users}
          color="slate"
        />
      </div>

      {/* ANALYSIS CHART GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Area: Revenue Trajectory */}
        <Card className="lg:col-span-2 p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.5rem] bg-slate-900 flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform"><TrendingUp size={22} /></div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Revenue Trajectory</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Capture Trends & Volume Projection</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-primary" /><span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Actual Capture</span></div>
                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-slate-200" /><span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Pipeline Volume</span></div>
                </div>
            </div>
            
            <div className="h-[350px] w-full min-w-0 min-h-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
                  <ComposedChart data={analytics?.revenueStream}>
                    <defs>
                      <linearGradient id="colorActualAnalytics" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D97706" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                       dataKey="name" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '900' }} 
                       dy={15}
                    />
                    <YAxis 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '900' }} 
                       tickFormatter={(v) => `${v / 1000000}M`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                        type="monotone" 
                        dataKey="actual" 
                        name="Yield" 
                        stroke="#D97706" 
                        strokeWidth={4} 
                        fill="url(#colorActualAnalytics)" 
                        animationDuration={1500}
                    />
                    <Bar 
                        dataKey="unweighted" 
                        name="Pipeline Volume" 
                        fill="#f1f5f9" 
                        radius={[6, 6, 0, 0]} 
                        barSize={30}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="target" 
                        name="Goal Threshold" 
                        stroke="#e2e8f0" 
                        strokeWidth={2} 
                        strokeDasharray="10 10" 
                        dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
            </div>
        </Card>

        {/* Side Area: Stage Distribution */}
        <Card className="lg:col-span-1 p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm flex flex-col items-center">
            <div className="w-full mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[1.2rem] bg-primary/10 flex items-center justify-center text-primary"><PieIcon size={20} /></div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Sector Load</h3>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Deal density by engagement stage</p>
            </div>
            
            <div className="relative w-full aspect-square max-w-[280px] min-w-0 min-h-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
                  <PieChart>
                    <Pie
                      data={analytics?.stageData}
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {analytics?.stageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <p className="text-3xl font-black text-slate-900">{analytics?.totalDeals || 0}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Assets</p>
                    </div>
                </div>
            </div>

            <div className="w-full mt-auto space-y-3 pt-6 border-t border-slate-50">
               {analytics?.stageData.map((stage, i) => (
                    <div key={i} className="flex items-center justify-between group cursor-default">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-900 transition-colors">{stage.name}</span>
                        </div>
                        <span className="text-xs font-black text-slate-900">{stage.value}</span>
                    </div>
               ))}
            </div>
        </Card>

        {/* Bottom Full: Real Performance Metrics */}
        <Card className="lg:col-span-3 p-10 rounded-[3rem] bg-slate-900 text-white border-0 shadow-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.5rem] bg-white/10 flex items-center justify-center text-primary"><Zap size={22} fill="currentColor" /></div>
                    <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight italic">Performance Insights</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time deal analytics & conversion metrics</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">System: ACTIVE</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                {[
                    { label: "Win Rate", val: `${analytics?.winRate || 0}%`, icon: ShieldCheck },
                    { label: "Avg Deal Size", val: formatCurrency(analytics?.avgDealValue), icon: Activity },
                    { label: "Avg Days to Close", val: `${analytics?.avgDaysToClose || 0} Days`, icon: Users },
                    { label: "Total Deals", val: `${analytics?.totalDeals || 0} Assets`, icon: Target }
                ].map((m, i) => (
                    <div key={i} className="p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                            <m.icon size={14} className="text-primary opacity-50" />
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{m.label}</p>
                        </div>
                        <p className="text-2xl font-black text-white tabular-nums">{m.val}</p>
                    </div>
                ))}
            </div>
            
            <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
        </Card>
      </div>
    </motion.div>
  );
}
