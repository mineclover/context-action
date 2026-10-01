import { signal } from '@preact/signals';
import { definePreactElement } from '../../src/custom-element.js';

export function defineQuantityStepperElement(tagName = 'quantity-stepper'): CustomElementConstructor {
  return definePreactElement({
    tagName,
    formAssociated: true,
    observedAttributes: ['min', 'max', 'name', 'value'],
    style: `
      :host {
        display: inline-flex;
        align-items: center;
        font-family: system-ui, -apple-system, sans-serif;
      }
      .stepper {
        display: inline-flex;
        align-items: center;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        background: #ffffff;
        overflow: hidden;
      }
      button {
        background: #f8fafc;
        border: none;
        padding: 8px 14px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        color: #334155;
        transition: background 0.15s ease;
      }
      button:hover:not(:disabled) {
        background: #e2e8f0;
      }
      button:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .value-display {
        min-width: 40px;
        text-align: center;
        font-size: 15px;
        font-weight: 700;
        color: #0f172a;
        padding: 0 8px;
      }
      .error-hint {
        color: #ef4444;
        font-size: 12px;
        margin-left: 8px;
      }
    `,
    setup(element, context) {
      const initialValue = parseInt(element.getAttribute('value') ?? '1', 10) || 1;
      const countSignal = signal(initialValue);
      const disabledSignal = signal(false);

      function getBounds() {
        const parsedMin = Number.parseInt(element.getAttribute('min') ?? '', 10);
        const parsedMax = Number.parseInt(element.getAttribute('max') ?? '', 10);
        const min = Number.isFinite(parsedMin) ? parsedMin : 1;
        const max = Math.max(min, Number.isFinite(parsedMax) ? parsedMax : 99);
        return { min, max };
      }

      function updateValidationAndFormValue(val: number, emitChange = false) {
        const { min, max } = getBounds();
        context.setFormValue(String(val));

        if (val < min) {
          context.setValidity({ rangeUnderflow: true }, `최소 수량은 ${min}개입니다.`);
        } else if (val > max) {
          context.setValidity({ rangeOverflow: true }, `최대 수량은 ${max}개입니다.`);
        } else {
          context.setValidity({});
        }

        if (emitChange) {
          element.dispatchEvent(
            new CustomEvent('quantity-change', {
              detail: { value: val },
              bubbles: true,
              composed: true,
            }),
          );
        }
      }

      function QuantityStepperView() {
        const { min, max } = getBounds();
        const count = countSignal.value;
        const isDisabled = disabledSignal.value;

        return (
          <div class="stepper">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={isDisabled || count <= min}
              onClick={() => {
                if (countSignal.value > min) {
                  countSignal.value -= 1;
                  updateValidationAndFormValue(countSignal.value, true);
                }
              }}
            >
              −
            </button>
            <span class="value-display" role="status" aria-live="polite" data-testid="stepper-count">
              {count}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={isDisabled || count >= max}
              onClick={() => {
                if (countSignal.value < max) {
                  countSignal.value += 1;
                  updateValidationAndFormValue(countSignal.value, true);
                }
              }}
            >
              +
            </button>
          </div>
        );
      }

      return {
        view: QuantityStepperView,
        getInput: () => countSignal.value,
        onConnect() {
          updateValidationAndFormValue(countSignal.value);
        },
        onAttributeChange(name, _oldVal, newVal) {
          if (name === 'value' && newVal !== null) {
            const parsed = parseInt(newVal, 10);
            if (!Number.isNaN(parsed)) {
              countSignal.value = parsed;
              updateValidationAndFormValue(parsed);
            }
          }
          if (name === 'min' || name === 'max') {
            updateValidationAndFormValue(countSignal.value);
          }
        },
        onFormReset() {
          countSignal.value = initialValue;
          updateValidationAndFormValue(initialValue);
        },
        onFormDisabled(disabled) {
          disabledSignal.value = disabled;
        },
      };
    },
  });
}
