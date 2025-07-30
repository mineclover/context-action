import { type ActionPayloadMap, ActionRegister } from '@context-action/core';
import { useCallback, useEffect, useRef, useState } from 'react';

// 성능 테스트용 액션 맵
interface PerformanceActionMap extends ActionPayloadMap {
  incrementCounter: number; // 카운터 ID
  batchIncrement: { startId: number; count: number };
  stressTest: { iterations: number; concurrent: boolean };
  memoryTest: { objectCount: number };
  subscriptionTest: { handlerCount: number };
  cleanupTest: undefined;
}

// 성능 메트릭 타입
interface PerformanceMetrics {
  actionCount: number;
  averageExecutionTime: number;
  maxExecutionTime: number;
  minExecutionTime: number;
  memoryUsage: number;
  handlerCount: number;
  lastBenchmarkResults: BenchmarkResult[];
}

interface BenchmarkResult {
  testName: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  opsPerSecond: number;
  timestamp: string;
}

function CorePerformanceContent() {
  const [counters, setCounters] = useState<Record<number, number>>({});
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    actionCount: 0,
    averageExecutionTime: 0,
    maxExecutionTime: 0,
    minExecutionTime: 0,
    memoryUsage: 0,
    handlerCount: 0,
    lastBenchmarkResults: [],
  });
  const [isRunning, setIsRunning] = useState(false);
  const [testProgress, setTestProgress] = useState(0);

  const actionRegisterRef = useRef<ActionRegister<PerformanceActionMap> | null>(
    null
  );
  const executionTimesRef = useRef<number[]>([]);
  const memoryObjectsRef = useRef<any[]>([]);

  // 실행 시간 측정 함수
  const measureExecutionTime = useCallback(<T,>(fn: () => T): [T, number] => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    const duration = end - start;

    executionTimesRef.current.push(duration);

    // 메트릭 업데이트
    setMetrics((prev) => {
      const times = executionTimesRef.current;
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      return {
        ...prev,
        actionCount: prev.actionCount + 1,
        averageExecutionTime: avgTime,
        maxExecutionTime: maxTime,
        minExecutionTime: minTime,
      };
    });

    return [result, duration];
  }, []);

  // ActionRegister 초기화
  useEffect(() => {
    const actionRegister = new ActionRegister<PerformanceActionMap>();
    actionRegisterRef.current = actionRegister;

    // 기본 카운터 핸들러
    actionRegister.register(
      'incrementCounter',
      (counterId) => {
        const [, executionTime] = measureExecutionTime(() => {
          setCounters((prev) => ({
            ...prev,
            [counterId]: (prev[counterId] || 0) + 1,
          }));
        });
      },
      { priority: 1 }
    );

    // 배치 증가 핸들러
    actionRegister.register(
      'batchIncrement',
      ({ startId, count }) => {
        const [, executionTime] = measureExecutionTime(() => {
          setCounters((prev) => {
            const newCounters = { ...prev };
            for (let i = 0; i < count; i++) {
              const id = startId + i;
              newCounters[id] = (newCounters[id] || 0) + 1;
            }
            return newCounters;
          });
        });
      },
      { priority: 1 }
    );

    // 스트레스 테스트 핸들러
    actionRegister.register(
      'stressTest',
      async ({ iterations, concurrent }) => {
        setIsRunning(true);
        setTestProgress(0);

        const startTime = performance.now();

        if (concurrent) {
          // 동시 실행
          const promises = Array.from({ length: iterations }, (_, i) => {
            return new Promise<void>((resolve) => {
              setTimeout(() => {
                actionRegister.dispatch('incrementCounter', i % 10);
                setTestProgress((prev) => prev + 1);
                resolve();
              }, Math.random() * 10);
            });
          });
          await Promise.all(promises);
        } else {
          // 순차 실행
          for (let i = 0; i < iterations; i++) {
            actionRegister.dispatch('incrementCounter', i % 10);
            setTestProgress(i + 1);

            // UI 업데이트를 위한 짧은 대기
            if (i % 100 === 0) {
              await new Promise((resolve) => setTimeout(resolve, 1));
            }
          }
        }

        const endTime = performance.now();
        const totalTime = endTime - startTime;
        const avgTime = totalTime / iterations;
        const opsPerSecond = (iterations / totalTime) * 1000;

        const result: BenchmarkResult = {
          testName: concurrent
            ? 'Concurrent Stress Test'
            : 'Sequential Stress Test',
          iterations,
          totalTime,
          averageTime: avgTime,
          opsPerSecond,
          timestamp: new Date().toLocaleTimeString(),
        };

        setMetrics((prev) => ({
          ...prev,
          lastBenchmarkResults: [result, ...prev.lastBenchmarkResults].slice(
            0,
            5
          ),
        }));

        setIsRunning(false);
        setTestProgress(0);
      },
      { priority: 1 }
    );

    // 메모리 테스트 핸들러
    actionRegister.register(
      'memoryTest',
      ({ objectCount }) => {
        const [, executionTime] = measureExecutionTime(() => {
          // 대량의 객체 생성 및 저장
          const objects = Array.from({ length: objectCount }, (_, i) => ({
            id: i,
            data: `Test data ${i}`,
            timestamp: Date.now(),
            randomValue: Math.random(),
          }));

          memoryObjectsRef.current.push(...objects);

          // 대략적인 메모리 사용량 계산 (객체당 ~100바이트 추정)
          const estimatedMemory = memoryObjectsRef.current.length * 100;

          setMetrics((prev) => ({
            ...prev,
            memoryUsage: estimatedMemory,
          }));
        });
      },
      { priority: 1 }
    );

    // 구독 테스트 핸들러
    actionRegister.register(
      'subscriptionTest',
      ({ handlerCount }) => {
        const [, executionTime] = measureExecutionTime(() => {
          // 동적으로 다수의 핸들러 등록
          for (let i = 0; i < handlerCount; i++) {
            actionRegister.register(
              'incrementCounter',
              (counterId) => {
                // 추가 로직 없이 더미 핸들러
              },
              { priority: 0 }
            );
          }

          setMetrics((prev) => ({
            ...prev,
            handlerCount: prev.handlerCount + handlerCount,
          }));
        });
      },
      { priority: 1 }
    );

    // 정리 핸들러
    actionRegister.register(
      'cleanupTest',
      () => {
        const [, executionTime] = measureExecutionTime(() => {
          memoryObjectsRef.current = [];
          executionTimesRef.current = [];
          setCounters({});
          setMetrics((prev) => ({
            ...prev,
            actionCount: 0,
            memoryUsage: 0,
            handlerCount: 0,
            averageExecutionTime: 0,
            maxExecutionTime: 0,
            minExecutionTime: 0,
          }));
        });
      },
      { priority: 1 }
    );

    return () => {
      // Note: ActionRegister doesn't have cleanup method yet
      console.log('ActionRegister cleaned up');
    };
  }, [measureExecutionTime]);

  const dispatch = (
    action: keyof PerformanceActionMap,
    payload?: PerformanceActionMap[keyof PerformanceActionMap]
  ) => {
    if (actionRegisterRef.current) {
      actionRegisterRef.current.dispatch(action, payload);
    }
  };

  const runBenchmark = async (testType: 'light' | 'medium' | 'heavy') => {
    const configs = {
      light: { iterations: 1000, concurrent: false },
      medium: { iterations: 5000, concurrent: false },
      heavy: { iterations: 10000, concurrent: true },
    };

    const config = configs[testType];
    dispatch('stressTest', config);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / k ** i).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div>
      <h1>Core Library - Performance</h1>
      <p>
        성능 최적화와 벤치마크를 다룹니다: 대량 액션 처리, 메모리 효율성, 실행
        속도 측정, 구독/해제 성능 등을 실시간으로 모니터링하고 비교할 수
        있습니다.
      </p>

      {/* Performance Metrics Dashboard */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginTop: '30px',
        }}
      >
        <div
          style={{
            padding: '15px',
            border: '2px solid #007bff',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>
            📊 Total Actions
          </h4>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {metrics.actionCount}
          </div>
        </div>

        <div
          style={{
            padding: '15px',
            border: '2px solid #28a745',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <h4 style={{ margin: '0 0 10px 0', color: '#28a745' }}>
            ⚡ Avg Time
          </h4>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {metrics.averageExecutionTime.toFixed(3)}ms
          </div>
        </div>

        <div
          style={{
            padding: '15px',
            border: '2px solid #ffc107',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <h4 style={{ margin: '0 0 10px 0', color: '#fd7e14' }}>🧠 Memory</h4>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {formatBytes(metrics.memoryUsage)}
          </div>
        </div>

        <div
          style={{
            padding: '15px',
            border: '2px solid #17a2b8',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <h4 style={{ margin: '0 0 10px 0', color: '#17a2b8' }}>
            🎯 Handlers
          </h4>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {metrics.handlerCount}
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginTop: '30px',
        }}
      >
        {/* Basic Performance Tests */}
        <div
          style={{
            padding: '20px',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
          }}
        >
          <h3>🏃‍♂️ Basic Performance Tests</h3>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
          >
            <button
              onClick={() =>
                dispatch('incrementCounter', Math.floor(Math.random() * 10))
              }
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
              }}
            >
              Single Action
            </button>

            <button
              onClick={() =>
                dispatch('batchIncrement', { startId: 0, count: 100 })
              }
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
              }}
            >
              Batch 100 Actions
            </button>

            <button
              onClick={() => dispatch('memoryTest', { objectCount: 1000 })}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ffc107',
                color: 'black',
                border: 'none',
                borderRadius: '4px',
              }}
            >
              Memory Test (1K objects)
            </button>

            <button
              onClick={() => dispatch('subscriptionTest', { handlerCount: 50 })}
              style={{
                padding: '8px 16px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
              }}
            >
              Add 50 Handlers
            </button>
          </div>
        </div>

        {/* Benchmark Tests */}
        <div
          style={{
            padding: '20px',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
          }}
        >
          <h3>🔥 Benchmark Tests</h3>

          {isRunning && (
            <div style={{ marginBottom: '15px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '5px',
                }}
              >
                <span>Running benchmark...</span>
                <span>{testProgress}</span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: '#e9ecef',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${(testProgress / 10000) * 100}%`,
                    height: '100%',
                    backgroundColor: '#007bff',
                    transition: 'width 0.2s',
                  }}
                />
              </div>
            </div>
          )}

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
          >
            <button
              onClick={() => runBenchmark('light')}
              disabled={isRunning}
              style={{
                padding: '8px 16px',
                backgroundColor: isRunning ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isRunning ? 'not-allowed' : 'pointer',
              }}
            >
              Light Test (1K actions)
            </button>

            <button
              onClick={() => runBenchmark('medium')}
              disabled={isRunning}
              style={{
                padding: '8px 16px',
                backgroundColor: isRunning ? '#6c757d' : '#fd7e14',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isRunning ? 'not-allowed' : 'pointer',
              }}
            >
              Medium Test (5K actions)
            </button>

            <button
              onClick={() => runBenchmark('heavy')}
              disabled={isRunning}
              style={{
                padding: '8px 16px',
                backgroundColor: isRunning ? '#6c757d' : '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isRunning ? 'not-allowed' : 'pointer',
              }}
            >
              Heavy Test (10K concurrent)
            </button>

            <button
              onClick={() => dispatch('cleanupTest')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
              }}
            >
              🧹 Cleanup All
            </button>
          </div>
        </div>
      </div>

      {/* Counter Display */}
      {Object.keys(counters).length > 0 && (
        <div
          style={{
            marginTop: '30px',
            padding: '20px',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
          }}
        >
          <h3>🔢 Counter Values</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: '10px',
              maxHeight: '200px',
              overflow: 'auto',
            }}
          >
            {Object.entries(counters).map(([id, count]) => (
              <div
                key={id}
                style={{
                  padding: '10px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  textAlign: 'center',
                  fontSize: '12px',
                }}
              >
                <div style={{ fontWeight: 'bold' }}>#{id}</div>
                <div style={{ color: '#007bff' }}>{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Benchmark Results */}
      {metrics.lastBenchmarkResults.length > 0 && (
        <div
          style={{
            marginTop: '30px',
            padding: '20px',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
          }}
        >
          <h3>📈 Benchmark Results</h3>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '12px',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th
                    style={{
                      padding: '8px',
                      border: '1px solid #dee2e6',
                      textAlign: 'left',
                    }}
                  >
                    Test Name
                  </th>
                  <th
                    style={{
                      padding: '8px',
                      border: '1px solid #dee2e6',
                      textAlign: 'right',
                    }}
                  >
                    Iterations
                  </th>
                  <th
                    style={{
                      padding: '8px',
                      border: '1px solid #dee2e6',
                      textAlign: 'right',
                    }}
                  >
                    Total Time
                  </th>
                  <th
                    style={{
                      padding: '8px',
                      border: '1px solid #dee2e6',
                      textAlign: 'right',
                    }}
                  >
                    Avg Time
                  </th>
                  <th
                    style={{
                      padding: '8px',
                      border: '1px solid #dee2e6',
                      textAlign: 'right',
                    }}
                  >
                    Ops/Sec
                  </th>
                  <th
                    style={{
                      padding: '8px',
                      border: '1px solid #dee2e6',
                      textAlign: 'left',
                    }}
                  >
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {metrics.lastBenchmarkResults.map((result, index) => (
                  <tr key={index}>
                    <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                      {result.testName}
                    </td>
                    <td
                      style={{
                        padding: '8px',
                        border: '1px solid #dee2e6',
                        textAlign: 'right',
                      }}
                    >
                      {result.iterations.toLocaleString()}
                    </td>
                    <td
                      style={{
                        padding: '8px',
                        border: '1px solid #dee2e6',
                        textAlign: 'right',
                      }}
                    >
                      {result.totalTime.toFixed(2)}ms
                    </td>
                    <td
                      style={{
                        padding: '8px',
                        border: '1px solid #dee2e6',
                        textAlign: 'right',
                      }}
                    >
                      {result.averageTime.toFixed(4)}ms
                    </td>
                    <td
                      style={{
                        padding: '8px',
                        border: '1px solid #dee2e6',
                        textAlign: 'right',
                      }}
                    >
                      {Math.round(result.opsPerSecond).toLocaleString()}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                      {result.timestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Performance Tips */}
      <div
        style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
        }}
      >
        <h3>🚀 Performance Optimization Tips</h3>
        <pre style={{ overflow: 'auto', fontSize: '14px' }}>
          {`// 1. 배치 처리로 성능 개선
// 나쁜 예: 개별 액션들
for (let i = 0; i < 1000; i++) {
  dispatch('increment', i);
}

// 좋은 예: 배치 액션
dispatch('batchIncrement', { startId: 0, count: 1000 });

// 2. 핸들러 우선순위 최적화
register('criticalAction', handler, { priority: 10 }); // 높은 우선순위
register('backgroundTask', handler, { priority: 1 });  // 낮은 우선순위

// 3. 메모리 효율적인 핸들러
register('efficientHandler', (payload) => {
  // 필요한 최소한의 상태만 업데이트
  setState(prev => ({ ...prev, [payload.key]: payload.value }));
}, { priority: 1 });

// 4. 비동기 작업 최적화
register('asyncAction', async (payload) => {
  // 병렬 처리
  const results = await Promise.all([
    api.call1(payload),
    api.call2(payload),
  ]);
  
  // 결과 처리
  dispatch('processResults', results);
}, { priority: 1 });

// 5. 정리 작업
useEffect(() => {
  return () => {
    actionRegister.cleanup(); // 메모리 해제
  };
}, []);`}
        </pre>
      </div>
    </div>
  );
}

export function CorePerformancePage() {
  return <CorePerformanceContent />;
}
