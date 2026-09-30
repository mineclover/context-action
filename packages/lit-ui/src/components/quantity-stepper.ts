/**
 * @fileoverview Reference implementation of <lit-quantity-stepper> custom element.
 * Extends FormAssociatedLitElement for full native <form> and FormData participation,
 * constraint validation, form reset lifecycle, and Shadow DOM encapsulation.
 *
 * @implements view-layer
 * @implements web-component-primitive
 * @memberof core-concepts
 */

import { html, css, type PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { FormAssociatedLitElement } from '../form-associated-element.js';

/**
 * Event detail payload dispatched by <lit-quantity-stepper> on change and input events.
 */
export interface QuantityChangeEventDetail {
  value: number;
}

/**
 * Reference Form-Associated Custom Element providing a numerical stepper control.
 *
 * Features:
 * - Native <form> submission and `new FormData()` integration via `ElementInternals`.
 * - HTML5 constraint validation (`rangeUnderflow`, `rangeOverflow`, `stepMismatch`, `badInput`).
 * - Form reset lifecycle restoration via `onFormReset()`.
 * - Disabled and readonly state propagation.
 * - Increment / Decrement methods with step precision and boundary clamping.
 * - Standard CustomEvent dispatching (`change`, `input`, `quantity-change`) with `{ bubbles: true, composed: true }`.
 * - Fully encapsulated Shadow DOM styling with `::part(button)` and `::part(input)` styling hooks.
 */
@customElement('lit-quantity-stepper')
export class LitQuantityStepper extends FormAssociatedLitElement {
  static override styles = css`
    :host {
      display: inline-flex;
      vertical-align: middle;
      font-family: var(
        --stepper-font-family,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        'Segoe UI',
        Roboto,
        sans-serif
      );
      --_border-color: var(--stepper-border-color, #cbd5e1);
      --_focus-border-color: var(--stepper-focus-border-color, #3b82f6);
      --_invalid-border-color: var(--stepper-invalid-border-color, #ef4444);
      --_bg: var(--stepper-bg, #ffffff);
      --_btn-bg: var(--stepper-button-bg, #f8fafc);
      --_btn-hover-bg: var(--stepper-button-hover-bg, #e2e8f0);
      --_btn-active-bg: var(--stepper-button-active-bg, #cbd5e1);
      --_btn-color: var(--stepper-button-color, #334155);
      --_radius: var(--stepper-radius, 8px);
      --_font-size: var(--stepper-font-size, 14px);
      --_height: var(--stepper-height, 36px);
    }

    :host([disabled]) {
      opacity: 0.5;
      pointer-events: none;
      cursor: not-allowed;
    }

    :host([hidden]) {
      display: none !important;
    }

    .stepper {
      display: inline-flex;
      align-items: stretch;
      height: var(--_height);
      background: var(--_bg);
      border: 1px solid var(--_border-color);
      border-radius: var(--_radius);
      overflow: hidden;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      box-sizing: border-box;
    }

    .stepper.focused {
      border-color: var(--_focus-border-color);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }

    :host(:invalid) .stepper,
    .stepper.invalid {
      border-color: var(--_invalid-border-color);
    }

    :host(:invalid) .stepper.focused,
    .stepper.invalid.focused {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--_height);
      padding: 0;
      margin: 0;
      border: none;
      background: var(--_btn-bg);
      color: var(--_btn-color);
      font-size: calc(var(--_font-size) + 2px);
      font-weight: 600;
      cursor: pointer;
      user-select: none;
      transition: background-color 0.15s ease, color 0.15s ease;
      box-sizing: border-box;
    }

    button:hover:not(:disabled) {
      background: var(--_btn-hover-bg);
    }

    button:active:not(:disabled) {
      background: var(--_btn-active-bg);
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.4;
    }

    .btn-decrement {
      border-right: 1px solid var(--_border-color);
    }

    .btn-increment {
      border-left: 1px solid var(--_border-color);
    }

    input {
      width: 48px;
      padding: 0 6px;
      margin: 0;
      border: none;
      background: transparent;
      text-align: center;
      font-size: var(--_font-size);
      font-weight: 600;
      color: var(--stepper-text-color, #0f172a);
      font-family: inherit;
      box-sizing: border-box;
      -moz-appearance: textfield;
    }

    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    input:focus {
      outline: none;
    }
  `;

  /**
   * The current numerical value of the stepper.
   */
  @property({ type: Number })
  value = 1;

  /**
   * Minimum permissible value (inclusive).
   */
  @property({ type: Number })
  min = 1;

  /**
   * Maximum permissible value (inclusive).
   */
  @property({ type: Number })
  max = 99;

  /**
   * Step increment/decrement delta. Must be greater than 0.
   */
  @property({ type: Number })
  step = 1;

  /**
   * Whether the control prevents user modification while remaining form-submittable.
   */
  @property({ type: Boolean, reflect: true })
  readonly = false;

  /**
   * Default value used to restore state when the enclosing form is reset.
   */
  @property({ type: Number, attribute: 'default-value' })
  defaultValue?: number;

  @state()
  private focused = false;

  @query('input')
  private inputEl?: HTMLInputElement;

  #initialValue: number = 1;

  override connectedCallback(): void {
    super.connectedCallback();
    this.#initialValue = this.defaultValue ?? this.value;
    this.#syncFormState();
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);

    if (changedProperties.has('defaultValue') && this.defaultValue !== undefined) {
      this.#initialValue = this.defaultValue;
    }

    if (
      changedProperties.has('value') ||
      changedProperties.has('min') ||
      changedProperties.has('max') ||
      changedProperties.has('step') ||
      changedProperties.has('disabled')
    ) {
      this.#syncFormState();
    }
  }

  /**
   * Evaluates step alignment using floating-point safe division.
   */
  #checkStepMismatch(val: number, min: number, step: number): boolean {
    if (step <= 0 || Number.isNaN(val)) return false;
    const quotient = (val - min) / step;
    const rounded = Math.round(quotient);
    return Math.abs(quotient - rounded) > 1e-7;
  }

  /**
   * Formats a value for form submission and HTML input display,
   * preventing scientific notation drift.
   */
  #formatValue(val: unknown): string {
    if (typeof val === 'number') {
      if (Number.isNaN(val)) return 'NaN';
      if (Math.abs(val) < 1e-9) return '0';
      const str = String(val);
      if (str.includes('e-')) {
        return val.toFixed(10).replace(/\.?0+$/, '');
      }
      return str;
    }
    return String(val ?? '');
  }

  /**
   * Derives decimal precision from numbers to avoid IEEE 754 precision drift.
   */
  #getPrecision(...numbers: number[]): number {
    let maxDecimals = 0;
    for (const n of numbers) {
      if (!Number.isFinite(n)) continue;
      const str = n.toString();
      const dot = str.indexOf('.');
      if (dot !== -1) {
        maxDecimals = Math.max(maxDecimals, str.length - dot - 1);
      }
    }
    return Math.min(12, maxDecimals);
  }

  /**
   * Synchronizes internal value with ElementInternals form value and constraint validation.
   */
  #syncFormState(): void {
    // 1. Submit current value (string representation)
    this.setFormValue(this.#formatValue(this.value));

    // 2. Evaluate standard constraint validation
    const flags: Record<string, boolean> = {};
    let message = '';

    const rawVal: unknown = this.value;
    const isBlank = typeof rawVal === 'string' && rawVal.trim() === '';
    const num = isBlank ? Number.NaN : Number(this.value);

    if (isBlank || Number.isNaN(num)) {
      flags.badInput = true;
      message = 'Please enter a valid number.';
    } else if (num < this.min) {
      flags.rangeUnderflow = true;
      message = `Value must be greater than or equal to ${this.min}.`;
    } else if (num > this.max) {
      flags.rangeOverflow = true;
      message = `Value must be less than or equal to ${this.max}.`;
    } else if (this.#checkStepMismatch(num, this.min, this.step)) {
      flags.stepMismatch = true;
      message = `Value must be an increment of ${this.step} from ${this.min}.`;
    }

    const anchor =
      this.inputEl ??
      (this.renderRoot?.querySelector('input') as HTMLElement | undefined);
    this.setValidity(flags, message, anchor);
  }

  /**
   * Emits input, change, and quantity-change CustomEvents across Shadow DOM boundaries.
   */
  #emitEvents(triggerType: 'input' | 'change' | 'both'): void {
    const detail: QuantityChangeEventDetail = { value: this.value };

    if (triggerType === 'input' || triggerType === 'both') {
      this.dispatchEvent(
        new CustomEvent<QuantityChangeEventDetail>('input', {
          bubbles: true,
          composed: true,
          detail,
        })
      );
    }

    if (triggerType === 'change' || triggerType === 'both') {
      this.dispatchEvent(
        new CustomEvent<QuantityChangeEventDetail>('change', {
          bubbles: true,
          composed: true,
          detail,
        })
      );
      this.dispatchEvent(
        new CustomEvent<QuantityChangeEventDetail>('quantity-change', {
          bubbles: true,
          composed: true,
          detail,
        })
      );
    }
  }

  /**
   * Increments the current value by the configured step.
   * If at or above max, or if disabled/readonly, this operation is a no-op.
   */
  public increment(): void {
    if (this.disabled || this.readonly) return;
    const current = Number(this.value);
    if (Number.isNaN(current)) return;

    const precision = this.#getPrecision(this.step, current, this.max);
    const next = Number((current + this.step).toFixed(precision));
    if (next > this.max + 1e-9) return;

    const clamped = Math.abs(next - this.max) < 1e-9 ? this.max : Math.min(next, this.max);
    this.value = Math.abs(clamped) < 1e-9 ? 0 : clamped;
    this.#syncFormState();
    this.requestUpdate();
    this.#emitEvents('both');
  }

  /**
   * Decrements the current value by the configured step.
   * If at or below min, or if disabled/readonly, this operation is a no-op.
   */
  public decrement(): void {
    if (this.disabled || this.readonly) return;
    const current = Number(this.value);
    if (Number.isNaN(current)) return;

    const precision = this.#getPrecision(this.step, current, this.min);
    const next = Number((current - this.step).toFixed(precision));
    if (next < this.min - 1e-9) return;

    const clamped = Math.abs(next - this.min) < 1e-9 ? this.min : Math.max(next, this.min);
    this.value = Math.abs(clamped) < 1e-9 ? 0 : clamped;
    this.#syncFormState();
    this.requestUpdate();
    this.#emitEvents('both');
  }

  /**
   * Sets the value imperatively with optional event dispatching.
   *
   * @param val New numerical value.
   * @param options.dispatchEvents If true, emits `input` and `change` events.
   */
  public setValue(val: number, options?: { dispatchEvents?: boolean }): void {
    const num = typeof val === 'number' ? val : Number(val);
    this.value = num;
    this.#syncFormState();
    this.requestUpdate();

    if (options?.dispatchEvents) {
      this.#emitEvents('both');
    }
  }

  /**
   * Handles user input from the internal number input field.
   */
  #handleInput = (e: Event): void => {
    e.stopPropagation();
    const target = e.target as HTMLInputElement;
    const parsed = parseFloat(target.value);
    this.value = Number.isNaN(parsed) ? (target.value as any) : parsed;
    this.#syncFormState();
    this.#emitEvents('input');
  };

  /**
   * Handles commit / change from the internal number input field.
   */
  #handleChange = (e: Event): void => {
    e.stopPropagation();
    const target = e.target as HTMLInputElement;
    const parsed = parseFloat(target.value);
    this.value = Number.isNaN(parsed) ? (target.value as any) : parsed;
    this.#syncFormState();
    this.#emitEvents('change');
  };

  /**
   * Invoked by FormAssociatedLitElement when the parent form executes a reset.
   * Restores initial value, clears validation, and synchronizes form value.
   */
  protected override onFormReset(): void {
    this.value = this.defaultValue ?? this.#initialValue;
    this.#syncFormState();
    this.requestUpdate();
  }

  override render() {
    const isInvalid = !this.validity.valid;
    const current = Number(this.value);
    const isDecDisabled =
      this.disabled ||
      this.readonly ||
      Number.isNaN(current) ||
      current <= this.min + 1e-9;
    const isIncDisabled =
      this.disabled ||
      this.readonly ||
      Number.isNaN(current) ||
      current >= this.max - 1e-9;

    return html`
      <div
        class="stepper ${this.focused ? 'focused' : ''} ${isInvalid ? 'invalid' : ''}"
        role="group"
        aria-label=${this.getAttribute('aria-label') || 'Quantity Stepper'}
      >
        <button
          type="button"
          part="button button-decrement"
          class="btn-decrement"
          ?disabled=${isDecDisabled}
          @click=${this.decrement}
          tabindex="-1"
          aria-label="Decrease quantity"
        >−</button>
        <input
          type="number"
          part="input"
          .value=${this.#formatValue(this.value)}
          min=${this.min}
          max=${this.max}
          step=${this.step}
          ?disabled=${this.disabled}
          ?readonly=${this.readonly}
          @input=${this.#handleInput}
          @change=${this.#handleChange}
          @focus=${() => {
            this.focused = true;
          }}
          @blur=${() => {
            this.focused = false;
          }}
          aria-label="Quantity"
        />
        <button
          type="button"
          part="button button-increment"
          class="btn-increment"
          ?disabled=${isIncDisabled}
          @click=${this.increment}
          tabindex="-1"
          aria-label="Increase quantity"
        >+</button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lit-quantity-stepper': LitQuantityStepper;
  }
}
