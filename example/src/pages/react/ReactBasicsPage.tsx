import { LogLevel } from '@context-action/logger';
import {
  type ActionPayloadMap,
  createActionContext,
} from '@context-action/react';
import { useCallback, useState } from 'react';

// === 타입 정의 ===
interface ReactActionMap extends ActionPayloadMap {
  increment: undefined;
  decrement: undefined;
  setCount: number;
  reset: undefined;
  updateMessage: string;
}

// === 컨텍스트 생성 - TRACE 레벨로 설정 ===
const { Provider, useAction, useActionHandler } =
  createActionContext<ReactActionMap>({
    logLevel: LogLevel.DEBUG,
  });

// === 스타일 객체 (컴포넌트 외부) ===
const styles = {
  container: {
    padding: '24px',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    backgroundColor: 'white',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
  },
  countDisplay: {
    fontSize: '28px',
    fontWeight: 'bold' as const,
    margin: '20px 0',
    color: '#1e293b',
    textAlign: 'center' as const,
    padding: '16px',
    backgroundColor: '#f1f5f9',
    borderRadius: '8px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
    justifyContent: 'center' as const
  },
  button: {
    padding: '10px 18px',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer' as const,
    fontSize: '14px',
    fontWeight: '500' as const,
    transition: 'all 0.2s ease'
  },
  incrementButton: {
    backgroundColor: '#10b981',
  },
  decrementButton: {
    backgroundColor: '#ef4444',
  },
  setCountButton: {
    backgroundColor: '#3b82f6',
  },
  resetButton: {
    backgroundColor: '#6b7280',
  },
  sendButton: {
    backgroundColor: '#06b6d4',
  },
  logContainer: {
    height: '240px',
    overflow: 'auto' as const,
    backgroundColor: '#1e293b',
    color: '#e2e8f0',
    padding: '16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
    marginBottom: '16px',
    border: '1px solid #334155'
  },
  emptyLog: {
    color: '#64748b',
    fontStyle: 'italic' as const
  },
  logEntry: {
    marginBottom: '6px',
    lineHeight: '1.4'
  },
  inputGroup: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
    gap: '24px',
    marginBottom: '32px'
  },
  codeExample: {
    marginTop: '32px',
    padding: '32px',
    backgroundColor: '#f8fafc',
    borderRadius: '16px',
    border: '1px solid #e2e8f0'
  },
  pre: {
    overflow: 'auto' as const,
    fontSize: '13px',
    backgroundColor: '#1e293b',
    color: '#e2e8f0',
    padding: '20px',
    borderRadius: '8px'
  },
} as const;

// === 커스텀 훅 ===
function useCounter() {
  const [count, setCount] = useState(0);

  const incrementHandler = useCallback(() => {
    setCount((prev) => prev + 1);
  }, []);

  const decrementHandler = useCallback(() => {
    setCount((prev) => prev - 1);
  }, []);

  const setCountHandler = useCallback((payload: number) => {
    setCount(payload);
  }, []);

  const resetHandler = useCallback(() => {
    setCount(0);
  }, []);

  // 액션 핸들러 등록
  useActionHandler('increment', incrementHandler, { priority: 1 });
  useActionHandler('decrement', decrementHandler, { priority: 1 });
  useActionHandler('setCount', setCountHandler, { priority: 1 });
  useActionHandler('reset', resetHandler, { priority: 1 });

  return { count };
}

