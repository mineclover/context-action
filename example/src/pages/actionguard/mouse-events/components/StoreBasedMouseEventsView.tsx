/**
 * @fileoverview Store-Based Mouse Events View - 스토어 기반 뷰 컴포넌트
 * 
 * 여러 stores를 구독하여 세밀한 반응성을 제공하는 View 컴포넌트
 */

import { memo, useMemo, useRef } from 'react';
import { useStoreValue } from '@context-action/react';
import { DemoCard, Button, CodeBlock, CodeExample } from '../../../../components/ui';
import type { 
  MouseStoreCollection,
  MousePositionState,
  MousePathState,
  MouseMetricsState,
  MouseClickState,
  MouseComputedState 
} from '../stores/MouseStoreDefinitions';

// ================================
// 📊 Props 인터페이스
// ================================

export interface StoreBasedMouseEventsViewProps {
  stores: MouseStoreCollection;
  onReset: () => void;
}

// ================================
// 🎯 개별 스토어 구독 훅들 (성능 최적화됨)
// ================================

/**
 * 위치 상태 구독 훅 - 메모화됨
 */
function useMousePosition(stores: MouseStoreCollection): MousePositionState {
  return useStoreValue(stores.position);
}

/**
 * 경로 상태 구독 훅 - 메모화됨
 */
function useMousePath(stores: MouseStoreCollection): MousePathState {
  return useStoreValue(stores.path);
}

/**
 * 메트릭 상태 구독 훅 - 메모화됨
 */
function useMouseMetrics(stores: MouseStoreCollection): MouseMetricsState {
  return useStoreValue(stores.metrics);
}

/**
 * 클릭 상태 구독 훅 - 메모화됨
 */
function useMouseClicks(stores: MouseStoreCollection): MouseClickState {
  return useStoreValue(stores.clicks);
}

/**
 * 계산된 상태 구독 훅 (지연 평가된 값들) - 메모화됨
 */
function useMouseComputed(stores: MouseStoreCollection): MouseComputedState {
  return useStoreValue(stores.computed);
}

// ================================
// 🚀 최적화된 선택적 구독 훅들
// ================================

/**
 * 상태 패널용 최적화된 구독 (필요한 값만)
 */
function useStatusPanelData(stores: MouseStoreCollection) {
  const position = useMousePosition(stores);
  const metrics = useMouseMetrics(stores);
  const computed = useMouseComputed(stores);
  
  return useMemo(() => ({
    currentPosition: position.current,
    isInsideArea: position.isInsideArea,
    moveCount: metrics.moveCount,
    clickCount: metrics.clickCount,
    velocity: metrics.velocity,
    activityStatus: computed.activityStatus,
  }), [position.current, position.isInsideArea, metrics.moveCount, metrics.clickCount, metrics.velocity, computed.activityStatus]);
}

/**
 * 통계 패널용 최적화된 구독 (계산된 값만)
 */
function useStatisticsPanelData(stores: MouseStoreCollection) {
  const path = useMousePath(stores);
  const clicks = useMouseClicks(stores);
  const computed = useMouseComputed(stores);
  
  return useMemo(() => ({
    validPathLength: path.validPath.length,
    recentClickCount: clicks.recentClickCount,
    averageVelocity: computed.averageVelocity,
    totalEvents: computed.totalEvents,
  }), [path.validPath.length, clicks.recentClickCount, computed.averageVelocity, computed.totalEvents]);
}

// ================================
// 🎨 UI 컴포넌트들
// ================================

/**
 * 상태 정보 패널 - 최적화된 선택적 구독
 */
