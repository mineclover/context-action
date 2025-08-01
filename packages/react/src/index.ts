/**
 * @context-action/react - React integration for context-action
 * Provides React hooks and components for action management and state stores
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

// === REACT ACTION CONTEXT ===
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
	NumericStore,
	ManagedStore,
	StoreRegistry,
	EventBus,
	ScopedEventBus,
	StoreUtils,
	createStore,
	createManagedStore,
	createComputedStore,
} from "./store";

// HOC patterns for stores - REMOVED
// Use hooks instead:
// - withStore → useLocalStore + useStoreValue  
// - withManagedStore → useRegistryStore + useStoreValue
// - withStoreData → useStoreValue with multiple stores

// React hooks for store management
export {
	// Basic store hooks
	useStore,
	useStoreValue,
	useStoreValues,
	useRegistry,
	useRegistryStore,
	useDynamicStore,
	useLocalStore,
	useLocalState,
	useStoreActions,
	useStoreSync,
	useComputedStore,
	useComputedValue,
	usePersistedStore,
	// MVVM Architecture hooks
	useMultiStoreAction,
	useTransactionAction,
	useActionWithStores,
	useMVVMStore,
	useMultiMVVMStore,
	useStoreQuery,
} from "./store";

// Context API for store management
export {
	createStoreContext,
	useStoreContext,
} from "./store";

// Advanced sync utilities
export {
	createStoreSync,
	createTypedStoreHooks,
	useBatchStoreSync,
	createRegistrySync,
	RegistryUtils,
	useDynamicStoreWithDefault,
	useDynamicStoreSnapshot,
	useDynamicStores,
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
} from "./store";
