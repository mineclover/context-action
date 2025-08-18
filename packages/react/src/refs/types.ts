/**
 * @fileoverview Universal Reference Management Types
 * 
 * DOM elements, Three.js objects, and other reference types를 위한
 * 범용적인 참조 관리 타입 시스템
 */

import type { ActionPayloadMap } from '@context-action/core';

/**
 * 참조 가능한 객체의 기본 인터페이스
 * DOM Element, Three.js Object3D, 또는 기타 참조 객체
 */
export interface RefTarget {
  // 최소한의 공통 인터페이스 - 모든 참조 객체가 구현해야 함
  readonly [key: string]: any;
}

/**
 * DOM Element 확장 - HTML 요소들
 */
export interface DOMRefTarget extends RefTarget, Element {}

/**
 * Three.js Object 확장 - Object3D 기반 객체들
 */
export interface ThreeRefTarget extends RefTarget {
  // Three.js Object3D의 핵심 속성들
  uuid: string;
  name?: string;
  type: string;
  parent?: ThreeRefTarget | null;
  children?: ThreeRefTarget[];
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
  visible?: boolean;
  
  // 메서드들 (선택적)
  add?(object: ThreeRefTarget): void;
  remove?(object: ThreeRefTarget): void;
  traverse?(callback: (object: ThreeRefTarget) => void): void;
  dispose?(): void;
}


/**
 * 참조 객체의 현재 상태
 */
export interface RefState<T extends RefTarget = RefTarget> {
  /** 참조 객체 (null이면 아직 마운트되지 않음) */
  target: T | null;
  
  /** 객체가 준비되어 사용 가능한지 여부 */
  isReady: boolean;
  
  /** 마운트된 상태인지 여부 */
  isMounted: boolean;
  
  /** 마운트 대기를 위한 Promise */
  mountPromise: Promise<T> | null;
  
  /** 마운트된 시간 (타임스탬프) */
  mountedAt?: number;
  
  /** 객체 타입 (DOM, Three.js, etc.) */
  objectType: 'dom' | 'three' | 'custom';
  
  /** 에러 상태 */
  error?: Error | null;
  
  /** 추가 메타데이터 */
  metadata?: Record<string, any>;
}

/**
 * 참조 작업의 결과
 */
export interface RefOperationResult<T = any> {
  success: boolean;
  result?: T;
  error?: Error;
  duration?: number;
  timestamp: number;
}

/**
 * 참조 작업 옵션
 */
export interface RefOperationOptions {
  /** 작업 타임아웃 (ms) */
  timeout?: number;
  
  /** 재시도 횟수 */
  retries?: number;
  
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
  
  /** 작업 우선순위 */
  priority?: number;
  
  /** 작업 식별자 */
  operationId?: string;
  
  /** 추가 메타데이터 */
  metadata?: Record<string, any>;
}

/**
 * 참조 작업 함수 타입
 */
export type RefOperation<T extends RefTarget, R = any> = (
  target: T,
  options?: RefOperationOptions
) => R | Promise<R>;

/**
 * 참조 초기화 설정
 */
export interface RefInitConfig<T extends RefTarget = RefTarget> {
  /** 참조 이름 */
  name: string;
  
  /** 객체 타입 */
  objectType: 'dom' | 'three' | 'custom';
  
  /** 초기 메타데이터 */
  initialMetadata?: Record<string, any>;
  
  /** 마운트 타임아웃 (ms) */
  mountTimeout?: number;
  
  /** 자동 cleanup 여부 */
  autoCleanup?: boolean;
  
  /** 커스텀 validation 함수 */
  validator?: (target: any) => target is T;
  
  /** 커스텀 cleanup 함수 */
  cleanup?: (target: T) => void | Promise<void>;
}

/**
 * 참조 정의 타입 - 여러 참조를 한 번에 정의
 */
export type RefDefinitions = Record<string, RefInitConfig<any>>;

