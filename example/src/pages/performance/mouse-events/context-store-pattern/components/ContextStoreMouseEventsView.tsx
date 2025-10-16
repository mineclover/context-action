/**
 * @fileoverview Context Store Mouse Events View - Context Store 기반 뷰 컴포넌트
 *
 * MouseEventsContext를 사용한 Context Store Pattern 기반 View 컴포넌트
 */

import { memo, useMemo, useRef } from 'react';
import { Button, CodeBlock, CodeExample, DemoCard } from '@/components/ui';
import type { MouseEventsStateData } from '../context/MouseEventsContext';

// ================================
// 📊 Props 인터페이스
// ================================

export interface ContextStoreMouseEventsViewProps {
  mouseState: MouseEventsStateData;
  onReset: () => void;
}

// ================================
// 🚀 최적화된 선택적 구독 훅들
// ================================

/**
 * 상태 패널용 최적화된 데이터 (메모화)
 */
function useStatusPanelData(mouseState: MouseEventsStateData) {
  return useMemo(
    () => ({
      currentPosition: mouseState.mousePosition,
      isInsideArea: mouseState.isInsideArea,
      moveCount: mouseState.moveCount,
      clickCount: mouseState.clickCount,
      velocity: mouseState.mouseVelocity,
      activityStatus: mouseState.activityStatus,
    }),
    [
      mouseState.mousePosition,
      mouseState.isInsideArea,
      mouseState.moveCount,
      mouseState.clickCount,
      mouseState.mouseVelocity,
      mouseState.activityStatus,
    ]
  );
}

/**
 * 통계 패널용 최적화된 데이터 (메모화)
 */
function useStatisticsPanelData(mouseState: MouseEventsStateData) {
  return useMemo(
    () => ({
      validPathLength: mouseState.validPath.length,
      recentClickCount: mouseState.recentClickCount,
      averageVelocity: mouseState.averageVelocity,
      totalEvents: mouseState.totalEvents,
    }),
    [
      mouseState.validPath.length,
      mouseState.recentClickCount,
      mouseState.averageVelocity,
      mouseState.totalEvents,
    ]
  );
}

// ================================
// 🎨 UI 컴포넌트들
// ================================

/**
 * 상태 정보 패널 - 최적화된 선택적 구독
 */
