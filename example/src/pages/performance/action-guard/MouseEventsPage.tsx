/**
 * @fileoverview Mouse Events Demo Page
 * Context-Action framework의 기본 마우스 이벤트 처리 데모
 */

import React, { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import { PageWithLogMonitor } from '@/components/LogMonitor';
import { createActionContext } from '@context-action/react';
import { Badge, Card, CardContent } from '@/components/ui';
import { ContextActionDemo } from './components';

// Mouse Events 관련 액션 타입 정의
interface BasicMouseActions {
  handleMouseClick: { x: number; y: number; button: string; target: string };
  handleMouseMove: { x: number; y: number; movementX: number; movementY: number };
  handleMouseEnter: { target: string; timestamp: number };
  handleMouseLeave: { target: string; timestamp: number };
  handleDoubleClick: { x: number; y: number; target: string };
  handleRightClick: { x: number; y: number; target: string };
}

// Action Context 생성
const { Provider: MouseActionProvider, useActionDispatch, useActionHandler } = 
  createActionContext<BasicMouseActions>('BasicMouse');

// 메인 컴포넌트
export function MouseEventsPage() {
  return (
    <PageWithLogMonitor
      pageId="mouse-events"
      title="Mouse Events Demo"
      initialConfig={{ enableToast: true, maxLogs: 30 }}
    >
      <div className="page-container">
        <header className="page-header">
          <h1>🖱️ Mouse Events Demo</h1>
          <p className="page-description">
            Context-Action 프레임워크의 <strong>마우스 이벤트 처리</strong> 기본 데모입니다.
            다양한 마우스 이벤트를 Action Pipeline을 통해 처리하고 실시간 피드백을 제공합니다.
          </p>
          
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline" className="bg-blue-50 text-blue-800">
              🖱️ 기본 마우스 이벤트
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-800">
              ⚡ Action Pipeline
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-800">
              📱 반응형 UI
            </Badge>
            <Badge variant="outline" className="bg-orange-50 text-orange-800">
              🎯 실시간 피드백
            </Badge>
          </div>
        </header>

        <MouseActionProvider>
          <MouseEventsDemo />
        </MouseActionProvider>
      </div>
    </PageWithLogMonitor>
  );
}

// Throttle utility for performance optimization
const useThrottle = <T extends (...args: any[]) => any>(callback: T, delay: number): T => {
  const lastRun = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((...args: Parameters<T>) => {
    if (!callback) return;
    
    const now = Date.now();
    if (now - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = now;
    } else {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        callback(...args);
        lastRun.current = Date.now();
      }, delay - (now - lastRun.current));
    }
  }, [callback, delay]) as T;
};

