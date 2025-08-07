/**
 * @fileoverview Unified hooks exports - all React hooks in one place
 * @implements store-hooks
 * @implements view-layer
 * @implements fresh-state-access
 * @memberof api-terms
 * @since 1.0.0
 * 
 * Comprehensive export of all React hooks available in the Context-Action framework.
 * This includes action hooks for dispatching actions and store hooks for state management.
 * 
 * This is the main entry point for users who want to import all hooks from a single location.
 */

// === ACTION HOOKS ===
// Factory-based action context system - use createActionContext to create hooks
export { createActionContext, type ActionContextConfig, type ActionContextReturn } from '../actions';

// === STORE HOOKS ===
// All store-related React hooks
export * from '../stores/hooks';

// === CONVENIENCE RE-EXPORTS ===
// Most commonly used hooks for easy access
export { useStoreValue, useStoreValues } from '../stores/hooks/useStoreValue';
export { useLocalStore } from '../stores/hooks/useLocalStore';
export { useRegistry } from '../stores/hooks/useRegistry';

// === PATTERN HOOKS ===
// Pattern-specific hooks removed - use Declarative Store Pattern instead