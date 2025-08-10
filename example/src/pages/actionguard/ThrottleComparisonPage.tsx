import {
  type ActionPayloadMap,
  createActionContextPattern,
} from '@context-action/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PageWithLogMonitor,
  useActionLoggerWithToast,
} from '../../components/LogMonitor/';
import { Button, DemoCard } from '../../components/ui';

// 액션 타입 정의
interface ThrottleTestActions extends ActionPayloadMap {
  manualThrottle: { value: string; timestamp: number };
  internalThrottle: { value: string; timestamp: number };
}

// Action Context Pattern 생성
const ThrottleContext =
  createActionContextPattern<ThrottleTestActions>('ThrottleComparison');

// 수동 throttle 훅 (ActionGuardPage에서 가져온 것)
function useThrottle<T extends any[]>(
  callback: (...args: T) => void,
  delay: number
) {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: T) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;

      if (timeSinceLastCall >= delay) {
        lastCallRef.current = now;
        callback(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          callback(...args);
        }, delay - timeSinceLastCall);
      }
    },
    [callback, delay]
  );
}

// 메트릭 타입
interface ThrottleMetrics {
  totalCalls: number;
  throttledCalls: number;
  actualExecutions: number;
  lastExecutionTime: number;
  averageInterval: number;
}

function ThrottleComparisonTest() {
  const dispatch = ThrottleContext.useAction();
  const actionRegister = ThrottleContext.useActionRegister();
  const { logAction, logSystem } = useActionLoggerWithToast();

  // ActionRegister가 초기화되지 않은 경우 처리
  if (!actionRegister) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-gray-600">ActionRegister 초기화 중...</p>
        </div>
      </div>
    );
  }

  // 상태 관리
  const [inputValue, setInputValue] = useState('');
  const [isAutoTesting, setIsAutoTesting] = useState(false);
  const [testDuration, setTestDuration] = useState(5000); // 5초
  const [testInterval, setTestInterval] = useState(50); // 50ms마다 호출

  // 메트릭 상태
  const [manualMetrics, setManualMetrics] = useState<ThrottleMetrics>({
    totalCalls: 0,
    throttledCalls: 0,
    actualExecutions: 0,
    lastExecutionTime: 0,
    averageInterval: 0,
  });

  const [internalMetrics, setInternalMetrics] = useState<ThrottleMetrics>({
    totalCalls: 0,
    throttledCalls: 0,
    actualExecutions: 0,
    lastExecutionTime: 0,
    averageInterval: 0,
  });

  // 실행 시간 추적
  const manualExecutionTimes = useRef<number[]>([]);
  const internalExecutionTimes = useRef<number[]>([]);
  const autoTestInterval = useRef<NodeJS.Timeout>();

  // 수동 throttle 핸들러
  const manualThrottledHandler = useThrottle(
    (value: string, timestamp: number) => {
      const now = Date.now();
      manualExecutionTimes.current.push(now);

      // 평균 간격 계산
      let averageInterval = 0;
      if (manualExecutionTimes.current.length > 1) {
        const intervals = [];
        for (let i = 1; i < manualExecutionTimes.current.length; i++) {
          intervals.push(
            manualExecutionTimes.current[i] -
              manualExecutionTimes.current[i - 1]
          );
        }
        averageInterval =
          intervals.reduce((a, b) => a + b, 0) / intervals.length;
      }

      setManualMetrics((prev) => ({
        ...prev,
        actualExecutions: prev.actualExecutions + 1,
        lastExecutionTime: now,
        averageInterval: Math.round(averageInterval),
      }));

      logAction(
        'manualThrottle',
        { value, timestamp },
        {
          context: 'Manual Throttle',
          toast: { type: 'info', message: `수동 쓰로틀: ${value}` },
        }
      );
    },
    1000
  ); // 1초 throttle

  // 액션 핸들러 등록
  useEffect(() => {
    // 수동 throttle 액션
    const unregister1 = actionRegister.register(
      'manualThrottle',
      ({ value, timestamp }, controller) => {
        manualThrottledHandler(value, timestamp);
        controller.next();
      }
    );

    // 내장 throttle 액션
    const unregister2 = actionRegister.register(
      'internalThrottle',
      ({ value, timestamp }, controller) => {
        const now = Date.now();
        internalExecutionTimes.current.push(now);

        // 평균 간격 계산
        let averageInterval = 0;
        if (internalExecutionTimes.current.length > 1) {
          const intervals = [];
          for (let i = 1; i < internalExecutionTimes.current.length; i++) {
            intervals.push(
              internalExecutionTimes.current[i] -
                internalExecutionTimes.current[i - 1]
            );
          }
          averageInterval =
            intervals.reduce((a, b) => a + b, 0) / intervals.length;
        }

        setInternalMetrics((prev) => ({
          ...prev,
          actualExecutions: prev.actualExecutions + 1,
          lastExecutionTime: now,
          averageInterval: Math.round(averageInterval),
        }));

        logAction(
          'internalThrottle',
          { value, timestamp },
          {
            context: 'Internal Throttle',
            toast: { type: 'success', message: `내장 쓰로틀: ${value}` },
          }
        );

        controller.next();
      },
      { throttle: 1000 }
    ); // 1초 throttle

    return () => {
      unregister1();
      unregister2();
    };
  }, [actionRegister, manualThrottledHandler, logAction]);

  // 수동 테스트 함수들
  const handleManualCall = useCallback(() => {
    if (!dispatch || !actionRegister) return;

    const timestamp = Date.now();
    const value = inputValue || `manual-${timestamp}`;

    setManualMetrics((prev) => ({
      ...prev,
      totalCalls: prev.totalCalls + 1,
    }));

    try {
      dispatch('manualThrottle', { value, timestamp });
    } catch (error) {
      console.error('수동 호출 중 오류:', error);
    }
  }, [dispatch, actionRegister, inputValue]);

  const handleInternalCall = useCallback(() => {
    if (!dispatch || !actionRegister) return;

    const timestamp = Date.now();
    const value = inputValue || `internal-${timestamp}`;

    setInternalMetrics((prev) => ({
      ...prev,
      totalCalls: prev.totalCalls + 1,
    }));

    try {
      dispatch('internalThrottle', { value, timestamp });
    } catch (error) {
      console.error('내부 호출 중 오류:', error);
    }
  }, [dispatch, actionRegister, inputValue]);

  // 자동 테스트
  const startAutoTest = useCallback(() => {
    if (isAutoTesting || !dispatch || !actionRegister) return;

    setIsAutoTesting(true);
    logSystem(
      `자동 테스트 시작: ${testDuration}ms 동안 ${testInterval}ms 간격으로 호출`,
      {
        context: 'Throttle Comparison',
      }
    );

    let callCount = 0;
    const maxCalls = Math.floor(testDuration / testInterval);

    autoTestInterval.current = setInterval(() => {
      // 더 엄격한 안전성 검사
      if (!dispatch || !actionRegister || !actionRegister.dispatch) {
        console.error('ActionRegister 또는 dispatch 함수가 사용 불가능합니다.');
        stopAutoTest();
        return;
      }

      callCount++;
      const timestamp = Date.now();

      try {
        // 두 방식 모두 호출
        setManualMetrics((prev) => ({
          ...prev,
          totalCalls: prev.totalCalls + 1,
        }));
        setInternalMetrics((prev) => ({
          ...prev,
          totalCalls: prev.totalCalls + 1,
        }));

        // ActionRegister의 dispatch 메서드를 직접 호출
        actionRegister.dispatch('manualThrottle', {
          value: `auto-manual-${callCount}`,
          timestamp,
        });
        actionRegister.dispatch('internalThrottle', {
          value: `auto-internal-${callCount}`,
          timestamp,
        });
      } catch (error) {
        console.error('자동 테스트 중 오류 발생:', error);
        logSystem(
          `자동 테스트 오류: ${error instanceof Error ? error.message : String(error)}`,
          {
            context: 'Throttle Comparison',
          }
        );
        stopAutoTest();
        return;
      }

      if (callCount >= maxCalls) {
        stopAutoTest();
      }
    }, testInterval);

    // 테스트 종료 타이머
    setTimeout(() => {
      if (isAutoTesting) {
        stopAutoTest();
      }
    }, testDuration + 100);
  }, [
    dispatch,
    actionRegister,
    isAutoTesting,
    testDuration,
    testInterval,
    logSystem,
  ]);

  const stopAutoTest = useCallback(() => {
    setIsAutoTesting(false);
    if (autoTestInterval.current) {
      clearInterval(autoTestInterval.current);
    }

    logSystem('자동 테스트 완료', {
      context: 'Throttle Comparison',
      toast: { type: 'success', message: '자동 테스트 완료!' },
    });
  }, [logSystem]);

  const resetMetrics = useCallback(() => {
    setManualMetrics({
      totalCalls: 0,
      throttledCalls: 0,
      actualExecutions: 0,
      lastExecutionTime: 0,
      averageInterval: 0,
    });

    setInternalMetrics({
      totalCalls: 0,
      throttledCalls: 0,
      actualExecutions: 0,
      lastExecutionTime: 0,
      averageInterval: 0,
    });

    manualExecutionTimes.current = [];
    internalExecutionTimes.current = [];

    logSystem('메트릭 초기화', { context: 'Throttle Comparison' });
  }, [logSystem]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (autoTestInterval.current) {
        clearInterval(autoTestInterval.current);
      }
    };
  }, []);

  return (
    <div className="throttle-comparison">
      <header className="page-header">
        <h1>🔄 Throttle 구현 방식 비교</h1>
        <p className="page-description">
          수동으로 구현한 useThrottle 훅과 Context-Action 프레임워크의 내장
          throttle 기능을 비교해보세요. 두 방식 모두 1초 간격으로 throttle이
          적용됩니다.
        </p>
      </header>

      {/* 비교 메트릭 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <DemoCard variant="info">
          <h3 className="text-lg font-semibold mb-4">
            📊 수동 Throttle (useThrottle 훅)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="metric-item">
              <div className="metric-value">{manualMetrics.totalCalls}</div>
              <div className="metric-label">총 호출</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">
                {manualMetrics.actualExecutions}
              </div>
              <div className="metric-label">실제 실행</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">
                {manualMetrics.totalCalls > 0
                  ? `${((manualMetrics.actualExecutions / manualMetrics.totalCalls) * 100).toFixed(1)}%`
                  : '0%'}
              </div>
              <div className="metric-label">실행율</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">
                {manualMetrics.averageInterval > 0
                  ? `${manualMetrics.averageInterval}ms`
                  : '-'}
              </div>
              <div className="metric-label">평균 간격</div>
            </div>
          </div>
        </DemoCard>

        <DemoCard variant="info">
          <h3 className="text-lg font-semibold mb-4">
            ⚡ 내장 Throttle (ActionRegister 옵션)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="metric-item">
              <div className="metric-value">{internalMetrics.totalCalls}</div>
              <div className="metric-label">총 호출</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">
                {internalMetrics.actualExecutions}
              </div>
              <div className="metric-label">실제 실행</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">
                {internalMetrics.totalCalls > 0
                  ? `${((internalMetrics.actualExecutions / internalMetrics.totalCalls) * 100).toFixed(1)}%`
                  : '0%'}
              </div>
              <div className="metric-label">실행율</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">
                {internalMetrics.averageInterval > 0
                  ? `${internalMetrics.averageInterval}ms`
                  : '-'}
              </div>
              <div className="metric-label">평균 간격</div>
            </div>
          </div>
        </DemoCard>
      </div>

      {/* 테스트 컨트롤 */}
      <DemoCard className="mb-6">
        <h3 className="text-lg font-semibold mb-4">🎮 테스트 컨트롤</h3>

        {/* 입력값 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            테스트 값 (선택사항)
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="테스트할 값을 입력하세요..."
            className="text-input"
          />
        </div>

        {/* 수동 테스트 버튼 */}
        <div className="space-y-4">
          <div>
            <h4 className="text-md font-medium mb-2">수동 테스트</h4>
            <div className="button-group">
              <Button
                onClick={handleManualCall}
                variant="secondary"
                disabled={!dispatch || !actionRegister || isAutoTesting}
              >
                📊 수동 Throttle 호출
              </Button>
              <Button
                onClick={handleInternalCall}
                variant="primary"
                disabled={!dispatch || !actionRegister || isAutoTesting}
              >
                ⚡ 내장 Throttle 호출
              </Button>
              <Button onClick={resetMetrics} variant="outline">
                🔄 메트릭 초기화
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              빠르게 여러 번 클릭하여 throttle 동작을 확인해보세요.
            </p>
          </div>

          {/* 자동 테스트 설정 */}
          <div>
            <h4 className="text-md font-medium mb-2">자동 테스트 설정</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  테스트 지속 시간 (ms)
                </label>
                <input
                  type="number"
                  value={testDuration}
                  onChange={(e) => setTestDuration(Number(e.target.value))}
                  min="1000"
                  max="30000"
                  step="1000"
                  className="text-input"
                  disabled={isAutoTesting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  호출 간격 (ms)
                </label>
                <input
                  type="number"
                  value={testInterval}
                  onChange={(e) => setTestInterval(Number(e.target.value))}
                  min="10"
                  max="1000"
                  step="10"
                  className="text-input"
                  disabled={isAutoTesting}
                />
              </div>
            </div>
            <div className="button-group">
              <Button
                onClick={isAutoTesting ? stopAutoTest : startAutoTest}
                variant={isAutoTesting ? 'danger' : 'success'}
                disabled={!dispatch || !actionRegister}
              >
                {isAutoTesting ? '⏹️ 테스트 중지' : '▶️ 자동 테스트 시작'}
              </Button>
            </div>
            {isAutoTesting && (
              <div className="mt-3 p-3 bg-blue-50 rounded text-sm">
                <div className="flex items-center gap-2">
                  <div className="loading-spinner"></div>
                  <span>
                    자동 테스트 실행 중... ({testInterval}ms 간격으로{' '}
                    {testDuration}ms 동안)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </DemoCard>

      {/* 구현 방식 비교 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <DemoCard>
          <h3 className="text-lg font-semibold mb-4">
            🔧 수동 구현 (useThrottle)
          </h3>
          <div className="code-block">
            <pre className="text-sm">
              {`function useThrottle(callback, delay) {
  const lastCallRef = useRef(0);
  const timeoutRef = useRef();
  
  return useCallback((...args) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallRef.current;
    
    if (timeSinceLastCall >= delay) {
      lastCallRef.current = now;
      callback(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now();
        callback(...args);
      }, delay - timeSinceLastCall);
    }
  }, [callback, delay]);
};

// 사용법
const throttledHandler = useThrottle(handler, 1000);`}
            </pre>
          </div>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-yellow-600">⚠️</span>
              <span>수동으로 타이머 관리 필요</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-600">ℹ️</span>
              <span>메모리 누수 위험 (cleanup 필요)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>커스터마이징 가능</span>
            </div>
          </div>
        </DemoCard>

        <DemoCard>
          <h3 className="text-lg font-semibold mb-4">
            ⚡ 내장 구현 (ActionGuard)
          </h3>
          <div className="code-block">
            <pre className="text-sm">
              {`// ActionRegister 등록 시 옵션으로 설정
actionRegister.register('myAction', handler, {
  throttle: 1000  // 1초 throttle
});

// 또는 dispatch 시 옵션으로 설정
dispatch('myAction', payload, {
  throttle: 1000
});

// ActionGuard 클래스 내부 구현
throttle(actionKey: string, throttleMs: number): boolean {
  // ... 내부 상태 관리
  // ... 자동 메모리 정리
  // ... 최적화된 성능
  return shouldExecute;
}`}
            </pre>
          </div>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>자동 메모리 관리</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>프레임워크 통합</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>성능 최적화</span>
            </div>
          </div>
        </DemoCard>
      </div>

      {/* 성능 분석 */}
      <DemoCard variant="info">
        <h3 className="text-lg font-semibold mb-4">📈 성능 분석</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="analysis-item">
            <h4 className="font-semibold text-gray-900 mb-2">메모리 사용량</h4>
            <div className="space-y-1 text-sm">
              <div>• 수동: 각 컴포넌트마다 ref 생성</div>
              <div>• 내장: 중앙 집중식 관리</div>
              <div className="text-green-600 font-medium">
                → 내장 방식이 메모리 효율적
              </div>
            </div>
          </div>
          <div className="analysis-item">
            <h4 className="font-semibold text-gray-900 mb-2">타이머 관리</h4>
            <div className="space-y-1 text-sm">
              <div>• 수동: 수동 cleanup 필요</div>
              <div>• 내장: 자동 cleanup</div>
              <div className="text-green-600 font-medium">
                → 내장 방식이 안전함
              </div>
            </div>
          </div>
          <div className="analysis-item">
            <h4 className="font-semibold text-gray-900 mb-2">사용 편의성</h4>
            <div className="space-y-1 text-sm">
              <div>• 수동: 별도 훅 구현/관리</div>
              <div>• 내장: 옵션만 설정</div>
              <div className="text-green-600 font-medium">
                → 내장 방식이 간편함
              </div>
            </div>
          </div>
        </div>
      </DemoCard>

      {/* 결론 */}
      <DemoCard variant="info">
        <h3 className="text-lg font-semibold mb-4">💡 결론 및 권장사항</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Context-Action 내장 throttle을 권장하는 이유:
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✅</span>
                <span>
                  <strong>자동 메모리 관리:</strong> 컴포넌트 언마운트 시
                  자동으로 타이머 정리
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✅</span>
                <span>
                  <strong>중앙 집중식 관리:</strong> ActionGuard 클래스에서 모든
                  throttle 상태 관리
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✅</span>
                <span>
                  <strong>프레임워크 통합:</strong> 액션 시스템과 완벽하게
                  통합됨
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✅</span>
                <span>
                  <strong>성능 최적화:</strong> 불필요한 타이머 생성 방지
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✅</span>
                <span>
                  <strong>사용 편의성:</strong> 단일 옵션으로 간단 설정
                </span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 팁:</strong> 기존 수동 throttle 코드를 내장 throttle로
              마이그레이션하면 코드량 감소, 성능 향상, 메모리 누수 방지 등의
              이점을 얻을 수 있습니다.
            </p>
          </div>
        </div>
      </DemoCard>
    </div>
  );
}

// 페이지 래퍼
function ThrottleComparisonPage() {
  return (
    <PageWithLogMonitor
      pageId="throttle-comparison"
      title="Throttle Implementation Comparison"
      initialConfig={{ enableToast: true, maxLogs: 150 }}
    >
      <ThrottleContext.Provider registryId="throttle-comparison">
        <ThrottleComparisonTest />
      </ThrottleContext.Provider>
    </PageWithLogMonitor>
  );
}

export default ThrottleComparisonPage;

// 스타일 추가
const styles = `
  .metric-item {
    text-align: center;
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    background: #f9fafb;
  }
  
  .metric-value {
    font-size: 1.5rem;
    font-weight: bold;
    color: #1f2937;
    margin-bottom: 0.25rem;
  }
  
  .metric-label {
    font-size: 0.75rem;
    color: #6b7280;
    text-transform: uppercase;
    font-weight: 500;
  }
  
  .code-block {
    background: #1f2937;
    color: #e5e7eb;
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
  }
  
  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .analysis-item {
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    background: #f9fafb;
  }
`;

// DOM에 스타일 추가
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}
