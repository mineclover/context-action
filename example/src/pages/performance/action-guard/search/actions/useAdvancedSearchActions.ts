import { useCallback } from 'react';
import type { SearchItem } from '../business/search-rules';
import { useAdvancedSearchAction } from '../contexts/AdvancedSearchContexts';

export function useAdvancedSearchActions() {
  const dispatch = useAdvancedSearchAction();

  return {
    updateQuery: useCallback(
      (query: string) => dispatch('updateQuery', { query }),
      [dispatch]
    ),
    performSearch: useCallback(
      (query: string, filters: Record<string, string>) =>
        dispatch('performSearch', { query, filters }),
      [dispatch]
    ),
    addFilter: useCallback(
      (key: string, value: string) => dispatch('addFilter', { key, value }),
      [dispatch]
    ),
    removeFilter: useCallback(
      (key: string) => dispatch('removeFilter', { key }),
      [dispatch]
    ),
    clearFilters: useCallback(() => dispatch('clearFilters'), [dispatch]),
    selectResult: useCallback(
      (item: SearchItem) => dispatch('selectResult', { id: item.id, item }),
      [dispatch]
    ),
  };
}
