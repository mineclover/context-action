/**
 * @fileoverview createRefContext Tests
 * 
 * createRefContext의 핵심 기능들에 대한 테스트
 */

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { createRefContext } from '../createRefContext';

describe('createRefContext', () => {
  describe('Simple type usage (Legacy)', () => {
    it('should create ref context with simple types', () => {
      const GameRefs = createRefContext<{
        canvas: HTMLCanvasElement;
        button: HTMLButtonElement;
      }>('GameRefs');

      expect(GameRefs).toHaveProperty('Provider');
      expect(GameRefs).toHaveProperty('useRefHandler');
      expect(GameRefs).toHaveProperty('useWaitForRefs');
      expect(GameRefs).toHaveProperty('useGetAllRefs');
      expect(GameRefs.contextName).toBe('GameRefs');
    });

    it('should handle ref mounting and unmounting', async () => {
      const {
        Provider: TestRefsProvider,
        useRefHandler: useTestRef
      } = createRefContext<{
        testDiv: HTMLDivElement;
      }>('TestRefs');

      function TestComponent() {
        const testDiv = useTestRef('testDiv');
        const [mounted, setMounted] = React.useState(false);
        
        React.useEffect(() => {
          const div = document.createElement('div');
          div.id = 'test-div';
          testDiv.setRef(div);
          
          // Wait for isMounted to be true, then update local state
          const checkMount = () => {
            if (testDiv.isMounted) {
              setMounted(true);
            } else {
              requestAnimationFrame(checkMount);
            }
          };
          checkMount();
          
          return () => {
            testDiv.setRef(null);
            setMounted(false);
          };
        }, [testDiv]);

        return <div data-testid="container">Mounted: {mounted.toString()}</div>;
      }

      render(
        <TestRefsProvider>
          <TestComponent />
        </TestRefsProvider>
      );

      // Wait longer for the async state update
      await new Promise(resolve => setTimeout(resolve, 50));
      const container = document.querySelector('[data-testid="container"]');
      expect(container).toBeInTheDocument();
      expect(container).toHaveTextContent('Mounted: true');
    });
  });

  describe('Declarative usage (RefDefinitions)', () => {
    it('should create ref context with RefDefinitions', () => {
      const GameRefs = createRefContext('GameRefs', {
        canvas: {
          name: 'canvas',
          autoCleanup: true
        },
        scene: {
          name: 'scene',
          autoCleanup: true,
          cleanup: (scene: any) => {
            if (scene.dispose) scene.dispose();
          }
        }
      });

      expect(GameRefs).toHaveProperty('Provider');
      expect(GameRefs).toHaveProperty('useRefHandler');
      expect(GameRefs).toHaveProperty('useWaitForRefs');
      expect(GameRefs).toHaveProperty('useGetAllRefs');
      expect(GameRefs.contextName).toBe('GameRefs');
      expect(GameRefs.refDefinitions).toBeDefined();
    });

    it('should use definitions for ref creation', async () => {
      const {
        Provider: TestRefsProvider,
        useRefHandler: useTestRef
      } = createRefContext('TestRefs', {
        testElement: {
          name: 'testElement',
          autoCleanup: true,
          mountTimeout: 5000
        }
      });

      function TestComponent() {
        const testElement = useTestRef('testElement');
        const [ready, setReady] = React.useState(false);
        
        React.useEffect(() => {
          const div = document.createElement('div');
          div.className = 'test-element';
          testElement.setRef(div);
          
          // Wait for mount state to update
          const checkReady = () => {
            if (testElement.isMounted) {
              setReady(true);
            } else {
              requestAnimationFrame(checkReady);
            }
          };
          checkReady();
        }, [testElement]);

        return (
          <div data-testid="declarative-test">
            Element ready: {ready.toString()}
          </div>
        );
      }

      render(
        <TestRefsProvider>
          <TestComponent />
        </TestRefsProvider>
      );

      // Wait longer for the async state update
      await new Promise(resolve => setTimeout(resolve, 50));
      const testElement = document.querySelector('[data-testid="declarative-test"]');
      expect(testElement).toHaveTextContent('Element ready: true');
    });
  });

  describe('Ref operations', () => {
    it('should handle waitForMount properly', async () => {
      const {
        Provider: TestRefsProvider,
        useRefHandler: useTestRef
      } = createRefContext<{
        asyncElement: HTMLDivElement;
      }>('TestRefs');

      function TestComponent() {
        const asyncElement = useTestRef('asyncElement');
        const [result, setResult] = React.useState<string>('waiting');
        
        React.useEffect(() => {
          // Mount 작업을 비동기로 수행
          const mountAsync = async () => {
            // Add slight delay to ensure async behavior
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const div = document.createElement('div');
            div.id = 'async-element';
            asyncElement.setRef(div);
            
            try {
              // waitForMount 사용
              const mountedElement = await asyncElement.waitForMount();
              setResult(mountedElement.id || 'async-element');
            } catch {
              setResult('error');
            }
          };
          
          mountAsync();
        }, [asyncElement]);

        return <div data-testid="async-test">Mount result: {result}</div>;
      }

      render(
        <TestRefsProvider>
          <TestComponent />
        </TestRefsProvider>
      );

      // Wait longer for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      const testElement = document.querySelector('[data-testid="async-test"]');
      expect(testElement).toHaveTextContent('Mount result: async-element');
    });

    it('should handle multiple waitForRefs properly', async () => {
      const {
        Provider: TestRefsProvider,
        useRefHandler: useTestRef,
        useWaitForRefs
      } = createRefContext<{
        element1: HTMLDivElement;
        element2: HTMLButtonElement;
      }>('TestRefs');

      function TestComponent() {
        const element1 = useTestRef('element1');
        const element2 = useTestRef('element2');
        const waitForRefs = useWaitForRefs();
        const [allReady, setAllReady] = React.useState(false);
        
        React.useEffect(() => {
          // 모든 ref가 준비될 때까지 대기
          waitForRefs('element1', 'element2').then((refs) => {
            console.log('All refs ready:', refs);
            setAllReady(true);
          });
          
          // 각각 다른 시간에 설정
          setTimeout(() => {
            const div = document.createElement('div');
            element1.setRef(div);
          }, 50);
          
          setTimeout(() => {
            const button = document.createElement('button');
            element2.setRef(button);
          }, 100);
        }, [element1, element2, waitForRefs]);

        return (
          <div data-testid="multi-wait-test">
            All ready: {allReady.toString()}
          </div>
        );
      }

      render(
        <TestRefsProvider>
          <TestComponent />
        </TestRefsProvider>
      );

      await new Promise(resolve => setTimeout(resolve, 200));
      const testElement = document.querySelector('[data-testid="multi-wait-test"]');
      expect(testElement).toHaveTextContent('All ready: true');
    });

    it('should handle withTarget operations', async () => {
      const {
        Provider: TestRefsProvider,
        useRefHandler: useTestRef
      } = createRefContext<{
        targetElement: HTMLDivElement;
      }>('TestRefs');

      function TestComponent() {
        const targetElement = useTestRef('targetElement');
        const [operationResult, setOperationResult] = React.useState<string>('');
        
        React.useEffect(() => {
          const performOperation = async () => {
            const div = document.createElement('div');
            div.textContent = 'test content';
            div.setAttribute('data-value', 'test value');
            targetElement.setRef(div);
            
            // Wait a bit for the ref to be properly set
            await new Promise(resolve => setTimeout(resolve, 20));
            
            try {
              const result = await targetElement.withTarget(async (target) => {
                // Just test that we can access the target and it's truthy
                return target ? 'Success' : 'Failed';
              });
              
              if (result.success) {
                setOperationResult(result.result || '');
              } else {
                setOperationResult(`Error: ${result.error?.message}`);
              }
            } catch {
              setOperationResult('Error: Operation failed');
            }
          };
          
          performOperation();
        }, [targetElement]);

        return (
          <div data-testid="with-target-test">
            Operation result: {operationResult}
          </div>
        );
      }

      render(
        <TestRefsProvider>
          <TestComponent />
        </TestRefsProvider>
      );

      // Wait longer for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      const testElement = document.querySelector('[data-testid="with-target-test"]');
      expect(testElement).toHaveTextContent('Operation result: Success');
    });
  });

  describe('Error handling', () => {
    it('should throw error when used outside Provider', () => {
      const {
        useRefHandler: useTestRef
      } = createRefContext<{
        element: HTMLDivElement;
      }>('TestRefs');

      function TestComponent() {
        useTestRef('element'); // This should throw
        return <div>Test</div>;
      }

      // jsdom에서 unhandled exception으로 처리되므로 console.error spy로 확인
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        render(<TestComponent />);
        // If we get here, the error was caught differently than expected
        expect(consoleSpy).toHaveBeenCalled();
      } catch (error) {
        // Direct error throw - this is also acceptable
        expect((error as Error).message).toContain('useRefHandler must be used within TestRefs.Provider');
      }
      
      consoleSpy.mockRestore();
    });

    it('should handle setRef errors gracefully', async () => {
      const {
        Provider: TestRefsProvider,
        useRefHandler: useTestRef
      } = createRefContext<{
        element: HTMLDivElement;
      }>('TestRefs');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      function TestComponent() {
        const element = useTestRef('element');
        
        React.useEffect(() => {
          try {
            // 실제로는 이런 식으로 에러가 발생할 수 있음
            element.setRef(null);
          } catch {
            // 에러가 잡히면 OK
          }
        }, [element]);

        return <div data-testid="error-test">Error handling test</div>;
      }

      render(
        <TestRefsProvider>
          <TestComponent />
        </TestRefsProvider>
      );

      await new Promise(resolve => setTimeout(resolve, 10));
      expect(document.querySelector('[data-testid="error-test"]')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Context state management', () => {
    it('should handle getAllRefs correctly', async () => {
      const {
        Provider: TestRefsProvider,
        useRefHandler: useTestRef,
        useGetAllRefs
      } = createRefContext<{
        element1: HTMLDivElement;
        element2: HTMLButtonElement;
      }>('TestRefs');

      function TestComponent() {
        const element1 = useTestRef('element1');
        const element2 = useTestRef('element2');
        const getAllRefs = useGetAllRefs();
        const [refCount, setRefCount] = React.useState(0);
        
        React.useEffect(() => {
          const performRefSetup = async () => {
            const div = document.createElement('div');
            const button = document.createElement('button');
            
            element1.setRef(div);
            element2.setRef(button);
            
            // Wait for both refs to be mounted
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // getAllRefs 호출
            const allRefs = getAllRefs();
            const mounted = Object.values(allRefs).filter(ref => ref !== null && ref !== undefined);
            setRefCount(mounted.length);
          };
          
          performRefSetup();
        }, [element1, element2, getAllRefs]);

        return (
          <div data-testid="get-all-test">
            Ref count: {refCount}
          </div>
        );
      }

      render(
        <TestRefsProvider>
          <TestComponent />
        </TestRefsProvider>
      );

      // Wait longer for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 150));
      const testElement = document.querySelector('[data-testid="get-all-test"]');
      expect(testElement).toHaveTextContent('Ref count: 2');
    });
  });

  describe('useWaitForRefs performance optimization', () => {
    it('should resolve immediately when target already exists', async () => {
      const {
        Provider: TestRefsProvider,
        useRefHandler: useTestRef,
        useWaitForRefs
      } = createRefContext<{
        existingElement: HTMLDivElement;
        nonExistingElement: HTMLDivElement;
      }>('TestRefs');

      function TestComponent() {
        const existingElement = useTestRef('existingElement');
        const nonExistingElement = useTestRef('nonExistingElement');
        const waitForRefs = useWaitForRefs();
        const [timingResults, setTimingResults] = React.useState<{
          existingTime: number;
          nonExistingTime: number;
          isComplete: boolean;
        }>({
          existingTime: 0,
          nonExistingTime: 0,
          isComplete: false
        });

        React.useEffect(() => {
          const runTest = async () => {
            // 먼저 하나의 요소를 즉시 마운트
            const div = document.createElement('div');
            div.id = 'existing-element';
            existingElement.setRef(div);

            // 이미 존재하는 요소에 대한 waitForRefs 성능 측정
            const existingStart = performance.now();
            await waitForRefs('existingElement');
            const existingEnd = performance.now();
            const existingTime = existingEnd - existingStart;

            // 존재하지 않는 요소는 나중에 마운트 (50ms 후)
            const nonExistingStart = performance.now();
            setTimeout(() => {
              const div2 = document.createElement('div');
              div2.id = 'non-existing-element';
              nonExistingElement.setRef(div2);
            }, 50);

            await waitForRefs('nonExistingElement');
            const nonExistingEnd = performance.now();
            const nonExistingTime = nonExistingEnd - nonExistingStart;

            setTimingResults({
              existingTime,
              nonExistingTime,
              isComplete: true
            });
          };

          runTest().catch(console.error);
        }, [existingElement, nonExistingElement, waitForRefs]);

        return (
          <div data-testid="timing-test">
            <div>Existing element time: {timingResults.existingTime.toFixed(2)}ms</div>
            <div>Non-existing element time: {timingResults.nonExistingTime.toFixed(2)}ms</div>
            <div>Test complete: {timingResults.isComplete ? 'true' : 'false'}</div>
          </div>
        );
      }

      render(
        <TestRefsProvider>
          <TestComponent />
        </TestRefsProvider>
      );

      // 테스트 완료까지 대기
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const testElement = document.querySelector('[data-testid="timing-test"]');
      expect(testElement).toHaveTextContent('Test complete: true');

      // 이미 존재하는 요소는 즉시 반환되어야 함 (< 5ms)
      const existingTimeText = testElement?.querySelector('div:first-child')?.textContent;
      const existingTime = parseFloat(existingTimeText?.match(/(\d+\.\d+)ms/)?.[1] || '0');
      
      // 존재하지 않는 요소는 대기 시간이 있어야 함 (> 45ms)
      const nonExistingTimeText = testElement?.querySelector('div:nth-child(2)')?.textContent;
      const nonExistingTime = parseFloat(nonExistingTimeText?.match(/(\d+\.\d+)ms/)?.[1] || '0');

      // 가설 검증: 이미 존재하는 target은 즉시 반환 (매우 빠름)
      expect(existingTime).toBeLessThan(5); // 5ms 미만
      
      // 존재하지 않는 target은 실제 대기 시간이 있음
      expect(nonExistingTime).toBeGreaterThan(45); // 45ms 이상
      
      console.log(`Performance test results:
        - Existing element: ${existingTime.toFixed(2)}ms (should be < 5ms)
        - Non-existing element: ${nonExistingTime.toFixed(2)}ms (should be > 45ms)`);
    });

    it('should handle mixed scenario - some exist, some do not', async () => {
      const {
        Provider: TestRefsProvider,
        useRefHandler: useTestRef,
        useWaitForRefs
      } = createRefContext<{
        ready1: HTMLDivElement;
        ready2: HTMLDivElement;
        pending1: HTMLDivElement;
        pending2: HTMLDivElement;
      }>('TestRefs');

      function TestComponent() {
        const ready1 = useTestRef('ready1');
        const ready2 = useTestRef('ready2');
        const pending1 = useTestRef('pending1');
        const pending2 = useTestRef('pending2');
        const waitForRefs = useWaitForRefs();
        const [testResult, setTestResult] = React.useState<{
          mixedWaitTime: number;
          isComplete: boolean;
        }>({
          mixedWaitTime: 0,
          isComplete: false
        });

        React.useEffect(() => {
          const runMixedTest = async () => {
            // 일부 요소는 즉시 마운트
            ready1.setRef(document.createElement('div'));
            ready2.setRef(document.createElement('div'));

            // 혼합 시나리오 테스트
            const mixedStart = performance.now();
            
            // pending 요소들을 30ms 후에 마운트
            setTimeout(() => {
              pending1.setRef(document.createElement('div'));
              pending2.setRef(document.createElement('div'));
            }, 30);

            // 모든 요소 대기 (일부는 즉시, 일부는 대기)
            await waitForRefs('ready1', 'ready2', 'pending1', 'pending2');
            
            const mixedEnd = performance.now();
            const mixedWaitTime = mixedEnd - mixedStart;

            setTestResult({
              mixedWaitTime,
              isComplete: true
            });
          };

          runMixedTest().catch(console.error);
        }, [ready1, ready2, pending1, pending2, waitForRefs]);

        return (
          <div data-testid="mixed-timing-test">
            <div>Mixed wait time: {testResult.mixedWaitTime.toFixed(2)}ms</div>
            <div>Test complete: {testResult.isComplete ? 'true' : 'false'}</div>
          </div>
        );
      }

      render(
        <TestRefsProvider>
          <TestComponent />
        </TestRefsProvider>
      );

      await new Promise(resolve => setTimeout(resolve, 100));
      
      const testElement = document.querySelector('[data-testid="mixed-timing-test"]');
      expect(testElement).toHaveTextContent('Test complete: true');

      const mixedTimeText = testElement?.querySelector('div:first-child')?.textContent;
      const mixedTime = parseFloat(mixedTimeText?.match(/(\d+\.\d+)ms/)?.[1] || '0');

      // 혼합 시나리오에서는 pending 요소들 때문에 대기 시간이 있어야 함
      expect(mixedTime).toBeGreaterThan(25); // 25ms 이상
      expect(mixedTime).toBeLessThan(50); // 하지만 50ms 미만이어야 함
      
      console.log(`Mixed scenario test result: ${mixedTime.toFixed(2)}ms`);
    });
  });
});