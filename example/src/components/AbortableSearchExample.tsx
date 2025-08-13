/**
 * Enhanced Abortable Search Example
 *
 * Comprehensive demonstration of abort functionality, search patterns, and
 * advanced action management scenarios.
 *
 * Features:
 * - Multiple abort scenarios and strategies
 * - Search cancellation and debouncing
 * - Manual and automatic abort controls
 * - Real-time abort status monitoring
 * - Complex search workflows
 * - Performance optimization patterns
 *
 * Usage:
 * ```tsx
 * <ActionProvider>
 *   <AbortableSearchExample />
 * </ActionProvider>
 * ```
 */

import { createActionContext } from '@context-action/react';
import { useEffect, useRef, useState } from 'react';
import type { AppActions } from '../types/actions.js';

// Create typed action context with enhanced debugging
const {
  Provider: ActionProvider,
  useActionDispatch,
  useActionDispatchWithResult,
  useActionHandler,
} = createActionContext<AppActions>({
  name: 'AbortableSearchExample',
});

interface SearchResult {
  id: string;
  title: string;
  description: string;
  relevance: number;
  source: string;
}

interface SearchMetrics {
  totalSearches: number;
  successfulSearches: number;
  abortedSearches: number;
  failedSearches: number;
  averageSearchTime: number;
  lastSearchTime: number;
}

interface AbortScenario {
  id: string;
  name: string;
  description: string;
  active: boolean;
  result?: string;
}

export function AbortableSearchExample() {
  // Search state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [_searchId, _setSearchId] = useState<string | null>(null);

  // Advanced state
  const [_abortCount, _setAbortCount] = useState(0);
  const [_searchMetrics, _setSearchMetrics] = useState<SearchMetrics>({
    totalSearches: 0,
    successfulSearches: 0,
    abortedSearches: 0,
    failedSearches: 0,
    averageSearchTime: 0,
    lastSearchTime: 0,
  });

  // Abort scenarios
  const [_abortScenarios, _setAbortScenarios] = useState<AbortScenario[]>([
    {
      id: 'quick-search',
      name: 'Quick Search',
      description: 'Fast search with immediate cancellation',
      active: false,
    },
    {
      id: 'slow-search',
      name: 'Slow Search',
      description: 'Slow search to test abort timing',
      active: false,
    },
    {
      id: 'multi-step',
      name: 'Multi-step Search',
      description: 'Complex search with multiple phases',
      active: false,
    },
    {
      id: 'cascade-search',
      name: 'Cascade Search',
      description: 'Search that triggers other searches',
      active: false,
    },
  ]);

  // Refs for tracking
  const _searchStartTime = useRef<number | null>(null);
  const _debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const _activeSearches = useRef<Set<string>>(new Set());

  const { dispatchWithResult, resetAbortScope } = useActionDispatchWithResult();
  const dispatch = useActionDispatch();

  // Register search handler
  useActionHandler(
    'search',
    async ({ query }, controller) => {
      // Simulate API call
      const response = await fetch(`/api/search?q=${query}`);

      // Check if aborted before processing response
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.results || [];
    },
    { priority: 10 }
  );

  // Handle search with automatic cancellation of previous searches
  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    // Reset abort scope to cancel any previous search
    // This is useful for search/autocomplete scenarios
    resetAbortScope();

    setLoading(true);
    setError(null);

    try {
      const result = await dispatchWithResult<'search', SearchResult[]>(
        'search',
        { query: searchQuery }
      );

      if (result.success && !result.aborted) {
        setResults(result.result || []);
      } else if (result.aborted) {
        // Search was cancelled (user typed new query)
        console.log('Search cancelled for:', searchQuery);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div className="abortable-search-example">
      <h2>Abortable Search Example</h2>

      <div className="search-input">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="search-field"
        />
        {loading && <span className="loading-indicator">Searching...</span>}
      </div>

      {error && <div className="error-message">Error: {error}</div>}

      <div className="search-results">
        {results.length > 0 ? (
          <ul>
            {results.map((result) => (
              <li key={result.id}>
                <h3>{result.title}</h3>
                <p>{result.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          query && !loading && <p>No results found</p>
        )}
      </div>
    </div>
  );
}

/**
 * Wrapper component that provides the action context
 * This demonstrates how to set up the provider
 */
export function AbortableSearchExampleWithProvider() {
  return (
    <ActionProvider>
      <AbortableSearchExample />
      <DataFetcherWithCleanup />
    </ActionProvider>
  );
}

/**
 * Example demonstrating automatic cleanup on unmount
 */
export function DataFetcherWithCleanup() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Using dispatch with automatic abort ensures fetch is cancelled if component unmounts
  const dispatch = useActionDispatch();

  // Register data fetch handler
  useActionHandler('fetchUserData', async ({ userId }) => {
    const response = await fetch(`/api/users/${userId}`);
    const userData = await response.json();
    return userData;
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      try {
        // This will be automatically aborted if component unmounts
        await dispatch('fetchUserData', { userId: '123' });

        // Additional dispatches are also aborted on unmount
        await dispatch('loadUserPreferences', { userId: '123' });
        await dispatch('loadUserNotifications', { userId: '123' });

        setData({
          /* combined data */
        });
      } catch (error) {
        console.error('Data loading failed or was aborted:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // No manual cleanup needed - useActionDispatch now handles abort automatically
  }, [dispatch]);

  if (loading) {
    return <div>Loading user data...</div>;
  }

  return (
    <div className="user-data">
      <h2>User Data</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
