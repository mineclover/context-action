/**
 * @fileoverview useRefMountState 전용 테스트 페이지
 */

import { UseRefMountStateDemo } from '../../../components/demos/ref-patterns/UseRefMountStateDemo';
import { PageWithLogMonitor } from '@/components/LogMonitor';

export function UseRefMountStateTestPage() {
  return (
    <PageWithLogMonitor
      pageId="use-ref-mount-state-test"
      title="useRefMountState Test Page"
      initialConfig={{ enableToast: true, maxLogs: 50 }}
    >
      <div className="page-container">
        <UseRefMountStateDemo />
      </div>
    </PageWithLogMonitor>
  );
}

export default UseRefMountStateTestPage;