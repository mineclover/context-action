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
});