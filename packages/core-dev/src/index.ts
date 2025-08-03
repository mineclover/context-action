/**
 * @fileoverview Context-Action Core Package Entry Point
 * @implements action-pipeline-system
 * @implements core-concepts
 * @memberof packages
 * @version 1.0.0
 * 
 * Core action pipeline management system providing type-safe action dispatch
 * with priority-based handler execution, Store integration, and performance optimization.
 * 
 * This package forms the foundation of the Context-Action framework, implementing
 * the central ActionRegister system and supporting utilities for action management.
 * 
 * Key Exports:
 * - ActionRegister: Central action registration and dispatch system
 * - Type definitions: Comprehensive TypeScript interfaces for type safety
 * - ActionGuard: Performance optimization through debouncing/throttling
 * - Execution modes: Sequential, parallel, and race execution strategies
 * 
 * @example
 * ```typescript
 * import { ActionRegister } from '@context-action/core';
 * import type { ActionPayloadMap } from '@context-action/core';
 * 
 * interface AppActions extends ActionPayloadMap {
 *   increment: void;
 *   setCount: number;
 *   updateUser: { id: string; name: string };
 * }
 * 
 * const actionRegister = new ActionRegister<AppActions>();
 * 
 * // Register handlers with priority and configuration
 * actionRegister.register('increment', (_, controller) => {
 *   console.log('Incremented');
 *   controller.next();
 * }, { priority: 10 });
 * 
 * // Dispatch actions with type safety
 * await actionRegister.dispatch('increment');
 * await actionRegister.dispatch('setCount', 42);
 * ```
 */

/** Core ActionRegister class and types */
export { ActionRegister } from './ActionRegister.js';

/** Type definitions */
export type {
  ActionPayloadMap,
  ActionHandler,
  HandlerConfig,
  HandlerRegistration,
  PipelineContext,
  PipelineController,
  ActionRegisterConfig,
  UnregisterFunction,
  ActionDispatcher,
  ActionMetrics,
  ActionRegisterEvents,
  EventHandler,
  EventEmitter,
  ExecutionMode,
} from './types.js';

/** Performance optimization utilities */
export { ActionGuard } from './action-guard.js';

/** Execution mode implementations */
export { executeSequential, executeParallel, executeRace } from './execution-modes.js';

/** HMR Support (Development only) */
export * from './hmr/action-register-hmr-support.js';

/** Note: Logger utilities are now available from @context-action/logger package */
/** Applications should import logger functionality directly from @context-action/logger */