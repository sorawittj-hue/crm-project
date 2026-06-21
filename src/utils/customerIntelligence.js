import { normalizeDealForIntelligence } from './salesIntelligence';

const DAY_MS = 86_400_000;

const TIER_WEIGHT = {
  Platinum: 18,
  Gold: 12,
  Silver: 6,
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toFiniteNumber = (value, fallback = 0) => {
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

const getLastTouchDate = (deal) =>
  deal?.last_activity || deal?.updated_at || deal?.created_at || deal?.createdAt || null;

const sumDealValue = (deals, field = 'value') =>
  deals.reduce((sum, deal) => sum + toFiniteNumber(deal[field]), 0);

export const getCustomerGrade = ({ wonValue, winRate, totalDeals, healthScore, tier }) => {
  const tierBoost = { Platinum: 20, Gold: 10, Silver: 0 }[tier] || 0;
  const score =
    (wonValue >= 2_000_000 ? 40 : wonValue >= 500_000 ? 25 : wonValue >= 100_000 ? 12 : 0) +
    (winRate >= 70 ? 25 : winRate >= 50 ? 15 : winRate >= 30 ? 8 : 0) +
    (totalDeals >= 5 ? 15 : totalDeals >= 2 ? 8 : 0) +
    (healthScore >= 80 ? 10 : healthScore >= 60 ? 5 : 0) +
    tierBoost;

  if (score >= 65) return 'A';
  if (score >= 40) return 'B';
  if (score >= 18) return 'C';
  return 'D';
};

export const getCustomerStatus = (healthScore, weightedActiveValue, riskCount) => {
  if (healthScore < 45 || riskCount >= 2) return 'at_risk';
  if (healthScore < 70 || riskCount === 1) return 'watch';
  if (weightedActiveValue > 0) return 'growth';
  return 'healthy';
};

export const getCustomerNextAction = (status) => {
  if (status === 'at_risk') return 'Book executive recovery call and confirm blockers';
  if (status === 'watch') return 'Schedule proactive account check-in';
  if (status === 'growth') return 'Map expansion stakeholders and renewal timing';
  return 'Maintain relationship cadence';
};

export const buildCustomerStats = (customerDeals, tier, now) => {
  const wonDeals = customerDeals.filter((d) => d.stage === 'won');
  const lostDeals = customerDeals.filter((d) => d.stage === 'lost');
  const activeDeals = customerDeals.filter((d) => d.isActive);
  const riskCount = activeDeals.filter((d) => d.isAtRisk).length;
  const totalClosed = wonDeals.length + lostDeals.length;
  const winRate = totalClosed ? Math.round((wonDeals.length / totalClosed) * 100) : 0;
  const lastTouchMs = customerDeals.reduce((max, deal) => {
    const date = parseDateValue(getLastTouchDate(deal));
    return date ? Math.max(max, date.getTime()) : max;
  }, 0);
  const inactiveDays = lastTouchMs ? getDaysBetween(new Date(lastTouchMs), now) : null;
  const wonValue = sumDealValue(wonDeals);
  const activeValue = sumDealValue(activeDeals);
  const weightedActiveValue = sumDealValue(activeDeals, 'weightedValue');
  const tierBonus = TIER_WEIGHT[tier] || 4;
  const inactivityPenalty = inactiveDays === null ? 16 : clamp(inactiveDays * 1.5, 0, 35);
  const riskPenalty = riskCount * 18;
  const score = clamp(Math.round(62 + tierBonus + winRate * 0.18 - inactivityPenalty - riskPenalty), 0, 100);
  const status = getCustomerStatus(score, weightedActiveValue, riskCount);
  const grade = getCustomerGrade({ wonValue, winRate, totalDeals: customerDeals.length, healthScore: score, tier });
  return {
    grade,
    dealStats: {
      total: customerDeals.length,
      won: wonDeals.length,
      lost: lostDeals.length,
      wonValue,
      activeValue,
      weightedActiveValue,
      deals: customerDeals,
    },
    health: {
      score,
      status,
      riskCount,
      inactiveDays,
      winRate,
      nextAction: getCustomerNextAction(status),
    },
  };
};

export const buildCustomerHealth = (customers = [], deals = [], options = {}) => {
  const now = parseDateValue(options.now) || new Date();
  const normalizedDeals = deals.map((deal) => normalizeDealForIntelligence(deal, now));

  const companyToCustomerId = customers.reduce((acc, c) => {
    if (c.company) acc[c.company.trim().toLowerCase()] = c.id;
    if (c.name) acc[c.name.trim().toLowerCase()] = c.id;
    return acc;
  }, {});

  const dealsByCustomer = {};
  const orphanDealsByCompany = {};

  normalizedDeals.forEach((deal) => {
    const cid = deal.customer_id ||
      (deal.company && companyToCustomerId[deal.company.trim().toLowerCase()]);
    if (cid) {
      if (!dealsByCustomer[cid]) dealsByCustomer[cid] = [];
      dealsByCustomer[cid].push(deal);
    } else if (deal.company) {
      const key = deal.company.trim().toLowerCase();
      if (!orphanDealsByCompany[key]) orphanDealsByCompany[key] = [];
      orphanDealsByCompany[key].push(deal);
    }
  });

  const enrichedCustomers = customers.map((customer) => {
    const customerDeals = dealsByCustomer[customer.id] || [];
    const stats = buildCustomerStats(customerDeals, customer.tier, now);
    return { ...customer, ...stats };
  });

  const syntheticCustomers = Object.entries(orphanDealsByCompany).map(([key, orphanDeals]) => {
    const firstDeal = orphanDeals[0];
    const company = firstDeal.company.trim();
    const stats = buildCustomerStats(orphanDeals, 'Silver', now);
    return {
      id: `deal_company_${key}`,
      name: company,
      company,
      email: firstDeal.contact_email || null,
      phone: firstDeal.contact_phone || null,
      industry: null,
      tier: 'Silver',
      notes: null,
      _fromDeals: true,
      ...stats,
    };
  });

  return [...enrichedCustomers, ...syntheticCustomers];
};
