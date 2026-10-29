import { afterEach, describe, expect, it, vi } from 'vitest';
import { calculateRollingRenderRate } from '../hooks/useRerenderMonitor';
import {
  comparePerformance,
  type PerformanceData,
  PerformanceTracker,
} from './performanceUtils';

const sample = (renderTime: number): PerformanceData => ({
  timestamp: 0,
  renderCount: 1,
  renderTime,
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('calculateRollingRenderRate', () => {
  it('counts only timestamps inside the rolling one-second window', () => {
    expect(calculateRollingRenderRate([0, 500, 1000, 1500], 1500)).toBe(2);
    expect(calculateRollingRenderRate([0, 500, 1000, 1500], 1500, 600)).toBe(2);
  });

  it('does not cap a high-frequency window at the duration sample limit', () => {
    const timestamps = Array.from({ length: 120 }, (_, index) => 1500 - index);

    expect(calculateRollingRenderRate(timestamps, 1500)).toBe(120);
  });
});

describe('PerformanceTracker', () => {
  it('uses the latest cumulative render count instead of summing snapshots', () => {
    const now = vi
      .spyOn(performance, 'now')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(5)
      .mockReturnValueOnce(10)
      .mockReturnValueOnce(18);
    const tracker = new PerformanceTracker();

    tracker.start();
    tracker.end(3);
    tracker.start();
    tracker.end(5);

    expect(tracker.getTotalRenderCount()).toBe(5);
    expect(now).toHaveBeenCalledTimes(4);
  });
});

describe('comparePerformance', () => {
  it('marks empty comparisons as unavailable', () => {
    const result = comparePerformance([], [sample(10)]);

    expect(result.available).toBe(false);
    expect(result.reason).toBe('no-samples');
    expect(result.improvement).toBeNull();
    expect(result.isBetter).toBeNull();
  });

  it('marks a zero baseline as unavailable instead of returning Infinity', () => {
    const result = comparePerformance([sample(1)], [sample(0)]);

    expect(result.available).toBe(false);
    expect(result.reason).toBe('zero-baseline');
    expect(result.improvement).toBeNull();
    expect(result.isBetter).toBeNull();
  });
});
