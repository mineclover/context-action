/**
 * @fileoverview Search Demo Page
 * 
 * Context → Data/Action → Hook → View 계층 구조를 따르는 검색 데모 페이지
 */

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
      title="Search with Debouncing Demo"
      initialConfig={{ enableToast: true, maxLogs: 50 }}
    >
      <SearchProvider>
        <div className="page-container">
          <SearchView />
        </div>
      </SearchProvider>
    </PageWithLogMonitor>
  );
}

export default SearchPage;