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
