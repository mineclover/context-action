/**
 * @fileoverview Action Guard 환경 변수 설정
 * .env 파일의 환경 변수를 읽어서 ActionGuard 설정을 생성합니다.
 */

// ============================================
// 환경 변수 읽기 (Vite 방식)
// ============================================

const getEnvBoolean = (key: string, defaultValue: boolean = false): boolean => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
};

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

const getEnvString = (key: string, defaultValue: string): string => {
  const value = import.meta.env[key];
  return value !== undefined ? value : defaultValue;
};

// ============================================
// ActionGuard 환경 설정
// ============================================

export const ACTION_GUARD_CONFIG = {
  // 디버그 설정
  debug: getEnvBoolean('VITE_ACTION_GUARD_DEBUG', import.meta.env.DEV),
  
  // 기본 지연 시간들
  defaultDebounceDelay: getEnvNumber('VITE_ACTION_GUARD_DEFAULT_DEBOUNCE_DELAY', 1000),
  defaultThrottleInterval: getEnvNumber('VITE_ACTION_GUARD_DEFAULT_THROTTLE_INTERVAL', 500),
  
  // 로그 레벨
  logLevel: getEnvString('VITE_ACTION_GUARD_LOG_LEVEL', 'DEBUG') as 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'NONE',
  
  // 개발 환경 감지
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // 환경별 자동 설정
  autoDebug: import.meta.env.DEV,
} as const;

// ============================================
// Context-Action 라이브러리 설정
// ============================================

export const CONTEXT_ACTION_CONFIG = {
  trace: getEnvBoolean('VITE_CONTEXT_ACTION_TRACE', import.meta.env.DEV),
  debug: getEnvBoolean('VITE_CONTEXT_ACTION_DEBUG', import.meta.env.DEV),
  logLevel: getEnvString('VITE_CONTEXT_ACTION_LOG_LEVEL', 'TRACE'),
  loggerName: getEnvString('VITE_CONTEXT_ACTION_LOGGER_NAME', 'ExampleApp'),
} as const;

// ============================================
// 환경별 프리셋
// ============================================

export const ENV_PRESETS = {
  development: {
    debug: true,
    debounceDelay: 500, // 개발 시 빠른 테스트를 위해 짧게
    throttleInterval: 100,
    logLevel: 'DEBUG' as const,
  },
  
  production: {
    debug: false,
    debounceDelay: 1000,
    throttleInterval: 500,
    logLevel: 'ERROR' as const,
  },
  
  test: {
    debug: false,
    debounceDelay: 100, // 테스트에서는 매우 짧게
    throttleInterval: 50,
    logLevel: 'NONE' as const,
  }
} as const;

// 현재 환경에 맞는 프리셋 선택
export const CURRENT_ENV_PRESET = ACTION_GUARD_CONFIG.isDevelopment 
  ? ENV_PRESETS.development 
  : ACTION_GUARD_CONFIG.isProduction 
    ? ENV_PRESETS.production 
    : ENV_PRESETS.development;

// ============================================
// 설정 유틸리티 함수
// ============================================

/**
 * 환경 변수 기반으로 ActionGuard 옵션을 생성합니다.
 */
export function createActionGuardOptions(overrides: any = {}) {
  return {
    debug: ACTION_GUARD_CONFIG.debug,
    debounce: {
      delay: ACTION_GUARD_CONFIG.defaultDebounceDelay,
      debug: ACTION_GUARD_CONFIG.debug,
      ...overrides.debounce
    },
    throttle: {
      interval: ACTION_GUARD_CONFIG.defaultThrottleInterval,
      leading: true,
      trailing: false,
      debug: ACTION_GUARD_CONFIG.debug,
      ...overrides.throttle
    },
    block: {
      debug: ACTION_GUARD_CONFIG.debug,
      ...overrides.block
    },
    ...overrides
  };
}

/**
 * 환경 설정을 콘솔에 출력합니다 (개발 환경에서만).
 */
export function logEnvironmentConfig() {
  if (!ACTION_GUARD_CONFIG.isDevelopment) return;
  
  console.group('🛡️ ActionGuard Environment Configuration');
  console.log('Debug Mode:', ACTION_GUARD_CONFIG.debug);
  console.log('Default Debounce Delay:', ACTION_GUARD_CONFIG.defaultDebounceDelay + 'ms');
  console.log('Default Throttle Interval:', ACTION_GUARD_CONFIG.defaultThrottleInterval + 'ms');
  console.log('Log Level:', ACTION_GUARD_CONFIG.logLevel);
  console.log('Environment:', ACTION_GUARD_CONFIG.isDevelopment ? 'Development' : 'Production');
  console.groupEnd();
  
  console.group('📚 Context-Action Configuration');
  console.log('Trace:', CONTEXT_ACTION_CONFIG.trace);
  console.log('Debug:', CONTEXT_ACTION_CONFIG.debug);
  console.log('Log Level:', CONTEXT_ACTION_CONFIG.logLevel);
  console.log('Logger Name:', CONTEXT_ACTION_CONFIG.loggerName);
  console.groupEnd();
}

// 개발 환경에서 자동으로 설정 출력
if (ACTION_GUARD_CONFIG.isDevelopment && ACTION_GUARD_CONFIG.debug) {
  logEnvironmentConfig();
}