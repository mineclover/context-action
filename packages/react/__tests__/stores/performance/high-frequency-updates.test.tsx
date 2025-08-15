/**
 * @fileoverview High-frequency store update performance tests
 * 
 * 이 테스트는 마우스 이벤트와 같은 고빈도 업데이트 시나리오에서
 * Store 시스템이 무한루프나 성능 저하 없이 동작하는지 검증합니다.
 */

import React from 'react';
import { render, act, renderHook } from '@testing-library/react';
import { createDeclarativeStorePattern } from '../../../src/stores/patterns/declarative-store-pattern-v2';
import { createActionContext } from '../../../src/actions';
import type { ActionPayloadMap } from '@context-action/core';

// Mock console methods to capture and verify logging behavior
const mockConsole = {
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
};

const originalConsole = global.console;
beforeEach(() => {
  global.console = { ...originalConsole, ...mockConsole };
  mockConsole.debug.mockClear();
  mockConsole.warn.mockClear();
  mockConsole.error.mockClear();
  mockConsole.log.mockClear();
});

afterEach(() => {
  global.console = originalConsole;
});

// Test data types
interface MousePosition {
  x: number;
  y: number;
}

interface MouseState {
  position: MousePosition;
  movement: {
    velocity: number;
    path: MousePosition[];
    isMoving: boolean;
  };
  clicks: {
    count: number;
    history: Array<MousePosition & { timestamp: number }>;
  };
  computed: {
    activityStatus: 'idle' | 'moving' | 'clicking';
    totalEvents: number;
  };
}

interface MouseActions extends ActionPayloadMap {
  mouseMove: { x: number; y: number; timestamp: number };
  mouseClick: { x: number; y: number; timestamp: number };
}

