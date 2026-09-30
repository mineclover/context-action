import { definePreactElement } from '@context-action/preact-ui';
import { createCustomElementBridge } from '@context-action/preact-ui/react-bridge';
import { useStoreValue } from '@context-action/react';
import { signal } from '@preact/signals';
import { h } from 'preact';
import { useCallback, useMemo } from 'react';
import { calculateOrderSummary } from '../business/orderCalculation';
import {
  PreactWebComponentsActionsContext,
  PreactWebComponentsStoresContext,
} from '../contexts/PreactWebComponentsContexts';

const STEPPER_TAG = 'preact-wc-stepper';
const BADGE_TAG = 'preact-wc-badge';

function ensureCustomElementsRegistered() {
  if (typeof globalThis.customElements === 'undefined') return;

  if (!customElements.get(STEPPER_TAG)) {
    definePreactElement({
      tagName: STEPPER_TAG,
      formAssociated: true,
      observedAttributes: ['value', 'min', 'max', 'name'],
      style: `
        :host {
          display: inline-flex;
          align-items: center;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .stepper-container {
          display: inline-flex;
          align-items: center;
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          background: #ffffff;
          overflow: hidden;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        .btn-step {
          background: #f8fafc;
          border: none;
          padding: 8px 14px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          color: #334155;
          user-select: none;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .btn-step:hover:not(:disabled) {
          background: #e2e8f0;
          color: #0f172a;
        }
        .btn-step:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .count-display {
          min-width: 44px;
          text-align: center;
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          padding: 0 6px;
        }
      `,
      setup(element, context) {
        const initialValue =
          parseInt(element.getAttribute('value') ?? '1', 10) || 1;
        const countSignal = signal(initialValue);
        const disabledSignal = signal(false);

        function getBounds() {
          const min = parseInt(element.getAttribute('min') ?? '1', 10);
          const max = parseInt(element.getAttribute('max') ?? '99', 10);
          return { min, max };
        }

        function updateFormValueAndEvent(val: number) {
          const { min, max } = getBounds();
          context.setFormValue(String(val));

          if (val < min) {
            context.setValidity(
              { rangeUnderflow: true },
              `최소 수량은 ${min}개입니다.`
            );
          } else if (val > max) {
            context.setValidity(
              { rangeOverflow: true },
              `최대 수량은 ${max}개입니다.`
            );
          } else {
            context.setValidity({});
          }

          element.dispatchEvent(
            new CustomEvent('quantity-change', {
              detail: { value: val },
              bubbles: true,
              composed: true,
            })
          );
        }

        updateFormValueAndEvent(countSignal.value);

        function StepperView() {
          const { min, max } = getBounds();
          const count = countSignal.value;
          const isDisabled = disabledSignal.value;

          return h(
            'div',
            { class: 'stepper-container' },
            h(
              'button',
              {
                type: 'button',
                class: 'btn-step btn-decrement',
                'aria-label': '수량 감소',
                disabled: isDisabled || count <= min,
                onClick: () => {
                  if (countSignal.value > min) {
                    countSignal.value -= 1;
                    updateFormValueAndEvent(countSignal.value);
                  }
                },
              },
              '−'
            ),
            h(
              'span',
              { class: 'count-display', 'data-testid': 'stepper-count' },
              String(count)
            ),
            h(
              'button',
              {
                type: 'button',
                class: 'btn-step btn-increment',
                'aria-label': '수량 증가',
                disabled: isDisabled || count >= max,
                onClick: () => {
                  if (countSignal.value < max) {
                    countSignal.value += 1;
                    updateFormValueAndEvent(countSignal.value);
                  }
                },
              },
              '+'
            )
          );
        }

        return {
          view: StepperView,
          getInput: () => countSignal.value,
          onAttributeChange(name, _oldVal, newVal) {
            if (name === 'value' && newVal !== null) {
              const parsed = parseInt(newVal, 10);
              if (!Number.isNaN(parsed) && parsed !== countSignal.value) {
                countSignal.value = parsed;
                updateFormValueAndEvent(parsed);
              }
            }
          },
          onFormReset() {
            countSignal.value = initialValue;
            updateFormValueAndEvent(initialValue);
          },
          onFormDisabled(disabled) {
            disabledSignal.value = disabled;
          },
        };
      },
    });
  }

  if (!customElements.get(BADGE_TAG)) {
    definePreactElement({
      tagName: BADGE_TAG,
      observedAttributes: ['count'],
      style: `
        :host {
          display: inline-block;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .badge-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 14px;
          background: #4f46e5;
          color: #ffffff;
          border: none;
          border-radius: 9999px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.1s ease;
          box-shadow: 0 2px 4px rgba(79, 70, 229, 0.25);
        }
        .badge-btn:hover {
          background: #4338ca;
        }
        .badge-btn:active {
          transform: scale(0.97);
        }
        .badge-count {
          background: #ffffff;
          color: #4f46e5;
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 800;
          min-width: 20px;
          text-align: center;
        }
      `,
      setup(element) {
        const initialCount =
          parseInt(element.getAttribute('count') ?? '0', 10) || 0;
        const countSignal = signal(initialCount);

        function BadgeView() {
          return h(
            'button',
            {
              type: 'button',
              class: 'badge-btn',
              onClick: () => {
                element.dispatchEvent(
                  new CustomEvent('badge-click', {
                    detail: { count: countSignal.value },
                    bubbles: true,
                    composed: true,
                  })
                );
              },
            },
            h('span', null, '🛒 Cart'),
            h(
              'span',
              { class: 'badge-count', 'data-testid': 'preact-badge-count' },
              String(countSignal.value)
            )
          );
        }

        return {
          view: BadgeView,
          getInput: () => countSignal.value,
          onAttributeChange(name, _oldVal, newVal) {
            if (name === 'count' && newVal !== null) {
              const parsed = parseInt(newVal, 10);
              if (!Number.isNaN(parsed)) {
                countSignal.value = parsed;
              }
            }
          },
        };
      },
    });
  }
}

