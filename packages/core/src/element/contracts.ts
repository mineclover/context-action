import type { PublicHandleFactory } from '../facade/types.js';

export type ImperativeHandleFactory<Element extends HTMLElement, Handle> = PublicHandleFactory<Element, Handle>;

/** Transport configuration only; semantic validation and commit authority belong to the component. */
export interface ElementBindingConfig<Props extends object> {
  properties?: readonly (keyof Props)[];
  events?: Record<string, string>;
}

export interface ElementBridgeConfig<Props extends object, Element extends HTMLElement = HTMLElement, Handle = Element>
  extends ElementBindingConfig<Props> {
  createHandle?: ImperativeHandleFactory<Element, Handle>;
}

export interface ElementBridgeContract<Props extends object, Element extends HTMLElement = HTMLElement, Handle = Element>
  extends ElementBridgeConfig<Props, Element, Handle> {
  tagName: string;
}

export interface ElementBindingOptions {
  assignmentErrors?: 'ignore' | 'throw';
}

/** One target, complete input snapshots, explicit terminal disposal. Never owns renderer teardown. */
export interface ElementBinding<Props extends object> {
  readonly disposed: boolean;
  /** Reconcile events first, then properties, to capture synchronous setter events. */
  update(input: Props): void;
  updateProperties(input: Props): void;
  updateEvents(input: Props): void;
  /** Replayable listener cleanup; property ownership survives lifecycle replay. */
  disconnectEvents(): void;
  /** Terminal, idempotent; does not reset properties, remove DOM, or call target.dispose(). */
  dispose(): void;
}
