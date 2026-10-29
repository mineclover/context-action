/** @evidenceExclude Tier 3 Vue lifecycle adapter; no domain handlers. */
import type { ObjectDirective } from 'vue';
import type { ElementBinding, ElementBindingConfig, ElementBindingOptions } from '@context-action/core/element';
import { captureConfig, connectBinding } from '../shared/connect-binding.js';

/** One controller per DOM node; no Vue runtime is imported by this factory. */
export function createElementDirective<Props extends object>(
  config: ElementBindingConfig<Props>,
  options: ElementBindingOptions = { assignmentErrors: 'throw' },
): ObjectDirective<HTMLElement, Props> {
  const captured = captureConfig(config);
  const policy = { ...options };
  const bindings = new WeakMap<HTMLElement, ElementBinding<Props>>();
  return {
    mounted(element, value) {
      try {
        connectBinding(element, captured, value.value, policy, binding => bindings.set(element, binding));
      } catch (error) {
        bindings.delete(element);
        throw error;
      }
    },
    updated(element, value) { bindings.get(element)?.update(value.value); },
    beforeUnmount(element) {
      bindings.get(element)?.dispose();
      bindings.delete(element);
    },
  };
}
