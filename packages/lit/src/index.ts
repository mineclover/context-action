/**
 * @fileoverview Main entry point for @context-action/lit.
 * Bridges Context-Action reactive stores and action pipelines to Lit's ReactiveController lifecycle.
 *
 * @implements store-integration-pattern
 * @implements viewmodel-layer
 * @memberof core-concepts
 */

// Controllers
export { StoreController } from './store-controller.js';
export { ActionController } from './action-controller.js';

// Types
export type {
  ReadableStore,
  StoreControllerOptions,
  Selector,
  EqualityFn,
  Listener,
  Unsubscribe,
} from './types.js';

export type {
  ActionControllerOptions,
} from './action-controller.js';
