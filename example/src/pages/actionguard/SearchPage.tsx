/**
 * @fileoverview Search Demo Page
 * Context-Action framework의 검색 기능 데모
 */

import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { PageWithLogMonitor } from '../../components/LogMonitor';
import { createActionContext } from '@context-action/react';
import { createStore, useStoreValue } from '@context-action/react';
import { Badge, Card, CardContent } from '../../components/ui';

// 검색 관련 액션 타입 정의
interface SearchActions {
  performSearch: { query: string; filters: any };
  updateQuery: { query: string };
  addFilter: { key: string; value: string };
  removeFilter: { key: string };
  clearFilters: void;
  selectResult: { id: string; item: any };
}

// 샘플 데이터
const sampleData = [
  { id: '1', title: 'React Hooks Guide', category: 'Tutorial', tags: ['react', 'hooks', 'javascript'], author: 'John Doe', date: '2024-01-15' },
  { id: '2', title: 'TypeScript Best Practices', category: 'Guide', tags: ['typescript', 'javascript', 'best-practices'], author: 'Jane Smith', date: '2024-01-20' },
  { id: '3', title: 'Context-Action Framework', category: 'Documentation', tags: ['context-action', 'react', 'state-management'], author: 'Dev Team', date: '2024-01-25' },
  { id: '4', title: 'Performance Optimization', category: 'Tutorial', tags: ['performance', 'optimization', 'react'], author: 'Mike Johnson', date: '2024-01-30' },
  { id: '5', title: 'Action Pipeline Deep Dive', category: 'Tutorial', tags: ['context-action', 'pipeline', 'advanced'], author: 'Sarah Wilson', date: '2024-02-05' },
  { id: '6', title: 'Store Management Patterns', category: 'Guide', tags: ['store', 'patterns', 'architecture'], author: 'Tom Brown', date: '2024-02-10' },
  { id: '7', title: 'Component Testing Strategies', category: 'Guide', tags: ['testing', 'components', 'jest'], author: 'Lisa Chen', date: '2024-02-15' },
  { id: '8', title: 'State Synchronization', category: 'Documentation', tags: ['state', 'sync', 'real-time'], author: 'Alex Kim', date: '2024-02-20' },
];

// Store 생성
const searchQueryStore = createStore('searchQuery', '');
const searchFiltersStore = createStore('searchFilters', {} as Record<string, string>);
const searchResultsStore = createStore('searchResults', sampleData);
const selectedResultStore = createStore('selectedResult', null as any);

// Action Context 생성
const { Provider: SearchProvider, useActionDispatch, useActionHandler } = 
  createActionContext<SearchActions>('Search');

// 메인 컴포넌트
export function SearchPage() {
  return (
    <PageWithLogMonitor
      pageId="search-demo"
      title="Search Demo"
      initialConfig={{ enableToast: true, maxLogs: 50 }}
    >
      <div className="page-container">
        <header className="page-header">
          <h1>🔍 Search Demo</h1>
          <p className="page-description">
            Context-Action 프레임워크의 <strong>검색 기능 시스템</strong>입니다.
            실시간 검색, 필터링, 결과 선택을 통해 Store와 Action의 완벽한 검색 시나리오를 보여줍니다.
          </p>
          
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline" className="bg-blue-50 text-blue-800">
              🔍 실시간 검색
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-800">
              🎯 스마트 필터링
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-800">
              📊 결과 분석
            </Badge>
            <Badge variant="outline" className="bg-orange-50 text-orange-800">
              ⚡ Action Pipeline
            </Badge>
          </div>
        </header>

        <SearchProvider>
          <SearchDemo />
        </SearchProvider>
      </div>
    </PageWithLogMonitor>
  );
}

