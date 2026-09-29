import { createOrderModel } from './handlers/order-handlers.js';
import { mountOrderWorkspace } from './mount-order-workspace.js';
import { defineOrderWorkspaceElement } from './order-element.js';

// Auto-register custom element in browser environment
if (typeof window !== 'undefined' && typeof window.customElements !== 'undefined') {
  try {
    defineOrderWorkspaceElement('order-workspace');
  } catch {
    // Already registered or unsupported
  }
}

export {
  createOrderModel,
  mountOrderWorkspace,
  defineOrderWorkspaceElement,
};
