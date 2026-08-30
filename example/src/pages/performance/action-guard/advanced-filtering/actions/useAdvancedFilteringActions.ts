import { useCallback, useMemo } from 'react';
import type { FilteringDispatchOptions } from '../contexts/AdvancedFilteringContexts';
import { useAdvancedFilteringDispatch } from '../contexts/AdvancedFilteringContexts';

export function useAdvancedFilteringActions() {
  const dispatch = useAdvancedFilteringDispatch();

  const runDemo = useCallback(
    (demoKey: string, filterOptions?: FilteringDispatchOptions) =>
      dispatch('runDemo', { demoKey, filterOptions }),
    [dispatch]
  );
  const clearResults = useCallback(() => dispatch('clearResults'), [dispatch]);

  return useMemo(() => ({ runDemo, clearResults }), [clearResults, runDemo]);
}
