/**
 * @fileoverview Mouse Action Handlers - Context Store 패턴 액션 핸들러
 * 
 * 마우스 이벤트를 처리하는 액션 핸들러들
 */

import type { ActionHandler } from '@context-action/core';
import type { MouseActions, MousePosition, MouseStateData, initialMouseState } from '../stores/MouseStoreSchema';
import {
  computeValidPath,
  computeRecentClickCount,
  computeAverageVelocity,
  computeActivityStatus,
  computeHasActivity,
} from '../stores/MouseStoreSchema';

// ================================
// 🎯 액션 핸들러 구현
// ================================

/**
 * 마우스 이동 액션 핸들러 팩토리
 */
export const createMouseMoveHandler = (mouseStateStore: any): ActionHandler<MouseActions['mouseMove']> => 
  (payload, controller) => {
    const { position, timestamp } = payload;
    const currentState = mouseStateStore.getValue();

    console.log('🎯 mouseMove action:', { x: position.x, y: position.y, timestamp });

    // 속도 계산
    const timeDiff = currentState.lastMoveTime ? timestamp - currentState.lastMoveTime : 0;
    const deltaX = position.x - currentState.mousePosition.x;
    const deltaY = position.y - currentState.mousePosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = timeDiff > 0 ? distance / timeDiff : 0;

    // 경로 업데이트
    const newMovePath = [position, ...currentState.movePath.slice(0, 19)]; // 최대 20개
    const validPath = computeValidPath(newMovePath);
    const averageVelocity = computeAverageVelocity(validPath);
    const activityStatus = computeActivityStatus(
      true,
      currentState.recentClickCount,
      velocity,
      currentState.clickHistory[0]?.timestamp || null
    );

    // 상태 업데이트
    const newState: MouseStateData = {
      ...currentState,
      previousPosition: currentState.mousePosition,
      mousePosition: position,
      isMoving: true,
      moveCount: currentState.moveCount + 1,
      velocity,
      lastMoveTime: timestamp,
      movePath: newMovePath,
      
      // 계산된 값들
      validPath,
      averageVelocity,
      activityStatus,
      totalEvents: currentState.moveCount + 1 + currentState.clickCount,
      hasActivity: true,
    };

    mouseStateStore.setValue(newState);

    // 이동 종료 감지를 위한 타이머 설정
    setTimeout(() => {
      const latestState = mouseStateStore.getValue();
      if (latestState.lastMoveTime === timestamp) {
        // 마지막 이동이 이 이벤트였다면 이동 상태를 false로 설정
        mouseStateStore.setValue({
          ...latestState,
          isMoving: false,
          activityStatus: computeActivityStatus(
            false,
            latestState.recentClickCount,
            latestState.velocity,
            latestState.clickHistory[0]?.timestamp || null
          ),
        });
      }
    }, 100);
  };

/**
 * 마우스 클릭 액션 핸들러 팩토리
 */
export const createMouseClickHandler = (mouseStateStore: any): ActionHandler<MouseActions['mouseClick']> => 
  (payload, controller) => {
    const { position, button, timestamp } = payload;
    const currentState = mouseStateStore.getValue();

    console.log('🎯 mouseClick action:', { x: position.x, y: position.y, button, timestamp });

    // 클릭 기록 업데이트
    const newClick = { ...position, timestamp };
    const newClickHistory = [newClick, ...currentState.clickHistory.slice(0, 9)]; // 최대 10개
    const recentClickCount = computeRecentClickCount(newClickHistory);
    const activityStatus = computeActivityStatus(
      currentState.isMoving,
      recentClickCount,
      currentState.velocity,
      timestamp
    );

    // 상태 업데이트
    const newState: MouseStateData = {
      ...currentState,
      clickCount: currentState.clickCount + 1,
      clickHistory: newClickHistory,
      
      // 계산된 값들
      recentClickCount,
      activityStatus,
      totalEvents: currentState.moveCount + currentState.clickCount + 1,
      hasActivity: true,
    };

    mouseStateStore.setValue(newState);
  };

/**
 * 마우스 진입 액션 핸들러 팩토리
 */
export const createMouseEnterHandler = (mouseStateStore: any): ActionHandler<MouseActions['mouseEnter']> => 
  (payload, controller) => {
    const { position, timestamp } = payload;
    const currentState = mouseStateStore.getValue();

    console.log('🎯 mouseEnter action:', { x: position.x, y: position.y, timestamp });

    mouseStateStore.setValue({
      ...currentState,
      mousePosition: position,
      isInsideArea: true,
    });
  };

/**
 * 마우스 이탈 액션 핸들러 팩토리
 */
export const createMouseLeaveHandler = (mouseStateStore: any): ActionHandler<MouseActions['mouseLeave']> => 
  (payload, controller) => {
    const { position, timestamp } = payload;
    const currentState = mouseStateStore.getValue();

    console.log('🎯 mouseLeave action:', { x: position.x, y: position.y, timestamp });

    const activityStatus = computeActivityStatus(
      false,
      currentState.recentClickCount,
      currentState.velocity,
      currentState.clickHistory[0]?.timestamp || null
    );

    mouseStateStore.setValue({
      ...currentState,
      mousePosition: position,
      isInsideArea: false,
      isMoving: false,
      activityStatus,
    });
  };

/**
 * 마우스 이동 종료 액션 핸들러 팩토리
 */
export const createMoveEndHandler = (mouseStateStore: any): ActionHandler<MouseActions['moveEnd']> => 
  (payload, controller) => {
    const { position, timestamp } = payload;
    const currentState = mouseStateStore.getValue();

    console.log('🎯 moveEnd action:', { position, timestamp });

    const activityStatus = computeActivityStatus(
      false,
      currentState.recentClickCount,
      0,
      currentState.clickHistory[0]?.timestamp || null
    );

    mouseStateStore.setValue({
      ...currentState,
      isMoving: false,
      velocity: 0,
      activityStatus,
    });
  };

/**
 * 상태 리셋 액션 핸들러 팩토리
 */
export const createResetHandler = (mouseStateStore: any): ActionHandler<MouseActions['reset']> => 
  (payload, controller) => {
    console.log('🎯 reset action');

    mouseStateStore.setValue(initialMouseState);
    
    // DOM 요소들도 초기화
    const container = document.getElementById('context-store-mouse-area');
    if (container) {
      const cursor = container.querySelector('.absolute.w-4.h-4') as HTMLElement;
      const trail = container.querySelector('.absolute.w-6.h-6') as HTMLElement;
      const pathSvg = container.querySelector('path') as SVGPathElement;
      const clickContainer = container.querySelector('.absolute.inset-0.pointer-events-none') as HTMLElement;
      
      if (cursor) {
        cursor.style.opacity = '0';
        cursor.style.transform = 'translate3d(-999px, -999px, 0)';
      }
      
      if (trail) {
        trail.style.opacity = '0';
        trail.style.transform = 'translate3d(-999px, -999px, 0)';
      }
      
      if (pathSvg) {
        pathSvg.setAttribute('d', '');
      }
      
      if (clickContainer) {
        clickContainer.innerHTML = '';
      }
    }
  };