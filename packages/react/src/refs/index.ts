/**
 * @fileoverview Universal Reference Management System
 * 
 * Context-Action 프레임워크를 위한 범용 참조 관리 시스템
 * createRefContext를 통한 선언적 참조 관리 솔루션
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/ref/basic-usage
 */

// 핵심 타입들
export type {
  RefTarget,
  RefState,
  RefOperationResult,
  RefOperationOptions,
  RefOperation,
  RefInitConfig
} from './types';

// 주요 API - createRefContext 사용 권장
export { 
  createRefContext
} from './createRefContext';

export type { 
  RefContextReturn
} from './createRefContext';

// 내부 API - 고급 사용자 전용 (일반적으로 필요 없음)
export { 
  RefStore,
  createRefStore
} from './RefStore';


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