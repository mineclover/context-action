/** @evidenceExclude Tier 3 adapter/imperative-handle fixture; no durable domain DTO. */

import {
  createLitElementBridge,
  type LitBridgeOptions,
} from '@context-action/lit-ui/react-bridge';
import {
  createElementFacade,
  definePreactElement,
} from '@context-action/preact-ui';
import {
  type CustomElementBridgeOptions,
  createCustomElementBridge,
} from '@context-action/preact-ui/react-bridge';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { html, LitElement } from 'lit';
import { h } from 'preact';
import { act, createRef, type RefObject, useCallback } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  counterActions as actions,
  type CounterHandle,
  ElementInteropHandlerRegistry,
  type CounterInput as Input,
  type CounterBridgeProps as Props,
  type CounterRequestDetail as RequestDetail,
  counterRefs as refs,
} from './element-interop/ElementInteropHandlerRegistry';

// One semantic contract, implemented by two renderers, consumed by one host.
type CounterElement = HTMLElement & CounterHandle;
const normalize = (input: Input | undefined): Input => {
  const count = input?.count ?? 0;
  if (!Number.isSafeInteger(count) || count < 0)
    throw new RangeError('Invalid counter input');
  return Object.freeze({ count });
};
const request = (element: CounterElement) =>
  element.dispatchEvent(
    new CustomEvent<RequestDetail>('count-request', {
      detail: Object.freeze({ next: element.getSnapshot().count + 1 }),
      bubbles: true,
      composed: true,
    })
  );

definePreactElement<Input, CounterHandle>({
  tagName: 'interop-preact-counter',
  setup(element, context) {
    let input = normalize(undefined);
    const expose: CounterHandle = {
      get input() {
        return input;
      },
      set input(next) {
        input = normalize(next);
        context.requestUpdate();
      },
      getSnapshot: () => input,
      requestIncrement: () => {
        request(element as CounterElement);
      },
    };
    return {
      expose,
      getInput: () => input,
      view: ({ input: current }) =>
        h('output', { part: 'count' }, String(current.count)),
    };
  },
});

class LitCounter extends LitElement implements CounterHandle {
  #input = normalize(undefined);
  get input() {
    return this.#input;
  }
  set input(next: Input | undefined) {
    this.#input = normalize(next);
    this.requestUpdate();
  }
  getSnapshot() {
    return this.#input;
  }
  requestIncrement() {
    request(this);
  }
  render() {
    return html`<output part="count">${this.#input.count}</output>`;
  }
}
customElements.define('interop-lit-counter', LitCounter);

const config: Omit<
  CustomElementBridgeOptions<Props, CounterElement, CounterHandle>,
  'tagName'
> = {
  properties: ['input'],
  events: { onCountRequest: 'count-request' },
  createHandle: createElementFacade<
    CounterElement,
    readonly ['input', 'getSnapshot', 'requestIncrement']
  >(['input', 'getSnapshot', 'requestIncrement']),
};
const preactOptions: CustomElementBridgeOptions<
  Props,
  CounterElement,
  CounterHandle
> = { ...config, tagName: 'interop-preact-counter' };
// Cross-package interface assignability is checked, not just similar spellings.
const litOptions: LitBridgeOptions<Props, CounterElement, CounterHandle> = {
  ...preactOptions,
  tagName: 'interop-lit-counter',
};
const bridges = {
  preact: createCustomElementBridge(preactOptions),
  lit: createLitElementBridge(litOptions),
};

function Host({
  renderer,
  input,
  onCountRequest,
  captured,
}: Props & {
  renderer: keyof typeof bridges;
  captured: RefObject<CounterHandle | null>;
}) {
  const target = refs.useRefHandler('counter');
  const dispatch = actions.useActionDispatch();
  const Bridge = bridges[renderer];
  const ref = useCallback(
    (handle: CounterHandle | null) => {
      captured.current = handle;
      target.setRef(handle);
    },
    [captured, target.setRef]
  );
  return (
    <ElementInteropHandlerRegistry>
      <Bridge input={input} onCountRequest={onCountRequest} ref={ref} />
      <button type="button" onClick={() => void dispatch('increment')}>
        Request increment
      </button>
    </ElementInteropHandlerRegistry>
  );
}

afterEach(cleanup);
describe('renderer replacement through the same public interface', () => {
  it.each(['preact', 'lit'] as const)(
    '%s satisfies validation, request-only authority, confirmed input, reset and ref cleanup',
    async (renderer) => {
      const changed = vi.fn();
      const captured = createRef<CounterHandle>();
      const tree = (input: Input | undefined) => (
        <refs.Provider>
          <actions.Provider>
            <Host
              renderer={renderer}
              input={input}
              onCountRequest={changed}
              captured={captured}
            />
          </actions.Provider>
        </refs.Provider>
      );
      const view = render(tree({ count: 1 }));
      const handle = captured.current!;
      expect(handle.getSnapshot().count).toBe(1);
      expect(handle).not.toBeInstanceOf(HTMLElement);
      expect(Object.isFrozen(handle)).toBe(true);
      expect('shadowRoot' in handle).toBe(false);
      expect(changed).not.toHaveBeenCalled(); // no programmatic-input echo
      expect(() => {
        handle.input = { count: -1 };
      }).toThrow(RangeError);
      expect(handle.getSnapshot().count).toBe(1);
      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: 'Request increment' })
        );
      });
      expect(changed).toHaveBeenCalledTimes(1);
      const event = changed.mock.calls[0]![0] as CustomEvent<RequestDetail>;
      expect(event.detail).toEqual({ next: 2 });
      expect(Object.isFrozen(event.detail)).toBe(true);
      expect([event.bubbles, event.composed]).toEqual([true, true]);
      expect(handle.getSnapshot().count).toBe(1); // request is not a commit
      view.rerender(tree({ count: 2 }));
      expect(captured.current).toBe(handle);
      expect(handle.getSnapshot().count).toBe(2);
      view.rerender(tree(undefined));
      expect(handle.getSnapshot().count).toBe(0);
      expect(changed).toHaveBeenCalledTimes(1);
      view.unmount();
      expect(captured.current).toBeNull();
      expect(() => handle.requestIncrement()).toThrow(/not mounted/);
    }
  );

  it('replaces Preact with Lit without changing the host action/ref contract or retaining the old handle', async () => {
    const captured = createRef<CounterHandle>();
    const changed = vi.fn();
    const tree = (renderer: keyof typeof bridges) => (
      <refs.Provider>
        <actions.Provider>
          <Host
            renderer={renderer}
            input={{ count: 5 }}
            onCountRequest={changed}
            captured={captured}
          />
        </actions.Provider>
      </refs.Provider>
    );
    const view = render(tree('preact'));
    const old = captured.current!;
    view.rerender(tree('lit'));
    // Do not inspect a detached facade's deliberately throwing accessors.
    expect(captured.current !== old).toBe(true);
    expect(() => old.getSnapshot()).toThrow(/not mounted/);
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Request increment' })
      );
    });
    expect(changed).toHaveBeenCalledTimes(1);
    expect(changed.mock.calls[0]![0].detail).toEqual({ next: 6 });
  });
});
