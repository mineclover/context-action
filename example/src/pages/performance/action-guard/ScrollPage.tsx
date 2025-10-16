/**
 * @fileoverview Scroll Demo Page
 * Context-Action framework의 스크롤 이벤트 및 무한 스크롤 데모
 */

import {
  createActionContext,
  createStoreContext,
  useStoreValue,
} from '@context-action/react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { PageWithLogMonitor } from '@/components/LogMonitor';
import { Badge, Card, CardContent } from '@/components/ui';

// Scroll 관련 액션 타입 정의
interface ScrollActions {
  updateScrollPosition: {
    scrollTop: number;
    scrollLeft: number;
    element: string;
  };
  reachScrollEnd: {
    element: string;
    direction: 'top' | 'bottom' | 'left' | 'right';
  };
  loadMoreContent: { page: number; itemsPerPage: number };
  smoothScrollTo: { element: string; target: number; direction: 'x' | 'y' };
  resetScroll: { element: string };
}

// 샘플 컨텐츠 데이터 - 전역 카운터를 사용하여 고유 ID 보장
let globalItemCounter = 0;

const generateContent = (page: number, itemsPerPage: number = 20) => {
  return Array.from({ length: itemsPerPage }, (_, i) => {
    const id = ++globalItemCounter; // 전역적으로 고유한 ID 생성
    return {
      id: `item-${id}`, // 문자열 키로 변경하여 React key 중복 방지
      title: `컨텐츠 아이템 #${id}`,
      content: `이것은 ${id}번째 컨텐츠 아이템의 샘플 내용입니다. Context-Action 프레임워크의 스크롤 기능을 테스트하기 위한 데모 컨텐츠이며, 실제로는 다양한 데이터가 들어갈 수 있습니다.`,
      color: `hsl(${(id * 137.5) % 360}, 70%, 85%)`,
      timestamp: new Date(Date.now() - Math.random() * 86400000 * 30)
        .toISOString()
        .split('T')[0],
      numericId: id, // 숫자 ID는 별도 저장
    };
  });
};

// Store Pattern using Declarative Store Pattern (recommended approach)
const {
  Provider: ScrollStoreProvider,
  useStore: useScrollStore,
  useStoreManager: _useScrollStoreManager,
} = createStoreContext('Scroll', {
  scrollData: {
    scrollTop: 0,
    scrollLeft: 0,
    element: '',
  },
  content: generateContent(0, 15),
  loading: false,
  currentPage: 0,
});

// Action Context 생성
const {
  Provider: ScrollActionProvider,
  useActionDispatch,
  useActionHandler,
} = createActionContext<ScrollActions>('Scroll');

// 메인 컴포넌트
export function ScrollPage() {
  return (
    <PageWithLogMonitor
      pageId="scroll-demo"
      title="Scroll Demo"
      initialConfig={{ enableToast: true, maxLogs: 30 }}
    >
      <div className="page-container">
        <header className="page-header">
          <h1>📜 Scroll Demo</h1>
          <p className="page-description">
            Context-Action 프레임워크의{' '}
            <strong>스크롤 이벤트 및 무한 스크롤</strong> 시스템입니다. 실시간
            스크롤 감지, 동적 컨텐츠 로딩, 부드러운 스크롤 애니메이션을
            보여줍니다.
          </p>

          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline" className="bg-blue-50 text-blue-800">
              📜 무한 스크롤
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-800">
              🔄 동적 로딩
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-800">
              ✨ 스무스 애니메이션
            </Badge>
            <Badge variant="outline" className="bg-orange-50 text-orange-800">
              📊 스크롤 모니터링
            </Badge>
          </div>
        </header>

        <ScrollStoreProvider>
          <ScrollActionProvider>
            <ScrollDemo />
          </ScrollActionProvider>
        </ScrollStoreProvider>
      </div>
    </PageWithLogMonitor>
  );
}

