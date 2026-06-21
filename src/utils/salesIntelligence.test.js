import { describe, it, expect } from 'vitest';
import { normalizeDealForIntelligence, buildPipelineIntelligence } from './salesIntelligence';

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
});
