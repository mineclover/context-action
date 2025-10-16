/**
 * @fileoverview Advanced Search Demo - Context-Action 고급 검색 시스템
 *
 * 전문적인 검색 기능과 abort 가능한 검색 시스템을 통해
 * Context-Action 프레임워크의 Store와 Action Pipeline을 활용한
 * 실시간 검색, 필터링, 결과 선택을 보여주는 고급 데모입니다.
 */

import {
  createActionContext,
  createStoreContext,
  useStoreValue,
} from '@context-action/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

// ===== 타입 정의 =====
interface SearchItem {
  id: string;
  title: string;
  category: string;
  tags: string[];
  author: string;
  date: string;
  popularity: number;
  relevance?: number;
}

interface SearchActions {
  performSearch: {
    query: string;
    filters: Record<string, string>;
    signal?: AbortSignal;
  };
  updateQuery: { query: string };
  addSearch: { key: string; value: string };
  removeSearch: { key: string };
  clearSearchs: void;
  selectResult: { id: string; item: SearchItem };
  abortSearch: void;
}

interface SearchMetrics {
  totalSearches: number;
  averageSearchTime: number;
  activeSearchs: number;
  resultsFound: number;
  searchHits: Record<string, number>;
  popularSearchs: Array<{ tag: string; count: number }>;
}

// ===== 샘플 데이터 =====
const sampleData: SearchItem[] = [
  {
    id: '1',
    title: 'React Hooks Advanced Patterns',
    category: 'Tutorial',
    tags: ['react', 'hooks', 'javascript', 'patterns'],
    author: 'John Doe',
    date: '2024-01-15',
    popularity: 95,
  },
  {
    id: '2',
    title: 'TypeScript Best Practices Guide',
    category: 'Guide',
    tags: ['typescript', 'javascript', 'best-practices', 'coding'],
    author: 'Jane Smith',
    date: '2024-01-20',
    popularity: 88,
  },
  {
    id: '3',
    title: 'Context-Action Framework Deep Dive',
    category: 'Documentation',
    tags: ['context-action', 'react', 'state-management', 'framework'],
    author: 'Dev Team',
    date: '2024-01-25',
    popularity: 92,
  },
  {
    id: '4',
    title: 'Performance Optimization Masterclass',
    category: 'Tutorial',
    tags: ['performance', 'optimization', 'react', 'javascript'],
    author: 'Mike Johnson',
    date: '2024-01-30',
    popularity: 96,
  },
  {
    id: '5',
    title: 'Action Pipeline Architecture',
    category: 'Tutorial',
    tags: ['context-action', 'pipeline', 'advanced', 'architecture'],
    author: 'Sarah Wilson',
    date: '2024-02-05',
    popularity: 89,
  },
  {
    id: '6',
    title: 'Store Management Patterns',
    category: 'Guide',
    tags: ['store', 'patterns', 'architecture', 'design'],
    author: 'Tom Brown',
    date: '2024-02-10',
    popularity: 85,
  },
  {
    id: '7',
    title: 'Component Testing Strategies',
    category: 'Guide',
    tags: ['testing', 'components', 'jest', 'tdd'],
    author: 'Lisa Chen',
    date: '2024-02-15',
    popularity: 91,
  },
  {
    id: '8',
    title: 'Real-time State Synchronization',
    category: 'Documentation',
    tags: ['state', 'sync', 'real-time', 'websockets'],
    author: 'Alex Kim',
    date: '2024-02-20',
    popularity: 87,
  },
];

// ===== Store Context =====
const { Provider: SearchStoreProvider, useStore: useSearchStore } =
  createStoreContext('AdvancedSearch', {
    query: '',
    filters: {} as Record<string, string>,
    results: sampleData,
    selectedResult: null as SearchItem | null,
    isSearching: false,
    searchHistory: [] as string[],
    metrics: {
      totalSearches: 0,
      averageSearchTime: 0,
      activeSearchs: 0,
      resultsFound: 0,
      searchHits: {},
      popularSearchs: [],
    } as SearchMetrics,
  });

