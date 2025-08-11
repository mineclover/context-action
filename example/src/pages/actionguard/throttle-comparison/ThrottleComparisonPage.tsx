/**
 * @fileoverview Throttle Comparison Demo Page
 * 
 * Context → Data/Action → Hook → View 계층 구조를 따르는 스로틀 비교 데모 페이지
 */


import { PageWithLogMonitor } from '../../../components/LogMonitor';
import { ThrottleComparisonProvider } from './context/ThrottleComparisonContext';
import { ThrottleComparisonView } from './components/ThrottleComparisonView';

/**
 * 스로틀 비교 데모 페이지
 * 
 * 수동 useThrottle vs 내장 throttle 기능을 비교합니다.
 */
export function ThrottleComparisonPage() {
  return (
    <PageWithLogMonitor
      pageId="throttle-comparison"
      title="Throttle Implementation Comparison"
      initialConfig={{ enableToast: true, maxLogs: 150 }}
    >
      <ThrottleComparisonProvider>
        <ThrottleComparisonView />
      </ThrottleComparisonProvider>
    </PageWithLogMonitor>
  );
}

export default ThrottleComparisonPage;