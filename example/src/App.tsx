import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { LogArtHelpers } from '@context-action/logger';
import Layout from './components/Layout';
import { ToastContainer, ToastControlPanel } from './components/ToastSystem';
import HomePage from './pages/HomePage';
import CoreBasicsPage from './pages/core/CoreBasicsPage';
import CoreAdvancedPage from './pages/core/CoreAdvancedPage';
import StoreBasicsPage from './pages/store/StoreBasicsPage';
import StoreFullDemoPage from './pages/store/StoreFullDemoPage';
import ReactProviderPage from './pages/react/ReactProviderPage';
import ReactContextPage from './pages/react/ReactContextPage';
import ReactHooksPage from './pages/react/ReactHooksPage';
import LoggerDemoPage from './pages/logger/LoggerDemoPage';
import ActionGuardPage from './pages/actionguard/ActionGuardPage';
import ToastConfigExamplePage from './pages/examples/ToastConfigExamplePage';
import ComparisonDemoPage from './pages/comparison/ComparisonDemoPage';
import ThrottledComparisonPage from './pages/comparison/ThrottledComparisonPage';
import UnifiedPatternDemoPage from './pages/unified-pattern/UnifiedPatternDemoPage';
// HMR-related imports commented out due to production build (HMR functionality removed)
// import { HMRDemoPage } from './pages/hmr-demo';
// import { AutoHMRExample } from './pages/auto-hmr/AutoHMRExample';

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

function App() {
  return (
    <Router>
      <ConsoleClearer />
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/core/basics" element={<CoreBasicsPage />} />
          <Route path="/core/advanced" element={<CoreAdvancedPage />} />
          <Route path="/store/basics" element={<StoreBasicsPage />} />
          <Route path="/store/full-demo" element={<StoreFullDemoPage />} />
          <Route path="/react/provider" element={<ReactProviderPage />} />
          <Route path="/react/context" element={<ReactContextPage />} />
          <Route path="/react/hooks" element={<ReactHooksPage />} />
          <Route path="/logger/demo" element={<LoggerDemoPage />} />
          <Route path="/actionguard/demo" element={<ActionGuardPage />} />
          <Route path="/examples/toast-config" element={<ToastConfigExamplePage />} />
          <Route path="/comparison/demo" element={<ComparisonDemoPage />} />
          <Route path="/comparison/throttled" element={<ThrottledComparisonPage />} />
          <Route path="/unified-pattern/demo" element={<UnifiedPatternDemoPage />} />
          {/* HMR routes commented out due to production build */}
          {/* <Route path="/hmr/demo" element={<HMRDemoPage />} /> */}
          {/* <Route path="/hmr/auto" element={<AutoHMRExample />} /> */}
        </Routes>
      </Layout>
      
      {/* 글로벌 토스트 시스템 */}
      <ToastContainer />
      <ToastControlPanel />
    </Router>
  );
}

export default App;