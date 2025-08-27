/**
 * Filter functionality test
 */

import { ActionRegister } from '../../src';

interface TestActions {
  testAction: { value: string };
}

describe('Filter Functionality Tests', () => {
  let actionRegister: ActionRegister<TestActions>;
  let executedHandlers: string[];

  beforeEach(() => {
    actionRegister = new ActionRegister<TestActions>({
      name: 'FilterTest',
      registry: { debug: false }
    });
    executedHandlers = [];
  });

  describe('🔍 Handler ID Filtering', () => {
    it('should filter by specific handler IDs', async () => {
      // Register multiple handlers
      actionRegister.register('testAction', () => {
        executedHandlers.push('handler-1');
      }, { id: 'handler-1', priority: 30 });

      actionRegister.register('testAction', () => {
        executedHandlers.push('handler-2');
      }, { id: 'handler-2', priority: 20 });

      actionRegister.register('testAction', () => {
        executedHandlers.push('handler-3');
      }, { id: 'handler-3', priority: 10 });

      // Dispatch with ID filter
      await actionRegister.dispatch('testAction', { value: 'test' }, {
        filter: {
          handlerIds: ['handler-2', 'handler-3']
        }
      });

      expect(executedHandlers).toEqual(['handler-2', 'handler-3']);
    });

    it('should exclude specific handler IDs', async () => {
      // Register multiple handlers
      actionRegister.register('testAction', () => {
        executedHandlers.push('handler-1');
      }, { id: 'handler-1', priority: 30 });

      actionRegister.register('testAction', () => {
        executedHandlers.push('handler-2');
      }, { id: 'handler-2', priority: 20 });

      actionRegister.register('testAction', () => {
        executedHandlers.push('handler-3');
      }, { id: 'handler-3', priority: 10 });

      // Dispatch with exclude filter
      await actionRegister.dispatch('testAction', { value: 'test' }, {
        filter: {
          excludeHandlerIds: ['handler-2']
        }
      });

      expect(executedHandlers).toEqual(['handler-1', 'handler-3']);
    });
  });

  describe('🎯 Priority Filtering', () => {
    it('should filter by minimum priority', async () => {
      // Register handlers with different priorities
      actionRegister.register('testAction', () => {
        executedHandlers.push('high-priority');
      }, { id: 'high', priority: 50 });

      actionRegister.register('testAction', () => {
        executedHandlers.push('medium-priority');
      }, { id: 'medium', priority: 30 });

      actionRegister.register('testAction', () => {
        executedHandlers.push('low-priority');
      }, { id: 'low', priority: 10 });

      // Dispatch with minimum priority filter
      await actionRegister.dispatch('testAction', { value: 'test' }, {
        filter: {
          priority: { min: 25 }
        }
      });

      expect(executedHandlers).toEqual(['high-priority', 'medium-priority']);
    });

    it('should filter by maximum priority', async () => {
      // Register handlers with different priorities
      actionRegister.register('testAction', () => {
        executedHandlers.push('high-priority');
      }, { id: 'high', priority: 50 });

      actionRegister.register('testAction', () => {
        executedHandlers.push('medium-priority');
      }, { id: 'medium', priority: 30 });

      actionRegister.register('testAction', () => {
        executedHandlers.push('low-priority');
      }, { id: 'low', priority: 10 });

      // Dispatch with maximum priority filter
      await actionRegister.dispatch('testAction', { value: 'test' }, {
        filter: {
          priority: { max: 35 }
        }
      });

      expect(executedHandlers).toEqual(['medium-priority', 'low-priority']);
    });

    it('should filter by priority range', async () => {
      // Register handlers with different priorities
      actionRegister.register('testAction', () => {
        executedHandlers.push('very-high');
      }, { id: 'very-high', priority: 100 });

      actionRegister.register('testAction', () => {
        executedHandlers.push('high');
      }, { id: 'high', priority: 50 });

      actionRegister.register('testAction', () => {
        executedHandlers.push('medium');
      }, { id: 'medium', priority: 30 });

      actionRegister.register('testAction', () => {
        executedHandlers.push('low');
      }, { id: 'low', priority: 10 });

      actionRegister.register('testAction', () => {
        executedHandlers.push('very-low');
      }, { id: 'very-low', priority: 1 });

      // Dispatch with priority range filter
      await actionRegister.dispatch('testAction', { value: 'test' }, {
        filter: {
          priority: { min: 20, max: 60 }
        }
      });

      expect(executedHandlers).toEqual(['high', 'medium']);
    });
  });

  describe('🔧 Custom Filtering', () => {
    it('should use custom filter function', async () => {
      // Register handlers with different priorities
      actionRegister.register('testAction', () => {
        executedHandlers.push('blocking');
      }, { id: 'blocking', priority: 30, blocking: true });

      actionRegister.register('testAction', () => {
        executedHandlers.push('non-blocking-1');
      }, { id: 'non-blocking-1', priority: 20, blocking: false });

      actionRegister.register('testAction', () => {
        executedHandlers.push('non-blocking-2');
      }, { id: 'non-blocking-2', priority: 10 }); // blocking defaults to false

      // Dispatch with custom filter (only blocking handlers)
      await actionRegister.dispatch('testAction', { value: 'test' }, {
        filter: {
          custom: (config) => config.blocking === true
        }
      });

      expect(executedHandlers).toEqual(['blocking']);
    });
  });

  describe('🔀 Combined Filtering', () => {
    it('should combine multiple filter types', async () => {
      // Register handlers with different configurations
      actionRegister.register('testAction', () => {
        executedHandlers.push('handler-A');
      }, { id: 'handler-A', priority: 50, blocking: true });

      actionRegister.register('testAction', () => {
        executedHandlers.push('handler-B');
      }, { id: 'handler-B', priority: 40, blocking: false });

      actionRegister.register('testAction', () => {
        executedHandlers.push('handler-C');
      }, { id: 'handler-C', priority: 30, blocking: true });

      actionRegister.register('testAction', () => {
        executedHandlers.push('handler-D');
      }, { id: 'handler-D', priority: 20, blocking: false });

      actionRegister.register('testAction', () => {
        executedHandlers.push('handler-E');
      }, { id: 'handler-E', priority: 10, blocking: true });

      // Combine priority filter + custom filter + exclude filter
      await actionRegister.dispatch('testAction', { value: 'test' }, {
        filter: {
          priority: { min: 25 }, // A=50, B=40, C=30 qualify
          excludeHandlerIds: ['handler-B'], // Exclude B
          custom: (config) => config.blocking === true // Only blocking (A, C qualify)
        }
      });

      // Should execute: A (50, blocking) and C (30, blocking)
      // Excluded: B (excluded by ID), D (priority too low), E (priority too low)
      expect(executedHandlers).toEqual(['handler-A', 'handler-C']);
    });
  });

  describe('📊 Filter Performance', () => {
    it('should handle empty filters gracefully', async () => {
      actionRegister.register('testAction', () => {
        executedHandlers.push('handler');
      }, { id: 'handler', priority: 10 });

      // Dispatch with empty filter options
      await actionRegister.dispatch('testAction', { value: 'test' }, {
        filter: {}
      });

      expect(executedHandlers).toEqual(['handler']);
    });

    it('should handle no matching filters', async () => {
      actionRegister.register('testAction', () => {
        executedHandlers.push('handler');
      }, { id: 'handler', priority: 10 });

      // Dispatch with filter that matches nothing
      await actionRegister.dispatch('testAction', { value: 'test' }, {
        filter: {
          handlerIds: ['non-existent']
        }
      });

      expect(executedHandlers).toEqual([]);
    });

    it('should not copy array when no filter is provided', async () => {
      actionRegister.register('testAction', () => {
        executedHandlers.push('handler-1');
      }, { id: 'handler-1', priority: 20 });

      actionRegister.register('testAction', () => {
        executedHandlers.push('handler-2');
      }, { id: 'handler-2', priority: 10 });

      // Dispatch without filter (should use original array)
      await actionRegister.dispatch('testAction', { value: 'test' });

      expect(executedHandlers).toEqual(['handler-1', 'handler-2']);
    });
  });

  describe('🎛️ Filter with Result Collection', () => {
    it('should collect results from filtered handlers only', async () => {
      actionRegister.register('testAction', () => {
        executedHandlers.push('handler-1');
        return { id: 'result-1' };
      }, { id: 'handler-1', priority: 30 });

      actionRegister.register('testAction', () => {
        executedHandlers.push('handler-2');
        return { id: 'result-2' };
      }, { id: 'handler-2', priority: 20 });

      actionRegister.register('testAction', () => {
        executedHandlers.push('handler-3');
        return { id: 'result-3' };
      }, { id: 'handler-3', priority: 10 });

      const result = await actionRegister.dispatchWithResult('testAction', { value: 'test' }, {
        filter: {
          handlerIds: ['handler-1', 'handler-3']
        },
        result: {
          collect: true,
          strategy: 'all'
        }
      });

      expect(executedHandlers).toEqual(['handler-1', 'handler-3']);
      expect(result.results).toEqual([{ id: 'result-1' }, { id: 'result-3' }]);
      expect(result.success).toBe(true);
    });
  });
});