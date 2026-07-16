import { useStoreValue } from '@context-action/react';
import type {
  CanvasShape,
  CanvasStoreState,
  Point,
} from './contexts/CanvasContexts';
import {
  useCanvasAction,
  useCanvasActionHandler,
  useCanvasStore,
  useCanvasStoreManager,
} from './contexts/CanvasContexts';

export type {
  CanvasActions,
  CanvasShape,
  CanvasStoreState,
  Point,
} from './contexts/CanvasContexts';
export { CanvasProvider } from './handlers/CanvasHandlerRegistry';

// 선택적 Canvas 상태 구독 훅 (필요한 상태만 구독)
export function useCanvasState(keys?: Array<keyof CanvasStoreState>) {
  const defaultKeys: Array<keyof CanvasStoreState> = [
    'shapes',
    'selectedShapeId',
    'currentMode',
    'currentTool',
    'currentColor',
    'strokeWidth',
    'isDragging',
    'dragStart',
    'dragShape',
    'freehandPoints',
  ];

  const storeKeys = keys || defaultKeys;
  const shapesStore = useCanvasStore('shapes');
  const selectedShapeIdStore = useCanvasStore('selectedShapeId');
  const currentModeStore = useCanvasStore('currentMode');
  const currentToolStore = useCanvasStore('currentTool');
  const currentColorStore = useCanvasStore('currentColor');
  const strokeWidthStore = useCanvasStore('strokeWidth');
  const isDraggingStore = useCanvasStore('isDragging');
  const dragStartStore = useCanvasStore('dragStart');
  const dragShapeStore = useCanvasStore('dragShape');
  const freehandPointsStore = useCanvasStore('freehandPoints');

  const allValues = {
    shapes: useStoreValue(shapesStore),
    selectedShapeId: useStoreValue(selectedShapeIdStore),
    currentMode: useStoreValue(currentModeStore),
    currentTool: useStoreValue(currentToolStore),
    currentColor: useStoreValue(currentColorStore),
    strokeWidth: useStoreValue(strokeWidthStore),
    isDragging: useStoreValue(isDraggingStore),
    dragStart: useStoreValue(dragStartStore),
    dragShape: useStoreValue(dragShapeStore),
    freehandPoints: useStoreValue(freehandPointsStore),
  };

  const result = {} as Record<keyof CanvasStoreState, unknown>;
  for (const key of storeKeys) result[key] = allValues[key];
  return result as Pick<CanvasStoreState, (typeof storeKeys)[number]>;
}

// Context-Action 기반 Canvas 사용 훅들 (기존 호환성을 위해 유지)
export function useCanvas() {
  const shapesStore = useCanvasStore('shapes');
  const selectedShapeIdStore = useCanvasStore('selectedShapeId');
  const currentModeStore = useCanvasStore('currentMode');
  const currentToolStore = useCanvasStore('currentTool');
  const currentColorStore = useCanvasStore('currentColor');
  const strokeWidthStore = useCanvasStore('strokeWidth');
  const isDraggingStore = useCanvasStore('isDragging');
  const dragStartStore = useCanvasStore('dragStart');
  const dragShapeStore = useCanvasStore('dragShape');
  const freehandPointsStore = useCanvasStore('freehandPoints');

  const shapes = useStoreValue(shapesStore);
  const selectedShapeId = useStoreValue(selectedShapeIdStore);
  const currentMode = useStoreValue(currentModeStore);
  const currentTool = useStoreValue(currentToolStore);
  const currentColor = useStoreValue(currentColorStore);
  const strokeWidth = useStoreValue(strokeWidthStore);
  const isDragging = useStoreValue(isDraggingStore);
  const dragStart = useStoreValue(dragStartStore);
  const dragShape = useStoreValue(dragShapeStore);
  const freehandPoints = useStoreValue(freehandPointsStore);
  const dispatch = useCanvasAction();

  const actions = {
    addShape: (shape: CanvasShape) => dispatch('addShape', { shape }),
    updateShape: (id: string, updates: Partial<CanvasShape>) =>
      dispatch('updateShape', { id, updates }),
    deleteShape: (id: string) => dispatch('deleteShape', { id }),
    clearAllShapes: () => dispatch('clearAllShapes'),
    selectShape: (id: string | null) => dispatch('selectShape', { id }),
    setMode: (mode: 'draw' | 'select') => dispatch('setMode', { mode }),
    setTool: (tool: 'rectangle' | 'circle' | 'line' | 'freehand') =>
      dispatch('setTool', { tool }),
    setColor: (color: string) => dispatch('setColor', { color }),
    setStrokeWidth: (width: number) => dispatch('setStrokeWidth', { width }),
    startDrag: (point: Point, shape?: CanvasShape) =>
      dispatch('startDrag', {
        point,
        ...(shape !== undefined && { shape }),
      }),
    updateDrag: (point: Point) => dispatch('updateDrag', { point }),
    endDrag: () => dispatch('endDrag'),
    addFreehandPoint: (point: Point) => dispatch('addFreehandPoint', { point }),
    clearFreehandPoints: () => dispatch('clearFreehandPoints'),
  };

  return {
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
    ...actions,
  };
}

export {
  useCanvasAction,
  useCanvasActionHandler,
  useCanvasStore,
  useCanvasStoreManager,
};
