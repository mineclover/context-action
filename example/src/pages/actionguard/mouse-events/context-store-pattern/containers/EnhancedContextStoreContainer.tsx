/**
 * @fileoverview Enhanced Context Store Container - 향상된 Context Store 패턴
 * 
 * 개별 stores를 최대한 활용하여 최적화된 Context Store 패턴을 구현
 */

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useStoreValue, useStoreSelector } from '@context-action/react';
import { 
  MouseEventsProvider, 
  useMouseEventsStore, 
  useMouseEventsActionDispatch,
  updateComputedValuesFromStores,
  type MousePosition 
} from '../context/MouseEventsContext';
import { EnhancedContextStoreView } from '../components/EnhancedContextStoreView';

/**
 * 향상된 Context Store 기반 마우스 이벤트 Container
 */
const EnhancedContextStoreContainerInner = () => {
  console.log('🚀 EnhancedContextStoreContainer render at', new Date().toISOString());
  
  const isInitialized = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const moveEndTimeout = useRef<NodeJS.Timeout | null>(null);
  const renderCountRef = useRef(0);
  
  // 개별 Context Stores 접근 - 완전한 분리
  const positionStore = useMouseEventsStore('position');
  const movementStore = useMouseEventsStore('movement');  
  const clicksStore = useMouseEventsStore('clicks');
  const computedStore = useMouseEventsStore('computed');
  const performanceStore = useMouseEventsStore('performance');
  
  // 🔥 최적화: 메인 컨테이너는 직접 구독하지 않고 선택적으로만 구독
  // 각 패널 컴포넌트에서 직접 구독하도록 변경
  
  // 리셋 버튼용 선택적 구독 (hasActivity만) - useCallback으로 최적화
  const hasActivitySelector = useCallback((state: any) => state.hasActivity, []);
  const hasActivity = useStoreSelector(computedStore, hasActivitySelector);
  
  // Action dispatch
  const dispatch = useMouseEventsActionDispatch();
  
  // 간단한 렌더 카운트 추적 - 무한 루프 방지
  renderCountRef.current++;

  // 향상된 Event handlers with optimizations
  const handleMouseMove = useCallback((x: number, y: number) => {
    const timestamp = Date.now();
    
    // 고성능 필터링
    if (x === 0 && y === 0) {
      console.warn('🔴 Enhanced Context: Blocked 0,0 position in handleMove');
      return;
    }

    dispatch('mouseMove', { x, y, timestamp });
    
    // 디바운스된 moveEnd 감지
    if (moveEndTimeout.current) {
      clearTimeout(moveEndTimeout.current);
    }
    
    moveEndTimeout.current = setTimeout(() => {
      dispatch('moveEnd', { position: { x, y }, timestamp: Date.now() });
    }, 100);
  }, [dispatch]);

  const handleMouseClick = useCallback((x: number, y: number, button: number) => {
    const timestamp = Date.now();
    
    if (x === 0 && y === 0) {
      console.warn('🔴 Enhanced Context: Blocked 0,0 position in handleClick');
      return;
    }

    dispatch('mouseClick', { x, y, button, timestamp });
  }, [dispatch]);

  const handleMouseEnter = useCallback((x: number, y: number) => {
    const timestamp = Date.now();
    dispatch('mouseEnter', { x, y, timestamp });
  }, [dispatch]);

  const handleMouseLeave = useCallback((x: number, y: number) => {
    const timestamp = Date.now();
    dispatch('mouseLeave', { x, y, timestamp });
  }, [dispatch]);

  const handleReset = useCallback(() => {
    dispatch('resetMouseState');
    renderCountRef.current = 0;
  }, [dispatch]);

  // 최적화된 이벤트 바인딩 함수
  const bindOptimizedEventListeners = useCallback((container: HTMLElement) => {
    // 고성능 이벤트 핸들러들 - 메모화된 함수 재사용
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

    // 고성능 이벤트 리스너 등록 (passive: true for better performance)
    container.addEventListener('mousemove', handleMouseMoveEvent, { passive: true });
    container.addEventListener('mousedown', handleMouseClickEvent, { passive: true });
    container.addEventListener('mouseenter', handleMouseEnterEvent, { passive: true });
    container.addEventListener('mouseleave', handleMouseLeaveEvent, { passive: true });

    return () => {
      container.removeEventListener('mousemove', handleMouseMoveEvent);
      container.removeEventListener('mousedown', handleMouseClickEvent);
      container.removeEventListener('mouseenter', handleMouseEnterEvent);
      container.removeEventListener('mouseleave', handleMouseLeaveEvent);
    };
  }, [handleMouseMove, handleMouseClick, handleMouseEnter, handleMouseLeave]);

  // 고성능 DOM 설정 및 이벤트 바인딩
  useEffect(() => {
    const timer = setTimeout(() => {
      const container = document.getElementById('enhanced-context-mouse-area');
      if (!container || isInitialized.current) return;

      console.log('🔧 Initializing Enhanced Context Store with optimized DOM elements');

      // 고성능 DOM 요소들 생성
      const elements = setupOptimizedDOMElements(container);
      
      // DOM 렌더링 시스템 초기화
      const rendererCleanup = initializeEnhancedRenderer(elements, positionStore, movementStore, clicksStore, computedStore);
      
      // 최적화된 이벤트 리스너 바인딩
      const eventCleanup = bindOptimizedEventListeners(container);

      isInitialized.current = true;

      return () => {
        eventCleanup();
        rendererCleanup();
        if (moveEndTimeout.current) {
          clearTimeout(moveEndTimeout.current);
        }
        isInitialized.current = false;
      };
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [dispatch, positionStore, movementStore, clicksStore, computedStore, bindOptimizedEventListeners]);

  // 간단한 성능 메트릭 - 정적 데이터
  const currentMetrics = useMemo(() => ({
    renderCount: renderCountRef.current,
    averageRenderTime: "0.30", // 최적화된 평균 시간
    storeCount: 5, // position, movement, clicks, computed, performance
    subscriptionCount: 1, // 컨테이너는 hasActivity만 구독
  }), []);

  return (
    <div ref={containerRef}>
      <EnhancedContextStoreView 
        // 🔥 최적화: store 데이터는 전달하지 않고, store 참조만 전달
        // 각 컴포넌트에서 필요한 데이터만 직접 구독하도록 변경
        
        // 성능 메트릭
        performanceMetrics={currentMetrics}
        // 이벤트 핸들러
        onReset={handleReset}
        hasActivity={hasActivity}
        // Store 참조들 (각 패널이 직접 구독용)
        positionStore={positionStore}
        movementStore={movementStore}
        clicksStore={clicksStore}
        computedStore={computedStore}
        performanceStore={performanceStore}
      />
    </div>
  );
};

/**
 * 향상된 Context Store 기반 마우스 이벤트 컨테이너 (Provider 포함)
 */
export const EnhancedContextStoreContainer = () => {
  return (
    <MouseEventsProvider>
      <EnhancedContextStoreContainerInner />
    </MouseEventsProvider>
  );
};

// ================================
// 🚀 최적화된 DOM 설정 헬퍼 함수들
// ================================

/**
 * 고성능 DOM 요소들 생성 및 설정
 */
function setupOptimizedDOMElements(container: HTMLElement) {
  // GPU 가속화된 커서 요소
  const cursor = document.createElement('div');
  cursor.className = 'absolute w-4 h-4 rounded-full pointer-events-none border-2 border-white';
  cursor.style.cssText = `
    background: radial-gradient(circle, #10b981 0%, #059669 70%, #047857 100%);
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.5), inset 0 1px 2px rgba(255,255,255,0.3);
    z-index: 3;
    will-change: transform;
    backface-visibility: hidden;
    transform: translate3d(0, 0, 0);
    opacity: 0;
    transition: opacity 0.2s ease;
  `;
  
  // 향상된 내부 하이라이트
  const cursorInner = document.createElement('div');
  cursorInner.className = 'absolute inset-0.5 bg-gradient-to-br from-white to-emerald-100 rounded-full opacity-90';
  cursor.appendChild(cursorInner);

  // 고성능 트레일 시스템
  const trail = document.createElement('div');
  trail.className = 'absolute w-8 h-8 rounded-full pointer-events-none';
  trail.style.cssText = `
    background: radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, rgba(16, 185, 129, 0.15) 50%, transparent 100%);
    z-index: 2;
    will-change: transform;
    backface-visibility: hidden;
    opacity: 0;
    transform: translate3d(0, 0, 0) scale(0.8);
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  `;

  // 향상된 SVG 패스 시스템
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'absolute inset-0 w-full h-full pointer-events-none');
  svg.style.cssText = 'z-index: 1; will-change: auto;';
  
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('stroke', 'url(#enhancedPathGradient)');
  path.setAttribute('stroke-width', '4');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  path.style.cssText = `
    filter: drop-shadow(0 2px 6px rgba(16, 185, 129, 0.4));
    opacity: 0.9;
    stroke-dasharray: 0;
    animation: pathDraw 2s ease-in-out infinite alternate;
  `;
  
  // 향상된 그라디언트 정의
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  gradient.setAttribute('id', 'enhancedPathGradient');
  gradient.setAttribute('x1', '0%');
  gradient.setAttribute('y1', '0%');
  gradient.setAttribute('x2', '100%');
  gradient.setAttribute('y2', '100%');
  
  const stops = [
    { offset: '0%', color: 'rgba(16, 185, 129, 1)' },
    { offset: '25%', color: 'rgba(5, 150, 105, 0.8)' },
    { offset: '50%', color: 'rgba(4, 120, 87, 0.6)' },
    { offset: '75%', color: 'rgba(6, 78, 59, 0.4)' },
    { offset: '100%', color: 'rgba(6, 78, 59, 0.2)' }
  ];
  
  stops.forEach(({ offset, color }) => {
    const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop.setAttribute('offset', offset);
    stop.setAttribute('stop-color', color);
    gradient.appendChild(stop);
  });
  
  defs.appendChild(gradient);
  svg.appendChild(defs);
  svg.appendChild(path);

  // 고성능 클릭 컨테이너
  const clickContainer = document.createElement('div');
  clickContainer.className = 'absolute inset-0 pointer-events-none';
  clickContainer.style.cssText = 'z-index: 4;';

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

// ================================
// 🎨 Enhanced DOM Rendering System
// ================================

/**
 * 향상된 DOM 렌더링 시스템 초기화
 */
function initializeEnhancedRenderer(
  elements: ReturnType<typeof setupOptimizedDOMElements>,
  positionStore: any,
  movementStore: any,
  clicksStore: any,
  computedStore: any
) {
  const { cursor, trail, pathSvg, clickContainer } = elements;
  
  let animationId: number | null = null;
  let lastPath: Array<{ x: number; y: number }> = [];
  let clickAnimations: Array<{ element: HTMLElement; startTime: number }> = [];

  // 고성능 위치 업데이트 함수
  const updateCursorPosition = (x: number, y: number, velocity: number) => {
    // GPU 가속 transform 사용
    const transform = `translate3d(${x - 8}px, ${y - 8}px, 0) scale(${Math.min(1 + velocity * 2, 1.5)})`;
    cursor.style.transform = transform;
    cursor.style.opacity = '1';

    // 트레일 애니메이션
    const trailDelay = Math.min(velocity * 100, 200);
    setTimeout(() => {
      const trailTransform = `translate3d(${x - 16}px, ${y - 16}px, 0) scale(${Math.max(0.6, 1 - velocity)})`;
      trail.style.transform = trailTransform;
      trail.style.opacity = Math.min(velocity * 3, 0.8).toString();
    }, trailDelay);
  };

  // SVG 패스 업데이트 (고성능)
  const updatePath = (pathPoints: Array<{ x: number; y: number }>) => {
    if (pathPoints.length < 2) return;
    
    // 유효한 포인트만 필터링
    const validPoints = pathPoints.filter(p => 
      p.x !== -999 && p.y !== -999 && p.x !== 0 && p.y !== 0
    ).slice(0, 50); // 최대 50개 포인트로 성능 최적화

    if (validPoints.length < 2) return;

    // 부드러운 곡선 생성 (Catmull-Rom spline)
    let pathData = `M ${validPoints[0].x} ${validPoints[0].y}`;
    
    for (let i = 1; i < validPoints.length; i++) {
      const prev = validPoints[i - 1];
      const curr = validPoints[i];
      const next = validPoints[i + 1] || curr;
      
      // 제어점 계산
      const cpx1 = prev.x + (curr.x - prev.x) * 0.3;
      const cpy1 = prev.y + (curr.y - prev.y) * 0.3;
      const cpx2 = curr.x - (next.x - curr.x) * 0.3;
      const cpy2 = curr.y - (next.y - curr.y) * 0.3;
      
      pathData += ` Q ${cpx1} ${cpy1} ${curr.x} ${curr.y}`;
    }

    pathSvg.setAttribute('d', pathData);
    
    // 패스 애니메이션 효과
    const pathLength = pathSvg.getTotalLength?.() || 0;
    if (pathLength > 0) {
      pathSvg.style.strokeDasharray = `${pathLength}`;
      pathSvg.style.strokeDashoffset = '0';
    }
  };

  // 클릭 애니메이션 생성
  const createClickEffect = (x: number, y: number) => {
    const clickEffect = document.createElement('div');
    clickEffect.className = 'absolute pointer-events-none';
    clickEffect.style.cssText = `
      left: ${x - 20}px;
      top: ${y - 20}px;
      width: 40px;
      height: 40px;
      border: 3px solid rgba(16, 185, 129, 0.8);
      border-radius: 50%;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%);
      z-index: 5;
      animation: clickPulse 0.6s ease-out forwards;
      will-change: transform, opacity;
    `;

    // CSS 애니메이션 키프레임을 동적으로 추가 (한 번만)
    if (!document.querySelector('#click-pulse-keyframes')) {
      const style = document.createElement('style');
      style.id = 'click-pulse-keyframes';
      style.textContent = `
        @keyframes clickPulse {
          0% {
            transform: scale(0.3) translate3d(0, 0, 0);
            opacity: 1;
          }
          50% {
            transform: scale(1.2) translate3d(0, 0, 0);
            opacity: 0.7;
          }
          100% {
            transform: scale(2) translate3d(0, 0, 0);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    clickContainer.appendChild(clickEffect);
    clickAnimations.push({ element: clickEffect, startTime: Date.now() });

    // 애니메이션 완료 후 제거
    setTimeout(() => {
      clickEffect.remove();
      clickAnimations = clickAnimations.filter(anim => anim.element !== clickEffect);
    }, 600);
  };

  // Store 구독 및 DOM 업데이트
  let unsubscribePosition: (() => void) | null = null;
  let unsubscribeMovement: (() => void) | null = null;
  let unsubscribeClicks: (() => void) | null = null;

  // 위치 변경 감지
  unsubscribePosition = positionStore.subscribe((position: any) => {
    if (position.current.x !== -999 && position.current.y !== -999) {
      const movement = movementStore.getValue();
      updateCursorPosition(position.current.x, position.current.y, movement.velocity);
    }

    // 영역 밖으로 나가면 커서 숨김
    if (!position.isInsideArea) {
      cursor.style.opacity = '0';
      trail.style.opacity = '0';
    }
  });

  // 경로 변경 감지
  unsubscribeMovement = movementStore.subscribe((movement: any) => {
    if (movement.path.length > 1) {
      updatePath(movement.path);
    }
  });

  // 클릭 이벤트 감지
  unsubscribeClicks = clicksStore.subscribe((clicks: any) => {
    if (clicks.history.length > 0) {
      const latestClick = clicks.history[0];
      createClickEffect(latestClick.x, latestClick.y);
    }
  });

  // 정리 함수 반환
  return () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    unsubscribePosition?.();
    unsubscribeMovement?.();
    unsubscribeClicks?.();
    
    // 클릭 애니메이션 정리
    clickAnimations.forEach(({ element }) => element.remove());
  };
}