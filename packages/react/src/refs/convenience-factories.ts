/**
 * @fileoverview Convenience Factory Functions
 * 
 * 혼합 타입 참조 컨텍스트 생성을 위한 편의 함수
 */

import { createDeclarativeRefPattern } from './declarative-ref-pattern';
import type { RefDefinitions, DeclarativeRefContextReturn } from './declarative-ref-pattern';

/**
 * 혼합 타입 참조 컨텍스트 생성 (고급 사용)
 */
export function createMixedRefContext<R extends RefDefinitions>(
  contextName: string,
  refDefinitions: R
): DeclarativeRefContextReturn<R> {
  return createDeclarativeRefPattern(contextName, refDefinitions);
}