/**
 * @fileoverview Enhanced Context Store View - 향상된 Context Store 패턴 뷰
 * 
 * 개별 stores를 직접 활용하여 최적화된 렌더링과 실시간 분석을 제공
 */

import { memo, useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { useStoreSelector, useStoreValue } from '@context-action/react';
import { DemoCard, Button, CodeBlock, CodeExample } from '../../../../components/ui';
import { AdvancedMetricsPanel } from './AdvancedMetricsPanel';
import { RealTimeDebugger } from './RealTimeDebugger';

// ================================
// 📊 타입 정의
// ================================

interface Position {
  current: { x: number; y: number };
  previous: { x: number; y: number };
  isInsideArea: boolean;
}

interface Movement {
  moveCount: number;
  isMoving: boolean;
  velocity: number;
  lastMoveTime: number | null;
  path: Array<{ x: number; y: number }>;
}

interface Clicks {
  count: number;
  history: Array<{ x: number; y: number; timestamp: number }>;
}

interface Computed {
  validPath: Array<{ x: number; y: number }>;
  recentClickCount: number;
  averageVelocity: number;
  totalEvents: number;
  activityStatus: 'idle' | 'moving' | 'clicking';
  hasActivity: boolean;
}

interface PerformanceMetrics {
  renderCount: number;
  averageRenderTime: string;
  storeCount: number;
  subscriptionCount: number;
}

export interface EnhancedContextStoreViewProps {
  performanceMetrics: PerformanceMetrics;
  onReset: () => void;
  hasActivity: boolean;
  // Store 참조들 (각 패널이 직접 구독용)
  positionStore: any;
  movementStore: any;
  clicksStore: any;
  computedStore: any;
}

// ================================
// 🚀 개별 Store 기반 최적화된 패널들
// ================================

/**
 * Position Store 전용 패널 (직접 구독)
 */
const PositionPanel = memo(({ positionStore }: { positionStore: any }) => {
  const renderCountRef = useRef(0);
  renderCountRef.current++;
  
  // 🔥 직접 구독 - 이 패널은 position store 변경시만 리렌더
  const position = useStoreValue(positionStore);

  console.log('🎯 PositionPanel render:', renderCountRef.current, position.current);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
        <span>📍</span>
        Position Store
        <span className="text-xs bg-blue-100 px-2 py-1 rounded">#{renderCountRef.current}</span>
      </h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-blue-600">Current:</span>
          <span className="font-mono text-blue-800">
            ({position.current.x}, {position.current.y})
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-blue-600">Previous:</span>
          <span className="font-mono text-blue-800">
            ({position.previous.x}, {position.previous.y})
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-blue-600">Inside Area:</span>
          <span className={`font-mono ${position.isInsideArea ? 'text-green-600' : 'text-orange-600'}`}>
            {position.isInsideArea ? '✓ Yes' : '✗ No'}
          </span>
        </div>
      </div>
    </div>
  );
});

/**
 * Movement Store 전용 패널 (Path 시각화 포함, 직접 구독)
 */
