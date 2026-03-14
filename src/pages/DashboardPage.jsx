import { useMemo } from 'react';
import { useDeals } from '../hooks/useDeals';
import { useSettings } from '../hooks/useSettings';
import { useTeam } from '../hooks/useTeam';
import {
  Target, Layers, DollarSign, Briefcase, ArrowUpRight, ArrowDownRight, TrendingUp, Activity
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar
} from 'recharts';
import { cn } from '../lib/utils';
import { Badge } from '../components/ui/Badge';
import { motion } from 'framer-motion';

const formatCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', notation: 'compact' }).format(amount || 0);
const formatFullCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount || 0);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/95 backdrop-blur-xl border border-[#E8E4DC] p-4 rounded-2xl shadow-2xl shadow-[#1A1614]/10"
      >
        <p className="text-xs font-medium text-[#8B7F70] mb-3">{label}</p>
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-xs text-[#6B645C]">{entry.name}</span>
              </div>
              <p className="text-sm font-bold text-[#1A1614]">
                {formatFullCurrency(entry.value)}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }
  return null;
};

const StatCard = ({ title, value, subValue, icon: Icon, trend, color = "primary", index }) => {
  const colorClasses = {
    primary: { bg: "from-[#1A1614] to-[#3D342B]", text: "text-[#1A1614]", bgSoft: "from-[#F8F6F2] to-[#F0EDE8]" },
    emerald: { bg: "from-[#10B981] to-[#059669]", text: "text-[#10B981]", bgSoft: "from-[#ECFDF5] to-[#D1FAE5]" },
    amber: { bg: "from-[#F59E0B] to-[#D97706]", text: "text-[#F59E0B]", bgSoft: "from-[#FFFBEB] to-[#FEF3C7]" },
  };

  const colors = colorClasses[color] || colorClasses.primary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, scale: 1.02, boxShadow: "0 20px 40px rgba(26, 22, 20, 0.1)" }}
      className="relative overflow-hidden rounded-3xl p-6 bg-white border border-[#E8E4DC] shadow-lg shadow-[#1A1614]/5 transition-all duration-500 group"
    >
      {/* Background Gradient */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500", colors.bgSoft)} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <motion.div
            className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6",
              color === "primary" ? "bg-gradient-to-br from-[#F8F6F2] to-[#F0EDE8] text-[#1A1614]" :
                color === "emerald" ? "bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] text-[#10B981]" :
                  "bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] text-[#F59E0B]"
            )}
          >
            <Icon size={22} />
          </motion.div>
          {trend !== undefined && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold",
                trend >= 0 ? "bg-gradient-to-r from-[#10B981]/10 to-[#059669]/10 text-[#10B981]" : "bg-gradient-to-r from-[#EF4444]/10 to-[#DC2626]/10 text-[#EF4444]"
              )}
            >
              {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.abs(trend)}%
            </motion.div>
          )}
        </div>
        <p className="text-xs font-medium text-[#8B7F70] uppercase tracking-wider mb-2">{title}</p>
        <h3 className="text-2xl font-bold tabular-nums tracking-tight text-[#1A1614] mb-1">{value}</h3>
        {subValue && <p className="text-xs text-[#A8A298] font-medium">{subValue}</p>}
      </div>

      {/* Decorative Circle */}
      <motion.div
        className={cn("absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-5 group-hover:opacity-10 transition-opacity",
          color === "primary" ? "bg-[#1A1614]" : color === "emerald" ? "bg-[#10B981]" : "bg-[#F59E0B]"
        )}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
    </motion.div>
  );
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const childVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
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
        forecast: 0,
        target: monthlyTarget
      });
    }

    deals.forEach(deal => {
      const dealDate = new Date(deal.created_at || deal.createdAt);
      const mIdx = months.findIndex(m => m.month === dealDate.getMonth() && m.year === dealDate.getFullYear());
      if (mIdx !== -1) {
        if (deal.stage === 'won') {
          months[mIdx].actual += Number(deal.value || 0);
        } else if (deal.stage !== 'lost') {
          months[mIdx].forecast += (Number(deal.value || 0) * (Number(deal.probability || 0) / 100));
        }
      }
    });

    const currentMonthActual = months[5].actual;
    const prevMonthActual = months[4].actual;
    const growth = prevMonthActual > 0 ? Math.round(((currentMonthActual - prevMonthActual) / prevMonthActual) * 100) : 0;

    const teamStats = (teamMembers || []).map(m => {
      const mDeals = deals.filter(d => d.assigned_to === m.id && new Date(d.created_at || d.createdAt).getMonth() === currentMonth);
      const won = mDeals.filter(d => d.stage === 'won').reduce((s, d) => s + Number(d.value || 0), 0);
      return { name: m.name, won, target: m.goal || 2000000 };
    });

    return {
      revenueStream: months,
      teamStats,
      currentMonthActual,
      growth,
      totalPipeline: deals.filter(d => d.stage !== 'won' && d.stage !== 'lost').reduce((s, d) => s + Number(d.value || 0), 0)
    };
  }, [deals, monthlyTarget, teamMembers]);

  if (dealsLoading || settingsLoading || teamLoading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-6">
      <motion.div
        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="relative"
      >
        <div className="w-16 h-16 rounded-2xl border-4 border-[#E8E4DC]" />
        <div className="absolute inset-0 rounded-2xl border-4 border-[#1A1614] border-t-transparent animate-spin" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm text-[#8B7F70] font-medium"
      >
        Loading dashboard...
      </motion.p>
    </div>
  );

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="max-w-[1600px] mx-auto space-y-6 pb-8"
    >
      {/* Header */}
      <motion.div
        variants={childVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-white via-white to-[#F8F6F2] p-6 rounded-3xl border border-[#E8E4DC] shadow-lg shadow-[#1A1614]/5"
      >
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1A1614] to-[#3D342B] flex items-center justify-center shadow-xl shadow-[#1A1614]/20"
          >
            <Activity size={28} className="text-white" />
          </motion.div>
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold tracking-tight text-[#1A1614]"
            >
              Dashboard
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-[#8B7F70]"
            >
              Overview of your sales performance
            </motion.p>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Badge variant="outline" className="px-4 py-2 bg-gradient-to-r from-[#10B981]/10 to-[#059669]/10 border-[#10B981]/30 text-[#10B981]">
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-[#10B981] mr-2"
            />
            Live Data
          </Badge>
        </motion.div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(analytics?.currentMonthActual)}
          subValue={`Target: ${formatCurrency(monthlyTarget)}`}
          trend={analytics?.growth}
          icon={DollarSign}
          color="emerald"
          index={0}
        />
        <StatCard
          title="Total Pipeline"
          value={formatCurrency(analytics?.totalPipeline)}
          subValue="Active Opportunities"
          icon={Layers}
          color="primary"
          index={1}
        />
        <StatCard
          title="Target Achievement"
          value={`${Math.round((analytics?.currentMonthActual / monthlyTarget) * 100)}%`}
          subValue={`Goal: ${formatCurrency(monthlyTarget)}`}
          icon={Target}
          color="amber"
          index={2}
        />
        <StatCard
          title="Active Deals"
          value={deals?.filter(d => !['won', 'lost'].includes(d.stage)).length || 0}
          subValue="In Progress"
          icon={Briefcase}
          color="primary"
          index={3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div variants={childVariants} className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-[#1A1614]">Revenue Trend</CardTitle>
                  <p className="text-sm text-[#8B7F70] mt-0.5">Last 6 months performance</p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10B981]/10 to-[#059669]/10 flex items-center justify-center text-[#10B981]"
                >
                  <TrendingUp size={20} />
                </motion.div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={analytics?.revenueStream}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1A1614" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1A1614" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E4DC" strokeOpacity={0.5} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#8B7F70', fontSize: 12, fontFamily: 'inherit' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#8B7F70', fontSize: 12, fontFamily: 'inherit' }}
                    tickFormatter={(val) => `${val / 1000000}M`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    name="Actual"
                    stroke="#1A1614"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorActual)"
                  />
                  <Area
                    type="monotone"
                    dataKey="forecast"
                    name="Forecast"
                    stroke="#A8A298"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fill="none"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Team Performance */}
        <motion.div variants={childVariants}>
          <Card className="overflow-hidden h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-[#1A1614]">Team Performance</CardTitle>
                  <p className="text-sm text-[#8B7F70] mt-0.5">Monthly revenue by member</p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F59E0B]/10 to-[#D97706]/10 flex items-center justify-center text-[#F59E0B]"
                >
                  <Target size={20} />
                </motion.div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={analytics?.teamStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E8E4DC" strokeOpacity={0.5} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#8B7F70', fontSize: 12, fontFamily: 'inherit' }}
                    width={100}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="won"
                    name="Revenue"
                    fill="url(#teamGradient)"
                    radius={[0, 8, 8, 0]}
                    barSize={28}
                  />
                  <defs>
                    <linearGradient id="teamGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#1A1614" />
                      <stop offset="100%" stopColor="#3D342B" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
