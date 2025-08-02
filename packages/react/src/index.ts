/**
 * @fileoverview Context-Action React Package Entry Point  
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
 * Key Features:
 * - ActionProvider: React Context integration for action dispatch
 * - Store system: Reactive state management with useSyncExternalStore
 * - Context Store Pattern: Provider-level store isolation
 * - HOC patterns: Higher-Order Components for provider composition
 * - Type-safe hooks: Full TypeScript support throughout
 * - Performance optimization: Selective subscriptions and comparison strategies
 * 
 * Architecture Patterns:
 * - MVVM: Clear separation between View (React), ViewModel (Actions), Model (Stores)
 * - Observer: Reactive updates through store subscriptions
 * - Context: React Context API for dependency injection
 * - Registry: Centralized store management and lifecycle
 * - Provider: Component composition and dependency provision
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

// === CORE ACTION SYSTEM ===
// Re-export core types and classes for convenience
export type {
	ActionPayloadMap,
	ActionHandler,
	HandlerConfig,
	PipelineController,
} from "@context-action/core";

export { 
	ActionRegister,
} from "@context-action/core";

// === LOGGER SYSTEM ===
export type { Logger, LogLevel } from "@context-action/logger";
export {
	ConsoleLogger,
	createLogger,
	getLogLevelFromEnv,
} from "@context-action/logger";

// === REACT ACTION CONTEXT (DEPRECATED) ===
// @deprecated ActionContext is deprecated in favor of ActionProvider
// Use ActionProvider and related hooks for new development
export * from "./ActionContext";

// === ACTION PROVIDER (ARCHITECTURE.md Pattern) ===
export {
	ActionProvider,
	useActionDispatch,
	useActionRegister,
	createTypedActionProvider,
	withActionProvider,
	withStoreAndActionProvider,
} from "./ActionProvider";

export type {
	ActionContextType,
	ActionProviderProps,
} from "./ActionProvider";

// === STORE PROVIDER (ARCHITECTURE.md Pattern) ===
export {
	StoreProvider,
	useStoreRegistry,
	createTypedStoreProvider,
	withStoreProvider,
} from "./StoreProvider";

export type {
	StoreContextType as StoreProviderContextType,
	StoreProviderProps,
} from "./StoreProvider";

// === STORE SYSTEM ===
// Core store classes and interfaces
export {
	Store,
	ManagedStore,
	StoreRegistry,
	EventBus,
	ScopedEventBus,
	StoreUtils,
	createStore,
	createManagedStore,
} from "./store";

// HOC patterns for stores - REMOVED
// Use hooks instead:
// - withStore → useLocalStore + useStoreValue  
// - withManagedStore → useRegistryStore + useStoreValue
// - withStoreData → useStoreValue with multiple stores

// React hooks for store management
export {
	// Core store hooks
	useStore,
	useStoreValue,
	useStoreValues,
	useStoreActions,
	// Registry hooks
	useRegistry,
	useRegistryStore,
	// Specialized hooks
	useLocalStore,
	usePersistedStore,
} from "./store";

// Context API for store management
export {
	createStoreContext,
	useStoreContext,
	createContextStorePattern,
	// Pre-defined Context Store Patterns
	PageStores,
	ComponentStores,
	DemoStores,
	TestStores,
} from "./store";

// Advanced sync utilities
export {
	useStoreSelector,
	createTypedStoreHooks,
	createRegistrySync,
	RegistryUtils,
} from "./store";

// Comparison utilities for enhanced Store performance
export {
	compareValues,
	fastCompare,
	referenceEquals,
	shallowEquals,
	deepEquals,
	createStoreComparator,
	measureComparison,
	setGlobalComparisonOptions,
	getGlobalComparisonOptions,
} from "./store";

// === TYPE DEFINITIONS ===
export type {
	// Store core types
	Snapshot,
	Listener,
	Unsubscribe,
	Subscribe,
	IStore,
	IStoreRegistry,
	EventHandler,
	IEventBus,
	
	// Store configuration types
	StoreConfig,
	
	// Hook configuration types
	StoreSyncConfig,
	HookOptions,
	
	// Context types
	StoreContextType,
	StoreContextReturn,
	
	// Registry types
	RegistryStoreMap,
	DynamicStoreOptions,
	
	// Comparison system types
	ComparisonStrategy,
	ComparisonOptions,
	CustomComparator,
	ComparisonMetrics,
} from "./store";
