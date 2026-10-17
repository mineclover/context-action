import type { ReadonlySignal } from '@preact/signals';
import type { ManagedPreactElement } from '../../src/custom-element.js';
import { createElementFacade } from '../../src/facade.js';
import type { ImperativeHandleFactory, PublicActionMethods } from '../../src/facade.js';
import type { OrderActions, OrderItem, OrderState } from './business/order-types.js';
import type { OrderModel } from './handlers/order-handlers.js';

export interface OrderSubmitEventDetail {
  orderId: string;
}

export interface OrderWorkspaceSnapshot {
  readonly customerName: string;
  readonly shippingAddress: string;
  readonly items: readonly OrderItem[];
  readonly phase: OrderState['submission']['phase'];
  readonly orderId?: string;
  readonly canSubmit: boolean;
}

/**
 * Host-agnostic OOP Imperative Handle for the Order Workspace.
 * Hides raw HTMLElement, ShadowRoot, and internal Preact Signals while
 * exposing semantic properties, snapshot queries, and command methods.
 */
export interface OrderWorkspaceHandle {
  customerName: string;
  shippingAddress: string;
  readonly items: readonly OrderItem[];
  getSnapshot(): OrderWorkspaceSnapshot;
  canSubmit(): boolean;
  addItem(item: OrderItem): Promise<void>;
  removeItem(itemId: string): Promise<void>;
  submit(): Promise<void>;
  reset(): Promise<void>;
}

/**
 * Demonstrates how `PublicActionMethods` projects selected action keys from
 * `OrderActions` into object-oriented command method signatures.
 */
export type OrderPublicActionMethods = PublicActionMethods<
  OrderActions,
  'addItem' | 'removeItem' | 'submitOrder' | 'resetDraft'
>;

export interface OrderWorkspaceInput {
  readonly dispatch: OrderModel['dispatch'];
  readonly sourceSignal: ReadonlySignal<OrderState>;
  readonly idPrefix: string;
}

export type OrderWorkspaceElement = ManagedPreactElement<OrderWorkspaceInput> &
  OrderWorkspaceHandle;

export const ORDER_WORKSPACE_HANDLE_KEYS = [
  'customerName',
  'shippingAddress',
  'items',
  'getSnapshot',
  'canSubmit',
  'addItem',
  'removeItem',
  'submit',
  'reset',
] as const satisfies readonly (keyof OrderWorkspaceHandle)[];

/**
 * Creates an encapsulated OOP imperative handle for React `useImperativeHandle`,
 * `createCustomElementBridge({ createHandle })`, or Vanilla DOM consumers,
 * hiding raw DOM APIs while preserving bound method identity per element.
 */
export const createOrderWorkspaceHandle: ImperativeHandleFactory<
  OrderWorkspaceElement,
  OrderWorkspaceHandle
> = createElementFacade<OrderWorkspaceElement, typeof ORDER_WORKSPACE_HANDLE_KEYS>(
  ORDER_WORKSPACE_HANDLE_KEYS,
);
