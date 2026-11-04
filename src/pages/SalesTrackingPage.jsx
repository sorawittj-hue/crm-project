import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import SafeResponsiveContainer from "../components/charts/SafeResponsiveContainer";
import { buildPipelineIntelligence } from "../utils/salesIntelligence";
import {
  BadgeDollarSign,
  TrendingUp,
  Save,
  Loader2,
  Calendar,
  BarChart3,
  Edit2,
  Zap,
} from "lucide-react";
import { useDeals } from "../hooks/useDeals";
import { useMonthlySales, useUpsertMonthlySale } from "../hooks/useSales";
import { useAppStore } from "../store/useAppStore";
import { useSubscription } from "../hooks/useSubscription";
import { formatCurrency } from "../lib/formatters";
import { cn } from "../lib/utils";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import PageHeader from "../components/layout/PageHeader";

const MONTHS = [
  { value: 1, label: "ม.ค.", full: "มกราคม" },
  { value: 2, label: "ก.พ.", full: "กุมภาพันธ์" },
  { value: 3, label: "มี.ค.", full: "มีนาคม" },
  { value: 4, label: "เม.ย.", full: "เมษายน" },
  { value: 5, label: "พ.ค.", full: "พฤษภาคม" },
  { value: 6, label: "มิ.ย.", full: "มิถุนายน" },
  { value: 7, label: "ก.ค.", full: "กรกฎาคม" },
  { value: 8, label: "ส.ค.", full: "สิงหาคม" },
  { value: 9, label: "ก.ย.", full: "กันยายน" },
  { value: 10, label: "ต.ค.", full: "ตุลาคม" },
  { value: 11, label: "พ.ย.", full: "พฤศจิกายน" },
  { value: 12, label: "ธ.ค.", full: "ธันวาคม" },
];

const pageMotion = {
  initial: { opacity: 0, y: 15 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.19, 1, 0.22, 1] },
  },
  exit: { opacity: 0, y: -15, transition: { duration: 0.2 } },
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 dark:bg-[#171926]/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-200/80 dark:border-white/10 flex flex-col gap-1 z-50 min-w-[170px]">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {data.fullMonth} {data.year}
        </p>
        <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5 tracking-tight">
          {formatCurrency(data.amount)}
        </p>
        {data.isCurrentMonth && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 px-2 py-0.5 rounded-full w-fit mt-1">
            <Zap size={10} className="fill-emerald-500 text-emerald-500" /> Live
            Pipeline
          </span>
        )}
      </div>
    );
  }
  return null;
};

