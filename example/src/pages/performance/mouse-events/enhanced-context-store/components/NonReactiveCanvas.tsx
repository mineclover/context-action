/**
 * @fileoverview Non-Reactive Canvas Component
 *
 * 완전한 Non-Reactive 패턴:
 * - Store 구독 완전 제거
 * - 클릭 마커도 RefContext 직접 조작
 * - React re-render 0회 보장
 * - Store는 순수 데이터 저장소만
 */

import React, { useEffect, useRef } from 'react';

// === Non-Reactive 캔버스 Props ===
export interface NonReactiveCanvasProps {
  // DOM 이벤트 핸들러들 (RefContext Canvas Control)
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave: () => void;
  onReset: () => void;

  // DOM 참조 설정 함수들 (RefContext)
  setContainerRef: (el: HTMLDivElement | null) => void;
  setCursorRef: (el: HTMLDivElement | null) => void;
  setPathSvgRef: (el: SVGPathElement | null) => void;
  setCoordinatesRef: (el: HTMLDivElement | null) => void;

  // 클릭 마커 컨테이너 설정 (RefContext)
  setClickMarkersRef: (el: HTMLDivElement | null) => void;

  // Non-reactive 데이터 조회 함수들
  getActivityStatus: () => { isActive: boolean; statusText: string };
  refreshMetrics: () => void;

  // 설정
  width?: number;
  height?: number;
  animationSpeed?: number;
}

/**
 * 완전한 Non-Reactive Canvas 컴포넌트
 *
 * 특징:
 * - Store 구독 없음
 * - 클릭 마커도 RefContext 직접 조작
 * - React re-render 완전 차단
 * - 모든 시각적 업데이트는 DOM 직접 조작
 */
export function NonReactiveCanvas({
  onMouseMove,
  onMouseClick,
  onMouseEnter,
  onMouseLeave,
  onReset,
  setContainerRef,
  setCursorRef,
  setPathSvgRef,
  setCoordinatesRef,
  setClickMarkersRef,
  getActivityStatus,
  refreshMetrics,
  width = 800,
  height = 400,
  animationSpeed = 1,
}: NonReactiveCanvasProps) {
  // 상태 표시 업데이트용 refs
  const statusIndicatorRef = useRef<HTMLDivElement>(null);
  const refreshButtonRef = useRef<HTMLButtonElement>(null);

  // === 수동 상태 업데이트 ===
  const updateStatusDisplay = () => {
    if (!statusIndicatorRef.current) return;

    const { isActive } = getActivityStatus();

    statusIndicatorRef.current.textContent = isActive
      ? '🖱️ Tracking'
      : '💤 Idle';
    statusIndicatorRef.current.className = isActive
      ? 'px-2 py-1 rounded-full text-xs font-medium bg-purple-200 text-purple-800'
      : 'px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600';
  };

  // === 수동 새로고침 핸들러 ===
  const handleRefresh = () => {
    refreshMetrics();
    updateStatusDisplay();
  };

  // 초기 상태 설정
  useEffect(() => {
    updateStatusDisplay();
  }, []);

  return (
    <div className="p-6 border border-purple-200 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg">
      {/* 캔버스 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg text-purple-800 flex items-center gap-2">
          <span className="text-xl">🚀</span>
          Non-Reactive Canvas (Zero Re-renders)
        </h3>

        <div className="flex items-center gap-4 text-xs">
          <div
            ref={statusIndicatorRef}
            className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600"
          >
            💤 Idle
          </div>

          <button
            ref={refreshButtonRef}
            onClick={handleRefresh}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
          >
            🔄 Refresh
          </button>

          <button
            onClick={onReset}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
          >
            <span>🔄</span>
            Reset
          </button>
        </div>
      </div>

      {/* 메인 캔버스 영역 */}
      <div
        ref={setContainerRef}
        className="relative w-full bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 border-2 border-purple-300 rounded-xl overflow-hidden cursor-crosshair shadow-inner transition-all duration-300 hover:shadow-lg"
        style={{
          width: `${width}px`,
          height: `${height}px`,
        }}
        onMouseMove={onMouseMove}
        onMouseDown={onMouseClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* RefContext 커서 (직접 조작) */}
        <div
          ref={setCursorRef}
          className="absolute pointer-events-none w-4 h-4 will-change-transform transition-opacity duration-150"
          style={{ opacity: 0 }}
        >
          <div className="w-4 h-4 bg-purple-500 border-2 border-white rounded-full shadow-lg animate-pulse" />
        </div>

        {/* RefContext 좌표 표시 (직접 조작) */}
        <div
          ref={setCoordinatesRef}
          className="absolute pointer-events-none bg-purple-800 text-white px-2 py-1 rounded text-xs font-mono shadow-lg will-change-transform transition-opacity duration-150"
          style={{ opacity: 0 }}
        />

        {/* RefContext 클릭 마커 컨테이너 (직접 조작) */}
        <div
          ref={setClickMarkersRef}
          className="absolute inset-0 pointer-events-none"
        />

        {/* RefContext Path SVG (직접 조작) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient
              id="pathGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="rgba(147, 51, 234, 1.0)" />
              <stop offset="50%" stopColor="rgba(168, 85, 247, 0.8)" />
              <stop offset="100%" stopColor="rgba(219, 39, 119, 0.6)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* RefContext 직접 조작 Path */}
          <path
            ref={setPathSvgRef}
            stroke="url(#pathGradient)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
            style={{
              transition: 'none',
              opacity: 1,
            }}
          />
        </svg>

        {/* 안내 메시지 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center p-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-purple-200 opacity-30 scale-95">
            <div className="text-4xl mb-3">🚀</div>
            <h4 className="text-lg font-semibold text-purple-800 mb-2">
              Non-Reactive Canvas
            </h4>
            <p className="text-sm text-gray-700 mb-2">
              Zero React re-renders • Pure RefContext
            </p>
            <div className="text-xs text-gray-600 space-y-1">
              <p className="flex items-center justify-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Direct DOM Manipulation
              </p>
              <p className="flex items-center justify-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Store getValue() Only
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 성능 정보 */}
      <div className="mt-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-purple-200">
        <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
          <span className="text-sm">🚀</span>
          Non-Reactive Performance
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-purple-700">
          <div>
            <strong>React Re-renders:</strong> 0 (완전 차단)
          </div>
          <div>
            <strong>Store Access:</strong> getValue() only
          </div>
          <div>
            <strong>DOM Updates:</strong> RefContext Direct
          </div>
        </div>
      </div>
    </div>
  );
}
