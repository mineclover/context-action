/**
 * Context Definitions & Types Layer (5-Layer Architecture)
 *
 * This layer defines:
 * - TypeScript interfaces and types
 * - Action payload maps
 * - Store schemas
 * - Context creation
 */

import { ActionPayloadMap } from '@context-action/core';
import { createActionContext, createStoreContext } from '@context-action/react';

// 🎯 Domain Types
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  validatedBy: string;
}

export interface CalculationResult {
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
  timestamp: number;
  calculatedBy: string;
}

export interface ProcessingResult {
  orderId: string;
  status: 'processing' | 'completed' | 'failed';
  processedBy: string;
  timestamp: number;
}

// 🎯 Action Payload Map
export interface CartActions extends ActionPayloadMap {
  validateCart: { items: CartItem[] };
  calculateTotal: { items: CartItem[]; discountCode?: string };
  processOrder: { items: CartItem[]; paymentMethod: string };
  clearCart: void;
}

// 🎯 Store Schema
export interface CartStores {
  cart: CartItem[];
  validation: ValidationResult | null;
  calculation: CalculationResult | null;
  order: ProcessingResult | null;
}

// 🎯 Context Creation
export const {
  Provider: CartActionProvider,
  useActionDispatch: useCartAction,
  useActionHandler: useCartActionHandler,
  useActionDispatchWithResult: useCartActionWithResult,
} = createActionContext<CartActions>({ name: 'Cart' });

export const { Provider: CartStoreProvider, useStore: useCartStore } =
  createStoreContext('CartStores', {
    cart: { initialValue: [] as CartItem[] },
    validation: {
      initialValue: {
        isValid: false,
        errors: [],
        validatedBy: 'initial',
      } as ValidationResult,
    },
    calculation: {
      initialValue: {
        subtotal: 0,
        tax: 0,
        total: 0,
        itemCount: 0,
        timestamp: Date.now(),
        calculatedBy: 'initial',
      } as CalculationResult,
    },
    order: {
      initialValue: {
        orderId: '',
        status: 'processing' as const,
        processedBy: 'initial',
        timestamp: Date.now(),
      } as ProcessingResult,
    },
  });
