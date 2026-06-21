import { toFiniteNumber } from './salesIntelligence';

export const calculateForecastAccuracy = (deals, monthRange = 6) => {
  if (!deals || !Array.isArray(deals)) return [];

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const months = [];
  for (let i = monthRange - 1; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      name: d.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' }),
      actual: 0,
      forecast: 0,
      accuracy: 0
    });
  }

  deals.forEach(deal => {
    const value = Math.max(0, toFiniteNumber(deal.value));
    if (value === 0) return;

    // Determine the month the deal was closed or expected to close
    const targetDateStr = deal.stage === 'won' || deal.stage === 'lost' 
      ? (deal.actual_close_date || deal.updated_at || deal.created_at)
      : (deal.expected_close_date || deal.created_at);
      
    if (!targetDateStr) return;
    
    const targetDate = new Date(targetDateStr);
    const mKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
    
    const monthData = months.find(m => m.key === mKey);
    if (!monthData) return;

    if (deal.stage === 'won') {
      monthData.actual += value;
      // We also add to forecast if we want to compare past predictions vs reality, 
      // but typically won deals were part of the forecast at 100% at the end.
      // To simulate historical forecast, we assume won deals were forecasted at their full value.
      monthData.forecast += value; 
    } else if (deal.stage === 'lost') {
      // Lost deals were forecasted but yielded 0 actual.
      // We use their original probability if available, otherwise assume 50% for past lost deals if missing.
      const prob = deal.probability != null ? Number(deal.probability) / 100 : 0.5;
      monthData.forecast += (value * prob);
    } else {
      // Active deals
      const prob = deal.probability != null ? Number(deal.probability) / 100 : 0.5;
      monthData.forecast += (value * prob);
    }
  });

  // Calculate accuracy
  return months.map(m => {
    let accuracy = 0;
    if (m.forecast > 0) {
      // If actual > forecast, it's > 100%. We cap it or show raw %. Let's show raw %.
      accuracy = Math.round((m.actual / m.forecast) * 100);
    }
    return { ...m, accuracy };
  });
};

export const getLostReasonBreakdown = (deals) => {
  if (!deals || !Array.isArray(deals)) return [];

  const lostDeals = deals.filter(d => d.stage === 'lost');
  const reasons = {};

  lostDeals.forEach(deal => {
    const reason = deal.lost_reason || 'ไม่ระบุสาเหตุ';
    if (!reasons[reason]) {
      reasons[reason] = { count: 0, value: 0 };
    }
    reasons[reason].count += 1;
    reasons[reason].value += Math.max(0, toFiniteNumber(deal.value));
  });

  return Object.entries(reasons)
    .map(([reason, stats]) => ({
      reason,
      count: stats.count,
      value: stats.value
    }))
    .sort((a, b) => b.value - a.value);
};
