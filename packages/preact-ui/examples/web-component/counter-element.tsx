import { signal } from '@preact/signals';
import type { ReadonlySignal } from '@preact/signals';
import { definePreactElement } from '../../src/custom-element.js';

interface Input {
  count: ReadonlySignal<number>;
  disabled: ReadonlySignal<boolean>;
  increment(): void;
}

export interface CounterElement extends HTMLElement {
  value: number;
  disabled: boolean;
  focusIncrement(): boolean;
}

function CounterView({ input }: { input: Input }) {
  return <div>
    <output part="value">{input.count}</output>
    <button part="button" type="button" disabled={input.disabled.value}
      onClick={input.increment}>Increment</button>
  </div>;
}

/** Explicit registration; importing this module does not access HTMLElement. */
export function defineCounterElement(tagName = 'ca-counter'): { new(): CounterElement } {
  return definePreactElement({
    tagName,
    style: ':host{display:block}button{margin-inline-start:1rem}',
    observedAttributes: ['disabled'],
    upgradeProperties: ['value', 'disabled'],
    setup(element, context) {
      const count = signal(0);
      const disabled = signal(element.hasAttribute('disabled'));

      Object.defineProperties(element, {
        value: {
          configurable: true,
          enumerable: true,
          get: () => count.peek(),
          set: (value: number) => {
            if (!Number.isFinite(value)) throw new RangeError('value must be finite');
            count.value = value; // Programmatic input does not echo value-change.
          },
        },
        disabled: {
          configurable: true,
          enumerable: true,
          get: () => element.hasAttribute('disabled'),
          set: (value: boolean) => {
            if (typeof value !== 'boolean') throw new TypeError('disabled must be boolean');
            element.toggleAttribute('disabled', value);
          },
        },
        focusIncrement: {
          configurable: true,
          enumerable: true,
          value() {
            const button = context.root.querySelector<HTMLButtonElement>('button');
            if (!button || button.disabled) return false;
            button.focus();
            return true;
          },
        },
      });

      return {
        view: CounterView,
        getInput: () => ({
          count,
          disabled,
          increment: () => {
            if (element.hasAttribute('disabled')) return;
            count.value += 1;
            element.dispatchEvent(new CustomEvent('value-change', {
              detail: { value: count.peek() }, bubbles: true, composed: true,
            }));
          },
        }),
        onAttributeChange(name) {
          if (name === 'disabled') disabled.value = element.hasAttribute('disabled');
        },
      };
    },
  }) as unknown as { new(): CounterElement };
}
