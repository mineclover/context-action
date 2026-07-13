import { PageWithLogMonitor } from '@/components/LogMonitor';

// ==============================================
// CONTEXT-LAYERED ARCHITECTURE - Context Page
// ==============================================

import {
  ChildAActionProvider,
  ChildAModelProvider,
} from './contexts/ChildAContext';
import {
  ChildBActionProvider,
  ChildBModelProvider,
} from './contexts/ChildBContext';
// 🗄️ Context Layer - Store & Action Contexts
import {
  ParentActionProvider,
  ParentModelProvider,
} from './contexts/ParentContext';
import { FoundationHandlerRegistry } from './handlers/FoundationHandlerRegistry';
import { ChildAView } from './views/ChildAView';
import { ChildBView } from './views/ChildBView';
// 🖼️ View Layer - Pure UI Components
import { ParentView } from './views/ParentView';

// ==============================================
// MAIN CONTEXT PAGE
// ==============================================

/**
 * Context-Layered 아키텍처 기반 Context 페이지
 *
 * 🏗️ Context-Layered Architecture:
 * - 🗄️ Context Layer: Store & Action contexts (컨텍스트 정의)
 * - ⚙️ Handler Layer: Props-based handlers (비즈니스 로직)
 * - 🚀 Action Layer: Pure dispatch functions (액션 디스패치)
 * - 🔗 Hook Layer: Store subscriptions (데이터 구독)
 * - 🖼️ View Layer: React components (UI 표현)
 */
export default function ReactContextPage({
  moduleId = 'context-layered-demo',
}: {
  moduleId?: string;
}) {
  return (
    <PageWithLogMonitor pageId="react-context">
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏗️ Context-Layered Architecture
          </h1>
          <p className="text-gray-600">
            Context-Action 프레임워크의 Context-Layered 아키텍처 패턴
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Props 기반 의존성 주입 + 중앙화된 Handler Registry
          </p>
        </div>

        {/* 🗄️ Context Layer + ⚙️ Handler Layer + 🖼️ View Layer */}
        <ParentActionProvider>
          <ParentModelProvider>
            <ChildAActionProvider>
              <ChildAModelProvider>
                <ChildBActionProvider>
                  <ChildBModelProvider>
                    <FoundationHandlerRegistry moduleId={moduleId}>
                      {/* View Layer - Pure UI Components */}
                      <div className="space-y-6">
                        <ParentView />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <ChildAView />
                          <ChildBView />
                        </div>
                      </div>
                    </FoundationHandlerRegistry>
                  </ChildBModelProvider>
                </ChildBActionProvider>
              </ChildAModelProvider>
            </ChildAActionProvider>
          </ParentModelProvider>
        </ParentActionProvider>
      </div>
    </PageWithLogMonitor>
  );
}
