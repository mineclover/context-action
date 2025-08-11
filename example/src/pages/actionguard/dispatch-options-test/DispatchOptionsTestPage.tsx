/**
 * @fileoverview Dispatch Options Test Demo Page
 * 
 * Context → Data/Action → Hook → View 계층 구조를 따르는 디스패치 옵션 테스트 페이지
 */


import { PageWithLogMonitor } from '../../../components/LogMonitor';
import { DispatchOptionsTestProvider } from './context/DispatchOptionsTestContext';
import { DispatchOptionsTestView } from './components/DispatchOptionsTestView';

/**
 * 디스패치 옵션 테스트 페이지
 * 
 * throttle, debounce, priority 등 다양한 dispatch 옵션을 테스트합니다.
 */
export function DispatchOptionsTestPage() {
  return (
    <PageWithLogMonitor
      pageId="dispatch-options-test"
      title="Dispatch Options Comprehensive Test"
      initialConfig={{ enableToast: true, maxLogs: 200 }}
    >
      <DispatchOptionsTestProvider>
        <DispatchOptionsTestView />
      </DispatchOptionsTestProvider>
    </PageWithLogMonitor>
  );
}

export default DispatchOptionsTestPage;