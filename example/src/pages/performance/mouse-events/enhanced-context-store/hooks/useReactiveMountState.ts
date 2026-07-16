/**
 * @fileoverview Reactive Mount State Hook Example
 *
 * RefContext mount 상태를 구독하여 React 리렌더링을 트리거하는 예시
 */

import { useCallback, useEffect } from 'react';
import {
  useMouseOnMountStateChange,
  useMouseRef,
  useMouseRefMountChecker,
  useMouseRefMountState,
} from '../contexts/EnhancedContextStoreContexts';

/**
 * RefContext의 mount 상태를 구독하는 예시 Hook
 *
 * 새로운 useRefMountState hook을 사용하면 mount 상태 변경 시 리렌더링됩니다!
 */
export function useReactiveMountState() {
  // 🆕 새로운 reactive mount state subscription hooks 사용
  const containerMountState = useMouseRefMountState('container');
  const cursorMountState = useMouseRefMountState('cursor');

  // 🎯 mount 상태가 변경되면 이 useEffect가 실행됩니다!
  useEffect(() => {
    console.log('🔔 [useReactiveMountState] Container mount state changed:', {
      isMounted: containerMountState.isMounted,
      isWaiting: containerMountState.isWaitingForMount,
      hasTarget: !!containerMountState.mountedTarget,
    });

    if (containerMountState.isMounted) {
      console.log('✅ Container is now mounted and ready!');
    } else if (containerMountState.isWaitingForMount) {
      console.log('⏳ Container is waiting to mount...');
    } else {
      console.log('❌ Container is unmounted');
    }
  }, [containerMountState.isMounted, containerMountState.isWaitingForMount]);

  useEffect(() => {
    console.log('🔔 [useReactiveMountState] Cursor mount state changed:', {
      isMounted: cursorMountState.isMounted,
      hasTarget: !!cursorMountState.mountedTarget,
    });
  }, [cursorMountState.isMounted]);

  // 조건부 렌더링에서 활용 가능
  const getStatusMessage = useCallback(() => {
    const containerReady = containerMountState.isMounted;
    const cursorReady = cursorMountState.isMounted;

    if (containerReady && cursorReady) {
      return '🟢 All elements ready';
    } else if (containerReady) {
      return '🟡 Container ready, waiting for cursor';
    } else if (cursorReady) {
      return '🟡 Cursor ready, waiting for container';
    } else if (
      containerMountState.isWaitingForMount ||
      cursorMountState.isWaitingForMount
    ) {
      return '⏳ Waiting for elements to mount...';
    } else {
      return '🔴 Elements not mounted';
    }
  }, [
    containerMountState.isMounted,
    cursorMountState.isMounted,
    containerMountState.isWaitingForMount,
    cursorMountState.isWaitingForMount,
  ]);

  return {
    containerMounted: containerMountState,
    cursorMounted: cursorMountState,
    allMounted: containerMountState.isMounted && cursorMountState.isMounted,
    statusMessage: getStatusMessage(),

    // Direct target access (reactive)
    containerTarget: containerMountState.mountedTarget,
    cursorTarget: cursorMountState.mountedTarget,
  };
}

/**
 * 특정 ref mount 상태 변경 콜백 예시 (새로운 방식 포함)
 */
export function useOnMountCallback() {
  // 기존 방식 - onMount 콜백
  const containerRef = useMouseRef('container');

  useEffect(() => {
    const unregister = containerRef.onMount((target: HTMLDivElement) => {
      console.log(
        '🎯 [useOnMountCallback] Container mounted callback:',
        target
      );

      // 마운트 시 초기화 작업
      target.style.border = '2px solid green';
      target.setAttribute('data-mounted', 'true');
    });

    return unregister;
  }, [containerRef]);

  // 🆕 새로운 방식 - mount state change 콜백
  useMouseOnMountStateChange(
    'container',
    useCallback((mounted: boolean, target: HTMLDivElement | null) => {
      console.log('🔔 [useOnMountCallback] Mount state changed:', {
        mounted,
        target,
      });

      if (mounted && target) {
        target.style.backgroundColor = 'lightgreen';
      } else {
        // unmounted 처리
        console.log('Container unmounted');
      }
    }, [])
  );

  return {
    isMounted: containerRef.isMounted,
    target: containerRef.target,
  };
}

/**
 * Mount checker 함수 예시 - 이벤트 핸들러에서 사용
 */
export function useMountChecker() {
  const containerChecker = useMouseRefMountChecker('container');
  const cursorChecker = useMouseRefMountChecker('cursor');

  const handleClick = useCallback(() => {
    // 클릭 시점에 현재 mount 상태 확인
    const containerState = containerChecker();
    const cursorState = cursorChecker();

    console.log('Click - Container state:', containerState);
    console.log('Click - Cursor state:', cursorState);

    // 안전한 DOM 조작
    if (containerState.isMounted && containerState.target) {
      containerState.target.style.transform = 'scale(0.98)';

      setTimeout(() => {
        const currentState = containerChecker(); // 현재 상태 재확인
        if (currentState.isMounted && currentState.target) {
          currentState.target.style.transform = '';
        }
      }, 150);
    }
  }, [containerChecker, cursorChecker]);

  return {
    handleClick,
    getStates: () => ({
      container: containerChecker(),
      cursor: cursorChecker(),
    }),
  };
}
