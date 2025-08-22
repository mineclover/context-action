import { useEffect, useRef } from 'react';
import { createRefContext } from '@context-action/react';
import { useCanvasEvents } from './useCanvasEvents';
import { useCanvasDrawing } from './useCanvasDrawing';

// Canvas ref 타입 정의
type CanvasRefs = {
  mainCanvas: HTMLCanvasElement;
  overlayCanvas: HTMLCanvasElement;
  container: HTMLDivElement;
};

// Canvas RefContext 생성
const {
  Provider: CanvasRefProvider,
  useRefHandler: useCanvasRef
} = createRefContext<CanvasRefs>('Canvas');

interface CanvasProps {
  width?: number;
  height?: number;
  onFocusChange?: (focused: boolean) => void;
}

function CanvasContent({ width = 800, height = 600, onFocusChange }: CanvasProps) {
  const mainCanvas = useCanvasRef('mainCanvas');
  const overlayCanvas = useCanvasRef('overlayCanvas');
  const container = useCanvasRef('container');
  
  const events = useCanvasEvents(mainCanvas, overlayCanvas);
  const drawing = useCanvasDrawing();

  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleKeyDown,
  } = events;

  // Canvas 초기화 및 리사이즈 최적화
  useEffect(() => {
    if (mainCanvas.target && overlayCanvas.target) {
      // Canvas 크기가 실제로 변경된 경우에만 설정
      if (mainCanvas.target.width !== width || mainCanvas.target.height !== height) {
        mainCanvas.target.width = width;
        mainCanvas.target.height = height;
        overlayCanvas.target.width = width;
        overlayCanvas.target.height = height;
        
        // 크기 변경시에만 초기 그리기
        drawing.redrawCanvas(mainCanvas.target);
      }
    }
  }, [width, height, drawing.redrawCanvas, mainCanvas.target, overlayCanvas.target]);

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

  // 포커스 변경 감지
  const handleFocus = () => {
    onFocusChange?.(true);
  };

  const handleBlur = () => {
    onFocusChange?.(false);
  };

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
      
      {/* 포커스 인디케이터 */}
      <div className="absolute top-2 right-2 text-xs bg-black bg-opacity-50 text-white px-2 py-1 rounded">
        Click to focus • ESC to clear selection
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