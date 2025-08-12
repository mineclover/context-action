/**
 * @fileoverview Mouse Events View Component - View Layer
 * 
 * Hook을 통해 Data/Action과 연결되는 View 컴포넌트입니다.
 */

import { memo, useMemo, useCallback } from 'react';
import { DemoCard, Button, CodeBlock, CodeExample } from '../../../../components/ui';
import { useStoreValue } from '@context-action/react';
import { useMouseEventsLogic } from '../hooks/useMouseEventsLogic';
import { useMouseEventsStore, useAggregatedMouseEventsState, type MouseEventsStateData } from '../context/MouseEventsContext';
import { SimpleSmoothTracker } from './SimpleSmoothTracker';
import { StaticMousePath } from './StaticMousePath';
import { AnimatedClickIndicators } from './AnimatedClickIndicators';
import { RealtimeMouseCursor } from './RealtimeMouseCursor';

/**
 * 마우스 이벤트 View 컴포넌트
 * 
 * Hook Layer를 통해 데이터와 액션을 받아 UI를 렌더링합니다.
 */
const MouseEventsViewComponent = () => {
  console.log('📱 MouseEventsView render at', new Date().toISOString());
  
  const {
    handleMouseMove,
    handleMouseClick,
    handleMouseEnter,
    handleMouseLeave,
    resetState,
  } = useMouseEventsLogic();
  
  // 개별 stores에서 반응형 구독
  const positionStore = useMouseEventsStore('position');
  const movementStore = useMouseEventsStore('movement');
  const clicksStore = useMouseEventsStore('clicks');
  const computedStore = useMouseEventsStore('computed');
  
  const position = useStoreValue(positionStore);
  const movement = useStoreValue(movementStore);
  const clicks = useStoreValue(clicksStore);
  const computed = useStoreValue(computedStore);
  
  // 집계된 상태 (메모화)
  const mouseState = useMemo(() => ({
    // Position data
    mousePosition: position.current,
    previousPosition: position.previous,
    isInsideArea: position.isInsideArea,
    
    // Movement data
    moveCount: movement.moveCount,
    isMoving: movement.isMoving,
    mouseVelocity: movement.velocity,
    lastMoveTime: movement.lastMoveTime,
    movePath: movement.path,
    
    // Click data
    clickCount: clicks.count,
    clickHistory: clicks.history,
    
    // Computed values
    validPath: computed.validPath,
    recentClickCount: computed.recentClickCount,
    averageVelocity: computed.averageVelocity,
    totalEvents: computed.totalEvents,
    activityStatus: computed.activityStatus,
    hasActivity: computed.hasActivity,
  }), [position, movement, clicks, computed]);
  
  // mouseState 구조분해
  const {
    mousePosition,
    moveCount,
    clickCount,
    isMoving,
    lastMoveTime,
    movePath,
    mouseVelocity,
    isInsideArea,
    clickHistory
  } = mouseState;
  
  // 계산된 값들
  const isActive = isMoving;
  const hasActivity = moveCount > 0 || clickCount > 0;
  const averageVelocity = mouseVelocity;

  // 메모화된 계산값
  const memoizedAverageVelocity = useMemo(() => averageVelocity, [
    movePath.length,
    moveCount
  ]);

  // 매끄러운 마우스 추적을 위한 콜백들
  const handleSmoothMouseMove = useCallback((position: { x: number; y: number }, velocity: number) => {
    handleMouseMove(Math.round(position.x), Math.round(position.y));
  }, [handleMouseMove]);

  const handleSmoothMouseClick = useCallback((position: { x: number; y: number }, button: number) => {
    handleMouseClick(Math.round(position.x), Math.round(position.y), button);
  }, [handleMouseClick]);

  const handleSmoothMouseEnter = useCallback((position: { x: number; y: number }) => {
    handleMouseEnter(Math.round(position.x), Math.round(position.y));
  }, [handleMouseEnter]);

  const handleSmoothMouseLeave = useCallback((position: { x: number; y: number }) => {
    handleMouseLeave(Math.round(position.x), Math.round(position.y));
  }, [handleMouseLeave]);

  return (
    <div className="space-y-6">
      {/* 메인 마우스 이벤트 UI */}
      <DemoCard>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            🖱️ Mouse Events with Throttling Demo
          </h3>
          <p className="text-sm text-gray-600">
            This demo showcases optimized real-time mouse tracking with <strong>60fps performance</strong>. 
            It features smooth cursor tracking, dynamic path visualization, and velocity-based scaling 
            while maintaining excellent performance through efficient rendering techniques.
          </p>
        </div>
        
        <div className="space-y-4">
          {/* 마우스 인터랙션 영역 */}
          <SimpleSmoothTracker
            onMouseMove={handleSmoothMouseMove}
            onMouseClick={handleSmoothMouseClick}
            onMouseEnter={handleSmoothMouseEnter}
            onMouseLeave={handleSmoothMouseLeave}
          >
            <div
              className="relative h-[400px] border-2 border-gray-300 rounded-lg bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden cursor-crosshair mouse-events-container"
              style={{
                containIntrinsicSize: '100% 400px',
                willChange: 'auto'
              }}
            >
            {/* 상태 정보 패널 */}
            <div className="absolute top-3 left-3 bg-white bg-opacity-95 p-3 rounded-lg shadow-sm border min-w-[200px]">
              <div className="text-sm space-y-1">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-600">Position:</span>
                  <span className="font-mono text-blue-600">
                    ({mousePosition.x}, {mousePosition.y})
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-600">Moves:</span>
                  <span className="font-mono text-green-600">{moveCount}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-600">Clicks:</span>
                  <span className="font-mono text-purple-600">{clickCount}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-600">Velocity:</span>
                  <span className="font-mono text-red-600">
                    {mouseVelocity.toFixed(2)} px/ms
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-mono ${
                    isActive ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {isActive ? '🔄 Moving' : '⏸️ Idle'}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-600">Inside:</span>
                  <span className={`font-mono ${
                    isInsideArea ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {isInsideArea ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
              </div>
            </div>

            {/* 실시간 마우스 커서 */}
            <RealtimeMouseCursor
              position={mousePosition}
              velocity={mouseVelocity}
              isVisible={isInsideArea}
              isMoving={isMoving}
            />

            {/* 정적 마우스 경로 (성능 최적화) */}
            <StaticMousePath 
              movePath={movePath}
              isVisible={movePath.length > 1}
            />

            {/* GSAP 기반 클릭 애니메이션 */}
            <AnimatedClickIndicators clickHistory={clickHistory} />

            {/* 인터랙션 가이드 */}
            {!hasActivity && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-lg mb-2">🖱️</div>
                  <div className="text-sm">
                    Move your mouse and click to see smooth tracking in action
                  </div>
                  <div className="text-xs mt-1 opacity-75">
                    Using lerp-based real-time tracking with optimized rendering
                  </div>
                </div>
              </div>
            )}
            </div>
          </SimpleSmoothTracker>

          {/* 컨트롤 */}
          <div className="flex justify-between items-center">
            <Button
              onClick={resetState}
              variant="secondary"
              size="sm"
              disabled={!hasActivity}
            >
              Reset Tracking
            </Button>
            
            {lastMoveTime && (
              <span className="text-xs text-gray-500">
                Last activity: {new Date(lastMoveTime).toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* 추가 통계 - 최적화됨 */}
          <StatisticsPanel 
            movePath={movePath}
            moveCount={moveCount}
            clickCount={clickCount}
            clickHistory={clickHistory}
            averageVelocity={memoizedAverageVelocity}
          />
        </div>
      </DemoCard>

      {/* 개념 설명 */}
      <DemoCard variant="info">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Mouse Event Throttling
        </h3>
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong className="text-gray-900">Why Throttle Mouse Events?</strong>
            <br />
            Mouse move events can fire hundreds of times per second, especially on 
            high-refresh displays. Without throttling, this can cause performance 
            issues, battery drain, and overwhelm the application with events.
          </p>
          <p>
            <strong className="text-gray-900">Benefits:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Reduces CPU usage and improves battery life</li>
            <li>Prevents UI stuttering from excessive updates</li>
            <li>Maintains smooth visual feedback</li>
            <li>Reduces server load for cursor tracking</li>
            <li>Better performance on low-end devices</li>
          </ul>
          <p>
            <strong className="text-gray-900">Throttling Strategy:</strong>
            <br />
            This demo throttles mouse move events to 50ms intervals (20 events/second), 
            which provides smooth interaction while maintaining performance. The visual 
            cursor updates immediately while the data processing is throttled.
          </p>
        </div>
      </DemoCard>

      {/* 코드 예제 */}
      <CodeExample title="Mouse Event Throttling Implementation">
        <CodeBlock>
          {`// Mouse event throttling with visual feedback
const useMouseTracking = (throttleDelay = 50) => {
  const [mouseState, setMouseState] = useState({
    position: { x: 0, y: 0 },
    isMoving: false,
    moveCount: 0,
    velocity: 0,
    path: []
  });

  const throttledUpdate = useThrottle((position, velocity) => {
    setMouseState(prev => ({
      ...prev,
      position,
      velocity,
      moveCount: prev.moveCount + 1,
      path: [position, ...prev.path.slice(0, 9)] // Keep last 10 points
    }));
  }, throttleDelay);

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Update UI immediately for responsiveness
    const newPosition = { x, y };
    
    // Calculate velocity
    const deltaX = x - mouseState.position.x;
    const deltaY = y - mouseState.position.y;
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Throttled data processing
    throttledUpdate(newPosition, velocity);
  }, [throttledUpdate, mouseState.position]);

  return { mouseState, handleMouseMove };
};

// Usage in component
const MouseTracker = () => {
  const { mouseState, handleMouseMove } = useMouseTracking(50);
  
  return (
    <div
      className="mouse-area"
      onMouseMove={handleMouseMove}
      style={{ position: 'relative', height: '400px' }}
    >
      {/* Immediate cursor feedback */}
      <div
        className="cursor-indicator"
        style={{
          position: 'absolute',
          left: mouseState.position.x,
          top: mouseState.position.y,
          transform: \`scale(\${1 + mouseState.velocity / 100})\`
        }}
      />
      
      {/* Throttled path visualization */}
      <svg className="path-overlay">
        <path
          d={\`M \${mouseState.path.map(p => \`\${p.x} \${p.y}\`).join(' L ')}\`}
          stroke="blue"
          strokeWidth="2"
          fill="none"
        />
      </svg>
      
      <div>Events processed: {mouseState.moveCount}</div>
    </div>
  );
};`}
        </CodeBlock>
      </CodeExample>

      {/* 성능 비교 */}
      <DemoCard variant="info">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Performance Impact
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-red-600 mb-2">Traditional Approach</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• Heavy GSAP animations</li>
              <li>• Complex event handling</li>
              <li>• Render blocking</li>
              <li>• Memory leaks potential</li>
              <li>• Inconsistent frame rates</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-green-600 mb-2">Optimized System</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• 60fps smooth tracking</li>
              <li>• Efficient React events</li>
              <li>• Hardware acceleration</li>
              <li>• Memory optimized</li>
              <li>• Consistent performance</li>
            </ul>
          </div>
        </div>
      </DemoCard>

      {/* 사용 사례 */}
      <DemoCard variant="info">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Common Use Cases
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Real-time cursor tracking and collaboration</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Drawing and sketching applications</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Interactive data visualization</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Gaming and animation controls</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Image editing and manipulation</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>3D model rotation and manipulation</span>
          </li>
        </ul>
      </DemoCard>
    </div>
  );
};

// 메모화된 통계 패널 컴포넌트 - 타입 안전성 개선
interface StatisticsPanelProps {
  movePath: MouseEventsStateData['movePath'];
  moveCount: number;
  clickCount: number;
  clickHistory: MouseEventsStateData['clickHistory'];
  averageVelocity: number;
}

const StatisticsPanel = memo(({ 
  movePath, 
  moveCount, 
  clickCount, 
  clickHistory, 
  averageVelocity 
}: StatisticsPanelProps) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
    <div className="text-center">
      <div className="text-xl font-bold text-blue-600">
        {movePath.length}
      </div>
      <div className="text-xs text-gray-600">Path Points</div>
    </div>
    <div className="text-center">
      <div className="text-xl font-bold text-green-600">
        {averageVelocity.toFixed(1)}
      </div>
      <div className="text-xs text-gray-600">Avg Distance</div>
    </div>
    <div className="text-center">
      <div className="text-xl font-bold text-purple-600">
        {clickHistory.length}
      </div>
      <div className="text-xs text-gray-600">Recent Clicks</div>
    </div>
    <div className="text-center">
      <div className="text-xl font-bold text-orange-600">
        {moveCount + clickCount}
      </div>
      <div className="text-xs text-gray-600">Total Events</div>
    </div>
  </div>
));

// 메인 컴포넌트 메모화
export const MouseEventsView = memo(MouseEventsViewComponent);