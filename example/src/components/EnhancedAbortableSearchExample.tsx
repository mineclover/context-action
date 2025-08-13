/**
 * Enhanced Abortable Search Example - Simplified
 *
 * Comprehensive demonstration of abort functionality and search patterns.
 */

import { createActionContext } from '@context-action/react';
import { useState } from 'react';
import type { AppActions } from '../types/actions.js';

// Create typed action context
const {
  Provider: ActionProvider,
  useActionDispatch,
  useActionDispatchWithResult,
  useActionHandler,
} = createActionContext<AppActions>({
  name: 'EnhancedAbortableSearchExample',
});

interface SearchResult {
  id: number;
  title: string;
  description: string;
  url: string;
  relevance: number;
  timestamp: number;
}

interface SearchState {
  query: string;
  isSearching: boolean;
  searchProgress: number;
  results: SearchResult[];
  searchHistory: string[];
  error: string | null;
  searchCount: number;
  lastSearchTime: number | null;
}

function EnhancedAbortableSearchExampleContent() {
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    isSearching: false,
    searchProgress: 0,
    results: [],
    searchHistory: [],
    error: null,
    searchCount: 0,
    lastSearchTime: null,
  });

  const dispatch = useActionDispatch();
  const { resetAbortScope, abortAll } = useActionDispatchWithResult();

  // Enhanced search handler with realistic simulation
  useActionHandler('search', async ({ query }, controller): Promise<void> => {
    try {
      // Simulate search with simpler progress tracking
      const totalSteps = 10;
      for (let step = 1; step <= totalSteps; step++) {
        if ((controller as any).signal?.aborted) {
          throw new Error('Search was aborted');
        }

        await new Promise(resolve => setTimeout(resolve, 125)); // 125ms * 10 = 1.25s total
        const progress = Math.round((step / totalSteps) * 100);
        
        // Update progress using a ref to avoid stale closure
        setSearchState(prev => ({ ...prev, searchProgress: progress }));
      }

      // Generate realistic search results
      const mockResults: SearchResult[] = Array.from({ length: Math.floor(Math.random() * 8) + 3 }, (_, i) => ({
        id: Date.now() + i,
        title: `${query} - Result ${i + 1}`,
        description: `This is a detailed description for search result ${i + 1} related to "${query}". It contains relevant information and highlights the key points that match your search query.`,
        url: `https://example.com/result-${i + 1}`,
        relevance: Math.round((Math.random() * 40 + 60) * 10) / 10, // 60-100%
        timestamp: Date.now() - Math.floor(Math.random() * 86400000) // Random within 24h
      })).sort((a, b) => b.relevance - a.relevance);

      // Update search state directly in handler
      setSearchState(prev => ({
        ...prev,
        isSearching: false,
        results: mockResults,
        searchHistory: prev.searchHistory.includes(query) 
          ? prev.searchHistory 
          : [query, ...prev.searchHistory.slice(0, 9)], // Keep last 10
        searchCount: prev.searchCount + 1,
        lastSearchTime: Date.now(),
        searchProgress: 100,
      }));

      // Return void as expected by ActionHandler type
    } catch (error) {
      // Reset state on error
      setSearchState(prev => ({
        ...prev,
        isSearching: false,
        error: error instanceof Error ? error.message : 'Search failed',
        searchProgress: 0,
      }));
      throw error;
    }
  });

  // Large dataset processing handler
  useActionHandler('processLargeDataSet', async ({ dataSetId, chunkSize }, controller): Promise<void> => {
    const totalChunks = Math.ceil(1000 / (chunkSize || 50));
    
    for (let i = 0; i < totalChunks; i++) {
      if ((controller as any).signal?.aborted) {
        throw new Error('Data processing was aborted');
      }

      await new Promise(resolve => setTimeout(resolve, 100));
      setSearchState(prev => ({ ...prev, searchProgress: Math.round((i / totalChunks) * 100) }));
    }

    // Return void as expected by ActionHandler type
  });

  const handleSearch = async () => {
    const trimmedQuery = searchState.query.trim();
    if (!trimmedQuery) return;

    resetAbortScope();
    
    setSearchState(prev => ({
      ...prev,
      isSearching: true,
      searchProgress: 0,
      error: null,
    }));

    try {
      await dispatch('search', { query: trimmedQuery });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      setSearchState(prev => ({
        ...prev,
        isSearching: false,
        error: errorMessage,
        results: [],
        searchProgress: 0,
      }));
    }
  };

  const handleAbortSearch = () => {
    abortAll();
    setSearchState(prev => ({
      ...prev,
      isSearching: false,
      error: 'Search aborted by user',
      searchProgress: 0,
    }));
  };

  const handleProcessLargeDataSet = async () => {
    resetAbortScope();
    
    setSearchState(prev => ({
      ...prev,
      isSearching: true,
      searchProgress: 0,
      error: null,
    }));

    try {
      await dispatch('processLargeDataSet', { 
        dataSetId: 'dataset-1', 
        chunkSize: 50 
      });
      
      // Use default values since handler doesn't return data
      const processedChunks = 20;
      const totalRecords = 1000;
      
      setSearchState(prev => ({
        ...prev,
        isSearching: false,
        searchProgress: 100,
        results: [{
          id: Date.now(),
          title: 'Large Dataset Processing Complete',
          description: `Processed ${processedChunks} chunks with ${totalRecords} total records`,
          url: '#',
          relevance: 100,
          timestamp: Date.now(),
        }],
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';
      setSearchState(prev => ({
        ...prev,
        isSearching: false,
        error: errorMessage,
        searchProgress: 0,
      }));
    }
  };

  const clearResults = () => {
    setSearchState(prev => ({
      ...prev,
      results: [],
      error: null,
      searchProgress: 0,
    }));
  };

  const clearHistory = () => {
    setSearchState(prev => ({
      ...prev,
      searchHistory: [],
    }));
  };

  const selectFromHistory = (historicalQuery: string) => {
    setSearchState(prev => ({ ...prev, query: historicalQuery }));
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };


  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-bold mb-4">Enhanced Abortable Search</h2>

        {/* Search Statistics */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-blue-600 font-bold">{searchState.searchCount}</div>
              <div>Total Searches</div>
            </div>
            <div className="text-center">
              <div className="text-green-600 font-bold">{searchState.results.length}</div>
              <div>Current Results</div>
            </div>
            <div className="text-center">
              <div className="text-purple-600 font-bold">{searchState.searchHistory.length}</div>
              <div>History Items</div>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchState.query}
            onChange={(e) => setSearchState(prev => ({ ...prev, query: e.target.value }))}
            onKeyPress={(e) => e.key === 'Enter' && !searchState.isSearching && handleSearch()}
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
              <span className="text-sm font-medium">{searchState.searchProgress}%</span>
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
              <div key={result.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
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
                      <span>{new Date(result.timestamp).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="text-green-600 truncate max-w-48">{result.url}</span>
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
    <ActionProvider>
      <EnhancedAbortableSearchExampleContent />
    </ActionProvider>
  );
}

export default EnhancedAbortableSearchExample;
