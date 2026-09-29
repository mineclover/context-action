import type { ComponentType } from 'preact';
import { mountPreact } from './mount.js';
import type { MountInstance } from './mount.js';

export interface PreactElementLifecycle<Input> {
  /** The Preact view component to mount inside Shadow DOM */
  view: ComponentType<{ input: Input }>;
  /** Returns the current input snapshot for mount and update */
  getInput(): Input;
  /** Optional handler for observed attribute changes */
  onAttributeChange?(name: string, oldValue: string | null, newValue: string | null): void;
  /** Optional cleanup callback for permanent teardown */
  onDestroy?(): void;
}

export interface PreactElementConfig<Input> {
  /** Custom Element tag name (must contain a hyphen, e.g. 'my-widget') */
  tagName: string;
  /** Scoped CSS string injected into the ShadowRoot */
  style?: string;
  /** List of HTML attributes to observe via attributeChangedCallback */
  observedAttributes?: readonly string[];
  /** Factory invoked on element construction to set up signals, views, and handlers */
  setup(element: HTMLElement): PreactElementLifecycle<Input>;
}

export interface ManagedPreactElement<Input> extends HTMLElement {
  updateInput(): void;
  dispose(): void;
}

/**
 * Standard factory for defining resilient Preact Custom Elements.
 * 
 * Guarantees:
 * 1. Shadow DOM encapsulation isolating the Preact renderer from host CSS
 * 2. Pre-upgrade property preservation
 * 3. Lifecycle decoupling: renderer unmounts on disconnect, domain state/signals persist across reconnect
 * 4. Idempotent registration
 */
export function definePreactElement<Input>(
  config: PreactElementConfig<Input>,
): CustomElementConstructor {
  if (typeof globalThis.customElements === 'undefined') {
    throw new Error('Custom elements require a browser environment');
  }

  const existing = customElements.get(config.tagName);
  if (existing) return existing;

  class ManagedElement extends HTMLElement implements ManagedPreactElement<Input> {
    static observedAttributes = config.observedAttributes ? [...config.observedAttributes] : [];

    #root: HTMLElement;
    #mount: MountInstance<Input> | undefined;
    #lifecycle: PreactElementLifecycle<Input>;
    #upgraded = false;

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });

      if (config.style) {
        const styleEl = this.ownerDocument.createElement('style');
        styleEl.textContent = config.style;
        shadow.append(styleEl);
      }

      this.#root = this.ownerDocument.createElement('div');
      shadow.append(this.#root);

      this.#lifecycle = config.setup(this);
    }

    connectedCallback() {
      if (this.#mount) return;

      if (!this.#upgraded) {
        this.#upgraded = true;
      }

      this.#mount = mountPreact(
        this.#root,
        this.#lifecycle.view,
        this.#lifecycle.getInput(),
      );
    }

    disconnectedCallback() {
      // Unmount renderer only; preserve domain signals and state for reconnection
      const mount = this.#mount;
      this.#mount = undefined;
      mount?.destroy();
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
      if (oldValue === newValue) return;
      this.#lifecycle.onAttributeChange?.(name, oldValue, newValue);
      if (this.#mount) {
        this.#mount.update(this.#lifecycle.getInput());
      }
    }

    updateInput() {
      if (this.#mount) {
        this.#mount.update(this.#lifecycle.getInput());
      }
    }

    dispose() {
      this.disconnectedCallback();
      this.#lifecycle.onDestroy?.();
    }
  }

  customElements.define(config.tagName, ManagedElement);
  return ManagedElement;
}
