/**
 * @fileoverview Focused hooks for ref handling functionality
 * 
 * These hooks are separated from the complex useRefHandler for:
 * - Better maintainability
 * - Easier testing
 * - Single responsibility principle
 * - Reduced complexity per hook
 */

export { useRefMount, type InternalRefState } from './useRefMount';
export { useRefOperation } from './useRefOperation';
export { useRefPolling, type RefPollingOptions, type RefPollingReturn } from './useRefPolling';