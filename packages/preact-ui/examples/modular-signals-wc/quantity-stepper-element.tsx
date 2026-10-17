/**
 * @module quantity-stepper-element
 *
 * Purpose:
 *   Defines a Form-Associated Custom Element (`<quantity-stepper>`) backed by
 *   local Preact Signals for Tier-2 controlled form state (`value`, `min`, `max`,
 *   `disabled`, `validity`) and accessible spinbutton keyboard interactions.
 *
 * Invariants:
 *   - Programmatic attribute updates (`value`, `min`, `max`) and form resets
 *     never echo user-intent `quantity-change` events (`No Echo`).
 *   - Host ARIA spinbutton attributes and `<label>` linkage are managed via
 *     `createQuantityStepperHostSemantics` and restored on `dispose()`.
 */
import { signal } from '@preact/signals';
import { definePreactElement } from '../../src/custom-element.js';
import type { ManagedPreactElement, PreactCustomElementConstructor } from '../../src/custom-element.js';
import {
  createQuantityStepperHostSemantics,
  evaluateStepperValidity,
  parseStepperBounds,
  QUANTITY_STEPPER_HELP_TEXT,
  QUANTITY_STEPPER_STYLE,
} from './quantity-stepper-semantics.js';
import type {
  QuantityStepperBounds,
  QuantityStepperValidity,
} from './quantity-stepper-semantics.js';

export type { QuantityStepperBounds, QuantityStepperValidity };

export interface QuantityChangeEventDetail {
  readonly value: number;
}

export type QuantityStepperElement = ManagedPreactElement<number>;

let quantityStepperSequence = 0;

export function defineQuantityStepperElement(
  tagName = 'quantity-stepper',
): PreactCustomElementConstructor<number> {
  return definePreactElement<number>({
    tagName,
    formAssociated: true,
    observedAttributes: ['min', 'max', 'name', 'value'],
    style: QUANTITY_STEPPER_STYLE,
    setup(element, context) {
      const parsedInitialValue = Number.parseInt(element.getAttribute('value') ?? '1', 10);
      const initialValue = Number.isFinite(parsedInitialValue) ? parsedInitialValue : 1;
      let resetValue = initialValue;

      const countSignal = signal(initialValue);
      const disabledSignal = signal(false);
      const validationMessageSignal = signal('');

      const semantics = createQuantityStepperHostSemantics({
        element,
        tagName,
        sequence: ++quantityStepperSequence,
        root: context.root,
        internals: context.internals,
      });

      function syncFormValueAndValidity(val: number, emitChange = false) {
        const bounds = parseStepperBounds(element);
        const validity = evaluateStepperValidity(val, bounds);

        context.setFormValue(String(val));
        context.setValidity(validity.flags, validity.message || undefined);
        validationMessageSignal.value = validity.message;
        semantics.syncHostAria(val, bounds, validity.message, disabledSignal.value);

        if (emitChange) {
          element.dispatchEvent(
            new CustomEvent<QuantityChangeEventDetail>('quantity-change', {
              detail: { value: val },
              bubbles: true,
              composed: true,
            }),
          );
        }
      }

      function setCount(nextValue: number, emitChange = false) {
        if (nextValue === countSignal.value) return;
        countSignal.value = nextValue;
        syncFormValueAndValidity(nextValue, emitChange);
      }

      const onHostKeyDown = (event: KeyboardEvent) => {
        if (disabledSignal.value) return;
        const { min, max } = parseStepperBounds(element);
        let nextValue: number | undefined;
        switch (event.key) {
          case 'ArrowDown':
            nextValue = Math.max(min, countSignal.value - 1);
            break;
          case 'ArrowUp':
            nextValue = Math.min(max, countSignal.value + 1);
            break;
          case 'Home':
            nextValue = min;
            break;
          case 'End':
            nextValue = max;
            break;
          default:
            return;
        }
        event.preventDefault();
        setCount(nextValue, true);
      };

      function QuantityStepperView() {
        const { min, max } = parseStepperBounds(element);
        const count = countSignal.value;
        const isDisabled = disabledSignal.value;

        return (
          <>
            <div class="stepper" data-testid="quantity-stepper-controls">
              <button
                type="button"
                aria-label="Decrease quantity"
                title="Decrease quantity"
                data-testid="decrease-quantity"
                disabled={isDisabled || count <= min}
                onClick={() => setCount(Math.max(min, countSignal.value - 1), true)}
              >
                −
              </button>
              <span class="value-display" aria-hidden="true" data-testid="stepper-count">
                {count}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                title="Increase quantity"
                data-testid="increase-quantity"
                disabled={isDisabled || count >= max}
                onClick={() => setCount(Math.min(max, countSignal.value + 1), true)}
              >
                +
              </button>
            </div>
            <span id={semantics.descriptionId} class="sr-only">
              {QUANTITY_STEPPER_HELP_TEXT}
            </span>
            <span id={semantics.errorId} class="error-hint" role="alert" aria-live="assertive">
              {validationMessageSignal.value}
            </span>
          </>
        );
      }

      return {
        view: QuantityStepperView,
        getInput: () => countSignal.value,
        onConnect() {
          semantics.applyConnectSemantics();
          element.addEventListener('keydown', onHostKeyDown);
          syncFormValueAndValidity(countSignal.value);
          queueMicrotask(() => semantics.connectDescriptionElements());
        },
        onDisconnect() {
          element.removeEventListener('keydown', onHostKeyDown);
        },
        onAttributeChange(name, _oldVal, newVal) {
          if (name === 'value' && newVal !== null) {
            const parsed = Number.parseInt(newVal, 10);
            if (!Number.isNaN(parsed)) {
              countSignal.value = parsed;
              resetValue = parsed;
              if (element.isConnected) syncFormValueAndValidity(parsed);
            }
          }
          if (name === 'min' || name === 'max') {
            if (element.isConnected) syncFormValueAndValidity(countSignal.value);
          }
        },
        onFormReset() {
          countSignal.value = resetValue;
          syncFormValueAndValidity(resetValue);
        },
        onFormDisabled(disabled) {
          disabledSignal.value = disabled;
          element.setAttribute('aria-disabled', disabled ? 'true' : 'false');
        },
        onDestroy() {
          element.removeEventListener('keydown', onHostKeyDown);
          semantics.restoreHostSemantics();
        },
      };
    },
  });
}
