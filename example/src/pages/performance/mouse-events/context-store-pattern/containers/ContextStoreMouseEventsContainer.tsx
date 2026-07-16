/**
 * @fileoverview Context Store Mouse Events Container - Context Store 기반 컨테이너
 *
 * 기존 MouseEventsContext를 활용한 Context Store Pattern 기반 마우스 이벤트 처리
 */

import { useStoreValue } from '@context-action/react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ContextStoreMouseEventsView } from '../components/ContextStoreMouseEventsView';
import {
  aggregateMouseEventsState,
  useMouseEventsActionDispatch,
  useMouseEventsStore,
} from '../context/MouseEventsContext';
import { MouseEventsProvider } from '../providers/MouseEventsProvider';

/**
 * Context Store 기반 마우스 이벤트 Container 내부 로직
 */
const ContextStoreMouseEventsContainerInner = () => {
  console.log(
    '🏪 ContextStoreMouseEventsContainer render at',
    new Date().toISOString()
  );

  const isInitialized = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const moveEndTimeout = useRef<NodeJS.Timeout | null>(null);

  // 개별 Context Stores 접근
  const positionStore = useMouseEventsStore('position');
  const movementStore = useMouseEventsStore('movement');
  const clicksStore = useMouseEventsStore('clicks');
  const computedStore = useMouseEventsStore('computed');

  // Store 값들 구독
  const position = useStoreValue(positionStore);
  const movement = useStoreValue(movementStore);
  const clicks = useStoreValue(clicksStore);
  const computed = useStoreValue(computedStore);

  // Action dispatch
  const dispatch = useMouseEventsActionDispatch();

  // 집계된 상태 (backward compatibility를 위해)
  const mouseState = useMemo(
    () => aggregateMouseEventsState(position, movement, clicks, computed),
    [position, movement, clicks, computed]
  );

  // DOM 요소 설정 및 이벤트 바인딩
  useEffect(() => {
    const timer = setTimeout(() => {
      const container = document.getElementById('context-mouse-area');
      if (!container || isInitialized.current) return;

      console.log(
        '🔧 Initializing Context Store Mouse Events with DOM elements'
      );

      // DOM 요소들 생성 및 설정
      const _elements = setupDOMElements(container);

      // 이벤트 리스너 바인딩
      const cleanup = bindEventListeners(container);

      isInitialized.current = true;

      return () => {
        // 정리 작업
        cleanup();
        if (moveEndTimeout.current) {
          clearTimeout(moveEndTimeout.current);
        }
        isInitialized.current = false;
      };
    }, 100); // DOM이 완전히 렌더링될 때까지 기다림

    return () => {
      clearTimeout(timer);
    };
  }, [dispatch]);

  // Event handlers
  const handleMouseMove = useCallback(
    (x: number, y: number) => {
      const timestamp = Date.now();

      // 0,0 위치 필터링
      if (x === 0 && y === 0) {
        console.warn('🔴 ContextStore: Blocked 0,0 position in handleMove');
        return;
      }

      dispatch('mouseMove', { x, y, timestamp });

      // Move end detection (debounced)
      if (moveEndTimeout.current) {
        clearTimeout(moveEndTimeout.current);
      }

      moveEndTimeout.current = setTimeout(() => {
        dispatch('moveEnd', { position: { x, y }, timestamp: Date.now() });
      }, 100);
    },
    [dispatch]
  );

  const handleMouseClick = useCallback(
    (x: number, y: number, button: number) => {
      const timestamp = Date.now();

      // 0,0 위치 필터링
      if (x === 0 && y === 0) {
        console.warn('🔴 ContextStore: Blocked 0,0 position in handleClick');
        return;
      }

      dispatch('mouseClick', { x, y, button, timestamp });
    },
    [dispatch]
  );

  const handleMouseEnter = useCallback(
    (x: number, y: number) => {
      const timestamp = Date.now();
      dispatch('mouseEnter', { x, y, timestamp });
    },
    [dispatch]
  );

  const handleMouseLeave = useCallback(
    (x: number, y: number) => {
      const timestamp = Date.now();
      dispatch('mouseLeave', { x, y, timestamp });
    },
    [dispatch]
  );

  // 리셋 핸들러
  const handleReset = useCallback(() => {
    dispatch('resetMouseState');
  }, [dispatch]);

  // 이벤트 바인딩 함수
  const bindEventListeners = useCallback(
    (container: HTMLElement) => {
      const handleMouseMoveEvent = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const x = Math.round(e.clientX - rect.left);
        const y = Math.round(e.clientY - rect.top);
        handleMouseMove(x, y);
      };

      const handleMouseClickEvent = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const x = Math.round(e.clientX - rect.left);
        const y = Math.round(e.clientY - rect.top);
        handleMouseClick(x, y, e.button);
      };

      const handleMouseEnterEvent = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const x = Math.round(e.clientX - rect.left);
        const y = Math.round(e.clientY - rect.top);
        handleMouseEnter(x, y);
      };

      const handleMouseLeaveEvent = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const x = Math.round(e.clientX - rect.left);
        const y = Math.round(e.clientY - rect.top);
        handleMouseLeave(x, y);
      };

      // 이벤트 리스너 등록
      container.addEventListener('mousemove', handleMouseMoveEvent);
      container.addEventListener('mousedown', handleMouseClickEvent);
      container.addEventListener('mouseenter', handleMouseEnterEvent);
      container.addEventListener('mouseleave', handleMouseLeaveEvent);

      // 정리 함수 반환
      return () => {
        container.removeEventListener('mousemove', handleMouseMoveEvent);
        container.removeEventListener('mousedown', handleMouseClickEvent);
        container.removeEventListener('mouseenter', handleMouseEnterEvent);
        container.removeEventListener('mouseleave', handleMouseLeaveEvent);
      };
    },
    [handleMouseMove, handleMouseClick, handleMouseEnter, handleMouseLeave]
  );

  return (
    <div ref={containerRef}>
      <ContextStoreMouseEventsView
        mouseState={mouseState}
        onReset={handleReset}
      />
    </div>
  );
};

