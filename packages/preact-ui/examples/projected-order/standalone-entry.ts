import { createOrderModel } from './handlers/order-handlers.js';
import { mountOrderWorkspace } from './mount-order-workspace.js';
import { defineOrderWorkspaceElement } from './order-element.js';
import {
  defineCartBadgeElement,
  defineCartDrawerElement,
  cartItemsSignal,
  cartItemCountSignal,
  cartGrandTotalSignal,
  addProductToCart,
  removeProductFromCart,
  clearCart,
} from '../modular-signals-wc/index.js';

// Auto-register custom elements in browser environment
if (typeof window !== 'undefined' && typeof window.customElements !== 'undefined') {
  try {
    defineOrderWorkspaceElement('order-workspace');
  } catch {
    // Already registered or unsupported
  }
  try {
    defineCartBadgeElement('cart-badge');
    defineCartDrawerElement('cart-drawer');
  } catch {
    // Already registered or unsupported
  }
}

export {
  createOrderModel,
  mountOrderWorkspace,
  defineOrderWorkspaceElement,
  defineCartBadgeElement,
  defineCartDrawerElement,
  cartItemsSignal,
  cartItemCountSignal,
  cartGrandTotalSignal,
  addProductToCart,
  removeProductFromCart,
  clearCart,
};
