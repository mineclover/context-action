import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { FormAssociatedLitElement } from '../src/form-associated-element.js';

// Test component subclassing FormAssociatedLitElement
class TestInputElement extends FormAssociatedLitElement {
  #initialValue = 'default-val';

  @property({ type: String })
  value = 'default-val';

  override connectedCallback(): void {
    super.connectedCallback();
    this.setFormValue(this.value);
  }

  public updateValue(next: string): void {
    this.value = next;
    this.setFormValue(next);
    this.requestUpdate();
  }

  protected override onFormReset(): void {
    this.value = this.#initialValue;
    this.setFormValue(this.#initialValue);
    this.setValidity({});
    this.requestUpdate();
  }

  override render() {
    return html`<span data-testid="val">${this.value}</span>`;
  }
}

// Polyfill helper for FormData in JSDOM
function setupFormDataPolyfill(): () => void {
  const OriginalFormData = window.FormData;

  class PolyfilledFormData extends OriginalFormData {
    constructor(form?: HTMLFormElement, submitter?: HTMLElement | null) {
      super(form, submitter);
      if (form && typeof form.querySelectorAll === 'function') {
        const elements = form.querySelectorAll<HTMLElement>('*');
        for (const el of Array.from(elements)) {
          const ctor = el.constructor as any;
          if (ctor?.formAssociated) {
            const name = el.getAttribute('name') ?? (el as any).name;
            const disabled = el.hasAttribute('disabled') || (el as any).disabled;
            if (name && !disabled) {
              const val = typeof (el as any).getFormValue === 'function'
                ? (el as any).getFormValue()
                : (el as any).formValue ?? (el as any).value;
              if (val !== null && val !== undefined) {
                if (typeof OriginalFormData !== 'undefined' && val instanceof OriginalFormData) {
                  for (const [k, v] of val.entries()) {
                    this.append(k, v);
                  }
                } else {
                  this.append(name, val as string | Blob);
                }
              }
            }
          }
        }
      }
    }
  }

  window.FormData = PolyfilledFormData as any;
  return () => {
    window.FormData = OriginalFormData;
  };
}

describe('FormAssociatedLitElement (FACE Base Class)', () => {
  let restoreFormData: () => void;

  beforeEach(() => {
    restoreFormData = setupFormDataPolyfill();
    if (!customElements.get('test-input-element')) {
      customElements.define('test-input-element', TestInputElement);
    }
  });

  afterEach(() => {
    restoreFormData();
    document.body.replaceChildren();
  });

  it('declares static formAssociated = true and reflects standard attributes', () => {
    expect(FormAssociatedLitElement.formAssociated).toBe(true);

    const el = document.createElement('test-input-element') as TestInputElement;
    el.setAttribute('name', 'userEmail');
    el.setAttribute('type', 'email-custom');
    el.setAttribute('required', '');
    document.body.appendChild(el);

    expect(el.name).toBe('userEmail');
    expect(el.type).toBe('email-custom');
    expect(el.required).toBe(true);
    expect(el.disabled).toBe(false);
  });

  it('resolves associated form via ancestor form and form attribute ID', () => {
    // 1. Ancestor resolution
    const form1 = document.createElement('form');
    form1.id = 'form-1';
    const el1 = new TestInputElement();
    form1.appendChild(el1);
    document.body.appendChild(form1);

    expect(el1.form).toBe(form1);

    // 2. Explicit form attribute ID resolution
    const form2 = document.createElement('form');
    form2.id = 'form-2';
    document.body.appendChild(form2);

    const el2 = new TestInputElement();
    el2.setAttribute('form', 'form-2');
    document.body.appendChild(el2);

    expect(el2.form).toBe(form2);
  });

  it('manages form value submission and state via setFormValue', () => {
    const el = new TestInputElement();
    document.body.appendChild(el);

    el.setFormValue('custom-value-123', 'restore-state-456' as any);
    expect(el.getFormValue()).toBe('custom-value-123');
    expect(el.formValue).toBe('custom-value-123');
    expect(el.formState).toBe('restore-state-456');

    el.setFormValue(null);
    expect(el.getFormValue()).toBeNull();
  });

  it('manages constraint validation flags, messages, and invalid events', () => {
    const el = new TestInputElement();
    document.body.appendChild(el);

    // Initially valid
    expect(el.validity.valid).toBe(true);
    expect(el.validationMessage).toBe('');
    expect(el.willValidate).toBe(true);
    expect(el.checkValidity()).toBe(true);

    // Set constraint violation
    const invalidListener = vi.fn();
    el.addEventListener('invalid', invalidListener);

    el.setValidity({ valueMissing: true }, 'Field is required');

    expect(el.validity.valid).toBe(false);
    expect(el.validity.valueMissing).toBe(true);
    expect(el.validationMessage).toBe('Field is required');

    const isValid = el.checkValidity();
    expect(isValid).toBe(false);
    expect(invalidListener).toHaveBeenCalledTimes(1);

    // Report validity
    expect(el.reportValidity()).toBe(false);

    // Set custom validity
    el.setCustomValidity('Must be alphanumeric');
    expect(el.validity.customError).toBe(true);
    expect(el.validationMessage).toBe('Must be alphanumeric');

    // Clear validity
    el.setCustomValidity('');
    expect(el.validity.valid).toBe(true);
    expect(el.validity.customError).toBe(false);
    expect(el.validationMessage).toBe('');
    expect(el.checkValidity()).toBe(true);
  });

  it('updates willValidate when disabled state changes', () => {
    const el = new TestInputElement();
    document.body.appendChild(el);

    expect(el.willValidate).toBe(true);

    el.disabled = true;
    expect(el.willValidate).toBe(false);
    // Disabled elements always pass checkValidity
    expect(el.checkValidity()).toBe(true);

    el.disabled = false;
    expect(el.willValidate).toBe(true);
  });

  it('participates in native <form> and new FormData(form)', () => {
    const form = document.createElement('form');
    form.innerHTML = '<input name="nativeField" value="nativeVal" />';

    const customEl = new TestInputElement();
    customEl.setAttribute('name', 'customField');
    form.appendChild(customEl);
    document.body.appendChild(form);

    // Initial FormData
    let formData = new FormData(form);
    expect(formData.get('nativeField')).toBe('nativeVal');
    expect(formData.get('customField')).toBe('default-val');

    // Update custom element value
    customEl.updateValue('updated-val');
    formData = new FormData(form);
    expect(formData.get('customField')).toBe('updated-val');

    // Disabled element excluded from FormData
    customEl.disabled = true;
    formData = new FormData(form);
    expect(formData.get('customField')).toBeNull();

    customEl.disabled = false;
    formData = new FormData(form);
    expect(formData.get('customField')).toBe('updated-val');
  });

  it('triggers formResetCallback and restores value when form.reset() is called', async () => {
    const form = document.createElement('form');
    const customEl = new TestInputElement();
    customEl.setAttribute('name', 'itemQuantity');
    form.appendChild(customEl);
    document.body.appendChild(form);

    customEl.updateValue('modified-val');
    expect(customEl.getFormValue()).toBe('modified-val');
    expect(new FormData(form).get('itemQuantity')).toBe('modified-val');

    // Execute native form.reset()
    form.reset();

    // Allow microtask turn to complete
    await new Promise((r) => setTimeout(r, 0));

    expect(customEl.getFormValue()).toBe('default-val');
    expect(customEl.value).toBe('default-val');
    expect(new FormData(form).get('itemQuantity')).toBe('default-val');
  });

  it('supports direct invocation of formResetCallback()', () => {
    const customEl = new TestInputElement();
    document.body.appendChild(customEl);

    customEl.updateValue('different');
    expect(customEl.getFormValue()).toBe('different');

    customEl.formResetCallback();
    expect(customEl.getFormValue()).toBe('default-val');
  });

  it('handles formDisabledCallback and formStateRestoreCallback', () => {
    class CallbackInspector extends FormAssociatedLitElement {
      public disabledSpy = vi.fn();
      public restoreSpy = vi.fn();

      protected override onFormDisabled(disabled: boolean): void {
        this.disabledSpy(disabled);
      }

      protected override onFormStateRestore(state: unknown, mode: string): void {
        this.restoreSpy(state, mode);
      }
    }

    if (!customElements.get('callback-inspector')) {
      customElements.define('callback-inspector', CallbackInspector);
    }

    const inspector = new CallbackInspector();
    document.body.appendChild(inspector);

    inspector.formDisabledCallback(true);
    expect(inspector.disabled).toBe(true);
    expect(inspector.disabledSpy).toHaveBeenCalledWith(true);

    inspector.formStateRestoreCallback('restored-session-data', 'restore');
    expect(inspector.formState).toBe('restored-session-data');
    expect(inspector.restoreSpy).toHaveBeenCalledWith('restored-session-data', 'restore');
  });

  it('cleans up form reset listener on disconnect (zero memory leaks)', async () => {
    const form = document.createElement('form');
    const customEl = new TestInputElement();
    form.appendChild(customEl);
    document.body.appendChild(form);

    customEl.updateValue('initial-value');

    // Disconnect element from DOM
    customEl.remove();

    // Trigger reset on form
    form.reset();
    await new Promise((r) => setTimeout(r, 0));

    // Element should NOT have been reset because it was disconnected
    expect(customEl.getFormValue()).toBe('initial-value');
  });
});
