/**
 * @module cart-badge-element
 *
 * Purpose:
 *   Defines `<cart-badge>`, an independent Shadow DOM Custom Element that binds
 *   directly to the shared Tier-3 `cartItemCountSignal` text node without
 *   component-level VDOM re-rendering.
 *
 * Invariants:
 *   - Subscribes to `cartItemCountSignal` via direct JSX signal child binding.
 *   - Emits `cart-badge-click` with `{ bubbles: true, composed: true }` on user click.
 */
import { definePreactElement } from '../../src/custom-element.js';
import type { ManagedPreactElement, PreactCustomElementConstructor } from '../../src/custom-element.js';
import { cartItemCountSignal } from './shared-cart-signal.js';

export interface CartBadgeClickEventDetail {
  readonly count: number;
}

export type CartBadgeElement = ManagedPreactElement<undefined>;

export function defineCartBadgeElement(
  tagName = 'cart-badge',
): PreactCustomElementConstructor<undefined> {
  return definePreactElement<undefined>({
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
