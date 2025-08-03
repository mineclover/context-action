/**
 * @fileoverview Log Art Utilities - Colored ASCII art and visual separators for execution area identification
 * console-log-colors를 사용한 각 실행 영역별 색상 구분 로그 시스템
 */

import clc from 'console-log-colors';

/**
 * 실행 영역 타입
 */
export type ExecutionArea = 'core' | 'react' | 'store' | 'action' | 'guard' | 'logger';

/**
 * 각 영역별 고유 색상 정의
 */
export const AreaColors = {
  // Core 영역 - 파란색 계열
  core: {
    primary: clc.blue as (text: string) => string,
    secondary: clc.blueBright as (text: string) => string,
    accent: clc.cyan as (text: string) => string,
    text: clc.white as (text: string) => string
  },
  // React 영역 - 청록색 계열  
  react: {
    primary: clc.cyan as (text: string) => string,
    secondary: clc.cyanBright as (text: string) => string,
    accent: clc.blue as (text: string) => string,
    text: clc.white as (text: string) => string
  },
  // Store 영역 - Core와 동일한 색상 (파란색 계열)
  store: {
    primary: clc.blue as (text: string) => string,
    secondary: clc.blueBright as (text: string) => string,
    accent: clc.cyan as (text: string) => string,
    text: clc.white as (text: string) => string
  },
  // Action 영역 - 노란색 계열
  action: {
    primary: clc.yellow as (text: string) => string,
    secondary: clc.yellowBright as (text: string) => string,
    accent: clc.red as (text: string) => string,
    text: clc.black as (text: string) => string
  },
  // Guard 영역 - 마젠타 계열
  guard: {
    primary: clc.magenta as (text: string) => string,
    secondary: clc.magentaBright as (text: string) => string,
    accent: clc.red as (text: string) => string,
    text: clc.white as (text: string) => string
  },
  // Logger 영역 - 회색 계열
  logger: {
    primary: clc.gray as (text: string) => string,
    secondary: clc.white as (text: string) => string,
    accent: clc.yellow as (text: string) => string,
    text: clc.black as (text: string) => string
  }
} as const;

/**
 * 각 영역별 아이콘
 */
export const AreaIcons = {
  core: '🎯',
  react: '⚛️',
  store: '🏪',
  action: '⚡',
  guard: '🛡️',
  logger: '📊'
} as const;

/**
 * ASCII 아트 템플릿
 */
export const AsciiArt = {
  core: [
    '╔═══════════════════════════════════════╗',
    '║           🎯 CORE ENGINE              ║',
    '║        ActionRegister System         ║',
    '╚═══════════════════════════════════════╝'
  ],
  react: [
    '╔═══════════════════════════════════════╗',
    '║           ⚛️  REACT LAYER             ║',
    '║       Hooks & Context System         ║',
    '╚═══════════════════════════════════════╝'
  ],
  store: [
    '╔═══════════════════════════════════════╗',
    '║           🏪 STORE SYSTEM             ║',
    '║       State Management Layer         ║',
    '╚═══════════════════════════════════════╝'
  ],
  action: [
    '╔═══════════════════════════════════════╗',
    '║           ⚡ ACTION PIPELINE          ║',
    '║        Handler Execution Zone        ║',
    '╚═══════════════════════════════════════╝'
  ],
  guard: [
    '╔═══════════════════════════════════════╗',
    '║           🛡️  ACTION GUARD            ║',
    '║        Security & Validation         ║',
    '╚═══════════════════════════════════════╝'
  ],
  logger: [
    '╔═══════════════════════════════════════╗',
    '║           📊 LOGGER SYSTEM            ║',
    '║        Trace & Debug Layer           ║',
    '╚═══════════════════════════════════════╝'
  ]
} as const;

/**
 * 색상이 적용된 로그 아트 헤더를 생성
 */
export function createColoredHeader(area: ExecutionArea): string[] {
  const colors = AreaColors[area];
  const art = AsciiArt[area];
  
  return art.map(line => colors.primary(colors.secondary(line)));
}

/**
 * 간단한 구분선 생성
 */
export function createColoredSeparator(area: ExecutionArea, message?: string): string {
  const colors = AreaColors[area];
  const icon = AreaIcons[area];
  
  const separator = '═'.repeat(50);
  
  if (message) {
    const content = `${icon} ${message} `;
    const remainingLength = Math.max(0, 50 - content.length);
    const remainingSeparator = '═'.repeat(remainingLength);
    return colors.primary(`${content}${remainingSeparator}`);
  }
  
  return colors.primary(`${icon}${separator}`);
}

/**
 * 실행 시작 마커 생성
 */
export function createStartMarker(area: ExecutionArea, operation: string): string {
  const colors = AreaColors[area];
  const icon = AreaIcons[area];
  
  return colors.secondary(`▶️ [${colors.primary(area.toUpperCase())}] ${icon} ${operation} 시작`);
}

/**
 * 실행 완료 마커 생성
 */
export function createEndMarker(area: ExecutionArea, operation: string, duration?: number): string {
  const colors = AreaColors[area];
  const icon = AreaIcons[area];
  const durationText = duration ? ` (${duration}ms)` : '';
  
  return colors.accent(`✅ [${colors.primary(area.toUpperCase())}] ${icon} ${operation} 완료${durationText}`);
}

