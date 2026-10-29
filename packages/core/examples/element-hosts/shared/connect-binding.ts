/** @evidenceExclude Tier 3 DOM adapter lifecycle; no persisted domain state. */
import {
  createElementBinding,
  type ElementBinding,
  type ElementBindingConfig,
  type ElementBindingOptions,
} from '@context-action/core/element';

/** Failed initial setters must not leave the listeners installed by update(). */
export function connectBinding<Props extends object>(
  element: HTMLElement,
  config: ElementBindingConfig<Props>,
  input: Props,
  options: ElementBindingOptions,
  onConnect?: (binding: ElementBinding<Props>) => void,
): ElementBinding<Props> {
  const binding = createElementBinding(element, config, options);
  try {
    // Install the owner's cleanup reference before setters can emit synchronous events.
    onConnect?.(binding);
    binding.update(input);
    return binding;
  } catch (error) {
    binding.dispose();
    throw error;
  }
}

/** Adapter factories capture caller configuration before any host mounts. */
export function captureConfig<Props extends object>(config: ElementBindingConfig<Props>): ElementBindingConfig<Props> {
  return { properties: [...(config.properties ?? [])], events: { ...config.events } };
}
