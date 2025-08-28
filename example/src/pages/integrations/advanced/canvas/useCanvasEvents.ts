import { useCallback } from 'react';
import { useCanvas, CanvasShape, Point } from './CanvasContext';
import { useCanvasDrawing } from './useCanvasDrawing';

// RefHandler 타입 정의 (실제 RefContext API에 맞춤)
interface RefHandler<T> {
  setRef: (target: any) => void;
  target: any;
  waitForMount: () => Promise<any>;
  withTarget: <Result>(operation: any, options?: any) => Promise<any>;
  isMounted: boolean;
}

export function useCanvasEvents(
  mainCanvasRef: RefHandler<HTMLCanvasElement>, 
  overlayCanvasRef: RefHandler<HTMLCanvasElement>
) {
  const canvas = useCanvas();
  const drawing = useCanvasDrawing();

  const {
    currentMode,
    currentTool,
    currentColor,
    strokeWidth,
    isDragging,
    dragStart,
    dragShape,
    freehandPoints,
    selectedShapeId,
    addShape,
    updateShape,
    selectShape,
    startDrag,
    endDrag,
    addFreehandPoint,
    clearFreehandPoints,
  } = canvas;

  // 마우스 좌표 계산
  const getMousePos = useCallback((event: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }, []);

  // 마우스 다운 이벤트
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(event);

    if (currentMode === 'select') {
      // 선택 모드: 도형 선택 또는 이동 시작
      const clickedShape = drawing.findShapeAtPoint(pos);
      
      if (clickedShape) {
        selectShape(clickedShape.id);
        if (selectedShapeId === clickedShape.id) {
          // 이미 선택된 도형을 클릭한 경우 드래그 시작
          startDrag(pos, clickedShape);
        }
      } else {
        selectShape(null);
      }
    } else {
      // 그리기 모드: 새 도형 생성 시작
      startDrag(pos);
      
      if (currentTool === 'freehand') {
        clearFreehandPoints();
        addFreehandPoint(pos);
      }
    }
  }, [
    currentMode,
    currentTool,
    selectedShapeId,
    getMousePos,
    drawing.findShapeAtPoint,
    selectShape,
    startDrag,
    clearFreehandPoints,
    addFreehandPoint,
  ]);

  // 마우스 이동 이벤트 (성능 최적화)
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const pos = getMousePos(event);
    const overlay = overlayCanvasRef.target;
    if (!overlay) return;

    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    // 오버레이 Canvas만 초기화 (메인 Canvas 건드리지 않음)
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    if (currentMode === 'select' && dragShape) {
      // 선택된 도형 이동 미리보기만 오버레이에
      const deltaX = pos.x - dragStart.x;
      const deltaY = pos.y - dragStart.y;
      
      const movedShape: CanvasShape = {
        ...dragShape,
        x: dragShape.x + deltaX,
        y: dragShape.y + deltaY,
      };
      
      drawing.drawShape(ctx, movedShape);
    } else if (currentMode === 'draw') {
      // 새 도형 미리보기만 오버레이에
      if (currentTool !== 'freehand') {
        const tempShape: CanvasShape = {
          id: 'temp',
          type: currentTool as 'rectangle' | 'circle' | 'line',
          x: Math.min(dragStart.x, pos.x),
          y: Math.min(dragStart.y, pos.y),
          width: Math.abs(pos.x - dragStart.x),
          height: Math.abs(pos.y - dragStart.y),
          color: currentColor,
          strokeWidth: strokeWidth
        };
        
        drawing.drawTempShape(ctx, tempShape);
      } else if (freehandPoints.length > 0) {
        // Freehand 실시간 그리기 - 메인 Canvas에 직접 그리기
        if (mainCanvasRef.target) {
          const mainCtx = mainCanvasRef.target.getContext('2d');
          if (mainCtx) {
            mainCtx.strokeStyle = currentColor;
            mainCtx.lineWidth = strokeWidth;
            mainCtx.lineCap = 'round';
            mainCtx.lineJoin = 'round';
            
            const lastPoint = freehandPoints[freehandPoints.length - 1];
            mainCtx.beginPath();
            mainCtx.moveTo(lastPoint.x, lastPoint.y);
            mainCtx.lineTo(pos.x, pos.y);
            mainCtx.stroke();
          }
        }
        addFreehandPoint(pos);
      }
    }

    // 메인 Canvas 재그리기 제거 - 성능 최적화의 핵심!
    // 오버레이만 업데이트하고 메인 Canvas는 마우스업에서만 업데이트
  }, [
    isDragging,
    currentMode,
    currentTool,
    currentColor,
    strokeWidth,
    dragStart,
    dragShape,
    freehandPoints,
    getMousePos,
    drawing.drawShape,
    drawing.drawTempShape,
    addFreehandPoint,
  ]);

  // 마우스 업 이벤트 (즉시 반영 최적화)
  const handleMouseUp = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const pos = getMousePos(event);
    const mainCanvas = mainCanvasRef.target;
    const overlay = overlayCanvasRef.target;

    if (currentMode === 'select' && dragShape) {
      // 선택된 도형 이동 완료 - 즉시 상태 업데이트 및 렌더링
      const deltaX = pos.x - dragStart.x;
      const deltaY = pos.y - dragStart.y;
      
      const updatedShape = {
        ...dragShape,
        x: dragShape.x + deltaX,
        y: dragShape.y + deltaY,
      };
      
      // Context-Action을 통한 상태 업데이트 (자동 렌더링됨)
      updateShape(dragShape.id, {
        x: updatedShape.x,
        y: updatedShape.y,
      });
      
    } else if (currentMode === 'draw') {
      // 새 도형 생성 완료
      if (currentTool !== 'freehand') {
        if (Math.abs(pos.x - dragStart.x) > 5 || Math.abs(pos.y - dragStart.y) > 5) {
          const newShape: CanvasShape = {
            id: `${currentTool}-${Date.now()}`,
            type: currentTool as 'rectangle' | 'circle' | 'line',
            x: Math.min(dragStart.x, pos.x),
            y: Math.min(dragStart.y, pos.y),
            width: Math.abs(pos.x - dragStart.x),
            height: Math.abs(pos.y - dragStart.y),
            color: currentColor,
            strokeWidth: strokeWidth
          };
          
          // Context-Action을 통한 상태 업데이트 (자동 렌더링됨)
          addShape(newShape);
        }
      } else if (freehandPoints.length > 1) {
        // Freehand 도형 생성 - Context-Action으로 상태 관리
        const newShape: CanvasShape = {
          id: `freehand-${Date.now()}`,
          type: 'freehand',
          x: Math.min(...freehandPoints.map(p => p.x)),
          y: Math.min(...freehandPoints.map(p => p.y)),
          width: Math.max(...freehandPoints.map(p => p.x)) - Math.min(...freehandPoints.map(p => p.x)),
          height: Math.max(...freehandPoints.map(p => p.y)) - Math.min(...freehandPoints.map(p => p.y)),
          color: currentColor,
          strokeWidth: strokeWidth,
          points: [...freehandPoints, pos]
        };
        
        // Context-Action을 통한 상태 업데이트 (자동 렌더링으로 Freehand 중복 방지)
        addShape(newShape);
        
        // 메인 Canvas를 한 번 더 그려서 실시간 그리기 위에 깔끔하게 정리
        if (mainCanvas) {
          drawing.redrawCanvas(mainCanvas);
        }
      }
    }

    // 드래그 종료
    endDrag();

    // 오버레이 초기화
    if (overlay) {
      const ctx = overlay.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, overlay.width, overlay.height);
      }
    }

    // 추가 전체 렌더링은 제거 - 위에서 필요한 부분만 즉시 렌더링 완료
  }, [
    isDragging,
    currentMode,
    currentTool,
    currentColor,
    strokeWidth,
    dragStart,
    dragShape,
    freehandPoints,
    getMousePos,
    updateShape,
    addShape,
    endDrag,
    drawing.redrawCanvas,
    drawing.drawShape,
  ]);

  // 키보드 이벤트 (삭제, ESC 등)
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (selectedShapeId) {
        canvas.deleteShape(selectedShapeId);
      }
    } else if (event.key === 'Escape') {
      selectShape(null);
      canvas.setMode('draw');
    }
  }, [selectedShapeId, canvas.deleteShape, selectShape, canvas.setMode]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleKeyDown,
    getMousePos,
  };
}