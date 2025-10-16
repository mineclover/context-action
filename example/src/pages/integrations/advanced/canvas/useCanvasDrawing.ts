import { useStoreValue } from '@context-action/react';
import { useCallback, useRef } from 'react';
import { CanvasShape, Point, useCanvasStore } from './CanvasContext';

export function useCanvasDrawing() {
  // 필요한 store만 구독 - 성능 최적화
  const shapesStore = useCanvasStore('shapes');
  const selectedShapeIdStore = useCanvasStore('selectedShapeId');
  const currentModeStore = useCanvasStore('currentMode');

  const shapes = useStoreValue(shapesStore);
  const selectedShapeId = useStoreValue(selectedShapeIdStore);
  const currentMode = useStoreValue(currentModeStore);

  // Ref로 최신 상태 접근 (무한 루프 방지)
  const shapesRef = useRef<CanvasShape[]>([]);
  shapesRef.current = shapes;

  // Canvas 전체 다시 그리기
  const redrawCanvas = useCallback(
    (canvasElement: HTMLCanvasElement) => {
      const ctx = canvasElement.getContext('2d');
      if (!ctx) return;

      // Canvas 초기화
      ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      // 그리드 그리기
      ctx.save();
      ctx.strokeStyle = '#f0f0f0';
      ctx.lineWidth = 0.5;

      const gridSize = 20;

      // 세로선
      for (let x = 0; x <= canvasElement.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasElement.height);
        ctx.stroke();
      }

      // 가로선
      for (let y = 0; y <= canvasElement.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasElement.width, y);
        ctx.stroke();
      }

      ctx.restore();

      // 모든 도형 그리기
      shapesRef.current.forEach((shape) => {
        drawShape(ctx, shape);
      });

      // 선택된 도형의 선택 영역 그리기
      if (selectedShapeId && currentMode === 'select') {
        const selectedShape = shapesRef.current.find(
          (s) => s.id === selectedShapeId
        );
        if (selectedShape) {
          drawSelectionBounds(ctx, selectedShape);
        }
      }
    },
    [selectedShapeId, currentMode]
  );

  // 개별 도형 그리기
  const drawShape = useCallback(
    (ctx: CanvasRenderingContext2D, shape: CanvasShape) => {
      ctx.save();
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.strokeWidth;
      ctx.fillStyle = `${shape.color}20`; // 투명도 추가

      switch (shape.type) {
        case 'rectangle':
          ctx.beginPath();
          ctx.rect(shape.x, shape.y, shape.width, shape.height);
          ctx.fill();
          ctx.stroke();
          break;

        case 'circle': {
          const radius =
            Math.max(Math.abs(shape.width), Math.abs(shape.height)) / 2;
          const centerX = shape.x + shape.width / 2;
          const centerY = shape.y + shape.height / 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, Math.abs(radius), 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
          break;
        }

        case 'line':
          ctx.beginPath();
          ctx.moveTo(shape.x, shape.y);
          ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
          ctx.stroke();
          break;

        case 'freehand':
          if (shape.points && shape.points.length > 1) {
            ctx.beginPath();
            const firstPoint = shape.points[0];
            if (firstPoint) {
              ctx.moveTo(firstPoint.x, firstPoint.y);
              for (let i = 1; i < shape.points.length; i++) {
                const point = shape.points[i];
                if (point) {
                  ctx.lineTo(point.x, point.y);
                }
              }
            }
            ctx.stroke();
          }
          break;
      }

      ctx.restore();
    },
    []
  );

  // 선택 영역 그리기
  const drawSelectionBounds = useCallback(
    (ctx: CanvasRenderingContext2D, shape: CanvasShape) => {
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
        {
          x: shape.x + shape.width + padding,
          y: shape.y + shape.height + padding,
        }, // 우하
      ];

      handles.forEach((handle) => {
        ctx.fillRect(
          handle.x - handleSize / 2,
          handle.y - handleSize / 2,
          handleSize,
          handleSize
        );
      });

      ctx.restore();
    },
    []
  );

  // 임시 도형 그리기 (드래그 중 미리보기)
  const drawTempShape = useCallback(
    (ctx: CanvasRenderingContext2D, shape: CanvasShape) => {
      ctx.save();
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.strokeWidth;
      ctx.fillStyle = `${shape.color}20`; // 투명도 추가

      switch (shape.type) {
        case 'rectangle':
          ctx.beginPath();
          ctx.rect(shape.x, shape.y, shape.width, shape.height);
          ctx.fill();
          ctx.stroke();
          break;

        case 'circle': {
          const radius =
            Math.max(Math.abs(shape.width), Math.abs(shape.height)) / 2;
          const centerX = shape.x + shape.width / 2;
          const centerY = shape.y + shape.height / 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, Math.abs(radius), 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
          break;
        }

        case 'line':
          ctx.beginPath();
          ctx.moveTo(shape.x, shape.y);
          ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
          ctx.stroke();
          break;
      }

      ctx.restore();
    },
    []
  );

  // Freehand 미리보기 그리기
  const drawFreehandPreview = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      points: Point[],
      currentPoint: Point,
      color: string,
      strokeWidth: number
    ) => {
      if (points.length === 0) return;

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.beginPath();
      const firstPoint = points[0];
      if (firstPoint) {
        ctx.moveTo(firstPoint.x, firstPoint.y);
        points.forEach((point) => {
          if (point) {
            ctx.lineTo(point.x, point.y);
          }
        });
      }
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();
      ctx.restore();
    },
    []
  );

  // 좌표에서 도형 찾기
  const findShapeAtPoint = useCallback((point: Point): CanvasShape | null => {
    // 역순으로 검색 (최상위 도형부터)
    for (let i = shapesRef.current.length - 1; i >= 0; i--) {
      const shape = shapesRef.current[i];

      if (!shape) continue;

      if (shape.type === 'freehand') {
        // Freehand는 점들과의 거리로 판단
        if (shape.points) {
          for (const shapePoint of shape.points) {
            if (shapePoint) {
              const distance = Math.sqrt(
                (point.x - shapePoint.x) ** 2 + (point.y - shapePoint.y) ** 2
              );
              if (distance <= (shape.strokeWidth || 1) + 5) {
                return shape;
              }
            }
          }
        }
      } else {
        // 사각형, 원형, 선은 경계 박스로 판단
        if (
          point.x >= (shape.x || 0) &&
          point.x <= (shape.x || 0) + (shape.width || 0) &&
          point.y >= (shape.y || 0) &&
          point.y <= (shape.y || 0) + (shape.height || 0)
        ) {
          return shape;
        }
      }
    }

    return null;
  }, []);

  return {
    redrawCanvas,
    drawShape,
    drawSelectionBounds,
    drawTempShape,
    drawFreehandPreview,
    findShapeAtPoint,
  };
}
