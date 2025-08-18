/**
 * @fileoverview DOM Helper Functions for Examples
 * 
 * DOM 요소 참조 관리를 위한 헬퍼 함수들
 * 실제 프로덕션에서 참고할 수 있는 구현 예시
 */

import { createDeclarativeRefPattern } from '../../src/refs/declarative-ref-pattern';
import type { RefInitConfig, TypeValidator } from '../../src/refs/declarative-ref-pattern';

/**
 * DOM 참조 정의 헬퍼 함수
 * 
 * @example
 * ```typescript
 * import { domRef } from './dom-helpers';
 * 
 * const refs = createDeclarativeRefPattern('MyForm', {
 *   input: domRef<HTMLInputElement>({ tagName: 'input' }),
 *   button: domRef<HTMLButtonElement>({ tagName: 'button' })
 * });
 * ```
 */
export function domRef<T extends Element>(
  config?: Partial<Omit<RefInitConfig<T>, 'objectType'>> & {
    tagName?: string;
    validator?: TypeValidator<T>;
  }
): RefInitConfig<T> {
  const baseConfig = {
    name: config?.name || 'dom-ref',
    objectType: 'dom' as const,
    autoCleanup: true,
    ...config
  };

  // 자동 타입 검증기 추가
  if (config?.tagName && !config?.validator) {
    (baseConfig as any).validator = (target: unknown): target is T => {
      return target instanceof Element && 
        target.tagName.toLowerCase() === config.tagName!.toLowerCase();
    };
  } else if (config?.validator) {
    (baseConfig as any).validator = config.validator.validate;
  }

  return baseConfig as RefInitConfig<T>;
}

/**
 * DOM 전용 참조 컨텍스트 생성 함수
 * 
 * @example
 * ```typescript
 * import { createDOMRefContext } from './dom-helpers';
 * 
 * interface FormElements {
 *   nameInput: HTMLInputElement;
 *   submitButton: HTMLButtonElement;
 * }
 * 
 * const FormRefs = createDOMRefContext<FormElements>('ContactForm', [
 *   'nameInput', 'submitButton'
 * ]);
 * ```
 */
export function createDOMRefContext<T extends Record<string, Element>>(
  contextName: string,
  refNames: (keyof T)[]
) {
  const refDefinitions = {} as any;
  
  refNames.forEach(refName => {
    refDefinitions[refName] = domRef<T[keyof T]>({
      name: String(refName)
    });
  });
  
  return createDeclarativeRefPattern(contextName, refDefinitions);
}

/**
 * 일반적인 DOM 요소 검증기들
 */
export const DOMValidators = {
  HTMLElement: {
    validate: (target: unknown): target is HTMLElement => target instanceof HTMLElement,
    expectedType: 'HTMLElement'
  },
  HTMLCanvasElement: {
    validate: (target: unknown): target is HTMLCanvasElement => 
      target instanceof HTMLCanvasElement,
    expectedType: 'HTMLCanvasElement'
  },
  HTMLInputElement: {
    validate: (target: unknown): target is HTMLInputElement => 
      target instanceof HTMLInputElement,
    expectedType: 'HTMLInputElement'
  },
  HTMLDivElement: {
    validate: (target: unknown): target is HTMLDivElement => 
      target instanceof HTMLDivElement,
    expectedType: 'HTMLDivElement'
  },
  HTMLButtonElement: {
    validate: (target: unknown): target is HTMLButtonElement => 
      target instanceof HTMLButtonElement,
    expectedType: 'HTMLButtonElement'
  }
} as const;