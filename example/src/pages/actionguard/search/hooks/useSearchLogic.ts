/**
 * @fileoverview Search Logic Hook - Hook Layer
 * 
 * Data/Action과 View 사이의 브리지 역할을 하는 Hook입니다.
 * 양방향 데이터 흐름을 관리합니다.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useStoreValue } from '@context-action/react';
import { useActionLoggerWithToast } from '../../../../components/LogMonitor';
import {
  useSearchActionDispatch,
  useSearchActionRegister,
  useSearchStore,
  type SearchStateData,
} from '../context/SearchContext';

/**
 * 디바운스 훅
 */
function useDebounce<T extends any[]>(
  callback: (...args: T) => void,
  delay: number
) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: T) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}

/**
 * 검색 로직 Hook
 * 
 * View Layer에 필요한 데이터와 액션을 제공합니다.
 */
export function useSearchLogic() {
  const dispatch = useSearchActionDispatch();
  const register = useSearchActionRegister();
  const searchStore = useSearchStore('searchState');
  const searchState = useStoreValue(searchStore);
  const { logAction } = useActionLoggerWithToast();

  // 실제 검색 수행 함수
  const performSearch = useCallback(
    (term: string) => {
      // 빈 검색어는 처리하지 않음
      if (!term.trim()) {
        searchStore.update((state) => ({
          ...state,
          searchResults: [],
          isSearching: false,
        }));
        return;
      }

      // 검색 시작
      searchStore.update((state) => ({
        ...state,
        isSearching: true,
      }));

      // 모의 검색 결과 생성
      setTimeout(() => {
        const mockResults = [
          `Result 1 for "${term}"`,
          `Result 2 for "${term}"`,
          `Result 3 for "${term}"`,
          `Related: ${term} documentation`,
          `Tutorial: Getting started with ${term}`,
        ];

        dispatch('updateResults', {
          results: mockResults,
          searchTime: Date.now(),
        });
      }, 300); // 실제 API 호출 시뮬레이션
    },
    [dispatch, searchStore]
  );

  // 디바운스된 검색 함수
  const debouncedSearch = useDebounce(performSearch, 500);

  // 액션 핸들러 등록
  useEffect(() => {
    if (!register) return;

    // 검색 입력 핸들러
    const unregisterInput = register.register(
      'searchInput',
      (term, controller) => {
        logAction('searchInput', { term, debounced: true });
        
        // Store 업데이트
        searchStore.update((state) => ({
          ...state,
          searchTerm: term,
        }));
        
        // 디바운스된 검색 실행
        debouncedSearch(term);
        
        controller.next();
      }
    );

    // 검색 수행 핸들러
    const unregisterPerform = register.register(
      'performSearch',
      ({ term, timestamp }, controller) => {
        logAction('performSearch', { term, timestamp });
        performSearch(term);
        controller.next();
      }
    );

    // 결과 업데이트 핸들러
    const unregisterUpdate = register.register(
      'updateResults',
      ({ results, searchTime }, controller) => {
        logAction('updateResults', { resultCount: results.length, searchTime });
        
        searchStore.update((state) => ({
          ...state,
          searchResults: results,
          searchCount: state.searchCount + 1,
          isSearching: false,
          lastSearchTime: searchTime,
        }));
        
        controller.next();
      }
    );

    // 검색 초기화 핸들러
    const unregisterClear = register.register(
      'clearSearch',
      (_, controller) => {
        logAction('clearSearch', {});
        
        searchStore.setValue({
          searchTerm: '',
          searchResults: [],
          searchCount: 0,
          isSearching: false,
          lastSearchTime: null,
        });
        
        controller.next();
      }
    );

    return () => {
      unregisterInput();
      unregisterPerform();
      unregisterUpdate();
      unregisterClear();
    };
  }, [register, searchStore, debouncedSearch, performSearch, logAction]);

  // View에 제공할 인터페이스
  return {
    // Data
    searchState,
    
    // Actions
    handleSearchChange: (value: string) => {
      dispatch('searchInput', value);
    },
    
    clearSearch: () => {
      dispatch('clearSearch');
    },
    
    // Computed
    hasResults: searchState.searchResults.length > 0,
    isFirstSearch: searchState.searchCount === 0,
  };
}