/**
 * 참조 정의로부터 타입 추론
 */
export type InferRefTypes<T extends RefDefinitions> = {
  [K in keyof T]: T[K] extends RefInitConfig<infer R> ? R : RefTarget;
};

/**
 * 참조 액션의 페이로드 맵 기본 인터페이스
 */
export interface RefActionPayloadMap extends ActionPayloadMap {
  // 공통 참조 액션들
  mount: { refName: string; target: RefTarget };
  unmount: { refName: string };
  cleanup: { refName: string };
  reset: { refName: string };
  
  // 에러 처리
  handleError: { refName: string; error: Error };
  retry: { refName: string; maxRetries?: number };
}

/**
 * 참조 액션 핸들러의 컨텍스트
 */
export interface RefActionContext<T extends RefDefinitions> {
  /** 특정 참조 가져오기 (마운트 대기 포함) */
  getRef: <K extends keyof T>(refName: K) => Promise<InferRefTypes<T>[K]>;
  
  /** 참조 상태 확인 */
  isRefReady: <K extends keyof T>(refName: K) => boolean;
  
  /** 모든 참조 상태 가져오기 */
  getAllRefStates: () => Record<keyof T, RefState<any>>;
  
  /** 참조에 대한 안전한 작업 수행 */
  withRef: <K extends keyof T, R>(
    refName: K,
    operation: RefOperation<InferRefTypes<T>[K], R>,
    options?: RefOperationOptions
  ) => Promise<RefOperationResult<R>>;
  
  /** 여러 참조에 대한 배치 작업 */
  withRefs: <R>(
    refNames: (keyof T)[],
    operation: (refs: Partial<InferRefTypes<T>>) => R | Promise<R>,
    options?: RefOperationOptions
  ) => Promise<RefOperationResult<R>>;
}

/**
 * 참조 이벤트 타입
 */
export interface RefEvent<T extends RefTarget = RefTarget> {
  type: 'mount' | 'unmount' | 'error' | 'ready' | 'cleanup';
  refName: string;
  target?: T;
  error?: Error;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * 참조 이벤트 리스너
 */
export type RefEventListener<T extends RefTarget = RefTarget> = (
  event: RefEvent<T>
) => void;

/**
 * DOM 참조를 위한 유틸리티 타입들
 */
export interface DOMRefConfig<T extends Element = Element> extends RefInitConfig<T> {
  objectType: 'dom';
  
  /** DOM 선택자 (optional, for validation) */
  selector?: string;
  
  /** 필수 속성 검증 */
  requiredAttributes?: string[];
  
  /** DOM 이벤트 리스너 자동 등록 */
  autoEventListeners?: Record<string, EventListener>;
}

/**
 * Three.js 참조를 위한 유틸리티 타입들
 */
export interface ThreeRefConfig<T extends ThreeRefTarget = ThreeRefTarget> extends RefInitConfig<T> {
  objectType: 'three';
  
  /** Three.js 객체 타입 검증 */
  expectedType?: string;
  
  /** Scene에 자동 추가 여부 */
  autoAddToScene?: boolean;
  
  /** 자동 dispose 여부 */
  autoDispose?: boolean;
  
  /** 텍스처/지오메트리/머티리얼 자동 정리 */
  autoCleanupResources?: boolean;
}

/**
 * 커스텀 참조 설정
 */
export interface CustomRefConfig<T extends RefTarget = RefTarget> extends RefInitConfig<T> {
  objectType: 'custom';
  
  /** 커스텀 초기화 함수 */
  initializer?: () => T | Promise<T>;
  
  /** 커스텀 업데이트 함수 */
  updater?: (current: T, updates: Partial<T>) => T | Promise<T>;
}

/**
 * 통합 참조 설정 타입
 */
export type AnyRefConfig = DOMRefConfig<any> | ThreeRefConfig<any> | CustomRefConfig<any>;