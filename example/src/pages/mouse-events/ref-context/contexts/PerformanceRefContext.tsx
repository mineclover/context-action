/**
 * @fileoverview Performance Metrics RefContext
 * 
 * createRefContext를 활용한 성능 메트릭 관리
 * 관심사 분리: 성능 측정 및 메트릭 표시만 담당
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { createRefContext } from '@context-action/react';
import {
  MouseMetrics,
  PerformanceConfig,
  PerformanceMeasurement,
} from '../types/MouseRefTypes';

// ============================================================================
// Default Configuration
// ============================================================================

const defaultConfig: PerformanceConfig = {
  fpsSampleCount: 60,
  metricsUpdateInterval: 100, // 100ms 간격으로 업데이트
  enablePerformanceLogging: false,
  showDetailedMetrics: true,
};

const defaultMetrics: MouseMetrics = {
  totalMoves: 0,
  totalClicks: 0,
  averageVelocity: 0,
  maxVelocity: 0,
  sessionStartTime: Date.now(),
};

// ============================================================================
// RefContext Creation
// ============================================================================

type PerformanceRefs = {
  movesDisplay: HTMLSpanElement;
  clicksDisplay: HTMLSpanElement;
  velocityDisplay: HTMLSpanElement;
  fpsDisplay: HTMLSpanElement;
};

const {
  Provider: PerformanceProvider,
  useRefHandler: usePerformanceRef,
} = createRefContext<PerformanceRefs>('Performance');

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * FPS 계산
 */
const calculateFPS = (timestamps: number[], sampleCount: number): number => {
  if (timestamps.length < 2) return 0;
  
  const recentTimestamps = timestamps.slice(0, Math.min(sampleCount, timestamps.length));
  const timeSpan = recentTimestamps[0] - recentTimestamps[recentTimestamps.length - 1];
  
  if (timeSpan <= 0) return 0;
  
  return Math.round((recentTimestamps.length - 1) * 1000 / timeSpan);
};

/**
 * 평균 속도 계산
 */
const updateAverageVelocity = (currentAverage: number, newVelocity: number, sampleCount: number): number => {
  // 지수 이동 평균 사용
  const alpha = 2 / (sampleCount + 1);
  return currentAverage * (1 - alpha) + newVelocity * alpha;
};

/**
 * 세션 지속 시간 포맷팅
 */
const formatSessionDuration = (startTime: number): string => {
  const duration = Date.now() - startTime;
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
};

// ============================================================================
// Custom Hooks
// ============================================================================

/**
 * 성능 메트릭 업데이터 훅
 */
