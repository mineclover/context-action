import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act } from 'preact/test-utils';
import {
  addProductToCart,
  clearCart,
  defineCartBadgeElement,
  defineCartDrawerElement,
  defineQuantityStepperElement,
} from '../examples/modular-signals-wc/index.js';

describe('Modular Signals & Multi-Web-Component Integration', () => {
  beforeEach(() => {
    clearCart();
    addProductToCart({ id: 'init_1', name: 'Clean Architecture', price: 30 }, 1);
  });

  afterEach(() => {
    clearCart();
    document.body.replaceChildren();
  });

  it('synchronizes shared signals across multiple independent Custom Elements without Virtual DOM collisions', async () => {
    const BadgeTag = defineCartBadgeElement('test-multi-badge');
    const DrawerTag = defineCartDrawerElement('test-multi-drawer');

    const badgeEl = new BadgeTag();
    const drawerEl = new DrawerTag();

    // Place elements in completely different DOM branches
    const headerNav = document.createElement('nav');
    const sidebar = document.createElement('aside');
    headerNav.append(badgeEl);
    sidebar.append(drawerEl);
    document.body.append(headerNav, sidebar);

    // Initial check in both Shadow DOMs
    const badgeCount = badgeEl.shadowRoot?.querySelector('[data-testid="cart-badge-count"]');
    const drawerTotal = drawerEl.shadowRoot?.querySelector('[data-testid="cart-drawer-total"]');

    expect(badgeCount?.textContent).toBe('1');
    expect(drawerTotal?.textContent).toBe('$30.00');

    // External pure domain call: add item to cart
    await act(async () => {
      addProductToCart({ id: 'item_react', name: 'React 19 Deep Dive', price: 50 }, 2);
    });

    // Both independent custom elements update fine-grained instantly!
    expect(badgeCount?.textContent).toBe('3');
    // subtotal = 30 + 100 = $130.00
    expect(drawerTotal?.textContent).toBe('$130.00');
  });

  it('dispatches custom events across shadow boundaries from modular custom elements', async () => {
    const DrawerTag = defineCartDrawerElement('test-event-drawer');
    const drawerEl = new DrawerTag();
    document.body.append(drawerEl);

    let checkoutFired = false;
    let checkoutTotal = '';

    drawerEl.addEventListener('cart-checkout', (e: Event) => {
      const custom = e as CustomEvent<{ total: string }>;
      checkoutFired = true;
      checkoutTotal = custom.detail.total;
    });

    const checkoutBtn = drawerEl.shadowRoot?.querySelector<HTMLButtonElement>('.btn-checkout');
    expect(checkoutBtn).not.toBeNull();

    await act(async () => {
      checkoutBtn?.click();
    });

    expect(checkoutFired).toBe(true);
    expect(checkoutTotal).toBe('$30.00');
  });

  it('cleans up drawer items when clearCart is called and shows empty state', async () => {
    const DrawerTag = defineCartDrawerElement('test-clear-drawer');
    const drawerEl = new DrawerTag();
    document.body.append(drawerEl);

    expect(drawerEl.shadowRoot?.querySelector('[data-testid="empty-cart-msg"]')).toBeNull();

    await act(async () => {
      clearCart();
    });

    expect(drawerEl.shadowRoot?.querySelector('[data-testid="empty-cart-msg"]')).not.toBeNull();
  });

  it('does not echo initial or programmatic stepper changes as user events', async () => {
    const StepperTag = defineQuantityStepperElement('test-contract-stepper');
    const stepper = new StepperTag();
    let changes = 0;
    stepper.addEventListener('quantity-change', () => { changes += 1; });
    stepper.setAttribute('value', '3');
    document.body.append(stepper);
    expect(changes).toBe(0);

    await act(() => { stepper.shadowRoot?.querySelectorAll('button')[1]?.click(); });
    expect(changes).toBe(1);

    stepper.setAttribute('value', '7');
    expect(changes).toBe(1);
  });
});
