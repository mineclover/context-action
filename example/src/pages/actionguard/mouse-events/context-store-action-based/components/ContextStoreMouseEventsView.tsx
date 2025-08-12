/**
 * @fileoverview Context Store Mouse Events View - Context Store 패턴 뷰 컴포넌트
 * 
 * Context Store를 구독하여 마우스 이벤트 상태를 표시하는 View 컴포넌트
 */

import { memo, useMemo, useRef } from 'react';
import { useStoreValue } from '@context-action/react';
import { DemoCard, Button, CodeBlock, CodeExample } from '../../../../../components/ui';
import { useMouseStore, initialMouseState } from '../stores/MouseStoreSchema';
import type { MouseStateData } from '../stores/MouseStoreSchema';

// ================================
// 📊 Props 인터페이스
// ================================

export interface ContextStoreMouseEventsViewProps {
  onReset: () => void;
}

// ================================
// 🎯 최적화된 구독 훅들
// ================================

/**
 * 상태 패널용 최적화된 구독 (필요한 값만)
 */
function useStatusPanelData() {
  const mouseStateStore = useMouseStore('mouseState', initialMouseState);
  const mouseState = useStoreValue(mouseStateStore);
  
  return useMemo(() => ({
    currentPosition: mouseState.mousePosition,
    isInsideArea: mouseState.isInsideArea,
    moveCount: mouseState.moveCount,
    clickCount: mouseState.clickCount,
    velocity: mouseState.velocity,
    activityStatus: mouseState.activityStatus,
  }), [
    mouseState.mousePosition, 
    mouseState.isInsideArea, 
    mouseState.moveCount, 
    mouseState.clickCount, 
    mouseState.velocity, 
    mouseState.activityStatus
  ]);
}

/**
 * 통계 패널용 최적화된 구독 (계산된 값만)
 */
function useStatisticsPanelData() {
  const mouseStateStore = useMouseStore('mouseState', initialMouseState);
  const mouseState = useStoreValue(mouseStateStore);
  
  return useMemo(() => ({
    validPathLength: mouseState.validPath.length,
    recentClickCount: mouseState.recentClickCount,
    averageVelocity: mouseState.averageVelocity,
    totalEvents: mouseState.totalEvents,
  }), [
    mouseState.validPath.length, 
    mouseState.recentClickCount, 
    mouseState.averageVelocity, 
    mouseState.totalEvents
  ]);
}

// ================================
// 🎨 UI 컴포넌트들
// ================================

/**
 * 상태 정보 패널 - Context Store 구독
 */
const StatusPanel = memo(() => {
  const statusData = useStatusPanelData();

  // 렌더링 로그
  console.log('🎨 Context StatusPanel render with optimized data:', {
    position: statusData.currentPosition,
    moveCount: statusData.moveCount,
    clickCount: statusData.clickCount,
    activityStatus: statusData.activityStatus
  });

  return (
    <div className="absolute top-3 left-3 bg-white bg-opacity-95 p-3 rounded-lg shadow-sm border min-w-[200px] z-10">
      <div className="text-sm space-y-1">
        <div className="flex justify-between gap-3">
          <span className="text-gray-600">Position:</span>
          <span className="font-mono text-blue-600">
            ({statusData.currentPosition.x}, {statusData.currentPosition.y})
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-gray-600">Moves:</span>
          <span className="font-mono text-green-600">{statusData.moveCount}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-gray-600">Clicks:</span>
          <span className="font-mono text-purple-600">{statusData.clickCount}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-gray-600">Velocity:</span>
          <span className="font-mono text-red-600">
            {statusData.velocity.toFixed(2)} px/ms
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-gray-600">Status:</span>
          <span className={`font-mono ${
            statusData.activityStatus === 'moving' ? 'text-blue-600' : 
            statusData.activityStatus === 'clicking' ? 'text-purple-600' : 'text-gray-400'
          }`}>
            {statusData.activityStatus === 'moving' ? '🔄 Moving' : 
             statusData.activityStatus === 'clicking' ? '👆 Clicking' : '⏸️ Idle'}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-gray-600">Inside:</span>
          <span className={`font-mono ${
            statusData.isInsideArea ? 'text-green-600' : 'text-orange-600'
          }`}>
            {statusData.isInsideArea ? '✓ Yes' : '✗ No'}
          </span>
        </div>
        <div className="flex justify-between gap-3 text-xs text-gray-500 border-t pt-1">
          <span>Architecture:</span>
          <span className="text-green-600">Context Store</span>
        </div>
      </div>
    </div>
  );
});

/**
 * 통계 패널 - Context Store 계산된 값들 표시
 */
