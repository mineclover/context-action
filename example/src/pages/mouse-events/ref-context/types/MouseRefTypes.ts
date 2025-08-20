/**
 * @fileoverview Mouse Events RefContext Types
 * 
 * RefContext 기반 마우스 이벤트 시스템의 타입 정의
 */

// ============================================================================
// Core Types
// ============================================================================

export interface MousePosition {
  x: number;
  y: number;
}

export interface MouseClick {
  x: number;
  y: number;
  timestamp: number;
  button: number;
}

export interface MouseMetrics {
  totalMoves: number;
  totalClicks: number;
  averageVelocity: number;
  maxVelocity: number;
  sessionStartTime: number;
}

// ============================================================================
// Reference Object Types (RefContext 관리 대상)
// ============================================================================

/**
 * 마우스 위치 관련 Reference 객체
 */
export interface MousePositionRefs {
  /** 현재 마우스 커서 요소 */
  cursor: HTMLDivElement | null;
  /** 마우스 트레일 요소 */
  trail: HTMLDivElement | null;
  /** 위치 표시 텍스트 요소 */
  positionDisplay: HTMLSpanElement | null;
  /** 현재 위치 상태 */
  currentPosition: MousePosition;
  /** 이전 위치 (속도 계산용) */
  previousPosition: MousePosition;
  /** 마지막 업데이트 시간 */
  lastUpdateTime: number;
}

/**
 * 시각 효과 관련 Reference 객체  
 */
export interface VisualEffectsRefs {
  /** 클릭 이펙트 컨테이너 */
  clickEffectsContainer: HTMLDivElement | null;
  /** 마우스 경로 SVG */
  pathSvg: SVGSVGElement | null;
  /** 경로 패스 요소 */
  pathElement: SVGPathElement | null;
  /** 활성 클릭 이펙트들 */
  activeClickEffects: Set<HTMLDivElement>;
  /** 경로 포인트 히스토리 */
  pathHistory: MousePosition[];
  /** 최대 경로 포인트 수 */
  maxPathPoints: number;
}

/**
 * 성능 메트릭 관련 Reference 객체
 */
export interface PerformanceRefs {
  /** 총 이동 횟수 표시 요소 */
  movesDisplay: HTMLSpanElement | null;
  /** 총 클릭 횟수 표시 요소 */
  clicksDisplay: HTMLSpanElement | null;
  /** 속도 표시 요소 */
  velocityDisplay: HTMLSpanElement | null;
  /** FPS 표시 요소 */
  fpsDisplay: HTMLSpanElement | null;
  /** 메트릭 데이터 */
  metrics: MouseMetrics;
  /** FPS 측정용 */
  frameTimestamps: number[];
  /** 성능 측정 시작 시간 */
  performanceStartTime: number;
}

// ============================================================================
// RefContext Configuration Types
// ============================================================================

/**
 * 마우스 위치 RefContext 설정
 */
export interface MousePositionConfig {
  /** 커서 크기 */
  cursorSize: number;
  /** 트레일 크기 */
  trailSize: number;
  /** 위치 업데이트 쓰로틀링 (ms) */
  updateThrottle: number;
  /** 하드웨어 가속 사용 여부 */
  useHardwareAcceleration: boolean;
}

/**
 * 시각 효과 RefContext 설정
 */
export interface VisualEffectsConfig {
  /** 클릭 이펙트 지속 시간 (ms) */
  clickEffectDuration: number;
  /** 경로 표시 여부 */
  showPath: boolean;
  /** 최대 경로 포인트 수 */
  maxPathPoints: number;
  /** 경로 색상 */
  pathColor: string;
  /** 클릭 이펙트 색상 */
  clickEffectColor: string;
}

/**
 * 성능 메트릭 RefContext 설정
 */
export interface PerformanceConfig {
  /** FPS 측정 샘플 수 */
  fpsSampleCount: number;
  /** 메트릭 업데이트 간격 (ms) */
  metricsUpdateInterval: number;
  /** 성능 로깅 여부 */
  enablePerformanceLogging: boolean;
  /** 세부 메트릭 표시 여부 */
  showDetailedMetrics: boolean;
}

// ============================================================================
// Event Handler Types
// ============================================================================

/**
 * 마우스 이벤트 핸들러 인터페이스
 */
export interface MouseEventHandlers {
  onMouseMove: (position: MousePosition, timestamp: number) => void;
  onMouseClick: (click: MouseClick) => void;
  onMouseEnter: (position: MousePosition) => void;
  onMouseLeave: (position: MousePosition) => void;
  onReset: () => void;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * RefContext 업데이터 함수 타입
 */
export type RefUpdater<T> = (current: T) => T;

/**
 * 성능 측정 결과
 */
export interface PerformanceMeasurement {
  fps: number;
  averageFrameTime: number;
  totalMoves: number;
  totalClicks: number;
  sessionDuration: number;
}