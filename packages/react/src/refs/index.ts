/**
 * @fileoverview Universal Reference Management System
 * 
 * DOM 요소, Three.js 객체 등을 위한 범용적인 참조 관리 시스템
 * Context-Action 프레임워크와 완전 통합
 * 
 * @example
 * ```typescript
 * import { createDeclarativeRefPattern } from '@context-action/react/refs';
 * 
 * // 권장: 선언적 패턴으로 모든 타입의 참조를 범용적으로 관리
 * const { Provider, useRef } = createDeclarativeRefPattern('MyRefs', {
 *   // DOM 요소
 *   canvas: { 
 *     name: 'canvas', 
 *     objectType: 'dom',
 *     validator: (target): target is HTMLCanvasElement => target instanceof HTMLCanvasElement
 *   },
 *   
 *   // Three.js 객체 (custom으로 처리)
 *   scene: {
 *     name: 'scene',
 *     objectType: 'custom',
 *     validator: (target): target is THREE.Scene => target?.type === 'Scene',
 *     cleanup: async (scene) => scene.dispose?.()
 *   },
 *   
 *   // 기타 커스텀 객체
 *   gameEngine: {
 *     name: 'engine',
 *     objectType: 'custom',
 *     validator: (target): target is GameEngine => 'start' in target && 'stop' in target
 *   }
 * });
 * ```
 */

// 핵심 타입들
export type {
  RefTarget,
  DOMRefTarget,
  ThreeRefTarget,
  RefState,
  RefOperationResult,
  RefOperationOptions,
  RefOperation,
  RefInitConfig,
  RefDefinitions,
  InferRefTypes,
  RefActionPayloadMap,
  RefActionContext,
  RefEvent,
  RefEventListener,
  DOMRefConfig,
  ThreeRefConfig,
  CustomRefConfig,
  AnyRefConfig
} from './types';

// 핵심 클래스들
export { 
  RefStore,
  createRefStore
} from './RefStore';

export { 
  OperationQueue,
  globalOperationQueue,
  RefQueueManager 
} from './OperationQueue';

export type { QueueStats } from './OperationQueue';

// 메인 팩토리 함수들
export { 
  createRefContext
} from './createRefContext';

export type { RefContextReturn } from './createRefContext';

// 선언적 패턴 (권장)
export { 
  createDeclarativeRefPattern,
  RefError,
  RefErrorCode,
  DOMValidators
} from './declarative-ref-pattern';

// 헬퍼 함수들
export { 
  domRef,
  threeRef,
  customRef
} from './helpers';

// 편의 팩토리 함수들 (문서 호환성)
export {
  createDOMRefContext
} from './dom-ref-context';

export {
  createThreeRefContext
} from './three-ref-context';

export {
  createMixedRefContext
} from './convenience-factories';

export type { 
  RefDefinition,
  RefDefinitions as DeclarativeRefDefinitions,
  InferRefTypes as InferDeclarativeRefTypes,
  RefActionDefinitions,
  DeclarativeRefContextReturn,
  TypeValidator,
  RefErrorCode,
  RefError,
  ErrorRecoveryStrategy,
  DOMValidators
} from './declarative-ref-pattern';

// Note: 예제들은 packages/react/examples/refs/ 디렉토리에서 확인하세요
// - declarative-pattern-examples.tsx: createDeclarativeRefPattern 사용 예제 (권장)
//   * MixedRefExample: DOM + Three.js 혼합 사용법
//   * DOMOnlyExample: 순수 DOM 요소 관리
//   * CustomObjectExample: 커스텀 객체 관리
// - GameUIExample.tsx: DOM + Three.js 통합 게임 UI 예제
// - SimpleFormExample.tsx: 기본 폼 요소 관리 예제