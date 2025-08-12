/**
 * @fileoverview Store-Based Mouse Events Container - 스토어 기반 컨테이너
 * 
 * StoreBasedMouseController와 StoreBasedMouseEventsView를 연결하는 컨테이너
 */

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { StoreBasedMouseController } from '../controllers/StoreBasedMouseController';
import { StoreBasedMouseEventsView } from '../components/StoreBasedMouseEventsView';
import type { MouseViewElements } from '../components/CleanMouseEventsView';

/**
 * 스토어 기반 마우스 이벤트 컨테이너
 */
export const StoreBasedMouseEventsContainer = () => {
  console.log('🏪 StoreBasedMouseEventsContainer render at', new Date().toISOString());
  
  const controllerRef = useRef<StoreBasedMouseController | null>(null);
  const isInitialized = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 컨트롤러 초기화 (한번만)
  const controller = useMemo(() => {
    if (!controllerRef.current) {
      controllerRef.current = new StoreBasedMouseController({
        throttleMs: 16, // 60fps
        moveEndDelayMs: 100,
      });
    }
    return controllerRef.current;
  }, []);

  // DOM 요소 설정 및 이벤트 바인딩
  useEffect(() => {
    const timer = setTimeout(() => {
      const container = document.getElementById('reactive-mouse-area');
      if (!container || isInitialized.current) return;

      console.log('🔧 Initializing StoreBasedMouseController with DOM elements');

      // DOM 요소들 생성 및 설정
      const elements = setupDOMElements(container);
      
      // 컨트롤러 초기화
      controller.initialize({
        renderElements: elements.renderElements,
        statusElements: elements.statusElements,
      });

      // 이벤트 리스너 바인딩
      const cleanup = bindEventListeners(container, controller);

      isInitialized.current = true;

      return () => {
        // 정리 작업
        cleanup();
        controller.dispose();
        isInitialized.current = false;
      };
    }, 100); // DOM이 완전히 렌더링될 때까지 기다림

    return () => {
      clearTimeout(timer);
    };
  }, [controller]);

  // 리셋 핸들러
  const handleReset = useCallback(() => {
    controller.handleReset();
  }, [controller]);

  // 스토어 컬렉션 조회
  const stores = controller.getStores();

  return (
    <div ref={containerRef}>
      <StoreBasedMouseEventsView 
        stores={stores}
        onReset={handleReset}
      />
    </div>
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
  cursor.className = 'absolute w-4 h-4 rounded-full pointer-events-none border-2 border-white';
  cursor.style.cssText = `
    background: radial-gradient(circle, #8b5cf6 0%, #7c3aed 70%, #6d28d9 100%);
    box-shadow: 0 0 10px rgba(139, 92, 246, 0.4);
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
    background: radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 50%, transparent 100%);
    z-index: 1;
    will-change: transform;
    backface-visibility: hidden;
    opacity: 0;
    transform: translateZ(0);
  `;

  // SVG 패스 생성
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'absolute inset-0 w-full h-full pointer-events-none');
  svg.style.cssText = 'z-index: 1; will-change: auto;';
  
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('stroke', 'url(#pathGradient)');
  path.setAttribute('stroke-width', '3');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  path.style.cssText = `
    filter: drop-shadow(0 2px 4px rgba(139, 92, 246, 0.3));
    opacity: 0.8;
  `;
  
  // 그라디언트 정의
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  gradient.setAttribute('id', 'pathGradient');
  gradient.setAttribute('x1', '0%');
  gradient.setAttribute('y1', '0%');
  gradient.setAttribute('x2', '100%');
  gradient.setAttribute('y2', '0%');
  
  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', 'rgba(139, 92, 246, 0.8)');
  
  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop2.setAttribute('offset', '50%');
  stop2.setAttribute('stop-color', 'rgba(124, 58, 237, 0.6)');
  
  const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop3.setAttribute('offset', '100%');
  stop3.setAttribute('stop-color', 'rgba(109, 40, 217, 0.4)');
  
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

  // 상태 표시 요소들 - Reactive Stores에서는 React가 관리
  const statusElements = {
    position: null, // React StatusPanel에서 관리
    moves: null,    // React StatusPanel에서 관리
    clicks: null,   // React StatusPanel에서 관리
    velocity: null, // React StatusPanel에서 관리
    status: null,   // React StatusPanel에서 관리
    inside: null,   // React StatusPanel에서 관리
    lastActivity: null, // React StatusPanel에서 관리
  };

  return {
    renderElements: {
      cursor,
      trail,
      pathSvg: path,
      clickContainer,
    },
    statusElements,
  };
}

/**
 * 이벤트 리스너 바인딩
 */
function bindEventListeners(container: HTMLElement, controller: StoreBasedMouseController) {
  const handleMouseMove = (e: MouseEvent) => {
    const rect = container.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    controller.handleMove({ x, y }, Date.now());
  };

  const handleMouseClick = (e: MouseEvent) => {
    const rect = container.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    controller.handleClick({ x, y }, e.button, Date.now());
  };

  const handleMouseEnter = (e: MouseEvent) => {
    const rect = container.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    controller.handleEnter({ x, y }, Date.now());
  };

  const handleMouseLeave = (e: MouseEvent) => {
    const rect = container.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    controller.handleLeave({ x, y }, Date.now());
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