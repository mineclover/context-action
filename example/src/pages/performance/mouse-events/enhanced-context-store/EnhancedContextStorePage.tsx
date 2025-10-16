/**
 * @fileoverview Enhanced Context Store Page - Reactive Pattern
 *
 * Reactive MVVM architecture with Store subscriptions:
 * - MouseEventsModelProvider: Model layer with declarative contexts
 * - EnhancedContextStoreView: View layer with useStoreValue subscriptions
 * - Traditional React rendering with Store-based state management
 */

import React from 'react';
import { EnhancedContextStoreView } from './components/EnhancedContextStoreView';
import { MouseEventsModelProvider } from './context/MouseEventsModel';

/**
 * Enhanced Context Store - Reactive Pattern 페이지
 *
 * Reactive MVVM 아키텍처:
 * - Model: MouseEventsModel (Context declarations)
 * - ViewModel: Hooks (state injection, event handlers)
 * - View: useStoreValue 구독 기반 React 렌더링
 */
export function EnhancedContextStorePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50">
      {/* Reactive Pattern Header */}
      <div className="p-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-purple-200 shadow-lg mb-6">
          <h1 className="text-2xl font-bold text-purple-800 mb-4 flex items-center gap-3">
            <span className="text-3xl">🔔</span>
            Reactive Pattern - Enhanced Context Store
          </h1>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-800 mb-2">
              🔔 Reactive Pattern
            </h3>
            <ul className="space-y-1 text-purple-700">
              <li>• Store subscriptions with useStoreValue()</li>
              <li>• React re-renders on state changes</li>
              <li>• Traditional reactive architecture</li>
              <li>• Canvas updates via useEffect</li>
              <li>• Full React lifecycle integration</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Model Layer - Declarative Context Management */}
      <MouseEventsModelProvider>
        {/* View Layer - Reactive Pattern */}
        <EnhancedContextStoreView />

        {/* Enhanced Context Store Architecture Documentation - 페이지 최하단 */}
        <div className="px-6 pb-6 mt-12">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 border border-purple-200 shadow-lg">
            <h2 className="text-2xl font-bold text-purple-800 mb-6 flex items-center gap-3">
              <span className="text-3xl">🔔</span>
              Reactive Pattern Architecture
            </h2>

            {/* 아키텍처 구조 설명 - 1열 레이아웃 */}
            <div className="space-y-6">
              {/* Model Layer */}
              <div className="bg-white/70 rounded-xl border border-purple-200 p-6">
                <h3 className="font-semibold text-purple-800 mb-4 flex items-center gap-2 text-lg">
                  <span>🏪</span>
                  Model Layer: Declarative Store Context
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono text-gray-800 mb-4 overflow-x-auto">
                  <pre>{`// Model Layer: 도메인별 Store Context 선언
export const MouseEventsModel = createStoreContext('MouseEvents', {
  activity: {
    isActive: false,
    statusText: 'Idle',
    statusColor: 'gray'
  },
  movement: {
    path: [] as Array<{ x: number; y: number; timestamp: number }>,
    isMoving: false,
    velocity: 0
  },
  clicks: {
    recent: [] as Array<{ x: number; y: number; timestamp: number }>
  },
  summary: {
    hasActivity: false
  }
});`}</pre>
                </div>
              </div>

              {/* ViewModel Layer */}
              <div className="bg-white/70 rounded-xl border border-pink-200 p-6">
                <h3 className="font-semibold text-pink-800 mb-4 flex items-center gap-2 text-lg">
                  <span>🔄</span>
                  ViewModel Layer: Hooks-based Business Logic
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono text-gray-800 mb-4 overflow-x-auto">
                  <pre>{`// ViewModel Layer: 비즈니스 로직과 상태 관리 분리
export const useMouseEventsLogic = () => {
  const activityStore = useMouseEventsModel('activity');
  const movementStore = useMouseEventsModel('movement');
  const clicksStore = useMouseEventsModel('clicks');
  
  const handleMove = useCallback((payload: MouseMovePayload) => {
    // Store 기반 상태 업데이트 (3-step pattern)
    const currentActivity = activityStore.getValue();
    const newActivity = { ...currentActivity, isActive: true };
    activityStore.setValue(newActivity);
  }, []);
  
  return { handleMove, handleClick, handleEnter, handleLeave };
};`}</pre>
                </div>
              </div>

              {/* View Layer */}
              <div className="bg-white/70 rounded-xl border border-cyan-200 p-6">
                <h3 className="font-semibold text-cyan-800 mb-4 flex items-center gap-2 text-lg">
                  <span>🎨</span>
                  View Layer: Pure Presentation Components
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono text-gray-800 mb-4 overflow-x-auto">
                  <pre>{`// View Layer: Props 기반 순수 컴포넌트
export function MouseEventsCanvas({
  onMouseMove,     // ViewModel에서 주입받은 이벤트 핸들러
  onMouseClick,
  activity,        // Model에서 주입받은 상태
  movement,
  clicks,
  // DOM 참조 설정 함수들 (RefContext)
  setContainerRef,
  setCursorRef,
  setPathSvgRef
}: MouseEventsCanvasProps) {
  // 순수 렌더링 로직만 포함, 상태 관리 없음
  return <div>...</div>;
}`}</pre>
                </div>
              </div>

              {/* Performance Optimization */}
              <div className="bg-white/70 rounded-xl border border-indigo-200 p-6">
                <h3 className="font-semibold text-indigo-800 mb-4 flex items-center gap-2 text-lg">
                  <span>⚡</span>
                  Performance Optimization Strategies
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono text-gray-800 mb-4 overflow-x-auto">
                  <pre>{`// Reactive Pattern: Store 구독 + React 리렌더링
const useReactiveCanvasControl = () => {
  const movement = useStoreValue(movementStore);
  
  useEffect(() => {
    updateCanvas(movement); // React 리렌더링 트리거
  }, [movement]);
};

// Non-Reactive Pattern: RefContext 직접 DOM 조작 (Zero React 렌더링)
const useNonReactiveCanvasControl = () => {
  const cursorRef = useRefHandler('cursor');
  const pathSvgRef = useRefHandler('pathSvg');
  const movementStore = useMouseEventsModel('movement');
  
  return {
    updateCursor: (x: number, y: number) => {
      // Store 읽기만 하고 구독하지 않음 (getValue)
      cursorRef.withTarget(el => {
        el.style.left = x + 'px'; // 직접 DOM 조작
        el.style.top = y + 'px';
      });
    }
  };
};`}</pre>
                </div>
              </div>

              {/* Architecture Comparison */}
              <div className="bg-white/70 rounded-xl border border-pink-200 p-6">
                <h3 className="font-semibold text-pink-800 mb-4 flex items-center gap-2 text-lg">
                  <span>🎯</span>
                  Enhanced vs Legacy 아키텍처 비교
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-700 mb-3">
                      🏪 Enhanced Context Store
                    </h4>
                    <ul className="space-y-2 text-sm text-purple-600">
                      <li>
                        • <strong>MVVM 분리:</strong> Model-ViewModel-View
                        계층화
                      </li>
                      <li>
                        • <strong>Store Context:</strong> 도메인별 상태 분산
                        관리
                      </li>
                      <li>
                        • <strong>Hooks ViewModel:</strong> 재사용 가능한
                        비즈니스 로직
                      </li>
                      <li>
                        • <strong>Pure Components:</strong> Props 기반 순수
                        렌더링
                      </li>
                      <li>
                        • <strong>RefContext 최적화:</strong> 선택적 DOM 조작
                      </li>
                    </ul>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-700 mb-3">
                      🏛️ Legacy Pattern
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>
                        • <strong>단일 계층:</strong> Action Context만 사용
                      </li>
                      <li>
                        • <strong>Component State:</strong> useState 중심 상태
                      </li>
                      <li>
                        • <strong>Inline Logic:</strong> 컴포넌트 내 비즈니스
                        로직
                      </li>
                      <li>
                        • <strong>Mixed Responsibility:</strong> 상태와 렌더링
                        혼재
                      </li>
                      <li>
                        • <strong>Full Rendering:</strong> 모든 변경 시 리렌더링
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MouseEventsModelProvider>
    </div>
  );
}

export default EnhancedContextStorePage;
