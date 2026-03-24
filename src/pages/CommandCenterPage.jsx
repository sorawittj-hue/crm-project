import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeals } from '../hooks/useDeals';
import { useTeam } from '../hooks/useTeam';
import { useSettings } from '../hooks/useSettings';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { formatCurrency, formatFullCurrency, daysSince } from '../lib/formatters';
import CustomTooltip from '../components/ui/CustomTooltip';
import {
  Sliders, Loader2, TrendingUp, 
  ShieldCheck, Crosshair, Users, AlertCircle,
  ArrowUpRight, Briefcase,
  Target, Clock, RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip
} from 'recharts';

export default function CommandCenterPage() {
  const navigate = useNavigate();
  const { data: deals, isLoading: dealsLoading } = useDeals();
  const { data: teamMembers, isLoading: teamLoading } = useTeam();
  const { data: settings, isLoading: settingsLoading } = useSettings();

  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [strategicMandates, setStrategicMandates] = useState([]);

  const monthlyGoal = settings?.monthly_target || 10000000;

  const stats = useMemo(() => {
    if (!deals) return null;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Stats
    const wonDealsThisMonth = deals.filter(d => d.stage === 'won' && new Date(d.created_at).getMonth() === currentMonth);
    const totalWonValue = wonDealsThisMonth.reduce((s, d) => s + (Number(d.value) || 0), 0);
    const activePipeline = deals.filter(d => !['won', 'lost'].includes(d.stage));
    const totalPipelineValue = activePipeline.reduce((s, d) => s + (Number(d.value) || 0), 0);
    const achievementPercent = Math.round((totalWonValue / monthlyGoal) * 100);

    // Revenue Stream (Last 6 Months)
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
      const dealDate = new Date(deal.created_at);
      const mIdx = months.findIndex(m => m.month === dealDate.getMonth() && m.year === dealDate.getFullYear());
      if (mIdx !== -1) {
        if (deal.stage === 'won') months[mIdx].actual += Number(deal.value || 0);
        else if (deal.stage !== 'lost') {
            const weightedValue = Number(deal.value || 0) * (Number(deal.probability || 0) / 100);
            months[mIdx].forecast += weightedValue;
        }
      }
    });

    // Strategy Logic
    const urgentDeals = activePipeline
      .filter(d => daysSince(d.last_activity || d.created_at) >= 3)
      .sort((a,b) => (Number(b.value) * (b.probability/100)) - (Number(a.value) * (a.probability/100)))
      .slice(0, 3);

    // Last month comparison
    const prevMonthIdx = months.length >= 2 ? months.length - 2 : 0;
    const currentMonthActual = months[months.length - 1]?.actual || 0;
    const prevMonthActual = months[prevMonthIdx]?.actual || 0;
    const growthPercent = prevMonthActual > 0 
      ? ((currentMonthActual - prevMonthActual) / prevMonthActual * 100).toFixed(1)
      : 0;

    return { 
        totalWonValue, 
        totalPipelineValue, 
        achievementPercent, 
        activeCount: activePipeline.length,
        urgentDeals,
        revenueStream: months,
        growthPercent
    };
  }, [deals, monthlyGoal]);

  const handleGenerateRules = useMemo(() => () => {
    if (!deals) return;
    setIsGeneratingPlan(true);
    setTimeout(() => {
        const active = deals.filter(d => !['won', 'lost'].includes(d.stage));
        const staleCount = active.filter(d => daysSince(d.last_activity || d.created_at) >= 3).length;
        const closingCount = active.filter(d => d.stage === 'negotiation').length;
        const leadCount = active.filter(d => d.stage === 'lead').length;

        const mandates = [
            { id: 1, title: 'Asset Reclamation', desc: `Follow up with ${staleCount} stale assets (inactive 3+ days) in the next 24h.`, urgency: staleCount > 0 ? 'high' : 'medium', icon: Clock },
            { id: 2, title: 'Closing Sequence', desc: `Move ${closingCount} deals from Closing to Won. Current achievement: ${stats?.achievementPercent}%.`, urgency: closingCount > 0 ? 'high' : 'medium', icon: Crosshair },
            { id: 3, title: 'Pipeline Injection', desc: `Currently ${leadCount} leads in qualification. ${leadCount < 5 ? 'Inject 10+ new prospects.' : 'Pipeline health is stable.'}`, urgency: leadCount < 5 ? 'medium' : 'low', icon: Sliders }
        ];
        setStrategicMandates(mandates);
        setIsGeneratingPlan(false);
    }, 800);
  }, [deals, stats]);

  useEffect(() => {
    if (deals && strategicMandates.length === 0) handleGenerateRules();
  }, [deals, strategicMandates.length, handleGenerateRules]);

  const isLoading = dealsLoading || teamLoading || settingsLoading;

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-6">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full" />
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Synchronizing Command Center...</p>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 pb-20 px-4 md:px-0">
      {/* 1. BRAVO HERO SECTION */}
      <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-primary text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full">Secure ALPHA</div>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-1.5"><ShieldCheck size={12} /> System Status: Operational</p>
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-[calc(-0.06em)] leading-none uppercase">
            Command <span className="text-primary italic">Center</span>
          </h1>
          <p className="text-sm font-bold text-slate-400 leading-relaxed max-w-md">Global strategic overview and tactical mandates for executive sales management.</p>
        </div>

        <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleGenerateRules} className="h-14 px-8 rounded-2xl bg-white border border-slate-100 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50">
               {isGeneratingPlan ? <Loader2 size={16} className="animate-spin mr-2" /> : <RefreshCw size={16} className="mr-2" />} Recalculate Rules
            </Button>
            <Button onClick={() => navigate('/pipeline')} className="h-14 px-10 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-slate-900/20 hover:scale-105 transition-transform">
               <Sliders size={16} className="mr-2" /> Deploy Strategy
            </Button>
        </div>
      </header>

      {/* 2. WAR ROOM KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-8 rounded-[2.5rem] bg-[#141210] text-white border-0 shadow-2xl relative overflow-hidden lg:col-span-2 group">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
            <div className="relative z-10 flex flex-col justify-between h-full">
               <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Monthly Yield Goal</h3>
                    <p className="text-4xl font-black text-white tabular-nums tracking-tighter">{formatFullCurrency(monthlyGoal)}</p>
                  </div>
                  <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black border",
                    Number(stats?.growthPercent) >= 0 
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                      : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                  )}>
                     <TrendingUp size={12} /> {stats?.growthPercent > 0 ? '+' : ''}{stats?.growthPercent}% VS LAST MO
                  </div>
               </div>
               
               <div className="space-y-4">
                  <div className="flex justify-between items-end">
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Execution</p>
                        <p className="text-3xl font-black text-primary tabular-nums tracking-tight">{formatFullCurrency(stats?.totalWonValue)}</p>
                     </div>
                     <p className="text-6xl font-black text-white/5 tracking-tighter tabular-nums">{stats?.achievementPercent}%</p>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, stats?.achievementPercent)}%` }}
                        transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
                        className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                     />
                  </div>
               </div>
            </div>
        </Card>

        <Card className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all duration-500">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm">
               <Briefcase size={22} />
            </div>
            <div>
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Active Multiplier</h3>
               <p className="text-4xl font-black text-slate-900 tabular-nums tracking-tighter">{stats?.activeCount}<span className="text-lg text-slate-300 ml-2">Units</span></p>
               <p className="text-xs font-bold text-slate-400 mt-2">Currently in engagement</p>
            </div>
        </Card>

        <Card className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all duration-500">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-rose-500 group-hover:text-white transition-all duration-500 shadow-sm">
               <AlertCircle size={22} />
            </div>
            <div>
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Stagnancy Risk</h3>
               <p className="text-4xl font-black text-rose-500 tabular-nums tracking-tighter">{stats?.urgentDeals?.length}<span className="text-lg text-slate-300 ml-2">Assets</span></p>
               <p className="text-xs font-bold text-slate-400 mt-2">Requires immediate recon</p>
            </div>
        </Card>
      </div>

      {/* 3. INTELLIGENCE MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Strategic Mandates */}
        <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Target size={18} /></div>
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Daily Mandates</h3>
            </div>
            <div className="space-y-4">
               {strategicMandates.map((m, i) => (
                 <motion.div 
                    key={m.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={cn(
                        "p-6 rounded-[2rem] border transition-all cursor-default group",
                        m.urgency === 'high' ? "bg-rose-50/30 border-rose-100 hover:bg-rose-50" : "bg-white border-slate-100 hover:border-primary/20 hover:bg-slate-50/50"
                    )}
                 >
                    <div className="flex gap-4">
                       <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm shrink-0", m.urgency === 'high' ? "bg-white text-rose-500" : "bg-white text-primary")}>
                          <m.icon size={20} />
                       </div>
                       <div className="space-y-1">
                          <p className={cn("text-[9px] font-black uppercase tracking-[0.2em]", m.urgency === 'high' ? "text-rose-400" : "text-slate-400")}>{m.urgency} Priority</p>
                          <h4 className="text-sm font-black text-slate-900 tracking-tight">{m.title}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed font-medium">{m.desc}</p>
                       </div>
                    </div>
                 </motion.div>
               ))}
               {isGeneratingPlan && (
                 <div className="p-10 text-center space-y-3">
                    <Loader2 className="animate-spin text-primary mx-auto" size={24} />
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Executing Logic Rules...</p>
                 </div>
               )}
            </div>
        </div>

        {/* Center/Right: Revenue Matrix Map */}
        <Card className="lg:col-span-2 p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white"><ArrowUpRight size={20} /></div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Performance Matrix</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actual Capture vs. Weighted Forecast</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-primary" /><span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Actual</span></div>
                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-slate-200" /><span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Forecast</span></div>
                </div>
            </div>
            
            <div className="h-[350px] w-full min-w-0 min-h-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
                  <AreaChart data={stats?.revenueStream}>
                    <defs>
                      <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D97706" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.05} />
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
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
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area 
                        type="monotone" 
                        dataKey="actual" 
                        name="Actual Capture" 
                        stroke="#D97706" 
                        strokeWidth={4} 
                        fill="url(#colorActual)" 
                        animationDuration={2000}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="forecast" 
                        name="Weighted Pipeline" 
                        stroke="#cbd5e1" 
                        strokeWidth={2} 
                        strokeDasharray="6 6" 
                        fill="url(#colorForecast)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
      </div>

      {/* 4. OPERATIVE PERFORMANCE (Leaderboard) */}
      <div className="space-y-8">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white"><Users size={18} /></div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Field Personnel</h3>
              </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             {teamMembers?.map((m, i) => {
                const mWon = deals?.filter(d => d.assigned_to === m.id && new Date(d.created_at).getMonth() === new Date().getMonth() && d.stage === 'won').reduce((s,d) => s + Number(d.value), 0) || 0;
                const mPercent = Math.round((mWon / (m.goal || 2500000)) * 100);

                return (
                  <motion.div 
                    key={m.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all"
                  >
                     <div className="flex items-center gap-4 mb-8">
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg transition-transform group-hover:scale-110", m.color?.split(' ')[0] || 'bg-slate-900')}>
                            {m.name.charAt(0)}
                        </div>
                        <div>
                            <h4 className="font-black text-slate-900 text-lg leading-none">{m.name}</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{m.role}</p>
                        </div>
                     </div>
                     <div className="space-y-5">
                         <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Yield Capture</p>
                                <p className="text-lg font-black text-slate-900 tabular-nums">{formatCurrency(mWon)}</p>
                            </div>
                            <p className="text-3xl font-black text-slate-100 tabular-nums group-hover:text-primary transition-colors">{mPercent}%</p>
                         </div>
                         <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, mPercent)}%` }}
                                transition={{ duration: 1.5, delay: 0.5 + (i * 0.1) }}
                                className={cn("h-full rounded-full shadow-sm", m.color?.split(' ')[0] || 'bg-slate-900')}
                            />
                         </div>
                     </div>
                  </motion.div>
                );
             })}
          </div>
      </div>
    </div>
  );
}
