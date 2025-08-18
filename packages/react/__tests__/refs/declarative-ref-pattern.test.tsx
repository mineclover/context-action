/**
 * @fileoverview Tests for Declarative Reference Pattern
 * 
 * createDeclarativeRefPattern의 포괄적인 테스트
 * - 기본 기능 테스트
 * - 타입 안전성 테스트
 * - 에러 처리 테스트
 * - 비동기 처리 테스트
 * - 액션 통합 테스트
 * - 메모리 누수 테스트
 */

import React, { useCallback, useEffect, useState } from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createDeclarativeRefPattern } from '../../src/refs/declarative-ref-pattern';
import type { RefInitConfig } from '../../src/refs/types';

// 테스트용 목 타입들
interface MockCustomObject {
  type: 'MockObject';
  value: number;
  dispose(): Promise<void>;
}

interface MockActions {
  initialize: void;
  update: { value: number };
  cleanup: void;
  handleError: { error: Error; context: string };
}

describe('createDeclarativeRefPattern', () => {
  afterEach(() => {
    cleanup();
  });

  describe('Basic Functionality', () => {
    test('should create refs with proper typing', () => {
      const { Provider, useRef } = createDeclarativeRefPattern('TestRefs', {
        button: {
          name: 'button',
          objectType: 'dom',
          validator: (target: unknown): target is HTMLButtonElement => 
            target instanceof HTMLButtonElement
        } as RefInitConfig<HTMLButtonElement>,
        
        input: {
          name: 'input', 
          objectType: 'dom',
          validator: (target: unknown): target is HTMLInputElement =>
            target instanceof HTMLInputElement
        } as RefInitConfig<HTMLInputElement>
      });

      function TestComponent() {
        const buttonRef = useRef('button');
        const inputRef = useRef('input');

        return (
          <div>
            <button ref={buttonRef} data-testid="test-button">
              Test Button
            </button>
            <input ref={inputRef} data-testid="test-input" />
          </div>
        );
      }

      render(
        <Provider>
          <TestComponent />
        </Provider>
      );

      expect(screen.getByTestId('test-button')).toBeInTheDocument();
      expect(screen.getByTestId('test-input')).toBeInTheDocument();
    });

    test('should handle custom objects properly', async () => {
      const { Provider, useRef } = createDeclarativeRefPattern('CustomRefs', {
        customObject: {
          name: 'customObject',
          objectType: 'custom',
          validator: (target: unknown): target is MockCustomObject =>
            typeof target === 'object' && 
            target !== null &&
            (target as MockCustomObject).type === 'MockObject',
          cleanup: async (obj: MockCustomObject) => {
            await obj.dispose();
          }
        } as RefInitConfig<MockCustomObject>
      });

      const mockObject: MockCustomObject = {
        type: 'MockObject',
        value: 42,
        dispose: jest.fn().mockResolvedValue(undefined)
      };

      function TestComponent() {
        const customRef = useRef('customObject');

        useEffect(() => {
          customRef.setRef(mockObject);
          return () => {
            customRef.setRef(null);
          };
        }, [customRef]);

        return (
          <div data-testid="custom-value">
            {customRef.target?.value ?? 'No value'}
          </div>
        );
      }

      render(
        <Provider>
          <TestComponent />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('custom-value')).toHaveTextContent('42');
      });
    });
  });

  describe('Action Integration', () => {
    test('should handle actions with proper typing', async () => {
      const { Provider, useRef, useAction, useActionHandler } = createDeclarativeRefPattern(
        'ActionRefs', 
        {
          refs: {
            button: {
              name: 'button',
              objectType: 'dom',
              validator: (target: unknown): target is HTMLButtonElement => 
                target instanceof HTMLButtonElement
            } as RefInitConfig<HTMLButtonElement>
          },
          actions: {
            initialize: void 0,
            update: { value: 42 },
            cleanup: void 0
          } as MockActions
        }
      );

      const mockHandler = jest.fn();

      function TestComponent() {
        const buttonRef = useRef('button');
        const dispatch = useAction();

        useActionHandler('initialize', useCallback(async () => {
          mockHandler('initialize');
        }, []));

        useActionHandler('update', useCallback(async (payload) => {
          mockHandler('update', payload);
        }, []));

        const handleClick = () => {
          dispatch('initialize');
          dispatch('update', { value: 100 });
        };

        return (
          <button ref={buttonRef} onClick={handleClick} data-testid="action-button">
            Click Me
          </button>
        );
      }

      render(
        <Provider>
          <TestComponent />
        </Provider>
      );

      fireEvent.click(screen.getByTestId('action-button'));

      await waitFor(() => {
        expect(mockHandler).toHaveBeenCalledWith('initialize');
        expect(mockHandler).toHaveBeenCalledWith('update', { value: 100 });
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle validation errors gracefully', () => {
      const { Provider, useRef } = createDeclarativeRefPattern('ErrorRefs', {
        strictButton: {
          name: 'strictButton',
          objectType: 'dom',
          validator: (target: unknown): target is HTMLButtonElement => {
            if (!(target instanceof HTMLButtonElement)) {
              throw new Error('Invalid button element');
            }
            return true;
          }
        } as RefInitConfig<HTMLButtonElement>
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      function TestComponent() {
        const buttonRef = useRef('strictButton');

        // 의도적으로 잘못된 요소 할당 시도
        useEffect(() => {
          try {
            // @ts-expect-error - 테스트를 위한 의도적 타입 오류
            buttonRef.setRef(document.createElement('div'));
          } catch (error) {
            console.error('Validation failed:', error);
          }
        }, [buttonRef]);

        return (
          <button ref={buttonRef} data-testid="strict-button">
            Strict Button
          </button>
        );
      }

      render(
        <Provider>
          <TestComponent />
        </Provider>
      );

      expect(screen.getByTestId('strict-button')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    test('should handle action errors properly', async () => {
      const { Provider, useAction, useActionHandler } = createDeclarativeRefPattern(
        'ErrorActionRefs',
        {
          refs: {},
          actions: {
            failingAction: void 0,
            handleError: { error: Error, context: 'string' }
          }
        }
      );

      const errorHandler = jest.fn();

      function TestComponent() {
        const dispatch = useAction();

        useActionHandler('failingAction', useCallback(async () => {
          throw new Error('Action failed');
        }, []));

        useActionHandler('handleError', useCallback(async (payload) => {
          errorHandler(payload);
        }, []));

        const handleClick = async () => {
          try {
            await dispatch?.('failingAction');
          } catch (error) {
            await dispatch?.('handleError', { 
              error: new Error('Action failed'), 
              context: 'test' 
            });
          }
        };

        return (
          <button onClick={handleClick} data-testid="failing-button">
            Fail Action
          </button>
        );
      }

      render(
        <Provider>
          <TestComponent />
        </Provider>
      );

      fireEvent.click(screen.getByTestId('failing-button'));

      await waitFor(() => {
        expect(errorHandler).toHaveBeenCalledWith({
          error: expect.any(Error),
          context: 'test'
        });
      });
    });
  });

  describe('Async Operations', () => {
    test('should handle async ref initialization', async () => {
      const { Provider, useRef, useAction, useActionHandler } = createDeclarativeRefPattern(
        'AsyncRefs',
        {
          refs: {
            asyncObject: {
              name: 'asyncObject',
              objectType: 'custom',
              validator: (target: unknown): target is MockCustomObject =>
                typeof target === 'object' && 
                target !== null &&
                (target as MockCustomObject).type === 'MockObject',
              cleanup: async (obj: MockCustomObject) => {
                await obj.dispose();
            }
          } as RefInitConfig<MockCustomObject>
          },
          actions: {
            initializeAsync: void 0
          }
        }
      );

      const mockDispose = jest.fn().mockResolvedValue(undefined);

      function TestComponent() {
        const objectRef = useRef('asyncObject');
        const dispatch = useAction();
        const [isReady, setIsReady] = useState(false);

        useActionHandler('initializeAsync', useCallback(async () => {
          // 비동기 초기화 시뮬레이션
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const mockObj: MockCustomObject = {
            type: 'MockObject',
            value: 42,
            dispose: mockDispose
          };

          objectRef.setRef(mockObj);
          setIsReady(true);
        }, [objectRef]));

        useEffect(() => {
          dispatch?.('initializeAsync');
        }, [dispatch]);

        return (
          <div>
            <div data-testid="ready-status">
              {isReady ? 'Ready' : 'Loading'}
            </div>
            <div data-testid="object-value">
              {objectRef.target?.value ?? 'No value'}
            </div>
          </div>
        );
      }

      render(
        <Provider>
          <TestComponent />
        </Provider>
      );

      expect(screen.getByTestId('ready-status')).toHaveTextContent('Loading');

      await waitFor(() => {
        expect(screen.getByTestId('ready-status')).toHaveTextContent('Ready');
        expect(screen.getByTestId('object-value')).toHaveTextContent('42');
      });
    });
  });

  describe('Memory Management', () => {
    test('should cleanup refs properly on unmount', async () => {
      const mockDispose = jest.fn().mockResolvedValue(undefined);
      
      const mockCleanup = jest.fn().mockImplementation(async (obj: MockCustomObject) => {
        // Since Store's structuredClone loses function properties, 
        // and we can't use WeakMap due to object identity changes,
        // we'll use the object's data to identify it and call dispose
        if (obj.type === 'MockObject' && obj.value === 42) {
          await mockDispose();
        }
      });

      const { Provider, useRef } = createDeclarativeRefPattern('CleanupRefs', {
        disposableObject: {
          name: 'disposableObject',
          objectType: 'custom',
          autoCleanup: true,
          validator: (target: unknown): target is MockCustomObject =>
            typeof target === 'object' && 
            target !== null &&
            (target as MockCustomObject).type === 'MockObject',
          cleanup: mockCleanup
        } as RefInitConfig<MockCustomObject>
      });

      const mockObject: MockCustomObject = {
        type: 'MockObject',
        value: 42,
        dispose: mockDispose  // This will be lost by structuredClone, but cleanup handles it
      };

      function TestComponent() {
        const objectRef = useRef('disposableObject');

        useEffect(() => {
          objectRef.setRef(mockObject);
          return () => {
            objectRef.setRef(null);
          };
        }, [objectRef]);

        return <div data-testid="test-component">Test</div>;
      }

      function App() {
        const [showComponent, setShowComponent] = useState(true);

        return (
          <Provider>
            {showComponent && <TestComponent />}
            <button 
              onClick={() => setShowComponent(false)}
              data-testid="unmount-button"
            >
              Unmount
            </button>
          </Provider>
        );
      }

      render(<App />);

      expect(screen.getByTestId('test-component')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('unmount-button'));

      await waitFor(() => {
        expect(screen.queryByTestId('test-component')).not.toBeInTheDocument();
      });

      // Give some extra time for async cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // cleanup이 호출되었는지 확인
      expect(mockCleanup).toHaveBeenCalled();
      expect(mockDispose).toHaveBeenCalled();
    });

    test('should handle multiple refs cleanup', async () => {
      const mockDispose1 = jest.fn().mockResolvedValue(undefined);
      const mockDispose2 = jest.fn().mockResolvedValue(undefined);

      const { Provider, useRef } = createDeclarativeRefPattern('MultiCleanupRefs', {
        object1: {
          name: 'object1',
          objectType: 'custom',
          autoCleanup: true,
          cleanup: async (obj: MockCustomObject) => {
            // Identify object by its data since functions are lost in structuredClone
            if (obj.type === 'MockObject' && obj.value === 1) {
              await mockDispose1();
            }
          }
        } as RefInitConfig<MockCustomObject>,
        
        object2: {
          name: 'object2',
          objectType: 'custom',
          autoCleanup: true,
          cleanup: async (obj: MockCustomObject) => {
            // Identify object by its data since functions are lost in structuredClone
            if (obj.type === 'MockObject' && obj.value === 2) {
              await mockDispose2();
            }
          }
        } as RefInitConfig<MockCustomObject>
      });

      function TestComponent() {
        const object1Ref = useRef('object1');
        const object2Ref = useRef('object2');

        useEffect(() => {
          object1Ref.setRef({
            type: 'MockObject',
            value: 1,
            dispose: mockDispose1  // This will be lost by structuredClone, but cleanup handles it
          });

          object2Ref.setRef({
            type: 'MockObject',
            value: 2,
            dispose: mockDispose2  // This will be lost by structuredClone, but cleanup handles it
          });
          return () => {
            object1Ref.setRef(null);
            object2Ref.setRef(null);
          };
        }, [object1Ref, object2Ref]);

        return <div data-testid="multi-test">Multi Test</div>;
      }

      function App() {
        const [mounted, setMounted] = useState(true);

        return (
          <Provider>
            {mounted && <TestComponent />}
            <button 
              onClick={() => setMounted(false)}
              data-testid="cleanup-button"
            >
              Cleanup All
            </button>
          </Provider>
        );
      }

      render(<App />);

      fireEvent.click(screen.getByTestId('cleanup-button'));

      await waitFor(() => {
        expect(screen.queryByTestId('multi-test')).not.toBeInTheDocument();
      });

      // Give some extra time for async cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockDispose1).toHaveBeenCalled();
      expect(mockDispose2).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    test('should not cause unnecessary re-renders', () => {
      const { Provider, useRef } = createDeclarativeRefPattern('PerformanceRefs', {
        stableButton: {
          name: 'stableButton',
          objectType: 'dom'
        } as RefInitConfig<HTMLButtonElement>
      });

      const renderCount = jest.fn();

      function TestComponent({ counter }: { counter: number }) {
        renderCount();
        const buttonRef = useRef('stableButton');

        return (
          <div>
            <button ref={buttonRef} data-testid="stable-button">
              Button {counter}
            </button>
          </div>
        );
      }

      function App() {
        const [counter, setCounter] = useState(0);

        return (
          <Provider>
            <TestComponent counter={counter} />
            <button 
              onClick={() => setCounter(c => c + 1)}
              data-testid="increment-button"
            >
              Increment
            </button>
          </Provider>
        );
      }

      render(<App />);

      const initialRenderCount = renderCount.mock.calls.length;

      // 여러 번 클릭해도 참조는 안정적이어야 함
      fireEvent.click(screen.getByTestId('increment-button'));
      fireEvent.click(screen.getByTestId('increment-button'));

      // 정확히 3번 렌더링되어야 함 (초기 + 2번 상태 변경)
      expect(renderCount).toHaveBeenCalledTimes(initialRenderCount + 2);
    });
  });

  describe('Edge Cases', () => {
    test('should handle null refs gracefully', () => {
      const { Provider, useRef } = createDeclarativeRefPattern('NullRefs', {
        nullableButton: {
          name: 'nullableButton',
          objectType: 'dom'
        } as RefInitConfig<HTMLButtonElement>
      });

      function TestComponent() {
        const buttonRef = useRef('nullableButton');

        return (
          <div>
            <div data-testid="button-status">
              {buttonRef.target ? 'Has button' : 'No button'}
            </div>
          </div>
        );
      }

      render(
        <Provider>
          <TestComponent />
        </Provider>
      );

      expect(screen.getByTestId('button-status')).toHaveTextContent('No button');
    });

    test('should handle rapid ref changes', async () => {
      const { Provider, useRef } = createDeclarativeRefPattern('RapidRefs', {
        changingObject: {
          name: 'changingObject',
          objectType: 'custom'
        } as RefInitConfig<MockCustomObject>
      });

      function TestComponent() {
        const objectRef = useRef('changingObject');
        const [value, setValue] = useState(0);

        useEffect(() => {
          if (value > 0) {
            objectRef.setRef({
              type: 'MockObject',
              value,
              dispose: jest.fn().mockResolvedValue(undefined)
            });
          }
        }, [objectRef, value]);

        return (
          <div>
            <div data-testid="current-value">
              {objectRef.target?.value ?? 'none'}
            </div>
            <button 
              onClick={() => setValue(v => v + 1)}
              data-testid="change-button"
            >
              Change
            </button>
          </div>
        );
      }

      render(
        <Provider>
          <TestComponent />
        </Provider>
      );

      // 빠른 연속 변경
      fireEvent.click(screen.getByTestId('change-button'));
      fireEvent.click(screen.getByTestId('change-button'));
      fireEvent.click(screen.getByTestId('change-button'));

      await waitFor(() => {
        expect(screen.getByTestId('current-value')).toHaveTextContent('3');
      });
    });
  });
});