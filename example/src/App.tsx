import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CoreBasicsPage from './pages/core/CoreBasicsPage';
import StoreBasicsPage from './pages/store/StoreBasicsPage';
import ReactProviderPage from './pages/react/ReactProviderPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/core/basics" element={<CoreBasicsPage />} />
          <Route path="/store/basics" element={<StoreBasicsPage />} />
          <Route path="/react/provider" element={<ReactProviderPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;