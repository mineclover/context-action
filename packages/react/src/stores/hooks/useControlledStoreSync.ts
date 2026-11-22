import { useEffect, useRef } from 'react';
import type { Store } from '../core/Store';
import type { PathValue, StorePath } from './useStorePath';

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
 * uncontrolled and ignores the prop.
 */
export function useControlledStoreSync<
  T,
  const P extends readonly (string | number)[],
>(
  store: Store<T>,
  path: number extends P['length'] ? never : P,
  controlledValue: PathValue<T, P> | undefined,
  isEqual?: (a: PathValue<T, P>, b: PathValue<T, P>) => boolean,
): void;
export function useControlledStoreSync<T, R = unknown>(
  store: Store<T>,
  path: Readonly<StorePath>,
  controlledValue: R | undefined,
  isEqual?: (a: R, b: R) => boolean,
): void;
export function useControlledStoreSync<T, R = unknown>(
  store: Store<T>,
  path: Readonly<StorePath>,
  controlledValue: R | undefined,
  isEqual: (a: R, b: R) => boolean = Object.is,
): void {
  const isEqualRef = useRef(isEqual);
  isEqualRef.current = isEqual;
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
      store.setValue(controlledValue as unknown as T);
      return;
    }

    store.update(draft => {
      writeValueAtPath(draft, currentPath, controlledValue);
    });
  }, [store, pathJson, controlledValue]);
}
