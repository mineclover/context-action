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

  it('keeps generated field ids unique across light-DOM mounts', () => {
    const firstModel = createOrderModel({ customerName: 'First' });
    const secondModel = createOrderModel({ customerName: 'Second' });
    cleanups.push(() => firstModel.destroy(), () => secondModel.destroy());

    const firstHost = createHost();
    const secondHost = createHost();
    const firstMount = mountOrderWorkspace(firstHost, firstModel);
    const secondMount = mountOrderWorkspace(secondHost, secondModel);
    cleanups.push(() => firstMount.destroy(), () => secondMount.destroy());

    const ids = Array.from(document.querySelectorAll('[id]'), node => node.id).filter(Boolean);
    expect(new Set(ids).size).toBe(ids.length);
    for (const host of [firstHost, secondHost]) {
      const input = host.querySelector<HTMLInputElement>('[data-testid="input-customer-name"]');
      const label = input ? host.querySelector(`label[for="${input.id}"]`) : null;
      expect(input?.id).toBeTruthy();
      expect(label).not.toBeNull();
    }
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

  it('publishes frozen cached snapshots that cannot mutate the model silently', () => {
    const model = createOrderModel({
      items: [{ id: 'snapshot', name: 'Snapshot', unitPrice: 1, quantity: 2 }],
    });
    cleanups.push(() => model.destroy());

    const snapshot = model.source.getSnapshot();
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.draft.items)).toBe(true);
    expect(() => { snapshot.draft.items[0]!.quantity = 99; }).toThrow(TypeError);
    expect(model.source.getSnapshot().draft.items[0]?.quantity).toBe(2);
  });

  it('ignores a delayed submission commit after the model is destroyed', async () => {
    const model = createOrderModel({
      submitDelayMs: 20,
      customerName: 'Delayed',
      shippingAddress: 'Address',
      items: [{ id: 'late', name: 'Late', unitPrice: 1, quantity: 1 }],
    });
    const pending = model.dispatch('submitOrder');
    const afterStart = model.source.getSnapshot();
    model.destroy();
    await expect(pending).resolves.toBeUndefined();
    expect(model.source.getSnapshot()).toBe(afterStart);
  });

  it('cancels a delayed submission when the draft is reset', async () => {
    const model = createOrderModel({
      submitDelayMs: 20,
      customerName: 'Reset me',
      shippingAddress: 'Address',
      items: [{ id: 'reset-late', name: 'Reset late', unitPrice: 1, quantity: 1 }],
    });
    const pending = model.dispatch('submitOrder');
    await model.dispatch('resetDraft');
    await expect(pending).resolves.toBeUndefined();

    const snapshot = model.source.getSnapshot();
    expect(snapshot.submission.phase).toBe('idle');
    expect(snapshot.draft.customerName).toBe('');
    expect(snapshot.draft.items).toHaveLength(0);
    model.destroy();
  });

  it('does not start two remote submissions for concurrent dispatches', async () => {
    for (const submitDelayMs of [0, 20]) {
      const model = createOrderModel({
        submitDelayMs,
        customerName: 'Once',
        shippingAddress: 'Address',
        items: [{ id: 'once', name: 'Once', unitPrice: 1, quantity: 1 }],
      });
      await Promise.all([model.dispatch('submitOrder'), model.dispatch('submitOrder')]);

      const successEntries = model.source.getSnapshot().activityLog
        .filter(entry => entry.message.startsWith('Order successfully placed:'));
      expect(successEntries).toHaveLength(1);
      model.destroy();
    }
  });

  it('allows a new submission after a draft change cancels an older request', async () => {
    const model = createOrderModel({
      submitDelayMs: 20,
      customerName: 'First',
      shippingAddress: 'Address',
      items: [{ id: 'replace', name: 'Replace', unitPrice: 1, quantity: 1 }],
    });
    const oldRequest = model.dispatch('submitOrder');
    await model.dispatch('updateCustomerName', { name: 'Second' });
    const newRequest = model.dispatch('submitOrder');
    await Promise.all([oldRequest, newRequest]);

    expect(model.source.getSnapshot().submission.phase).toBe('success');
    expect(model.source.getSnapshot().draft.customerName).toBe('Second');
    model.destroy();
  });
});
