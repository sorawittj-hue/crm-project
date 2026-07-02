import { useMemo, useState, useEffect, useRef } from 'react';
import { useDeals } from '../hooks/useDeals';

import { useTeam } from '../hooks/useTeam';
import { useAuth } from '../hooks/useAuth';
import { useMyProfile } from '../hooks/useUserProfiles';
import { useCustomers } from '../hooks/useCustomers';
import { Card } from '../components/ui/Card';
import { motion, animate, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/formatters';
import { STAGE_COLORS, STAGE_LABELS } from '../lib/constants';
import { buildPipelineIntelligence, DEFAULT_STAGE_PROBABILITY } from '../utils/salesIntelligence';
import { buildCustomerHealth } from '../utils/customerIntelligence';
import { calculateForecastAccuracy, getLostReasonBreakdown } from '../utils/forecastAccuracy';
import CustomTooltip from '../components/ui/CustomTooltip';
import SafeResponsiveContainer from '../components/charts/SafeResponsiveContainer';
import {
  Area, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell,
  ComposedChart, Line, BarChart
} from 'recharts';
import {
  Target, ArrowUpRight, ArrowDownRight, Loader2,
  Activity, DollarSign, ShieldCheck, ThumbsUp, ThumbsDown, AlertCircle,
  Trophy, Clock, Sparkles, TrendingUp, Sliders, Info, Briefcase, Download
} from 'lucide-react';

// --- Premium Typewriter Effect Component ---
function TypewriterEffect({ text }) {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    setDisplayedText('');
    let idx = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(idx));
      idx += 1;
      if (idx >= text.length) {
        clearInterval(interval);
      }
    }, 4);
    return () => clearInterval(interval);
  }, [text]);

  return <span className="whitespace-pre-line font-medium leading-relaxed text-slate-200">{displayedText}</span>;
}

// --- Premium Animated Number Component ---
function AnimatedNumber({ value, formatter, duration = 1.2 }) {
  const ref = useRef(null);
  
  useEffect(() => {
    const numericValue = typeof value === 'number' ? value : parseFloat(value?.toString().replace(/[^0-9.-]+/g,"") || 0);
    if (isNaN(numericValue)) return;
    
    const controls = animate(0, numericValue, {
      duration,
      ease: [0.19, 1, 0.22, 1], // Apple-like ease-out
      onUpdate(val) {
        if (ref.current) {
          ref.current.textContent = formatter ? formatter(val) : Math.round(val).toLocaleString();
        }
      }
    });
    return () => controls.stop();
  }, [value, duration, formatter]);

  return <span ref={ref}>{formatter ? formatter(0) : 0}</span>;
}

// --- Premium Metric Card ---
const MetricCard = ({ title, value, numericValue, formatter, subValue, icon: Icon, trend, color = "primary", sparklineData, delay = 0 }) => {
  const colorStyles = {
    primary: "text-violet-600 bg-violet-50/80 border-violet-100",
    emerald: "text-emerald-600 bg-emerald-50/80 border-emerald-100",
    rose: "text-rose-600 bg-rose-50/80 border-rose-100",
    amber: "text-amber-600 bg-amber-50/80 border-amber-100",
    slate: "text-slate-600 bg-slate-50/80 border-slate-100"
  };
  
  const glowStyles = {
    primary: "group-hover:shadow-violet-500/20",
    emerald: "group-hover:shadow-emerald-500/20",
    rose: "group-hover:shadow-rose-500/20",
    amber: "group-hover:shadow-amber-500/20",
    slate: "group-hover:shadow-slate-500/20"
  };

  const topBarStyles = {
    primary: "from-violet-400 to-indigo-500",
    emerald: "from-emerald-400 to-teal-500",
    rose: "from-rose-400 to-pink-500",
    amber: "from-amber-400 to-orange-500",
    slate: "from-slate-400 to-slate-500"
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="group"
    >
      <Card className={cn("p-6 rounded-[2rem] bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_24px_48px_rgb(0,0,0,0.12)] ring-1 ring-slate-900/5 hover:-translate-y-1.5 transition-all duration-500 relative overflow-hidden group", glowStyles[color])}>
        {/* Top accent gradient bar */}
        <div className={cn("absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r opacity-70 group-hover:opacity-100 transition-opacity duration-500", topBarStyles[color])} />
        {/* Subtle background glow */}
        <div className={cn("absolute -top-10 -right-10 w-32 h-32 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-full", colorStyles[color].split(' ')[1])} />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center backdrop-blur-sm", colorStyles[color])}>
              <Icon size={18} strokeWidth={2.5} />
            </div>
            {trend !== undefined && (
              <div className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide",
                trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              )}>
                {trend >= 0 ? <ArrowUpRight size={13} strokeWidth={3} /> : <ArrowDownRight size={13} strokeWidth={3} />}
                {Math.abs(trend)}%
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-2xl font-black text-slate-900 tabular-nums leading-none tracking-tight">
                {numericValue !== undefined ? <AnimatedNumber value={numericValue} formatter={formatter} /> : value}
              </h3>
              
              {/* Premium Sparkline */}
              {sparklineData && sparklineData.length > 1 && (
                <div className="w-16 h-8 shrink-0">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 60 20">
                    <defs>
                      <filter id={`sparkline-glow-${title.replace(/\s+/g, '-')}`} x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor={color === 'emerald' ? '#10b981' : color === 'rose' ? '#ef4444' : color === 'amber' ? '#f59e0b' : '#8b5cf6'} floodOpacity="0.3"/>
                      </filter>
                    </defs>
                    <motion.path
                      d={(() => {
                        const min = Math.min(...sparklineData);
                        const max = Math.max(...sparklineData);
                        const range = max - min || 1;
                        return sparklineData.map((val, idx) => {
                          const x = (idx / (sparklineData.length - 1)) * 60;
                          const y = 20 - ((val - min) / range) * 16 - 2;
                          return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                        }).join(' ');
                      })()}
                      fill="none"
                      stroke={color === 'emerald' ? '#10b981' : color === 'rose' ? '#ef4444' : color === 'amber' ? '#f59e0b' : color === 'slate' ? '#64748b' : '#8b5cf6'}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter={`url(#sparkline-glow-${title.replace(/\s+/g, '-')})`}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.2, ease: "easeInOut", delay: delay + 0.3 }}
                    />
                  </svg>
                </div>
              )}
            </div>
            {subValue && <p className="text-xs text-slate-500 font-medium mt-1.5">{subValue}</p>}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

