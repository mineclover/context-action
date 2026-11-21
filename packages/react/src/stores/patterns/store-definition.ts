const explicitStoreValueMarker = Symbol('context-action.explicit-store-value');

/**
 * Explicit wrapper for a store value that could otherwise look like store configuration.
 *
 * Most object values do not need this wrapper. Use {@link asStoreValue} when every
 * property of the value is also a valid configuration property, for example
 * `{ initialValue: 'domain-value' }`.
 *
 * @public
 */
export interface ExplicitStoreValue<T> {
  readonly value: T;
  readonly [explicitStoreValueMarker]: true;
}
/**
 * Marks a definition as a direct store value without changing the value stored.
 *
 * This is an additive escape hatch for the structurally ambiguous case where a
 * domain value has exactly the same shape as a store configuration object.
 *
 * @public
 */
export function asStoreValue<T>(value: T): ExplicitStoreValue<T> {
  return {
    value,
    [explicitStoreValueMarker]: true,
  };
}

/** @internal */
export function isExplicitStoreValue(value: unknown): value is ExplicitStoreValue<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Partial<ExplicitStoreValue<unknown>>)[explicitStoreValueMarker] === true
  );
}

/**
 * Configuration remains structural for backward compatibility, but only plain
 * objects whose own properties are all recognized configuration keys qualify.
 * Domain objects with additional fields therefore remain direct values.
 *
 * @internal
 */
export function isStoreConfigShape(
  value: unknown,
  allowedKeys: ReadonlySet<PropertyKey>
): value is { initialValue: unknown } {
  if (typeof value !== 'object' || value === null || isExplicitStoreValue(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    return false;
  }

  if (Object.getOwnPropertyDescriptor(value, 'initialValue') === undefined) {
    return false;
  }

  return Reflect.ownKeys(value).every((key) => allowedKeys.has(key));
}

/**
 * Compare two partial external-store DI maps by their non-undefined entries.
 *
 * @internal
 */
export function areExternalStoresEqual<T extends Record<string, unknown>>(
  prev: Partial<Record<keyof T, unknown>> | undefined,
  next: Partial<Record<keyof T, unknown>> | undefined
): boolean {
  if (prev === next) return true;
  if (!prev || !next) return false;
  const prevKeys = Object.keys(prev).filter(key => prev[key as keyof T] !== undefined);
  const nextKeys = Object.keys(next).filter(key => next[key as keyof T] !== undefined);
  if (prevKeys.length !== nextKeys.length) return false;
  return nextKeys.every(key => prev[key as keyof T] === next[key as keyof T]);
}
