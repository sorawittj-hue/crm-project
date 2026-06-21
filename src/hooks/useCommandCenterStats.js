import { useMemo } from 'react';
import { buildPipelineIntelligence } from '../utils/salesIntelligence';
import { daysSince } from '../lib/formatters';
import { STAGE_COLORS, STAGE_LABELS } from '../lib/constants';

const FUNNEL_STAGES = ['lead', 'contact', 'proposal', 'negotiation'];

export function useCommandCenterStats(deals, monthlyGoal) {
  return useMemo(() => {
    if (!deals) return null;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const intelligence = buildPipelineIntelligence(deals, { monthlyGoal, now });
    const totalWonValue = intelligence.currentMonthWonValue;
    const activePipeline = intelligence.activeDeals;
    const totalPipelineValue = intelligence.activePipelineValue;
    const achievementPercent = monthlyGoal > 0 ? Math.round((totalWonValue / monthlyGoal) * 100) : 0;

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      months.push({
        name: d.toLocaleDateString('th-TH', { month: 'short' }),
        month: d.getMonth(),
        year: d.getFullYear(),
        actual: 0,
        forecast: 0
      });
    }

    deals.forEach(deal => {
      const rawDate = deal.stage === 'won'
        ? (deal.actual_close_date || deal.updated_at || deal.created_at)
        : deal.created_at;
      const dealDate = new Date(rawDate);
      const mIdx = months.findIndex(m => m.month === dealDate.getMonth() && m.year === dealDate.getFullYear());
      if (mIdx !== -1) {
        if (deal.stage === 'won') months[mIdx].actual += Number(deal.value || 0);
        else if (deal.stage !== 'lost') {
          months[mIdx].forecast += Number(deal.value || 0) * (Number(deal.probability || 0) / 100);
        }
      }
    });

    const urgentDeals = (intelligence.highImpactRisks.length > 0 ? intelligence.highImpactRisks : activePipeline)
      .filter(d => daysSince(d.last_activity || d.created_at) >= 3)
      .sort((a, b) => (Number(b.value) * (b.probability / 100)) - (Number(a.value) * (a.probability / 100)))
      .slice(0, 3);

    const prevMonthActual = months[months.length - 2]?.actual || 0;
    const currentMonthActual = months[months.length - 1]?.actual || 0;
    const growthPercent = prevMonthActual > 0
      ? ((currentMonthActual - prevMonthActual) / prevMonthActual * 100).toFixed(1)
      : 0;

    const weekAgo = now.getTime() - 7 * 86_400_000;
    const newDealsThisWeek = deals.filter(d => new Date(d.created_at).getTime() >= weekAgo).length;

    const wonThisWeek = deals.filter(d => {
      if (d.stage !== 'won') return false;
      const dt = new Date(d.actual_close_date || d.updated_at || d.created_at);
      return dt.getTime() >= weekAgo;
    });
    const wonThisWeekValue = wonThisWeek.reduce((s, d) => s + Number(d.value || 0), 0);

    const activeDealsArr = activePipeline;
    const commitValue = activeDealsArr
      .filter(d => Number(d.probability) >= 70)
      .reduce((s, d) => s + Number(d.value || 0) * (Number(d.probability) / 100), 0);
    const bestCaseValue = activeDealsArr
      .reduce((s, d) => s + Number(d.value || 0), 0);
    const worstCaseValue = activeDealsArr
      .filter(d => Number(d.probability) >= 90)
      .reduce((s, d) => s + Number(d.value || 0) * (Number(d.probability) / 100), 0);

    const now30 = now.getTime() + 30 * 86_400_000;
    const hotDeals = activeDealsArr
      .map(d => ({
        ...d,
        score: Number(d.value || 0) * (Number(d.probability || 0) / 100),
        closingSoon: d.expected_close_date && new Date(d.expected_close_date).getTime() <= now30,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const funnelData = FUNNEL_STAGES.map(stage => {
      const stageDeals = deals.filter(d => d.stage === stage);
      return {
        stage,
        label: STAGE_LABELS[stage] || stage,
        count: stageDeals.length,
        value: stageDeals.reduce((s, d) => s + Number(d.value || 0), 0),
        color: STAGE_COLORS[stage],
      };
    });

    const wonDeals = deals.filter(d => d.stage === 'won');
    const lostDeals = deals.filter(d => d.stage === 'lost');
    const winRate = (wonDeals.length + lostDeals.length) > 0
      ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100)
      : 0;
    const avgDaysToClose = wonDeals.length > 0
      ? Math.round(wonDeals.reduce((s, d) => {
          const created = new Date(d.created_at);
          const closed = new Date(d.actual_close_date || d.updated_at || d.created_at);
          return s + Math.max(0, (closed - created) / 86400000);
        }, 0) / wonDeals.length)
      : 0;

    return {
      totalWonValue,
      totalPipelineValue,
      achievementPercent,
      activeCount: activePipeline.length,
      urgentDeals,
      revenueStream: months,
      growthPercent,
      intelligence,
      newDealsThisWeek,
      wonThisWeek: wonThisWeek.length,
      wonThisWeekValue,
      commitValue,
      bestCaseValue,
      worstCaseValue,
      hotDeals,
      funnelData,
      winRate,
      avgDaysToClose,
    };
  }, [deals, monthlyGoal]);
}
