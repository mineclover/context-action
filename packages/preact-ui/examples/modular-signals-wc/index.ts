import { computed } from '@preact/signals';
import type { ReadonlySignal } from '@preact/signals';
import {
  cartItemsSignal as writableCartItemsSignal,
  cartItemCountSignal,
  cartGrandTotalSignal,
  addProductToCart,
  removeProductFromCart,
  clearCart,
} from './shared-cart-signal.js';
import type { CartProduct } from './shared-cart-signal.js';

// The example entry exposes a read-only projection; the writable domain signal
// remains private to the domain module and its intent functions.
export const cartItemsSignal: ReadonlySignal<readonly CartProduct[]> = computed(
  () => writableCartItemsSignal.value,
);
export { cartItemCountSignal, cartGrandTotalSignal, addProductToCart, removeProductFromCart, clearCart };
export type { CartProduct };
export * from './cart-badge-element.js';
export * from './cart-drawer-element.js';
export * from './quantity-stepper-element.js';
