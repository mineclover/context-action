/**
 * @fileoverview DOM Reference Context Factory
 * 
 * DOM 요소 전용 참조 컨텍스트 생성 팩토리 함수
 */

import { createDeclarativeRefPattern } from './declarative-ref-pattern';
import { domRef } from './helpers';
import type { DeclarativeRefContextReturn } from './declarative-ref-pattern';

/**
 * DOM 전용 참조 컨텍스트 생성 (편의 함수)
 * 
 * @param contextName 컨텍스트 이름
 * @param refNames DOM 참조 이름 배열
 * @returns DOM 전용 참조 컨텍스트
 * 
 * @example
 * ```typescript
 * import { createDOMRefContext } from '@context-action/react/refs/dom-ref-context';
 * 
 * interface FormElements {
 *   nameInput: HTMLInputElement;
 *   submitButton: HTMLButtonElement;
 *   statusDiv: HTMLDivElement;
 * }
 * 
 * const FormRefs = createDOMRefContext<FormElements>('ContactForm', [
 *   'nameInput', 'submitButton', 'statusDiv'
 * ]);
 * 
 * function ContactForm() {
 *   const nameInput = FormRefs.useRef('nameInput');
 *   
 *   return (
 *     <FormRefs.Provider>
 *       <input ref={nameInput.ref} type="text" />
 *     </FormRefs.Provider>
 *   );
 * }
 * ```
 */
export function createDOMRefContext<T extends Record<string, Element>>(
  contextName: string,
  refNames: (keyof T)[]
): DeclarativeRefContextReturn<{
  [K in keyof T]: ReturnType<typeof domRef>
}> {
  const refDefinitions = {} as any;
  
  refNames.forEach(refName => {
    refDefinitions[refName] = domRef<T[keyof T]>({
      name: String(refName)
    });
  });
  
  return createDeclarativeRefPattern(contextName, refDefinitions);
}