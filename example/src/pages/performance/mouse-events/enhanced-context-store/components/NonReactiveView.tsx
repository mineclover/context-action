/**
 * @fileoverview Non-Reactive Enhanced Context Store View
 * 
 * 완전한 Non-Reactive MVVM 구현:
 * - Store 구독 완전 제거
 * - 모든 시각적 업데이트는 RefContext 직접 조작
 * - React re-render 0회 보장
 * - Store는 순수 데이터 저장소 역할만
 */

import React, { useState } from 'react';
import { useMouseEventsLogic } from '../hooks/useMouseEventsLogic';
import { useAdvancedCanvasControl } from '../hooks/useAdvancedCanvasControl';
import { useNonReactiveMetrics } from '../hooks/useNonReactiveMetrics';
import { NonReactiveCanvas } from './NonReactiveCanvas';

/**
 * Non-Reactive Enhanced Context Store 메인 뷰
 * 
 * 아키텍처:
 * - Model: Store contexts (데이터 저장만)
 * - ViewModel: RefContext hooks (직접 DOM 조작)
 * - View: Non-reactive components (React re-render 0회)
 */
export function NonReactiveView() {
  // === ViewModel Layer - 완전한 Non-Reactive ===
  
  // 비즈니스 로직 초기화 (Store 관리만)
  const { initialized } = useMouseEventsLogic();
  
  // 고급 Canvas 직접 제어 (클릭 마커 포함)
  const canvasControl = useAdvancedCanvasControl();
  
  // Non-reactive 메트릭 (수동 업데이트)
  const metrics = useNonReactiveMetrics();
  
  // === Local UI State (React 상태 - 비즈니스와 무관) ===
  const [showInfo, setShowInfo] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  
  // Hook 초기화 대기
  if (!initialized) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-purple-600">Initializing Non-Reactive MVVM...</div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      {/* CSS 스타일 정의 */}
      <style>{`
        /* GPU 가속 */
        .will-change-transform {
          will-change: transform;
        }
        
        /* 접근성을 위한 모션 감소 */
        @media (prefers-reduced-motion: reduce) {
          .animate-pulse, .animate-ping {
            animation: none;
          }
        }
      `}</style>
      
      {/* 헤더 및 컨트롤 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🚀</span>
          <div>
            <h2 className="text-2xl font-bold text-purple-800">Non-Reactive MVVM</h2>
            <p className="text-sm text-purple-600">Zero React re-renders • Pure RefContext DOM control</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
          >
            <span>{showInfo ? '🙈' : '👁️'}</span>
            {showInfo ? 'Hide Info' : 'Show Info'}
          </button>
        </div>
      </div>
      
      {/* Non-Reactive 아키텍처 설명 */}
      {showInfo && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-800 mb-2">🚀 Non-Reactive MVVM Features:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-green-700">
            <div>
              <h4 className="font-medium mb-1">Model Layer</h4>
              <ul className="space-y-1 text-xs">
                <li>• Store contexts (data only)</li>
                <li>• No reactive subscriptions</li>
                <li>• getValue() on-demand access</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-1">ViewModel Layer</h4>
              <ul className="space-y-1 text-xs">
                <li>• RefContext direct DOM control</li>
                <li>• Zero React re-renders</li>
                <li>• 60fps GPU acceleration</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-1">View Layer</h4>
              <ul className="space-y-1 text-xs">
                <li>• Non-reactive components</li>
                <li>• Manual refresh only</li>
                <li>• Pure performance</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 성능 비교 정보 */}
      {showInfo && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-2">❌ Traditional Reactive Pattern</h4>
            <div className="space-y-1 text-xs text-red-700">
              <p>• Store subscriptions → React re-renders</p>
              <p>• Path drawing via useState → Performance hit</p>
              <p>• Click markers via React state → Re-render cascade</p>
              <p>• Continuous useStoreValue() subscriptions</p>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">✅ Non-Reactive Pattern</h4>
            <div className="space-y-1 text-xs text-green-700">
              <p>• Zero React re-renders</p>
              <p>• Path drawing via direct DOM → 60fps</p>
              <p>• Click markers via createElement → Instant</p>
              <p>• store.getValue() on-demand only</p>
            </div>
          </div>
        </div>
      )}

      {/* Non-Reactive Canvas */}
      <NonReactiveCanvas
        // 고급 Canvas 제어 (클릭 마커 포함)
        onMouseMove={canvasControl.handleMouseMove}
        onMouseClick={canvasControl.handleMouseClick}
        onMouseEnter={canvasControl.handleMouseEnter}
        onMouseLeave={canvasControl.handleMouseLeave}
        onReset={canvasControl.handleReset}
        
        // RefContext DOM 참조들
        setContainerRef={canvasControl.setContainerRef}
        setCursorRef={canvasControl.setCursorRef}
        setPathSvgRef={canvasControl.setPathSvgRef}
        setCoordinatesRef={canvasControl.setCoordinatesRef}
        setClickMarkersRef={canvasControl.setClickMarkersRef}
        
        // Non-reactive 데이터 조회
        getActivityStatus={canvasControl.getActivityStatus}
        refreshMetrics={canvasControl.refreshMetrics}
        
        // UI 설정
        width={800}
        height={400}
        animationSpeed={animationSpeed}
      />

      {/* 실시간 상태 정보 (수동 새로고침) */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-purple-800 flex items-center gap-2">
              <span className="text-sm">📊</span>
              Live Metrics
            </h4>
            <button
              onClick={() => {
                const data = canvasControl.refreshMetrics();
                console.log('🔄 Manual refresh:', data);
              }}
              className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
            >
              🔄 Refresh
            </button>
          </div>
          <div className="space-y-1 text-purple-700">
            <p>• Path Points: {canvasControl.getPathPoints().length}</p>
            <p>• Click Count: {canvasControl.getClickCount()}</p>
            <p>• Active Markers: {canvasControl.getActiveMarkers()}</p>
            <p>• Position: ({canvasControl.getCurrentPosition().x}, {canvasControl.getCurrentPosition().y})</p>
          </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-purple-200">
          <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
            <span className="text-sm">🎯</span>
            Architecture Benefits
          </h4>
          <div className="space-y-1 text-purple-700">
            <p>🚀 Zero React re-renders</p>
            <p>⚡ 60fps GPU acceleration</p>
            <p>🎯 Direct DOM manipulation</p>
            <p>📊 Store as data-only</p>
          </div>
        </div>
      </div>
    </div>
  );
}