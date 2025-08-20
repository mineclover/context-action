import { LogArtHelpers } from './utils/logger';
import { useEffect } from 'react';
import {
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from 'react-router-dom';
import ConcurrentActionTestPage from './components/ConcurrentActionTestPage';
import EnhancedAbortableSearchExample from './components/EnhancedAbortableSearchExample';
import Layout from './components/Layout';
import { ToastContainer, ToastControlPanel } from './components/ToastSystem';
import ActionGuardIndexPage from './pages/actionguard/ActionGuardIndexPage';
import ApiBlockingPage from './pages/actionguard/ApiBlockingPage';
// import ActionGuardTestPage from './pages/actionguard/dispatch-options-test/DispatchOptionsTestPage';
import { ContextStoreMouseEventsPage } from './pages/actionguard/ContextStoreMouseEventsPage';
import MouseEventsPage from './pages/actionguard/MouseEventsPage';
import { OptimizedMouseEventsPage } from './pages/mouse-events/OptimizedMouseEventsPage';
import { MouseEventsIndexPage } from './pages/mouse-events/MouseEventsIndexPage';
import { CleanArchitecturePage } from './pages/mouse-events/CleanArchitecturePage';
import { ContextStoreActionPage } from './pages/mouse-events/ContextStoreActionPage';
import { EnhancedContextStorePage } from './pages/mouse-events/EnhancedContextStorePage';
import PriorityPerformancePage from './pages/actionguard/PriorityPerformancePage';
import { PriorityPerformancePage as NewPriorityPerformancePage } from './pages/actionguard/priority-performance/PriorityPerformancePage';
import ScrollPage from './pages/actionguard/ScrollPage';
import SearchPage from './pages/actionguard/SearchPage';
import ThrottleComparisonPage from './pages/actionguard/ThrottleComparisonPage';
import CoreAdvancedPage from './pages/core/CoreAdvancedPage';
import CoreBasicsPage from './pages/core/CoreBasicsPage';
import CoreFeaturesPage from './pages/core/CoreFeatures';
import ToastConfigPage from './pages/examples/ToastConfigPage';
import { ElementManagementPage } from './pages/examples/ElementManagementPage';
import { FormBuilderDemoPage } from './pages/examples/FormBuilderDemoPage';
import { CanvasDemoPage } from './pages/examples/CanvasDemoPage';
import { RefsIndexPage } from './pages/refs/RefsIndexPage';
import { CanvasRefDemoPage } from './pages/refs/CanvasRefDemoPage';
import { FormBuilderRefDemoPage } from './pages/refs/FormBuilderRefDemoPage';
import { DemosIndexPage } from './pages/demos/DemosIndexPage';
import { StoreScenariosPage } from './pages/demos/StoreScenariosPage';
import { TodoListPage } from './pages/demos/TodoListPage';
import { ShoppingCartPage } from './pages/demos/ShoppingCartPage';
import { ChatPage } from './pages/demos/ChatPage';
import { UserProfilePage } from './pages/demos/UserProfilePage';
import { RefContextMouseEventsPage } from './pages/mouse-events/ref-context/RefContextMouseEventsPage';
import HomePage from './pages/HomePage';
import LoggerDemoPage from './pages/logger/LoggerDemoPage';
import ReactContextPage from './pages/react/ReactContextPage';
import ReactHooksPage from './pages/react/ReactHooksPage';
import ReactProviderPage from './pages/react/ReactProviderPage';
import UseActionWithResultPage from './pages/react/UseActionWithResultPage';
import StoreBasicsPage from './pages/store/StoreBasicsPage';
import StoreImmutabilityTestPage from './pages/store/StoreImmutabilityTestPage';
import UnifiedPatternPage from './pages/react/UnifiedPatternPage';

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
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/core/basics" element={<CoreBasicsPage />} />
          <Route path="/core/advanced" element={<CoreAdvancedPage />} />
          <Route path="/core/features" element={<CoreFeaturesPage />} />
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
            path="/actionguard/mouse-events/optimized"
            element={<OptimizedMouseEventsPage />}
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
            path="/actionguard/mouse-events/clean-architecture"
            element={<CleanArchitecturePage />}
          />
          <Route
            path="/actionguard/mouse-events/legacy"
            element={<MouseEventsPage />}
          />
          <Route
            path="/actionguard/mouse-events/context-store"
            element={<ContextStoreMouseEventsPage />}
          />
          <Route
            path="/actionguard/mouse-events/ref-context"
            element={<RefContextMouseEventsPage />}
          />
          {/* <Route path="/actionguard/test" element={<ActionGuardTestPage />} /> */}
          <Route
            path="/actionguard/priority-performance"
            element={<PriorityPerformancePage />}
          />
          <Route
            path="/actionguard/priority-performance-advanced"
            element={<NewPriorityPerformancePage />}
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
            element={<CanvasDemoPage />}
          />
          <Route path="/refs" element={<RefsIndexPage />} />
          <Route path="/refs/canvas" element={<CanvasRefDemoPage />} />
          <Route path="/refs/form-builder" element={<FormBuilderRefDemoPage />} />
          <Route path="/demos" element={<DemosIndexPage />} />
          <Route path="/demos/store-scenarios" element={<StoreScenariosPage />} />
          <Route path="/demos/todo-list" element={<TodoListPage />} />
          <Route path="/demos/shopping-cart" element={<ShoppingCartPage />} />
          <Route path="/demos/chat" element={<ChatPage />} />
          <Route path="/demos/user-profile" element={<UserProfilePage />} />
          <Route
            path="/unified-pattern/demo"
            element={<UnifiedPatternPage />}
          />
        </Routes>
      </Layout>

      {/* 글로벌 토스트 시스템 */}
      <ToastContainer />
      <ToastControlPanel />
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
