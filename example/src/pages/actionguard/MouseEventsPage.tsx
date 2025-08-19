/**
 * @fileoverview Mouse Events Demo Page
 * Context-Action framework의 기본 마우스 이벤트 처리 데모
 */

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { PageWithLogMonitor } from '../../components/LogMonitor';
import { createActionContext } from '@context-action/react';
import { Badge, Card, CardContent } from '../../components/ui';

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

  // Action Handlers 등록
  useActionHandler('handleMouseClick', useCallback(async (payload, controller) => {
    const logEntry = {
      id: `click_${Date.now()}`,
      type: 'Click',
      details: `${payload.button} at (${payload.x}, ${payload.y}) on ${payload.target}`,
      timestamp: Date.now()
    };
    
    setEventLog(prev => [logEntry, ...prev].slice(0, 20));
    setClickCount(prev => prev + 1);
  }, []));

  useActionHandler('handleMouseMove', useCallback(async (payload, controller) => {
    setMousePosition({ x: payload.x, y: payload.y });
    
    // 움직임이 큰 경우만 로그에 기록
    if (Math.abs(payload.movementX) > 5 || Math.abs(payload.movementY) > 5) {
      const logEntry = {
        id: `move_${Date.now()}`,
        type: 'Move',
        details: `to (${payload.x}, ${payload.y}) Δ(${payload.movementX}, ${payload.movementY})`,
        timestamp: Date.now()
      };
      
      setEventLog(prev => [logEntry, ...prev.filter(log => log.type !== 'Move')].slice(0, 20));
    }
  }, []));

  useActionHandler('handleMouseEnter', useCallback(async (payload, controller) => {
    setHoverZones(prev => ({ ...prev, [payload.target]: true }));
    
    const logEntry = {
      id: `enter_${Date.now()}`,
      type: 'Enter',
      details: `entered ${payload.target}`,
      timestamp: Date.now()
    };
    
    setEventLog(prev => [logEntry, ...prev].slice(0, 20));
  }, []));

  useActionHandler('handleMouseLeave', useCallback(async (payload, controller) => {
    setHoverZones(prev => ({ ...prev, [payload.target]: false }));
    
    const logEntry = {
      id: `leave_${Date.now()}`,
      type: 'Leave',
      details: `left ${payload.target}`,
      timestamp: Date.now()
    };
    
    setEventLog(prev => [logEntry, ...prev].slice(0, 20));
  }, []));

  useActionHandler('handleDoubleClick', useCallback(async (payload, controller) => {
    const logEntry = {
      id: `dblclick_${Date.now()}`,
      type: 'Double Click',
      details: `at (${payload.x}, ${payload.y}) on ${payload.target}`,
      timestamp: Date.now()
    };
    
    setEventLog(prev => [logEntry, ...prev].slice(0, 20));
  }, []));

  useActionHandler('handleRightClick', useCallback(async (payload, controller) => {
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
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.round(event.clientX - rect.left),
      y: Math.round(event.clientY - rect.top),
      target
    };
  };

  // 이벤트 핸들러들
  const handleClick = useCallback((event: React.MouseEvent, target: string) => {
    const pos = getMousePosition(event, target);
    const buttonNames = ['Left', 'Middle', 'Right'];
    
    dispatch('handleMouseClick', {
      ...pos,
      button: buttonNames[event.button] || 'Unknown'
    });
  }, [dispatch]);

  const handleMouseMove = useCallback((event: React.MouseEvent, target: string) => {
    const pos = getMousePosition(event, target);
    
    dispatch('handleMouseMove', {
      ...pos,
      movementX: event.movementX,
      movementY: event.movementY
    });
  }, [dispatch]);

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
    
    dispatch('handleDoubleClick', {
      ...pos
    });
  }, [dispatch]);

  const handleContextMenu = useCallback((event: React.MouseEvent, target: string) => {
    event.preventDefault();
    const pos = getMousePosition(event, target);
    
    dispatch('handleRightClick', {
      ...pos
    });
  }, [dispatch]);

  const clearLog = useCallback(() => {
    setEventLog([]);
    setClickCount(0);
  }, []);

  return (
    <div className="space-y-6">
      {/* 통계 현황 */}
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
              {eventLog.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm text-gray-600 mb-2">활성 존</h4>
            <div className="text-xl font-bold text-orange-600">
              {Object.values(hoverZones).filter(Boolean).length}
            </div>
          </CardContent>
        </Card>
      </div>

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

      {/* 이벤트 로그 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">📝 이벤트 로그</h3>
            <button
              onClick={clearLog}
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
                {eventLog.map((log) => (
                  <div key={log.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        log.type === 'Click' ? 'bg-blue-100 text-blue-700' :
                        log.type === 'Move' ? 'bg-green-100 text-green-700' :
                        log.type === 'Enter' ? 'bg-purple-100 text-purple-700' :
                        log.type === 'Leave' ? 'bg-orange-100 text-orange-700' :
                        log.type === 'Double Click' ? 'bg-pink-100 text-pink-700' :
                        log.type === 'Right Click' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
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

      {/* 사용법 안내 */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 사용법</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-blue-600 mb-3">🖱️ 마우스 동작</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• <strong>클릭</strong>: 좌클릭으로 기본 클릭 이벤트</li>
                <li>• <strong>더블클릭</strong>: 빠르게 두 번 클릭</li>
                <li>• <strong>우클릭</strong>: 컨텍스트 메뉴 방지 및 이벤트 기록</li>
                <li>• <strong>마우스 이동</strong>: 실시간 위치 추적</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-green-600 mb-3">⚡ Action Pipeline</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• <strong>중앙 처리</strong>: 모든 마우스 이벤트 중앙 관리</li>
                <li>• <strong>실시간 로깅</strong>: 이벤트 기록 및 분석</li>
                <li>• <strong>상태 동기화</strong>: UI와 데이터 실시간 연동</li>
                <li>• <strong>타입 안전성</strong>: TypeScript 완전 지원</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MouseEventsPage;