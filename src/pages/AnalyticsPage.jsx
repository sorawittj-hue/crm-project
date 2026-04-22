import { useMemo, useState } from 'react';
import { useDeals } from '../hooks/useDeals';
import { useSettings } from '../hooks/useSettings';
import { useTeam } from '../hooks/useTeam';
import { Card } from '../components/ui/Card';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/formatters';
import { STAGE_COLORS, STAGE_LABELS } from '../lib/constants';
import CustomTooltip from '../components/ui/CustomTooltip';
import {
  ResponsiveContainer, Area, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell,
  ComposedChart, Line
} from 'recharts';
import {
  Target, Users,
  ArrowUpRight, ArrowDownRight, Loader2,
  Activity, DollarSign,
  ShieldCheck
} from 'lucide-react';

const MetricCard = ({ title, value, subValue, icon: Icon, trend, color = "primary" }) => {
    const colorStyles = {
        primary: "text-violet-600 bg-violet-50 border-violet-100",
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
        rose: "text-rose-600 bg-rose-50 border-rose-100",
        slate: "text-slate-600 bg-slate-50 border-slate-100"
    };

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="group">
        <Card className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colorStyles[color])}>
                <Icon size={18} />
              </div>
              {trend !== undefined && (
                <div className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
                  trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                )}>
                  {trend >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {Math.abs(trend)}%
                </div>
              )}
            </div>

            <div className="space-y-0.5">
                <p className="text-xs text-slate-400">{title}</p>
                <h3 className="text-2xl font-bold text-slate-900 tabular-nums leading-none">{value}</h3>
                {subValue && <p className="text-xs text-slate-400 mt-1.5">{subValue}</p>}
            </div>
          </div>
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
        name: d.toLocaleDateString('th-TH', { month: 'short' }),
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
        name: STAGE_LABELS[stage] || stage,
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
      <p className="text-sm text-slate-400">กำลังโหลดข้อมูล...</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-[1600px] mx-auto space-y-6 pb-20 px-4 md:px-0">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">รายงานยอดขาย</h1>
          <p className="text-sm text-slate-500 mt-1">วิเคราะห์ผลการขายและแนวโน้ม</p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {[['3m','3 เดือน'], ['6m','6 เดือน'], ['12m','12 เดือน']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setTimeRange(val)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all",
                timeRange === val ? "bg-white shadow text-violet-700" : "text-slate-500 hover:text-slate-800"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* PRIMARY KPI RIBBON */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="ยอดขายเดือนนี้"
          value={formatCurrency(analytics?.currentMonthActual)}
          subValue={`เป้า: ${formatCurrency(monthlyTarget)}`}
          trend={analytics?.growth}
          icon={DollarSign}
          color="emerald"
        />
        <MetricCard
          title="Pipeline ทั้งหมด"
          value={formatCurrency(analytics?.totalPipeline)}
          subValue={`${analytics?.activeCount} ดีลที่กำลังดำเนินการ`}
          icon={Activity}
          color="primary"
        />
        <MetricCard
          title="อัตราปิดดีล"
          value={`${analytics?.winRate}%`}
          subValue="Win Rate ทั้งหมด"
          icon={Target}
          color="primary"
        />
        <MetricCard
          title="ทีมขาย"
          value={teamMembers?.length || 0}
          subValue="พนักงานขายทั้งหมด"
          icon={Users}
          color="slate"
        />
      </div>

      {/* ANALYSIS CHART GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Area: Revenue Trajectory */}
        <Card className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
                <div>
                    <h3 className="text-sm font-semibold text-slate-900">แนวโน้มยอดขาย</h3>
                    <p className="text-xs text-slate-400 mt-0.5">ยอดจริง vs pipeline</p>
                </div>
                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-xs text-slate-400">จริง</span></div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-200" /><span className="text-xs text-slate-400">Pipeline</span></div>
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
        <Card className="lg:col-span-1 p-6 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col items-center">
            <div className="w-full mb-5">
                <h3 className="text-sm font-semibold text-slate-900">ดีลตามขั้นตอน</h3>
                <p className="text-xs text-slate-400 mt-0.5">จำนวนดีลในแต่ละขั้นตอน</p>
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
                        <p className="text-xs text-slate-400">ดีลทั้งหมด</p>
                    </div>
                </div>
            </div>

            <div className="w-full mt-auto space-y-2.5 pt-5 border-t border-slate-100">
               {analytics?.stageData.map((stage) => (
                    <div key={stage.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                            <span className="text-xs text-slate-600">{stage.name}</span>
                        </div>
                        <span className="text-xs font-semibold text-slate-900">{stage.value}</span>
                    </div>
               ))}
            </div>
        </Card>

        {/* Bottom Full: Performance Metrics */}
        <Card className="lg:col-span-3 p-6 rounded-2xl bg-slate-900 text-white border-0 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-5 relative z-10">
                <div>
                    <h3 className="text-sm font-semibold text-white">ตัวชี้วัดประสิทธิภาพ</h3>
                    <p className="text-xs text-slate-400 mt-0.5">วิเคราะห์อัตราการปิดและค่าเฉลี่ย</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-xs text-slate-400">อัปเดตแบบ Real-time</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
                {[
                    { label: "อัตราปิดดีล", val: `${analytics?.winRate || 0}%`, icon: ShieldCheck },
                    { label: "มูลค่าดีลเฉลี่ย", val: formatCurrency(analytics?.avgDealValue), icon: Activity },
                    { label: "เฉลี่ยวันในการปิด", val: `${analytics?.avgDaysToClose || 0} วัน`, icon: Users },
                    { label: "ดีลทั้งหมด", val: `${analytics?.totalDeals || 0} ดีล`, icon: Target }
                ].map((m, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                            <m.icon size={13} className="text-violet-400" />
                            <p className="text-xs text-slate-400">{m.label}</p>
                        </div>
                        <p className="text-xl font-bold text-white tabular-nums">{m.val}</p>
                    </div>
                ))}
            </div>
        </Card>
      </div>
    </motion.div>
  );
}
