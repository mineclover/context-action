/**
 * @fileoverview API Blocking Demo Page
 *
 * Context → Data/Action → Hook → View 계층 구조를 따르는 API 블로킹 데모 페이지
 */

import { PageWithLogMonitor } from '../../../components/LogMonitor';
import { ApiBlockingView } from './components/ApiBlockingView';
import { ApiBlockingProvider } from './context/ApiBlockingContext';

/**
 * API 블로킹 데모 페이지
 *
 * 중복 API 호출을 방지하는 블로킹 패턴을 보여주는 페이지입니다.
 */
export function ApiBlockingPage() {
  return (
    <PageWithLogMonitor
      pageId="action-guard-api-blocking"
      title="API Blocking Demo"
      initialConfig={{ enableToast: true, maxLogs: 50 }}
    >
      <ApiBlockingProvider>
        <div className="page-container">
          <ApiBlockingView />
        </div>
      </ApiBlockingProvider>
    </PageWithLogMonitor>
  );
}

export default ApiBlockingPage;
