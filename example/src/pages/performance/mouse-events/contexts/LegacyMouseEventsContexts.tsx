import type { ActionPayloadMap } from '@context-action/core';
import { createActionContext, createStoreContext } from '@context-action/react';

export interface BasicMousePosition {
  x: number;
  y: number;
}

export interface BasicMouseHoverZones {
  [zoneName: string]: boolean;
}

export interface BasicMouseEventLogEntry {
  id: string;
  type: 'Click' | 'Move' | 'Enter' | 'Leave';
  details: string;
  timestamp: number;
}

export interface BasicMouseActions extends ActionPayloadMap {
  handleMouseClick: { x: number; y: number; button: string; target: string };
  handleMouseMove: {
    x: number;
    y: number;
    movementX: number;
    movementY: number;
  };
  handleMouseEnter: { target: string; timestamp: number };
  handleMouseLeave: { target: string; timestamp: number };
  clearEventLog: void;
}

export interface BasicMouseStores {
  eventLog: BasicMouseEventLogEntry[];
  mousePosition: BasicMousePosition;
  hoverZones: BasicMouseHoverZones;
  clickCount: number;
}

export const {
  Provider: MouseActionProvider,
  useActionDispatch: useBasicMouseAction,
  useActionHandler: useBasicMouseActionHandler,
} = createActionContext<BasicMouseActions>('BasicMouse-actions');

export const { Provider: MouseStoreProvider, useStore: useBasicMouseStore } =
  createStoreContext<BasicMouseStores>('BasicMouse-stores', {
    eventLog: {
      initialValue: [],
      strategy: 'reference',
      description: 'Event entries rendered by the legacy mouse demo.',
    },
    mousePosition: {
      initialValue: { x: 0, y: 0 },
      strategy: 'shallow',
    },
    hoverZones: {
      initialValue: {},
      strategy: 'shallow',
    },
    clickCount: {
      initialValue: 0,
    },
  });
