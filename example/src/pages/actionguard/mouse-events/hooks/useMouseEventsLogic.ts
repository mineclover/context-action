/**
 * @fileoverview Mouse Events Logic Hook - Hook Layer
 * 
 * Data/Action과 View 사이의 브리지 역할을 하는 Hook입니다.
 * 양방향 데이터 흐름을 관리합니다.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useStoreValue } from '@context-action/react';
import { useActionLoggerWithToast } from '../../../../components/LogMonitor';
import {
  useMouseEventsActionDispatch,
  useMouseEventsActionRegister,
  useMouseEventsStore,
  type MousePosition,
} from '../context/MouseEventsContext';

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
 * 마우스 이벤트 로직 Hook
 * 
 * View Layer에 필요한 데이터와 액션을 제공합니다.
 */
export function useMouseEventsLogic() {
  const dispatch = useMouseEventsActionDispatch();
  const register = useMouseEventsActionRegister();
  const mouseStore = useMouseEventsStore('mouseState');
  const mouseState = useStoreValue(mouseStore);
  const { logAction } = useActionLoggerWithToast();
  const moveEndTimeoutRef = useRef<NodeJS.Timeout>();

  // 마우스 메트릭 업데이트 함수
  const updateMouseMetrics = useCallback(
    (position: MousePosition, timestamp: number) => {
      const currentState = mouseStore.getValue();
      const timeDiff = currentState.lastMoveTime ? timestamp - currentState.lastMoveTime : 0;
      const deltaX = position.x - currentState.previousPosition.x;
      const deltaY = position.y - currentState.previousPosition.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // 마우스 속도 계산 (px/ms)
      const velocity = timeDiff > 0 ? distance / timeDiff : 0;

      dispatch('updateMouseMetrics', {
        position,
        velocity,
        timestamp,
      });
    },
    [dispatch, mouseStore]
  );

  // 스로틀된 마우스 핸들러 (더 반응성 있게)
  const throttledMouseHandler = useThrottle(updateMouseMetrics, 16); // ~60fps

  // 마우스 이동 종료 감지
  const handleMoveEnd = useCallback(
    (position: MousePosition) => {
      if (moveEndTimeoutRef.current) {
        clearTimeout(moveEndTimeoutRef.current);
      }
      
      moveEndTimeoutRef.current = setTimeout(() => {
        dispatch('moveEnd', {
          position,
          timestamp: Date.now(),
        });
      }, 100); // 100ms 후 이동 종료로 간주
    },
    [dispatch]
  );

  // 액션 핸들러 등록
  useEffect(() => {
    if (!register) return;

    // 마우스 이동 핸들러
    const unregisterMove = register.register(
      'mouseMove',
      ({ x, y, timestamp }, controller) => {
        logAction('mouseMove', { x, y, timestamp });
        
        const currentState = mouseStore.getValue();
        const position = { x, y };
        
        // 처음 이동이면 이동 시작 이벤트 발생
        if (!currentState.isMoving) {
          dispatch('moveStart', { position, timestamp });
        }
        
        throttledMouseHandler(position, timestamp);
        handleMoveEnd(position);
        
        controller.next();
      }
    );

    // 마우스 클릭 핸들러
    const unregisterClick = register.register(
      'mouseClick',
      ({ x, y, button, timestamp }, controller) => {
        logAction('mouseClick', { x, y, button, timestamp });
        
        mouseStore.update((state) => ({
          ...state,
          clickCount: state.clickCount + 1,
          clickHistory: [
            { x, y, timestamp },
            ...state.clickHistory.slice(0, 9), // 최근 10개 유지 (히스토리 보존)
          ],
        }));
        
        controller.next();
      }
    );

    // 마우스 진입 핸들러
    const unregisterEnter = register.register(
      'mouseEnter',
      ({ x, y, timestamp }, controller) => {
        logAction('mouseEnter', { x, y, timestamp });
        
        mouseStore.update((state) => ({
          ...state,
          isInsideArea: true,
          mousePosition: { x, y },
        }));
        
        controller.next();
      }
    );

    // 마우스 이탈 핸들러
    const unregisterLeave = register.register(
      'mouseLeave',
      ({ x, y, timestamp }, controller) => {
        logAction('mouseLeave', { x, y, timestamp });
        
        mouseStore.update((state) => ({
          ...state,
          isInsideArea: false,
          isMoving: false,
          mouseVelocity: 0,
          // 위치는 유지 - 0,0으로 초기화하지 않음
        }));
        
        controller.next();
      }
    );

    // 이동 시작 핸들러
    const unregisterMoveStart = register.register(
      'moveStart',
      ({ position, timestamp }, controller) => {
        logAction('moveStart', { position, timestamp });
        
        mouseStore.update((state) => ({
          ...state,
          isMoving: true,
          lastMoveTime: timestamp,
        }));
        
        controller.next();
      }
    );

    // 마우스 메트릭 업데이트 핸들러
    const unregisterUpdate = register.register(
      'updateMouseMetrics',
      ({ position, velocity, timestamp }, controller) => {
        logAction('updateMouseMetrics', { 
          position, 
          velocity: velocity.toFixed(2),
          timestamp 
        });
        
        mouseStore.update((state) => ({
          ...state,
          mousePosition: position,
          moveCount: state.moveCount + 1,
          mouseVelocity: velocity,
          previousPosition: state.mousePosition,
          lastMoveTime: timestamp,
          movePath: [
            position,
            ...state.movePath.slice(0, 19), // 최근 20개 점 유지 (히스토리 보존)
          ],
        }));
        
        controller.next();
      }
    );

    // 이동 종료 핸들러
    const unregisterMoveEnd = register.register(
      'moveEnd',
      ({ position, timestamp }, controller) => {
        logAction('moveEnd', { position, timestamp });
        
        mouseStore.update((state) => ({
          ...state,
          isMoving: false,
          mouseVelocity: 0,
          // position은 현재 위치를 유지 - 0,0으로 초기화하지 않음
        }));
        
        controller.next();
      }
    );

    // 상태 초기화 핸들러
    const unregisterReset = register.register(
      'resetMouseState',
      (_, controller) => {
        logAction('resetMouseState', {});
        
        mouseStore.setValue({
          mousePosition: { x: 0, y: 0 },
          moveCount: 0,
          clickCount: 0,
          isMoving: false,
          lastMoveTime: null,
          movePath: [],
          mouseVelocity: 0,
          previousPosition: { x: 0, y: 0 },
          isInsideArea: false, // 리셋 후에는 영역 밖으로 설정
          clickHistory: [],
        });
        
        controller.next();
      }
    );

    return () => {
      unregisterMove();
      unregisterClick();
      unregisterEnter();
      unregisterLeave();
      unregisterMoveStart();
      unregisterUpdate();
      unregisterMoveEnd();
      unregisterReset();
      
      if (moveEndTimeoutRef.current) {
        clearTimeout(moveEndTimeoutRef.current);
      }
    };
  }, [
    register,
    mouseStore,
    dispatch,
    throttledMouseHandler,
    handleMoveEnd,
    logAction,
  ]);

  // View에 제공할 인터페이스
  return {
    // Data
    mouseState,
    
    // Actions
    handleMouseMove: (x: number, y: number) => {
      dispatch('mouseMove', {
        x,
        y,
        timestamp: Date.now(),
      });
    },
    
    handleMouseClick: (x: number, y: number, button: number = 0) => {
      dispatch('mouseClick', {
        x,
        y,
        button,
        timestamp: Date.now(),
      });
    },
    
    handleMouseEnter: (x: number, y: number) => {
      dispatch('mouseEnter', {
        x,
        y,
        timestamp: Date.now(),
      });
    },
    
    handleMouseLeave: (x: number, y: number) => {
      dispatch('mouseLeave', {
        x,
        y,
        timestamp: Date.now(),
      });
    },
    
    resetState: () => {
      dispatch('resetMouseState');
    },
    
    // Computed
    isActive: mouseState.isMoving,
    hasActivity: mouseState.moveCount > 0 || mouseState.clickCount > 0,
    averageVelocity: mouseState.mouseVelocity, // 실시간 속도 사용 (성능 최적화)
  };
}