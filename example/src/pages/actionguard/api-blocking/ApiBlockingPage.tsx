/**
 * @fileoverview API Blocking Demo Page
 * 
 * Context → Data/Action → Hook → View 계층 구조를 따르는 API 블로킹 데모 페이지
 */

import React from 'react';
import { PageWithLogMonitor } from '../../../components/LogMonitor';
import { ApiBlockingProvider } from './context/ApiBlockingContext';
import { ApiBlockingView } from './components/ApiBlockingView';

/**
 * API 블로킹 데모 페이지
 * 
 * 중복 API 호출을 방지하는 블로킹 패턴을 보여주는 페이지입니다.
 */
export function ApiBlockingPage() {
  return (
    <PageWithLogMonitor
      pageId="action-guard-api-blocking"
      title="API Call Blocking"
      initialConfig={{ enableToast: true, maxLogs: 50 }}
    >
      <ApiBlockingProvider>
        <div className="page-container">
          <header className="page-header">
            <h1>API Call Blocking</h1>
            <p className="page-description">
              Learn how to prevent duplicate API calls using blocking patterns 
              to improve performance and user experience.
            </p>
          </header>
          
          <ApiBlockingView />
        </div>
      </ApiBlockingProvider>
    </PageWithLogMonitor>
  );
}

export default ApiBlockingPage;