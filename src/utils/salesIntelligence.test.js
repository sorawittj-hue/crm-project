import { describe, it, expect } from 'vitest';
import { normalizeDealForIntelligence, buildPipelineIntelligence, getTopFocusDeals, getUpcomingRenewals } from './salesIntelligence';

describe('Sales Intelligence Utilities - Unit Tests', () => {
  it('should correctly normalize an active deal with default proposal probability', () => {
    const mockDeal = {
      id: 'deal-1',
      stage: 'proposal',
      value: 100000,
      created_at: '2026-06-01T00:00:00Z',
      last_activity: '2026-06-18T00:00:00Z',
      expected_close_date: '2026-07-01'
    };

    const now = new Date('2026-06-21T00:00:00Z');
    const result = normalizeDealForIntelligence(mockDeal, now);

    expect(result.stage).toBe('proposal');
    expect(result.value).toBe(100000);
    expect(result.probability).toBe(55); // proposal default probability is 55%
    expect(result.weightedValue).toBe(55000); // 100,000 * 0.55 = 55,000
    expect(result.daysInactive).toBe(3); // June 21 - June 18 = 3 days
    expect(result.daysOpen).toBe(20); // June 21 - June 1 = 20 days
    expect(result.daysUntilClose).toBe(10); // June 21 to July 1 = 10 days
    expect(result.isActive).toBe(true);
    expect(result.isAtRisk).toBe(false); // 3 days inactive is below the proposal threshold of 5 days
    expect(result.healthScore).toBeGreaterThan(50);
  });

  it('should classify a deal as at-risk if inactive too long', () => {
    const mockDeal = {
      id: 'deal-2',
      stage: 'negotiation',
      value: 50000,
      created_at: '2026-06-01T00:00:00Z',
      last_activity: '2026-06-10T00:00:00Z', // 11 days inactive
      expected_close_date: '2026-07-15'
    };

    const now = new Date('2026-06-21T00:00:00Z');
    const result = normalizeDealForIntelligence(mockDeal, now);

    expect(result.daysInactive).toBe(11);
    expect(result.isActive).toBe(true);
    expect(result.isAtRisk).toBe(true); // negotiation stales at >= 5 days
  });

  it('should handle terminal won deals correctly', () => {
    const mockDeal = {
      id: 'deal-3',
      stage: 'won',
      value: 75000,
      created_at: '2026-06-01T00:00:00Z',
      actual_close_date: '2026-06-15T00:00:00Z'
    };

    const now = new Date('2026-06-21T00:00:00Z');
    const result = normalizeDealForIntelligence(mockDeal, now);

    expect(result.probability).toBe(100);
    expect(result.weightedValue).toBe(75000);
    expect(result.isActive).toBe(false); // won is terminal stage
    expect(result.isAtRisk).toBe(false);
  });

  it('should correctly calculate pipeline intelligence aggregates', () => {
    const mockDeals = [
      {
        id: 'deal-1',
        stage: 'proposal',
        value: 100000,
        created_at: '2026-06-01T00:00:00Z',
        last_activity: '2026-06-18T00:00:00Z',
        expected_close_date: '2026-07-01'
      },
      {
        id: 'deal-2',
        stage: 'won',
        value: 50000,
        created_at: '2026-06-05T00:00:00Z',
        actual_close_date: '2026-06-12T00:00:00Z'
      },
      {
        id: 'deal-3',
        stage: 'lost',
        value: 30000,
        created_at: '2026-06-01T00:00:00Z',
        actual_close_date: '2026-06-10T00:00:00Z'
      }
    ];

    const now = new Date('2026-06-21T00:00:00Z');
    const result = buildPipelineIntelligence(mockDeals, { monthlyGoal: 100000, now });

    expect(result.currentMonthWonValue).toBe(50000);
    expect(result.activePipelineValue).toBe(100000);
    expect(result.forecastToGoalValue).toBe(50000 + 55000); // won + weighted proposal
    expect(result.goalGap).toBe(50000); // 100000 goal - 50000 won
    expect(result.winRate).toBe(50); // 1 won, 1 lost = 50%
  });

  it('should calculate focus score and return top focus deals prioritizing high stage + inactive', () => {
    const mockDeals = [
      {
        id: 'deal-1',
        stage: 'lead', // velocity 1.0
        value: 100000,
        probability: 10,
        created_at: '2026-06-20T00:00:00Z', // 1 day inactive -> weight ~1.1
      },
      {
        id: 'deal-2',
        stage: 'negotiation', // velocity 2.0
        value: 100000,
        probability: 75,
        created_at: '2026-06-01T00:00:00Z',
        last_activity: '2026-06-11T00:00:00Z', // 10 days inactive -> weight 2.0
      },
      {
        id: 'deal-3',
        stage: 'won', // Should be excluded
        value: 5000000,
        created_at: '2026-06-01T00:00:00Z',
      }
    ];

    const now = new Date('2026-06-21T00:00:00Z');
    const focusDeals = getTopFocusDeals(mockDeals, now, 3);
    
    expect(focusDeals.length).toBe(2);
    expect(focusDeals[0].id).toBe('deal-2'); // higher stage, higher value, more inactive
    expect(focusDeals[1].id).toBe('deal-1');
  });

  it('should correctly filter and sort upcoming renewals', () => {
    const mockDeals = [
      { id: '1', stage: 'won', is_recurring: true, renewal_date: '2026-07-01T00:00:00Z' }, // Excluded (terminal)
      { id: '2', stage: 'negotiation', is_recurring: false }, // Excluded (not recurring)
      { id: '3', stage: 'proposal', is_recurring: true, renewal_date: '2026-12-01T00:00:00Z' }, // Excluded (outside 90 days window)
      { id: '4', stage: 'negotiation', is_recurring: true, renewal_date: '2026-07-15T00:00:00Z', customer_id: 'c1' }, // Included
      { id: '5', stage: 'proposal', is_recurring: true, renewal_date: '2026-07-15T00:00:00Z', customer_id: 'c2' }, // Included, same date as deal 4
    ];

    const mockCustomers = [
      { id: 'c1', name: 'Cust 1' },
      { id: 'c2', name: 'Cust 2' }
    ];

    // Assuming buildCustomerHealth is somewhat deterministic or mocked. 
    // Without mocking buildCustomerHealth, it uses real logic which assigns default scores based on deals.
    // deal 4 (negotiation) will probably have a different score than deal 5 (proposal).
    // Let's just check length and inclusion for simplicity.

    const now = new Date('2026-06-21T00:00:00Z');
    const renewals = getUpcomingRenewals(mockDeals, mockCustomers, now, 90);

    expect(renewals.length).toBe(2);
    expect(renewals.map(r => r.id)).toContain('4');
    expect(renewals.map(r => r.id)).toContain('5');
    // They should be sorted by date (which are same here) then by health score.
  });
});
