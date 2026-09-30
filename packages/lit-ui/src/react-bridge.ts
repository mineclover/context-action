/**
 * @fileoverview React 18/19 bridge helper for consuming Lit Custom Elements.
 * Provides direct property assignment to bypass attribute stringification,
 * custom event listener mapping with deterministic cleanup, and ref forwarding.
 *
 * @implements view-layer
 * @implements web-component-primitive
 * @memberof core-concepts
 */

import * as React from 'react';

/**
 * Configuration options for the Lit React Bridge.
 * Controls direct property assignment and custom event mapping.
 */
export interface LitBridgeConfig<Props extends Record<string, any>> {
  /**
   * Property keys that should be assigned directly as DOM element properties
   * rather than rendered as HTML attributes.
   *
   * This is critical for React 18 compatibility, which stringifies complex objects,
   * arrays, functions, and class instances (such as Context-Action stores) to `"[object Object]"`.
   */
  properties?: readonly (keyof Props)[];

  /**
   * Map of React prop handler names to native DOM CustomEvent names.
   *
   * @example
   * ```ts
   * events: {
   *   onQuantityChange: 'quantity-change',
   *   onCartBadgeClick: 'cart-badge-click',
   * }
   * ```
   */
  events?: Record<string, string>;
}

/**
 * Options object signature for createLitElementBridge, including the custom element tagName.
 */
export interface LitBridgeOptions<Props extends Record<string, any>>
  extends LitBridgeConfig<Props> {
  /**
   * The registered custom element HTML tag name, e.g. 'lit-quantity-stepper'.
   */
  tagName: string;
}

/**
 * Strongly typed React ForwardRefExoticComponent representing the bridged Custom Element.
 */
export type LitElementComponent<
  Props extends Record<string, any>,
  Element extends HTMLElement = HTMLElement,
> = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<Props & React.HTMLAttributes<Element>> & React.RefAttributes<Element>
>;

/**
 * Helper to safely assign a DOM element to both callback refs and ObjectRefs.
 */
function setForwardedRef<T>(
  forwardedRef: React.ForwardedRef<T> | React.Ref<T> | undefined,
  node: T | null,
): void {
  if (!forwardedRef) return;
  if (typeof forwardedRef === 'function') {
    forwardedRef(node);
  } else if (typeof forwardedRef === 'object' && 'current' in forwardedRef) {
    (forwardedRef as React.MutableRefObject<T | null>).current = node;
  }
}

/**
 * Overload 1: Two-argument form `(tagName, config?)`.
 *
 * @example
 * ```tsx
 * const ReactStepper = createLitElementBridge<StepperProps, LitQuantityStepper>(
 *   'lit-quantity-stepper',
 *   {
 *     properties: ['metadata', 'cartStore'],
 *     events: { onQuantityChange: 'quantity-change' },
 *   }
 * );
 * ```
 */
export function createLitElementBridge<
  Props extends Record<string, any> = Record<string, any>,
  Element extends HTMLElement = HTMLElement,
>(
  tagName: string,
  config?: LitBridgeConfig<Props>,
): LitElementComponent<Props, Element>;

/**
 * Overload 2: Single-argument options form `(options)`.
 *
 * @example
 * ```tsx
 * const ReactStepper = createLitElementBridge<StepperProps, LitQuantityStepper>({
 *   tagName: 'lit-quantity-stepper',
 *   properties: ['metadata', 'cartStore'],
 *   events: { onQuantityChange: 'quantity-change' },
 * });
 * ```
 */
export function createLitElementBridge<
  Props extends Record<string, any> = Record<string, any>,
  Element extends HTMLElement = HTMLElement,
>(
  options: LitBridgeOptions<Props>,
): LitElementComponent<Props, Element>;

/**
 * Creates a type-safe React bridge component for consuming any Lit Custom Element
 * with seamless property synchronization, custom event listeners, and ref forwarding.
 *
 * Solves standard React ↔ Web Component pain points:
 * 1. Direct Property Assignment: Directly assigns objects, arrays, and stores to the DOM
 *    instance without stringifying to `"[object Object]"` in React 18.
 * 2. Custom Events: Automatically maps React handlers (e.g. `onQuantityChange`) to DOM
 *    `addEventListener` with automatic cleanup on unmount and prop update.
 * 3. Ref Forwarding: Forwards native `ref` (both callback refs and `ObjectRef`) to the
 *    underlying Custom Element instance.
 */
export function createLitElementBridge<
  Props extends Record<string, any> = Record<string, any>,
  Element extends HTMLElement = HTMLElement,
>(
  tagOrOptions: string | LitBridgeOptions<Props>,
  maybeConfig?: LitBridgeConfig<Props>,
): LitElementComponent<Props, Element> {
  const { tagName, properties = [], events = {} } =
    typeof tagOrOptions === 'string'
      ? { tagName: tagOrOptions, ...maybeConfig }
      : tagOrOptions;

  const Bridge = React.forwardRef<Element, Props & React.HTMLAttributes<Element>>(
    function LitCustomElementBridge(props, forwardedRef) {
      const elementRef = React.useRef<Element | null>(null);

      // Synchronize properties directly on the DOM element instance and bind custom events
      React.useEffect(() => {
        const el = elementRef.current;
        if (!el) return;

        // Set complex properties directly on the DOM element instance
        for (const propKey of properties) {
          if (propKey in props) {
            (el as any)[propKey] = (props as any)[propKey];
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

      // Callback ref to capture element reference and forward to user ref
      const handleRef = React.useCallback(
        (node: Element | null) => {
          elementRef.current = node;
          setForwardedRef(forwardedRef, node);
        },
        [forwardedRef],
      );

      // Filter out properties and event props so they aren't stringified as HTML attributes
      const domProps: Record<string, any> = { ref: handleRef };
      for (const [key, value] of Object.entries(props)) {
        if (key === 'children') {
          domProps[key] = value;
        } else if (!properties.includes(key as any) && !(key in events)) {
          domProps[key] = value;
        }
      }

      return React.createElement(tagName, domProps);
    },
  );

  Bridge.displayName = `LitBridge(${tagName})`;
  return Bridge;
}

// Ergonomic aliases matching monorepo and ecosystem naming conventions
export { createLitElementBridge as createLitBridge };
export { createLitElementBridge as createCustomElementBridge };
