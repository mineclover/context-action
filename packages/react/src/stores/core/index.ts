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



// Core type definitions
export type {
  IStore,
  IStoreRegistry,
  Listener,
  Unsubscribe,
  Snapshot,
} from './types';