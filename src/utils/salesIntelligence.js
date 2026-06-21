import { parseYearMonth } from '../lib/utils';
import { STAGE_COLORS } from '../lib/constants';
import { buildCustomerHealth } from './customerIntelligence';

const DAY_MS = 86_400_000;
const TERMINAL_STAGES = new Set(['won', 'lost']);
const HIGH_INTENT_STAGES = new Set(['proposal', 'negotiation']);

/**
 * @typedef {Object} DealLike
 * @property {string} [id]
 * @property {string} [stage]
 * @property {number|string} [value]
 * @property {number|string} [probability]
 * @property {string} [created_at]
 * @property {string} [updated_at]
 * @property {string} [last_activity]
 * @property {string} [expected_close_date]
 * @property {string} [actual_close_date]
 * @property {string} [customer_id]
 * @property {string} [next_step]
 */

/**
 * @typedef {DealLike & {
 *   value: number,
 *   probability: number,
 *   weightedValue: number,
 *   daysInactive: number,
 *   daysOpen: number,
 *   daysUntilClose: number | null,
 *   isActive: boolean,
 *   isAtRisk: boolean,
 *   healthScore: number,
 *   recommendedAction: string,
 * }} NormalizedDeal
 */

export const DEFAULT_STAGE_PROBABILITY = {
  lead: 10,
  contact: 30,
  proposal: 55,
  negotiation: 75,
  won: 100,
  lost: 0,
};

const PRIORITY_WEIGHT = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const toFiniteNumber = (value, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const parseDateValue = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getDaysBetween = (startDate, endDate) => {
  const start = parseDateValue(startDate);
  const end = parseDateValue(endDate) || new Date();
  if (!start) return 0;
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / DAY_MS));
};

const getDaysUntil = (targetDate, now) => {
  const target = parseDateValue(targetDate);
  const current = parseDateValue(now) || new Date();
  if (!target) return null;
  return Math.ceil((target.getTime() - current.getTime()) / DAY_MS);
};

const isCurrentMonth = (value, now) => {
  const parsedVal = parseYearMonth(value);
  if (!parsedVal) return false;
  const parsedNow = parseYearMonth(now);
  if (!parsedNow) return false;
  return parsedVal.month === parsedNow.month && parsedVal.year === parsedNow.year;
};

const sortByWeightedValueDesc = (a, b) => b.weightedValue - a.weightedValue;

const getProbability = (deal) => {
  const fallback = DEFAULT_STAGE_PROBABILITY[deal?.stage] ?? 0;
  return clamp(toFiniteNumber(deal?.probability, fallback), 0, 100);
};

const getLastTouchDate = (deal) =>
  deal?.last_activity || deal?.updated_at || deal?.created_at || deal?.createdAt || null;

const getRecommendedAction = (deal) => {
  if (deal.stage === 'won') return 'Capture renewal and expansion notes';
  if (deal.stage === 'lost') return 'Document loss reason and competitor pattern';
  if (deal.daysUntilClose !== null && deal.daysUntilClose < 0) return 'Reset close date and confirm buying timeline';
  if (deal.daysInactive >= 14) return 'Escalate recovery call with decision maker';
  if (HIGH_INTENT_STAGES.has(deal.stage) && deal.daysInactive >= 5) return 'Send proposal blocker check and book next meeting';
  if (!deal.next_step) return 'Add a dated next step before the next review';
  if (deal.probability >= 70) return 'Lock mutual action plan and procurement owner';
  return 'Qualify pain, budget, authority, and timeline';
};

/**
 * @param {DealLike} deal
 * @param {Date} [now]
 * @returns {NormalizedDeal}
 */
export const normalizeDealForIntelligence = (deal, now = new Date()) => {
  const stage = deal?.stage || 'lead';
  const value = Math.max(0, toFiniteNumber(deal?.value));
  const probability = getProbability({ ...deal, stage });
  const createdDate = deal?.created_at || deal?.createdAt;
  const lastTouchDate = getLastTouchDate(deal);
  const expectedCloseDate = deal?.expected_close_date || deal?.expectedCloseDate || null;
  const daysInactive = getDaysBetween(lastTouchDate || createdDate, now);
  const daysOpen = getDaysBetween(createdDate, now);
  const daysUntilClose = getDaysUntil(expectedCloseDate, now);
  const isActive = !TERMINAL_STAGES.has(stage);
  const weightedValue = Math.round(value * (probability / 100));
  const staleThreshold = HIGH_INTENT_STAGES.has(stage) ? 5 : 10;
  const closeDateOverdue = daysUntilClose !== null && daysUntilClose < 0;
  const isAtRisk = isActive && (daysInactive >= staleThreshold || closeDateOverdue || probability < 25);
  const riskPenalty = (isAtRisk ? 24 : 0) + clamp(daysInactive * 2, 0, 35) + (closeDateOverdue ? 20 : 0);
  const stageBoost = HIGH_INTENT_STAGES.has(stage) ? 8 : 0;
  const healthScore = clamp(Math.round(100 - riskPenalty + stageBoost), 0, 100);

  const normalized = {
    ...deal,
    stage,
    value,
    probability,
    weightedValue,
    daysInactive,
    daysOpen,
    daysUntilClose,
    isActive,
    isAtRisk,
    healthScore,
  };

  return {
    ...normalized,
    recommendedAction: getRecommendedAction(normalized),
  };
};

