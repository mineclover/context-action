import type { ActionPayloadMap } from '@context-action/core';
import { createActionContext, createStoreContext } from '@context-action/react';

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

export interface CanvasStoreState {
  shapes: CanvasShape[];
  selectedShapeId: string | null;
  currentMode: 'draw' | 'select';
  currentTool: 'rectangle' | 'circle' | 'line' | 'freehand';
  currentColor: string;
  strokeWidth: number;
  isDragging: boolean;
  dragStart: Point;
  dragShape: CanvasShape | null;
  freehandPoints: Point[];
}

export interface CanvasActions extends ActionPayloadMap {
  addShape: { shape: CanvasShape };
  updateShape: { id: string; updates: Partial<CanvasShape> };
  deleteShape: { id: string };
  clearAllShapes: void;
  selectShape: { id: string | null };
  setMode: { mode: 'draw' | 'select' };
  setTool: { tool: 'rectangle' | 'circle' | 'line' | 'freehand' };
  setColor: { color: string };
  setStrokeWidth: { width: number };
  startDrag: { point: Point; shape?: CanvasShape };
  updateDrag: { point: Point };
  endDrag: void;
  addFreehandPoint: { point: Point };
  clearFreehandPoints: void;
}

export const {
  Provider: CanvasStoreProvider,
  useStore: useCanvasStore,
  useStoreManager: useCanvasStoreManager,
} = createStoreContext('Canvas', {
  shapes: { initialValue: [] as CanvasShape[] },
  selectedShapeId: { initialValue: null as string | null },
  currentMode: { initialValue: 'draw' as 'draw' | 'select' },
  currentTool: {
    initialValue: 'rectangle' as 'rectangle' | 'circle' | 'line' | 'freehand',
  },
  currentColor: { initialValue: '#000000' },
  strokeWidth: { initialValue: 2 },
  isDragging: { initialValue: false },
  dragStart: { initialValue: { x: 0, y: 0 } as Point },
  dragShape: { initialValue: null as CanvasShape | null },
  freehandPoints: { initialValue: [] as Point[] },
});

export const {
  Provider: CanvasActionProvider,
  useActionDispatch: useCanvasAction,
  useActionHandler: useCanvasActionHandler,
} = createActionContext<CanvasActions>('Canvas');
