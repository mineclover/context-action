import type React from 'react';

type UnionToIntersection<U> = (
  U extends unknown ? (arg: U) => void : never
) extends (arg: infer I) => void
  ? I
  : never;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Merges multiple React refs (callback refs and MutableRefObjects), forwarding
 * React 19 cleanup callbacks when returned by any underlying callback ref.
 */
export function mergeRefs<T>(
  ...refs: Array<React.Ref<T> | undefined | null>
): React.RefCallback<T> {
  const activeRefs = refs.filter(
    (ref): ref is Exclude<React.Ref<T>, undefined | null> =>
      ref !== undefined && ref !== null,
  );

  return (node: T | null) => {
    const cleanups: Array<() => void> = [];

    for (const ref of activeRefs) {
      if (typeof ref === 'function') {
        const cleanup = (ref as (instance: T | null) => unknown)(node);
        if (typeof cleanup === 'function') {
          cleanups.push(cleanup as () => void);
        }
      } else if (typeof ref === 'object') {
        (ref as React.MutableRefObject<T | null>).current = node;
      }
    }

    if (cleanups.length > 0) {
      return () => {
        for (const cleanup of cleanups) {
          cleanup();
        }
      };
    }
    return undefined;
  };
}

/**
 * Merges multiple prop objects cleanly for headless component APIs:
 * - Event handlers (`/^on[A-Z]/`) are chained in order
 * - `className` strings are concatenated with spaces
 * - `style` objects are shallow-merged
 * - `ref` props are combined via `mergeRefs`
 * - All other props take the last non-`undefined` value
 */
export function mergeProps<T extends Array<Record<string, unknown> | undefined | null>>(
  ...propsList: T
): UnionToIntersection<NonNullable<T[number]>> {
  const result: Record<string, unknown> = {};

  for (const props of propsList) {
    if (!props) continue;

    for (const key of Object.keys(props)) {
      const nextValue = props[key];
      if (nextValue === undefined) continue;

      const prevValue = result[key];
      if (prevValue === undefined) {
        result[key] = nextValue;
        continue;
      }

      if (key === 'ref') {
        result[key] = mergeRefs(
          prevValue as React.Ref<unknown>,
          nextValue as React.Ref<unknown>,
        );
        continue;
      }

      if (key === 'className' && typeof prevValue === 'string' && typeof nextValue === 'string') {
        if (prevValue.length === 0) result[key] = nextValue;
        else if (nextValue.length === 0) result[key] = prevValue;
        else result[key] = `${prevValue} ${nextValue}`;
        continue;
      }

      if (key === 'style' && isPlainRecord(prevValue) && isPlainRecord(nextValue)) {
        result[key] = { ...prevValue, ...nextValue };
        continue;
      }

      if (/^on[A-Z]/.test(key) && typeof prevValue === 'function' && typeof nextValue === 'function') {
        const firstHandler = prevValue as (...args: unknown[]) => void;
        const secondHandler = nextValue as (...args: unknown[]) => void;
        result[key] = (...args: unknown[]) => {
          firstHandler(...args);
          secondHandler(...args);
        };
        continue;
      }

      result[key] = nextValue;
    }
  }

  return result as UnionToIntersection<NonNullable<T[number]>>;
}
