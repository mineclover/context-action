/**
 * @fileoverview Search Demo Page
 * 
 * Context → Data/Action → Hook → View 계층 구조를 따르는 검색 데모 페이지
 */

import React from 'react';
import { PageWithLogMonitor } from '../../../components/LogMonitor';
import { SearchProvider } from './context/SearchContext';
import { SearchView } from './components/SearchView';

/**
 * 검색 데모 페이지
 * 
 * 디바운싱을 활용한 검색 기능을 보여주는 페이지입니다.
 */
export function SearchPage() {
  return (
    <PageWithLogMonitor
      pageId="action-guard-search"
      title="Search with Debouncing"
      initialConfig={{ enableToast: true, maxLogs: 50 }}
    >
      <SearchProvider>
        <div className="page-container">
          <header className="page-header">
            <h1>Search with Debouncing</h1>
            <p className="page-description">
              Learn how to implement efficient search with debouncing to reduce 
              unnecessary API calls and improve user experience.
            </p>
          </header>
          
          <SearchView />
        </div>
      </SearchProvider>
    </PageWithLogMonitor>
  );
}

export default SearchPage;