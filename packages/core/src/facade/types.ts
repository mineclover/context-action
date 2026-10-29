/** Lazy access lets a projected handle follow the host's current target. */
export type PublicHandleFactory<Target extends object, Handle> =
  (getTarget: () => Target | null) => Handle;
