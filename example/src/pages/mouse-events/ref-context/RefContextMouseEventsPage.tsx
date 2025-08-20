/**
 * @fileoverview RefContext Mouse Events Page
 * 
 * createRefContext를 활용한 관심사 분리 기반 마우스 이벤트 시스템
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { PageWithLogMonitor } from '../../../components/LogMonitor';
import { Badge, DemoCard, CodeBlock, CodeExample } from '../../../components/ui';
import {
  MousePositionProvider,
  MouseCursor,
  MouseTrail,
  PositionDisplay,
  useMousePositionUpdater,
} from './contexts/MousePositionRefContext';
import {
  VisualEffectsProvider,
  ClickEffectsContainer,
  MousePathSvg,
  VisualEffectsControls,
  useVisualEffectsUpdater,
} from './contexts/VisualEffectsRefContext';
import {
  PerformanceProvider,
  PerformanceMetricsPanel,
  PerformanceControls,
  usePerformanceUpdater,
} from './contexts/PerformanceRefContext';
import { MousePosition, MouseClick } from './types/MouseRefTypes';

// ============================================================================
// Main Demo Component
// ============================================================================

/**
 * RefContext 통합 마우스 이벤트 데모 컴포넌트
 */
function RefContextMouseDemo() {
  // RefContext 훅들
  const {
    updatePosition: updateMousePosition,
    resetPosition: resetMousePosition,
    showCursor,
    getCurrentPosition,
  } = useMousePositionUpdater();

  const {
    addPathPoint,
    addClickEffect,
    resetEffects,
  } = useVisualEffectsUpdater();

  const {
    recordMouseMove,
    recordMouseClick,
    resetMetrics,
  } = usePerformanceUpdater();

  // 인터랙션 상태
  const [isActive, setIsActive] = React.useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInsideRef = useRef(false);

  // 통합 마우스 이벤트 핸들러
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const position: MousePosition = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    const timestamp = performance.now();

    // 각 RefContext에 업데이트 전파
    updateMousePosition(position, timestamp);
    addPathPoint(position);
    
    // 속도 계산을 위해 현재 위치 가져오기
    const currentPos = getCurrentPosition();
    const velocity = Math.sqrt(
      Math.pow(position.x - currentPos.x, 2) + Math.pow(position.y - currentPos.y, 2)
    );
    recordMouseMove(velocity);

    // 활동 상태 업데이트
    if (!isActive) {
      setIsActive(true);
    }
  }, [updateMousePosition, addPathPoint, recordMouseMove, getCurrentPosition, isActive]);

  const handleMouseClick = useCallback((event: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const click: MouseClick = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      timestamp: performance.now(),
      button: event.button,
    };

    // 각 RefContext에 업데이트 전파
    addClickEffect(click);
    recordMouseClick();
  }, [addClickEffect, recordMouseClick]);

  const handleMouseEnter = useCallback(() => {
    isInsideRef.current = true;
    showCursor(true);
  }, [showCursor]);

  const handleMouseLeave = useCallback(() => {
    isInsideRef.current = false;
    showCursor(false);
  }, [showCursor]);

  // 통합 리셋 핸들러
  const handleReset = useCallback(() => {
    resetMousePosition();
    resetEffects();
    resetMetrics();
    setIsActive(false);
  }, [resetMousePosition, resetEffects, resetMetrics]);

  return (
    <div className="space-y-6">
      {/* 메인 인터랙션 영역 */}
      <DemoCard>
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            🎯 RefContext-Based Mouse Events
          </h3>
          <p className="text-gray-600 text-sm">
            <strong>createRefContext</strong>를 활용한 관심사 분리 아키텍처.
            각각의 RefContext가 독립적으로 마우스 위치, 시각 효과, 성능 메트릭을 관리합니다.
          </p>
          
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline" className="bg-blue-50 text-blue-800">
              🎯 Position Management
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-800">
              🎨 Visual Effects
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-800">
              📊 Performance Metrics
            </Badge>
            <Badge variant="outline" className="bg-orange-50 text-orange-800">
              🔧 Zero React Re-renders
            </Badge>
          </div>
        </div>

        {/* 인터랙션 컨테이너 */}
        <div
          ref={containerRef}
          className="relative h-96 border-2 border-dashed border-gray-300 rounded-lg bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden cursor-none"
          onMouseMove={handleMouseMove}
          onClick={handleMouseClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            touchAction: 'none',
            userSelect: 'none',
          }}
        >
          {/* 마우스 커서 */}
          <MouseCursor />
          
          {/* 마우스 트레일 */}
          <MouseTrail />
          
          {/* 클릭 이펙트 컨테이너 */}
          <ClickEffectsContainer />
          
          {/* 마우스 경로 SVG */}
          <MousePathSvg width={800} height={384} />

          {/* 가이드 텍스트 */}
          {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-center text-gray-500 bg-white bg-opacity-90 p-6 rounded-lg">
                <div className="text-2xl mb-2">🖱️</div>
                <div className="text-lg font-medium mb-1">
                  RefContext를 체험해보세요
                </div>
                <div className="text-sm">
                  마우스를 움직이고 클릭하여 각 RefContext의 독립적인 관리를 확인하세요
                </div>
              </div>
            </div>
          )}

          {/* 실시간 위치 표시 */}
          <div className="absolute top-3 left-3 bg-white bg-opacity-90 px-3 py-2 rounded-lg text-xs">
            <PositionDisplay />
          </div>

          {/* 리셋 버튼 */}
          <button
            onClick={handleReset}
            className="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
          >
            Reset All
          </button>
        </div>
      </DemoCard>

      {/* 성능 메트릭 패널 */}
      <PerformanceMetricsPanel />

      {/* 컨트롤 패널들 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VisualEffectsControls />
        <PerformanceControls />
      </div>

      {/* 아키텍처 설명 */}
      <DemoCard variant="info">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🏗️ RefContext 관심사 분리 아키텍처
        </h3>
        
        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">🎯 Mouse Position RefContext</h4>
            <p className="mb-2">
              <strong>책임</strong>: 마우스 커서 위치 추적 및 시각적 표시
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>커서 및 트레일 DOM 요소 직접 관리</li>
              <li>하드웨어 가속을 활용한 transform3d 업데이트</li>
              <li>쓰로틀링을 통한 60fps 성능 보장</li>
              <li>속도 계산 및 위치 히스토리 관리</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">🎨 Visual Effects RefContext</h4>
            <p className="mb-2">
              <strong>책임</strong>: 클릭 이펙트 및 마우스 경로 렌더링
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>SVG 기반 부드러운 경로 렌더링</li>
              <li>CSS 애니메이션 기반 클릭 이펙트</li>
              <li>동적 DOM 요소 생성 및 정리</li>
              <li>시각적 설정의 실시간 변경 지원</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">📊 Performance RefContext</h4>
            <p className="mb-2">
              <strong>책임</strong>: 성능 메트릭 수집 및 실시간 표시
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>FPS 측정 및 frame time 분석</li>
              <li>마우스 이벤트 통계 수집</li>
              <li>성능 데이터의 실시간 DOM 업데이트</li>
              <li>메트릭 내보내기 및 로깅 기능</li>
            </ul>
          </div>
        </div>
      </DemoCard>

      {/* 코드 예제 */}
      <CodeExample title="RefContext 사용 패턴">
        <CodeBlock>
          {`// 1. RefContext 생성 - 각 관심사별로 독립적
const {
  Provider: MousePositionRefProvider,
  useRefContext: useMousePositionRef,
  useRefManager: useMousePositionRefManager,
} = createRefContext('MousePosition', {
  refs: defaultRefs,
  config: defaultConfig,
});

// 2. 커스텀 훅으로 비즈니스 로직 캡슐화
export function useMousePositionUpdater() {
  const { refs, config } = useMousePositionRef();
  
  const updatePosition = useCallback((position: MousePosition, timestamp: number) => {
    // DOM 직접 조작으로 React 리렌더링 우회
    if (refs.cursor) {
      refs.cursor.style.transform = 
        \`translate3d(\${position.x}px, \${position.y}px, 0)\`;
    }
  }, [refs, config]);

  return { updatePosition };
}

// 3. 컴포넌트에서 관심사별 훅 사용
function RefContextMouseDemo() {
  const { updatePosition } = useMousePositionUpdater();
  const { addClickEffect } = useVisualEffectsUpdater();
  const { recordMouseMove } = usePerformanceUpdater();

  const handleMouseMove = useCallback((event) => {
    const position = getMousePosition(event);
    
    // 각 RefContext에 독립적으로 업데이트 전파
    updatePosition(position, performance.now());
    addPathPoint(position);
    recordMouseMove(velocity);
  }, []);

  return (
    <MousePositionProvider>
      <VisualEffectsProvider>
        <PerformanceProvider>
          {/* 각 Provider가 독립적으로 관련 상태만 관리 */}
          <div onMouseMove={handleMouseMove}>
            <MouseCursor />     {/* Position RefContext */}
            <MousePathSvg />    {/* Visual Effects RefContext */}
            <MetricsPanel />    {/* Performance RefContext */}
          </div>
        </PerformanceProvider>
      </VisualEffectsProvider>
    </MousePositionProvider>
  );
}`}
        </CodeBlock>
      </CodeExample>

      {/* 장점 비교 */}
      <DemoCard variant="info">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ✨ RefContext 패턴의 장점
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-semibold text-green-600 mb-2">RefContext 패턴</h4>
            <ul className="space-y-1 text-gray-700">
              <li>✅ <strong>관심사 분리</strong>: 각 RefContext가 명확한 책임</li>
              <li>✅ <strong>독립적 관리</strong>: 서로 간섭 없는 상태 관리</li>
              <li>✅ <strong>타입 안전성</strong>: createRefContext의 타입 지원</li>
              <li>✅ <strong>테스트 용이성</strong>: 각 Context 독립적 테스트</li>
              <li>✅ <strong>재사용성</strong>: Context별 독립적 재사용</li>
              <li>✅ <strong>설정 분리</strong>: 각 도메인별 설정 관리</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-orange-600 mb-2">단일 Context 패턴</h4>
            <ul className="space-y-1 text-gray-700">
              <li>❌ <strong>책임 혼재</strong>: 하나의 Context에 모든 로직</li>
              <li>❌ <strong>강한 결합</strong>: 서로 다른 관심사 간 의존성</li>
              <li>❌ <strong>복잡성 증가</strong>: 단일 타입에 모든 것 포함</li>
              <li>❌ <strong>테스트 어려움</strong>: 전체를 함께 테스트해야 함</li>
              <li>❌ <strong>재사용 제한</strong>: 전체 Context만 재사용 가능</li>
              <li>❌ <strong>설정 복잡화</strong>: 모든 설정이 한 곳에 집중</li>
            </ul>
          </div>
        </div>
      </DemoCard>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export function RefContextMouseEventsPage() {
  return (
    <PageWithLogMonitor
      pageId="ref-context-mouse-events"
      title="RefContext Mouse Events"
      initialConfig={{ enableToast: false, maxLogs: 30 }}
    >
      <div className="page-container">
        <header className="page-header">
          <h1>🎯 RefContext Mouse Events</h1>
          <p className="page-description">
            <strong>createRefContext</strong>를 활용한 관심사 분리 기반 마우스 이벤트 시스템.
            위치 관리, 시각 효과, 성능 메트릭이 각각 독립적인 RefContext로 분리되어
            관리되며, React 리렌더링 없이 최고 성능을 달성합니다.
          </p>
        </header>

        {/* 모든 RefContext Provider로 감싸기 */}
        <MousePositionProvider>
          <VisualEffectsProvider>
            <PerformanceProvider>
              <RefContextMouseDemo />
            </PerformanceProvider>
          </VisualEffectsProvider>
        </MousePositionProvider>
      </div>
    </PageWithLogMonitor>
  );
}