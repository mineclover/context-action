/**
 * @fileoverview React 18/19 bridge helper for consuming Lit Custom Elements.
 * Provides direct property assignment to bypass attribute stringification,
 * stable custom event listener mapping with deterministic cleanup, and
 * OOP Facade handle forwarding via `createHandle`.
 *
 * @implements view-layer
 * @implements web-component-primitive
 * @memberof core-concepts
 */

import * as React from 'react';
import type { ImperativeHandleFactory } from './facade.js';

export { createElementFacade } from './facade.js';
export type { ImperativeHandleFactory, PublicActionMethods } from './facade.js';

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

interface EventBinding {
  element: Element;
  eventName: string;
  handler: unknown;
  listener?: EventListener;
}

type EventHandlerValue =
  | ((event: Event) => void)
  | { handleEvent(event: Event): void };

function isEventHandler(value: unknown): value is EventHandlerValue {
  return (
    typeof value === 'function' ||
    (typeof value === 'object' &&
      value !== null &&
      typeof (value as { handleEvent?: unknown }).handleEvent === 'function')
  );
}

/**
 * Configuration options for the Lit React Bridge.
 * Controls direct property assignment, custom event mapping, and facade handles.
 */
export interface LitBridgeConfig<
  Props extends Record<string, any>,
  // `any` defaults keep a config annotated with only `LitBridgeConfig<Props>`
  // assignable to a bridge created with a concrete Element/Handle.
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  Element extends HTMLElement = any,
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  Handle = any,
> {
  /**
   * Property keys that should be assigned directly as DOM element properties
   * rather than rendered as HTML attributes.
   *
   * This is critical for React 18 compatibility, which stringifies complex objects,
   * arrays, functions, and class instances (such as Context-Action stores) to `"[object Object]"`.
   *
   * On a later render, a key previously assigned by the bridge and then omitted
   * from props is reset to `undefined` so stale objects never remain on the
   * element. Untouched element defaults are preserved, and read-only properties
   * are left to the element adapter's interpretation.
   */
  properties?: readonly (keyof Props)[];

  /**
   * Map of React prop handler names to native DOM CustomEvent names.
   *
   * Listeners are reconciled by handler identity: a re-render with the same
   * handler performs no DOM work, while a changed handler (or `undefined`)
   * removes and re-attaches only that event.
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

  /**
   * Optional factory for `useImperativeHandle` that encapsulates the underlying
   * `Element` and exposes only an object-oriented Facade handle to parent refs.
   * When omitted, the raw `Element` instance is forwarded for backward compatibility.
   *
   * Use `createElementFacade(['focusItem', 'scrollTo'])` for a zero-dependency
   * allow-list facade.
   */
  createHandle?: ImperativeHandleFactory<Element, Handle>;
}

/**
 * Options object signature for createLitElementBridge, including the custom element tagName.
 */
export interface LitBridgeOptions<
  Props extends Record<string, any>,
  Element extends HTMLElement = HTMLElement,
  Handle = Element,
