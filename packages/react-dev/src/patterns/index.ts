/**
 * @fileoverview Common patterns exports - unified Store + Action patterns
 * @implements context-pattern
 * @implements separation-of-concerns
 * @implements mvvm-pattern
 * @memberof core-concepts
 * @since 1.0.0
 * 
 * Unified patterns that combine Store and Action management in cohesive Context providers.
 * Provides both isolated Store-only patterns and integrated Store+Action patterns.
 */

// === UNIFIED CONTEXT PATTERN ===
// Integrated Store + Action management with complete isolation
export { 
  createActionContextPattern,
  type ContextPatternConfig,
  type ContextPatternReturn,
  type UnifiedContextType
} from './context-pattern';

// === STORE-ONLY PATTERNS ===
// Re-export store patterns for convenience
export { 
  createContextStorePattern,
  PageStores,
  ComponentStores,
  DemoStores,
  TestStores
} from '../stores/patterns';