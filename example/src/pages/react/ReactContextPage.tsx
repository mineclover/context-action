import { useState, useEffect } from 'react';
import {
  type ActionPayloadMap,
  createActionContext,
} from '@context-action/react';

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

// 글로벌 상태 관리 컴포넌트
function GlobalStateManager() {
  const [globalCount, setGlobalCount] = useState(0);
  const [globalMessage, setGlobalMessage] = useState('Global context initialized');
  const [broadcasts, setBroadcasts] = useState<string[]>([]);

  useGlobalActionHandler('globalIncrement', () => {
    setGlobalCount(prev => prev + 1);
  });

  useGlobalActionHandler('globalReset', () => {
    setGlobalCount(0);
    setGlobalMessage('Global context reset');
    setBroadcasts([]);
  });

  useGlobalActionHandler('setGlobalMessage', (message) => {
    setGlobalMessage(message);
  });

  useGlobalActionHandler('broadcastMessage', (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setBroadcasts(prev => [...prev, `[${timestamp}] ${message}`]);
  });

  return (
    <div style={{ padding: '20px', border: '2px solid #007bff', borderRadius: '8px', marginBottom: '20px' }}>
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
          <div style={{
            maxHeight: '100px',
            overflow: 'auto',
            backgroundColor: '#f8f9fa',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
          }}>
            {broadcasts.map((broadcast, index) => (
              <div key={index}>{broadcast}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 글로벌 액션을 트리거하는 컴포넌트
function GlobalActionTrigger({ id }: { id: string }) {
  const globalDispatch = useGlobalAction();

  return (
    <div style={{ padding: '15px', border: '1px solid #17a2b8', borderRadius: '8px', marginBottom: '10px' }}>
      <h4>Global Action Trigger #{id}</h4>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => globalDispatch('globalIncrement')}
          style={{
            padding: '6px 12px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          +1 Global
        </button>
        <button
          type="button"
          onClick={() => globalDispatch('setGlobalMessage', `Updated by trigger ${id}`)}
          style={{
            padding: '6px 12px',
            backgroundColor: '#ffc107',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Set Message
        </button>
        <button
          type="button"
          onClick={() => globalDispatch('broadcastMessage', `Hello from trigger ${id}!`)}
          style={{
            padding: '6px 12px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Broadcast
        </button>
      </div>
    </div>
  );
}

// 로컬 상태를 관리하는 컴포넌트
function LocalStateComponent({ name }: { name: string }) {
  const [localCount, setLocalCount] = useState(0);
  const [localData, setLocalData] = useState<Record<string, string>>({});
  const localDispatch = useLocalAction();
  const globalDispatch = useGlobalAction();

  useLocalActionHandler('localIncrement', () => {
    setLocalCount(prev => prev + 1);
  });

  useLocalActionHandler('localDecrement', () => {
    setLocalCount(prev => prev - 1);
  });

  useLocalActionHandler('localReset', () => {
    setLocalCount(0);
    setLocalData({});
  });

  useLocalActionHandler('updateLocalData', ({ id, value }) => {
    setLocalData(prev => ({ ...prev, [id]: value }));
  });

  // 로컬 → 글로벌 통신 예시
  useEffect(() => {
    if (localCount > 0 && localCount % 5 === 0) {
      globalDispatch('broadcastMessage', `${name} local count reached ${localCount}!`);
    }
  }, [localCount, name, globalDispatch]);

  return (
    <div style={{ padding: '15px', border: '1px solid #28a745', borderRadius: '8px', marginBottom: '10px' }}>
      <h4>📍 Local State: {name}</h4>
      <div style={{ marginBottom: '10px' }}>
        <strong>Local Count:</strong> {localCount}
      </div>
      
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <button
          type="button"
          onClick={() => localDispatch('localIncrement')}
          style={{
            padding: '4px 8px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            fontSize: '12px',
          }}
        >
          +1
        </button>
        <button
          type="button"
          onClick={() => localDispatch('localDecrement')}
          style={{
            padding: '4px 8px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            fontSize: '12px',
          }}
        >
          -1
        </button>
        <button
          type="button"
          onClick={() => localDispatch('localReset')}
          style={{
            padding: '4px 8px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            fontSize: '12px',
          }}
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => localDispatch('updateLocalData', { 
            id: Date.now().toString(), 
            value: `Data from ${name}` 
          })}
          style={{
            padding: '4px 8px',
            backgroundColor: '#fd7e14',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            fontSize: '12px',
          }}
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

// 중첩 컨텍스트를 보여주는 영역
function NestedContextArea() {
  return (
    <LocalProvider>
      <div style={{ padding: '20px', border: '2px solid #28a745', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>🔄 Nested Context Area (Local Context)</h3>
        <p style={{ fontSize: '14px', color: '#6c757d', marginBottom: '15px' }}>
          이 영역은 로컬 컨텍스트로 감싸져 있어 전역 컨텍스트와 독립적으로 동작합니다.
          로컬 컨텍스트는 전역 컨텍스트에 접근할 수 있지만, 전역 컨텍스트는 로컬 컨텍스트에 접근할 수 없습니다.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <LocalStateComponent name="Area A" />
          <LocalStateComponent name="Area B" />
          <LocalStateComponent name="Area C" />
        </div>
      </div>
    </LocalProvider>
  );
}

// 컨텍스트 경계를 보여주는 컴포넌트
function ContextBoundaryDemo() {
  const [showError, setShowError] = useState(false);

  const testOutsideContext = () => {
    setShowError(true);
    setTimeout(() => setShowError(false), 3000);
  };

  return (
    <div style={{ padding: '20px', border: '2px solid #ffc107', borderRadius: '8px', marginBottom: '20px' }}>
      <h3>⚠️ Context Boundary Demo</h3>
      <p style={{ fontSize: '14px', color: '#6c757d', marginBottom: '15px' }}>
        컨텍스트 외부에서 액션을 호출할 때의 에러 처리를 확인할 수 있습니다.
      </p>

      <button
        type="button"
        onClick={testOutsideContext}
        style={{
          padding: '8px 16px',
          backgroundColor: '#ffc107',
          color: 'black',
          border: 'none',
          borderRadius: '4px',
          marginBottom: '10px',
        }}
      >
        Test Context Boundary Error
      </button>

      {showError && (
        <div style={{
          padding: '10px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          color: '#721c24',
          fontSize: '14px',
        }}>
          💡 실제 에러는 콘솔에서 확인하세요. Context 외부에서 useAction을 호출할 때 발생하는 에러 메시지를 볼 수 있습니다.
        </div>
      )}
    </div>
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
        <p style={{ fontSize: '14px', color: '#6c757d', marginBottom: '15px' }}>
          여러 컴포넌트에서 동일한 글로벌 액션을 트리거할 수 있습니다.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
          <GlobalActionTrigger id="1" />
          <GlobalActionTrigger id="2" />
        </div>
      </div>

      {/* Nested Context */}
      <NestedContextArea />

      {/* Context Boundary Demo */}
      <ContextBoundaryDemo />

      {/* Global Reset Button */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <GlobalResetButton />
      </div>

      {/* Code Example */}
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3>중첩 컨텍스트 예시</h3>
        <pre style={{ overflow: 'auto', fontSize: '14px' }}>
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

function GlobalResetButton() {
  const globalDispatch = useGlobalAction();

  return (
    <button
      type="button"
      onClick={() => globalDispatch('globalReset')}
      style={{
        padding: '12px 24px',
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '16px',
        fontWeight: 'bold',
      }}
    >
      🔄 Reset All Global State
    </button>
  );
}

export function ReactContextPage() {
  return (
    <GlobalProvider>
      <ReactContextContent />
    </GlobalProvider>
  );
}
