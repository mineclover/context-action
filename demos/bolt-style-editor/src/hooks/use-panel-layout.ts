import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_PANEL_LAYOUT,
  normalizePanelLayout,
  type PanelLayoutPreferenceRepository,
  type PanelLayoutState,
  PREVIEW_WIDTH_RANGE,
  SIDEBAR_WIDTH_RANGE,
} from '../panel-layout-contract';

export type { PanelLayoutState } from '../panel-layout-contract';

function clamp(value: number, range: { min: number; max: number }): number {
  return Math.min(range.max, Math.max(range.min, value));
}

export function usePanelLayout(repository: PanelLayoutPreferenceRepository) {
  const [layout, setLayout] = useState<PanelLayoutState>(DEFAULT_PANEL_LAYOUT);
  const [hydrated, setHydrated] = useState(false);
  const layoutTouchedRef = useRef(false);

  useEffect(() => {
    let disposed = false;
    void repository
      .loadPanelLayout()
      .then((storedLayout) => {
        if (disposed) return;
        if (!layoutTouchedRef.current && storedLayout) {
          setLayout(normalizePanelLayout(storedLayout));
        }
        setHydrated(true);
      })
      .catch(() => {
        if (!disposed) setHydrated(true);
      });
    return () => {
      disposed = true;
    };
  }, [repository]);

  useEffect(() => {
    if (!hydrated) return;
    void repository.savePanelLayout(layout).catch(() => {
      // Layout preferences are best-effort and should not affect the editor.
    });
  }, [hydrated, layout, repository]);

  const updateLayout = useCallback(
    (update: (current: PanelLayoutState) => PanelLayoutState) => {
      layoutTouchedRef.current = true;
      setLayout(update);
    },
    []
  );

  const toggleSidebar = useCallback(() => {
    updateLayout((current) => ({
      ...current,
      sidebarCollapsed: !current.sidebarCollapsed,
    }));
  }, [updateLayout]);

  const togglePreview = useCallback(() => {
    updateLayout((current) => ({
      ...current,
      previewCollapsed: !current.previewCollapsed,
    }));
  }, [updateLayout]);

  const resizeSidebar = useCallback(
    (delta: number) => {
      updateLayout((current) => ({
        ...current,
        sidebarWidth: clamp(current.sidebarWidth + delta, SIDEBAR_WIDTH_RANGE),
      }));
    },
    [updateLayout]
  );

  const resizePreview = useCallback(
    (delta: number) => {
      updateLayout((current) => ({
        ...current,
        previewWidth: clamp(current.previewWidth - delta, PREVIEW_WIDTH_RANGE),
      }));
    },
    [updateLayout]
  );

  return {
    ...layout,
    resizePreview,
    resizeSidebar,
    togglePreview,
    toggleSidebar,
  };
}
