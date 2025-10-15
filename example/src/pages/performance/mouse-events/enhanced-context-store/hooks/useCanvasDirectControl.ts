/**
 * @fileoverview Canvas Direct Control Hook
 * 
 * RefContext 기반: Canvas 직접 조작 전용 Hook
 * - Store 구독 없이 RefContext만 사용
 * - 고빈도 시각적 업데이트를 직접 DOM 조작으로 처리
 * - 60fps 성능 보장
 */

import { useCallback, useRef } from 'react';
import { useMouseRef, useMouseAction } from '../context/MouseEventsModel';
import { useStoreDataAccess } from './useStoreDataAccess';

/**
 * Canvas 직접 제어 Hook - RefContext 기반
 * 
 * 핵심 원칙:
 * 1. Store 구독 없이 RefContext만 사용
 * 2. 모든 시각적 업데이트는 직접 DOM 조작
 * 3. Store는 데이터 저장용으로만 활용
 */
export function useCanvasDirectControl() {
  const dispatch = useMouseAction();
  
  // Non-reactive Store 데이터 접근
  const storeData = useStoreDataAccess();
  
  // DOM 참조들 (RefContext)
  const containerRef = useMouseRef('container');
  const cursorRef = useMouseRef('cursor');
  const pathSvgRef = useMouseRef('pathSvg');
  const coordinatesRef = useMouseRef('coordinates');
  
  // Canvas 직접 조작용 상태 (Store 우회)
  const pathPointsRef = useRef<Array<{ x: number; y: number; timestamp: number }>>([]);
  const clickPointsRef = useRef<Array<{ x: number; y: number; timestamp: number }>>([]);
  const throttleTimeoutRef = useRef<number | null>(null);
  const lastPositionRef = useRef<{ x: number; y: number }>({ x: -999, y: -999 });
  
  // === 직접 Canvas Path 그리기 ===
  const updatePathDirect = useCallback((newPoint: { x: number; y: number; timestamp: number }) => {
    const pathSvg = pathSvgRef.target;
    if (!pathSvg) return;
    
    // Path 포인트 배열에 추가 (최대 50개 유지)
    pathPointsRef.current = [...pathPointsRef.current, newPoint].slice(-50);
    
    if (pathPointsRef.current.length < 2) return;
    
    // SVG Path 직접 업데이트 (Store 우회)
    const pathData = pathPointsRef.current
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');
    
    pathSvg.setAttribute('d', pathData);
  }, [pathSvgRef]);
  
  // === 직접 Cursor 업데이트 ===
  const updateCursorDirect = useCallback((x: number, y: number) => {
    const cursor = cursorRef.target;
    const coordinates = coordinatesRef.target;
    
    if (cursor) {
      cursor.style.transform = `translate3d(${x - 8}px, ${y - 8}px, 0)`;
      cursor.style.opacity = '1';
    }
    
    if (coordinates) {
      coordinates.textContent = `(${x}, ${y})`;
      coordinates.style.transform = `translate3d(${x + 16}px, ${y - 32}px, 0)`;
      coordinates.style.opacity = '1';
    }
  }, [cursorRef, coordinatesRef]);
  
  // === 마우스 움직임 핸들러 (RefContext 기반) ===
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.target;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    const timestamp = Date.now();
    
    // 1. 즉시 시각적 업데이트 (RefContext - 60fps)
    updateCursorDirect(x, y);
    updatePathDirect({ x, y, timestamp });
    
    // 2. Store는 통계용으로만 throttled 업데이트 (30fps)
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
    }
    
    throttleTimeoutRef.current = window.setTimeout(() => {
      dispatch('updatePosition', { x, y, timestamp });
    }, 33);
    
    lastPositionRef.current = { x, y };
  }, [containerRef, dispatch, updateCursorDirect, updatePathDirect]);
  
  // === 마우스 진입 핸들러 ===
  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.target;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    const timestamp = Date.now();
    
    // 즉시 시각적 업데이트
    updateCursorDirect(x, y);
    
    // Store 알림
    dispatch('enterArea', { x, y, timestamp });
    lastPositionRef.current = { x, y };
  }, [containerRef, dispatch, updateCursorDirect]);
  
  // === 마우스 이탈 핸들러 ===
  const handleMouseLeave = useCallback(() => {
    const cursor = cursorRef.target;
    const coordinates = coordinatesRef.target;
    const pathSvg = pathSvgRef.target;
    
    // 즉시 시각적 정리
    if (cursor) cursor.style.opacity = '0';
    if (coordinates) coordinates.style.opacity = '0';
    if (pathSvg) pathSvg.setAttribute('d', '');
    
    // throttled 이벤트 정리
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
    }
    
    // Store 알림 및 상태 정리
    dispatch('leaveArea', { timestamp: Date.now() });
    pathPointsRef.current = [];
    clickPointsRef.current = [];
  }, [cursorRef, coordinatesRef, pathSvgRef, dispatch]);
  
  // === 마우스 클릭 핸들러 ===
  const handleMouseClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.target;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    const timestamp = Date.now();
    
    // Store에 클릭 이벤트 전송 (클릭 표시는 React로 처리)
    dispatch('recordClick', {
      x, y,
      button: e.button,
      timestamp
    });
  }, [containerRef, dispatch]);
  
  // === 리셋 핸들러 ===
  const handleReset = useCallback(() => {
    const pathSvg = pathSvgRef.target;
    const cursor = cursorRef.target;
    const coordinates = coordinatesRef.target;
    
    // 즉시 Canvas 정리
    if (pathSvg) pathSvg.setAttribute('d', '');
    if (cursor) cursor.style.opacity = '0';
    if (coordinates) coordinates.style.opacity = '0';
    
    // throttled 이벤트 정리
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
    }
    
    // 로컬 상태 정리
    pathPointsRef.current = [];
    clickPointsRef.current = [];
    lastPositionRef.current = { x: -999, y: -999 };
    
    // Store 리셋
    dispatch('reset');
  }, [pathSvgRef, cursorRef, coordinatesRef, dispatch]);
  
  // === DOM 참조 설정 함수들 ===
  const setContainerRef = useCallback((el: HTMLDivElement | null) => {
    containerRef.setRef(el);
  }, [containerRef]);
  
  const setCursorRef = useCallback((el: HTMLDivElement | null) => {
    cursorRef.setRef(el);
  }, [cursorRef]);
  
  const setPathSvgRef = useCallback((el: SVGPathElement | null) => {
    pathSvgRef.setRef(el);
  }, [pathSvgRef]);
  
  const setCoordinatesRef = useCallback((el: HTMLDivElement | null) => {
    coordinatesRef.setRef(el);
  }, [coordinatesRef]);
  
  return {
    // 이벤트 핸들러들
    handleMouseMove,
    handleMouseEnter,
    handleMouseLeave,
    handleMouseClick,
    handleReset,
    
    // DOM 참조 설정 함수들
    setContainerRef,
    setCursorRef,
    setPathSvgRef,
    setCoordinatesRef,
    
    // 현재 위치 정보 (필요시)
    getCurrentPosition: () => lastPositionRef.current,
    getPathPoints: () => pathPointsRef.current,
    getClickPoints: () => clickPointsRef.current
  };
}