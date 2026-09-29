import { computed, signal } from '@preact/signals';
import type { ReadonlySignal } from '@preact/signals';

export interface CartProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

/**
 * Level 1: Pure Domain Signal Module.
 * Completely decoupled from DOM, HTMLElement, and Virtual DOM renderers.
 * Can be imported by any Custom Element, React component, or vanilla JS code.
 */
export const cartItemsSignal = signal<readonly CartProduct[]>([
  { id: 'prod_1', name: 'TypeScript Design Patterns', price: 35, quantity: 1 },
]);

export const cartItemCountSignal: ReadonlySignal<number> = computed(() =>
  cartItemsSignal.value.reduce((sum, item) => sum + item.quantity, 0),
);

export const cartGrandTotalSignal: ReadonlySignal<string> = computed(() => {
  const total = cartItemsSignal.value.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total);
});

// Pure Business Intent Functions
export function addProductToCart(product: Omit<CartProduct, 'quantity'>, qty = 1) {
  const current = [...cartItemsSignal.value];
  const idx = current.findIndex((item) => item.id === product.id);
  if (idx >= 0) {
    const existing = current[idx]!;
    current[idx] = { ...existing, quantity: existing.quantity + qty };
  } else {
    current.push({ ...product, quantity: qty });
  }
  cartItemsSignal.value = current;
}

export function removeProductFromCart(productId: string) {
  cartItemsSignal.value = cartItemsSignal.value.filter((item) => item.id !== productId);
}

export function clearCart() {
  cartItemsSignal.value = [];
}
