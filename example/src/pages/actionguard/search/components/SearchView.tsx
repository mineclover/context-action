/**
 * @fileoverview Search View Component - View Layer
 * 
 * Hook을 통해 Data/Action과 연결되는 View 컴포넌트입니다.
 */

import { DemoCard, Input, Button, CodeBlock, CodeExample } from '../../../../components/ui';
import { useSearchLogic } from '../hooks/useSearchLogic';

/**
 * 검색 View 컴포넌트
 * 
 * Hook Layer를 통해 데이터와 액션을 받아 UI를 렌더링합니다.
 */
export function SearchView() {
  const {
    searchState,
    handleSearchChange,
    clearSearch,
    hasResults,
    isFirstSearch,
  } = useSearchLogic();

  return (
    <div className="space-y-6">
      {/* 메인 검색 UI */}
      <DemoCard>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            🔍 Search with Debouncing Demo
          </h3>
          <p className="text-sm text-gray-600">
            This demo shows how debouncing prevents excessive API calls during rapid typing. 
            Search requests are delayed by <strong>500ms</strong> after the user stops typing, 
            reducing server load and improving user experience.
          </p>
        </div>
        
        <div className="space-y-4">
          {/* 검색 입력 */}
          <div className="flex gap-2">
            <Input
              type="text"
              value={searchState.searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Type to search (debounced by 500ms)"
              className="flex-1"
            />
            <Button
              onClick={clearSearch}
              variant="secondary"
              size="sm"
              disabled={!searchState.searchTerm}
            >
              Clear
            </Button>
          </div>

          {/* 검색 상태 표시 */}
          <div className="flex justify-between text-sm text-gray-600">
            <span>
              {searchState.isSearching ? (
                <span className="text-blue-600">Searching...</span>
              ) : (
                <span>Total searches: {searchState.searchCount}</span>
              )}
            </span>
            {searchState.lastSearchTime && (
              <span>
                Last search: {new Date(searchState.lastSearchTime).toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* 검색 결과 */}
          {hasResults && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Results:</h4>
              {searchState.searchResults.map((result, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm hover:bg-gray-100 transition-colors"
                >
                  {result}
                </div>
              ))}
            </div>
          )}

          {/* 빈 상태 */}
          {!hasResults && !searchState.isSearching && searchState.searchTerm && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
              No results found for "{searchState.searchTerm}"
            </div>
          )}

          {/* 초기 상태 */}
          {isFirstSearch && !searchState.searchTerm && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
              Start typing to search. The search will be triggered 500ms after you stop typing.
            </div>
          )}
        </div>
      </DemoCard>

      {/* 개념 설명 */}
      <DemoCard variant="info">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Debouncing Pattern
        </h3>
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong className="text-gray-900">What is Debouncing?</strong>
            <br />
            Debouncing delays the execution of a function until after a certain 
            period of inactivity. It's perfect for search inputs where you want 
            to wait until the user stops typing before making an API call.
          </p>
          <p>
            <strong className="text-gray-900">Benefits:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Reduces unnecessary API calls</li>
            <li>Improves server performance</li>
            <li>Better user experience</li>
            <li>Lower network traffic</li>
          </ul>
          <p>
            <strong className="text-gray-900">How it works:</strong>
            <br />
            Each keystroke resets a timer. The search only executes when the 
            timer completes without interruption (user stops typing).
          </p>
        </div>
      </DemoCard>

      {/* 코드 예제 */}
      <CodeExample title="Debouncing Implementation">
        <CodeBlock>
          {`// Custom debounce hook
function useDebounce<T extends any[]>(
  callback: (...args: T) => void,
  delay: number
) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: T) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}

// Usage in search
const performSearch = (term: string) => {
  // Actual search logic
  api.search(term).then(results => {
    setSearchResults(results);
  });
};

const debouncedSearch = useDebounce(performSearch, 500);

// In component
<input
  onChange={(e) => debouncedSearch(e.target.value)}
  placeholder="Search..."
/>`}
        </CodeBlock>
      </CodeExample>

      {/* 사용 사례 */}
      <DemoCard variant="info">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Common Use Cases
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Search inputs with API calls</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Form validation on input</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Auto-save functionality</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Real-time username availability check</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Live markdown preview</span>
          </li>
        </ul>
      </DemoCard>
    </div>
  );
}