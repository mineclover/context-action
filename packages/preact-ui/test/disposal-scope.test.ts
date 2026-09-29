import { describe, expect, it } from 'vitest';
import { createDisposalScope } from '../src/disposal-scope.js';

describe('disposal scope', () => {
  it('releases consumers before providers exactly once', () => {
    const order: string[] = []; const scope = createDisposalScope();
    scope.add(() => { order.push('model'); });
    scope.add(() => { order.push('subscription'); });
    scope.add(() => { order.push('view'); });
    scope.dispose(); scope.dispose();
    expect(order).toEqual(['view', 'subscription', 'model']);
  });
  it('attempts every cleanup, aggregates failures, and is terminal', () => {
    const scope = createDisposalScope(); let cleaned = false;
    scope.add(() => { cleaned = true; });
    scope.add(() => { throw new Error('cleanup'); });
    expect(() => scope.dispose()).toThrow(AggregateError);
    expect(cleaned).toBe(true);
    expect(scope.disposed).toBe(true);
    expect(() => scope.dispose()).not.toThrow();
  });
  it('immediately releases resources registered after disposal', () => {
    const scope = createDisposalScope(); scope.dispose(); let cleaned = false;
    scope.add(() => { cleaned = true; });
    expect(cleaned).toBe(true);
  });
});
