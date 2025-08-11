/**
 * @fileoverview Mouse Events Demo Page
 * 
 * Context → Data/Action → Hook → View 계층 구조를 따르는 마우스 이벤트 데모 페이지
 */

import React from 'react';
import { PageWithLogMonitor } from '../../../components/LogMonitor';
import { MouseEventsProvider } from './context/MouseEventsContext';
import { MouseEventsView } from './components/MouseEventsView';

/**
 * 마우스 이벤트 데모 페이지
 * 
 * 스로틀링을 활용한 마우스 이벤트 최적화를 보여주는 페이지입니다.
 */
export function MouseEventsPage() {
  return (
    <PageWithLogMonitor
      pageId="action-guard-mouse-events"
      title="Mouse Events Optimization"
      initialConfig={{ enableToast: true, maxLogs: 100 }}
    >
      <MouseEventsProvider>
        <div className="page-container">
          <header className="page-header">
            <h1>Mouse Events with Throttling</h1>
            <p className="page-description">
              Learn how to optimize mouse move events with throttling to 
              create smooth interactions without performance issues.
            </p>
          </header>
          
          <MouseEventsView />
        </div>
      </MouseEventsProvider>
    </PageWithLogMonitor>
  );
}

export default MouseEventsPage;