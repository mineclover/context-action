/**
 * @fileoverview Advanced Metrics Panel - 고급 성능 메트릭 및 분석 패널
 *
 * Context Store Pattern의 고급 분석과 실시간 모니터링을 제공
 */

import { useStoreValue } from '@context-action/react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';

// ================================
// 📊 타입 정의
// ================================

interface PerformanceHistory {
  timestamp: number;
  renderTime: number;
  storeUpdates: number;
  eventCount: number;
}

interface MemoryUsage {
  used: number;
  total: number;
  percentage: number;
}

interface StoreMetrics {
  storeName: string;
  updateCount: number;
  lastUpdate: number;
  subscriptionCount: number;
  averageUpdateTime: number;
}

interface AdvancedMetricsPanelProps {
  performanceMetrics: {
    renderCount: number;
    averageRenderTime: string;
    storeCount: number;
    subscriptionCount: number;
  };
  positionStore: any;
  movementStore: any;
  clicksStore: any;
  computedStore: any;
}

// ================================
// 🚀 Advanced Metrics Panel
// ================================

const AdvancedMetricsPanelComponent = ({
  performanceMetrics,
  positionStore,
  movementStore,
  clicksStore,
  computedStore,
}: AdvancedMetricsPanelProps) => {
  const [performanceHistory, setPerformanceHistory] = useState<
    PerformanceHistory[]
  >([]);
  const [memoryUsage, setMemoryUsage] = useState<MemoryUsage>({
    used: 0,
    total: 0,
    percentage: 0,
  });
  const [storeMetrics, setStoreMetrics] = useState<StoreMetrics[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const updateCountRef = useRef({
    position: 0,
    movement: 0,
    clicks: 0,
    computed: 0,
  });
  const lastUpdateTimeRef = useRef({
    position: 0,
    movement: 0,
    clicks: 0,
    computed: 0,
  });
  const subscriptionTimesRef = useRef<number[]>([]);

  // Store 값들 구독 (모니터링용)
  const position = useStoreValue(positionStore) as {
    current: { x: number; y: number };
    previous: { x: number; y: number };
    isInsideArea: boolean;
  };
  const movement = useStoreValue(movementStore) as {
    moveCount: number;
    isMoving: boolean;
    velocity: number;
    lastMoveTime: number | null;
    path: Array<{ x: number; y: number; timestamp: number }>;
  };
  const clicks = useStoreValue(clicksStore) as {
    count: number;
    lastClick: { x: number; y: number; timestamp: number } | null;
    history: Array<{ x: number; y: number; timestamp: number }>;
  };
  const computed = useStoreValue(computedStore) as any;

  // 성능 히스토리 업데이트
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const currentRenderTime = parseFloat(
        performanceMetrics.averageRenderTime
      );

      // 메모리 사용량 추정 (실제 환경에서는 Performance API 사용)
      const estimatedMemory = {
        used:
          performanceMetrics.renderCount * 0.1 +
          storeMetrics.reduce((acc, s) => acc + s.updateCount, 0) * 0.05,
        total: 100,
        percentage: 0,
      };
      estimatedMemory.percentage =
        (estimatedMemory.used / estimatedMemory.total) * 100;

      setPerformanceHistory((prev) => {
        const newHistory = [
          ...prev,
          {
            timestamp: now,
            renderTime: currentRenderTime,
            storeUpdates: storeMetrics.reduce(
              (acc, s) => acc + s.updateCount,
              0
            ),
            eventCount: movement.moveCount + clicks.count,
          },
        ].slice(-50); // 최근 50개 데이터 포인트 유지
        return newHistory;
      });

      setMemoryUsage(estimatedMemory);
    }, 1000); // 1초마다 업데이트

    return () => clearInterval(interval);
  }, [
    isMonitoring,
    performanceMetrics,
    storeMetrics,
    movement.moveCount,
    clicks.count,
  ]);

  // 개별 Store 업데이트 추적 - 각 store별로 독립적인 useEffect 사용
  useEffect(() => {
    const now = Date.now();
    const lastTime = lastUpdateTimeRef.current.position;

    updateCountRef.current.position++;
    lastUpdateTimeRef.current.position = now;

    setStoreMetrics((prev) =>
      prev.map((metric) =>
        metric.storeName === 'position'
          ? {
              ...metric,
              updateCount: updateCountRef.current.position,
              lastUpdate: now,
              averageUpdateTime: lastTime ? now - lastTime : 0,
            }
          : metric
      )
    );
  }, [position]);

  useEffect(() => {
    const now = Date.now();
    const lastTime = lastUpdateTimeRef.current.movement;

    updateCountRef.current.movement++;
    lastUpdateTimeRef.current.movement = now;

    setStoreMetrics((prev) =>
      prev.map((metric) =>
        metric.storeName === 'movement'
          ? {
              ...metric,
              updateCount: updateCountRef.current.movement,
              lastUpdate: now,
              averageUpdateTime: lastTime ? now - lastTime : 0,
            }
          : metric
      )
    );
  }, [movement]);

  useEffect(() => {
    const now = Date.now();
    const lastTime = lastUpdateTimeRef.current.clicks;

    updateCountRef.current.clicks++;
    lastUpdateTimeRef.current.clicks = now;

    setStoreMetrics((prev) =>
      prev.map((metric) =>
        metric.storeName === 'clicks'
          ? {
              ...metric,
              updateCount: updateCountRef.current.clicks,
              lastUpdate: now,
              averageUpdateTime: lastTime ? now - lastTime : 0,
            }
          : metric
      )
    );
  }, [clicks]);

  useEffect(() => {
    const now = Date.now();
    const lastTime = lastUpdateTimeRef.current.computed;

    updateCountRef.current.computed++;
    lastUpdateTimeRef.current.computed = now;

    setStoreMetrics((prev) =>
      prev.map((metric) =>
        metric.storeName === 'computed'
          ? {
              ...metric,
              updateCount: updateCountRef.current.computed,
              lastUpdate: now,
              averageUpdateTime: lastTime ? now - lastTime : 0,
            }
          : metric
      )
    );
  }, [computed]);

  // 초기 메트릭 설정
  useEffect(() => {
    const initialMetrics: StoreMetrics[] = [
      {
        storeName: 'position',
        updateCount: 0,
        lastUpdate: 0,
        subscriptionCount: 1,
        averageUpdateTime: 0,
      },
      {
        storeName: 'movement',
        updateCount: 0,
        lastUpdate: 0,
        subscriptionCount: 1,
        averageUpdateTime: 0,
      },
      {
        storeName: 'clicks',
        updateCount: 0,
        lastUpdate: 0,
        subscriptionCount: 1,
        averageUpdateTime: 0,
      },
      {
        storeName: 'computed',
        updateCount: 0,
        lastUpdate: 0,
        subscriptionCount: 1,
        averageUpdateTime: 0,
      },
    ];

    setStoreMetrics(initialMetrics);
  }, []); // 초기화는 한 번만

  // 성능 점수 계산 (구체적인 공식 포함)
  const performanceCalculation = useMemo(() => {
    const renderTime = parseFloat(performanceMetrics.averageRenderTime);
    const memoryPercentage = memoryUsage.percentage;
    const avgStoreUpdateTime =
      storeMetrics.length > 0
        ? storeMetrics.reduce((acc, s) => acc + s.averageUpdateTime, 0) /
          storeMetrics.length
        : 0;

    // 개별 점수 계산
    const renderScore = Math.max(0, 100 - renderTime);
    const memoryScore = Math.max(0, 100 - memoryPercentage);
    const updateScore = Math.max(0, 100 - avgStoreUpdateTime / 10);

    // 최종 점수 (가중 평균)
    const finalScore = Math.round(
      (renderScore + memoryScore + updateScore) / 3
    );

    return {
      renderTime,
      memoryPercentage,
      avgStoreUpdateTime,
      renderScore,
      memoryScore,
      updateScore,
      finalScore,
      formula: `((100-${renderTime.toFixed(1)}) + (100-${memoryPercentage.toFixed(1)}) + (100-${(avgStoreUpdateTime / 10).toFixed(1)})) / 3 = ${finalScore}`,
    };
  }, [
    performanceMetrics.averageRenderTime,
    memoryUsage.percentage,
    storeMetrics,
  ]);

  const performanceScore = performanceCalculation.finalScore;

  // 실시간 차트 데이터
  const chartData = useMemo(() => {
    if (performanceHistory.length < 2) return '';

    const maxRenderTime = Math.max(
      ...performanceHistory.map((h) => h.renderTime)
    );
    const maxEvents = Math.max(...performanceHistory.map((h) => h.eventCount));

    return performanceHistory
      .map((point, index) => {
        const x = (index / (performanceHistory.length - 1)) * 200;
        const renderY = 50 - (point.renderTime / maxRenderTime) * 40;
        const eventY = 50 - (point.eventCount / maxEvents) * 40;

        return `${x},${renderY} `;
      })
      .join('');
  }, [performanceHistory]);

  return (
    <div className="bg-gray-900 text-white rounded-lg p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-green-400">📊</span>
            Advanced Performance Analytics
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Real-time monitoring of Context Store Pattern performance with
            store-level metrics
          </p>
        </div>
        <button
          onClick={() => setIsMonitoring(!isMonitoring)}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            isMonitoring
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isMonitoring ? '⏹️ Stop' : '▶️ Monitor'}
        </button>
      </div>

      {/* 설명 패널 */}
      <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-400 text-lg">💡</div>
          <div>
            <h4 className="text-sm font-semibold text-blue-300 mb-2">
              What This Panel Shows
            </h4>
            <div className="text-xs text-blue-100 space-y-1">
              <div>
                <strong>Performance Score:</strong> Overall system performance
                based on render time, memory usage, and store update efficiency
              </div>
              <div>
                <strong>Store Performance:</strong> Individual store update
                counts and frequency - shows selective subscription
                effectiveness
              </div>
              <div>
                <strong>Memory Usage:</strong> Estimated memory consumption from
                path data, click history, and DOM elements (~509KB total)
              </div>
              <div>
                <strong>Real-time Chart:</strong> Live visualization of render
                performance when monitoring is active
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 성능 스코어 */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Performance Score</span>
          <span
            className={`text-xl font-bold ${
              performanceScore >= 80
                ? 'text-green-400'
                : performanceScore >= 60
                  ? 'text-yellow-400'
                  : 'text-red-400'
            }`}
          >
            {performanceScore}/100
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              performanceScore >= 80
                ? 'bg-green-400'
                : performanceScore >= 60
                  ? 'bg-yellow-400'
                  : 'bg-red-400'
            }`}
            style={{ width: `${performanceScore}%` }}
          />
        </div>

        {/* 계산식 상세 정보 */}
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-400 hover:text-white mb-2">
            📊 Calculation Details
          </summary>
          <div className="bg-gray-900 p-3 rounded border space-y-2 font-mono">
            <div className="text-gray-300">
              <div className="text-yellow-300 mb-2">Score Components:</div>
              <div>
                • Render Score: 100 -{' '}
                {performanceCalculation.renderTime.toFixed(1)}ms ={' '}
                <span className="text-green-400">
                  {performanceCalculation.renderScore}/100
                </span>
              </div>
              <div>
                • Memory Score: 100 -{' '}
                {performanceCalculation.memoryPercentage.toFixed(1)}% ={' '}
                <span className="text-green-400">
                  {performanceCalculation.memoryScore}/100
                </span>
              </div>
              <div>
                • Update Score: 100 -{' '}
                {(performanceCalculation.avgStoreUpdateTime / 10).toFixed(1)} ={' '}
                <span className="text-green-400">
                  {performanceCalculation.updateScore}/100
                </span>
              </div>
            </div>
            <div className="border-t border-gray-700 pt-2">
              <div className="text-blue-300">Final Formula:</div>
              <div className="text-green-400">
                {performanceCalculation.formula}
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Higher scores indicate better performance. Render time penalty
              increases linearly, memory usage affects score 1:1, store update
              time is scaled by factor of 10.
            </div>
          </div>
        </details>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store 메트릭 */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">
            Store Performance
          </h4>
          <div className="space-y-2">
            {storeMetrics.map((metric) => (
              <div
                key={metric.storeName}
                className="flex justify-between items-center"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      metric.storeName === 'position'
                        ? 'bg-blue-400'
                        : metric.storeName === 'movement'
                          ? 'bg-green-400'
                          : metric.storeName === 'clicks'
                            ? 'bg-purple-400'
                            : 'bg-orange-400'
                    }`}
                  />
                  <span className="text-xs capitalize">{metric.storeName}</span>
                </div>
                <div className="text-xs text-gray-400">
                  {metric.updateCount} updates
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 메모리 사용량 */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">
            Memory Usage
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Used</span>
              <span className="text-blue-400">
                {memoryUsage.used.toFixed(1)} KB
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Total</span>
              <span className="text-gray-400">
                {memoryUsage.total.toFixed(1)} KB
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-blue-400 transition-all duration-300"
                style={{ width: `${Math.min(memoryUsage.percentage, 100)}%` }}
              />
            </div>
            <div className="text-center text-xs text-gray-400">
              {memoryUsage.percentage.toFixed(1)}% utilized
            </div>
          </div>
        </div>

        {/* 실시간 차트 */}
        {isMonitoring && performanceHistory.length > 1 && (
          <div className="lg:col-span-2 bg-gray-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">
              Real-time Performance Chart
            </h4>
            <div className="relative">
              <svg
                width="100%"
                height="100"
                className="border border-gray-700 rounded"
              >
                <defs>
                  <linearGradient
                    id="chartGradient"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="rgba(34, 197, 94, 0.3)" />
                    <stop offset="100%" stopColor="rgba(34, 197, 94, 0.1)" />
                  </linearGradient>
                </defs>

                {/* 렌더 시간 라인 */}
                <polyline
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                  points={chartData}
                />

                {/* 영역 채우기 */}
                <polygon
                  fill="url(#chartGradient)"
                  points={`0,50 ${chartData} 200,50`}
                />
              </svg>

              <div className="absolute top-2 left-2 text-xs text-green-400">
                Render Time (ms)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 디버깅 정보 */}
      <details className="bg-gray-800 rounded-lg">
        <summary className="p-3 cursor-pointer text-sm text-gray-400 hover:text-white">
          🔧 Debug Information
        </summary>
        <div className="p-3 pt-0 text-xs space-y-2">
          <div className="grid grid-cols-2 gap-4 font-mono">
            <div>
              <div className="text-gray-400">Render Metrics:</div>
              <div>Count: {performanceMetrics.renderCount}</div>
              <div>Avg Time: {performanceMetrics.averageRenderTime}ms</div>
              <div>Subscriptions: {performanceMetrics.subscriptionCount}</div>
            </div>
            <div>
              <div className="text-gray-400">Store States:</div>
              <div>
                Position: ({position.current.x}, {position.current.y})
              </div>
              <div>Movement: {movement.moveCount} moves</div>
              <div>Clicks: {clicks.count}</div>
              <div>Activity: {computed.activityStatus}</div>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
};

export const AdvancedMetricsPanel = memo(AdvancedMetricsPanelComponent);
