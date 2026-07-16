import React, { useCallback } from 'react';
import {
  addSearchFilter,
  addSearchHistory,
  removeSearchFilter,
  sampleData,
  searchItems,
  updateSearchMetrics,
} from '../business/search-rules';
import {
  useAdvancedSearchAction,
  useAdvancedSearchActionHandler,
  useAdvancedSearchStore,
} from '../contexts/AdvancedSearchContexts';

export function AdvancedSearchHandlerRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAdvancedSearchAction();
  const queryStore = useAdvancedSearchStore('query');
  const filtersStore = useAdvancedSearchStore('filters');
  const resultsStore = useAdvancedSearchStore('results');
  const selectedResultStore = useAdvancedSearchStore('selectedResult');
  const isSearchingStore = useAdvancedSearchStore('isSearching');
  const searchHistoryStore = useAdvancedSearchStore('searchHistory');
  const metricsStore = useAdvancedSearchStore('metrics');

  useAdvancedSearchActionHandler(
    'updateQuery',
    useCallback(
      async (payload) => {
        queryStore.setValue(payload.query);
        searchHistoryStore.setValue(
          addSearchHistory(searchHistoryStore.getValue(), payload.query)
        );
      },
      [queryStore, searchHistoryStore]
    )
  );

  useAdvancedSearchActionHandler(
    'performSearch',
    useCallback(
      async (payload, controller) => {
        const startTime = Date.now();
        isSearchingStore.setValue(true);

        try {
          await new Promise((resolve) => setTimeout(resolve, 300));

          if (controller.signal?.aborted || payload.signal?.aborted) {
            throw new Error('Search aborted');
          }

          const filteredResults = searchItems(
            sampleData,
            payload.query,
            payload.filters
          );
          resultsStore.setValue(filteredResults);
          metricsStore.setValue(
            updateSearchMetrics(
              metricsStore.getValue(),
              payload.query,
              payload.filters,
              filteredResults.length,
              Date.now() - startTime
            )
          );
        } catch (error) {
          console.warn('Search operation aborted or failed:', error);
        } finally {
          isSearchingStore.setValue(false);
        }
      },
      [isSearchingStore, metricsStore, resultsStore]
    )
  );

  useAdvancedSearchActionHandler(
    'addFilter',
    useCallback(
      async (payload) => {
        const nextFilters = addSearchFilter(
          filtersStore.getValue(),
          payload.key,
          payload.value
        );
        filtersStore.setValue(nextFilters);
        dispatch('performSearch', {
          query: queryStore.getValue(),
          filters: nextFilters,
        });
      },
      [dispatch, filtersStore, queryStore]
    )
  );

  useAdvancedSearchActionHandler(
    'removeFilter',
    useCallback(
      async (payload) => {
        const nextFilters = removeSearchFilter(
          filtersStore.getValue(),
          payload.key
        );
        filtersStore.setValue(nextFilters);
        dispatch('performSearch', {
          query: queryStore.getValue(),
          filters: nextFilters,
        });
      },
      [dispatch, filtersStore, queryStore]
    )
  );

  useAdvancedSearchActionHandler(
    'clearFilters',
    useCallback(async () => {
      filtersStore.setValue({});
      dispatch('performSearch', {
        query: queryStore.getValue(),
        filters: {},
      });
    }, [dispatch, filtersStore, queryStore])
  );

  useAdvancedSearchActionHandler(
    'selectResult',
    useCallback(
      async (payload) => {
        selectedResultStore.setValue(payload.item);
      },
      [selectedResultStore]
    )
  );

  return <>{children}</>;
}
