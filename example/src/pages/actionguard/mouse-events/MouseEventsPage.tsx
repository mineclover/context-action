/**
 * @fileoverview Mouse Events Demo Page
 * 
 * Context → Data/Action → Hook → View 계층 구조를 따르는 마우스 이벤트 데모 페이지
 */

import { PageWithLogMonitor } from '../../../components/LogMonitor';
import { MouseEventsProvider } from './context/MouseEventsContext';
import { MouseEventsView } from './components/MouseEventsView';

/**
 * 마우스 이벤트 데모 페이지
 * 
 * 스로틀링을 활용한 마우스 이벤트 최적화를 보여주는 페이지입니다.
 */
export function MouseEventsPage() {
  return (
    <PageWithLogMonitor
      pageId="action-guard-mouse-events"
      title="Mouse Events Demo"
      initialConfig={{ enableToast: true, maxLogs: 100 }}
    >
      <MouseEventsProvider>
        <div className="page-container">
          <MouseEventsView />
        </div>
      </MouseEventsProvider>
    </PageWithLogMonitor>
  );
}

export default MouseEventsPage;