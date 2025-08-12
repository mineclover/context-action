/**
 * @fileoverview Mouse Events Demo Page
 * 
 * Context → Data/Action → Hook → View 계층 구조를 따르는 마우스 이벤트 데모 페이지
 */

import { useState } from 'react';
import { PageWithLogMonitor } from '../../../components/LogMonitor';
import { MouseEventsProvider } from './context/MouseEventsContext';
import { MouseEventsView } from './components/MouseEventsView';
import { OptimizedMouseEventsView } from './components/OptimizedMouseEventsView';

/**
 * 마우스 이벤트 데모 페이지
 * 
 * 스로틀링을 활용한 마우스 이벤트 최적화를 보여주는 페이지입니다.
 */
export function MouseEventsPage() {
  const [viewMode, setViewMode] = useState<'traditional' | 'optimized'>('optimized');

  return (
    <PageWithLogMonitor
      pageId="action-guard-mouse-events"
      title="Mouse Events Demo"
      initialConfig={{ enableToast: true, maxLogs: 100 }}
    >
      <MouseEventsProvider>
        <div className="page-container">
          {/* 뷰 모드 선택 탭 */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg max-w-md">
            <button
              onClick={() => setViewMode('optimized')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                viewMode === 'optimized'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🚀 Isolated Renderer
            </button>
            <button
              onClick={() => setViewMode('traditional')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                viewMode === 'traditional'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📱 Traditional React
            </button>
          </div>

          {/* 선택된 뷰 렌더링 */}
          {viewMode === 'optimized' ? (
            <OptimizedMouseEventsView />
          ) : (
            <MouseEventsView />
          )}
        </div>
      </MouseEventsProvider>
    </PageWithLogMonitor>
  );
}

export default MouseEventsPage;