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
export { StoreTransactionCoordinator } from './StoreTransactionCoordinator';
export type { StoreTransactionEvent, StoreTransactionEventPhase, StoreTransactionHandle, StoreTransactionListener, StoreTransactionMeta, StoreTransactionParticipant, StoreTransactionRecord } from './StoreTransactionCoordinator';
export { bindActionTransactions } from './ActionTransactionBridge';
export type { ActionTransactionBridgeOptions, DispatchTraceSource } from './ActionTransactionBridge';



// Core type definitions
export type {
  IStore,
  IStoreRegistry,
  Listener,
  Unsubscribe,
  Snapshot,
} from './types';

export type {
  ReadonlyStateSnapshot,
  StateMutationMeta,
  StateMutationOrigin,
  StateTransition,
  StoreReader,
  StoreWriter,
  TimelineReader,
  TimelineWriter,
} from './contracts';
