import { LogArtHelpers } from '@context-action/logger';
import { useEffect } from 'react';
import {
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from 'react-router-dom';
import ConcurrentActionTestPageWithProvider from './components/ConcurrentActionTestPage';
import EnhancedAbortableSearchExampleWithProvider from './components/EnhancedAbortableSearchExample';
import Layout from './components/Layout';
import { ToastContainer, ToastControlPanel } from './components/ToastSystem';
import ActionGuardIndexPage from './pages/actionguard/ActionGuardIndexPage';
import SearchPage from './pages/actionguard/search/SearchPage';
import ScrollPage from './pages/actionguard/scroll/ScrollPage';
import ApiBlockingPage from './pages/actionguard/api-blocking/ApiBlockingPage';
import MouseEventsPage from './pages/actionguard/mouse-events/MouseEventsPage';
import ActionGuardTestPage from './pages/actionguard/dispatch-options-test/DispatchOptionsTestPage';
import PriorityPerformancePage from './pages/actionguard/priority-performance/PriorityPerformancePage';
import ThrottleComparisonPage from './pages/actionguard/throttle-comparison/ThrottleComparisonPage';
import CoreAdvancedPage from './pages/core/CoreAdvancedPage';
import CoreBasicsPage from './pages/core/CoreBasicsPage';
import CoreFeaturesPage from './pages/core/CoreFeatures';
import ToastConfigExamplePage from './pages/examples/ToastConfigExamplePage';
import HomePage from './pages/HomePage';
import LoggerDemoPage from './pages/logger/LoggerDemoPage';
import ReactContextPage from './pages/react/ReactContextPage';
import ReactHooksPage from './pages/react/ReactHooksPage';
import ReactProviderPage from './pages/react/ReactProviderPage';
import UseActionWithResultPage from './pages/react/UseActionWithResultPage';
import StoreBasicsPage from './pages/store/StoreBasicsPage';
import StoreFullDemoPage from './pages/store/StoreFullDemoPage';
import StoreImmutabilityTestPage from './pages/store/StoreImmutabilityTestPage';
import UnifiedPatternDemoPage from './pages/unified-pattern/UnifiedPatternDemoPage';

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
          <Route path="/store/full-demo" element={<StoreFullDemoPage />} />
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
          <Route path="/actionguard/api-blocking" element={<ApiBlockingPage />} />
          <Route path="/actionguard/mouse-events" element={<MouseEventsPage />} />
          <Route path="/actionguard/test" element={<ActionGuardTestPage />} />
          <Route
            path="/actionguard/priority-performance"
            element={<PriorityPerformancePage />}
          />
          <Route
            path="/actionguard/throttle-comparison"
            element={<ThrottleComparisonPage />}
          />
          <Route
            path="/examples/toast-config"
            element={<ToastConfigExamplePage />}
          />
          <Route
            path="/examples/concurrent-actions"
            element={<ConcurrentActionTestPageWithProvider />}
          />
          <Route
            path="/examples/enhanced-search"
            element={<EnhancedAbortableSearchExampleWithProvider />}
          />
          <Route
            path="/unified-pattern/demo"
            element={<UnifiedPatternDemoPage />}
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
