/**
 * @fileoverview Timeout Options Tests
 * 
 * createRefContext의 타임아웃 비활성화 및 설정 기능을 테스트합니다.
 */

import React from 'react';
import { render, act, renderHook } from '@testing-library/react';
import { createRefContext } from '../../src/refs/createRefContext';
import type { RefInitConfig } from '../../src/refs/types';

describe('Timeout Options', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });
  describe('disableTimeout Option', () => {
    it('should disable timeout when disableTimeout is true', async () => {
      type TestRefs = {
        element: HTMLElement;
      };

      const { Provider, useRefHandler } = createRefContext<TestRefs>('TimeoutTest', {
        disableTimeout: true
      });
      
      const TestComponent: React.FC = () => {
        const handler = useRefHandler('element');
        
        React.useEffect(() => {
          // 타임아웃 없이 waitForMount 호출 - 무한 대기해야 함
          const testTimeout = async () => {
            try {
              // 100ms 후에 ref 설정
              setTimeout(() => {
                const element = document.createElement('div');
                element.textContent = 'test';
                handler.setRef(element);
              }, 100);
              
              // waitForMount 호출과 동시에 타이머 진행
              const waitPromise = handler.waitForMount();
              
              // 100ms 후에 element가 설정되도록 타이머 진행
              jest.advanceTimersByTime(100);
              
              const element = await waitPromise;
              expect(element.textContent).toBe('test');
            } catch (error) {
              // 타임아웃이 비활성화되어야 하므로 에러가 발생하면 안 됨
              throw new Error(`Unexpected timeout error: ${error}`);
            }
          };
          
          testTimeout();
        }, [handler]);
        
        return <div>Test Component</div>;
      };

      await act(async () => {
        render(
          <Provider>
            <TestComponent />
          </Provider>
        );
      });
      
      // 100ms 진행 - ref 설정 트리거
      await act(async () => {
        jest.advanceTimersByTime(100);
        await Promise.resolve();
      });
      
      // 성공 전파 대기
      await act(async () => {
        await Promise.resolve();
      });
    });
  });

  describe('defaultMountTimeout Option', () => {
    it('should use defaultMountTimeout when specified', async () => {
      interface TestRefs extends Record<string, RefInitConfig<any>> {
        element: RefInitConfig<HTMLElement>;
      }

      const { Provider, useRefHandler } = createRefContext('DefaultTimeoutTest', {
        element: { name: 'element' }
      }, {
        defaultMountTimeout: 50 // 50ms 타임아웃
      });
      
      let timeoutError: Error | null = null;
      
      const TestComponent: React.FC = () => {
        const handler = useRefHandler('element');
        
        React.useEffect(() => {
          const testTimeout = async () => {
            try {
              await handler.waitForMount();
              // 타임아웃이 발생해야 하므로 여기에 도달하면 안 됨
              throw new Error('Should have timed out');
            } catch (error) {
              expect(error).toBeInstanceOf(Error);
              expect((error as Error).message).toContain('Mount timeout after 50ms');
              timeoutError = error as Error;
            }
          };
          
          testTimeout();
        }, [handler]);
        
        return <div>Test Component</div>;
      };

      await act(async () => {
        render(
          <Provider>
            <TestComponent />
          </Provider>
        );
      });
      
      // 타임아웃 트리거
      await act(async () => {
        jest.advanceTimersByTime(50);
        await Promise.resolve();
      });
      
      // 에러 전파 대기
      await act(async () => {
        await Promise.resolve();
      });
      
      expect(timeoutError).toBeInstanceOf(Error);
    });
  });

  describe('RefDefinitions with mountTimeout', () => {
    it('should respect individual ref timeout settings', async () => {
      const refDefinitions = {
        quickElement: {
          name: 'quickElement',
          mountTimeout: 30 // 30ms 타임아웃
        } satisfies RefInitConfig<HTMLElement>,
        
        slowElement: {
          name: 'slowElement',
          mountTimeout: 100 // 100ms 타임아웃
        } satisfies RefInitConfig<HTMLElement>
      };

      const { Provider, useRefHandler } = createRefContext(
        'IndividualTimeoutTest',
        refDefinitions,
        { defaultMountTimeout: 200 } // 기본 타임아웃은 더 길게
      );
      
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider>{children}</Provider>
      );
      const { result } = renderHook(
        () => ({
          quick: useRefHandler('quickElement'),
          slow: useRefHandler('slowElement'),
        }),
        { wrapper }
      );
      let quickMount: Promise<unknown>;
      let slowMount: Promise<unknown>;

      await act(async () => {
        quickMount = result.current.quick.waitForMount();
        slowMount = result.current.slow.waitForMount();
        jest.advanceTimersByTime(30);
        await Promise.resolve();
      });

      await expect(quickMount!).rejects.toThrow('Mount timeout after 30ms');
      const slowElement = document.createElement('div');
      slowElement.textContent = 'slow success';
      await act(async () => {
        jest.advanceTimersByTime(20); // total: 50ms
        result.current.slow.setRef(slowElement);
        await Promise.resolve();
      });

      await expect(slowMount!).resolves.toBe(slowElement);
    });
  });

  describe('Priority of timeout settings', () => {
    it('should prioritize disableTimeout over other settings', async () => {
      const refDefinitions = {
        element: {
          name: 'element',
          mountTimeout: 10 // 매우 짧은 타임아웃
        } satisfies RefInitConfig<HTMLElement>
      };

      const { Provider, useRefHandler } = createRefContext(
        'PriorityTest',
        refDefinitions,
        { 
          disableTimeout: true, // 타임아웃 비활성화가 우선
          defaultMountTimeout: 20
        }
      );
      
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider>{children}</Provider>
      );
      const { result } = renderHook(() => useRefHandler('element'), { wrapper });
      let mount: Promise<unknown>;
      const element = document.createElement('div');
      element.textContent = 'disable priority test';

      await act(async () => {
        mount = result.current.waitForMount();
        jest.advanceTimersByTime(50);
        result.current.setRef(element);
        await Promise.resolve();
      });

      await expect(mount!).resolves.toBe(element);
    });
  });
});
