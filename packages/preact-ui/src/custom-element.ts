import type { ComponentType } from 'preact';
import { hydratePreact } from './hydrate.js';
import { mountPreact } from './mount.js';
import type { MountInstance } from './mount.js';
import type { HydrationInstance } from './hydrate.js';

/**
 * Context supplied to a `definePreactElement` setup callback.
 *
 * This is intentionally kept module-private. It is an author adapter detail,
 * not a consumer-facing component contract. The `setup` callback still gets
 * full contextual typing, so authors can use `context.root` and the FACE
 * helpers without importing or naming this type.
 */
interface PreactElementContext {
  /** The native ElementInternals associated with this element if formAssociated is true */
  internals?: ElementInternals | undefined;
  /**
   * The renderer-owned mount root exposed to the component adapter.
   *
   * This is an author-facing escape hatch for semantic commands such as
   * focus management. Consumers should use the element's public contract
   * instead of querying this root.
   */
  readonly root: HTMLElement;
  /** Requests a complete input snapshot update for the active connection session. */
  readonly requestUpdate: () => void;
  /** Sets the form value for submission and state restoration */
  setFormValue(value: File | string | FormData | null, state?: File | string | FormData | null): void;
  /** Sets the validity flags and validation message */
  setValidity(flags: ValidityStateFlags, message?: string, anchor?: HTMLElement): void;
}

export interface PreactElementLifecycle<Input> {
  /** The Preact view component to mount inside Shadow DOM */
  view: ComponentType<{ input: Input }>;
  /** Returns the current input snapshot for mount and update */
  getInput(): Input;
  /** Starts connection-session resources immediately before the renderer mounts. */
  onConnect?(): void;
  /** Releases connection-session resources immediately after the renderer unmounts. */
  onDisconnect?(): void;
  /** Optional handler for observed attribute changes */
  onAttributeChange?(name: string, oldValue: string | null, newValue: string | null): void;
  /** Optional cleanup callback for permanent teardown */
  onDestroy?(): void;
  /** Form lifecycle: called when the associated form is reset */
  onFormReset?(): void;
  /** Form lifecycle: called when the element or its parent fieldset is enabled/disabled */
  onFormDisabled?(disabled: boolean): void;
  /** Form lifecycle: called when the browser restores form state */
  onFormStateRestore?(state: unknown, mode: 'restore' | 'autocomplete'): void;
}

export interface PreactElementConfig<Input> {
  /** Custom Element tag name (must contain a hyphen, e.g. 'my-widget') */
  tagName: string;
  /** Scoped CSS string injected into the ShadowRoot */
  style?: string;
  /** List of HTML attributes to observe via attributeChangedCallback */
  observedAttributes?: readonly string[];
  /**
   * Public properties that may have been assigned before custom-element
   * definition. They are replayed through their prototype setters exactly
   * once before the first connection session mounts.
   */
  upgradeProperties?: readonly string[];
  /** When true, marks the custom element as Form-Associated (FACE) and enables ElementInternals */
  formAssociated?: boolean;
  /**
   * Hydrates a declarative Shadow DOM containing exactly one
   * `[data-preact-root]`. This is opt-in; arbitrary existing ShadowRoot
   * children are never adopted by the default mount path.
   */
  hydrateShadowRoot?: boolean;
  /** Factory invoked on element construction to set up signals, views, and handlers */
  setup(element: HTMLElement, context: PreactElementContext): PreactElementLifecycle<Input>;
}

export interface ManagedPreactElement<_Input> extends HTMLElement {
  readonly form: HTMLFormElement | null;
  name: string;
  readonly type: string;
  readonly validity: ValidityState | undefined;
  readonly validationMessage: string;
  readonly willValidate: boolean;
  checkValidity(): boolean;
  reportValidity(): boolean;
  setCustomValidity(message: string): void;
  updateInput(): void;
  dispose(): void;
}

/**
 * Optional convenience factory for a Preact Custom Element shell.
 *
 * This helper owns a ShadowRoot renderer and FACE forwarding. It does not
 * infer a component's public input/event semantics or connection-session
 * resources; component-specific adapters must define those contracts.
 */
