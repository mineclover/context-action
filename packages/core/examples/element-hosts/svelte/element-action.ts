/** @evidenceExclude Tier 3 Svelte action lifecycle adapter; no domain handlers. */
import type { Action } from 'svelte/action';
import type { ElementBindingConfig, ElementBindingOptions } from '@context-action/core/element';
import { captureConfig, connectBinding } from '../shared/connect-binding.js';

/** Svelte owns node insertion/removal; this action owns only the binding. */
export function createElementAction<Props extends object>(
  config: ElementBindingConfig<Props>,
  options: ElementBindingOptions = { assignmentErrors: 'throw' },
): Action<HTMLElement, Props> {
  const captured = captureConfig(config);
  const policy = { ...options };
  return (...args) => {
    const [element, input] = args;
    if (input === undefined) throw new TypeError('Element action requires a complete input snapshot');
    const binding = connectBinding(element, captured, input, policy);
    return {
      update(next) { binding.update(next); },
      destroy() { binding.dispose(); },
    };
  };
}
