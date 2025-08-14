/**
 * @fileoverview Scroll Logic Hook - Hook Layer
 *
 * Data/Action과 View 사이의 브리지 역할을 하는 Hook입니다.
 * 양방향 데이터 흐름을 관리합니다.
 */

import { useStoreValue } from '@context-action/react';
import { useCallback, useEffect, useRef } from 'react';
import { useActionLoggerWithToast } from '../../../../components/LogMonitor';
import {
  type ScrollStateData,
  useScrollActionDispatch,
  useScrollActionRegister,
  useScrollStore,
} from '../context/ScrollContext';

/**
 * 스로틀 훅
 */
function useThrottle<T extends any[]>(
  callback: (...args: T) => void,
  delay: number
) {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: T) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;

      if (timeSinceLastCall >= delay) {
        lastCallRef.current = now;
        callback(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          callback(...args);
        }, delay - timeSinceLastCall);
      }
    },
    [callback, delay]
  );
}

/**
 * 스크롤 로직 Hook
 *
 * View Layer에 필요한 데이터와 액션을 제공합니다.
 */
export function useScrollLogic() {
  const dispatch = useScrollActionDispatch();
  const register = useScrollActionRegister();
  const scrollStore = useScrollStore('scrollState');
  const scrollState = useStoreValue(scrollStore);
  const { logAction } = useActionLoggerWithToast();
  const scrollEndTimeoutRef = useRef<NodeJS.Timeout>();

  // 스크롤 메트릭 업데이트 함수
  const updateScrollMetrics = useCallback(
    (scrollTop: number, timestamp: number) => {
      const currentState = scrollStore.getValue();
      const timeDiff = currentState.lastScrollTime
        ? timestamp - currentState.lastScrollTime
        : 0;
      const scrollDiff = scrollTop - currentState.previousScrollTop;

      // 스크롤 방향 계산
      let scrollDirection: 'up' | 'down' | 'none' = 'none';
      if (scrollDiff > 0) scrollDirection = 'down';
      else if (scrollDiff < 0) scrollDirection = 'up';

      // 스크롤 속도 계산 (px/ms)
      const velocity = timeDiff > 0 ? Math.abs(scrollDiff) / timeDiff : 0;

      dispatch('updateScrollMetrics', {
        scrollTop,
        scrollDirection,
        velocity,
        timestamp,
      });
    },
    [dispatch, scrollStore]
  );

  // 스로틀된 스크롤 핸들러
  const throttledScrollHandler = useThrottle(updateScrollMetrics, 100);

  // 스크롤 종료 감지
  const handleScrollEnd = useCallback(
    (scrollTop: number) => {
      if (scrollEndTimeoutRef.current) {
        clearTimeout(scrollEndTimeoutRef.current);
      }

      scrollEndTimeoutRef.current = setTimeout(() => {
        dispatch('scrollEnd', {
          scrollTop,
          timestamp: Date.now(),
        });
      }, 150); // 150ms 후 스크롤 종료로 간주
    },
    [dispatch]
  );

  // 액션 핸들러 등록
  useEffect(() => {
    if (!register) return;

    // 스크롤 이벤트 핸들러
    const unregisterScroll = register.register(
      'scrollEvent',
      ({ scrollTop, timestamp }, controller) => {
        logAction('scrollEvent', { scrollTop, timestamp });

        const currentState = scrollStore.getValue();

        // 처음 스크롤이면 스크롤 시작 이벤트 발생
        if (!currentState.isScrolling) {
          dispatch('scrollStart', { scrollTop, timestamp });
        }

        throttledScrollHandler(scrollTop, timestamp);
        handleScrollEnd(scrollTop);

        
      }
    );

    // 스크롤 시작 핸들러
    const unregisterStart = register.register(
      'scrollStart',
      ({ scrollTop, timestamp }, controller) => {
        logAction('scrollStart', { scrollTop, timestamp });

        scrollStore.update((state) => ({
          ...state,
          isScrolling: true,
          lastScrollTime: timestamp,
        }));

        
      }
    );

    // 스크롤 메트릭 업데이트 핸들러
    const unregisterUpdate = register.register(
      'updateScrollMetrics',
      ({ scrollTop, scrollDirection, velocity, timestamp }, controller) => {
        logAction('updateScrollMetrics', {
          scrollTop,
          scrollDirection,
          velocity: velocity.toFixed(2),
          timestamp,
        });

        scrollStore.update((state) => ({
          ...state,
          scrollTop,
          scrollCount: state.scrollCount + 1,
          scrollDirection,
          scrollVelocity: velocity,
          previousScrollTop: state.scrollTop,
          lastScrollTime: timestamp,
        }));

        
      }
    );

    // 스크롤 종료 핸들러
    const unregisterEnd = register.register(
      'scrollEnd',
      ({ scrollTop, timestamp }, controller) => {
        logAction('scrollEnd', { scrollTop, timestamp });

        scrollStore.update((state) => ({
          ...state,
          isScrolling: false,
          scrollDirection: 'none',
          scrollVelocity: 0,
        }));

        
      }
    );

    // 스크롤 초기화 핸들러
    const unregisterReset = register.register(
      'resetScroll',
      (_, controller) => {
        logAction('resetScroll', {});

        scrollStore.setValue({
          scrollTop: 0,
          scrollCount: 0,
          isScrolling: false,
          lastScrollTime: null,
          scrollDirection: 'none',
          previousScrollTop: 0,
          scrollVelocity: 0,
        });

        
      }
    );

    return () => {
      unregisterScroll();
      unregisterStart();
      unregisterUpdate();
      unregisterEnd();
      unregisterReset();

      if (scrollEndTimeoutRef.current) {
        clearTimeout(scrollEndTimeoutRef.current);
      }
    };
  }, [
    register,
    scrollStore,
    throttledScrollHandler,
    handleScrollEnd,
    logAction,
  ]);

  // View에 제공할 인터페이스
  return {
    // Data
    scrollState,

    // Actions
    handleScroll: (scrollTop: number) => {
      dispatch('scrollEvent', {
        scrollTop,
        timestamp: Date.now(),
      });
    },

    resetScroll: () => {
      dispatch('resetScroll');
    },

    // Computed
    isActive: scrollState.isScrolling,
    hasScrolled: scrollState.scrollCount > 0,
    scrollProgress:
      scrollState.scrollTop > 0 ? (scrollState.scrollTop / 1000) * 100 : 0, // 1000px 기준
  };
}
