/**
 * @module custom-element
 *
 * Purpose:
 *   Defines standards-compliant Preact Custom Elements (`definePreactElement<Input, Expose>`)
 *   with Shadow DOM isolation, Form-Associated Custom Element (FACE) integration,
 *   pre-upgrade property replay, and declarative public API installation (`expose`).
 *
 * Invariants:
 *   - Strictly separates **Instance Lifetime** (`setup` → `onDestroy` via `dispose()`)
 *     from **Connection Session Lifetime** (`onConnect` → `onDisconnect` on DOM
 *     attach/detach), preserving instance state across DOM moves.
 *   - Validates `expose` descriptors against `ManagedElement.prototype` at
 *     construction time (`ExposeContract<Expose>`), failing closed and running
 *     `onDestroy()` before any member is installed if a reserved key collides.
 *   - Reentrancy-safe connection lifecycle: if `upgradeProperties`, `onConnect`,
 *     or `getInput` synchronously disconnects or disposes the element, no ghost
 *     renderer mount is created.
 */
import type { ComponentType } from 'preact';
import { hydratePreact } from './hydrate.js';
import type { HydrationInstance } from './hydrate.js';
import { mountPreact } from './mount.js';
import type { MountInstance } from './mount.js';

export { createElementFacade } from './facade.js';
export type { ImperativeHandleFactory, PublicActionMethods } from './facade.js';

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

export interface PreactElementLifecycle<
  Input,
  Expose extends object = Record<never, never>,