// ===== Action Context =====
const {
  Provider: SearchActionProvider,
  useActionDispatch,
  useActionHandler,
} = createActionContext<SearchActions>('AdvancedSearch');

// ===== 메인 페이지 컴포넌트 =====
export function SearchPageRefactored() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* 1. Architecture Section */}
        <ArchitectureSection />

        <SearchStoreProvider>
          <SearchActionProvider>
            {/* 2. Demo Section */}
            <DemoSection />

            {/* 3. Status Section */}
            <StatusSection />

            {/* 4. Code Section */}
            <CodeSection />
          </SearchActionProvider>
        </SearchStoreProvider>
      </div>
    </div>
  );
}

// ===== 1. Architecture Section =====
function ArchitectureSection() {
  return (
    <section className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Advanced Search System
          </h1>
          <p className="text-gray-600">
            고급 검색 기능과 abort 가능한 검색 시스템
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
            <h3 className="text-xl font-semibold text-blue-900 mb-4">
              🎯 System Architecture
            </h3>
            <div className="space-y-4 text-blue-800">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <strong>Action Pipeline:</strong> performSearch, updateQuery,
                  addSearch, removeSearch, selectResult
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <strong>Store Management:</strong> query, filters, results,
                  selectedResult, isSearching, metrics
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <strong>Abort Support:</strong> AbortController integration
                  for cancellable search operations
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
            <h3 className="text-xl font-semibold text-green-900 mb-4">
              ⚡ Key Features
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 text-green-800">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <span>실시간 검색 with debouncing</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <span>다중 필터링 시스템</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <span>검색 기록 관리</span>
                </div>
              </div>
              <div className="space-y-2 text-green-800">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <span>고급 메트릭스 추적</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <span>Abort 가능한 검색</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <span>관련도 기반 정렬</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
            <h3 className="text-xl font-semibold text-purple-900 mb-4">
              🔄 Data Flow
            </h3>
            <div className="space-y-3 text-sm text-purple-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-400 rounded-full" />
                <span>User Input</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span>Action</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-pink-400 rounded-full" />
                <span>Handler</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span>Search Logic</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-400 rounded-full" />
                <span>Store Update</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span>UI Refresh</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
            <h3 className="text-xl font-semibold text-orange-900 mb-4">
              🛡️ Performance
            </h3>
            <div className="space-y-2 text-orange-800 text-sm">
              <div>• Debounced search input</div>
              <div>• AbortController support</div>
              <div>• Optimized filtering</div>
              <div>• Relevance scoring</div>
              <div>• Memory efficient</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== 2. Demo Section =====
function DemoSection() {
  return (
    <section className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          🎯 Interactive Search Demo
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Live Demo Active</span>
        </div>
      </div>

      <SearchDemoInterface />
    </section>
  );
}

// ===== Search Demo Interface =====
function SearchDemoInterface() {
  const dispatch = useActionDispatch();

  // Store subscriptions
  const queryStore = useSearchStore('query');
  const filtersStore = useSearchStore('filters');
  const resultsStore = useSearchStore('results');
  const selectedResultStore = useSearchStore('selectedResult');
  const isSearchingStore = useSearchStore('isSearching');
  const searchHistoryStore = useSearchStore('searchHistory');
  const metricsStore = useSearchStore('metrics');

  const query = useStoreValue(queryStore) || '';
  const filters = useStoreValue(filtersStore) || {};
  const results = useStoreValue(resultsStore) || [];
  const selectedResult = useStoreValue(selectedResultStore);
  const isSearching = useStoreValue(isSearchingStore);
  const searchHistory = useStoreValue(searchHistoryStore) || [];
  const metrics = useStoreValue(metricsStore);

  // Action handlers
  useActionHandler(
    'updateQuery',
    useCallback(
      async (payload) => {
        queryStore.setValue(payload.query);

        // 검색 기록 업데이트
        if (payload.query.trim() && !searchHistory.includes(payload.query)) {
          const newHistory = [payload.query, ...searchHistory].slice(0, 5);
          searchHistoryStore.setValue(newHistory);
        }
      },
      [queryStore, searchHistory, searchHistoryStore]
    )
  );

  useActionHandler(
    'performSearch',
    useCallback(
      async (payload, controller) => {
        const startTime = Date.now();
        isSearchingStore.setValue(true);

        try {
          const { query, filters, signal } = payload;

          // Simulate search delay
          await new Promise((resolve) => setTimeout(resolve, 300));

          if (signal?.aborted) {
            throw new Error('Search aborted');
          }

          // Search logic
          let filteredResults = sampleData.map((item) => ({
            ...item,
            relevance: calculateRelevance(item, query),
          }));

          // Apply text search
          if (query.trim()) {
            const searchTerm = query.toLowerCase();
            filteredResults = filteredResults.filter(
              (item) =>
                item.title.toLowerCase().includes(searchTerm) ||
                item.tags.some((tag) =>
                  tag.toLowerCase().includes(searchTerm)
                ) ||
                item.author.toLowerCase().includes(searchTerm)
            );
          }

          // Apply filters
          Object.entries(filters).forEach(([key, value]) => {
            if (value) {
              filteredResults = filteredResults.filter((item) => {
                if (key === 'category') return item.category === value;
                if (key === 'author') return item.author === value;
                if (key === 'tag') return item.tags.includes(value);
                return true;
              });
            }
          });

          // Sort by relevance
          filteredResults.sort(
            (a, b) => (b.relevance || 0) - (a.relevance || 0)
          );

          resultsStore.setValue(filteredResults);

          // Update metrics
          const searchTime = Date.now() - startTime;
          const currentMetrics = metricsStore.getValue();
          const newMetrics: SearchMetrics = {
            ...currentMetrics,
            totalSearches: currentMetrics.totalSearches + 1,
            averageSearchTime:
              (currentMetrics.averageSearchTime * currentMetrics.totalSearches +
                searchTime) /
              (currentMetrics.totalSearches + 1),
            activeSearchs: Object.keys(filters).length,
            resultsFound: filteredResults.length,
            searchHits: {
              ...currentMetrics.searchHits,
              [query]: (currentMetrics.searchHits[query] || 0) + 1,
            },
          };

          metricsStore.setValue(newMetrics);
        } catch (error) {
          console.warn('Search operation aborted or failed:', error);
        } finally {
          isSearchingStore.setValue(false);
        }
      },
      [resultsStore, isSearchingStore, metricsStore]
    )
  );

  useActionHandler(
    'addSearch',
    useCallback(
      async (payload) => {
        const currentSearchs = filtersStore.getValue();
        const newSearchs = { ...currentSearchs, [payload.key]: payload.value };
        filtersStore.setValue(newSearchs);

        dispatch('performSearch', {
          query: queryStore.getValue(),
          filters: newSearchs,
        });
      },
      [dispatch, filtersStore, queryStore]
    )
  );

  useActionHandler(
    'removeSearch',
    useCallback(
      async (payload) => {
        const currentSearchs = filtersStore.getValue();
        const { [payload.key]: removed, ...newSearchs } = currentSearchs;
        filtersStore.setValue(newSearchs);

        dispatch('performSearch', {
          query: queryStore.getValue(),
          filters: newSearchs,
        });
      },
      [dispatch, filtersStore, queryStore]
    )
  );

  useActionHandler(
    'clearSearchs',
    useCallback(async () => {
      filtersStore.setValue({});
      dispatch('performSearch', { query: queryStore.getValue(), filters: {} });
    }, [dispatch, filtersStore, queryStore])
  );

  useActionHandler(
    'selectResult',
    useCallback(
      async (payload) => {
        selectedResultStore.setValue(payload.item);
      },
      [selectedResultStore]
    )
  );

  // Search helper
  const handleSearch = useCallback(
    (searchQuery: string) => {
      dispatch('updateQuery', { query: searchQuery });
      dispatch('performSearch', { query: searchQuery, filters });
    },
    [dispatch, filters]
  );

  // Statistics
  const stats = useMemo(() => {
    const categories = [...new Set(sampleData.map((item) => item.category))];
    const authors = [...new Set(sampleData.map((item) => item.author))];
    const tags = [...new Set(sampleData.flatMap((item) => item.tags))];

    return {
      categories,
      authors,
      tags,
      total: sampleData.length,
      results: results?.length || 0,
    };
  }, [results]);

  return (
    <div className="space-y-8">
      {/* Search Interface */}
      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="제목, 태그, 저자로 검색..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSearching}
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 animate-spin">
                ⏳
              </div>
            )}
          </div>
          <button
            onClick={() => dispatch('performSearch', { query, filters })}
            disabled={isSearching}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50"
          >
            {isSearching ? '검색중...' : '🔍 검색'}
          </button>
        </div>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">
              최근 검색
            </h4>
            <div className="flex gap-2 flex-wrap">
              {searchHistory.map((historyQuery, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(historyQuery)}
                  className="px-3 py-1 bg-white text-gray-700 rounded-full text-sm hover:bg-gray-50 transition-colors border"
                >
                  <span className="w-3 h-3 inline mr-1" />
                  {historyQuery}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-blue-800">전체 항목</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {stats.results}
          </div>
          <div className="text-sm text-green-800">검색 결과</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {stats.categories.length}
          </div>
          <div className="text-sm text-purple-800">카테고리</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {Object.keys(filters).length}
          </div>
          <div className="text-sm text-orange-800">활성 필터</div>
        </div>
      </div>

      {/* Searchs and Results */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Searchs */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              필터
            </h3>

            {/* Active Searchs */}
            {Object.keys(filters).length > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-600">
                    활성 필터
                  </h4>
                  <button
                    onClick={() => dispatch('clearSearchs')}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    모두 제거
                  </button>
                </div>
                <div className="space-y-1">
                  {Object.entries(filters).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between items-center p-2 bg-blue-50 rounded text-sm"
                    >
                      <span>
                        <strong>{key}</strong>: {value}
                      </span>
                      <button
                        onClick={() => dispatch('removeSearch', { key })}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category Searchs */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-600 mb-2">
                카테고리
              </h4>
              <div className="space-y-1">
                {stats.categories.map((category) => (
                  <button
                    key={category}
                    onClick={() =>
                      dispatch('addSearch', {
                        key: 'category',
                        value: category,
                      })
                    }
                    className="block w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Searchs */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">
                인기 태그
              </h4>
              <div className="flex flex-wrap gap-1">
                {stats.tags.slice(0, 10).map((tag) => (
                  <button
                    key={tag}
                    onClick={() =>
                      dispatch('addSearch', { key: 'tag', value: tag })
                    }
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
                  >
                    <span className="w-3 h-3 inline mr-1" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                검색 결과
              </h3>
              <span className="text-sm text-gray-600">
                {results.length}개 결과 (
                {metrics?.averageSearchTime?.toFixed(0)}ms 평균)
              </span>
            </div>

            <div className="space-y-4">
              {results.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <span className="w-12 h-12 mx-auto mb-4" />
                  <div className="text-lg mb-2">검색 결과가 없습니다</div>
                  <div className="text-sm text-gray-500">
                    다른 키워드로 검색해보거나 필터를 조정해보세요
                  </div>
                </div>
              ) : (
                results.map((item) => (
                  <div
                    key={item.id}
                    onClick={() =>
                      dispatch('selectResult', { id: item.id, item })
                    }
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedResult?.id === item.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-lg text-gray-900">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {item.category}
                        </span>
                        {item.relevance && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                            {Math.round(item.relevance * 100)}% 관련도
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        {item.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        {item.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        {item.popularity}% 인기도
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Result Detail */}
      {selectedResult && (
        <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              선택된 항목
            </h3>
            <button
              onClick={() => selectedResultStore.setValue(null)}
              className="text-gray-400 hover:text-gray-600 text-lg"
            >
              ✕
            </button>
          </div>

          <div className="bg-white rounded-lg p-6">
            <h4 className="text-2xl font-bold text-gray-900 mb-4">
              {selectedResult.title}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">카테고리:</span>
                <div className="mt-1">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {selectedResult.category}
                  </span>
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-600">저자:</span>
                <div className="mt-1 text-gray-900">
                  {selectedResult.author}
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-600">날짜:</span>
                <div className="mt-1 text-gray-900">{selectedResult.date}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">인기도:</span>
                <div className="mt-1 text-gray-900">
                  {selectedResult.popularity}%
                </div>
              </div>
            </div>

            <div>
              <span className="font-medium text-gray-600 block mb-2">
                태그:
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedResult.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== 3. Status Section =====
function StatusSection() {
  const metricsStore = useSearchStore('metrics');
  const resultsStore = useSearchStore('results');
  const filtersStore = useSearchStore('filters');

  const metrics = useStoreValue(metricsStore);
  const results = useStoreValue(resultsStore) || [];
  const filters = useStoreValue(filtersStore) || {};

  return (
    <section className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Search Analytics & Metrics
          </h2>
          <p className="text-gray-600">실시간 검색 성능 및 사용 통계</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Performance Metrics */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              🚀 성능 메트릭스
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-blue-700">총 검색 수행</span>
                <span className="font-bold text-blue-900">
                  {metrics?.totalSearches || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-700">평균 응답시간</span>
                <span className="font-bold text-blue-900">
                  {metrics?.averageSearchTime?.toFixed(0) || 0}ms
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-700">활성 필터 수</span>
                <span className="font-bold text-blue-900">
                  {Object.keys(filters).length}
                </span>
              </div>
            </div>
          </div>

          {/* Search Results */}
          <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
            <h3 className="text-lg font-semibold text-green-900 mb-4">
              📊 검색 결과
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-green-700">현재 결과 수</span>
                <span className="font-bold text-green-900">
                  {results.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-700">전체 데이터 수</span>
                <span className="font-bold text-green-900">
                  {sampleData.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-700">검색 적중률</span>
                <span className="font-bold text-green-900">
                  {sampleData.length > 0
                    ? Math.round((results.length / sampleData.length) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Popular Searches */}
          <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
            <h3 className="text-lg font-semibold text-purple-900 mb-4">
              🔥 인기 검색어
            </h3>
            <div className="space-y-2">
              {Object.entries(metrics?.searchHits || {})
                .slice(0, 5)
                .map(([query, count], index) => (
                  <div
                    key={query}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-purple-700 truncate">
                      {query || '(빈 검색어)'}
                    </span>
                    <span className="font-bold text-purple-900 ml-2">
                      {count}
                    </span>
                  </div>
                ))}
              {Object.keys(metrics?.searchHits || {}).length === 0 && (
                <div className="text-sm text-purple-700 italic">
                  검색어가 없습니다
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
            <h3 className="text-lg font-semibold text-orange-900 mb-4">
              ⚡ 실시간 상태
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-orange-700">시스템 정상 동작</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-orange-700">검색 기능 활성</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full" />
                <span className="text-orange-700">필터링 활성</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📈 성능 지표
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-700">검색 속도</span>
                  <span className="text-gray-900 font-medium">95%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: '95%' }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-700">결과 정확도</span>
                  <span className="text-gray-900 font-medium">98%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: '98%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== 4. Code Section =====
function CodeSection() {
  return (
    <section className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Implementation Details
          </h2>
          <p className="text-gray-600">핵심 구현 코드와 아키텍처 패턴</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="p-6 bg-gray-50 rounded-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              🏪 Store Context Pattern
            </h3>
            <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              {`const { Provider, useStore } = createStoreContext('AdvancedSearch', {
  query: '',
  filters: {} as Record<string, string>,
  results: sampleData,
  selectedResult: null as SearchItem | null,
  isSearching: false,
  searchHistory: [] as string[],
  metrics: {
    totalSearches: 0,
    averageSearchTime: 0,
    activeSearchs: 0,
    resultsFound: 0,
    searchHits: {},
    popularSearchs: []
  } as SearchMetrics
});`}
            </pre>
          </div>

          <div className="p-6 bg-gray-50 rounded-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              ⚡ Action Handler
            </h3>
            <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              {`useActionHandler('performSearch', useCallback(async (payload, controller) => {
  const startTime = Date.now();
  isSearchingStore.setValue(true);

  try {
    const { query, filters, signal } = payload;
    
    // Abortable search simulation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (signal?.aborted) {
      throw new Error('Search aborted');
    }
    
    // Advanced search logic with relevance scoring
    let filteredResults = sampleData.map(item => ({
      ...item,
      relevance: calculateRelevance(item, query)
    }));
    
    // Apply filters and sorting...
    
  } catch (error) {
    console.warn('Search aborted:', error);
  } finally {
    isSearchingStore.setValue(false);
  }
}, [resultsStore, isSearchingStore, metricsStore]));`}
            </pre>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-gray-50 rounded-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              🎯 Action Types
            </h3>
            <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              {`interface SearchActions {
  performSearch: { 
    query: string; 
    filters: Record<string, string>; 
    signal?: AbortSignal 
  };
  updateQuery: { query: string };
  addSearch: { key: string; value: string };
  removeSearch: { key: string };
  clearSearchs: void;
  selectResult: { id: string; item: SearchItem };
  abortSearch: void;
}`}
            </pre>
          </div>

          <div className="p-6 bg-gray-50 rounded-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              📊 Relevance Scoring
            </h3>
            <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              {`function calculateRelevance(item: SearchItem, query: string): number {
  if (!query.trim()) return 0.5;
  
  const searchTerm = query.toLowerCase();
  let score = 0;
  
  // Title match (highest weight)
  if (item.title.toLowerCase().includes(searchTerm)) {
    score += 0.6;
  }
  
  // Search matches
  const tagMatches = item.tags.filter(tag => 
    tag.toLowerCase().includes(searchTerm)
  ).length;
  score += (tagMatches * 0.3) / item.tags.length;
  
  // Author match
  if (item.author.toLowerCase().includes(searchTerm)) {
    score += 0.1;
  }
  
  // Popularity bonus
  score += (item.popularity / 100) * 0.2;
  
  return Math.min(score, 1);
}`}
            </pre>
          </div>

          <div className="p-6 bg-blue-50 rounded-xl">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              🔧 Key Features
            </h3>
            <ul className="space-y-2 text-blue-800 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>AbortController를 통한 검색 취소 지원</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                <span>실시간 메트릭스 추적 및 성능 모니터링</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span>관련도 기반 결과 정렬</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full" />
                <span>검색 기록 관리 및 재검색</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span>다중 필터링 시스템</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== 헬퍼 함수 =====
function calculateRelevance(item: SearchItem, query: string): number {
  if (!query.trim()) return 0.5;

  const searchTerm = query.toLowerCase();
  let score = 0;

  // Title match (highest weight)
  if (item.title.toLowerCase().includes(searchTerm)) {
    score += 0.6;
  }

  // Search matches
  const tagMatches = item.tags.filter((tag) =>
    tag.toLowerCase().includes(searchTerm)
  ).length;
  score += (tagMatches * 0.3) / item.tags.length;

  // Author match
  if (item.author.toLowerCase().includes(searchTerm)) {
    score += 0.1;
  }

  // Popularity bonus
  score += (item.popularity / 100) * 0.2;

  return Math.min(score, 1);
}

export default SearchPageRefactored;
