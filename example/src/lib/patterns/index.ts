/**
 * @fileoverview 범용 객체 컨텍스트 관리 패턴 - Export Module
 * Context-Action 프레임워크 기반 표준화된 객체 관리 솔루션
 */

// Core Types
export type {
  ManagedObject,
  ObjectMetadata,
  BaseObjectActions,
  ObjectLifecycleState,
  ObjectContextState,
  ObjectContextConfig,
  QueryOptions,
  ValidationResult,
  ObjectManagementEvent
} from './types';

// Core Manager
export { ObjectContextManager } from './ObjectContextManager';

// React Hooks Factory
export { createObjectContextHooks } from './createObjectContextHooks';

// Examples
export { default as UserManagementExample } from './examples/UserManagementExample';
export { default as ElementManagementMigration } from './examples/ElementManagementMigration';