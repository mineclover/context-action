import React, { useCallback } from 'react';
import type { CanvasShape, Point } from '../contexts/CanvasContexts';
import {
  CanvasActionProvider,
  CanvasStoreProvider,
  useCanvasActionHandler,
  useCanvasStoreManager,
} from '../contexts/CanvasContexts';

const EMPTY_POINTS_ARRAY: Point[] = [];
const EMPTY_SHAPES_ARRAY: CanvasShape[] = [];

function CanvasHandlerRegistry({ children }: { children: React.ReactNode }) {
  const stores = useCanvasStoreManager();

  useCanvasActionHandler(
    'addShape',
    useCallback(
      async (payload) => {
        const shapesStore = stores.getStore('shapes');
        shapesStore.setValue([...shapesStore.getValue(), payload.shape]);
      },
      [stores]
    )
  );

  useCanvasActionHandler(
    'updateShape',
    useCallback(
      async (payload) => {
        const shapesStore = stores.getStore('shapes');
        shapesStore.setValue(
          shapesStore
            .getValue()
            .map((shape) =>
              shape.id === payload.id ? { ...shape, ...payload.updates } : shape
            )
        );
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
        shapesStore.setValue(
          shapesStore.getValue().filter((shape) => shape.id !== payload.id)
        );
        if (selectedShapeIdStore.getValue() === payload.id) {
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

  useCanvasActionHandler(
    'startDrag',
    useCallback(
      async (payload) => {
        stores.getStore('isDragging').setValue(true);
        stores.getStore('dragStart').setValue(payload.point);
        stores.getStore('dragShape').setValue(payload.shape ?? null);
      },
      [stores]
    )
  );

  useCanvasActionHandler(
    'updateDrag',
    useCallback(async () => {}, [])
  );

  useCanvasActionHandler(
    'endDrag',
    useCallback(async () => {
      stores.getStore('isDragging').setValue(false);
      stores.getStore('dragShape').setValue(null);
      stores.getStore('freehandPoints').setValue(EMPTY_POINTS_ARRAY);
    }, [stores])
  );

  useCanvasActionHandler(
    'addFreehandPoint',
    useCallback(
      async (payload) => {
        const pointsStore = stores.getStore('freehandPoints');
        pointsStore.setValue([...pointsStore.getValue(), payload.point]);
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

  return <>{children}</>;
}

export function CanvasProvider({ children }: { children: React.ReactNode }) {
  return (
    <CanvasActionProvider>
      <CanvasStoreProvider>
        <CanvasHandlerRegistry>{children}</CanvasHandlerRegistry>
      </CanvasStoreProvider>
    </CanvasActionProvider>
  );
}
