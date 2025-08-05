import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { LogArtHelpers } from '@context-action/logger';
import Layout from './components/Layout';
import { ToastContainer, ToastControlPanel } from './components/ToastSystem';
import HomePage from './pages/HomePage';
import CoreBasicsPage from './pages/core/CoreBasicsPage';
import CoreAdvancedPage from './pages/core/CoreAdvancedPage';
import CoreFeaturesPage from './pages/core/CoreFeatures';
import StoreBasicsPage from './pages/store/StoreBasicsPage';
import StoreFullDemoPage from './pages/store/StoreFullDemoPage';
import ReactProviderPage from './pages/react/ReactProviderPage';
import ReactContextPage from './pages/react/ReactContextPage';
import ReactHooksPage from './pages/react/ReactHooksPage';
import UseActionWithResultPage from './pages/react/UseActionWithResultPage';
import LoggerDemoPage from './pages/logger/LoggerDemoPage';
import ActionGuardPage from './pages/actionguard/ActionGuardPage';
import ActionGuardTestPage from './pages/actionguard/ActionGuardTestPage';
import ToastConfigExamplePage from './pages/examples/ToastConfigExamplePage';
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

function App() {
  return (
    <Router>
      <ConsoleClearer />
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/core/basics" element={<CoreBasicsPage />} />
          <Route path="/core/advanced" element={<CoreAdvancedPage />} />
          <Route path="/core/features" element={<CoreFeaturesPage />} />
          <Route path="/store/basics" element={<StoreBasicsPage />} />
          <Route path="/store/full-demo" element={<StoreFullDemoPage />} />
          <Route path="/react/provider" element={<ReactProviderPage />} />
          <Route path="/react/context" element={<ReactContextPage />} />
          <Route path="/react/hooks" element={<ReactHooksPage />} />
          <Route path="/react/useActionWithResult" element={<UseActionWithResultPage />} />
          <Route path="/logger/demo" element={<LoggerDemoPage />} />
          <Route path="/actionguard/demo" element={<ActionGuardPage />} />
          <Route path="/actionguard/test" element={<ActionGuardTestPage />} />
          <Route path="/examples/toast-config" element={<ToastConfigExamplePage />} />
          <Route path="/unified-pattern/demo" element={<UnifiedPatternDemoPage />} />
        </Routes>
      </Layout>
      
      {/* 글로벌 토스트 시스템 */}
      <ToastContainer />
      <ToastControlPanel />
    </Router>
  );
}

export default App;