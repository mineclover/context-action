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


// Core type definitions
export type {
  IStore,
  IStoreRegistry,
  Listener,
  Unsubscribe,
  Snapshot,
  IEventBus,
  EventHandler as StoreEventHandler
} from './types';