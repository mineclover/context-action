import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElementFacade, type ElementBridgeContract, type PublicActionMethods } from '../../src/element.js';
import { createReactElementBridge } from '../../src/element-react.js';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

class ContractElement extends HTMLElement {
  input: { count: number } | undefined = { count: 7 };
  #count = 0;
  get count() { return this.#count; }
  set count(value: number) {
    if (!Number.isFinite(value) || value < 0) throw new RangeError('Invalid count');
    this.#count = value;
  }
  get readOnly() { return 'fixed'; }
  increment() { return ++this.#count; }
}
customElements.define('shared-contract-probe', ContractElement);

class SynchronousSetterElement extends HTMLElement {
  #value = 0;
  get value() { return this.#value; }
  set value(next: number) {
    this.#value = next;
    this.dispatchEvent(new CustomEvent('value-change', { detail: next }));
  }
}
customElements.define('synchronous-setter-probe', SynchronousSetterElement);

interface Props {
  input?: { count: number } | undefined;
  onChange?: ((event: CustomEvent<number>) => void) | EventListenerObject | undefined;
}
interface SynchronousSetterProps {
  value?: number;
  onValueChange?: ((event: CustomEvent<number>) => void) | undefined;
}
const contract: ElementBridgeContract<Props, ContractElement> = {
  tagName: 'shared-contract-probe', properties: ['input'], events: { onChange: 'count-change' },
};

describe('shared Custom Element host contract', () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => { container = document.createElement('div'); document.body.append(container); root = createRoot(container); });
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
  const element = () => container.querySelector<ContractElement>('shared-contract-probe')!;

  it('preserves untouched defaults, assigns complex inputs by identity, and clears only previously assigned inputs', async () => {
    const Bridge = createReactElementBridge(React, contract);
    await act(async () => root.render(React.createElement(Bridge)));
    expect(element().input).toEqual({ count: 7 });
    const input = { count: 2 };
    await act(async () => root.render(React.createElement(Bridge, { input })));
    expect(element().input).toBe(input);
    expect(element().hasAttribute('input')).toBe(false);
    await act(async () => root.render(React.createElement(Bridge)));
    expect(element().input).toBeUndefined();
    element().input = { count: 9 }; // an unrelated owner after omission
    await act(async () => root.render(React.createElement(Bridge)));
    expect(element().input).toEqual({ count: 9 });
  });

  it('attaches event listeners before synchronous property setters run', async () => {
    const Bridge = createReactElementBridge<SynchronousSetterProps, SynchronousSetterElement>(React, {
      tagName: 'synchronous-setter-probe',
      properties: ['value'],
      events: { onValueChange: 'value-change' },
    });
    const onValueChange = vi.fn();
    await act(async () => root.render(React.createElement(React.StrictMode, null,
      React.createElement(Bridge, { value: 1, onValueChange }))));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0]![0].detail).toBe(1);

    const next = vi.fn();
    await act(async () => root.render(React.createElement(React.StrictMode, null,
      React.createElement(Bridge, { value: 2, onValueChange: next }))));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0]![0].detail).toBe(2);
  });

  it('reuses stable listeners, replaces changed handlers, preserves object receivers and cleans detached hosts', async () => {
    const Bridge = createReactElementBridge(React, contract);
    const first = vi.fn();
    await act(async () => root.render(React.createElement(Bridge, { onChange: first })));
    const host = element();
    const add = vi.spyOn(host, 'addEventListener');
    const remove = vi.spyOn(host, 'removeEventListener');
    await act(async () => root.render(React.createElement(Bridge, { onChange: first })));
    expect(add).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
    const receiver = { calls: 0, handleEvent() { this.calls++; } };
    await act(async () => root.render(React.createElement(Bridge, { onChange: receiver })));
    host.dispatchEvent(new CustomEvent('count-change', { detail: 1 }));
    expect(first).not.toHaveBeenCalled();
    expect(receiver.calls).toBe(1);
    expect(remove).toHaveBeenCalledTimes(1);
    await act(async () => root.render(React.createElement(Bridge)));
    host.dispatchEvent(new Event('count-change'));
    expect(receiver.calls).toBe(1);
    await act(async () => root.render(React.createElement(Bridge, { onChange: first })));
    await act(async () => root.render(null));
    host.dispatchEvent(new Event('count-change'));
    expect(first).not.toHaveBeenCalled();
  });

  it('tracks the default forwarded ref and disposes the old binding when the host is replaced', async () => {
    const Bridge = createReactElementBridge(React, contract);
    const forwardedRef = React.createRef<ContractElement>();
    const onChange = vi.fn();
    await act(async () => root.render(React.createElement(Bridge, {
      key: 'first', ref: forwardedRef, onChange,
    })));
    const firstHost = forwardedRef.current!;
    const remove = vi.spyOn(firstHost, 'removeEventListener');

    await act(async () => root.render(React.createElement(Bridge, {
      key: 'second', ref: forwardedRef, onChange,
    })));
    const secondHost = forwardedRef.current!;
    expect(secondHost).toBe(element());
    expect(secondHost).not.toBe(firstHost);
    expect(remove).toHaveBeenCalledTimes(1);

    firstHost.dispatchEvent(new Event('count-change'));
    expect(onChange).not.toHaveBeenCalled();
    secondHost.dispatchEvent(new Event('count-change'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('forwards raw callback refs from the host lifecycle without effect replay detachments', async () => {
    const Bridge = createReactElementBridge(React, contract);
    const invocations: (ContractElement | null)[] = [];
    const forwardedRef = (node: ContractElement | null) => { invocations.push(node); };

    await act(async () => root.render(React.createElement(Bridge, { ref: forwardedRef })));
    const firstHost = element();
    expect(invocations).toEqual([firstHost]);

    await act(async () => root.render(React.createElement(Bridge, { ref: forwardedRef, input: { count: 2 } })));
    expect(invocations).toEqual([firstHost]);

    await act(async () => root.render(React.createElement(Bridge, { key: 'replacement', ref: forwardedRef })));
    const secondHost = element();
    expect(invocations).toEqual([firstHost, null, secondHost]);
  });

  it('does not duplicate events under StrictMode and exposes only the configured facade', async () => {
    type Handle = Pick<ContractElement, 'count' | 'increment'>;
    const Bridge = createReactElementBridge<Props, ContractElement, Handle>(React, {
      ...contract, createHandle: createElementFacade<ContractElement, readonly ['count', 'increment']>(['count', 'increment']),
    });
    const ref = React.createRef<Handle>();
    const changed = vi.fn();
    await act(async () => root.render(React.createElement(React.StrictMode, null,
      React.createElement(Bridge, { ref, onChange: changed }))));
    const handle = ref.current!;
    expect(Object.isFrozen(handle)).toBe(true);
    expect(handle).not.toBeInstanceOf(HTMLElement);
    expect('shadowRoot' in handle).toBe(false);
    const command = handle.increment;
    expect(command).toBe(handle.increment);
    expect(command()).toBe(1);
    element().dispatchEvent(new CustomEvent('count-change', { detail: 1 }));
    expect(changed).toHaveBeenCalledTimes(1);

    await act(async () => root.render(null));
    expect(ref.current).toBeNull();
    expect(() => handle.increment()).toThrow(/not mounted/);
  });

  it('captures configuration at bridge creation and preserves HTML aliases and children', async () => {
    const properties: (keyof Props)[] = ['input'];
    const events = { onChange: 'count-change' };
    const Bridge = createReactElementBridge(React, { ...contract, properties, events });
    properties.length = 0; events.onChange = 'wrong-event';
    const changed = vi.fn();
    await act(async () => root.render(React.createElement(Bridge, {
      input: { count: 1 }, onChange: changed, className: 'host', 'aria-label': 'counter', children: 'slot text',
    })));
    expect(element().input).toEqual({ count: 1 });
    expect(element().getAttribute('class')).toBe('host');
    expect(element().textContent).toBe('slot text');
    expect(element().hasAttribute('onChange')).toBe(false);
    element().dispatchEvent(new Event('count-change'));
    expect(changed).toHaveBeenCalledTimes(1);
  });

  it('keeps invalid setter failures and readonly protection at the facade boundary', () => {
    const host = new ContractElement();
    const handle = createElementFacade<ContractElement, readonly ['count', 'readOnly']>(['count', 'readOnly'])(() => host);
    handle.count = 3;
    expect(() => { handle.count = -1; }).toThrow(RangeError);
    expect(handle.count).toBe(3);
    expect(() => Reflect.set(handle, 'readOnly', 'changed')).toThrow(TypeError);
  });

  it('retains best-effort Lit assignment without replacing the last valid value', async () => {
    const Bridge = createReactElementBridge<{ count: number }, ContractElement>(React, {
      tagName: contract.tagName, properties: ['count'],
    });
    await act(async () => root.render(React.createElement(Bridge, { count: -1 })));
    expect(element().count).toBe(0);
  });

  it('retains fail-fast Preact assignment as an explicit adapter policy', async () => {
    const Bridge = createReactElementBridge<{ count: number }, ContractElement>(React, {
      tagName: contract.tagName, properties: ['count'],
    }, 'throw');
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await expect(act(async () => root.render(React.createElement(Bridge, { count: -1 })))).rejects.toThrow(RangeError);
    } finally { errors.mockRestore(); }
  });
});

function typeContracts(methods: PublicActionMethods<{ save: { id: string }; reset: void; internal: number }, 'save' | 'reset', { save: number }>) {
  const result: Promise<number> = methods.save({ id: 'typed' });
  const reset: Promise<void> = methods.reset();
  // @ts-expect-error Internal commands must not escape the public handle.
  methods.internal(1);
  // @ts-expect-error Payload-less actions have no payload parameter.
  methods.reset(1);
  // @ts-expect-error Command payloads retain their declared shape.
  methods.save({ count: 1 });
  void [result, reset];
}
void typeContracts;
