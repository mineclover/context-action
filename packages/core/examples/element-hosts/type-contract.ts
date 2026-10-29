/** @evidenceExclude Compile-only adapter/imperative-handle contract. */
import type { ObjectDirective } from 'vue';
import type { Action } from 'svelte/action';
import { createElementDirective } from './vue/element-directive.js';
import { createElementAction } from './svelte/element-action.js';
import { counterConfig, type CounterHandle, type CounterProps } from './shared/counter-contract.js';
import { connectBinding } from './shared/connect-binding.js';

const directive: ObjectDirective<HTMLElement, CounterProps> = createElementDirective(counterConfig);
const action: Action<HTMLElement, CounterProps> = createElementAction(counterConfig);

function negativeContracts(handle: CounterHandle, element: HTMLElement): void {
  handle.request();
  const count: number = handle.getSnapshot().count;
  // @ts-expect-error Semantic handles do not expose renderer internals.
  handle.shadowRoot;
  // @ts-expect-error Command has no payload.
  handle.request(1);
  connectBinding<CounterProps>(element, counterConfig, {
    // @ts-expect-error Input keeps its numeric contract.
    input: { count: 'wrong' },
  }, {});
  // @ts-expect-error Property keys must come from the consumer contract.
  createElementAction<CounterProps>({ properties: ['unknown'] });
  void count;
}
void [directive, action, negativeContracts];
