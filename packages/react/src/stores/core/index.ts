/**
 * @fileoverview Store core system exports - fundamental store classes and registry
 * @implements store-integration-pattern
 * @implements model-layer
 * @implements mvvm-pattern
 * @memberof core-concepts
 * 
 * Core store system providing the fundamental Store class, StoreRegistry for managing
 * multiple stores, and EventBus for inter-store communication.
 */

// Core Store class and factory
export { Store, createStore } from './Store';

// Store Registry for managing multiple stores
export { StoreRegistry } from './StoreRegistry';

// Event system for store communication
export { EventBus } from './EventBus';

// Store Context functions for React integration
export { createStoreContext, useStoreContext, useStoreRegistry } from './StoreContext';

// Core type definitions
export type {
  IStore,
  IStoreRegistry,
  Listener,
  Unsubscribe,
  Snapshot,
  StoreContextType,
  StoreContextReturn,
  IEventBus,
  EventHandler as StoreEventHandler
} from './types';