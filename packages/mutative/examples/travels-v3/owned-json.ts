import { apply, create, type Patches } from 'mutative';
import { findStateCompatibilityIssues, type JsonValue, type TravelHistoryEntry } from 'travels';
import type { ArrayPaths } from './contracts';

export type { ArrayPaths } from './contracts';

export function assertDurable(value: unknown, source: string): void {
  const [issue] = findStateCompatibilityIssues(value, { allowFrozen: true, maxIssues: 1 });
  if (issue) throw new TypeError(`${source}: ${issue.code} at ${issue.path}: ${issue.message}`);
}

export function freezeOwned<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezeOwned(child);
    Object.freeze(value);
  }
  return value;
}

export function ownJson<T>(value: T, source: string): T {
  assertDurable(value, source);
  return freezeOwned(structuredClone(value));
}

export function rejectAsync(callback: unknown): void {
  if (Object.prototype.toString.call(callback) === '[object AsyncFunction]') {
    throw new TypeError('An experimental updater must be synchronous');
  }
}

/** Mutative's runtime supports JSON primitive roots, unlike its apply declaration. */
export function applyOwnedPatches<T>(state: T, patches: Patches<ArrayPaths>): T {
  return freezeOwned(apply(state as object, patches, { enableAutoFreeze: true }) as T);
}

export interface OwnedTransition<T> extends TravelHistoryEntry<ArrayPaths> {
  readonly state: T;
}

/**
 * Produce without freezing borrowed values. Detach the delta BEFORE applying it
 * to the committed state, preserving structural sharing outside changed paths.
 * The unknown boundary avoids expanding recursive Draft<JsonValue> types; both
 * inputs and the produced state are validated as durable JSON at runtime.
 */
export function prepareOwnedUpdate<T extends JsonValue>(
  state: T,
  updater: (current: T) => T | undefined,
): OwnedTransition<T> {
  rejectAsync(updater);
  const [candidate, patches, inversePatches] = create<unknown, false, ArrayPaths>(
    state,
    (draft: unknown) => {
      const result = updater(draft as T);
      if (result && typeof (result as { then?: unknown }).then === 'function') {
        void Promise.resolve(result).catch(() => {});
        throw new TypeError('An experimental updater must be synchronous');
      }
      return result === draft ? undefined : result;
    },
    { enableAutoFreeze: false, enablePatches: { pathAsArray: true } },
  );
  assertDurable(candidate, 'state');
  const ownedPatches = structuredClone(patches);
  const ownedInverse = structuredClone(inversePatches);
  return {
    state: patches.length === 0 ? state : applyOwnedPatches(state, ownedPatches),
    patches: ownedPatches,
    inversePatches: ownedInverse,
  };
}

/** JSON-tree comparison, not JSON.stringify (property order is not a change). */
export function equalJson(left: JsonValue, right: JsonValue): boolean {
  if (Object.is(left, right)) return true;
  if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object') return false;
  if (Array.isArray(left) !== Array.isArray(right)) return false;
  const keys = Object.keys(left);
  const rightKeys = new Set(Object.keys(right));
  if (keys.length !== rightKeys.size) return false;
  return keys.every(key => rightKeys.has(key) && equalJson(
    (left as Record<string, JsonValue>)[key]!,
    (right as Record<string, JsonValue>)[key]!,
  ));
}
