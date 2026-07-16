import type { ActionPayloadMap } from '@context-action/core';
import { createActionContext, createStoreContext } from '@context-action/react';
import type { SearchItem, SearchMetrics } from '../business/search-rules';
import {
  createInitialSearchMetrics,
  sampleData,
} from '../business/search-rules';

export interface AdvancedSearchActions extends ActionPayloadMap {
  performSearch: {
    query: string;
    filters: Record<string, string>;
    signal?: AbortSignal;
  };
  updateQuery: { query: string };
  addFilter: { key: string; value: string };
  removeFilter: { key: string };
  clearFilters: void;
  selectResult: { id: string; item: SearchItem };
  abortSearch: void;
}

export interface AdvancedSearchStores {
  query: string;
  filters: Record<string, string>;
  results: SearchItem[];
  selectedResult: SearchItem | null;
  isSearching: boolean;
  searchHistory: string[];
  metrics: SearchMetrics;
}

export const {
  Provider: AdvancedSearchActionProvider,
  useActionDispatch: useAdvancedSearchAction,
  useActionHandler: useAdvancedSearchActionHandler,
} = createActionContext<AdvancedSearchActions>('AdvancedSearch');

export const {
  Provider: AdvancedSearchStoreProvider,
  useStore: useAdvancedSearchStore,
} = createStoreContext<AdvancedSearchStores>('AdvancedSearch', {
  query: {
    initialValue: '',
    description: 'Current search query.',
  },
  filters: {
    initialValue: {} as Record<string, string>,
    strategy: 'shallow',
    description: 'Active category, author, and tag filters.',
  },
  results: {
    initialValue: sampleData,
    strategy: 'shallow',
    description: 'Relevance-ranked search results.',
  },
  selectedResult: {
    initialValue: null as SearchItem | null,
    strategy: 'shallow',
    description: 'Currently selected search result.',
  },
  isSearching: {
    initialValue: false,
    description: 'Whether an async search is running.',
  },
  searchHistory: {
    initialValue: [] as string[],
    strategy: 'shallow',
    description: 'Recent search queries.',
  },
  metrics: {
    initialValue: createInitialSearchMetrics(),
    strategy: 'shallow',
    description: 'Search timing, result, and popularity metrics.',
  },
});

export type { SearchItem, SearchMetrics } from '../business/search-rules';
