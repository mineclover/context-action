/**
 * @fileoverview 고도화된 Canvas Element 관리 예제
 * Context-Action 프레임워크를 활용한 완전한 Canvas 그리기 시스템
 */

import React, { 
  useRef, 
  useEffect, 
  useCallback, 
  useState,
  useMemo
} from 'react';
import { 
  useElementRef, 
  useElementManager,
  useElementSelection,
  useFocusedElement
} from './react-element-hooks';

// Canvas 내부 도형 타입 정의
interface CanvasShape {
  id: string;
  type: 'rectangle' | 'circle' | 'line' | 'freehand';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  strokeWidth: number;
  points?: { x: number; y: number }[]; // freehand용
  selected?: boolean;
}

// Canvas 도구 타입
type CanvasTool = 'select' | 'rectangle' | 'circle' | 'line' | 'freehand' | 'eraser';

// Canvas 모드
type CanvasMode = 'draw' | 'select' | 'pan';

/**
 * 고도화된 Canvas 컴포넌트
 */
export function AdvancedCanvasExample() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const elementRef = useElementRef('advanced-canvas', 'canvas', { 
    interactive: true,
    drawingEnabled: true,
    version: '2.0'
  });

  // Canvas 상태 관리
  const [shapes, setShapes] = useState<CanvasShape[]>([]);
  const [currentTool, setCurrentTool] = useState<CanvasTool>('rectangle');
  const [currentMode, setCurrentMode] = useState<CanvasMode>('draw');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  
  // 드래그 상태
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragShape, setDragShape] = useState<CanvasShape | null>(null);
  const [freehandPoints, setFreehandPoints] = useState<{ x: number; y: number }[]>([]);

  // Element 관리 훅들
  const { registerElement, getElement } = useElementManager();
  const { selectedElements } = useElementSelection();
  const { focusedElement: focusedElementId, focusElement } = useFocusedElement();

  // Canvas ref 결합
  const combinedCanvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    if (canvas) {
      canvasRef.current = canvas;
      elementRef(canvas);
    } else {
      elementRef(null);
    }
  }, [elementRef]);

  // Canvas 초기화 및 리사이즈
  useEffect(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    
    if (!canvas || !overlay) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      overlay.width = rect.width;
      overlay.height = rect.height;
      redrawCanvas();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Canvas 렌더링
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 배경 그리드 (선택사항)
    if (currentMode === 'draw') {
      drawGrid(ctx, canvas.width, canvas.height);
    }

    // 모든 도형 그리기
    shapes.forEach(shape => drawShape(ctx, shape));

    // 선택된 도형 하이라이트
    if (selectedShapeId) {
      const selectedShape = shapes.find(s => s.id === selectedShapeId);
      if (selectedShape) {
        drawSelectionBounds(ctx, selectedShape);
      }
    }
  }, [shapes, selectedShapeId, currentMode]);

  // 그리드 그리기
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 0.5;
    
    const gridSize = 20;
    
    // 세로선
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // 가로선
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    ctx.restore();
  }, []);

  // 도형 그리기
  const drawShape = useCallback((ctx: CanvasRenderingContext2D, shape: CanvasShape) => {
    ctx.save();
    ctx.strokeStyle = shape.color;
    ctx.lineWidth = shape.strokeWidth;
    ctx.fillStyle = shape.color + '20'; // 투명도 추가

    switch (shape.type) {
      case 'rectangle':
        ctx.beginPath();
        ctx.rect(shape.x, shape.y, shape.width, shape.height);
        ctx.fill();
        ctx.stroke();
        break;

      case 'circle':
        const radius = Math.max(Math.abs(shape.width), Math.abs(shape.height)) / 2;
        const centerX = shape.x + shape.width / 2;
        const centerY = shape.y + shape.height / 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.abs(radius), 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        break;

      case 'line':
        ctx.beginPath();
        ctx.moveTo(shape.x, shape.y);
        ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
        ctx.stroke();
        break;

      case 'freehand':
        if (shape.points && shape.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(shape.points[0].x, shape.points[0].y);
          for (let i = 1; i < shape.points.length; i++) {
            ctx.lineTo(shape.points[i].x, shape.points[i].y);
          }
          ctx.stroke();
        }
        break;
    }

    ctx.restore();
  }, []);

  // 선택 영역 그리기
  const drawSelectionBounds = useCallback((ctx: CanvasRenderingContext2D, shape: CanvasShape) => {
    ctx.save();
    ctx.strokeStyle = '#007acc';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    const padding = 5;
    ctx.strokeRect(
      shape.x - padding, 
      shape.y - padding, 
      shape.width + 2 * padding, 
      shape.height + 2 * padding
    );
    
    // 핸들 그리기
    const handleSize = 6;
    ctx.setLineDash([]);
    ctx.fillStyle = '#007acc';
    
    const handles = [
      { x: shape.x - padding, y: shape.y - padding }, // 좌상
      { x: shape.x + shape.width + padding, y: shape.y - padding }, // 우상
      { x: shape.x - padding, y: shape.y + shape.height + padding }, // 좌하
      { x: shape.x + shape.width + padding, y: shape.y + shape.height + padding }, // 우하
    ];
    
    handles.forEach(handle => {
      ctx.fillRect(
        handle.x - handleSize / 2,
        handle.y - handleSize / 2,
        handleSize,
        handleSize
      );
    });
    
    ctx.restore();
  }, []);

  // 마우스 좌표 계산
  const getMousePos = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }, []);

  // 도형과의 충돌 검사
  const findShapeAtPoint = useCallback((x: number, y: number): CanvasShape | null => {
    // 역순으로 검사 (최상위 도형부터)
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      
      switch (shape.type) {
        case 'rectangle':
          if (x >= shape.x && x <= shape.x + shape.width &&
              y >= shape.y && y <= shape.y + shape.height) {
            return shape;
          }
          break;
          
        case 'circle':
          const centerX = shape.x + shape.width / 2;
          const centerY = shape.y + shape.height / 2;
          const radius = Math.max(Math.abs(shape.width), Math.abs(shape.height)) / 2;
          const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          if (distance <= radius) {
            return shape;
          }
          break;
          
        case 'line':
          // 선 충돌 검사 (단순화)
          const lineDistance = pointToLineDistance(
            { x, y },
            { x: shape.x, y: shape.y },
            { x: shape.x + shape.width, y: shape.y + shape.height }
          );
          if (lineDistance <= shape.strokeWidth + 5) {
            return shape;
          }
          break;
          
        case 'freehand':
          // Freehand 충돌 검사 (점들과의 거리)
          if (shape.points) {
            for (const point of shape.points) {
              const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
              if (distance <= shape.strokeWidth + 5) {
                return shape;
              }
            }
          }
          break;
      }
    }
    return null;
  }, [shapes]);

  // 점과 선분 사이의 거리 계산
  const pointToLineDistance = (point: {x: number, y: number}, lineStart: {x: number, y: number}, lineEnd: {x: number, y: number}): number => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B);
    
    let param = dot / lenSq;
    param = Math.max(0, Math.min(1, param));

    const xx = lineStart.x + param * C;
    const yy = lineStart.y + param * D;

    const dx = point.x - xx;
    const dy = point.y - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 마우스 다운 이벤트
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(event);
    setDragStart(pos);
    setIsDragging(true);

    if (currentMode === 'select') {
      const clickedShape = findShapeAtPoint(pos.x, pos.y);
      if (clickedShape) {
        setSelectedShapeId(clickedShape.id);
        setDragShape(clickedShape);
        
        // Element 시스템에 등록
        registerElement(clickedShape.id, event.currentTarget, 'canvas', {
          shapeType: clickedShape.type,
          color: clickedShape.color,
          position: { x: clickedShape.x, y: clickedShape.y },
          size: { width: clickedShape.width, height: clickedShape.height }
        });
      } else {
        setSelectedShapeId(null);
        setDragShape(null);
      }
    } else if (currentMode === 'draw') {
      if (currentTool === 'freehand') {
        setFreehandPoints([pos]);
      }
    }
  }, [currentMode, currentTool, getMousePos, findShapeAtPoint, registerElement]);

  // 마우스 이동 이벤트
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart) return;

    const pos = getMousePos(event);

    if (currentMode === 'select' && dragShape) {
      // 선택된 도형 이동
      const dx = pos.x - dragStart.x;
      const dy = pos.y - dragStart.y;
      
      setShapes(prev => prev.map(shape => 
        shape.id === dragShape.id 
          ? { ...shape, x: dragShape.x + dx, y: dragShape.y + dy }
          : shape
      ));
      
      // Element 시스템 업데이트는 생략 (기존 시스템에서 지원하지 않음)
      
    } else if (currentMode === 'draw') {
      if (currentTool === 'freehand') {
        setFreehandPoints(prev => [...prev, pos]);
      }
      
      // 임시 도형 그리기 (오버레이 캔버스 사용)
      const overlay = overlayRef.current;
      if (overlay) {
        const ctx = overlay.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, overlay.width, overlay.height);
          
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
            
            drawShape(ctx, tempShape);
          } else if (freehandPoints.length > 0) {
            // Freehand 미리보기
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = strokeWidth;
            ctx.beginPath();
            ctx.moveTo(freehandPoints[0].x, freehandPoints[0].y);
            freehandPoints.forEach(point => ctx.lineTo(point.x, point.y));
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
          }
        }
      }
    }
  }, [isDragging, dragStart, currentMode, dragShape, currentTool, currentColor, strokeWidth, freehandPoints, getMousePos, drawShape]);

  // 마우스 업 이벤트
  const handleMouseUp = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart) return;

    const pos = getMousePos(event);
    
    if (currentMode === 'draw' && currentTool !== 'select') {
      let newShape: CanvasShape | null = null;
      
      if (currentTool === 'freehand') {
        if (freehandPoints.length > 1) {
          newShape = {
            id: `freehand_${Date.now()}`,
            type: 'freehand',
            x: Math.min(...freehandPoints.map(p => p.x)),
            y: Math.min(...freehandPoints.map(p => p.y)),
            width: Math.max(...freehandPoints.map(p => p.x)) - Math.min(...freehandPoints.map(p => p.x)),
            height: Math.max(...freehandPoints.map(p => p.y)) - Math.min(...freehandPoints.map(p => p.y)),
            color: currentColor,
            strokeWidth: strokeWidth,
            points: [...freehandPoints, pos]
          };
        }
        setFreehandPoints([]);
      } else {
        // 최소 크기 확인
        const width = Math.abs(pos.x - dragStart.x);
        const height = Math.abs(pos.y - dragStart.y);
        
        if (width > 5 || height > 5) {
          newShape = {
            id: `${currentTool}_${Date.now()}`,
            type: currentTool as 'rectangle' | 'circle' | 'line',
            x: Math.min(dragStart.x, pos.x),
            y: Math.min(dragStart.y, pos.y),
            width: width,
            height: currentTool === 'line' ? pos.y - dragStart.y : height,
            color: currentColor,
            strokeWidth: strokeWidth
          };
        }
      }
      
      if (newShape) {
        setShapes(prev => [...prev, newShape!]);
        
        // Element 시스템에 등록
        registerElement(newShape.id, event.currentTarget, 'canvas', {
          shapeType: newShape.type,
          color: newShape.color,
          position: { x: newShape.x, y: newShape.y },
          size: { width: newShape.width, height: newShape.height }
        });
      }
    }
    
    // 오버레이 클리어
    const overlay = overlayRef.current;
    if (overlay) {
      const ctx = overlay.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, overlay.width, overlay.height);
      }
    }

    setIsDragging(false);
    setDragStart(null);
    setDragShape(null);
  }, [isDragging, dragStart, currentMode, currentTool, currentColor, strokeWidth, freehandPoints, getMousePos, registerElement]);

  // Canvas 다시 그리기
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // 선택된 도형 삭제
  const deleteSelectedShape = useCallback(() => {
    if (selectedShapeId) {
      setShapes(prev => prev.filter(shape => shape.id !== selectedShapeId));
      setSelectedShapeId(null);
    }
  }, [selectedShapeId]);

  // 전체 클리어
  const clearCanvas = useCallback(() => {
    setShapes([]);
    setSelectedShapeId(null);
  }, []);

  // 키보드 이벤트
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (selectedElements.includes('advanced-canvas') || focusedElementId === 'advanced-canvas') {
        switch (event.key) {
          case 'Delete':
          case 'Backspace':
            deleteSelectedShape();
            event.preventDefault();
            break;
          case 'Escape':
            setSelectedShapeId(null);
            setCurrentMode('draw');
            event.preventDefault();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElements, focusedElementId, deleteSelectedShape]);

  return (
    <div className="flex gap-4 h-screen bg-gray-100">
      {/* Canvas Area */}
      <div className="flex-1 p-4">
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">Advanced Canvas</h2>
            <div className="flex gap-2">
              <button
                onClick={() => focusElement('advanced-canvas')}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                Focus Canvas
              </button>
              <button
                onClick={clearCanvas}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                Clear All
              </button>
            </div>
          </div>
          
          <div className="relative border-2 border-gray-300 rounded" style={{ width: '800px', height: '600px' }}>
            {/* Main Canvas */}
            <canvas
              ref={combinedCanvasRef}
              className="absolute inset-0 cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{ width: '100%', height: '100%' }}
            />
            
            {/* Overlay Canvas for temporary drawing */}
            <canvas
              ref={overlayRef}
              className="absolute inset-0 pointer-events-none"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Tools Panel */}
      <div className="w-72 bg-gray-50 flex flex-col h-screen">
        {/* Top Section - Controls */}
        <div className="p-3 space-y-3">
          {/* Mode Selection */}
          <div className="bg-white rounded-lg shadow-sm p-3">
            <h3 className="font-medium mb-2 text-sm">Mode</h3>
            <div className="grid grid-cols-2 gap-1">
              {(['draw', 'select'] as CanvasMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setCurrentMode(mode)}
                  className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                    currentMode === mode
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {mode === 'draw' ? '✏️ Draw' : '🔍 Select'}
                </button>
              ))}
            </div>
          </div>

          {/* Tool Selection */}
          {currentMode === 'draw' && (
            <div className="bg-white rounded-lg shadow-sm p-3">
              <h3 className="font-medium mb-2 text-sm">Tools</h3>
              <div className="grid grid-cols-2 gap-1">
                {([
                  { tool: 'rectangle', icon: '⬜', label: 'Rectangle' },
                  { tool: 'circle', icon: '⭕', label: 'Circle' },
                  { tool: 'line', icon: '📏', label: 'Line' },
                  { tool: 'freehand', icon: '✍️', label: 'Freehand' }
                ]).map(({ tool, icon, label }) => (
                  <button
                    key={tool}
                    onClick={() => setCurrentTool(tool as CanvasTool)}
                    className={`px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                      currentTool === tool
                        ? 'bg-green-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Style Controls */}
          <div className="bg-white rounded-lg shadow-sm p-3">
            <h3 className="font-medium mb-2 text-sm">Style</h3>
            
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-600">Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentColor}
                    onChange={(e) => setCurrentColor(e.target.value)}
                    className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                  />
                  <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                    {currentColor.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-600">
                  Stroke Width
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded min-w-[32px] text-center">
                    {strokeWidth}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Canvas Status */}
          <div className="bg-white rounded-lg shadow-sm p-3">
            <h3 className="font-medium mb-2 text-sm">Canvas Status</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Selected:</span>
                <span className={selectedElements.includes('advanced-canvas') ? 'text-green-600' : 'text-gray-400'}>
                  {selectedElements.includes('advanced-canvas') ? '✓' : '○'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Focused:</span>
                <span className={focusedElementId === 'advanced-canvas' ? 'text-green-600' : 'text-gray-400'}>
                  {focusedElementId === 'advanced-canvas' ? '✓' : '○'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mode:</span>
                <span className="font-medium capitalize">{currentMode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tool:</span>
                <span className="font-medium capitalize">{currentTool}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section - Shape List (Flexible) */}
        <div className="flex-1 p-3 pt-0">
          <div className="bg-white rounded-lg shadow-sm p-3 h-full flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-sm">Shapes</h3>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                {shapes.length}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
              {shapes.map((shape) => (
                <div
                  key={shape.id}
                  onClick={() => setSelectedShapeId(shape.id)}
                  className={`p-2 rounded cursor-pointer text-xs transition-all ${
                    selectedShapeId === shape.id
                      ? 'bg-blue-50 border border-blue-200 shadow-sm'
                      : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-sm border border-gray-300"
                        style={{ backgroundColor: shape.color }}
                      />
                      <span className="font-medium capitalize">{shape.type}</span>
                    </div>
                    {selectedShapeId === shape.id && (
                      <span className="text-blue-500">●</span>
                    )}
                  </div>
                  <div className="text-gray-500 font-mono">
                    {Math.round(shape.x)}, {Math.round(shape.y)}
                    <span className="mx-1">•</span>
                    {Math.round(shape.width)}×{Math.round(shape.height)}
                  </div>
                </div>
              ))}
              
              {shapes.length === 0 && (
                <div className="text-center text-gray-400 py-12 text-xs flex-1 flex flex-col justify-center">
                  <div className="mb-2 text-2xl">🎨</div>
                  <div>Draw something!</div>
                  <div className="text-xs mt-1 text-gray-500">
                    Select a tool and start drawing
                  </div>
                </div>
              )}
            </div>

            {/* Selected Shape Actions - Inside Shapes Panel */}
            {selectedShapeId && (
              <div className="mt-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-xs text-yellow-800">Selected Shape</h4>
                  <button
                    onClick={deleteSelectedShape}
                    className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                  >
                    🗑️ Delete
                  </button>
                </div>
                {(() => {
                  const shape = shapes.find(s => s.id === selectedShapeId);
                  if (!shape) return null;
                  
                  return (
                    <div className="space-y-1 text-xs text-yellow-700">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="font-medium capitalize">{shape.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Position:</span>
                        <span className="font-mono">{Math.round(shape.x)}, {Math.round(shape.y)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Size:</span>
                        <span className="font-mono">{Math.round(shape.width)}×{Math.round(shape.height)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Color:</span>
                        <div className="flex items-center gap-1">
                          <div 
                            className="w-3 h-3 rounded border border-gray-300"
                            style={{ backgroundColor: shape.color }}
                          />
                          <span className="font-mono text-xs">{shape.color.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section - Help */}
        <div className="p-3 pt-0">
          <div className="bg-gray-100 rounded-lg p-3 border border-gray-200">
            <h3 className="font-medium mb-2 text-xs text-gray-700">💡 Quick Help</h3>
            <ul className="text-xs text-gray-600 space-y-0.5">
              <li>• <span className="font-medium">Draw:</span> Click & drag to create</li>
              <li>• <span className="font-medium">Select:</span> Click shapes to select</li>
              <li>• <span className="font-medium">Delete:</span> Select + Del key</li>
              <li>• <span className="font-medium">Escape:</span> Clear selection</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}