/**
 * @deprecated Handler registration now belongs to ComparisonHandlerRegistry.
 * Kept as a source-compatible status hook for older widget compositions.
 */
export function useMemoizedHandlers() {
  return {
    handlersRegistered: true,
    storeType: 'memoized' as const,
  };
}