// Ensure elements are defined upon module load
ensureCustomElementsRegistered();

export interface StepperBridgeProps {
  value?: number;
  min?: number;
  max?: number;
  name?: string;
  onQuantityChange?: (event: CustomEvent<{ value: number }>) => void;
  className?: string;
  id?: string;
}

export interface BadgeBridgeProps {
  count?: number;
  onBadgeClick?: (event: CustomEvent<{ count: number }>) => void;
  className?: string;
  id?: string;
}

export const PreactStepper = createCustomElementBridge<StepperBridgeProps>({
  tagName: STEPPER_TAG,
  properties: ['value', 'min', 'max', 'name'],
  events: {
    onQuantityChange: 'quantity-change',
  },
});

export const PreactBadge = createCustomElementBridge<BadgeBridgeProps>({
  tagName: BADGE_TAG,
  properties: ['count'],
  events: {
    onBadgeClick: 'badge-click',
  },
});

export function usePreactWebComponentsViewModel() {
  const itemsStore = PreactWebComponentsStoresContext.useStore('items');
  const discountStore =
    PreactWebComponentsStoresContext.useStore('discountEnabled');
  const ticketStore =
    PreactWebComponentsStoresContext.useStore('submittedTicket');
  const auditStore = PreactWebComponentsStoresContext.useStore('auditLog');

  const items = useStoreValue(itemsStore);
  const discountEnabled = useStoreValue(discountStore);
  const submittedTicket = useStoreValue(ticketStore);
  const auditLog = useStoreValue(auditStore);

  const dispatch = PreactWebComponentsActionsContext.useActionDispatch();

  const summary = useMemo(() => {
    return calculateOrderSummary(items, discountEnabled, 10);
  }, [items, discountEnabled]);

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      void dispatch('quantityUpdated', { productId, quantity });
    },
    [dispatch]
  );

  const toggleDiscount = useCallback(
    (enabled: boolean) => {
      void dispatch('discountToggled', { enabled });
    },
    [dispatch]
  );

  const resetCart = useCallback(() => {
    void dispatch('cartReset');
  }, [dispatch]);

  const submitTicketForm = useCallback(
    (
      attendeeName: string,
      ticketType: string,
      count: number,
      specialRequest: string
    ) => {
      void dispatch('ticketSubmitted', {
        attendeeName,
        ticketType,
        count,
        specialRequest,
      });
    },
    [dispatch]
  );

  return {
    items,
    discountEnabled,
    submittedTicket,
    auditLog,
    summary,
    updateQuantity,
    toggleDiscount,
    resetCart,
    submitTicketForm,
    PreactStepper,
    PreactBadge,
  };
}
