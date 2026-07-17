export type PanelLayoutState = {
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  previewCollapsed: boolean;
  previewWidth: number;
};

export const PANEL_LAYOUT_PREFERENCE_KEY = 'panel-layout';
export const PANEL_LAYOUT_SCHEMA_VERSION = 1;

export const DEFAULT_PANEL_LAYOUT: PanelLayoutState = {
  sidebarCollapsed: false,
  sidebarWidth: 236,
  previewCollapsed: false,
  previewWidth: 380,
};

export const SIDEBAR_WIDTH_RANGE = { min: 190, max: 420 } as const;
export const PREVIEW_WIDTH_RANGE = { min: 300, max: 720 } as const;

function clamp(value: number, range: { min: number; max: number }): number {
  return Math.min(range.max, Math.max(range.min, value));
}

export function normalizePanelLayout(value: unknown): PanelLayoutState {
  if (!value || typeof value !== 'object') return DEFAULT_PANEL_LAYOUT;
  const candidate = value as Partial<PanelLayoutState>;
  return {
    sidebarCollapsed: candidate.sidebarCollapsed === true,
    sidebarWidth: clamp(
      typeof candidate.sidebarWidth === 'number'
        ? candidate.sidebarWidth
        : DEFAULT_PANEL_LAYOUT.sidebarWidth,
      SIDEBAR_WIDTH_RANGE
    ),
    previewCollapsed: candidate.previewCollapsed === true,
    previewWidth: clamp(
      typeof candidate.previewWidth === 'number'
        ? candidate.previewWidth
        : DEFAULT_PANEL_LAYOUT.previewWidth,
      PREVIEW_WIDTH_RANGE
    ),
  };
}

export interface PanelLayoutPreferenceRepository {
  loadPanelLayout(): Promise<PanelLayoutState | undefined>;
  savePanelLayout(layout: PanelLayoutState): Promise<void>;
}
