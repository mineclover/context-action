/**
 * Enhanced Abortable Search Example - Simplified
 *
 * Comprehensive demonstration of abort functionality and search patterns.
 */

import { useStoreValue } from '@context-action/react';
import { useCallback } from 'react';
import { useEnhancedAbortableSearchActions } from './enhanced-abortable-search/actions/useEnhancedAbortableSearchActions';
import {
  EnhancedAbortableSearchActionProvider,
  EnhancedAbortableSearchStoreProvider,
  useEnhancedAbortableSearchStore,
} from './enhanced-abortable-search/contexts/EnhancedAbortableSearchContexts';
import { EnhancedAbortableSearchHandlerRegistry } from './enhanced-abortable-search/handlers/EnhancedAbortableSearchHandlerRegistry';

function EnhancedAbortableSearchExampleContent() {
  const searchState = useStoreValue(useEnhancedAbortableSearchStore('search'));
  const {
    updateQuery,
    search,
    processLargeDataSet,
    clearResults: clearResultsAction,
    clearHistory: clearHistoryAction,
    selectFromHistory: selectFromHistoryAction,
    markSearchAborted,
    resetAbortScope,
    abortAll,
  } = useEnhancedAbortableSearchActions();

  const handleSearch = useCallback(async () => {
    const trimmedQuery = searchState.query.trim();
    if (!trimmedQuery) return;

    resetAbortScope();

    try {
      await search(trimmedQuery);
    } catch {
      // The Handler Registry owns the error state transition.
    }
  }, [resetAbortScope, search, searchState.query]);

  const handleAbortSearch = useCallback(() => {
    abortAll();
    markSearchAborted();
  }, [abortAll, markSearchAborted]);

  const handleProcessLargeDataSet = useCallback(async () => {
    resetAbortScope();

    try {
      await processLargeDataSet('dataset-1', 50);
    } catch {
      // The Handler Registry owns the error state transition.
    }
  }, [processLargeDataSet, resetAbortScope]);

  const clearResults = useCallback(() => {
    clearResultsAction();
  }, [clearResultsAction]);

  const clearHistory = useCallback(() => {
    clearHistoryAction();
  }, [clearHistoryAction]);

  const selectFromHistory = useCallback(
    (historicalQuery: string) => {
      selectFromHistoryAction(historicalQuery);
    },
    [selectFromHistoryAction]
  );

  const formatTimestamp = useCallback(
    (timestamp: number) => new Date(timestamp).toLocaleString(),
    []
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-bold mb-4">Enhanced Abortable Search</h2>

        {/* Search Statistics */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-blue-600 font-bold">
                {searchState.searchCount}
              </div>
              <div>Total Searches</div>
            </div>
            <div className="text-center">
              <div className="text-green-600 font-bold">
                {searchState.results.length}
              </div>
              <div>Current Results</div>
            </div>
            <div className="text-center">
              <div className="text-purple-600 font-bold">
                {searchState.searchHistory.length}
              </div>
              <div>History Items</div>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchState.query}
            onChange={(e) => updateQuery(e.target.value)}
            onKeyPress={(e) =>
              e.key === 'Enter' && !searchState.isSearching && handleSearch()
            }
            placeholder="Enter search query..."
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={searchState.isSearching}
          />
          <button
            onClick={handleSearch}
            disabled={searchState.isSearching || !searchState.query.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            {searchState.isSearching ? 'Searching...' : 'Search'}
          </button>
          {searchState.isSearching && (
            <button
              onClick={handleAbortSearch}
              className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Abort
            </button>
          )}
        </div>

        {/* Additional Actions */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleProcessLargeDataSet}
            disabled={searchState.isSearching}
            className="px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50 hover:bg-purple-600 transition-colors text-sm"
          >
            Process Large Dataset
          </button>
          <button
            onClick={clearResults}
            disabled={searchState.isSearching}
            className="px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50 hover:bg-gray-600 transition-colors text-sm"
          >
            Clear Results
          </button>
          <button
            onClick={clearHistory}
            disabled={searchState.searchHistory.length === 0}
            className="px-4 py-2 bg-orange-500 text-white rounded disabled:opacity-50 hover:bg-orange-600 transition-colors text-sm"
          >
            Clear History
          </button>
        </div>

        {/* Progress Bar */}
        {searchState.isSearching && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-600">Progress:</span>
              <span className="text-sm font-medium">
                {searchState.searchProgress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${searchState.searchProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Display */}
        {searchState.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">Error:</span>
              <span>{searchState.error}</span>
            </div>
          </div>
        )}

        {/* Search History */}
        {searchState.searchHistory.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Recent Searches:</h3>
            <div className="flex flex-wrap gap-2">
              {searchState.searchHistory.map((historyItem, index) => (
                <button
                  key={index}
                  onClick={() => selectFromHistory(historyItem)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  {historyItem}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Search Results</h3>
          {searchState.lastSearchTime && (
            <span className="text-sm text-gray-500">
              Last search: {formatTimestamp(searchState.lastSearchTime)}
            </span>
          )}
        </div>

        {searchState.results.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {searchState.error ? 'Search failed' : 'No results found'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Try entering a search query above
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {searchState.results.map((result) => (
              <div
                key={result.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                      {result.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {result.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Relevance: {result.relevance}%</span>
                      <span>•</span>
                      <span>
                        {new Date(result.timestamp).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span className="text-green-600 truncate max-w-48">
                        {result.url}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="w-16 h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-green-500 rounded-full"
                        style={{ width: `${result.relevance}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function EnhancedAbortableSearchExample() {
  return (
    <EnhancedAbortableSearchActionProvider>
      <EnhancedAbortableSearchStoreProvider>
        <EnhancedAbortableSearchHandlerRegistry>
          <EnhancedAbortableSearchExampleContent />
        </EnhancedAbortableSearchHandlerRegistry>
      </EnhancedAbortableSearchStoreProvider>
    </EnhancedAbortableSearchActionProvider>
  );
}

export default EnhancedAbortableSearchExample;
