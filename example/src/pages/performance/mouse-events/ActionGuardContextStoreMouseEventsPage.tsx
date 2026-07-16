/**
 * @fileoverview Context Store Mouse Events Demo Page
 * Context-Action framework의 Store 기반 마우스 이벤트 처리 데모
 */

import { useStoreValue } from '@context-action/react';
import React, { useCallback } from 'react';
import { PageWithLogMonitor } from '@/components/LogMonitor';
import { Badge, Card, CardContent } from '@/components/ui';
import { useActionGuardMouseEventsActions } from './actions/useActionGuardMouseEventsActions';
import {
  ActionGuardMouseEventsActionProvider,
  ActionGuardMouseEventsStoreProvider,
  useActionGuardMouseEventsStore,
} from './contexts/ActionGuardMouseEventsContexts';
import { ActionGuardMouseEventsHandlerRegistry } from './handlers/ActionGuardMouseEventsHandlerRegistry';

// 메인 컴포넌트
export function ContextStoreMouseEventsPage() {
  return (
    <PageWithLogMonitor
      pageId="context-store-mouse-events"
      title="Context Store Mouse Events"
      initialConfig={{ enableToast: true, maxLogs: 50 }}
    >
      <div className="page-container">
        <header className="page-header">
          <h1>🏪 Context Store Mouse Events Demo</h1>
          <p className="page-description">
            Context-Action 프레임워크의{' '}
            <strong>Store 기반 마우스 이벤트 처리</strong> 시스템입니다. 실시간
            마우스 추적, 클릭 기록, 패턴 분석을 통해 Store와 Action의 완벽한
            통합을 보여줍니다.
          </p>

          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline" className="bg-blue-50 text-blue-800">
              🖱️ 실시간 추적
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-800">
              📊 데이터 수집
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-800">
              🎯 Store 통합
            </Badge>
            <Badge variant="outline" className="bg-orange-50 text-orange-800">
              ⚡ Action Pipeline
            </Badge>
          </div>
        </header>

        <ActionGuardMouseEventsActionProvider>
          <ActionGuardMouseEventsStoreProvider>
            <ActionGuardMouseEventsHandlerRegistry>
              <MouseEventsDemo />
            </ActionGuardMouseEventsHandlerRegistry>
          </ActionGuardMouseEventsStoreProvider>
        </ActionGuardMouseEventsActionProvider>
      </div>
    </PageWithLogMonitor>
  );
}

