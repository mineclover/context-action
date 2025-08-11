/**
 * @fileoverview Mouse Events View Component - View Layer
 * 
 * Hook을 통해 Data/Action과 연결되는 View 컴포넌트입니다.
 */

import { DemoCard, Button, CodeBlock, CodeExample } from '../../../../components/ui';
import { useMouseEventsLogic } from '../hooks/useMouseEventsLogic';

/**
 * 마우스 이벤트 View 컴포넌트
 * 
 * Hook Layer를 통해 데이터와 액션을 받아 UI를 렌더링합니다.
 */
export function MouseEventsView() {
  const {
    mouseState,
    handleMouseMove,
    handleMouseClick,
    handleMouseEnter,
    handleMouseLeave,
    resetState,
    isActive,
    hasActivity,
    averageVelocity,
  } = useMouseEventsLogic();

  const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    handleMouseMove(x, y);
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    handleMouseClick(x, y, e.button);
  };

  const handleContainerEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    handleMouseEnter(x, y);
  };

  const handleContainerLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    handleMouseLeave(x, y);
  };

  return (
    <div className="space-y-6">
      {/* 메인 마우스 이벤트 UI */}
      <DemoCard>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            🖱️ Mouse Events with Throttling Demo
          </h3>
          <p className="text-sm text-gray-600">
            This demo tracks mouse movement with throttling at <strong>50ms intervals</strong> (20 events/second). 
            It shows position tracking, movement patterns, and velocity calculations while maintaining 
            smooth performance even during rapid mouse movements.
          </p>
        </div>
        
        <div className="space-y-4">
          {/* 마우스 인터랙션 영역 */}
          <div
            className="relative h-[400px] border-2 border-gray-300 rounded-lg bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden cursor-crosshair"
            onMouseMove={handleContainerMouseMove}
            onClick={handleContainerClick}
            onMouseEnter={handleContainerEnter}
            onMouseLeave={handleContainerLeave}
          >
            {/* 상태 정보 패널 */}
            <div className="absolute top-3 left-3 bg-white bg-opacity-95 p-3 rounded-lg shadow-sm border min-w-[200px]">
              <div className="text-sm space-y-1">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-600">Position:</span>
                  <span className="font-mono text-blue-600">
                    ({mouseState.mousePosition.x}, {mouseState.mousePosition.y})
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-600">Moves:</span>
                  <span className="font-mono text-green-600">{mouseState.moveCount}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-600">Clicks:</span>
                  <span className="font-mono text-purple-600">{mouseState.clickCount}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-600">Velocity:</span>
                  <span className="font-mono text-red-600">
                    {mouseState.mouseVelocity.toFixed(2)} px/ms
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
                    mouseState.isInsideArea ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {mouseState.isInsideArea ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
              </div>
            </div>

            {/* 마우스 커서 표시 */}
            {mouseState.isInsideArea && (
              <div
                className="absolute w-4 h-4 bg-red-500 rounded-full pointer-events-none transition-all duration-75 shadow-lg border-2 border-white"
                style={{
                  left: mouseState.mousePosition.x - 8,
                  top: mouseState.mousePosition.y - 8,
                  transform: `scale(${Math.min(1 + mouseState.mouseVelocity / 2, 2)})`,
                }}
              >
                <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-75" />
              </div>
            )}

            {/* 마우스 이동 경로 */}
            {mouseState.movePath.length > 1 && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ zIndex: 1 }}
              >
                <path
                  d={`M ${mouseState.movePath.map((point, index) => 
                    `${point.x} ${point.y}`
                  ).join(' L ')}`}
                  stroke="rgba(59, 130, 246, 0.6)"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {mouseState.movePath.map((point, index) => (
                  <circle
                    key={index}
                    cx={point.x}
                    cy={point.y}
                    r={Math.max(1, 4 - index * 0.3)}
                    fill={`rgba(59, 130, 246, ${Math.max(0.1, 1 - index * 0.1)})`}
                  />
                ))}
              </svg>
            )}

            {/* 클릭 위치 표시 */}
            {mouseState.clickHistory.map((click, index) => (
              <div
                key={click.timestamp}
                className="absolute w-6 h-6 pointer-events-none"
                style={{
                  left: click.x - 12,
                  top: click.y - 12,
                }}
              >
                <div
                  className="w-6 h-6 bg-yellow-400 rounded-full animate-ping"
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    opacity: Math.max(0.2, 1 - index * 0.2),
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-yellow-800">
                    {index + 1}
                  </span>
                </div>
              </div>
            ))}

            {/* 인터랙션 가이드 */}
            {!hasActivity && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-lg mb-2">🖱️</div>
                  <div className="text-sm">
                    Move your mouse and click to see throttling in action
                  </div>
                  <div className="text-xs mt-1 opacity-75">
                    Events are throttled to 50ms intervals for smooth performance
                  </div>
                </div>
              </div>
            )}
          </div>

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
            
            {mouseState.lastMoveTime && (
              <span className="text-xs text-gray-500">
                Last activity: {new Date(mouseState.lastMoveTime).toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* 추가 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">
                {mouseState.movePath.length}
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
                {mouseState.clickHistory.length}
              </div>
              <div className="text-xs text-gray-600">Recent Clicks</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-orange-600">
                {mouseState.moveCount + mouseState.clickCount}
              </div>
              <div className="text-xs text-gray-600">Total Events</div>
            </div>
          </div>
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
            <h4 className="font-semibold text-red-600 mb-2">Without Throttling</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• 100-1000+ events/second</li>
              <li>• High CPU usage</li>
              <li>• UI stuttering possible</li>
              <li>• Battery drain on mobile</li>
              <li>• Server overload risk</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-green-600 mb-2">With Throttling (50ms)</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• Fixed 20 events/second</li>
              <li>• Reduced CPU usage</li>
              <li>• Smooth performance</li>
              <li>• Better battery life</li>
              <li>• Manageable server load</li>
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
}