> extends LitBridgeConfig<Props, Element, Handle> {
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
  Handle = Element,
> = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<Props & Omit<React.HTMLAttributes<Element>, keyof Props>> &
    React.RefAttributes<Handle>
>;

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
  Handle = Element,
>(
  tagName: string,
  config?: LitBridgeConfig<Props, Element, Handle>,
): LitElementComponent<Props, Element, Handle>;

/**
 * Overload 2: Single-argument options form `(options)`.
 *
 * @example
 * ```tsx
 * const ReactTimeline = createLitElementBridge<TimelineProps, TimelineElement, TimelineHandle>({
 *   tagName: 'st-timeline',
 *   properties: ['input', 'set'],
 *   events: { onSelectionChange: 'selection-change' },
 *   createHandle: createElementFacade(['focusItem', 'scrollTo', 'commitSelection']),
 * });
 * ```
 */
export function createLitElementBridge<
  Props extends Record<string, any> = Record<string, any>,
  Element extends HTMLElement = HTMLElement,
  Handle = Element,
>(
  options: LitBridgeOptions<Props, Element, Handle>,
): LitElementComponent<Props, Element, Handle>;

/**
 * Creates a type-safe React bridge component for consuming any Lit Custom Element
 * with seamless property synchronization, custom event listeners, and ref forwarding.
 *
 * Solves standard React ↔ Web Component pain points:
 * 1. Direct Property Assignment: Directly assigns objects, arrays, and stores to the DOM
 *    instance without stringifying to `"[object Object]"` in React 18/19.
 * 2. Property Removal: Clears keys removed from `properties` on later renders.
 * 3. Stable Custom Events: Attaches one listener per event and reads the latest
 *    handler, so ordinary re-renders never re-register listeners.
 * 4. Ref Forwarding: Forwards an OOP Facade handle (`createHandle`) or the raw
 *    Custom Element instance when no factory is provided.
 */
export function createLitElementBridge<
  Props extends Record<string, any> = Record<string, any>,
  Element extends HTMLElement = HTMLElement,
  Handle = Element,
>(
  tagOrOptions: string | LitBridgeOptions<Props, Element, Handle>,
  maybeConfig?: LitBridgeConfig<Props, Element, Handle>,
): LitElementComponent<Props, Element, Handle> {
  const {
    tagName,
    properties = [],
    events = {},
    createHandle,
  } =
    typeof tagOrOptions === 'string'
      ? { tagName: tagOrOptions, ...maybeConfig }
      : tagOrOptions;

  // Configuration is captured when the bridge component type is created, so these
  // collections are stable for the lifetime of this component type.
  const propertyKeys = Array.from(properties);
  const propertyKeySet = new Set<PropertyKey>(propertyKeys as readonly PropertyKey[]);
  const eventEntries = Object.entries(events);

  const Bridge = React.forwardRef<Handle, Props & Omit<React.HTMLAttributes<Element>, keyof Props>>(
    function LitCustomElementBridge(props, forwardedRef) {
      const elementRef = React.useRef<Element | null>(null);
      const [element, setElement] = React.useState<Element | null>(null);
      const appliedPropertiesRef = React.useRef<Set<PropertyKey>>(new Set());
      const appliedElementRef = React.useRef<Element | null>(null);
      const eventBindingsRef = React.useRef<EventBinding[]>([]);

      const handleRef = React.useCallback((node: Element | null) => {
        elementRef.current = node;
        setElement(node);
      }, []);

      React.useImperativeHandle(
        forwardedRef,
        () => {
          if (createHandle) {
            return createHandle(() => elementRef.current);
          }
          return elementRef.current as unknown as Handle;
        },
        [createHandle],
      );

      // Synchronize complex properties directly on the DOM element instance.
      // Runs before paint so the element never displays a stale snapshot.
      useIsomorphicLayoutEffect(() => {
        if (!element) return;

        if (appliedElementRef.current !== element) {
          appliedElementRef.current = element;
          appliedPropertiesRef.current = new Set();
        }

        const host = element as unknown as Record<PropertyKey, unknown>;
        const propsRecord = props as Record<PropertyKey, unknown>;
        const appliedProperties = appliedPropertiesRef.current;

        for (const propKey of propertyKeys) {
          if (propKey in propsRecord) {
            // Track ownership even when the element rejects the write so a
            // later removal still attempts to clear the bridge-owned value.
            appliedProperties.add(propKey);
            try {
              host[propKey] = propsRecord[propKey];
            } catch {
              // A read-only custom-element property may reject assignment;
              // its adapter remains responsible for interpreting the value.
            }
          } else if (appliedProperties.has(propKey)) {
            // React removed a property that this bridge previously assigned.
            // Clear it instead of leaving a stale object on the host, while
            // preserving untouched element defaults (for example `step`).
            try {
              host[propKey] = undefined;
            } catch {
              // A read-only custom-element property may reject assignment;
              // its adapter remains responsible for interpreting omission.
            } finally {
              appliedProperties.delete(propKey);
            }
          }
        }
      }, [element, props, propertyKeys]);

      // Attach one listener per event mapping. The effect reconciles by handler
      // identity: a re-render with the same handler does not touch the DOM,
      // while a changed handler (or `undefined`) removes the previous listener
      // and attaches the new one.
      // biome-ignore lint/correctness/useExhaustiveDependencies: This effect intentionally runs after every commit and compares handler identities before touching the DOM.
      React.useEffect(() => {
        if (!element) return;

        const previousBindings = eventBindingsRef.current;
        const nextBindings: EventBinding[] = [];
        const propsRecord = props as Record<string, unknown>;

        for (let index = 0; index < eventEntries.length; index++) {
          const entry = eventEntries[index]!;
          const [propHandlerName, customEventName] = entry;
          const handler = propsRecord[propHandlerName];
          const previous = previousBindings[index];

          if (
            previous &&
            previous.element === element &&
            previous.eventName === customEventName &&
            previous.handler === handler
          ) {
            nextBindings.push(previous);
            continue;
          }

          if (previous?.listener) {
            previous.element.removeEventListener(previous.eventName, previous.listener);
          }

          if (isEventHandler(handler)) {
            const listener = (event: Event) => {
              if (typeof handler === 'function') {
                handler(event);
              } else {
                handler.handleEvent(event);
              }
            };
            element.addEventListener(customEventName, listener);
            nextBindings.push({
              element,
              eventName: customEventName,
              handler,
              listener,
            });
          } else {
            nextBindings.push({
              element,
              eventName: customEventName,
              handler,
            });
          }
        }

        // Configuration is fixed per bridge, but release any trailing bindings
        // if a future implementation allows the mapping to shrink.
        for (let index = eventEntries.length; index < previousBindings.length; index++) {
          const stale = previousBindings[index]!;
          if (stale.listener) {
            stale.element.removeEventListener(stale.eventName, stale.listener);
          }
        }

        eventBindingsRef.current = nextBindings;
      });

      // Release every listener when the bridge element unmounts.
      React.useEffect(() => {
        return () => {
          for (const binding of eventBindingsRef.current) {
            if (binding.listener) {
              binding.element.removeEventListener(binding.eventName, binding.listener);
            }
          }
          eventBindingsRef.current = [];
        };
      }, []);

      // Filter out properties and event props so they aren't stringified as HTML attributes.
      // React 18 maps `className` to a `classname` attribute on unknown custom
      // elements, so normalize the standard aliases explicitly for both 18/19.
      const domProps: Record<string, unknown> = { ref: handleRef };
      for (const [key, value] of Object.entries(props)) {
        if (key === 'children') {
          domProps[key] = value;
        } else if (key === 'className') {
          domProps.class = value;
        } else if (key === 'htmlFor') {
          domProps.for = value;
        } else if (!propertyKeySet.has(key) && !(key in events)) {
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