export function usePerformanceUpdater() {
  const movesDisplay = usePerformanceRef('movesDisplay');
  const clicksDisplay = usePerformanceRef('clicksDisplay');
  const velocityDisplay = usePerformanceRef('velocityDisplay');
  const fpsDisplay = usePerformanceRef('fpsDisplay');
  
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const metricsRef = useRef<MouseMetrics>(defaultMetrics);
  const frameTimestampsRef = useRef<number[]>([]);
  const performanceStartTimeRef = useRef<number>(Date.now());
  const configRef = useRef<PerformanceConfig>(defaultConfig);

  const recordFrame = useCallback(() => {
    const now = performance.now();
    frameTimestampsRef.current = [now, ...frameTimestampsRef.current.slice(0, configRef.current.fpsSampleCount - 1)];
  }, []);

  const recordMouseMove = useCallback((velocity: number) => {
    recordFrame();
    
    // 메트릭 업데이트
    metricsRef.current.totalMoves += 1;
    metricsRef.current.averageVelocity = updateAverageVelocity(
      metricsRef.current.averageVelocity,
      velocity,
      30 // 30샘플 평균
    );
    metricsRef.current.maxVelocity = Math.max(metricsRef.current.maxVelocity, velocity);

    // DOM 업데이트 (쓰로틀링)
    if (!updateTimeoutRef.current) {
      updateTimeoutRef.current = setTimeout(() => {
        updateDisplays();
        updateTimeoutRef.current = undefined;
      }, configRef.current.metricsUpdateInterval);
    }

    // 성능 로깅
    if (configRef.current.enablePerformanceLogging && metricsRef.current.totalMoves % 100 === 0) {
      console.log('Performance metrics:', {
        totalMoves: metricsRef.current.totalMoves,
        averageVelocity: metricsRef.current.averageVelocity.toFixed(2),
        maxVelocity: metricsRef.current.maxVelocity.toFixed(2),
        fps: calculateFPS(frameTimestampsRef.current, configRef.current.fpsSampleCount),
      });
    }
  }, [recordFrame]);

  const recordMouseClick = useCallback(() => {
    recordFrame();
    metricsRef.current.totalClicks += 1;
    
    // 즉시 클릭 카운트 업데이트
    if (clicksDisplay.target) {
      clicksDisplay.target.textContent = metricsRef.current.totalClicks.toString();
    }
  }, [recordFrame, clicksDisplay]);

  const updateDisplays = useCallback(() => {
    const fps = calculateFPS(frameTimestampsRef.current, configRef.current.fpsSampleCount);

    // 각 표시 요소 업데이트
    if (movesDisplay.target) {
      movesDisplay.target.textContent = metricsRef.current.totalMoves.toString();
    }
    if (clicksDisplay.target) {
      clicksDisplay.target.textContent = metricsRef.current.totalClicks.toString();
    }
    if (velocityDisplay.target) {
      velocityDisplay.target.textContent = `${metricsRef.current.averageVelocity.toFixed(1)} px/ms`;
    }
    if (fpsDisplay.target) {
      fpsDisplay.target.textContent = `${fps} FPS`;
      
      // FPS에 따른 색상 변경
      if (fps >= 50) {
        fpsDisplay.target.style.color = '#10b981'; // green
      } else if (fps >= 30) {
        fpsDisplay.target.style.color = '#f59e0b'; // yellow
      } else {
        fpsDisplay.target.style.color = '#ef4444'; // red
      }
    }
  }, [movesDisplay, clicksDisplay, velocityDisplay, fpsDisplay]);

  const resetMetrics = useCallback(() => {
    // 메트릭 초기화
    metricsRef.current = {
      totalMoves: 0,
      totalClicks: 0,
      averageVelocity: 0,
      maxVelocity: 0,
      sessionStartTime: Date.now(),
    };
    frameTimestampsRef.current = [];
    performanceStartTimeRef.current = Date.now();

    // 표시 초기화
    if (movesDisplay.target) movesDisplay.target.textContent = '0';
    if (clicksDisplay.target) clicksDisplay.target.textContent = '0';
    if (velocityDisplay.target) velocityDisplay.target.textContent = '0.0 px/ms';
    if (fpsDisplay.target) {
      fpsDisplay.target.textContent = '0 FPS';
      fpsDisplay.target.style.color = '#6b7280'; // gray
    }

    // 타이머 정리
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = undefined;
    }
  }, [movesDisplay, clicksDisplay, velocityDisplay, fpsDisplay]);

  const getPerformanceMeasurement = useCallback((): PerformanceMeasurement => {
    const fps = calculateFPS(frameTimestampsRef.current, configRef.current.fpsSampleCount);
    const averageFrameTime = fps > 0 ? 1000 / fps : 0;
    const sessionDuration = Date.now() - performanceStartTimeRef.current;

    return {
      fps,
      averageFrameTime,
      totalMoves: metricsRef.current.totalMoves,
      totalClicks: metricsRef.current.totalClicks,
      sessionDuration,
    };
  }, []);

  const updateConfig = useCallback((newConfig: Partial<PerformanceConfig>) => {
    configRef.current = { ...configRef.current, ...newConfig };
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return {
    recordMouseMove,
    recordMouseClick,
    updateDisplays,
    resetMetrics,
    updateConfig,
    getPerformanceMeasurement,
    getCurrentFPS: () => calculateFPS(frameTimestampsRef.current, configRef.current.fpsSampleCount),
    getSessionDuration: () => formatSessionDuration(performanceStartTimeRef.current),
  };
}

// ============================================================================
// Components
// ============================================================================

/**
 * 성능 메트릭 패널 컴포넌트
 */
export function PerformanceMetricsPanel() {
  const movesDisplay = usePerformanceRef('movesDisplay');
  const clicksDisplay = usePerformanceRef('clicksDisplay');
  const velocityDisplay = usePerformanceRef('velocityDisplay');
  const fpsDisplay = usePerformanceRef('fpsDisplay');

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-3">📊 Performance Metrics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-3 rounded border text-center">
          <div className="text-lg font-bold text-blue-600">
            <span ref={movesDisplay.setRef}>0</span>
          </div>
          <div className="text-xs text-gray-600">Mouse Moves</div>
        </div>
        
        <div className="bg-white p-3 rounded border text-center">
          <div className="text-lg font-bold text-green-600">
            <span ref={clicksDisplay.setRef}>0</span>
          </div>
          <div className="text-xs text-gray-600">Mouse Clicks</div>
        </div>
        
        <div className="bg-white p-3 rounded border text-center">
          <div className="text-lg font-bold text-purple-600 font-mono">
            <span ref={velocityDisplay.setRef}>0.0 px/ms</span>
          </div>
          <div className="text-xs text-gray-600">Avg Velocity</div>
        </div>
        
        <div className="bg-white p-3 rounded border text-center">
          <div className="text-lg font-bold font-mono">
            <span ref={fpsDisplay.setRef}>0 FPS</span>
          </div>
          <div className="text-xs text-gray-600">Render Rate</div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200">
        <SessionInfo />
      </div>
    </div>
  );
}

