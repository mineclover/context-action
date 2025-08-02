import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <Router>
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
        </Routes>
      </Layout>
      
      {/* 글로벌 토스트 시스템 */}
      <ToastContainer />
      <ToastControlPanel />
    </Router>
  );
}

export default App;