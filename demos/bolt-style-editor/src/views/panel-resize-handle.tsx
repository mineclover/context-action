import { useEffect, useRef, useState } from 'react';

export type PanelResizeHandleProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onResize: (delta: number) => void;
};

export function PanelResizeHandle({
  label,
  value,
  min,
  max,
  onResize,
}: PanelResizeHandleProps) {
  const [dragging, setDragging] = useState(false);
  const lastPointerXRef = useRef<number | null>(null);
  const onResizeRef = useRef(onResize);

  useEffect(() => {
    onResizeRef.current = onResize;
  }, [onResize]);

  useEffect(() => {
    if (!dragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      const lastPointerX = lastPointerXRef.current;
      if (lastPointerX === null) return;
      const delta = event.clientX - lastPointerX;
      if (delta === 0) return;
      lastPointerXRef.current = event.clientX;
      onResizeRef.current(delta);
    };
    const stopDragging = () => {
      lastPointerXRef.current = null;
      setDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
    };
  }, [dragging]);

  return (
    <div
      aria-label={label}
      aria-orientation="vertical"
      aria-valuemax={max}
      aria-valuemin={min}
      aria-valuenow={value}
      className={`panel-resize-handle ${dragging ? 'panel-resize-handle-dragging' : ''}`}
      onKeyDown={(event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        onResize(event.key === 'ArrowRight' ? 8 : -8);
      }}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        lastPointerXRef.current = event.clientX;
        setDragging(true);
      }}
      role="separator"
      tabIndex={0}
      title="Drag to resize, or use the left and right arrow keys"
    />
  );
}
