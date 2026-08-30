import type { AsyncDemoResult } from '../contexts/CoreAdvancedContexts';

export function incrementCount(count: number): number {
  return count + 1;
}

export function multiplyCount(count: number, factor: number): number {
  return count * factor;
}

export function divideCount(count: number, divisor: number): number {
  return Math.floor(count / divisor);
}

export function appendPriorityResult(
  results: string[],
  priority: number,
  message: string
): string[] {
  return [
    ...results,
    `${priority === 3 ? 'High' : priority === 2 ? 'Mid' : 'Low'} Priority (${priority}): ${message}`,
  ];
}

export function createAsyncResult(
  id: string,
  message: string,
  status: AsyncDemoResult['status'],
  timestamp: string
): AsyncDemoResult {
  return { id, message, status, timestamp };
}

export function updateAsyncResult(
  results: AsyncDemoResult[],
  id: string,
  status: AsyncDemoResult['status'],
  timestamp: string
): AsyncDemoResult[] {
  return results.map((result) =>
    result.id === id ? { ...result, status, timestamp } : result
  );
}
