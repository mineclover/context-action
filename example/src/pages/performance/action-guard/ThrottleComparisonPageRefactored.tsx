/**
 * @fileoverview Advanced Throttle Comparison Demo - Context-Action 다양한 쓰로틀링 방법 비교 분석
 *
 * 다양한 쓰로틀링 방법 비교 분석을 통해
 * Context-Action 프레임워크의 Store와 Action Pipeline을 활용한
 * 이벤트 처리 성능 최적화, 메모리 사용량 개선, 사용자 경험 향상 전략을
 * 실제 사례로 보여주는 고급 데모입니다.
 */

import { useStoreValue } from '@context-action/react';
import { useMemo, useState } from 'react';
import { CodeBlock } from '@/components/ui';
import { useThrottleActions } from './throttle/actions/useThrottleActions';
import type { ThrottleEventType } from './throttle/business/throttle-rules';
import {
  ThrottleActionProvider,
  ThrottleStoreProvider,
  useThrottleStore,
} from './throttle/contexts/ThrottleContexts';
import { ThrottleHandlerRegistry } from './throttle/handlers/ThrottleHandlerRegistry';

// ===== 메인 페이지 컴포넌트 =====
export function ThrottleComparisonPageRefactored() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* 1. Architecture Section */}
        <ArchitectureSection />

        <ThrottleActionProvider>
          <ThrottleStoreProvider>
            <ThrottleHandlerRegistry>
              {/* 2. Demo Section */}
              <DemoSection />

              {/* 3. Status Section */}
              <StatusSection />

              {/* 4. Code Section */}
              <CodeSection />
            </ThrottleHandlerRegistry>
          </ThrottleStoreProvider>
        </ThrottleActionProvider>
      </div>
    </div>
  );
}

