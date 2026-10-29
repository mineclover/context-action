/**
 * @fileoverview Main entry point for @context-action/lit-ui.
 * Primitives, Form-Associated Custom Elements (FACE), W3C Context Protocol DI,
 * and reference Web Components. The optional React bridge lives in the
 * `@context-action/lit-ui/react-bridge` subpath so Lit-only consumers do not
 * load React at module evaluation time.
 *
 * @implements view-layer
 * @implements web-component-primitive
 * @memberof core-concepts
 */

export type { ControllerScopeOptions } from '@context-action/lit';
// Shared ReactiveController lifecycle scope (implemented in @context-action/lit)
export { ControllerScope } from '@context-action/lit';
export type { CartBadgeClickEventDetail } from './components/cart-badge.js';
export {
  cartStoreContext,
  defaultCartCountSelector,
  LitCartBadge,
} from './components/cart-badge.js';
export type { QuantityChangeEventDetail } from './components/quantity-stepper.js';
// Reference Custom Elements & Components
export { LitQuantityStepper } from './components/quantity-stepper.js';
export type {
  Context,
  ContextActionControllerOptions,
  ContextStoreControllerOptions,
} from './context.js';
// W3C Context Protocol (@lit/context) Dependency Injection
export {
  actionDispatcherContext,
  actionRegisterContext,
  ContextActionController,
  ContextConsumer,
  ContextProvider,
  ContextStoreController,
  createActionDispatcherContext,
  createActionRegisterContext,
  createContext,
  createStoreContext,
  provideActionDispatcher,
  provideActionRegister,
  provideStore,
} from './context.js';
export type { ImperativeHandleFactory, PublicActionMethods } from './facade.js';
// Framework-neutral facade (the optional React bridge is a subpath entry).
export { createElementFacade } from './facade.js';
export type { ValidityStateFlags } from './form-associated-element.js';
// Form-Associated Custom Elements (FACE)
export { FormAssociatedLitElement } from './form-associated-element.js';
