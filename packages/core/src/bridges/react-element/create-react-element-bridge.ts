import type * as React from 'react';
import type { ElementBinding, ElementBridgeContract } from '../../element/contracts.js';
import { createElementBinding } from '../../element/create-element-binding.js';
import type { ReactElementComponent } from './types.js';

function assignRef<T>(ref: React.ForwardedRef<T>, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as React.MutableRefObject<T | null>).current = value;
}

/** Opt-in host adapter; inject the consuming runtime rather than importing another hook dispatcher. */
export function createReactElementBridge<Props extends object = Record<string, unknown>, Element extends HTMLElement = HTMLElement, Handle = Element>(
  React: typeof import('react'),
  options: ElementBridgeContract<Props, Element, Handle>,
  assignmentErrors: 'ignore' | 'throw' = 'ignore',
): ReactElementComponent<Props, Element, Handle> {
  const useLayout = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;
  const { tagName, createHandle } = options;
  const properties = Array.from(new Set(options.properties ?? []));
  const propertySet = new Set<PropertyKey>(properties);
  const events = { ...options.events };
  const eventProps = new Set(Object.keys(events));
  const config = { properties, events };

  const Bridge = React.forwardRef<Handle, Props & Omit<React.HTMLAttributes<Element>, keyof Props>>(
    function ElementBridge(props, forwardedRef) {
      const elementRef = React.useRef<Element | null>(null);
      const [element, setElement] = React.useState<Element | null>(null);
      const bindingRef = React.useRef<{ element: Element; binding: ElementBinding<Props> } | null>(null);
      const rawForwardedRef = React.useRef<React.ForwardedRef<Handle>>(forwardedRef);
      const ref = React.useCallback((node: Element | null) => {
        if (bindingRef.current && bindingRef.current.element !== node) {
          bindingRef.current.binding.dispose();
          bindingRef.current = null;
        }
        elementRef.current = node;
        if (!createHandle) assignRef(rawForwardedRef.current, node as unknown as Handle | null);
        setElement(node);
      }, []);
      React.useImperativeHandle(
        createHandle ? forwardedRef : null,
        () => (createHandle ? createHandle(() => elementRef.current) : null) as unknown as Handle,
        [createHandle],
      );

      useLayout(() => {
        if (createHandle || rawForwardedRef.current === forwardedRef) return;
        const previousRef = rawForwardedRef.current;
        rawForwardedRef.current = forwardedRef;
        assignRef(previousRef, null);
        assignRef(forwardedRef, elementRef.current as unknown as Handle | null);
      }, [createHandle, element, forwardedRef]);

      useLayout(() => {
        const currentElement = elementRef.current;
        // Callback refs update state during commit. Wait for that state to
        // settle before binding so the initial mount and host replacement do
        // not reconcile the same snapshot against a stale element twice.
        if (!element || !currentElement || element !== currentElement) return;
        if (bindingRef.current?.element !== currentElement) {
          bindingRef.current?.binding.dispose();
          bindingRef.current = {
            element: currentElement,
            binding: createElementBinding<Props>(currentElement, config, { assignmentErrors }),
          };
        }
        bindingRef.current.binding.update(props as Props);
      }, [element, props]);

      React.useEffect(() => {
        const current = bindingRef.current;
        const currentElement = elementRef.current;
        if (currentElement && current?.element === currentElement) current.binding.updateEvents(props as Props);
      });

      // Effect replay only disconnects listeners. Terminal disposal here would
      // break StrictMode and lose the property-omission ledger on reconnect.
      React.useEffect(() => () => { bindingRef.current?.binding.disconnectEvents(); }, []);

      const domProps: Record<string, unknown> = { ref };
      for (const [key, value] of Object.entries(props)) {
        if (propertySet.has(key) || eventProps.has(key)) continue;
        domProps[key === 'className' ? 'class' : key === 'htmlFor' ? 'for' : key] = value;
      }
      return React.createElement(tagName, domProps);
    },
  );
  Bridge.displayName = `ElementBridge(${tagName})`;
  return Bridge;
}
