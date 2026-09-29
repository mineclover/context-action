import { definePreactElement } from '../../src/custom-element.js';
import { cartItemCountSignal } from './shared-cart-signal.js';

export function defineCartBadgeElement(tagName = 'cart-badge'): CustomElementConstructor {
  return definePreactElement({
    tagName,
    style: `
      :host {
        display: inline-block;
        vertical-align: middle;
      }
      .badge-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: #2563eb;
        color: #ffffff;
        border: none;
        border-radius: 9999px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s ease;
      }
      .badge-btn:hover {
        background: #1d4ed8;
      }
      .badge-count {
        background: #ffffff;
        color: #2563eb;
        padding: 2px 7px;
        border-radius: 9999px;
        font-size: 12px;
        font-weight: 700;
      }
    `,
    setup(element) {
      function CartBadgeView() {
        return (
          <button
            type="button"
            class="badge-btn"
            onClick={() => {
              element.dispatchEvent(
                new CustomEvent('cart-badge-click', {
                  detail: { count: cartItemCountSignal.value },
                  bubbles: true,
                  composed: true,
                }),
              );
            }}
          >
            <span>🛒 장바구니</span>
            {/* Fine-grained Signal direct binding */}
            <span class="badge-count" data-testid="cart-badge-count">
              {cartItemCountSignal}
            </span>
          </button>
        );
      }

      return {
        view: CartBadgeView,
        getInput: () => undefined,
      };
    },
  });
}