// 통계 컴포넌트 - 렌더링 격리
const MouseStats = React.memo(({ 
  mousePosition, 
  clickCount, 
  eventLogCount, 
  activeZoneCount 
}: {
  mousePosition: { x: number; y: number };
  clickCount: number;
  eventLogCount: number;
  activeZoneCount: number;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <Card>
      <CardContent className="p-4">
        <h4 className="font-semibold text-sm text-gray-600 mb-2">마우스 위치</h4>
        <div className="text-xl font-bold text-blue-600 font-mono">
          {mousePosition.x}, {mousePosition.y}
        </div>
      </CardContent>
    </Card>
    
    <Card>
      <CardContent className="p-4">
        <h4 className="font-semibold text-sm text-gray-600 mb-2">총 클릭 수</h4>
        <div className="text-xl font-bold text-green-600">
          {clickCount}
        </div>
      </CardContent>
    </Card>
    
    <Card>
      <CardContent className="p-4">
        <h4 className="font-semibold text-sm text-gray-600 mb-2">이벤트 로그</h4>
        <div className="text-xl font-bold text-purple-600">
          {eventLogCount}
        </div>
      </CardContent>
    </Card>
    
    <Card>
      <CardContent className="p-4">
        <h4 className="font-semibold text-sm text-gray-600 mb-2">활성 존</h4>
        <div className="text-xl font-bold text-orange-600">
          {activeZoneCount}
        </div>
      </CardContent>
    </Card>
  </div>
));

// 이벤트 로그 컴포넌트 - 가상 스크롤링으로 최적화
const EventLogDisplay = React.memo(({ 
  eventLog, 
  onClear 
}: {
  eventLog: Array<{id: string; type: string; details: string; timestamp: number}>;
  onClear: () => void;
}) => {
  const getLogTypeStyle = useMemo(() => (type: string) => {
    const styles = {
      'Click': 'bg-blue-100 text-blue-700',
      'Move': 'bg-green-100 text-green-700', 
      'Enter': 'bg-purple-100 text-purple-700',
      'Leave': 'bg-orange-100 text-orange-700',
      'Double Click': 'bg-pink-100 text-pink-700',
      'Right Click': 'bg-red-100 text-red-700'
    };
    return styles[type as keyof typeof styles] || 'bg-gray-100 text-gray-700';
  }, []);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">📝 이벤트 로그</h3>
          <button
            onClick={onClear}
            className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
          >
            🗑️ 로그 지우기
          </button>
        </div>
        
        <div className="max-h-64 overflow-y-auto">
          {eventLog.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <div className="mb-2">📋</div>
              <div>이벤트 로그가 없습니다</div>
              <div className="text-sm">위 영역에서 마우스를 움직이거나 클릭해보세요!</div>
            </div>
          ) : (
            <div className="space-y-1">
              {eventLog.slice(0, 50).map((log) => ( // 최대 50개만 렌더링
                <div key={log.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getLogTypeStyle(log.type)}`}>
                      {log.type}
                    </span>
                    <span className="font-mono text-xs">{log.details}</span>
                  </div>
                  <span className="text-gray-500 font-mono text-xs">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

// 데모 컴포넌트
function MouseEventsDemo() {
  const dispatch = useActionDispatch();
  const [eventLog, setEventLog] = useState<Array<{
    id: string;
    type: string;
    details: string;
    timestamp: number;
  }>>([]);
  
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoverZones, setHoverZones] = useState<Record<string, boolean>>({});
  const [clickCount, setClickCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseMoveCountRef = useRef(0);

  // Performance monitoring
  const [performanceStats, setPerformanceStats] = useState({
    averageEventProcessingTime: 0,
    eventRate: 0,
    lastMeasurement: Date.now()
  });

  const measurePerformance = useCallback((eventType: string, startTime: number) => {
    const processingTime = performance.now() - startTime;
    setPerformanceStats(prev => ({
      ...prev,
      averageEventProcessingTime: (prev.averageEventProcessingTime + processingTime) / 2,
      eventRate: 1000 / (Date.now() - prev.lastMeasurement),
      lastMeasurement: Date.now()
    }));
  }, []);

  // Action Handlers 등록
  useActionHandler('handleMouseClick', useCallback(async (payload) => {
    const startTime = performance.now();
    
    const logEntry = {
      id: `click_${Date.now()}`,
      type: 'Click',
      details: `${payload.button} at (${payload.x}, ${payload.y}) on ${payload.target}`,
      timestamp: Date.now()
    };
    
    setEventLog(prev => [logEntry, ...prev].slice(0, 20));
    setClickCount(prev => prev + 1);
    
    measurePerformance('click', startTime);
  }, [measurePerformance]));

  // Throttled mouse position update
  const throttledUpdatePosition = useThrottle(useCallback((x: number, y: number) => {
    setMousePosition({ x, y });
  }, []), 16); // 60fps limit

  useActionHandler('handleMouseMove', useCallback(async (payload) => {
    mouseMoveCountRef.current++;
    throttledUpdatePosition(payload.x, payload.y);
    
    // 더 엄격한 조건으로 로그 빈도 줄이기 (200ms 간격, 큰 움직임만)
    if ((Math.abs(payload.movementX) > 10 || Math.abs(payload.movementY) > 10) && 
        mouseMoveCountRef.current % 10 === 0) {
      const logEntry = {
        id: `move_${Date.now()}_${mouseMoveCountRef.current}`,
        type: 'Move',
        details: `to (${payload.x}, ${payload.y}) Δ(${payload.movementX}, ${payload.movementY})`,
        timestamp: Date.now()
      };
      
      setEventLog(prev => [logEntry, ...prev.filter(log => log.type !== 'Move')].slice(0, 15));
    }
  }, [throttledUpdatePosition]));

  useActionHandler('handleMouseEnter', useCallback(async (payload) => {
    setHoverZones(prev => ({ ...prev, [payload.target]: true }));
    
    const logEntry = {
      id: `enter_${Date.now()}`,
      type: 'Enter',
      details: `entered ${payload.target}`,
      timestamp: Date.now()
    };
    
    setEventLog(prev => [logEntry, ...prev].slice(0, 20));
  }, []));

  useActionHandler('handleMouseLeave', useCallback(async (payload) => {
    setHoverZones(prev => ({ ...prev, [payload.target]: false }));
    
    const logEntry = {
      id: `leave_${Date.now()}`,
      type: 'Leave',
      details: `left ${payload.target}`,
      timestamp: Date.now()
    };
    
    setEventLog(prev => [logEntry, ...prev].slice(0, 20));
  }, []));

  useActionHandler('handleDoubleClick', useCallback(async (payload) => {
    const logEntry = {
      id: `dblclick_${Date.now()}`,
      type: 'Double Click',
      details: `at (${payload.x}, ${payload.y}) on ${payload.target}`,
      timestamp: Date.now()
    };
    
    setEventLog(prev => [logEntry, ...prev].slice(0, 20));
  }, []));

  useActionHandler('handleRightClick', useCallback(async (payload) => {
    const logEntry = {
      id: `rightclick_${Date.now()}`,
      type: 'Right Click',
      details: `at (${payload.x}, ${payload.y}) on ${payload.target}`,
      timestamp: Date.now()
    };
    
    setEventLog(prev => [logEntry, ...prev].slice(0, 20));
  }, []));

  // 마우스 이벤트 헬퍼
  const getMousePosition = (event: React.MouseEvent, target: string) => {
    if (!event.currentTarget) {
      return null;
    }
    
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.round(event.clientX - rect.left),
      y: Math.round(event.clientY - rect.top),
      target
    };
  };

  // Memoized button names array
  const buttonNames = useMemo(() => ['Left', 'Middle', 'Right'], []);

  // Memoized event handlers
  const handleClick = useCallback((event: React.MouseEvent, target: string) => {
    const pos = getMousePosition(event, target);
    if (!pos) return;
    
    dispatch('handleMouseClick', {
      ...pos,
      button: buttonNames[event.button] || 'Unknown'
    });
  }, [dispatch, buttonNames]);

  const handleMouseMove = useThrottle(useCallback((event: React.MouseEvent, target: string) => {
    const pos = getMousePosition(event, target);
    if (!pos) return;
    
    dispatch('handleMouseMove', {
      ...pos,
      movementX: event.movementX || 0,
      movementY: event.movementY || 0
    });
  }, [dispatch]), 16); // Throttle mouse move to 60fps

  const handleMouseEnter = useCallback((target: string) => {
    dispatch('handleMouseEnter', {
      target,
      timestamp: Date.now()
    });
  }, [dispatch]);

  const handleMouseLeave = useCallback((target: string) => {
    dispatch('handleMouseLeave', {
      target,
      timestamp: Date.now()
    });
  }, [dispatch]);

  const handleDoubleClick = useCallback((event: React.MouseEvent, target: string) => {
    const pos = getMousePosition(event, target);
    if (!pos) return;
    
    dispatch('handleDoubleClick', {
      ...pos
    });
  }, [dispatch]);

  const handleContextMenu = useCallback((event: React.MouseEvent, target: string) => {
    event.preventDefault();
    const pos = getMousePosition(event, target);
    if (!pos) return;
    
    dispatch('handleRightClick', {
      ...pos
    });
  }, [dispatch]);

  const clearLog = useCallback(() => {
    setEventLog([]);
    setClickCount(0);
    mouseMoveCountRef.current = 0;
  }, []);

  // Memoized statistics calculations
  const stats = useMemo(() => ({
    activeZoneCount: Object.values(hoverZones).filter(Boolean).length,
    eventLogCount: eventLog.length,
    lastEventTime: eventLog[0]?.timestamp,
    mouseMoveCount: mouseMoveCountRef.current,
    performance: performanceStats
  }), [hoverZones, eventLog.length, eventLog[0]?.timestamp, performanceStats]);


  return (
    <div className="space-y-6">
      {/* 통계 현황 - 독립 컴포넌트로 분리 */}
      <MouseStats 
        mousePosition={mousePosition}
        clickCount={clickCount}
        eventLogCount={stats.eventLogCount}
        activeZoneCount={stats.activeZoneCount}
      />

      {/* 마우스 이벤트 테스트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 기본 이벤트 영역 */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🖱️ 기본 마우스 이벤트</h3>
            
            <div 
              ref={containerRef}
              className={`relative bg-gradient-to-br from-blue-50 to-indigo-100 border-2 rounded-lg p-8 cursor-pointer transition-all ${
                hoverZones['main-area'] ? 'border-blue-500 shadow-lg' : 'border-gray-300'
              }`}
              style={{ height: '300px' }}
              onClick={(e) => handleClick(e, 'main-area')}
              onMouseMove={(e) => handleMouseMove(e, 'main-area')}
              onMouseEnter={() => handleMouseEnter('main-area')}
              onMouseLeave={() => handleMouseLeave('main-area')}
              onDoubleClick={(e) => handleDoubleClick(e, 'main-area')}
              onContextMenu={(e) => handleContextMenu(e, 'main-area')}
            >
              <div className="absolute top-2 left-2 text-sm text-gray-600">
                클릭, 이동, 더블클릭, 우클릭 테스트
              </div>
              
              <div className="absolute bottom-2 right-2 text-xs text-gray-500 font-mono">
                ({mousePosition.x}, {mousePosition.y})
              </div>
              
              {/* 마우스 포인터 표시 */}
              <div 
                className="absolute w-2 h-2 bg-red-500 rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-all duration-100"
                style={{ 
                  left: mousePosition.x, 
                  top: mousePosition.y,
                  opacity: hoverZones['main-area'] ? 1 : 0
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* 특별 이벤트 영역들 */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 특별 이벤트 영역</h3>
            
            <div className="space-y-4">
              {/* 호버 감지 영역 */}
              <div 
                className={`p-4 border-2 rounded-lg text-center cursor-pointer transition-all ${
                  hoverZones['hover-zone'] 
                    ? 'border-green-500 bg-green-50 shadow-md' 
                    : 'border-gray-300 bg-gray-50'
                }`}
                onMouseEnter={() => handleMouseEnter('hover-zone')}
                onMouseLeave={() => handleMouseLeave('hover-zone')}
                onClick={(e) => handleClick(e, 'hover-zone')}
              >
                <div className="font-medium text-sm">
                  {hoverZones['hover-zone'] ? '✅ 호버됨!' : '👆 호버 감지 영역'}
                </div>
              </div>

              {/* 더블클릭 영역 */}
              <div 
                className={`p-4 border-2 rounded-lg text-center cursor-pointer transition-all ${
                  hoverZones['double-click-zone'] 
                    ? 'border-purple-500 bg-purple-50 shadow-md' 
                    : 'border-gray-300 bg-gray-50'
                }`}
                onMouseEnter={() => handleMouseEnter('double-click-zone')}
                onMouseLeave={() => handleMouseLeave('double-click-zone')}
                onDoubleClick={(e) => handleDoubleClick(e, 'double-click-zone')}
              >
                <div className="font-medium text-sm">
                  🖱️ 더블클릭 테스트 영역
                </div>
              </div>

              {/* 우클릭 영역 */}
              <div 
                className={`p-4 border-2 rounded-lg text-center cursor-context-menu transition-all ${
                  hoverZones['right-click-zone'] 
                    ? 'border-orange-500 bg-orange-50 shadow-md' 
                    : 'border-gray-300 bg-gray-50'
                }`}
                onMouseEnter={() => handleMouseEnter('right-click-zone')}
                onMouseLeave={() => handleMouseLeave('right-click-zone')}
                onContextMenu={(e) => handleContextMenu(e, 'right-click-zone')}
              >
                <div className="font-medium text-sm">
                  🖱️ 우클릭 테스트 영역
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 이벤트 로그 - 독립 컴포넌트로 분리 */}
      <EventLogDisplay eventLog={eventLog} onClear={clearLog} />

      {/* 성능 모니터링 */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 성능 모니터링</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-700 mb-2">평균 처리 시간</h4>
              <div className="text-2xl font-bold text-blue-600">
                {stats.performance.averageEventProcessingTime.toFixed(2)}ms
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-700 mb-2">이벤트 처리율</h4>
              <div className="text-2xl font-bold text-green-600">
                {stats.performance.eventRate.toFixed(1)}/s
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-700 mb-2">마우스 이동 수</h4>
              <div className="text-2xl font-bold text-purple-600">
                {stats.mouseMoveCount}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Context-Action Performance Demo */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            🎯 Context-Action Performance Tracking Demo
          </h2>
          <p className="text-gray-700">
            ActionPerformanceData를 Context-Action 프레임워크로 구현한 데모입니다. 
            실제 Context-Action 패턴을 활용하여 성능 추적 시스템을 보여줍니다.
          </p>
        </div>
        <ContextActionDemo />
      </div>

      {/* 사용법 안내 */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 사용법 및 최적화</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-blue-600 mb-3">🖱️ 마우스 동작</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• <strong>클릭</strong>: 좌클릭으로 기본 클릭 이벤트</li>
                <li>• <strong>더블클릭</strong>: 빠르게 두 번 클릭</li>
                <li>• <strong>우클릭</strong>: 컨텍스트 메뉴 방지 및 이벤트 기록</li>
                <li>• <strong>마우스 이동</strong>: 실시간 위치 추적 (60fps 제한)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-green-600 mb-3">⚡ 성능 최적화</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• <strong>쓰로틀링</strong>: 마우스 이동 이벤트 60fps 제한</li>
                <li>• <strong>렌더링 격리</strong>: 컴포넌트 분리로 리렌더링 최소화</li>
                <li>• <strong>가상 스크롤링</strong>: 이벤트 로그 최대 50개 렌더링</li>
                <li>• <strong>메모화</strong>: 비용 높은 계산 최적화</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MouseEventsPage;