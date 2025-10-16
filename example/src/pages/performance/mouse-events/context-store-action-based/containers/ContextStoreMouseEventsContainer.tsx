/**
 * @fileoverview Context Store Mouse Events Container - Context Store 패턴 컨테이너
 *
 * Context Store 패턴을 사용한 마우스 이벤트 컨테이너
 */

import { Store } from '@context-action/react';
import { useCallback, useEffect, useRef } from 'react';
import {
  createMouseClickHandler,
  createMouseEnterHandler,
  createMouseLeaveHandler,
  createMouseMoveHandler,
  createMoveEndHandler,
  createResetHandler,
} from '../actions/MouseActionHandlers';
import { ContextStoreMouseEventsView } from '../components/ContextStoreMouseEventsView';
import type { MouseStateData } from '../stores/MouseStoreSchema';
import {
  useMouseActionDispatch,
  useMouseActionHandler,
  useMouseStore,
} from '../stores/MouseStoreSchema';

/**
 * Context Store 기반 마우스 이벤트 컨테이너
 */
export const ContextStoreMouseEventsContainer = () => {
  console.log(
    '🏪 ContextStoreMouseEventsContainer render at',
    new Date().toISOString()
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const _isInitialized = useRef(false);

  // Action Context Pattern 사용 - 구조 분해 할당 방식
  const mouseStateStore = useMouseStore('mouseState');
  const dispatch = useMouseActionDispatch();

  // 액션 핸들러 등록 - 구조 분해 할당 방식
  useMouseActionHandler('mouseMove', createMouseMoveHandler(mouseStateStore));
  useMouseActionHandler('mouseClick', createMouseClickHandler(mouseStateStore));
  useMouseActionHandler('mouseEnter', createMouseEnterHandler(mouseStateStore));
  useMouseActionHandler('mouseLeave', createMouseLeaveHandler(mouseStateStore));
  useMouseActionHandler('moveEnd', createMoveEndHandler(mouseStateStore));
  useMouseActionHandler('reset', createResetHandler(mouseStateStore));

  // DOM 요소 설정 및 이벤트 바인딩
  useEffect(() => {
    const timer = setTimeout(() => {
      const container = document.getElementById('context-store-mouse-area');
      if (!container) return;

      console.log(
        '🔧 Initializing ContextStore mouse events with DOM elements'
      );

      // DOM 요소들 생성 및 설정
      const elements = setupDOMElements(container);

      // 이벤트 리스너 바인딩
      const cleanup = bindEventListeners(container, dispatch);

      // 상태 변화 구독하여 경로 렌더링
      const stateCleanup = subscribeToStateChanges(mouseStateStore, elements);

      return () => {
        cleanup();
        stateCleanup();
      };
    }, 100); // DOM이 완전히 렌더링될 때까지 기다림

    return () => {
      clearTimeout(timer);
    };
  }, [dispatch, mouseStateStore]);

  // 리셋 핸들러
  const handleReset = useCallback(() => {
    dispatch('reset', undefined);
  }, [dispatch]);

  return (
    <div ref={containerRef}>
      <ContextStoreMouseEventsView onReset={handleReset} />
    </div>
  );
};

// ================================
// 🔧 DOM 설정 헬퍼 함수들
// ================================

// ================================
// 🔧 타입 정의
// ================================

/**
 * DOM 렌더링 요소들 타입
 */
interface RenderElements {
  cursor: HTMLDivElement;
  trail: HTMLDivElement;
  pathSvg: SVGPathElement;
  clickContainer: HTMLDivElement;
}

/**
 * DOM 요소들 생성 및 설정
 */
function setupDOMElements(container: HTMLElement): {
  renderElements: RenderElements;
} {
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
  path.setAttribute('stroke', 'url(#contextPathGradient)');
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
  gradient.setAttribute('id', 'contextPathGradient');
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
    renderElements: {
      cursor,
      trail,
      pathSvg: path,
      clickContainer,
    } as RenderElements,
  };
}

/**
 * 상태 변화 구독하여 DOM 업데이트
 */
