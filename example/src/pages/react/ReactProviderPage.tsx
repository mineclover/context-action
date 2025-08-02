import React, { useState, useCallback } from 'react';
import {
  ActionRegister,
  ActionProvider,
  StoreProvider,
  useStoreRegistry,
  createStore,
  useStoreValue,
  ActionPayloadMap,
  createLogger
} from '@context-action/react';
import { LogLevel } from '@context-action/logger';
import { PageWithLogMonitor } from '../../components/LogMonitor';

// 액션 타입 정의
interface AppActions extends ActionPayloadMap {
  updateCounter: { value: number };
  resetCounter: undefined;
  updateMessage: { text: string };
  resetMessage: undefined;
  logActivity: { activity: string };
}

// 로거 인스턴스 생성
const logger = createLogger(LogLevel.DEBUG);

// 스토어 인스턴스들
const counterStore = createStore('provider-counter', 0);
const messageStore = createStore('provider-message', 'Hello from Provider!');

// 카운터 컴포넌트
function CounterComponent() {
  const count = useStoreValue(counterStore);

  const handleIncrement = useCallback(() => {
    if (typeof count === 'number') {
      actionRegister.dispatch('updateCounter', { value: count + 1 });
    }
  }, [count]);

  const handleDecrement = useCallback(() => {
    if (typeof count === 'number') {
      actionRegister.dispatch('updateCounter', { value: count - 1 });
    }
  }, [count]);
  
  const handleReset = useCallback(() => {
    actionRegister.dispatch('resetCounter');
  }, []);
  
  return (
    <div className="demo-card">
      <h3>Counter Component</h3>
      <div className="counter-display">
        <span className="count-value">{count}</span>
      </div>
      <div className="button-group">
        <button onClick={handleIncrement} className="btn btn-primary">
          +1
        </button>
        <button onClick={handleDecrement} className="btn btn-primary">
          -1
        </button>
        <button onClick={handleReset} className="btn btn-danger">
          Reset
        </button>
      </div>
    </div>
  );
}

// 메시지 컴포넌트
function MessageComponent() {
  const message = useStoreValue(messageStore);
  const [inputValue, setInputValue] = useState('');
  
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      actionRegister.dispatch('updateMessage', { text: inputValue.trim() });
      setInputValue('');
    }
  }, [inputValue]);
  
  const handleReset = useCallback(() => {
    actionRegister.dispatch('resetMessage');
  }, []);
  
  return (
    <div className="demo-card">
      <h3>Message Component</h3>
      <div className="store-display">
        <div className="store-value">{message}</div>
      </div>
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter new message"
          className="text-input"
        />
        <button type="submit" className="btn btn-primary">
          Update
        </button>
      </form>
      <button onClick={handleReset} className="btn btn-secondary">
        Reset
      </button>
    </div>
  );
}