> {
  /** The Preact view component to mount inside Shadow DOM */
  view: ComponentType<{ input: Input }>;
  /** Returns the current input snapshot for mount and update */
  getInput(): Input;
  /** Optional public properties and methods installed onto the custom element instance */
  expose?: Expose & ThisType<HTMLElement & Expose>;
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

export interface PreactElementConfig<
  Input,
  Expose extends object = Record<never, never>,
> {
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
  setup(element: HTMLElement, context: PreactElementContext): PreactElementLifecycle<Input, Expose>;
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

export type PreactCustomElementConstructor<
  Input,
  Expose extends object = Record<never, never>,
> = CustomElementConstructor & {
  // biome-ignore lint/suspicious/noExplicitAny: standard constructor signature compatibility.
  new (...args: any[]): ManagedPreactElement<Input> & Expose;
};

/**
 * Members that `expose` must never redefine: the `HTMLElement` platform
 * surface plus the managed FACE/lifecycle API (`dispose`, `updateInput`,
 * `name`, `form`, `checkValidity`, ...). Shadowing them would silently break
 * teardown, form participation, or platform semantics.
 */
export type ReservedElementKey = keyof ManagedPreactElement<unknown>;

/**
 * Self-referential constraint that rejects `expose` contracts declaring a
 * {@link ReservedElementKey}. Non-reserved members keep their declared type.
 */
export type ExposeContract<Expose> = {
  [K in keyof Expose]: K extends ReservedElementKey ? never : Expose[K];
};

function capturePendingUpgradeProperties(
  instance: HTMLElement,
  upgradeProperties: readonly string[] | undefined,
): Map<string, unknown> {
  const pendingValues = new Map<string, unknown>();
  for (const property of upgradeProperties ?? []) {
    const descriptor = Object.getOwnPropertyDescriptor(instance, property);
    if (descriptor && !descriptor.get && !descriptor.set) {
      pendingValues.set(property, descriptor.value);
    }
  }
  return pendingValues;
}

function replayUpgradeProperties(
  instance: HTMLElement,
  upgradeProperties: readonly string[] | undefined,
  pendingValues: Map<string, unknown>,
): void {
  for (const property of upgradeProperties ?? []) {
    let value: unknown;
    const descriptor = Object.getOwnPropertyDescriptor(instance, property);
    if (pendingValues.has(property)) {
      value = pendingValues.get(property);
      pendingValues.delete(property);
      if (descriptor && !descriptor.get && !descriptor.set) {
        if (!Reflect.deleteProperty(instance, property)) {
          throw new TypeError(`Cannot upgrade ${property}`);
        }
      }
    } else {
      // setup() may expose a per-instance accessor. It is already the
      // live property and must not be deleted during the upgrade pass.
      if (!descriptor || descriptor.get || descriptor.set) continue;
      value = descriptor.value;
      if (!Reflect.deleteProperty(instance, property)) {
        throw new TypeError(`Cannot upgrade ${property}`);
      }
    }
    (instance as unknown as Record<string, unknown>)[property] = value;
  }
}

function resolveShadowMountRoot<Input, Expose extends object>(
  instance: HTMLElement,
  config: PreactElementConfig<Input, Expose>,
): HTMLElement {
  const existingShadow = instance.shadowRoot;
  if (config.hydrateShadowRoot && !existingShadow) {
    throw new Error(`${config.tagName} requires a declarative ShadowRoot for hydration`);
  }
  if (!config.hydrateShadowRoot && existingShadow) {
    throw new Error(`${config.tagName} has an existing ShadowRoot; opt into hydrateShadowRoot explicitly`);
  }
  const shadow = existingShadow ?? instance.attachShadow({ mode: 'open' });

  if (config.style && !config.hydrateShadowRoot) {
    const styleEl = instance.ownerDocument.createElement('style');
    styleEl.textContent = config.style;
    shadow.append(styleEl);
  }

  const hydratedRoot = config.hydrateShadowRoot
    ? shadow.querySelector<HTMLElement>('[data-preact-root]')
    : null;
  if (config.hydrateShadowRoot && !hydratedRoot) {
    throw new Error(`${config.tagName} hydration requires a [data-preact-root]`);
  }
  const root = hydratedRoot ?? instance.ownerDocument.createElement('div');
  if (!hydratedRoot) shadow.append(root);
  return root;
}

function installExposedMembers<Input, Expose extends object>(
  instance: HTMLElement,
  tagName: string,
  lifecycle: PreactElementLifecycle<Input, Expose>,
  prototype: object,
): void {
  const exposed = lifecycle.expose;
  if (!exposed) return;

  const descriptors = Object.getOwnPropertyDescriptors(exposed);
  const keys = Reflect.ownKeys(descriptors);
  // Validate the complete contract first so a rejected element never
  // ends up with a partially installed public surface.
  const reserved = keys.filter((key) => key in prototype);
  if (reserved.length > 0) {
    const error = new TypeError(
      `${tagName} expose cannot redefine reserved element member(s): ${reserved.map(String).join(', ')}`,
    );
    try {
      lifecycle.onDestroy?.();
    } catch (cleanupError) {
      throw new AggregateError([error, cleanupError], 'Custom element construction failed');
    }
    throw error;
  }
  for (const key of keys) {
    const descriptor = descriptors[key as keyof typeof descriptors];
    if (!descriptor) continue;
    Object.defineProperty(instance, key, {
      ...descriptor,
      configurable: descriptor.configurable ?? true,
      enumerable: descriptor.enumerable ?? true,
    });
  }
}

/**
 * Optional convenience factory for a Preact Custom Element shell.
 *
 * This helper owns a ShadowRoot renderer and FACE forwarding. It does not
 * infer a component's public input/event semantics or connection-session
 * resources; component-specific adapters must define those contracts.
 *
 * `expose` members are validated against the element prototype chain at
 * construction time. A reserved member throws a `TypeError` before any public
 * member is installed, and `onDestroy` is invoked so setup-owned resources are
 * released.
 */
export function definePreactElement<
  Input,
  Expose extends object & ExposeContract<Expose> = Record<never, never>,
>(
  config: PreactElementConfig<Input, Expose>,
): PreactCustomElementConstructor<Input, Expose> {
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
    #lifecycle: PreactElementLifecycle<Input, Expose>;
    #internals: ElementInternals | undefined;
    #disposed = false;
    #sessionActive = false;
    #pendingUpgradeValues: Map<string, unknown>;
    #hydrationPending = config.hydrateShadowRoot ?? false;

    constructor() {
      super();

      // Capture definition-time own data properties before the component
      // adapter has a chance to install its public accessors on this instance.
      this.#pendingUpgradeValues = capturePendingUpgradeProperties(
        this,
        config.upgradeProperties,
      );

      if (config.formAssociated && typeof this.attachInternals === 'function') {
        try {
          this.#internals = this.attachInternals();
        } catch {
          // ElementInternals already attached or unsupported
        }
      }

      this.#root = resolveShadowMountRoot(this, config);

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
      installExposedMembers(this, config.tagName, this.#lifecycle, ManagedElement.prototype);
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

    /**
     * Tears down the active connection session (`#mount` + `onDisconnect`)
     * while preserving instance-level state for future reconnections.
     */
    #teardownSession(): unknown[] {
      const errors: unknown[] = [];
      const mount = this.#mount;
      this.#mount = undefined;
      try {
        mount?.destroy();
      } catch (error) {
        errors.push(error);
      }
      if (this.#sessionActive) {
        this.#sessionActive = false;
        try {
          this.#lifecycle.onDisconnect?.();
        } catch (error) {
          errors.push(error);
        }
      }
      return errors;
    }

    connectedCallback() {
      // A connection callback may be re-entered by setup code (for example
      // when an adapter moves the element while it is connecting). A live
      // session is already responsible for the root in that case.
      if (this.#disposed || this.#mount || this.#sessionActive) return;
      replayUpgradeProperties(this, config.upgradeProperties, this.#pendingUpgradeValues);
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
        const cleanupErrors = this.#teardownSession();
        if (cleanupErrors.length > 0) {
          throw new AggregateError([error, ...cleanupErrors], 'Custom element connection failed');
        }
        throw error;
      }
    }

    disconnectedCallback() {
      // Unmount renderer only; preserve domain signals and state for reconnection
      const errors = this.#teardownSession();
      if (errors.length === 1) throw errors[0];
      if (errors.length > 1) {
        throw new AggregateError(errors, 'Custom element disconnection failed');
      }
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
        const cleanupErrors = this.#teardownSession();
        if (cleanupErrors.length > 0) {
          throw new AggregateError([error, ...cleanupErrors], 'Custom element update failed');
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
      } catch (error) {
        errors.push(error);
      }
      errors.push(...this.#teardownSession());
      try {
        this.#lifecycle.onDestroy?.();
      } catch (error) {
        errors.push(error);
      }
      if (errors.length === 1) throw errors[0];
      if (errors.length > 1) {
        throw new AggregateError(errors, 'Custom element disposal failed');
      }
    }
  }

  customElements.define(config.tagName, ManagedElement);
  return ManagedElement as unknown as PreactCustomElementConstructor<Input, Expose>;
}
