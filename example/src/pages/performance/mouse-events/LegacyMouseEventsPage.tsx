/**
 * @fileoverview Legacy Mouse Events Demo Page
 * Context-Action framework의 기본 마우스 이벤트 처리 데모 - 단일 예시
 */

import { createActionContext } from '@context-action/react';
import React, { useCallback, useRef, useState } from 'react';
import { CodeBlock } from '@/components/ui';
import { PageWithLogMonitor } from '@/components/LogMonitor';
import { Badge, Card, CardContent } from '@/components/ui';

// Mouse Events 관련 액션 타입 정의
interface BasicMouseActions {
  handleMouseClick: { x: number; y: number; button: string; target: string };
  handleMouseMove: {
    x: number;
    y: number;
    movementX: number;
    movementY: number;
  };
  handleMouseEnter: { target: string; timestamp: number };
  handleMouseLeave: { target: string; timestamp: number };
}

// Action Context 생성
const {
  Provider: MouseActionProvider,
  useActionDispatch,
  useActionHandler,
} = createActionContext<BasicMouseActions>('BasicMouse');

// 메인 컴포넌트
export default function MouseEventsPage() {
  return (
    <PageWithLogMonitor
      pageId="mouse-events"
      title="Legacy Mouse Events Demo"
      initialConfig={{ enableToast: true, maxLogs: 30 }}
    >
      <div className="page-container">
        <header className="page-header">
          <h1>🖱️ Legacy Mouse Events Demo</h1>
          <p className="page-description">
            Context-Action 프레임워크의{' '}
            <strong>Legacy 마우스 이벤트 처리</strong> 데모입니다. 단일 예시로
            마우스 이벤트를 Action Pipeline을 통해 처리하고 실시간 피드백을
            제공합니다.
          </p>

          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline" className="bg-purple-50 text-purple-800">
              🖱️ 기본 마우스 이벤트
            </Badge>
            <Badge variant="outline" className="bg-pink-50 text-pink-800">
              ⚡ Action Pipeline
            </Badge>
            <Badge variant="outline" className="bg-cyan-50 text-cyan-800">
              📱 반응형 UI
            </Badge>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-800">
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

// 통계 컴포넌트
const MouseStats = React.memo(
  ({
    mousePosition,
    clickCount,
    eventLogCount,
    activeZoneCount,
  }: {
    mousePosition: { x: number; y: number };
    clickCount: number;
    eventLogCount: number;
    activeZoneCount: number;
  }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-md hover:shadow-lg transition-all duration-300">
        <CardContent className="p-4">
          <h4 className="font-semibold text-sm text-purple-700 mb-2">
            마우스 위치
          </h4>
          <div className="text-xl font-bold text-purple-600 font-mono">
            {mousePosition.x}, {mousePosition.y}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-pink-50 to-cyan-50 border-pink-200 shadow-md hover:shadow-lg transition-all duration-300">
        <CardContent className="p-4">
          <h4 className="font-semibold text-sm text-pink-700 mb-2">
            총 클릭 수
          </h4>
          <div className="text-xl font-bold text-pink-600">{clickCount}</div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-cyan-50 to-indigo-50 border-cyan-200 shadow-md hover:shadow-lg transition-all duration-300">
        <CardContent className="p-4">
          <h4 className="font-semibold text-sm text-cyan-700 mb-2">
            이벤트 로그
          </h4>
          <div className="text-xl font-bold text-cyan-600">{eventLogCount}</div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 shadow-md hover:shadow-lg transition-all duration-300">
        <CardContent className="p-4">
          <h4 className="font-semibold text-sm text-indigo-700 mb-2">
            활성 존
          </h4>
          <div className="text-xl font-bold text-indigo-600">
            {activeZoneCount}
          </div>
        </CardContent>
      </Card>
    </div>
  )
);

// 이벤트 로그 컴포넌트
const EventLogDisplay = React.memo(
  ({
    eventLog,
    onClear,
  }: {
    eventLog: Array<{
      id: string;
      type: string;
      details: string;
      timestamp: number;
    }>;
    onClear: () => void;
  }) => {
    const getLogTypeStyle = (type: string) => {
      const styles = {
        Click: 'bg-blue-100 text-blue-700',
        Move: 'bg-green-100 text-green-700',
        Enter: 'bg-purple-100 text-purple-700',
        Leave: 'bg-orange-100 text-orange-700',
      };
      return styles[type as keyof typeof styles] || 'bg-gray-100 text-gray-700';
    };

    return (
      <Card className="h-80">
        <CardContent className="p-4 h-full flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-gray-700">이벤트 로그</h4>
            <button
              onClick={onClear}
              className="px-3 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
            >
              클리어
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1">
            {eventLog.slice(-20).map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-2 text-sm p-2 rounded"
              >
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getLogTypeStyle(log.type)}`}
                >
                  {log.type}
                </span>
                <span className="text-gray-600 flex-1">{log.details}</span>
                <span className="text-xs text-gray-400 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
);

// 메인 데모 컴포넌트
function MouseEventsDemo() {
  const dispatch = useActionDispatch();
  const [eventLog, setEventLog] = useState<
    Array<{
      id: string;
      type: string;
      details: string;
      timestamp: number;
    }>
  >([]);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoverZones, setHoverZones] = useState<Record<string, boolean>>({});
  const [clickCount, setClickCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Action Handlers 등록
  useActionHandler(
    'handleMouseClick',
    useCallback(async (payload) => {
      const logEntry = {
        id: `click_${Date.now()}`,
        type: 'Click',
        details: `${payload.button} at (${payload.x}, ${payload.y}) on ${payload.target}`,
        timestamp: Date.now(),
      };

      setEventLog((prev) => [...prev, logEntry]);
      setClickCount((prev) => prev + 1);
    }, [])
  );

  useActionHandler(
    'handleMouseMove',
    useCallback(async (payload) => {
      setMousePosition({ x: payload.x, y: payload.y });

      // 움직임이 많으니 로그는 제한적으로
      if (Math.random() < 0.1) {
        // 10% 확률로만 로그
        const logEntry = {
          id: `move_${Date.now()}`,
          type: 'Move',
          details: `to (${payload.x}, ${payload.y})`,
          timestamp: Date.now(),
        };
        setEventLog((prev) => [...prev.slice(-19), logEntry]); // 최대 20개 유지
      }
    }, [])
  );

  useActionHandler(
    'handleMouseEnter',
    useCallback(async (payload) => {
      setHoverZones((prev) => ({ ...prev, [payload.target]: true }));

      const logEntry = {
        id: `enter_${Date.now()}`,
        type: 'Enter',
        details: `entered ${payload.target}`,
        timestamp: Date.now(),
      };
      setEventLog((prev) => [...prev, logEntry]);
    }, [])
  );

  useActionHandler(
    'handleMouseLeave',
    useCallback(async (payload) => {
      setHoverZones((prev) => ({ ...prev, [payload.target]: false }));

      const logEntry = {
        id: `leave_${Date.now()}`,
        type: 'Leave',
        details: `left ${payload.target}`,
        timestamp: Date.now(),
      };
      setEventLog((prev) => [...prev, logEntry]);
    }, [])
  );

  // 이벤트 핸들러들
  const handleMouseClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const button =
        e.button === 0 ? 'Left' : e.button === 1 ? 'Middle' : 'Right';

      dispatch('handleMouseClick', {
        x: Math.round(x),
        y: Math.round(y),
        button,
        target: 'interactive-area',
      });
    },
    [dispatch]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      dispatch('handleMouseMove', {
        x: Math.round(x),
        y: Math.round(y),
        movementX: e.movementX,
        movementY: e.movementY,
      });
    },
    [dispatch]
  );

  const handleZoneEnter = useCallback(
    (zoneName: string) => {
      dispatch('handleMouseEnter', { target: zoneName, timestamp: Date.now() });
    },
    [dispatch]
  );

  const handleZoneLeave = useCallback(
    (zoneName: string) => {
      dispatch('handleMouseLeave', { target: zoneName, timestamp: Date.now() });
    },
    [dispatch]
  );

  const clearEventLog = useCallback(() => {
    setEventLog([]);
    setClickCount(0);
  }, []);

  const activeZoneCount = Object.values(hoverZones).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* 통계 섹션 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          📊 실시간 통계
        </h2>
        <MouseStats
          mousePosition={mousePosition}
          clickCount={clickCount}
          eventLogCount={eventLog.length}
          activeZoneCount={activeZoneCount}
        />
      </section>

      {/* 메인 상호작용 영역 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          🎯 상호작용 영역
        </h2>
        <Card className="relative">
          <CardContent className="p-0">
            <div
              ref={containerRef}
              className="relative h-80 bg-gradient-to-br from-slate-50 to-blue-50 cursor-crosshair overflow-hidden"
              onClick={handleMouseClick}
              onMouseMove={handleMouseMove}
              onContextMenu={(e) => e.preventDefault()}
            >
              {/* 마우스 위치 표시 */}
              <div
                className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg pointer-events-none transform -translate-x-2 -translate-y-2 transition-all duration-75"
                style={{
                  left: mousePosition.x,
                  top: mousePosition.y,
                  opacity: mousePosition.x > 0 && mousePosition.y > 0 ? 1 : 0,
                }}
              />

              {/* 호버 존들 */}
              <div
                className={`absolute top-4 left-4 w-24 h-24 rounded-lg border-2 border-dashed transition-all duration-200 flex items-center justify-center text-sm font-medium ${
                  hoverZones['zone-1']
                    ? 'bg-green-200 border-green-400 text-green-700'
                    : 'bg-gray-100 border-gray-300 text-gray-600'
                }`}
                onMouseEnter={() => handleZoneEnter('zone-1')}
                onMouseLeave={() => handleZoneLeave('zone-1')}
              >
                Zone 1
              </div>

              <div
                className={`absolute top-4 right-4 w-24 h-24 rounded-full border-2 border-dashed transition-all duration-200 flex items-center justify-center text-sm font-medium ${
                  hoverZones['zone-2']
                    ? 'bg-purple-200 border-purple-400 text-purple-700'
                    : 'bg-gray-100 border-gray-300 text-gray-600'
                }`}
                onMouseEnter={() => handleZoneEnter('zone-2')}
                onMouseLeave={() => handleZoneLeave('zone-2')}
              >
                Zone 2
              </div>

              <div
                className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-16 rounded-lg border-2 border-dashed transition-all duration-200 flex items-center justify-center text-sm font-medium ${
                  hoverZones['zone-3']
                    ? 'bg-blue-200 border-blue-400 text-blue-700'
                    : 'bg-gray-100 border-gray-300 text-gray-600'
                }`}
                onMouseEnter={() => handleZoneEnter('zone-3')}
                onMouseLeave={() => handleZoneLeave('zone-3')}
              >
                Zone 3
              </div>

              {/* 중앙 안내 텍스트 */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-gray-600 bg-white/80 rounded-lg px-4 py-2 backdrop-blur-sm">
                  <div className="text-sm font-medium">
                    마우스를 움직이거나 클릭해보세요
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    호버 존에 마우스를 올려보세요
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 이벤트 로그 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          📋 이벤트 로그
        </h2>
        <EventLogDisplay eventLog={eventLog} onClear={clearEventLog} />
      </section>

      {/* 코드 예시 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          💻 구현 예시
        </h2>
        <Card>
          <CardContent className="p-6">
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <CodeBlock size="sm">
                <code>{`// Action Context 정의
const { Provider, useActionDispatch, useActionHandler } = 
  createActionContext<BasicMouseActions>('BasicMouse');

// Action Handler 등록
useActionHandler('handleMouseClick', async (payload) => {
  const logEntry = {
    id: \`click_\${Date.now()}\`,
    type: 'Click',
    details: \`\${payload.button} at (\${payload.x}, \${payload.y})\`,
    timestamp: Date.now()
  };
  setEventLog(prev => [...prev, logEntry]);
  setClickCount(prev => prev + 1);
});

// 이벤트 디스패치
const handleMouseClick = (e: React.MouseEvent) => {
  const rect = containerRef.current?.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  dispatch('handleMouseClick', { 
    x: Math.round(x), 
    y: Math.round(y), 
    button: 'Left', 
    target: 'interactive-area' 
  });
};`}</code>
              </CodeBlock>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