const STAGE_VELOCITY_WEIGHT = {
  lead: 1.0,
  contact: 1.2,
  proposal: 1.5,
  negotiation: 2.0,
};

export const calculateFocusScore = (deal, now) => {
  if (TERMINAL_STAGES.has(deal.stage)) return 0;
  
  const value = Math.max(0, toFiniteNumber(deal.value));
  const probability = getProbability(deal);
  const lastTouchDate = getLastTouchDate(deal);
  const createdDate = deal.created_at || deal.createdAt;
  const daysInactive = getDaysBetween(lastTouchDate || createdDate, now);
  
  const recencyWeight = clamp(1 + (daysInactive / 10), 1, 3);
  const stageVelocityWeight = STAGE_VELOCITY_WEIGHT[deal.stage] || 1.0;
  
  return value * (probability / 100) * recencyWeight * stageVelocityWeight;
};

export const getTopFocusDeals = (deals, now = new Date(), limit = 3) => {
  return deals
    .filter(deal => !TERMINAL_STAGES.has(deal.stage))
    .map(deal => {
      const normalized = normalizeDealForIntelligence(deal, now);
      return {
        ...normalized,
        focusScore: calculateFocusScore(deal, now)
      };
    })
    .sort((a, b) => b.focusScore - a.focusScore)
    .slice(0, limit);
};

export const getUpcomingRenewals = (deals, customers, now = new Date(), windowDays = 90) => {
  if (!deals || !Array.isArray(deals)) return [];

  const nowMs = now.getTime();
  const limitMs = nowMs + (windowDays * 86_400_000);

  // Filter deals that are recurring and have a renewal date within window
  let renewals = deals.filter(d => {
    if (TERMINAL_STAGES.has(d.stage) || !d.is_recurring || !d.renewal_date) return false;
    const renewalMs = new Date(d.renewal_date).getTime();
    return renewalMs >= nowMs && renewalMs <= limitMs;
  });

  if (customers && customers.length > 0) {
    const healthScores = buildCustomerHealth(customers, deals, { now });
    const healthMap = new Map(healthScores.map(c => [c.id, c]));

    renewals = renewals.map(deal => {
      const customerHealth = deal.customer_id ? healthMap.get(deal.customer_id) : null;
      return {
        ...deal,
        customerHealthScore: customerHealth?.health?.score || 100, // Default to healthy if not found
        customerHealthGrade: customerHealth?.grade || 'A'
      };
    });
  } else {
    renewals = renewals.map(deal => ({
      ...deal,
      customerHealthScore: 100,
      customerHealthGrade: 'A'
    }));
  }

  return renewals.sort((a, b) => {
    const aDate = new Date(a.renewal_date).getTime();
    const bDate = new Date(b.renewal_date).getTime();
    
    // Sort primarily by date
    if (aDate !== bDate) return aDate - bDate;
    
    // Then sort by health score (lower score = higher priority)
    return a.customerHealthScore - b.customerHealthScore;
  });
};

const sumDealValue = (deals, field = 'value') =>
  deals.reduce((sum, deal) => sum + toFiniteNumber(deal[field]), 0);

