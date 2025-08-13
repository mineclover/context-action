/**
 * @fileoverview React patterns exports - Action Context Pattern and Declarative Store Pattern
 * @implements separation-of-concerns
 * @implements mvvm-pattern
 * @memberof core-concepts
 * @since 2.0.0
 * 
 * Re-exports patterns for convenient access.
 * - createActionContextPattern for integrated Store + Action management
 * - createDeclarativeStores for type-safe store management
 */

// === ACTION CONTEXT PATTERN (REMOVED) ===
// Use Action Only + Store Only patterns composition instead
// export { 
//   createActionContextPattern,
//   type ActionContextPatternConfig,
//   type ActionContextPatternReturn
// } from './action-context-pattern-legacy';

// === DECLARATIVE STORE PATTERN ===
// Re-export store patterns for convenience
export * from '../stores/patterns';

// === Performance Optimization Patterns (v2.1.0+) ===
// Focus on essential context management and type-safe hooks