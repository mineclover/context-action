/**
 * @fileoverview Clean Mouse Events View - 순수한 View 컴포넌트
 *
 * 데이터 핸들링은 전혀 하지 않고 순수하게 렌더링만 담당
 */

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  CodeBlock,
  CodeExample,
  DemoCard,
} from '../../../../components/ui';

/**
 * 마우스 이벤트 핸들러 인터페이스 (외부에서 주입)
 */
export interface MouseEventHandlers {
  onMouseMove: (x: number, y: number) => void;
  onMouseClick: (x: number, y: number, button: number) => void;
  onMouseEnter: (x: number, y: number) => void;
  onMouseLeave: (x: number, y: number) => void;
  onReset: () => void;
}

/**
 * DOM 요소 참조 인터페이스
 */
export interface MouseViewElements {
  cursor: HTMLDivElement | null;
  trail: HTMLDivElement | null;
  pathSvg: SVGPathElement | null;
  clickContainer: HTMLDivElement | null;
  statusPosition: HTMLSpanElement | null;
  statusMoves: HTMLSpanElement | null;
  statusClicks: HTMLSpanElement | null;
  statusVelocity: HTMLSpanElement | null;
  statusMoving: HTMLSpanElement | null;
  statusInside: HTMLSpanElement | null;
  statusLastActivity: HTMLSpanElement | null;
}

export interface CleanMouseEventsViewProps {
  handlers: MouseEventHandlers;
  onElementsReady?: (elements: MouseViewElements) => void;
}

/**
 * 마우스 추적 영역 컴포넌트
 */
