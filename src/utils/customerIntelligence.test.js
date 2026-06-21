import { describe, it, expect } from 'vitest';
import { buildCustomerHealth, getCustomerGrade, getCustomerStatus } from './customerIntelligence';

describe('Customer Intelligence Utilities - Unit Tests', () => {
  it('should correctly calculate customer status based on health score and risk count', () => {
    // healthy
    expect(getCustomerStatus(80, 0, 0)).toBe('healthy');
    // growth (weighted active value > 0 and health >= 70)
    expect(getCustomerStatus(75, 100000, 0)).toBe('growth');
    // watch (health < 70 or riskCount === 1)
    expect(getCustomerStatus(65, 0, 1)).toBe('watch');
    // at_risk (health < 45 or riskCount >= 2)
    expect(getCustomerStatus(40, 10000, 1)).toBe('at_risk');
    expect(getCustomerStatus(80, 10000, 2)).toBe('at_risk');
  });

  it('should determine customer grade correctly based on performance', () => {
    // Grade A: score >= 65
    const gradeA = getCustomerGrade({
      wonValue: 2500000,
      winRate: 80,
      totalDeals: 6,
      healthScore: 90,
      tier: 'Platinum',
    });
    expect(gradeA).toBe('A');

    // Grade D: score < 18
    const gradeD = getCustomerGrade({
      wonValue: 0,
      winRate: 0,
      totalDeals: 1,
      healthScore: 30,
      tier: 'Silver',
    });
    expect(gradeD).toBe('D');
  });

  it('should aggregate customer deals and enrich customer details', () => {
    const mockCustomers = [
      { id: 'cust-1', name: 'John Doe', company: 'Acme Corp', tier: 'Gold' }
    ];
    const mockDeals = [
      { id: 'deal-1', customer_id: 'cust-1', stage: 'won', value: 500000, created_at: '2026-06-01T00:00:00Z', actual_close_date: '2026-06-10T00:00:00Z' },
      { id: 'deal-2', customer_id: 'cust-1', stage: 'proposal', value: 100000, created_at: '2026-06-15T00:00:00Z', probability: 80 }
    ];

    const now = new Date('2026-06-21T00:00:00Z');
    const result = buildCustomerHealth(mockCustomers, mockDeals, { now });

    expect(result.length).toBe(1);
    expect(result[0].id).toBe('cust-1');
    expect(result[0].dealStats.total).toBe(2);
    expect(result[0].dealStats.won).toBe(1);
    expect(result[0].dealStats.wonValue).toBe(500000);
    expect(result[0].health.score).toBeGreaterThan(50);
  });
});
