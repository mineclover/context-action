import { useState, useEffect, useCallback } from 'react';
import {
  type ActionPayloadMap,
  createActionContext,
} from '@context-action/react';

// === 타입 정의 ===
// 전역 액션 타입 (애플리케이션 전역에서 사용)
interface GlobalActionMap extends ActionPayloadMap {
  globalIncrement: undefined;
  globalReset: undefined;
  setGlobalMessage: string;
  broadcastMessage: string;
}

// 로컬 액션 타입 (특정 컴포넌트에서만 사용)
interface LocalActionMap extends ActionPayloadMap {
  localIncrement: undefined;
  localDecrement: undefined;
  localReset: undefined;
  updateLocalData: { id: string; value: string };
}

// === 컨텍스트 생성 ===
// 글로벌 컨텍스트 생성
const {
  Provider: GlobalProvider,
  useAction: useGlobalAction,
  useActionHandler: useGlobalActionHandler,
} = createActionContext<GlobalActionMap>();

// 로컬 컨텍스트 생성
const {
  Provider: LocalProvider,
  useAction: useLocalAction,
  useActionHandler: useLocalActionHandler,
} = createActionContext<LocalActionMap>();

// === 스타일 객체 (컴포넌트 외부) ===
const styles = {
  globalContainer: {
    padding: '20px',
    border: '2px solid #007bff',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  localContainer: {
    padding: '20px',
    border: '2px solid #28a745',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  actionTriggerContainer: {
    padding: '15px',
    border: '1px solid #17a2b8',
    borderRadius: '8px',
    marginBottom: '10px',
  },
  localStateContainer: {
    padding: '15px',
    border: '1px solid #28a745',
    borderRadius: '8px',
    marginBottom: '10px',
  },
  boundaryContainer: {
    padding: '20px',
    border: '2px solid #ffc107',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  actionButtonGroup: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
  },
  localButtonGroup: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
    marginBottom: '10px',
  },
  button: {
    padding: '6px 12px',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer' as const,
  },
  incrementButton: {
    backgroundColor: '#28a745',
  },
  messageButton: {
    backgroundColor: '#ffc107',
    color: 'black',
  },
  broadcastButton: {
    backgroundColor: '#17a2b8',
  },
  decrementButton: {
    backgroundColor: '#dc3545',
  },
  resetButton: {
    backgroundColor: '#6c757d',
  },
  dataButton: {
    backgroundColor: '#fd7e14',
  },
  globalResetButton: {
    backgroundColor: '#dc3545',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    padding: '12px 24px',
  },
  boundaryTestButton: {
    backgroundColor: '#ffc107',
    color: 'black',
    padding: '8px 16px',
    marginBottom: '10px',
  },
  smallButton: {
    padding: '4px 8px',
    fontSize: '12px',
    borderRadius: '3px',
  },
  broadcastList: {
    maxHeight: '100px',
    overflow: 'auto' as const,
    backgroundColor: '#f8f9fa',
    padding: '10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
  },
  errorMessage: {
    padding: '10px',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: '4px',
    color: '#721c24',
    fontSize: '14px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px',
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '10px',
  },
  description: {
    fontSize: '14px',
    color: '#6c757d',
    marginBottom: '15px',
  },
  textCenter: {
    textAlign: 'center' as const,
    marginTop: '20px',
  },
  codeExample: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  pre: {
    overflow: 'auto' as const,
    fontSize: '14px',
  },
} as const;

// === 커스텀 훅 ===
function useGlobalStateManager() {
  const [globalCount, setGlobalCount] = useState(0);
  const [globalMessage, setGlobalMessage] = useState('Global context initialized');
  const [broadcasts, setBroadcasts] = useState<string[]>([]);

  const globalIncrementHandler = useCallback(() => {
    setGlobalCount(prev => prev + 1);
  }, []);

  const globalResetHandler = useCallback(() => {
    setGlobalCount(0);
    setGlobalMessage('Global context reset');
    setBroadcasts([]);
  }, []);

  const setGlobalMessageHandler = useCallback((message: string) => {
    setGlobalMessage(message);
  }, []);

  const broadcastMessageHandler = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setBroadcasts(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  // 액션 핸들러 등록
  useGlobalActionHandler('globalIncrement', globalIncrementHandler);
  useGlobalActionHandler('globalReset', globalResetHandler);
  useGlobalActionHandler('setGlobalMessage', setGlobalMessageHandler);
  useGlobalActionHandler('broadcastMessage', broadcastMessageHandler);

  return {
    globalCount,
    globalMessage,
    broadcasts,
  };
}

function useGlobalActions() {
  const globalDispatch = useGlobalAction();

  return {
    incrementGlobal: useCallback(() => globalDispatch('globalIncrement'), [globalDispatch]),
    setGlobalMessage: useCallback((message: string) => globalDispatch('setGlobalMessage', message), [globalDispatch]),
    broadcastMessage: useCallback((message: string) => globalDispatch('broadcastMessage', message), [globalDispatch]),
    resetGlobal: useCallback(() => globalDispatch('globalReset'), [globalDispatch]),
  };
}

function useLocalStateManager(name: string) {
  const [localCount, setLocalCount] = useState(0);
  const [localData, setLocalData] = useState<Record<string, string>>({});
  const globalDispatch = useGlobalAction();

  const localIncrementHandler = useCallback(() => {
    setLocalCount(prev => prev + 1);
  }, []);

  const localDecrementHandler = useCallback(() => {
    setLocalCount(prev => prev - 1);
  }, []);

  const localResetHandler = useCallback(() => {
    setLocalCount(0);
    setLocalData({});
  }, []);

  const updateLocalDataHandler = useCallback(({ id, value }: { id: string; value: string }) => {
    setLocalData(prev => ({ ...prev, [id]: value }));
  }, []);

  // 액션 핸들러 등록
  useLocalActionHandler('localIncrement', localIncrementHandler);
  useLocalActionHandler('localDecrement', localDecrementHandler);
  useLocalActionHandler('localReset', localResetHandler);
  useLocalActionHandler('updateLocalData', updateLocalDataHandler);

  // 로컬 → 글로벌 통신 예시
  useEffect(() => {
    if (localCount > 0 && localCount % 5 === 0) {
      globalDispatch('broadcastMessage', `${name} local count reached ${localCount}!`);
    }
  }, [localCount, name, globalDispatch]);

  return {
    localCount,
    localData,
  };
}

function useLocalActions() {
  const localDispatch = useLocalAction();

  return {
    incrementLocal: useCallback(() => localDispatch('localIncrement'), [localDispatch]),
    decrementLocal: useCallback(() => localDispatch('localDecrement'), [localDispatch]),
    resetLocal: useCallback(() => localDispatch('localReset'), [localDispatch]),
    updateLocalData: useCallback((id: string, value: string) => 
      localDispatch('updateLocalData', { id, value }), [localDispatch]),
  };
}

function useBoundaryError() {
  const [showError, setShowError] = useState(false);

  const testOutsideContext = useCallback(() => {
    setShowError(true);
    setTimeout(() => setShowError(false), 3000);
  }, []);

  return {
    showError,
    testOutsideContext,
  };
}

// === 순수 뷰 컴포넌트 ===
function GlobalStateManagerView({
  globalCount,
  globalMessage,
  broadcasts,
}: {
  globalCount: number;
  globalMessage: string;
  broadcasts: string[];
}) {
  return (
    <div style={styles.globalContainer}>
      <h3>🌍 Global State Manager</h3>
      <div style={{ marginBottom: '15px' }}>
        <strong>Global Count:</strong> {globalCount}
      </div>
      <div style={{ marginBottom: '15px' }}>
        <strong>Global Message:</strong> {globalMessage}
      </div>
      
      {broadcasts.length > 0 && (
        <div style={{ marginTop: '15px' }}>
          <strong>Broadcast Messages:</strong>
          <div style={styles.broadcastList}>
            {broadcasts.map((broadcast, index) => (
              <div key={index}>{broadcast}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GlobalActionTriggerView({
  id,
  onIncrement,
  onSetMessage,
  onBroadcast,
}: {
  id: string;
  onIncrement: () => void;
  onSetMessage: () => void;
  onBroadcast: () => void;
}) {
  return (
    <div style={styles.actionTriggerContainer}>
      <h4>Global Action Trigger #{id}</h4>
      <div style={styles.actionButtonGroup}>
        <button
          type="button"
          onClick={onIncrement}
          style={{ ...styles.button, ...styles.incrementButton }}
        >
          +1 Global
        </button>
        <button
          type="button"
          onClick={onSetMessage}
          style={{ ...styles.button, ...styles.messageButton }}
        >
          Set Message
        </button>
        <button
          type="button"
          onClick={onBroadcast}
          style={{ ...styles.button, ...styles.broadcastButton }}
        >
          Broadcast
        </button>
      </div>
    </div>
  );
}

function LocalStateView({
  name,
  localCount,
  localData,
  onIncrement,
  onDecrement,
  onReset,
  onAddData,
}: {
  name: string;
  localCount: number;
  localData: Record<string, string>;
  onIncrement: () => void;
  onDecrement: () => void;
  onReset: () => void;
  onAddData: () => void;
}) {
  return (
    <div style={styles.localStateContainer}>
      <h4>📍 Local State: {name}</h4>
      <div style={{ marginBottom: '10px' }}>
        <strong>Local Count:</strong> {localCount}
      </div>
      
      <div style={styles.localButtonGroup}>
        <button
          type="button"
          onClick={onIncrement}
          style={{ ...styles.button, ...styles.smallButton, ...styles.incrementButton }}
        >
          +1
        </button>
        <button
          type="button"
          onClick={onDecrement}
          style={{ ...styles.button, ...styles.smallButton, ...styles.decrementButton }}
        >
          -1
        </button>
        <button
          type="button"
          onClick={onReset}
          style={{ ...styles.button, ...styles.smallButton, ...styles.resetButton }}
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onAddData}
          style={{ ...styles.button, ...styles.smallButton, ...styles.dataButton }}
        >
          Add Data
        </button>
      </div>

      {Object.keys(localData).length > 0 && (
        <div style={{ fontSize: '12px', color: '#6c757d' }}>
          <strong>Local Data:</strong> {Object.keys(localData).length} items
        </div>
      )}
    </div>
  );
}

function NestedContextAreaView({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LocalProvider>
      <div style={styles.localContainer}>
        <h3>🔄 Nested Context Area (Local Context)</h3>
        <p style={styles.description}>
          이 영역은 로컬 컨텍스트로 감싸져 있어 전역 컨텍스트와 독립적으로 동작합니다.
          로컬 컨텍스트는 전역 컨텍스트에 접근할 수 있지만, 전역 컨텍스트는 로컬 컨텍스트에 접근할 수 없습니다.
        </p>
        
        <div style={styles.grid}>
          {children}
        </div>
      </div>
    </LocalProvider>
  );
}

function ContextBoundaryView({
  showError,
  onTestBoundary,
}: {
  showError: boolean;
  onTestBoundary: () => void;
}) {
  return (
    <div style={styles.boundaryContainer}>
      <h3>⚠️ Context Boundary Demo</h3>
      <p style={styles.description}>
        컨텍스트 외부에서 액션을 호출할 때의 에러 처리를 확인할 수 있습니다.
      </p>

      <button
        type="button"
        onClick={onTestBoundary}
        style={{ ...styles.button, ...styles.boundaryTestButton }}
      >
        Test Context Boundary Error
      </button>

      {showError && (
        <div style={styles.errorMessage}>
          💡 실제 에러는 콘솔에서 확인하세요. Context 외부에서 useAction을 호출할 때 발생하는 에러 메시지를 볼 수 있습니다.
        </div>
      )}
    </div>
  );
}

function GlobalResetButtonView({
  onReset,
}: {
  onReset: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onReset}
      style={{ ...styles.button, ...styles.globalResetButton }}
    >
      🔄 Reset All Global State
    </button>
  );
}

// === 컨테이너 컴포넌트 ===
function GlobalStateManager() {
  const { globalCount, globalMessage, broadcasts } = useGlobalStateManager();

  return (
    <GlobalStateManagerView
      globalCount={globalCount}
      globalMessage={globalMessage}
      broadcasts={broadcasts}
    />
  );
}

function GlobalActionTrigger({ id }: { id: string }) {
  const { incrementGlobal, setGlobalMessage, broadcastMessage } = useGlobalActions();

  const handleIncrement = useCallback(() => {
    incrementGlobal();
  }, [incrementGlobal]);

  const handleSetMessage = useCallback(() => {
    setGlobalMessage(`Updated by trigger ${id}`);
  }, [setGlobalMessage, id]);

  const handleBroadcast = useCallback(() => {
    broadcastMessage(`Hello from trigger ${id}!`);
  }, [broadcastMessage, id]);

  return (
    <GlobalActionTriggerView
      id={id}
      onIncrement={handleIncrement}
      onSetMessage={handleSetMessage}
      onBroadcast={handleBroadcast}
    />
  );
}

function LocalStateComponent({ name }: { name: string }) {
  const { localCount, localData } = useLocalStateManager(name);
  const { incrementLocal, decrementLocal, resetLocal, updateLocalData } = useLocalActions();

  const handleAddData = useCallback(() => {
    updateLocalData(Date.now().toString(), `Data from ${name}`);
  }, [updateLocalData, name]);

  return (
    <LocalStateView
      name={name}
      localCount={localCount}
      localData={localData}
      onIncrement={incrementLocal}
      onDecrement={decrementLocal}
      onReset={resetLocal}
      onAddData={handleAddData}
    />
  );
}

function NestedContextArea() {
  return (
    <NestedContextAreaView>
      <LocalStateComponent name="Area A" />
      <LocalStateComponent name="Area B" />
      <LocalStateComponent name="Area C" />
    </NestedContextAreaView>
  );
}

function ContextBoundaryDemo() {
  const { showError, testOutsideContext } = useBoundaryError();

  return (
    <ContextBoundaryView
      showError={showError}
      onTestBoundary={testOutsideContext}
    />
  );
}

function GlobalResetButton() {
  const { resetGlobal } = useGlobalActions();

  return (
    <GlobalResetButtonView onReset={resetGlobal} />
  );
}


function ReactContextContent() {
  return (
    <div>
      <h1>React Integration - Context</h1>
      <p>
        복잡한 컨텍스트 시나리오를 다룹니다: 중첩 컨텍스트, 전역/지역 상태 분리, 
        다중 컨텍스트 통신, 컨텍스트 경계 처리 등을 보여줍니다.
      </p>

      {/* Global State Display */}
      <GlobalStateManager />

      {/* Global Action Triggers */}
      <div style={{ marginBottom: '20px' }}>
        <h3>🎯 Global Action Triggers</h3>
        <p style={styles.description}>
          여러 컴포넌트에서 동일한 글로벌 액션을 트리거할 수 있습니다.
        </p>
        <div style={styles.actionGrid}>
          <GlobalActionTrigger id="1" />
          <GlobalActionTrigger id="2" />
        </div>
      </div>

      {/* Nested Context */}
      <NestedContextArea />

      {/* Context Boundary Demo */}
      <ContextBoundaryDemo />

      {/* Global Reset Button */}
      <div style={styles.textCenter}>
        <GlobalResetButton />
      </div>

      {/* Code Example */}
      <div style={styles.codeExample}>
        <h3>중첩 컨텍스트 예시</h3>
        <pre style={styles.pre}>
{`// 1. 글로벌 및 로컬 컨텍스트 생성
const { Provider: GlobalProvider, useAction: useGlobalAction } = 
  createActionContext<GlobalActionMap>();

const { Provider: LocalProvider, useAction: useLocalAction } = 
  createActionContext<LocalActionMap>();

// 2. 중첩 구조
<GlobalProvider>
  <GlobalStateManager />
  
  <LocalProvider>
    <LocalComponent />  {/* 글로벌 + 로컬 액션 모두 사용 가능 */}
  </LocalProvider>
  
  <GlobalComponent />   {/* 글로벌 액션만 사용 가능 */}
</GlobalProvider>

// 3. 로컬에서 글로벌로 통신
function LocalComponent() {
  const localDispatch = useLocalAction();
  const globalDispatch = useGlobalAction();  // 상위 컨텍스트 접근
  
  const handleLocalAction = () => {
    localDispatch('localAction');
    globalDispatch('globalBroadcast', 'Local action completed');
  };
}`}
        </pre>
      </div>
    </div>
  );
}


export function ReactContextPage() {
  return (
    <GlobalProvider>
      <ReactContextContent />
    </GlobalProvider>
  );
}
