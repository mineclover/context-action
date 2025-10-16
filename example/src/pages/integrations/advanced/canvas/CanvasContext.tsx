import type { ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createStoreContext,
  useStoreValue,
} from '@context-action/react';
import { ReactNode, useCallback, useRef } from 'react';

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

// Canvas Store 상태 정의 (Context-Action Store Pattern)
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

// Canvas Actions 정의 (Context-Action Action Pattern)
export interface CanvasActions extends ActionPayloadMap {
  // 도형 관리 액션들
  addShape: { shape: CanvasShape };
  updateShape: { id: string; updates: Partial<CanvasShape> };
  deleteShape: { id: string };
  clearAllShapes: void;
  selectShape: { id: string | null };

  // 모드 및 도구 설정 액션들
  setMode: { mode: 'draw' | 'select' };
  setTool: { tool: 'rectangle' | 'circle' | 'line' | 'freehand' };
  setColor: { color: string };
  setStrokeWidth: { width: number };

  // 드래그 상태 관리 액션들
  startDrag: { point: Point; shape?: CanvasShape };
  updateDrag: { point: Point };
  endDrag: void;

  // Freehand 포인트 관리 액션들
  addFreehandPoint: { point: Point };
  clearFreehandPoints: void;
}

// Context-Action Store Context 생성 (Store Pattern)
const {
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

// Context-Action Action Context 생성 (Action Pattern)
const {
  Provider: CanvasActionProvider,
  useActionDispatch: useCanvasAction,
  useActionHandler: useCanvasActionHandler,
} = createActionContext<CanvasActions>('Canvas');

// 참조 안정성을 위한 상수 정의
const EMPTY_POINTS_ARRAY: Point[] = [];
const EMPTY_SHAPES_ARRAY: CanvasShape[] = [];

// 통합 Canvas Provider 컴포넌트
export function CanvasProvider({ children }: { children: ReactNode }) {
  return (
    <CanvasStoreProvider>
      <CanvasActionProvider>
        <CanvasActionHandlers />
        {children}
      </CanvasActionProvider>
    </CanvasStoreProvider>
  );
}

// Canvas Action Handlers 컴포넌트
function CanvasActionHandlers() {
  const stores = useCanvasStoreManager();

  // Ref로 최신 상태 관리 (무한 루프 방지)
  const shapesRef = useRef<CanvasShape[]>([]);
  const shapes = stores.getStore('shapes').getValue();
  shapesRef.current = shapes;

  // 도형 관리 액션 핸들러들
  useCanvasActionHandler(
    'addShape',
    useCallback(
      async (payload) => {
        const shapesStore = stores.getStore('shapes');
        const currentShapes = shapesStore.getValue();
        shapesStore.setValue([...currentShapes, payload.shape]);
      },
      [stores]
    )
  );

  useCanvasActionHandler(
    'updateShape',
    useCallback(
      async (payload) => {
        const shapesStore = stores.getStore('shapes');
        const currentShapes = shapesStore.getValue();
        const updatedShapes = currentShapes.map((shape) =>
          shape.id === payload.id ? { ...shape, ...payload.updates } : shape
        );
        shapesStore.setValue(updatedShapes);
      },
      [stores]
    )
  );

  useCanvasActionHandler(
    'deleteShape',
    useCallback(
      async (payload) => {
        const shapesStore = stores.getStore('shapes');
        const selectedShapeIdStore = stores.getStore('selectedShapeId');
        const currentShapes = shapesStore.getValue();
        const currentSelectedId = selectedShapeIdStore.getValue();

        const filteredShapes = currentShapes.filter(
          (shape) => shape.id !== payload.id
        );
        shapesStore.setValue(filteredShapes);

        if (currentSelectedId === payload.id) {
          selectedShapeIdStore.setValue(null);
        }
      },
      [stores]
    )
  );

  useCanvasActionHandler(
    'clearAllShapes',
    useCallback(async () => {
      stores.getStore('shapes').setValue(EMPTY_SHAPES_ARRAY);
      stores.getStore('selectedShapeId').setValue(null);
    }, [stores])
  );

  useCanvasActionHandler(
    'selectShape',
    useCallback(
      async (payload) => {
        stores.getStore('selectedShapeId').setValue(payload.id);
      },
      [stores]
    )
  );

  // 모드 및 도구 설정 액션 핸들러들
  useCanvasActionHandler(
    'setMode',
    useCallback(
      async (payload) => {
        stores.getStore('currentMode').setValue(payload.mode);
        if (payload.mode === 'draw') {
          stores.getStore('selectedShapeId').setValue(null);
        }
      },
      [stores]
    )
  );

  useCanvasActionHandler(
    'setTool',
    useCallback(
      async (payload) => {
        stores.getStore('currentTool').setValue(payload.tool);
      },
      [stores]
    )
  );

  useCanvasActionHandler(
    'setColor',
    useCallback(
      async (payload) => {
        stores.getStore('currentColor').setValue(payload.color);
      },
      [stores]
    )
  );

  useCanvasActionHandler(
    'setStrokeWidth',
    useCallback(
      async (payload) => {
        stores.getStore('strokeWidth').setValue(payload.width);
      },
      [stores]
    )
  );

  // 드래그 상태 관리 액션 핸들러들
  useCanvasActionHandler(
    'startDrag',
    useCallback(
      async (payload) => {
        stores.getStore('isDragging').setValue(true);
        stores.getStore('dragStart').setValue(payload.point);
        stores.getStore('dragShape').setValue(payload.shape || null);
      },
      [stores]
    )
  );

  useCanvasActionHandler(
    'updateDrag',
    useCallback(
      async (payload) => {
        // 드래그 업데이트 로직은 사용하는 곳에서 처리
        // 필요시 dragStart와 현재 point로 계산된 결과를 업데이트
      },
      [stores]
    )
  );

  useCanvasActionHandler(
    'endDrag',
    useCallback(async () => {
      stores.getStore('isDragging').setValue(false);
      stores.getStore('dragShape').setValue(null);
      stores.getStore('freehandPoints').setValue(EMPTY_POINTS_ARRAY);
    }, [stores])
  );

  // Freehand 포인트 관리 핸들러들
  useCanvasActionHandler(
    'addFreehandPoint',
    useCallback(
      async (payload) => {
        const freehandPointsStore = stores.getStore('freehandPoints');
        const currentPoints = freehandPointsStore.getValue();
        freehandPointsStore.setValue([...currentPoints, payload.point]);
      },
      [stores]
    )
  );

  useCanvasActionHandler(
    'clearFreehandPoints',
    useCallback(async () => {
      stores.getStore('freehandPoints').setValue(EMPTY_POINTS_ARRAY);
    }, [stores])
  );

  return null; // 이 컴포넌트는 핸들러만 등록하고 UI를 렌더링하지 않음
}

// 선택적 Canvas 상태 구독 훅 (필요한 상태만 구독)
export function useCanvasState(keys?: Array<keyof CanvasStoreState>) {
  // 기본값: 모든 store 구독 (기존 호환성 유지)
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

  // 모든 store들을 먼저 가져오기 (hooks는 최상위에서만)
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

  // 모든 값들을 구독
  const shapesValue = useStoreValue(shapesStore);
  const selectedShapeIdValue = useStoreValue(selectedShapeIdStore);
  const currentModeValue = useStoreValue(currentModeStore);
  const currentToolValue = useStoreValue(currentToolStore);
  const currentColorValue = useStoreValue(currentColorStore);
  const strokeWidthValue = useStoreValue(strokeWidthStore);
  const isDraggingValue = useStoreValue(isDraggingStore);
  const dragStartValue = useStoreValue(dragStartStore);
  const dragShapeValue = useStoreValue(dragShapeStore);
  const freehandPointsValue = useStoreValue(freehandPointsStore);

  // 모든 값들의 매핑
  const allValues = {
    shapes: shapesValue,
    selectedShapeId: selectedShapeIdValue,
    currentMode: currentModeValue,
    currentTool: currentToolValue,
    currentColor: currentColorValue,
    strokeWidth: strokeWidthValue,
    isDragging: isDraggingValue,
    dragStart: dragStartValue,
    dragShape: dragShapeValue,
    freehandPoints: freehandPointsValue,
  };

  // 선택된 키들만 반환
  const result = {} as any;
  for (const key of storeKeys) {
    result[key] = allValues[key];
  }

  return result as Pick<CanvasStoreState, (typeof storeKeys)[number]>;
}

// Context-Action 기반 Canvas 사용 훅들 (기존 호환성을 위해 유지)
export function useCanvas() {
  // Store들을 선언적으로 가져오기
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

  // Store 값들을 구독
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

  // Action dispatch 함수
  const dispatch = useCanvasAction();

  // 편의를 위한 액션 래퍼 함수들
  const actions = {
    // 도형 관리
    addShape: (shape: CanvasShape) => dispatch('addShape', { shape }),
    updateShape: (id: string, updates: Partial<CanvasShape>) =>
      dispatch('updateShape', { id, updates }),
    deleteShape: (id: string) => dispatch('deleteShape', { id }),
    clearAllShapes: () => dispatch('clearAllShapes'),
    selectShape: (id: string | null) => dispatch('selectShape', { id }),

    // 모드 및 도구 설정
    setMode: (mode: 'draw' | 'select') => dispatch('setMode', { mode }),
    setTool: (tool: 'rectangle' | 'circle' | 'line' | 'freehand') =>
      dispatch('setTool', { tool }),
    setColor: (color: string) => dispatch('setColor', { color }),
    setStrokeWidth: (width: number) => dispatch('setStrokeWidth', { width }),

    // 드래그 상태 관리
    startDrag: (point: Point, shape?: CanvasShape) =>
      dispatch('startDrag', {
        point,
        ...(shape !== undefined && { shape }),
      }),
    updateDrag: (point: Point) => dispatch('updateDrag', { point }),
    endDrag: () => dispatch('endDrag'),

    // Freehand 포인트 관리
    addFreehandPoint: (point: Point) => dispatch('addFreehandPoint', { point }),
    clearFreehandPoints: () => dispatch('clearFreehandPoints'),
  };

  return {
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
    ...actions,
  };
}

// 개별 Store 접근을 위한 편의 훅들
export {
  useCanvasStore,
  useCanvasStoreManager,
  useCanvasAction,
  useCanvasActionHandler,
};