// 데모 컴포넌트
function ScrollDemo() {
  const dispatch = useActionDispatch();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);

  // Store 구독 using Declarative Store Pattern
  const scrollDataStore = useScrollStore('scrollData');
  const contentStore = useScrollStore('content');
  const loadingStore = useScrollStore('loading');
  const currentPageStore = useScrollStore('currentPage');

  const scrollData = useStoreValue(scrollDataStore);
  const content = useStoreValue(contentStore);
  const loading = useStoreValue(loadingStore);
  const currentPage = useStoreValue(currentPageStore);

  // Action Handlers 등록
  useActionHandler(
    'updateScrollPosition',
    useCallback(
      async (payload, controller) => {
        scrollDataStore.setValue(payload);
      },
      [scrollDataStore]
    )
  );

  useActionHandler(
    'reachScrollEnd',
    useCallback(
      async (payload, controller) => {
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
      async (payload, controller) => {
        loadingStore.setValue(true);

        // 로딩 시뮬레이션
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const newContent = generateContent(payload.page, payload.itemsPerPage);
        const currentContent = contentStore.getValue() || [];

        contentStore.setValue([...currentContent, ...newContent]);
        currentPageStore.setValue(payload.page);
        loadingStore.setValue(false);
      },
      [loadingStore, contentStore, currentPageStore]
    )
  );

  useActionHandler(
    'smoothScrollTo',
    useCallback(async (payload, controller) => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const start =
        payload.direction === 'y' ? container.scrollTop : container.scrollLeft;
      const target = payload.target;
      const distance = target - start;
      const duration = 500; // 0.5조
      let startTime: number | null = null;

      const animateScroll = (currentTime: number) => {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);

        // Easing function (ease-out)
        const easeOut = 1 - (1 - progress) ** 3;
        const currentPosition = start + distance * easeOut;

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
    'resetScroll',
    useCallback(
      async (payload, controller) => {
        dispatch('smoothScrollTo', {
          element: payload.element,
          target: 0,
          direction: 'y',
        });
      },
      [dispatch]
    )
  );

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      const scrollTop = target.scrollTop;
      const scrollLeft = target.scrollLeft;
      const scrollHeight = target.scrollHeight;
      const clientHeight = target.clientHeight;

      dispatch('updateScrollPosition', {
        scrollTop,
        scrollLeft,
        element: 'main-container',
      });

      // 하단 도달 감지 (마지막 100px 남았을 때)
      if (scrollHeight - scrollTop - clientHeight < 100) {
        dispatch('reachScrollEnd', {
          element: 'main-container',
          direction: 'bottom',
        });
      }
    },
    [dispatch]
  );

  // 자동 스크롤 기능
  useEffect(() => {
    if (!isAutoScrolling) return;

    const interval = setInterval(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const newScrollTop = container.scrollTop + scrollSpeed;
      const maxScroll = container.scrollHeight - container.clientHeight;

      if (newScrollTop >= maxScroll) {
        setIsAutoScrolling(false);
      } else {
        container.scrollTop = newScrollTop;
      }
    }, 16); // 60fps

    return () => clearInterval(interval);
  }, [isAutoScrolling, scrollSpeed]);

  // 컨텐츠 통계
  const contentStats = useMemo(() => {
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
      totalItems: content?.length || 0,
      totalHeight: Math.round(totalHeight),
      viewportHeight: Math.round(viewportHeight),
      scrollPercentage,
      currentPage: (currentPage || 0) + 1,
    };
  }, [content?.length, scrollData?.scrollTop, currentPage]);

  // 퀵 스크롤 버튼들
  const scrollToTop = useCallback(() => {
    dispatch('smoothScrollTo', {
      element: 'main-container',
      target: 0,
      direction: 'y',
    });
  }, [dispatch]);

  const scrollToMiddle = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const middle = (container.scrollHeight - container.clientHeight) / 2;
    dispatch('smoothScrollTo', {
      element: 'main-container',
      target: middle,
      direction: 'y',
    });
  }, [dispatch]);

  const scrollToBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const bottom = container.scrollHeight - container.clientHeight;
    dispatch('smoothScrollTo', {
      element: 'main-container',
      target: bottom,
      direction: 'y',
    });
  }, [dispatch]);

  return (
    <div className="space-y-6">
      {/* 컨트롤 패널 */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🎛️ 스크롤 컨트롤
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 퀵 스크롤 */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">⚡ 퀵 스크롤</h4>
              <div className="space-y-2">
                <button
                  onClick={scrollToTop}
                  className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                >
                  ⬆️ 맨 위로
                </button>
                <button
                  onClick={scrollToMiddle}
                  className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
                >
                  ➡️ 가운데로
                </button>
                <button
                  onClick={scrollToBottom}
                  className="w-full px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors text-sm"
                >
                  ⬇️ 맨 아래로
                </button>
              </div>
            </div>

            {/* 자동 스크롤 */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">
                🤖 자동 스크롤
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
                    onChange={(e) => setScrollSpeed(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <button
                  onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                  className={`w-full px-3 py-2 rounded transition-colors text-sm ${
                    isAutoScrolling
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
                >
                  {isAutoScrolling ? '⏹️ 정지' : '▶️ 시작'}
                </button>
              </div>
            </div>

            {/* 컨텐츠 관리 */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">
                📄 컨텐츠 관리
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
                  className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 transition-colors text-sm"
                >
                  {loading ? '⏳ 로딩...' : '🔄 더 로드'}
                </button>

                <button
                  onClick={() => {
                    globalItemCounter = 0; // 카운터 리셋
                    contentStore.setValue(generateContent(0, 15));
                    currentPageStore.setValue(0);
                    scrollToTop();
                  }}
                  className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                >
                  🔄 리셋
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 스크롤 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm text-gray-600 mb-2">
              스크롤 위치
            </h4>
            <div className="text-xl font-bold text-blue-600 font-mono">
              {Math.round(scrollData?.scrollTop || 0)}px
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm text-gray-600 mb-2">진행률</h4>
            <div className="text-xl font-bold text-green-600">
              {contentStats.scrollPercentage}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm text-gray-600 mb-2">
              컨텐츠 수
            </h4>
            <div className="text-xl font-bold text-purple-600">
              {contentStats.totalItems}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm text-gray-600 mb-2">페이지</h4>
            <div className="text-xl font-bold text-orange-600">
              {contentStats.currentPage}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm text-gray-600 mb-2">
              전체 높이
            </h4>
            <div className="text-xl font-bold text-red-600 font-mono">
              {contentStats.totalHeight}px
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 스크롤 컨텐츠 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              📜 스크롤 컨텐츠
            </h3>
            <div className="text-sm text-gray-600">하단 도달 시 자동 로드</div>
          </div>

          {/* 진행률 바 */}
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${contentStats.scrollPercentage}%` }}
              />
            </div>
          </div>

          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="h-96 overflow-y-auto border border-gray-300 rounded-lg p-4 bg-gradient-to-b from-white to-gray-50"
          >
            <div className="space-y-4">
              {content?.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  style={{ backgroundColor: item.color }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {item.title}
                    </h4>
                    <span className="px-2 py-1 bg-white bg-opacity-60 rounded text-xs font-mono">
                      #{item.numericId}
                    </span>
                  </div>

                  <p className="text-gray-700 text-sm leading-relaxed mb-2">
                    {item.content}
                  </p>

                  <div className="text-xs text-gray-600">
                    📅 {item.timestamp}
                  </div>
                </div>
              )) || []}

              {/* 로딩 인디케이터 */}
              {loading && (
                <div className="flex justify-center items-center py-8">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                    <span className="text-gray-600">
                      더 많은 컨텐츠를 로드하는 중...
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 기술 정보 */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🛠️ 기술 구현
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-blue-600 mb-3">
                Store 기반 상태 관리
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>
                  • <strong>scrollDataStore</strong>: 스크롤 위치 및 상태
                </li>
                <li>
                  • <strong>contentStore</strong>: 동적 컨텐츠 목록
                </li>
                <li>
                  • <strong>loadingStore</strong>: 로딩 상태 관리
                </li>
                <li>
                  • <strong>currentPageStore</strong>: 페이지네이션 상태
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-green-600 mb-3">
                Action Pipeline
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>
                  • <strong>updateScrollPosition</strong>: 스크롤 상태 업데이트
                </li>
                <li>
                  • <strong>reachScrollEnd</strong>: 스크롤 끝 도달 감지
                </li>
                <li>
                  • <strong>loadMoreContent</strong>: 무한 스크롤 구현
                </li>
                <li>
                  • <strong>smoothScrollTo</strong>: 부드러운 애니메이션
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ScrollPage;
