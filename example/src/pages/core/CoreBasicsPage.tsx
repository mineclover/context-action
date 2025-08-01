import { type ActionPayloadMap, ActionRegister } from '@context-action/core';
import { useCallback, useEffect, useState } from 'react';

// 액션 타입 정의
interface CoreActionMap extends ActionPayloadMap {
  increment: undefined;
  decrement: undefined;
  setCount: number;
  reset: undefined;
  log: string;
}

// 로그 엔트리 타입 정의
interface LogEntry {
  id: string;
  message: string;
}

export function CoreBasicsPage() {
  const [count, setCount] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [actionRegister] = useState(() => new ActionRegister<CoreActionMap>());

  const addLog = useCallback((message: string) => {
    const newLog: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      message: `${new Date().toLocaleTimeString()}: ${message}`,
    };
    setLogs((prev) => [...prev, newLog]);
  }, []);

  useEffect(() => {
    // 액션 핸들러 등록
    const unsubscribeIncrement = actionRegister.register(
      'increment',
      (_, controller) => {
        setCount((prev) => prev + 1);
        addLog('Increment action executed');
        controller.next();
      }
    );

    const unsubscribeDecrement = actionRegister.register(
      'decrement',
      (_, controller) => {
        setCount((prev) => prev - 1);
        addLog('Decrement action executed');
        controller.next();
      }
    );

    const unsubscribeSetCount = actionRegister.register(
      'setCount',
      (payload, controller) => {
        setCount(payload);
        addLog(`Count set to: ${payload}`);
        controller.next();
      }
    );

    const unsubscribeReset = actionRegister.register(
      'reset',
      (_, controller) => {
        setCount(0);
        setLogs([]);
        addLog('Counter reset');
        controller.next();
      }
    );

    const unsubscribeLog = actionRegister.register(
      'log',
      (message, controller) => {
        addLog(message);
        controller.next();
      }
    );

    return () => {
      unsubscribeIncrement();
      unsubscribeDecrement();
      unsubscribeSetCount();
      unsubscribeReset();
      unsubscribeLog();
    };
  }, [actionRegister, addLog]);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>
            🔧 Core Library - Basics
          </h1>
          <span style={{
            marginLeft: '12px',
            padding: '4px 12px',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: '#e3f2fd',
            color: '#1976d2',
            borderRadius: '12px'
          }}>
            기초
          </span>
        </div>
        <p style={{ 
          fontSize: '16px', 
          color: '#64748b', 
          lineHeight: '1.6',
          marginBottom: '20px'
        }}>
          순수 JavaScript/TypeScript 환경에서 동작하는 ActionRegister의 기본 사용법을 데모로 체험해보세요.
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '16px',
            fontSize: '14px'
          }}>
            <div>
              <strong style={{ color: '#0f172a' }}>액션 타입 시스템:</strong>
              <div style={{ color: '#64748b', marginTop: '4px' }}>
                TypeScript 인터페이스로 타입 안전한 액션 정의
              </div>
            </div>
            <div>
              <strong style={{ color: '#0f172a' }}>핸들러 등록/해제:</strong>
              <div style={{ color: '#64748b', marginTop: '4px' }}>
                register() 메서드와 unsubscribe 패턴
              </div>
            </div>
            <div>
              <strong style={{ color: '#0f172a' }}>액션 디스패치:</strong>
              <div style={{ color: '#64748b', marginTop: '4px' }}>
                dispatch() 메서드와 페이로드 전달
              </div>
            </div>
            <div>
              <strong style={{ color: '#0f172a' }}>컨트롤러 사용:</strong>
              <div style={{ color: '#64748b', marginTop: '4px' }}>
                controller.next()로 파이프라인 제어
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginBottom: '32px'
        }}
      >
        {/* Counter Control */}
        <div
          style={{
            padding: '24px',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            backgroundColor: 'white',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
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
            버튼을 클릭하여 액션을 디스패치하고, 실시간으로 핸들러가 실행되는 과정을 확인해보세요.
          </p>
          <div
            style={{ fontSize: '24px', fontWeight: 'bold', margin: '20px 0' }}
          >
            Count: {count}
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => actionRegister.dispatch('increment')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
              }}
            >
              +1
            </button>

            <button
              type="button"
              onClick={() => actionRegister.dispatch('decrement')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
              }}
            >
              -1
            </button>

            <button
              type="button"
              onClick={() => actionRegister.dispatch('setCount', 10)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
              }}
            >
              Set to 10
            </button>

            <button
              type="button"
              onClick={() =>
                actionRegister.dispatch(
                  'setCount',
                  Math.floor(Math.random() * 100)
                )
              }
              style={{
                padding: '8px 16px',
                backgroundColor: '#ffc107',
                color: 'black',
                border: 'none',
                borderRadius: '4px',
              }}
            >
              Random
            </button>

            <button
              type="button"
              onClick={() => actionRegister.dispatch('reset')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
              }}
            >
              Reset
            </button>
          </div>

          <div style={{ marginTop: '20px' }}>
            <button
              type="button"
              onClick={() =>
                actionRegister.dispatch('log', 'Custom log message!')
              }
              style={{
                padding: '8px 16px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
              }}
            >
              Add Custom Log
            </button>
          </div>
        </div>

        {/* Logs */}
        <div
          style={{
            padding: '24px',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            backgroundColor: 'white',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              📊 액션 실행 로그
            </h3>
          </div>
          <p style={{ 
            color: '#64748b', 
            fontSize: '14px', 
            marginBottom: '16px',
            lineHeight: '1.5'
          }}>
            각 액션이 디스패치될 때마다 핸들러가 실행되고 로그가 기록됩니다.
          </p>
          <div
            style={{
              height: '300px',
              overflow: 'auto',
              backgroundColor: '#f8f9fa',
              padding: '10px',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'monospace',
            }}
          >
            {logs.length === 0 ? (
              <div style={{ color: '#6c757d' }}>No logs yet...</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} style={{ marginBottom: '5px' }}>
                  {log.message}
                </div>
              ))
            )}
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
          🔍 동작 원리 분석
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px'
        }}>
          {/* 1단계: 타입 정의 */}
          <div style={{
            padding: '20px',
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
                타입 안전한 액션 정의
              </h3>
            </div>
            <p style={{ 
              color: '#64748b', 
              fontSize: '14px', 
              marginBottom: '12px',
              lineHeight: '1.5'
            }}>
              ActionPayloadMap을 확장하여 각 액션의 페이로드 타입을 명시적으로 정의합니다.
            </p>
            <pre style={{
              backgroundColor: '#f1f5f9',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '12px',
              overflow: 'auto'
            }}>
{`interface CoreActionMap extends ActionPayloadMap {
  increment: undefined;    // 페이로드 없음
  decrement: undefined;    // 페이로드 없음  
  setCount: number;        // 숫자 페이로드
  reset: undefined;        // 페이로드 없음
  log: string;            // 문자열 페이로드
}`}
            </pre>
          </div>

          {/* 2단계: 인스턴스 생성 */}
          <div style={{
            padding: '20px',
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
                ActionRegister 인스턴스 생성
              </h3>
            </div>
            <p style={{ 
              color: '#64748b', 
              fontSize: '14px', 
              marginBottom: '12px',
              lineHeight: '1.5'
            }}>
              타입 매개변수를 전달하여 타입 안전한 ActionRegister를 생성합니다.
            </p>
            <pre style={{
              backgroundColor: '#f1f5f9',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '12px',
              overflow: 'auto'
            }}>
{`const actionRegister = new ActionRegister<CoreActionMap>();

// 이제 TypeScript가 액션 타입과 페이로드를 검증합니다
// ✅ actionRegister.dispatch('setCount', 42)
// ❌ actionRegister.dispatch('setCount', 'string') // 타입 에러`}
            </pre>
          </div>

          {/* 3단계: 핸들러 등록 */}
          <div style={{
            padding: '20px',
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
                핸들러 등록 및 파이프라인 제어
              </h3>
            </div>
            <p style={{ 
              color: '#64748b', 
              fontSize: '14px', 
              marginBottom: '12px',
              lineHeight: '1.5'
            }}>
              각 액션에 대한 핸들러를 등록하고, controller.next()로 파이프라인을 제어합니다.
            </p>
            <pre style={{
              backgroundColor: '#f1f5f9',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '12px',
              overflow: 'auto'
            }}>
{`// 핸들러 등록 시 unsubscribe 함수 반환
const unsubscribe = actionRegister.register(
  'increment',
  (payload, controller) => {
    setCount(prev => prev + 1);
    addLog('Increment executed');
    controller.next(); // 다음 핸들러로 진행
  }
);

// 컴포넌트 언마운트 시 정리
return () => unsubscribe();`}
            </pre>
          </div>

          {/* 4단계: 액션 디스패치 */}
          <div style={{
            padding: '20px',
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
                액션 디스패치와 실행 흐름
              </h3>
            </div>
            <p style={{ 
              color: '#64748b', 
              fontSize: '14px', 
              marginBottom: '12px',
              lineHeight: '1.5'
            }}>
              dispatch() 호출 시 등록된 모든 핸들러가 순차적으로 실행됩니다.
            </p>
            <pre style={{
              backgroundColor: '#f1f5f9',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '12px',
              overflow: 'auto'
            }}>
{`// 페이로드 없는 액션
actionRegister.dispatch('increment');

// 페이로드가 있는 액션  
actionRegister.dispatch('setCount', 42);
actionRegister.dispatch('log', 'Custom message');

// 실행 흐름:
// 1. dispatch() 호출
// 2. 해당 액션의 모든 핸들러 순차 실행
// 3. 각 핸들러에서 controller.next() 호출
// 4. 다음 핸들러로 진행`}
            </pre>
          </div>
        </div>

        {/* 핵심 포인트 */}
        <div style={{
          marginTop: '24px',
          padding: '20px',
          backgroundColor: '#fef3c7',
          borderRadius: '12px',
          border: '1px solid #fbbf24'
        }}>
          <h4 style={{ 
            margin: '0 0 12px 0', 
            fontSize: '16px', 
            fontWeight: '600',
            color: '#92400e'
          }}>
            💡 핵심 포인트
          </h4>
          <ul style={{ 
            margin: 0, 
            paddingLeft: '20px',
            color: '#92400e',
            lineHeight: '1.7'
          }}>
            <li><strong>타입 안전성:</strong> 컴파일 타임에 액션과 페이로드 타입 검증</li>
            <li><strong>메모리 관리:</strong> unsubscribe 함수로 핸들러 정리</li>
            <li><strong>파이프라인 제어:</strong> controller.next()로 실행 흐름 제어</li>
            <li><strong>확장성:</strong> 여러 핸들러를 같은 액션에 등록 가능</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