const StatusPanel = memo(
  ({ mouseState }: { mouseState: MouseEventsStateData }) => {
    const statusData = useStatusPanelData(mouseState);

    // 렌더링 로그
    console.log('🎨 Context StatusPanel render with optimized data:', {
      position: statusData.currentPosition,
      moveCount: statusData.moveCount,
      clickCount: statusData.clickCount,
      activityStatus: statusData.activityStatus,
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
            <span className="font-mono text-green-600">
              {statusData.moveCount}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-600">Clicks:</span>
            <span className="font-mono text-purple-600">
              {statusData.clickCount}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-600">Velocity:</span>
            <span className="font-mono text-red-600">
              {statusData.velocity.toFixed(2)} px/ms
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-600">Status:</span>
            <span
              className={`font-mono ${
                statusData.activityStatus === 'moving'
                  ? 'text-blue-600'
                  : statusData.activityStatus === 'clicking'
                    ? 'text-purple-600'
                    : 'text-gray-400'
              }`}
            >
              {statusData.activityStatus === 'moving'
                ? '🔄 Moving'
                : statusData.activityStatus === 'clicking'
                  ? '👆 Clicking'
                  : '⏸️ Idle'}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-600">Inside:</span>
            <span
              className={`font-mono ${
                statusData.isInsideArea ? 'text-green-600' : 'text-orange-600'
              }`}
            >
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
  }
);

/**
 * 통계 패널 - 최적화된 계산된 값들 표시
 */
const StatisticsPanel = memo(
  ({ mouseState }: { mouseState: MouseEventsStateData }) => {
    const statsData = useStatisticsPanelData(mouseState);

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
  }
);

/**
 * 성능 메트릭 패널 - Context Store 특화
 */
const PerformancePanel = memo(
  ({ mouseState }: { mouseState: MouseEventsStateData }) => {
    // 렌더링 횟수 추적
    const renderCountRef = useRef(0);
    renderCountRef.current++;

    // Context Store 메트릭
    const contextMetrics = useMemo(
      () => ({
        storeCount: 1, // mouseState 하나의 통합 store
        computedValues: 6, // validPath, recentClickCount, averageVelocity, totalEvents, activityStatus, hasActivity
        contextLayers: 2, // StoreProvider + ActionProvider
      }),
      []
    );

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-green-50 rounded-lg">
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">1</div>
          <div className="text-xs text-gray-600">Unified Store</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-blue-600">
            {renderCountRef.current}
          </div>
          <div className="text-xs text-gray-600">Render Count</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-purple-600">
            {contextMetrics.computedValues}
          </div>
          <div className="text-xs text-gray-600">Computed Values</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-orange-600">
            {contextMetrics.contextLayers}
          </div>
          <div className="text-xs text-gray-600">Context Layers</div>
        </div>
      </div>
    );
  }
);

// ================================
// 🖥️ 메인 컴포넌트
// ================================

/**
 * Context Store 기반 마우스 이벤트 View 컴포넌트
 */
const ContextStoreMouseEventsViewComponent = ({
  mouseState,
  onReset,
}: ContextStoreMouseEventsViewProps) => {
  console.log(
    '🏪 ContextStoreMouseEventsView render at',
    new Date().toISOString()
  );

  // 메모화된 값들
  const hasActivity = mouseState.hasActivity;
  const lastActivity = useMemo(() => {
    return mouseState.lastMoveTime
      ? new Date(mouseState.lastMoveTime).toLocaleTimeString()
      : null;
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
            This demo showcases <strong>Context Store Pattern</strong> with
            createDeclarativeStores. Uses a unified store with{' '}
            <strong>computed values integration</strong> and automatic action
            handling for optimal performance and maintainability.
          </p>
        </div>

        <div className="space-y-4">
          {/* 마우스 추적 영역 - DOM은 Context Store Container가 관리 */}
          <div
            id="context-mouse-area"
            className="relative h-[400px] border-2 border-green-300 rounded-lg bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 overflow-hidden cursor-crosshair"
            style={{
              containIntrinsicSize: '100% 400px',
              willChange: 'auto',
            }}
          >
            {/* 상태 정보 패널 - Context Store 구독 */}
            <StatusPanel mouseState={mouseState} />

            {/* 활동 가이드 */}
            {!hasActivity && (
              <div className="absolute inset-0 flex items-center justify-center z-5 pointer-events-none">
                <div className="text-center text-gray-500">
                  <div className="text-lg mb-2">🏪</div>
                  <div className="text-sm">
                    Move your mouse to see Context Store in action
                  </div>
                  <div className="text-xs mt-1 opacity-75">
                    Unified Store → Computed Values → Reactive UI
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
          <StatisticsPanel mouseState={mouseState} />

          {/* 성능 메트릭 패널 */}
          <PerformancePanel mouseState={mouseState} />
        </div>
      </DemoCard>

      {/* Context Store 설명 */}
      <DemoCard variant="info">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🏪 Context Store Pattern Benefits
        </h3>
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong className="text-gray-900">Unified Store Management:</strong>
            <br />
            This implementation uses createDeclarativeStores for a single,
            unified store that manages all mouse state. Computed values are
            automatically updated and cached for optimal performance.
          </p>
          <p>
            <strong className="text-gray-900">Key Advantages:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <strong>Single Source of Truth:</strong> All mouse data in one
              store
            </li>
            <li>
              <strong>Action Integration:</strong> Built-in action handling with
              context
            </li>
            <li>
              <strong>Computed Values:</strong> Automatic lazy evaluation of
              derived data
            </li>
            <li>
              <strong>Context Isolation:</strong> Provider-based scope
              management
            </li>
            <li>
              <strong>Performance:</strong> Minimal re-renders with smart
              memoization
            </li>
          </ul>
          <p>
            <strong className="text-gray-900">vs Reactive Stores:</strong>
            <br />
            Context Store provides better integration with the @context-action
            framework, simpler state management, and built-in action handling
            compared to multiple separate stores.
          </p>
        </div>
      </DemoCard>

      {/* 코드 예제 */}
      <CodeExample title="Context Store Pattern">
        <CodeBlock>
          {`// Context Store with Computed Values
interface MouseEventsStateData {
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

// Store Schema with Computed Integration
const mouseEventsStoreSchema: StoreSchema<MouseEventsStores> = {
  mouseState: {
    initialValue: {
      mousePosition: { x: -999, y: -999 },
      moveCount: 0,
      // ... other values
      // Computed values automatically managed
      validPath: [],
      activityStatus: 'idle',
      hasActivity: false,
    },
  },
};

// Provider Setup
export const MouseEventsProvider = ({ children }) => (
  <MouseEventsStoreProvider registryId="mouse-events-page">
    <MouseEventsActionProvider>
      {children}
    </MouseEventsActionProvider>
  </MouseEventsStoreProvider>
);

// Usage in Components
function MouseComponent() {
  const mouseStateStore = useMouseEventsStore('mouseState');
  const mouseState = useStoreValue(mouseStateStore);
  const dispatch = useMouseEventsActionDispatch();
  
  // All data available from single store
  const { mousePosition, activityStatus, validPath } = mouseState;
  
  return (
    <div>
      <span>Position: ({mousePosition.x}, {mousePosition.y})</span>
      <span>Status: {activityStatus}</span>
      <span>Path Points: {validPath.length}</span>
    </div>
  );
}`}
        </CodeBlock>
      </CodeExample>
    </div>
  );
};

// 메인 컴포넌트 메모화
export const ContextStoreMouseEventsView = memo(
  ContextStoreMouseEventsViewComponent
);
