/**
 * @fileoverview Scroll View Component - View Layer
 * 
 * Hook을 통해 Data/Action과 연결되는 View 컴포넌트입니다.
 */

import { DemoCard, Button, CodeBlock, CodeExample } from '../../../../components/ui';
import { useScrollLogic } from '../hooks/useScrollLogic';

/**
 * 스크롤 View 컴포넌트
 * 
 * Hook Layer를 통해 데이터와 액션을 받아 UI를 렌더링합니다.
 */
export function ScrollView() {
  const {
    scrollState,
    handleScroll,
    resetScroll,
    isActive,
    hasScrolled,
    scrollProgress,
  } = useScrollLogic();

  return (
    <div className="space-y-6">
      {/* 메인 스크롤 UI */}
      <DemoCard>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            📜 Scroll with Throttling Demo
          </h3>
          <p className="text-sm text-gray-600">
            This demo demonstrates throttling for scroll events. Events are processed at most once every 
            <strong> 100ms</strong> (10 events/second), preventing performance issues while maintaining 
            smooth user experience. Try scrolling rapidly to see the difference.
          </p>
        </div>
        
        <div className="space-y-4">
          {/* 스크롤 컨테이너 */}
          <div
            className="h-[300px] overflow-auto border-2 border-gray-300 rounded-lg bg-gray-50 relative"
            onScroll={(e) => handleScroll(e.currentTarget.scrollTop)}
          >
            {/* 스크롤 진행률 표시 */}
            <div
              className="absolute top-0 left-0 h-1 bg-blue-500 transition-all duration-200 z-10"
              style={{ width: `${Math.min(scrollProgress, 100)}%` }}
            />
            
            {/* 스크롤 상태 표시 */}
            <div className="sticky top-2 left-2 z-20 inline-block bg-white bg-opacity-95 p-3 rounded-lg shadow-sm border">
              <div className="text-sm space-y-1">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Scroll Position:</span>
                  <span className="font-mono text-blue-600">{scrollState.scrollTop}px</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Events Processed:</span>
                  <span className="font-mono text-green-600">{scrollState.scrollCount}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Direction:</span>
                  <span className={`font-mono ${
                    scrollState.scrollDirection === 'down' ? 'text-orange-600' :
                    scrollState.scrollDirection === 'up' ? 'text-purple-600' :
                    'text-gray-400'
                  }`}>
                    {scrollState.scrollDirection === 'down' ? '↓ Down' :
                     scrollState.scrollDirection === 'up' ? '↑ Up' : 
                     '- None'}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Velocity:</span>
                  <span className="font-mono text-red-600">
                    {scrollState.scrollVelocity.toFixed(2)} px/ms
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-mono ${
                    isActive ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {isActive ? '🔄 Scrolling' : '⏸️ Idle'}
                  </span>
                </div>
              </div>
            </div>

            {/* 스크롤 콘텐츠 */}
            <div className="h-[1500px] p-6 pt-24">
              <div className="space-y-6">
                <div className="text-lg font-semibold text-gray-800">
                  Scroll Performance Demo
                </div>
                <p className="text-gray-600 leading-relaxed">
                  This demo shows how throttling optimizes scroll event handling. 
                  Without throttling, scroll events can fire hundreds of times per second, 
                  causing performance issues.
                </p>
                
                {Array.from({ length: 30 }, (_, i) => (
                  <div
                    key={i}
                    className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-gray-200"
                  >
                    <h4 className="font-semibold text-gray-800 mb-2">
                      Content Block #{i + 1}
                    </h4>
                    <p className="text-sm text-gray-600">
                      This is sample content to create a scrollable area. 
                      The throttling ensures smooth performance by limiting 
                      the frequency of scroll event processing to once every 100ms.
                    </p>
                    
                    {i % 5 === 0 && (
                      <div className="mt-3 p-2 bg-yellow-100 rounded text-xs text-yellow-800">
                        📊 Checkpoint: {scrollState.scrollTop}px scrolled, {scrollState.scrollCount} events processed
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 컨트롤 */}
          <div className="flex justify-between items-center">
            <Button
              onClick={resetScroll}
              variant="secondary"
              size="sm"
              disabled={!hasScrolled}
            >
              Reset Scroll
            </Button>
            
            {scrollState.lastScrollTime && (
              <span className="text-xs text-gray-500">
                Last scroll: {new Date(scrollState.lastScrollTime).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </DemoCard>

      {/* 개념 설명 */}
      <DemoCard variant="info">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Throttling Pattern
        </h3>
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong className="text-gray-900">What is Throttling?</strong>
            <br />
            Throttling limits function execution to a fixed interval. Unlike debouncing 
            which waits for inactivity, throttling ensures the function runs at most 
            once per time period, regardless of how many times it's called.
          </p>
          <p>
            <strong className="text-gray-900">Benefits:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Prevents performance bottlenecks from high-frequency events</li>
            <li>Maintains responsiveness during continuous user interaction</li>
            <li>Reduces CPU usage and improves battery life on mobile</li>
            <li>Provides smooth, consistent event processing</li>
          </ul>
          <p>
            <strong className="text-gray-900">Scroll Event Characteristics:</strong>
            <br />
            Scroll events can fire 60+ times per second during smooth scrolling. 
            Throttling to 10Hz (100ms intervals) reduces this to just 10 events 
            per second while maintaining smooth user experience.
          </p>
        </div>
      </DemoCard>

      {/* 코드 예제 */}
      <CodeExample title="Throttling Implementation">
        <CodeBlock>
          {`// Custom throttle hook
function useThrottle<T extends any[]>(
  callback: (...args: T) => void,
  delay: number
) {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: T) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;

      if (timeSinceLastCall >= delay) {
        // Execute immediately if enough time has passed
        lastCallRef.current = now;
        callback(...args);
      } else {
        // Schedule execution for the remaining time
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          callback(...args);
        }, delay - timeSinceLastCall);
      }
    },
    [callback, delay]
  );
}

// Usage in scroll
const handleScrollEvent = (scrollTop: number) => {
  // Process scroll metrics
  updateScrollPosition(scrollTop);
  calculateScrollVelocity(scrollTop);
  updateScrollDirection(scrollTop);
};

const throttledScroll = useThrottle(handleScrollEvent, 100);

// In component
<div
  onScroll={(e) => throttledScroll(e.target.scrollTop)}
  className="scrollable-container"
>
  {/* Scrollable content */}
</div>`}
        </CodeBlock>
      </CodeExample>

      {/* Throttling vs Debouncing */}
      <DemoCard variant="info">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Throttling vs Debouncing
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Throttling</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• Executes at regular intervals</li>
              <li>• Good for continuous events</li>
              <li>• Maintains steady performance</li>
              <li>• Use cases: scroll, resize, mousemove</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Debouncing</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• Waits for event pause</li>
              <li>• Good for discrete actions</li>
              <li>• Delays execution</li>
              <li>• Use cases: search, form validation</li>
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
            <span>Scroll event optimization</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Window resize handlers</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Mouse move tracking</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Real-time data updates</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Animation frame limiting</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>API polling with rate limits</span>
          </li>
        </ul>
      </DemoCard>
    </div>
  );
}