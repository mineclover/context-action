import { mountPreact } from '../../src/mount.js';
import { createLayerPanelController } from './internal/controller.js';
import { emitSelectionRequest } from './internal/events.js';
import { createLayerPanelSession } from './internal/session.js';
import type { LayerPanelSession } from './internal/session.js';
import { LayerPanelView } from './internal/View.js';
import type { LayerItem, LayerPanelElement } from './public.js';

/** Explicit component registration. Importing this module requires no DOM. */
export function defineLayerPanel(tagName = 'ca-layer-panel'): { new(): LayerPanelElement } {
  if (typeof globalThis.customElements === 'undefined' || typeof globalThis.HTMLElement === 'undefined') {
    throw new Error('Custom elements require a browser environment');
  }
  if (customElements.get(tagName)) throw new Error(`${tagName} is already registered`);

  class LayerPanel extends HTMLElement {
    static observedAttributes = ['disabled'];
    #controller = createLayerPanelController();
    #root: HTMLElement;
    #session: LayerPanelSession | undefined;
    #upgraded = false;

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      this.#root = this.ownerDocument.createElement('div');
      shadow.append(this.#root);
    }

    connectedCallback() {
      if (!this.isConnected || (this.#session && !this.#session.destroyed)) return;
      if (!this.#upgraded) {
        this.#controller.setDisabled(this.hasAttribute('disabled'));
        // Initial attributes are applied before definition-time own properties.
        for (const key of ['items', 'selectedId', 'disabled'] as const) {
          if (Object.prototype.hasOwnProperty.call(this, key)) {
            const value: unknown = this[key];
            if (!Reflect.deleteProperty(this, key)) throw new TypeError(`Cannot upgrade ${key}`);
            if (key === 'items') this.items = value as readonly LayerItem[];
            else if (key === 'selectedId') this.selectedId = value as string | null;
            else this.disabled = value as boolean;
          }
        }
        this.#upgraded = true;
      }
      this.#session = createLayerPanelSession(this.#controller,
        input => mountPreact(this.#root, LayerPanelView, input),
        id => emitSelectionRequest(this, id));
    }

    disconnectedCallback() {
      const session = this.#session;
      this.#session = undefined;
      session?.destroy();
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
      if (name === 'disabled' && oldValue !== newValue) this.#controller.setDisabled(newValue !== null);
    }

    get items() { return this.#controller.getSnapshot().items; }
    set items(items: readonly LayerItem[]) { this.#controller.setItems(items); }
    get selectedId() { return this.#controller.getSnapshot().selectedId; }
    set selectedId(id: string | null) { this.#controller.setSelectedId(id); }
    get disabled() { return this.#controller.getSnapshot().disabled; }
    set disabled(value: boolean) {
      // Validate before reflecting; attribute callback is the single commit path.
      if (typeof value !== 'boolean') throw new TypeError('disabled must be boolean');
      this.toggleAttribute('disabled', value);
    }
    focusItem(id: string): boolean {
      if (typeof id !== 'string') throw new TypeError('id must be a string');
      return this.#session?.focusItem(id) ?? false;
    }
  }
  customElements.define(tagName, LayerPanel);
  return LayerPanel;
}
