/**
 * @fileoverview Mutative-based Immutability Utilities
 *
 * Drop-in replacement for Immer with better performance.
 * Provides safe immutable state updates using Mutative.
 */

import {
  create,
  apply,
  current,
  original,
  isDraft,
  type Draft,
  type Patches,
  rawReturn,
} from '@context-action/mutative-core';
import type { ImmutabilityOptions, ProduceOptions } from './types';
import {
  isPrimitive,
  isNonCloneableType,
  isPlainObject,
  createLogger,
} from './utils';

const logger = createLogger('immutable');

// ============================================================================
// Global Configuration
// ============================================================================

let globalOptions: ImmutabilityOptions = {
  enableCloning: true,
  enableVerification: process.env.NODE_ENV === 'development',
  warnOnFallback: true,
};

/**
 * Set global immutability options
 */
export function setGlobalImmutabilityOptions(
  options: Partial<ImmutabilityOptions>
): void {
  globalOptions = { ...globalOptions, ...options };
}

/**
 * Get current global immutability options
 */
export function getGlobalImmutabilityOptions(): ImmutabilityOptions {
  return { ...globalOptions };
}

// ============================================================================
// Core Produce Function
// ============================================================================

/**
 * Create immutable state updates using Mutative
 *
 * @param baseState - The base state to update
 * @param producer - Function that modifies the draft
 * @param options - Optional configuration
 * @returns The new immutable state
 *
 * @example
 * ```ts
 * const nextState = produce(state, (draft) => {
 *   draft.user.name = 'John';
 *   draft.items.push({ id: 1 });
 * });
 * ```
 */
export function produce<T, F extends boolean = false>(
  baseState: T,
  producer: (draft: Draft<T>) => void | T,
  options?: ProduceOptions<F>
): T {
  try {
    // Always use enablePatches: true to get consistent tuple format [state, patches, inversePatches]
    // Without enablePatches, create returns the state directly, causing destructuring issues
    const result = create(baseState, producer, {
      enablePatches: true,
      enableAutoFreeze: options?.freeze ?? false,
      strict: options?.strict ?? false,
    }) as [T, Patches<true>, Patches<true>];
    const [nextState] = result;
    return nextState;
  } catch (error) {
    if (options?.strict) {
      throw error;
    }
    if (globalOptions.warnOnFallback) {
      logger.warn('Mutative produce failed, falling back to manual clone', error);
    }

    // Fallback: clone and apply producer
    try {
      const draft = deepClone(baseState);
      const result = producer(draft as Draft<T>);
      return result !== undefined ? result : draft;
    } catch (fallbackError) {
      logger.error('Produce fallback failed, returning original state', fallbackError);
      return baseState;
    }
  }
}

/**
 * Create immutable state updates with patches
 *
 * @returns [nextState, patches, inversePatches]
 */
export function produceWithPatches<T, F extends boolean = false>(
  baseState: T,
  producer: (draft: Draft<T>) => void | T,
  options?: Omit<ProduceOptions<F>, 'enablePatches'>
): [T, Patches, Patches] {
  const [nextState, patches, inversePatches] = create(baseState, producer, {
    enablePatches: true,
    enableAutoFreeze: options?.freeze ?? false,
    strict: options?.strict ?? false,
  }) as [T, Patches<true>, Patches<true>];
  return [nextState, patches, inversePatches];
}

// ============================================================================
// Deep Clone Functions
// ============================================================================

/**
 * Deep clone a value ensuring a new reference is always created
 *
 * Unlike copy-on-write, this always creates a new object reference
 * to guarantee immutability when the returned value is modified externally.
 */
export function deepClone<T>(value: T): T {
  // Fast path: primitives (immutable by nature)
  if (isPrimitive(value)) {
    return value;
  }

  // Skip non-cloneable types (DOM elements, functions, etc.)
  if (isNonCloneableType(value) || typeof value === 'function') {
    return value;
  }

  // Always create a true clone (new reference) for immutability guarantee
  return manualDeepClone(value);
}

/**
 * Manual deep clone fallback
 * Handles nested non-cloneable types (DOM elements, etc.) by preserving references
 */
function manualDeepClone<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  // Skip non-cloneable types at any level (DOM elements, functions, etc.)
  if (isNonCloneableType(value) || typeof value === 'function') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(manualDeepClone) as T;
  }

  if (value instanceof Map) {
    const cloned = new Map();
    value.forEach((entryValue, key) => {
      cloned.set(key, manualDeepClone(entryValue));
    });
    return cloned as T;
  }

  if (value instanceof Set) {
    const cloned = new Set();
    value.forEach((entryValue) => {
      cloned.add(manualDeepClone(entryValue));
    });
    return cloned as T;
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as T;
  }

  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as T;
  }

  if (isPlainObject(value)) {
    const cloned: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      cloned[key] = manualDeepClone(val);
    }
    return cloned as T;
  }

  // For class instances, try JSON round-trip
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

// ============================================================================
// Safe Get/Set Functions
// ============================================================================

/**
 * Safely get a value with immutability guarantee
 */
export function safeGet<T>(value: T, enableCloning = true): T {
  if (!enableCloning) return value;
  if (isPrimitive(value)) return value;
  if (isNonCloneableType(value)) return value;

  return deepClone(value);
}

/**
 * Safely set a value with immutability guarantee
 */
export function safeSet<T>(value: T, enableCloning = true): T {
  if (!enableCloning) return value;
  return deepClone(value);
}

// ============================================================================
// Apply Patches
// ============================================================================

/**
 * Apply patches to a state
 *
 * @param state - The state to apply patches to
 * @param patches - The patches to apply
 * @param options - Optional configuration
 * @returns The new state with patches applied, or `undefined` when
 *   `mutable: true` mutates the provided state in place
 */
export function applyPatches<T>(
  state: T,
  patches: Patches,
  options: { mutable: true }
): void;
export function applyPatches<T>(
  state: T,
  patches: Patches,
  options?: { mutable?: false }
): T;
export function applyPatches<T>(
  state: T,
  patches: Patches,
  options?: { mutable?: boolean }
): T | undefined {
  return apply(state as object, patches, {
    mutable: options?.mutable ?? false,
  }) as T | undefined;
}

// ============================================================================
// Mutative Utilities Re-export
// ============================================================================

export const MutativeUtils = {
  /**
   * Check if value is a Draft object
   */
  isDraft(value: unknown): boolean {
    return isDraft(value);
  },

  /**
   * Get original object from Draft
   */
  original<T>(value: T): T | undefined {
    return original(value);
  },

  /**
   * Get current state of Draft (finalized snapshot)
   */
  current<T>(value: T): T {
    return current(value as object) as T;
  },

  /**
   * Raw return for replacing entire state
   */
  rawReturn<T>(value: T): T {
    return rawReturn(value as object) as T;
  },

  /**
   * Produce new state
   */
  produce,

  /**
   * Produce with patches
   */
  produceWithPatches,

  /**
   * Apply patches
   */
  apply: applyPatches,
};

// Re-export mutative functions
export { isDraft, original, current, rawReturn, create, apply };
