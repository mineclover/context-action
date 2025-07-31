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
	Logger,
} from "@context-action/core";

export { 
	ActionRegister,
	ConsoleLogger,
	LogLevel,
	createLogger,
	getLogLevelFromEnv,
} from "@context-action/core";

// === REACT ACTION CONTEXT ===
export * from "./ActionContext";

// === ACTION PROVIDER (ARCHITECTURE.md Pattern) ===
export {
	ActionProvider,
	useActionDispatch,
	useActionRegister,
	createTypedActionProvider,
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
	StoreRegistry,
	EventBus,
	ScopedEventBus,
	StoreUtils,
	createStore,
	createComputedStore,
} from "./store";

// React hooks for store management
export {
	useStore,
	useStoreValue,
	useRegistry,
	useRegistryStore,
	useDynamicStore,
	useLocalStore,
	useStoreActions,
	useStoreSync,
	useComputedStore,
	usePersistedStore,
	// MVVM Architecture hooks
	useMultiStoreAction,
	useTransactionAction,
	useActionWithStores,
} from "./store";

// Context API for store management
export {
	createStoreContext,
	StoreProvider,
	useStoreContext,
	useStoreRegistry,
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
