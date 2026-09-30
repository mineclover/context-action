/**
 * @fileoverview Abstract Form-Associated Custom Element (FACE) base class extending LitElement.
 * Provides ElementInternals integration, standard constraint validation, form value management,
 * and robust form reset lifecycle hooks across browser and headless (JSDOM/SSR) environments.
 *
 * @implements view-layer
 * @implements web-component-primitive
 * @memberof core-concepts
 */

import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';

/**
 * Standard form validity flags as defined in the HTML Living Standard.
 */
export interface ValidityStateFlags {
  badInput?: boolean;
  customError?: boolean;
  patternMismatch?: boolean;
  rangeOverflow?: boolean;
  rangeUnderflow?: boolean;
  stepMismatch?: boolean;
  tooLong?: boolean;
  tooShort?: boolean;
  typeMismatch?: boolean;
  valueMissing?: boolean;
}

/**
 * Synthesizes an immutable ValidityState object from a set of ValidityStateFlags.
 * Used as a high-fidelity fallback when ElementInternals.validity is unavailable in the environment.
 */
function createSyntheticValidityState(flags: ValidityStateFlags): ValidityState {
  const badInput = !!flags.badInput;
  const customError = !!flags.customError;
  const patternMismatch = !!flags.patternMismatch;
  const rangeOverflow = !!flags.rangeOverflow;
  const rangeUnderflow = !!flags.rangeUnderflow;
  const stepMismatch = !!flags.stepMismatch;
  const tooLong = !!flags.tooLong;
  const tooShort = !!flags.tooShort;
  const typeMismatch = !!flags.typeMismatch;
  const valueMissing = !!flags.valueMissing;

  const valid = !(
    badInput ||
    customError ||
    patternMismatch ||
    rangeOverflow ||
    rangeUnderflow ||
    stepMismatch ||
    tooLong ||
    tooShort ||
    typeMismatch ||
    valueMissing
  );

  return {
    badInput,
    customError,
    patternMismatch,
    rangeOverflow,
    rangeUnderflow,
    stepMismatch,
    tooLong,
    tooShort,
    typeMismatch,
    valid,
    valueMissing,
  };
}

/**
 * Abstract Form-Associated Custom Element (FACE) base class extending LitElement.
 *
 * Provides:
 * - Native form participation via `ElementInternals` and `static formAssociated = true`
 * - Defensive fallbacks for server-side rendering (SSR) and headless test environments (JSDOM)
 * - Complete Form value management (`setFormValue`, `getFormValue`, `formValue`)
 * - Constraint validation APIs (`setValidity`, `validity`, `validationMessage`, `checkValidity`, `reportValidity`, `setCustomValidity`)
 * - Lifecycle callbacks (`formResetCallback`, `formDisabledCallback`, `formStateRestoreCallback`, `formAssociatedCallback`)
 * - Standard overridable hooks (`onFormReset`, `onFormDisabled`, `onFormStateRestore`, `onFormAssociated`)
 * - Automatic form reset event synchronization and leak-free unbinding on disconnect
 */
export class FormAssociatedLitElement extends LitElement {
  /**
   * Identifies this custom element as form-associated according to the HTML specification.
   * Enables the browser engine to attach ElementInternals and include this element in form submission.
   */
  static readonly formAssociated = true;

  /**
   * The ElementInternals controller instance for this custom element.
   * Undefined in environments where attachInternals is unsupported.
   */
  public readonly internals?: ElementInternals;