const MovementPanel = memo(({ movementStore }: { movementStore: any }) => {
  const renderCountRef = useRef(0);
  renderCountRef.current++;
  
  // 🔥 직접 구독 - 이 패널은 movement store 변경시만 리렌더
  const movement = useStoreValue(movementStore);

  const lastActivity = useMemo(() => {
    return movement.lastMoveTime ? new Date(movement.lastMoveTime).toLocaleTimeString() : 'Never';
  }, [movement.lastMoveTime]);

  const validPath = useMemo(() => {
    return movement.path.filter(p => p.x !== -999 && p.y !== -999 && p.x !== 0 && p.y !== 0);
  }, [movement.path]);

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
        <span>🏃</span>
        Movement Store
        <span className="text-xs bg-green-100 px-2 py-1 rounded">#{renderCountRef.current}</span>
      </h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-green-600">Move Count:</span>
          <span className="font-mono text-green-800">{movement.moveCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-600">Is Moving:</span>
          <span className={`font-mono ${movement.isMoving ? 'text-blue-600' : 'text-gray-600'}`}>
            {movement.isMoving ? '🔄 Yes' : '⏸️ No'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-600">Velocity:</span>
          <span className="font-mono text-green-800">
            {movement.velocity.toFixed(2)} px/ms
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-600">Path Points:</span>
          <span className="font-mono text-green-800">{movement.path.length} ({validPath.length} valid)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-600">Last Activity:</span>
          <span className="font-mono text-green-800 text-xs">{lastActivity}</span>
        </div>
        
        {/* Path 시각화 미니뷰 */}
        {validPath.length > 1 && (
          <div className="mt-3">
            <div className="text-xs text-green-600 mb-1">Mouse Path (Last 20 points):</div>
            <div className="relative h-16 bg-green-100 rounded border overflow-hidden">
              <svg 
                className="absolute inset-0 w-full h-full" 
                viewBox="0 0 200 64" 
                preserveAspectRatio="none"
              >
                {validPath.length > 1 && (
                  <polyline
                    points={validPath.slice(-20).map((p, i) => 
                      `${(p.x / 800) * 200},${(p.y / 400) * 64}`
                    ).join(' ')}
                    fill="none"
                    stroke="#059669"
                    strokeWidth="1.5"
                    strokeOpacity="0.7"
                    vectorEffect="non-scaling-stroke"
                  />
                )}
                {validPath.slice(-5).map((point, i) => (
                  <circle
                    key={i}
                    cx={(point.x / 800) * 200}
                    cy={(point.y / 400) * 64}
                    r="1.5"
                    fill="#10b981"
                    fillOpacity={0.3 + (i / 5) * 0.7}
                  />
                ))}
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * Clicks Store 전용 패널 (직접 구독)
 */
const ClicksPanel = memo(({ clicksStore }: { clicksStore: any }) => {
  const renderCountRef = useRef(0);
  renderCountRef.current++;
  
  // 🔥 직접 구독 - 이 패널은 clicks store 변경시만 리렌더
  const clicks = useStoreValue(clicksStore);

  const recentClicks = useMemo(() => {
    return clicks.history.slice(0, 3);
  }, [clicks.history]);

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
        <span>👆</span>
        Clicks Store
        <span className="text-xs bg-purple-100 px-2 py-1 rounded">#{renderCountRef.current}</span>
      </h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-purple-600">Total Clicks:</span>
          <span className="font-mono text-purple-800">{clicks.count}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-purple-600">History Length:</span>
          <span className="font-mono text-purple-800">{clicks.history.length}</span>
        </div>
        {recentClicks.length > 0 && (
          <div>
            <span className="text-purple-600 text-xs">Recent Clicks:</span>
            <div className="mt-1 space-y-1">
              {recentClicks.map((click, idx) => (
                <div key={idx} className="text-xs font-mono text-purple-700 bg-purple-100 px-2 py-1 rounded">
                  ({click.x}, {click.y}) at {new Date(click.timestamp).toLocaleTimeString()}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * Computed Store 전용 패널 (직접 구독)
 */
const ComputedPanel = memo(({ computedStore }: { computedStore: any }) => {
  const renderCountRef = useRef(0);
  renderCountRef.current++;
  
  // 🔥 직접 구독 - 이 패널은 computed store 변경시만 리렌더
  const computed = useStoreValue(computedStore);

  const statusColor = useMemo(() => {
    switch (computed.activityStatus) {
      case 'moving': return 'text-blue-600';
      case 'clicking': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  }, [computed.activityStatus]);

  const statusEmoji = useMemo(() => {
    switch (computed.activityStatus) {
      case 'moving': return '🔄';
      case 'clicking': return '👆';
      default: return '⏸️';
    }
  }, [computed.activityStatus]);

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
      <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
        <span>🧮</span>
        Computed Store
        <span className="text-xs bg-orange-100 px-2 py-1 rounded">#{renderCountRef.current}</span>
      </h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-orange-600">Activity Status:</span>
          <span className={`font-mono ${statusColor} flex items-center gap-1`}>
            <span>{statusEmoji}</span>
            {computed.activityStatus}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-orange-600">Valid Path:</span>
          <span className="font-mono text-orange-800">{computed.validPath.length} points</span>
        </div>
        <div className="flex justify-between">
          <span className="text-orange-600">Recent Clicks:</span>
          <span className="font-mono text-orange-800">{computed.recentClickCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-orange-600">Avg Velocity:</span>
          <span className="font-mono text-orange-800">{computed.averageVelocity.toFixed(1)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-orange-600">Total Events:</span>
          <span className="font-mono text-orange-800">{computed.totalEvents}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-orange-600">Has Activity:</span>
          <span className={`font-mono ${computed.hasActivity ? 'text-green-600' : 'text-gray-600'}`}>
            {computed.hasActivity ? '✅ Yes' : '❌ No'}
          </span>
        </div>
      </div>
    </div>
  );
});

/**
 * 실시간 성능 메트릭 패널
 */
const PerformancePanel = memo(({ metrics }: { metrics: PerformanceMetrics }) => {
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    setUpdateCount(prev => prev + 1);
  }, [metrics.renderCount]);

  return (
    <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
      <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
        <span>📊</span>
        Performance Metrics
        <span className="text-xs bg-gray-200 px-2 py-1 rounded">#{updateCount}</span>
      </h4>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="text-center">
          <div className="text-xl font-bold text-blue-600">{metrics.renderCount}</div>
          <div className="text-xs text-gray-600">Total Renders</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">{metrics.averageRenderTime}ms</div>
          <div className="text-xs text-gray-600">Avg Render Time</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-purple-600">{metrics.storeCount}</div>
          <div className="text-xs text-gray-600">Active Stores</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-orange-600">{metrics.subscriptionCount}</div>
          <div className="text-xs text-gray-600">Subscriptions</div>
        </div>
      </div>
    </div>
  );
});

// ================================
// 🖥️ 메인 컴포넌트
// ================================

/**
 * Reset 버튼 컴포넌트 (선택적 구독으로 최적화)
 */
const ResetButton = memo(({ onReset, hasActivity }: { onReset: () => void; hasActivity: boolean }) => {
  const renderCountRef = useRef(0);
  renderCountRef.current++;
  
  console.log('🔴 ResetButton render:', renderCountRef.current, 'hasActivity:', hasActivity);
  
  return (
    <Button
      onClick={onReset}
      variant="secondary"
      size="sm"
      disabled={!hasActivity}
    >
      🔄 Reset Enhanced Store
    </Button>
  );
});

/**
 * 상태 오버레이 컴포넌트 (선택적 구독으로 최적화)
 */
const StatusOverlay = memo(({ 
  positionStore, 
  movementStore, 
  computedStore 
}: { 
  positionStore: any; 
  movementStore: any; 
  computedStore: any; 
}) => {
  const renderCountRef = useRef(0);
  renderCountRef.current++;
  
  // 필요한 값들만 선택적 구독 (useCallback으로 최적화)
  const positionSelector = useCallback((state: any) => state.current, []);
  const velocitySelector = useCallback((state: any) => state.velocity, []);
  const activitySelector = useCallback((state: any) => state.activityStatus, []);
  
  const currentPosition = useStoreSelector(positionStore, positionSelector);
  const velocity = useStoreSelector(movementStore, velocitySelector);
  const activityStatus = useStoreSelector(computedStore, activitySelector);
  
  console.log('🟡 StatusOverlay render:', renderCountRef.current, currentPosition);
  
  return (
    <div className="absolute top-3 right-3 bg-white bg-opacity-95 p-3 rounded-lg shadow-sm border min-w-[180px] z-10">
      <div className="text-xs space-y-1">
        <div className="flex justify-between gap-2">
          <span className="text-gray-600">Position:</span>
          <span className="font-mono text-emerald-600">
            ({currentPosition.x}, {currentPosition.y})
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-gray-600">Status:</span>
          <span className={`font-mono text-xs ${
            activityStatus === 'moving' ? 'text-blue-600' : 
            activityStatus === 'clicking' ? 'text-purple-600' : 'text-gray-400'
          }`}>
            {activityStatus === 'moving' ? '🔄 Moving' : 
             activityStatus === 'clicking' ? '👆 Clicking' : '⏸️ Idle'}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-gray-600">Velocity:</span>
          <span className="font-mono text-emerald-600 text-xs">
            {velocity.toFixed(1)} px/ms
          </span>
        </div>
      </div>
    </div>
  );
});

/**
 * 통계 패널 컴포넌트 (선택적 구독으로 최적화)
 */
const StatsPanel = memo(({ 
  movementStore, 
  clicksStore, 
  computedStore,
  performanceMetrics 
}: { 
  movementStore: any; 
  clicksStore: any; 
  computedStore: any;
  performanceMetrics: PerformanceMetrics;
}) => {
  const renderCountRef = useRef(0);
  renderCountRef.current++;
  
  // 필요한 값들만 선택적 구독 (useCallback으로 최적화)
  const moveCountSelector = useCallback((state: any) => state.moveCount, []);
  const clickCountSelector = useCallback((state: any) => state.count, []);
  const totalEventsSelector = useCallback((state: any) => state.totalEvents, []);
  
  const moveCount = useStoreSelector(movementStore, moveCountSelector);
  const clickCount = useStoreSelector(clicksStore, clickCountSelector);
  const totalEvents = useStoreSelector(computedStore, totalEventsSelector);
  
  console.log('🟢 StatsPanel render:', renderCountRef.current, 'moves:', moveCount, 'clicks:', clickCount);
  
  return (
    <div className="text-xs text-gray-500 space-y-1">
      <div>Moves: {moveCount} | Clicks: {clickCount} | Events: {totalEvents}</div>
      <div>Render Performance: {performanceMetrics.averageRenderTime}ms avg</div>
    </div>
  );
});

/**
 * 컨트롤 버튼 컴포넌트 (상태 독립적으로 최적화)
 */
const ControlButtons = memo(({ 
  showAdvanced, 
  setShowAdvanced, 
  showDebugger, 
  setShowDebugger 
}: { 
  showAdvanced: boolean; 
  setShowAdvanced: (show: boolean) => void;
  showDebugger: boolean; 
  setShowDebugger: (show: boolean) => void;
}) => {
  const renderCountRef = useRef(0);
  renderCountRef.current++;
  
  console.log('🟣 ControlButtons render:', renderCountRef.current, 'showAdvanced:', showAdvanced, 'showDebugger:', showDebugger);
  
  return (
    <div className="flex gap-2">
      <Button
        onClick={() => setShowAdvanced(!showAdvanced)}
        variant="secondary"
        size="sm"
      >
        {showAdvanced ? '📊 Hide Advanced' : '📊 Show Advanced'}
      </Button>
      <Button
        onClick={() => setShowDebugger(!showDebugger)}
        variant="secondary"
        size="sm"
      >
        {showDebugger ? '🔧 Hide Debug' : '🔧 Show Debug'}
      </Button>
    </div>
  );
});

/**
 * RealTimeDebugger Wrapper - Store에서 직접 구독
 */
const RealTimeDebuggerWithStores = memo(({
  positionStore,
  movementStore,
  clicksStore,
  computedStore,
  isVisible,
  onToggle
}: {
  positionStore: any;
  movementStore: any;
  clicksStore: any;
  computedStore: any;
  isVisible: boolean;
  onToggle: () => void;
}) => {
  // 각 store에서 직접 구독
  const position = useStoreValue(positionStore);
  const movement = useStoreValue(movementStore);
  const clicks = useStoreValue(clicksStore);
  const computed = useStoreValue(computedStore);
  
  return (
    <RealTimeDebugger 
      position={position}
      movement={movement}
      clicks={clicks}
      computed={computed}
      isVisible={isVisible}
      onToggle={onToggle}
    />
  );
});

/**
 * 향상된 Context Store 뷰 컴포넌트
 */
const EnhancedContextStoreViewComponent = ({
  performanceMetrics,
  onReset,
  hasActivity,
  positionStore,
  movementStore,
  clicksStore,
  computedStore
}: EnhancedContextStoreViewProps) => {
  console.log('🚀 EnhancedContextStoreView render at', new Date().toISOString());
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);
  
  // 전체 렌더 카운트
  const renderCountRef = useRef(0);
  renderCountRef.current++;

  // 집계된 활동 상태는 props로 전달받음 (최적화)

  return (
    <div className="space-y-6">
      {/* 메인 마우스 이벤트 UI */}
      <DemoCard>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">
                🚀 Enhanced Context Store Pattern
              </h3>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
                Render #{renderCountRef.current}
              </span>
            </div>
            <ControlButtons 
              showAdvanced={showAdvanced}
              setShowAdvanced={setShowAdvanced}
              showDebugger={showDebugger}
              setShowDebugger={setShowDebugger}
            />
          </div>
          <p className="text-sm text-gray-600">
            <strong>Individual Store Subscriptions</strong> with selective rendering and real-time performance analytics.
            Each panel subscribes to its specific store and renders independently.
          </p>
        </div>
        
        <div className="space-y-4">
          {/* 마우스 추적 영역 */}
          <div
            id="enhanced-context-mouse-area"
            className="relative h-[400px] border-2 border-emerald-400 rounded-lg bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 overflow-hidden cursor-crosshair shadow-inner"
            style={{
              containIntrinsicSize: '100% 400px',
              willChange: 'auto'
            }}
          >
            {/* 실시간 상태 오버레이 - 최적화된 선택적 구독 */}
            {positionStore && movementStore && computedStore && (
              <StatusOverlay 
                positionStore={positionStore}
                movementStore={movementStore}
                computedStore={computedStore}
              />
            )}

            {/* 활동 가이드 */}
            {!hasActivity && (
              <div className="absolute inset-0 flex items-center justify-center z-5 pointer-events-none">
                <div className="text-center text-gray-500">
                  <div className="text-2xl mb-3">🚀</div>
                  <div className="text-base font-medium mb-1">
                    Enhanced Context Store Pattern
                  </div>
                  <div className="text-sm mb-2">
                    Move mouse to see individual store subscriptions in action
                  </div>
                  <div className="text-xs opacity-75 space-y-1">
                    <div>📍 Position → 🏃 Movement → 👆 Clicks → 🧮 Computed</div>
                    <div>Each panel renders independently with selective subscriptions</div>
                    <div className="mt-2 font-semibold text-emerald-600">🎯 Mouse Path Tracking Enabled!</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 컨트롤 패널 - 최적화된 선택적 구독 */}
          <div className="flex justify-between items-center">
            <ResetButton onReset={onReset} hasActivity={hasActivity} />
            
            {movementStore && clicksStore && computedStore && (
              <StatsPanel 
                movementStore={movementStore}
                clicksStore={clicksStore}
                computedStore={computedStore}
                performanceMetrics={performanceMetrics}
              />
            )}
          </div>

          {/* 고급 패널들 - 개별 Store 구독 */}
          {showAdvanced && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <span>🏪</span>
                Individual Store Panels (Live Subscriptions)
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PositionPanel positionStore={positionStore} />
                <MovementPanel movementStore={movementStore} />
                <ClicksPanel clicksStore={clicksStore} />
                <ComputedPanel computedStore={computedStore} />
              </div>
              
              <PerformancePanel metrics={performanceMetrics} />
            </div>
          )}

          {/* 고급 분석 패널 */}
          {showAdvanced && positionStore && movementStore && clicksStore && computedStore && (
            <AdvancedMetricsPanel 
              performanceMetrics={performanceMetrics}
              positionStore={positionStore}
              movementStore={movementStore}
              clicksStore={clicksStore}
              computedStore={computedStore}
            />
          )}
        </div>

        {/* 실시간 디버거 - Store로부터 직접 구독 */}
        {showDebugger && (
          <RealTimeDebuggerWithStores 
            positionStore={positionStore}
            movementStore={movementStore}
            clicksStore={clicksStore}
            computedStore={computedStore}
            isVisible={showDebugger}
            onToggle={() => setShowDebugger(!showDebugger)}
          />
        )}
      </DemoCard>

      {/* Context Store 패턴 설명 */}
      <DemoCard variant="info">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          🚀 Enhanced Context Store Pattern
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">🎯 Individual Store Benefits</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <div>
                  <strong>Selective Rendering:</strong> Each panel subscribes only to its specific store
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <div>
                  <strong>Performance Isolation:</strong> Store updates don't trigger unnecessary re-renders
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <div>
                  <strong>Real-time Analytics:</strong> Live performance metrics and render tracking
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <div>
                  <strong>Real-time Debugging:</strong> Interactive debug console with state logging
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <div>
                  <strong>Type Safety:</strong> Each store has its own TypeScript interface
                </div>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">⚡ Advanced Optimizations</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <div>
                  <strong>GPU Acceleration:</strong> CSS transforms and hardware acceleration
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <div>
                  <strong>Event Optimization:</strong> Passive listeners and debounced handling
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <div>
                  <strong>Memory Efficiency:</strong> Automatic cleanup and resource management
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <div>
                  <strong>Render Tracking:</strong> Performance metrics and optimization insights
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <div>
                  <strong>Interactive Debugging:</strong> Real-time state logging and inspection tools
                </div>
              </li>
            </ul>
          </div>
        </div>
      </DemoCard>

      {/* 코드 예제 */}
      <CodeExample title="Enhanced Context Store Usage">
        <CodeBlock>
          {`// Individual Store Access Pattern
function EnhancedContextStoreContainer() {
  // 개별 stores 접근 - 완전한 분리
  const positionStore = useMouseEventsStore('position');
  const movementStore = useMouseEventsStore('movement');
  const clicksStore = useMouseEventsStore('clicks');
  const computedStore = useMouseEventsStore('computed');
  
  // 선택적 구독 - 각 컴포넌트가 필요한 데이터만 구독
  const position = useStoreValue(positionStore);
  const movement = useStoreValue(movementStore);
  const clicks = useStoreValue(clicksStore);
  const computed = useStoreValue(computedStore);
  
  return (
    <EnhancedContextStoreView 
      position={position}      // Only position changes trigger PositionPanel
      movement={movement}      // Only movement changes trigger MovementPanel
      clicks={clicks}          // Only click changes trigger ClicksPanel
      computed={computed}      // Only computed changes trigger ComputedPanel
    />
  );
}

// Individual Panel with Selective Subscription
const PositionPanel = memo(({ position }) => {
  // This panel ONLY re-renders when position store updates
  // Movement, clicks, or computed updates won't affect this panel
  
  return (
    <div>
      Current: ({position.current.x}, {position.current.y})
      Previous: ({position.previous.x}, {position.previous.y})
      Inside Area: {position.isInsideArea ? 'Yes' : 'No'}
    </div>
  );
});

// Store Schema Definition
interface MouseEventsStores {
  position: {
    current: MousePosition;
    previous: MousePosition;
    isInsideArea: boolean;
  };
  movement: {
    moveCount: number;
    isMoving: boolean;
    velocity: number;
    lastMoveTime: number | null;
    path: MousePosition[];
  };
  clicks: {
    count: number;
    history: Array<MousePosition & { timestamp: number }>;
  };
  computed: {
    validPath: MousePosition[];
    recentClickCount: number;
    averageVelocity: number;
    totalEvents: number;
    activityStatus: 'idle' | 'moving' | 'clicking';
    hasActivity: boolean;
  };
}`}
        </CodeBlock>
      </CodeExample>
    </div>
  );
};

// 메인 컴포넌트 메모화
export const EnhancedContextStoreView = memo(EnhancedContextStoreViewComponent);