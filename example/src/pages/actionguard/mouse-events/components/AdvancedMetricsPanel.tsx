/**
 * @fileoverview Advanced Metrics Panel - 고급 성능 메트릭 및 분석 패널
 * 
 * Context Store Pattern의 고급 분석과 실시간 모니터링을 제공
 */

import { memo, useEffect, useState, useRef, useMemo } from 'react';
import { useStoreValue } from '@context-action/react';

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
  computedStore
}: AdvancedMetricsPanelProps) => {
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceHistory[]>([]);
  const [memoryUsage, setMemoryUsage] = useState<MemoryUsage>({ used: 0, total: 0, percentage: 0 });
  const [storeMetrics, setStoreMetrics] = useState<StoreMetrics[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const updateCountRef = useRef({ position: 0, movement: 0, clicks: 0, computed: 0 });
  const lastUpdateTimeRef = useRef({ position: 0, movement: 0, clicks: 0, computed: 0 });
  const subscriptionTimesRef = useRef<number[]>([]);

  // Store 값들 구독 (모니터링용)
  const position = useStoreValue(positionStore);
  const movement = useStoreValue(movementStore);
  const clicks = useStoreValue(clicksStore);
  const computed = useStoreValue(computedStore);

  // 성능 히스토리 업데이트
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const currentRenderTime = parseFloat(performanceMetrics.averageRenderTime);
      
      // 메모리 사용량 추정 (실제 환경에서는 Performance API 사용)
      const estimatedMemory = {
        used: (performanceMetrics.renderCount * 0.1) + (storeMetrics.reduce((acc, s) => acc + s.updateCount, 0) * 0.05),
        total: 100,
        percentage: 0
      };
      estimatedMemory.percentage = (estimatedMemory.used / estimatedMemory.total) * 100;

      setPerformanceHistory(prev => {
        const newHistory = [...prev, {
          timestamp: now,
          renderTime: currentRenderTime,
          storeUpdates: storeMetrics.reduce((acc, s) => acc + s.updateCount, 0),
          eventCount: movement.moveCount + clicks.count
        }].slice(-50); // 최근 50개 데이터 포인트 유지
        return newHistory;
      });

      setMemoryUsage(estimatedMemory);
    }, 1000); // 1초마다 업데이트

    return () => clearInterval(interval);
  }, [isMonitoring, performanceMetrics, storeMetrics, movement.moveCount, clicks.count]);

  // Store 메트릭 업데이트
  useEffect(() => {
    const updateStoreMetrics = () => {
      const now = Date.now();
      const stores = [
        { name: 'position', store: positionStore },
        { name: 'movement', store: movementStore },
        { name: 'clicks', store: clicksStore },
        { name: 'computed', store: computedStore }
      ];

      const newMetrics: StoreMetrics[] = stores.map(({ name, store }) => {
        const currentCount = updateCountRef.current[name as keyof typeof updateCountRef.current];
        const lastTime = lastUpdateTimeRef.current[name as keyof typeof lastUpdateTimeRef.current];
        
        // 업데이트 횟수 추적
        updateCountRef.current[name as keyof typeof updateCountRef.current]++;
        lastUpdateTimeRef.current[name as keyof typeof lastUpdateTimeRef.current] = now;

        return {
          storeName: name,
          updateCount: currentCount + 1,
          lastUpdate: now,
          subscriptionCount: 1, // 각 패널당 1개 구독
          averageUpdateTime: lastTime ? now - lastTime : 0
        };
      });

      setStoreMetrics(newMetrics);
    };

    updateStoreMetrics();
  }, [position, movement, clicks, computed]);

  // 성능 점수 계산
  const performanceScore = useMemo(() => {
    const renderScore = Math.max(0, 100 - parseFloat(performanceMetrics.averageRenderTime));
    const memoryScore = Math.max(0, 100 - memoryUsage.percentage);
    const updateScore = storeMetrics.length > 0 
      ? Math.max(0, 100 - (storeMetrics.reduce((acc, s) => acc + s.averageUpdateTime, 0) / storeMetrics.length / 10))
      : 100;
    
    return Math.round((renderScore + memoryScore + updateScore) / 3);
  }, [performanceMetrics.averageRenderTime, memoryUsage.percentage, storeMetrics]);

  // 실시간 차트 데이터
  const chartData = useMemo(() => {
    if (performanceHistory.length < 2) return '';
    
    const maxRenderTime = Math.max(...performanceHistory.map(h => h.renderTime));
    const maxEvents = Math.max(...performanceHistory.map(h => h.eventCount));
    
    return performanceHistory.map((point, index) => {
      const x = (index / (performanceHistory.length - 1)) * 200;
      const renderY = 50 - (point.renderTime / maxRenderTime) * 40;
      const eventY = 50 - (point.eventCount / maxEvents) * 40;
      
      return `${x},${renderY} `;
    }).join('');
  }, [performanceHistory]);

  return (
    <div className="bg-gray-900 text-white rounded-lg p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span className="text-green-400">📊</span>
          Advanced Performance Analytics
        </h3>
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

      {/* 성능 스코어 */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Performance Score</span>
          <span className={`text-xl font-bold ${
            performanceScore >= 80 ? 'text-green-400' : 
            performanceScore >= 60 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {performanceScore}/100
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              performanceScore >= 80 ? 'bg-green-400' : 
              performanceScore >= 60 ? 'bg-yellow-400' : 'bg-red-400'
            }`}
            style={{ width: `${performanceScore}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store 메트릭 */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Store Performance</h4>
          <div className="space-y-2">
            {storeMetrics.map((metric) => (
              <div key={metric.storeName} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    metric.storeName === 'position' ? 'bg-blue-400' :
                    metric.storeName === 'movement' ? 'bg-green-400' :
                    metric.storeName === 'clicks' ? 'bg-purple-400' : 'bg-orange-400'
                  }`} />
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
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Memory Usage</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Used</span>
              <span className="text-blue-400">{memoryUsage.used.toFixed(1)} KB</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Total</span>
              <span className="text-gray-400">{memoryUsage.total.toFixed(1)} KB</span>
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
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Real-time Performance Chart</h4>
            <div className="relative">
              <svg width="100%" height="100" className="border border-gray-700 rounded">
                <defs>
                  <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
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
              <div>Position: ({position.current.x}, {position.current.y})</div>
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