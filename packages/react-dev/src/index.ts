/**
 * @fileoverview Context-Action React Package Entry Point - Modular Re-export Structure
 * @implements viewmodel-layer
 * @implements mvvm-pattern
 * @implements react-integration
 * @memberof packages
 * @version 1.0.0
 * 
 * React integration package for the Context-Action framework, providing comprehensive
 * React hooks, components, and patterns for action management and reactive state stores.
 * 
 * This package implements the View and ViewModel layers of the MVVM architecture,
 * connecting React components to the action pipeline and store system.
 * 
 * === MODULAR STRUCTURE ===
 * This package is organized into logical modules for better tree-shaking and developer experience:
 * - actions/     - createActionContext (primary) and ActionProvider (simple) for action management
 * - stores/      - Complete store system (core, hooks, utils, patterns)
 * - hooks/       - Unified hooks export
 * 
 * === USAGE PATTERNS ===
 * 
 * Basic Import (Full compatibility):
 * ```typescript
 * import { useStoreValue, ActionProvider } from '@context-action/react';
 * ```
 * 
 * Optimized Import (Smaller bundles):
 * ```typescript
 * import { useStoreValue } from '@context-action/react/stores';
 * import { ActionProvider } from '@context-action/react/actions';
 * ```
 * 
 * @example
 * ```typescript
 * import { 
 *   ActionProvider, 
 *   useActionDispatch, 
 *   createContextStorePattern,
 *   useStoreValue 
 * } from '@context-action/react';
 * import type { ActionPayloadMap } from '@context-action/core';
 * 
 * // Define action types
 * interface AppActions extends ActionPayloadMap {
 *   updateUser: { id: string; name: string };
 *   calculateTotal: void;
 * }
 * 
 * // Create isolated store pattern
 * const AppStores = createContextStorePattern('App');
 * 
 * // Root component with providers
 * function App() {
 *   return (
 *     <AppStores.Provider>
 *       <ActionProvider config={{ logLevel: LogLevel.DEBUG }}>
 *         <UserProfile />
 *       </ActionProvider>
 *     </AppStores.Provider>
 *   );
 * }
 * 
 * // Component with action dispatch and store subscription
 * function UserProfile() {
 *   const dispatch = useActionDispatch<AppActions>();
 *   const userStore = AppStores.useStore('user', { name: '', email: '' });
 *   const user = useStoreValue(userStore);
 *   
 *   return (
 *     <div>
 *       <h1>{user.name}</h1>
 *       <button onClick={() => dispatch('updateUser', { id: '1', name: 'John' })}>
 *         Update User
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */

// ===================================================================
// MAIN EXPORTS - FULL COMPATIBILITY WITH EXISTING IMPORTS
// ===================================================================

// === ACTION SYSTEM ===
// All action-related functionality including ActionProvider and hooks
export * from './actions';

// === STORE SYSTEM ===
// Complete store system: core, hooks, utilities, and patterns
export * from './stores';

// === PROVIDER COMPONENTS ===
// Note: Use Context Store Pattern (createContextStorePattern) for store management
// Use createActionContext or ActionProvider for action management

// === UNIFIED PATTERNS ===
// Store + Action integrated patterns
export * from './patterns';

// === UNIFIED HOOKS ===
// All hooks in one place for convenience
export * from './hooks';

// === HMR SUPPORT ===
// Hot Module Replacement support for development
// Note: Only available in development mode
export * from './hmr';

// ===================================================================
// CORE FRAMEWORK RE-EXPORTS - FOR CONVENIENCE
// ===================================================================

// === CORE ACTION SYSTEM ===
// Re-export core types and classes for convenience
export type {
	ActionPayloadMap,
	ActionHandler,
	HandlerConfig,
	PipelineController,
	ActionRegisterConfig,
	ExecutionMode,
	UnregisterFunction
} from "@context-action/core-dev";

export { 
	ActionRegister,
} from "@context-action/core-dev";

// === LOGGER SYSTEM ===
export type { Logger, LogLevel } from "@context-action/logger";
export {
	ConsoleLogger,
	createLogger,
	getLogLevelFromEnv,
} from "@context-action/logger";

// ===================================================================
// NOTE: All detailed exports are now handled by the modular structure above.
// This ensures 100% compatibility while enabling selective imports like:
//
// import { useStoreValue } from '@context-action/react/stores';
// import { ActionProvider } from '@context-action/react/actions';
// ===================================================================

