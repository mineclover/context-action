/**
 * @fileoverview Context-Action React Development Package
 * 개발 전용 버전 - HMR, 디버깅 도구, 풀 로깅, 개발자 도구 포함
 * 
 * 이 패키지는 개발 환경에서만 사용되는 모든 기능을 포함합니다:
 * - Hot Module Replacement (HMR) 지원
 * - 개발자 대시보드 및 디버깅 도구
 * - 상세한 로깅 및 추적 기능
 * - 성능 모니터링 도구
 * 
 * 프로덕션 환경에서는 @context-action/react를 사용하세요.
 */

// ===================================================================
// PRODUCTION FEATURES - 프로덕션 기능들 (react 패키지와 동일)
// ===================================================================

// === ACTION SYSTEM ===
export * from '@context-action/react/actions';

// === STORE SYSTEM ===
export * from '@context-action/react/stores';

// === UNIFIED PATTERNS ===
export * from '@context-action/react/patterns';

// === UNIFIED HOOKS ===
export * from '@context-action/react/hooks';

// ===================================================================
// DEVELOPMENT-ONLY FEATURES - 개발 전용 기능들
// ===================================================================

// === HMR SUPPORT (개발 전용) ===
// Hot Module Replacement 지원 - 상태 보존하며 코드 변경사항 적용
export * from './hmr';

// === DEVELOPMENT TOOLS (개발 전용) ===
// 개발자 대시보드, 성능 모니터링, 디버깅 도구
export * from './dev-tools';

// === ENHANCED LOGGING (개발 전용) ===
// 상세한 로깅, 추적, 디버깅 정보
export * from './dev-logging';

// ===================================================================
// CORE FRAMEWORK RE-EXPORTS
// ===================================================================

// === CORE ACTION SYSTEM ===
export type {
	ActionPayloadMap,
	ActionHandler,
	HandlerConfig,
	PipelineController,
	ActionRegisterConfig,
	ExecutionMode,
	UnregisterFunction
} from "@context-action/core";

export { 
	ActionRegister,
} from "@context-action/core";

// === ENHANCED LOGGER SYSTEM (개발 전용) ===
export type { Logger, LogLevel } from "@context-action/logger";
export {
	ConsoleLogger,
	createLogger,
	getLogLevelFromEnv,
	// 개발 전용 고급 로깅 기능
	TraceCollector,
	LogArtHelpers,
	UniversalTraceLogger
} from "@context-action/logger";

// ===================================================================
// DEVELOPMENT BUILD INFO
// ===================================================================
export const DEV_BUILD_INFO = {
  version: "0.0.4",
  buildType: "development",
  features: {
    hmr: true,
    devTools: true,
    enhancedLogging: true,
    performanceMonitoring: true,
    debugging: true
  },
  bundleOptimizations: {
    treeShaking: false, // 개발용은 전체 포함
    minification: false,
    deadCodeElimination: false
  }
} as const;