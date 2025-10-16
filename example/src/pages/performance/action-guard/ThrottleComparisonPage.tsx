/**
 * @fileoverview Throttle Comparison Demo Page
 * Context-Action framework의 스로틀링 및 디바운싱 성능 비교 데모
 */

import { createActionContext } from '@context-action/react';
import { useCallback, useRef, useState } from 'react';
import { PageWithLogMonitor } from '@/components/LogMonitor';
import { Badge, Card, CardContent } from '@/components/ui';

// Throttle 관련 액션 타입 정의
interface ThrottleActions {
  normalEvent: { timestamp: number; value: string };
  throttledEvent: { timestamp: number; value: string; delay: number };
  debouncedEvent: { timestamp: number; value: string; delay: number };
  clearLogs: void;
  testPerformance: {
    type: 'normal' | 'throttle' | 'debounce';
    operations: number;
  };
}

// Action Context 생성
const {
  Provider: ThrottleProvider,
  useActionDispatch,
  useActionHandler,
} = createActionContext<ThrottleActions>('Throttle');

// 메인 컴포넌트
export function ThrottleComparisonPage() {
  return (
    <PageWithLogMonitor
      pageId="throttle-comparison"
      title="Throttle Comparison Demo"
      initialConfig={{ enableToast: true, maxLogs: 100 }}
    >
      <div className="page-container">
        <header className="page-header">
          <h1>⏱️ Throttle Comparison Demo</h1>
          <p className="page-description">
            Context-Action 프레임워크의{' '}
            <strong>스로틀링과 디바운싱 최적화</strong> 비교 데모입니다. 이벤트
            처리 성능 최적화, 메모리 사용량 개선, 사용자 경험 향상 전략을 실제
            사례로 보여줍니다.
          </p>

          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline" className="bg-red-50 text-red-800">
              🚀 일반 이벤트
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-800">
              ⏱️ 스로틀링
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-800">
              🎯 디바운싱
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-800">
              📊 성능 비교
            </Badge>
          </div>
        </header>

        <ThrottleProvider>
          <ThrottleDemo />
        </ThrottleProvider>
      </div>
    </PageWithLogMonitor>
  );
}

// 디바운싱과 스로틀링 유틸리티 함수들
function useThrottle<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastExecutedRef = useRef<number>(0);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastExecutedRef.current >= delay) {
        func(...args);
        lastExecutedRef.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(
          () => {
            func(...args);
            lastExecutedRef.current = Date.now();
          },
          delay - (now - lastExecutedRef.current)
        );
      }
    }) as T,
    [func, delay]
  );
}

function useDebounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        func(...args);
      }, delay);
    }) as T,
    [func, delay]
  );
}