/**
 * 에러 마커 생성
 */
export function createErrorMarker(area: ExecutionArea, operation: string, error: string): string {
  const colors = AreaColors[area];
  const icon = AreaIcons[area];
  
  return clc.red(`❌ [${colors.primary(area.toUpperCase())}] ${icon} ${operation} 실패: ${error}`);
}

/**
 * 정보 마커 생성
 */
export function createInfoMarker(area: ExecutionArea, message: string): string {
  const colors = AreaColors[area];
  const icon = AreaIcons[area];
  
  return colors.accent(`ℹ️ [${colors.primary(area.toUpperCase())}] ${icon} ${message}`);
}

/**
 * 디버그 마커 생성
 */
export function createDebugMarker(area: ExecutionArea, message: string, data?: any): string {
  const colors = AreaColors[area];
  const icon = AreaIcons[area];
  
  const dataText = data ? ` - ${JSON.stringify(data, null, 0)}` : '';
  return colors.secondary(`🔍 [${colors.primary(area.toUpperCase())}] ${icon} ${message}${dataText}`);
}

/**
 * 경고 마커 생성
 */
export function createWarningMarker(area: ExecutionArea, message: string): string {
  const colors = AreaColors[area];
  const icon = AreaIcons[area];
  
  return clc.yellow(`⚠️ [${colors.primary(area.toUpperCase())}] ${icon} ${message}`);
}

/**
 * 영역별 색상이 적용된 로거 인터페이스
 */
export interface ColoredLogger {
  /** 영역 헤더 출력 */
  logHeader(area: ExecutionArea): void;
  /** 구분선 출력 */
  logSeparator(area: ExecutionArea, message?: string): void;
  /** 시작 마커 출력 */
  logStart(area: ExecutionArea, operation: string): void;
  /** 완료 마커 출력 */
  logEnd(area: ExecutionArea, operation: string, duration?: number): void;
  /** 에러 마커 출력 */
  logError(area: ExecutionArea, operation: string, error: string): void;
  /** 정보 마커 출력 */
  logInfo(area: ExecutionArea, message: string): void;
  /** 디버그 마커 출력 */
  logDebug(area: ExecutionArea, message: string, data?: any): void;
  /** 경고 마커 출력 */
  logWarning(area: ExecutionArea, message: string): void;
}

/**
 * 색상이 적용된 로거 생성
 */
export function createColoredLogger(
  logger: { 
    info: (msg: string) => void; 
    debug: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void; 
  }
): ColoredLogger {
  return {
    logHeader(area: ExecutionArea) {
      const header = createColoredHeader(area);
      header.forEach(line => logger.info(line));
    },
    
    logSeparator(area: ExecutionArea, message?: string) {
      const separator = createColoredSeparator(area, message);
      logger.info(separator);
    },
    
    logStart(area: ExecutionArea, operation: string) {
      const marker = createStartMarker(area, operation);
      logger.info(marker);
    },
    
    logEnd(area: ExecutionArea, operation: string, duration?: number) {
      const marker = createEndMarker(area, operation, duration);
      logger.info(marker);
    },
    
    logError(area: ExecutionArea, operation: string, error: string) {
      const marker = createErrorMarker(area, operation, error);
      logger.error(marker);
    },
    
    logInfo(area: ExecutionArea, message: string) {
      const marker = createInfoMarker(area, message);
      logger.info(marker);
    },
    
    logDebug(area: ExecutionArea, message: string, data?: any) {
      const marker = createDebugMarker(area, message, data);
      logger.debug(marker);
    },
    
    logWarning(area: ExecutionArea, message: string) {
      const marker = createWarningMarker(area, message);
      logger.warn(marker);
    }
  };
}

/**
 * 헬퍼 함수들 - 자주 사용되는 패턴들
 */
export const LogArtHelpers = {
  /**
   * Core 영역 로그 (파란색 계열)
   */
  core: {
    start: (operation: string) => createStartMarker('core', operation),
    end: (operation: string, duration?: number) => createEndMarker('core', operation, duration),
    info: (message: string) => createInfoMarker('core', message),
    debug: (message: string, data?: any) => createDebugMarker('core', message, data),
    error: (operation: string, error: string) => createErrorMarker('core', operation, error),
    separator: (message?: string) => createColoredSeparator('core', message)
  },
  
  /**
   * React 영역 로그 (청록색 계열)
   */
  react: {
    start: (operation: string) => createStartMarker('react', operation),
    end: (operation: string, duration?: number) => createEndMarker('react', operation, duration),
    info: (message: string) => createInfoMarker('react', message),
    debug: (message: string, data?: any) => createDebugMarker('react', message, data),
    error: (operation: string, error: string) => createErrorMarker('react', operation, error),
    separator: (message?: string) => createColoredSeparator('react', message)
  },
  
  /**
   * Store 영역 로그 (Core와 동일한 파란색 계열)
   */
  store: {
    start: (operation: string) => createStartMarker('store', operation),
    end: (operation: string, duration?: number) => createEndMarker('store', operation, duration),
    info: (message: string) => createInfoMarker('store', message),
    debug: (message: string, data?: any) => createDebugMarker('store', message, data),
    error: (operation: string, error: string) => createErrorMarker('store', operation, error),
    separator: (message?: string) => createColoredSeparator('store', message)
  }
} as const;