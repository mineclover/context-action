import React, { useState, useCallback, createContext, useContext, useRef, useEffect, useId } from 'react';
import {
  ActionRegister,
  ActionPayloadMap,
  ActionProvider,
  StoreProvider,
  useActionDispatch,
  useActionRegister,
  createContextStorePattern,
  useStoreValue
} from '@context-action/react';
import { PageWithLogMonitor, useActionLoggerWithToast } from '../../components/LogMonitor/';

// 이벤트 엔트리 타입 정의
interface EventEntry {
  id: string;
  event: string;
  data: unknown;
  timestamp: string;
}

// 다양한 컨텍스트 레벨에서 사용할 액션 타입들
interface GlobalActions extends ActionPayloadMap {
  globalMessage: { message: string };
  broadcastEvent: { event: string; data: any };
}

interface LocalActions extends ActionPayloadMap {
  localCounter: { increment: number };
  localMessage: { message: string };
  requestGlobal: { request: string };
}

interface NestedActions extends ActionPayloadMap {
  nestedAction: { value: string };
  bubbleUp: { data: any };
}

/**
 * React 다중 컨텍스트 시스템용 Context Store 패턴
 * 계층적 컨텍스트에서 Store Registry 격리를 제공
 * 
 * @implements store-registry
 * @implements store-integration-pattern
 * @memberof core-concepts
 * @example
 * // 전역 스토어들을 위한 Context Store 패턴
 * const GlobalStores = createContextStorePattern('ReactContextGlobal');
 * 
 * // Provider 계층 구조
 * <GlobalStores.Provider>
 *   <LocalContextProvider contextId="local-A">
 *     <NestedContextProvider level={1}>
 *       <InteractiveControls />
 *     </NestedContextProvider>
 *   </LocalContextProvider>
 * </GlobalStores.Provider>
 * @since 1.0.0
 */
const GlobalStores = createContextStorePattern('ReactContextGlobal');

  // 로거는 useActionLoggerWithToast 훅에서 자동 생성됨

// 컨텍스트 정보를 전달하기 위한 Context
const ContextInfoContext = createContext<{
  level: string;
  id: string;
  onContextEvent: (event: string, data: any) => void;
}>({ level: 'unknown', id: 'unknown', onContextEvent: () => {} });