// 데모 컴포넌트
function ThrottleDemo() {
  const dispatch = useActionDispatch();
  const [eventLogs, setEventLogs] = useState<
    Array<{
      id: string;
      type: 'normal' | 'throttle' | 'debounce';
      timestamp: number;
      value: string;
      delay?: number;
    }>
  >([]);

  const [counters, setCounters] = useState({
    normal: 0,
    throttle: 0,
    debounce: 0,
  });

  const [_performanceData, setPerformanceData] = useState<
    Array<{
      type: string;
      operations: number;
      duration: number;
      timestamp: number;
    }>
  >([]);

  const [inputValue, setInputValue] = useState('');
  const [throttleDelay, setThrottleDelay] = useState(300);
  const [debounceDelay, setDebounceDelay] = useState(500);

  // Action Handlers 등록
  useActionHandler(
    'normalEvent',
    useCallback(async (payload, controller) => {
      const logEntry = {
        id: `normal_${Date.now()}_${Math.random()}`,
        type: 'normal' as const,
        timestamp: payload.timestamp,
        value: payload.value,
      };

      setEventLogs((prev) => [logEntry, ...prev].slice(0, 50));
      setCounters((prev) => ({ ...prev, normal: prev.normal + 1 }));
    }, [])
  );

  useActionHandler(
    'throttledEvent',
    useCallback(async (payload, controller) => {
      const logEntry = {
        id: `throttle_${Date.now()}_${Math.random()}`,
        type: 'throttle' as const,
        timestamp: payload.timestamp,
        value: payload.value,
        delay: payload.delay,
      };

      setEventLogs((prev) => [logEntry, ...prev].slice(0, 50));
      setCounters((prev) => ({ ...prev, throttle: prev.throttle + 1 }));
    }, [])
  );

  useActionHandler(
    'debouncedEvent',
    useCallback(async (payload, controller) => {
      const logEntry = {
        id: `debounce_${Date.now()}_${Math.random()}`,
        type: 'debounce' as const,
        timestamp: payload.timestamp,
        value: payload.value,
        delay: payload.delay,
      };

      setEventLogs((prev) => [logEntry, ...prev].slice(0, 50));
      setCounters((prev) => ({ ...prev, debounce: prev.debounce + 1 }));
    }, [])
  );

  useActionHandler(
    'clearLogs',
    useCallback(async (_, controller) => {
      setEventLogs([]);
      setCounters({ normal: 0, throttle: 0, debounce: 0 });
      setPerformanceData([]);
    }, [])
  );

  useActionHandler(
    'testPerformance',
    useCallback(async (payload, controller) => {
      const startTime = performance.now();

      // 성능 테스트 시뮬레이션
      for (let i = 0; i < payload.operations; i++) {
        // 더미 계산
        Math.random() * 1000;
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      setPerformanceData((prev) =>
        [
          {
            type: payload.type,
            operations: payload.operations,
            duration,
            timestamp: Date.now(),
          },
          ...prev,
        ].slice(0, 20)
      );
    }, [])
  );

  // 이벤트 핸들러들
  const handleNormalEvent = useCallback(
    (value: string) => {
      dispatch('normalEvent', { timestamp: Date.now(), value });
    },
    [dispatch]
  );

  const handleThrottledEvent = useThrottle(
    useCallback(
      (value: string) => {
        dispatch('throttledEvent', {
          timestamp: Date.now(),
          value,
          delay: throttleDelay,
        });
      },
      [dispatch, throttleDelay]
    ),
    throttleDelay
  );

  const handleDebouncedEvent = useDebounce(
    useCallback(
      (value: string) => {
        dispatch('debouncedEvent', {
          timestamp: Date.now(),
          value,
          delay: debounceDelay,
        });
      },
      [dispatch, debounceDelay]
    ),
    debounceDelay
  );

  // 테스트 실행
  const runPerformanceTest = useCallback(
    (type: 'normal' | 'throttle' | 'debounce', operations: number) => {
      dispatch('testPerformance', { type, operations });
    },
    [dispatch]
  );

  // 자동 이벤트 생성기
  const startAutoEvents = useCallback(() => {
    let count = 0;
    const interval = setInterval(() => {
      const value = `Auto Event ${count++}`;
      handleNormalEvent(value);
      handleThrottledEvent(value);
      handleDebouncedEvent(value);

      if (count >= 20) {
        clearInterval(interval);
      }
    }, 50);
  }, [handleNormalEvent, handleThrottledEvent, handleDebouncedEvent]);

  return (
    <div className="space-y-6">
      {/* 컨트롤 패널 */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🎛️ 테스트 컨트롤
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 이벤트 설정 */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">이벤트 설정</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    스로틀 지연시간: {throttleDelay}ms
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="100"
                    value={throttleDelay}
                    onChange={(e) => setThrottleDelay(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    디바운스 지연시간: {debounceDelay}ms
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="100"
                    value={debounceDelay}
                    onChange={(e) => setDebounceDelay(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* 테스트 액션 */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">테스트 액션</h4>
              <div className="space-y-2">
                <button
                  onClick={startAutoEvents}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  🚀 자동 이벤트 생성 (20개)
                </button>

                <button
                  onClick={() => runPerformanceTest('normal', 1000)}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                >
                  📊 성능 테스트 실행
                </button>

                <button
                  onClick={() => dispatch('clearLogs')}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  🗑️ 로그 지우기
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 실시간 입력 테스트 */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ⌨️ 실시간 입력 테스트
          </h3>

          <div className="space-y-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                const value = e.target.value;
                setInputValue(value);

                // 3가지 방식으로 동시에 이벤트 처리
                handleNormalEvent(value);
                handleThrottledEvent(value);
                handleDebouncedEvent(value);
              }}
              placeholder="타이핑하면서 3가지 방식의 이벤트 처리를 비교해보세요..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="text-sm text-gray-600">
              타이핑할 때마다 일반/스로틀/디바운스 이벤트가 각각 다른 빈도로
              발생합니다.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 이벤트 카운터 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm text-gray-600 mb-2">
              🚀 일반 이벤트
            </h4>
            <div className="text-3xl font-bold text-red-600">
              {counters.normal}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              모든 이벤트 즉시 처리
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm text-gray-600 mb-2">
              ⏱️ 스로틀 이벤트
            </h4>
            <div className="text-3xl font-bold text-blue-600">
              {counters.throttle}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {throttleDelay}ms 간격 제한
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm text-gray-600 mb-2">
              🎯 디바운스 이벤트
            </h4>
            <div className="text-3xl font-bold text-green-600">
              {counters.debounce}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {debounceDelay}ms 대기 후 처리
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 이벤트 로그 */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📝 이벤트 로그
          </h3>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {eventLogs.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <div className="mb-2">📋</div>
                <div>이벤트 로그가 없습니다</div>
                <div className="text-sm">
                  위에서 타이핑하거나 자동 이벤트를 생성해보세요!
                </div>
              </div>
            ) : (
              eventLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg border-l-4 ${
                    {
                      normal: 'bg-red-50 border-l-red-500',
                      throttle: 'bg-blue-50 border-l-blue-500',
                      debounce: 'bg-green-50 border-l-green-500',
                    }[log.type]
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          {
                            normal: 'bg-red-500 text-white',
                            throttle: 'bg-blue-500 text-white',
                            debounce: 'bg-green-500 text-white',
                          }[log.type]
                        }`}
                      >
                        {
                          {
                            normal: '🚀 NORMAL',
                            throttle: '⏱️ THROTTLE',
                            debounce: '🎯 DEBOUNCE',
                          }[log.type]
                        }
                      </span>

                      <span className="font-mono text-sm truncate max-w-xs">
                        {log.value}
                      </span>

                      {log.delay && (
                        <span className="text-xs text-gray-500">
                          ({log.delay}ms)
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
        </CardContent>
      </Card>

      {/* 성능 비교 분석 */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📊 성능 분석
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-blue-600 mb-3">
                이벤트 처리 방식 비교
              </h4>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-red-50 rounded border border-red-200">
                  <div className="font-medium text-red-800">🚀 일반 이벤트</div>
                  <div className="text-red-700 mt-1">
                    • 모든 이벤트를 즉시 처리
                    <br />• 높은 CPU 사용량과 많은 API 호출
                    <br />• 실시간성이 중요한 경우 사용
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                  <div className="font-medium text-blue-800">⏱️ 스로틀링</div>
                  <div className="text-blue-700 mt-1">
                    • 지정된 간격으로만 이벤트 처리
                    <br />• 일정한 처리 빈도 보장
                    <br />• 스크롤, 리사이즈 이벤트에 적합
                  </div>
                </div>

                <div className="p-3 bg-green-50 rounded border border-green-200">
                  <div className="font-medium text-green-800">🎯 디바운싱</div>
                  <div className="text-green-700 mt-1">
                    • 이벤트 발생이 멈춘 후 지연시간 후 처리
                    <br />• 최종 결과만 처리하여 매우 효율적
                    <br />• 검색, 입력 완료 감지에 적합
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-green-600 mb-3">
                🛠️ 최적화 가이드라인
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>
                  • <strong>스크롤 이벤트</strong>: 200-300ms 스로틀링 권장
                </li>
                <li>
                  • <strong>검색 입력</strong>: 300-500ms 디바운싱 권장
                </li>
                <li>
                  • <strong>리사이즈</strong>: 100-200ms 스로틀링 권장
                </li>
                <li>
                  • <strong>API 호출</strong>: 500-1000ms 디바운싱 권장
                </li>
                <li>
                  • <strong>실시간 업데이트</strong>: 100ms 이하 스로틀링
                </li>
                <li>
                  • <strong>자동완성</strong>: 200-400ms 디바운싱
                </li>
                <li>
                  • <strong>폼 검증</strong>: 500ms 디바운싱
                </li>
                <li>
                  • <strong>마우스 이동</strong>: 16ms(60fps) 스로틀링
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ThrottleComparisonPage;
