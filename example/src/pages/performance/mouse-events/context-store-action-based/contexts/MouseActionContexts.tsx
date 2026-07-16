import { createActionContext, createStoreContext } from '@context-action/react';
import type { ReactNode } from 'react';

export interface MousePosition {
  x: number;
  y: number;
}

export interface ClickHistory {
  x: number;
  y: number;
  timestamp: number;
}

export interface MouseStateData {
  mousePosition: MousePosition;
  previousPosition: MousePosition;
  isInsideArea: boolean;
  isMoving: boolean;
  moveCount: number;
  clickCount: number;
  velocity: number;
  lastMoveTime: number | null;
  movePath: MousePosition[];
  clickHistory: ClickHistory[];
  validPath: MousePosition[];
  recentClickCount: number;
  averageVelocity: number;
  activityStatus: 'idle' | 'moving' | 'clicking';
  totalEvents: number;
  hasActivity: boolean;
}

export interface MouseActions {
  mouseMove: { position: MousePosition; timestamp: number };
  mouseClick: { position: MousePosition; button: number; timestamp: number };
  mouseEnter: { position: MousePosition; timestamp: number };
  mouseLeave: { position: MousePosition; timestamp: number };
  moveEnd: { position: MousePosition; timestamp: number };
  reset: void;
}

export const initialMouseState: MouseStateData = {
  mousePosition: { x: -999, y: -999 },
  previousPosition: { x: -999, y: -999 },
  isInsideArea: false,
  isMoving: false,
  moveCount: 0,
  clickCount: 0,
  velocity: 0,
  lastMoveTime: null,
  movePath: [],
  clickHistory: [],
  validPath: [],
  recentClickCount: 0,
  averageVelocity: 0,
  activityStatus: 'idle',
  totalEvents: 0,
  hasActivity: false,
};

const MouseActionContext = createActionContext<MouseActions>({
  name: 'Mouse-actions',
});

const MouseStoreContext = createStoreContext('Mouse-stores', {
  mouseState: {
    initialValue: initialMouseState,
    strategy: 'shallow',
    debug: process.env.NODE_ENV === 'development',
    description: 'Mouse state store with shallow comparison',
    tags: ['mouse', 'events', 'state'],
    version: '1.0.0',
  },
});

export const {
  Provider: MouseActionProvider,
  useActionDispatch: useMouseActionDispatch,
  useActionHandler: useMouseActionHandler,
} = MouseActionContext;

export const {
  Provider: MouseStoreProvider,
  useStore: useMouseStore,
  useStoreManager: useMouseStoreManager,
} = MouseStoreContext;

export function MouseProvider({
  children,
  registryId,
}: {
  children: ReactNode;
  registryId?: string;
}) {
  return (
    <MouseActionProvider>
      <MouseStoreProvider registryId={registryId}>
        {children}
      </MouseStoreProvider>
    </MouseActionProvider>
  );
}
