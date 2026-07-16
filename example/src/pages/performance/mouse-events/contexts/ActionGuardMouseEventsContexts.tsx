import type { ActionPayloadMap } from '@context-action/core';
import { createActionContext, createStoreContext } from '@context-action/react';

export interface ActionGuardMousePoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface ActionGuardMouseClick extends ActionGuardMousePoint {
  button: number;
}

export interface ActionGuardMouseEventsActions extends ActionPayloadMap {
  updateMousePosition: { x: number; y: number };
  recordMouseClick: ActionGuardMouseClick;
  recordMousePathPoint: { point: ActionGuardMousePoint };
  clearMouseData: void;
  clearMousePath: void;
  setTrackingMode: { enabled: boolean };
  setPathRecording: { enabled: boolean };
}

export interface ActionGuardMouseEventsStores {
  mousePosition: { x: number; y: number };
  mouseClicks: ActionGuardMouseClick[];
  mousePath: ActionGuardMousePoint[];
  trackingEnabled: boolean;
  pathRecording: boolean;
}

export const {
  Provider: ActionGuardMouseEventsActionProvider,
  useActionDispatch: useActionGuardMouseEventsAction,
  useActionHandler: useActionGuardMouseEventsActionHandler,
} = createActionContext<ActionGuardMouseEventsActions>(
  'ActionGuardMouseEvents-actions'
);

export const {
  Provider: ActionGuardMouseEventsStoreProvider,
  useStore: useActionGuardMouseEventsStore,
} = createStoreContext<ActionGuardMouseEventsStores>(
  'ActionGuardMouseEvents-stores',
  {
    mousePosition: {
      initialValue: { x: 0, y: 0 },
      strategy: 'shallow',
      description: 'Current pointer position inside the tracking surface.',
    },
    mouseClicks: {
      initialValue: [],
      strategy: 'reference',
      description: 'The latest twenty pointer clicks.',
    },
    mousePath: {
      initialValue: [],
      strategy: 'reference',
      description: 'The latest one hundred points in the recorded path.',
    },
    trackingEnabled: {
      initialValue: false,
      description: 'Whether the cursor indicator is visible.',
    },
    pathRecording: {
      initialValue: false,
      description: 'Whether pointer moves append to the path store.',
    },
  }
);
