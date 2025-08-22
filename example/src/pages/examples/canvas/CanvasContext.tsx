import React, { createContext, useContext, useRef, useState, useCallback, ReactNode } from 'react';

// Canvas 도형 타입 정의
export interface Point {
  x: number;
  y: number;
}

export interface CanvasShape {
  id: string;
  type: 'rectangle' | 'circle' | 'line' | 'freehand';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  strokeWidth: number;
  points?: Point[];
}

// Canvas 상태 타입 정의
export interface CanvasState {
  // 도형 데이터
  shapes: CanvasShape[];
  selectedShapeId: string | null;
  
  // 그리기 모드 및 도구
  currentMode: 'draw' | 'select';
  currentTool: 'rectangle' | 'circle' | 'line' | 'freehand';
  currentColor: string;
  strokeWidth: number;
  
  // 드래그 상태
  isDragging: boolean;
  dragStart: Point;
  dragShape: CanvasShape | null;
  freehandPoints: Point[];
}

// Canvas 액션 타입 정의
export interface CanvasActions {
  // 도형 관리
  addShape: (shape: CanvasShape) => void;
  updateShape: (id: string, updates: Partial<CanvasShape>) => void;
  deleteShape: (id: string) => void;
  clearAllShapes: () => void;
  selectShape: (id: string | null) => void;
  
  // 모드 및 도구 설정
  setMode: (mode: 'draw' | 'select') => void;
  setTool: (tool: 'rectangle' | 'circle' | 'line' | 'freehand') => void;
  setColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  
  // 드래그 상태 관리
  startDrag: (point: Point, shape?: CanvasShape) => void;
  updateDrag: (point: Point) => void;
  endDrag: () => void;
  
  // Freehand 포인트 관리
  addFreehandPoint: (point: Point) => void;
  clearFreehandPoints: () => void;
}

// Canvas Context 타입
export interface CanvasContextType extends CanvasState, CanvasActions {}

// Canvas Context 생성
const CanvasContext = createContext<CanvasContextType | null>(null);

// Canvas Provider 컴포넌트
export function CanvasProvider({ children }: { children: ReactNode }) {
  // 상태 관리
  const [shapes, setShapes] = useState<CanvasShape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<'draw' | 'select'>('draw');
  const [currentTool, setCurrentTool] = useState<'rectangle' | 'circle' | 'line' | 'freehand'>('rectangle');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [dragShape, setDragShape] = useState<CanvasShape | null>(null);
  const [freehandPoints, setFreehandPoints] = useState<Point[]>([]);

  // Ref로 최신 상태 관리 (무한 루프 방지)
  const shapesRef = useRef<CanvasShape[]>([]);
  shapesRef.current = shapes;

  // 도형 관리 액션들
  const addShape = useCallback((shape: CanvasShape) => {
    setShapes(prev => [...prev, shape]);
  }, []);

  const updateShape = useCallback((id: string, updates: Partial<CanvasShape>) => {
    setShapes(prev => prev.map(shape => 
      shape.id === id ? { ...shape, ...updates } : shape
    ));
  }, []);

  const deleteShape = useCallback((id: string) => {
    setShapes(prev => prev.filter(shape => shape.id !== id));
    if (selectedShapeId === id) {
      setSelectedShapeId(null);
    }
  }, [selectedShapeId]);

  const clearAllShapes = useCallback(() => {
    setShapes([]);
    setSelectedShapeId(null);
  }, []);

  const selectShape = useCallback((id: string | null) => {
    setSelectedShapeId(id);
  }, []);

  // 모드 및 도구 설정 액션들
  const setMode = useCallback((mode: 'draw' | 'select') => {
    setCurrentMode(mode);
    if (mode === 'draw') {
      setSelectedShapeId(null);
    }
  }, []);

  const setTool = useCallback((tool: 'rectangle' | 'circle' | 'line' | 'freehand') => {
    setCurrentTool(tool);
  }, []);

  const setColor = useCallback((color: string) => {
    setCurrentColor(color);
  }, []);

  const setStrokeWidthValue = useCallback((width: number) => {
    setStrokeWidth(width);
  }, []);

  // 드래그 상태 관리 액션들
  const startDrag = useCallback((point: Point, shape?: CanvasShape) => {
    setIsDragging(true);
    setDragStart(point);
    setDragShape(shape || null);
  }, []);

  const updateDrag = useCallback((point: Point) => {
    // 드래그 업데이트 로직은 사용하는 곳에서 처리
  }, []);

  const endDrag = useCallback(() => {
    setIsDragging(false);
    setDragShape(null);
    setFreehandPoints([]);
  }, []);

  // Freehand 포인트 관리
  const addFreehandPoint = useCallback((point: Point) => {
    setFreehandPoints(prev => [...prev, point]);
  }, []);

  const clearFreehandPoints = useCallback(() => {
    setFreehandPoints([]);
  }, []);

  // Context 값 구성
  const contextValue: CanvasContextType = {
    // 상태
    shapes,
    selectedShapeId,
    currentMode,
    currentTool,
    currentColor,
    strokeWidth,
    isDragging,
    dragStart,
    dragShape,
    freehandPoints,
    
    // 액션들
    addShape,
    updateShape,
    deleteShape,
    clearAllShapes,
    selectShape,
    setMode,
    setTool,
    setColor,
    setStrokeWidth: setStrokeWidthValue,
    startDrag,
    updateDrag,
    endDrag,
    addFreehandPoint,
    clearFreehandPoints,
  };

  return (
    <CanvasContext.Provider value={contextValue}>
      {children}
    </CanvasContext.Provider>
  );
}

// Canvas Context 사용 훅
export function useCanvas() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
}