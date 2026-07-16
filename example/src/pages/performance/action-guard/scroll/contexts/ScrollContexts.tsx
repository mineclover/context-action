import type { ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createRefContext,
  createStoreContext,
} from '@context-action/react';
import type {
  ScrollData,
  ScrollItem,
  ScrollMetrics,
  ScrollPositionPayload,
  VirtualizationState,
} from '../business/scroll-rules';
import {
  createInitialScrollMetrics,
  generateScrollContent,
  initialScrollData,
  initialVirtualization,
} from '../business/scroll-rules';

export interface ScrollActions extends ActionPayloadMap {
  updateScrollPosition: ScrollPositionPayload;
  reachScrollEnd: {
    element: string;
    direction: 'top' | 'bottom' | 'left' | 'right';
  };
  loadMoreContent: { page: number; itemsPerPage: number };
  smoothScrollTo: { element: string; target: number; direction: 'x' | 'y' };
  resetScroll: { element: string };
  setAutoScroll: { enabled: boolean; speed: number };
  updateVirtualization: { startIndex: number; endIndex: number };
}

export interface ScrollStores {
  scrollData: ScrollData;
  content: ScrollItem[];
  loading: boolean;
  currentPage: number;
  autoScrolling: boolean;
  scrollSpeed: number;
  virtualization: VirtualizationState;
  metrics: ScrollMetrics;
}

export interface ScrollRefs {
  container: HTMLDivElement;
}

export const {
  Provider: ScrollActionProvider,
  useActionDispatch: useScrollAction,
  useActionHandler: useScrollActionHandler,
} = createActionContext<ScrollActions>('AdvancedScroll');

export const { Provider: ScrollStoreProvider, useStore: useScrollStore } =
  createStoreContext<ScrollStores>('AdvancedScroll', {
    scrollData: {
      initialValue: initialScrollData,
      strategy: 'shallow',
      description: 'Latest scroll position, velocity, and direction.',
    },
    content: {
      initialValue: generateScrollContent(0, 15),
      strategy: 'reference',
      description: 'Loaded content backing the virtualized scroll surface.',
    },
    loading: {
      initialValue: false,
      description: 'Whether the next content page is loading.',
    },
    currentPage: {
      initialValue: 0,
      description: 'Latest loaded content page.',
    },
    autoScrolling: {
      initialValue: false,
      description: 'Whether the 60fps auto-scroll loop is active.',
    },
    scrollSpeed: {
      initialValue: 2,
      description: 'Auto-scroll pixels advanced per frame.',
    },
    virtualization: {
      initialValue: initialVirtualization,
      strategy: 'shallow',
      description: 'Visible item window and fixed item geometry.',
    },
    metrics: {
      initialValue: createInitialScrollMetrics(),
      strategy: 'shallow',
      description: 'Scroll depth, page-load, and performance metrics.',
    },
  });

export const { Provider: ScrollRefProvider, useRefHandler: useScrollRef } =
  createRefContext<ScrollRefs>('AdvancedScrollRefs');

export type {
  ScrollData,
  ScrollItem,
  ScrollMetrics,
  ScrollPositionPayload,
  VirtualizationState,
} from '../business/scroll-rules';
