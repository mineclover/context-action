/**
 * @fileoverview Enhanced Type Inference Tests
 * 
 * createRefContext의 향상된 타입 추론 기능을 테스트합니다.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { createRefContext } from '../createRefContext';
import type { RefInitConfig } from '../types';

// 테스트용 DOM 타입들
interface TestElement extends HTMLElement {
  testProperty: string;
}

interface TestButton extends HTMLButtonElement {
  customData: { value: number };
}

describe('Enhanced Type Inference', () => {
  describe('Basic Record Type Inference', () => {
    it('should infer types correctly for simple Record<string, RefTarget>', () => {
      interface TestRefs {
        element1: TestElement;
        element2: TestButton;
      }

      const { useRefHandler } = createRefContext<TestRefs>('TypeInferenceTest');
      
      // TypeScript 컴파일 타임 테스트 - 실제 실행하지 않음
      const TestComponent: React.FC = () => {
        const element1Handler = useRefHandler('element1');
        const element2Handler = useRefHandler('element2');
        
        // 타입 추론이 정확한지 확인
        // element1Handler.target의 타입은 TestElement | null
        // element2Handler.target의 타입은 TestButton | null
        
        return (
          <div>
            <div 
              ref={(ref) => {
                if (ref) {
                  // ref는 HTMLDivElement이지만 TestElement로 캐스팅 필요
                  const testElement = ref as unknown as TestElement;
                  testElement.testProperty = 'test';
                  element1Handler.setRef(testElement);
                }
              }}
            />
            <button
              ref={(ref) => {
                if (ref) {
                  const testButton = ref as unknown as TestButton;
                  testButton.customData = { value: 42 };
                  element2Handler.setRef(testButton);
                }
              }}
            />
          </div>
        );
      };

      expect(TestComponent).toBeDefined();
    });
  });

  describe('RefDefinitions Type Inference', () => {
    it('should infer types correctly from RefDefinitions', () => {
      // RefDefinitions를 사용한 타입 정의
      const refDefinitions = {
        mainElement: {
          name: 'mainElement',
          validator: (target: any): target is TestElement => 
            target && typeof target.testProperty === 'string'
        } satisfies RefInitConfig<TestElement>,
        
        actionButton: {
          name: 'actionButton',
          validator: (target: any): target is TestButton => 
            target && typeof target.customData === 'object'
        } satisfies RefInitConfig<TestButton>
      };

      const { useRefHandler, useWaitForRefs } = createRefContext(
        'RefDefinitionsTest', 
        refDefinitions
      );
      
      // TypeScript 컴파일 타임 테스트
      const TestComponent: React.FC = () => {
        const mainHandler = useRefHandler('mainElement');
        const buttonHandler = useRefHandler('actionButton');
        const waitForRefs = useWaitForRefs();
        
        // 타입 추론 확인
        // mainHandler.target의 타입은 TestElement | null
        // buttonHandler.target의 타입은 TestButton | null
        
        // Pick<T, K> 타입 확인
        const waitForBoth = async () => {
          const refs = await waitForRefs('mainElement', 'actionButton');
          // refs의 타입은 Pick<InferRefTypes<typeof refDefinitions>, 'mainElement' | 'actionButton'>
          // 즉, { mainElement: TestElement; actionButton: TestButton }
          
          console.log('Refs ready:', {
            main: refs.mainElement?.testProperty,
            button: refs.actionButton?.customData.value
          });
        };
        
        return (
          <div>
            <div 
              ref={(ref) => {
                if (ref) {
                  const testElement = ref as unknown as TestElement;
                  testElement.testProperty = 'inferred';
                  mainHandler.setRef(testElement);
                }
              }}
            />
            <button
              ref={(ref) => {
                if (ref) {
                  const testButton = ref as unknown as TestButton;
                  testButton.customData = { value: 100 };
                  buttonHandler.setRef(testButton);
                }
              }}
              onClick={() => waitForBoth()}
            />
          </div>
        );
      };

      expect(TestComponent).toBeDefined();
    });
  });

  describe('withTarget Operation Type Safety', () => {
    it('should enforce correct operation parameter types', () => {
      interface CustomElement extends HTMLElement {
        customMethod: () => string;
      }

      interface CustomRefs {
        customEl: CustomElement;
      }

      const { useRefHandler } = createRefContext<CustomRefs>('OperationTest');
      
      const TestComponent: React.FC = () => {
        const handler = useRefHandler('customEl');
        
        // 타입 안전한 operation 함수들
        const validOperation = async (target: CustomElement & import('../types').RefTarget) => {
          // target은 CustomElement & RefTarget 타입
          return target.customMethod();
        };
        
        const executeOperation = async () => {
          const result = await handler.withTarget(validOperation);
          if (result.success) {
            console.log('Operation result:', result.result);
          }
        };
        
        return (
          <div>
            <div 
              ref={(ref) => {
                if (ref) {
                  const customEl = ref as unknown as CustomElement;
                  customEl.customMethod = () => 'custom result';
                  handler.setRef(customEl);
                }
              }}
            />
            <button onClick={executeOperation}>Execute</button>
          </div>
        );
      };

      expect(TestComponent).toBeDefined();
    });
  });

  describe('Promise Type Inference', () => {
    it('should maintain type safety in waitForMount', async () => {
      interface TypedElement extends HTMLElement {
        typedValue: number;
      }

      interface TypedRefs {
        typedEl: TypedElement;
      }

      const { Provider, useRefHandler } = createRefContext<TypedRefs>('PromiseTest');
      
      const TestComponent: React.FC = () => {
        const handler = useRefHandler('typedEl');
        
        const testWaitForMount = async () => {
          try {
            const element = await handler.waitForMount();
            // element의 타입은 TypedElement
            console.log('Element value:', element.typedValue);
          } catch (error) {
            console.error('Mount failed:', error);
          }
        };
        
        return (
          <div>
            <div 
              ref={(ref) => {
                if (ref) {
                  const typedEl = ref as unknown as TypedElement;
                  typedEl.typedValue = 42;
                  handler.setRef(typedEl);
                }
              }}
            />
            <button onClick={testWaitForMount}>Wait for Mount</button>
          </div>
        );
      };

      // Provider로 감싸서 렌더링 테스트
      const { container } = render(
        <Provider>
          <TestComponent />
        </Provider>
      );

      expect(container.querySelector('div')).toBeTruthy();
    });
  });
});