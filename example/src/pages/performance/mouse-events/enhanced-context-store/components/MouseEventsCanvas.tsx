/**
 * @fileoverview Mouse Events Canvas Component - RefContext 최적화
 *
 * View Layer: RefContext 기반 고성능 캔버스
 * - Store 구독 최소화 (클릭 마커만)
 * - 시각적 업데이트는 RefContext 직접 조작
 * - Path 그리기는 Store 상태 변경과 무관
 */

import React from 'react';

// === RefContext 기반 캔버스 Props ===
export interface MouseEventsCanvasProps {
  // DOM 이벤트 핸들러들 (Canvas Control Hook에서 주입)
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

  // 최소 View 상태 (메트릭만)
  activity: {
    isActive: boolean;
    statusText: string;
    statusColor: string;
  };
  clicks: {
    recent: Array<{ x: number; y: number; timestamp: number }>;
  };
  summary: {
    hasActivity: boolean;
  };

  // 설정
  width?: number;
  height?: number;
  animationSpeed?: number;
}

/**
 * RefContext 기반 고성능 캔버스 컴포넌트
 * - Path 그리기: RefContext 직접 조작 (Store 무관)
 * - 클릭 마커: Store 구독 (React 렌더링)
 * - 커서/좌표: RefContext 직접 조작 (Store 무관)
 */
export function MouseEventsCanvas({
  onMouseMove,
  onMouseClick,
  onMouseEnter,
  onMouseLeave,
  onReset,
  setContainerRef,
  setCursorRef,
  setPathSvgRef,
  setCoordinatesRef,
  activity,
  clicks,
  summary,
  width = 800,
  height = 400,
  animationSpeed = 1,
}: MouseEventsCanvasProps) {
  return (
    <div className="p-6 border border-purple-200 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg">
      {/* 캔버스 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg text-purple-800 flex items-center gap-2">
          <span className="text-xl">🎯</span>
          Enhanced Context Store Canvas
        </h3>

        <div className="flex items-center gap-4 text-xs">
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              activity.isActive
                ? 'bg-purple-200 text-purple-800'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {activity.isActive ? '🖱️ Tracking' : '💤 Idle'}
          </div>

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
          background: activity.isActive
            ? 'linear-gradient(135deg, #fdf4ff 0%, #fdf2f8 50%, #ecfeff 100%)'
            : 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 50%, #f0f9ff 100%)',
        }}
        onMouseMove={onMouseMove}
        onMouseDown={onMouseClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* 고성능 커서 인디케이터 */}
        {activity.isActive && (
          <>
            {/* 실시간 커서 (GPU 가속) */}
            <div
              ref={setCursorRef}
              className="absolute pointer-events-none w-4 h-4 will-change-transform transition-opacity duration-150"
              style={{ opacity: 0 }}
            >
              <div className="w-4 h-4 bg-purple-500 border-2 border-white rounded-full shadow-lg animate-pulse" />
            </div>

            {/* Velocity 인디케이터 제거 - Non-reactive 패턴에서는 RefContext로 직접 처리 */}

            {/* 실시간 좌표 표시 */}
            <div
              ref={setCoordinatesRef}
              className="absolute pointer-events-none bg-purple-800 text-white px-2 py-1 rounded text-xs font-mono shadow-lg will-change-transform transition-opacity duration-150"
              style={{ opacity: 0 }}
            />
          </>
        )}

        {/* 고성능 RefContext 기반 path 시각화 */}
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
            <linearGradient
              id="clickConnectionGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.8)" />
              <stop offset="50%" stopColor="rgba(99, 102, 241, 0.6)" />
              <stop offset="100%" stopColor="rgba(139, 92, 246, 0.4)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* RefContext 직접 조작 Path (Store 상태 무관) */}
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
              opacity: activity.isActive ? 1 : 0.7,
            }}
          />

          {/* 클릭 연결선 (Store 기반) */}
          {clicks.recent.length > 1 && (
            <path
              d={clicks.recent
                .slice(0, 5)
                .map(
                  (click, index) =>
                    `${index === 0 ? 'M' : 'L'} ${click.x} ${click.y}`
                )
                .join(' ')}
              stroke="url(#clickConnectionGradient)"
              strokeWidth="2"
              strokeDasharray="8,4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
              className="animate-pulse"
            />
          )}
        </svg>

        {/* 클릭 인디케이터들 */}
        {clicks.recent.slice(0, 8).map((click, index) => {
          const age = Date.now() - click.timestamp;
          const isRecent = age < 2000;

          return (
            <div
              key={`click-${click.timestamp}-${index}`}
              className="absolute pointer-events-none"
              style={{
                left: click.x - 16,
                top: click.y - 16,
                opacity: isRecent ? 1 - index * 0.15 : 0.3,
                transform: `scale(${isRecent ? 1 - (index * 0.08) : 0.6})`,
                transition: `all ${300 / animationSpeed}ms ease-out`,
              }}
            >
              {/* Ripple 효과 */}
              <div
                className="absolute inset-0 w-8 h-8 border-2 border-purple-600 rounded-full animate-ping"
                style={{ animationDuration: `${1000 / animationSpeed}ms` }}
              />

              {/* 클릭 마커 */}
              <div className="w-8 h-8 bg-purple-500/20 border-2 border-purple-600 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-purple-600 rounded-full" />
              </div>
            </div>
          );
        })}

        {/* 안내 메시지 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`text-center p-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-purple-200 transition-all duration-500 ${
              activity.isActive || summary.hasActivity
                ? 'opacity-30 scale-95'
                : 'opacity-100 scale-100'
            }`}
          >
            <div className="text-4xl mb-3 animate-bounce">🏪</div>
            <h4 className="text-lg font-semibold text-purple-800 mb-2">
              Enhanced Context Store Demo
            </h4>
            <p className="text-sm text-gray-700 mb-2">
              Move mouse and click to see MVVM architecture in action
            </p>
            <div className="text-xs text-gray-600 space-y-1">
              <p className="flex items-center justify-center gap-1">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Hooks-based State Injection
              </p>
              <p className="flex items-center justify-center gap-1">
                <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                Pure Component Architecture
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
