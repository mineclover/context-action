export { createDisposalScope } from './disposal-scope.js';
export type { DisposalScope } from './disposal-scope.js';
export { mountPreact } from './mount.js';
export type { MountInstance, OwnedView } from './mount.js';
export type { MountRoot } from './ownership.js';
export { hydratePreact } from './hydrate.js';
export type { HydrationInstance, HydratedView } from './hydrate.js';
export { mountTemplate } from './template.js';
export { createElementFacade } from './facade.js';
export type { ImperativeHandleFactory, PublicActionMethods } from './facade.js';
export { definePreactElement } from './custom-element.js';
export type {
  ExposeContract,
  ManagedPreactElement,
  PreactCustomElementConstructor,
  PreactElementConfig,
  PreactElementLifecycle,
  ReservedElementKey,
} from './custom-element.js';
