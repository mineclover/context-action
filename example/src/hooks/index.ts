/**
 * @fileoverview Action Guard Hooks - 액션 중복 실행 방지 및 제어 훅들
 * 
 * 이 모듈은 React Context-Action 라이브러리와 함께 사용할 수 있는
 * 액션 실행 제어 훅들을 제공합니다.
 * 
 * 주요 기능:
 * - 디바운싱: 연속된 호출을 지연시켜 마지막 호출만 실행
 * - 스로틀링: 지정된 간격으로만 실행을 허용
 * - 블로킹: 특정 조건에서 실행을 완전히 차단
 * - 통합 가드: 위 기능들을 조합하여 사용
 */

// 환경 설정
import { 
  ACTION_GUARD_CONFIG, 
  CONTEXT_ACTION_CONFIG,
  createActionGuardOptions,
  logEnvironmentConfig 
} from '../config/actionGuard';

// Re-export for external use
export { 
  ACTION_GUARD_CONFIG, 
  CONTEXT_ACTION_CONFIG,
  createActionGuardOptions,
  logEnvironmentConfig 
};

// 개별 훅들
export { 
  useActionDebouncer, 
  useActionDebounceExecutor,
  type DebounceOptions 
} from './useActionDebouncer';

export { 
  useActionThrottle, 
  useActionThrottleExecutor,
  type ThrottleOptions 
} from './useActionThrottle';

export { 
  useActionBlock, 
  useActionBlockExecutor,
  type BlockOptions 
} from './useActionBlock';

// 통합 훅
export { 
  useActionGuard, 
  useActionGuardExecutor,
  type ActionGuardOptions,
  type GuardMode 
} from './useActionGuard';

// 편의 함수 및 상수 (지연 로딩을 위한 함수형으로 변경)
function createGuardPresets() {
  return {
    /** 빠른 디바운싱 (환경 변수 기반) */
    QUICK_DEBOUNCE: { 
      mode: 'debounce' as const, 
      debounce: { 
        delay: Math.floor((ACTION_GUARD_CONFIG.defaultDebounceDelay || 1000) * 0.5),
        debug: ACTION_GUARD_CONFIG.debug 
      } 
    },
    
    /** 표준 디바운싱 (환경 변수 기반) */
    STANDARD_DEBOUNCE: { 
      mode: 'debounce' as const, 
      debounce: { 
        delay: ACTION_GUARD_CONFIG.defaultDebounceDelay || 1000,
        debug: ACTION_GUARD_CONFIG.debug 
      } 
    },
    
    /** 느린 디바운싱 (2000ms) */
    SLOW_DEBOUNCE: { mode: 'debounce' as const, debounce: { delay: 2000 } },
  
  /** 빠른 스로틀링 (100ms) */
  FAST_THROTTLE: { mode: 'throttle' as const, throttle: { interval: 100, leading: true, trailing: false } },
  
  /** 표준 스로틀링 (500ms) */
  STANDARD_THROTTLE: { mode: 'throttle' as const, throttle: { interval: 500, leading: true, trailing: false } },
  
  /** 스크롤 최적화 스로틀링 */
  SCROLL_THROTTLE: { mode: 'throttle' as const, throttle: { interval: 16, leading: true, trailing: true } }, // ~60fps
  
  /** 폼 제출 보호 */
  FORM_PROTECTION: { 
    mode: 'debounce+block' as const, 
    debounce: { delay: 1000 },
    block: { onBlocked: (action: string) => console.warn(`${action} blocked: form is being processed`) }
  },
  
  /** API 호출 보호 */
  API_PROTECTION: {
    mode: 'throttle+block' as const,
    throttle: { interval: 1000, leading: true, trailing: false },
    block: { onBlocked: (action: string) => console.warn(`${action} blocked: API call in progress`) }
  }
  };
}

// 지연 로딩된 GUARD_PRESETS export
export const GUARD_PRESETS = createGuardPresets();

/**
 * 자주 사용되는 액션 설정 패턴들 (함수로 변경하여 지연 로딩)
 */
function createActionPatterns() {
  const presets = createGuardPresets();
  
  return {
    /** 장바구니 관련 액션들 */
    shopping: {
      actionConfig: {
        'addToCart': presets.STANDARD_DEBOUNCE,
        'removeFromCart': presets.QUICK_DEBOUNCE,
        'updateQuantity': presets.FAST_THROTTLE,
        'applyCoupon': presets.FORM_PROTECTION,
        'checkout': presets.FORM_PROTECTION
      }
    },
  
    /** 폼 관련 액션들 */
    forms: {
      actionConfig: {
        'submitForm': presets.FORM_PROTECTION,
        'saveAsDraft': presets.STANDARD_THROTTLE,
        'validateField': presets.FAST_THROTTLE,
        'uploadFile': presets.FORM_PROTECTION
      }
    },
    
    /** UI 인터랙션 관련 액션들 */
    ui: {
      actionConfig: {
        'updateScrollPosition': presets.SCROLL_THROTTLE,
        'updateMousePosition': presets.FAST_THROTTLE,
        'toggleModal': presets.QUICK_DEBOUNCE,
        'resize': presets.FAST_THROTTLE
      }
    },
    
    /** API 관련 액션들 */
    api: {
      actionConfig: {
        'fetchData': presets.API_PROTECTION,
        'createRecord': presets.FORM_PROTECTION,
        'updateRecord': presets.API_PROTECTION,
        'deleteRecord': presets.FORM_PROTECTION,
        'search': presets.STANDARD_THROTTLE
      }
    }
  };
}

// 지연 로딩된 ACTION_PATTERNS export
export const ACTION_PATTERNS = createActionPatterns();

/**
 * 여러 패턴을 조합하는 헬퍼 함수
 */
export function combineGuardPatterns(...patterns: Array<{ actionConfig: Record<string, any> }>) {
  const combined = { actionConfig: {} };
  
  patterns.forEach(pattern => {
    Object.assign(combined.actionConfig, pattern.actionConfig);
  });
  
  return combined;
}

/**
 * 개발 환경에서 가드 상태를 모니터링하는 헬퍼
 */
export function createGuardMonitor(guardInstance: any) {
  // Safe check for development environment in both Node.js and browser
  const isDev = (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') || 
                import.meta.env?.DEV || 
                import.meta.env?.VITE_NODE_ENV === 'development';
                
  if (!isDev) {
    return { start: () => {}, stop: () => {} };
  }

  let intervalId: NodeJS.Timeout | null = null;

  return {
    start: (intervalMs = 5000) => {
      if (intervalId) return;
      
      console.log('🛡️ ActionGuard Monitor started');
      intervalId = setInterval(() => {
        // 여기서 가드 상태를 로깅할 수 있습니다
        console.group('🛡️ ActionGuard Status');
        console.log('Monitor is running. Use guard.getGuardState(actionName) to inspect specific actions.');
        console.groupEnd();
      }, intervalMs);
    },
    
    stop: () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log('🛡️ ActionGuard Monitor stopped');
      }
    }
  };
}