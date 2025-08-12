/**
 * @fileoverview Mouse Events Logic Hook - Hook Layer
 * 
 * Data/Action과 View 사이의 브리지 역할을 하는 Hook입니다.
 * 양방향 데이터 흐름을 관리합니다.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
// import { useActionLoggerWithToast } from '../../../../components/LogMonitor';
import {
  useMouseEventsActionDispatch,
  useMouseEventsActionRegister,
  useMouseEventsStore,
  type MousePosition,
} from '../context/MouseEventsContext';

// useThrottle Hook 제거 - core 내장 throttle 사용

/**
 * 마우스 이벤트 로직 Hook
 * 
 * View Layer에 필요한 데이터와 액션을 제공합니다.
 * Store 구독 제거 - 리렌더링 방지를 위해 직접 접근만 사용
 */
export function useMouseEventsLogic() {
  console.log('🔧 useMouseEventsLogic render at', new Date().toISOString());
  
  const dispatch = useMouseEventsActionDispatch();
  const register = useMouseEventsActionRegister();
  const mouseStore = useMouseEventsStore('mouseState');
  // Store 구독 제거 - 리렌더링 방지
  // const mouseState = useStoreValue(mouseStore);
  // const { logAction } = useActionLoggerWithToast(); // 리렌더링 원인일 수 있으므로 임시 제거
  
  // 리렌더링 방지를 위해 React 상태 대신 ref 사용
  const hasActivityRef = useRef(false);
  const isActiveRef = useRef(false);
  const moveEndTimeoutRef = useRef<NodeJS.Timeout>();
  
  // 로깅 스로틀링을 위한 ref
  const logControlRef = useRef({ 
    moveCount: 0, 
    lastMoveLogTime: 0,
    lastClickLogTime: 0
  });

  // 마우스 메트릭 업데이트 함수 (core throttle 사용)
  const updateMouseMetrics = useCallback(
    (position: MousePosition, timestamp: number) => {
      // core의 내장 throttle 기능 사용 (~60fps)
      dispatch('updateMouseMetrics', {
        position,
        timestamp,
      }, { 
        throttle: 16 // ~60fps throttling
      });
    },
    [] // 안정적인 참조 유지
  );

  // 마우스 이동 종료 감지 (안정적인 참조)
  const handleMoveEnd = useCallback(
    (position: MousePosition) => {
      // 0,0 문제 디버깅
      if (position.x === 0 && position.y === 0) {
        console.warn('🔴 handleMoveEnd called with 0,0 position:', position);
        console.trace('handleMoveEnd 0,0 trace');
      }
      
      console.log('⏳ handleMoveEnd called:', position);
      
      if (moveEndTimeoutRef.current) {
        clearTimeout(moveEndTimeoutRef.current);
      }
      
      moveEndTimeoutRef.current = setTimeout(() => {
        console.log('🛑 moveEnd timeout triggered with position:', position);
        dispatch('moveEnd', {
          position,
          timestamp: Date.now(),
        });
      }, 100); // 100ms 후 이동 종료로 간주
    },
    [] // 빈 의존성으로 안정적인 참조 유지
  );

  // 액션 핸들러 등록
  useEffect(() => {
    if (!register) return;

    // 마우스 이동 핸들러
    const unregisterMove = register.register(
      'mouseMove',
      ({ x, y, timestamp }, controller) => {
        const now = Date.now();
        const logControl = logControlRef.current;
        
        // 마우스 이동 로깅을 1초마다 1번만 하거나 매 100번째마다
        logControl.moveCount++;
        const shouldLog = (
          now - logControl.lastMoveLogTime > 1000 || // 1초마다
          logControl.moveCount % 100 === 0 // 또는 100번마다
        );
        
        if (shouldLog) {
          // logAction('mouseMove', { 
          //   x, y, timestamp, 
          //   moveCount: logControl.moveCount,
          //   note: `${logControl.moveCount}번째 이동` 
          // }, { toast: false }); // Toast 비활성화
          console.log('mouseMove', { 
            x, y, timestamp, 
            moveCount: logControl.moveCount,
            note: `${logControl.moveCount}번째 이동` 
          });
          logControl.lastMoveLogTime = now;
        }
        
        const currentState = mouseStore.getValue();
        const position = { x, y };
        
        // 처음 이동이면 이동 시작 이벤트 발생
        if (!currentState.isMoving) {
          dispatch('moveStart', { position, timestamp });
        }
        
        updateMouseMetrics(position, timestamp);
        handleMoveEnd(position);
        
        controller.next();
      }
    );

    // 마우스 클릭 핸들러
    const unregisterClick = register.register(
      'mouseClick',
      ({ x, y, button, timestamp }, controller) => {
        // logAction('mouseClick', { x, y, button, timestamp });
        
        mouseStore.update((state) => ({
          ...state,
          clickCount: state.clickCount + 1,
          clickHistory: [
            { x, y, timestamp },
            ...state.clickHistory.slice(0, 9), // 최근 10개 유지 (히스토리 보존)
          ],
        }));
        
        // UI 업데이트
        const statusDisplay = (window as any).__statusDisplay;
        const rendererHandle = (window as any).__rendererHandle;
        if (statusDisplay) {
          const newState = mouseStore.getValue();
          statusDisplay.updateClicks(newState.clickCount);
        }
        if (rendererHandle) {
          const newState = mouseStore.getValue();
          const latestClick = newState.clickHistory[0];
          if (latestClick) {
            rendererHandle.addClick(latestClick);
          }
        }
        
        controller.next();
      }
    );

    // 마우스 진입 핸들러
    const unregisterEnter = register.register(
      'mouseEnter',
      ({ x, y, timestamp }, controller) => {
        // logAction('mouseEnter', { x, y, timestamp });
        
        mouseStore.update((state) => ({
          ...state,
          isInsideArea: true,
          mousePosition: { x, y },
        }));
        
        // UI 업데이트
        const statusDisplay = (window as any).__statusDisplay;
        const rendererHandle = (window as any).__rendererHandle;
        if (statusDisplay) {
          statusDisplay.updateInside(true);
          statusDisplay.updatePosition(x, y);
        }
        if (rendererHandle) {
          rendererHandle.updateVisibility(true);
          rendererHandle.updatePosition({ x, y }, 0);
        }
        
        controller.next();
      }
    );

    // 마우스 이탈 핸들러
    const unregisterLeave = register.register(
      'mouseLeave',
      ({ x, y, timestamp }, controller) => {
        // logAction('mouseLeave', { x, y, timestamp });
        
        mouseStore.update((state) => ({
          ...state,
          isInsideArea: false,
          isMoving: false,
          mouseVelocity: 0,
          // 위치는 유지 - 0,0으로 초기화하지 않음
        }));
        
        // UI 업데이트
        const statusDisplay = (window as any).__statusDisplay;
        const rendererHandle = (window as any).__rendererHandle;
        if (statusDisplay) {
          statusDisplay.updateInside(false);
          statusDisplay.updateStatus(false);
          statusDisplay.updateVelocity(0);
        }
        if (rendererHandle) {
          rendererHandle.updateVisibility(false);
          rendererHandle.updateMoving(false);
        }
        
        controller.next();
      }
    );

    // 이동 시작 핸들러
    const unregisterMoveStart = register.register(
      'moveStart',
      ({ position, timestamp }, controller) => {
        // logAction('moveStart', { position, timestamp });
        
        mouseStore.update((state) => ({
          ...state,
          isMoving: true,
          lastMoveTime: timestamp,
        }));
        
        // UI 업데이트
        const statusDisplay = (window as any).__statusDisplay;
        const rendererHandle = (window as any).__rendererHandle;
        if (statusDisplay) {
          statusDisplay.updateStatus(true);
        }
        if (rendererHandle) {
          rendererHandle.updateMoving(true);
        }
        
        controller.next();
      }
    );

    // 마우스 메트릭 업데이트 핸들러 (속도 계산 + UI 업데이트)
    const unregisterUpdate = register.register(
      'updateMouseMetrics',
      ({ position, timestamp }, controller) => {
        // 현재 상태에서 속도 계산
        const currentState = mouseStore.getValue();
        const timeDiff = currentState.lastMoveTime ? timestamp - currentState.lastMoveTime : 0;
        const deltaX = position.x - currentState.previousPosition.x;
        const deltaY = position.y - currentState.previousPosition.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // 마우스 속도 계산 (px/ms)
        const velocity = timeDiff > 0 ? distance / timeDiff : 0;
        
        // logAction('updateMouseMetrics', { 
        //   position, 
        //   velocity: velocity.toFixed(2),
        //   timestamp 
        // });
        
        // 상태 업데이트
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
        
        // UI 업데이트 (DOM 직접 조작)
        const statusDisplay = (window as any).__statusDisplay;
        const rendererHandle = (window as any).__rendererHandle;
        const setHasInitialActivity = (window as any).__setHasInitialActivity;
        
        if (statusDisplay) {
          const newState = mouseStore.getValue();
          statusDisplay.updatePosition(position.x, position.y);
          statusDisplay.updateMoves(newState.moveCount);
          statusDisplay.updateVelocity(velocity);
          statusDisplay.updateLastActivity(timestamp);
        }
        
        // 초기 활동 상태 업데이트 (한 번만)
        if (setHasInitialActivity && !hasActivityRef.current) {
          setHasInitialActivity(true);
        }
        
        // 내부 상태 업데이트 (리렌더링 방지)
        if (!hasActivityRef.current) {
          hasActivityRef.current = true;
        }
        if (!isActiveRef.current) {
          isActiveRef.current = true;
        }
        if (rendererHandle) {
          const newState = mouseStore.getValue();
          
          // 0,0 문제 디버깅
          if (position.x === 0 && position.y === 0) {
            console.warn('🔴 Detected 0,0 position in updateMouseMetrics handler:', { position, velocity });
            console.trace('0,0 position trace');
          }
          
          console.log('🔧 updateMouseMetrics calling updatePosition:', position, 'velocity:', velocity);
          rendererHandle.updatePosition(position, velocity);
          
          // 경로에 포인트 추가 (유효한 포인트만)
          if (newState.movePath.length > 0) {
            const latestPoint = newState.movePath[0];
            if (latestPoint.x !== 0 && latestPoint.y !== 0 && latestPoint.x !== -999 && latestPoint.y !== -999) {
              rendererHandle.addToPath(latestPoint);
            }
          }
        }
        
        controller.next();
      }
    );

    // 이동 종료 핸들러
    const unregisterMoveEnd = register.register(
      'moveEnd',
      ({ position, timestamp }, controller) => {
        // logAction('moveEnd', { position, timestamp });
        
        // 0,0 문제 디버깅
        if (position.x === 0 && position.y === 0) {
          console.warn('🔴 moveEnd handler received 0,0 position:', { position, timestamp });
          console.trace('moveEnd 0,0 trace');
        }
        
        console.log('🛑 moveEnd handler called:', position);
        
        mouseStore.update((state) => ({
          ...state,
          isMoving: false,
          mouseVelocity: 0,
          // position은 현재 위치를 유지 - 0,0으로 초기화하지 않음
        }));
        
        // UI 업데이트
        const statusDisplay = (window as any).__statusDisplay;
        const rendererHandle = (window as any).__rendererHandle;
        if (statusDisplay) {
          statusDisplay.updateStatus(false);
          statusDisplay.updateVelocity(0);
        }
        if (rendererHandle) {
          rendererHandle.updateMoving(false);
        }
        
        // 내부 상태 업데이트
        isActiveRef.current = false;
        
        controller.next();
      }
    );

    // 상태 초기화 핸들러
    const unregisterReset = register.register(
      'resetMouseState',
      (_, controller) => {
        // logAction('resetMouseState', {});
        
        
        // 현재 위치를 유지하되 다른 상태만 초기화
        const currentState = mouseStore.getValue();
        mouseStore.setValue({
          mousePosition: currentState.mousePosition, // 현재 위치 유지
          moveCount: 0,
          clickCount: 0,
          isMoving: false,
          lastMoveTime: null,
          movePath: [],
          mouseVelocity: 0,
          previousPosition: currentState.mousePosition, // 현재 위치를 이전 위치로
          isInsideArea: false, // 리셋 후에는 영역 밖으로 설정 (커서 숨김)
          clickHistory: [],
        });
        
        // 내부 상태 초기화
        hasActivityRef.current = false;
        isActiveRef.current = false;
        
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
  }, []); // 빈 의존성 - 초기화 시 한 번만 실행

  // View에 제공할 인터페이스 (Store 구독 제거)
  return {
    // Actions only - 데이터는 DOM 직접 조작으로 표시
    handleMouseMove: (x: number, y: number) => {
      // 0,0 문제 디버깅
      if (x === 0 && y === 0) {
        console.warn('🔴 Detected 0,0 in handleMouseMove:', { x, y });
        console.trace('0,0 handleMouseMove trace');
      }
      
      console.log('🖱️ handleMouseMove called:', { x, y });
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
    
    // 리렌더링 방지를 위해 정적 값만 반환
    isActive: false,
    hasActivity: false,
    averageVelocity: 0, // 실시간 계산 제거
    
    // Store 직접 접근 함수 (필요시에만 사용)
    getMouseState: () => mouseStore.getValue(),
  };
}