/**
 * Context Store 기반 마우스 이벤트 컨테이너 (Provider 포함)
 */
export const ContextStoreMouseEventsContainer = () => {
  return (
    <MouseEventsProvider>
      <ContextStoreMouseEventsContainerInner />
    </MouseEventsProvider>
  );
};

// ================================
// 🔧 DOM 설정 헬퍼 함수들
// ================================

/**
 * DOM 요소들 생성 및 설정
 */
function setupDOMElements(container: HTMLElement) {
  // 커서 요소 생성
  const cursor = document.createElement('div');
  cursor.className =
    'absolute w-4 h-4 rounded-full pointer-events-none border-2 border-white';
  cursor.style.cssText = `
    background: radial-gradient(circle, #10b981 0%, #059669 70%, #047857 100%);
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
    z-index: 2;
    will-change: transform;
    backface-visibility: hidden;
    transform: translateZ(0);
    opacity: 0;
  `;

  // 내부 하이라이트
  const cursorInner = document.createElement('div');
  cursorInner.className = 'absolute inset-1 bg-white rounded-full opacity-80';
  cursor.appendChild(cursorInner);

  // 트레일 요소 생성
  const trail = document.createElement('div');
  trail.className = 'absolute w-6 h-6 rounded-full pointer-events-none';
  trail.style.cssText = `
    background: radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 50%, transparent 100%);
    z-index: 1;
    will-change: transform;
    backface-visibility: hidden;
    opacity: 0;
    transform: translateZ(0);
  `;

  // SVG 패스 생성
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute(
    'class',
    'absolute inset-0 w-full h-full pointer-events-none'
  );
  svg.style.cssText = 'z-index: 1; will-change: auto;';

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('stroke', 'url(#pathGradient)');
  path.setAttribute('stroke-width', '3');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  path.style.cssText = `
    filter: drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3));
    opacity: 0.8;
  `;

  // 그라디언트 정의
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const gradient = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'linearGradient'
  );
  gradient.setAttribute('id', 'pathGradient');
  gradient.setAttribute('x1', '0%');
  gradient.setAttribute('y1', '0%');
  gradient.setAttribute('x2', '100%');
  gradient.setAttribute('y2', '0%');

  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', 'rgba(16, 185, 129, 0.8)');

  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop2.setAttribute('offset', '50%');
  stop2.setAttribute('stop-color', 'rgba(5, 150, 105, 0.6)');

  const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop3.setAttribute('offset', '100%');
  stop3.setAttribute('stop-color', 'rgba(4, 120, 87, 0.4)');

  gradient.appendChild(stop1);
  gradient.appendChild(stop2);
  gradient.appendChild(stop3);
  defs.appendChild(gradient);
  svg.appendChild(defs);
  svg.appendChild(path);

  // 클릭 컨테이너 생성
  const clickContainer = document.createElement('div');
  clickContainer.className = 'absolute inset-0 pointer-events-none';

  // 컨테이너에 요소들 추가
  container.appendChild(cursor);
  container.appendChild(trail);
  container.appendChild(svg);
  container.appendChild(clickContainer);

  return {
    cursor,
    trail,
    pathSvg: path,
    clickContainer,
  };
}
