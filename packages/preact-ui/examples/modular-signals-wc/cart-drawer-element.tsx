import { definePreactElement } from '../../src/custom-element.js';
import {
  cartGrandTotalSignal,
  cartItemCountSignal,
  cartItemsSignal,
  clearCart,
  removeProductFromCart,
} from './shared-cart-signal.js';

export function defineCartDrawerElement(tagName = 'cart-drawer'): CustomElementConstructor {
  return definePreactElement({
    tagName,
    style: `
      :host {
        display: block;
        max-width: 480px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        font-family: system-ui, -apple-system, sans-serif;
        color: #0f172a;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #f1f5f9;
        padding-bottom: 12px;
        margin-bottom: 16px;
      }
      .title {
        font-size: 18px;
        font-weight: 700;
        margin: 0;
      }
      .item-list {
        list-style: none;
        padding: 0;
        margin: 0 0 16px 0;
      }
      .item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 0;
        border-bottom: 1px dashed #e2e8f0;
      }
      .item-title {
        font-weight: 600;
        font-size: 14px;
      }
      .item-sub {
        font-size: 13px;
        color: #64748b;
      }
      .btn-del {
        background: none;
        border: none;
        color: #ef4444;
        cursor: pointer;
        font-size: 12px;
        padding: 4px;
      }
      .btn-del:hover {
        text-decoration: underline;
      }
      .footer {
        padding-top: 12px;
        border-top: 1px solid #e2e8f0;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        font-size: 16px;
        font-weight: 700;
        margin-bottom: 16px;
      }
      .actions {
        display: flex;
        gap: 8px;
      }
      .btn-checkout {
        flex: 1;
        padding: 10px 16px;
        background: #16a34a;
        color: #ffffff;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
      }
      .btn-checkout:hover {
        background: #15803d;
      }
      .btn-checkout:disabled {
        background: #cbd5e1;
        cursor: not-allowed;
      }
      .btn-clear {
        padding: 10px 14px;
        background: #f1f5f9;
        color: #475569;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        cursor: pointer;
      }
      .empty-msg {
        color: #94a3b8;
        font-size: 14px;
        text-align: center;
        padding: 24px 0;
      }
    `,
    setup(element) {
      function CartDrawerView() {
        const items = cartItemsSignal.value;
        const count = cartItemCountSignal.value;

        return (
          <div>
            <div class="header">
              <h3 class="title">장바구니 목록</h3>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                총 {count}개 상품
              </span>
            </div>

            {items.length === 0 ? (
              <div class="empty-msg" data-testid="empty-cart-msg">
                장바구니가 비어 있습니다.
              </div>
            ) : (
              <ul class="item-list">
                {items.map((item) => (
                  <li key={item.id} class="item">
                    <div>
                      <div class="item-title">{item.name}</div>
                      <div class="item-sub">
                        ${item.price} × {item.quantity}
                      </div>
                    </div>
                    <div>
                      <button
                        type="button"
                        class="btn-del"
                        aria-label={`삭제 ${item.name}`}
                        onClick={() => removeProductFromCart(item.id)}
                      >
                        삭제
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div class="footer">
              <div class="total-row">
                <span>합계:</span>
                {/* Fine-grained direct signal binding */}
                <output data-testid="cart-drawer-total">
                  {cartGrandTotalSignal}
                </output>
              </div>

              <div class="actions">
                <button
                  type="button"
                  class="btn-checkout"
                  disabled={count === 0}
                  onClick={() => {
                    element.dispatchEvent(
                      new CustomEvent('cart-checkout', {
                        detail: {
                          items: cartItemsSignal.value,
                          total: cartGrandTotalSignal.value,
                        },
                        bubbles: true,
                        composed: true,
                      }),
                    );
                  }}
                >
                  주문 결제하기
                </button>
                <button
                  type="button"
                  class="btn-clear"
                  disabled={count === 0}
                  onClick={() => clearCart()}
                >
                  비우기
                </button>
              </div>
            </div>
          </div>
        );
      }

      return {
        view: CartDrawerView,
        getInput: () => undefined,
      };
    },
  });
}
