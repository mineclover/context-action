/**
 * Example component demonstrating automatic action abortion on unmount
 * and search cancellation patterns using the enhanced ActionProvider
 * 
 * Features:
 * - Automatic abort on component unmount via createActionContext factory
 * - Search cancellation with resetAbortScope
 * - Built-in abort support in all hooks
 * - Type-safe action context with factory pattern
 * 
 * Usage:
 * ```tsx
 * // Wrap your component tree with the Provider
 * function App() {
 *   return (
 *     <ActionProvider>
 *       <AbortableSearchExample />
 *     </ActionProvider>
 *   );
 * }
 * ```
 */

import React, { useState, useEffect } from 'react';
import { createActionContext } from '@context-action/react';
import type { AppActions } from '../types/actions.js';

// Create typed action context
const { 
  Provider: ActionProvider, 
  useActionDispatch, 
  useActionDispatchWithResult, 
  useActionRegister 
} = createActionContext<AppActions>();

interface SearchResult {
  id: string;
  title: string;
  description: string;
}

export function AbortableSearchExample() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { dispatch, dispatchWithResult, resetAbortScope } = useActionDispatchWithResult();
  const register = useActionRegister();

  // Register search handler
  useEffect(() => {
    const unregister = register.register('search', async ({ query }, controller) => {
      // Simulate API call
      const response = await fetch(`/api/search?q=${query}`);
      
      // Check if aborted before processing response
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.results;
      
      return [];
    }, { priority: 10 });

    return unregister;
  }, [register]);

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

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      <div className="search-results">
        {results.length > 0 ? (
          <ul>
            {results.map(result => (
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
  const register = useActionRegister();

  useEffect(() => {
    // Register data fetch handler
    const unregister = register.register('fetchUserData', async ({ userId }) => {
      const response = await fetch(`/api/users/${userId}`);
      const userData = await response.json();
      return userData;
    });

    return unregister;
  }, [register]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      try {
        // This will be automatically aborted if component unmounts
        await dispatch('fetchUserData', { userId: '123' });
        
        // Additional dispatches are also aborted on unmount
        await dispatch('loadUserPreferences', { userId: '123' });
        await dispatch('loadUserNotifications', { userId: '123' });
        
        setData({ /* combined data */ });
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

