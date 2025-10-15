/**
 * @fileoverview Mouse Events Triggers Hook
 * 
 * ViewModel Layer: DOM 이벤트에 주입할 함수들을 제공하는 Hook
 * - Action dispatch를 캡슐화한 이벤트 핸들러들
 * - DOM 이벤트를 비즈니스 로직과 연결
 * - 성능 최적화된 이벤트 처리
 */

import { useCallback, useRef } from 'react';
import { useMouseAction, useMouseRef } from '../context/MouseEventsModel';

/**
 * 마우스 이벤트 트리거 함수들을 제공하는 Hook
 * 
 * 역할:
 * - DOM 이벤트를 Action으로 변환
 * - 직접적인 DOM 조작과 Action dispatch 조합
 * - 성능 최적화된 이벤트 처리
 */
export function useMouseEventsTriggers() {
  // Action dispatch
  const dispatch = useMouseAction();
  
  // DOM 참조
  const containerRef = useMouseRef('container');
  const cursorRef = useMouseRef('cursor');
  const pathSvgRef = useMouseRef('pathSvg');
  const coordinatesRef = useMouseRef('coordinates');
  
  // 성능 최적화용 refs
  const throttleTimeoutRef = useRef<number | null>(null);
  const lastMoveTimeRef = useRef<number>(0);
  
  // Path 직접 그리기용 상태 (Store 우회)
  const pathPointsRef = useRef<Array<{ x: number; y: number; timestamp: number }>>([]);
  
  // === 마우스 움직임 핸들러 ===
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.target;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    const timestamp = Date.now();
    
    // 직접적인 DOM 조작 - 커서 위치 업데이트 (GPU 가속)
    const cursor = cursorRef.target;
    if (cursor) {
      cursor.style.transform = `translate3d(${x - 8}px, ${y - 8}px, 0)`;
    }
    
    // 좌표 표시 업데이트
    const coordinates = coordinatesRef.target;
    if (coordinates) {
      coordinates.textContent = `(${x}, ${y})`;
      coordinates.style.transform = `translate3d(${x + 16}px, ${y - 32}px, 0)`;
    }
    
    // Action dispatch (throttled)
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
    }
    
    throttleTimeoutRef.current = window.setTimeout(() => {
      dispatch('updatePosition', { x, y, timestamp });
      lastMoveTimeRef.current = timestamp;
    }, 33); // ~30fps for store updates (DOM is still 60fps via direct manipulation)
    
  }, [dispatch, containerRef, cursorRef, coordinatesRef]);
  
  // === 마우스 클릭 핸들러 ===
  const handleMouseClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.target;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    const timestamp = Date.now();
    
    dispatch('recordClick', {
      x,
      y,
      button: e.button,
      timestamp
    });
  }, [dispatch, containerRef]);
  
  // === 마우스 진입 핸들러 ===
  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.target;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    const timestamp = Date.now();
    
    // 커서 표시
    const cursor = cursorRef.target;
    if (cursor) {
      cursor.style.opacity = '1';
      cursor.style.transform = `translate3d(${x - 8}px, ${y - 8}px, 0)`;
    }
    
    // 좌표 표시
    const coordinates = coordinatesRef.target;
    if (coordinates) {
      coordinates.style.opacity = '1';
      coordinates.textContent = `(${x}, ${y})`;
      coordinates.style.transform = `translate3d(${x + 16}px, ${y - 32}px, 0)`;
    }
    
    dispatch('enterArea', { x, y, timestamp });
  }, [dispatch, containerRef, cursorRef, coordinatesRef]);
  
  // === 마우스 이탈 핸들러 ===
  const handleMouseLeave = useCallback(() => {
    const timestamp = Date.now();
    
    // 커서 숨기기
    const cursor = cursorRef.target;
    if (cursor) {
      cursor.style.opacity = '0';
    }
    
    // 좌표 숨기기
    const coordinates = coordinatesRef.target;
    if (coordinates) {
      coordinates.style.opacity = '0';
    }
    
    // Path 클리어
    const pathSvg = pathSvgRef.target;
    if (pathSvg) {
      pathSvg.setAttribute('d', '');
    }
    
    // throttled 이벤트 클리어
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
    }
    
    dispatch('leaveArea', { timestamp });
  }, [dispatch, cursorRef, coordinatesRef, pathSvgRef]);
  
  // === 리셋 핸들러 ===
  const handleReset = useCallback(() => {
    // Path 클리어
    const pathSvg = pathSvgRef.target;
    if (pathSvg) {
      pathSvg.setAttribute('d', '');
    }
    
    // throttled 이벤트 클리어
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
    }
    
    dispatch('reset');
  }, [dispatch, pathSvgRef]);
  
  // === Path 업데이트 핸들러 (실시간 SVG 그리기) ===
  const updatePath = useCallback((path: Array<{ x: number; y: number; timestamp: number }>) => {
    const pathSvg = pathSvgRef.target;
    if (!pathSvg || path.length < 2) return;
    
    const pathData = path
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');
    
    pathSvg.setAttribute('d', pathData);
  }, [pathSvgRef]);
  
  return {
    // DOM 이벤트 핸들러들
    handleMouseMove,
    handleMouseClick,
    handleMouseEnter,
    handleMouseLeave,
    handleReset,
    
    // 유틸리티 함수들
    updatePath,
    
    // DOM 참조들 (필요시 컴포넌트에서 직접 접근)
    refs: {
      container: containerRef,
      cursor: cursorRef,
      pathSvg: pathSvgRef,
      coordinates: coordinatesRef
    }
  };
}