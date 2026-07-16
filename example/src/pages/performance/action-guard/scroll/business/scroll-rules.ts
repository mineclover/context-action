export interface ScrollItem {
  id: string;
  title: string;
  content: string;
  color: string;
  timestamp: string;
  numericId: number;
  category: string;
  priority: number;
}

export interface ScrollPositionPayload {
  scrollTop: number;
  scrollLeft: number;
  element: string;
  velocity: number;
  direction: 'up' | 'down';
}

export interface ScrollData extends ScrollPositionPayload {}

export interface ScrollMetrics {
  totalScrolls: number;
  averageScrollSpeed: number;
  maxScrollDepth: number;
  virtualizedItems: number;
  loadedPages: number;
  performanceScore: number;
}

export interface VirtualizationState {
  startIndex: number;
  endIndex: number;
  itemHeight: number;
  containerHeight: number;
}

export const categories = ['Article', 'Tutorial', 'News', 'Guide', 'Reference'];

export const priorityColors = [
  'hsl(220, 70%, 88%)',
  'hsl(180, 70%, 88%)',
  'hsl(140, 70%, 88%)',
  'hsl(60, 70%, 88%)',
  'hsl(300, 70%, 88%)',
];

export const initialScrollData: ScrollData = {
  scrollTop: 0,
  scrollLeft: 0,
  element: '',
  velocity: 0,
  direction: 'down',
};

export const initialVirtualization: VirtualizationState = {
  startIndex: 0,
  endIndex: 10,
  itemHeight: 100,
  containerHeight: 400,
};

export function createInitialScrollMetrics(): ScrollMetrics {
  return {
    totalScrolls: 0,
    averageScrollSpeed: 0,
    maxScrollDepth: 0,
    virtualizedItems: 0,
    loadedPages: 1,
    performanceScore: 95,
  };
}

export function generateScrollContent(
  page: number,
  itemsPerPage = 20,
  startId = 0,
  random: () => number = Math.random,
  now = Date.now()
): ScrollItem[] {
  return Array.from({ length: itemsPerPage }, (_, index) => {
    const id = startId + index + 1;
    const category = categories[Math.floor(random() * categories.length)]!;
    const priority = Math.floor(random() * priorityColors.length);
    const timestamp = new Date(now - random() * 86400000 * 30)
      .toISOString()
      .split('T')[0]!;

    return {
      id: `scroll-item-${id}`,
      title: `${category} Item #${id}`,
      content: `이것은 ${id}번째 스크롤 아이템입니다. Context-Action 프레임워크의 무한 스크롤 기능을 테스트하기 위한 샘플 컨텐츠로, 가상화된 렌더링과 성능 최적화를 보여줍니다. 카테고리: ${category}, 우선순위: ${priority + 1}`,
      color: priorityColors[priority]!,
      timestamp,
      numericId: id,
      category,
      priority,
    };
  });
}

export function calculateVirtualization(
  scrollTop: number,
  clientHeight: number,
  itemHeight: number,
  contentLength: number
): Pick<VirtualizationState, 'startIndex' | 'endIndex'> {
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(clientHeight / itemHeight) + 2,
    contentLength
  );

  return { startIndex, endIndex };
}

export function deriveScrollPosition(
  payload: ScrollPositionPayload,
  lastScrollTop: number,
  lastScrollTime: number,
  now = Date.now()
): { data: ScrollData; lastScrollTop: number; lastScrollTime: number } {
  const timeDelta = now - lastScrollTime;
  const scrollDelta = Math.abs(payload.scrollTop - lastScrollTop);

  if (timeDelta <= 0) {
    return {
      data: payload,
      lastScrollTop: payload.scrollTop,
      lastScrollTime: now,
    };
  }

  return {
    data: {
      ...payload,
      velocity: scrollDelta / timeDelta,
      direction: payload.scrollTop > lastScrollTop ? 'down' : 'up',
    },
    lastScrollTop: payload.scrollTop,
    lastScrollTime: now,
  };
}

export function recordScroll(
  metrics: ScrollMetrics,
  scrollTop: number
): ScrollMetrics {
  return {
    ...metrics,
    totalScrolls: metrics.totalScrolls + 1,
    maxScrollDepth: Math.max(metrics.maxScrollDepth, scrollTop),
  };
}

export function recordContentLoad(
  metrics: ScrollMetrics,
  page: number,
  loadTime: number
): ScrollMetrics {
  return {
    ...metrics,
    loadedPages: page + 1,
    performanceScore: Math.max(
      90,
      metrics.performanceScore - (loadTime > 1000 ? 1 : 0)
    ),
  };
}

export function mergeVirtualization(
  current: VirtualizationState,
  next: Pick<VirtualizationState, 'startIndex' | 'endIndex'>
): VirtualizationState {
  return { ...current, ...next };
}
