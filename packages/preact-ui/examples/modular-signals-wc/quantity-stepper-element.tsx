import { signal } from '@preact/signals';
import { definePreactElement } from '../../src/custom-element.js';

let quantityStepperSequence = 0;

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
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `,
    setup(element, context) {
      const parsedInitialValue = Number.parseInt(element.getAttribute('value') ?? '1', 10);
      const initialValue = Number.isFinite(parsedInitialValue) ? parsedInitialValue : 1;
      let resetValue = initialValue;
      const countSignal = signal(initialValue);
      const disabledSignal = signal(false);
      const sequence = ++quantityStepperSequence;
      const descriptionId = `${tagName}-${sequence}-description`;
      const errorId = `${tagName}-${sequence}-error`;
      const helpText = '수량을 선택하세요. 위쪽 또는 아래쪽 화살표 키로 변경할 수 있습니다.';
      const validationMessageSignal = signal('');
      let generatedLabelId: string | undefined;
      let generatedLabelElement: HTMLLabelElement | undefined;
      let generatedLabelOriginalId: string | null | undefined;
      const semanticAttributes = [
        'role',
        'tabindex',
        'aria-labelledby',
        'aria-description',
        'aria-valuenow',
        'aria-valuemin',
        'aria-valuemax',
        'aria-valuetext',
        'aria-invalid',
        'aria-disabled',
      ] as const;
      const initialSemanticAttributes = new Map(
        semanticAttributes.map(attribute => [attribute, element.getAttribute(attribute)]),
      );

      function getBounds() {
        const parsedMin = Number.parseInt(element.getAttribute('min') ?? '', 10);
        const parsedMax = Number.parseInt(element.getAttribute('max') ?? '', 10);
        const min = Number.isFinite(parsedMin) ? parsedMin : 1;
        const max = Math.max(min, Number.isFinite(parsedMax) ? parsedMax : 99);
        return { min, max };
      }

      function setHostSemantics(val: number, message: string) {
        const { min, max } = getBounds();
        element.setAttribute('aria-valuenow', String(val));
        element.setAttribute('aria-valuemin', String(min));
        element.setAttribute('aria-valuemax', String(max));
        element.setAttribute('aria-valuetext', `${val}개`);
        element.setAttribute('aria-invalid', message ? 'true' : 'false');
        element.setAttribute('aria-disabled', disabledSignal.value ? 'true' : 'false');
        // ID references into a shadow root are not resolved as the host's
        // AX description in Chromium. Use the direct ARIA description for
        // assistive technology, while the live alert below announces errors.
        element.setAttribute('aria-description', message || helpText);
        validationMessageSignal.value = message;
        queueMicrotask(connectDescriptionElements);
      }

      function connectDescriptionElements() {
        const description = context.root.querySelector(`#${descriptionId}`);
        const error = context.root.querySelector(`#${errorId}`);
        const internals = context.internals as (ElementInternals & {
          ariaDescribedByElements?: Element[];
        }) | undefined;
        if (!internals || !('ariaDescribedByElements' in internals)) return;
        try {
          internals.ariaDescribedByElements = [description, error].filter(
            (node): node is Element => node instanceof Element,
          );
        } catch {
          // Older ElementInternals implementations may expose no setter.
        }
      }

      function connectHostLabel() {
        const id = element.id;
        const root = element.getRootNode() as Document | ShadowRoot;
        const label = id
          ? Array.from(root.querySelectorAll('label[for]'))
            .find(candidate => candidate.getAttribute('for') === id)
          : element.closest('label');
        if (!label) {
          if (generatedLabelId && element.getAttribute('aria-labelledby') === generatedLabelId) {
            element.removeAttribute('aria-labelledby');
          }
          return;
        }
        if (!label.id) {
          let candidate = `${tagName}-${quantityStepperSequence}-label`;
          while (Array.from(root.querySelectorAll('[id]')).some(node => node.id === candidate)) {
            candidate = `${candidate}-next`;
          }
          generatedLabelElement = label as HTMLLabelElement;
          generatedLabelOriginalId = null;
          label.id = candidate;
          generatedLabelId = label.id;
        }
        element.setAttribute('aria-labelledby', label.id);
      }

      function updateValidationAndFormValue(val: number, emitChange = false) {
        const { min, max } = getBounds();
        context.setFormValue(String(val));

        let validationMessage = '';
        if (val < min) {
          validationMessage = `최소 수량은 ${min}개입니다.`;
          context.setValidity({ rangeUnderflow: true }, validationMessage);
        } else if (val > max) {
          validationMessage = `최대 수량은 ${max}개입니다.`;
          context.setValidity({ rangeOverflow: true }, validationMessage);
        } else {
          context.setValidity({});
        }
        setHostSemantics(val, validationMessage);

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

      function setCount(nextValue: number, emitChange = false) {
        if (nextValue === countSignal.value) return;
        countSignal.value = nextValue;
        updateValidationAndFormValue(nextValue, emitChange);
      }

      const onHostKeyDown = (event: KeyboardEvent) => {
        if (disabledSignal.value) return;
        const { min, max } = getBounds();
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
        const { min, max } = getBounds();
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
            <span id={descriptionId} class="sr-only">
              {helpText}
            </span>
            <span id={errorId} class="error-hint" role="alert" aria-live="assertive">
              {validationMessageSignal.value}
            </span>
          </>
        );
      }

      return {
        view: QuantityStepperView,
        getInput: () => countSignal.value,
        onConnect() {
          // FACE elements are labelable hosts. Apply host semantics after the
          // constructor has returned; browsers reject attribute mutations made
          // while a form-associated custom element is being constructed.
          element.setAttribute('role', 'spinbutton');
          if (!element.hasAttribute('tabindex')) element.tabIndex = 0;
          connectHostLabel();
          element.addEventListener('keydown', onHostKeyDown);
          updateValidationAndFormValue(countSignal.value);
          queueMicrotask(connectDescriptionElements);
        },
        onDisconnect() {
          element.removeEventListener('keydown', onHostKeyDown);
        },
        onAttributeChange(name, _oldVal, newVal) {
          if (name === 'value' && newVal !== null) {
            const parsed = parseInt(newVal, 10);
            if (!Number.isNaN(parsed)) {
              countSignal.value = parsed;
              resetValue = parsed;
              if (element.isConnected) updateValidationAndFormValue(parsed);
            }
          }
          if (name === 'min' || name === 'max') {
            if (element.isConnected) updateValidationAndFormValue(countSignal.value);
          }
        },
        onFormReset() {
          countSignal.value = resetValue;
          updateValidationAndFormValue(resetValue);
        },
        onFormDisabled(disabled) {
          disabledSignal.value = disabled;
          element.setAttribute('aria-disabled', disabled ? 'true' : 'false');
        },
        onDestroy() {
          element.removeEventListener('keydown', onHostKeyDown);
          for (const attribute of semanticAttributes) {
            const initialValue = initialSemanticAttributes.get(attribute);
            if (initialValue === null || initialValue === undefined) element.removeAttribute(attribute);
            else element.setAttribute(attribute, initialValue);
          }
          if (generatedLabelElement && generatedLabelElement.id === generatedLabelId) {
            if (generatedLabelOriginalId) generatedLabelElement.id = generatedLabelOriginalId;
            else generatedLabelElement.removeAttribute('id');
          }
        },
      };
    },
  });
}
