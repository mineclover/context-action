/**
 * @fileoverview React patterns exports - Store Pattern and Action Pattern
 * @implements separation-of-concerns
 * @implements mvvm-pattern
 * @memberof core-concepts
 * 
 * Re-exports patterns for convenient access.
 * - createDeclarativeStorePattern for type-safe store management
 * - createActionContext for action-only management  
 * - Pattern composition for complex applications
 */

// === STORE ONLY PATTERN ===
// Re-export store patterns for convenience
export * from '../stores/patterns';

// === ACTION ONLY PATTERN ===
// Re-export action context for convenience
export * from '../actions/ActionContext';

// === Performance Optimization Patterns (v2.1.0+) ===
// Focus on essential context management and type-safe hooks
// Use pattern composition for complex applications requiring both actions and state