function subscribeToStateChanges(
  mouseStateStore: Store<MouseStateData>,
  elements: { renderElements: RenderElements }
): () => void {
  let prevState = mouseStateStore.getValue();

  const updateVisuals = () => {
    const currentState = mouseStateStore.getValue();

    // 리셋 상태 확인 - 모든 값이 초기값이면 DOM도 초기화
    const isResetState =
      currentState.mousePosition.x === -999 &&
      currentState.mousePosition.y === -999 &&
      currentState.moveCount === 0 &&
      currentState.clickCount === 0;

    if (isResetState) {
      // 리셋 상태일 때 DOM 요소들 초기화
      const { cursor, trail, pathSvg, clickContainer } =
        elements.renderElements;

      requestAnimationFrame(() => {
        cursor.style.opacity = '0';
        cursor.style.transform = 'translate3d(-999px, -999px, 0)';

        trail.style.opacity = '0';
        trail.style.transform = 'translate3d(-999px, -999px, 0)';

        pathSvg.setAttribute('d', '');
        clickContainer.innerHTML = '';
      });
    } else {
      // 일반 상태일 때 정상 렌더링

      // 커서 위치 업데이트
      if (
        currentState.mousePosition.x !== -999 &&
        currentState.mousePosition.y !== -999
      ) {
        const { cursor, trail } = elements.renderElements;

        // 커서와 트레일 위치 업데이트
        requestAnimationFrame(() => {
          cursor.style.transform = `translate3d(${currentState.mousePosition.x - 8}px, ${currentState.mousePosition.y - 8}px, 0)`;
          cursor.style.opacity = '1';

          trail.style.transform = `translate3d(${currentState.mousePosition.x - 12}px, ${currentState.mousePosition.y - 12}px, 0)`;
          trail.style.opacity = '1';
        });
      }

      // 경로 렌더링 (validPath 사용)
      if (currentState.validPath && currentState.validPath.length >= 2) {
        const pathSvg = elements.renderElements.pathSvg;
        const visiblePath = currentState.validPath.slice(0, 10); // 최대 10개 포인트
        const pathData = `M ${visiblePath.map((point) => `${point.x} ${point.y}`).join(' L ')}`;
        pathSvg.setAttribute('d', pathData);
      } else {
        elements.renderElements.pathSvg.setAttribute('d', '');
      }

      // 클릭 애니메이션 (새로운 클릭이 있을 때만)
      if (currentState.clickHistory.length > prevState.clickHistory.length) {
        const latestClick = currentState.clickHistory[0];
        if (latestClick && latestClick.x !== -999 && latestClick.y !== -999) {
          renderClickAnimation(
            latestClick,
            elements.renderElements.clickContainer
          );
        }
      }
    }

    prevState = currentState;
  };

  // 초기 렌더링
  updateVisuals();

  // 상태 변화 구독
  const unsubscribe = mouseStateStore.subscribe(updateVisuals);

  return unsubscribe;
}

/**
 * 클릭 애니메이션 렌더링
 */
function renderClickAnimation(
  click: { x: number; y: number; timestamp: number },
  clickContainer: HTMLDivElement
): void {
  const clickElement = document.createElement('div');
  clickElement.className = 'absolute pointer-events-none';
  clickElement.style.cssText = `
    left: ${click.x - 15}px;
    top: ${click.y - 15}px;
    width: 30px;
    height: 30px;
  `;

  clickElement.innerHTML = `
    <div class="relative w-full h-full">
      <div class="absolute inset-0 rounded-full border-2 border-green-400"
           style="background: radial-gradient(circle, rgba(16, 185, 129, 0.8) 0%, transparent 70%);
                  box-shadow: 0 0 10px rgba(16, 185, 129, 0.8);
                  will-change: transform, opacity;
                  backface-visibility: hidden;"></div>
      <div class="absolute inset-2 bg-green-400 rounded-full flex items-center justify-center"
           style="opacity: 1; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);">
        <span class="text-xs font-bold text-green-900">●</span>
      </div>
    </div>
  `;

  clickContainer.appendChild(clickElement);

  // 애니메이션
  clickElement.style.transform = 'scale(0)';
  clickElement.style.opacity = '0';

  requestAnimationFrame(() => {
    clickElement.style.transition = 'all 0.6s ease-out';
    clickElement.style.transform = 'scale(1.2)';
    clickElement.style.opacity = '1';

    setTimeout(() => {
      clickElement.style.transform = 'scale(0)';
      clickElement.style.opacity = '0';

      setTimeout(() => {
        if (clickElement.parentNode) {
          clickElement.parentNode.removeChild(clickElement);
        }
      }, 200);
    }, 400);
  });
}

/**
 * 이벤트 리스너 바인딩
 */
function bindEventListeners(
  container: HTMLElement,
  dispatch: ReturnType<typeof useMouseActionDispatch>
): () => void {
  const handleMouseMove = (e: MouseEvent) => {
    const rect = container.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    dispatch('mouseMove', { position: { x, y }, timestamp: Date.now() });
  };

  const handleMouseClick = (e: MouseEvent) => {
    const rect = container.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    dispatch('mouseClick', {
      position: { x, y },
      button: e.button,
      timestamp: Date.now(),
    });
  };

  const handleMouseEnter = (e: MouseEvent) => {
    const rect = container.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    dispatch('mouseEnter', { position: { x, y }, timestamp: Date.now() });
  };

  const handleMouseLeave = (e: MouseEvent) => {
    const rect = container.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    dispatch('mouseLeave', { position: { x, y }, timestamp: Date.now() });
  };

  // 이벤트 리스너 등록
  container.addEventListener('mousemove', handleMouseMove);
  container.addEventListener('mousedown', handleMouseClick);
  container.addEventListener('mouseenter', handleMouseEnter);
  container.addEventListener('mouseleave', handleMouseLeave);

  // 정리 함수 반환
  return () => {
    container.removeEventListener('mousemove', handleMouseMove);
    container.removeEventListener('mousedown', handleMouseClick);
    container.removeEventListener('mouseenter', handleMouseEnter);
    container.removeEventListener('mouseleave', handleMouseLeave);
  };
}
