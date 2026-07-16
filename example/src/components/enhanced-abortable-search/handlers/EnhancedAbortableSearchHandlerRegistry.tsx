import React, { useCallback } from 'react';
import {
  beginSearch,
  clearSearchHistory,
  clearSearchResults,
  completeLargeDataSet,
  completeSearch,
  createMockSearchResults,
  failSearch,
  markSearchAborted,
  selectSearchHistory,
  updateQuery,
  updateSearchProgress,
} from '../business/search-rules';
import {
  useEnhancedAbortableSearchActionHandler,
  useEnhancedAbortableSearchStore,
} from '../contexts/EnhancedAbortableSearchContexts';

export function EnhancedAbortableSearchHandlerRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchStore = useEnhancedAbortableSearchStore('search');

  useEnhancedAbortableSearchActionHandler(
    'updateQuery',
    useCallback(
      async (payload) => {
        searchStore.setValue(
          updateQuery(searchStore.getValue(), payload.query)
        );
      },
      [searchStore]
    )
  );

  useEnhancedAbortableSearchActionHandler(
    'search',
    useCallback(
      async (payload, controller) => {
        searchStore.setValue(beginSearch(searchStore.getValue()));

        try {
          const totalSteps = 10;
          for (let step = 1; step <= totalSteps; step += 1) {
            if (controller.signal?.aborted) {
              throw new Error('Search was aborted');
            }

            await new Promise((resolve) => setTimeout(resolve, 125));
            searchStore.setValue(
              updateSearchProgress(
                searchStore.getValue(),
                Math.round((step / totalSteps) * 100)
              )
            );
          }

          const completedAt = Date.now();
          searchStore.setValue(
            completeSearch(
              searchStore.getValue(),
              payload.query,
              createMockSearchResults(payload.query, completedAt, Math.random),
              completedAt
            )
          );
        } catch (error) {
          searchStore.setValue(
            failSearch(
              searchStore.getValue(),
              error instanceof Error ? error.message : 'Search failed'
            )
          );
          throw error;
        }
      },
      [searchStore]
    )
  );

  useEnhancedAbortableSearchActionHandler(
    'processLargeDataSet',
    useCallback(
      async ({ chunkSize }, controller) => {
        searchStore.setValue(beginSearch(searchStore.getValue()));
        const totalChunks = Math.ceil(1000 / (chunkSize || 50));

        try {
          for (let index = 0; index < totalChunks; index += 1) {
            if (controller.signal?.aborted) {
              throw new Error('Data processing was aborted');
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
            searchStore.setValue(
              updateSearchProgress(
                searchStore.getValue(),
                Math.round((index / totalChunks) * 100)
              )
            );
          }

          const completedAt = Date.now();
          searchStore.setValue(
            completeLargeDataSet(searchStore.getValue(), completedAt, 20, 1000)
          );
        } catch (error) {
          searchStore.setValue(
            failSearch(
              searchStore.getValue(),
              error instanceof Error ? error.message : 'Processing failed'
            )
          );
          throw error;
        }
      },
      [searchStore]
    )
  );

  useEnhancedAbortableSearchActionHandler(
    'clearResults',
    useCallback(async () => {
      searchStore.setValue(clearSearchResults(searchStore.getValue()));
    }, [searchStore])
  );

  useEnhancedAbortableSearchActionHandler(
    'clearHistory',
    useCallback(async () => {
      searchStore.setValue(clearSearchHistory(searchStore.getValue()));
    }, [searchStore])
  );

  useEnhancedAbortableSearchActionHandler(
    'selectFromHistory',
    useCallback(
      async (payload) => {
        searchStore.setValue(
          selectSearchHistory(searchStore.getValue(), payload.query)
        );
      },
      [searchStore]
    )
  );

  useEnhancedAbortableSearchActionHandler(
    'markSearchAborted',
    useCallback(async () => {
      searchStore.setValue(markSearchAborted(searchStore.getValue()));
    }, [searchStore])
  );

  return <>{children}</>;
}
