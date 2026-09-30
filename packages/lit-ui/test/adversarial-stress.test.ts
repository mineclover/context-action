import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LitElement, html } from 'lit';
import { property } from 'lit/decorators.js';
import { ActionRegister } from '@context-action/core';
import type { ReadableStore } from '@context-action/lit';
import {
  FormAssociatedLitElement,
  type ValidityStateFlags,
} from '../src/form-associated-element.js';
import {
  actionRegisterContext,
  createStoreContext,
  provideActionRegister,
  provideStore,
  ContextStoreController,
  ContextActionController,
} from '../src/context.js';

// Polyfill helper for FormData in JSDOM supporting both child and attribute-associated FACE elements
function setupStressFormDataPolyfill(): () => void {
  const OriginalFormData = window.FormData;

  class PolyfilledFormData extends OriginalFormData {
    constructor(form?: HTMLFormElement, submitter?: HTMLElement | null) {
      super(form, submitter);
      if (form) {
        const candidateElements = new Set<HTMLElement>();

        // 1. Ancestor query
        if (typeof form.querySelectorAll === 'function') {
          form.querySelectorAll<HTMLElement>('*').forEach((el) => candidateElements.add(el));
        }

        // 2. ID-associated query (elements outside form with form="formId")
        if (form.id && form.ownerDocument) {
          form.ownerDocument
            .querySelectorAll<HTMLElement>(`[form="${form.id}"]`)
            .forEach((el) => candidateElements.add(el));
        }

        for (const el of candidateElements) {
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

// Trackable mock store for leak detection
function createTrackedStore<T>(initialValue: T): ReadableStore<T> & {
  setValue(val: T): void;
  getListenerCount(): number;
  listeners: Set<() => void>;
} {
  let current = initialValue;
  const listeners = new Set<() => void>();

  return {
    getValue: () => current,
    getSnapshot: () => current,
    setValue: (next: T) => {
      current = next;
      listeners.forEach((l) => l());
    },
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    getListenerCount: () => listeners.size,
    listeners,
  };
}

// Concrete FACE elements for stress testing
class StressInputControl extends FormAssociatedLitElement {
  @property({ type: String })
  initialValue = '';

  @property({ type: String })
  currentValue = '';

  resetCount = 0;

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.currentValue && this.initialValue) {
      this.currentValue = this.initialValue;
    }
    this.setFormValue(this.currentValue);
  }

  public setValue(next: string): void {
    this.currentValue = next;
    this.setFormValue(next);
    this.requestUpdate();
  }

  protected override onFormReset(): void {
    this.resetCount++;
    this.currentValue = this.initialValue;
    this.setFormValue(this.initialValue);
    this.setValidity({});
    this.requestUpdate();
  }

  override render() {
    return html`<span>${this.currentValue}</span>`;
  }
}

// Adversarial FACE element that triggers re-entrant resets
class RecursiveResetControl extends FormAssociatedLitElement {
  public resetCallCount = 0;
  public reentrantAttemptCount = 0;
  public initialVal = 'default-recursive';

  @property({ type: String })
  val = 'default-recursive';

  override connectedCallback(): void {
    super.connectedCallback();
    this.setFormValue(this.val);
  }

  protected override onFormReset(): void {
    this.resetCallCount++;
    this.val = this.initialVal;
    this.setFormValue(this.initialVal);

    // Adversarial attempt: invoke formResetCallback or form.reset inside onFormReset hook
    if (this.resetCallCount <= 3) {
      this.reentrantAttemptCount++;
      // This should be safely blocked by #isResetting guard
      this.formResetCallback();
      if (this.form) {
        this.form.reset();
      }
    }
  }
}

// Define custom elements once
if (!customElements.get('stress-input-control')) {
  customElements.define('stress-input-control', StressInputControl);
}
if (!customElements.get('recursive-reset-control')) {
  customElements.define('recursive-reset-control', RecursiveResetControl);
}

describe('M2 Adversarial Challenge & Stress Tests', () => {
  let restoreFormData: () => void;
  let container: HTMLDivElement;

  beforeEach(() => {
    restoreFormData = setupStressFormDataPolyfill();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    restoreFormData();
    container.remove();
    document.body.replaceChildren();
  });

  // =========================================================================
  // 1. Form Reset Stress
  // =========================================================================
  describe('1. Form Reset Stress', () => {
    it('handles multi-element forms: 50 custom FACE elements reset accurately in unison', async () => {
      const form = document.createElement('form');
      form.id = 'stress-multi-form';
      container.appendChild(form);

      const elements: StressInputControl[] = [];
      const COUNT = 50;

      // Instantiate 50 distinct FACE controls
      for (let i = 0; i < COUNT; i++) {
        const el = document.createElement('stress-input-control') as StressInputControl;
        el.setAttribute('name', `field_${i}`);
        el.initialValue = `initial_${i}`;
        el.currentValue = `initial_${i}`;
        form.appendChild(el);
        elements.push(el);
      }

      // Initial validation of initial FormData
      let formData = new FormData(form);
      for (let i = 0; i < COUNT; i++) {
        expect(formData.get(`field_${i}`)).toBe(`initial_${i}`);
      }

      // Mutate all 50 values
      for (let i = 0; i < COUNT; i++) {
        elements[i]!.setValue(`mutated_value_${i}`);
      }

      // Confirm all values were mutated
      formData = new FormData(form);
      for (let i = 0; i < COUNT; i++) {
        expect(formData.get(`field_${i}`)).toBe(`mutated_value_${i}`);
        expect(elements[i]!.currentValue).toBe(`mutated_value_${i}`);
      }

      // Execute form reset
      form.reset();
      await new Promise((r) => setTimeout(r, 10));

      // Assert all 50 elements accurately restored their exact initial value
      formData = new FormData(form);
      for (let i = 0; i < COUNT; i++) {
        expect(elements[i]!.resetCount).toBe(1);
        expect(elements[i]!.currentValue).toBe(`initial_${i}`);
        expect(elements[i]!.getFormValue()).toBe(`initial_${i}`);
        expect(formData.get(`field_${i}`)).toBe(`initial_${i}`);
      }
    });

    it('handles rapid consecutive form.reset() calls without deadlocks or unhandled exceptions', async () => {
      const form = document.createElement('form');
      const el = document.createElement('stress-input-control') as StressInputControl;
      el.setAttribute('name', 'rapidField');
      el.initialValue = 'start';
      el.currentValue = 'start';
      form.appendChild(el);
      container.appendChild(form);

      el.setValue('dirty');
      expect(el.currentValue).toBe('dirty');

      // Trigger 10 rapid synchronous reset calls
      for (let i = 0; i < 10; i++) {
        form.reset();
      }

      await new Promise((r) => setTimeout(r, 20));

      // After microtasks settle, element must be cleanly reset
      expect(el.currentValue).toBe('start');
      expect(el.getFormValue()).toBe('start');

      // Subsequent modification and reset must still work seamlessly
      el.setValue('dirty_again');
      expect(el.currentValue).toBe('dirty_again');

      form.reset();
      await new Promise((r) => setTimeout(r, 10));

      expect(el.currentValue).toBe('start');
      expect(el.getFormValue()).toBe('start');
    });

    it('prevents recursive re-entrancy stack overflow during form reset', async () => {
      const form = document.createElement('form');
      const el = document.createElement('recursive-reset-control') as RecursiveResetControl;
      el.setAttribute('name', 'recursiveField');
      form.appendChild(el);
      container.appendChild(form);

      el.val = 'dirty-recursive';
      el.setFormValue('dirty-recursive');

      // Calling form.reset() triggers onFormReset(), which internally re-invokes reset
      expect(() => {
        form.reset();
      }).not.toThrow();

      await new Promise((r) => setTimeout(r, 20));

      // Must terminate cleanly: re-entrant attempts were swallowed by guard
      expect(el.resetCallCount).toBe(1);
      expect(el.reentrantAttemptCount).toBe(1);
      expect(el.val).toBe('default-recursive');
      expect(el.getFormValue()).toBe('default-recursive');
    });

    it('dynamically switches form association via form attribute ID and unbinds cleanly', async () => {
      const formA = document.createElement('form');
      formA.id = 'form-alpha';
      const formB = document.createElement('form');
      formB.id = 'form-beta';
      container.appendChild(formA);
      container.appendChild(formB);

      // Element placed outside forms, referencing formA
      const el = document.createElement('stress-input-control') as StressInputControl;
      el.setAttribute('name', 'dynamicField');
      el.setAttribute('form', 'form-alpha');
      el.initialValue = 'alpha-val';
      el.currentValue = 'alpha-val';
      container.appendChild(el);

      expect(el.form).toBe(formA);

      // Mutate and reset Form A
      el.setValue('modified-alpha');
      formA.reset();
      await new Promise((r) => setTimeout(r, 10));
      expect(el.currentValue).toBe('alpha-val');

      // Switch association to Form B
      el.setAttribute('form', 'form-beta');
      el.formAssociatedCallback(formB); // Inform callback of switch
      expect(el.form).toBe(formB);

      el.setValue('modified-beta');
      // Resetting Form A must NOT affect el anymore
      formA.reset();
      await new Promise((r) => setTimeout(r, 10));
      expect(el.currentValue).toBe('modified-beta');

      // Resetting Form B MUST affect el
      formB.reset();
      await new Promise((r) => setTimeout(r, 10));
      expect(el.currentValue).toBe('alpha-val');
    });
  });

  // =========================================================================
  // 2. Context Shadow DOM Stress
  // =========================================================================
  describe('2. Context Shadow DOM Stress', () => {
    interface AppState {
      theme: string;
      version: number;
    }

    const appStoreContext = createStoreContext<AppState>('stress-app-state');

    // Provider custom element
    class StressProviderElement extends LitElement {
      store = createTrackedStore<AppState>({ theme: 'dark', version: 1 });
      actions = new ActionRegister<{ updateTheme: { theme: string } }>({
        name: 'stress-actions',
      });

      constructor() {
        super();
        provideStore(this, appStoreContext, this.store);
        provideActionRegister(this, this.actions);
      }

      override render() {
        return html`<slot></slot>`;
      }
    }

    // Shadow DOM nesting container element
    class NestedShadowContainer extends LitElement {
      override render() {
        return html`<div class="shadow-box"><slot></slot></div>`;
      }
    }

    // Leaf consumer inside deeply nested shadow DOM
    class DeepLeafConsumer extends LitElement {
      appStore = new ContextStoreController(this, {
        context: appStoreContext,
      });

      actions = new ContextActionController<{ updateTheme: { theme: string } }>(this, {
        context: actionRegisterContext,
      });

      renderCount = 0;

      override render() {
        this.renderCount++;
        return html`<span>${this.appStore.value?.theme ?? 'none'}:${this.appStore.value?.version ?? 0}</span>`;
      }
    }

    if (!customElements.get('stress-provider-element')) {
      customElements.define('stress-provider-element', StressProviderElement);
    }
    if (!customElements.get('nested-shadow-container')) {
      customElements.define('nested-shadow-container', NestedShadowContainer);
    }
    if (!customElements.get('deep-leaf-consumer')) {
      customElements.define('deep-leaf-consumer', DeepLeafConsumer);
    }

    it('penetrates 10 deeply nested Shadow DOM boundaries and maintains reactivity', async () => {
      const provider = document.createElement('stress-provider-element') as StressProviderElement;
      container.appendChild(provider);

      // Build 10-level nested hierarchy:
      // provider -> nested1 -> nested2 -> ... -> nested10 -> leaf
      let currentParent: HTMLElement = provider;
      const NEST_DEPTH = 10;
      for (let i = 0; i < NEST_DEPTH; i++) {
        const nest = document.createElement('nested-shadow-container') as NestedShadowContainer;
        currentParent.appendChild(nest);
        currentParent = nest;
      }

      const leaf = document.createElement('deep-leaf-consumer') as DeepLeafConsumer;
      currentParent.appendChild(leaf);

      await leaf.updateComplete;

      // Verify resolution across 10 shadow boundaries
      expect(leaf.appStore.isResolved).toBe(true);
      expect(leaf.appStore.value?.theme).toBe('dark');
      expect(leaf.appStore.value?.version).toBe(1);

      // Verify reactive update reaches leaf
      provider.store.setValue({ theme: 'light', version: 2 });
      await leaf.updateComplete;

      expect(leaf.appStore.value?.theme).toBe('light');
      expect(leaf.appStore.value?.version).toBe(2);
    });

    it('handles high-frequency store updates (300 rapid cycles) without losing state consistency', async () => {
      const provider = document.createElement('stress-provider-element') as StressProviderElement;
      const leaf = document.createElement('deep-leaf-consumer') as DeepLeafConsumer;
      provider.appendChild(leaf);
      container.appendChild(provider);

      await leaf.updateComplete;

      const CYCLES = 300;
      for (let i = 1; i <= CYCLES; i++) {
        provider.store.setValue({
          theme: i % 2 === 0 ? 'dark' : 'light',
          version: i,
        });
      }

      await leaf.updateComplete;

      expect(leaf.appStore.value?.version).toBe(CYCLES);
      expect(leaf.appStore.value?.theme).toBe(CYCLES % 2 === 0 ? 'dark' : 'light');
    });

    it('guarantees zero listener leaks over 50 rapid attach/detach cycles', async () => {
      const provider = document.createElement('stress-provider-element') as StressProviderElement;
      container.appendChild(provider);

      const leaf = document.createElement('deep-leaf-consumer') as DeepLeafConsumer;

      expect(provider.store.getListenerCount()).toBe(0);

      const CYCLES = 50;
      for (let i = 0; i < CYCLES; i++) {
        // Attach
        provider.appendChild(leaf);
        await leaf.updateComplete;
        expect(provider.store.getListenerCount()).toBe(1);

        // Detach
        leaf.remove();
        expect(provider.store.getListenerCount()).toBe(0);
      }

      // Final state: exactly 0 listeners retained
      expect(provider.store.getListenerCount()).toBe(0);
    });

    it('manages multiple concurrent consumers with zero leakage on selective detach', async () => {
      const provider = document.createElement('stress-provider-element') as StressProviderElement;
      container.appendChild(provider);

      const leaves: DeepLeafConsumer[] = [];
      const COUNT = 20;

      for (let i = 0; i < COUNT; i++) {
        const leaf = document.createElement('deep-leaf-consumer') as DeepLeafConsumer;
        provider.appendChild(leaf);
        leaves.push(leaf);
      }

      await Promise.all(leaves.map((l) => l.updateComplete));
      expect(provider.store.getListenerCount()).toBe(COUNT);

      // Remove half of them
      for (let i = 0; i < COUNT / 2; i++) {
        leaves[i]?.remove();
      }
      expect(provider.store.getListenerCount()).toBe(COUNT / 2);

      // Remove the remaining half
      for (let i = COUNT / 2; i < COUNT; i++) {
        leaves[i]?.remove();
      }
      expect(provider.store.getListenerCount()).toBe(0);
    });
  });

  // =========================================================================
  // 3. Form Value & Validation Stress
  // =========================================================================
  describe('3. Form Value & Validation Stress', () => {
    it('handles edge-case form values: empty string, null, unicode, and large payloads', () => {
      const el = document.createElement('stress-input-control') as StressInputControl;
      container.appendChild(el);

      // 1. Empty string
      el.setFormValue('');
      expect(el.getFormValue()).toBe('');
      expect(el.formValue).toBe('');

      // 2. null clears submission value
      el.setFormValue(null);
      expect(el.getFormValue()).toBeNull();

      // 3. Unicode and special characters
      const unicodeString = '🎉 🔥 🚀 100% 한글テスト & < > " \'';
      el.setFormValue(unicodeString);
      expect(el.getFormValue()).toBe(unicodeString);

      // 4. Large text payload (100,000 characters)
      const largePayload = 'A'.repeat(100_000);
      el.setFormValue(largePayload);
      expect(el.getFormValue()).toBe(largePayload);
      expect((el.getFormValue() as string).length).toBe(100_000);
    });

    it('handles complex nested FormData submissions in setFormValue', () => {
      const form = document.createElement('form');
      container.appendChild(form);

      const el = document.createElement('stress-input-control') as StressInputControl;
      el.setAttribute('name', 'complexControl');
      form.appendChild(el);

      // Pass a populated FormData object as the control value
      const innerFormData = new FormData();
      innerFormData.append('sub_key_1', 'val_alpha');
      innerFormData.append('sub_key_2', 'val_beta');

      el.setFormValue(innerFormData);
      expect(el.getFormValue()).toBe(innerFormData);

      // Verify that PolyfilledFormData flattens the nested FormData entries
      const outerFormData = new FormData(form);
      expect(outerFormData.get('sub_key_1')).toBe('val_alpha');
      expect(outerFormData.get('sub_key_2')).toBe('val_beta');
    });

    it('tests all ValidityStateFlags exhaustively and validates synthetic ValidityState consistency', () => {
      const el = document.createElement('stress-input-control') as StressInputControl;
      container.appendChild(el);

      const allFlags: (keyof ValidityStateFlags)[] = [
        'badInput',
        'customError',
        'patternMismatch',
        'rangeOverflow',
        'rangeUnderflow',
        'stepMismatch',
        'tooLong',
        'tooShort',
        'typeMismatch',
        'valueMissing',
      ];

      // Test each flag in isolation
      for (const flag of allFlags) {
        el.setValidity({ [flag]: true }, `Violation: ${flag}`);
        const validity = el.validity;

        expect(validity.valid).toBe(false);
        expect(validity[flag]).toBe(true);
        expect(el.validationMessage).toBe(`Violation: ${flag}`);
        expect(el.checkValidity()).toBe(false);

        // Reset
        el.setValidity({});
        expect(el.validity.valid).toBe(true);
        expect(el.validity[flag]).toBe(false);
        expect(el.validationMessage).toBe('');
        expect(el.checkValidity()).toBe(true);
      }

      // Test composite flags
      el.setValidity({ valueMissing: true, patternMismatch: true, customError: true }, 'Multiple violations');
      expect(el.validity.valid).toBe(false);
      expect(el.validity.valueMissing).toBe(true);
      expect(el.validity.patternMismatch).toBe(true);
      expect(el.validity.customError).toBe(true);
      expect(el.validity.rangeOverflow).toBe(false);
      expect(el.validationMessage).toBe('Multiple violations');
    });

    it('enforces that invalid event does NOT bubble, is cancelable, and is suppressed when disabled', () => {
      const form = document.createElement('form');
      container.appendChild(form);

      const el = document.createElement('stress-input-control') as StressInputControl;
      form.appendChild(el);

      const elInvalidSpy = vi.fn();
      const formInvalidSpy = vi.fn();

      el.addEventListener('invalid', (e) => {
        elInvalidSpy(e);
        expect(e.bubbles).toBe(false); // HTML spec constraint
        expect(e.cancelable).toBe(true);
      });

      form.addEventListener('invalid', formInvalidSpy);

      // Make invalid
      el.setValidity({ valueMissing: true }, 'Missing value');

      // 1. When enabled, checkValidity triggers invalid event on el, but NOT on form (no bubbling)
      const valid1 = el.checkValidity();
      expect(valid1).toBe(false);
      expect(elInvalidSpy).toHaveBeenCalledTimes(1);
      expect(formInvalidSpy).not.toHaveBeenCalled();

      // 2. When disabled: element does not participate in constraint validation (willValidate = false)
      el.disabled = true;
      expect(el.willValidate).toBe(false);

      // checkValidity must return true when disabled according to HTML spec, and must NOT fire invalid
      const valid2 = el.checkValidity();
      expect(valid2).toBe(true);
      expect(elInvalidSpy).toHaveBeenCalledTimes(1); // Still 1, not called again!

      // 3. Re-enable: validation re-activates
      el.disabled = false;
      expect(el.willValidate).toBe(true);
      const valid3 = el.checkValidity();
      expect(valid3).toBe(false);
      expect(elInvalidSpy).toHaveBeenCalledTimes(2);
    });

    it('honors event.preventDefault() on form reset (via capture phase or pre-attached listener) and aborts reset', async () => {
      const form = document.createElement('form');
      container.appendChild(form);

      // Cancel form reset by preventing default during capture phase (before bubble listeners)
      form.addEventListener(
        'reset',
        (e) => {
          e.preventDefault();
        },
        { capture: true }
      );

      const el = document.createElement('stress-input-control') as StressInputControl;
      el.setAttribute('name', 'cancellableField');
      el.initialValue = 'clean';
      el.currentValue = 'clean';
      form.appendChild(el);

      el.setValue('dirty');
      expect(el.currentValue).toBe('dirty');

      form.reset();
      await new Promise((r) => setTimeout(r, 10));

      // Must remain dirty because reset was cancelled in capture phase
      expect(el.currentValue).toBe('dirty');
      expect(el.resetCount).toBe(0);
    });
  });

  // =========================================================================
  // 4. Provider Dynamic Reconfiguration & Projection Stress
  // =========================================================================
  describe('4. Provider Dynamic Reconfiguration & Projection Stress', () => {
    interface UserState {
      user: { name: string; age: number };
      ui: { sidebarOpen: boolean };
    }

    const userStateContext = createStoreContext<UserState>('stress-user-state');

    class DynamicUserLeaf extends LitElement {
      // Selective projection targeting only user.name with string equality
      userName = new ContextStoreController(this, {
        context: userStateContext,
        selector: (s: UserState) => s.user.name,
      });

      renderCount = 0;

      override render() {
        this.renderCount++;
        return html`<span>${this.userName.value ?? 'anonymous'}</span>`;
      }
    }

    if (!customElements.get('dynamic-user-leaf')) {
      customElements.define('dynamic-user-leaf', DynamicUserLeaf);
    }

    it('switches between two distinct Store Providers without listener leakage', async () => {
      const storeA = createTrackedStore<UserState>({
        user: { name: 'Alice', age: 30 },
        ui: { sidebarOpen: false },
      });
      const storeB = createTrackedStore<UserState>({
        user: { name: 'Bob', age: 25 },
        ui: { sidebarOpen: true },
      });

      class ProviderA extends LitElement {
        constructor() {
          super();
          provideStore(this, userStateContext, storeA);
        }
        override render() {
          return html`<slot></slot>`;
        }
      }

      class ProviderB extends LitElement {
        constructor() {
          super();
          provideStore(this, userStateContext, storeB);
        }
        override render() {
          return html`<slot></slot>`;
        }
      }

      if (!customElements.get('provider-user-a')) customElements.define('provider-user-a', ProviderA);
      if (!customElements.get('provider-user-b')) customElements.define('provider-user-b', ProviderB);

      const provA = document.createElement('provider-user-a') as ProviderA;
      const provB = document.createElement('provider-user-b') as ProviderB;
      container.appendChild(provA);
      container.appendChild(provB);

      const leaf = document.createElement('dynamic-user-leaf') as DynamicUserLeaf;

      // 1. Connect under Provider A
      provA.appendChild(leaf);
      await leaf.updateComplete;

      expect(leaf.userName.value).toBe('Alice');
      expect(storeA.getListenerCount()).toBe(1);
      expect(storeB.getListenerCount()).toBe(0);

      // 2. Move to Provider B
      provB.appendChild(leaf);
      await leaf.updateComplete;

      expect(leaf.userName.value).toBe('Bob');
      expect(storeA.getListenerCount()).toBe(0); // Cleanly unsubscribed from Store A
      expect(storeB.getListenerCount()).toBe(1); // Subscribed to Store B

      // 3. Update Store A: leaf must NOT update
      storeA.setValue({ user: { name: 'AliceUpdated', age: 31 }, ui: { sidebarOpen: false } });
      await leaf.updateComplete;
      expect(leaf.userName.value).toBe('Bob');

      // 4. Update Store B: leaf MUST update
      storeB.setValue({ user: { name: 'Robert', age: 26 }, ui: { sidebarOpen: true } });
      await leaf.updateComplete;
      expect(leaf.userName.value).toBe('Robert');

      // 5. Disconnect leaf entirely
      leaf.remove();
      expect(storeA.getListenerCount()).toBe(0);
      expect(storeB.getListenerCount()).toBe(0);
    });

    it('suppresses redundant re-renders when unprojected store slices change', async () => {
      const store = createTrackedStore<UserState>({
        user: { name: 'Charlie', age: 40 },
        ui: { sidebarOpen: false },
      });

      class ProviderC extends LitElement {
        constructor() {
          super();
          provideStore(this, userStateContext, store);
        }
        override render() {
          return html`<slot></slot>`;
        }
      }

      if (!customElements.get('provider-user-c')) customElements.define('provider-user-c', ProviderC);

      const provC = document.createElement('provider-user-c') as ProviderC;
      const leaf = document.createElement('dynamic-user-leaf') as DynamicUserLeaf;
      provC.appendChild(leaf);
      container.appendChild(provC);

      await leaf.updateComplete;
      const initialRenders = leaf.renderCount;
      expect(leaf.userName.value).toBe('Charlie');

      // Mutate unprojected slice: ui.sidebarOpen and user.age (user.name stays 'Charlie')
      store.setValue({
        user: { name: 'Charlie', age: 41 },
        ui: { sidebarOpen: true },
      });
      await leaf.updateComplete;

      // Render count must remain unchanged because projected user.name did not change
      expect(leaf.renderCount).toBe(initialRenders);

      // Now mutate projected slice: user.name -> 'Chuck'
      store.setValue({
        user: { name: 'Chuck', age: 41 },
        ui: { sidebarOpen: true },
      });
      await leaf.updateComplete;

      // Render count must increment
      expect(leaf.userName.value).toBe('Chuck');
      expect(leaf.renderCount).toBeGreaterThan(initialRenders);
    });

    it('manages isPending and lastError state during action dispatch lifecycle', async () => {
      const actions = new ActionRegister<{
        failingAction: { msg: string };
        successAction: { count: number };
      }>({ name: 'action-lifecycle-test' });

      actions.register(
        'failingAction',
        async (payload) => {
          throw new Error(`Pipeline failed: ${payload.msg}`);
        },
        { errorPolicy: 'fatal' }
      );

      actions.register('successAction', async (payload) => {
        return payload.count * 2;
      });

      class ActionProviderHost extends LitElement {
        constructor() {
          super();
          provideActionRegister(this, actions);
        }
        override render() {
          return html`<slot></slot>`;
        }
      }

      type TestActions = {
        failingAction: { msg: string };
        successAction: { count: number };
      };

      class ActionConsumerChild extends LitElement {
        controller = new ContextActionController<TestActions>(this, {
          context: actionRegisterContext as any,
        });

        override render() {
          return html`<span>Action Consumer</span>`;
        }
      }

      if (!customElements.get('action-provider-host')) {
        customElements.define('action-provider-host', ActionProviderHost);
      }
      if (!customElements.get('action-consumer-child')) {
        customElements.define('action-consumer-child', ActionConsumerChild);
      }

      const host = document.createElement('action-provider-host') as ActionProviderHost;
      const child = document.createElement('action-consumer-child') as ActionConsumerChild;
      host.appendChild(child);
      container.appendChild(host);
      await child.updateComplete;

      expect(child.controller.isPending).toBe(false);
      expect(child.controller.lastError).toBeUndefined();

      // Test error handling
      await expect(
        child.controller.dispatch('failingAction', { msg: 'critical error' })
      ).rejects.toThrow('Pipeline failed: critical error');

      expect(child.controller.isPending).toBe(false); // Reset to false in finally
      expect(child.controller.lastError?.message).toBe('Pipeline failed: critical error');

      // Test success
      const result = await child.controller.dispatchWithResult('successAction', { count: 21 });
      expect((result as any).result).toBe(42);
      expect((result as any).success).toBe(true);
      expect(child.controller.isPending).toBe(false);
    });
  });
});
