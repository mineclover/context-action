/**
 * @fileoverview Search Context - Data/Action Layer
 * 
 * Context → Data/Action 계층을 정의합니다.
 * 타입은 Data/Action 레이어에 선언됩니다.
 */

import type { ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createDeclarativeStores,
  type StoreSchema,
} from '@context-action/react';
import type React from 'react';

// ================================
// 📊 Data Layer - 타입 및 스토어 정의
// ================================

/**
 * 검색 상태 데이터
 */
export interface SearchStateData {
  /** 현재 검색어 */
  searchTerm: string;
  /** 검색 결과 목록 */
  searchResults: string[];
  /** 총 검색 실행 횟수 */
  searchCount: number;
  /** 검색 중 여부 */
  isSearching: boolean;
  /** 마지막 검색 시간 */
  lastSearchTime: number | null;
}

/**
 * 검색 스토어 스키마
 */
interface SearchStores {
  searchState: SearchStateData;
}

const searchStoreSchema: StoreSchema<SearchStores> = {
  searchState: {
    initialValue: {
      searchTerm: '',
      searchResults: [],
      searchCount: 0,
      isSearching: false,
      lastSearchTime: null,
    },
    description: 'Search state management',
    tags: ['search', 'ui'],
  },
};

// ================================
// ⚡ Action Layer - 액션 정의
// ================================

/**
 * 검색 관련 액션들
 */
export interface SearchActions extends ActionPayloadMap {
  /** 검색 입력 액션 (디바운싱 적용) */
  searchInput: string;
  
  /** 실제 검색 수행 액션 */
  performSearch: {
    term: string;
    timestamp: number;
  };
  
  /** 검색 결과 업데이트 액션 */
  updateResults: {
    results: string[];
    searchTime: number;
  };
  
  /** 검색 초기화 액션 */
  clearSearch: void;
}

// ================================
// 🏗️ Context 생성 및 Provider
// ================================

// Action Context 생성
export const SearchActionContext = createActionContext<SearchActions>({
  name: 'SearchActions',
});

// Store Context 생성
const SearchStoreContext = createDeclarativeStores(
  'SearchStoreManager',
  searchStoreSchema
);

// Providers
export const SearchActionProvider: React.FC<{ children: React.ReactNode }> = SearchActionContext.Provider;
export const SearchStoreProvider: React.FC<{ children: React.ReactNode; registryId?: string }> = SearchStoreContext.Provider;

// Hooks export
export const useSearchActionDispatch = SearchActionContext.useActionDispatch;
export const useSearchActionHandler = SearchActionContext.useActionHandler;
export const useSearchStore = SearchStoreContext.useStore;
export const useSearchStores = SearchStoreContext.useStores;

// Legacy exports (deprecated)
export const useSearchActionRegister = SearchActionContext.useActionRegister;
export const useSearchRegistry = SearchStoreContext.useRegistry;

/**
 * 통합 Provider
 * 
 * Store와 Action Context를 함께 제공합니다.
 */
export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SearchStoreProvider registryId="search-page">
      <SearchActionProvider>
        {children}
      </SearchActionProvider>
    </SearchStoreProvider>
  );
};