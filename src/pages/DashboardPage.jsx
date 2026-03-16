import { useMemo } from 'react';
import { useDeals } from '../hooks/useDeals';
import { useSettings } from '../hooks/useSettings';
import { useTeam } from '../hooks/useTeam';
import {
  Layers, Briefcase, ArrowUpRight, ArrowDownRight, TrendingUp, Star
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar, Cell
} from 'recharts';
import { cn } from '../lib/utils';
import { Badge } from '../components/ui/Badge';
import { motion } from 'framer-motion';

const formatCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', notation: 'compact' }).format(amount || 0);
const formatFullCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount || 0);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-xl">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <span className="text-xs font-semibold text-slate-600">{entry.name}</span>
              <p className="text-sm font-black text-slate-900">{formatFullCurrency(entry.value)}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const StatCard = ({ title, value, subValue, icon: Icon, trend, color = "primary", index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white border border-slate-200/60 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", 
          color === "primary" ? "bg-slate-900" : color === "emerald" ? "bg-emerald-600" : "bg-amber-500"
        )}>
          <Icon size={22} />
        </div>
        {trend !== undefined && (
          <div className={cn("flex items-center gap-1 font-bold text-xs px-2 py-1 rounded-full", trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
            {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
      {subValue && <p className="text-xs text-slate-400 font-medium mt-1">{subValue}</p>}
    </motion.div>
  );
};

export default function DashboardPage() {
  const { data: deals, isLoading: dealsLoading } = useDeals();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: teamMembers, isLoading: teamLoading } = useTeam();

  const monthlyTarget = settings?.monthly_target || 10000000;

  const analytics = useMemo(() => {
    if (!deals) return null;
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      months.push({
        name: d.toLocaleDateString('en-US', { month: 'short' }),
        month: d.getMonth(),
        year: d.getFullYear(),
        actual: 0,
        forecast: 0
      });
    }

    deals.forEach(deal => {
      const dealDate = new Date(deal.created_at || deal.createdAt);
      const mIdx = months.findIndex(m => m.month === dealDate.getMonth() && m.year === dealDate.getFullYear());
      if (mIdx !== -1) {
        if (deal.stage === 'won') months[mIdx].actual += Number(deal.value || 0);
        else if (deal.stage !== 'lost') months[mIdx].forecast += (Number(deal.value || 0) * (Number(deal.probability || 0) / 100));
      }
    });

    const currentActual = months[5].actual;
    const prevActual = months[4].actual;
    const growth = prevActual > 0 ? Math.round(((currentActual - prevActual) / prevActual) * 100) : 0;
    const achievementPercent = Math.round((currentActual / monthlyTarget) * 100);

    const teamStats = (teamMembers || []).map(m => {
      const mDeals = deals.filter(d => d.assigned_to === m.id && new Date(d.created_at || d.createdAt).getMonth() === currentMonth);
      const won = mDeals.filter(d => d.stage === 'won').reduce((s, d) => s + Number(d.value || 0), 0);
      return { name: m.name, won };
    });

    return {
      revenueStream: months,
      teamStats,
      currentActual,
      growth,
      achievementPercent,
      totalPipeline: deals.filter(d => d.stage !== 'won' && d.stage !== 'lost').reduce((s, d) => s + Number(d.value || 0), 0)
    };
  }, [deals, monthlyTarget, teamMembers]);

  if (dealsLoading || settingsLoading || teamLoading) return <div className="p-20 text-center text-slate-400">Loading Intelligence...</div>;

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-12">
      {/* Target Progress Hero */}
      <Card className="p-8 rounded-[2.5rem] bg-slate-900 text-white border-0 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/20 to-transparent pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
          <div className="space-y-6 flex-1">
            <div className="flex items-center gap-3">
               <Badge className="rounded-full bg-emerald-500 hover:bg-emerald-500 text-white border-0 px-4 py-1">REAL-TIME</Badge>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Performance Period</p>
            </div>
            <h1 className="text-5xl font-black tracking-tight leading-tight">Monthly Sales Goal: <br /><span className="text-primary">{formatFullCurrency(monthlyTarget)}</span></h1>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Revenue</p>
                 <p className="text-2xl font-black text-white">{formatFullCurrency(analytics?.currentActual)}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Remaining Gap</p>
                 <p className="text-2xl font-black text-primary">{formatFullCurrency(Math.max(0, monthlyTarget - (analytics?.currentActual || 0)))}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-56 h-56 flex items-center justify-center">
               <svg className="w-full h-full -rotate-90">
                 <circle cx="112" cy="112" r="100" className="stroke-white/10 fill-none" strokeWidth="12" />
                 <motion.circle 
                    cx="112" cy="112" r="100" 
                    className="stroke-primary fill-none" 
                    strokeWidth="12"
                    strokeDasharray="628"
                    initial={{ strokeDashoffset: 628 }}
                    animate={{ strokeDashoffset: 628 - (628 * Math.min(100, analytics?.achievementPercent || 0)) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                 />
               </svg>
               <div className="absolute flex flex-col items-center">
                  <span className="text-5xl font-black tracking-tighter">{analytics?.achievementPercent}%</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Achieved</span>
               </div>
            </div>
            <p className="text-xs text-slate-400 font-medium">Monthly progress updated successfully</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Revenue Growth" value={`${analytics?.growth >= 0 ? '+' : ''}${analytics?.growth}%`} icon={TrendingUp} trend={analytics?.growth} color="emerald" index={0} />
        <StatCard title="Pipeline Value" value={formatCurrency(analytics?.totalPipeline)} subValue="Total active opportunities" icon={Layers} index={1} />
        <StatCard title="Active Projects" value={deals?.filter(d => !['won', 'lost'].includes(d.stage)).length || 0} subValue="Work in progress" icon={Briefcase} index={2} />
        <StatCard title="High Value Leads" value={deals?.filter(d => Number(d.value) >= 1000000 && !['won', 'lost'].includes(d.stage)).length || 0} subValue="Tier A opportunities" icon={Star} color="amber" index={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 p-8 rounded-[2rem] border-slate-200/60 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Revenue Trend</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-900" /><span className="text-[10px] font-bold text-slate-500 uppercase">Actual</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-200" /><span className="text-[10px] font-bold text-slate-500 uppercase">Forecast</span></div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={analytics?.revenueStream}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F172A" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#0F172A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} tickFormatter={(v) => `${v / 1000000}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="actual" name="Actual" stroke="#0F172A" strokeWidth={4} fill="url(#colorActual)" />
              <Area type="monotone" dataKey="forecast" name="Forecast" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-8 rounded-[2rem] border-slate-200/60 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-8">Team Performance</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={analytics?.teamStats} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: 'bold' }} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="won" name="Revenue" radius={[0, 10, 10, 0]} barSize={24}>
                {analytics?.teamStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#0F172A" : "#334155"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
