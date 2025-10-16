/**
 * @fileoverview Enhanced Context Store View - MVVM Architecture
 *
 * View Layer: MVVM 패턴을 따르는 메인 컴포넌트
 * - Hook을 통한 상태 및 이벤트 주입
 * - 순수 컴포넌트들의 조합
 * - 비즈니스 로직 없는 순수 View
 */

import React, { useState } from 'react';
import { useCanvasDirectControl } from '../hooks/useCanvasDirectControl';
import { useMetricsOnly } from '../hooks/useMetricsOnly';
import { useMouseEventsLogic } from '../hooks/useMouseEventsLogic';
import { MouseEventsCanvas } from './MouseEventsCanvas';
import { DetailedMetrics, MetricsGrid } from './MouseEventsMetrics';

/**
 * Enhanced Context Store 메인 뷰 컴포넌트
 *
 * MVVM 아키텍처:
 * - Model: MouseEventsModel (Context 정의)
 * - ViewModel: Hooks (비즈니스 로직 + 상태 주입)
 * - View: 이 컴포넌트 (순수 렌더링)
 */
export function EnhancedContextStoreView() {
  // === ViewModel Layer - RefContext 중심 아키텍처 ===

  // 비즈니스 로직 초기화 (Store 관리)
  const { initialized } = useMouseEventsLogic();

  // RefContext 기반 Canvas 직접 제어
  const canvasControl = useCanvasDirectControl();

  // 최소 Store 구독 (메트릭만)
  const metricsState = useMetricsOnly();

  // === Local UI State (비즈니스 로직과 무관한 View 상태) ===
  const [showDetails, setShowDetails] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);

  // Hook 초기화 대기
  if (!initialized) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-purple-600">
          Initializing MVVM architecture...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* CSS 스타일 정의 */}
      <style>{`
        @keyframes pathDraw {
          from { stroke-dasharray: 1000; stroke-dashoffset: 1000; }
          to { stroke-dasharray: 1000; stroke-dashoffset: 0; }
        }
        
        @keyframes dashMove {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 20; }
        }
        
        .click-connection-line {
          animation: dashMove 2s linear infinite;
        }
        
        /* GPU 가속 */
        .will-change-transform {
          will-change: transform;
        }
        
        /* 부드러운 커서 전환 */
        .cursor-smooth {
          transition: transform 16ms linear;
        }
        
        /* 접근성을 위한 모션 감소 */
        @media (prefers-reduced-motion: reduce) {
          .animate-pulse, .animate-ping, .click-connection-line {
            animation: none;
          }
          .cursor-smooth {
            transition: none;
          }
        }
      `}</style>

      {/* 헤더 및 컨트롤 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl animate-pulse">🏪</span>
          <div>
            <h2 className="text-2xl font-bold text-purple-800">
              Enhanced Context Store - MVVM
            </h2>
            <p className="text-sm text-purple-600">
              Hooks-based state injection with pure components
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
          >
            <span>{showDetails ? '👁️' : '🔍'}</span>
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
      </div>

      {/* MVVM 아키텍처 설명 */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-emerald-800 mb-2">
          🏗️ MVVM Architecture Features:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-emerald-700">
          <div>
            <h4 className="font-medium mb-1">Model Layer</h4>
            <ul className="space-y-1 text-xs">
              <li>• createStoreContext (State)</li>
              <li>• createActionContext (Actions)</li>
              <li>• createRefContext (DOM Refs)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-1">ViewModel Layer</h4>
            <ul className="space-y-1 text-xs">
              <li>• useMouseEventsLogic (Business Logic)</li>
              <li>• useMouseEventsViewState (State Injection)</li>
              <li>• useMouseEventsTriggers (Event Handlers)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-1">View Layer</h4>
            <ul className="space-y-1 text-xs">
              <li>• Pure Components</li>
              <li>• Props-based State Injection</li>
              <li>• No Direct State Management</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 메트릭스 그리드 - 최소 Store 구독 */}
      <MetricsGrid
        position={null} // RefContext에서 처리하므로 불필요
        movement={null} // RefContext에서 처리하므로 불필요
        clicks={metricsState.clicks}
        activity={metricsState.activity}
        performance={metricsState.performance}
      />

      {/* 상세 메트릭스 (조건부 표시) */}
      {showDetails && (
        <DetailedMetrics
          computed={metricsState.computed}
          summary={metricsState.summary}
        />
      )}

      {/* 메인 캔버스 - RefContext 기반 고성능 */}
      <MouseEventsCanvas
        // DOM 이벤트 핸들러들 (RefContext Canvas Control)
        onMouseMove={canvasControl.handleMouseMove}
        onMouseClick={canvasControl.handleMouseClick}
        onMouseEnter={canvasControl.handleMouseEnter}
        onMouseLeave={canvasControl.handleMouseLeave}
        onReset={canvasControl.handleReset}
        // DOM 참조 설정 함수들 (RefContext)
        setContainerRef={canvasControl.setContainerRef}
        setCursorRef={canvasControl.setCursorRef}
        setPathSvgRef={canvasControl.setPathSvgRef}
        setCoordinatesRef={canvasControl.setCoordinatesRef}
        // 최소 View 상태 (메트릭만)
        activity={metricsState.activity}
        clicks={metricsState.clicks}
        summary={metricsState.summary}
        // UI 설정
        width={800}
        height={400}
        animationSpeed={animationSpeed}
      />

      {/* 시각적 가이드 */}
      <div className="mt-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-purple-200">
        <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
          <span className="text-sm">🎨</span>
          Visual Guide
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <svg width="30" height="8" viewBox="0 0 30 8">
                <path
                  d="M0 4 L30 4"
                  stroke="url(#pathGradient)"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-purple-700">
              <strong>Mouse Path:</strong> Real-time movement trail
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <svg width="30" height="8" viewBox="0 0 30 8">
                <path
                  d="M0 4 L30 4"
                  stroke="url(#clickConnectionGradient)"
                  strokeWidth="2"
                  strokeDasharray="8,4"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-blue-700">
              <strong>Click Connections:</strong> Links between click points
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-purple-500 border-2 border-white rounded-full shadow-sm"></div>
            <span className="text-purple-700">
              <strong>Live Cursor:</strong> Real-time position tracker
            </span>
          </div>
        </div>
      </div>

      {/* 아키텍처 정보 */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-purple-200">
          <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
            <span className="text-sm">🏗️</span>
            MVVM Architecture
          </h4>
          <div className="space-y-1 text-purple-700">
            <p>✨ Model: createStoreContext + createActionContext</p>
            <p>⚡ ViewModel: Custom hooks for logic injection</p>
            <p>🎨 View: Pure components with props injection</p>
            <p>🔄 Data Flow: Unidirectional with reactive updates</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-purple-200">
          <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
            <span className="text-sm">📊</span>
            Performance Benefits
          </h4>
          <div className="space-y-1 text-purple-700">
            <p>🎯 Selective subscriptions: Fine-grained reactivity</p>
            <p>🚀 GPU acceleration: Smooth DOM manipulations</p>
            <p>💾 Optimized re-renders: Pure component architecture</p>
            <p>🔧 Separation of concerns: Maintainable codebase</p>
          </div>
        </div>
      </div>
    </div>
  );
}
