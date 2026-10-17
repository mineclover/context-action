/**
 * @module disposal-scope
 *
 * Purpose:
 *   Provides a deterministic LIFO resource cleanup container (`DisposalScope`)
 *   for tying signal connections, event listeners, and DOM mounts to a single
 *   connection session or controller lifetime (`test:native` standalone).
 *
 * Invariants:
 *   - Disposes registered callbacks in reverse registration order (LIFO) so
 *     dependent consumers are torn down before their upstream providers.
 *   - Calling `add(cleanup)` on an already-disposed scope executes `cleanup()`
 *     immediately so late registrations never leak.
 *   - Continues executing all remaining cleanups even if one throws, aggregating
 *     any failures into an `AggregateError`.
 */
export interface DisposalScope {
  readonly disposed: boolean;
  add(cleanup: () => void): void;
  dispose(): void;
}

/** Register dependencies first: LIFO disposal releases consumers before providers. */
export function createDisposalScope(): DisposalScope {
  let disposed = false;
  const callbacks: Array<() => void> = [];
  return {
    get disposed() { return disposed; },
    add(cleanup) {
      if (disposed) cleanup();
      else callbacks.push(cleanup);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      const errors: unknown[] = [];
      for (const cleanup of callbacks.splice(0).reverse()) {
        try { cleanup(); } catch (error) { errors.push(error); }
      }
      if (errors.length) throw new AggregateError(errors, 'UI cleanup failed');
    },
  };
}