const StatisticsPanel = memo(() => {
  const statsData = useStatisticsPanelData();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="text-center">
        <div className="text-xl font-bold text-blue-600">
          {statsData.validPathLength}
        </div>
        <div className="text-xs text-gray-600">Valid Points</div>
      </div>
      <div className="text-center">
        <div className="text-xl font-bold text-green-600">
          {statsData.averageVelocity.toFixed(1)}
        </div>
        <div className="text-xs text-gray-600">Avg Velocity</div>
      </div>
      <div className="text-center">
        <div className="text-xl font-bold text-purple-600">
          {statsData.recentClickCount}
        </div>
        <div className="text-xs text-gray-600">Recent Clicks</div>
      </div>
      <div className="text-center">
        <div className="text-xl font-bold text-orange-600">
          {statsData.totalEvents}
        </div>
        <div className="text-xs text-gray-600">Total Events</div>
      </div>
    </div>
  );
});

/**
 * 성능 메트릭 패널 - Context Store 메트릭 표시
 */
const PerformancePanel = memo(() => {
  const mouseStateStore = useMouseStore('mouseState', initialMouseState);
  const mouseState = useStoreValue(mouseStateStore);
  
  // 렌더링 횟수 추적
  const renderCountRef = useRef(0);
  renderCountRef.current++;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-green-50 rounded-lg">
      <div className="text-center">
        <div className="text-xl font-bold text-green-600">1</div>
        <div className="text-xs text-gray-600">Unified Store</div>
      </div>
      <div className="text-center">
        <div className="text-xl font-bold text-blue-600">{renderCountRef.current}</div>
        <div className="text-xs text-gray-600">Render Count</div>
      </div>
      <div className="text-center">
        <div className="text-xl font-bold text-purple-600">
          {Object.keys(mouseState).filter(key => 
            ['validPath', 'recentClickCount', 'averageVelocity', 'activityStatus', 'totalEvents', 'hasActivity'].includes(key)
          ).length}
        </div>
        <div className="text-xs text-gray-600">Computed Values</div>
      </div>
      <div className="text-center">
        <div className="text-xl font-bold text-orange-600">2</div>
        <div className="text-xs text-gray-600">Context Layers</div>
      </div>
    </div>
  );
});

// ================================
// 🖥️ 메인 컴포넌트
// ================================

/**
 * Context Store 기반 마우스 이벤트 View 컴포넌트
 */
