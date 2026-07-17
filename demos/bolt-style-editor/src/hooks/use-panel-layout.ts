import { useCallback, useEffect, useState } from 'react';

export type PanelLayoutState = {
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  previewCollapsed: boolean;
  previewWidth: number;
};

const PANEL_LAYOUT_STORAGE_KEY = 'context-action.web-coding.panel-layout';
const DEFAULT_PANEL_LAYOUT: PanelLayoutState = {
  sidebarCollapsed: false,
  sidebarWidth: 236,
  previewCollapsed: false,
  previewWidth: 380,
};
const SIDEBAR_WIDTH_RANGE = { min: 190, max: 420 };
const PREVIEW_WIDTH_RANGE = { min: 300, max: 720 };

function clamp(value: number, range: { min: number; max: number }): number {
  return Math.min(range.max, Math.max(range.min, value));
}

function readStoredPanelLayout(): PanelLayoutState {
  if (typeof window === 'undefined') return DEFAULT_PANEL_LAYOUT;

  try {
    const stored = window.localStorage.getItem(PANEL_LAYOUT_STORAGE_KEY);
    if (!stored) return DEFAULT_PANEL_LAYOUT;
    const parsed = JSON.parse(stored) as Partial<PanelLayoutState>;
    return {
      sidebarCollapsed: parsed.sidebarCollapsed === true,
      sidebarWidth: clamp(
        typeof parsed.sidebarWidth === 'number'
          ? parsed.sidebarWidth
          : DEFAULT_PANEL_LAYOUT.sidebarWidth,
        SIDEBAR_WIDTH_RANGE
      ),
      previewCollapsed: parsed.previewCollapsed === true,
      previewWidth: clamp(
        typeof parsed.previewWidth === 'number'
          ? parsed.previewWidth
          : DEFAULT_PANEL_LAYOUT.previewWidth,
        PREVIEW_WIDTH_RANGE
      ),
    };
  } catch {
    return DEFAULT_PANEL_LAYOUT;
  }
}

export function usePanelLayout() {
  const [layout, setLayout] = useState<PanelLayoutState>(readStoredPanelLayout);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        PANEL_LAYOUT_STORAGE_KEY,
        JSON.stringify(layout)
      );
    } catch {
      // Layout preferences are best-effort and should not affect the editor.
    }
  }, [layout]);

  const toggleSidebar = useCallback(() => {
    setLayout((current) => ({
      ...current,
      sidebarCollapsed: !current.sidebarCollapsed,
    }));
  }, []);

  const togglePreview = useCallback(() => {
    setLayout((current) => ({
      ...current,
      previewCollapsed: !current.previewCollapsed,
    }));
  }, []);

  const resizeSidebar = useCallback((delta: number) => {
    setLayout((current) => ({
      ...current,
      sidebarWidth: clamp(current.sidebarWidth + delta, SIDEBAR_WIDTH_RANGE),
    }));
  }, []);

  const resizePreview = useCallback((delta: number) => {
    setLayout((current) => ({
      ...current,
      previewWidth: clamp(current.previewWidth - delta, PREVIEW_WIDTH_RANGE),
    }));
  }, []);

  return {
    ...layout,
    resizePreview,
    resizeSidebar,
    togglePreview,
    toggleSidebar,
  };
}
