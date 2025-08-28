import { LogArtHelpers } from './utils/logger';
import { useEffect, Suspense, lazy } from 'react';
import {
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from 'react-router-dom';
// Core components - keep as regular imports
import Layout from './components/Layout';
import { ToastContainer, ToastControlPanel } from './components/ToastSystem';

// Lazy load large page components
const ConcurrentActionTestPage = lazy(() => import('./pages/examples/ConcurrentActionTestPage'));
const EnhancedAbortableSearchExample = lazy(() => import('./components/EnhancedAbortableSearchExample'));
const ActionGuardIndexPage = lazy(() => import('./pages/actionguard/ActionGuardIndexPage'));
const ActionGuardPage = lazy(() => import('./pages/actionguard/ActionGuardPage'));
const ApiBlockingPage = lazy(() => import('./pages/actionguard/ApiBlockingPage'));
const ContextStoreMouseEventsPage = lazy(() => import('./pages/actionguard/ContextStoreMouseEventsPage').then(m => ({ default: m.ContextStoreMouseEventsPage })));
const MouseEventsPage = lazy(() => import('./pages/actionguard/MouseEventsPage'));
const MouseEventsIndexPage = lazy(() => import('./pages/mouse-events/MouseEventsIndexPage').then(m => ({ default: m.MouseEventsIndexPage })));
const ContextStoreActionPage = lazy(() => import('./pages/mouse-events/ContextStoreActionPage').then(m => ({ default: m.ContextStoreActionPage })));
const EnhancedContextStorePage = lazy(() => import('./pages/mouse-events/EnhancedContextStorePage').then(m => ({ default: m.EnhancedContextStorePage })));
const PriorityPerformancePage = lazy(() => import('./pages/actionguard/priority-performance/PriorityPerformancePage').then(m => ({ default: m.PriorityPerformancePage })));
const ScrollPage = lazy(() => import('./pages/actionguard/ScrollPage'));
const SearchPage = lazy(() => import('./pages/actionguard/SearchPage'));
const ThrottleComparisonPage = lazy(() => import('./pages/actionguard/ThrottleComparisonPage'));
const CoreAdvancedPage = lazy(() => import('./pages/core/CoreAdvancedPage'));
const CoreBasicsPage = lazy(() => import('./pages/core/CoreBasicsPage'));
const ToastConfigPage = lazy(() => import('./pages/examples/ToastConfigPage'));
const ElementManagementPage = lazy(() => import('./pages/examples/ElementManagementPage').then(m => ({ default: m.ElementManagementPage })));
const FormBuilderDemoPage = lazy(() => import('./pages/examples/FormBuilderDemoPage').then(m => ({ default: m.FormBuilderDemoPage })));
const AdvancedCanvasExample = lazy(() => import('./pages/examples/AdvancedCanvasExample').then(m => ({ default: m.AdvancedCanvasExample })));
const RefsIndexPage = lazy(() => import('./pages/refs/RefsIndexPage').then(m => ({ default: m.RefsIndexPage })));
const FormBuilderRefDemoPage = lazy(() => import('./pages/refs/FormBuilderRefDemoPage').then(m => ({ default: m.FormBuilderRefDemoPage })));
const WaitForRefsPerformancePage = lazy(() => import('./pages/refs/WaitForRefsPerformancePage').then(m => ({ default: m.WaitForRefsPerformancePage })));
const DemosIndexPage = lazy(() => import('./pages/demos/DemosIndexPage').then(m => ({ default: m.DemosIndexPage })));
const StoreScenariosPage = lazy(() => import('./pages/demos/StoreScenariosPage').then(m => ({ default: m.StoreScenariosPage })));
const TodoListPage = lazy(() => import('./pages/demos/TodoListPage').then(m => ({ default: m.TodoListPage })));
const ShoppingCartPage = lazy(() => import('./pages/demos/ShoppingCartPage').then(m => ({ default: m.ShoppingCartPage })));
const ChatPage = lazy(() => import('./pages/demos/ChatPage').then(m => ({ default: m.ChatPage })));
const UserProfilePage = lazy(() => import('./pages/demos/UserProfilePage').then(m => ({ default: m.UserProfilePage })));
const ActionPriorityDemoPage = lazy(() => import('./pages/demos/ActionPriorityDemoPage').then(m => ({ default: m.ActionPriorityDemoPage })));
const ConditionalPatternsIndex = lazy(() => import('@/pages/conditional-patterns/ConditionalPatternsIndex').then(m => ({ default: m.ConditionalPatternsIndex })));
const PermissionBasedExecution = lazy(() => import('@/pages/conditional-patterns/PermissionBasedExecution').then(m => ({ default: m.PermissionBasedExecution })));
const FormValidation = lazy(() => import('@/pages/conditional-patterns/FormValidation').then(m => ({ default: m.FormValidation })));
const WorkflowSteps = lazy(() => import('@/pages/conditional-patterns/WorkflowSteps').then(m => ({ default: m.WorkflowSteps })));
const FeatureToggle = lazy(() => import('@/pages/conditional-patterns/FeatureToggle').then(m => ({ default: m.FeatureToggle })));
const AdvancedFilteringPage = lazy(() => import('./pages/actionguard/AdvancedFilteringPage'));
const ActionGuardOverview = lazy(() => import('./pages/ActionGuardOverview'));
const CoreConceptsOverview = lazy(() => import('./pages/CoreConceptsOverview'));
const ExamplesUtilitiesOverview = lazy(() => import('./pages/ExamplesUtilitiesOverview'));
const HomePage = lazy(() => import('./pages/HomePage'));
const FlowControlPlaygroundPage = lazy(() => import('./pages/pipeline/FlowControlPlaygroundPage').then(m => ({ default: m.FlowControlPlaygroundPage })));
const LoggerDemoPage = lazy(() => import('./pages/logger/LoggerDemoPage'));
const ReactContextPage = lazy(() => import('./pages/react/ReactContextPage'));
const ReactHooksPage = lazy(() => import('./pages/react/ReactHooksPage'));
const ReactProviderPage = lazy(() => import('./pages/react/ReactProviderPage'));
const UseActionWithResultPage = lazy(() => import('./pages/react/UseActionWithResultPage'));
const StoreBasicsPage = lazy(() => import('./pages/store/StoreBasicsPage'));
const StoreImmutabilityTestPage = lazy(() => import('./pages/store/StoreImmutabilityTestPage'));

// 라우트 변경 시 콘솔 클리어 (개발 환경에서만)
function ConsoleClearer() {
  const location = useLocation();

  useEffect(() => {
    // 개발 환경에서만 콘솔 클리어 (프로덕션이 아닌 경우)
    if (process.env.NODE_ENV !== 'production') {
      console.clear();
      console.info(LogArtHelpers.react.separator(`페이지 이동`));
      console.info(LogArtHelpers.react.info(`현재 경로: ${location.pathname}`));
      console.info(LogArtHelpers.react.separator());
    }
  }, [location.pathname]);

  return null;
}

function AppContent() {
  return (
    <>
      <ConsoleClearer />
      <Layout>
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading page...</div>
        </div>}>
          <Routes>
          <Route path="/" element={<HomePage />} />
          {/* Overview Pages */}
          <Route path="/overview/core" element={<CoreConceptsOverview />} />
          <Route path="/overview/actionguard" element={<ActionGuardOverview />} />
          <Route path="/overview/examples" element={<ExamplesUtilitiesOverview />} />
          <Route path="/core/basics" element={<CoreBasicsPage />} />
          <Route path="/core/advanced" element={<CoreAdvancedPage />} />
          <Route path="/store/basics" element={<StoreBasicsPage />} />
          <Route
            path="/store/immutability-test"
            element={<StoreImmutabilityTestPage />}
          />
          <Route path="/react/provider" element={<ReactProviderPage />} />
          <Route path="/react/context" element={<ReactContextPage />} />
          <Route path="/react/hooks" element={<ReactHooksPage />} />
          <Route
            path="/react/useActionWithResult"
            element={<UseActionWithResultPage />}
          />
          <Route path="/logger/demo" element={<LoggerDemoPage />} />
          <Route path="/actionguard" element={<ActionGuardIndexPage />} />
          <Route path="/action-guard" element={<ActionGuardPage />} />
          <Route path="/actionguard/search" element={<SearchPage />} />
          <Route path="/actionguard/scroll" element={<ScrollPage />} />
          <Route
            path="/actionguard/api-blocking"
            element={<ApiBlockingPage />}
          />
          <Route
            path="/actionguard/mouse-events"
            element={<MouseEventsIndexPage />}
          />
          <Route
            path="/actionguard/mouse-events/enhanced-context-store"
            element={<EnhancedContextStorePage />}
          />
          <Route
            path="/actionguard/mouse-events/context-store-action"
            element={<ContextStoreActionPage />}
          />
          <Route
            path="/actionguard/mouse-events/legacy"
            element={<MouseEventsPage />}
          />
          <Route
            path="/actionguard/mouse-events/context-store"
            element={<ContextStoreMouseEventsPage />}
          />
          {/* <Route path="/actionguard/test" element={<ActionGuardTestPage />} /> */}
          <Route
            path="/actionguard/priority-performance-advanced"
            element={<PriorityPerformancePage />}
          />
          <Route
            path="/actionguard/throttle-comparison"
            element={<ThrottleComparisonPage />}
          />
          <Route
            path="/examples/toast-config"
            element={<ToastConfigPage />}
          />
          <Route
            path="/examples/concurrent-actions"
            element={<ConcurrentActionTestPage />}
          />
          <Route
            path="/examples/enhanced-search"
            element={<EnhancedAbortableSearchExample />}
          />
          <Route
            path="/examples/element-management"
            element={<ElementManagementPage />}
          />
          <Route
            path="/examples/element-management/form-builder"
            element={<FormBuilderDemoPage />}
          />
          <Route
            path="/examples/element-management/canvas"
            element={<AdvancedCanvasExample />}
          />
          <Route path="/refs" element={<RefsIndexPage />} />
          <Route path="/refs/canvas" element={<AdvancedCanvasExample />} />
          <Route path="/refs/form-builder" element={<FormBuilderRefDemoPage />} />
          <Route path="/refs/waitforrefs-performance" element={<WaitForRefsPerformancePage />} />
          <Route path="/pipeline/flow-control" element={<FlowControlPlaygroundPage />} />
          <Route path="/demos" element={<DemosIndexPage />} />
          <Route path="/demos/store-scenarios" element={<StoreScenariosPage />} />
          <Route path="/demos/todo-list" element={<TodoListPage />} />
          <Route path="/demos/shopping-cart" element={<ShoppingCartPage />} />
          <Route path="/demos/chat" element={<ChatPage />} />
          <Route path="/demos/user-profile" element={<UserProfilePage />} />
          <Route path="/demos/action-priority" element={<ActionPriorityDemoPage />} />
          {/* Conditional Execution Routes */}
          <Route
            path="/actionguard/conditional"
            element={<ConditionalPatternsIndex />}
          />
          <Route
            path="/actionguard/conditional/permissions"
            element={<PermissionBasedExecution />}
          />
          <Route
            path="/actionguard/conditional/form-validation"
            element={<FormValidation />}
          />
          <Route
            path="/actionguard/conditional/workflow-steps"
            element={<WorkflowSteps />}
          />
          <Route
            path="/actionguard/conditional/feature-toggle"
            element={<FeatureToggle />}
          />
          <Route
            path="/actionguard/advanced-filtering"
            element={<AdvancedFilteringPage />}
          />
          </Routes>
        </Suspense>
      </Layout>

      {/* 글로벌 토스트 시스템 */}
      <ToastContainer />
      <ToastControlPanel />
    </>
  );
}

function App() {
  // 환경에 따라 basename 설정
  const basename = process.env.NODE_ENV === 'production' ? '/context-action/example' : '/';
  
  return (
    <Router basename={basename}>
      <AppContent />
    </Router>
  );
}

export default App;