function useLogger() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((message: string) => {
    console.log('[TRACE] Logger: Adding log entry:', message);
    setLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  }, []);

  const incrementLogHandler = useCallback(() => {
    console.log(
      '[TRACE] Logger: Increment action detected with detailed tracing'
    );
    console.log('[TRACE] Logger: Action timestamp:', new Date().toISOString());
    console.log('[TRACE] Logger: Action type: increment');
    addLog('Increment action detected');
  }, [addLog]);

  const decrementLogHandler = useCallback(() => {
    console.log(
      '[TRACE] Logger: Decrement action detected with detailed tracing'
    );
    console.log('[TRACE] Logger: Action timestamp:', new Date().toISOString());
    console.log('[TRACE] Logger: Action type: decrement');
    addLog('Decrement action detected');
  }, [addLog]);

  const setCountLogHandler = useCallback(
    (payload: number) => {
      console.log(
        '[TRACE] Logger: SetCount action detected with payload:',
        payload
      );
      console.log(
        '[TRACE] Logger: Action timestamp:',
        new Date().toISOString()
      );
      console.log('[TRACE] Logger: Action type: setCount');
      addLog(`SetCount action detected: ${payload}`);
    },
    [addLog]
  );

  const resetLogHandler = useCallback(() => {
    console.log('[TRACE] Logger: Reset action detected with detailed tracing');
    console.log('[TRACE] Logger: Action timestamp:', new Date().toISOString());
    console.log('[TRACE] Logger: Action type: reset');
    addLog('Reset action detected');
    setLogs([]);
  }, [addLog]);

  const updateMessageHandler = useCallback(
    (message: string) => {
      console.log(
        '[TRACE] Logger: UpdateMessage action detected with message:',
        message
      );
      console.log(
        '[TRACE] Logger: Action timestamp:',
        new Date().toISOString()
      );
      console.log('[TRACE] Logger: Action type: updateMessage');
      addLog(`Custom message: ${message}`);
    },
    [addLog]
  );

  // 액션 핸들러 등록
  useActionHandler('increment', incrementLogHandler, { priority: 0 });
  useActionHandler('decrement', decrementLogHandler, { priority: 0 });
  useActionHandler('setCount', setCountLogHandler, { priority: 0 });
  useActionHandler('reset', resetLogHandler, { priority: 0 });
  useActionHandler('updateMessage', updateMessageHandler, { priority: 0 });

  return { logs };
}

function useMessageSender() {
  const [message, setMessage] = useState('');

  const clearMessage = useCallback(() => {
    setMessage('');
  }, []);

  return {
    message,
    setMessage,
    clearMessage,
  };
}

function useCounterActions() {
  const dispatch = useAction();

  return {
    increment: () => dispatch('increment'),
    decrement: () => dispatch('decrement'),
    setCount: (value: number) => dispatch('setCount', value),
    reset: () => dispatch('reset'),
  };
}

function useMessageActions() {
  const dispatch = useAction();

  return {
    sendMessage: (message: string) => dispatch('updateMessage', message),
  };
}

// === 순수 뷰 컴포넌트 ===
function CounterView({
  count,
  onIncrement,
  onDecrement,
  onSetCount,
  onReset,
}: {
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onSetCount: () => void;
  onReset: () => void;
}) {
  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
          🎮 카운터 컴포넌트
        </h3>
      </div>
      <p style={{ 
        color: '#64748b', 
        fontSize: '14px', 
        marginBottom: '20px',
        lineHeight: '1.5'
      }}>
        버튼 클릭 시 액션이 디스패치되고, 다른 컴포넌트들도 동시에 반응합니다.
      </p>
      
      <div style={styles.countDisplay}>
        <div style={{ fontSize: '16px', fontWeight: 'normal', marginBottom: '8px', color: '#64748b' }}>
          현재 카운트
        </div>
        {count}
      </div>

      <div style={styles.buttonGroup}>
        <button
          type="button"
          onClick={onIncrement}
          style={{ ...styles.button, ...styles.incrementButton }}
        >
          ➕ +1
        </button>

        <button
          type="button"
          onClick={onDecrement}
          style={{ ...styles.button, ...styles.decrementButton }}
        >
          ➖ -1
        </button>

        <button
          type="button"
          onClick={onSetCount}
          style={{ ...styles.button, ...styles.setCountButton }}
        >
          🎯 Set to 10
        </button>

        <button
          type="button"
          onClick={onReset}
          style={{ ...styles.button, ...styles.resetButton }}
        >
          🔄 Reset
        </button>
      </div>
    </div>
  );
}