const MouseTrackingArea = memo(
  ({
    handlers,
    onElementsReady,
    showGuide,
  }: {
    handlers: MouseEventHandlers;
    onElementsReady?: (elements: MouseViewElements) => void;
    showGuide?: boolean;
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const cursorRef = useRef<HTMLDivElement>(null);
    const trailRef = useRef<HTMLDivElement>(null);
    const pathRef = useRef<SVGPathElement>(null);
    const clickContainerRef = useRef<HTMLDivElement>(null);

    // 상태 표시 refs
    const positionRef = useRef<HTMLSpanElement>(null);
    const movesRef = useRef<HTMLSpanElement>(null);
    const clicksRef = useRef<HTMLSpanElement>(null);
    const velocityRef = useRef<HTMLSpanElement>(null);
    const statusRef = useRef<HTMLSpanElement>(null);
    const insideRef = useRef<HTMLSpanElement>(null);
    const lastActivityRef = useRef<HTMLSpanElement>(null);

    // 요소들이 준비되면 외부에 전달
    useEffect(() => {
      if (onElementsReady) {
        onElementsReady({
          cursor: cursorRef.current,
          trail: trailRef.current,
          pathSvg: pathRef.current,
          clickContainer: clickContainerRef.current,
          statusPosition: positionRef.current,
          statusMoves: movesRef.current,
          statusClicks: clicksRef.current,
          statusVelocity: velocityRef.current,
          statusMoving: statusRef.current,
          statusInside: insideRef.current,
          statusLastActivity: lastActivityRef.current,
        });
      }
    }, [onElementsReady]);

    // 마우스 이벤트 핸들러들
    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.round(e.clientX - rect.left);
        const y = Math.round(e.clientY - rect.top);

        handlers.onMouseMove(x, y);
      },
      [handlers]
    );

    const handleMouseClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.round(e.clientX - rect.left);
        const y = Math.round(e.clientY - rect.top);

        handlers.onMouseClick(x, y, e.button);
      },
      [handlers]
    );

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.round(e.clientX - rect.left);
        const y = Math.round(e.clientY - rect.top);

        handlers.onMouseEnter(x, y);
      },
      [handlers]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.round(e.clientX - rect.left);
        const y = Math.round(e.clientY - rect.top);

        handlers.onMouseLeave(x, y);
      },
      [handlers]
    );

    return (
      <div
        ref={containerRef}
        className="relative h-[400px] border-2 border-gray-300 rounded-lg bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          containIntrinsicSize: '100% 400px',
          willChange: 'auto',
        }}
      >
        {/* 상태 정보 패널 */}
        <div className="absolute top-3 left-3 bg-white bg-opacity-95 p-3 rounded-lg shadow-sm border min-w-[200px] z-10">
          <div className="text-sm space-y-1">
            <div className="flex justify-between gap-3">
              <span className="text-gray-600">Position:</span>
              <span ref={positionRef} className="font-mono text-blue-600">
                (-999, -999)
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-600">Moves:</span>
              <span ref={movesRef} className="font-mono text-green-600">
                0
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-600">Clicks:</span>
              <span ref={clicksRef} className="font-mono text-purple-600">
                0
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-600">Velocity:</span>
              <span ref={velocityRef} className="font-mono text-red-600">
                0.00 px/ms
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-600">Status:</span>
              <span ref={statusRef} className="font-mono text-gray-400">
                ⏸️ Idle
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-600">Inside:</span>
              <span ref={insideRef} className="font-mono text-orange-600">
                ✗ No
              </span>
            </div>
            <div className="flex justify-between gap-3 text-xs text-gray-500 border-t pt-1">
              <span>Renderer:</span>
              <span className="text-green-600">Clean Architecture</span>
            </div>
          </div>
        </div>

        {/* 커서 트레일 */}
        <div
          ref={trailRef}
          className="absolute w-6 h-6 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 50%, transparent 100%)',
            zIndex: 1,
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            opacity: 0,
            transform: 'translateZ(0)',
          }}
        />

        {/* 메인 커서 */}
        <div
          ref={cursorRef}
          className="absolute w-4 h-4 rounded-full pointer-events-none border-2 border-white"
          style={{
            background:
              'radial-gradient(circle, #ef4444 0%, #dc2626 70%, #b91c1c 100%)',
            boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)',
            zIndex: 2,
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
            opacity: 0,
          }}
        >
          <div className="absolute inset-1 bg-white rounded-full opacity-80" />
        </div>

        {/* SVG 패스 */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1, willChange: 'auto' }}
        >
          <path
            ref={pathRef}
            stroke="url(#pathGradient)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))',
              opacity: 0.8,
            }}
          />

          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.8)" />
              <stop offset="50%" stopColor="rgba(147, 51, 234, 0.6)" />
              <stop offset="100%" stopColor="rgba(236, 72, 153, 0.4)" />
            </linearGradient>
          </defs>
        </svg>

        {/* 클릭 애니메이션 컨테이너 */}
        <div
          ref={clickContainerRef}
          className="absolute inset-0 pointer-events-none"
        />

        {/* 마지막 활동 시간 */}
        <span
          ref={lastActivityRef}
          className="absolute bottom-1 right-4 text-xs text-gray-500"
          style={{ display: 'none' }}
        ></span>

        {/* 활동 가이드 */}
        {showGuide && (
          <div className="absolute inset-0 flex items-center justify-center z-5 pointer-events-none">
            <div className="text-center text-gray-500">
              <div className="text-lg mb-2">🖱️</div>
              <div className="text-sm">
                Move your mouse and click to see clean architecture in action
              </div>
              <div className="text-xs mt-1 opacity-75">
                View → Controller → Service → Render pipeline
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

/**
 * 순수한 마우스 이벤트 View 컴포넌트
 */
const CleanMouseEventsViewComponent = ({
  handlers,
  onElementsReady,
}: CleanMouseEventsViewProps) => {
  const [hasActivity, setHasActivity] = useState(false);

  // 활동 상태 업데이트를 외부에서 호출할 수 있도록 전역 함수 등록
  useEffect(() => {
    (window as any).__setHasActivity = setHasActivity;
    return () => {
      delete (window as any).__setHasActivity;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* 메인 마우스 이벤트 UI */}
      <DemoCard>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            🖱️ Clean Architecture Mouse Events
          </h3>
          <p className="text-sm text-gray-600">
            This demo showcases <strong>Clean Architecture</strong> with
            complete separation of concerns. The View component handles only
            rendering, while business logic is managed by separate services.
            Achieves <strong>60fps tracking</strong> with maintainable, testable
            code structure.
          </p>
        </div>

        <div className="space-y-4">
          {/* 마우스 추적 영역 */}
          <MouseTrackingArea
            handlers={handlers}
            onElementsReady={onElementsReady}
            showGuide={!hasActivity}
          />

          {/* 컨트롤 */}
          <div className="flex justify-between items-center">
            <Button onClick={handlers.onReset} variant="secondary" size="sm">
              Reset Tracking
            </Button>

            <div className="text-xs text-gray-500">
              <strong className="text-green-600">Status:</strong> Clean
              Architecture ✅
            </div>
          </div>

          {/* 성능 통계 - 정적 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">Separated</div>
              <div className="text-xs text-gray-600">Path Logic</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">Isolated</div>
              <div className="text-xs text-gray-600">Render Logic</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">Clean</div>
              <div className="text-xs text-gray-600">View Component</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-orange-600">0</div>
              <div className="text-xs text-gray-600">
                Business Logic in View
              </div>
            </div>
          </div>
        </div>
      </DemoCard>

      {/* Clean Architecture 설명 */}
      <DemoCard variant="info">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🏗️ Clean Architecture Implementation
        </h3>
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong className="text-gray-900">Separation of Concerns:</strong>
            <br />
            This implementation follows Clean Architecture principles with clear
            boundaries between View, Controller, Service, and Data layers. Each
            layer has a single responsibility and depends only on abstractions.
          </p>
          <p>
            <strong className="text-gray-900">Architecture Layers:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <strong>View:</strong> Pure rendering, no business logic
            </li>
            <li>
              <strong>Controller:</strong> Orchestrates business operations
            </li>
            <li>
              <strong>Path Service:</strong> Manages mouse path data
            </li>
            <li>
              <strong>Render Service:</strong> Handles DOM manipulation
            </li>
            <li>
              <strong>Actions:</strong> Type-safe action definitions
            </li>
          </ul>
          <p>
            <strong className="text-gray-900">Benefits:</strong>
            <br />
            Testable, maintainable, and scalable code structure with clear
            dependencies and easy mockability for unit testing.
          </p>
        </div>
      </DemoCard>

      {/* 코드 예제 */}
      <CodeExample title="Clean Architecture Pattern">
        <CodeBlock>
          {`// Clean separation of concerns
// 1. View - Pure rendering
const CleanMouseEventsView = ({ handlers, onElementsReady }) => {
  return (
    <MouseTrackingArea 
      handlers={handlers}
      onElementsReady={onElementsReady}
    />
  );
};

// 2. Controller - Business logic orchestration
class MouseController {
  constructor(pathService, renderService) {
    this.pathService = pathService;
    this.renderService = renderService;
  }
  
  handleMove(position, timestamp) {
    const pathData = this.pathService.updatePosition(position, timestamp);
    this.renderService.renderCursorPosition(pathData.currentPosition);
    this.renderService.renderPath(this.pathService.getValidPath());
  }
}

// 3. Services - Specialized responsibilities
class MousePathService {
  updatePosition(position, timestamp) {
    // Pure data management logic
    return this.computePathData(position, timestamp);
  }
}

class MouseRenderService {
  renderCursorPosition(position) {
    // Pure rendering logic
    this.cursor.style.transform = \`translate3d(\${position.x}px, \${position.y}px, 0)\`;
  }
}

// 4. Usage - Dependency injection
const controller = new MouseController(
  new MousePathService(),
  new MouseRenderService()
);

const handlers = {
  onMouseMove: (x, y) => controller.handleMove({x, y}, Date.now()),
  onMouseClick: (x, y, button) => controller.handleClick({x, y}, button, Date.now()),
  onReset: () => controller.handleReset()
};`}
        </CodeBlock>
      </CodeExample>
    </div>
  );
};

// 메모화된 컴포넌트 - props가 변경될 때만 리렌더링
export const CleanMouseEventsView = memo(CleanMouseEventsViewComponent);
