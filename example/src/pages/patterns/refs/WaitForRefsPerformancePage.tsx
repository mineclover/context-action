/**
 * RefContext 패턴 데모 페이지
 */
import { WaitForRefsPatternDemo } from '../../../components/demos/WaitForRefsPatternDemo';
import { PageWithLogMonitor } from '@/components/LogMonitor';

export function WaitForRefsPerformancePage() {
  return (
    <PageWithLogMonitor
      pageId="wait-for-refs-performance"
      title="Wait For Refs Performance Demo"
      initialConfig={{ enableToast: true, maxLogs: 100 }}
    >
      <div className="page-container">
        <WaitForRefsPatternDemo />
      </div>
    </PageWithLogMonitor>
  );
}

export default WaitForRefsPerformancePage;