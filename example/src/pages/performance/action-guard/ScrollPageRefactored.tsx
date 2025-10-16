/**
 * @fileoverview Advanced Scroll Demo - Context-Action 무한 스크롤과 가상화된 스크롤링 시스템
 *
 * 실시간 스크롤 감지, 동적 컨텐츠 로딩, 부드러운 스크롤 애니메이션을 통해
 * Context-Action 프레임워크의 Store와 Action Pipeline을 활용한
 * 무한 스크롤과 가상화된 스크롤링 시스템을 보여주는 고급 데모입니다.
 */

import {
  createActionContext,
  createStoreContext,
  useStoreValue,
} from '@context-action/react';
import { useCallback, useEffect, useMemo, useRef } from 'react';

// ===== 타입 정의 =====
interface ScrollItem {
  id: string;
  title: string;
  content: string;
  color: string;
  timestamp: string;
  numericId: number;
  category: string;
  priority: number;
}

interface ScrollActions {
  updateScrollPosition: {
    scrollTop: number;
    scrollLeft: number;
    element: string;
    velocity: number;
    direction: 'up' | 'down';
  };
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

interface ScrollMetrics {
  totalScrolls: number;
  averageScrollSpeed: number;
  maxScrollDepth: number;
  virtualizedItems: number;
  loadedPages: number;
  performanceScore: number;
}

// ===== 샘플 데이터 생성 =====
let globalItemCounter = 0;
const categories = ['Article', 'Tutorial', 'News', 'Guide', 'Reference'];
const priorityColors = [
  'hsl(220, 70%, 88%)',
  'hsl(180, 70%, 88%)',
  'hsl(140, 70%, 88%)',
  'hsl(60, 70%, 88%)',
  'hsl(300, 70%, 88%)',
];

const generateScrollContent = (
  page: number,
  itemsPerPage: number = 20
): ScrollItem[] => {
  return Array.from({ length: itemsPerPage }, (_, i) => {
    const id = ++globalItemCounter;
    const category = categories[Math.floor(Math.random() * categories.length)]!;
    const priority = Math.floor(Math.random() * 5);

    return {
      id: `scroll-item-${id}`,
      title: `${category} Item #${id}`,
      content: `이것은 ${id}번째 스크롤 아이템입니다. Context-Action 프레임워크의 무한 스크롤 기능을 테스트하기 위한 샘플 컨텐츠로, 가상화된 렌더링과 성능 최적화를 보여줍니다. 카테고리: ${category}, 우선순위: ${priority + 1}`,
      color: priorityColors[priority]!,
      timestamp: new Date(Date.now() - Math.random() * 86400000 * 30)
        .toISOString()
        .split('T')[0]!,
      numericId: id,
      category,
      priority,
    };
  });
};

// ===== Store Context =====
const { Provider: ScrollStoreProvider, useStore: useScrollStore } =
  createStoreContext('AdvancedScroll', {
    scrollData: {
      scrollTop: 0,
      scrollLeft: 0,
      element: '',
      velocity: 0,
      direction: 'down' as 'up' | 'down',
    },
    content: generateScrollContent(0, 15),
    loading: false,
    currentPage: 0,
    autoScrolling: false,
    scrollSpeed: 2,
    virtualization: {
      startIndex: 0,
      endIndex: 10,
      itemHeight: 100,
      containerHeight: 400,
    },
    metrics: {
      totalScrolls: 0,
      averageScrollSpeed: 0,
      maxScrollDepth: 0,
      virtualizedItems: 0,
      loadedPages: 1,
      performanceScore: 95,
    } as ScrollMetrics,
  });

// ===== Action Context =====
const {
  Provider: ScrollActionProvider,
  useActionDispatch,
  useActionHandler,
} = createActionContext<ScrollActions>('AdvancedScroll');

// ===== 메인 페이지 컴포넌트 =====
export function ScrollPageRefactored() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* 1. Architecture Section */}
        <ArchitectureSection />

        <ScrollStoreProvider>
          <ScrollActionProvider>
            {/* 2. Demo Section */}
            <DemoSection />

            {/* 3. Status Section */}
            <StatusSection />

            {/* 4. Code Section */}
            <CodeSection />
          </ScrollActionProvider>
        </ScrollStoreProvider>
      </div>
    </div>
  );
}

