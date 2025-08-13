/**
 * @fileoverview Mouse Events Container - 아키텍처 레이어 조합
 *
 * View, Controller, Service들을 조합하여 완전한 기능을 제공
 */

import { useCallback, useEffect, useRef } from 'react';
import {
  CleanMouseEventsView,
  type MouseEventHandlers,
  type MouseViewElements,
} from '../components/CleanMouseEventsView';
import { MouseController } from '../controllers/MouseController';

/**
 * 마우스 이벤트 컨테이너 컴포넌트
 */
export const MouseEventsContainer = () => {
  console.log('🏗️ MouseEventsContainer render at', new Date().toISOString());

  const controllerRef = useRef<MouseController | null>(null);
  const isInitialized = useRef(false);

  // 컨트롤러 초기화
  useEffect(() => {
    if (!controllerRef.current) {
      controllerRef.current = new MouseController({
        throttleMs: 16, // 60fps
        moveEndDelayMs: 100,
      });
    }
  }, []);

  // View에서 DOM 요소들이 준비되면 컨트롤러 초기화
  const handleElementsReady = useCallback((elements: MouseViewElements) => {
    if (!controllerRef.current || isInitialized.current) return;

    console.log('🔧 Initializing MouseController with elements');

    controllerRef.current.initialize({
      renderElements: {
        cursor: elements.cursor,
        trail: elements.trail,
        pathSvg: elements.pathSvg,
        clickContainer: elements.clickContainer,
      },
      statusElements: {
        position: elements.statusPosition,
        moves: elements.statusMoves,
        clicks: elements.statusClicks,
        velocity: elements.statusVelocity,
        status: elements.statusMoving,
        inside: elements.statusInside,
        lastActivity: elements.statusLastActivity,
      },
    });

    isInitialized.current = true;
  }, []);

  // 이벤트 핸들러들 - 컨트롤러에 위임
  const handlers: MouseEventHandlers = {
    onMouseMove: useCallback((x: number, y: number) => {
      if (!controllerRef.current) return;
      controllerRef.current.handleMove({ x, y }, Date.now());

      // 활동 상태 업데이트 (UI용)
      const setHasActivity = (window as any).__setHasActivity;
      if (setHasActivity) {
        setHasActivity(true);
      }
    }, []),

    onMouseClick: useCallback((x: number, y: number, button: number) => {
      if (!controllerRef.current) return;
      controllerRef.current.handleClick({ x, y }, button, Date.now());
    }, []),

    onMouseEnter: useCallback((x: number, y: number) => {
      if (!controllerRef.current) return;
      controllerRef.current.handleEnter({ x, y }, Date.now());
    }, []),

    onMouseLeave: useCallback((x: number, y: number) => {
      if (!controllerRef.current) return;
      controllerRef.current.handleLeave({ x, y }, Date.now());
    }, []),

    onReset: useCallback(() => {
      if (!controllerRef.current) return;
      controllerRef.current.handleReset();

      // 활동 상태 리셋 (UI용)
      const setHasActivity = (window as any).__setHasActivity;
      if (setHasActivity) {
        setHasActivity(false);
      }
    }, []),
  };

  return (
    <CleanMouseEventsView
      handlers={handlers}
      onElementsReady={handleElementsReady}
    />
  );
};
