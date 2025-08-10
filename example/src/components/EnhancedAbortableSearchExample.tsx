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
 */

import { createActionContext } from '@context-action/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppActions } from '../types/actions.js';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Status } from './ui/Status';

// Create typed action context with enhanced debugging
const {
  Provider: ActionProvider,
  useActionDispatchWithResult,
  useActionRegister,
} = createActionContext<AppActions>({
  name: 'EnhancedAbortableSearchExample',
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

export function EnhancedAbortableSearchExample() {
  // Search state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchId, setSearchId] = useState<string | null>(null);

  // Advanced state
  const [abortCount, setAbortCount] = useState(0);
  const [searchMetrics, setSearchMetrics] = useState<SearchMetrics>({
    totalSearches: 0,
    successfulSearches: 0,
    abortedSearches: 0,
    failedSearches: 0,
    averageSearchTime: 0,
    lastSearchTime: 0,
  });

  // Abort scenarios
  const [abortScenarios, setAbortScenarios] = useState<AbortScenario[]>([
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
  const searchStartTime = useRef<number | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const activeSearches = useRef<Set<string>>(new Set());

  const { dispatch, abortAll, resetAbortScope } =
    useActionDispatchWithResult();
  const register = useActionRegister();

  // Update search metrics
  const updateMetrics = useCallback(
    (type: 'success' | 'abort' | 'fail', duration?: number) => {
      setSearchMetrics((prev) => {
        const newMetrics = { ...prev };
        newMetrics.totalSearches += 1;

        switch (type) {
          case 'success':
            newMetrics.successfulSearches += 1;
            break;
          case 'abort':
            newMetrics.abortedSearches += 1;
            break;
          case 'fail':
            newMetrics.failedSearches += 1;
            break;
        }

        if (duration !== undefined) {
          newMetrics.lastSearchTime = duration;
          const totalDuration =
            prev.averageSearchTime * (prev.totalSearches - 1) + duration;
          newMetrics.averageSearchTime =
            totalDuration / newMetrics.totalSearches;
        }

        return newMetrics;
      });
    },
    []
  );

  // Update abort scenario status
  const updateScenarioStatus = useCallback(
    (scenarioId: string, active: boolean, result?: string) => {
      setAbortScenarios((prev) =>
        prev.map((scenario) =>
          scenario.id === scenarioId
            ? { ...scenario, active, result }
            : scenario
        )
      );
    },
    []
  );

  // Register enhanced search handlers
  useEffect(() => {
    if (!register) return;

    const unregisterFunctions: (() => void)[] = [];

    // Main search handler
    unregisterFunctions.push(
      register.register('search', async ({ query }, controller) => {
        const currentSearchId = `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const startTime = Date.now();

        activeSearches.current.add(currentSearchId);
        setSearchId(currentSearchId);
        setLoading(true);
        setError(null);
        searchStartTime.current = startTime;

        try {
          // Simulate different search scenarios based on query
          let searchDuration = 800; // Default
          let complexity = 1;

          if (query.includes('slow')) {
            searchDuration = 3000;
            complexity = 3;
          } else if (query.includes('quick')) {
            searchDuration = 200;
            complexity = 1;
          } else if (query.includes('complex')) {
            searchDuration = 2000;
            complexity = 4;
          }

          // Simulate API call with periodic abort checks
          const steps = Math.max(5, complexity * 3);
          const stepDuration = searchDuration / steps;
          const mockResults: SearchResult[] = [];

          for (let i = 0; i < steps; i++) {
            try {
              // Simulate processing time
              await new Promise((resolve) => setTimeout(resolve, stepDuration));

              // Generate mock results progressively
              if (i % 2 === 0 && query.trim()) {
                mockResults.push({
                  id: `result-${i}-${currentSearchId}`,
                  title: `Result ${i + 1} for "${query}"`,
                  description: `This is a mock search result for your query. Step ${i + 1}/${steps} completed.`,
                  relevance: Math.random() * 100,
                  source:
                    i % 3 === 0 ? 'Database' : i % 3 === 1 ? 'API' : 'Cache',
                });
              }
            } catch (_error) {
              console.log(
                `Search aborted at step ${i}/${steps} for query: ${query}`
              );
              activeSearches.current.delete(currentSearchId);
              updateMetrics('abort', Date.now() - startTime);
              setLoading(false);
              setSearchId(null);
              return;
            }
          }

          // Success
          const duration = Date.now() - startTime;
          console.log(
            `Search completed successfully: ${query} (${duration}ms)`
          );

          setResults(mockResults);
          updateMetrics('success', duration);
          activeSearches.current.delete(currentSearchId);
          setLoading(false);
          setSearchId(null);
        } catch (error) {
          console.error(`Search failed for query: ${query}`, error);
          const duration = Date.now() - startTime;
          setError(error instanceof Error ? error.message : 'Search failed');
          updateMetrics('fail', duration);
          activeSearches.current.delete(currentSearchId);
          setLoading(false);
          setSearchId(null);
        }
      })
    );

    // Process data set handler (for cascade testing)
    unregisterFunctions.push(
      register.register(
        'processDataSet',
        async ({ dataSetId, chunkSize }, controller) => {
          console.log(
            `Processing dataset ${dataSetId} with chunk size ${chunkSize}`
          );

          // Simulate data processing
          for (let i = 0; i < chunkSize; i++) {
            try {
              await new Promise((resolve) => setTimeout(resolve, 100));
            } catch (_error) {
              console.log(`Data processing aborted at chunk ${i}/${chunkSize}`);
              return;
            }
          }

          console.log(`Dataset ${dataSetId} processing completed`);
        }
      )
    );

    return () => {
      unregisterFunctions.forEach((unregister) => unregister());
    };
  }, [register, updateMetrics]);

  // Debounced search function
  const debouncedSearch = useCallback(
    (searchQuery: string, delay: number = 300) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(async () => {
        if (searchQuery.trim()) {
          // Reset abort scope for new search (cancels previous searches)
          resetAbortScope();
          await dispatch('search', { query: searchQuery });
        } else {
          setResults([]);
        }
      }, delay);
    },
    [dispatch, resetAbortScope]
  );

  // Handle query changes with debouncing
  useEffect(() => {
    debouncedSearch(query);
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, debouncedSearch]);

  // Abort scenario handlers
  const runAbortScenario = async (scenarioId: string) => {
    updateScenarioStatus(scenarioId, true);
    resetAbortScope();

    try {
      switch (scenarioId) {
        case 'quick-search':
          // Start quick search then immediately abort
          setTimeout(() => {
            abortAll();
            setAbortCount((prev) => prev + 1);
            updateScenarioStatus(
              scenarioId,
              false,
              'Quick search aborted successfully'
            );
          }, 50);
          await dispatch('search', { query: 'quick test query' });
          break;

        case 'slow-search':
          // Start slow search, wait, then abort
          setTimeout(() => {
            abortAll();
            setAbortCount((prev) => prev + 1);
            updateScenarioStatus(
              scenarioId,
              false,
              'Slow search aborted at 50% progress'
            );
          }, 1500);
          await dispatch('search', { query: 'slow detailed complex query' });
          break;

        case 'multi-step':
          // Run multiple searches in sequence
          updateScenarioStatus(
            scenarioId,
            false,
            'Multi-step search initiated'
          );
          await dispatch('search', { query: 'step 1' });
          await dispatch('search', { query: 'step 2 complex' });
          await dispatch('search', { query: 'step 3' });
          updateScenarioStatus(
            scenarioId,
            false,
            'Multi-step search completed'
          );
          break;

        case 'cascade-search': {
          // Search that triggers data processing
          const promises = [
            dispatch('search', { query: 'cascade trigger' }),
            dispatch('processDataSet', {
              dataSetId: 'cascade-data',
              chunkSize: 10,
            }),
          ];

          // Abort after 1 second
          setTimeout(() => {
            abortAll();
            setAbortCount((prev) => prev + 1);
            updateScenarioStatus(
              scenarioId,
              false,
              'Cascade operations aborted'
            );
          }, 1000);

          await Promise.all(promises);
          break;
        }
      }
    } catch (error) {
      updateScenarioStatus(scenarioId, false, `Error: ${error}`);
    }
  };

  // Manual abort handlers
  const handleAbortAll = () => {
    abortAll();
    setAbortCount((prev) => prev + 1);
    setLoading(false);
    setError('Search aborted by user');
  };

  const handleResetAbortScope = () => {
    resetAbortScope();
    console.log(
      'Abort scope reset - new searches will use fresh abort context'
    );
  };

  const handleClearResults = () => {
    setResults([]);
    setError(null);
    setQuery('');
  };

  return (
    <div className="enhanced-abortable-search-example">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-gray-900">
            Enhanced Abortable Search
          </h1>
          <p className="mt-2 text-gray-600">
            Advanced abort functionality, search patterns, and action management
            scenarios
          </p>
        </header>

        {/* Search Interface */}
        <Card title="Search Interface">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search... (try 'quick', 'slow', 'complex')"
                  className="w-full"
                />
              </div>
              <Button
                onClick={handleAbortAll}
                variant="danger"
                disabled={!loading}
              >
                Abort Search
              </Button>
              <Button onClick={handleResetAbortScope} variant="warning">
                Reset Scope
              </Button>
              <Button onClick={handleClearResults} variant="secondary">
                Clear
              </Button>
            </div>

            {/* Status Display */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {loading && (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-blue-600">Searching...</span>
                    {searchId && (
                      <span className="text-xs text-gray-500">
                        ID: {searchId.substr(-8)}
                      </span>
                    )}
                  </div>
                )}

                {error && <Status status="danger">{error}</Status>}

                <div className="text-sm text-gray-600">
                  Active searches: {activeSearches.current.size}
                </div>
              </div>

              <div className="text-sm text-gray-500">
                Total aborts: {abortCount}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Abort Scenarios */}
          <Card title="Abort Scenarios">
            <div className="space-y-3">
              {abortScenarios.map((scenario) => (
                <div key={scenario.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{scenario.name}</h4>
                      <p className="text-sm text-gray-600">
                        {scenario.description}
                      </p>
                    </div>
                    <Button
                      onClick={() => runAbortScenario(scenario.id)}
                      variant="primary"
                      disabled={scenario.active}
                      className="text-sm"
                    >
                      {scenario.active ? 'Running...' : 'Run'}
                    </Button>
                  </div>

                  {scenario.result && (
                    <div className="text-sm text-green-600 mt-2">
                      Result: {scenario.result}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Search Metrics */}
          <Card title="Search Metrics">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {searchMetrics.totalSearches}
                </div>
                <div className="text-gray-500">Total Searches</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {searchMetrics.successfulSearches}
                </div>
                <div className="text-gray-500">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {searchMetrics.abortedSearches}
                </div>
                <div className="text-gray-500">Aborted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {searchMetrics.failedSearches}
                </div>
                <div className="text-gray-500">Failed</div>
              </div>
              <div className="text-center col-span-2">
                <div className="text-lg font-bold text-purple-600">
                  {Math.round(searchMetrics.averageSearchTime)}ms
                </div>
                <div className="text-gray-500">Average Time</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Search Results */}
        <Card title={`Search Results (${results.length})`}>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {query ? 'No results found' : 'Start typing to search...'}
              </p>
            ) : (
              results.map((result) => (
                <div
                  key={result.id}
                  className="border rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {result.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {result.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Source: {result.source}</span>
                        <span>Relevance: {Math.round(result.relevance)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Technical Information */}
        <Card title="Technical Information">
          <div className="prose prose-sm max-w-none">
            <h4>Features Demonstrated:</h4>
            <ul>
              <li>
                <strong>Debounced Search:</strong> Automatic cancellation of
                previous searches when typing
              </li>
              <li>
                <strong>Manual Abort:</strong> User-triggered abort of running
                searches
              </li>
              <li>
                <strong>Abort Scenarios:</strong> Pre-configured test cases for
                different abort patterns
              </li>
              <li>
                <strong>Progress Tracking:</strong> Real-time monitoring of
                search progress and abort status
              </li>
              <li>
                <strong>Metrics Collection:</strong> Performance and behavior
                analytics
              </li>
              <li>
                <strong>Scope Management:</strong> resetAbortScope() for
                managing abort contexts
              </li>
            </ul>

            <h4>Abort Strategies:</h4>
            <ul>
              <li>
                <strong>Quick Search:</strong> Tests immediate abort after
                dispatch
              </li>
              <li>
                <strong>Slow Search:</strong> Tests abort during long-running
                operations
              </li>
              <li>
                <strong>Multi-step:</strong> Tests abort between sequential
                operations
              </li>
              <li>
                <strong>Cascade:</strong> Tests abort of multiple concurrent
                actions
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function EnhancedAbortableSearchExampleWithProvider() {
  return (
    <ActionProvider>
      <EnhancedAbortableSearchExample />
    </ActionProvider>
  );
}
