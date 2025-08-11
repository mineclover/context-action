/**
 * @fileoverview Scroll Demo Page
 * 
 * Context → Data/Action → Hook → View 계층 구조를 따르는 스크롤 데모 페이지
 */

import { PageWithLogMonitor } from '../../../components/LogMonitor';
import { ScrollProvider } from './context/ScrollContext';
import { ScrollView } from './components/ScrollView';

/**
 * 스크롤 데모 페이지
 * 
 * 스로틀링을 활용한 스크롤 이벤트 최적화를 보여주는 페이지입니다.
 */
export function ScrollPage() {
  return (
    <PageWithLogMonitor
      pageId="action-guard-scroll"
      title="Scroll with Throttling Demo"
      initialConfig={{ enableToast: true, maxLogs: 100 }}
    >
      <ScrollProvider>
        <div className="page-container">
          <ScrollView />
        </div>
      </ScrollProvider>
    </PageWithLogMonitor>
  );
}

export default ScrollPage;