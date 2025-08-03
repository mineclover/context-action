import React, { useState, useCallback, createContext, useContext, useRef, useEffect, useId } from 'react';
import {
  ActionRegister,
  ActionPayloadMap,
  ActionProvider,
  useActionDispatch,
  useActionRegister,
  createContextStorePattern,
  useStoreValue
} from '@context-action/react';
import { StoreProvider } from '../../legacy/StoreProvider';
import { PageWithLogMonitor, useActionLoggerWithToast } from '../../components/LogMonitor/';
import { Card, CardContent, Badge, Button, Grid } from '../../components/ui';

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
            <Card variant="elevated" className="border-l-4 border-l-blue-500 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                    🌍 Global Context
                  </h3>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">Level: Global</Badge>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">ID: global-1</Badge>
                  </div>
                </div>
                {children}
                
                <div className="mt-6 pt-4 border-t border-blue-200">
                  <h4 className="text-sm font-medium text-blue-800 mb-3">Recent Global Events:</h4>
                  <div className="space-y-2">
                    {globalEvents.slice(-3).map((event) => (
                      <div key={event.id} className="flex justify-between items-center text-xs bg-white rounded p-2 border border-blue-200">
                        <span className="font-medium text-blue-700">{event.event}</span>
                        <span className="text-blue-500">{event.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
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
        <Card className="border-l-4 border-l-green-500 bg-green-50 ml-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-semibold text-green-900 flex items-center gap-2">
                🏠 Local Context ({contextId})
              </h4>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">Parent: {parentContext.level}</Badge>
                <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">Count: {localCount}</Badge>
              </div>
            </div>
            
            <div className="mb-4 p-3 bg-white rounded border border-green-200">
              <div className="text-sm text-green-700"><strong>Message:</strong> {localMessage}</div>
            </div>
            
            {children}
          </CardContent>
        </Card>
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
        <Card className={`border-l-4 ${level === 1 ? 'border-l-purple-500 bg-purple-50 ml-4' : 'border-l-orange-500 bg-orange-50 ml-6'}`}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-3">
              <h5 className={`text-sm font-semibold ${level === 1 ? 'text-purple-900' : 'text-orange-900'} flex items-center gap-2`}>
                🧩 Nested Level {level}
              </h5>
              <div className="flex gap-1">
                <Badge variant="outline" className={`${level === 1 ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'} text-xs`}>Parent: {parentContext.level}</Badge>
                <Badge variant="outline" className={`${level === 1 ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'} text-xs`}>Value: {nestedValue}</Badge>
              </div>
            </div>
            {children}
          </CardContent>
        </Card>
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
    <Card variant="elevated">
      <CardContent className="p-4">
        <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
          📊 Context Monitor
        </h3>
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded border">
            <div className="text-sm font-medium text-gray-700 mb-1">Global Message:</div>
            <div className="text-gray-900 text-sm">{globalMessage}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded border">
            <div className="text-sm font-medium text-gray-700 mb-1">Active Contexts:</div>
            <div className="text-xl font-bold text-primary-600">{contextCount}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded border">
            <div className="text-sm font-medium text-gray-700 mb-2">Recent Events:</div>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {Array.isArray(globalEvents) ? globalEvents.slice(-3).map((event, index) => (
                <div key={index} className="flex justify-between items-center text-xs bg-white rounded p-2 border">
                  <span className="font-medium text-gray-700">{event.event}</span>
                  <span className="text-gray-500">{event.timestamp}</span>
                </div>
              )) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 인터랙티브 컨트롤
 function InteractiveControls() {
  const contextInfo = useContext(ContextInfoContext);
  
  const handleGlobalMessage = useCallback(() => {
    // 랜덤 글로벌 메시지 생성 함수
    const generateRandomGlobalMessage = () => {
      const globalMessages = [
        'System maintenance scheduled for tonight',
        'New feature release announcement',
        'Security update completed successfully',
        'Database backup process initiated',
        'Server performance optimization applied',
        'User authentication system upgraded',
        'Cache refresh operation completed',
        'Content delivery network updated',
        'API rate limiting rules modified',
        'Monitoring alerts configuration changed'
      ];
      
      return globalMessages[Math.floor(Math.random() * globalMessages.length)];
    };
    
    const randomMessage = generateRandomGlobalMessage();
    globalActionRegister.dispatch('globalMessage', { message: randomMessage });
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
    <div className="mt-3 p-3 bg-white rounded border border-gray-200">
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-gray-700">Current Context:</span>
          <Badge className="bg-gray-100 text-gray-800 text-xs">{contextInfo.level} ({contextInfo.id})</Badge>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="primary" onClick={handleGlobalMessage}>
            🎲 Random Global Message
          </Button>
          <Button size="sm" variant="secondary" onClick={handleBroadcast}>
            Broadcast Event
          </Button>
          {contextInfo.level.includes('Local') && (
            <>
              <Button size="sm" variant="success" onClick={handleLocalAction}>
                Local Counter +1
              </Button>
              <Button size="sm" variant="info" onClick={handleRequestGlobal}>
                Request Global
              </Button>
            </>
          )}
          {contextInfo.level.includes('Nested') && (
            <>
              <Button size="sm" variant="warning" onClick={handleNestedAction}>
                Nested Action
              </Button>
              <Button size="sm" variant="danger" onClick={handleBubbleUp}>
                Bubble Up
              </Button>
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
          <div className="space-y-6 mb-6">
            <ContextMonitor />
            
            {/* 컨텍스트 설명 */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-md font-semibold text-gray-900 mb-3">🏗️ Context Hierarchy</h3>
                <div className="text-sm space-y-2">
                  <div className="flex items-center text-blue-600 font-medium">
                    🌍 Global Context
                  </div>
                  <div className="ml-4 space-y-1">
                    <div className="flex items-center text-green-600">
                      🏠 Local Context A
                    </div>
                    <div className="ml-4 space-y-1">
                      <div className="flex items-center text-purple-600">
                        🧩 Nested Level 1
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center text-orange-600">
                          🧩 Nested Level 2
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center text-green-600">
                      🏠 Local Context B
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* 컨텍스트 패턴들 */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-md font-semibold text-gray-900 mb-3">🔧 Context Patterns</h3>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-gray-50 rounded border">
                    <div className="font-medium text-gray-900 mb-1">Context Isolation</div>
                    <div className="text-gray-600">각 컨텍스트는 독립적인 ActionRegister를 가짐</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded border">
                    <div className="font-medium text-gray-900 mb-1">Event Bubbling</div>
                    <div className="text-gray-600">하위 컨텍스트에서 상위로 이벤트 전파</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded border">
                    <div className="font-medium text-gray-900 mb-1">Cross-Context Communication</div>
                    <div className="text-gray-600">다른 컨텍스트에 메시지 전송</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded border">
                    <div className="font-medium text-gray-900 mb-1">Context Boundaries</div>
                    <div className="text-gray-600">명확한 책임 범위와 데이터 경계</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
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
          </div>
        </GlobalContextProvider>

        {/* 코드 예제 */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Multi-Context Implementation</h3>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
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
          </CardContent>
        </Card>
      </div>
    </PageWithLogMonitor>
  );
}

export default ReactContextPage;