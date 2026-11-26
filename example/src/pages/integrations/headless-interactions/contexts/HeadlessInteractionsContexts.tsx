import {
  type ActionPayloadMap,
  createActionContext,
} from '@context-action/react';

export interface TabItem {
  readonly id: 'overview' | 'audit-locked' | 'architecture' | 'migration';
  readonly label: string;
  readonly summary: string;
  readonly disabled?: boolean;
}

export const TAB_ITEMS: readonly TabItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    summary:
      'Scoped Context bundles Actions, a local Store instance, a RefCollection, and 4-role handlers in one flat Provider.',
  },
  {
    id: 'audit-locked',
    label: 'Audit (Locked)',
    summary: 'Disabled item skipped automatically by useRovingFocus.',
    disabled: true,
  },
  {
    id: 'architecture',
    label: 'Architecture',
    summary:
      'External controlled props sync cleanly via useControlledStoreSync without triggering double action loops.',
  },
  {
    id: 'migration',
    label: 'Migration v5',
    summary:
      'useStorePath(..., { select }) limits re-renders so each tab button only updates when its own selection bit flips.',
  },
];

export interface TabsActions extends ActionPayloadMap {
  focusTab: { id: TabItem['id'] };
  selectTab: { id: TabItem['id'] };
}

export interface TabsState {
  selectedId: TabItem['id'];
  focusedId: TabItem['id'];
  lastBlocked: string | null;
}

export const TabsActionCtx = createActionContext<TabsActions>(
  'HeadlessTabs:Actions',
  {
    actions: {
      focusTab: { lane: 'fast' },
      selectTab: { lane: 'orchestrated', queue: 'serial' },
    },
  }
);

export interface OverlayActions extends ActionPayloadMap {
  openOuter: void;
  closeOuter: void;
  openPopover: void;
  closePopover: void;
  setGuardClose: { enabled: boolean };
}

export interface OverlayState {
  outerOpen: boolean;
  popoverOpen: boolean;
  guardClose: boolean;
  dismissMessage: string | null;
}

export const OverlayActionCtx = createActionContext<OverlayActions>(
  'HeadlessOverlay:Actions',
  {
    actions: {
      openOuter: { lane: 'orchestrated', queue: 'serial' },
      closeOuter: { lane: 'orchestrated', queue: 'serial' },
      openPopover: { lane: 'orchestrated', queue: 'serial' },
      closePopover: { lane: 'orchestrated', queue: 'serial' },
      setGuardClose: { lane: 'fast' },
    },
  }
);

export interface SliderActions extends ActionPayloadMap {
  previewDrag: { value: number };
  commitValue: { value: number };
}

export interface SliderState {
  value: number;
}

export const SLIDER_MIN = 0;
export const SLIDER_MAX = 100;

export function clampPercent(raw: number): number {
  return Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, Math.round(raw)));
}

export const SliderActionCtx = createActionContext<SliderActions>(
  'HeadlessSlider:Actions',
  {
    actions: {
      previewDrag: { lane: 'fast' },
      commitValue: { lane: 'orchestrated', queue: 'serial' },
    },
  }
);