const StatusPanel = memo(({ stores }: { stores: MouseStoreCollection }) => {
  const statusData = useStatusPanelData(stores);

  // 렌더링 로그
  console.log('🎨 StatusPanel render with optimized data:', {
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
          <span className="text-purple-600">Reactive Stores</span>
        </div>
      </div>
    </div>
  );
});

/**
 * 통계 패널 - 최적화된 계산된 값들 표시
 */
const StatisticsPanel = memo(({ stores }: { stores: MouseStoreCollection }) => {
  const statsData = useStatisticsPanelData(stores);

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
 * 성능 메트릭 패널 - 실시간 성능 측정 (최적화됨)
 */
const PerformancePanel = memo(({ stores, storeManager }: { 
  stores: MouseStoreCollection;
  storeManager?: any; // StoreManager 인스턴스
}) => {
  const computed = useMouseComputed(stores);
  const metrics = useMouseMetrics(stores);
  
  // 렌더링 횟수 추적
  const renderCountRef = useRef(0);
  renderCountRef.current++;
  
  // FPS 계산
  const fpsRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  
  // 성능 메트릭 조회
  const perfMetrics = useMemo(() => {
    if (storeManager?.getPerformanceMetrics) {
      return storeManager.getPerformanceMetrics();
    }
    return { activeListeners: 0, cacheHitRate: 0, lastUpdateTime: null };
  }, [storeManager, metrics.moveCount]);
  
  useMemo(() => {
    const now = performance.now();
    const deltaTime = now - lastTimeRef.current;
    if (deltaTime > 0) {
      fpsRef.current = Math.round(1000 / deltaTime);
    }
    lastTimeRef.current = now;
  }, [metrics.moveCount]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
      <div className="text-center">
        <div className="text-xl font-bold text-blue-600">5</div>
        <div className="text-xs text-gray-600">Reactive Stores</div>
      </div>
      <div className="text-center">
        <div className="text-xl font-bold text-green-600">{renderCountRef.current}</div>
        <div className="text-xs text-gray-600">Render Count</div>
      </div>
      <div className="text-center">
        <div className="text-xl font-bold text-purple-600">{perfMetrics.activeListeners}</div>
        <div className="text-xs text-gray-600">Active Listeners</div>
      </div>
      <div className="text-center">
        <div className="text-xl font-bold text-orange-600">{(perfMetrics.cacheHitRate * 100).toFixed(0)}%</div>
        <div className="text-xs text-gray-600">Cache Hit Rate</div>
      </div>
    </div>
  );
});

// ================================
// 🖥️ 메인 컴포넌트
// ================================

/**
 * 스토어 기반 마우스 이벤트 View 컴포넌트
 */
const StoreBasedMouseEventsViewComponent = ({ stores, onReset }: StoreBasedMouseEventsViewProps) => {
  console.log('🏪 StoreBasedMouseEventsView render at', new Date().toISOString());
  
  // 계산된 상태 구독
  const computed = useMouseComputed(stores);
  const metrics = useMouseMetrics(stores);

  // 메모화된 값들
  const hasActivity = computed.hasActivity;
  const lastActivity = useMemo(() => {
    return metrics.lastMoveTime ? new Date(metrics.lastMoveTime).toLocaleTimeString() : null;
  }, [metrics.lastMoveTime]);

  return (
    <div className="space-y-6">
      {/* 메인 마우스 이벤트 UI */}
      <DemoCard>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            🏪 Reactive Stores Mouse Events
          </h3>
          <p className="text-sm text-gray-600">
            This demo showcases <strong>Reactive Stores Architecture</strong> with fine-grained subscriptions. 
            Multiple stores manage different aspects of mouse state with <strong>lazy computed values</strong> 
            and automatic render synchronization for optimal performance.
          </p>
        </div>
        
        <div className="space-y-4">
          {/* 마우스 추적 영역 - DOM은 Clean Architecture Controller가 관리 */}
          <div
            id="reactive-mouse-area"
            className="relative h-[400px] border-2 border-purple-300 rounded-lg bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 overflow-hidden cursor-crosshair"
            style={{
              containIntrinsicSize: '100% 400px',
              willChange: 'auto'
            }}
          >
            {/* 상태 정보 패널 - 개별 스토어 구독 */}
            <StatusPanel stores={stores} />

            {/* 활동 가이드 */}
            {!hasActivity && (
              <div className="absolute inset-0 flex items-center justify-center z-5 pointer-events-none">
                <div className="text-center text-gray-500">
                  <div className="text-lg mb-2">🏪</div>
                  <div className="text-sm">
                    Move your mouse to see reactive stores in action
                  </div>
                  <div className="text-xs mt-1 opacity-75">
                    Position → Path → Metrics → Clicks → Computed stores
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
              Reset All Stores
            </Button>
            
            {lastActivity && (
              <span className="text-xs text-gray-500">
                Last activity: {lastActivity}
              </span>
            )}
          </div>

          {/* 통계 패널 - 지연 계산된 값들 */}
          <StatisticsPanel stores={stores} />

          {/* 성능 메트릭 패널 */}
          <PerformancePanel stores={stores} />
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
            <h4 className="font-semibold text-purple-600 mb-3">🏪 Reactive Stores</h4>
            <ul className="space-y-2 text-gray-700">
              <li><strong>Data:</strong> 5 specialized stores</li>
              <li><strong>State:</strong> Fine-grained reactivity</li>
              <li><strong>Rendering:</strong> React + DOM hybrid</li>
              <li><strong>Updates:</strong> Declarative store subscriptions</li>
              <li><strong>Coupling:</strong> Loose store coupling</li>
              <li><strong>Performance:</strong> Lazy computation + memoization</li>
              <li><strong>Debugging:</strong> Store subscription tracing</li>
            </ul>
          </div>
        </div>
      </DemoCard>

      {/* Reactive Stores 설명 */}
      <DemoCard variant="info">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🏪 Reactive Stores Architecture Details
        </h3>
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong className="text-gray-900">Fine-Grained Reactivity:</strong>
            <br />
            This implementation uses multiple specialized stores that manage different aspects 
            of mouse state. Each store can be subscribed to independently, providing optimal 
            re-render performance and clear separation of concerns.
          </p>
          <p>
            <strong className="text-gray-900">Store Types:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Position Store:</strong> Current/previous position, inside area status</li>
            <li><strong>Path Store:</strong> Movement path, path length, valid path (computed)</li>
            <li><strong>Metrics Store:</strong> Move/click counts, velocity, moving state</li>
            <li><strong>Clicks Store:</strong> Click history, last click, recent count (computed)</li>
            <li><strong>Computed Store:</strong> Lazy-evaluated derived values</li>
          </ul>
          <p>
            <strong className="text-gray-900">Lazy Evaluation:</strong>
            <br />
            Computed values like validPath, recentClickCount, and averageVelocity are calculated 
            only when needed and cached until dependencies change. This provides both performance 
            benefits and consistent derived state.
          </p>
        </div>
      </DemoCard>

      {/* 코드 예제 */}
      <CodeExample title="Reactive Stores Pattern">
        <CodeBlock>
          {`// Multiple specialized stores
const stores = {
  position: createStore<MousePositionState>({
    current: { x: -999, y: -999 },
    previous: { x: -999, y: -999 },
    isInsideArea: false,
  }),
  
  path: createStore<MousePathState>({
    movePath: [],
    pathLength: 0,
    validPath: [], // lazy computed
  }),
  
  metrics: createStore<MouseMetricsState>({
    moveCount: 0,
    velocity: 0,
    isMoving: false,
  }),
  
  computed: createStore<MouseComputedState>({
    hasActivity: false,
    averageVelocity: 0, // lazy computed
    totalEvents: 0,     // lazy computed
    activityStatus: 'idle', // lazy computed
  })
};

// Fine-grained subscriptions
const StatusPanel = ({ stores }) => {
  const position = useStoreValue(stores.position);
  const metrics = useStoreValue(stores.metrics);
  const computed = useStoreValue(stores.computed);
  
  return (
    <div>
      <span>Position: ({position.current.x}, {position.current.y})</span>
      <span>Moves: {metrics.moveCount}</span>
      <span>Status: {computed.activityStatus}</span>
    </div>
  );
};

// Store manager with lazy evaluation
class MouseStoreManager {
  updatePosition(position, timestamp) {
    // Update base stores
    this.stores.position.setValue({ current: position });
    this.stores.metrics.setValue({ moveCount: count + 1 });
    
    // Schedule computed updates (debounced)
    this.scheduleComputedUpdate();
  }
  
  private updateComputedValues() {
    // Lazy compute derived values
    const validPath = computeValidPath(pathState.movePath);
    const hasActivity = computeHasActivity(metrics);
    
    // Update computed store
    this.stores.computed.setValue({ validPath, hasActivity });
  }
}`}
        </CodeBlock>
      </CodeExample>
    </div>
  );
};

// 메인 컴포넌트 메모화
export const StoreBasedMouseEventsView = memo(StoreBasedMouseEventsViewComponent);