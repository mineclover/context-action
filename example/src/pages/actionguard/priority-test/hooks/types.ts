/**
 * @fileoverview 우선순위 테스트 시스템 타입 정의
 *
 * UI 및 테스트 전용 타입들:
 * - HandlerConfig: 테스트 핸들러 설정 (UI 속성 포함)
 * - PerformanceOptions: 성능 설정
 * - ExecutionStateData: 실행 상태 (context에서 이동)
 */

// ================================
// 🔧 기본 설정 타입들
// ================================

/**
 * 테스트 핸들러 설정
 * 
 * UI 표시와 테스트 실행을 위한 설정입니다.
 * 라이브러리의 HandlerConfig를 확장하지 않고 독립적으로 정의합니다.
 */
export interface HandlerConfig {
  /** 핸들러 고유 ID */
  id: string;
  /** 실행 우선순위 (높을수록 먼저 실행) */
  priority: number;
  /** UI 표시용 색상 */
  color: string;
  /** 사용자 친화적 라벨 */
  label: string;
  /** 실행 지연 시간 (밀리초) */
  delay: number;
  /** 점프할 대상 우선순위 */
  jumpToPriority?: number | null;
  /** 점프할 대상 인덱스 (내부 사용) */
  jumpToIndex?: number | null;
}

// 성능 옵션 타입
export interface PerformanceOptions {
  enableToast?: boolean;
  enableConsoleLog?: boolean;
  performanceMode?: boolean;
}

