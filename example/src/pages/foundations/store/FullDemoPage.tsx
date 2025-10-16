import { useEffect, useState } from 'react';
import { PageWithLogMonitor } from '@/components/LogMonitor';
import { Badge, Button, Card, CardContent } from '@/components/ui';

/**
 * 모듈화된 Store 시스템 데모 페이지
 * 8개의 실제 시나리오를 통해 Declarative Store 패턴의 활용을 보여주는 종합 데모
 *
 * @implements store-integration-pattern
 * @implements action-pipeline-system
 * @memberof core-concepts
 * @example
 * ```tsx
 * <FullDemoPage />
 * ```
 */
export function FullDemoPage() {
  const [_activeDemo, _setActiveDemo] = useState<string>('');

  useEffect(() => {
    // Store actions 등록
    console.log('FullDemoPage: Store actions registered');
  }, []);

  const demos = [
    {
      id: 'chat',
      title: '💬 Chat Demo',
      description: '실시간 메시징과 사용자 관리',
      status: 'disabled',
      reason: 'store-scenarios 폴더가 제거됨',
    },
    {
      id: 'todo',
      title: '✅ Todo List Demo',
      description: 'CRUD 작업과 필터링, 정렬',
      status: 'disabled',
      reason: 'store-scenarios 폴더가 제거됨',
    },
    {
      id: 'shopping',
      title: '🛒 Shopping Cart Demo',
      description: '복잡한 계산과 실시간 가격',
      status: 'disabled',
      reason: 'store-scenarios 폴더가 제거됨',
    },
    {
      id: 'profile',
      title: '👤 User Profile Demo',
      description: '폼 처리와 검증 패턴',
      status: 'disabled',
      reason: 'store-scenarios 폴더가 제거됨',
    },
  ];

  return (
    <PageWithLogMonitor pageId="full-demo" title="Full Demo Page">
      <div className="max-w-6xl mx-auto p-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-8 rounded-xl mb-8 border border-purple-200">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🏪 Full Demo Page
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              모듈화된 Store 시스템 데모 - store-scenarios 폴더가 제거되어 현재
              사용할 수 없습니다.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                ⚠️ store-scenarios 폴더가 제거되어 데모들이 현재 사용할 수
                없습니다. 독립적인 컴포넌트로 재구현이 필요합니다.
              </p>
            </div>
          </div>
        </div>

        {/* Demo Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {demos.map((demo) => (
            <Card key={demo.id} className="relative">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {demo.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{demo.description}</p>
                  </div>
                  <Badge variant="outline">{demo.status}</Badge>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600">{demo.reason}</p>
                </div>

                <Button variant="outline" disabled className="w-full">
                  데모 실행 (사용 불가)
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageWithLogMonitor>
  );
}
