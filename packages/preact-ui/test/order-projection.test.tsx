import { afterEach, describe, expect, it } from 'vitest';
import { act } from 'preact/test-utils';
import {
  createOrderModel,
  mountOrderWorkspace,
} from '../examples/projected-order/index.js';

describe('Projected Order Reference Implementation (Preact Signals & Context-Layered)', () => {
  let cleanups: Array<() => void> = [];

  afterEach(() => {
    for (const cleanup of cleanups) cleanup();
    cleanups = [];
    document.body.replaceChildren();
  });

  function createHost() {
    const el = document.createElement('div');
    document.body.append(el);
    return el;
  }

  it('projects order state into fine-grained signals and updates summary automatically', async () => {
    const model = createOrderModel({
      customerName: 'Bob Builder',
      shippingAddress: '123 Construction Way',
      items: [
        { id: 'item_1', name: 'Hammer', unitPrice: 20, quantity: 2 },
      ],
    });
    cleanups.push(() => model.destroy());

    const host = createHost();
    const mount = mountOrderWorkspace(host, model);
    cleanups.push(() => mount.destroy());

    // Verify initial projection in DOM
    const grandTotal = host.querySelector('[data-testid="summary-grand-total"]');
    const itemCount = host.querySelector('[data-testid="summary-count"]');
    expect(itemCount?.textContent).toBe('2');
    // subtotal = 40, tax = 4, grandTotal = $44.00
    expect(grandTotal?.textContent).toBe('$44.00');

    // Add another item via business dispatch
    await act(async () => {
      await model.dispatch('addItem', {
        item: { id: 'item_2', name: 'Nails', unitPrice: 10, quantity: 1 },
      });
    });

    // Verify fine-grained projection update
    // subtotal = 50, tax = 5, grandTotal = $55.00
    expect(itemCount?.textContent).toBe('3');
    expect(grandTotal?.textContent).toBe('$55.00');
  });

  it('validates order draft and drives submission FSM transitions', async () => {
    // Model starting with missing shipping address
    const model = createOrderModel({
      customerName: 'Alice',
      shippingAddress: '',
      items: [{ id: 'item_1', name: 'Book', unitPrice: 15, quantity: 1 }],
    });
    cleanups.push(() => model.destroy());

    const host = createHost();
    const mount = mountOrderWorkspace(host, model);
    cleanups.push(() => mount.destroy());

    // Initially shipping address error exists
    const submitBtn = host.querySelector<HTMLButtonElement>('[data-testid="btn-submit-order"]');
    expect(submitBtn).not.toBeNull();
    // canSubmitSignal should be true because items are present, but validation fails on submit
    expect(submitBtn?.disabled).toBe(false);

    // Try submit -> fails validation
    await act(async () => {
      submitBtn?.click();
    });

    const shippingError = host.querySelector('[data-testid="error-shipping-address"]');
    expect(shippingError?.textContent).toContain('Shipping address is required');

    // Fix shipping address via input event
    const addressInput = host.querySelector<HTMLInputElement>('[data-testid="input-shipping-address"]');
    await act(async () => {
      if (addressInput) {
        addressInput.value = '456 Wonderland Ave';
        addressInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    // Error should disappear
    expect(host.querySelector('[data-testid="error-shipping-address"]')).toBeNull();

    // Submit again -> transitions validating -> submitting -> success
    await act(async () => {
      submitBtn?.click();
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // Placed order banner should be rendered
    const placedId = host.querySelector('[data-testid="placed-order-id"]');
    expect(placedId).not.toBeNull();
    expect(placedId?.textContent).toMatch(/^ORD-/);
  });

  it('cleans up renderer and signal subscriptions on destruction', () => {
    const model = createOrderModel({
      customerName: 'Charlie',
      shippingAddress: '789 Pine St',
      items: [],
    });
    cleanups.push(() => model.destroy());

    const host = createHost();
    const mount = mountOrderWorkspace(host, model);

    expect(host.childNodes.length).toBeGreaterThan(0);

    mount.destroy();

    // DOM children unmounted cleanly
    expect(host.childNodes.length).toBe(0);
    expect(mount.instance.destroyed).toBe(true);
  });
});
