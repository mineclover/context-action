/**
 * @fileoverview Search Context - Data/Action Layer
 *
 * Context → Data/Action 계층을 정의합니다.
 * 타입은 Data/Action 레이어에 선언됩니다.
 */

import type { ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createDeclarativeStorePattern,
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

// 새로운 패턴으로 변경 - 자동 타입 추론
const SearchStores = createDeclarativeStorePattern('SearchStoreManager', {
  searchState: {
    initialValue: {
      searchTerm: '',
      searchResults: [] as string[],
      searchCount: 0,
      isSearching: false,
      lastSearchTime: null as number | null,
    },
    description: 'Search state management',
    strategy: 'shallow',
  },
});

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

// Store Context는 이미 SearchStores로 생성됨

// Providers
export const SearchActionProvider: React.FC<{ children: React.ReactNode }> =
  SearchActionContext.Provider;
export const SearchStoreProvider: React.FC<{ children: React.ReactNode }> =
  SearchStores.Provider;

// Hooks export
export const useSearchActionDispatch = SearchActionContext.useActionDispatch;
export const useSearchActionHandler = SearchActionContext.useActionHandler;
export const useSearchStore = SearchStores.useStore;

// Legacy exports (deprecated)
export const useSearchActionRegister = SearchActionContext.useActionRegister;

// ================================
// 🚀 고급 HOC 패턴들 - Enhanced Features
// ================================

/**
 * ActionProvider와 StoreProvider를 결합하는 커스텀 래퍼
 */
const SearchProviderWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  console.log('🔄 SearchProviderWrapper render at', new Date().toISOString());
  return <SearchActionProvider>{children}</SearchActionProvider>;
};

/**
 * 독립적인 Search 인스턴스는 registryId로 구분
 * 예: <SearchProvider registryId="instance-1"> 형태로 사용
 */

/**
 * HOC - Component를 SearchStores.Provider로 래핑
 */
export const withSearchStore = SearchStores.withProvider;

/**
 * 통합 Provider - Enhanced with new capabilities
 *
 * Store와 Action Context를 함께 제공합니다.
 */
export const SearchProvider: React.FC<{
  children: React.ReactNode;
  registryId?: string; // 새로운 기능: 독립적인 레지스트리 ID
}> = ({ children, registryId }) => {
  console.log(
    '🔄 SearchProvider render at',
    new Date().toISOString(),
    'registryId:',
    registryId
  );

  return (
    <SearchStores.Provider registryId={registryId}>
      <SearchActionProvider>{children}</SearchActionProvider>
    </SearchStores.Provider>
  );
};

// Enhanced hooks
export const useSearchStoreInfo = SearchStores.useStoreInfo;
export const useSearchStoreClear = SearchStores.useStoreClear;
