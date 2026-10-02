import * as React from 'react';

const useIsomorphicLayoutEffect = typeof window === 'undefined'
  ? React.useEffect
  : React.useLayoutEffect;

export interface CustomElementBridgeOptions<Props extends Record<string, any>> {
  /** The registered custom element HTML tag name, e.g. 'cart-badge' */
  tagName: string;
  /** Property keys that should be assigned directly as DOM properties rather than attributes */
  properties?: readonly (keyof Props)[];
  /** Map of React prop handler names to CustomEvent names, e.g. { onCartChange: 'cart-change' } */
  events?: Record<string, string>;
}

export type CustomElementComponent<Props, Element extends HTMLElement> = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<Props & React.HTMLAttributes<Element>> & React.RefAttributes<Element>
>;

/**
 * Creates a type-safe React bridge component for consuming any Custom Element
 * with seamless property synchronization, custom event listeners, and ref forwarding.
 * 
 * Solves standard React ↔ Web Component pain points:
 * 1. Custom Events: Automatically maps React handlers (e.g. `onCartChange`) to DOM `addEventListener`
 * 2. Complex Properties: Directly assigns objects, arrays, and functions to the DOM instance without stringification
 * 3. Ref Forwarding: Forwards native `ref` to the underlying Custom Element instance
 */
export function createCustomElementBridge<
  Props extends Record<string, any> = Record<string, any>,
  Element extends HTMLElement = HTMLElement,
>(options: CustomElementBridgeOptions<Props>): CustomElementComponent<Props, Element> {
  const { tagName, properties = [], events = {} } = options;

  const Bridge = React.forwardRef<Element, Props & React.HTMLAttributes<Element>>(
    function CustomElementBridge(props, forwardedRef) {
      const elementRef = React.useRef<Element | null>(null);

      React.useImperativeHandle(forwardedRef, () => elementRef.current as Element, []);

      // Synchronize properties before paint so the custom element does not
      // display a stale snapshot between React commits. The element's own
      // connected lifecycle may still run before this hook; bridge consumers
      // should therefore make their default connected input safe.
      useIsomorphicLayoutEffect(() => {
        const el = elementRef.current;
        if (!el) return;

        // Set complex properties directly on the DOM element
        for (const propKey of properties) {
          if (propKey in props) {
            (el as any)[propKey] = (props as any)[propKey];
          } else if (propKey in el) {
            // React can remove a property on a later render. Clear the
            // previous value instead of leaving a stale object on the host.
            try {
              (el as any)[propKey] = undefined;
            } catch {
              // A readonly custom-element property may reject assignment;
              // its adapter remains responsible for interpreting omission.
            }
          }
        }

        // Attach custom event listeners
        const cleanups: (() => void)[] = [];
        for (const [propHandlerName, customEventName] of Object.entries(events)) {
          const handler = (props as any)[propHandlerName];
          if (typeof handler === 'function') {
            const listener = (event: Event) => handler(event);
            el.addEventListener(customEventName, listener);
            cleanups.push(() => el.removeEventListener(customEventName, listener));
          }
        }

        return () => {
          for (const cleanup of cleanups) cleanup();
        };
      }, [props]);

      // Filter out properties and event props so they aren't stringified as HTML attributes
      const domProps: Record<string, any> = { ref: elementRef };
      for (const [key, value] of Object.entries(props)) {
        if (!properties.includes(key as any) && !(key in events)) {
          domProps[key] = value;
        }
      }

      return React.createElement(tagName, domProps);
    },
  );

  Bridge.displayName = `CustomElementBridge(${tagName})`;
  return Bridge;
}