// 전역 컨텍스트 컴포넌트
function GlobalContextProvider({ children }: { children: React.ReactNode }) {
  const componentId = useId();
  const [globalEvents, setGlobalEvents] = useState<Array<{ id: string; event: string; data: any; timestamp: string }>>([]);
  
  const handleGlobalEvent = useCallback((event: string, data: any) => {
    const eventEntry = {
      id: `${componentId}-${Date.now()}`,
      event,
      data,
      timestamp: new Date().toLocaleTimeString()
    };
    setGlobalEvents(prev => [...prev, eventEntry]);
  }, [componentId]);
  
  return (
    <ContextInfoContext.Provider value={{ level: 'Global', id: 'global-1', onContextEvent: handleGlobalEvent }}>
      <ActionProvider >
        <StoreProvider>
          <GlobalStores.Provider>
            <GlobalContextSetup />
            <div className="context-wrapper global-context">
              <div className="context-header">
                <h3>🌍 Global Context</h3>
                <div className="context-info">
                  <span>Level: Global</span>
                  <span>ID: global-1</span>
                </div>
              </div>
              {children}
              
              <div className="global-events">
                <h4>Global Events:</h4>
                <div className="event-list">
                  {globalEvents.slice(-3).map((event) => (
                    <div key={event.id} className="event-entry">
                      <span className="event-name">{event.event}</span>
                      <span className="event-time">{event.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlobalStores.Provider>
        </StoreProvider>
      </ActionProvider>
    </ContextInfoContext.Provider>
  );
}

// ActionRegister 인스턴스들
const globalActionRegister = new ActionRegister<GlobalActions>({});

// 전역 컨텍스트 설정
function GlobalContextSetup() {
  const contextInfo = useContext(ContextInfoContext);
  const globalMessageStore = GlobalStores.useStore('global-message', 'Welcome to Multi-Context Demo');
  const globalEventStore = GlobalStores.useStore<EventEntry[]>('global-events', []);
  
  React.useEffect(() => {
    const unsubscribe1 = globalActionRegister.register('globalMessage', ({ message }, controller) => {
      globalMessageStore.setValue(message);
      contextInfo.onContextEvent('globalMessage', { message });
      controller.next();
    });
    
    const unsubscribe2 = globalActionRegister.register('broadcastEvent', ({ event, data }, controller) => {
      const eventEntry = {
        id: `global-${Date.now()}`,
        event,
        data,
        timestamp: new Date().toLocaleTimeString()
      };
      globalEventStore.update(prev => [...prev, eventEntry]);
      contextInfo.onContextEvent('broadcastEvent', { event, data });
      controller.next();
    });
    
    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [contextInfo, globalMessageStore, globalEventStore]);
  
  return null;
}

// 로컬 컨텍스트 컴포넌트
// 로컬 ActionRegister 인스턴스들
const localActionRegisters = new Map<string, ActionRegister<LocalActions>>();

function LocalContextProvider({ children, contextId }: { children: React.ReactNode; contextId: string }) {
  const [localCount, setLocalCount] = useState<number>(0);
  const [localMessage, setLocalMessage] = useState(`Local context ${contextId}`);
  const parentContext = useContext(ContextInfoContext);
  
  const handleLocalEvent = useCallback((event: string, data: any) => {
    parentContext.onContextEvent(`${contextId}:${event}`, data);
  }, [parentContext, contextId]);
  
  const contextValue = {
    level: 'Local',
    id: contextId,
    onContextEvent: handleLocalEvent
  };
  
  return (
    <ContextInfoContext.Provider value={contextValue}>
      <ActionProvider >
        <LocalContextSetup localCount={localCount} setLocalCount={setLocalCount} localMessage={localMessage} setLocalMessage={setLocalMessage} contextId={contextId} />
        <div className="context-wrapper local-context">
          <div className="context-header">
            <h4>🏠 Local Context ({contextId})</h4>
            <div className="context-info">
              <span>Parent: {parentContext.level}</span>
              <span>Count: {localCount}</span>
            </div>
          </div>
          
          <div className="local-state">
            <div>Message: {localMessage}</div>
          </div>
          
          {children}
        </div>
      </ActionProvider>
    </ContextInfoContext.Provider>
  );
}

// 로컬 컨텍스트 설정
function LocalContextSetup({ 
  localCount, 
  setLocalCount, 
  localMessage, 
  setLocalMessage,
  contextId 
}: {
  localCount: number;
  setLocalCount: (count: number) => void;
  localMessage: string;
  setLocalMessage: (message: string) => void;
  contextId: string;
}) {
  const contextInfo = useContext(ContextInfoContext);
  const localCountRef = useRef(localCount);
  
  // localCount가 변경될 때 ref도 업데이트
  useEffect(() => {
    localCountRef.current = localCount;
  }, [localCount]);
  
  React.useEffect(() => {
    // 컨텍스트별 ActionRegister 생성
    if (!localActionRegisters.has(contextId)) {
      localActionRegisters.set(contextId, new ActionRegister<LocalActions>({}));
    }
    const localRegister = localActionRegisters.get(contextId)!;
    
    const unsubscribe1 = localRegister.register('localCounter', ({ increment }, controller) => {
      const newCount = localCountRef.current + increment;
      setLocalCount(newCount);
      contextInfo.onContextEvent('localCounter', { increment, newCount });
      controller.next();
    });
    
    const unsubscribe2 = localRegister.register('localMessage', ({ message }, controller) => {
      setLocalMessage(message);
      contextInfo.onContextEvent('localMessage', { message });
      controller.next();
    });
    
    const unsubscribe3 = localRegister.register('requestGlobal', ({ request }, controller) => {
      // 로컬 컨텍스트에서 전역 컨텍스트로 요청
      globalActionRegister.dispatch('globalMessage', { message: `Request from ${contextInfo.id}: ${request}` });
      contextInfo.onContextEvent('requestGlobal', { request });
      controller.next();
    });
    
    return () => {
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    };
  }, [contextInfo, setLocalCount, setLocalMessage, contextId]);
  
  return null;
}

// 중첩된 컨텍스트 컴포넌트
function NestedContextProvider({ children, level }: { children: React.ReactNode; level: number }) {
  const [nestedValue, setNestedValue] = useState(`Nested Level ${level}`);
  const parentContext = useContext(ContextInfoContext);
  
  const handleNestedEvent = useCallback((event: string, data: any) => {
    parentContext.onContextEvent(`nested-L${level}:${event}`, data);
  }, [parentContext, level]);
  
  const contextValue = {
    level: `Nested-${level}`,
    id: `nested-${level}`,
    onContextEvent: handleNestedEvent
  };
  
  return (
    <ContextInfoContext.Provider value={contextValue}>
      <ActionProvider >
        <NestedContextSetup nestedValue={nestedValue} setNestedValue={setNestedValue} level={level} />
        <div className={`context-wrapper nested-context level-${level}`}>
          <div className="context-header">
            <h5>🧩 Nested Level {level}</h5>
            <div className="context-info">
              <span>Parent: {parentContext.level}</span>
              <span>Value: {nestedValue}</span>
            </div>
          </div>
          {children}
        </div>
      </ActionProvider>
    </ContextInfoContext.Provider>
  );
}

// 중첩된 ActionRegister 인스턴스들
const nestedActionRegisters = new Map<number, ActionRegister<NestedActions>>();

// 중첩된 컨텍스트 설정
function NestedContextSetup({ nestedValue, setNestedValue, level }: { nestedValue: string; setNestedValue: (value: string) => void; level: number }) {
  const contextInfo = useContext(ContextInfoContext);
  
  React.useEffect(() => {
    // 레벨별 ActionRegister 생성
    if (!nestedActionRegisters.has(level)) {
      nestedActionRegisters.set(level, new ActionRegister<NestedActions>({}));
    }
    const nestedRegister = nestedActionRegisters.get(level)!;
    
    const unsubscribe1 = nestedRegister.register('nestedAction', ({ value }, controller) => {
      setNestedValue(value);
      contextInfo.onContextEvent('nestedAction', { value, level });
      controller.next();
    });
    
    const unsubscribe2 = nestedRegister.register('bubbleUp', ({ data }, controller) => {
      contextInfo.onContextEvent('bubbleUp', { data, level });
      controller.next();
    });
    
    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [contextInfo, setNestedValue, level]);
  
  return null;
}

// 컨텍스트 상태 모니터
function ContextMonitor() {
  const globalMessageStore = GlobalStores.useStore('global-message', 'Welcome to Multi-Context Demo');
  const globalEventStore = GlobalStores.useStore<EventEntry[]>('global-events', []);
  const contextCountStore = GlobalStores.useStore('context-count', 0);
  
  const globalMessage = useStoreValue(globalMessageStore);
  const globalEvents = useStoreValue(globalEventStore);
  const contextCount = useStoreValue(contextCountStore);
  
  return (
    <div className="demo-card monitor-card">
      <h3>Context Monitor</h3>
      <div className="monitor-section">
        <div className="monitor-item">
          <strong>Global Message:</strong>
          <span>{globalMessage}</span>
        </div>
        <div className="monitor-item">
          <strong>Active Contexts:</strong>
          <span>{contextCount}</span>
        </div>
        <div className="monitor-item">
          <strong>Recent Events:</strong>
          <div className="event-monitor">
            {Array.isArray(globalEvents) ? globalEvents.slice(-5).map((event, index) => (
              <div key={index} className="event-monitor-entry">
                <span className="event-name">{event.event}</span>
                <span className="event-time">{event.timestamp}</span>
              </div>
            )) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// 인터랙티브 컨트롤
 function InteractiveControls() {
  const contextInfo = useContext(ContextInfoContext);
  
  const handleGlobalMessage = useCallback(() => {
    const message = prompt('Enter global message:');
    if (message) {
      globalActionRegister.dispatch('globalMessage', { message });
    }
  }, []);
  
  const handleBroadcast = useCallback(() => {
    globalActionRegister.dispatch('broadcastEvent', { 
      event: 'test-broadcast', 
      data: { timestamp: Date.now(), from: contextInfo.id } 
    });
  }, [contextInfo]);
  
  const handleLocalAction = useCallback(() => {
    if (contextInfo.level.includes('Local')) {
      const localRegister = localActionRegisters.get(contextInfo.id);
      if (localRegister) {
        localRegister.dispatch('localCounter', { increment: 1 });
      }
    }
  }, [contextInfo]);
  
  const handleRequestGlobal = useCallback(() => {
    if (contextInfo.level.includes('Local')) {
      const localRegister = localActionRegisters.get(contextInfo.id);
      if (localRegister) {
        localRegister.dispatch('requestGlobal', { request: 'Hello from local context' });
      }
    }
  }, [contextInfo]);
  
  const handleNestedAction = useCallback(() => {
    if (contextInfo.level.includes('Nested')) {
      const level = parseInt(contextInfo.id.split('-')[1]);
      const nestedRegister = nestedActionRegisters.get(level);
      if (nestedRegister) {
        const value = `Updated at ${new Date().toLocaleTimeString()}`;
        nestedRegister.dispatch('nestedAction', { value });
      }
    }
  }, [contextInfo]);
  
  const handleBubbleUp = useCallback(() => {
    if (contextInfo.level.includes('Nested')) {
      const level = parseInt(contextInfo.id.split('-')[1]);
      const nestedRegister = nestedActionRegisters.get(level);
      if (nestedRegister) {
        nestedRegister.dispatch('bubbleUp', { data: `Bubble from ${contextInfo.id}` });
      }
    }
  }, [contextInfo]);
  
  return (
    <div className="interactive-controls">
      <div className="control-section">
        <h5>Current Context: {contextInfo.level} ({contextInfo.id})</h5>
        <div className="button-group">
          <button onClick={handleGlobalMessage} className="btn btn-primary">
            Global Message
          </button>
          <button onClick={handleBroadcast} className="btn btn-secondary">
            Broadcast Event
          </button>
          {contextInfo.level.includes('Local') && (
            <>
              <button onClick={handleLocalAction} className="btn btn-success">
                Local Counter +1
              </button>
              <button onClick={handleRequestGlobal} className="btn btn-info">
                Request Global
              </button>
            </>
          )}
          {contextInfo.level.includes('Nested') && (
            <>
              <button onClick={handleNestedAction} className="btn btn-warning">
                Nested Action
              </button>
              <button onClick={handleBubbleUp} className="btn btn-danger">
                Bubble Up
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ReactContextPage() {
  return (
    <PageWithLogMonitor pageId="react-context" title="React Multi-Context System">
      <div className="page-container">
        <header className="page-header">
          <h1>React Multi-Context System</h1>
          <p className="page-description">
            Learn how to manage multiple nested contexts, handle context boundaries,
            and implement communication patterns between different context levels.
          </p>
        </header>

        <GlobalContextProvider>
          <div className="context-demo-grid">
            <ContextMonitor />
            
            {/* 첫 번째 로컬 컨텍스트 */}
            <LocalContextProvider contextId="local-A">
              <InteractiveControls />
              
              {/* 중첩된 컨텍스트 1 */}
              <NestedContextProvider level={1}>
                <InteractiveControls />
                
                {/* 중첩된 컨텍스트 2 */}
                <NestedContextProvider level={2}>
                  <InteractiveControls />
                </NestedContextProvider>
              </NestedContextProvider>
            </LocalContextProvider>
            
            {/* 두 번째 로컬 컨텍스트 */}
            <LocalContextProvider contextId="local-B">
              <InteractiveControls />
            </LocalContextProvider>
            
            {/* 컨텍스트 설명 */}
            <div className="demo-card info-card">
              <h3>Context Hierarchy</h3>
              <ul className="context-hierarchy">
                <li>
                  <strong>🌍 Global Context</strong>
                  <ul>
                    <li>
                      🏠 Local Context A
                      <ul>
                        <li>
                          🧩 Nested Level 1
                          <ul>
                            <li>🧩 Nested Level 2</li>
                          </ul>
                        </li>
                      </ul>
                    </li>
                    <li>🏠 Local Context B</li>
                  </ul>
                </li>
              </ul>
            </div>
            
            {/* 컨텍스트 패턴들 */}
            <div className="demo-card info-card">
              <h3>Context Patterns</h3>
              <ul className="pattern-list">
                <li>
                  <strong>Context Isolation:</strong> 각 컨텍스트는 독립적인 ActionRegister를 가짐
                </li>
                <li>
                  <strong>Event Bubbling:</strong> 하위 컨텍스트에서 상위로 이벤트 전파
                </li>
                <li>
                  <strong>Cross-Context Communication:</strong> 다른 컨텍스트에 메시지 전송
                </li>
                <li>
                  <strong>Context Boundaries:</strong> 명확한 책임 범위와 데이터 경계
                </li>
              </ul>
            </div>
          </div>
        </GlobalContextProvider>

        {/* 코드 예제 */}
        <div className="code-example">
          <h3>Multi-Context Implementation</h3>
          <pre className="code-block">
{`// 1. 계층적 컨텍스트 구조
function GlobalContextProvider({ children }) {
  return (
    <ActionProvider logger={null}>
      <StoreProvider>
        {children}
      </StoreProvider>
    </ActionProvider>
  );
}

function LocalContextProvider({ children, contextId }) {
  return (
    <ActionProvider logger={null}>
      {children}
    </ActionProvider>
  );
}

// 2. 컨텍스트 간 통신
const ContextInfoContext = createContext({
  level: 'unknown',
  id: 'unknown', 
  onContextEvent: () => {}
});

// 3. 컨텍스트 경계를 넘나드는 액션
const globalDispatch = useActionDispatch<GlobalActions>();
localDispatch('requestGlobal', { request: 'Hello' });

// 로컬 컨텍스트에서 전역 컨텍스트로 전송
globalDispatch('globalMessage', { message: 'From local' });`}
          </pre>
        </div>
      </div>
    </PageWithLogMonitor>
  );
}

export default ReactContextPage;