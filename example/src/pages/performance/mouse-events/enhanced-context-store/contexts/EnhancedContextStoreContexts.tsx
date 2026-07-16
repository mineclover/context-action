/**
 * Canonical Context-Action contracts for the enhanced context-store mouse usecase.
 *
 * Context declarations stay independent from handler orchestration and views.
 * The old `context/MouseEventsModel.tsx` path remains a compatibility export.
 */

import {
  createActionContext,
  createRefContext,
  createStoreContext,
} from '@context-action/react';

export interface MousePosition {
  x: number;
  y: number;
  timestamp: number;
}

export interface MouseMovement {
  velocity: number;
  distance: number;
  isMoving: boolean;
  path: Array<{ x: number; y: number; timestamp: number }>;
  moveCount: number;
}

export interface MouseClick {
  x: number;
  y: number;
  button: number;
  timestamp: number;
}

export interface MouseClicks {
  total: number;
  history: MouseClick[];
  recent: MouseClick[];
}

export interface ComputedMetrics {
  averageVelocity: number;
  maxVelocity: number;
  totalDistance: number;
  sessionDuration: number;
  eventsPerSecond: number;
}

export interface ActivityStatus {
  current: 'idle' | 'moving' | 'clicking';
  lastActivity: number;
  isInsideArea: boolean;
  sessionStartTime: number;
}

export interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  avgRenderTime: number;
  memoryUsage: number;
}

export interface MouseEventRefs
  extends Record<string, HTMLElement | SVGElement> {
  container: HTMLDivElement;
  cursor: HTMLDivElement;
  pathSvg: SVGPathElement;
  coordinates: HTMLDivElement;
  clickMarkers: HTMLDivElement;
}

export interface MouseEventActions {
  updatePosition: { x: number; y: number; timestamp: number };
  recordClick: MouseClick;
  enterArea: { x: number; y: number; timestamp: number };
  leaveArea: { timestamp: number };
  reset: void;
}

export const { Provider: MouseStoreProvider, useStore: useMouseStore } =
  createStoreContext('MouseEvents', {
    position: {
      x: -999,
      y: -999,
      timestamp: 0,
    } as MousePosition,
    movement: {
      velocity: 0,
      distance: 0,
      isMoving: false,
      path: [],
      moveCount: 0,
    } as MouseMovement,
    clicks: {
      total: 0,
      history: [],
      recent: [],
    } as MouseClicks,
    computed: {
      averageVelocity: 0,
      maxVelocity: 0,
      totalDistance: 0,
      sessionDuration: 0,
      eventsPerSecond: 0,
    } as ComputedMetrics,
    activity: {
      current: 'idle' as const,
      lastActivity: 0,
      isInsideArea: false,
      sessionStartTime: Date.now(),
    } as ActivityStatus,
    performance: {
      renderCount: 0,
      lastRenderTime: 0,
      avgRenderTime: 0,
      memoryUsage: 0,
    } as PerformanceMetrics,
  });

export const {
  Provider: MouseActionProvider,
  useActionDispatch: useMouseAction,
  useActionHandler: useMouseActionHandler,
} = createActionContext<MouseEventActions>('MouseEvents');

export const {
  Provider: MouseRefProvider,
  useRefHandler: useMouseRef,
  useRefMountState: useMouseRefMountState,
  useOnMountStateChange: useMouseOnMountStateChange,
  useRefMountChecker: useMouseRefMountChecker,
} = createRefContext<MouseEventRefs>('MouseEvents');