const FUNNEL_STAGES = ['lead', 'contact', 'proposal', 'negotiation', 'won'];

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: myProfile } = useMyProfile(user?.id);
  const { data: allDeals, isLoading: dealsLoading } = useDeals();

  const { data: teamMembers, isLoading: teamLoading } = useTeam();
  const { data: customers = [] } = useCustomers();

  const [timeRange, setTimeRange] = useState('6m');
  const [dateRange, setDateRange] = useState('30days');

  const deals = useMemo(() => {
    if (!allDeals) return null;
    const now = new Date();
    let startDate = new Date();
    if (dateRange === '7days') {
      startDate.setDate(now.getDate() - 7);
    } else if (dateRange === '30days') {
      startDate.setDate(now.getDate() - 30);
    } else if (dateRange === 'thisMonth') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (dateRange === 'thisYear') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    return allDeals.filter(deal => {
      const dateToCheck = ['won', 'lost'].includes(deal.stage) 
        ? new Date(deal.actual_close_date || deal.updated_at || deal.created_at) 
        : new Date(deal.created_at);
      return dateToCheck >= startDate;
    });
  }, [allDeals, dateRange]);

  const [activeTab, setActiveTab] = useState('overview'); // overview, funnel, performance, segments
  const [selectedPrompt, setSelectedPrompt] = useState(null); // high-risk, quota, bottleneck

  // Simulator States
  const [simWinRate, setSimWinRate] = useState(40);
  const [simAvgValue, setSimAvgValue] = useState(200000);
  const [simLeads, setSimLeads] = useState(20);

  const hasPersonalTarget = myProfile?.personal_target > 0;
  const monthlyTarget = hasPersonalTarget ? myProfile.personal_target : 0;

  const analytics = useMemo(() => {
    if (!deals) return null;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monthsBack = timeRange === '3m' ? 2 : timeRange === '6m' ? 5 : 11;
    const intelligence = buildPipelineIntelligence(deals, { monthlyGoal: monthlyTarget, now: today });
    const forecastAccuracyData = calculateForecastAccuracy(deals, monthsBack + 1);
    const accuracyBreakdown = getLostReasonBreakdown(deals);

    // Customer Segment Enriched Stats
    const customerHealth = buildCustomerHealth(customers, deals, { now: today });

    // Grouping by Industry
    const industryMap = {};
    customerHealth.forEach(c => {
      const ind = c.industry || 'ไม่ระบุ';
      if (!industryMap[ind]) {
        industryMap[ind] = { name: ind, revenue: 0, count: 0 };
      }
      industryMap[ind].revenue += c.dealStats.wonValue || 0;
      industryMap[ind].count += c.dealStats.total || 0;
    });
    const industryData = Object.values(industryMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Grouping by Tier
    const tierMap = { Platinum: { name: 'Platinum', revenue: 0, pipeline: 0 }, Gold: { name: 'Gold', revenue: 0, pipeline: 0 }, Silver: { name: 'Silver', revenue: 0, pipeline: 0 } };
    customerHealth.forEach(c => {
      const tier = c.tier || 'Silver';
      if (!tierMap[tier]) {
        tierMap[tier] = { name: tier, revenue: 0, pipeline: 0 };
      }
      tierMap[tier].revenue += c.dealStats.wonValue || 0;
      tierMap[tier].pipeline += c.dealStats.activeValue || 0;
    });
    const tierData = Object.values(tierMap);

    // Grouping by Customer Grade
    const gradeMap = { A: { name: 'เกรด A — VIP', value: 0, color: '#3b82f6' }, B: { name: 'เกรด B — เติบโต', value: 0, color: '#10b981' }, C: { name: 'เกรด C — ทั่วไป', value: 0, color: '#f59e0b' }, D: { name: 'เกรด D — เฝ้าระวัง', value: 0, color: '#ef4444' } };
    customerHealth.forEach(c => {
      const grade = c.grade || 'C';
      if (gradeMap[grade]) {
        gradeMap[grade].value += c.dealStats.wonValue || 0;
      }
    });
    const gradeData = Object.values(gradeMap).filter(g => g.value > 0);

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
        weighted: 0,
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
          const value = Number(deal.value || 0);
          const probability = Number.isFinite(Number(deal.probability))
            ? Number(deal.probability)
            : DEFAULT_STAGE_PROBABILITY[deal.stage] || 0;
          revenueStream[mIdx].unweighted += value;
          revenueStream[mIdx].weighted += Math.round(value * (probability / 100));
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
    const winRate = (wonDeals.length + lostDeals.length) > 0
      ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100)
      : 0;

    const avgDealValue = wonDeals.length > 0
      ? Math.round(wonDeals.reduce((s, d) => s + Number(d.value || 0), 0) / wonDeals.length)
      : 0;
    const avgDaysToClose = wonDeals.length > 0
      ? Math.round(wonDeals.reduce((s, d) => {
          const created = new Date(d.created_at);
          const closed = new Date(d.actual_close_date || d.updated_at || d.created_at);
          return s + Math.max(0, (closed - created) / 86400000);
        }, 0) / wonDeals.length)
      : 0;

    // Conversion Funnel
    const stageCounts = {};
    FUNNEL_STAGES.forEach(s => { stageCounts[s] = deals.filter(d => d.stage === s).length; });

    const cumulativeEntered = {};
    let running = 0;
    for (let i = FUNNEL_STAGES.length - 1; i >= 0; i--) {
      running += stageCounts[FUNNEL_STAGES[i]];
      cumulativeEntered[FUNNEL_STAGES[i]] = running;
    }

    const funnelData = FUNNEL_STAGES.map((stage, i) => {
      const entered = cumulativeEntered[stage] || 0;
      const prevEntered = i === 0 ? entered : (cumulativeEntered[FUNNEL_STAGES[i - 1]] || 1);
      const conversionRate = i === 0 ? 100 : prevEntered > 0 ? Math.round((entered / prevEntered) * 100) : 0;
      const stageValue = deals.filter(d => d.stage === stage).reduce((s, d) => s + Number(d.value || 0), 0);
      return {
        stage,
        label: STAGE_LABELS[stage],
        count: stageCounts[stage],
        entered,
        value: stageValue,
        conversionRate,
        color: STAGE_COLORS[stage],
        widthPct: entered > 0 ? Math.round((entered / (cumulativeEntered[FUNNEL_STAGES[0]] || 1)) * 100) : 0,
      };
    });

    // Deal Velocity
    const velocityData = ['lead', 'contact', 'proposal', 'negotiation'].map(stage => {
      const stageDeals = deals.filter(d => d.stage === stage);
      const avgDays = stageDeals.length > 0
        ? Math.round(stageDeals.reduce((s, d) => {
            const ref = new Date(d.last_activity || d.updated_at || d.created_at);
            return s + Math.max(0, (Date.now() - ref.getTime()) / 86400000);
          }, 0) / stageDeals.length)
        : 0;
      return {
        name: STAGE_LABELS[stage],
        days: avgDays,
        count: stageDeals.length,
        color: STAGE_COLORS[stage],
      };
    });

    // Win/Loss reasons
    const reasonCount = (list, getter) => {
      const map = new Map();
      list.forEach((d) => {
        const raw = getter(d);
        if (!raw) return;
        const key = String(raw).trim().toLowerCase();
        if (!key || key.length < 3) return;
        const entry = map.get(key) || { reason: String(raw).trim(), count: 0, totalValue: 0 };
        entry.count += 1;
        entry.totalValue += Number(d.value) || 0;
        map.set(key, entry);
      });
      return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 5);
    };

    const lostReasons = reasonCount(lostDeals, (d) => d.lost_reason || d.metadata?.close_reason);
    const wonReasons = reasonCount(wonDeals, (d) => d.metadata?.win_reason || d.metadata?.close_reason);

    // Team Leaderboard
    const teamLeaderboard = (teamMembers || []).map(m => {
      const memberDeals = deals.filter(d => d.assigned_to === m.id);
      const wonMember = memberDeals.filter(d => d.stage === 'won');
      const lostMember = memberDeals.filter(d => d.stage === 'lost');
      const activeMember = memberDeals.filter(d => !['won', 'lost'].includes(d.stage));
      const wonThisMonth = wonMember.filter(d => {
        const dt = new Date(d.actual_close_date || d.updated_at || d.created_at);
        return dt.getMonth() === currentMonth && dt.getFullYear() === currentYear;
      });
      const wonThisMonthValue = wonThisMonth.reduce((s, d) => s + Number(d.value || 0), 0);
      const wonAllTimeValue = wonMember.reduce((s, d) => s + Number(d.value || 0), 0);
      const memberWinRate = (wonMember.length + lostMember.length) > 0
        ? Math.round(wonMember.length / (wonMember.length + lostMember.length) * 100)
        : 0;
      const goalAchievement = m.goal > 0 ? Math.min(100, Math.round(wonThisMonthValue / m.goal * 100)) : 0;
      return {
        ...m,
        wonThisMonthValue,
        wonAllTimeValue,
        wonThisMonthCount: wonThisMonth.length,
        wonAllTimeCount: wonMember.length,
        activeCount: activeMember.length,
        activePipelineValue: activeMember.reduce((s, d) => s + Number(d.value || 0), 0),
        winRate: memberWinRate,
        goalAchievement,
      };
    }).sort((a, b) => b.wonThisMonthValue - a.wonThisMonthValue);

    const revenueByMember = revenueStream.map(month => {
      const entry = { name: month.name };
      (teamMembers || []).forEach(m => {
        entry[m.name] = deals
          .filter(d => d.stage === 'won' && d.assigned_to === m.id)
          .filter(d => {
            const dt = new Date(d.actual_close_date || d.updated_at || d.created_at);
            return dt.getMonth() === month.month && dt.getFullYear() === month.year;
          })
          .reduce((s, d) => s + Number(d.value || 0), 0);
      });
      return entry;
    });

    return {
      revenueStream,
      stageData,
      totalPipeline,
      currentMonthActual,
      growth,
      winRate,
      wonCount: wonDeals.length,
      lostCount: lostDeals.length,
      activeCount: activeDeals.length,
      avgDealValue,
      avgDaysToClose,
      totalDeals: deals.length,
      lostReasons,
      wonReasons,
      intelligence,
      funnelData,
      velocityData,
      teamLeaderboard,
      revenueByMember,
      industryData,
      tierData,
      gradeData,
      forecastAccuracyData,
      accuracyBreakdown,
    };
  }, [deals, customers, monthlyTarget, timeRange, teamMembers]);

  const isLoading = dealsLoading || teamLoading;

  useEffect(() => {
    if (analytics) {
      setSimWinRate(analytics.winRate || 40);
      setSimAvgValue(analytics.avgDealValue || 200000);
      setSimLeads(analytics.activeCount || 20);
    }
  }, [analytics]);

  const simulatedRevenue = simLeads * simAvgValue * (simWinRate / 100);
  const simQuotaAttainment = monthlyTarget > 0 ? Math.round((simulatedRevenue / monthlyTarget) * 100) : 0;

  const aiConsultantResponses = useMemo(() => {
    if (!analytics) return {};
    
    const atRisk = analytics.intelligence.highImpactRisks || [];
    const riskText = atRisk.length === 0
      ? 'ไม่พบดีลที่มีความเสี่ยงสูงในระบบขณะนี้ ทุกดีลได้รับการดูแลอย่างสม่ำเสมอ'
      : `ดีลกลุ่มเสี่ยงสูง (${atRisk.length} ดีล, มูลค่ารวม ${formatCurrency(analytics.intelligence.atRiskValue)}):\n\n` +
        atRisk.map((d, i) => `${i+1}. บริษัท **${d.company}** (มูลค่า ${formatCurrency(d.value)}) — ไม่มีความเคลื่อนไหว ${d.daysInactive} วัน\n   -> คำแนะนำ: *${d.recommendedAction}*`).join('\n\n');

    const gap = analytics.intelligence.goalGap;
    const forecast = analytics.intelligence.forecastToGoalValue;
    const coverage = Math.round((forecast / monthlyTarget) * 100);
    const quotaText = gap <= 0
      ? `🎉 ยินดีด้วย! ยอดขายจริงในเดือนนี้คือ ${formatCurrency(analytics.currentMonthActual)} ทะลุเป้าหมายที่ตั้งไว้ที่ ${formatCurrency(monthlyTarget)}`
      : `การประเมินโอกาสยอดขายถึงเป้า (เป้าหมาย: ${hasPersonalTarget ? formatCurrency(monthlyTarget) : 'ยังไม่ได้ตั้งเป้าหมายส่วนตัว'}):\n\n` +
        `- ยอดขายปิดได้แล้ว: **${formatCurrency(analytics.currentMonthActual)}**\n` +
        `- ยอดขายคาดการณ์ถ่วงน้ำหนัก (Forecast): **${formatCurrency(forecast)}** (คิดเป็น **${coverage}%** ของเป้า)\n` +
        `- ยอดขายส่วนขาด (Goal Gap): **${formatCurrency(gap)}**\n\n` +
        `-> คำแนะนำเชิงรุก: เพื่อปิดช่องว่าง ${formatCurrency(gap)} เซลส์ควรเร่งกระตุ้นดีลในสถานะ 'กำลังปิด' หรือนำดีลใหญ่ที่มีค่าถ่วงน้ำหนักสูงมาเร่งปิดล่วงหน้า`;

    const funnel = analytics.funnelData || [];
    const lowest = [...funnel].slice(1).sort((a, b) => a.conversionRate - b.conversionRate)[0];
    const bottleneckText = !lowest
      ? 'ข้อมูลไม่เพียงพอในการวิเคราะห์คอขวดขั้นตอนการขาย'
      : `วิเคราะห์คอขวดขั้นตอนการขาย:\n\n` +
        `ขั้นตอนการแปลงข้อมูลที่ประสิทธิภาพต่ำสุดคือ **'${lowest.label}'** (Pass Rate: **${lowest.conversionRate}%**)\n\n` +
        `-> แนวทางแก้ไขเชิงกลยุทธ์:\n` +
        (lowest.stage === 'contact' ? `  - เซลส์ควรเตรียม Case Study และ Solution Demo ที่เจาะจงกับ Pain Point ของลูกค้าในขั้นตอนนัดเจอให้ละเอียดมากขึ้นเพื่อผ่านไปเสนอราคา` :
         lowest.stage === 'proposal' ? `  - เร่งปรับกระบวนการส่งและติดตามใบเสนอราคาภายใน 3 วันทำการ พร้อมให้ตัวเลือก (Options) ราคาหลายระดับ` :
         lowest.stage === 'negotiation' ? `  - เสนอส่วนลดแบบมีเงื่อนเวลา (Time-bound discount) หรือประสานงานให้ผู้บริหารระดับสูงมีส่วนร่วมเพื่อเร่งลงนาม PO` :
         `  - พัฒนาและติดตามการทำงานตามขั้นตอน AI Playbook อย่างใกล้ชิดเพื่อเพิ่มอัตราการแปลงของลูกค้า`);

    return {
      'high-risk': riskText,
      'quota': quotaText,
      'bottleneck': bottleneckText
    };
  }, [analytics, monthlyTarget, hasPersonalTarget]);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
      <Loader2 className="animate-spin text-violet-600" size={40} />
      <p className="text-sm font-medium text-slate-400">Loading Intelligence...</p>
    </div>
  );

  const memberColors = ['#8b5cf6', '#0ea5e9', '#f59e0b', '#10b981', '#ec4899', '#f43f5e'];

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-24 px-4 md:px-6 mt-4 bg-slate-50/50 min-h-screen relative overflow-hidden">
      {/* Ambient Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[500px] rounded-full bg-violet-400/20 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-5%] w-[30%] h-[400px] rounded-full bg-blue-400/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[600px] rounded-full bg-emerald-400/10 blur-[150px] pointer-events-none" />
      
      {/* HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Analytics <span className="text-violet-600">Command Center</span></h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Deep insights and world-class pipeline intelligence.</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/60 shadow-sm">
            {[['7days', '7 Days'], ['30days', '30 Days'], ['thisMonth', 'This Month'], ['thisYear', 'This Year']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setDateRange(val)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300",
                  dateRange === val
                    ? "bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30 text-white ring-1 ring-white/20"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/60 shadow-sm hidden lg:flex">
            {[['3m', '3 Months Trend'], ['6m', '6 Months Trend'], ['12m', '12 Months Trend']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setTimeRange(val)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300",
                  timeRange === val
                    ? "bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30 text-white ring-1 ring-white/20"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              const csvContent = "data:text/csv;charset=utf-8,Deal Name,Company,Value,Stage,Date\n" 
                + deals?.map(d => `${d.title},${d.company},${d.value},${d.stage},${d.created_at}`).join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", `analytics_export_${dateRange}.csv`);
              document.body.appendChild(link);
              link.click();
              link.remove();
            }}
            className="group/export flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-br from-slate-800 to-slate-900 text-white hover:from-slate-700 hover:to-slate-800 transition-all shadow-sm shadow-slate-900/30 hover:shadow-md hover:shadow-slate-900/40 border border-slate-700/50"
          >
            <Download size={14} className="transition-transform duration-300 group-hover/export:-translate-y-0.5 group-hover/export:translate-x-0.5" /> Export CSV
          </button>
        </div>
      </motion.div>

      {/* TAB NAVIGATION */}
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 pb-1">
        <div className="inline-flex gap-2 bg-white/80 backdrop-blur-md border border-slate-200 p-1.5 rounded-2xl shadow-sm min-w-max">
          {[
            { id: 'overview', label: 'ภาพรวม & AI', icon: Sparkles },
            { id: 'funnel', label: 'กรวยการขาย & คอขวด', icon: TrendingUp },
            { id: 'performance', label: 'ผลงานทีม & Leaderboard', icon: Trophy },
            { id: 'segments', label: 'เซกเมนต์ & เครื่องมือจำลอง', icon: Sliders },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedPrompt(null); }}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap',
                  isActive ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-[0_8px_24px_rgba(139,92,246,0.4)] ring-1 ring-white/20' : 'text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm'
                )}
              >
                {isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)] animate-pulse" />
                )}
                <Icon size={14} strokeWidth={2.5} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="space-y-8"
        >
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              {/* AI EXECUTIVE SUMMARY */}
              {analytics?.intelligence?.executiveActions?.length > 0 && (
                <Card className="p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white border border-white/10 shadow-[0_0_50px_-12px_rgba(139,92,246,0.5)] relative overflow-hidden group hover:shadow-[0_0_80px_-15px_rgba(139,92,246,0.6)] transition-all duration-700">
                  <div className="absolute -top-32 -right-32 w-96 h-96 bg-violet-500/30 blur-[100px] rounded-full group-hover:bg-violet-500/40 transition-all duration-700 pointer-events-none" />
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Sparkles size={160} />
                  </div>
                  <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
                      <Sparkles size={20} className="text-violet-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">AI Executive Insights</h3>
                      <p className="text-xs text-slate-400 font-medium">Recommended actions to hit quota and reduce risk.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                    {analytics.intelligence.executiveActions.map((action) => (
                      <div key={action.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full",
                            action.priority === 'critical' ? "bg-rose-500/20 text-rose-300" :
                            action.priority === 'high' ? "bg-amber-500/20 text-amber-300" :
                            "bg-blue-500/20 text-blue-300"
                          )}>
                            {action.priority}
                          </span>
                          <span className="text-xs font-bold text-white tabular-nums">{action.count} Deals</span>
                        </div>
                        <h4 className="text-sm font-bold text-white mb-1.5 leading-snug">{action.title}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed mb-4">{action.description}</p>
                        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Value Impact</span>
                          <span className="text-sm font-black text-emerald-400 tabular-nums">{formatCurrency(action.impactValue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* PRIMARY KPI RIBBON */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                <MetricCard
                  title="Revenue This Month"
                  numericValue={analytics?.currentMonthActual}
                  formatter={(v) => formatCurrency(v)}
                  subValue={`Target: ${formatCurrency(monthlyTarget)}`}
                  trend={analytics?.growth}
                  icon={DollarSign}
                  color="emerald"
                  sparklineData={analytics?.revenueStream?.map(m => m.actual) || []}
                  delay={0}
                />
                <MetricCard
                  title="Total Pipeline"
                  numericValue={analytics?.totalPipeline}
                  formatter={(v) => formatCurrency(v)}
                  subValue={`${analytics?.activeCount} active deals`}
                  icon={Activity}
                  color="primary"
                  sparklineData={analytics?.revenueStream?.map(m => m.unweighted) || []}
                  delay={0.1}
                />
                <MetricCard
                  title="Weighted Forecast"
                  numericValue={analytics?.intelligence?.forecastToGoalValue}
                  formatter={(v) => formatCurrency(v)}
                  subValue={`${Math.round((analytics?.intelligence?.weightedCoverageRatio || 0) * 100)}% forecast coverage`}
                  icon={ShieldCheck}
                  color="amber"
                  sparklineData={analytics?.revenueStream?.map(m => m.weighted) || []}
                  delay={0.2}
                />
                <MetricCard
                  title="Global Win Rate"
                  numericValue={analytics?.winRate}
                  formatter={(v) => `${Math.round(v)}%`}
                  subValue="Across all closed deals"
                  icon={Target}
                  color="emerald"
                  sparklineData={[35, 38, 37, 42, 40, analytics?.winRate || 40]}
                  delay={0.3}
                />
                <MetricCard
                  title="Avg Days to Close"
                  numericValue={analytics?.avgDaysToClose}
                  formatter={(v) => `${Math.round(v)} Days`}
                  subValue={`Avg Size ${formatCurrency(analytics?.avgDealValue)}`}
                  icon={Clock}
                  color="slate"
                  sparklineData={[24, 22, 25, 20, 21, analytics?.avgDaysToClose || 20]}
                  delay={0.4}
                />
              </div>

              {/* REVENUE CHART + STAGE DONUT */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-7 rounded-[2rem] bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 relative overflow-hidden group hover:shadow-[0_15px_35px_rgb(0,0,0,0.06)] transition-shadow duration-500">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-8">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 tracking-tight pl-3 border-l-2 border-violet-500">Revenue Trend</h3>
                      <p className="text-xs text-slate-400 mt-1 font-medium">Actuals vs Forecast vs Goal</p>
                    </div>
                    <div className="flex items-center gap-5 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" /><span className="text-xs font-semibold text-slate-600">Actual</span></div>
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-slate-300" /><span className="text-xs font-semibold text-slate-600">Pipeline</span></div>
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-sm shadow-violet-500/50" /><span className="text-xs font-semibold text-slate-600">Weighted</span></div>
                    </div>
                  </div>
                  <div className="h-[360px] w-full min-w-0 min-h-0">
                    <SafeResponsiveContainer>
                      <ComposedChart data={analytics?.revenueStream}>
                        <defs>
                          <linearGradient id="colorActualAnalytics" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorPipeline" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#c4b5fd" stopOpacity={0.95} />
                            <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.4} />
                          </linearGradient>
                          <linearGradient id="colorWeightedAnalytics" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                          </linearGradient>
                          <filter id="glow-chart" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="6" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: '700' }} dy={15} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: '700' }} tickFormatter={(v) => `${v / 1000000}M`} dx={-10} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }} />
                        <Bar dataKey="unweighted" name="Pipeline Volume" fill="url(#colorPipeline)" radius={[8, 8, 0, 0]} barSize={40} isAnimationActive={false} />
                        <Area type="monotone" dataKey="actual" name="Actual Revenue" stroke="#10b981" strokeWidth={4} fill="url(#colorActualAnalytics)" isAnimationActive={false} />
                        <Area type="monotone" dataKey="weighted" name="Weighted Forecast" stroke="#8b5cf6" strokeWidth={3} fill="url(#colorWeightedAnalytics)" isAnimationActive={false} />
                        <Line type="monotone" dataKey="weighted" name="Weighted Forecast Line" stroke="#8b5cf6" strokeWidth={4} filter="url(#glow-chart)" dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, strokeWidth: 0, fill: '#fff', stroke: '#8b5cf6' }} isAnimationActive={false} />
                        <Line type="monotone" dataKey="target" name="Goal" stroke="#94a3b8" strokeWidth={2} strokeDasharray="6 6" dot={false} isAnimationActive={false} opacity={0.6} />
                      </ComposedChart>
                    </SafeResponsiveContainer>
                  </div>
                </Card>

                <Card className="lg:col-span-1 p-7 rounded-[2rem] bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 flex flex-col items-center group hover:shadow-[0_15px_35px_rgb(0,0,0,0.06)] transition-shadow duration-500">
                  <div className="w-full mb-6">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight pl-3 border-l-2 border-violet-500">Stage Distribution</h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Pipeline health by volume</p>
                  </div>
                  <div className="relative w-full aspect-square max-w-[260px] min-w-0 min-h-0">
                    <SafeResponsiveContainer>
                      <PieChart>
                        <Pie data={analytics?.stageData} innerRadius={85} outerRadius={120} paddingAngle={4} dataKey="value" stroke="none" isAnimationActive={false}>
                          {analytics?.stageData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </SafeResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <p className="text-4xl font-black text-slate-900 tracking-tighter">
                          <AnimatedNumber value={analytics?.totalDeals || 0} />
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Total Deals</p>
                      </div>
                    </div>
                  </div>
                  <div className="w-full mt-auto space-y-3 pt-6 border-t border-slate-100">
                    {analytics?.stageData.map((stage) => (
                      <div key={stage.name} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: stage.color }} />
                          <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">{stage.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-slate-400 font-medium">{formatCurrency(stage.totalValue)}</span>
                          <span className="text-xs font-black text-slate-900 w-6 text-right tabular-nums">{stage.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* AI ANALYTICS CONSULTANT */}
              <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 rounded-[2.5rem] p-8 border border-white/10 shadow-[0_20px_60px_-15px_rgba(79,70,229,0.4)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <Sparkles size={160} />
                </div>
                <div className="absolute -top-40 -left-40 w-80 h-80 bg-indigo-500/20 blur-[100px] rounded-full group-hover:bg-indigo-500/30 transition-all duration-700 pointer-events-none" />
                <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-violet-500/20 blur-[100px] rounded-full group-hover:bg-violet-500/30 transition-all duration-700 pointer-events-none" />
                
                <div className="flex items-center gap-3.5 mb-5 relative z-10">
                  <div className="w-11 h-11 rounded-2xl bg-violet-500/20 flex items-center justify-center border border-violet-500/30 text-violet-300">
                    <Sparkles size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white tracking-wide uppercase">AI Analytics Consultant</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">วิเคราะห์เจาะลึกและสรุปคำแนะนำสำหรับการตัดสินใจผู้บริหาร</p>
                  </div>
                </div>

                <p className="text-xs text-slate-350 mb-5 leading-relaxed max-w-2xl relative z-10">
                  เลือกหัวข้อที่ต้องการประเมินผลกลยุทธ์ทีมขาย โดยที่ปรึกษา AI จะตรวจสอบจากฐานข้อมูลดีลและนัดหมายปัจจุบันของบริษัท เพื่อให้วิเคราะห์ข้อกังวลเชิงลึกได้ทันที:
                </p>

                <div className="flex gap-2 flex-wrap mb-5 relative z-10">
                  {[
                    { id: 'high-risk', label: 'วิเคราะห์ดีลกลุ่มเสี่ยงสูง (High Risk)', icon: AlertCircle },
                    { id: 'quota', label: 'ประเมินโอกาสทำยอดถึงเป้า (Quota Attainment)', icon: Target },
                    { id: 'bottleneck', label: 'จุดคอขวดขั้นตอนการขาย (Funnel Bottleneck)', icon: Clock }
                  ].map(p => {
                    const Icon = p.icon;
                    const isActive = selectedPrompt === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPrompt(selectedPrompt === p.id ? null : p.id)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all duration-300 shadow-sm",
                          isActive
                            ? "bg-violet-600 text-white border-violet-500 shadow-violet-500/25"
                            : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:border-white/20"
                        )}
                      >
                        <Icon size={13} />
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait">
                  {selectedPrompt && (
                    <motion.div
                      key={selectedPrompt}
                      initial={{ opacity: 0, y: 10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden relative z-10"
                    >
                      <div className="relative bg-white/5 border border-white/10 rounded-2xl p-5 mt-2 text-xs leading-relaxed text-slate-200 backdrop-blur-sm overflow-hidden before:absolute before:inset-0 before:rounded-2xl before:p-[1px] before:bg-gradient-to-r before:from-violet-500/0 before:via-violet-400/40 before:to-indigo-500/0 before:animate-[shimmer_3s_ease-in-out_infinite] before:pointer-events-none">
                        <TypewriterEffect text={aiConsultantResponses[selectedPrompt]} />
                        
                        {/* Quick-Action Buttons based on selected prompt */}
                        {selectedPrompt === 'high-risk' && (
                          <div className="flex gap-2 mt-4 flex-wrap">
                            <button
                              onClick={() => navigate('/pipeline')}
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-rose-600/20 flex items-center gap-1.5 border-0 cursor-pointer animate-[fadeIn_0.5s_ease]"
                            >
                              <Briefcase size={12} /> ไปหน้าบอร์ดดีลการขาย เพื่อตั้งกิจกรรมด่วน
                            </button>
                          </div>
                        )}
                        {selectedPrompt === 'quota' && (
                          <div className="flex gap-2 mt-4 flex-wrap">
                            <button
                              onClick={() => navigate('/settings')}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 border-0 cursor-pointer animate-[fadeIn_0.5s_ease]"
                            >
                              <Target size={12} /> ไปหน้าการตั้งค่า เพื่อปรับเป้าหมายเปรียบเทียบ
                            </button>
                          </div>
                        )}
                        {selectedPrompt === 'bottleneck' && (
                          <div className="flex gap-2 mt-4 flex-wrap">
                            <button
                              onClick={() => navigate('/tools')}
                              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-violet-500/20 flex items-center gap-1.5 border-0 cursor-pointer animate-[fadeIn_0.5s_ease]"
                            >
                              <Sparkles size={12} /> ไปหน้าเครื่องมือ AI เพื่อเขียนอีเมลแก้คอขวด
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* FORECAST ACCURACY DASHBOARD */}
              <Card className="p-8 rounded-[2.5rem] bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 relative overflow-hidden group hover:shadow-[0_15px_35px_rgb(0,0,0,0.06)] transition-shadow duration-500 mt-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100/50">
                      <Target size={22} className="text-indigo-500" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight pl-3 border-l-2 border-violet-500">Forecast Accuracy</h3>
                      <p className="text-xs text-slate-500 mt-1 font-medium">ความแม่นยำของการคาดการณ์ยอดขายเทียบกับยอดจริง</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="col-span-2 h-[300px] w-full min-w-0 min-h-0">
                    <SafeResponsiveContainer>
                      <ComposedChart data={analytics?.forecastAccuracyData}>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: '700' }} dy={15} />
                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: '700' }} tickFormatter={(v) => `${v / 1000000}M`} dx={-10} />
                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: '700' }} tickFormatter={(v) => `${v}%`} dx={10} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }} />
                        <Bar yAxisId="left" dataKey="forecast" name="Forecast" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={30} isAnimationActive={false} opacity={0.6} />
                        <Bar yAxisId="left" dataKey="actual" name="Actual" fill="#7c3aed" radius={[4, 4, 0, 0]} barSize={30} isAnimationActive={false} />
                        <Line yAxisId="right" type="monotone" dataKey="accuracy" name="Accuracy %" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} isAnimationActive={false} />
                      </ComposedChart>
                    </SafeResponsiveContainer>
                  </div>

                  <div className="col-span-1 bg-slate-50/50 rounded-3xl p-6 border border-slate-100 flex flex-col">
                    <div className="flex items-center gap-2.5 mb-6">
                      <AlertCircle size={16} className="text-slate-400" strokeWidth={2.5} />
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Lost Reasons Breakdown</p>
                    </div>
                    <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                      {analytics?.accuracyBreakdown?.length === 0 ? (
                        <div className="text-center py-6">
                          <p className="text-xs text-slate-400">ยังไม่มีข้อมูลดีลที่แพ้</p>
                        </div>
                      ) : (
                        analytics?.accuracyBreakdown?.map((item) => (
                          <div key={item.reason} className="flex flex-col gap-1 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-slate-700">{item.reason}</span>
                              <span className="text-xs font-black text-slate-900 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100">{item.count} ดีล</span>
                            </div>
                            <div className="text-xs text-rose-500 font-semibold">สูญเสียโอกาส {formatCurrency(item.value)}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* TAB 2: FUNNEL */}
          {activeTab === 'funnel' && (
            <Card className="p-8 rounded-[2.5rem] bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 space-y-10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100/50">
                    <TrendingUp size={22} className="text-amber-500" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight pl-3 border-l-2 border-violet-500">Conversion Funnel & Velocity</h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Analyze drop-offs and stage bottlenecks</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium bg-slate-50 px-4 py-2 rounded-xl">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40" /> Excellent &gt;60%</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/40" /> Average</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/40" /> Needs Work &lt;30%</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Funnel Progress Bars */}
                <div className="col-span-2 space-y-4">
                  {analytics?.funnelData.map((item, i) => (
                    <div key={item.stage} className="relative">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="w-28 shrink-0">
                          <span className="text-sm font-bold text-slate-700">{item.label}</span>
                        </div>
                        <div className="flex-1 relative h-11 bg-slate-100/50 rounded-2xl overflow-hidden border border-slate-200/60 shadow-inner">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.widthPct}%` }}
                            transition={{ duration: 1, delay: i * 0.15, ease: [0.19, 1, 0.22, 1] }}
                            className="absolute top-0 left-0 h-full rounded-2xl flex items-center px-4 gap-3 shadow-md border-r border-white/40 overflow-hidden group-hover:brightness-110 transition-all duration-300"
                            style={{ 
                              background: `linear-gradient(135deg, ${item.color}ee, ${item.color})`, 
                              boxShadow: `0 8px 24px ${item.color}40` 
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite] skew-x-12" />
                            <span className="text-xs font-black text-white">{item.count} Deals</span>
                            <span className="text-xs font-bold text-white bg-white/25 px-2 py-0.5 rounded-lg">{formatCurrency(item.value)}</span>
                          </motion.div>
                        </div>
                        <div className="w-28 shrink-0 text-right">
                          {i === 0 ? (
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Start</span>
                          ) : (
                            <span className={cn(
                              "text-xs font-black px-3 py-1.5 rounded-xl shadow-sm border",
                              item.conversionRate >= 60 ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                              item.conversionRate >= 30 ? "bg-amber-50 text-amber-600 border-amber-100" :
                              "bg-rose-50 text-rose-600 border-rose-100"
                            )}>
                              <AnimatedNumber value={item.conversionRate} formatter={v => `${Math.round(v)}%`} /> Pass
                            </span>
                          )}
                        </div>
                      </div>
                      {i < (analytics.funnelData.length - 1) && (
                        <div className="ml-28 pl-6 border-l-2 border-dashed border-slate-200 h-4" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Velocity Grid */}
                <div className="col-span-1 bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
                  <div className="flex items-center gap-2.5 mb-6">
                    <Clock size={16} className="text-slate-400" strokeWidth={2.5} />
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Stage Velocity</p>
                  </div>
                  <div className="space-y-4">
                    {analytics?.velocityData.map((v) => (
                      <div key={v.name} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div>
                          <p className="text-sm font-bold text-slate-700">{v.name}</p>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">{v.count} active deals</p>
                        </div>
                        <div className="text-right flex items-baseline gap-1">
                          <p className={cn(
                            "text-3xl font-black tabular-nums tracking-tighter",
                            v.days >= 7 ? "text-rose-500" : v.days >= 4 ? "text-amber-500" : "text-emerald-500"
                          )}>
                            <AnimatedNumber value={v.days} />
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Days</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* WIN / LOSS REASONS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100/50">
                        <ThumbsUp size={16} className="text-emerald-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Win Reasons</h4>
                        <p className="text-xs text-slate-400 font-semibold">เหตุผลเด่นที่ชนะดีลการขาย</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">{analytics?.wonCount || 0} Deals</span>
                  </div>
                  <div className="space-y-4">
                    {!analytics?.wonReasons?.length ? (
                      <div className="flex flex-col items-center justify-center py-8 bg-slate-50/50 backdrop-blur-sm border border-dashed border-slate-200/80 rounded-2xl">
                        <div className="w-10 h-10 mb-3 rounded-full bg-white shadow-sm flex items-center justify-center"><Info size={16} className="text-slate-400" /></div>
                        <p className="text-xs text-slate-500 font-medium">ไม่มีข้อมูลวิเคราะห์เหตุผลการชนะดีล</p>
                      </div>
                    ) : analytics.wonReasons.map((r, i) => {
                      const max = analytics.wonReasons[0].count;
                      const pct = Math.round((r.count / max) * 100);
                      return (
                        <div key={i} className="space-y-1.5 group">
                          <div className="flex justify-between items-end gap-2 text-xs">
                            <p className="font-bold text-slate-700 truncate flex-1 group-hover:text-emerald-600 transition-colors">{r.reason}</p>
                            <span className="font-bold text-slate-400">{r.count}×</span>
                            <span className="font-bold text-emerald-600">{formatCurrency(r.totalValue)}</span>
                          </div>
                          <div className="h-3 bg-slate-100/50 rounded-full overflow-hidden shadow-inner border border-slate-200/50">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              className="h-full relative shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                              style={{ background: 'linear-gradient(90deg, #34d399, #10b981)' }}
                            >
                              <div className="absolute inset-0 bg-white/20 w-1/2 skew-x-12 -translate-x-full animate-[shimmer_2s_infinite]" />
                            </motion.div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100/50">
                        <ThumbsDown size={16} className="text-rose-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Loss Reasons</h4>
                        <p className="text-xs text-slate-400 font-semibold">เหตุผลและปัญหาที่เสียดีล</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-lg">{analytics?.lostCount || 0} Deals</span>
                  </div>
                  <div className="space-y-4">
                    {!analytics?.lostReasons?.length ? (
                      <div className="flex flex-col items-center justify-center py-8 bg-slate-50/50 backdrop-blur-sm border border-dashed border-slate-200/80 rounded-2xl">
                        <div className="w-10 h-10 mb-3 rounded-full bg-white shadow-sm flex items-center justify-center"><Info size={16} className="text-slate-400" /></div>
                        <p className="text-xs text-slate-500 font-medium">ไม่มีข้อมูลวิเคราะห์เหตุผลการแพ้ดีล</p>
                      </div>
                    ) : analytics.lostReasons.map((r, i) => {
                      const max = analytics.lostReasons[0].count;
                      const pct = Math.round((r.count / max) * 100);
                      return (
                        <div key={i} className="space-y-1.5 group">
                          <div className="flex justify-between items-end gap-2 text-xs">
                            <p className="font-bold text-slate-700 truncate flex-1 group-hover:text-rose-500 transition-colors">{r.reason}</p>
                            <span className="font-bold text-slate-400">{r.count}×</span>
                            <span className="font-bold text-rose-500">{formatCurrency(r.totalValue)}</span>
                          </div>
                          <div className="h-3 bg-slate-100/50 rounded-full overflow-hidden shadow-inner border border-slate-200/50">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              className="h-full relative shadow-[0_0_15px_rgba(244,63,94,0.5)]"
                              style={{ background: 'linear-gradient(90deg, #fb7185, #f43f5e)' }}
                            >
                              <div className="absolute inset-0 bg-white/20 w-1/2 skew-x-12 -translate-x-full animate-[shimmer_2s_infinite]" />
                            </motion.div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* TAB 3: PERFORMANCE */}
          {activeTab === 'performance' && (
            <div className="space-y-8">
              {/* Monthly contribution chart */}
              <Card className="p-7 rounded-[2rem] bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 group hover:shadow-[0_15px_35px_rgb(0,0,0,0.06)] transition-shadow duration-500">
                <div className="mb-6">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight pl-3 border-l-2 border-violet-500">Monthly Revenue Contribution</h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium">Monthly won deal values by team member</p>
                </div>
                <div className="h-[320px] w-full min-w-0 min-h-0">
                  <SafeResponsiveContainer>
                    <ComposedChart data={analytics?.revenueByMember}>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: '700' }} dy={15} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: '700' }} tickFormatter={(v) => `${v / 1000000}M`} dx={-10} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }} />
                      {(teamMembers || []).map((m, idx) => (
                        <Area
                          key={m.id}
                          type="monotone"
                          dataKey={m.name}
                          name={m.name}
                          stackId="1"
                          stroke={memberColors[idx % memberColors.length]}
                          fill={memberColors[idx % memberColors.length]}
                          fillOpacity={0.4}
                          isAnimationActive={false}
                        />
                      ))}
                    </ComposedChart>
                  </SafeResponsiveContainer>
                </div>
              </Card>

              {/* Leaderboard Cards */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-200">
                    <Trophy size={22} className="text-amber-600" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight pl-3 border-l-2 border-violet-500">Elite Leaderboard</h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Top performers & Quota attainment</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {analytics?.teamLeaderboard.map((m, i) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn(
                        "p-6 rounded-3xl border shadow-sm hover:shadow-xl transition-all duration-350 relative overflow-hidden group",
                        i === 0 ? "bg-gradient-to-b from-amber-50/80 to-white border-amber-300 ring-2 ring-amber-400/10 shadow-amber-500/5" :
                        i === 1 ? "bg-gradient-to-b from-slate-50/80 to-white border-slate-200/60" :
                        i === 2 ? "bg-gradient-to-b from-orange-50/30 to-white border-orange-200/60" :
                        "bg-white border-slate-100"
                      )}
                    >
                      {i === 0 && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-12 -translate-x-[150%] animate-[shimmer_3s_infinite] pointer-events-none z-0" />}
                      
                      {/* Ranking Medals */}
                      <div className="absolute top-4 right-4 flex items-center gap-1.5 relative z-10">
                        {i === 0 && (
                          <span className="text-[10px] font-black text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md tracking-wider">
                            👑 CHAMPION
                          </span>
                        )}
                        {i === 0 ? <div className="text-4xl drop-shadow-md">🏆</div> :
                         i === 1 ? <div className="text-4xl drop-shadow-md">🥈</div> :
                         i === 2 ? <div className="text-4xl drop-shadow-md">🥉</div> :
                         <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 border border-slate-200">#{i + 1}</div>}
                      </div>

                      <div className="flex items-center gap-4 mb-6">
                        <div className={cn(
                          "p-0.5 rounded-2xl shadow-md",
                          i === 0 ? "bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500" : "bg-gradient-to-br from-violet-400 to-indigo-500"
                        )}>
                          <div className={cn(
                            'w-14 h-14 rounded-xl flex items-center justify-center text-white font-black text-xl border-2 border-white',
                            m.color?.split(' ')[0] || 'bg-violet-600'
                          )}>
                            {m.name.charAt(0)}
                          </div>
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-lg leading-tight">{m.name}</p>
                          <p className="text-xs text-slate-400 font-semibold mt-0.5">{m.role}</p>
                        </div>
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="text-center p-3 rounded-2xl bg-slate-50/80 border border-slate-100 group-hover:bg-white transition-colors">
                          <p className="text-xl font-black text-slate-900 tabular-nums"><AnimatedNumber value={m.wonThisMonthCount} /></p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Won</p>
                        </div>
                        <div className="text-center p-3 rounded-2xl bg-slate-50/80 border border-slate-100 group-hover:bg-white transition-colors">
                          <p className={cn("text-xl font-black tabular-nums", m.winRate >= 50 ? "text-emerald-500" : m.winRate >= 30 ? "text-amber-500" : "text-rose-500")}>
                            <AnimatedNumber value={m.winRate} />%
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Win Rate</p>
                        </div>
                        <div className="text-center p-3 rounded-2xl bg-slate-50/80 border border-slate-100 group-hover:bg-white transition-colors">
                          <p className="text-xl font-black text-blue-500 tabular-nums"><AnimatedNumber value={m.activeCount} /></p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Active</p>
                        </div>
                      </div>

                      {/* Quota Progress */}
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Quota Attainment</p>
                            <p className="text-2xl font-black text-slate-900 tabular-nums tracking-tight">
                              {formatCurrency(m.wonThisMonthValue)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Goal {formatCurrency(m.goal || 0)}</p>
                            <p className={cn(
                              "text-sm font-black tabular-nums px-2 py-0.5 rounded-lg inline-block",
                              m.goalAchievement >= 100 ? "bg-emerald-50 text-emerald-600" :
                              m.goalAchievement >= 70 ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                            )}>
                              <AnimatedNumber value={m.goalAchievement} />%
                            </p>
                          </div>
                        </div>
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, m.goalAchievement)}%` }}
                            transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
                            className={cn(
                              "h-full rounded-full relative",
                              m.goalAchievement >= 100 ? "bg-gradient-to-r from-emerald-400 to-emerald-500" :
                              m.goalAchievement >= 70 ? "bg-gradient-to-r from-amber-400 to-amber-500" : 
                              "bg-gradient-to-r from-rose-400 to-rose-500"
                            )}
                          >
                            <div className="absolute inset-0 bg-white/20 w-1/2 skew-x-12 -translate-x-full animate-[shimmer_2s_infinite]" />
                          </motion.div>
                        </div>
                        <p className="text-xs font-semibold text-slate-400 mt-2">Active Pipeline: <span className="text-slate-600">{formatCurrency(m.activePipelineValue)}</span></p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SEGMENTS */}
          {activeTab === 'segments' && (
            <div className="space-y-8">
              {/* Row 1: Grade distribution & Tier distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 p-7 rounded-[2rem] bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 flex flex-col items-center group hover:shadow-[0_15px_35px_rgb(0,0,0,0.06)] transition-shadow duration-500">
                  <div className="w-full mb-6">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight pl-3 border-l-2 border-violet-500">Revenue by Customer Grade</h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Won deal values across VIP to At-risk groups</p>
                  </div>
                  <div className="relative w-full aspect-square max-w-[220px] min-w-0 min-h-0">
                    {analytics?.gradeData?.length > 0 ? (
                      <>
                        <SafeResponsiveContainer>
                          <PieChart>
                            <Pie data={analytics.gradeData} innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="value" stroke="none" isAnimationActive={false}>
                              {analytics.gradeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </SafeResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Revenue</p>
                            <p className="text-lg font-black text-slate-900 tabular-nums mt-0.5">
                              {formatCurrency(analytics.gradeData.reduce((s, g) => s + g.value, 0))}
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 backdrop-blur-sm border border-dashed border-slate-200/80 rounded-full m-4">
                        <Info size={16} className="text-slate-400 mb-2" />
                        <p className="text-[10px] text-slate-500 font-medium text-center px-4">ไม่มีข้อมูลยอดขายแยกตามเกรด</p>
                      </div>
                    )}
                  </div>
                  <div className="w-full mt-auto space-y-3 pt-6 border-t border-slate-100">
                    {analytics?.gradeData.map((grade) => (
                      <div key={grade.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: grade.color }} />
                          <span className="font-semibold text-slate-500">{grade.name}</span>
                        </div>
                        <span className="font-black text-slate-900 tabular-nums">{formatCurrency(grade.value)}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="lg:col-span-2 p-7 rounded-[2rem] bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 group hover:shadow-[0_15px_35px_rgb(0,0,0,0.06)] transition-shadow duration-500">
                  <div className="mb-6">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight pl-3 border-l-2 border-violet-500">Revenue & Pipeline by Customer Tier</h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Comparison of closed revenue vs active pipeline per tier</p>
                  </div>
                  <div className="h-[280px] w-full min-w-0 min-h-0">
                    <SafeResponsiveContainer>
                      <BarChart data={analytics?.tierData}>
                        <defs>
                          <linearGradient id="colorTierRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.95} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.45} />
                          </linearGradient>
                          <linearGradient id="colorTierPipeline" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.95} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.45} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: '700' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: '700' }} tickFormatter={(v) => `${v / 1000000}M`} dx={-10} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="revenue" name="Closed Won Revenue" fill="url(#colorTierRevenue)" radius={[6, 6, 0, 0]} barSize={25} isAnimationActive={false} />
                        <Bar dataKey="pipeline" name="Active Pipeline" fill="url(#colorTierPipeline)" radius={[6, 6, 0, 0]} barSize={25} isAnimationActive={false} />
                      </BarChart>
                    </SafeResponsiveContainer>
                  </div>
                </Card>
              </div>

              {/* Row 2: Revenue by industry & Quota simulator */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-7 rounded-[2rem] bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 group hover:shadow-[0_15px_35px_rgb(0,0,0,0.06)] transition-shadow duration-500">
                  <div className="mb-6">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight pl-3 border-l-2 border-violet-500">Top Industries by Revenue</h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Won deal volumes in top 5 market sectors</p>
                  </div>
                  <div className="h-[280px] w-full min-w-0 min-h-0">
                    {analytics?.industryData?.length > 0 ? (
                      <SafeResponsiveContainer>
                        <BarChart data={analytics.industryData} layout="vertical">
                          <defs>
                            <linearGradient id="colorIndustryRevenue" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.95} />
                              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.45} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: '705' }} tickFormatter={(v) => `${v / 1000}k`} />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: '705' }} width={80} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="revenue" name="Revenue" fill="url(#colorIndustryRevenue)" radius={[0, 6, 6, 0]} barSize={16} isAnimationActive={false} />
                        </BarChart>
                      </SafeResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center bg-slate-50/50 backdrop-blur-sm border border-dashed border-slate-200/80 rounded-2xl">
                        <div className="w-10 h-10 mb-3 rounded-full bg-white shadow-sm flex items-center justify-center"><Info size={16} className="text-slate-400" /></div>
                        <p className="text-xs text-slate-500 font-medium">ไม่มีข้อมูลวิเคราะห์อุตสาหกรรมในระบบ</p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* AI Sales Quota Simulator */}
                <Card className="p-7 rounded-[2rem] bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 flex flex-col justify-between group hover:shadow-[0_15px_35px_rgb(0,0,0,0.06)] transition-shadow duration-500">
                  <div>
                    <div className="flex items-center gap-2.5 mb-5">
                      <Sliders size={18} className="text-violet-650" />
                      <h3 className="text-base font-bold text-slate-900 tracking-tight pl-3 border-l-2 border-violet-500">AI Sales Quota Simulator</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Win Rate Slider */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-500">อัตราการปิดดีลสำเร็จ (Win Rate)</span>
                          <span className="text-violet-600 font-bold">{simWinRate}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={simWinRate}
                          onChange={(e) => setSimWinRate(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-violet-600"
                        />
                      </div>

                      {/* Avg Deal Size Slider */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-500">มูลค่าดีลเฉลี่ย (Average Deal Size)</span>
                          <span className="text-violet-600 font-bold">{formatCurrency(simAvgValue)}</span>
                        </div>
                        <input
                          type="range"
                          min="10000"
                          max="2000000"
                          step="10000"
                          value={simAvgValue}
                          onChange={(e) => setSimAvgValue(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-violet-600"
                        />
                      </div>

                      {/* Leads Count Slider */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-500">จำนวนดีลลีดที่ดูแล (Active Leads)</span>
                          <span className="text-violet-600 font-bold">{simLeads} ราย</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={simLeads}
                          onChange={(e) => setSimLeads(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-violet-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Simulator Results */}
                  <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">คาดการณ์รายได้จำลอง</p>
                      <p className="text-xl font-black text-slate-900 tabular-nums">{formatCurrency(simulatedRevenue)}</p>
                      <p className="text-[10px] text-slate-500 font-medium">เป้าหมายประจำเดือน: {formatCurrency(monthlyTarget)}</p>
                    </div>
                    
                    <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90 overflow-visible">
                        <defs>
                          <filter id="gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={
                              simQuotaAttainment >= 100 ? "#10b981" :
                              simQuotaAttainment >= 70 ? "#f59e0b" : "#ef4444"
                            } floodOpacity="0.4"/>
                          </filter>
                        </defs>
                        {/* Background Circle */}
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="#e2e8f0"
                          strokeWidth="6"
                          fill="transparent"
                          strokeDasharray="4 6"
                        />
                        {/* Foreground Circle */}
                        <motion.circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke={
                            simQuotaAttainment >= 100 ? "#10b981" :
                            simQuotaAttainment >= 70 ? "#f59e0b" : "#ef4444"
                          }
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 40}
                          animate={{
                            strokeDashoffset: 2 * Math.PI * 40 * (1 - Math.min(100, simQuotaAttainment) / 100)
                          }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          strokeLinecap="round"
                          filter="url(#gauge-glow)"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className={cn(
                          "text-base font-black tabular-nums leading-none",
                          simQuotaAttainment >= 100 ? "text-emerald-600" :
                          simQuotaAttainment >= 70 ? "text-amber-600" : "text-rose-500"
                        )}>
                          {simQuotaAttainment}%
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-wider">Quota</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Strategy for Simulator */}
                  <div className="mt-4 p-4 bg-violet-50/50 border border-violet-100 rounded-2xl text-[10px] text-violet-800 leading-relaxed whitespace-pre-line font-semibold">
                    <span className="font-bold flex items-center gap-1.5 mb-1.5 text-violet-750">
                      <Sparkles size={11} className="text-violet-600" />
                      กลยุทธ์ AI แนะนำจากตัวเลขจำลอง:
                    </span>
                    {(() => {
                      if (simQuotaAttainment >= 100) {
                        return `🎉 ยอดเยี่ยมมาก! การจำลองชี้ว่ากลยุทธ์นี้สามารถบรรลุเป้าหมายยอดขายประจำเดือนโดยได้รับรายได้คาดการณ์ ${formatCurrency(simulatedRevenue)} (${simQuotaAttainment}% ของเป้า)`;
                      }
                      const strategies = [];
                      if (simWinRate < 45) {
                        strategies.push("• อัตราการปิดดีลต่ำกว่า 45%: แนะนำให้จัดเทรนนิ่งทักษะการเจรจา (Negotiation) และทบทวนขั้นตอนนัดเจอ (Playbook) ของทีมอย่างรัดกุม");
                      }
                      if (simAvgValue < 300000) {
                        strategies.push("• ขนาดดีลเฉลี่ยต่ำ: ควรทำ Cross-sell หรือเสนอพ่วงสินค้า Server / Network / UPS เพื่อดึงมูลค่าดีลเดี่ยวให้สูงขึ้น");
                      }
                      if (simLeads < 15) {
                        strategies.push("• ลูกค้าใหม่ต่ำเกินไป: ฝ่ายการตลาดควรร่วมมือทำโปรแกรมดึงลีดใหม่ และใช้ AI PDF Scanner แฟลชสเปกราคาดีลเก่ากลับมาคุยอีกครั้ง");
                      }
                      return strategies.length > 0 ? strategies.join('\n') : `• ยอดจำลองยังห่างจากเป้าอีก ${formatCurrency(monthlyTarget - simulatedRevenue)}: แนะนำให้หาลูกค้าเป้าหมายเพิ่ม 2-3 ราย หรือเพิ่มขนาดดีลเฉลี่ยขึ้นเล็กน้อย`;
                    })()}
                  </div>
                </Card>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
