import { useCallback } from 'react';
import {
  useEnhancedAbortableSearchAction,
  useEnhancedAbortableSearchActionWithResult,
} from '../contexts/EnhancedAbortableSearchContexts';

export function useEnhancedAbortableSearchActions() {
  const dispatch = useEnhancedAbortableSearchAction();
  const { resetAbortScope, abortAll } =
    useEnhancedAbortableSearchActionWithResult();

  return {
    updateQuery: useCallback(
      (query: string) => dispatch('updateQuery', { query }),
      [dispatch]
    ),
    search: useCallback(
      (query: string) => dispatch('search', { query }),
      [dispatch]
    ),
    processLargeDataSet: useCallback(
      (dataSetId: string, chunkSize: number) =>
        dispatch('processLargeDataSet', { dataSetId, chunkSize }),
      [dispatch]
    ),
    clearResults: useCallback(() => dispatch('clearResults'), [dispatch]),
    clearHistory: useCallback(() => dispatch('clearHistory'), [dispatch]),
    selectFromHistory: useCallback(
      (query: string) => dispatch('selectFromHistory', { query }),
      [dispatch]
    ),
    markSearchAborted: useCallback(
      () => dispatch('markSearchAborted'),
      [dispatch]
    ),
    resetAbortScope,
    abortAll,
  };
}
