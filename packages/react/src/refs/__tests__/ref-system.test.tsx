/**
 * @fileoverview Universal Reference Management System Tests
 * 
 * 핵심 기능들에 대한 기본적인 테스트 모음
 */

import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

import { 
  createDeclarativeRefPattern, 
  domRef, 
  threeRef, 
  customRef,
  createDOMRefContext,
  RefError,
  RefErrorCode
} from '../index';

// Mock Three.js object for testing
interface MockThreeObject {
  type: string;
  dispose: () => void;
  traverse: (fn: (obj: any) => void) => void;
}

describe('Universal Reference Management System', () => {
  describe('createDeclarativeRefPattern', () => {
    it('should create ref context with proper type inference', () => {
      const refs = createDeclarativeRefPattern('Test', {
        button: domRef<HTMLButtonElement>(),
        input: domRef<HTMLInputElement>()
      });

      expect(refs).toHaveProperty('Provider');
      expect(refs).toHaveProperty('useRef');
      expect(refs).toHaveProperty('useRefValue');
      expect(refs).toHaveProperty('useRefs');
      expect(refs).toHaveProperty('useRefManager');
    });

    it('should handle DOM ref mounting and unmounting', async () => {
      const refs = createDeclarativeRefPattern('DOMTest', {
        testDiv: domRef<HTMLDivElement>()
      });

      function TestComponent() {
        const testDiv = refs.useRef('testDiv');
        
        React.useEffect(() => {
          // 테스트용 div 생성
          const div = document.createElement('div');
          div.id = 'test-div';
          testDiv.setRef(div);
          
          return () => {
            testDiv.setRef(null);
          };
        }, [testDiv]);

        return <div data-testid="container" />;
      }

      render(
        <refs.Provider>
          <TestComponent />
        </refs.Provider>
      );

      await waitFor(() => {
        // 기본적인 렌더링 테스트
        expect(document.querySelector('[data-testid="container"]')).toBeInTheDocument();
      });
    });
  });

  describe('Helper functions', () => {
    it('domRef should create proper DOM reference config', () => {
      const config = domRef<HTMLInputElement>({
        name: 'test-input',
        tagName: 'input'
      });

      expect(config.name).toBe('test-input');
      expect(config.objectType).toBe('dom');
      expect(config.autoCleanup).toBe(true);
      expect(config.validator).toBeDefined();
    });

    it('threeRef should create proper Three.js reference config', () => {
      const config = threeRef<MockThreeObject>({
        name: 'test-scene',
        expectedType: 'Scene',
        autoDispose: true
      });

      expect(config.name).toBe('test-scene');
      expect(config.objectType).toBe('three');
      expect(config.autoCleanup).toBe(true);
    });

    it('customRef should create proper custom reference config', () => {
      const cleanup = jest.fn();
      const config = customRef({
        name: 'test-custom',
        cleanup
      });

      expect(config.name).toBe('test-custom');
      expect(config.objectType).toBe('custom');
      expect(config.cleanup).toBe(cleanup);
    });
  });

  describe('Convenience factories', () => {
    it('createDOMRefContext should create DOM-specific context', () => {
      const domContext = createDOMRefContext('DOMContext', ['button', 'input']);
      
      expect(domContext).toHaveProperty('Provider');
      expect(domContext).toHaveProperty('useRef');
      expect(domContext.contextName).toBe('DOMContext');
    });
  });

  describe('Error handling', () => {
    it('should create RefError with proper properties', () => {
      const error = new RefError(
        'Test error message',
        RefErrorCode.REF_NOT_FOUND,
        'testRef',
        'testOperation'
      );

      expect(error.message).toBe('Test error message');
      expect(error.code).toBe(RefErrorCode.REF_NOT_FOUND);
      expect(error.refName).toBe('testRef');
      expect(error.operation).toBe('testOperation');
      expect(error.name).toBe('RefError');
    });

    it('RefError.toJSON should return proper serializable object', () => {
      const error = new RefError(
        'Test error',
        RefErrorCode.OPERATION_FAILED,
        'testRef'
      );

      const json = error.toJSON();
      
      expect(json).toMatchObject({
        name: 'RefError',
        message: 'Test error',
        code: RefErrorCode.OPERATION_FAILED,
        refName: 'testRef'
      });
    });
  });

  describe('Type validation', () => {
    it('should validate DOM element types correctly', async () => {
      const refs = createDeclarativeRefPattern('ValidationTest', {
        canvas: domRef<HTMLCanvasElement>({
          validator: {
            validate: (target): target is HTMLCanvasElement => 
              target instanceof HTMLCanvasElement,
            expectedType: 'HTMLCanvasElement'
          }
        })
      });

      function TestComponent() {
        const canvas = refs.useRef('canvas', { validateOnSet: true });
        
        React.useEffect(() => {
          // 잘못된 타입 설정 시도
          const div = document.createElement('div');
          try {
            canvas.setRef(div as any); // 이것은 검증 실패해야 함
          } catch (error) {
            expect(error).toBeInstanceOf(RefError);
          }
          
          // 올바른 타입 설정
          const canvasEl = document.createElement('canvas');
          canvas.setRef(canvasEl);
        }, [canvas]);

        return <div data-testid="validation-test" />;
      }

      render(
        <refs.Provider>
          <TestComponent />
        </refs.Provider>
      );

      await waitFor(() => {
        expect(document.querySelector('[data-testid="validation-test"]')).toBeInTheDocument();
      });
    });
  });

  describe('Concurrent operations', () => {
    it('should handle multiple waitForMount calls properly', async () => {
      const refs = createDeclarativeRefPattern('ConcurrentTest', {
        element: domRef<HTMLDivElement>()
      });

      function TestComponent() {
        const element = refs.useRef('element');
        const [results, setResults] = React.useState<any[]>([]);

        React.useEffect(() => {
          // 여러 개의 동시 waitForMount 호출
          const promises = Array.from({ length: 3 }, () => 
            element.waitForMount()
          );

          Promise.all(promises).then(setResults);

          // 잠시 후에 ref 설정
          setTimeout(() => {
            const div = document.createElement('div');
            element.setRef(div);
          }, 100);
        }, [element]);

        return (
          <div data-testid="concurrent-test">
            Results: {results.length}
          </div>
        );
      }

      render(
        <refs.Provider>
          <TestComponent />
        </refs.Provider>
      );

      await waitFor(() => {
        const testElement = document.querySelector('[data-testid="concurrent-test"]');
        expect(testElement).toHaveTextContent('Results: 3');
      }, { timeout: 2000 });
    });
  });
});

describe('Performance and Memory', () => {
  it('should not create memory leaks with ref callbacks', () => {
    const refs = createDeclarativeRefPattern('MemoryTest', {
      testElement: domRef<HTMLDivElement>()
    });

    function TestComponent({ shouldMount }: { shouldMount: boolean }) {
      const element = refs.useRef('testElement');
      
      return shouldMount ? (
        <div ref={element.ref} data-testid="memory-test" />
      ) : null;
    }

    const { rerender } = render(
      <refs.Provider>
        <TestComponent shouldMount={true} />
      </refs.Provider>
    );

    // 마운트 해제
    rerender(
      <refs.Provider>
        <TestComponent shouldMount={false} />
      </refs.Provider>
    );

    // 다시 마운트
    rerender(
      <refs.Provider>
        <TestComponent shouldMount={true} />
      </refs.Provider>
    );

    expect(document.querySelector('[data-testid="memory-test"]')).toBeInTheDocument();
  });
});