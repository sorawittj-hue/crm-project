import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { calculateForecastAccuracy, getLostReasonBreakdown } from './forecastAccuracy';

describe('Forecast Accuracy Utilities', () => {
  beforeAll(() => {
    // Mock system time for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-21T00:00:00Z'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should handle empty deals', () => {
    expect(calculateForecastAccuracy([])).toHaveLength(6);
    expect(getLostReasonBreakdown([])).toEqual([]);
  });

  it('should calculate forecast accuracy correctly', () => {
    const deals = [
      {
        id: '1',
        stage: 'won',
        value: 100000,
        actual_close_date: '2026-06-15T00:00:00Z'
      },
      {
        id: '2',
        stage: 'lost',
        value: 50000,
        probability: 50,
        actual_close_date: '2026-06-10T00:00:00Z'
      },
      {
        id: '3',
        stage: 'proposal',
        value: 200000,
        probability: 60,
        expected_close_date: '2026-06-25T00:00:00Z'
      }
    ];

    const result = calculateForecastAccuracy(deals, 3);
    expect(result.length).toBe(3);
    
    // Check current month (June 2026)
    const juneData = result[result.length - 1];
    expect(juneData.actual).toBe(100000);
    // Forecast should be: 
    // Deal 1 (Won) = 100000
    // Deal 2 (Lost) = 50000 * 0.5 = 25000
    // Deal 3 (Proposal) = 200000 * 0.6 = 120000
    // Total forecast = 245000
    expect(juneData.forecast).toBe(245000);
    // Accuracy = Math.round((100000 / 245000) * 100) = 41%
    expect(juneData.accuracy).toBe(41);
  });

  it('should breakdown lost reasons correctly', () => {
    const deals = [
      {
        id: '1',
        stage: 'lost',
        value: 100000,
        lost_reason: 'Price'
      },
      {
        id: '2',
        stage: 'lost',
        value: 50000,
        lost_reason: 'Price'
      },
      {
        id: '3',
        stage: 'lost',
        value: 200000,
        lost_reason: 'Competitor'
      },
      {
        id: '4',
        stage: 'lost',
        value: 30000,
        // No reason
      }
    ];

    const result = getLostReasonBreakdown(deals);
    
    expect(result.length).toBe(3);
    
    // Should be sorted by value descending
    expect(result[0].reason).toBe('Competitor');
    expect(result[0].value).toBe(200000);
    expect(result[0].count).toBe(1);

    expect(result[1].reason).toBe('Price');
    expect(result[1].value).toBe(150000);
    expect(result[1].count).toBe(2);

    expect(result[2].reason).toBe('ไม่ระบุสาเหตุ');
    expect(result[2].value).toBe(30000);
    expect(result[2].count).toBe(1);
  });
});