  // Reflected standard form control properties
  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String, reflect: true })
  type = 'custom-field';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  // Internal fallback state storage
  #formValue: File | string | FormData | null = null;
  #formState: unknown = null;
  #validityFlags: ValidityStateFlags = {};
  #validationMessage = '';
  #customError = false;
  #isResetting = false;
  #associatedForm: HTMLFormElement | null = null;

  constructor() {
    super();

    if (typeof this.attachInternals === 'function') {
      try {
        this.internals = this.attachInternals();
      } catch {
        // Defensive fallback: ElementInternals already attached, or environment throws NotSupportedError
      }
    }
  }

  // ==========================================
  // Form Association & Enclosing Form Queries
  // ==========================================

  /**
   * The associated HTMLFormElement, if any.
   * Resolves first via ElementInternals.form, then checks the 'form' attribute by ID,
   * and finally falls back to the closest ancestor <form>.
   */
  get form(): HTMLFormElement | null {
    if (this.internals && 'form' in this.internals && this.internals.form !== undefined) {
      return this.internals.form;
    }

    const formAttr = this.getAttribute('form');
    if (formAttr && this.ownerDocument) {
      const el = this.ownerDocument.getElementById(formAttr);
      if (el instanceof HTMLFormElement) return el;
    }

    return this.closest('form');
  }

  // ==========================================
  // Form Value APIs
  // ==========================================

  /**
   * Sets the element's form submission value and optional state restoration value.
   *
   * @param value The value to submit with the form: string, File, FormData, or null (clears submission).
   * @param state Optional state object used for session restoration / autocomplete.
   */
  public setFormValue(
    value: File | string | FormData | null,
    state?: File | string | FormData | null,
  ): void {
    this.#formValue = value;
    this.#formState = state;

    if (this.internals && typeof this.internals.setFormValue === 'function') {
      try {
        this.internals.setFormValue(value, state);
      } catch {
        // Defensive fallback if environment rejects parameters
      }
    }
  }

  /**
   * Returns the current form submission value.
   */
  public getFormValue(): File | string | FormData | null {
    return this.#formValue;
  }

  /**
   * Getter alias for getFormValue() for uniform property access.
   */
  public get formValue(): File | string | FormData | null {
    return this.#formValue;
  }

  /**
   * Returns the current state restoration object.
   */
  public get formState(): unknown {
    return this.#formState;
  }

  // ==========================================
  // Constraint Validation APIs
  // ==========================================

  /**
   * Sets the validity flags, validation error message, and optional anchor element.
   *
   * @param flags A map of ValidityStateFlags indicating constraint violations.
   * @param message A human-readable validation error message (required if any flag is true).
   * @param anchor An optional HTMLElement inside the element's ShadowRoot used to anchor browser tooltips.
   */
  public setValidity(
    flags: ValidityStateFlags = {},
    message?: string,
    anchor?: HTMLElement,
  ): void {
    this.#validityFlags = { ...flags };
    this.#validationMessage = message ?? '';
    this.#customError = !!flags.customError;

    if (this.internals && typeof this.internals.setValidity === 'function') {
      try {
        this.internals.setValidity(flags, message, anchor);
      } catch {
        // Defensive fallback
      }
    }
  }

  /**
   * Returns the current ValidityState object representing constraint validation status.
   */
  get validity(): ValidityState {
    if (this.internals && 'validity' in this.internals && this.internals.validity) {
      return this.internals.validity;
    }
    return createSyntheticValidityState({
      ...this.#validityFlags,
      customError: this.#validityFlags.customError || this.#customError,
    });
  }

  /**
   * Returns the current validation error message, or an empty string if valid.
   */
  get validationMessage(): string {
    if (
      this.internals &&
      'validationMessage' in this.internals &&
      typeof this.internals.validationMessage === 'string'
    ) {
      return this.internals.validationMessage;
    }
    return this.validity.valid ? '' : this.#validationMessage;
  }

  /**
   * Returns true if the element participates in constraint validation and is not disabled.
   */
  get willValidate(): boolean {
    if (
      this.internals &&
      'willValidate' in this.internals &&
      typeof this.internals.willValidate === 'boolean'
    ) {
      return this.internals.willValidate;
    }
    return !this.disabled;
  }

  /**
   * Checks whether the element satisfies all validation constraints.
   * If invalid, fires a cancelable 'invalid' event on the element and returns false.
   * If valid (or validation is disabled), returns true.
   */
  public checkValidity(): boolean {
    if (this.internals && typeof this.internals.checkValidity === 'function') {
      try {
        return this.internals.checkValidity();
      } catch {
        // Fall back to synthetic verification
      }
    }

    if (!this.willValidate) return true;

    if (!this.validity.valid) {
      const event = new Event('invalid', { bubbles: false, cancelable: true });
      this.dispatchEvent(event);
      return false;
    }

    return true;
  }

  /**
   * Checks validity, reports errors to the user (e.g. browser popup), and returns validity status.
   */
  public reportValidity(): boolean {
    if (this.internals && typeof this.internals.reportValidity === 'function') {
      try {
        return this.internals.reportValidity();
      } catch {
        // Fall back to checkValidity
      }
    }
    return this.checkValidity();
  }

  /**
   * Sets a custom validation error message. If message is non-empty, sets customError to true.
   * If message is empty, clears custom validity errors.
   */
  public setCustomValidity(message: string): void {
    if (message) {
      this.setValidity({ customError: true }, message);
    } else {
      this.setValidity({});
    }
  }

  // ==========================================
  // Form-Associated Lifecycle Callbacks & Hooks
  // ==========================================

  /**
   * Native FACE callback invoked by the browser engine when the associated form is reset.
   * Dispatches to the overridable onFormReset() hook.
   */
  public formResetCallback(): void {
    if (this.#isResetting) return;
    this.#isResetting = true;
    try {
      this.onFormReset();
    } finally {
      queueMicrotask(() => {
        this.#isResetting = false;
      });
    }
  }

  /**
   * Overridable lifecycle hook called when the associated form is reset.
   * Subclasses should restore default values, re-evaluate validation, and request updates.
   */
  protected onFormReset(): void {}

  /**
   * Native FACE callback invoked when the element or parent fieldset is disabled/enabled.
   */
  public formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
    this.onFormDisabled(disabled);
    this.requestUpdate();
  }

  /**
   * Overridable lifecycle hook called when the disabled state changes.
   */
  protected onFormDisabled(_disabled: boolean): void {}

  /**
   * Native FACE callback invoked when the browser restores form state (history navigation / autofill).
   */
  public formStateRestoreCallback(state: unknown, mode: 'restore' | 'autocomplete'): void {
    this.#formState = state;
    this.onFormStateRestore(state, mode);
  }

  /**
   * Overridable lifecycle hook called when the browser restores form state.
   */
  protected onFormStateRestore(_state: unknown, _mode: 'restore' | 'autocomplete'): void {}

  /**
   * Native FACE callback invoked when the element is associated or disassociated with a form.
   */
  public formAssociatedCallback(form: HTMLFormElement | null): void {
    this.#syncFormListener(form);
    this.onFormAssociated(form);
  }

  /**
   * Overridable lifecycle hook called when the element's form association changes.
   */
  protected onFormAssociated(_form: HTMLFormElement | null): void {}

  // ==========================================
  // Reset Event Coordination & Memory Safety
  // ==========================================

  #handleFormReset = (event: Event): void => {
    if (this.#isResetting || event.defaultPrevented) return;
    queueMicrotask(() => {
      if (this.#isResetting || event.defaultPrevented) return;
      this.formResetCallback();
    });
  };

  #syncFormListener(newForm: HTMLFormElement | null): void {
    if (this.#associatedForm === newForm) return;

    if (this.#associatedForm) {
      this.#associatedForm.removeEventListener('reset', this.#handleFormReset);
    }

    this.#associatedForm = newForm;

    if (this.#associatedForm) {
      this.#associatedForm.addEventListener('reset', this.#handleFormReset);
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.#syncFormListener(this.form);
  }

  override disconnectedCallback(): void {
    this.#syncFormListener(null);
    super.disconnectedCallback();
  }
}
