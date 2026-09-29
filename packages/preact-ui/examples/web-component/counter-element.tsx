import { signal } from '@preact/signals';
import type { ReadonlySignal } from '@preact/signals';
import { mountPreact } from '../../src/index.js';
import type { MountInstance } from '../../src/index.js';

interface Input {
  count: ReadonlySignal<number>;
  disabled: ReadonlySignal<boolean>;
  increment(): void;
}

function CounterView({ input }: { input: Input }) {
  return <div>
    <output part="value">{input.count}</output>
    <button part="button" type="button" disabled={input.disabled.value}
      onClick={input.increment}>Increment</button>
  </div>;
}

/** Explicit registration; importing this module does not access HTMLElement. */
export function defineCounterElement(tagName = 'ca-counter') {
  if (typeof globalThis.customElements === 'undefined') {
    throw new Error('Custom elements require a browser environment');
  }
  if (customElements.get(tagName)) throw new Error(`${tagName} is already registered`);

  class CounterElement extends HTMLElement {
    static observedAttributes = ['disabled'];
    #count = signal(0);
    #disabled = signal(false);
    #root: HTMLElement;
    #mount: MountInstance<Input> | undefined;
    #upgraded = false;

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      const style = this.ownerDocument.createElement('style');
      style.textContent = ':host{display:block}button{margin-inline-start:1rem}';
      this.#root = this.ownerDocument.createElement('div');
      shadow.append(style, this.#root);
    }

    connectedCallback() {
      if (this.#mount) return;
      if (!this.#upgraded) {
        this.#upgraded = true;
        // Preserve properties assigned before customElements.define().
        for (const key of ['value', 'disabled'] as const) {
          if (Object.prototype.hasOwnProperty.call(this, key)) {
            const value = this[key];
            Reflect.deleteProperty(this, key);
            if (key === 'value') this.value = value as number;
            else this.disabled = value as boolean;
          }
        }
      }
      this.#mount = mountPreact(this.#root, CounterView, {
        count: this.#count,
        disabled: this.#disabled,
        increment: () => {
          if (this.disabled) return;
          this.value += 1;
          this.dispatchEvent(new CustomEvent('value-change', {
            detail: { value: this.value }, bubbles: true, composed: true,
          }));
        },
      });
    }

    disconnectedCallback() {
      const mount = this.#mount;
      this.#mount = undefined;
      mount?.destroy();
    }

    attributeChangedCallback(name: string, _old: string | null, value: string | null) {
      if (name === 'disabled') this.#disabled.value = value !== null;
    }

    get value() { return this.#count.peek(); }
    set value(value: number) {
      if (!Number.isFinite(value)) throw new RangeError('value must be finite');
      this.#count.value = value; // Programmatic input does not echo value-change.
    }
    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(value: boolean) { this.toggleAttribute('disabled', Boolean(value)); }

    focusIncrement(): boolean {
      if (!this.#mount) return false;
      const button = this.#root.querySelector('button');
      if (!button || button.disabled) return false;
      button.focus();
      return true;
    }
  }

  customElements.define(tagName, CounterElement);
  return CounterElement;
}
