/**
 * @fileoverview Standalone integration test suite for reference custom elements:
 * - <lit-quantity-stepper> (Form-Associated Custom Element, FACE)
 * - <lit-cart-badge> (Reactive Store-Subscribed Custom Element)
 * - React Bridge Integration (createLitElementBridge for React 18/19)
 * - Tier 4 Real-World E-Commerce Storefront & Multi-Island Scenarios
 *
 * Implements the 4-Tier Test Architecture (TEST_INFRA.md):
 * - Tier 1: Category-Partition (Feature Functionality)
 * - Tier 2: Boundary Value Analysis (Min, Max, Step, Clamping, Zero, Overflow)
 * - Tier 3: Cross-Feature Combinations & Lifecycle Integrity
 * - Tier 4: Real-World Workload Scenarios (Storefront, Validation, Zero-Leak, React 19, Deep Shadow DOM)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { html, LitElement } from 'lit';
import { ActionRegister } from '@context-action/core';
import type { ReadableStore } from '@context-action/lit';
import {
  LitQuantityStepper,
  LitCartBadge,
  cartStoreContext,
  createStoreContext,
  provideStore,
  provideActionRegister,
  createLitElementBridge,
  defaultCartCountSelector,
} from '../src/index.js';

// Configure React 18/19 act testing environment
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// ============================================================================
// Test Helpers & Polyfills
// ============================================================================

/**
 * Polyfill helper for FormData in JSDOM environment.
 * Ensures new FormData(form) queries both direct child controls and controls
 * associated via the HTML5 form="formId" attribute.
 */