// 데모 컴포넌트
function SearchDemo() {
  const dispatch = useActionDispatch();
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  // Store 구독
  const query = useStoreValue(searchQueryStore) || '';
  const filters = useStoreValue(searchFiltersStore) || {};
  const results = useStoreValue(searchResultsStore) || [];
  const selectedResult = useStoreValue(selectedResultStore);

  // Action Handlers 등록
  useActionHandler('updateQuery', useCallback(async (payload, controller) => {
    searchQueryStore.setValue(payload.query);
    
    // 검색 기록 업데이트
    if (payload.query.trim() && !searchHistory.includes(payload.query)) {
      setSearchHistory(prev => [payload.query, ...prev].slice(0, 5));
    }
  }, [searchHistory]));

  useActionHandler('performSearch', useCallback(async (payload, controller) => {
    const { query, filters } = payload;
    
    // 검색 로직 시뮬레이션
    let filteredResults = sampleData;
    
    // 텍스트 검색
    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      filteredResults = filteredResults.filter(item => 
        item.title.toLowerCase().includes(searchTerm) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        item.author.toLowerCase().includes(searchTerm)
      );
    }
    
    // 필터 적용
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filteredResults = filteredResults.filter(item => {
          if (key === 'category') return item.category === value;
          if (key === 'author') return item.author === value;
          if (key === 'tag') return item.tags.includes(value as string);
          return true;
        });
      }
    });
    
    searchResultsStore.setValue(filteredResults);
  }, []));

  useActionHandler('addFilter', useCallback(async (payload, controller) => {
    const currentFilters = searchFiltersStore.getValue();
    const newFilters = { ...currentFilters, [payload.key]: payload.value };
    searchFiltersStore.setValue(newFilters);
    
    // 필터 변경 시 자동 검색
    dispatch('performSearch', { query: searchQueryStore.getValue(), filters: newFilters });
  }, [dispatch]));

  useActionHandler('removeFilter', useCallback(async (payload, controller) => {
    const currentFilters = searchFiltersStore.getValue();
    const { [payload.key]: removed, ...newFilters } = currentFilters;
    searchFiltersStore.setValue(newFilters);
    
    // 필터 제거 시 자동 검색
    dispatch('performSearch', { query: searchQueryStore.getValue(), filters: newFilters });
  }, [dispatch]));

  useActionHandler('clearFilters', useCallback(async (_, controller) => {
    searchFiltersStore.setValue({});
    
    // 필터 초기화 시 자동 검색
    dispatch('performSearch', { query: searchQueryStore.getValue(), filters: {} });
  }, [dispatch]));

  useActionHandler('selectResult', useCallback(async (payload, controller) => {
    selectedResultStore.setValue(payload.item);
  }, []));

  // 검색 실행
  const handleSearch = useCallback((searchQuery: string) => {
    dispatch('updateQuery', { query: searchQuery });
    dispatch('performSearch', { query: searchQuery, filters });
  }, [dispatch, filters]);

  // 통계 데이터
  const stats = useMemo(() => {
    const categories = [...new Set(sampleData.map(item => item.category))];
    const authors = [...new Set(sampleData.map(item => item.author))];
    const tags = [...new Set(sampleData.flatMap(item => item.tags))];
    
    return { categories, authors, tags, total: sampleData.length, results: results?.length || 0 };
  }, [results]);

  return (
    <div className="space-y-6">
      {/* 검색 입력 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="제목, 태그, 저자로 검색..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => dispatch('performSearch', { query, filters })}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              🔍 검색
            </button>
          </div>
          
          {/* 검색 기록 */}
          {searchHistory.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">최근 검색</h4>
              <div className="flex gap-2 flex-wrap">
                {searchHistory.map((historyQuery, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(historyQuery)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    {historyQuery}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 통계 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm text-gray-600 mb-2">전체 항목</h4>
            <div className="text-2xl font-bold text-blue-600">
              {stats.total}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm text-gray-600 mb-2">검색 결과</h4>
            <div className="text-2xl font-bold text-green-600">
              {stats.results}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm text-gray-600 mb-2">카테고리</h4>
            <div className="text-2xl font-bold text-purple-600">
              {stats.categories.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm text-gray-600 mb-2">활성 필터</h4>
            <div className="text-2xl font-bold text-orange-600">
              {Object.keys(filters).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 필터 패널 */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 필터</h3>
            
            {/* 활성 필터 */}
            {Object.keys(filters).length > 0 && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-600">활성 필터</h4>
                  <button
                    onClick={() => dispatch('clearFilters')}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    모두 제거
                  </button>
                </div>
                <div className="space-y-1">
                  {Object.entries(filters).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-2 bg-blue-50 rounded text-sm">
                      <span><strong>{key}</strong>: {value}</span>
                      <button
                        onClick={() => dispatch('removeFilter', { key })}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 카테고리 필터 */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">카테고리</h4>
              <div className="space-y-1">
                {stats.categories.map(category => (
                  <button
                    key={category}
                    onClick={() => dispatch('addFilter', { key: 'category', value: category })}
                    className="block w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            
            {/* 인기 태그 */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">인기 태그</h4>
              <div className="flex flex-wrap gap-1">
                {stats.tags.slice(0, 10).map(tag => (
                  <button
                    key={tag}
                    onClick={() => dispatch('addFilter', { key: 'tag', value: tag })}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 검색 결과 */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">📋 검색 결과</h3>
                <span className="text-sm text-gray-600">
                  {results.length}개 결과
                </span>
              </div>
              
              <div className="space-y-4">
                {results.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">
                    <div className="mb-4 text-4xl">🔍</div>
                    <div className="text-lg mb-2">검색 결과가 없습니다</div>
                    <div className="text-sm text-gray-500">
                      다른 키워드로 검색해보거나 필터를 조정해보세요
                    </div>
                  </div>
                ) : (
                  results.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => dispatch('selectResult', { id: item.id, item })}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedResult?.id === item.id 
                          ? 'border-blue-500 bg-blue-50 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-lg text-gray-900">
                          {item.title}
                        </h4>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {item.category}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                        <span>✍️ {item.author}</span>
                        <span>📅 {item.date}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 선택된 항목 상세 */}
      {selectedResult && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📖 선택된 항목</h3>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-xl font-bold text-gray-900">
                  {selectedResult.title}
                </h4>
                <button
                  onClick={() => selectedResultStore.setValue(null)}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">카테고리:</span>
                  <div className="mt-1">
                    <span className="px-3 py-1 bg-white rounded-full">
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
                  <div className="mt-1 text-gray-900">
                    {selectedResult.date}
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <span className="font-medium text-gray-600 block mb-2">태그:</span>
                <div className="flex flex-wrap gap-2">
                  {selectedResult.tags.map((tag: string) => (
                    <span key={tag} className="px-3 py-1 bg-white text-blue-700 rounded-full text-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 기술 구현 정보 */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🛠️ 기술 구현</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-green-600 mb-3">Store 기반 상태 관리</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• <strong>searchQueryStore</strong>: 검색어 상태</li>
                <li>• <strong>searchFiltersStore</strong>: 활성 필터 상태</li>
                <li>• <strong>searchResultsStore</strong>: 검색 결과 목록</li>
                <li>• <strong>selectedResultStore</strong>: 선택된 항목</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-blue-600 mb-3">Action Pipeline</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• <strong>performSearch</strong>: 검색 실행 및 필터링</li>
                <li>• <strong>updateQuery</strong>: 검색어 업데이트</li>
                <li>• <strong>addFilter/removeFilter</strong>: 필터 관리</li>
                <li>• <strong>selectResult</strong>: 결과 선택</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SearchPage;