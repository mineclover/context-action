import { useEffect, useRef } from 'react';
import type { Store } from '../core/Store';
import type { PathValue, StorePath, StorePathOf } from './useStorePath';

/**
 * Options for synchronizing an external controlled React prop into a `Store<T>` path.
 */
export interface UseControlledStoreSyncOptions<T, R> {
  /** Custom equality comparator to skip redundant commits (defaults to `Object.is`). */
  isEqual?: (a: R, b: R) => boolean;
  /** Atomic side-hook invoked inside the same `store.update()` commit when syncing a change. */
  onSync?: (draft: T, nextValue: R) => void;
}

type LiteralStorePath<P extends readonly (string | number)[]> =
  number extends P['length'] ? never : P;

type DynamicStorePath<P extends readonly (string | number)[]> =
  number extends P['length'] ? P : never;

function readValueAtPath(root: unknown, path: Readonly<StorePath>): unknown {
  let cursor = root;
  for (let i = 0; i < path.length; i += 1) {
    if (cursor === null || cursor === undefined) return undefined;
    cursor = (cursor as Record<string | number, unknown>)[path[i]!];
  }
  return cursor;
}

function writeValueAtPath(
  draft: unknown,
  path: Readonly<StorePath>,
  value: unknown,
): void {
  if (path.length === 0 || draft === null || typeof draft !== 'object') return;
  let cursor = draft as Record<string | number, unknown>;
  for (let i = 0; i < path.length - 1; i += 1) {
    const segment = path[i]!;
    const next = cursor[segment];
    if (next === null || typeof next !== 'object') return;
    cursor = next as Record<string | number, unknown>;
  }
  cursor[path[path.length - 1]!] = value;
}

/**
 * Synchronizes an optional controlled React prop into a `Store` path without
 * feedback loops. When `controlledValue` is `undefined`, the store stays
 * uncontrolled and ignores the prop. Optional `onSync` derives dependent draft
 * fields atomically inside the same `store.update()` commit.
 */
/** Synchronize a controlled prop into a compile-time validated literal store path. */
export function useControlledStoreSync<
  T,
  const P extends StorePathOf<T>,
>(
  store: Store<T>,
  path: LiteralStorePath<P>,
  controlledValue: PathValue<T, P> | undefined,
  isEqualOrOptions?:
    | ((a: PathValue<T, P>, b: PathValue<T, P>) => boolean)
    | UseControlledStoreSyncOptions<T, PathValue<T, P>>,
): void;
/** Synchronize a controlled prop into a dynamic runtime store path array. */
export function useControlledStoreSync<
  T,
  R = unknown,
  const P extends readonly (string | number)[] = StorePath,
>(
  store: Store<T>,
  path: DynamicStorePath<P>,
  controlledValue: R | undefined,
  isEqualOrOptions?:
    | ((a: R, b: R) => boolean)
    | UseControlledStoreSyncOptions<T, R>,
): void;
export function useControlledStoreSync<T, R = unknown>(
  store: Store<T>,
  path: Readonly<StorePath>,
  controlledValue: R | undefined,
  isEqualOrOptions:
    | ((a: R, b: R) => boolean)
    | UseControlledStoreSyncOptions<T, R> = Object.is,
): void {
  const isEqualFn =
    typeof isEqualOrOptions === 'function'
      ? isEqualOrOptions
      : (isEqualOrOptions.isEqual ?? Object.is);
  const onSyncFn =
    typeof isEqualOrOptions === 'function' ? undefined : isEqualOrOptions.onSync;

  const isEqualRef = useRef(isEqualFn);
  isEqualRef.current = isEqualFn;
  const onSyncRef = useRef(onSyncFn);
  onSyncRef.current = onSyncFn;
  const pathJson = JSON.stringify(path);

  useEffect(() => {
    if (controlledValue === undefined) return;
    const currentPath = JSON.parse(pathJson) as StorePath;
    const currentVal = (
      currentPath.length === 0
        ? store.getValue()
        : readValueAtPath(store.getValue(), currentPath)
    ) as R;

    if (isEqualRef.current(currentVal, controlledValue)) return;

    if (currentPath.length === 0) {
      if (!onSyncRef.current) {
        store.setValue(controlledValue as unknown as T);
        return;
      }
      store.update(draft => {
        if (
          draft !== null &&
          typeof draft === 'object' &&
          controlledValue !== null &&
          typeof controlledValue === 'object'
        ) {
          Object.assign(draft as object, controlledValue);
        }
        onSyncRef.current?.(draft, controlledValue);
      });
      return;
    }

    store.update(draft => {
      writeValueAtPath(draft, currentPath, controlledValue);
      onSyncRef.current?.(draft, controlledValue);
    });
  }, [store, pathJson, controlledValue]);
}
