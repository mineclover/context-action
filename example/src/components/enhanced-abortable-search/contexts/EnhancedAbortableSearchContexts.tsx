import type { ActionPayloadMap } from '@context-action/core';
import { createActionContext, createStoreContext } from '@context-action/react';
import type { SearchState } from '../business/search-rules';
import { createInitialSearchState } from '../business/search-rules';

export type { SearchResult, SearchState } from '../business/search-rules';

export interface EnhancedAbortableSearchActions extends ActionPayloadMap {
  updateQuery: { query: string };
  search: { query: string };
  processLargeDataSet: { dataSetId: string; chunkSize: number };
  clearResults: void;
  clearHistory: void;
  selectFromHistory: { query: string };
  markSearchAborted: void;
}

export interface EnhancedAbortableSearchStores {
  search: SearchState;
}

export const {
  Provider: EnhancedAbortableSearchActionProvider,
  useActionDispatch: useEnhancedAbortableSearchAction,
  useActionDispatchWithResult: useEnhancedAbortableSearchActionWithResult,
  useActionHandler: useEnhancedAbortableSearchActionHandler,
} = createActionContext<EnhancedAbortableSearchActions>(
  'EnhancedAbortableSearch-actions'
);

export const {
  Provider: EnhancedAbortableSearchStoreProvider,
  useStore: useEnhancedAbortableSearchStore,
} = createStoreContext<EnhancedAbortableSearchStores>(
  'EnhancedAbortableSearch-stores',
  {
    search: {
      initialValue: createInitialSearchState(),
      strategy: 'shallow',
      description:
        'Search query, progress, results, history, and abortable operation state.',
    },
  }
);