describe('High-frequency store updates', () => {
  let TestStorePattern: ReturnType<typeof createDeclarativeStorePattern>;
  let TestActionContext: ReturnType<typeof createActionContext<MouseActions>>;
  
  beforeEach(() => {
    // Create fresh store pattern for each test
    TestStorePattern = createDeclarativeStorePattern('HighFrequencyTest', {
      position: {
        initialValue: { x: 0, y: 0 },
        description: 'Mouse position',
        strategy: 'shallow'
      },
      movement: {
        initialValue: {
          velocity: 0,
          path: [] as MousePosition[],
          isMoving: false
        },
        description: 'Mouse movement tracking',
        strategy: 'shallow'
      },
      clicks: {
        initialValue: {
          count: 0,
          history: [] as Array<MousePosition & { timestamp: number }>
        },
        description: 'Click tracking',
        strategy: 'shallow'
      },
      computed: {
        initialValue: {
          activityStatus: 'idle' as const,
          totalEvents: 0
        },
        description: 'Computed values',
        strategy: 'shallow'
      }
    });

    TestActionContext = createActionContext<MouseActions>({
      name: 'HighFrequencyActions'
    });
  });

  describe('Store update performance', () => {
    it('should handle rapid mouse move updates without performance degradation', async () => {
      const TestComponent = () => {
        const positionStore = TestStorePattern.useStore('position');
        const movementStore = TestStorePattern.useStore('movement');
        
        React.useEffect(() => {
          // Simulate 120fps mouse movement (8ms intervals)
          const interval = setInterval(() => {
            const newPos = {
              x: Math.random() * 800,
              y: Math.random() * 600
            };
            
            positionStore.setValue(newPos);
            
            const currentMovement = movementStore.getValue();
            movementStore.setValue({
              ...currentMovement,
              path: [...currentMovement.path.slice(-19), newPos],
              velocity: Math.random() * 10,
              isMoving: true
            });
          }, 8);

          return () => clearInterval(interval);
        }, [positionStore, movementStore]);

        return <div>Test</div>;
      };

      const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <TestStorePattern.Provider>
          {children}
        </TestStorePattern.Provider>
      );

      const start = performance.now();
      
      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      // Let it run for a short period
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const end = performance.now();

      // Should complete setup and initial updates quickly
      expect(end - start).toBeLessThan(200);

      // Deep clone logs should be severely limited
      const deepCloneLogs = mockConsole.debug.mock.calls.filter(
        call => call[0]?.includes?.('Deep clone successful')
      );
      expect(deepCloneLogs.length).toBeLessThan(5); // Very few logs despite many updates
    });

    it('should prevent infinite logging loops in real-time scenarios', async () => {
      const { result } = renderHook(() => {
        const positionStore = TestStorePattern.useStore('position');
        const movementStore = TestStorePattern.useStore('movement');
        const computedStore = TestStorePattern.useStore('computed');
        
        return { positionStore, movementStore, computedStore };
      }, {
        wrapper: ({ children }) => (
          <TestStorePattern.Provider>
            {children}
          </TestStorePattern.Provider>
        )
      });

      const { positionStore, movementStore, computedStore } = result.current;

      // Clear any setup logs
      mockConsole.debug.mockClear();

      // Simulate intensive real-time updates (like mouse events + computed updates)
      await act(async () => {
        for (let i = 0; i < 500; i++) {
          // Position update
          positionStore.setValue({ x: i, y: i * 2 });
          
          // Movement update (with path history)
          const currentMovement = movementStore.getValue();
          movementStore.setValue({
            velocity: i * 0.1,
            path: [...currentMovement.path.slice(-19), { x: i, y: i * 2 }],
            isMoving: i > 0
          });
          
          // Computed update (triggered by position/movement changes)
          const currentComputed = computedStore.getValue();
          computedStore.setValue({
            activityStatus: i > 0 ? 'moving' : 'idle',
            totalEvents: currentComputed.totalEvents + 1
          });
        }
      });

      // Total debug logs should be minimal (not 1500+ for 500 iterations × 3 stores)
      const totalDebugLogs = mockConsole.debug.mock.calls.length;
      expect(totalDebugLogs).toBeLessThan(50);

      // Verify stores still have correct final state
      expect(positionStore.getValue()).toEqual({ x: 499, y: 998 });
      expect(movementStore.getValue().isMoving).toBe(true);
      expect(computedStore.getValue().totalEvents).toBe(500);
    });

    it('should maintain performance during continuous 100ms intervals (like monitoring)', async () => {
      const TestComponent = () => {
        const computedStore = TestStorePattern.useStore('computed');
        const movementStore = TestStorePattern.useStore('movement');
        const [updates, setUpdates] = React.useState(0);
        
        React.useEffect(() => {
          // Simulate the 100ms monitoring interval from mouse events
          const interval = setInterval(() => {
            const currentMovement = movementStore.getValue();
            const currentComputed = computedStore.getValue();
            
            // Update computed state (like activity status recalculation)
            computedStore.setValue({
              activityStatus: currentMovement.isMoving ? 'moving' : 'idle',
              totalEvents: currentComputed.totalEvents + 1
            });
            
            setUpdates(prev => prev + 1);
          }, 100);

          return () => clearInterval(interval);
        }, [computedStore, movementStore]);

        return <div>Updates: {updates}</div>;
      };

      const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <TestStorePattern.Provider>
          {children}
        </TestStorePattern.Provider>
      );

      const start = performance.now();
      
      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      // Let monitoring run for 500ms (5 intervals)
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
      });

      const end = performance.now();

      // Should not show signs of infinite loops or excessive processing
      expect(end - start).toBeLessThan(700); // Some buffer for test environment

      // Deep clone logs should be rare even with regular intervals
      const deepCloneLogs = mockConsole.debug.mock.calls.filter(
        call => call[0]?.includes?.('Deep clone successful')
      );
      expect(deepCloneLogs.length).toBeLessThan(3);
    });

    it('should handle mixed store strategies without performance issues', async () => {
      // Create a pattern with different strategies to test mixed scenarios
      const MixedStorePattern = createDeclarativeStorePattern('MixedTest', {
        shallow: {
          initialValue: { count: 0 },
          strategy: 'shallow'
        },
        deep: {
          initialValue: { nested: { value: 0 } },
          strategy: 'deep'
        },
        reference: {
          initialValue: { data: [] as number[] },
          strategy: 'reference'
        }
      });

      const { result } = renderHook(() => {
        const shallowStore = MixedStorePattern.useStore('shallow');
        const deepStore = MixedStorePattern.useStore('deep');
        const referenceStore = MixedStorePattern.useStore('reference');
        
        return { shallowStore, deepStore, referenceStore };
      }, {
        wrapper: ({ children }) => (
          <MixedStorePattern.Provider>
            {children}
          </MixedStorePattern.Provider>
        )
      });

      const { shallowStore, deepStore, referenceStore } = result.current;
      mockConsole.debug.mockClear();

      const start = performance.now();

      // Perform rapid updates across different strategy stores
      await act(async () => {
        for (let i = 0; i < 200; i++) {
          // Shallow updates
          shallowStore.setValue({ count: i });
          
          // Deep updates (more cloning involved)
          deepStore.setValue({ nested: { value: i } });
          
          // Reference updates (no cloning)
          referenceStore.setValue({ data: Array(i % 10).fill(i) });
        }
      });

      const end = performance.now();

      // Mixed strategies should still perform well
      expect(end - start).toBeLessThan(300);

      // Deep clone logs should be limited despite deep strategy usage
      const deepCloneLogs = mockConsole.debug.mock.calls.filter(
        call => call[0]?.includes?.('Deep clone successful')
      );
      expect(deepCloneLogs.length).toBeLessThan(10);

      // Verify final states
      expect(shallowStore.getValue().count).toBe(199);
      expect(deepStore.getValue().nested.value).toBe(199);
      expect(referenceStore.getValue().data.length).toBe(9); // 199 % 10 = 9
    });
  });

  describe('Memory and resource management', () => {
    it('should not cause memory leaks during prolonged high-frequency updates', async () => {
      const { result } = renderHook(() => {
        const positionStore = TestStorePattern.useStore('position');
        return { positionStore };
      }, {
        wrapper: ({ children }) => (
          <TestStorePattern.Provider>
            {children}
          </TestStorePattern.Provider>
        )
      });

      const { positionStore } = result.current;

      // Simulate prolonged usage
      await act(async () => {
        for (let batch = 0; batch < 10; batch++) {
          // Each batch simulates 1 second of 60fps updates
          for (let i = 0; i < 60; i++) {
            positionStore.setValue({ 
              x: Math.random() * 1000, 
              y: Math.random() * 1000 
            });
          }
          
          // Small delay between batches
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      });

      // Should not accumulate excessive deep clone logs (the main concern for infinite loops)
      const deepCloneLogs = mockConsole.debug.mock.calls.filter(
        call => call[0]?.includes?.('Deep clone successful')
      );
      
      expect(deepCloneLogs.length).toBeLessThan(10); // Should be very low despite 600 updates
      
      // Error logs should be zero
      expect(mockConsole.error.mock.calls.length).toBe(0);
    });

    it('should handle edge cases without crashing or infinite loops', async () => {
      const { result } = renderHook(() => {
        const positionStore = TestStorePattern.useStore('position');
        const movementStore = TestStorePattern.useStore('movement');
        
        return { positionStore, movementStore };
      }, {
        wrapper: ({ children }) => (
          <TestStorePattern.Provider>
            {children}
          </TestStorePattern.Provider>
        )
      });

      const { positionStore, movementStore } = result.current;

      // Test edge case scenarios
      const edgeCases = [
        { x: 0, y: 0 },
        { x: -1, y: -1 },
        { x: Infinity, y: Infinity },
        { x: -Infinity, y: -Infinity },
        { x: NaN, y: NaN },
        { x: 999999, y: 999999 }
      ];

      await act(async () => {
        edgeCases.forEach(pos => {
          positionStore.setValue(pos);
          
          const currentMovement = movementStore.getValue();
          movementStore.setValue({
            ...currentMovement,
            path: [...currentMovement.path.slice(-19), pos]
          });
        });
      });

      // Should not have caused any errors
      expect(mockConsole.error).not.toHaveBeenCalled();

      // Final state should be the last edge case
      const finalPos = positionStore.getValue();
      expect(finalPos.x).toBe(999999);
      expect(finalPos.y).toBe(999999);
    });
  });

  describe('Action integration performance', () => {
    it('should handle action dispatch + store updates efficiently', async () => {
      const TestComponent = () => {
        const dispatch = TestActionContext.useActionDispatch();
        const positionStore = TestStorePattern.useStore('position');
        const clicksStore = TestStorePattern.useStore('clicks');
        
        // Register action handlers
        TestActionContext.useActionHandler('mouseMove', async (payload) => {
          positionStore.setValue({ x: payload.x, y: payload.y });
        });
        
        TestActionContext.useActionHandler('mouseClick', async (payload) => {
          const currentClicks = clicksStore.getValue();
          clicksStore.setValue({
            count: currentClicks.count + 1,
            history: [
              { x: payload.x, y: payload.y, timestamp: payload.timestamp },
              ...currentClicks.history.slice(0, 9)
            ]
          });
        });

        React.useEffect(() => {
          // Simulate rapid action dispatching
          const interval = setInterval(() => {
            const x = Math.random() * 800;
            const y = Math.random() * 600;
            const timestamp = Date.now();
            
            dispatch('mouseMove', { x, y, timestamp });
            
            if (Math.random() < 0.1) { // 10% chance of click
              dispatch('mouseClick', { x, y, timestamp });
            }
          }, 16); // ~60fps

          return () => clearInterval(interval);
        }, [dispatch]);

        return <div>Action Test</div>;
      };

      const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <TestStorePattern.Provider>
          <TestActionContext.Provider>
            {children}
          </TestActionContext.Provider>
        </TestStorePattern.Provider>
      );

      const start = performance.now();
      
      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      // Let actions run for 200ms
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      const end = performance.now();

      // Action dispatch + store updates should be efficient
      expect(end - start).toBeLessThan(400);

      // Should maintain low logging frequency
      const deepCloneLogs = mockConsole.debug.mock.calls.filter(
        call => call[0]?.includes?.('Deep clone successful')
      );
      expect(deepCloneLogs.length).toBeLessThan(10);
    });
  });
});