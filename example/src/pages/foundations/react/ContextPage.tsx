import { PageWithLogMonitor } from '@/components/LogMonitor';

// ==============================================
// MVVM ARCHITECTURE - Context Page
// ==============================================

// 🗄️ Model Layer - Store Contexts
import { 
  ParentModelProvider, 
  ParentActionProvider 
} from './contexts/ParentContext';
import { 
  ChildAModelProvider, 
  ChildAActionProvider 
} from './contexts/ChildAContext';
import { 
  ChildBModelProvider, 
  ChildBActionProvider 
} from './contexts/ChildBContext';

// ⚙️ ViewModel Layer - Action Handlers
import { 
  useParentCounterActions, 
  useParentControlActions, 
  useParentDataActions 
} from './actions/useParentActions';
import { 
  useChildACounterActions, 
  useChildARemoteControlActions 
} from './actions/useChildAActions';
import { useChildBTextActions } from './actions/useChildBActions';

// 🖼️ View Layer - Components
import { ParentView } from './views/ParentView';
import { ChildAView } from './views/ChildAView';
import { ChildBView } from './views/ChildBView';

// ==============================================
// MVVM HANDLERS SETUP
// ==============================================

/**
 * MVVM 핸들러 설정 컴포넌트
 * 모든 액션 핸들러들을 등록하는 역할
 */
function MVVMHandlers() {
  // Parent 도메인 핸들러들
  useParentCounterActions();
  useParentControlActions();
  useParentDataActions();
  
  // ChildA 도메인 핸들러들
  useChildACounterActions();
  useChildARemoteControlActions();
  
  // ChildB 도메인 핸들러들
  useChildBTextActions();
  
  return null;
}

// ==============================================
// MAIN CONTEXT PAGE
// ==============================================

/**
 * MVVM 아키텍처 기반 Context 페이지
 * 
 * 🏗️ Architecture Layers:
 * - 🗄️ Model Layer: Store contexts (데이터 관리)
 * - ⚙️ ViewModel Layer: Action handlers (비즈니스 로직)
 * - 🖼️ View Layer: React components (UI 표현)
 */
export default function ReactContextPage() {
  return (
    <PageWithLogMonitor pageId="react-context">
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏗️ MVVM Architecture
          </h1>
          <p className="text-gray-600">
            Context-Action 프레임워크의 MVVM 아키텍처 패턴
          </p>
        </div>

        {/* 🗄️ Model Layer + ⚙️ ViewModel Layer + 🖼️ View Layer */}
        <ParentModelProvider>
          <ParentActionProvider>
            <ChildAModelProvider>
              <ChildAActionProvider>
                <ChildBModelProvider>
                  <ChildBActionProvider>
                    
                    {/* 핸들러 설정 */}
                    <MVVMHandlers />
                    
                    {/* View Layer */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2">
                        <ParentView />
                      </div>
                      <div className="space-y-6">
                        <ChildAView />
                        <ChildBView />
                      </div>
                    </div>
                    
                  </ChildBActionProvider>
                </ChildBModelProvider>
              </ChildAActionProvider>
            </ChildAModelProvider>
          </ParentActionProvider>
        </ParentModelProvider>
      </div>
    </PageWithLogMonitor>
  );
}