// ===== 1. Architecture Section =====
function ArchitectureSection() {
  return (
    <section className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl">
          <span className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Advanced Scroll System
          </h1>
          <p className="text-gray-600">
            무한 스크롤과 가상화된 스크롤링 시스템
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl">
            <h3 className="text-xl font-semibold text-purple-900 mb-4">
              🎯 System Architecture
            </h3>
            <div className="space-y-4 text-purple-800">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <strong>Action Pipeline:</strong> updateScrollPosition,
                  reachScrollEnd, loadMoreContent, smoothScrollTo
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <strong>Store Management:</strong> scrollData, content,
                  loading, virtualization, metrics
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <strong>Virtualization:</strong> 메모리 효율적인 대용량 데이터
                  렌더링
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
            <h3 className="text-xl font-semibold text-green-900 mb-4">
              ⚡ Key Features
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 text-green-800">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4" />
                  <span>실시간 스크롤 감지</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4" />
                  <span>가상화된 렌더링</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4" />
                  <span>무한 스크롤 로딩</span>
                </div>
              </div>
              <div className="space-y-2 text-green-800">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4" />
                  <span>성능 메트릭스 추적</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4" />
                  <span>자동 스크롤 애니메이션</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4" />
                  <span>부드러운 스크롤</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
            <h3 className="text-xl font-semibold text-blue-900 mb-4">
              🔄 Scroll Flow
            </h3>
            <div className="space-y-3 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4" />
                <span>User Scroll</span>
                <span className="w-4 h-4" />
                <span>Detection</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4" />
                <span>Position Update</span>
                <span className="w-4 h-4" />
                <span>Store</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4" />
                <span>Virtualization</span>
                <span className="w-4 h-4" />
                <span>Render</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
            <h3 className="text-xl font-semibold text-orange-900 mb-4">
              🛡️ Performance
            </h3>
            <div className="space-y-2 text-orange-800 text-sm">
              <div>• Virtualized rendering</div>
              <div>• Smooth scroll animations</div>
              <div>• Memory efficient loading</div>
              <div>• Velocity calculations</div>
              <div>• Performance monitoring</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== 2. Demo Section =====
function DemoSection() {
  return (
    <section className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          🎯 Interactive Scroll Demo
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Live Scroll Active</span>
        </div>
      </div>

      <ScrollDemoInterface />
    </section>
  );
}

// ===== Scroll Demo Interface =====
function ScrollDemoInterface() {
  const dispatch = useActionDispatch();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef<number>(0);
  const lastScrollTop = useRef<number>(0);

  // Store subscriptions
  const scrollDataStore = useScrollStore('scrollData');
  const contentStore = useScrollStore('content');
  const loadingStore = useScrollStore('loading');
  const currentPageStore = useScrollStore('currentPage');
  const autoScrollingStore = useScrollStore('autoScrolling');
  const scrollSpeedStore = useScrollStore('scrollSpeed');
  const virtualizationStore = useScrollStore('virtualization');
  const metricsStore = useScrollStore('metrics');

  const scrollData = useStoreValue(scrollDataStore);
  const content = useStoreValue(contentStore) || [];
  const loading = useStoreValue(loadingStore);
  const currentPage = useStoreValue(currentPageStore);
  const autoScrolling = useStoreValue(autoScrollingStore);
  const scrollSpeed = useStoreValue(scrollSpeedStore) || 2;
  const virtualization = useStoreValue(virtualizationStore);
  const metrics = useStoreValue(metricsStore);

  // Action handlers
  useActionHandler(
    'updateScrollPosition',
    useCallback(
      async (payload) => {
        const now = Date.now();
        const timeDelta = now - lastScrollTime.current;
        const scrollDelta = Math.abs(payload.scrollTop - lastScrollTop.current);

        if (timeDelta > 0) {
          const velocity = scrollDelta / timeDelta;
          const direction =
            payload.scrollTop > lastScrollTop.current ? 'down' : 'up';

          scrollDataStore.setValue({
            ...payload,
            velocity,
            direction,
          });
        } else {
          scrollDataStore.setValue(payload);
        }

        lastScrollTime.current = now;
        lastScrollTop.current = payload.scrollTop;

        // Update metrics
        const currentMetrics = metricsStore.getValue();
        metricsStore.setValue({
          ...currentMetrics,
          totalScrolls: currentMetrics.totalScrolls + 1,
          maxScrollDepth: Math.max(
            currentMetrics.maxScrollDepth,
            payload.scrollTop
          ),
        });
      },
      [scrollDataStore, metricsStore]
    )
  );

  useActionHandler(
    'reachScrollEnd',
    useCallback(
      async (payload) => {
        if (payload.direction === 'bottom' && !loading) {
          dispatch('loadMoreContent', {
            page: currentPageStore.getValue() + 1,
            itemsPerPage: 10,
          });
        }
      },
      [dispatch, loading, currentPageStore]
    )
  );

  useActionHandler(
    'loadMoreContent',
    useCallback(
      async (payload) => {
        loadingStore.setValue(true);

        // Loading simulation with performance tracking
        const startTime = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 800));

        const newContent = generateScrollContent(
          payload.page,
          payload.itemsPerPage
        );
        const currentContent = contentStore.getValue() || [];

        contentStore.setValue([...currentContent, ...newContent]);
        currentPageStore.setValue(payload.page);
        loadingStore.setValue(false);

        // Update metrics
        const currentMetrics = metricsStore.getValue();
        const loadTime = Date.now() - startTime;
        metricsStore.setValue({
          ...currentMetrics,
          loadedPages: payload.page + 1,
          performanceScore: Math.max(
            90,
            currentMetrics.performanceScore - (loadTime > 1000 ? 1 : 0)
          ),
        });
      },
      [loadingStore, contentStore, currentPageStore, metricsStore]
    )
  );

  useActionHandler(
    'smoothScrollTo',
    useCallback(async (payload) => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const start =
        payload.direction === 'y' ? container.scrollTop : container.scrollLeft;
      const target = payload.target;
      const distance = target - start;
      const duration = Math.abs(distance) / 2; // Variable duration based on distance
      let startTime: number | null = null;

      const animateScroll = (currentTime: number) => {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);

        // Easing function (cubic-bezier)
        const easeInOutCubic =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - (-2 * progress + 2) ** 3 / 2;

        const currentPosition = start + distance * easeInOutCubic;

        if (payload.direction === 'y') {
          container.scrollTop = currentPosition;
        } else {
          container.scrollLeft = currentPosition;
        }

        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        }
      };

      requestAnimationFrame(animateScroll);
    }, [])
  );

  useActionHandler(
    'setAutoScroll',
    useCallback(
      async (payload) => {
        autoScrollingStore.setValue(payload.enabled);
        scrollSpeedStore.setValue(payload.speed);
      },
      [autoScrollingStore, scrollSpeedStore]
    )
  );

  useActionHandler(
    'updateVirtualization',
    useCallback(
      async (payload) => {
        const currentVirt = virtualizationStore.getValue();
        virtualizationStore.setValue({
          ...currentVirt,
          ...payload,
        });
      },
      [virtualizationStore]
    )
  );

  // Auto scroll effect
  useEffect(() => {
    if (!autoScrolling) return;

    const interval = setInterval(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const newScrollTop = container.scrollTop + scrollSpeed;
      const maxScroll = container.scrollHeight - container.clientHeight;

      if (newScrollTop >= maxScroll) {
        dispatch('setAutoScroll', { enabled: false, speed: scrollSpeed });
      } else {
        container.scrollTop = newScrollTop;
      }
    }, 16); // 60fps

    return () => clearInterval(interval);
  }, [autoScrolling, scrollSpeed, dispatch]);

  // Scroll event handler
  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      const scrollTop = target.scrollTop;
      const scrollLeft = target.scrollLeft;
      const scrollHeight = target.scrollHeight;
      const clientHeight = target.clientHeight;

      const velocity = Math.abs(scrollTop - lastScrollTop.current);
      const direction = scrollTop > lastScrollTop.current ? 'down' : 'up';

      dispatch('updateScrollPosition', {
        scrollTop,
        scrollLeft,
        element: 'scroll-container',
        velocity,
        direction,
      });

      // Virtual scrolling calculation
      const itemHeight = virtualization?.itemHeight || 100;
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(
        startIndex + Math.ceil(clientHeight / itemHeight) + 2,
        content.length
      );

      dispatch('updateVirtualization', { startIndex, endIndex });

      // End detection
      if (scrollHeight - scrollTop - clientHeight < 200) {
        dispatch('reachScrollEnd', {
          element: 'scroll-container',
          direction: 'bottom',
        });
      }
    },
    [dispatch, virtualization?.itemHeight, content.length]
  );

  // Statistics
  const scrollStats = useMemo(() => {
    const totalHeight = scrollContainerRef.current?.scrollHeight || 0;
    const viewportHeight = scrollContainerRef.current?.clientHeight || 0;
    const scrollPercentage =
      totalHeight > viewportHeight
        ? Math.round(
            ((scrollData?.scrollTop || 0) / (totalHeight - viewportHeight)) *
              100
          )
        : 0;

    return {
      totalItems: content.length,
      visibleItems:
        (virtualization?.endIndex || 0) - (virtualization?.startIndex || 0),
      scrollPercentage,
      velocity: Math.round((scrollData?.velocity || 0) * 1000),
      direction: scrollData?.direction || 'down',
    };
  }, [content.length, scrollData, virtualization]);

  return (
    <div className="space-y-8">
      {/* Control Panel */}
      <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl">
        <h3 className="text-xl font-semibold text-purple-900 mb-4 flex items-center gap-2">
          <span className="w-5 h-5" />
          스크롤 컨트롤 패널
        </h3>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Quick Navigation */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-4 h-4" />퀵 네비게이션
            </h4>
            <div className="space-y-2">
              <button
                onClick={() =>
                  dispatch('smoothScrollTo', {
                    element: 'scroll-container',
                    target: 0,
                    direction: 'y',
                  })
                }
                className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm flex items-center justify-center gap-1"
              >
                <span className="w-4 h-4" />맨 위로
              </button>
              <button
                onClick={() => {
                  const container = scrollContainerRef.current;
                  if (container) {
                    const middle =
                      (container.scrollHeight - container.clientHeight) / 2;
                    dispatch('smoothScrollTo', {
                      element: 'scroll-container',
                      target: middle,
                      direction: 'y',
                    });
                  }
                }}
                className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
              >
                가운데로
              </button>
              <button
                onClick={() => {
                  const container = scrollContainerRef.current;
                  if (container) {
                    const bottom =
                      container.scrollHeight - container.clientHeight;
                    dispatch('smoothScrollTo', {
                      element: 'scroll-container',
                      target: bottom,
                      direction: 'y',
                    });
                  }
                }}
                className="w-full px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors text-sm flex items-center justify-center gap-1"
              >
                <span className="w-4 h-4" />맨 아래로
              </button>
            </div>
          </div>

          {/* Auto Scroll */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-4 h-4" />
              자동 스크롤
            </h4>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  속도: {scrollSpeed}px/frame
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={scrollSpeed}
                  onChange={(e) =>
                    dispatch('setAutoScroll', {
                      enabled: autoScrolling,
                      speed: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <button
                onClick={() =>
                  dispatch('setAutoScroll', {
                    enabled: !autoScrolling,
                    speed: scrollSpeed,
                  })
                }
                className={`w-full px-3 py-2 rounded transition-colors text-sm flex items-center justify-center gap-1 ${
                  autoScrolling
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
              >
                {autoScrolling ? (
                  <>
                    <span className="w-4 h-4" />
                    정지
                  </>
                ) : (
                  <>
                    <span className="w-4 h-4" />
                    시작
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Content Management */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-4 h-4" />
              컨텐츠 관리
            </h4>
            <div className="space-y-2">
              <button
                onClick={() =>
                  dispatch('loadMoreContent', {
                    page: currentPage + 1,
                    itemsPerPage: 10,
                  })
                }
                disabled={loading}
                className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 transition-colors text-sm flex items-center justify-center gap-1"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 animate-spin" />
                    로딩...
                  </>
                ) : (
                  <>
                    <span className="w-4 h-4" />더 로드
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  globalItemCounter = 0;
                  contentStore.setValue(generateScrollContent(0, 15));
                  currentPageStore.setValue(0);
                  dispatch('smoothScrollTo', {
                    element: 'scroll-container',
                    target: 0,
                    direction: 'y',
                  });
                }}
                className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm flex items-center justify-center gap-1"
              >
                <span className="w-4 h-4" />
                리셋
              </button>
            </div>
          </div>

          {/* Performance Info */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-4 h-4" />
              성능 정보
            </h4>
            <div className="space-y-1 text-xs text-gray-600">
              <div>속도: {scrollStats.velocity} px/s</div>
              <div>
                방향: {scrollStats.direction === 'down' ? '아래' : '위'}
              </div>
              <div>가시 항목: {scrollStats.visibleItems}</div>
              <div>성능: {metrics?.performanceScore}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 font-mono">
            {Math.round(scrollData?.scrollTop || 0)}px
          </div>
          <div className="text-sm text-blue-800">스크롤 위치</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {scrollStats.scrollPercentage}%
          </div>
          <div className="text-sm text-green-800">진행률</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {scrollStats.totalItems}
          </div>
          <div className="text-sm text-purple-800">총 항목</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {scrollStats.visibleItems}
          </div>
          <div className="text-sm text-orange-800">가시 항목</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {currentPage + 1}
          </div>
          <div className="text-sm text-red-800">페이지</div>
        </div>
      </div>

      {/* Scroll Content */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-5 h-5" />
            가상화된 스크롤 컨테이너
          </h3>
          <div className="text-sm text-gray-600">자동 로딩 활성화됨</div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>스크롤 진행도</span>
            <span>{scrollStats.scrollPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${scrollStats.scrollPercentage}%` }}
            />
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="h-96 overflow-y-auto border border-gray-300 rounded-lg p-4 bg-gradient-to-b from-white to-gray-50"
          style={{ scrollBehavior: 'auto' }}
        >
          <div className="space-y-4">
            {content
              ?.slice(
                virtualization?.startIndex || 0,
                virtualization?.endIndex || content.length
              )
              .map((item, index) => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-all hover:shadow-sm"
                  style={{
                    backgroundColor: item.color,
                    marginTop:
                      index === 0
                        ? `${(virtualization?.startIndex || 0) * (virtualization?.itemHeight || 100)}px`
                        : '0',
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      {item.title}
                      <span className="px-2 py-1 bg-white bg-opacity-60 rounded text-xs">
                        {item.category}
                      </span>
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-white bg-opacity-60 rounded text-xs font-mono">
                        #{item.numericId}
                      </span>
                      <div className="flex">
                        {Array.from({ length: item.priority + 1 }, (_, i) => (
                          <div
                            key={i}
                            className="w-2 h-2 bg-yellow-400 rounded-full mr-1"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 text-sm leading-relaxed mb-2">
                    {item.content}
                  </p>

                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <span>📅 {item.timestamp}</span>
                    <span>우선순위: {item.priority + 1}/5</span>
                  </div>
                </div>
              )) || []}

            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-center items-center py-8">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 animate-spin text-purple-500" />
                  <span className="text-gray-600">
                    새로운 컨텐츠를 로드하는 중...
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== 3. Status Section =====
function StatusSection() {
  const metricsStore = useScrollStore('metrics');
  const contentStore = useScrollStore('content');
  const scrollDataStore = useScrollStore('scrollData');
  const virtualizationStore = useScrollStore('virtualization');

  const metrics = useStoreValue(metricsStore);
  const content = useStoreValue(contentStore) || [];
  const scrollData = useStoreValue(scrollDataStore);
  const virtualization = useStoreValue(virtualizationStore);

  return (
    <section className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
          <span className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Scroll Performance Metrics
          </h2>
          <p className="text-gray-600">실시간 스크롤 성능 및 가상화 통계</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Scroll Metrics */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <span className="w-5 h-5" />
              스크롤 메트릭스
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-blue-700">총 스크롤 수</span>
                <span className="font-bold text-blue-900">
                  {metrics?.totalScrolls || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-700">최대 깊이</span>
                <span className="font-bold text-blue-900">
                  {Math.round(metrics?.maxScrollDepth || 0)}px
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-700">현재 속도</span>
                <span className="font-bold text-blue-900">
                  {Math.round((scrollData?.velocity || 0) * 1000)} px/s
                </span>
              </div>
            </div>
          </div>

          {/* Virtualization Stats */}
          <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
            <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
              <span className="w-5 h-5" />
              가상화 통계
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-purple-700">총 항목</span>
                <span className="font-bold text-purple-900">
                  {content.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-700">렌더된 항목</span>
                <span className="font-bold text-purple-900">
                  {(virtualization?.endIndex || 0) -
                    (virtualization?.startIndex || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-700">메모리 효율</span>
                <span className="font-bold text-purple-900">
                  {content.length > 0
                    ? Math.round(
                        (((virtualization?.endIndex || 0) -
                          (virtualization?.startIndex || 0)) /
                          content.length) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
              <span className="w-5 h-5" />
              성능 지표
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-green-700">성능 점수</span>
                <span className="font-bold text-green-900">
                  {metrics?.performanceScore || 95}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-700">로드된 페이지</span>
                <span className="font-bold text-green-900">
                  {metrics?.loadedPages || 1}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-700">렌더 효율</span>
                <span className="font-bold text-green-900">99%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
            <h3 className="text-lg font-semibold text-orange-900 mb-4">
              ⚡ 실시간 상태
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-orange-700">스크롤 시스템 활성</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full" />
                <span className="text-orange-700">가상화 렌더링 활성</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-orange-700">무한 로딩 대기중</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📊 성능 차트
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-700">스크롤 부드러움</span>
                  <span className="text-gray-900 font-medium">98%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: '98%' }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-700">메모리 사용량</span>
                  <span className="text-gray-900 font-medium">12%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: '12%' }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-700">로딩 속도</span>
                  <span className="text-gray-900 font-medium">96%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: '96%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== 4. Code Section =====
function CodeSection() {
  return (
    <section className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
          <span className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Implementation Details
          </h2>
          <p className="text-gray-600">핵심 스크롤 시스템 구현 코드</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="p-6 bg-gray-50 rounded-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              🏪 Store Context
            </h3>
            <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              {`const { Provider, useStore } = createStoreContext('AdvancedScroll', {
  scrollData: {
    scrollTop: 0,
    scrollLeft: 0,
    element: '',
    velocity: 0,
    direction: 'down' as 'up' | 'down'
  },
  content: generateScrollContent(0, 15),
  loading: false,
  currentPage: 0,
  autoScrolling: false,
  scrollSpeed: 2,
  virtualization: {
    startIndex: 0,
    endIndex: 10,
    itemHeight: 100,
    containerHeight: 400
  },
  metrics: {
    totalScrolls: 0,
    averageScrollSpeed: 0,
    maxScrollDepth: 0,
    virtualizedItems: 0,
    loadedPages: 1,
    performanceScore: 95
  } as ScrollMetrics
});`}
            </pre>
          </div>

          <div className="p-6 bg-gray-50 rounded-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              🎯 Virtualization Logic
            </h3>
            <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              {`const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
  const target = event.currentTarget;
  const scrollTop = target.scrollTop;
  const scrollHeight = target.scrollHeight;
  const clientHeight = target.clientHeight;
  
  // Virtual scrolling calculation
  const itemHeight = virtualization?.itemHeight || 100;
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(clientHeight / itemHeight) + 2, 
    content.length
  );
  
  dispatch('updateVirtualization', { startIndex, endIndex });
  
  // Infinite scroll detection
  if (scrollHeight - scrollTop - clientHeight < 200) {
    dispatch('reachScrollEnd', {
      element: 'scroll-container',
      direction: 'bottom'
    });
  }
}, [dispatch, virtualization?.itemHeight, content.length]);`}
            </pre>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-gray-50 rounded-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              ⚡ Smooth Scroll Animation
            </h3>
            <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              {`useActionHandler('smoothScrollTo', useCallback(async (payload) => {
  const container = scrollContainerRef.current;
  if (!container) return;
  
  const start = payload.direction === 'y' ? container.scrollTop : container.scrollLeft;
  const target = payload.target;
  const distance = target - start;
  const duration = Math.abs(distance) / 2; // Variable duration
  let startTime: number | null = null;
  
  const animateScroll = (currentTime: number) => {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    
    // Cubic-bezier easing
    const easeInOutCubic = progress < 0.5 
      ? 4 * progress * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    
    const currentPosition = start + distance * easeInOutCubic;
    container.scrollTop = currentPosition;
    
    if (progress < 1) {
      requestAnimationFrame(animateScroll);
    }
  };
  
  requestAnimationFrame(animateScroll);
}, []));`}
            </pre>
          </div>

          <div className="p-6 bg-gray-50 rounded-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              📊 Performance Tracking
            </h3>
            <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              {`useActionHandler('updateScrollPosition', useCallback(async (payload) => {
  const now = Date.now();
  const timeDelta = now - lastScrollTime.current;
  const scrollDelta = Math.abs(payload.scrollTop - lastScrollTop.current);
  
  if (timeDelta > 0) {
    const velocity = scrollDelta / timeDelta;
    const direction = payload.scrollTop > lastScrollTop.current ? 'down' : 'up';
    
    scrollDataStore.setValue({
      ...payload,
      velocity,
      direction
    });
  }
  
  // Update metrics
  const currentMetrics = metricsStore.getValue();
  metricsStore.setValue({
    ...currentMetrics,
    totalScrolls: currentMetrics.totalScrolls + 1,
    maxScrollDepth: Math.max(currentMetrics.maxScrollDepth, payload.scrollTop)
  });
}, [scrollDataStore, metricsStore]));`}
            </pre>
          </div>

          <div className="p-6 bg-purple-50 rounded-xl">
            <h3 className="text-lg font-semibold text-purple-900 mb-3">
              🔧 Key Features
            </h3>
            <ul className="space-y-2 text-purple-800 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span>가상화된 렌더링으로 메모리 효율성 극대화</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                <span>실시간 속도 및 방향 감지</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>부드러운 애니메이션 스크롤</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>자동 무한 스크롤 로딩</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                <span>실시간 성능 메트릭스 추적</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ScrollPageRefactored;
