import React, {
  createContext,
  useContext,
  useInsertionEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import type { RefTarget } from './types';

/**
 * Imperative dynamically-keyed reference collection causing zero React re-renders.
 * Unlike `useRefRegistry<TRefs>()` (fixed compile-time named keys), `RefCollection`
 * manages dynamic runtime string keys such as menu items, tabs, or table rows.
 */
export interface RefCollection<TTarget extends RefTarget = HTMLElement> {
  /** Return a referentially stable callback ref setter for dynamic `key`. */
  setRef(key: string): (node: TTarget | null) => void;
  /** Synchronously read the mounted element at `key`, or `null` if absent. */
  get(key: string): TTarget | null;
  /** Return `true` when `key` currently maps to a mounted element. */
  has(key: string): boolean;
  /** List all currently mounted keys. */
  keys(): string[];
  /** Number of currently mounted keys in the collection. */
  size(): number;
  /** Synchronously run `operation` when `key` is mounted; returns `null` otherwise. */
  executeIfMounted<R>(key: string, operation: (target: TTarget) => R): R | null;
  /** Clear all tracked nodes and cached setters. */
  clear(): void;
}

/** Per-key ref binding handle returned by `useItemRef(key)`. */
export interface RefCollectionItemHandle<TTarget extends RefTarget = HTMLElement> {
  /** Cached callback ref ready to pass directly as `<Item ref={itemRef.ref} />`. */
  readonly ref: (node: TTarget | null) => void;
  /** Synchronously read this item's mounted target or `null`. */
  get(): TTarget | null;
  /** Synchronously run `operation` when this item is mounted; returns `null` otherwise. */
  executeIfMounted<R>(operation: (target: TTarget) => R): R | null;
}

/** Scoped collection context created by `createRefCollectionContext()`. */
export interface RefCollectionContextReturn<TTarget extends RefTarget = HTMLElement> {
  /** Explicit non-empty context name passed to `createRefCollectionContext()`. */
  readonly contextName: string;
  /** Provider scoping one isolated `RefCollection` per subtree. */
  Provider: React.FC<{ children: ReactNode }>;
  /** Access the underlying collection imperatively from list/container coordinators. */
  useRefCollection: () => RefCollection<TTarget>;
  /** Bind and inspect a single item key from a child component with zero re-renders. */
  useItemRef: (key: string) => RefCollectionItemHandle<TTarget>;
}

/**
 * Creates a component-local dynamically keyed ref collection whose ref setters stay
 * referentially stable per key and never trigger React re-renders on mount or unmount.
 * Use `useRefRegistry<TRefs>()` instead when your ref names are known statically.
 */
export function useRefCollection<
  TTarget extends RefTarget = HTMLElement,
>(): RefCollection<TTarget> {
  const targetsRef = useRef<Map<string, TTarget>>(new Map());
  const settersRef = useRef<Map<string, (node: TTarget | null) => void>>(new Map());

  const collection = useMemo<RefCollection<TTarget>>(() => {
    const targets = targetsRef.current;
    const setters = settersRef.current;

    return {
      setRef(key: string) {
        let cached = setters.get(key);
        if (!cached) {
          cached = (node: TTarget | null) => {
            if (node !== null) {
              targets.set(key, node);
            } else {
              targets.delete(key);
            }
          };
          setters.set(key, cached);
        }
        return cached;
      },
      get(key: string) {
        return targets.get(key) ?? null;
      },
      has(key: string) {
        return targets.has(key);
      },
      keys() {
        return [...targets.keys()];
      },
      size() {
        return targets.size;
      },
      executeIfMounted<R>(key: string, operation: (target: TTarget) => R): R | null {
        const target = targets.get(key);
        if (!target) return null;
        return operation(target);
      },
      clear() {
        targets.clear();
        setters.clear();
      },
    };
  }, []);

  useInsertionEffect(() => {
    return () => {
      collection.clear();
    };
  }, [collection]);

  return collection;
}

function useRefCollectionValue<TTarget extends RefTarget>(
  context: React.Context<RefCollection<TTarget> | null>,
  contextName: string,
): RefCollection<TTarget> {
  const collection = useContext(context);
  if (!collection) {
    throw new Error(
      `useRefCollection (${contextName}) must be used within ${contextName}.Provider`,
    );
  }
  return collection;
}

function useCollectionItemHandle<TTarget extends RefTarget>(
  context: React.Context<RefCollection<TTarget> | null>,
  contextName: string,
  key: string,
): RefCollectionItemHandle<TTarget> {
  const collection = useRefCollectionValue(context, contextName);
  return useMemo<RefCollectionItemHandle<TTarget>>(
    () => ({
      ref: collection.setRef(key),
      get: () => collection.get(key),
      executeIfMounted: <R,>(operation: (target: TTarget) => R) =>
        collection.executeIfMounted(key, operation),
    }),
    [collection, key],
  );
}

function RefCollectionProviderHost<TTarget extends RefTarget>({
  collectionContext,
  children,
}: {
  collectionContext: React.Context<RefCollection<TTarget> | null>;
  children: ReactNode;
}) {
  const collection = useRefCollection<TTarget>();
  return (
    <collectionContext.Provider value={collection}>
      {children}
    </collectionContext.Provider>
  );
}

/**
 * Creates a Provider-isolated keyed ref collection context for lists, menus, tabs,
 * and virtualized grids where item counts are dynamic.
 */
export function createRefCollectionContext<
  TTarget extends RefTarget = HTMLElement,
>(contextName: string): RefCollectionContextReturn<TTarget> {
  if (typeof contextName !== 'string' || contextName.trim().length === 0) {
    throw new TypeError(
      'createRefCollectionContext requires a non-empty context name as its first argument.',
    );
  }

  const CollectionContext = createContext<RefCollection<TTarget> | null>(null);

  return {
    contextName,
    Provider: ({ children }) => (
      <RefCollectionProviderHost collectionContext={CollectionContext}>
        {children}
      </RefCollectionProviderHost>
    ),
    useRefCollection: () => useRefCollectionValue(CollectionContext, contextName),
    useItemRef: (key: string) =>
      useCollectionItemHandle(CollectionContext, contextName, key),
  };
}
