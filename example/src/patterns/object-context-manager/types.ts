/**
 * @fileoverview 범용 객체 컨텍스트 관리를 위한 핵심 타입 정의
 * Context-Action 프레임워크 기반 표준화된 객체 관리 패턴
 */

import { ActionPayloadMap } from '@context-action/core';

/**
 * 관리 가능한 객체의 기본 인터페이스
 * 모든 관리 객체는 이 인터페이스를 구현해야 함
 */
export interface ManagedObject {
  readonly id: string;
  readonly type: string;
  readonly createdAt: Date;
  lastAccessed?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * 객체 생명주기 상태
 */
export type ObjectLifecycleState = 'created' | 'active' | 'inactive' | 'archived' | 'deleted';

/**
 * 객체 메타데이터 (Store에 저장되는 직렬화 가능한 데이터)
 */
export interface ObjectMetadata<T extends ManagedObject = ManagedObject> {
  readonly id: string;
  readonly type: string;
  readonly createdAt: string; // ISO string for serialization
  lastAccessed?: string;
  lifecycleState: ObjectLifecycleState;
  metadata?: Record<string, unknown>;
  // 추가 컨텍스트별 메타데이터
  contextMetadata?: Record<string, unknown>;
}

/**
 * 객체 관리 액션의 기본 인터페이스
 */
export interface BaseObjectActions<T extends ManagedObject> extends ActionPayloadMap {
  register: { 
    id: string; 
    object: T; 
    metadata?: Record<string, unknown>; 
    contextMetadata?: Record<string, unknown>;
  };
  unregister: { id: string; force?: boolean };
  update: { 
    id: string; 
    object?: Partial<T>; 
    metadata?: Record<string, unknown>;
    contextMetadata?: Record<string, unknown>;
  };
  activate: { id: string };
  deactivate: { id: string };
  archive: { id: string };
  restore: { id: string };
  cleanup: { 
    olderThan?: number; // milliseconds
    lifecycleStates?: ObjectLifecycleState[];
    force?: boolean;
  };
  // Selection and focus management
  select: { ids: string[]; mode?: 'replace' | 'add' | 'toggle' };
  clearSelection: void;
  focus: { id: string };
  clearFocus: void;
}

/**
 * 객체 쿼리 옵션
 */
export interface QueryOptions {
  type?: string | string[];
  lifecycleState?: ObjectLifecycleState | ObjectLifecycleState[];
  metadata?: Record<string, unknown>;
  sortBy?: 'createdAt' | 'lastAccessed' | 'id' | 'type';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * 객체 컨텍스트의 상태 인터페이스
 */
export interface ObjectContextState<T extends ManagedObject = ManagedObject> {
  objects: Map<string, ObjectMetadata<T>>;
  selectedObjects: string[];
  focusedObject: string | null;
  lastCleanup?: string; // ISO string
}

/**
 * 객체 컨텍스트 설정
 */
export interface ObjectContextConfig {
  contextName: string;
  autoCleanup?: {
    enabled: boolean;
    intervalMs: number;
    olderThanMs: number;
    lifecycleStates?: ObjectLifecycleState[];
  };
  maxObjects?: number;
  enableSelection?: boolean;
  enableFocus?: boolean;
  persistState?: boolean;
}

/**
 * 객체 검증 결과
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 객체 관리 이벤트
 */
export interface ObjectManagementEvent<T extends ManagedObject = ManagedObject> {
  type: 'registered' | 'unregistered' | 'updated' | 'lifecycle_changed' | 'selected' | 'focused';
  objectId: string;
  object?: T;
  metadata?: ObjectMetadata<T>;
  timestamp: Date;
  context: string;
}