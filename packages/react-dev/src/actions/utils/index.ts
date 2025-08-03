/**
 * @fileoverview Action utilities exports - business logic and validation helpers
 * @implements mvvm-pattern
 * @implements cross-store-coordination
 * @memberof core-concepts
 * @since 1.0.0
 * 
 * Utility functions for action operations including multi-store coordination,
 * transaction handling, and validation patterns for business logic.
 */

// === ACTION HANDLER UTILITIES ===
// Business logic and validation helpers
export { 
  createMultiStoreHandler,
  createTransactionHandler,
  createValidatedHandler,
  ActionHandlerUtils,
  type StoreSnapshot,
  type MultiStoreContext,
  type TransactionContext
} from './ActionHandlerUtils';