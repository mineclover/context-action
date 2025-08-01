import { type ActionPayloadMap, ActionRegister } from '@context-action/core';
import { useCallback, useEffect, useRef, useState } from 'react';

// 고급 액션 맵 정의
interface AdvancedActionMap extends ActionPayloadMap {
  increment: undefined;
  decrement: undefined;
  multiply: number;
  reset: undefined;
  logAction: string;
  chainedAction: { step: number; data: string };
  conditionalAction: { condition: boolean; value: number };
  delayedAction: { delay: number; message: string };
  errorAction: undefined;
}

// 로그 타입 정의
interface LogEntry {
  id: string;
  timestamp: string;
  type: 'action' | 'middleware' | 'error' | 'interceptor';
  message: string;
  priority?: number;
}

// 미들웨어 타입 정의
type Middleware<T extends ActionPayloadMap> = (
  action: keyof T,
  payload: T[keyof T],
  next: () => void | Promise<void>
) => void | Promise<void>;

/**
 * Advanced core functionality demonstration with priority-based execution
 * @implements priority-based-execution
 * @memberof api-terms
 * @implements async-operations
 * @memberof api-terms
 * @implements business-logic
 * @memberof core-concepts
 */
function CoreAdvancedContent() {
  const [count, setCount] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isMiddlewareEnabled, setIsMiddlewareEnabled] = useState(true);
  const [conditionValue, setConditionValue] = useState(true);
  const actionRegisterRef = useRef<ActionRegister<AdvancedActionMap> | null>(
    null
  );

  // 로그 추가 함수
  const addLog = useCallback(
    (type: LogEntry['type'], message: string, priority?: number) => {
      const newLog: LogEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
        priority,
      };
      setLogs((prev) => [newLog, ...prev].slice(0, 20)); // 최근 20개만 유지
    },
    []
  );

  // 미들웨어 정의들
  const loggingMiddleware: Middleware<AdvancedActionMap> = useCallback(
    (action, payload, next) => {
      addLog(
        'middleware',
        `🔍 Pre-execution: ${String(action)} with payload: ${JSON.stringify(payload)}`
      );
      next();
      addLog('middleware', `✅ Post-execution: ${String(action)} completed`);
    },
    [addLog]
  );

  const authenticationMiddleware: Middleware<AdvancedActionMap> = useCallback(
    (action, _payload, next) => {
      // 인증이 필요한 액션들
      const protectedActions = ['reset', 'multiply'];

      if (protectedActions.includes(String(action))) {
        addLog('middleware', `🔐 Authentication check for ${String(action)}`);
        // 시뮬레이션: 항상 인증 통과
        if (Math.random() > 0.1) {
          // 90% 확률로 성공
          addLog(
            'middleware',
            `✅ Authentication passed for ${String(action)}`
          );
          next();
        } else {
          addLog(
            'middleware',
            `❌ Authentication failed for ${String(action)}`
          );
          addLog('error', `Access denied for ${String(action)}`);
          return;
        }
      } else {
        next();
      }
    },
    [addLog]
  );

  const validationMiddleware: Middleware<AdvancedActionMap> = useCallback(
    (action, payload, next) => {
      let isValid = true;

      if (action === 'multiply' && typeof payload === 'number') {
        if (payload < 1 || payload > 10) {
          isValid = false;
          addLog(
            'error',
            `Validation failed: multiply value must be between 1 and 10, got ${payload}`
          );
        }
      }

      if (
        action === 'conditionalAction' &&
        typeof payload === 'object' &&
        payload !== null
      ) {
        const { value } = payload as { value: number };
        if (value < 0) {
          isValid = false;
          addLog(
            'error',
            `Validation failed: conditional action value cannot be negative, got ${value}`
          );
        }
      }

      if (isValid) {
        addLog('middleware', `✅ Validation passed for ${String(action)}`);
        next();
      } else {
        addLog('error', `❌ Validation failed for ${String(action)}`);
      }
    },
    [addLog]
  );

  // ActionRegister 초기화
  useEffect(() => {
    const actionRegister = new ActionRegister<AdvancedActionMap>();
    actionRegisterRef.current = actionRegister;

    // 미들웨어 등록
    // 아직 구현되지 않은 기능임 미들웨어 타입을 보면, 특정 action에 대한 로깅을 한다는 것을 알 수 있음
    // actionRegister.use('logging', loggingMiddleware, { priority: 0 });
    // actionRegister.use('authentication', authenticationMiddleware, { priority: 0 });
    // actionRegister.use('validation', validationMiddleware, { priority: 0 });

    // 기본 핸들러들 등록
    actionRegister.register(
      'increment',
      () => {
        setCount((prev) => prev + 1);
        addLog('action', 'Counter incremented', 1);
      },
      { priority: 1 }
    );

    actionRegister.register(
      'decrement',
      () => {
        setCount((prev) => prev - 1);
        addLog('action', 'Counter decremented', 1);
      },
      { priority: 1 }
    );

    actionRegister.register(
      'multiply',
      (factor) => {
        setCount((prev) => prev * factor);
        addLog('action', `Counter multiplied by ${factor}`, 2);
      },
      { priority: 2 }
    );

    actionRegister.register(
      'reset',
      () => {
        setCount(0);
        addLog('action', 'Counter reset', 3);
      },
      { priority: 3 }
    );

    // 로깅 전용 핸들러
    actionRegister.register(
      'logAction',
      (message) => {
        addLog('action', `Custom log: ${message}`, 0);
      },
      { priority: 0 }
    );

    // 체이닝 액션 핸들러
    actionRegister.register(
      'chainedAction',
      async ({ step, data }) => {
        addLog('action', `Chain step ${step}: ${data}`, 1);

        if (step < 3) {
          // 다음 단계로 체이닝
          await new Promise((resolve) => setTimeout(resolve, 500));
          actionRegister.dispatch('chainedAction', {
            step: step + 1,
            data: `${data} -> Step ${step + 1}`,
          });
        } else {
          addLog('action', 'Chain completed!', 1);
        }
      },
      { priority: 1 }
    );

    // 조건부 액션 핸들러
    actionRegister.register(
      'conditionalAction',
      ({ condition, value }) => {
        if (condition) {
          setCount((prev) => prev + value);
          addLog('action', `Conditional action executed: +${value}`, 1);
        } else {
          addLog(
            'action',
            `Conditional action skipped (condition: ${condition})`,
            1
          );
        }
      },
      { priority: 1 }
    );

    // 지연 액션 핸들러
    actionRegister.register(
      'delayedAction',
      async ({ delay, message }) => {
        addLog(
          'action',
          `Delayed action started: ${message} (${delay}ms delay)`,
          1
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        addLog('action', `Delayed action completed: ${message}`, 1);
      },
      { priority: 1 }
    );

    // 에러 발생 액션 핸들러
    actionRegister.register(
      'errorAction',
      () => {
        addLog('action', 'Error action triggered', 1);
        throw new Error('Intentional error for testing');
      },
      { priority: 1 }
    );

    return () => {
      // Note: ActionRegister doesn't have cleanup method yet
      addLog('action', 'ActionRegister cleaned up');
    };
  }, [
    addLog,
    loggingMiddleware,
    authenticationMiddleware,
    validationMiddleware,
  ]);

  // 미들웨어 시뮬레이션 (실제 ActionRegister에서는 아직 미지원)
  useEffect(() => {
    if (!actionRegisterRef.current) return;

    if (isMiddlewareEnabled) {
      addLog(
        'middleware',
        '🔧 Middleware simulation enabled (logging, auth, validation)'
      );
    } else {
      addLog('middleware', '🔧 Middleware simulation disabled');
    }
  }, [isMiddlewareEnabled, addLog]);

  const dispatch = (
    action: keyof AdvancedActionMap,
    payload?: AdvancedActionMap[keyof AdvancedActionMap]
  ) => {
    if (actionRegisterRef.current) {
      try {
        actionRegisterRef.current.dispatch(action, payload);
      } catch (error) {
        addLog(
          'error',
          `Dispatch error: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>
            🚀 Core Library - Advanced
          </h1>
          <span style={{
            marginLeft: '12px',
            padding: '4px 12px',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: '#fce4ec',
            color: '#c2185b',
            borderRadius: '12px'
          }}>
            고급
          </span>
        </div>
        <p style={{ 
          fontSize: '16px', 
          color: '#64748b', 
          lineHeight: '1.6',
          marginBottom: '20px'
        }}>
          복잡한 액션 파이프라인과 고급 패턴으로 엔터프라이즈급 시스템 구현을 데모로 체험해보세요.
        </p>

        <div style={{
          backgroundColor: '#f8fafc',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
            🎯 이 데모에서 배우는 핵심 개념
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '16px',
            fontSize: '14px'
          }}>
            <div>
              <strong style={{ color: '#0f172a' }}>우선순위 실행:</strong>
              <div style={{ color: '#64748b', marginTop: '4px' }}>
                priority 옵션으로 핸들러 실행 순서 정밀 제어
              </div>
            </div>
            <div>
              <strong style={{ color: '#0f172a' }}>미들웨어 패턴:</strong>
              <div style={{ color: '#64748b', marginTop: '4px' }}>
                인증, 로깅, 검증 등 횡단 관심사 분리
              </div>
            </div>
            <div>
              <strong style={{ color: '#0f172a' }}>액션 체이닝:</strong>
              <div style={{ color: '#64748b', marginTop: '4px' }}>
                비동기 액션 연결로 복잡한 워크플로우 구현
              </div>
            </div>
            <div>
              <strong style={{ color: '#0f172a' }}>에러 핸들링:</strong>
              <div style={{ color: '#64748b', marginTop: '4px' }}>
                예외 상황 처리와 복구 패턴
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Counter Display */}
        <div style={{
          padding: '24px',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          backgroundColor: 'white',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              🎮 인터랙티브 데모
            </h3>
          </div>
          <p style={{ 
            color: '#64748b', 
            fontSize: '14px', 
            marginBottom: '20px',
            lineHeight: '1.5'
          }}>
            우선순위 기반 실행과 미들웨어 패턴을 실시간으로 체험해보세요.
          </p>
          
          <div style={{
            fontSize: '28px',
            fontWeight: 'bold',
            margin: '20px 0',
            color: '#1e293b',
            textAlign: 'center',
            padding: '16px',
            backgroundColor: '#f1f5f9',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '16px', fontWeight: 'normal', marginBottom: '8px', color: '#64748b' }}>
              현재 카운트
            </div>
            {count}
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <button
              type="button"
              onClick={() => dispatch('increment')}
              style={{
                padding: '10px 18px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              ➕ +1
            </button>

            <button
              type="button"
              onClick={() => dispatch('decrement')}
              style={{
                padding: '10px 18px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              ➖ -1
            </button>

            <button
              type="button"
              onClick={() => dispatch('multiply', 2)}
              style={{
                padding: '10px 18px',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              ✖️ ×2
            </button>

            <button
              type="button"
              onClick={() => dispatch('reset')}
              style={{
                padding: '10px 18px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              🔄 Reset
            </button>
          </div>

          <div style={{
            backgroundColor: '#f1f5f9',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#1e293b'
            }}>
              <input
                type="checkbox"
                checked={isMiddlewareEnabled}
                onChange={(e) => setIsMiddlewareEnabled(e.target.checked)}
                style={{ transform: 'scale(1.2)' }}
              />
              🛡️ 미들웨어 시뮬레이션 활성화
            </label>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', paddingLeft: '28px' }}>
              인증, 로깅, 검증 미들웨어 동작을 시뮬레이션합니다
            </div>
          </div>
        </div>

        {/* Advanced Actions */}
        <div style={{
          padding: '24px',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          backgroundColor: 'white',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              🚀 고급 액션 패턴
            </h3>
          </div>
          <p style={{ 
            color: '#64748b', 
            fontSize: '14px', 
            marginBottom: '20px',
            lineHeight: '1.5'
          }}>
            체이닝, 조건부 실행, 비동기 처리, 에러 핸들링 등 복잡한 패턴을 체험해보세요.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button
              type="button"
              onClick={() =>
                dispatch('chainedAction', { step: 1, data: 'Start' })
              }
              style={{
                padding: '12px 20px',
                backgroundColor: '#06b6d4',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              🔗 액션 체이닝 시작
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: '#fffbeb',
              borderRadius: '8px',
              border: '1px solid #fbbf24'
            }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#92400e'
              }}>
                조건 설정:
              </label>
              <input
                type="checkbox"
                checked={conditionValue}
                onChange={(e) => setConditionValue(e.target.checked)}
                style={{ transform: 'scale(1.2)' }}
              />
              <button
                type="button"
                onClick={() =>
                  dispatch('conditionalAction', {
                    condition: conditionValue,
                    value: 5,
                  })
                }
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              >
                🔀 조건부 실행 (+5)
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                dispatch('delayedAction', {
                  delay: 2000,
                  message: 'Delayed message',
                })
              }
              style={{
                padding: '12px 20px',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              ⏱️ 지연 액션 (2초)
            </button>

            <button
              type="button"
              onClick={() => dispatch('logAction', 'Custom message from user')}
              style={{
                padding: '12px 20px',
                backgroundColor: '#64748b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              📝 커스텀 로그
            </button>

            <button
              type="button"
              onClick={() => dispatch('errorAction')}
              style={{
                padding: '12px 20px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              💥 에러 발생 테스트
            </button>
          </div>
        </div>
      </div>

      {/* Logs Display */}
      <div style={{
        padding: '24px',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        backgroundColor: 'white',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        marginBottom: '32px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              📊 실시간 액션 로그
            </h3>
            <span style={{
              marginLeft: '8px',
              padding: '2px 8px',
              fontSize: '12px',
              backgroundColor: '#f1f5f9',
              color: '#475569',
              borderRadius: '6px',
              fontWeight: '500'
            }}>
              {logs.length}개 항목
            </span>
          </div>
          <button
            type="button"
            onClick={clearLogs}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            🗑️ 로그 지우기
          </button>
        </div>

        <div style={{
          backgroundColor: '#1e293b',
          color: '#e2e8f0',
          padding: '16px',
          borderRadius: '8px',
          fontSize: '13px',
          fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
          marginBottom: '16px',
          border: '1px solid #334155',
          maxHeight: '340px',
          overflow: 'auto'
        }}>
          {logs.length === 0 ? (
            <div style={{ color: '#64748b', fontStyle: 'italic' }}>
              {'>'} 액션을 실행하면 로그가 표시됩니다...
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                style={{
                  marginBottom: '6px',
                  lineHeight: '1.4'
                }}
              >
                <span style={{ color: '#64748b' }}>[{log.timestamp}]</span>
                {log.priority !== undefined && (
                  <span style={{ color: '#3b82f6', marginLeft: '8px' }}>
                    [P{log.priority}]
                  </span>
                )}
                <span style={{
                  marginLeft: '8px',
                  color: log.type === 'error' ? '#ef4444' : 
                        log.type === 'middleware' ? '#06b6d4' : 
                        log.type === 'interceptor' ? '#f59e0b' : '#10b981'
                }}>
                  <span style={{ color: '#10b981' }}>{'>'}</span> {log.message}
                </span>
              </div>
            ))
          )}
        </div>

        <div style={{
          backgroundColor: '#f1f5f9',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '13px'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '8px', color: '#1e293b' }}>
            🔍 로그 색상 가이드:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', color: '#475569' }}>
            <div><span style={{ color: '#10b981' }}>●</span> 액션 실행</div>
            <div><span style={{ color: '#06b6d4' }}>●</span> 미들웨어</div>
            <div><span style={{ color: '#f59e0b' }}>●</span> 인터셉터</div>
            <div><span style={{ color: '#ef4444' }}>●</span> 에러</div>
          </div>
        </div>
      </div>

      {/* 동작 원리 설명 */}
      <div style={{
        padding: '32px',
        backgroundColor: '#f8fafc',
        borderRadius: '16px',
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ 
          margin: '0 0 24px 0', 
          fontSize: '24px', 
          fontWeight: '700',
          color: '#1e293b'
        }}>
          🔍 고급 패턴 동작 원리
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* 1단계: 우선순위 시스템 */}
          <div style={{
            padding: '24px',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '16px' 
            }}>
              <span style={{ 
                fontSize: '20px',
                marginRight: '8px'
              }}>1️⃣</span>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                우선순위 기반 핸들러 실행
              </h3>
            </div>
            <p style={{ 
              color: '#64748b', 
              fontSize: '14px', 
              marginBottom: '12px',
              lineHeight: '1.5'
            }}>
              priority 옵션으로 핸들러 실행 순서를 정밀하게 제어할 수 있습니다.
            </p>
            <pre style={{
              backgroundColor: '#f1f5f9',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '12px',
              overflow: 'auto',
              color: '#1e293b'
            }}>
{`// 낮은 숫자일수록 먼저 실행
actionRegister.register('increment', 
  logHandler, { priority: 0 }    // 먼저 실행
);

actionRegister.register('increment', 
  countHandler, { priority: 1 }  // 나중에 실행
);

// 실행 순서: log → count → UI 업데이트`}
            </pre>
          </div>

          {/* 2단계: 미들웨어 패턴 */}
          <div style={{
            padding: '24px',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '16px' 
            }}>
              <span style={{ 
                fontSize: '20px',
                marginRight: '8px'
              }}>2️⃣</span>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                미들웨어 시뮬레이션 패턴
              </h3>
            </div>
            <p style={{ 
              color: '#64748b', 
              fontSize: '14px', 
              marginBottom: '12px',
              lineHeight: '1.5'
            }}>
              인증, 로깅, 검증 등의 횡단 관심사를 분리하여 처리합니다.
            </p>
            <pre style={{
              backgroundColor: '#f1f5f9',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '12px',
              overflow: 'auto',
              color: '#1e293b'
            }}>
{`// 미들웨어 체인 (미래 구현 예정)
const middleware = (action, payload, next) => {
  console.log('Before:', action);
  next(); // 다음 단계로 진행
  console.log('After:', action);
};

// 현재는 시뮬레이션으로 구현
if (isMiddlewareEnabled) {
  // 인증 → 검증 → 로깅 → 실행
}`}
            </pre>
          </div>

          {/* 3단계: 액션 체이닝 */}
          <div style={{
            padding: '24px',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '16px' 
            }}>
              <span style={{ 
                fontSize: '20px',
                marginRight: '8px'
              }}>3️⃣</span>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                비동기 액션 체이닝
              </h3>
            </div>
            <p style={{ 
              color: '#64748b', 
              fontSize: '14px', 
              marginBottom: '12px',
              lineHeight: '1.5'
            }}>
              한 액션이 다른 액션을 트리거하여 복잡한 워크플로우를 구현합니다.
            </p>
            <pre style={{
              backgroundColor: '#f1f5f9',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '12px',
              overflow: 'auto',
              color: '#1e293b'
            }}>
{`// 체인 액션 핸들러
register('chainedAction', async ({ step, data }) => {
  console.log(\`Step \${step}: \${data}\`);
  
  if (step < 3) {
    await delay(500);
    // 다음 단계 자동 트리거
    dispatch('chainedAction', {
      step: step + 1,
      data: \`\${data} -> Step \${step + 1}\`
    });
  }
});`}
            </pre>
          </div>

          {/* 4단계: 에러 핸들링 */}
          <div style={{
            padding: '24px',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '16px' 
            }}>
              <span style={{ 
                fontSize: '20px',
                marginRight: '8px'
              }}>4️⃣</span>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                에러 처리와 복구 패턴
              </h3>
            </div>
            <p style={{ 
              color: '#64748b', 
              fontSize: '14px', 
              marginBottom: '12px',
              lineHeight: '1.5'
            }}>
              예외 상황을 graceful하게 처리하고 적절한 복구 메커니즘을 제공합니다.
            </p>
            <pre style={{
              backgroundColor: '#f1f5f9',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '12px',
              overflow: 'auto',
              color: '#1e293b'
            }}>
{`// 에러 발생 핸들러
register('errorAction', () => {
  throw new Error('Intentional error');
});

// dispatch 레벨에서 에러 캐치
try {
  actionRegister.dispatch('errorAction');
} catch (error) {
  addLog('error', \`Error: \${error.message}\`);
}`}
            </pre>
          </div>
        </div>

        {/* 아키텍처 특징 */}
        <div style={{
          padding: '24px',
          backgroundColor: '#fef3c7',
          borderRadius: '12px',
          border: '1px solid #fbbf24'
        }}>
          <h4 style={{ 
            margin: '0 0 16px 0', 
            fontSize: '18px', 
            fontWeight: '600',
            color: '#92400e'
          }}>
            🏗️ 엔터프라이즈급 아키텍처 특징
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            color: '#92400e',
            fontSize: '14px'
          }}>
            <div>
              <strong>우선순위 제어:</strong>
              <div style={{ marginTop: '4px' }}>
                핸들러 실행 순서를 세밀하게 제어
              </div>
            </div>
            <div>
              <strong>미들웨어 아키텍처:</strong>
              <div style={{ marginTop: '4px' }}>
                횡단 관심사의 완벽한 분리
              </div>
            </div>
            <div>
              <strong>비동기 체이닝:</strong>
              <div style={{ marginTop: '4px' }}>
                복잡한 워크플로우의 우아한 구현
              </div>
            </div>
            <div>
              <strong>에러 격리:</strong>
              <div style={{ marginTop: '4px' }}>
                시스템 안정성을 위한 에러 경계
              </div>
            </div>
            <div>
              <strong>조건부 실행:</strong>
              <div style={{ marginTop: '4px' }}>
                비즈니스 로직 기반 동적 제어
              </div>
            </div>
            <div>
              <strong>성능 최적화:</strong>
              <div style={{ marginTop: '4px' }}>
                지연 실행과 효율적인 리소스 관리
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CoreAdvancedPage() {
  return <CoreAdvancedContent />;
}