const buildExecutiveActions = ({
  highImpactRisks,
  closingSoonDeals,
  staleDeals,
  noNextStepDeals,
  goalGap,
  weightedCoverageRatio,
}) => {
  const actions = [];

  if (goalGap > 0 && weightedCoverageRatio < 1) {
    actions.push({
      id: 'coverage-gap',
      priority: 'critical',
      title: 'Rebuild forecast coverage',
      description: 'Weighted forecast is below quota. Add high-fit opportunities or pull close dates forward.',
      count: 1,
      impactValue: goalGap,
    });
  }

  if (highImpactRisks.length > 0) {
    actions.push({
      id: 'rescue-risk',
      priority: 'high',
      title: 'Rescue at-risk revenue',
      description: 'Prioritize executive follow-up on the highest weighted-value stagnant deals.',
      count: highImpactRisks.length,
      impactValue: sumDealValue(highImpactRisks, 'weightedValue'),
    });
  }

  if (closingSoonDeals.length > 0) {
    actions.push({
      id: 'commit-next-30',
      priority: 'high',
      title: 'Lock next-30-day commits',
      description: 'Confirm procurement owner, close plan, and decision date for near-term opportunities.',
      count: closingSoonDeals.length,
      impactValue: sumDealValue(closingSoonDeals, 'weightedValue'),
    });
  }

  if (noNextStepDeals.length > 0) {
    actions.push({
      id: 'missing-next-step',
      priority: 'medium',
      title: 'Clean up missing next steps',
      description: 'Every active opportunity should have a dated next action before the next pipeline review.',
      count: noNextStepDeals.length,
      impactValue: sumDealValue(noNextStepDeals, 'weightedValue'),
    });
  }

  if (staleDeals.length > 0) {
    actions.push({
      id: 'stale-pipeline',
      priority: 'medium',
      title: 'Refresh stale pipeline',
      description: 'Remove dead weight or re-engage deals without recent activity.',
      count: staleDeals.length,
      impactValue: sumDealValue(staleDeals, 'weightedValue'),
    });
  }

  return actions
    .sort((a, b) => {
      const priorityDelta = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      return priorityDelta || b.impactValue - a.impactValue;
    })
    .slice(0, 5);
};

export const buildPipelineIntelligence = (deals = [], options = {}) => {
  const now = parseDateValue(options.now) || new Date();
  const monthlyGoal = Math.max(0, toFiniteNumber(options.monthlyGoal));
  const normalizedDeals = deals.map((deal) => normalizeDealForIntelligence(deal, now));
  const activeDeals = normalizedDeals.filter((deal) => deal.isActive);
  const closedDeals = normalizedDeals.filter((deal) => TERMINAL_STAGES.has(deal.stage));
  const wonThisMonth = normalizedDeals.filter((deal) =>
    deal.stage === 'won' && isCurrentMonth(deal.actual_close_date || deal.updated_at || deal.created_at, now)
  );
  const currentMonthWonValue = sumDealValue(wonThisMonth);
  const activePipelineValue = sumDealValue(activeDeals);
  const weightedPipelineValue = sumDealValue(activeDeals, 'weightedValue');
  const goalGap = Math.max(0, monthlyGoal - currentMonthWonValue);
  const weightedCoverageRatio = monthlyGoal > 0
    ? (currentMonthWonValue + weightedPipelineValue) / monthlyGoal
    : 0;
  const rawCoverageRatio = goalGap > 0 ? activePipelineValue / goalGap : 999;
  const averageInactiveDays = activeDeals.length
    ? Math.round(activeDeals.reduce((sum, deal) => sum + deal.daysInactive, 0) / activeDeals.length)
    : 0;

  const staleDeals = activeDeals
    .filter((deal) => deal.daysInactive >= 7)
    .sort(sortByWeightedValueDesc);
  const highImpactRisks = activeDeals
    .filter((deal) => deal.isAtRisk)
    .sort(sortByWeightedValueDesc)
    .slice(0, 5);
  const closingSoonDeals = activeDeals
    .filter((deal) => deal.daysUntilClose !== null && deal.daysUntilClose >= 0 && deal.daysUntilClose <= 30)
    .sort(sortByWeightedValueDesc)
    .slice(0, 5);
  const noNextStepDeals = activeDeals
    .filter((deal) => !deal.next_step)
    .sort(sortByWeightedValueDesc)
    .slice(0, 5);
  const commitDeals = activeDeals
    .filter((deal) => deal.probability >= 70)
    .sort(sortByWeightedValueDesc);
  const wonDeals = closedDeals.filter((deal) => deal.stage === 'won');
  const winRate = closedDeals.length ? Math.round((wonDeals.length / closedDeals.length) * 100) : 0;

  const executiveActions = buildExecutiveActions({
    highImpactRisks,
    closingSoonDeals,
    staleDeals,
    noNextStepDeals,
    goalGap,
    weightedCoverageRatio,
  });

  return {
    normalizedDeals,
    activeDeals,
    closedDeals,
    currentMonthWonValue,
    activePipelineValue,
    weightedPipelineValue,
    forecastToGoalValue: currentMonthWonValue + weightedPipelineValue,
    next30DayWeightedValue: sumDealValue(closingSoonDeals, 'weightedValue'),
    commitValue: sumDealValue(commitDeals, 'weightedValue'),
    atRiskValue: sumDealValue(highImpactRisks, 'weightedValue'),
    goalGap,
    weightedCoverageRatio,
    rawCoverageRatio,
    averageInactiveDays,
    staleDeals,
    highImpactRisks,
    closingSoonDeals,
    noNextStepDeals,
    executiveActions,
    winRate,
  };
};

// Note: Customer-related intelligence functions (buildCustomerHealth, getCustomerGrade, etc.) 
// have been refactored and extracted to customerIntelligence.js.
