/**
 * @fileoverview Main entry point for @context-action/lit-ui.
 * Primitives, Form-Associated Custom Elements (FACE), W3C Context Protocol DI,
 * React 18/19 custom element bridge, and reference Web Components.
 *
 * @implements view-layer
 * @implements web-component-primitive
 * @memberof core-concepts
 */

// Form-Associated Custom Elements (FACE)
export { FormAssociatedLitElement } from './form-associated-element.js';
export type { ValidityStateFlags } from './form-associated-element.js';

// W3C Context Protocol (@lit/context) Dependency Injection
export {
  actionRegisterContext,
  actionDispatcherContext,
  createStoreContext,
  createActionRegisterContext,
  createActionDispatcherContext,
  provideActionRegister,
  provideActionDispatcher,
  provideStore,
  ContextStoreController,
  ContextActionController,
  ContextProvider,
  ContextConsumer,
  createContext,
} from './context.js';
export type {
  Context,
  ContextStoreControllerOptions,
  ContextActionControllerOptions,
} from './context.js';

// React 18/19 Custom Element Bridge
export {
  createLitElementBridge,
  createLitBridge,
  createCustomElementBridge,
} from './react-bridge.js';
export type {
  LitBridgeConfig,
  LitBridgeOptions,
  LitElementComponent,
} from './react-bridge.js';

// Reference Custom Elements & Components
export { LitQuantityStepper } from './components/quantity-stepper.js';
export type { QuantityChangeEventDetail } from './components/quantity-stepper.js';

export {
  LitCartBadge,
  cartStoreContext,
  defaultCartCountSelector,
} from './components/cart-badge.js';
export type { CartBadgeClickEventDetail } from './components/cart-badge.js';
