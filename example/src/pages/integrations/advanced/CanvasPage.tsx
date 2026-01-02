/**
 * @fileoverview 모듈화된 Canvas Element 관리 예제
 * Context-Action 프레임워크를 활용한 완전한 Canvas 그리기 시스템
 */

import { useCallback, useRef, useState } from 'react';
import { CodeBlock } from '@/components/ui';
import { Canvas, type CanvasEvent } from './canvas/Canvas';
import { CanvasProvider } from './canvas/CanvasContext';
import { CanvasStatus } from './canvas/CanvasStatus';
import { CanvasToolbar } from './canvas/CanvasToolbar';

/**
 * 모듈화된 Advanced Canvas Example 컴포넌트
 *
 * 이제 다음과 같이 분리되었습니다:
 * - CanvasContext: 상태 관리 (Context-Action 패턴)
 * - useCanvasDrawing: 드로잉 기능 훅
 * - useCanvasEvents: 이벤트 핸들링 훅
 * - Canvas: 실제 Canvas 렌더링
 * - CanvasToolbar: 도구 및 설정 UI
 * - CanvasStatus: 상태 표시 UI
 */
function AdvancedCanvasContent() {
  const [canvasFocused, setCanvasFocused] = useState(false);
  const [events, setEvents] = useState<CanvasEvent[]>([]);
  const _canvasRef = useRef<{ focusCanvas: () => void }>(null);

  // 이벤트 로깅
  const handleEventLog = useCallback((event: CanvasEvent) => {
    setEvents((prev) => [...prev, event]);
  }, []);

  // 테스트 액션 로깅
  const handleTestAction = useCallback((action: string, details: string) => {
    const testEvent: CanvasEvent = {
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: 'mode_change', // 기본 타입, 실제로는 action에 따라 다름
      details: `[TEST] ${details}`,
      data: { action, source: 'toolbar' },
    };
    setEvents((prev) => [...prev, testEvent]);
  }, []);

  // Focus Canvas 함수
  const handleFocusCanvas = useCallback(() => {
    // Canvas 컨테이너 요소를 찾아서 포커스
    const canvasContainer = document.querySelector(
      '[tabindex="0"]'
    ) as HTMLElement;
    if (canvasContainer) {
      canvasContainer.focus();
      const testEvent: CanvasEvent = {
        id: `focus_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        type: 'focus',
        details: '[TEST] Focus 버튼 클릭 - Canvas 포커스 성공',
        data: { source: 'focus_button', focused: true },
      };
      setEvents((prev) => [...prev, testEvent]);
    } else {
      const testEvent: CanvasEvent = {
        id: `focus_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        type: 'focus',
        details: '[TEST] Focus 버튼 클릭 - Canvas 요소를 찾을 수 없음',
        data: {
          source: 'focus_button',
          focused: false,
          error: 'canvas_not_found',
        },
      };
      setEvents((prev) => [...prev, testEvent]);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Canvas Ref Demo</h1>
        <p className="text-gray-600 mt-2">
          createRefContext를 활용한 Canvas 기반 실시간 그래픽 에디터
        </p>
      </div>

      {/* Feature Overview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🎨</span>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              Canvas Ref Management Demo
            </h2>
            <p className="text-blue-800 mb-3">
              <code className="bg-blue-100 px-2 py-1 rounded">
                createRefContext
              </code>
              를 활용한 Canvas 기반 실시간 그래픽 에디터입니다. DOM element
              관리와 ref 시스템의 실제 활용 사례를 보여줍니다.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  🎯 핵심 기능
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Rectangle, Circle, Line, Freehand 그리기</li>
                  <li>• 실시간 도형 선택 및 조작</li>
                  <li>• 드래그 앤 드롭 도형 이동</li>
                  <li>• 색상 및 스타일 커스터마이징</li>
                  <li>• Canvas element 상태 관리</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  ⚡ Ref 관리 기술
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• createRefContext로 Canvas ref 관리</li>
                  <li>• 도형별 element 등록/해제</li>
                  <li>• 선택/포커스 상태 추적</li>
                  <li>• 메모리 누수 방지 자동 정리</li>
                  <li>• 타입 안전한 ref 접근</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Toolbar - 상단 가로 배치 */}
      <div className="mb-6">
        <CanvasToolbar
          onFocusCanvas={handleFocusCanvas}
          onTestAction={handleTestAction}
        />
      </div>

      {/* Canvas Area */}
      <div className="mb-6">
        <div className="bg-gray-50 p-4 rounded-lg flex justify-center">
          <Canvas
            width={800}
            height={600}
            onFocusChange={setCanvasFocused}
            onEventLog={handleEventLog}
          />
        </div>
      </div>

      {/* Canvas Status - Canvas 아래 */}
      <div className="mb-6">
        <CanvasStatus
          canvasFocused={canvasFocused}
          events={events}
          onSelectShape={(shapeId) => {
            handleTestAction(
              'select_from_status',
              `Status 패널에서 도형 선택: ${shapeId.slice(-4)}`
            );
          }}
        />
      </div>

      {/* Help Section */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          🚀 완전한 테스트 환경
        </h2>
        <div className="bg-white rounded-lg p-4 mb-4 border border-green-200">
          <h3 className="font-semibold text-green-800 mb-2">
            ✅ 이제 테스트할 수 있는 기능들:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <ul className="text-gray-700 space-y-1">
              <li>
                • <strong>실시간 상태 시각화</strong> - 모든 상태 변화가 즉시
                반영됩니다
              </li>
              <li>
                • <strong>이벤트 로그</strong> - 모든 액션이 타임스탬프와 함께
                기록됩니다
              </li>
              <li>
                • <strong>Focus 버튼</strong> - Canvas 포커스를 명확히 제어할 수
                있습니다
              </li>
              <li>
                • <strong>도형 상세 정보</strong> - 각 도형의 ID, 위치, 크기
                등을 확인할 수 있습니다
              </li>
            </ul>
            <ul className="text-gray-700 space-y-1">
              <li>
                • <strong>인터랙티브 도형 선택</strong> - Status 패널에서 직접
                도형을 선택할 수 있습니다
              </li>
              <li>
                • <strong>시각적 피드백</strong> - 드래그, 선택, 포커스 상태가
                시각적으로 표시됩니다
              </li>
              <li>
                • <strong>완전한 키보드 지원</strong> - Delete, ESC 키로 도형
                조작이 가능합니다
              </li>
              <li>
                • <strong>디버깅 정보</strong> - 개발자가 내부 동작을 추적할 수
                있습니다
              </li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">🎨 Drawing</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>
                • <strong>Click & Drag:</strong> Create shapes on canvas
              </li>
              <li>
                • <strong>Select Mode:</strong> Click shapes to select them
              </li>
              <li>
                • <strong>Draw Mode:</strong> Create new shapes
              </li>
              <li>
                • <strong>Real-time Preview:</strong> See shapes as you draw
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">⌨️ Keyboard</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>
                • <strong>Delete/Backspace:</strong> Remove selected shape
              </li>
              <li>
                • <strong>Escape:</strong> Clear selection & switch to Draw mode
              </li>
              <li>
                • <strong>Focus Canvas:</strong> Click canvas or use Focus
                button
              </li>
              <li>
                • <strong>Tab Navigation:</strong> Navigate between UI elements
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">🔧 Tools</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>
                • <strong>Rectangle:</strong> Perfect rectangular shapes
              </li>
              <li>
                • <strong>Circle:</strong> Circular shapes with radius control
              </li>
              <li>
                • <strong>Line:</strong> Straight lines with angle control
              </li>
              <li>
                • <strong>Freehand:</strong> Natural drawing with mouse
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Technical Implementation Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">🔧 기술적 구현</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              🎨 Canvas Ref 관리
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>
                • <strong>createRefContext 활용</strong>: Canvas element를 타입
                안전하게 관리
              </li>
              <li>
                • <strong>이중 Canvas 구조</strong>: 메인 Canvas + 오버레이
                Canvas로 성능 최적화
              </li>
              <li>
                • <strong>실시간 렌더링</strong>: ref를 통한 직접 Canvas
                조작으로 빠른 반응
              </li>
              <li>
                • <strong>자동 정리</strong>: RefDefinitions cleanup으로 메모리
                누수 방지
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              ⚛️ 모듈화 아키텍처
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>
                • <strong>CanvasContext</strong>: 상태 관리 분리 (Context-Action
                패턴)
              </li>
              <li>
                • <strong>useCanvasDrawing</strong>: 드로잉 로직 분리
              </li>
              <li>
                • <strong>useCanvasEvents</strong>: 이벤트 처리 분리
              </li>
              <li>
                • <strong>컴포넌트 분리</strong>: UI, 상태, 캔버스 각각 독립적
                관리
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Code Example */}
      <div className="bg-gray-900 text-gray-100 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">
          Canvas Context 모듈화 구현
        </h3>
        <CodeBlock size="sm" className="overflow-x-auto">
          {`// CanvasContext.tsx - 상태 관리 분리
export function CanvasProvider({ children }) {
  const [shapes, setShapes] = useState<CanvasShape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  // ... 기타 상태들
  
  return (
    <CanvasContext.Provider value={contextValue}>
      {children}
    </CanvasContext.Provider>
  );
}

// useCanvasDrawing.ts - 드로잉 로직 분리  
export function useCanvasDrawing() {
  const canvas = useCanvas();
  
  const redrawCanvas = useCallback((canvasElement) => {
    // 그리기 로직...
  }, [selectedShapeId, currentMode]);
  
  return { redrawCanvas, drawShape, findShapeAtPoint };
}

// Canvas.tsx - UI 컴포넌트 분리
export function Canvas({ width, height, onFocusChange }) {
  const events = useCanvasEvents();
  const drawing = useCanvasDrawing();
  
  return (
    <div className="relative">
      <canvas ref={events.canvasRef} onMouseDown={events.handleMouseDown} />
      <canvas ref={events.overlayRef} className="absolute pointer-events-none" />
    </div>
  );
}`}
        </CodeBlock>
      </div>

      {/* Drawing Tools */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">🛠️ 그리기 도구</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="text-3xl mb-2">⬜</div>
            <h3 className="font-semibold mb-2">Rectangle</h3>
            <p className="text-sm text-gray-600">
              클릭 드래그로 사각형을 그립니다. 정확한 좌표와 크기 제어가
              가능합니다.
            </p>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="text-3xl mb-2">⭕</div>
            <h3 className="font-semibold mb-2">Circle</h3>
            <p className="text-sm text-gray-600">
              원형 도형을 생성합니다. 드래그 영역에 따라 반지름이 자동
              계산됩니다.
            </p>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="text-3xl mb-2">📏</div>
            <h3 className="font-semibold mb-2">Line</h3>
            <p className="text-sm text-gray-600">
              직선을 그립니다. 시작점과 끝점을 정확히 제어할 수 있습니다.
            </p>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="text-3xl mb-2">✍️</div>
            <h3 className="font-semibold mb-2">Freehand</h3>
            <p className="text-sm text-gray-600">
              자유형 그리기 도구입니다. 마우스 움직임을 따라 자연스러운 선을
              그립니다.
            </p>
          </div>
        </div>
      </div>

      {/* Related Demos */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">🔗 관련 데모</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/refs/form-builder"
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">📝</span>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Form Builder Demo
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  동적 폼 빌더에서의 DOM element 관리를 체험해보세요.
                </p>
                <span className="text-blue-600 text-sm font-medium">
                  데모 보기 →
                </span>
              </div>
            </div>
          </a>
          <a
            href="/refs"
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">🏠</span>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Refs Management 홈
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  모든 ref 관리 데모와 기술 문서를 한 곳에서 확인하세요.
                </p>
                <span className="text-blue-600 text-sm font-medium">
                  홈으로 가기 →
                </span>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Main Export Component with Providers
 */
export function AdvancedCanvasExample() {
  return (
    <CanvasProvider>
      <AdvancedCanvasContent />
    </CanvasProvider>
  );
}

// Default export도 함께 제공
export default AdvancedCanvasExample;
