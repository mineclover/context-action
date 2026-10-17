/**
 * @module react-bridge
 *
 * Purpose:
 *   Bridges Custom Elements into React 18/19 component trees (`createCustomElementBridge`)
 *   with synchronous complex-property assignment, `CustomEvent` listener binding,
 *   and `useImperativeHandle` OOP Facade encapsulation (`createHandle`).
 *
 * Invariants:
 *   - Complex properties listed in `properties` and event handlers in `events`
 *     are stripped from JSX attributes so React never stringifies objects as
 *     `"[object Object]"`.
 *   - Property synchronization runs inside `useIsomorphicLayoutEffect` before paint,
 *     clearing omitted properties back to `undefined` when removed on re-render.
 *   - When `createHandle` is provided, parent `ref` consumers receive only the
 *     encapsulated `Handle` facade rather than the raw `HTMLElement`.
 */
import * as React from 'react';
import type { ImperativeHandleFactory } from './facade.js';

export { createElementFacade } from './facade.js';
export type { ImperativeHandleFactory, PublicActionMethods } from './facade.js';

const useIsomorphicLayoutEffect = typeof window === 'undefined'
  ? React.useEffect
  : React.useLayoutEffect;

export interface CustomElementBridgeOptions<
  Props extends Record<string, any>,
  Element extends HTMLElement = HTMLElement,
  Handle = Element,
> {
  /** The registered custom element HTML tag name, e.g. 'cart-badge' */
  tagName: string;
  /** Property keys that should be assigned directly as DOM properties rather than attributes */
  properties?: readonly (keyof Props)[];
  /** Map of React prop handler names to CustomEvent names, e.g. { onCartChange: 'cart-change' } */
  events?: Record<string, string>;
  /**
   * Optional factory for `useImperativeHandle` that encapsulates the underlying
   * `HTMLElement` and exposes only an object-oriented Facade handle to parent refs.
   * When omitted, the raw `Element` instance is forwarded for backward compatibility.
   */
  createHandle?: ImperativeHandleFactory<Element, Handle>;
}

export type CustomElementComponent<
  Props,
  Element extends HTMLElement,
  Handle = Element,
> = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<Props & Omit<React.HTMLAttributes<Element>, keyof Props>> &
    React.RefAttributes<Handle>
>;

/**
 * Creates a type-safe React bridge component for consuming any Custom Element
 * with seamless property synchronization, custom event listeners, and ref forwarding.
 *
 * Solves standard React ↔ Web Component pain points:
 * 1. Custom Events: Automatically maps React handlers (e.g. `onCartChange`) to DOM `addEventListener`
 * 2. Complex Properties: Directly assigns objects, arrays, and functions to the DOM instance without stringification
 * 3. Ref Forwarding: Forwards native `ref` to the underlying Custom Element instance or an encapsulated Facade handle
 */
export function createCustomElementBridge<
  Props extends Record<string, any> = Record<string, any>,
  Element extends HTMLElement = HTMLElement,
  Handle = Element,
>(options: CustomElementBridgeOptions<Props, Element, Handle>): CustomElementComponent<Props, Element, Handle> {
  const { tagName, properties = [], events = {}, createHandle } = options;

  const Bridge = React.forwardRef<Handle, Props & Omit<React.HTMLAttributes<Element>, keyof Props>>(
    function CustomElementBridge(props, forwardedRef) {
      const elementRef = React.useRef<Element | null>(null);

      React.useImperativeHandle(
        forwardedRef,
        () => {
          if (createHandle) {
            return createHandle(() => elementRef.current);
          }
          return elementRef.current as unknown as Handle;
        },
        [],
      );

      // Synchronize properties before paint so the custom element does not
      // display a stale snapshot between React commits. The element's own
      // connected lifecycle may still run before this hook; bridge consumers
      // should therefore make their default connected input safe.
      useIsomorphicLayoutEffect(() => {
        const el = elementRef.current;
        if (!el) return;

        const hostRecord = el as unknown as Record<PropertyKey, unknown>;
        const propsRecord = props as Record<PropertyKey, unknown>;

        // Set complex properties directly on the DOM element
        for (const propKey of properties) {
          if (propKey in props) {
            hostRecord[propKey] = propsRecord[propKey];
          } else if (propKey in el) {
            // React can remove a property on a later render. Clear the
            // previous value instead of leaving a stale object on the host.
            try {
              hostRecord[propKey] = undefined;
            } catch {
              // A readonly custom-element property may reject assignment;
              // its adapter remains responsible for interpreting omission.
            }
          }
        }

        // Attach custom event listeners
        const cleanups: (() => void)[] = [];
        for (const [propHandlerName, customEventName] of Object.entries(events)) {
          const handler = propsRecord[propHandlerName];
          if (typeof handler === 'function') {
            const listener = (event: Event) => (handler as (event: Event) => void)(event);
            el.addEventListener(customEventName, listener);
            cleanups.push(() => el.removeEventListener(customEventName, listener));
          }
        }

        return () => {
          for (const cleanup of cleanups) cleanup();
        };
      }, [props]);

      // Filter out properties and event props so they aren't stringified as HTML attributes
      const domProps: Record<string, unknown> = { ref: elementRef };
      for (const [key, value] of Object.entries(props)) {
        if (!properties.includes(key as keyof Props) && !(key in events)) {
          domProps[key] = value;
        }
      }

      return React.createElement(tagName, domProps);
    },
  );

  Bridge.displayName = `CustomElementBridge(${tagName})`;
  return Bridge;
}