export function definePreactElement<Input>(
  config: PreactElementConfig<Input>,
): CustomElementConstructor {
  if (typeof globalThis.customElements === 'undefined') {
    throw new Error('Custom elements require a browser environment');
  }

  if (customElements.get(config.tagName)) {
    throw new Error(`${config.tagName} is already registered`);
  }

  class ManagedElement extends HTMLElement implements ManagedPreactElement<Input> {
    static formAssociated = config.formAssociated ?? false;
    static observedAttributes = config.observedAttributes ? [...config.observedAttributes] : [];

    #root: HTMLElement;
    #mount: MountInstance<Input> | HydrationInstance<Input> | undefined;
    #lifecycle: PreactElementLifecycle<Input>;
    #internals: ElementInternals | undefined;
    #disposed = false;
    #sessionActive = false;
    #pendingUpgradeValues = new Map<string, unknown>();
    #hydrationPending = config.hydrateShadowRoot ?? false;

    constructor() {
      super();

      // Capture definition-time own data properties before the component
      // adapter has a chance to install its public accessors on this instance.
      // This keeps pre-upgrade assignments intact even when setup() exposes
      // per-instance getters/setters.
      for (const property of config.upgradeProperties ?? []) {
        const descriptor = Object.getOwnPropertyDescriptor(this, property);
        if (descriptor && !descriptor.get && !descriptor.set) {
          this.#pendingUpgradeValues.set(property, descriptor.value);
        }
      }

      if (config.formAssociated && typeof this.attachInternals === 'function') {
        try {
          this.#internals = this.attachInternals();
        } catch {
          // ElementInternals already attached or unsupported
        }
      }

      const existingShadow = this.shadowRoot;
      if (config.hydrateShadowRoot && !existingShadow) {
        throw new Error(`${config.tagName} requires a declarative ShadowRoot for hydration`);
      }
      if (!config.hydrateShadowRoot && existingShadow) {
        throw new Error(`${config.tagName} has an existing ShadowRoot; opt into hydrateShadowRoot explicitly`);
      }
      const shadow = existingShadow ?? this.attachShadow({ mode: 'open' });

      if (config.style && !config.hydrateShadowRoot) {
        const styleEl = this.ownerDocument.createElement('style');
        styleEl.textContent = config.style;
        shadow.append(styleEl);
      }

      const hydratedRoot = config.hydrateShadowRoot
        ? shadow.querySelector<HTMLElement>('[data-preact-root]')
        : null;
      if (config.hydrateShadowRoot && !hydratedRoot) {
        throw new Error(`${config.tagName} hydration requires a [data-preact-root]`);
      }
      this.#root = hydratedRoot ?? this.ownerDocument.createElement('div');
      if (!hydratedRoot) shadow.append(this.#root);

      const context: PreactElementContext = {
        internals: this.#internals,
        root: this.#root,
        requestUpdate: () => this.#updateMount(),
        setFormValue: (value, state) => {
          this.#internals?.setFormValue?.(value, state);
        },
        setValidity: (flags, message, anchor) => {
          this.#internals?.setValidity?.(flags, message, anchor);
        },
      };

      this.#lifecycle = config.setup(this, context);
    }

    // Standard Form-Associated Custom Elements API
    get form(): HTMLFormElement | null {
      return this.#internals?.form ?? null;
    }

    get name(): string {
      return this.getAttribute('name') ?? '';
    }

    set name(val: string) {
      this.setAttribute('name', val);
    }

    get type(): string {
      return this.getAttribute('type') ?? config.tagName;
    }

    get validity(): ValidityState | undefined {
      return this.#internals?.validity;
    }

    get validationMessage(): string {
      return this.#internals?.validationMessage ?? '';
    }

    get willValidate(): boolean {
      return this.#internals?.willValidate ?? false;
    }

    checkValidity(): boolean {
      return this.#internals?.checkValidity?.() ?? true;
    }

    reportValidity(): boolean {
      return this.#internals?.reportValidity?.() ?? true;
    }

    setCustomValidity(message: string): void {
      if (message) {
        this.#internals?.setValidity?.({ customError: true }, message);
      } else {
        this.#internals?.setValidity?.({});
      }
    }

    // Form lifecycle callbacks
    formResetCallback() {
      if (this.#disposed) return;
      this.#lifecycle.onFormReset?.();
    }

    formDisabledCallback(disabled: boolean) {
      if (this.#disposed) return;
      this.#lifecycle.onFormDisabled?.(disabled);
    }

    formStateRestoreCallback(state: unknown, mode: 'restore' | 'autocomplete') {
      if (this.#disposed) return;
      this.#lifecycle.onFormStateRestore?.(state, mode);
    }

    connectedCallback() {
      // A connection callback may be re-entered by setup code (for example
      // when an adapter moves the element while it is connecting). A live
      // session is already responsible for the root in that case.
      if (this.#disposed || this.#mount || this.#sessionActive) return;
      this.#upgradeProperties();
      // Property setters can synchronously dispose or disconnect the element
      // during the upgrade pass. Do not create a session after that happens.
      if (this.#disposed || this.#mount || this.#sessionActive || !this.isConnected) return;
      this.#sessionActive = true;
      try {
        this.#lifecycle.onConnect?.();
        // onConnect may dispose/disconnect/reconnect the element. A nested
        // connection owns the root if it already mounted one; the outer
        // callback must not create a second renderer or resurrect a terminal
        // element.
        if (this.#disposed || !this.#sessionActive || this.#mount || !this.isConnected) return;
        const input = this.#lifecycle.getInput();
        if (this.#disposed || !this.#sessionActive || this.#mount || !this.isConnected) return;
        this.#mount = this.#hydrationPending
          ? hydratePreact(this.#root, this.#lifecycle.view, input)
          : mountPreact(this.#root, this.#lifecycle.view, input);
        this.#hydrationPending = false;
      } catch (error) {
        const needsDisconnect = this.#sessionActive;
        this.#mount = undefined;
        this.#sessionActive = false;
        if (needsDisconnect) {
          try { this.#lifecycle.onDisconnect?.(); } catch (cleanupError) {
            throw new AggregateError([error, cleanupError], 'Custom element connection failed');
          }
        }
        throw error;
      }
    }

    #upgradeProperties() {
      for (const property of config.upgradeProperties ?? []) {
        let value: unknown;
        if (this.#pendingUpgradeValues.has(property)) {
          value = this.#pendingUpgradeValues.get(property);
          this.#pendingUpgradeValues.delete(property);
        } else {
          const descriptor = Object.getOwnPropertyDescriptor(this, property);
          // setup() may expose a per-instance accessor. It is already the
          // live property and must not be deleted during the upgrade pass.
          if (!descriptor || descriptor.get || descriptor.set) continue;
          value = descriptor.value;
          if (!Reflect.deleteProperty(this, property)) {
            throw new TypeError(`Cannot upgrade ${property}`);
          }
        }
        (this as unknown as Record<string, unknown>)[property] = value;
      }
    }

    disconnectedCallback() {
      // Unmount renderer only; preserve domain signals and state for reconnection
      const mount = this.#mount;
      this.#mount = undefined;
      let firstError: unknown;
      try { mount?.destroy(); } catch (error) { firstError = error; }
      if (this.#sessionActive) {
        this.#sessionActive = false;
        try { this.#lifecycle.onDisconnect?.(); } catch (error) {
          if (firstError) throw new AggregateError([firstError, error], 'Custom element disconnection failed');
          firstError = error;
        }
      }
      if (firstError) throw firstError;
    }

    #updateMount() {
      if (this.#disposed) return;
      const mount = this.#mount;
      if (!mount) return;

      try {
        mount.update(this.#lifecycle.getInput());
      } catch (error) {
        // A failed render terminates the current connection session. The
        // mount implementation normally performs this cleanup itself, but
        // retrying destroy here keeps the element safe if a custom backend
        // fails before it can release its root.
        this.#mount = undefined;
        const errors: unknown[] = [error];
        try { mount.destroy(); } catch (cleanupError) { errors.push(cleanupError); }

        if (this.#sessionActive) {
          this.#sessionActive = false;
          try { this.#lifecycle.onDisconnect?.(); } catch (disconnectError) {
            errors.push(disconnectError);
          }
        }

        if (errors.length > 1) {
          throw new AggregateError(errors, 'Custom element update failed');
        }
        throw error;
      }
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
      if (this.#disposed || oldValue === newValue) return;
      this.#lifecycle.onAttributeChange?.(name, oldValue, newValue);
      if (this.#disposed) return;
      this.#updateMount();
    }

    updateInput() {
      this.#updateMount();
    }

    dispose() {
      if (this.#disposed) return;
      this.#disposed = true;
      const errors: unknown[] = [];
      try {
        this.#internals?.setFormValue?.(null);
        this.#internals?.setValidity?.({});
      } catch (error) { errors.push(error); }
      try { this.disconnectedCallback(); } catch (error) { errors.push(error); }
      try { this.#lifecycle.onDestroy?.(); } catch (error) { errors.push(error); }
      if (errors.length === 1) throw errors[0];
      if (errors.length > 1) {
        throw new AggregateError(errors, 'Custom element disposal failed');
      }
    }
  }

  customElements.define(config.tagName, ManagedElement);
  return ManagedElement;
}
