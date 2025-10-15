/**
 * @fileoverview Advanced Canvas Control - Complete Non-Reactive
 * 
 * 최고 성능 Canvas 제어:
 * - 클릭 마커도 RefContext 직접 조작
 * - Store는 오직 getValue()만 사용
 * - React re-render 완전 차단 (0회 보장)
 * - 모든 시각적 업데이트는 DOM 직접 조작
 */

import { useCallback, useRef, useEffect } from 'react';
import { useMouseRef, useMouseAction, useMouseRefMountState } from '../context/MouseEventsModel';
import { useStoreDataAccess } from './useStoreDataAccess';

/**
 * 고급 Canvas 직접 제어 Hook - 진짜 반응형 마운트 상태 기반
 */
export function useAdvancedCanvasControl() {
  const dispatch = useMouseAction();
  const storeData = useStoreDataAccess();
  
  // DOM 참조들 (RefContext)
  const containerRef = useMouseRef('container');
  const cursorRef = useMouseRef('cursor');
  const pathSvgRef = useMouseRef('pathSvg');
  const coordinatesRef = useMouseRef('coordinates');
  
  // 추가 RefContext 참조 (클릭 마커용)
  const clickMarkersRef = useMouseRef('clickMarkers');
  
  // 🎯 진짜 반응형 마운트 상태 - RefContext 기본 제공
  const containerMountState = useMouseRefMountState('container');
  const { isMounted: isContainerMounted, mountedTarget: containerElement } = containerMountState;
  
  // === 마운트 상태에 따른 시각적 피드백 ===
  useEffect(() => {
    if (isContainerMounted && containerElement) {
      containerElement.style.border = '2px solid #10b981';
    } else if (!isContainerMounted) {
      // 언마운트 시 border 제거
      if (containerRef.target) {
        containerRef.target.style.border = '';
      }
    }
  }, [isContainerMounted, containerElement]);
  
  
  // Canvas 직접 조작용 상태 (Store 완전 우회)
  const pathPointsRef = useRef<Array<{ x: number; y: number; timestamp: number }>>([]);
  const activeClickMarkersRef = useRef<HTMLDivElement[]>([]);
  const throttleTimeoutRef = useRef<number | null>(null);
  const lastPositionRef = useRef<{ x: number; y: number }>({ x: -999, y: -999 });
  const clickCounterRef = useRef<number>(0);
  
  
  // === 클릭 마커 직접 생성 (React 없이) ===
  const createClickMarkerDirect = useCallback((x: number, y: number, timestamp: number) => {
    const markersContainer = clickMarkersRef.target;
    if (!markersContainer) return;
    
    // 마커 엘리먼트 생성
    const marker = document.createElement('div');
    marker.className = 'absolute pointer-events-none';
    marker.style.left = `${x - 16}px`;
    marker.style.top = `${y - 16}px`;
    marker.style.opacity = '1';
    marker.style.transform = 'scale(1)';
    marker.style.transition = 'all 300ms ease-out';
    
    // Ripple 효과
    const ripple = document.createElement('div');
    ripple.className = 'absolute inset-0 w-8 h-8 border-2 border-purple-600 rounded-full animate-ping';
    ripple.style.animationDuration = '1000ms';
    
    // 클릭 마커
    const clickDot = document.createElement('div');
    clickDot.className = 'w-8 h-8 bg-purple-500/20 border-2 border-purple-600 rounded-full flex items-center justify-center';
    
    const innerDot = document.createElement('div');
    innerDot.className = 'w-2 h-2 bg-purple-600 rounded-full';
    
    clickDot.appendChild(innerDot);
    marker.appendChild(ripple);
    marker.appendChild(clickDot);
    markersContainer.appendChild(marker);
    
    // 활성 마커 추가
    activeClickMarkersRef.current.push(marker);
    
    // 페이드 아웃 애니메이션
    setTimeout(() => {
      marker.style.opacity = '0.3';
      marker.style.transform = 'scale(0.6)';
    }, 2000);
    
    // 마커 제거
    setTimeout(() => {
      if (marker.parentNode) {
        marker.parentNode.removeChild(marker);
      }
      const index = activeClickMarkersRef.current.indexOf(marker);
      if (index > -1) {
        activeClickMarkersRef.current.splice(index, 1);
      }
    }, 5000);
    
    // 최대 8개 마커 유지
    if (activeClickMarkersRef.current.length > 8) {
      const oldMarker = activeClickMarkersRef.current.shift();
      if (oldMarker?.parentNode) {
        oldMarker.parentNode.removeChild(oldMarker);
      }
    }
  }, [clickMarkersRef]);
  
  // === Path 직접 그리기 (Store 무관) ===
  const updatePathDirect = useCallback((newPoint: { x: number; y: number; timestamp: number }) => {
    const pathSvg = pathSvgRef.target;
    if (!pathSvg) return;
    
    // Path 포인트 배열에 추가
    pathPointsRef.current = [...pathPointsRef.current, newPoint].slice(-50);
    
    if (pathPointsRef.current.length < 2) return;
    
    // SVG Path 직접 업데이트
    const pathData = pathPointsRef.current
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');
    
    pathSvg.setAttribute('d', pathData);
  }, [pathSvgRef]);
  
  // === 커서 직접 업데이트 ===
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
  
  // === 마우스 움직임 핸들러 ===
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.target;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    const timestamp = Date.now();
    
    // 즉시 시각적 업데이트 (RefContext - 60fps)
    updateCursorDirect(x, y);
    updatePathDirect({ x, y, timestamp });
    
    // Store는 데이터 저장만 (30fps throttled)
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
    }
    
    throttleTimeoutRef.current = window.setTimeout(() => {
      dispatch('updatePosition', { x, y, timestamp });
    }, 33);
    
    lastPositionRef.current = { x, y };
  }, [containerRef, dispatch, updateCursorDirect, updatePathDirect]);
  
  // === 마우스 클릭 핸들러 (마커 직접 생성) ===
  const handleMouseClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.target;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    const timestamp = Date.now();
    
    // 즉시 클릭 마커 생성 (RefContext 직접 조작)
    createClickMarkerDirect(x, y, timestamp);
    clickCounterRef.current++;
    
    // Store는 데이터 저장만
    dispatch('recordClick', {
      x, y,
      button: e.button,
      timestamp
    });
  }, [containerRef, dispatch, createClickMarkerDirect]);
  
  // === 마우스 진입 핸들러 ===
  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.target;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    const timestamp = Date.now();
    
    updateCursorDirect(x, y);
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
    
    dispatch('leaveArea', { timestamp: Date.now() });
    pathPointsRef.current = [];
  }, [cursorRef, coordinatesRef, pathSvgRef, dispatch]);
  
  // === 리셋 핸들러 (모든 마커 제거) ===
  const handleReset = useCallback(() => {
    const pathSvg = pathSvgRef.target;
    const cursor = cursorRef.target;
    const coordinates = coordinatesRef.target;
    const markersContainer = clickMarkersRef.target;
    
    // Canvas 정리
    if (pathSvg) pathSvg.setAttribute('d', '');
    if (cursor) cursor.style.opacity = '0';
    if (coordinates) coordinates.style.opacity = '0';
    
    // 모든 클릭 마커 제거
    if (markersContainer) {
      markersContainer.innerHTML = '';
    }
    activeClickMarkersRef.current = [];
    
    // throttled 이벤트 정리
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
    }
    
    // 로컬 상태 정리
    pathPointsRef.current = [];
    lastPositionRef.current = { x: -999, y: -999 };
    clickCounterRef.current = 0;
    
    // Store 리셋
    dispatch('reset');
  }, [pathSvgRef, cursorRef, coordinatesRef, clickMarkersRef, dispatch]);
  
  // === Non-Reactive 데이터 조회 ===
  const getActivityStatus = useCallback(() => {
    const activity = storeData.stores.activity.getValue();
    return {
      isActive: activity.isInsideArea,
      statusText: activity.current.toUpperCase()
    };
  }, [storeData]);
  
  const refreshMetrics = useCallback(() => {
    const allData = storeData.dumpAllStoreData();
    console.log('📊 Non-Reactive Metrics:', allData);
    return allData;
  }, [storeData]);
  
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
  
  const setClickMarkersRef = useCallback((el: HTMLDivElement | null) => {
    clickMarkersRef.setRef(el);
  }, [clickMarkersRef]);
  
  return {
    // 이벤트 핸들러들
    handleMouseMove,
    handleMouseClick,
    handleMouseEnter,
    handleMouseLeave,
    handleReset,
    
    // DOM 참조 설정 함수들
    setContainerRef,
    setCursorRef,
    setPathSvgRef,
    setCoordinatesRef,
    setClickMarkersRef,
    
    // Non-reactive 데이터 조회
    getActivityStatus,
    refreshMetrics,
    
    // 현재 상태 정보
    getCurrentPosition: () => lastPositionRef.current,
    getPathPoints: () => pathPointsRef.current,
    getClickCount: () => clickCounterRef.current,
    getActiveMarkers: () => activeClickMarkersRef.current.length
  };
}