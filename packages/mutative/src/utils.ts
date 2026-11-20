/**
 * Check if value is an object-like value (object or array)
 */
export function isObjectLike(
  value: unknown
): value is Record<PropertyKey, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Check if value is a plain object (created by {} or Object.create(null))
 */
export function isPlainObject(
  value: unknown
): value is Record<PropertyKey, unknown> {
  if (!isObjectLike(value)) {
    return false;
  }

  const proto = Object.getPrototypeOf(value);
  if (proto === null) {
    return true;
  }

  return proto === Object.prototype;
}

/**
 * Check if value is a primitive type
 */
export function isPrimitive(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint' ||
    typeof value === 'symbol'
  );
}

/**
 * Check if array has only numeric indices (no extra properties)
 */
export function hasOnlyArrayIndices(value: unknown): value is unknown[] {
  if (!Array.isArray(value)) {
    return false;
  }

  return Reflect.ownKeys(value).every((key) => {
    if (key === 'length') {
      return true;
    }

    if (typeof key === 'symbol') {
      return false;
    }

    const index = Number(key);
    return Number.isInteger(index) && index >= 0 && String(index) === key;
  });
}

/**
 * Deep clone a value
 */
export function deepCloneValue(
  value: unknown,
  seen = new WeakMap<object, unknown>(),
): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (isNonCloneableType(value)) {
    return value;
  }

  const existing = seen.get(value);
  if (existing !== undefined) {
    return existing;
  }

  if (Array.isArray(value)) {
    const cloned: unknown[] = new Array(value.length);
    seen.set(value, cloned);
    for (let i = 0; i < value.length; i++) {
      if (i in value) {
        cloned[i] = deepCloneValue(value[i], seen);
      }
    }
    return cloned;
  }

  if (value instanceof Map) {
    const cloned = new Map<unknown, unknown>();
    seen.set(value, cloned);
    value.forEach((entryValue, key) => {
      cloned.set(key, deepCloneValue(entryValue, seen));
    });
    return cloned;
  }

  if (value instanceof Set) {
    const cloned = new Set<unknown>();
    seen.set(value, cloned);
    value.forEach((entryValue) => {
      cloned.add(deepCloneValue(entryValue, seen));
    });
    return cloned;
  }

  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags);
  }

  if (isPlainObject(value)) {
    const proto = Object.getPrototypeOf(value);
    const cloned: Record<string, unknown> =
      proto === null ? Object.create(null) : {};
    seen.set(value, cloned);
    for (const key of Object.keys(value)) {
      cloned[key] = deepCloneValue(
        (value as Record<string, unknown>)[key],
        seen,
      );
    }
    return cloned;
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

/**
 * Deep clone with optional target object
 */
export function deepClone<T>(source: T, target?: unknown): T {
  if (target && source && typeof source === 'object') {
    const seen = new WeakMap<object, unknown>([[source, target]]);
    for (const key of Object.keys(source)) {
      (target as Record<string, unknown>)[key] = deepCloneValue(
        (source as Record<string, unknown>)[key],
        seen,
      );
    }
    return target as T;
  }

  return deepCloneValue(source) as T;
}

/**
 * Check if value is non-cloneable type (DOM elements, functions, etc.)
 */
export function isNonCloneableType(value: unknown): boolean {
  if (typeof value === 'function') return true;
  if (!value || typeof value !== 'object') return false;

  // DOM Elements
  if (typeof Element !== 'undefined' && value instanceof Element) return true;
  if (typeof Node !== 'undefined' && value instanceof Node) return true;

  // Promises
  if (value instanceof Promise) return true;

  // WeakMap/WeakSet
  if (value instanceof WeakMap || value instanceof WeakSet) return true;

  return false;
}

/**
 * Create a logger with namespace prefix
 */
export function createLogger(namespace: string) {
  const prefix = `[@context-action/mutative:${namespace}]`;

  return {
    warn: (message: string, ...args: unknown[]) => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`${prefix} ${message}`, ...args);
      }
    },
    error: (message: string, ...args: unknown[]) => {
      console.error(`${prefix} ${message}`, ...args);
    },
    debug: (message: string, ...args: unknown[]) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`${prefix} ${message}`, ...args);
      }
    },
  };
}
