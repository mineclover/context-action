import { describe, expect, it } from 'vitest';
import * as standaloneEs from '../dist-standalone/order-workspace.es.js';

describe('Standalone Bundle Exports Contract', () => {
  it('exports order workspace orchestration primitives', () => {
    expect(typeof standaloneEs.createOrderModel).toBe('function');
    expect(typeof standaloneEs.mountOrderWorkspace).toBe('function');
    expect(typeof standaloneEs.defineOrderWorkspaceElement).toBe('function');
  });

  it('exports modular custom elements and domain signals', () => {
    expect(typeof standaloneEs.defineCartBadgeElement).toBe('function');
    expect(typeof standaloneEs.defineCartDrawerElement).toBe('function');
    expect(typeof standaloneEs.addProductToCart).toBe('function');
    expect(typeof standaloneEs.removeProductFromCart).toBe('function');
    expect(typeof standaloneEs.clearCart).toBe('function');
    expect(standaloneEs.cartItemsSignal).toBeDefined();
    expect(standaloneEs.cartItemCountSignal).toBeDefined();
    expect(standaloneEs.cartGrandTotalSignal).toBeDefined();
  });
});
