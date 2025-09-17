import * as react18 from '../src/react18';

describe('react18 module exports', () => {
  it('should export React 18+ optimized hooks and utilities', () => {
    // Check that the module exports hooks from react18-hooks
    expect(react18.useDeferredStore).toBeDefined();
    expect(react18.useTransitionStore).toBeDefined();
    expect(react18.useOptimizedStoreUpdate).toBeDefined();
    expect(react18.useConcurrentStore).toBeDefined();
  });

  it('should export hook types', () => {
    // The module re-exports everything from react18-hooks
    expect(typeof react18.useDeferredStore).toBe('function');
    expect(typeof react18.useTransitionStore).toBe('function');
  });
});