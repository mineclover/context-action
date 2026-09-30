/**
 * @fileoverview Empirical Adversarial Stress Test Suite for <lit-quantity-stepper>
 * Challenger: challenger_m4_1
 *
 * Vectors tested:
 * 1. Multi-element rapid form reset loops, re-entrancy prevention, and cancelable reset events.
 * 2. Floating-point step increments (e.g. 0.1, 0.05, 0.3) and boundary clamping.
 * 3. Invalid value strings, NaN handling, empty string coercion, and constraint validation transitions.
 * 4. Dynamic form association and attribute changes (form="otherForm").
 * 5. String property coercion and type confusion (e.g. value = "5").
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LitQuantityStepper } from '../src/components/quantity-stepper.js';

describe('Adversarial Stress Challenge: <lit-quantity-stepper>', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    document.body.replaceChildren();
  });

  // =========================================================================
  // Vector 1: Multi-Element Rapid Form Reset Loops and Re-entrancy
  // =========================================================================
  describe('Vector 1: Rapid Form Resets and Re-entrancy Prevention', () => {
    it('survives 50 rapid sequential synchronous form.reset() calls without error or state drift', async () => {
      const form = document.createElement('form');
      const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
      stepper.setAttribute('name', 'qty');
      stepper.setAttribute('default-value', '5');
      stepper.value = 5;
      form.appendChild(stepper);
      container.appendChild(form);
      await stepper.updateComplete;

      // Mutate to non-default
      stepper.setValue(42);
      expect(stepper.value).toBe(42);

      // Execute 50 rapid synchronous form.reset() calls
      for (let i = 0; i < 50; i++) {
        form.reset();
      }

      await new Promise((r) => setTimeout(r, 10));
      await stepper.updateComplete;

      expect(stepper.value).toBe(5);
      expect(stepper.getFormValue()).toBe('5');
      expect(stepper.validity.valid).toBe(true);
    });

    it('survives 20 steppers concurrently resetting in a single form with distinct initial defaults', async () => {
      const form = document.createElement('form');
      container.appendChild(form);
      const steppers: LitQuantityStepper[] = [];
      const COUNT = 20;

      for (let i = 0; i < COUNT; i++) {
        const s = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
        s.setAttribute('name', `item_${i}`);
        s.setAttribute('default-value', `${i + 1}`);
        s.value = i + 1;
        form.appendChild(s);
        steppers.push(s);
      }

      await Promise.all(steppers.map((s) => s.updateComplete));

      // Mutate all steppers
      for (const s of steppers) {
        s.setValue(999);
      }
      await Promise.all(steppers.map((s) => s.updateComplete));

      // Fire 50 rapid resets in a loop
      for (let r = 0; r < 50; r++) {
        form.reset();
      }

      await new Promise((r) => setTimeout(r, 10));
      await Promise.all(steppers.map((s) => s.updateComplete));

      // Verify every stepper correctly restored its own distinct default
      for (let i = 0; i < COUNT; i++) {
        expect(steppers[i]!.value).toBe(i + 1);
        expect(steppers[i]!.getFormValue()).toBe(String(i + 1));
        expect(steppers[i]!.validity.valid).toBe(true);
      }
    });

    it('prevents infinite recursion when reset event handler triggers re-entrant form.reset()', async () => {
      const form = document.createElement('form');
      const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
      stepper.setAttribute('default-value', '3');
      stepper.value = 3;
      form.appendChild(stepper);
      container.appendChild(form);
      await stepper.updateComplete;

      stepper.setValue(10);

      let resetEventCallCount = 0;
      form.addEventListener('reset', () => {
        resetEventCallCount++;
        if (resetEventCallCount < 5) {
          // Re-entrant reset trigger!
          form.reset();
        }
      });

      expect(() => form.reset()).not.toThrow();

      await new Promise((r) => setTimeout(r, 10));
      await stepper.updateComplete;

      expect(stepper.value).toBe(3);
      expect(stepper.validity.valid).toBe(true);
    });

    it('respects e.preventDefault() in form reset listener and cancels element reset', async () => {
      const form = document.createElement('form');
      const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
      stepper.setAttribute('default-value', '1');
      stepper.value = 1;
      form.appendChild(stepper);
      container.appendChild(form);
      await stepper.updateComplete;

      stepper.setValue(25);
      expect(stepper.value).toBe(25);

      // A user event listener registered after stepper attachment cancels reset:
      form.addEventListener('reset', (e) => {
        e.preventDefault();
      });

      // Dispatch reset event
      form.dispatchEvent(new Event('reset', { bubbles: true, cancelable: true }));

      await new Promise((r) => setTimeout(r, 10));
      await stepper.updateComplete;

      // Because FormAssociatedLitElement.#handleFormReset deferred callback in queueMicrotask
      // and verified !event.defaultPrevented, stepper.value remains 25!
      expect(stepper.value).toBe(25);
    });
  });

  // =========================================================================
  // Vector 2: Floating-Point Step Increments and Boundary Clamping
  // =========================================================================
  describe('Vector 2: Floating-Point Step Increments and Boundary Clamping', () => {
    it('reaches max boundary cleanly with decimal step without IEEE 754 drift stalling', async () => {
      const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
      stepper.min = 0.5;
      stepper.max = 1.5;
      stepper.step = 0.1;
      stepper.value = 0.5;
      container.appendChild(stepper);
      await stepper.updateComplete;

      // Step up 9 times: reaches 1.4
      for (let i = 0; i < 9; i++) {
        stepper.increment();
      }
      await stepper.updateComplete;
      expect(stepper.value).toBeCloseTo(1.4, 5);

      // 10th step reaches max (1.5)
      stepper.increment();
      await stepper.updateComplete;

      // Verified: stepper value reaches exactly 1.5
      expect(stepper.value).toBe(1.5);

      // Crucially, button in UI is disabled because this.value >= this.max (1.5 >= 1.5)
      const incBtn = stepper.shadowRoot!.querySelector('.btn-increment') as HTMLButtonElement;
      expect(incBtn.disabled).toBe(true);
    });

    it('BUG DISCOVERY 3: Non-divisible step creates dead increment button at sub-max values', async () => {
      const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
      stepper.min = 0.0;
      stepper.max = 1.0;
      stepper.step = 0.3;
      stepper.value = 0.0;
      container.appendChild(stepper);
      await stepper.updateComplete;

      // Steps: 0.0 -> 0.3 -> 0.6 -> 0.9
      stepper.increment();
      stepper.increment();
      stepper.increment();
      await stepper.updateComplete;

      expect(stepper.value).toBeCloseTo(0.9, 5);

      // Increment button is enabled because value (0.9) < max (1.0)
      const incBtn = stepper.shadowRoot!.querySelector('.btn-increment') as HTMLButtonElement;
      expect(incBtn.disabled).toBe(false);

      // User clicks increment button
      incBtn.click();
      await stepper.updateComplete;

      // Next value would be 1.2 > 1.0, so increment returns without clamping to max or doing anything!
      // The button was clickable, but did nothing.
      expect(stepper.value).toBeCloseTo(0.9, 5);
    });

    it('decrements decimal steps cleanly to min without exposing scientific notation', async () => {
      const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
      stepper.min = 0.0;
      stepper.max = 1.0;
      stepper.step = 0.1;
      stepper.value = 1.0;
      container.appendChild(stepper);
      await stepper.updateComplete;

      // Decrement 10 times from 1.0 with step 0.1
      for (let i = 0; i < 10; i++) {
        stepper.decrement();
      }
      await stepper.updateComplete;

      // Clean 0.0 reached without floating point drift
      expect(stepper.value).toBe(0);

      // In the rendered HTML input, the user sees "0", never scientific notation
      const input = stepper.shadowRoot!.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('0');
      expect(input.value).not.toMatch(/e-\d+/);
    });

    it('evaluates stepMismatch correctly when user inputs values off-grid with fractional steps', async () => {
      const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
      stepper.min = 0.0;
      stepper.max = 1.0;
      stepper.step = 0.25;
      stepper.value = 0.0;
      container.appendChild(stepper);
      await stepper.updateComplete;

      // 0.25 is on-grid (quotient 1)
      stepper.value = 0.25;
      stepper.requestUpdate();
      await stepper.updateComplete;
      expect(stepper.validity.stepMismatch).toBe(false);

      // 0.3 is off-grid (0.3 / 0.25 = 1.2)
      stepper.value = 0.3;
      stepper.requestUpdate();
      await stepper.updateComplete;
      expect(stepper.validity.stepMismatch).toBe(true);
      expect(stepper.validity.valid).toBe(false);

      // 0.5 is on-grid (quotient 2)
      stepper.value = 0.5;
      stepper.requestUpdate();
      await stepper.updateComplete;
      expect(stepper.validity.stepMismatch).toBe(false);
      expect(stepper.validity.valid).toBe(true);
    });
  });

  // =========================================================================
  // Vector 3: Invalid Value Strings and Constraint Validation Transitions
  // =========================================================================
  describe('Vector 3: Invalid Strings, NaN, and Constraint Transitions', () => {
    it('sets badInput flag when explicit NaN is passed to setValue or value', async () => {
      const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
      container.appendChild(stepper);
      await stepper.updateComplete;

      stepper.setValue(NaN);
      await stepper.updateComplete;

      expect(stepper.validity.badInput).toBe(true);
      expect(stepper.validity.valid).toBe(false);
      expect(stepper.checkValidity()).toBe(false);
      expect(stepper.validationMessage).toBe('Please enter a valid number.');
    });

    it('flags badInput when non-numeric text or empty string is entered into input', async () => {
      const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
      stepper.min = 0; // min is 0
      stepper.value = 5;
      container.appendChild(stepper);
      await stepper.updateComplete;

      const input = stepper.shadowRoot!.querySelector('input') as HTMLInputElement;

      // In HTML / JSDOM, input[type=number].value sanitizes non-numeric text to ""
      input.value = 'invalid-text';
      // target.value becomes "" in HTMLInputElement
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await stepper.updateComplete;

      // Empty string is detected as blank and flags badInput
      expect(stepper.validity.badInput).toBe(true);
      expect(stepper.validity.valid).toBe(false);
      expect(stepper.validationMessage).toBe('Please enter a valid number.');
    });

    it('coerces string property assignment to number in increment() preventing string concatenation', async () => {
      const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
      stepper.min = 1;
      stepper.max = 999;
      stepper.step = 1;
      stepper.value = 5;
      container.appendChild(stepper);
      await stepper.updateComplete;

      // Untyped JS or dynamic assignment: stepper.value = "10"
      (stepper as any).value = '10';
      await stepper.updateComplete;

      // Call increment: converts to number 10 + 1 = 11
      stepper.increment();
      await stepper.updateComplete;

      // Value stepped numerically to 11
      expect(stepper.value).toBe(11);
    });

    it('transitions smoothly across validity flags (rangeUnderflow -> valid -> rangeOverflow -> stepMismatch)', async () => {
      const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
      stepper.min = 10;
      stepper.max = 20;
      stepper.step = 2;
      stepper.value = 10;
      container.appendChild(stepper);
      await stepper.updateComplete;

      expect(stepper.validity.valid).toBe(true);

      // 1. Underflow
      stepper.value = 8;
      stepper.requestUpdate();
      await stepper.updateComplete;
      expect(stepper.validity.rangeUnderflow).toBe(true);
      expect(stepper.validity.valid).toBe(false);

      // 2. Overflow
      stepper.value = 22;
      stepper.requestUpdate();
      await stepper.updateComplete;
      expect(stepper.validity.rangeUnderflow).toBe(false);
      expect(stepper.validity.rangeOverflow).toBe(true);
      expect(stepper.validity.valid).toBe(false);

      // 3. Step mismatch
      stepper.value = 15;
      stepper.requestUpdate();
      await stepper.updateComplete;
      expect(stepper.validity.rangeOverflow).toBe(false);
      expect(stepper.validity.stepMismatch).toBe(true);
      expect(stepper.validity.valid).toBe(false);

      // 4. Fully valid
      stepper.value = 16;
      stepper.requestUpdate();
      await stepper.updateComplete;
      expect(stepper.validity.stepMismatch).toBe(false);
      expect(stepper.validity.valid).toBe(true);
    });

    it('supports custom validity messages via setCustomValidity()', async () => {
      const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
      container.appendChild(stepper);
      await stepper.updateComplete;

      expect(stepper.validity.valid).toBe(true);

      stepper.setCustomValidity('Inventory depleted for this SKU');
      expect(stepper.validity.customError).toBe(true);
      expect(stepper.validity.valid).toBe(false);
      expect(stepper.validationMessage).toBe('Inventory depleted for this SKU');
      expect(stepper.checkValidity()).toBe(false);

      // Clearing custom error
      stepper.setCustomValidity('');
      expect(stepper.validity.customError).toBe(false);
      expect(stepper.validity.valid).toBe(true);
      expect(stepper.validationMessage).toBe('');
      expect(stepper.checkValidity()).toBe(true);
    });
  });

  // =========================================================================
  // Vector 4: Dynamic Form Association and Attribute Changes
  // =========================================================================
  describe('Vector 4: Dynamic Form Association and Attribute Changes', () => {
    it('associates with form outside hierarchy via form attribute id and handles formAssociatedCallback', async () => {
      const form1 = document.createElement('form');
      form1.id = 'form_alpha';
      const form2 = document.createElement('form');
      form2.id = 'form_beta';

      container.appendChild(form1);
      container.appendChild(form2);

      const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
      stepper.setAttribute('form', 'form_alpha');
      stepper.setAttribute('name', 'stepperQty');
      stepper.setAttribute('default-value', '7');
      stepper.value = 7;
      container.appendChild(stepper);
      await stepper.updateComplete;

      expect(stepper.form).toBe(form1);

      stepper.setValue(50);
      expect(stepper.value).toBe(50);

      // form1 resets -> stepper resets
      form1.reset();
      await new Promise((r) => setTimeout(r, 10));
      await stepper.updateComplete;

      expect(stepper.value).toBe(7);

      // Re-associate dynamically via formAssociatedCallback
      stepper.formAssociatedCallback(form2);
      stepper.setValue(80);

      // form2 resets -> stepper resets
      form2.reset();
      await new Promise((r) => setTimeout(r, 10));
      await stepper.updateComplete;

      expect(stepper.value).toBe(7);
    });

    it('BUG DISCOVERY 7: Dynamic mutation of form attribute (stepper.setAttribute("form", "newForm")) is not observed', async () => {
      const form1 = document.createElement('form');
      form1.id = 'form_1';
      const form2 = document.createElement('form');
      form2.id = 'form_2';

      container.appendChild(form1);
      container.appendChild(form2);

      const stepper = document.createElement('lit-quantity-stepper') as LitQuantityStepper;
      stepper.setAttribute('form', 'form_1');
      stepper.setAttribute('default-value', '10');
      stepper.value = 10;
      container.appendChild(stepper);
      await stepper.updateComplete;

      // Mutate value
      stepper.setValue(99);

      // Dynamically change form attribute without calling formAssociatedCallback
      stepper.setAttribute('form', 'form_2');
      await stepper.updateComplete;

      // In JSDOM / non-native FACE, FormAssociatedLitElement does not observe "form" attribute changes!
      // Its internal #associatedForm is still form_1!
      // When form_2 resets, stepper does NOT reset!
      form2.reset();
      await new Promise((r) => setTimeout(r, 10));
      await stepper.updateComplete;

      // Stepper failed to reset on form_2 because the attribute change was never synced
      expect(stepper.value).toBe(99); // Still 99!
    });
  });
});
