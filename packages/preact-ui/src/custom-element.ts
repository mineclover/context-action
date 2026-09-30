import type { ComponentType } from 'preact';
import { mountPreact } from './mount.js';
import type { MountInstance } from './mount.js';

export interface PreactElementContext {
  /** The native ElementInternals associated with this element if formAssociated is true */
  internals?: ElementInternals | undefined;
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
  /** When true, marks the custom element as Form-Associated (FACE) and enables ElementInternals */
  formAssociated?: boolean;
  /** Factory invoked on element construction to set up signals, views, and handlers */
  setup(element: HTMLElement, context: PreactElementContext): PreactElementLifecycle<Input>;
}

export interface ManagedPreactElement<Input> extends HTMLElement {
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
    #mount: MountInstance<Input> | undefined;
    #lifecycle: PreactElementLifecycle<Input>;
    #internals: ElementInternals | undefined;
    #disposed = false;
    #sessionActive = false;

    constructor() {
      super();

      if (config.formAssociated && typeof this.attachInternals === 'function') {
        try {
          this.#internals = this.attachInternals();
        } catch {
          // ElementInternals already attached or unsupported
        }
      }

      const shadow = this.attachShadow({ mode: 'open' });

      if (config.style) {
        const styleEl = this.ownerDocument.createElement('style');
        styleEl.textContent = config.style;
        shadow.append(styleEl);
      }

      this.#root = this.ownerDocument.createElement('div');
      shadow.append(this.#root);

      const context: PreactElementContext = {
        internals: this.#internals,
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
      this.#lifecycle.onFormReset?.();
    }

    formDisabledCallback(disabled: boolean) {
      this.#lifecycle.onFormDisabled?.(disabled);
    }

    formStateRestoreCallback(state: unknown, mode: 'restore' | 'autocomplete') {
      this.#lifecycle.onFormStateRestore?.(state, mode);
    }

    connectedCallback() {
      if (this.#disposed) return;
      if (this.#mount) return;
      this.#sessionActive = true;
      try {
        this.#lifecycle.onConnect?.();
        this.#mount = mountPreact(
          this.#root,
          this.#lifecycle.view,
          this.#lifecycle.getInput(),
        );
      } catch (error) {
        this.#mount = undefined;
        this.#sessionActive = false;
        try { this.#lifecycle.onDisconnect?.(); } catch (cleanupError) {
          throw new AggregateError([error, cleanupError], 'Custom element connection failed');
        }
        throw error;
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
      if (this.#disposed) return;
      this.#disposed = true;
      this.disconnectedCallback();
      this.#lifecycle.onDestroy?.();
    }
  }

  customElements.define(config.tagName, ManagedElement);
  return ManagedElement;
}