function LoggerView({ logs }: { logs: string[] }) {
  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
          📊 로거 컴포넌트
        </h3>
        <span style={{
          marginLeft: '8px',
          padding: '2px 8px',
          fontSize: '11px',
          backgroundColor: '#dbeafe',
          color: '#1d4ed8',
          borderRadius: '6px',
          fontWeight: '500'
        }}>
          DEBUG
        </span>
      </div>
      <p style={{ 
        color: '#64748b', 
        fontSize: '14px', 
        marginBottom: '16px',
        lineHeight: '1.5'
      }}>
        액션 실행 시 자동으로 로그가 기록됩니다. 우선순위 0으로 설정되어 카운터보다 먼저 실행됩니다.
      </p>
      
      <div style={{
        backgroundColor: '#f1f5f9',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '16px',
        fontSize: '13px'
      }}>
        <div style={{ fontWeight: '600', marginBottom: '8px', color: '#1e293b' }}>
          🔍 로깅되는 정보:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', color: '#475569' }}>
          <div>• 액션 디스패치 시작/완료</div>
          <div>• 핸들러 실행 순서</div>
          <div>• 타임스탬프 정보</div>
          <div>• 페이로드 데이터</div>
        </div>
      </div>

      <div style={styles.logContainer}>
        {logs.length === 0 ? (
          <div style={styles.emptyLog}>
            {'>'} 액션을 실행하면 로그가 표시됩니다...
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={styles.logEntry}>
              <span style={{ color: '#10b981' }}>{'>'}</span> {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MessageSenderView({
  message,
  onMessageChange,
  onSend,
  onKeyDown,
}: {
  message: string;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) {
  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
          💬 메시지 전송
        </h3>
      </div>
      <p style={{ 
        color: '#64748b', 
        fontSize: '14px', 
        marginBottom: '20px',
        lineHeight: '1.5'
      }}>
        커스텀 메시지를 로거로 전송합니다. Enter 키로도 전송 가능합니다.
      </p>
      
      <div style={styles.inputGroup}>
        <input
          type="text"
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="메시지를 입력하세요..."
          style={styles.input}
        />
        <button
          type="button"
          onClick={onSend}
          style={{ ...styles.button, ...styles.sendButton }}
          disabled={!message.trim()}
        >
          📤 Send
        </button>
      </div>
      
      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#ecfdf5',
        borderRadius: '8px',
        fontSize: '13px',
        color: '#065f46'
      }}>
        💡 <strong>팁:</strong> 이 컴포넌트는 액션을 디스패치만 하고, 로거 컴포넌트가 실제 메시지를 처리합니다.
      </div>
    </div>
  );
}

// === 컨테이너 컴포넌트 ===
function Counter() {
  const { count } = useCounter();
  const { increment, decrement, setCount, reset } = useCounterActions();

  return (
    <CounterView
      count={count}
      onIncrement={increment}
      onDecrement={decrement}
      onSetCount={() => setCount(10)}
      onReset={reset}
    />
  );
}

function Logger() {
  const { logs } = useLogger();
  return <LoggerView logs={logs} />;
}

function MessageSender() {
  const { message, setMessage, clearMessage } = useMessageSender();
  const { sendMessage } = useMessageActions();

  const handleSend = useCallback(() => {
    if (message.trim()) {
      sendMessage(message);
      clearMessage();
    }
  }, [message, sendMessage, clearMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <MessageSenderView
      message={message}
      onMessageChange={setMessage}
      onSend={handleSend}
      onKeyDown={handleKeyDown}
    />
  );
}

/**
 * React basics demonstration with unidirectional data flow and decoupled architecture
 * @implements unidirectional-data-flow
 * @memberof architecture-terms
 * @implements decoupled-architecture
 * @memberof architecture-terms
 * @implements type-safety
 * @memberof architecture-terms
 */
function ReactBasicsContent() {
  console.log(
    '[TRACE] ReactBasicsContent component mounted with TRACE level logging'
  );

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>
            ⚛️ React Integration - Basics
          </h1>
          <span style={{
            marginLeft: '12px',
            padding: '4px 12px',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: '#fff3e0',
            color: '#f57c00',
            borderRadius: '12px'
          }}>
            중급
          </span>
        </div>
        <p style={{ 
          fontSize: '16px', 
          color: '#64748b', 
          lineHeight: '1.6',
          marginBottom: '20px'
        }}>
          React와 Context Action의 완벽한 통합을 데모로 체험해보세요. 컴포넌트 간 통신의 새로운 패러다임을 경험할 수 있습니다.
        </p>

        <div style={{
          backgroundColor: '#f0f9ff',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #0ea5e9',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '16px', marginRight: '8px' }}>📊</span>
            <strong style={{ color: '#0369a1', fontSize: '14px' }}>
              DEBUG 레벨 로깅 활성화
            </strong>
          </div>
          <p style={{ 
            color: '#0369a1', 
            fontSize: '13px', 
            margin: 0,
            lineHeight: '1.5'
          }}>
            브라우저 개발자 도구의 Console 탭에서 액션 디스패치와 핸들러 실행 과정을 실시간으로 확인할 수 있습니다.
          </p>
        </div>

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
              <strong style={{ color: '#0f172a' }}>createActionContext:</strong>
              <div style={{ color: '#64748b', marginTop: '4px' }}>
                React Context와 ActionRegister 통합
              </div>
            </div>
            <div>
              <strong style={{ color: '#0f172a' }}>useActionHandler:</strong>
              <div style={{ color: '#64748b', marginTop: '4px' }}>
                컴포넌트별 액션 핸들러 등록
              </div>
            </div>
            <div>
              <strong style={{ color: '#0f172a' }}>useAction:</strong>
              <div style={{ color: '#64748b', marginTop: '4px' }}>
                컴포넌트 간 액션 디스패치
              </div>
            </div>
            <div>
              <strong style={{ color: '#0f172a' }}>Container/Presenter:</strong>
              <div style={{ color: '#64748b', marginTop: '4px' }}>
                로직과 뷰 분리 아키텍처 패턴
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.grid}>
        <Counter />
        <Logger />
        <MessageSender />
      </div>

      {/* 동작 원리 설명 */}
      <div style={styles.codeExample}>
        <h2 style={{ 
          margin: '0 0 24px 0', 
          fontSize: '24px', 
          fontWeight: '700',
          color: '#1e293b'
        }}>
          🔍 React 통합 동작 원리
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* 1단계: 컨텍스트 생성 */}
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
                createActionContext로 통합 컨텍스트 생성
              </h3>
            </div>
            <p style={{ 
              color: '#64748b', 
              fontSize: '14px', 
              marginBottom: '12px',
              lineHeight: '1.5'
            }}>
              React Context API와 ActionRegister를 하나로 결합하여 타입 안전한 컨텍스트를 생성합니다.
            </p>
            <pre style={{
              backgroundColor: '#f1f5f9',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '12px',
              overflow: 'auto',
              color: '#1e293b'
            }}>
{`// 통합 컨텍스트 생성
const { Provider, useAction, useActionHandler } = 
  createActionContext<ReactActionMap>({
    logLevel: LogLevel.DEBUG  // 디버깅 레벨 설정
  });

// 내부적으로 다음이 생성됩니다:
// - React.Context
// - ActionRegister 인스턴스  
// - 타입 안전한 커스텀 훅들`}
            </pre>
          </div>

          {/* 2단계: 핸들러 등록 */}
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
                useActionHandler로 컴포넌트별 핸들러 등록
              </h3>
            </div>
            <p style={{ 
              color: '#64748b', 
              fontSize: '14px', 
              marginBottom: '12px',
              lineHeight: '1.5'
            }}>
              각 컴포넌트는 자신이 관심 있는 액션에 대한 핸들러를 등록할 수 있습니다.
            </p>
            <pre style={{
              backgroundColor: '#f1f5f9',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '12px',
              overflow: 'auto',
              color: '#1e293b'
            }}>
{`// 카운터 컴포넌트에서 핸들러 등록
function useCounter() {
  const [count, setCount] = useState(0);
  
  // 우선순위 1로 설정 (로거보다 나중에 실행)
  useActionHandler('increment', () => {
    setCount(prev => prev + 1);
  }, { priority: 1 });
  
  // 여러 액션에 대한 핸들러를 등록 가능
}`}
            </pre>
          </div>

          {/* 3단계: 액션 디스패치 */}
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
                useAction으로 액션 디스패치
              </h3>
            </div>
            <p style={{ 
              color: '#64748b', 
              fontSize: '14px', 
              marginBottom: '12px',
              lineHeight: '1.5'
            }}>
              어떤 컴포넌트에서든 액션을 디스패치하면, 등록된 모든 핸들러가 우선순위에 따라 실행됩니다.
            </p>
            <pre style={{
              backgroundColor: '#f1f5f9',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '12px',
              overflow: 'auto',
              color: '#1e293b'
            }}>
{`// 액션 디스패치 함수 획득
const dispatch = useAction();

// 버튼 클릭 시 액션 디스패치
<button onClick={() => dispatch('increment')}>
  +1
</button>

// 실행 흐름:
// 1. dispatch('increment') 호출
// 2. 로거 핸들러 실행 (priority: 0)
// 3. 카운터 핸들러 실행 (priority: 1)`}
            </pre>
          </div>

          {/* 4단계: Provider 감싸기 */}
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
                Provider로 컴포넌트 트리 감싸기
              </h3>
            </div>
            <p style={{ 
              color: '#64748b', 
              fontSize: '14px', 
              marginBottom: '12px',
              lineHeight: '1.5'
            }}>
              Provider로 감싼 모든 하위 컴포넌트가 같은 ActionRegister를 공유합니다.
            </p>
            <pre style={{
              backgroundColor: '#f1f5f9',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '12px',
              overflow: 'auto',
              color: '#1e293b'
            }}>
{`// 애플리케이션 루트에서 Provider 설정
export function ReactBasicsPage() {
  return (
    <Provider>
      <Counter />     {/* 핸들러 등록 + 액션 디스패치 */}
      <Logger />      {/* 핸들러 등록만 */}
      <MessageSender />{/* 액션 디스패치만 */}
    </Provider>
  );
}

// 모든 컴포넌트가 같은 ActionRegister 공유`}
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
            🏗️ Container/Presenter 패턴의 힘
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px',
            color: '#92400e'
          }}>
            <div>
              <strong>관심사 분리:</strong>
              <div style={{ fontSize: '14px', marginTop: '4px' }}>
                로직(Container)과 UI(Presenter) 완전 분리
              </div>
            </div>
            <div>
              <strong>컴포넌트 간 통신:</strong>
              <div style={{ fontSize: '14px', marginTop: '4px' }}>
                Props 전달 없이 액셴으로 직접 통신
              </div>
            </div>
            <div>
              <strong>우선순위 제어:</strong>
              <div style={{ fontSize: '14px', marginTop: '4px' }}>
                핸들러 실행 순서를 세밀하게 제어
              </div>
            </div>
            <div>
              <strong>타입 안전성:</strong>
              <div style={{ fontSize: '14px', marginTop: '4px' }}>
                컴파일 타임에 모든 액션과 페이로드 검증
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReactBasicsPage() {
  console.log(
    '[TRACE] ReactBasicsPage component mounted with TRACE level logging'
  );

  return (
    <Provider>
      <ReactBasicsContent />
    </Provider>
  );
}
