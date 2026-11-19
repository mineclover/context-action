import { createAttributeBindings } from './attribute-bindings.js';
import type { ElementBinding, ElementBindingConfig, ElementBindingOptions } from './contracts.js';
import { createEventBindings } from './event-bindings.js';
import { createPropertyBindings } from './property-bindings.js';
import { createStyleBindings } from './style-bindings.js';

/** Framework-neutral DOM transport. Lifecycle adapters supply complete snapshots, not patches. */
export function createElementBinding<Props extends object>(
  element: HTMLElement,
  config: ElementBindingConfig<Props>,
  options: ElementBindingOptions = {},
): ElementBinding<Props> {
  let disposed = false;
  let updating = false;
  const active = () => !disposed;
  const properties = createPropertyBindings(element, Array.from(new Set(config.properties ?? [])), active, options.assignmentErrors ?? 'ignore');
  const attributes = createAttributeBindings(element, Object.entries(config.attributes ?? {}) as [keyof Props, string][], active);
  const styles = createStyleBindings(element, Object.entries(config.styles ?? {}) as [keyof Props, string][], active);
  const events = createEventBindings(element, Object.entries(config.events ?? {}), active);
  function run(update: () => void): void {
    if (disposed) throw new Error('Element binding is disposed');
    if (updating) throw new Error('Element binding update is already in progress');
    updating = true;
    try { update(); } finally { updating = false; }
  }
  return {
    get disposed() { return disposed; },
    update(input) {
      run(() => {
        events.update(input);
        if (active()) attributes(input);
        if (active()) styles(input);
        if (active()) properties(input);
      });
    },
    updateProperties(input) { run(() => properties(input)); },
    updateAttributes(input) { run(() => attributes(input)); },
    updateStyles(input) { run(() => styles(input)); },
    updateEvents(input) { run(() => events.update(input)); },
    disconnectEvents() { events.disconnect(); },
    dispose() { disposed = true; events.disconnect(); },
  };
}