// 액티비티 로거 컴포넌트
function ActivityLogger() {
  const [activities, setActivities] = useState<string[]>([]);
  
  const logCustomActivity = useCallback(() => {
    const activity = prompt('Enter activity:');
    if (activity) {
      actionRegister.dispatch('logActivity', { activity });
    }
  }, []);
  
  const clearActivities = useCallback(() => {
    setActivities([]);
  }, []);
  
  React.useEffect(() => {
    const addActivity = (activity: string) => {
      setActivities(prev => [
        ...prev,
        `${new Date().toLocaleTimeString()}: ${activity}`
      ]);
    };
    
    // 시스템 이벤트 로깅
    addActivity('Activity Logger initialized');
    
    return () => {
      // Cleanup if needed
    };
  }, []);
  
  return (
    <div className="demo-card logger-card">
      <div className="card-header">
        <h3>Activity Logger</h3>
        <div className="button-group">
          <button onClick={logCustomActivity} className="btn btn-small btn-primary">
            Log Activity
          </button>
          <button onClick={clearActivities} className="btn btn-small btn-secondary">
            Clear
          </button>
        </div>
      </div>
      <div className="activity-log">
        {activities.length === 0 ? (
          <div className="log-empty">No activities logged yet...</div>
        ) : (
          activities.map((activity, index) => (
            <div key={index} className="activity-entry">
              {activity}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// 스토어 모니터 컴포넌트
function StoreMonitor() {
  const registry = useStoreRegistry();
  const counter = useStoreValue(counterStore);
  const message = useStoreValue(messageStore);
  
  return (
    <div className="demo-card monitor-card">
      <h3>Store Registry Monitor</h3>
      <div className="registry-info">
        <div className="registry-stats">
          <div className="stat-item">
            <span className="stat-label">Active Stores:</span>
            <span className="stat-value">2</span>
          </div>
        </div>
        
        <div className="store-list">
          <div className="store-item">
            <div className="store-name">provider-counter</div>
            <div className="store-value">{counter}</div>
          </div>
          <div className="store-item">
            <div className="store-name">provider-message</div>
            <div className="store-value">"{message}"</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ActionRegister 인스턴스 생성
const actionRegister = new ActionRegister<AppActions>({ logger });

// 액션 핸들러 설정 컴포넌트
function ActionHandlerSetup() {
  React.useEffect(() => {
    logger.info('Setting up action handlers');
    
    // 카운터 업데이트 핸들러
    const unsubscribeUpdateCounter = actionRegister.register('updateCounter', ({ value }, controller) => {
      logger.debug(`Updating counter to: ${value}`);
      counterStore.setValue(value);
      controller.next();
    });
    
    // 카운터 리셋 핸들러
    const unsubscribeResetCounter = actionRegister.register('resetCounter', (_, controller) => {
      logger.debug('Resetting counter');
      counterStore.setValue(0);
      controller.next();
    });
    
    // 메시지 업데이트 핸들러
    const unsubscribeUpdateMessage = actionRegister.register('updateMessage', ({ text }, controller) => {
      logger.debug(`Updating message to: ${text}`);
      messageStore.setValue(text);
      controller.next();
    });
    
    // 메시지 리셋 핸들러
    const unsubscribeResetMessage = actionRegister.register('resetMessage', (_, controller) => {
      logger.debug('Resetting message');
      messageStore.setValue('Hello from Provider!');
      controller.next();
    });
    
    // 액티비티 로깅 핸들러
    const unsubscribeLogActivity = actionRegister.register('logActivity', ({ activity }, controller) => {
      logger.info(`Activity logged: ${activity}`);
      controller.next();
    });
    
    logger.info('Action handlers registered successfully');
    
    return () => {
      unsubscribeUpdateCounter();
      unsubscribeResetCounter();
      unsubscribeUpdateMessage();
      unsubscribeResetMessage();
      unsubscribeLogActivity();
      logger.info('Action handlers unregistered');
    };
  }, []);
  
  return null; // 이 컴포넌트는 UI를 렌더링하지 않음
}

// 메인 애플리케이션 컴포넌트
function ProviderApp() {
  return (
    <>
      <ActionHandlerSetup />
      <div className="demo-grid">
        <CounterComponent />
        <MessageComponent />
        <ActivityLogger />
        <StoreMonitor />
        
        {/* Provider 설명 */}
        <div className="demo-card info-card">
          <h3>Provider Pattern Benefits</h3>
          <ul className="benefit-list">
            <li>✓ 전역 상태 관리</li>
            <li>✓ 컴포넌트 간 통신</li>
            <li>✓ 액션 중앙화</li>
            <li>✓ 타입 안전성</li>
            <li>✓ 디버깅 편의성</li>
          </ul>
        </div>
        
        {/* 사용법 가이드 */}
        <div className="demo-card info-card">
          <h3>Provider Usage Guide</h3>
          <ol className="usage-steps">
            <li>ActionProvider로 앱 래핑</li>
            <li>StoreProvider로 스토어 제공</li>
            <li>useActionDispatch로 액션 디스패치</li>
            <li>useStoreValue로 상태 구독</li>
          </ol>
        </div>
      </div>
    </>
  );
}

function ReactProviderPage() {
  return (
    <PageWithLogMonitor pageId="react-provider" title="React Provider Pattern">
      <div className="page-container">
        <header className="page-header">
          <h1>React Provider Pattern</h1>
          <p className="page-description">
            Learn how to integrate the Context-Action framework with React using the Provider pattern.
            This enables global state management and centralized action dispatching across your application.
          </p>
        </header>

        {/* Provider 래핑 */}
        <ActionProvider config={{ logger }}>
          <StoreProvider>
            <ProviderApp />
          </StoreProvider>
        </ActionProvider>

        {/* 코드 예제 */}
        <div className="code-example">
          <h3>Provider Setup Code</h3>
          <pre className="code-block">
{`// 1. App 래핑
function App() {
  return (
    <ActionProvider logger={logger}>
      <StoreProvider>
        <MyApp />
      </StoreProvider>
    </ActionProvider>
  );
}

// 2. 컴포넌트에서 사용
function MyComponent() {
  const dispatch = useActionDispatch<AppActions>();
  const value = useStoreValue(myStore);
  
  const handleAction = () => {
    dispatch('updateValue', { newValue: 'updated' });
  };
  
  return (
    <div>
      <p>{value}</p>
      <button onClick={handleAction}>Update</button>
    </div>
  );
}`}
          </pre>
        </div>
      </div>
    </PageWithLogMonitor>
  );
}

export default ReactProviderPage;