/**
 * 세션 정보 컴포넌트
 */
function SessionInfo() {
  const { getSessionDuration, getCurrentFPS } = usePerformanceUpdater();
  const [sessionInfo, setSessionInfo] = React.useState({
    duration: '0s',
    currentFPS: 0,
  });

  // 1초마다 세션 정보 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionInfo({
        duration: getSessionDuration(),
        currentFPS: getCurrentFPS(),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [getSessionDuration, getCurrentFPS]);

  return (
    <div className="flex justify-between items-center text-sm text-gray-600">
      <div>
        <span className="font-medium">Session:</span> {sessionInfo.duration}
      </div>
      <div>
        <span className="font-medium">Current FPS:</span>{' '}
        <span className={`font-mono ${
          sessionInfo.currentFPS >= 50 ? 'text-green-600' :
          sessionInfo.currentFPS >= 30 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {sessionInfo.currentFPS}
        </span>
      </div>
    </div>
  );
}

/**
 * 성능 컨트롤 패널 컴포넌트
 */
export function PerformanceControls() {
  const { resetMetrics, getPerformanceMeasurement, updateConfig } = usePerformanceUpdater();
  const [config, setConfig] = React.useState(defaultConfig);

  const handleToggleLogging = useCallback(() => {
    const newConfig = { ...config, enablePerformanceLogging: !config.enablePerformanceLogging };
    setConfig(newConfig);
    updateConfig(newConfig);
  }, [config, updateConfig]);

  const handleToggleDetailedMetrics = useCallback(() => {
    const newConfig = { ...config, showDetailedMetrics: !config.showDetailedMetrics };
    setConfig(newConfig);
    updateConfig(newConfig);
  }, [config, updateConfig]);

  const handleExportMetrics = useCallback(() => {
    const measurement = getPerformanceMeasurement();
    const data = JSON.stringify(measurement, null, 2);
    
    // 콘솔에 출력
    console.log('Performance Measurement Export:', measurement);
    
    // 클립보드에 복사 (가능한 경우)
    if (navigator.clipboard) {
      navigator.clipboard.writeText(data);
    }
  }, [getPerformanceMeasurement]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-3">⚙️ Performance Controls</h3>
      
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={resetMetrics}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm font-medium"
          >
            Reset Metrics
          </button>
          
          <button
            onClick={handleExportMetrics}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm font-medium"
          >
            Export Data
          </button>
          
          <button
            onClick={handleToggleLogging}
            className={`px-3 py-1 rounded text-sm font-medium ${
              config.enablePerformanceLogging
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {config.enablePerformanceLogging ? '📝 Logging ON' : '📝 Logging OFF'}
          </button>
          
          <button
            onClick={handleToggleDetailedMetrics}
            className={`px-3 py-1 rounded text-sm font-medium ${
              config.showDetailedMetrics
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {config.showDetailedMetrics ? '📊 Details ON' : '📊 Details OFF'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export { PerformanceProvider, usePerformanceRef };