import { afterEach, describe, expect, it } from 'vitest';
import { act } from 'preact/test-utils';
import { defineOrderWorkspaceElement } from '../examples/projected-order/order-element.js';

describe('<order-workspace> Web Component contract', () => {
  let cleanups: Array<() => void> = [];

  afterEach(() => {
    for (const cleanup of cleanups) cleanup();
    cleanups = [];
    document.body.replaceChildren();
  });

  it('mounts into Shadow DOM and binds attributes to inputs', async () => {
    const Tag = defineOrderWorkspaceElement('test-order-workspace-1');
    const element = new Tag() as HTMLElement & {
      customerName: string;
      shippingAddress: string;
      dispose(): void;
    };
    cleanups.push(() => element.dispose());

    element.setAttribute('customer-name', 'Lee Soon Shin');
    element.setAttribute('shipping-address', 'Seoul Jingu');
    document.body.append(element);

    const shadow = element.shadowRoot;
    expect(shadow).not.toBeNull();

    // Verify inputs reflect initial attributes
    const nameInput = shadow?.querySelector<HTMLInputElement>('[data-testid="input-customer-name"]');
    const addressInput = shadow?.querySelector<HTMLInputElement>('[data-testid="input-shipping-address"]');

    expect(nameInput?.value).toBe('Lee Soon Shin');
    expect(addressInput?.value).toBe('Seoul Jingu');
    expect(element.customerName).toBe('Lee Soon Shin');
  });

  it('dispatches order-change events when items are added imperatively', async () => {
    const Tag = defineOrderWorkspaceElement('test-order-workspace-2');
    const element = new Tag() as HTMLElement & {
      addItem: (item: { id: string; name: string; unitPrice: number; quantity: number }) => Promise<void>;
      items: ReadonlyArray<{ id: string; quantity: number }>;
      dispose(): void;
    };
    cleanups.push(() => element.dispose());
    document.body.append(element);

    let eventFired = false;
    let changedItemCount = 0;
    let lastDetail: { draft: { items: Array<{ id: string; quantity: number }> } } | undefined;

    element.addEventListener('order-change', (e: Event) => {
      const custom = e as CustomEvent<{ draft: { items: Array<{ id: string }> } }>;
      eventFired = true;
      changedItemCount = custom.detail.draft.items.length;
      lastDetail = custom.detail as typeof lastDetail;
    });

    await act(async () => {
      await element.addItem({
        id: 'web_comp_item_1',
        name: 'Web Component Guide',
        unitPrice: 25,
        quantity: 2,
      });
    });

    expect(eventFired).toBe(true);
    expect(changedItemCount).toBe(1);
    lastDetail!.draft.items[0]!.quantity = 99;
    expect(element.items[0]?.quantity).toBe(2);

    const shadow = element.shadowRoot;
    const summaryCount = shadow?.querySelector('[data-testid="summary-count"]');
    expect(summaryCount?.textContent).toBe('2');
  });

  it('validates public string properties and returns defensive item snapshots', async () => {
    const Tag = defineOrderWorkspaceElement('test-order-workspace-public-contract');
    const element = new Tag() as HTMLElement & {
      customerName: string;
      items: ReadonlyArray<{ id: string; quantity: number }>;
      addItem: (item: { id: string; name: string; unitPrice: number; quantity: number }) => Promise<void>;
      dispose(): void;
    };
    cleanups.push(() => element.dispose());
    document.body.append(element);

    await act(async () => {
      await element.addItem({ id: 'defensive', name: 'Defensive', unitPrice: 10, quantity: 2 });
    });
    const items = element.items as Array<{ id: string; quantity: number }>;
    items[0]!.quantity = 77;
    expect(element.items[0]?.quantity).toBe(2);

    expect(() => { element.customerName = 42 as unknown as string; }).toThrow(TypeError);
    expect(element.customerName).toBe('');
  });

  it('preserves model state across DOM disconnection and reconnection', async () => {
    const Tag = defineOrderWorkspaceElement('test-order-workspace-3');
    const element = new Tag() as HTMLElement & {
      customerName: string;
      addItem: (item: { id: string; name: string; unitPrice: number; quantity: number }) => Promise<void>;
      dispose(): void;
    };
    cleanups.push(() => element.dispose());
    document.body.append(element);

    await act(async () => {
      element.customerName = 'Persistent User';
      await element.addItem({
        id: 'persist_1',
        name: 'Persistent Item',
        unitPrice: 50,
        quantity: 1,
      });
    });

    const shadow = element.shadowRoot;
    expect(shadow?.querySelector('[data-testid="input-customer-name"]')?.getAttribute('value') || element.customerName).toBe('Persistent User');

    // Disconnect element from DOM
    element.remove();
    expect(element.isConnected).toBe(false);

    // Reconnect element to DOM
    document.body.append(element);
    expect(element.isConnected).toBe(true);

    // State is maintained!
    expect(element.customerName).toBe('Persistent User');
    const reconnectedShadow = element.shadowRoot;
    const count = reconnectedShadow?.querySelector('[data-testid="summary-count"]');
    expect(count?.textContent).toBe('1');
  });

  it('stops connection events while disconnected and resumes from the latest snapshot', async () => {
    const Tag = defineOrderWorkspaceElement('test-order-workspace-4');
    const element = new Tag() as HTMLElement & {
      addItem: (item: { id: string; name: string; unitPrice: number; quantity: number }) => Promise<void>;
      dispose(): void;
    };
    cleanups.push(() => element.dispose());
    let changes = 0;
    element.addEventListener('order-change', () => { changes += 1; });
    document.body.append(element);
    await act(async () => {
      await element.addItem({ id: 'connected', name: 'Connected', unitPrice: 10, quantity: 1 });
    });
    const connectedChanges = changes;

    element.remove();
    await element.addItem({ id: 'disconnected', name: 'Disconnected', unitPrice: 20, quantity: 1 });
    expect(changes).toBe(connectedChanges);

    document.body.append(element);
    expect(element.shadowRoot?.querySelector('[data-testid="summary-count"]')?.textContent).toBe('2');
  });
});
