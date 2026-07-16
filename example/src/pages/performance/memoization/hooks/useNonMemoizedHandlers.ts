/**
 * @deprecated Handler registration now belongs to ComparisonHandlerRegistry.
 * Kept as a source-compatible status hook for older widget compositions.
 */
export function useNonMemoizedHandlers() {
  return {
    handlersRegistered: true,
    storeType: 'nonMemoized' as const,
  };
}