// ===== 1. Architecture Section =====
function ArchitectureSection() {
  return (
    <section className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl">
          <span className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Advanced Throttle Comparison System
          </h1>
          <p className="text-gray-600">다양한 쓰로틀링 방법 비교 분석 시스템</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl">
            <h3 className="text-xl font-semibold text-teal-900 mb-4">
              🎯 System Architecture
            </h3>
            <div className="space-y-4 text-teal-800">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <strong>Multiple Strategies:</strong> Normal, Throttle,
                  Debounce, Leading Edge, Trailing Edge
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <strong>Performance Tracking:</strong> 실시간 성능 메트릭스 및
                  효율성 분석
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <strong>Comparative Analysis:</strong> 다양한 방식의 성능 및
                  리소스 사용량 비교
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
            <h3 className="text-xl font-semibold text-blue-900 mb-4">
              ⚡ Throttling Strategies
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 text-blue-800">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4" />
                  <span>Normal (No throttling)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4" />
                  <span>Standard Throttling</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4" />
                  <span>Debouncing</span>
                </div>
              </div>
              <div className="space-y-2 text-blue-800">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4" />
                  <span>Leading Edge</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4" />
                  <span>Trailing Edge</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4" />
                  <span>Performance Analysis</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
            <h3 className="text-xl font-semibent text-green-900 mb-4">
              🔄 Event Flow
            </h3>
            <div className="space-y-3 text-sm text-green-800">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4" />
                <span>User Input</span>
                <span>→</span>
                <span>Strategy</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4" />
                <span>Timing Control</span>
                <span>→</span>
                <span>Processing</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4" />
                <span>Metrics</span>
                <span>→</span>
                <span>Analysis</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
            <h3 className="text-xl font-semibold text-orange-900 mb-4">
              🛡️ Performance
            </h3>
            <div className="space-y-2 text-orange-800 text-sm">
              <div>• CPU 사용량 최적화</div>
              <div>• 메모리 효율성 개선</div>
              <div>• 응답성 향상</div>
              <div>• 배터리 수명 연장</div>
              <div>• 네트워크 요청 감소</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== 2. Demo Section =====
function DemoSection() {
  return (
    <section className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          🎯 Interactive Throttle Comparison
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Comparison System Active</span>
        </div>
      </div>

      <ThrottleDemoInterface />
    </section>
  );
}

// ===== Throttle Demo Interface =====
function ThrottleDemoInterface() {
  const {
    clearLogs,
    inputEvent,
    runPerformanceTest,
    startAutoTest,
    stopAutoTest,
    updateConfig,
  } = useThrottleActions();
  const [inputValue, setInputValue] = useState('');

  // Store subscriptions
  const eventLogsStore = useThrottleStore('eventLogs');
  const isAutoTestingStore = useThrottleStore('isAutoTesting');
  const configStore = useThrottleStore('config');
  const metricsStore = useThrottleStore('metrics');
  const performanceHistoryStore = useThrottleStore('performanceHistory');

  const eventLogs = useStoreValue(eventLogsStore) || [];
  const isAutoTesting = useStoreValue(isAutoTestingStore);
  const config = useStoreValue(configStore);
  const metrics = useStoreValue(metricsStore);
  const _performanceHistory = useStoreValue(performanceHistoryStore) || [];

  return (
    <div className="space-y-8">
      {/* Configuration Panel */}
      <div className="p-6 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-5 h-5" />
          쓰로틀링 설정 패널
        </h3>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries({
            throttleDelay: '스탠다드 쓰로틀',
            debounceDelay: '디바운스',
            leadingDelay: '리딩 에지',
            trailingDelay: '트레일링 에지',
          }).map(([key, label]) => (
            <div key={key}>
              <h4 className="font-semibold text-gray-700 mb-3">{label}</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span>지연시간</span>
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    {config?.[key as keyof typeof config] || 0}ms
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="50"
                  value={config?.[key as keyof typeof config] || 0}
                  onChange={(e) =>
                    updateConfig({
                      ...config,
                      [key]: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Input Test */}
      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
        <h3 className="text-xl font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <span className="w-5 h-5" />
          실시간 입력 테스트
        </h3>

        <div className="space-y-4">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              const value = e.target.value;
              setInputValue(value);

              inputEvent(value);
            }}
            placeholder="타이핑하면서 5가지 방식의 이벤트 처리를 실시간으로 비교해보세요..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="text-sm text-gray-600 flex items-center gap-2">
            <span className="w-4 h-4" />
            <span>각 방식별로 다른 빈도와 타이밍으로 이벤트가 처리됩니다.</span>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
          <h3 className="text-lg font-semibold text-green-900 mb-4">
            🚀 자동 테스트
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => startAutoTest(20, 100)}
              disabled={isAutoTesting}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              {isAutoTesting ? (
                <span className="w-4 h-4" />
              ) : (
                <span className="w-4 h-4" />
              )}
              {isAutoTesting ? '테스트 중...' : '자동 이벤트 생성'}
            </button>

            <button
              onClick={() => runPerformanceTest('normal', 50, 20)}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <span className="w-4 h-4" />
              성능 벤치마크
            </button>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
          <h3 className="text-lg font-semibold text-orange-900 mb-4">
            🛠️ 관리 도구
          </h3>
          <div className="space-y-3">
            <button
              onClick={clearLogs}
              className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
            >
              <span className="w-4 h-4" />
              로그 및 메트릭스 초기화
            </button>

            {isAutoTesting && (
              <button
                onClick={stopAutoTest}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
              >
                <span className="w-4 h-4" />
                자동 테스트 중지
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Event Counters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          {
            key: 'normal',
            label: '일반',
            color: 'red',
            icon: () => <span>🔴</span>,
          },
          {
            key: 'throttle',
            label: '쓰로틀',
            color: 'blue',
            icon: () => <span>🔵</span>,
          },
          {
            key: 'debounce',
            label: '디바운스',
            color: 'green',
            icon: () => <span>🟢</span>,
          },
          {
            key: 'leading',
            label: '리딩',
            color: 'purple',
            icon: () => <span>🟣</span>,
          },
          {
            key: 'trailing',
            label: '트레일링',
            color: 'orange',
            icon: () => <span>🟠</span>,
          },
        ].map(({ key, label, color, icon: Icon }) => {
          const strategyKey = key as ThrottleEventType;

          return (
            <div key={key} className={`bg-${color}-50 p-4 rounded-lg`}>
              <div className="flex items-center justify-between mb-2">
                <Icon />
                <span className="text-xs text-gray-600">
                  {config?.[`${key}Delay` as keyof typeof config] || 0}ms
                </span>
              </div>
              <div className={`text-2xl font-bold text-${color}-600`}>
                {metrics?.eventCounts[strategyKey] || 0}
              </div>
              <div className={`text-sm text-${color}-800`}>{label}</div>
              <div className="text-xs text-gray-500 mt-1">
                평균: {Math.round(metrics?.avgResponseTimes[strategyKey] || 0)}
                ms
              </div>
            </div>
          );
        })}
      </div>

      {/* Event Logs */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-5 h-5" />
            실시간 이벤트 로그
          </h3>
          <div className="text-sm text-gray-600">
            최근 {eventLogs.length}개 이벤트
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2">
          {eventLogs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <span className="w-8 h-8 mx-auto mb-2" />
              <div>이벤트를 생성하여 비교를 시작하세요</div>
            </div>
          ) : (
            eventLogs.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded-lg border-l-4 ${
                  log.type === 'normal'
                    ? 'bg-red-50 border-l-red-500'
                    : log.type === 'throttle'
                      ? 'bg-blue-50 border-l-blue-500'
                      : log.type === 'debounce'
                        ? 'bg-green-50 border-l-green-500'
                        : log.type === 'leading'
                          ? 'bg-purple-50 border-l-purple-500'
                          : 'bg-orange-50 border-l-orange-500'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium text-white ${
                        log.type === 'normal'
                          ? 'bg-red-500'
                          : log.type === 'throttle'
                            ? 'bg-blue-500'
                            : log.type === 'debounce'
                              ? 'bg-green-500'
                              : log.type === 'leading'
                                ? 'bg-purple-500'
                                : 'bg-orange-500'
                      }`}
                    >
                      {log.type.toUpperCase()}
                    </span>

                    <span className="font-mono text-sm truncate max-w-xs">
                      {log.value}
                    </span>

                    {log.delay && (
                      <span className="text-xs text-gray-500">
                        ({log.delay}ms delay)
                      </span>
                    )}

                    {log.executionTime && (
                      <span className="text-xs text-gray-500">
                        {Math.round(log.executionTime)}ms exec
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-gray-500 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString()}.
                    {log.timestamp % 1000}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ===== 3. Status Section =====
function StatusSection() {
  const metricsStore = useThrottleStore('metrics');
  const configStore = useThrottleStore('config');
  const performanceHistoryStore = useThrottleStore('performanceHistory');
  const isAutoTestingStore = useThrottleStore('isAutoTesting');

  const metrics = useStoreValue(metricsStore);
  const config = useStoreValue(configStore);
  const _performanceHistory = useStoreValue(performanceHistoryStore) || [];
  const isAutoTesting = useStoreValue(isAutoTestingStore);

  const totalEvents = useMemo(
    () =>
      Object.values(metrics?.eventCounts || {}).reduce(
        (sum, count) => sum + count,
        0
      ),
    [metrics?.eventCounts]
  );

  const averageEfficiency = useMemo(() => {
    const efficiencies = Object.values(metrics?.efficiency || {});
    return efficiencies.length > 0
      ? efficiencies.reduce((sum, eff) => sum + eff, 0) / efficiencies.length
      : 0;
  }, [metrics?.efficiency]);

  return (
    <section className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
          <span className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Throttle Performance Analytics
          </h2>
          <p className="text-gray-600">
            실시간 쓰로틀링 성능 분석 및 비교 메트릭스
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Event Processing Metrics */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <span className="w-5 h-5" />
              이벤트 처리
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-blue-700">총 이벤트</span>
                <span className="font-bold text-blue-900">{totalEvents}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-700">평균 효율성</span>
                <span className="font-bold text-blue-900">
                  {Math.round(averageEfficiency)} ev/s
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-700">테스트 상태</span>
                <span
                  className={`font-bold ${isAutoTesting ? 'text-green-600' : 'text-gray-600'}`}
                >
                  {isAutoTesting ? '실행중' : '대기'}
                </span>
              </div>
            </div>
          </div>

          {/* Response Time Comparison */}
          <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
            <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
              <span className="w-5 h-5" />
              응답시간 비교
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-purple-700">일반</span>
                <span className="font-bold text-purple-900">
                  {Math.round(metrics?.avgResponseTimes.normal || 0)}ms
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-700">쓰로틀</span>
                <span className="font-bold text-purple-900">
                  {Math.round(metrics?.avgResponseTimes.throttle || 0)}ms
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-700">디바운스</span>
                <span className="font-bold text-purple-900">
                  {Math.round(metrics?.avgResponseTimes.debounce || 0)}ms
                </span>
              </div>
            </div>
          </div>

          {/* Configuration Status */}
          <div className="p-6 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl">
            <h3 className="text-lg font-semibold text-teal-900 mb-4 flex items-center gap-2">
              <span className="w-5 h-5" />
              설정 상태
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-teal-700">쓰로틀 지연</span>
                <span className="font-bold text-teal-900">
                  {config?.throttleDelay}ms
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-teal-700">디바운스 지연</span>
                <span className="font-bold text-teal-900">
                  {config?.debounceDelay}ms
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-teal-700">리딩 지연</span>
                <span className="font-bold text-teal-900">
                  {config?.leadingDelay}ms
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
            <h3 className="text-lg font-semibold text-green-900 mb-4">
              ⚡ 실시간 상태
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-700">비교 시스템 활성</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${isAutoTesting ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`}
                />
                <span className="text-green-700">
                  자동 테스트 {isAutoTesting ? '실행중' : '대기중'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full" />
                <span className="text-green-700">5가지 방식 동시 분석</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📊 효율성 차트
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-700">전체 효율성</span>
                  <span className="text-gray-900 font-medium">
                    {Math.round(averageEfficiency)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, (averageEfficiency / 100) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-700">성능 최적화</span>
                  <span className="text-gray-900 font-medium">
                    {totalEvents > 0
                      ? Math.round(
                          ((metrics?.eventCounts.throttle || 0) / totalEvents) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${totalEvents > 0 ? ((metrics?.eventCounts.throttle || 0) / totalEvents) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== 4. Code Section =====
function CodeSection() {
  return (
    <section className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
          <span className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Implementation Details
          </h2>
          <p className="text-gray-600">쓰로틀링 및 디바운싱 구현 코드</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="p-6 bg-gray-50 rounded-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              🏪 Store Context
            </h3>
            <CodeBlock size="sm">
              {`const { Provider: ThrottleActionProvider } =
  createActionContext<ThrottleActions>('AdvancedThrottle');

const { Provider: ThrottleStoreProvider, useStore } =
  createStoreContext<ThrottleStores>('AdvancedThrottle', {
    eventLogs: { initialValue: [], strategy: 'reference' },
    isAutoTesting: { initialValue: false },
    config: { initialValue: createInitialThrottleConfig() },
    metrics: { initialValue: createInitialPerformanceMetrics() },
    performanceHistory: { initialValue: [], strategy: 'reference' }
  });`}
            </CodeBlock>
          </div>

          <div className="p-6 bg-gray-50 rounded-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              ⏱️ Throttle Implementation
            </h3>
            <CodeBlock size="sm">
              {`function scheduleTimedEvent(type, value, delay, options) {
  const scheduler = schedulerRef.current[type];
  const now = Date.now();
  scheduler.latestValue = value;

  if (options.leading && now - scheduler.lastExecuted >= delay) {
    dispatch('processEvent', { type, value, timestamp: now, delay });
    scheduler.lastExecuted = now;
    return;
  }

  if (!options.trailing) return;
  if (scheduler.timeout) clearTimeout(scheduler.timeout);

  scheduler.timeout = setTimeout(() => {
    dispatch('processEvent', {
      type,
      value: scheduler.latestValue,
      timestamp: Date.now(),
      delay
    });
    scheduler.lastExecuted = Date.now();
  }, options.leading ? delay - (now - scheduler.lastExecuted) : delay);
}`}
            </CodeBlock>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-gray-50 rounded-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              🎯 Debounce Implementation
            </h3>
            <CodeBlock size="sm">
              {`useThrottleActionHandler('inputEvent', useCallback(async ({ value }) => {
  const { debounceDelay } = configStore.getValue();

  scheduleTimedEvent('debounce', value, debounceDelay, {
    leading: false,
    trailing: true
  });
}, [configStore, scheduleTimedEvent]));`}
            </CodeBlock>
          </div>

          <div className="p-6 bg-gray-50 rounded-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              📊 Performance Tracking
            </h3>
            <CodeBlock size="sm">
              {`useThrottleActionHandler('processEvent', useCallback(async (payload) => {
  const startTime = performance.now();
  
  // Simulate processing work
  const processingTime = Math.random() * 10 + 5;
  await new Promise(resolve => setTimeout(resolve, processingTime));
  
  const endTime = performance.now();
  const executionTime = endTime - startTime;
  
  metricsStore.setValue(
    recordProcessedEvent(metricsStore.getValue(), payload.type, executionTime)
  );
}, [metricsStore]));`}
            </CodeBlock>
          </div>

          <div className="p-6 bg-teal-50 rounded-xl">
            <h3 className="text-lg font-semibold text-teal-900 mb-3">
              🔧 최적화 가이드라인
            </h3>
            <ul className="space-y-2 text-teal-800 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full" />
                <span>검색 입력: 300-500ms 디바운싱 권장</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-500 rounded-full" />
                <span>스크롤 이벤트: 16ms (60fps) 쓰로틀링</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>API 호출: 500-1000ms 디바운싱</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                <span>리사이즈: 100-200ms 쓰로틀링</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span>실시간 업데이트: 100ms 이하 쓰로틀링</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ThrottleComparisonPageRefactored;
