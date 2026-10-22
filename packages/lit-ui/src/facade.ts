/**
 * @module facade
 *
 * Purpose:
 *   Provides zero-dependency OOP Facade utilities (`PublicActionMethods`,
 *   `ImperativeHandleFactory`, `createElementFacade`) that project a Custom
 *   Element's public contract into an encapsulated handle without exposing raw
 *   `HTMLElement` or `ShadowRoot` internals.
 *
 * Invariants:
 *   - Pure TypeScript/ES2022 runtime with zero Lit or React dependencies,
 *     usable in Vanilla DOM, Lit, or React bridges alike.
 *   - `createElementFacade` returns a frozen object (`instanceof HTMLElement === false`),
 *     binds methods lazily to the live element, and caches bound function
 *     identities in a `WeakMap` so detached elements are never retained.
 *   - Rejects writes to read-only properties with a `TypeError` and throws a
 *     descriptive error when accessed while unmounted.
 */

/**
 * Maps selected action keys from an ActionPayloadMap-compatible record into
 * object-oriented method signatures while hiding internal action keys.
 */
export type PublicActionMethods<
  // biome-ignore lint/suspicious/noExplicitAny: action payload map values can be any payload shape.
  Actions extends Record<string, any>,
  PublicKeys extends keyof Actions = keyof Actions,
  ReturnMap extends Partial<Record<PublicKeys, unknown>> = Record<never, never>,
> = {
  // biome-ignore lint/suspicious/noConfusingVoidType: action payload maps use void for payload-less actions.
  readonly [K in PublicKeys]: [Actions[K]] extends [void | undefined]
    ? () => K extends keyof ReturnMap ? Promise<ReturnMap[K]> : Promise<void>
    : (payload: Actions[K]) => K extends keyof ReturnMap ? Promise<ReturnMap[K]> : Promise<void>;
};

/**
 * Host-agnostic factory function that creates an encapsulated OOP handle
 * from a lazy custom element getter, hiding raw `HTMLElement` internals.
 */
export type ImperativeHandleFactory<
  Element extends HTMLElement,
  Handle,
> = (getElement: () => Element | null) => Handle;

function findPropertyDescriptor(
  target: object,
  key: PropertyKey,
): PropertyDescriptor | undefined {
  let current: object | null = target;
  while (current) {
    const descriptor = Object.getOwnPropertyDescriptor(current, key);
    if (descriptor) return descriptor;
    current = Object.getPrototypeOf(current);
  }
  return undefined;
}

/**
 * Creates a reusable host-agnostic handle factory that exposes only the specified
 * properties and methods from a Custom Element, hiding raw `HTMLElement` APIs.
 * Can be used directly with Vanilla DOM, Lit, or
 * `createLitElementBridge({ createHandle })`.
 *
 * Methods are bound to the current element and cached per element, so repeated
 * reads return the same function identity until the element or the underlying
 * method changes. The cache is keyed weakly and never retains a detached element.
 *
 * @example
 * ```ts
 * const TimelineElement = createLitElementBridge<TimelineProps, TimelineElement, TimelineHandle>({
 *   tagName: 'st-timeline',
 *   properties: ['input', 'set'],
 *   createHandle: createElementFacade(['focusItem', 'scrollTo', 'commitSelection']),
 * });
 * ```
 */
export function createElementFacade<
  Element extends HTMLElement,
  const Keys extends readonly (keyof Element)[],
>(
  keys: Keys,
): ImperativeHandleFactory<Element, Pick<Element, Keys[number]>> {
  const uniqueKeys = Array.from(new Set(keys));
  return (getElement) => {
    const requireElement = (): Element => {
      const element = getElement();
      if (!element) {
        throw new Error('Custom element handle is not mounted');
      }
      return element;
    };
    const boundMethods = new WeakMap<
      Element,
      Map<PropertyKey, { source: unknown; bound: unknown }>
    >();
    const facade = {} as Pick<Element, Keys[number]>;
    for (const key of uniqueKeys) {
      Object.defineProperty(facade, key, {
        configurable: false,
        enumerable: true,
        get() {
          const element = requireElement();
          const value: unknown = Reflect.get(element, key, element);
          if (typeof value !== 'function') return value;
          let cache = boundMethods.get(element);
          if (!cache) {
            cache = new Map();
            boundMethods.set(element, cache);
          }
          const cached = cache.get(key);
          if (cached && cached.source === value) return cached.bound;
          const bound = value.bind(element);
          cache.set(key, { source: value, bound });
          return bound;
        },
        set(nextValue: unknown) {
          const element = requireElement();
          const descriptor = findPropertyDescriptor(element, key);
          if (descriptor && !descriptor.set && !descriptor.writable) {
            throw new TypeError(`Cannot assign to read-only property '${String(key)}'`);
          }
          const updated = Reflect.set(element, key, nextValue, element);
          if (!updated) {
            throw new TypeError(`Cannot assign to read-only property '${String(key)}'`);
          }
        },
      });
    }
    return Object.freeze(facade);
  };
}