// 데모 컴포넌트
function MouseEventsDemo() {
  const mousePosition = useStoreValue(
    useActionGuardMouseEventsStore('mousePosition')
  );
  const mouseClicks = useStoreValue(
    useActionGuardMouseEventsStore('mouseClicks')
  );
  const mousePath = useStoreValue(useActionGuardMouseEventsStore('mousePath'));
  const trackingEnabled = useStoreValue(
    useActionGuardMouseEventsStore('trackingEnabled')
  );
  const pathRecording = useStoreValue(
    useActionGuardMouseEventsStore('pathRecording')
  );
  const {
    dispatchMouseMove,
    dispatchMouseClick,
    recordMousePathPoint,
    clearMouseData,
    clearMousePath,
    setTrackingMode,
    setPathRecording,
  } = useActionGuardMouseEventsActions();

  // 마우스 이벤트 핸들러들
  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      dispatchMouseMove(Math.round(x), Math.round(y));

      // 패스 추적이 활성화된 경우
      if (pathRecording) {
        recordMousePathPoint({ x, y, timestamp: Date.now() });
      }
    },
    [dispatchMouseMove, pathRecording, recordMousePathPoint]
  );

  const handleMouseClick = useCallback(
    (event: React.MouseEvent) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      dispatchMouseClick({
        x: Math.round(x),
        y: Math.round(y),
        button: event.button,
        timestamp: Date.now(),
      });
    },
    [dispatchMouseClick]
  );

  const toggleTracking = useCallback(() => {
    setTrackingMode(!trackingEnabled);
  }, [setTrackingMode, trackingEnabled]);

  const togglePathRecording = useCallback(() => {
    const newRecording = !pathRecording;
    setPathRecording(newRecording);
    if (pathRecording) {
      // 녹화 중지 시 패스 초기화
      clearMousePath();
    }
  }, [clearMousePath, pathRecording, setPathRecording]);

  const clearData = useCallback(() => {
    clearMouseData();
  }, [clearMouseData]);

  return (
    <div className="space-y-6">
      {/* 컨트롤 패널 */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🎛️ 컨트롤 패널
          </h3>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={toggleTracking}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                trackingEnabled
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {trackingEnabled ? '🟢 추적 중' : '⚪ 추적 시작'}
            </button>

            <button
              onClick={togglePathRecording}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                pathRecording
                  ? 'bg-purple-500 text-white hover:bg-purple-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {pathRecording ? '🟣 패스 녹화 중' : '⚪ 패스 녹화 시작'}
            </button>

            <button
              onClick={clearData}
              className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              🗑️ 데이터 초기화
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 마우스 추적 영역 */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🖱️ 마우스 추적 영역
          </h3>

          <div
            className="relative bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-crosshair"
            style={{ height: '400px' }}
            onMouseMove={handleMouseMove}
            onClick={handleMouseClick}
          >
            <div className="absolute top-2 left-2 text-sm text-gray-600">
              마우스를 움직이고 클릭해보세요!
            </div>

            {/* 현재 마우스 위치 표시 */}
            {trackingEnabled && (
              <div
                className="absolute w-4 h-4 bg-red-500 rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2 shadow-lg"
                style={{
                  left: mousePosition.x,
                  top: mousePosition.y,
                  transition: 'all 0.1s ease-out',
                }}
              />
            )}

            {/* 클릭 위치 표시 */}
            {mouseClicks.map((click, index) => (
              <div
                key={`${click.x}-${click.y}-${click.timestamp}`}
                className="absolute w-3 h-3 bg-green-500 rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2 animate-ping"
                style={{
                  left: click.x,
                  top: click.y,
                  opacity: Math.max(0.1, 1 - index * 0.05),
                }}
              />
            ))}

            {/* 마우스 패스 표시 */}
            {pathRecording && mousePath.length > 1 && (
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{ width: '100%', height: '100%' }}
              >
                <path
                  d={`M ${mousePath.map((point) => `${point.x},${point.y}`).join(' L ')}`}
                  stroke="#8b5cf6"
                  strokeWidth="2"
                  fill="none"
                  opacity="0.7"
                />
              </svg>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 데이터 현황 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm text-gray-600 mb-2">
              현재 위치
            </h4>
            <div className="text-2xl font-bold text-blue-600">
              {mousePosition.x}, {mousePosition.y}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm text-gray-600 mb-2">
              총 클릭 수
            </h4>
            <div className="text-2xl font-bold text-green-600">
              {mouseClicks.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm text-gray-600 mb-2">
              패스 포인트
            </h4>
            <div className="text-2xl font-bold text-purple-600">
              {mousePath.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm text-gray-600 mb-2">상태</h4>
            <div
              className={`text-2xl font-bold ${trackingEnabled ? 'text-green-600' : 'text-gray-400'}`}
            >
              {trackingEnabled ? '활성' : '비활성'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 클릭 기록 */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📝 클릭 기록
          </h3>

          <div className="max-h-64 overflow-y-auto">
            {mouseClicks.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <div className="mb-2">🖱️</div>
                <div>클릭 기록이 없습니다</div>
                <div className="text-sm">위 영역을 클릭해보세요!</div>
              </div>
            ) : (
              <div className="space-y-2">
                {mouseClicks.reverse().map((click, index) => (
                  <div
                    key={`${click.timestamp}-${index}`}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono bg-white px-2 py-1 rounded text-xs">
                        {click.x}, {click.y}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          click.button === 0
                            ? 'bg-blue-100 text-blue-700'
                            : click.button === 1
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {click.button === 0
                          ? 'Left'
                          : click.button === 1
                            ? 'Middle'
                            : 'Right'}
                      </span>
                    </div>
                    <span className="text-gray-500 font-mono text-xs">
                      {new Date(click.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 기술적 설명 */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🛠️ 구현 세부사항
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-green-600 mb-3">
                Store 기반 상태 관리
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>
                  • <strong>mousePositionStore</strong>: 실시간 마우스 위치
                </li>
                <li>
                  • <strong>mouseClicksStore</strong>: 클릭 이벤트 기록
                </li>
                <li>
                  • <strong>mousePathStore</strong>: 마우스 경로 추적
                </li>
                <li>
                  • <strong>trackingEnabledStore</strong>: 추적 모드 상태
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-blue-600 mb-3">
                Action Pipeline
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>
                  • <strong>updateMousePosition</strong>: 위치 업데이트
                </li>
                <li>
                  • <strong>recordMouseClick</strong>: 클릭 기록
                </li>
                <li>
                  • <strong>recordMousePathPoint</strong>: 패스 추적
                </li>
                <li>
                  • <strong>setTrackingMode</strong>: 모드 전환
                </li>
                <li>
                  • <strong>setPathRecording</strong>: 패스 녹화 전환
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ContextStoreMouseEventsPage;
