/** Notification holds are independent of history commits and batch savepoints. */
export class TransitionNotifications<Patch> {
  private readonly listeners = new Set<() => void>();
  private readonly patchListeners = new Set<(patches: readonly Patch[] | null) => void>();
  private holds = 0;
  private pending = false;
  private pendingPatches: readonly Patch[] | null = null;
  private disposed = false;
  private notifying = false;

  constructor(private readonly onError?: (error: unknown) => void) {}

  get isNotifying(): boolean { return this.notifying; }
  get isQuiescent(): boolean { return this.holds === 0 && !this.pending && !this.notifying; }

  subscribe = (listener: () => void): (() => void) => {
    if (typeof listener !== 'function') throw new TypeError('A listener must be a function');
    if (this.disposed) return () => {};
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  subscribeWithPatches = (listener: (patches: readonly Patch[] | null) => void): (() => void) => {
    if (typeof listener !== 'function') throw new TypeError('A patch listener must be a function');
    if (this.disposed) return () => {};
    this.patchListeners.add(listener);
    return () => { this.patchListeners.delete(listener); };
  };

  hold(): void { this.holds += 1; }
  resume(): void { if (this.holds > 0) this.holds -= 1; }

  publish(patches: readonly Patch[] | null): void {
    if (this.disposed) return;
    if (this.holds > 0 || this.pending) {
      this.pendingPatches = !this.pending
        ? patches
        : this.pendingPatches === null || patches === null
          ? null
          : Object.freeze([...this.pendingPatches, ...patches]);
      this.pending = true;
      return;
    }
    this.deliver(patches);
  }

  flush(): void {
    if (this.disposed || this.holds > 0 || !this.pending || this.notifying) return;
    const patches = this.pendingPatches;
    this.pending = false;
    this.pendingPatches = null;
    this.deliver(patches);
  }

  private observe(callback: () => void): void {
    try { callback(); }
    catch (error) { try { this.onError?.(error); } catch { /* Observation cannot change a commit. */ } }
  }

  private deliver(patches: readonly Patch[] | null): void {
    this.notifying = true;
    try {
      for (const listener of [...this.patchListeners]) {
        if (this.patchListeners.has(listener)) this.observe(() => listener(patches));
      }
      for (const listener of [...this.listeners]) {
        if (this.listeners.has(listener)) this.observe(listener);
      }
    } finally { this.notifying = false; }
  }

  dispose(): void {
    this.disposed = true;
    this.listeners.clear();
    this.patchListeners.clear();
    this.holds = 0;
    this.pending = false;
    this.pendingPatches = null;
  }
}
