import { createRefContext } from '@context-action/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCanvas } from './CanvasContext';
import { useCanvasDrawing } from './useCanvasDrawing';
import { useCanvasEvents } from './useCanvasEvents';

// Canvas ref 타입 정의
type CanvasRefs = {
  mainCanvas: HTMLCanvasElement;
  overlayCanvas: HTMLCanvasElement;
  container: HTMLDivElement;
};

// Canvas RefContext 생성
const { Provider: CanvasRefProvider, useRefHandler: useCanvasRef } =
  createRefContext<CanvasRefs>('Canvas');

// 이벤트 로그 타입 정의
interface CanvasEvent {
  id: string;
  timestamp: number;
  type:
    | 'focus'
    | 'blur'
    | 'draw'
    | 'select'
    | 'delete'
    | 'mode_change'
    | 'tool_change'
    | 'clear';
  details: string;
  data?: any;
}

interface CanvasProps {
  width?: number;
  height?: number;
  onFocusChange?: (focused: boolean) => void;
  onEventLog?: (event: CanvasEvent) => void;
}

function CanvasContent({
  width = 800,
  height = 600,
  onFocusChange,
  onEventLog,
}: CanvasProps) {
  const mainCanvas = useCanvasRef('mainCanvas');
  const overlayCanvas = useCanvasRef('overlayCanvas');
  const container = useCanvasRef('container');

  const canvas = useCanvas();
  const events = useCanvasEvents(mainCanvas, overlayCanvas);
  const drawing = useCanvasDrawing();

  // Canvas state: shapes, selectedShapeId for redrawing
  const { shapes, selectedShapeId, currentMode, currentTool, isDragging } =
    canvas;

  // 상태 변화 추적을 위한 이전 값들
  const prevShapesCount = useRef(shapes.length);
  const prevSelectedShapeId = useRef(selectedShapeId);
  const prevCurrentMode = useRef(currentMode);
  const prevCurrentTool = useRef(currentTool);
  const [isCanvasFocused, setIsCanvasFocused] = useState(false);

  // 이벤트 로그 생성 함수
  const logEvent = useCallback(
    (type: CanvasEvent['type'], details: string, data?: any) => {
      const event: CanvasEvent = {
        id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        type,
        details,
        data,
      };
      onEventLog?.(event);
    },
    [onEventLog]
  );

  const { handleMouseDown, handleMouseMove, handleMouseUp, handleKeyDown } =
    events;

  // 상태 변화 감지 및 로깅
  useEffect(() => {
    // 도형 개수 변화 감지
    if (prevShapesCount.current !== shapes.length) {
      if (shapes.length > prevShapesCount.current) {
        logEvent('draw', `새 도형이 추가되었습니다. 총 ${shapes.length}개`, {
          previousCount: prevShapesCount.current,
          currentCount: shapes.length,
          newShape: shapes[shapes.length - 1],
        });
      } else if (shapes.length < prevShapesCount.current) {
        logEvent('delete', `도형이 삭제되었습니다. 총 ${shapes.length}개`, {
          previousCount: prevShapesCount.current,
          currentCount: shapes.length,
        });
      }
      prevShapesCount.current = shapes.length;
    }

    // 선택 변화 감지
    if (prevSelectedShapeId.current !== selectedShapeId) {
      if (selectedShapeId) {
        const selectedShape = shapes.find((s) => s.id === selectedShapeId);
        logEvent(
          'select',
          `도형이 선택되었습니다: ${selectedShape?.type} #${selectedShapeId.slice(-4)}`,
          {
            shapeId: selectedShapeId,
            shapeType: selectedShape?.type,
          }
        );
      } else if (prevSelectedShapeId.current) {
        logEvent('select', '도형 선택이 해제되었습니다', {
          previousShapeId: prevSelectedShapeId.current,
        });
      }
      prevSelectedShapeId.current = selectedShapeId;
    }

    // 모드 변화 감지
    if (prevCurrentMode.current !== currentMode) {
      logEvent(
        'mode_change',
        `모드가 변경되었습니다: ${prevCurrentMode.current} → ${currentMode}`,
        {
          previousMode: prevCurrentMode.current,
          currentMode: currentMode,
        }
      );
      prevCurrentMode.current = currentMode;
    }

    // 도구 변화 감지
    if (prevCurrentTool.current !== currentTool) {
      logEvent(
        'tool_change',
        `도구가 변경되었습니다: ${prevCurrentTool.current} → ${currentTool}`,
        {
          previousTool: prevCurrentTool.current,
          currentTool: currentTool,
        }
      );
      prevCurrentTool.current = currentTool;
    }
  }, [
    shapes.length,
    selectedShapeId,
    currentMode,
    currentTool,
    shapes,
    logEvent,
  ]);

  // Canvas 초기화 및 리사이즈 최적화
  useEffect(() => {
    if (mainCanvas.target && overlayCanvas.target) {
      // Canvas 크기가 실제로 변경된 경우에만 설정
      if (
        mainCanvas.target.width !== width ||
        mainCanvas.target.height !== height
      ) {
        mainCanvas.target.width = width;
        mainCanvas.target.height = height;
        overlayCanvas.target.width = width;
        overlayCanvas.target.height = height;

        // 크기 변경시에만 초기 그리기
        drawing.redrawCanvas(mainCanvas.target);
      }
    }
  }, [
    width,
    height,
    drawing.redrawCanvas,
    mainCanvas.target,
    overlayCanvas.target,
  ]);

  // Canvas 상태 변경시 자동 재그리기 (shapes 변경, 선택 변경)
  useEffect(() => {
    if (mainCanvas.target) {
      drawing.redrawCanvas(mainCanvas.target);
    }

    // shapes가 비어있을 때 overlay canvas도 클리어
    if (shapes.length === 0 && overlayCanvas.target) {
      const ctx = overlayCanvas.target.getContext('2d');
      if (ctx) {
        ctx.clearRect(
          0,
          0,
          overlayCanvas.target.width,
          overlayCanvas.target.height
        );
      }
    }
  }, [
    shapes,
    selectedShapeId,
    drawing.redrawCanvas,
    mainCanvas.target,
    overlayCanvas.target,
  ]);

  // 드래그 종료시 overlay canvas 클리어
  useEffect(() => {
    if (!isDragging && overlayCanvas.target) {
      const ctx = overlayCanvas.target.getContext('2d');
      if (ctx) {
        ctx.clearRect(
          0,
          0,
          overlayCanvas.target.width,
          overlayCanvas.target.height
        );
      }
    }
  }, [isDragging, overlayCanvas.target]);

  // 키보드 이벤트 리스너
  useEffect(() => {
    const handleKeyDownEvent = (event: KeyboardEvent) => {
      // Canvas에 포커스가 있을 때만 처리
      if (container.target?.contains(document.activeElement)) {
        handleKeyDown(event);
      }
    };

    window.addEventListener('keydown', handleKeyDownEvent);
    return () => window.removeEventListener('keydown', handleKeyDownEvent);
  }, [handleKeyDown, container.target]);

  // 포커스 변경 감지와 로깅
  const handleFocus = useCallback(() => {
    setIsCanvasFocused(true);
    onFocusChange?.(true);
    logEvent('focus', 'Canvas가 포커스되었습니다');
  }, [onFocusChange, logEvent]);

  const handleBlur = useCallback(() => {
    setIsCanvasFocused(false);
    onFocusChange?.(false);
    logEvent('blur', 'Canvas 포커스가 해제되었습니다');
  }, [onFocusChange, logEvent]);

  // 포커스 강제 설정 함수 (테스트용)
  const _focusCanvas = useCallback(() => {
    if (container.target) {
      container.target.focus();
      logEvent(
        'focus',
        'Canvas 포커스가 강제로 설정되었습니다 (Focus 버튼 클릭)'
      );
    }
  }, [container.target, logEvent]);

  return (
    <div
      ref={container.setRef}
      className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-white"
      style={{ width, height }}
      tabIndex={0}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {/* 메인 Canvas */}
      <canvas
        ref={mainCanvas.setRef}
        className="absolute top-0 left-0 cursor-crosshair block"
        width={width}
        height={height}
        style={{ width: `${width}px`, height: `${height}px` }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />

      {/* 오버레이 Canvas (드래그 미리보기용) */}
      <canvas
        ref={overlayCanvas.setRef}
        className="absolute top-0 left-0 pointer-events-none block"
        width={width}
        height={height}
        style={{ width: `${width}px`, height: `${height}px` }}
      />

      {/* 실시간 상태 인디케이터 */}
      <div className="absolute top-2 right-2 space-y-1">
        <div
          className={`text-xs px-2 py-1 rounded transition-colors ${
            isCanvasFocused
              ? 'bg-green-500 bg-opacity-80 text-white'
              : 'bg-black bg-opacity-50 text-white'
          }`}
        >
          {isCanvasFocused ? '● Focused' : '○ Click to focus'}
        </div>

        {isDragging && (
          <div className="text-xs bg-blue-500 bg-opacity-80 text-white px-2 py-1 rounded animate-pulse">
            ✋ Dragging...
          </div>
        )}

        <div className="text-xs bg-black bg-opacity-50 text-white px-2 py-1 rounded">
          Mode: {currentMode} | Tool: {currentTool}
        </div>

        <div className="text-xs bg-black bg-opacity-50 text-white px-2 py-1 rounded">
          ESC: clear • Del: delete
        </div>
      </div>
    </div>
  );
}

// Provider로 래핑된 Canvas 컴포넌트
export function Canvas(props: CanvasProps) {
  return (
    <CanvasRefProvider>
      <CanvasContent {...props} />
    </CanvasRefProvider>
  );
}

// focusCanvas 함수를 노출하기 위한 ref 함수
Canvas.displayName = 'Canvas';

// Export CanvasEvent type for external use
export type { CanvasEvent };
