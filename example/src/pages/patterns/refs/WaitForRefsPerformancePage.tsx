/**
 * RefContext 패턴 데모 페이지
 */
// TODO: WaitForRefsPatternDemo component needs to be restored or created
// import { WaitForRefsPatternDemo } from '../../components/demos/WaitForRefsPatternDemo';
import { PageWithLogMonitor } from '@/components/LogMonitor';
import { Card, CardContent, Badge } from '@/components/ui';

export function WaitForRefsPerformancePage() {
  return (
    <PageWithLogMonitor
      pageId="wait-for-refs-performance"
      title="Wait For Refs Performance Demo"
      initialConfig={{ enableToast: true, maxLogs: 100 }}
    >
      <div className="page-container">
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 mb-4">
                Demo Coming Soon
              </Badge>
              <p className="text-gray-500">
                Wait For Refs Performance demo will be available after component restoration
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWithLogMonitor>
  );
}

export default WaitForRefsPerformancePage;