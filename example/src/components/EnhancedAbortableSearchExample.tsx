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

export function EnhancedAbortableSearchExample() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const dispatch = useActionDispatch();
  const { resetAbortScope } = useActionDispatchWithResult();

  // Register search handler
  useActionHandler('search', async ({ query }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Don't return results directly from handler
  });

  // Register data processing handler
  useActionHandler('processLargeDataSet', async ({ dataSetId, chunkSize }) => {
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Don't return results directly from handler
  });

  const handleSearch = async () => {
    if (!query.trim()) return;

    resetAbortScope();
    setLoading(true);

    try {
      await dispatch('search', { query });
      // Simulate search results
      setResults([
        { id: 1, title: `Result for "${query}"`, description: 'Sample result' }
      ]);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ActionProvider>
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Enhanced Search Example</h2>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter search query..."
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div>
          <h3 className="font-semibold">Results:</h3>
          {results.length === 0 ? (
            <p className="text-gray-500">No results</p>
          ) : (
            <ul className="space-y-2">
              {results.map((result, index) => (
                <li key={index} className="p-2 border rounded">
                  <h4 className="font-medium">{result.title}</h4>
                  <p className="text-sm text-gray-600">{result.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ActionProvider>
  );
}

export default EnhancedAbortableSearchExample;