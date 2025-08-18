/**
 * @fileoverview Universal Reference Management System
 * 
 * Context-Action 프레임워크를 위한 범용 참조 관리 시스템
 * 어떤 타입의 객체든 선언적으로 관리할 수 있는 경량화된 솔루션
 * 
 * @example
 * ```typescript
 * import { createDeclarativeRefPattern } from '@context-action/react/refs';
 * 
 * // 범용 참조 시스템 - 모든 타입 지원
 * const { Provider, useRef } = createDeclarativeRefPattern('MyRefs', {
 *   // 어떤 객체든 관리 가능
 *   canvas: { name: 'canvas', objectType: 'dom' },
 *   gameEngine: { name: 'engine', objectType: 'custom' },
 *   threeScene: { name: 'scene', objectType: 'custom' }
 * });
 * ```
 */

// 핵심 타입들
export type {
  RefTarget,
  RefState,
  RefOperationResult,
  RefOperationOptions,
  RefOperation,
  RefInitConfig,
  RefActionPayloadMap
} from './types';

// 핵심 클래스들
export { 
  RefStore,
  createRefStore
} from './RefStore';

export { 
  OperationQueue,
  globalOperationQueue
} from './OperationQueue';

export type { QueueStats } from './OperationQueue';

// 선언적 패턴 (메인 API)
export { 
  createDeclarativeRefPattern,
  RefError,
  RefErrorCode
} from './declarative-ref-pattern';

export type { 
  RefDefinition,
  RefDefinitions,
  InferRefTypes,
  RefActionDefinitions,
  DeclarativeRefContextReturn,
  TypeValidator,
  ErrorRecoveryStrategy
} from './declarative-ref-pattern';

// 기본 헬퍼 (범용)
export { 
  customRef
} from './helpers';

/**
 * DOM과 Three.js 특화 헬퍼들은 examples에서 구현하세요:
 * 
 * - DOM 헬퍼: packages/react/examples/refs/dom-helpers.ts
 * - Three.js 헬퍼: packages/react/examples/refs/three-helpers.ts
 * 
 * 이들은 실제 프로덕션에서 참고할 수 있는 구현 예시입니다.
 */