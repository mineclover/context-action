import React, { useCallback, useEffect, useRef } from 'react';
import {
  createInitialScrollMetrics,
  deriveScrollPosition,
  generateScrollContent,
  initialScrollData,
  initialVirtualization,
  mergeVirtualization,
  recordContentLoad,
  recordScroll,
} from '../business/scroll-rules';
import {
  useScrollAction,
  useScrollActionHandler,
  useScrollRef,
  useScrollStore,
} from '../contexts/ScrollContexts';

export function ScrollHandlerRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useScrollAction();
  const containerRef = useScrollRef('container');
  const lastScrollTimeRef = useRef(0);
  const lastScrollTopRef = useRef(0);

  const scrollDataStore = useScrollStore('scrollData');
  const contentStore = useScrollStore('content');
  const loadingStore = useScrollStore('loading');
  const currentPageStore = useScrollStore('currentPage');
  const autoScrollingStore = useScrollStore('autoScrolling');
  const scrollSpeedStore = useScrollStore('scrollSpeed');
  const virtualizationStore = useScrollStore('virtualization');
  const metricsStore = useScrollStore('metrics');

  const rafIdRef = useRef<number | null>(null);
  const autoScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const cancelScrollAnimation = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const stopAutoScrollInterval = useCallback(() => {
    if (autoScrollIntervalRef.current !== null) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cancelScrollAnimation();
      stopAutoScrollInterval();
    };
  }, [cancelScrollAnimation, stopAutoScrollInterval]);

  useScrollActionHandler(
    'updateScrollPosition',
    useCallback(
      async (payload) => {
        const nextPosition = deriveScrollPosition(
          payload,
          lastScrollTopRef.current,
          lastScrollTimeRef.current
        );
        lastScrollTopRef.current = nextPosition.lastScrollTop;
        lastScrollTimeRef.current = nextPosition.lastScrollTime;
        scrollDataStore.setValue(nextPosition.data);
        metricsStore.setValue(
          recordScroll(metricsStore.getValue(), payload.scrollTop)
        );
      },
      [metricsStore, scrollDataStore]
    )
  );

  useScrollActionHandler(
    'reachScrollEnd',
    useCallback(
      async (payload) => {
        if (payload.direction !== 'bottom' || loadingStore.getValue()) {
          return;
        }

        dispatch('loadMoreContent', {
          page: currentPageStore.getValue() + 1,
          itemsPerPage: 10,
        });
      },
      [currentPageStore, dispatch, loadingStore]
    )
  );

  useScrollActionHandler(
    'loadMoreContent',
    useCallback(
      async (payload) => {
        if (loadingStore.getValue()) return;

        loadingStore.setValue(true);
        const startTime = Date.now();

        try {
          await new Promise((resolve) => setTimeout(resolve, 800));

          const currentContent = contentStore.getValue() || [];
          const newContent = generateScrollContent(
            payload.page,
            payload.itemsPerPage,
            currentContent.length
          );

          contentStore.setValue([...currentContent, ...newContent]);
          currentPageStore.setValue(payload.page);
          metricsStore.setValue(
            recordContentLoad(
              metricsStore.getValue(),
              payload.page,
              Date.now() - startTime
            )
          );
        } finally {
          loadingStore.setValue(false);
        }
      },
      [contentStore, currentPageStore, loadingStore, metricsStore]
    )
  );

  useScrollActionHandler(
    'smoothScrollTo',
    useCallback(
      async (payload) => {
        const container = containerRef.target;
        if (!container) return;

        cancelScrollAnimation();

        const start =
          payload.direction === 'y'
            ? container.scrollTop
            : container.scrollLeft;
        const distance = payload.target - start;
        const duration = Math.abs(distance) / 2;

        if (duration === 0) return;

        let startTime: number | null = null;
        const animateScroll = (currentTime: number) => {
          const activeContainer = containerRef.target;
          if (!activeContainer) {
            rafIdRef.current = null;
            return;
          }

          if (startTime === null) startTime = currentTime;
          const timeElapsed = currentTime - startTime;
          const progress = Math.min(timeElapsed / duration, 1);
          const easeInOutCubic =
            progress < 0.5
              ? 4 * progress * progress * progress
              : 1 - (-2 * progress + 2) ** 3 / 2;
          const currentPosition = start + distance * easeInOutCubic;

          if (payload.direction === 'y') {
            activeContainer.scrollTop = currentPosition;
          } else {
            activeContainer.scrollLeft = currentPosition;
          }

          if (progress < 1) {
            rafIdRef.current = requestAnimationFrame(animateScroll);
          } else {
            rafIdRef.current = null;
          }
        };

        rafIdRef.current = requestAnimationFrame(animateScroll);
      },
      [cancelScrollAnimation, containerRef]
    )
  );

  useScrollActionHandler(
    'resetScroll',
    useCallback(async () => {
      cancelScrollAnimation();
      stopAutoScrollInterval();
      contentStore.setValue(generateScrollContent(0, 15, 0));
      scrollDataStore.setValue(initialScrollData);
      currentPageStore.setValue(0);
      autoScrollingStore.setValue(false);
      virtualizationStore.setValue(initialVirtualization);
      metricsStore.setValue(createInitialScrollMetrics());
      lastScrollTimeRef.current = 0;
      lastScrollTopRef.current = 0;

      containerRef.executeIfMounted((target) => {
        target.scrollTop = 0;
        target.scrollLeft = 0;
      });
    }, [
      autoScrollingStore,
      cancelScrollAnimation,
      containerRef,
      contentStore,
      currentPageStore,
      metricsStore,
      scrollDataStore,
      stopAutoScrollInterval,
      virtualizationStore,
    ])
  );

  useScrollActionHandler(
    'setAutoScroll',
    useCallback(
      async (payload) => {
        autoScrollingStore.setValue(payload.enabled);
        scrollSpeedStore.setValue(payload.speed);
        stopAutoScrollInterval();

        if (!payload.enabled) {
          return;
        }

        autoScrollIntervalRef.current = setInterval(() => {
          const container = containerRef.target;
          if (!container) return;

          const speed = scrollSpeedStore.getValue() || 2;
          const newScrollTop = container.scrollTop + speed;
          const maxScroll = container.scrollHeight - container.clientHeight;

          if (newScrollTop >= maxScroll) {
            stopAutoScrollInterval();
            dispatch('setAutoScroll', { enabled: false, speed });
          } else {
            container.scrollTop = newScrollTop;
          }
        }, 16);
      },
      [
        autoScrollingStore,
        containerRef,
        dispatch,
        scrollSpeedStore,
        stopAutoScrollInterval,
      ]
    )
  );

  useScrollActionHandler(
    'updateVirtualization',
    useCallback(
      async (payload) => {
        virtualizationStore.setValue(
          mergeVirtualization(virtualizationStore.getValue(), payload)
        );
      },
      [virtualizationStore]
    )
  );

  return <>{children}</>;
}
