/** @evidenceExclude Tier 3 controlled-element contract, not a durable domain DTO. */
import { createElementFacade, type ElementBindingConfig } from '@context-action/core/element';

export interface CounterInput { readonly count: number }
export interface CounterProps {
  input?: CounterInput | undefined;
  changed?: ((event: CustomEvent<number>) => void) | EventListenerObject | undefined;
}
export interface CounterHandle {
  getSnapshot(): CounterInput;
  request(): void;
}
export type CounterElement = HTMLElement & CounterHandle & { input: CounterInput | undefined };

export const counterConfig: ElementBindingConfig<CounterProps> = Object.freeze({
  properties: Object.freeze(['input'] as const),
  events: Object.freeze({ changed: 'count-request' }),
});
export const createCounterHandle = createElementFacade<CounterElement, readonly ['getSnapshot', 'request']>(['getSnapshot', 'request']);