export default function SalesTrackingPage() {
  const calendarYear = new Date().getFullYear();
  const [currentYear, setCurrentYear] = useState(calendarYear);
  const currentMonth = new Date().getMonth() + 1;
  const { monthlyTarget, openPaywall } = useAppStore();
  const { shouldBlockBasic, isGuestAccount } = useSubscription();
  const annualTarget = monthlyTarget * 12;

  const { data: deals = [] } = useDeals();
  const { data: dbSales = [] } = useMonthlySales(currentYear);
  const upsertSale = useUpsertMonthlySale();

  const [editValues, setEditValues] = useState({});
  const [editingMonth, setEditingMonth] = useState(null);
  const [showChart, setShowChart] = useState(false);
  const [chartType, setChartType] = useState("bar");

  useEffect(() => {
    const timer = setTimeout(() => setShowChart(true), 350);
    return () => clearTimeout(timer);
  }, []);

  const currentMonthPipelineSales = useMemo(() => {
    const intelligence = buildPipelineIntelligence(deals, {
      monthlyGoal: monthlyTarget,
      now: new Date(),
    });
    return intelligence.currentMonthWonValue;
  }, [deals, monthlyTarget]);

  const mergedSalesData = useMemo(() => {
    const data = [];
    let cumulative = 0;
    for (const m of MONTHS) {
      const isCurrentMonth =
        currentYear === calendarYear && m.value === currentMonth;
      let amount = 0;
      if (isCurrentMonth) {
        amount = currentMonthPipelineSales;
      } else {
        const dbRecord = dbSales.find((s) => s.month === m.value);
        amount = dbRecord ? Number(dbRecord.amount) : 0;
      }
      cumulative += amount;
      data.push({
        month: m.value,
        shortMonth: m.label,
        fullMonth: m.full,
        year: currentYear,
        amount,
        cumulative,
        isCurrentMonth,
      });
    }
    return data;
  }, [
    dbSales,
    currentMonthPipelineSales,
    currentMonth,
    currentYear,
    calendarYear,
  ]);

  const totalYearlySales =
    mergedSalesData[mergedSalesData.length - 1].cumulative;
  const annualProgress =
    annualTarget > 0
      ? Math.min(100, Math.round((totalYearlySales / annualTarget) * 100))
      : 0;
  const currentMonthProgress =
    monthlyTarget > 0
      ? Math.min(
          100,
          Math.round((currentMonthPipelineSales / monthlyTarget) * 100),
        )
      : 0;

  const lastMonthAmount =
    currentMonth > 1 ? mergedSalesData[currentMonth - 2]?.amount || 0 : 0;
  const momGrowth =
    lastMonthAmount > 0
      ? Math.round(
          ((currentMonthPipelineSales - lastMonthAmount) / lastMonthAmount) *
            100,
        )
      : null;

  const quarterlySales = useMemo(() => {
    const q1 = mergedSalesData
      .slice(0, 3)
      .reduce((sum, item) => sum + item.amount, 0);
    const q2 = mergedSalesData
      .slice(3, 6)
      .reduce((sum, item) => sum + item.amount, 0);
    const q3 = mergedSalesData
      .slice(6, 9)
      .reduce((sum, item) => sum + item.amount, 0);
    const q4 = mergedSalesData
      .slice(9, 12)
      .reduce((sum, item) => sum + item.amount, 0);
    return [
      {
        id: "Q1",
        label: "Q1",
        sub: "ม.ค. – มี.ค.",
        amount: q1,
        color: "violet",
      },
      {
        id: "Q2",
        label: "Q2",
        sub: "เม.ย. – มิ.ย.",
        amount: q2,
        color: "blue",
      },
      {
        id: "Q3",
        label: "Q3",
        sub: "ก.ค. – ก.ย.",
        amount: q3,
        color: "emerald",
      },
      { id: "Q4", label: "Q4", sub: "ต.ค. – ธ.ค.", amount: q4, color: "amber" },
    ];
  }, [mergedSalesData]);

  const handleSaveMonth = async (monthNum) => {
    if (shouldBlockBasic) {
      openPaywall(isGuestAccount ? "default" : "trial_ended");
      return;
    }
    const val = editValues[monthNum];
    if (val === undefined) {
      setEditingMonth(null);
      return;
    }
    const numAmount = parseFloat(String(val).replace(/,/g, "")) || 0;
    try {
      await upsertSale.mutateAsync({
        year: currentYear,
        month: monthNum,
        amount: numAmount,
      });
      setEditingMonth(null);
    } catch {
      // error handled by mutation
    }
  };

  return (
    <motion.div
      {...pageMotion}
      className="mesh-bg max-w-[1600px] mx-auto space-y-6 pb-20 px-4 md:px-6 mt-4 relative overflow-hidden"
    >
      {/* Ambient background glows */}
      <div className="absolute top-[-5%] left-[-10%] w-[50%] h-[600px] rounded-full bg-teal-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-5%] w-[40%] h-[500px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      {/* PAGE HEADER */}
      <PageHeader
        icon={BadgeDollarSign}
        title={`ติดตามยอดขายประจำปี ${currentYear + 543}`}
        description="วิเคราะห์เป้าหมาย ยอดขายรายเดือน และยอดรวมสะสมแบบเรียลไทม์"
        rightContent={
          <div className="flex flex-wrap items-center gap-2 bg-white/80 dark:bg-white/[0.06] backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm">
            <select
              aria-label="ปีที่แสดงยอดขาย"
              value={currentYear}
              onChange={(event) => {
                setCurrentYear(Number(event.target.value));
                setEditingMonth(null);
                setEditValues({});
              }}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
            >
              {Array.from(
                { length: 5 },
                (_, index) => calendarYear - index,
              ).map((year) => (
                <option key={year} value={year}>
                  ปี {year + 543}
                </option>
              ))}
            </select>
            <motion.button
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.97 }}
              aria-pressed={chartType === "bar"}
              onClick={() => setChartType("bar")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                chartType === "bar"
                  ? "bg-gradient-to-r from-teal-600 to-teal-600 text-white shadow-md shadow-teal-500/20"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
              )}
            >
              <BarChart3 size={14} /> กราฟแท่ง
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.97 }}
              aria-pressed={chartType === "area"}
              onClick={() => setChartType("area")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                chartType === "area"
                  ? "bg-gradient-to-r from-teal-600 to-teal-600 text-white shadow-md shadow-teal-500/20"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
              )}
            >
              <TrendingUp size={14} /> กราฟแนวโน้ม
            </motion.button>
          </div>
        }
      />

      <div className="nova-sales-overview">
        <section className="nova-sales-total">
          <p className="nova-eyebrow">YEAR TO DATE</p>
          <span>ยอดขายสะสมปี {currentYear + 543}</span>
          <strong>{formatCurrency(totalYearlySales)}</strong>
          <div className="nova-sales-progress">
            <i style={{ width: annualProgress + "%" }} />
          </div>
          <p>
            {annualProgress}% ของเป้า {formatCurrency(annualTarget)}
          </p>
        </section>
        <section className="nova-sales-month">
          <div>
            <p className="nova-eyebrow">MONTHLY PERFORMANCE</p>
            <h2>
              {MONTHS[currentMonth - 1].full} {currentYear + 543}
            </h2>
          </div>
          <strong>
            {formatCurrency(mergedSalesData[currentMonth - 1]?.amount || 0)}
          </strong>
          <p>
            {currentYear === calendarYear
              ? currentMonthProgress + "% ของเป้ารายเดือน"
              : "ยอดขายที่บันทึกในเดือนนี้"}
          </p>
          {currentYear === calendarYear && momGrowth !== null && (
            <span
              className={cn(
                "nova-metric-trend",
                momGrowth < 0 && "is-negative",
              )}
            >
              {momGrowth > 0 ? "+" : ""}
              {momGrowth}% เทียบเดือนก่อน
            </span>
          )}
        </section>
        <section className="nova-sales-target">
          <p className="nova-eyebrow">QUARTERLY TARGET</p>
          <span>เป้าหมายรายไตรมาส</span>
          <strong>{formatCurrency(monthlyTarget * 3)}</strong>
          <p>เฉลี่ย {formatCurrency(monthlyTarget)} ต่อเดือน</p>
          <span className="nova-target-note">
            เป้าหมายกำหนดจากการตั้งค่าทีม
          </span>
        </section>
      </div>

      {/* CHART SECTION */}
      <div className="p-6 rounded-3xl bg-white/90 dark:bg-[#192629]/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.6)] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <BarChart3
                className="text-teal-600 dark:text-teal-400"
                size={20}
              />
              ยอดขายรายเดือนตลอดปี {currentYear + 543}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              เปรียบเทียบยอดขายในแต่ละเดือนกับเป้าหมายรายเดือนที่ตั้งไว้
            </p>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          {showChart && (
            <SafeResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <BarChart
                  data={mergedSalesData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="barGradientViolet"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#0f766e" stopOpacity={0.9} />
                      <stop
                        offset="100%"
                        stopColor="#0f766e"
                        stopOpacity={0.6}
                      />
                    </linearGradient>
                    <linearGradient
                      id="barGradientEmerald"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                      <stop
                        offset="100%"
                        stopColor="#059669"
                        stopOpacity={0.8}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(148, 163, 184, 0.15)"
                  />
                  <XAxis
                    dataKey="shortMonth"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 700 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    tickFormatter={(val) => `${val / 1000}k`}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" radius={[10, 10, 0, 0]}>
                    {mergedSalesData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.isCurrentMonth
                            ? "url(#barGradientEmerald)"
                            : "url(#barGradientViolet)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <AreaChart
                  data={mergedSalesData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="areaGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#0f766e" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#0f766e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(148, 163, 184, 0.15)"
                  />
                  <XAxis
                    dataKey="shortMonth"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 700 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    tickFormatter={(val) => `${val / 1000}k`}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#0f766e"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#areaGradient)"
                  />
                </AreaChart>
              )}
            </SafeResponsiveContainer>
          )}
        </div>
      </div>

      {/* QUARTERLY BREAKDOWN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quarterlySales.map((q) => {
          const targetForQ = monthlyTarget * 3;
          const qProgress =
            targetForQ > 0
              ? Math.min(100, Math.round((q.amount / targetForQ) * 100))
              : 0;
          const qColors = {
            Q1: { accent: "#0f766e" },
            Q2: { accent: "#0284c7" },
            Q3: { accent: "#059669" },
            Q4: { accent: "#d97706" },
          };
          const qCfg = qColors[q.id] || qColors.Q1;

          return (
            <div
              key={q.id}
              className="p-5 rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#192629] shadow-sm space-y-3 transition-shadow hover:shadow-md relative overflow-hidden"
            >
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs"
                    style={{
                      background: `${qCfg.accent}18`,
                      color: qCfg.accent,
                    }}
                  >
                    {q.label}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {q.label}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {q.sub}
                    </p>
                  </div>
                </div>
                <span
                  className="text-xs font-black px-2 py-0.5 rounded-full border"
                  style={{
                    background: `${qCfg.accent}20`,
                    color: qCfg.accent,
                    borderColor: `${qCfg.accent}40`,
                  }}
                >
                  {qProgress}%
                </span>
              </div>

              <div className="relative z-10">
                <p className="number-display text-2xl text-slate-950 dark:text-white">
                  {formatCurrency(q.amount)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                  จากเป้า {formatCurrency(targetForQ)}
                </p>
              </div>

              <div className="relative z-10 h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${qProgress}%`, background: qCfg.accent }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* MONTHLY GRID & EDITING */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Calendar className="text-teal-600 dark:text-teal-400" size={18} />
            จัดการยอดขายรายเดือน
          </h3>
          <p className="text-xs text-slate-400 font-medium hidden sm:block">
            คลิกที่เดือนย้อนหลังเพื่อปรับแก้ไขยอดขายที่เกิดขึ้นจริง
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mergedSalesData.map((m) => {
            const isEditing = editingMonth === m.month;
            const progressMonth =
              monthlyTarget > 0
                ? Math.min(100, Math.round((m.amount / monthlyTarget) * 100))
                : 0;
            return (
              <div
                key={m.month}
                className={cn(
                  "p-5 rounded-3xl border transition-all duration-300 bg-white/80 dark:bg-[#192629]/80 backdrop-blur-xl relative overflow-hidden group",
                  m.isCurrentMonth
                    ? "border-emerald-400 dark:border-emerald-500/50 ring-2 ring-emerald-400/20 shadow-md shadow-emerald-500/10"
                    : "border-slate-200/80 dark:border-white/10 hover:border-teal-300 dark:hover:border-teal-500/40 hover:shadow-md",
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {m.fullMonth}
                    </span>
                    {m.isCurrentMonth && (
                      <span className="text-[9px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                        เดือนนี้ (Live)
                      </span>
                    )}
                  </div>

                  {!m.isCurrentMonth && !isEditing && (
                    <button
                      onClick={() => {
                        setEditingMonth(m.month);
                        setEditValues((prev) => ({
                          ...prev,
                          [m.month]: m.amount,
                        }));
                      }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-teal-50 dark:hover:bg-white/10 hover:text-teal-600 dark:hover:text-white transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="แก้ไขยอดขาย"
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      type="number"
                      value={editValues[m.month] ?? m.amount}
                      onChange={(e) =>
                        setEditValues((prev) => ({
                          ...prev,
                          [m.month]: e.target.value,
                        }))
                      }
                      className="h-10 text-sm font-black border-teal-300 focus:border-teal-500 rounded-xl"
                      placeholder="ระบุจำนวนเงิน"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveMonth(m.month)}
                        disabled={upsertSale.isPending}
                        className="flex-1 h-8 rounded-xl bg-teal-600 text-white font-bold text-xs"
                      >
                        {upsertSale.isPending ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Save size={12} />
                        )}
                        บันทึก
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingMonth(null)}
                        className="h-8 rounded-xl text-xs font-bold"
                      >
                        ยกเลิก
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                      {formatCurrency(m.amount)}
                    </p>
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-extrabold">
                        <span>ความคืบหน้า</span>
                        <span>{progressMonth}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            m.isCurrentMonth ? "bg-emerald-500" : "bg-teal-600",
                          )}
                          style={{ width: `${progressMonth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
