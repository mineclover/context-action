/**
 * @fileoverview Non-Reactive Context Store Page
 *
 * Non-Reactive MVVM architecture with RefContext optimization:
 * - MouseEventsModelProvider: Model layer with declarative contexts
 * - NonReactiveView: View layer with direct DOM manipulation
 * - Zero React re-renders with RefContext pattern
 */

import React from 'react';
import { NonReactiveView } from './components/NonReactiveView';
import { MouseEventsModelProvider } from './context/MouseEventsModel';

/**
 * Non-Reactive Context Store 페이지
 *
 * Non-Reactive MVVM 아키텍처:
 * - Model: MouseEventsModel (Context declarations)
 * - ViewModel: Hooks (state injection, event handlers)
 * - View: RefContext 기반 직접 DOM 조작
 */
export function NonReactiveContextStorePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-cyan-50 to-indigo-50">
      {/* Non-Reactive Pattern Header */}
      <div className="p-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-green-200 shadow-lg mb-6">
          <h1 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-3">
            <span className="text-3xl">🚀</span>
            Non-Reactive Pattern - Enhanced Context Store
          </h1>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">
              🚀 Non-Reactive Pattern
            </h3>
            <ul className="space-y-1 text-green-700">
              <li>• Direct DOM manipulation with RefContext</li>
              <li>• Zero React re-renders guaranteed</li>
              <li>• Store.getValue() on-demand access</li>
              <li>• Pure performance optimization</li>
              <li>• Manual UI state synchronization</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Model Layer - Declarative Context Management */}
      <MouseEventsModelProvider>
        {/* View Layer - Non-Reactive Pattern */}
        <NonReactiveView />

        {/* Non-Reactive Context Store Architecture Documentation - 페이지 최하단 */}
        <div className="px-6 pb-6 mt-12">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 border border-green-200 shadow-lg">
            <h2 className="text-2xl font-bold text-green-800 mb-6 flex items-center gap-3">
              <span className="text-3xl">🚀</span>
              Non-Reactive Pattern Architecture
            </h2>

            {/* 아키텍처 구조 설명 - 1열 레이아웃 */}
            <div className="space-y-6">
              {/* Model Layer */}
              <div className="bg-white/70 rounded-xl border border-green-200 p-6">
                <h3 className="font-semibold text-green-800 mb-4 flex items-center gap-2 text-lg">
                  <span>🏪</span>
                  Model Layer: Store Context (Read-Only Access)
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono text-gray-800 mb-4 overflow-x-auto">
                  <pre>{`// Model Layer: 동일한 Store Context 사용 (Legacy와 동일)
export const MouseEventsModel = createStoreContext('MouseEvents', {
  activity: { isActive: false, statusText: 'Idle', statusColor: 'gray' },
  movement: { path: [], isMoving: false, velocity: 0 },
  clicks: { recent: [] },
  summary: { hasActivity: false }
});

// Non-Reactive 패턴: Store 구독 대신 getValue() 사용
const movementStore = useMouseEventsModel('movement');
const currentMovement = movementStore.getValue(); // 구독하지 않고 읽기만`}</pre>
                </div>
              </div>

              {/* RefContext Layer */}
              <div className="bg-white/70 rounded-xl border border-cyan-200 p-6">
                <h3 className="font-semibold text-cyan-800 mb-4 flex items-center gap-2 text-lg">
                  <span>⚡</span>
                  RefContext Layer: Direct DOM Manipulation
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono text-gray-800 mb-4 overflow-x-auto">
                  <pre>{`// RefContext 기반 DOM 직접 조작
const CanvasRefs = createRefContext('MouseCanvas', {
  container: { name: 'container', objectType: 'dom' },
  cursor: { name: 'cursor', objectType: 'dom' },
  pathSvg: { name: 'pathSvg', objectType: 'dom' },
  coordinates: { name: 'coordinates', objectType: 'dom' }
});

const useNonReactiveCanvasControl = () => {
  const cursorRef = CanvasRefs.useRefHandler('cursor');
  const pathSvgRef = CanvasRefs.useRefHandler('pathSvg');
  
  return {
    updateCursor: (x: number, y: number) => {
      // 직접 DOM 조작 - React 리렌더링 없음
      cursorRef.withTarget(el => {
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.opacity = '1';
      });
    },
    
    updatePath: (pathData: string) => {
      pathSvgRef.withTarget(el => {
        el.setAttribute('d', pathData); // SVG path 직접 업데이트
      });
    }
  };
};`}</pre>
                </div>
              </div>

              {/* ViewModel Layer */}
              <div className="bg-white/70 rounded-xl border border-indigo-200 p-6">
                <h3 className="font-semibold text-indigo-800 mb-4 flex items-center gap-2 text-lg">
                  <span>🔄</span>
                  ViewModel Layer: Hybrid Logic
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono text-gray-800 mb-4 overflow-x-auto">
                  <pre>{`// ViewModel: Store 업데이트 + RefContext 조작 결합
export const useNonReactiveMouseEventsLogic = () => {
  const { updateCursor, updatePath } = useNonReactiveCanvasControl();
  const activityStore = useMouseEventsModel('activity');
  const movementStore = useMouseEventsModel('movement');
  
  const handleMove = useCallback((payload: MouseMovePayload) => {
    // 1. 중요한 상태만 Store 업데이트 (클릭 마커용)
    const currentActivity = activityStore.getValue();
    if (!currentActivity.isActive) {
      activityStore.setValue({ ...currentActivity, isActive: true });
    }
    
    // 2. 시각적 요소는 RefContext로 직접 처리
    updateCursor(payload.x, payload.y);
    
    // 3. Path 데이터는 직접 SVG 업데이트
    const pathData = generateSmoothPath(payload.path);
    updatePath(pathData);
  }, [updateCursor, updatePath]);
  
  return { handleMove, handleClick };
};`}</pre>
                </div>
              </div>

              {/* Performance Comparison */}
              <div className="bg-white/70 rounded-xl border border-purple-200 p-6">
                <h3 className="font-semibold text-purple-800 mb-4 flex items-center gap-2 text-lg">
                  <span>📊</span>
                  Performance Comparison: Reactive vs Non-Reactive
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-700 mb-3">
                      🔔 Reactive Pattern
                    </h4>
                    <ul className="space-y-2 text-sm text-purple-600">
                      <li>
                        • <strong>렌더링:</strong> 상태 변경 시 React 리렌더링
                      </li>
                      <li>
                        • <strong>구독:</strong> useStoreValue()로 Store 구독
                      </li>
                      <li>
                        • <strong>업데이트:</strong> useEffect를 통한 DOM
                        업데이트
                      </li>
                      <li>
                        • <strong>메모리:</strong> React 렌더링 큐에 작업 누적
                      </li>
                      <li>
                        • <strong>복잡도:</strong> 단순하고 예측 가능
                      </li>
                    </ul>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-cyan-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-700 mb-3">
                      🚀 Non-Reactive Pattern
                    </h4>
                    <ul className="space-y-2 text-sm text-green-600">
                      <li>
                        • <strong>렌더링:</strong> Zero React 리렌더링 보장
                      </li>
                      <li>
                        • <strong>접근:</strong> getValue()로 필요시에만 접근
                      </li>
                      <li>
                        • <strong>업데이트:</strong> RefContext 직접 DOM 조작
                      </li>
                      <li>
                        • <strong>메모리:</strong> 최소한의 메모리 사용
                      </li>
                      <li>
                        • <strong>복잡도:</strong> 수동 상태 동기화 필요
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Use Cases */}
              <div className="bg-white/70 rounded-xl border border-indigo-200 p-6">
                <h3 className="font-semibold text-indigo-800 mb-4 flex items-center gap-2 text-lg">
                  <span>🎯</span>
                  Non-Reactive Pattern 적용 시나리오
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-green-700 mb-3">
                      ✅ 적합한 경우
                    </h4>
                    <ul className="space-y-2 text-sm text-green-600">
                      <li>
                        • <strong>고빈도 업데이트:</strong> 마우스 이동,
                        애니메이션
                      </li>
                      <li>
                        • <strong>성능 중심:</strong> 60fps 유지가 중요한 경우
                      </li>
                      <li>
                        • <strong>Canvas/SVG:</strong> 직접적인 그래픽 조작
                      </li>
                      <li>
                        • <strong>실시간 데이터:</strong> 스트리밍 데이터 시각화
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-700 mb-3">
                      ⚠️ 주의사항
                    </h4>
                    <ul className="space-y-2 text-sm text-red-600">
                      <li>
                        • <strong>복잡성 증가:</strong> 수동 상태 동기화 필요
                      </li>
                      <li>
                        • <strong>디버깅 어려움:</strong> React DevTools 추적
                        불가
                      </li>
                      <li>
                        • <strong>일관성 관리:</strong> Store와 DOM 상태 불일치
                        위험
                      </li>
                      <li>
                        • <strong>학습 비용:</strong> RefContext 패턴 이해 필요
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

export default NonReactiveContextStorePage;
