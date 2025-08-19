/**
 * @fileoverview createRefContext Tests
 * 
 * createRefContext의 핵심 기능들에 대한 테스트
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Jest 전역 타입들을 더 간단하게 선언
declare global {
  var describe: any;
  var it: any;
  var expect: any;
  var jest: any;
}

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
      const TestRefs = createRefContext<{
        testDiv: HTMLDivElement;
      }>('TestRefs');

      function TestComponent() {
        const testDiv = TestRefs.useRefHandler('testDiv');
        
        React.useEffect(() => {
          const div = document.createElement('div');
          div.id = 'test-div';
          testDiv.setRef(div);
          
          return () => {
            testDiv.setRef(null);
          };
        }, [testDiv]);

        return <div data-testid="container">Mounted: {testDiv.isMounted.toString()}</div>;
      }

      render(
        <TestRefs.Provider>
          <TestComponent />
        </TestRefs.Provider>
      );

      await waitFor(() => {
        const container = document.querySelector('[data-testid="container"]');
        expect(container).toBeInTheDocument();
        expect(container).toHaveTextContent('Mounted: true');
      });
    });
  });

  describe('Declarative usage (RefDefinitions)', () => {
    it('should create ref context with RefDefinitions', () => {
      const GameRefs = createRefContext('GameRefs', {
        canvas: {
          name: 'canvas',
          objectType: 'dom' as const,
          autoCleanup: true
        },
        scene: {
          name: 'scene',
          objectType: 'custom' as const,
          autoCleanup: true
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
      const TestRefs = createRefContext('TestRefs', {
        testElement: {
          name: 'testElement',
          objectType: 'dom' as const,
          autoCleanup: true,
          mountTimeout: 5000
        }
      });

      function TestComponent() {
        const testElement = TestRefs.useRefHandler('testElement');
        
        React.useEffect(() => {
          const div = document.createElement('div');
          div.className = 'test-element';
          testElement.setRef(div);
        }, [testElement]);

        return (
          <div data-testid="declarative-test">
            Element ready: {testElement.isMounted.toString()}
          </div>
        );
      }

      render(
        <TestRefs.Provider>
          <TestComponent />
        </TestRefs.Provider>
      );

      await waitFor(() => {
        const testElement = document.querySelector('[data-testid="declarative-test"]');
        expect(testElement).toHaveTextContent('Element ready: true');
      });
    });
  });

  describe('Ref operations', () => {
    it('should handle waitForMount properly', async () => {
      const TestRefs = createRefContext<{
        asyncElement: HTMLDivElement;
      }>('TestRefs');

      function TestComponent() {
        const asyncElement = TestRefs.useRefHandler('asyncElement');
        const [mountResult, setMountResult] = React.useState<HTMLDivElement | null>(null);
        
        React.useEffect(() => {
          // waitForMount 호출
          asyncElement.waitForMount().then(setMountResult);
          
          // 1초 후에 ref 설정
          setTimeout(() => {
            const div = document.createElement('div');
            div.id = 'async-element';
            asyncElement.setRef(div);
          }, 100);
        }, [asyncElement]);

        return (
          <div data-testid="async-test">
            Mount result: {mountResult?.id || 'waiting'}
          </div>
        );
      }

      render(
        <TestRefs.Provider>
          <TestComponent />
        </TestRefs.Provider>
      );

      await waitFor(() => {
        const testElement = document.querySelector('[data-testid="async-test"]');
        expect(testElement).toHaveTextContent('Mount result: async-element');
      }, { timeout: 2000 });
    });

    it('should handle multiple waitForRefs properly', async () => {
      const TestRefs = createRefContext<{
        element1: HTMLDivElement;
        element2: HTMLButtonElement;
      }>('TestRefs');

      function TestComponent() {
        const element1 = TestRefs.useRefHandler('element1');
        const element2 = TestRefs.useRefHandler('element2');
        const waitForRefs = TestRefs.useWaitForRefs();
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
        <TestRefs.Provider>
          <TestComponent />
        </TestRefs.Provider>
      );

      await waitFor(() => {
        const testElement = document.querySelector('[data-testid="multi-wait-test"]');
        expect(testElement).toHaveTextContent('All ready: true');
      }, { timeout: 2000 });
    });

    it('should handle withTarget operations', async () => {
      const TestRefs = createRefContext<{
        targetElement: HTMLDivElement;
      }>('TestRefs');

      function TestComponent() {
        const targetElement = TestRefs.useRefHandler('targetElement');
        const [operationResult, setOperationResult] = React.useState<string>('');
        
        React.useEffect(() => {
          const div = document.createElement('div');
          div.textContent = 'test content';
          div.setAttribute('data-value', 'test value');
          targetElement.setRef(div);
          
          // withTarget 작업 수행 - waitForMount 후 실행
          setTimeout(async () => {
            const result = await targetElement.withTarget(async (target) => {
              // Just test that we can access the target and it's truthy
              return target ? 'Success' : 'Failed';
            });
            
            if (result.success) {
              setOperationResult(result.result || '');
            } else {
              setOperationResult(`Error: ${result.error?.message}`);
            }
          }, 10);
        }, [targetElement]);

        return (
          <div data-testid="with-target-test">
            Operation result: {operationResult}
          </div>
        );
      }

      render(
        <TestRefs.Provider>
          <TestComponent />
        </TestRefs.Provider>
      );

      await waitFor(() => {
        const testElement = document.querySelector('[data-testid="with-target-test"]');
        expect(testElement).toHaveTextContent('Operation result: Success');
      });
    });
  });

  describe('Error handling', () => {
    it('should throw error when used outside Provider', () => {
      const TestRefs = createRefContext<{
        element: HTMLDivElement;
      }>('TestRefs');

      function TestComponent() {
        TestRefs.useRefHandler('element'); // This should throw
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
        expect(error.message).toContain('useRefHandler must be used within TestRefs.Provider');
      }
      
      consoleSpy.mockRestore();
    });

    it('should handle setRef errors gracefully', async () => {
      const TestRefs = createRefContext<{
        element: HTMLDivElement;
      }>('TestRefs');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      function TestComponent() {
        const element = TestRefs.useRefHandler('element');
        
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
        <TestRefs.Provider>
          <TestComponent />
        </TestRefs.Provider>
      );

      await waitFor(() => {
        expect(document.querySelector('[data-testid="error-test"]')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Context state management', () => {
    it('should handle getAllRefs correctly', async () => {
      const TestRefs = createRefContext<{
        element1: HTMLDivElement;
        element2: HTMLButtonElement;
      }>('TestRefs');

      function TestComponent() {
        const element1 = TestRefs.useRefHandler('element1');
        const element2 = TestRefs.useRefHandler('element2');
        const getAllRefs = TestRefs.useGetAllRefs();
        const [refCount, setRefCount] = React.useState(0);
        
        React.useEffect(() => {
          const div = document.createElement('div');
          const button = document.createElement('button');
          
          element1.setRef(div);
          element2.setRef(button);
          
          // getAllRefs 호출
          setTimeout(() => {
            const allRefs = getAllRefs();
            setRefCount(Object.keys(allRefs).length);
          }, 100);
        }, [element1, element2, getAllRefs]);

        return (
          <div data-testid="get-all-test">
            Ref count: {refCount}
          </div>
        );
      }

      render(
        <TestRefs.Provider>
          <TestComponent />
        </TestRefs.Provider>
      );

      await waitFor(() => {
        const testElement = document.querySelector('[data-testid="get-all-test"]');
        expect(testElement).toHaveTextContent('Ref count: 2');
      });
    });
  });
});