function setupFormDataPolyfill(): () => void {
  const OriginalFormData = window.FormData;

  class PolyfilledFormData extends OriginalFormData {
    constructor(form?: HTMLFormElement, submitter?: HTMLElement | null) {
      super(form, submitter);
      if (form) {
        const candidateElements = new Set<HTMLElement>();

        // 1. Direct form descendant elements
        if (typeof form.querySelectorAll === 'function') {
          form.querySelectorAll<HTMLElement>('*').forEach((el) => candidateElements.add(el));
        }

        // 2. Elements referencing form via form attribute ID
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
              const val =
                typeof (el as any).getFormValue === 'function'
                  ? (el as any).getFormValue()
                  : (el as any).formValue ?? (el as any).value;
              if (val !== null && val !== undefined) {
                if (typeof OriginalFormData !== 'undefined' && val instanceof OriginalFormData) {
                  for (const [k, v] of val.entries()) {
                    this.append(k, v);
                  }
                } else {
                  this.append(name, String(val));
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

/**
 * Mock store helper tracking active subscriber counts for deterministic leak verification.
 */
function createTrackedStore<T>(initialValue: T): ReadableStore<T> & {
  setValue(val: T): void;
  update(fn: (prev: T) => T): void;
  getListenerCount(): number;
} {
  let val = initialValue;
  const listeners = new Set<() => void>();

  return {
    getValue: () => val,
    getSnapshot: () => val,
    setValue: (next: T) => {
      val = next;
      listeners.forEach((l) => l());
    },
    update: (fn: (prev: T) => T) => {
      val = fn(val);
      listeners.forEach((l) => l());
    },
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    getListenerCount: () => listeners.size,
  };
}

// React Bridge Component Definitions
interface ReactStepperBridgeProps {
  id?: string;
  name?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  disabled?: boolean;
  readonly?: boolean;
  onChange?: (e: CustomEvent<{ value: number }>) => void;
  onInput?: (e: CustomEvent<{ value: number }>) => void;
  onQuantityChange?: (e: CustomEvent<{ value: number }>) => void;
  children?: React.ReactNode;
}

const ReactQuantityStepper = createLitElementBridge<ReactStepperBridgeProps, LitQuantityStepper>(
  'lit-quantity-stepper',
  {
    properties: ['value', 'min', 'max', 'step', 'disabled', 'readonly'],
    events: {
      onChange: 'change',
      onInput: 'input',
      onQuantityChange: 'quantity-change',
    },
  }
);

interface ReactCartBadgeBridgeProps {
  id?: string;
  store?: ReadableStore<any>;
  label?: string;
  maxCount?: number;
  hideZero?: boolean;
  value?: number;
  disabled?: boolean;
  onCartBadgeClick?: (e: CustomEvent<{ count: number; isPending: boolean }>) => void;
  children?: React.ReactNode;
}

const ReactCartBadge = createLitElementBridge<ReactCartBadgeBridgeProps, LitCartBadge>(
  'lit-cart-badge',
  {
    properties: ['store', 'maxCount', 'hideZero', 'value', 'label', 'disabled'],
    events: {
      onCartBadgeClick: 'cart-badge-click',
    },
  }
);

// ============================================================================
// Main Integration Test Suite
// ============================================================================

describe('Milestone 4 Reference Elements Integration Suite', () => {
  let container: HTMLDivElement;
  let restoreFormData: () => void;

  beforeEach(() => {
    restoreFormData = setupFormDataPolyfill();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    restoreFormData();
    container.remove();
    document.body.replaceChildren();
  });

  // =========================================================================
  // Suite 1: <lit-quantity-stepper> (Form-Associated Custom Element)
  // =========================================================================
  describe('1. <lit-quantity-stepper> Form-Associated Element', () => {
    describe('Tier 1: Feature Functionality & DOM Encapsulation', () => {
      it('registers lit-quantity-stepper custom element and initializes default state', () => {
        expect(customElements.get('lit-quantity-stepper')).toBe(LitQuantityStepper);

        const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
        expect(stepper.value).toBe(1);
        expect(stepper.min).toBe(1);
        expect(stepper.max).toBe(99);
        expect(stepper.step).toBe(1);
        expect(stepper.disabled).toBe(false);
        expect(stepper.readonly).toBe(false);
      });

      it('renders encapsulated Shadow DOM structure with decrement, increment, and input controls', async () => {
        const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
        container.appendChild(stepper);
        await stepper.updateComplete;

        const shadowRoot = stepper.shadowRoot!;
        const decBtn = shadowRoot.querySelector('.btn-decrement') as HTMLButtonElement;
        const incBtn = shadowRoot.querySelector('.btn-increment') as HTMLButtonElement;
        const input = shadowRoot.querySelector('input') as HTMLInputElement;

        expect(decBtn).not.toBeNull();
        expect(incBtn).not.toBeNull();
        expect(input).not.toBeNull();
        expect(input.value).toBe('1');
        expect(input.getAttribute('type')).toBe('number');
      });

      it('increments and decrements value on button clicks, reflecting in Shadow DOM input', async () => {
        const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
        stepper.value = 5;
        container.appendChild(stepper);
        await stepper.updateComplete;

        const decBtn = stepper.shadowRoot!.querySelector('.btn-decrement') as HTMLButtonElement;
        const incBtn = stepper.shadowRoot!.querySelector('.btn-increment') as HTMLButtonElement;
        const input = stepper.shadowRoot!.querySelector('input') as HTMLInputElement;

        // Click increment
        incBtn.click();
        await stepper.updateComplete;

        expect(stepper.value).toBe(6);
        expect(input.value).toBe('6');

        // Click decrement
        decBtn.click();
        await stepper.updateComplete;

        expect(stepper.value).toBe(5);
        expect(input.value).toBe('5');
      });

      it('dispatches input, change, and quantity-change CustomEvents on user interaction', async () => {
        const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
        stepper.value = 3;
        container.appendChild(stepper);
        await stepper.updateComplete;

        const inputSpy = vi.fn();
        const changeSpy = vi.fn();
        const qtyChangeSpy = vi.fn();

        stepper.addEventListener('input', inputSpy);
        stepper.addEventListener('change', changeSpy);
        stepper.addEventListener('quantity-change', qtyChangeSpy);

        stepper.increment();
        await stepper.updateComplete;

        expect(inputSpy).toHaveBeenCalledTimes(1);
        expect(changeSpy).toHaveBeenCalledTimes(1);
        expect(qtyChangeSpy).toHaveBeenCalledTimes(1);
        expect(changeSpy.mock.calls[0]![0].detail).toEqual({ value: 4 });
        expect(changeSpy.mock.calls[0]![0].bubbles).toBe(true);
        expect(changeSpy.mock.calls[0]![0].composed).toBe(true);
      });

      it('synchronizes internal value and events when user types directly into input field', async () => {
        const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
        container.appendChild(stepper);
        await stepper.updateComplete;

        const input = stepper.shadowRoot!.querySelector('input') as HTMLInputElement;
        const changeSpy = vi.fn();
        stepper.addEventListener('change', changeSpy);

        // Simulate typing into input field
        input.value = '12';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        await stepper.updateComplete;

        expect(stepper.value).toBe(12);
        expect(stepper.getFormValue()).toBe('12');
        expect(changeSpy).toHaveBeenCalledTimes(1);
      });

      it('supports imperative setValue() with optional event suppression or emission', async () => {
        const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
        container.appendChild(stepper);
        await stepper.updateComplete;

        const changeSpy = vi.fn();
        stepper.addEventListener('change', changeSpy);

        // Default: silent update (DOM property standard)
        stepper.setValue(10);
        await stepper.updateComplete;
        expect(stepper.value).toBe(10);
        expect(changeSpy).not.toHaveBeenCalled();

        // Explicit event dispatching option
        stepper.setValue(20, { dispatchEvents: true });
        await stepper.updateComplete;
        expect(stepper.value).toBe(20);
        expect(changeSpy).toHaveBeenCalledTimes(1);
        expect(changeSpy.mock.calls[0]![0].detail).toEqual({ value: 20 });
      });

      it('participates in native <form> and serializes into new FormData(form)', async () => {
        const form = document.createElement('form');
        const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
        stepper.setAttribute('name', 'cartQuantity');
        stepper.value = 3;
        form.appendChild(stepper);
        container.appendChild(form);
        await stepper.updateComplete;

        let formData = new FormData(form);
        expect(formData.get('cartQuantity')).toBe('3');

        stepper.increment();
        await stepper.updateComplete;

        formData = new FormData(form);
        expect(formData.get('cartQuantity')).toBe('4');
      });
    });

    describe('Tier 2: Boundary Value Analysis & Constraint Validation', () => {
      it('clamps decrement at min boundary and disables decrement button', async () => {
        const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
        stepper.min = 2;
        stepper.max = 10;
        stepper.value = 2;
        container.appendChild(stepper);
        await stepper.updateComplete;

        const decBtn = stepper.shadowRoot!.querySelector('.btn-decrement') as HTMLButtonElement;
        expect(decBtn.disabled).toBe(true);

        stepper.decrement();
        await stepper.updateComplete;
        expect(stepper.value).toBe(2);
      });

      it('clamps increment at max boundary and disables increment button', async () => {
        const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
        stepper.min = 1;
        stepper.max = 5;
        stepper.value = 5;
        container.appendChild(stepper);
        await stepper.updateComplete;

        const incBtn = stepper.shadowRoot!.querySelector('.btn-increment') as HTMLButtonElement;
        expect(incBtn.disabled).toBe(true);

        stepper.increment();
        await stepper.updateComplete;
        expect(stepper.value).toBe(5);
      });

      it('steps accurately by custom step delta', async () => {
        const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
        stepper.min = 0;
        stepper.max = 20;
        stepper.step = 5;
        stepper.value = 5;
        container.appendChild(stepper);
        await stepper.updateComplete;

        stepper.increment();
        await stepper.updateComplete;
        expect(stepper.value).toBe(10);

        stepper.increment();
        await stepper.updateComplete;
        expect(stepper.value).toBe(15);

        stepper.decrement();
        await stepper.updateComplete;
        expect(stepper.value).toBe(10);
      });

      it('evaluates HTML5 constraint validation: rangeUnderflow, rangeOverflow, stepMismatch', async () => {
        const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
        stepper.min = 5;
        stepper.max = 25;
        stepper.step = 5;
        stepper.value = 10;
        container.appendChild(stepper);
        await stepper.updateComplete;

        expect(stepper.validity.valid).toBe(true);
        expect(stepper.checkValidity()).toBe(true);

        // 1. Underflow
        stepper.value = 2;
        stepper.requestUpdate();
        await stepper.updateComplete;

        expect(stepper.validity.valid).toBe(false);
        expect(stepper.validity.rangeUnderflow).toBe(true);
        expect(stepper.checkValidity()).toBe(false);

        // 2. Overflow
        stepper.value = 30;
        stepper.requestUpdate();
        await stepper.updateComplete;

        expect(stepper.validity.valid).toBe(false);
        expect(stepper.validity.rangeOverflow).toBe(true);
        expect(stepper.checkValidity()).toBe(false);

        // 3. Step Mismatch (12 is not 5k + 5)
        stepper.value = 12;
        stepper.requestUpdate();
        await stepper.updateComplete;

        expect(stepper.validity.valid).toBe(false);
        expect(stepper.validity.stepMismatch).toBe(true);
        expect(stepper.checkValidity()).toBe(false);

        // 4. Return to valid
        stepper.value = 15;
        stepper.requestUpdate();
        await stepper.updateComplete;

        expect(stepper.validity.valid).toBe(true);
        expect(stepper.checkValidity()).toBe(true);
      });

      it('executes floating-point safe increments and decrements without precision drift or scientific notation', async () => {
        const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
        stepper.min = 0.5;
        stepper.max = 1.5;
        stepper.step = 0.1;
        stepper.value = 0.5;
        container.appendChild(stepper);
        await stepper.updateComplete;

        // Step up 10 times to reach 1.5
        for (let i = 0; i < 10; i++) {
          stepper.increment();
        }
        await stepper.updateComplete;

        expect(stepper.value).toBe(1.5);
        expect(stepper.getFormValue()).toBe('1.5');
        const incBtn = stepper.shadowRoot!.querySelector('.btn-increment') as HTMLButtonElement;
        expect(incBtn.disabled).toBe(true);

        // Decrement down to 0.5
        for (let i = 0; i < 10; i++) {
          stepper.decrement();
        }
        await stepper.updateComplete;

        expect(stepper.value).toBe(0.5);
        expect(stepper.getFormValue()).toBe('0.5');
        const decBtn = stepper.shadowRoot!.querySelector('.btn-decrement') as HTMLButtonElement;
        expect(decBtn.disabled).toBe(true);
      });

      it('flags badInput when empty string or whitespace is provided', async () => {
        const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
        stepper.min = 0;
        stepper.value = 5;
        container.appendChild(stepper);
        await stepper.updateComplete;

        (stepper as any).value = '';
        stepper.requestUpdate();
        await stepper.updateComplete;

        expect(stepper.validity.badInput).toBe(true);
        expect(stepper.validity.valid).toBe(false);
        expect(stepper.validationMessage).toBe('Please enter a valid number.');
      });
    });

    describe('Tier 3: Form Reset & Lifecycle Integrity', () => {
      it('restores default value and resets validation state when enclosing form resets', async () => {
        const form = document.createElement('form');
        const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
        stepper.setAttribute('name', 'orderCount');
        stepper.setAttribute('default-value', '2');
        stepper.value = 2;
        form.appendChild(stepper);
        container.appendChild(form);
        await stepper.updateComplete;

        // User modifies value
        stepper.setValue(9);
        await stepper.updateComplete;
        expect(new FormData(form).get('orderCount')).toBe('9');

        // Execute native form reset
        form.reset();
        await new Promise((r) => setTimeout(r, 0));
        await stepper.updateComplete;

        expect(stepper.value).toBe(2);
        expect(stepper.getFormValue()).toBe('2');
        expect(new FormData(form).get('orderCount')).toBe('2');
        expect(stepper.validity.valid).toBe(true);
      });

      it('cancels form reset when reset event is prevented via event.preventDefault()', async () => {
        const form = document.createElement('form');
        const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
        stepper.setAttribute('name', 'cartQty');
        stepper.setAttribute('default-value', '1');
        stepper.value = 1;
        form.appendChild(stepper);
        container.appendChild(form);
        await stepper.updateComplete;

        stepper.setValue(10);
        await stepper.updateComplete;
        expect(stepper.value).toBe(10);

        // App listener calls preventDefault
        form.addEventListener('reset', (e) => {
          e.preventDefault();
        });

        form.dispatchEvent(new Event('reset', { bubbles: true, cancelable: true }));
        await new Promise((r) => setTimeout(r, 10));
        await stepper.updateComplete;

        // Reset was canceled: value must remain 10
        expect(stepper.value).toBe(10);
      });

      it('excludes disabled element from FormData and suppresses validation and interactions', async () => {
        const form = document.createElement('form');
        const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
        stepper.setAttribute('name', 'disabledCount');
        stepper.value = 5;
        stepper.disabled = true;
        form.appendChild(stepper);
        container.appendChild(form);
        await stepper.updateComplete;

        // Excluded from FormData
        expect(new FormData(form).get('disabledCount')).toBeNull();

        // Not validatable when disabled
        expect(stepper.willValidate).toBe(false);

        // Buttons disabled and non-interactive
        stepper.increment();
        await stepper.updateComplete;
        expect(stepper.value).toBe(5);

        // Re-enabling restores participation
        stepper.disabled = false;
        await stepper.updateComplete;
        expect(stepper.willValidate).toBe(true);
        expect(new FormData(form).get('disabledCount')).toBe('5');
      });

      it('supports readonly attribute: allows form submission but blocks user modification', async () => {
        const form = document.createElement('form');
        const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
        stepper.setAttribute('name', 'fixedCount');
        stepper.value = 7;
        stepper.readonly = true;
        form.appendChild(stepper);
        container.appendChild(form);
        await stepper.updateComplete;

        // Submits with form
        expect(new FormData(form).get('fixedCount')).toBe('7');

        // Blocks button increments and decrements
        stepper.increment();
        stepper.decrement();
        await stepper.updateComplete;
        expect(stepper.value).toBe(7);
      });

      it('cleans up form reset listener on disconnect preventing memory leaks', async () => {
        const form = document.createElement('form');
        const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
        stepper.setAttribute('name', 'itemQty');
        form.appendChild(stepper);
        container.appendChild(form);
        await stepper.updateComplete;

        stepper.setValue(15);
        expect(stepper.value).toBe(15);

        // Disconnect stepper from form
        stepper.remove();

        // Trigger form reset while detached
        form.reset();
        await new Promise((r) => setTimeout(r, 0));

        // Detached stepper must NOT have reset because its listener was cleanly removed
        expect(stepper.value).toBe(15);
      });
    });
  });

  // =========================================================================
  // Suite 2: <lit-cart-badge> (Reactive Store-Subscribed Component)
  // =========================================================================
  describe('2. <lit-cart-badge> Store-Subscribed Element', () => {
    describe('Tier 1: Feature Functionality & Direct Store Subscription', () => {
      it('registers lit-cart-badge and exposes default configuration', () => {
        expect(customElements.get('lit-cart-badge')).toBe(LitCartBadge);

        const badge = document.createElement('lit-cart-badge') as LitCartBadge;
        expect(badge.label).toBe('Cart');
        expect(badge.maxCount).toBe(99);
        expect(badge.hideZero).toBe(false);
        expect(badge.count).toBe(0);
      });

      it('subscribes directly to a ReadableStore (.store) and renders projected total count', async () => {
        const store = createTrackedStore({ totalCount: 3 });
        const badge = document.createElement('lit-cart-badge') as LitCartBadge;
        badge.store = store;
        container.appendChild(badge);
        await badge.updateComplete;

        expect(badge.count).toBe(3);
        const countEl = badge.shadowRoot!.querySelector('[part~="count"]');
        expect(countEl?.textContent).toBe('3');

        // Reactively updates when store mutates
        store.setValue({ totalCount: 7 });
        await badge.updateComplete;

        expect(badge.count).toBe(7);
        expect(countEl?.textContent).toBe('7');
      });

      it('dispatches cart-badge-click and triggers action pipeline on click', async () => {
        const register = new ActionRegister<{ openCart: void }>({ name: 'cart-badge-reg' });
        const actionSpy = vi.fn();
        register.register('openCart', async () => {
          actionSpy();
        });

        const store = createTrackedStore({ totalCount: 2 });
        const badge = document.createElement('lit-cart-badge') as LitCartBadge;
        badge.store = store;
        badge.register = register;
        badge.actionName = 'openCart';
        container.appendChild(badge);
        await badge.updateComplete;

        const clickSpy = vi.fn();
        badge.addEventListener('cart-badge-click', clickSpy);

        const button = badge.shadowRoot!.querySelector('button') as HTMLButtonElement;
        button.click();
        await badge.updateComplete;

        expect(clickSpy).toHaveBeenCalledTimes(1);
        expect(clickSpy.mock.calls[0]![0].detail).toEqual({ count: 2, isPending: false });
        expect(actionSpy).toHaveBeenCalledTimes(1);
      });

      it('formats count exceeding maxCount with a plus suffix (e.g. 99+)', async () => {
        const store = createTrackedStore({ totalCount: 150 });
        const badge = document.createElement('lit-cart-badge') as LitCartBadge;
        badge.store = store;
        badge.maxCount = 99;
        container.appendChild(badge);
        await badge.updateComplete;

        const countEl = badge.shadowRoot!.querySelector('[part~="count"]');
        expect(countEl?.textContent).toBe('99+');
      });

      it('hides badge completely when count is zero and hideZero is true', async () => {
        const store = createTrackedStore({ totalCount: 0 });
        const badge = document.createElement('lit-cart-badge') as LitCartBadge;
        badge.store = store;
        badge.hideZero = true;
        container.appendChild(badge);
        await badge.updateComplete;

        // When hideZero is active and count is 0, renders nothing
        expect(badge.shadowRoot!.querySelector('button')).toBeNull();

        // Mutating to positive count renders badge
        store.setValue({ totalCount: 1 });
        await badge.updateComplete;

        expect(badge.shadowRoot!.querySelector('button')).not.toBeNull();
      });
    });

    describe('Tier 2: Selective Projection & Memoization', () => {
      it('suppresses redundant updates when unrelated store slices mutate', async () => {
        interface ComplexCartState {
          totalCount: number;
          currency: string;
          lastSynced: string;
          items: { id: string; name: string }[];
        }

        const store = createTrackedStore<ComplexCartState>({
          totalCount: 4,
          currency: 'USD',
          lastSynced: '12:00:00',
          items: [{ id: '1', name: 'Item 1' }],
        });

        const badge = document.createElement('lit-cart-badge') as LitCartBadge;
        badge.store = store;
        container.appendChild(badge);
        await badge.updateComplete;

        expect(badge.count).toBe(4);

        // Spy on requestUpdate to observe rerenders
        const requestUpdateSpy = vi.spyOn(badge, 'requestUpdate');

        // Mutate unprojected store fields (totalCount stays 4)
        store.setValue({
          totalCount: 4,
          currency: 'EUR',
          lastSynced: '12:05:00',
          items: [{ id: '1', name: 'Item 1' }],
        });
        await badge.updateComplete;

        // Should NOT trigger requestUpdate because projected value (4) did not change
        expect(requestUpdateSpy).not.toHaveBeenCalled();

        // Now mutate projected totalCount
        store.setValue({
          totalCount: 5,
          currency: 'EUR',
          lastSynced: '12:10:00',
          items: [{ id: '1', name: 'Item 1' }, { id: '2', name: 'Item 2' }],
        });
        await badge.updateComplete;

        expect(requestUpdateSpy).toHaveBeenCalled();
        expect(badge.count).toBe(5);
      });

      it('correctly aggregates quantities across item lists using defaultCartCountSelector', async () => {
        const store = createTrackedStore({
          items: [
            { id: '1', quantity: 2 },
            { id: '2', quantity: 4 },
          ],
        });

        const badge = document.createElement('lit-cart-badge') as LitCartBadge;
        badge.store = store;
        container.appendChild(badge);
        await badge.updateComplete;

        // Evaluates 2 + 4 = 6
        expect(badge.count).toBe(6);

        // Add items
        store.update((prev) => ({
          items: [...prev.items, { id: '3', quantity: 3 }],
        }));
        await badge.updateComplete;

        expect(badge.count).toBe(9);
      });

      it('safely handles non-finite numbers (NaN, Infinity) in defaultCartCountSelector', () => {
        expect(defaultCartCountSelector({ totalCount: NaN })).toBe(0);
        expect(defaultCartCountSelector({ totalCount: Infinity })).toBe(0);
        expect(defaultCartCountSelector({ count: NaN })).toBe(0);
        expect(defaultCartCountSelector({ total: NaN })).toBe(0);
        expect(defaultCartCountSelector({ totalCount: NaN, count: 7 })).toBe(7);
        expect(defaultCartCountSelector({ totalCount: NaN, count: NaN, total: 42 })).toBe(42);
      });
    });

    describe('Tier 3: Zero Memory Leaks & Lifecycle Resilience', () => {
      it('guarantees zero memory leaks on element disconnect and resubscribes on reconnect', async () => {
        const store = createTrackedStore({ totalCount: 2 });
        const badge = document.createElement('lit-cart-badge') as LitCartBadge;
        badge.store = store;
        container.appendChild(badge);
        await badge.updateComplete;

        expect(store.getListenerCount()).toBe(1);

        // Disconnect element
        badge.remove();
        expect(store.getListenerCount()).toBe(0);

        // Mutate store while disconnected
        store.setValue({ totalCount: 10 });

        // Reconnect element
        container.appendChild(badge);
        await badge.updateComplete;

        expect(store.getListenerCount()).toBe(1);
        expect(badge.count).toBe(10);
      });

      it('survives 30 rapid attach/detach cycles leaving exactly 0 listeners', async () => {
        const store = createTrackedStore({ totalCount: 1 });
        const badge = document.createElement('lit-cart-badge') as LitCartBadge;
        badge.store = store;

        expect(store.getListenerCount()).toBe(0);

        const CYCLES = 30;
        for (let i = 0; i < CYCLES; i++) {
          container.appendChild(badge);
          await badge.updateComplete;
          expect(store.getListenerCount()).toBe(1);

          badge.remove();
          expect(store.getListenerCount()).toBe(0);
        }

        expect(store.getListenerCount()).toBe(0);
      });
    });
  });

  // =========================================================================
  // Suite 3: React 18/19 Bridge Integration (createLitElementBridge)
  // =========================================================================
  describe('3. React 18/19 Custom Element Bridge Integration', () => {
    let reactRoot: Root;
    let reactContainer: HTMLDivElement;

    beforeEach(() => {
      reactContainer = document.createElement('div');
      document.body.appendChild(reactContainer);
      reactRoot = createRoot(reactContainer);
    });

    afterEach(async () => {
      await act(async () => {
        reactRoot.unmount();
      });
      reactContainer.remove();
    });

    it('mounts <lit-quantity-stepper> in React, assigns properties directly, and handles events', async () => {
      const handleChange = vi.fn();
      let capturedEl: LitQuantityStepper | null = null;

      await act(async () => {
        reactRoot.render(
          React.createElement(ReactQuantityStepper, {
            ref: (el: LitQuantityStepper | null) => {
              if (el) capturedEl = el;
            },
            name: 'reactQuantity',
            min: 1,
            max: 10,
            value: 4,
            onQuantityChange: handleChange,
          })
        );
      });

      expect(capturedEl).not.toBeNull();
      const stepper = capturedEl!;
      expect(stepper.name).toBe('reactQuantity');
      expect(stepper.value).toBe(4);
      expect(stepper.min).toBe(1);
      expect(stepper.max).toBe(10);

      // Trigger increment via component method
      stepper.increment();
      await stepper.updateComplete;

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange.mock.calls[0]![0].detail).toEqual({ value: 5 });
    });

    it('forwards native ref to LitQuantityStepper enabling imperative API access', async () => {
      const ref = React.createRef<LitQuantityStepper>();

      await act(async () => {
        reactRoot.render(
          React.createElement(ReactQuantityStepper, {
            ref,
            value: 3,
            min: 1,
            max: 5,
          })
        );
      });

      expect(ref.current).not.toBeNull();
      expect(ref.current?.tagName.toLowerCase()).toBe('lit-quantity-stepper');
      expect(ref.current?.checkValidity()).toBe(true);

      // Call imperative method through React ref
      ref.current?.setValue(5);
      await ref.current?.updateComplete;
      expect(ref.current?.value).toBe(5);
    });

    it('mounts <lit-cart-badge> in React, assigns store directly without stringification', async () => {
      const store = createTrackedStore({ totalCount: 6 });
      let capturedBadge: LitCartBadge | null = null;

      await act(async () => {
        reactRoot.render(
          React.createElement(ReactCartBadge, {
            ref: (el: LitCartBadge | null) => {
              if (el) capturedBadge = el;
            },
            store,
            maxCount: 99,
          })
        );
      });

      expect(capturedBadge).not.toBeNull();
      const badge = capturedBadge!;

      // Verify store was assigned as a direct object reference, not stringified "[object Object]"
      expect(badge.store).toBe(store);
      expect(badge.getAttribute('store')).toBeNull();
      expect(badge.count).toBe(6);

      // Mutate store and check reactive update
      store.setValue({ totalCount: 11 });
      await badge.updateComplete;
      expect(badge.count).toBe(11);
    });

    it('cleans up React event listeners on unmount (zero memory leaks)', async () => {
      const handleChange = vi.fn();
      let capturedStepper: LitQuantityStepper | null = null;

      await act(async () => {
        reactRoot.render(
          React.createElement(ReactQuantityStepper, {
            ref: (el: LitQuantityStepper | null) => {
              if (el) capturedStepper = el;
            },
            onQuantityChange: handleChange,
          })
        );
      });

      expect(capturedStepper).not.toBeNull();
      const targetStepper = capturedStepper!;

      // Unmount React component tree
      await act(async () => {
        reactRoot.unmount();
      });

      // Dispatch event after React unmount
      targetStepper.dispatchEvent(
        new CustomEvent('quantity-change', { detail: { value: 99 } })
      );

      // Handler must NOT have been called
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Suite 4: Tier 4 End-to-End Real-World Application Scenarios
  // =========================================================================
  describe('4. Tier 4 End-to-End Real-World Scenarios', () => {
    // -----------------------------------------------------------------------
    // Scenario 1: Complete E-Commerce Storefront
    // -----------------------------------------------------------------------
    it('Scenario 1: Stepper in <form> dispatches action, updates store, and synchronizes Cart Badge across Shadow DOM', async () => {
      interface CartItem {
        id: string;
        name: string;
        quantity: number;
      }

      interface CartState {
        items: CartItem[];
      }

      type CartActions = {
        addItem: { id: string; name: string; quantity: number };
      };

      const cartStore = createTrackedStore<CartState>({ items: [] });
      const actionRegister = new ActionRegister<CartActions>({ name: 'storefront-actions' });

      actionRegister.register('addItem', async (payload) => {
        cartStore.update((prev) => {
          const existing = prev.items.find((i) => i.id === payload.id);
          if (existing) {
            return {
              items: prev.items.map((i) =>
                i.id === payload.id ? { ...i, quantity: i.quantity + payload.quantity } : i
              ),
            };
          }
          return { items: [...prev.items, payload] };
        });
      });

      // App Shell Host Element providing Contexts across Shadow DOM
      class StorefrontShellElement extends LitElement {
        constructor() {
          super();
          provideStore(this, cartStoreContext, cartStore);
          provideActionRegister(this, actionRegister);
        }
        override render() {
          return html`
            <header><lit-cart-badge></lit-cart-badge></header>
            <main><slot></slot></main>
          `;
        }
      }

      const shellTag = 'test-storefront-shell';
      if (!customElements.get(shellTag)) {
        customElements.define(shellTag, StorefrontShellElement);
      }

      const shell = document.createElement(shellTag) as StorefrontShellElement;
      container.appendChild(shell);
      await shell.updateComplete;

      const badge = shell.shadowRoot!.querySelector('lit-cart-badge') as LitCartBadge;
      await badge.updateComplete;
      expect(badge.count).toBe(0);

      // Embedded Form containing Stepper
      const form = document.createElement('form');
      const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
      stepper.setAttribute('name', 'product_qty');
      stepper.value = 1;
      stepper.min = 1;
      stepper.max = 10;
      form.appendChild(stepper);
      shell.appendChild(form);
      await stepper.updateComplete;

      // User increments stepper to 3
      stepper.increment();
      stepper.increment();
      await stepper.updateComplete;
      expect(stepper.value).toBe(3);

      // Form submit extracts quantity from native FormData
      const formData = new FormData(form);
      const chosenQuantity = parseInt(formData.get('product_qty') as string, 10);
      expect(chosenQuantity).toBe(3);

      // Dispatch action to pipeline
      await actionRegister.dispatch('addItem', {
        id: 'prod_macbook',
        name: 'MacBook Pro',
        quantity: chosenQuantity,
      });

      await badge.updateComplete;

      // Cart Badge across Shadow DOM automatically reflects new total count!
      expect(badge.count).toBe(3);
      const countEl = badge.shadowRoot!.querySelector('[part~="count"]');
      expect(countEl?.textContent).toBe('3');
    });

    // -----------------------------------------------------------------------
    // Scenario 2: Form Reset & Constraint Validation Lifecycle
    // -----------------------------------------------------------------------
    it('Scenario 2: Form submit validation failure and recovery via form.reset()', async () => {
      const form = document.createElement('form');
      const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
      stepper.setAttribute('name', 'seatCount');
      stepper.setAttribute('default-value', '2');
      stepper.min = 2;
      stepper.max = 6;
      stepper.value = 2;
      form.appendChild(stepper);
      container.appendChild(form);
      await stepper.updateComplete;

      // 1. Initial valid state
      expect(stepper.checkValidity()).toBe(true);
      expect(new FormData(form).get('seatCount')).toBe('2');

      // 2. Set out-of-range value (12 > max 6)
      stepper.setValue(12);
      await stepper.updateComplete;

      expect(stepper.validity.valid).toBe(false);
      expect(stepper.validity.rangeOverflow).toBe(true);
      expect(stepper.checkValidity()).toBe(false);

      // 3. User triggers form reset to recover
      form.reset();
      await new Promise((r) => setTimeout(r, 0));
      await stepper.updateComplete;

      // 4. Form state restored to initial default value (2) and validity cleared
      expect(stepper.value).toBe(2);
      expect(stepper.validity.valid).toBe(true);
      expect(stepper.checkValidity()).toBe(true);
      expect(new FormData(form).get('seatCount')).toBe('2');
    });

    // -----------------------------------------------------------------------
    // Scenario 3: Zero-Leak Multi-Element Concurrency Stress Test
    // -----------------------------------------------------------------------
    it('Scenario 3: 10 Steppers and 10 Badges operate concurrently with zero memory leaks', async () => {
      const store = createTrackedStore({ totalCount: 1 });
      const badges: LitCartBadge[] = [];
      const steppers: LitQuantityStepper[] = [];
      const form = document.createElement('form');
      container.appendChild(form);

      const COUNT = 10;
      for (let i = 0; i < COUNT; i++) {
        const badge = document.createElement('lit-cart-badge') as LitCartBadge;
        badge.store = store;
        container.appendChild(badge);
        badges.push(badge);

        const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
        stepper.setAttribute('name', `stepper_${i}`);
        stepper.setAttribute('default-value', `${i + 1}`);
        stepper.value = i + 1;
        form.appendChild(stepper);
        steppers.push(stepper);
      }

      await Promise.all([
        ...badges.map((b) => b.updateComplete),
        ...steppers.map((s) => s.updateComplete),
      ]);

      // Exactly 10 active store subscriptions
      expect(store.getListenerCount()).toBe(COUNT);

      // Mutate all 10 steppers
      for (let i = 0; i < COUNT; i++) {
        steppers[i]!.setValue(50);
      }
      await Promise.all(steppers.map((s) => s.updateComplete));

      // Reset form containing all 10 steppers
      form.reset();
      await new Promise((r) => setTimeout(r, 0));
      await Promise.all(steppers.map((s) => s.updateComplete));

      // Verify all 10 steppers reset accurately to their respective default values
      for (let i = 0; i < COUNT; i++) {
        expect(steppers[i]!.value).toBe(i + 1);
      }

      // Detach all 10 badges
      for (const badge of badges) {
        badge.remove();
      }

      // Store listener count must drop to exactly 0 (Zero Memory Leaks)
      expect(store.getListenerCount()).toBe(0);
    });

    // -----------------------------------------------------------------------
    // Scenario 4: Multi-Level Shadow DOM Context Injection
    // -----------------------------------------------------------------------
    it('Scenario 4: Propagates cart store through 3 nested Shadow DOM containers via W3C Context', async () => {
      const store = createTrackedStore({ totalCount: 42 });

      class Level1Container extends LitElement {
        constructor() {
          super();
          provideStore(this, cartStoreContext, store);
        }
        override render() {
          return html`<slot></slot>`;
        }
      }

      class Level2Container extends LitElement {
        override render() {
          return html`<div><slot></slot></div>`;
        }
      }

      class Level3Container extends LitElement {
        override render() {
          return html`<section><slot></slot></section>`;
        }
      }

      if (!customElements.get('level-1-container')) customElements.define('level-1-container', Level1Container);
      if (!customElements.get('level-2-container')) customElements.define('level-2-container', Level2Container);
      if (!customElements.get('level-3-container')) customElements.define('level-3-container', Level3Container);

      const l1 = document.createElement('level-1-container');
      const l2 = document.createElement('level-2-container');
      const l3 = document.createElement('level-3-container');
      const badge = document.createElement('lit-cart-badge') as LitCartBadge;

      l3.appendChild(badge);
      l2.appendChild(l3);
      l1.appendChild(l2);
      container.appendChild(l1);

      await badge.updateComplete;

      // Badge resolves store through 3 nested Shadow DOM boundaries
      expect(badge.count).toBe(42);
      expect(store.getListenerCount()).toBe(1);

      // Reactive update propagates down through all 3 shadow roots
      store.setValue({ totalCount: 99 });
      await badge.updateComplete;

      expect(badge.count).toBe(99);
      const countEl = badge.shadowRoot!.querySelector('[part~="count"]');
      expect(countEl?.textContent).toBe('99');

      // Unmounting deep child terminates subscription cleanly
      badge.remove();
      expect(store.getListenerCount()).toBe(0);
    });
  });
});