const ContextStoreMouseEventsViewComponent = ({ onReset }: ContextStoreMouseEventsViewProps) => {
  console.log('🏪 ContextStoreMouseEventsView render at', new Date().toISOString());
  
  // Context Store 구독
  const mouseStateStore = useMouseStore('mouseState', initialMouseState);
  const mouseState = useStoreValue(mouseStateStore);

  // 메모화된 값들
  const hasActivity = mouseState.hasActivity;
  const lastActivity = useMemo(() => {
    return mouseState.lastMoveTime ? new Date(mouseState.lastMoveTime).toLocaleTimeString() : null;
  }, [mouseState.lastMoveTime]);

  return (
    <div className="space-y-6">
      {/* 메인 마우스 이벤트 UI */}
      <DemoCard>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            🏪 Context Store Mouse Events
          </h3>
          <p className="text-sm text-gray-600">
            This demo showcases <strong>Context Store Pattern</strong> with action-based state management. 
            Uses a unified store with <strong>action handlers</strong> and automatic computed values 
            for optimal performance and maintainability with the @context-action framework.
          </p>
        </div>
        
        <div className="space-y-4">
          {/* 마우스 추적 영역 - DOM은 Context Store Container가 관리 */}
          <div
            id="context-store-mouse-area"
            className="relative h-[400px] border-2 border-green-300 rounded-lg bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 overflow-hidden cursor-crosshair"
            style={{
              containIntrinsicSize: '100% 400px',
              willChange: 'auto'
            }}
          >
            {/* 상태 정보 패널 - Context Store 구독 */}
            <StatusPanel />

            {/* 활동 가이드 */}
            {!hasActivity && (
              <div className="absolute inset-0 flex items-center justify-center z-5 pointer-events-none">
                <div className="text-center text-gray-500">
                  <div className="text-lg mb-2">🏪</div>
                  <div className="text-sm">
                    Move your mouse to see Context Store in action
                  </div>
                  <div className="text-xs mt-1 opacity-75">
                    Action Dispatch → Store Update → UI Reactivity
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 컨트롤 */}
          <div className="flex justify-between items-center">
            <Button
              onClick={onReset}
              variant="secondary"
              size="sm"
              disabled={!hasActivity}
            >
              Reset Context Store
            </Button>
            
            {lastActivity && (
              <span className="text-xs text-gray-500">
                Last activity: {lastActivity}
              </span>
            )}
          </div>

          {/* 통계 패널 - 계산된 값들 */}
          <StatisticsPanel />

          {/* 성능 메트릭 패널 */}
          <PerformancePanel />
        </div>
      </DemoCard>

      {/* Architecture Comparison */}
      <DemoCard variant="info">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🏗️ vs 🏪 Architecture Comparison
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="border-r md:pr-6">
            <h4 className="font-semibold text-blue-600 mb-3">🏗️ Clean Architecture</h4>
            <ul className="space-y-2 text-gray-700">
              <li><strong>Data:</strong> Single service class</li>
              <li><strong>State:</strong> Centralized state management</li>
              <li><strong>Rendering:</strong> DOM direct manipulation</li>
              <li><strong>Updates:</strong> Imperative DOM updates</li>
              <li><strong>Coupling:</strong> Service → Render tight coupling</li>
              <li><strong>Performance:</strong> 60fps via DOM optimization</li>
              <li><strong>Debugging:</strong> Service method tracing</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-green-600 mb-3">🏪 Context Store</h4>
            <ul className="space-y-2 text-gray-700">
              <li><strong>Data:</strong> Unified store with actions</li>
              <li><strong>State:</strong> Action-based state management</li>
              <li><strong>Rendering:</strong> React declarative updates</li>
              <li><strong>Updates:</strong> Action dispatch → Store updates</li>
              <li><strong>Coupling:</strong> Loose action-store coupling</li>
              <li><strong>Performance:</strong> Computed values + memoization</li>
              <li><strong>Debugging:</strong> Action flow tracing</li>
            </ul>
          </div>
        </div>
      </DemoCard>

      {/* Context Store 설명 */}
      <DemoCard variant="info">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🏪 Context Store Architecture Details
        </h3>
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong className="text-gray-900">Action-Based State Management:</strong>
            <br />
            This implementation uses the @context-action framework's Context Store pattern 
            with action handlers. All state changes go through typed actions, providing 
            predictable state transitions and excellent debugging capabilities.
          </p>
          <p>
            <strong className="text-gray-900">Key Features:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Unified Store:</strong> Single store with all mouse state</li>
            <li><strong>Action Handlers:</strong> Typed action handlers for state transitions</li>
            <li><strong>Computed Values:</strong> Automatic derivation of complex state</li>
            <li><strong>Context Isolation:</strong> Provider-based component isolation</li>
            <li><strong>Type Safety:</strong> Full TypeScript support throughout</li>
          </ul>
          <p>
            <strong className="text-gray-900">Benefits:</strong>
            <br />
            Better integration with @context-action framework, predictable state management, 
            excellent debugging through action flow tracing, and automatic computed value management.
          </p>
        </div>
      </DemoCard>

      {/* 코드 예제 */}
      <CodeExample title="Context Store Pattern">
        <CodeBlock>
          {`// Context Store with Action Handlers
interface MouseStateData {
  mousePosition: MousePosition;
  moveCount: number;
  clickCount: number;
  isMoving: boolean;
  
  // Computed values (auto-updated)
  validPath: MousePosition[];
  recentClickCount: number;
  averageVelocity: number;
  activityStatus: 'idle' | 'moving' | 'clicking';
  totalEvents: number;
  hasActivity: boolean;
}

// Action Types
interface MouseActions {
  mouseMove: { position: MousePosition; timestamp: number };
  mouseClick: { position: MousePosition; button: number; timestamp: number };
  mouseEnter: { position: MousePosition; timestamp: number };
  reset: void;
}

// Action Handlers
const mouseActionHandlers: ActionHandlerMap<MouseActions, MouseStores> = {
  mouseMove: (payload, { getStore }) => {
    const mouseStateStore = getStore('mouseState');
    const currentState = mouseStateStore.getValue();
    
    // Business logic with computed values
    const newState = {
      ...currentState,
      mousePosition: payload.position,
      moveCount: currentState.moveCount + 1,
      // Auto-computed values
      validPath: computeValidPath(newMovePath),
      averageVelocity: computeAverageVelocity(validPath),
      activityStatus: computeActivityStatus(...)
    };
    
    mouseStateStore.setValue(newState);
  },
  
  reset: (payload, { getStore }) => {
    const mouseStateStore = getStore('mouseState');
    mouseStateStore.setValue(initialState);
  }
};

// Usage in Components
function MouseComponent() {
  const mouseStateStore = useMouseStore('mouseState', initialMouseState);
  const mouseState = useStoreValue(mouseStateStore);
  const dispatch = useMouseActionDispatch();
  
  const handleMouseMove = (position: MousePosition) => {
    dispatch('mouseMove', { position, timestamp: Date.now() });
  };
  
  return (
    <div>
      <span>Position: ({mouseState.mousePosition.x}, {mouseState.mousePosition.y})</span>
      <span>Status: {mouseState.activityStatus}</span>
      <span>Path Points: {mouseState.validPath.length}</span>
    </div>
  );
}`}
        </CodeBlock>
      </CodeExample>
    </div>
  );
};

// 메인 컴포넌트 메모화
export const ContextStoreMouseEventsView = memo(ContextStoreMouseEventsViewComponent);