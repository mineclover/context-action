import type { PublicHandleFactory } from './types.js';

function findDescriptor(target: object, key: PropertyKey): PropertyDescriptor | undefined {
  let current: object | null = target;
  while (current) {
    const descriptor = Object.getOwnPropertyDescriptor(current, key);
    if (descriptor) return descriptor;
    current = Object.getPrototypeOf(current);
  }
  return undefined;
}

/** Allow-list projection, not a sandbox or revocable command capability. */
export function createPublicFacade<Element extends object, const Keys extends readonly (keyof Element)[]>(
  keys: Keys,
  detachedMessage = 'Public handle target is not available',
): PublicHandleFactory<Element, Pick<Element, Keys[number]>> {
  const uniqueKeys = Array.from(new Set(keys));
  return getElement => {
    const requireElement = (): Element => {
      const element = getElement();
      if (!element) throw new Error(detachedMessage);
      return element;
    };
    const methods = new WeakMap<Element, Map<PropertyKey, { source: unknown; bound: unknown }>>();
    const facade = {} as Pick<Element, Keys[number]>;
    for (const key of uniqueKeys) {
      Object.defineProperty(facade, key, {
        configurable: false,
        enumerable: true,
        get() {
          const element = requireElement();
          const value: unknown = Reflect.get(element, key, element);
          if (typeof value !== 'function') return value;
          let cache = methods.get(element);
          if (!cache) { cache = new Map(); methods.set(element, cache); }
          const cached = cache.get(key);
          if (cached?.source === value) return cached.bound;
          const bound = value.bind(element);
          cache.set(key, { source: value, bound });
          return bound;
        },
        set(value: unknown) {
          const element = requireElement();
          const descriptor = findDescriptor(element, key);
          if ((descriptor && !descriptor.set && !descriptor.writable) || !Reflect.set(element, key, value, element)) {
            throw new TypeError(`Cannot assign to read-only property '${String(key)}'`);
          }
        },
      });
    }
    return Object.freeze(facade);
  };
}
