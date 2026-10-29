type Handler = ((event: Event) => void) | { handleEvent(event: Event): void };
interface Binding {
  handler: Handler;
  eventName: string;
  listener: EventListener;
  active: boolean;
}

function isHandler(value: unknown): value is Handler {
  return typeof value === 'function' || (typeof value === 'object' && value !== null
    && typeof (value as { handleEvent?: unknown }).handleEvent === 'function');
}

export function createEventBindings(element: HTMLElement, events: readonly (readonly [string, string])[], active: () => boolean) {
  const bindings = new Map<string, Binding>();
  function remove(key: string, binding: Binding): void {
    binding.active = false;
    bindings.delete(key);
    element.removeEventListener(binding.eventName, binding.listener);
  }
  return {
    update(input: object): void {
      const handlers = input as Record<string, unknown>;
      for (const [key, eventName] of events) {
        if (!active()) return;
        const handler = handlers[key];
        const old = bindings.get(key);
        if (old?.handler === handler) continue;
        if (old) remove(key, old);
        if (!active()) return;
        if (!isHandler(handler)) continue;
        const binding: Binding = {
          handler, eventName, active: true,
          listener(event) {
            if (!active() || !binding.active) return;
            if (typeof handler === 'function') handler(event);
            else handler.handleEvent(event);
          },
        };
        bindings.set(key, binding);
        try { element.addEventListener(eventName, binding.listener); }
        catch (error) { remove(key, binding); throw error; }
        // Defensive against a host overriding addEventListener and disposing reentrantly.
        if (!active()) remove(key, binding);
      }
    },
    disconnect(): void {
      for (const [key, binding] of bindings) remove(key, binding);
    },
  };
}
