import React, { useState, useCallback, createContext, useContext, useRef, useEffect, useId } from 'react';

// Custom CSS for animations
const customStyles = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }
  
  @keyframes scale-bounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  .animate-scale-bounce {
    animation: scale-bounce 0.6s ease-in-out;
  }
  
  @keyframes flow-arrow {
    0% { transform: translateX(-5px); opacity: 0.5; }
    50% { transform: translateX(0px); opacity: 1; }
    100% { transform: translateX(5px); opacity: 0.5; }
  }
  
  .animate-flow-arrow {
    animation: flow-arrow 2s ease-in-out infinite;
  }
  
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.3); }
    50% { box-shadow: 0 0 15px rgba(59, 130, 246, 0.6); }
  }
  
  .animate-pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
  }
  
  @keyframes slide-in-right {
    from { transform: translateX(10px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  .animate-slide-in-right {
    animation: slide-in-right 0.4s ease-out;
  }
  
  .transition-smooth {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  /* 반응형 디자인 개선 */
  @media (max-width: 768px) {
    .grid-cols-2 {
      grid-template-columns: 1fr;
    }
    
    .flex-wrap {
      flex-direction: column;
      align-items: stretch;
    }
    
    .ml-6, .ml-8 {
      margin-left: 1rem;
    }
    
    .text-lg {
      font-size: 1rem;
    }
    
    .p-5 {
      padding: 1rem;
    }
  }
  
  @media (max-width: 480px) {
    .grid-cols-2 {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }
    
    .p-4 {
      padding: 0.75rem;
    }
    
    .gap-3 {
      gap: 0.5rem;
    }
    
    .text-sm {
      font-size: 0.75rem;
    }
  }
  
  /* 다크 모드 지원 */
  @media (prefers-color-scheme: dark) {
    .bg-white {
      background-color: rgb(31 41 55);
      color: rgb(229 231 235);
    }
    
    .border-gray-200 {
      border-color: rgb(75 85 99);
    }
    
    .text-gray-700 {
      color: rgb(209 213 219);
    }
    
    .bg-gray-50 {
      background-color: rgb(55 65 81);
    }
  }
`;
import {
  ActionPayloadMap,
  createContextPattern,
  useStoreValueSafe
} from '@context-action/react';
import { PageWithLogMonitor } from '../../components/LogMonitor/';
import { Card, CardContent, Badge, Button, UnifiedPatternBadge } from '../../components/ui';

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
  logContextEvent: { eventType: string; contextId: string; data: any };
  updateContextCount: { count: number };
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
 * 통합 Context Pattern을 활용한 다중 컨텍스트 시스템
 * Store + Action을 모두 포함하는 통합 관리 패턴
 * 
 * @implements unified-context-pattern
 * @implements store-action-integration
 * @memberof core-concepts
 * @example
 * // 통합 Context Pattern 생성
 * const GlobalContext = createContextPattern<GlobalActions>('ReactContextGlobal');
 * 
 * // Provider + Store + Action 모두 제공
 * <GlobalContext.Provider>
 *   <LocalContext.Provider contextId="local-A">
 *     <NestedContext.Provider level={1}>
 *       <InteractiveControls />
 *     </NestedContext.Provider>
 *   </LocalContext.Provider>
 * </GlobalContext.Provider>
 * @since 1.0.0
 */
const GlobalContext = createContextPattern<GlobalActions>('ReactContextGlobal');
const LocalContext = createContextPattern<LocalActions>('ReactContextLocal');
const NestedContext = createContextPattern<NestedActions>('ReactContextNested');

// 컨텍스트 정보를 전달하기 위한 Context
const ContextInfoContext = createContext<{
  level: string;
  id: string;
  onContextEvent: (event: string, data: any) => void;
}>({ level: 'unknown', id: 'unknown', onContextEvent: () => {} });

// 전역 컨텍스트 컴포넌트 - 통합 Context Pattern 사용 (이벤트 플로우 시각화 포함)
function GlobalContextProvider({ children }: { children: React.ReactNode }) {
  const componentId = useId();
  const [globalEvents, setGlobalEvents] = useState<Array<{ id: string; event: string; data: any; timestamp: string }>>([]);
  const [eventFlow, setEventFlow] = useState<Array<{ id: string; from: string; to: string; action: string; timestamp: number }>>([]);
  
  const handleGlobalEvent = useCallback((event: string, data: any) => {
    const eventEntry = {
      id: `${componentId}-${Date.now()}`,
      event,
      data,
      timestamp: new Date().toLocaleTimeString()
    };
    setGlobalEvents(prev => [...prev, eventEntry]);
    
    // 이벤트 플로우 추적 (Cross-context communication용)
    if (event.includes(':')) {
      const [fromContext, actionName] = event.split(':');
      const flowEntry = {
        id: `flow-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        from: fromContext,
        to: 'global',
        action: actionName,
        timestamp: Date.now()
      };
      setEventFlow(prev => [...prev.slice(-9), flowEntry]); // 최근 10개만 유지
    }
  }, [componentId]);
  
  return (
    <ContextInfoContext.Provider value={{ level: 'Global', id: 'global-1', onContextEvent: handleGlobalEvent }}>
      <GlobalContext.Provider registryId="global-context">
        <GlobalContextSetup />
        <Card variant="elevated" className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-blue-900 flex items-center gap-3">
                <div className="relative">
                  🌍
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-400 rounded-full animate-ping opacity-30"></div>
                </div>
                <div className="flex flex-col">
                  <span>Global Context</span>
                  <span className="text-sm text-blue-600 font-normal">Unified Pattern</span>
                </div>
              </h3>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-200 transition-all duration-200 shadow-sm">
                  Level: Global
                </Badge>
                <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-200 transition-all duration-200 shadow-sm">
                  ID: global-1
                </Badge>
                <UnifiedPatternBadge />
              </div>
            </div>
            {children}
            
            <div className="mt-6 pt-4 border-t border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-3">🔄 Event Flow Visualization:</h4>
              <div className="space-y-2 mb-4">
                {eventFlow.slice(-3).map((flow, index) => (
                  <div key={flow.id} className="flex items-center gap-2 text-xs bg-white rounded p-2 border border-blue-200 animate-slide-in-right animate-pulse-glow" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="flex items-center gap-1">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-medium transition-smooth hover:scale-110">{flow.from}</span>
                      <span className="text-blue-500 animate-flow-arrow">→</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium transition-smooth hover:scale-110">{flow.to}</span>
                    </div>
                    <div className="flex-1 text-center font-medium text-blue-800 px-2 py-1 bg-blue-50 rounded">{flow.action}</div>
                    <div className="text-blue-500 text-xs px-2 py-1 bg-gray-50 rounded">{new Date(flow.timestamp).toLocaleTimeString('ko-KR')}</div>
                  </div>
                ))}
                {eventFlow.length === 0 && (
                  <div className="text-xs text-blue-600 italic p-3 text-center bg-blue-50 rounded border border-blue-200 border-dashed transition-smooth hover:bg-blue-100">
                    <div className="animate-pulse">💫 Cross-context events will appear here</div>
                    <div className="text-xs mt-1 opacity-70">Click buttons to see event propagation flow</div>
                  </div>
                )}
              </div>
              
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
      </GlobalContext.Provider>
    </ContextInfoContext.Provider>
  );
}

// 전역 컨텍스트 설정 - 통합 패턴 사용
function GlobalContextSetup() {
  const contextInfo = useContext(ContextInfoContext);
  
  // 통합 Context Pattern의 Store와 Action 사용
  const globalMessageStore = GlobalContext.useStore('global-message', 'Welcome to Unified Context Demo');
  const globalEventStore = GlobalContext.useStore<EventEntry[]>('global-events', []);
  
  // 공통 이벤트 로깅 함수
  const logEvent = useCallback((eventType: string, eventData: any) => {
    const eventEntry: EventEntry = {
      id: `global-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      event: eventType,
      data: eventData,
      timestamp: new Date().toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      })
    };
    globalEventStore.update(prev => [...prev, eventEntry]);
  }, [globalEventStore]);
  
  // Action Handler 등록
  GlobalContext.useActionHandler('globalMessage', ({ message }) => {
    globalMessageStore.setValue(message);
    logEvent('globalMessage', { message });
    contextInfo.onContextEvent('globalMessage', { message });
  });
  
  GlobalContext.useActionHandler('broadcastEvent', ({ event, data }) => {
    logEvent('broadcastEvent', { event, data });
    contextInfo.onContextEvent('broadcastEvent', { event, data });
  });
  
  // 다른 컨텍스트에서 발생한 이벤트도 전역 이벤트로 기록
  GlobalContext.useActionHandler('logContextEvent', ({ eventType, contextId, data }) => {
    logEvent(`${contextId}:${eventType}`, data);
  });
  
  return null;
}

// 로컬 컨텍스트 컴포넌트 - 통합 Context Pattern 사용 (UI/UX 개선)
function LocalContextProvider({ children, contextId }: { children: React.ReactNode; contextId: string }) {
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
      <LocalContext.Provider registryId={`local-context-${contextId}`}>
        <LocalContextContent />
        <div className="relative ml-6 mt-4">
          {/* 계층 구조 시각화 라인 */}
          <div className="absolute -left-6 top-0 bottom-0 w-px bg-gradient-to-b from-green-300 to-green-500"></div>
          <div className="absolute -left-6 top-6 w-6 h-px bg-green-400"></div>
          
          <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-green-25 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]">
            <CardContent className="p-5">
              <div className="relative">
                {/* 컨텍스트 레벨 인디케이터 */}
                <div className="absolute -top-2 -left-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                {children}
              </div>
            </CardContent>
          </Card>
        </div>
      </LocalContext.Provider>
    </ContextInfoContext.Provider>
  );
}

// 로컬 컨텍스트 내용 컴포넌트
function LocalContextContent() {
  const contextInfo = useContext(ContextInfoContext);
  
  // 통합 패턴의 Store 사용
  const localCountStore = LocalContext.useStore('local-count', 0);
  const localMessageStore = LocalContext.useStore('local-message', `Local context ${contextInfo.id}`);
  
  const localCount = useStoreValueSafe(localCountStore);
  const localMessage = useStoreValueSafe(localMessageStore);
  const parentContext = useContext(ContextInfoContext);
  
  // 전역 이벤트 로깅을 위한 dispatch
  const globalDispatch = GlobalContext.useAction();
  
  // Action Handler 등록
  LocalContext.useActionHandler('localCounter', ({ increment }) => {
    const newCount = localCount + increment;
    localCountStore.setValue(newCount);
    contextInfo.onContextEvent('localCounter', { increment, newCount });
    // 전역 이벤트 로그에 기록
    globalDispatch('logContextEvent', { 
      eventType: 'localCounter', 
      contextId: contextInfo.id, 
      data: { increment, newCount } 
    });
  });
  
  LocalContext.useActionHandler('localMessage', ({ message }) => {
    localMessageStore.setValue(message);
    contextInfo.onContextEvent('localMessage', { message });
    // 전역 이벤트 로그에 기록
    globalDispatch('logContextEvent', { 
      eventType: 'localMessage', 
      contextId: contextInfo.id, 
      data: { message } 
    });
  });
  
  LocalContext.useActionHandler('requestGlobal', ({ request }) => {
    // 로컬에서 전역으로 요청
    globalDispatch('globalMessage', { message: `Request from ${contextInfo.id}: ${request}` });
    contextInfo.onContextEvent('requestGlobal', { request });
    // 전역 이벤트 로그에 기록
    globalDispatch('logContextEvent', { 
      eventType: 'requestGlobal', 
      contextId: contextInfo.id, 
      data: { request } 
    });
  });
  
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-green-900 flex items-center gap-3">
          <div className="relative">
            🏠
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div className="flex flex-col">
            <span>Local Context ({contextInfo.id})</span>
            <span className="text-xs text-green-600 font-normal">Unified Pattern</span>
          </div>
        </h4>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="bg-green-100 text-green-800 text-xs hover:bg-green-200 transition-all duration-200">
            Parent: {parentContext.level}
          </Badge>
          <Badge variant="outline" className={`text-xs transition-all duration-300 hover:scale-110 ${
            localCount > 0 
              ? 'bg-green-200 text-green-900 animate-pulse shadow-md' 
              : 'bg-green-100 text-green-800'
          }`}>
            Count: {localCount}
          </Badge>
          <UnifiedPatternBadge size="sm" />
        </div>
      </div>
      
      <div className="mb-4 p-4 bg-gradient-to-r from-white to-green-25 rounded-lg border border-green-200 transition-all duration-300 hover:shadow-md hover:from-green-25 hover:to-green-50">
        <div className="flex items-center text-sm text-green-700">
          <div className="flex items-center gap-2 mr-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <strong>Message:</strong>
          </div>
          <div className="flex-1 px-3 py-2 bg-gradient-to-r from-green-100 to-green-200 rounded-md font-medium transition-all duration-300 hover:from-green-200 hover:to-green-300 text-green-800">
            {localMessage}
          </div>
        </div>
      </div>
    </div>
  );
}


// 중첩된 컨텍스트 컴포넌트 - 통합 Context Pattern 사용 (UI/UX 개선)
function NestedContextProvider({ children, level }: { children: React.ReactNode; level: number }) {
  const parentContext = useContext(ContextInfoContext);
  
  const handleNestedEvent = useCallback((event: string, data: any) => {
    parentContext.onContextEvent(`nested-L${level}:${event}`, data);
  }, [parentContext, level]);
  
  const contextValue = {
    level: `Nested-${level}`,
    id: `nested-${level}`,
    onContextEvent: handleNestedEvent
  };
  
  const getNestedStyle = (level: number) => {
    if (level === 1) {
      return {
        borderColor: 'border-l-purple-500',
        bgColor: 'bg-gradient-to-r from-purple-50 to-purple-25',
        lineColor: 'from-purple-300 to-purple-500',
        dotColor: 'bg-purple-500',
        connectColor: 'bg-purple-400',
        margin: 'ml-6'
      };
    } else {
      return {
        borderColor: 'border-l-orange-500', 
        bgColor: 'bg-gradient-to-r from-orange-50 to-orange-25',
        lineColor: 'from-orange-300 to-orange-500',
        dotColor: 'bg-orange-500',
        connectColor: 'bg-orange-400',
        margin: 'ml-8'
      };
    }
  };
  
  const style = getNestedStyle(level);
  
  return (
    <ContextInfoContext.Provider value={contextValue}>
      <NestedContext.Provider registryId={`nested-context-${level}`}>
        <NestedContextContent level={level} />
        <div className={`relative ${style.margin} mt-4`}>
          {/* 계층 구조 시각화 라인 */}
          <div className={`absolute -left-6 top-0 bottom-0 w-px bg-gradient-to-b ${style.lineColor}`}></div>
          <div className={`absolute -left-6 top-6 w-6 h-px ${style.connectColor}`}></div>
          
          <Card className={`border-l-4 ${style.borderColor} ${style.bgColor} shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01] hover:rotate-1`}>
            <CardContent className="p-4">
              <div className="relative">
                {/* 중첩 레벨 인디케이터 */}
                <div className={`absolute -top-2 -left-2 w-3 h-3 ${style.dotColor} rounded-full border-2 border-white shadow-sm`}>
                  <div className="absolute inset-0.5 bg-white rounded-full opacity-30 animate-ping"></div>
                </div>
                {/* 레벨 번호 */}
                <div className={`absolute -top-1 -right-1 w-5 h-5 ${style.dotColor} text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm`}>
                  {level}
                </div>
                {children}
              </div>
            </CardContent>
          </Card>
        </div>
      </NestedContext.Provider>
    </ContextInfoContext.Provider>
  );
}

// 중첩된 컨텍스트 내용 컴포넌트
function NestedContextContent({ level }: { level: number }) {
  const contextInfo = useContext(ContextInfoContext);
  const parentContext = useContext(ContextInfoContext);
  
  // 통합 패턴의 Store 사용
  const nestedValueStore = NestedContext.useStore('nested-value', `Nested Level ${level}`);
  const nestedValue = useStoreValueSafe(nestedValueStore);
  
  // 전역 이벤트 로깅을 위한 dispatch
  const globalDispatch = GlobalContext.useAction();
  
  // Action Handler 등록
  NestedContext.useActionHandler('nestedAction', ({ value }) => {
    nestedValueStore.setValue(value);
    contextInfo.onContextEvent('nestedAction', { value, level });
    // 전역 이벤트 로그에 기록
    globalDispatch('logContextEvent', { 
      eventType: 'nestedAction', 
      contextId: contextInfo.id, 
      data: { value, level } 
    });
  });
  
  NestedContext.useActionHandler('bubbleUp', ({ data }) => {
    contextInfo.onContextEvent('bubbleUp', { data, level });
    // 전역 이벤트 로그에 기록
    globalDispatch('logContextEvent', { 
      eventType: 'bubbleUp', 
      contextId: contextInfo.id, 
      data: { data, level } 
    });
  });
  
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-3">
        <h5 className={`text-sm font-semibold ${level === 1 ? 'text-purple-900' : 'text-orange-900'} flex items-center gap-2`}>
          🧩 Nested Level {level} - Unified Pattern
        </h5>
        <div className="flex gap-1">
          <Badge variant="outline" className={`${level === 1 ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'} text-xs`}>Parent: {parentContext.level}</Badge>
          <Badge variant="outline" className={`${level === 1 ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'} text-xs transition-all duration-300 hover:scale-110`}>Value: {nestedValue}</Badge>
          <UnifiedPatternBadge size="sm" />
        </div>
      </div>
    </div>
  );
}

// 컨텍스트 상태 모니터 - 통합 패턴 사용
function ContextMonitor() {
  const globalMessageStore = GlobalContext.useStore('global-message', 'Welcome to Unified Context Demo');
  const globalEventStore = GlobalContext.useStore<EventEntry[]>('global-events', []);
  const contextCountStore = GlobalContext.useStore('context-count', 4); // Global + 2 Local + 2 Nested = 5개 컨텍스트
  
  const globalMessage = useStoreValueSafe(globalMessageStore);
  const globalEvents = useStoreValueSafe(globalEventStore);
  const contextCount = useStoreValueSafe(contextCountStore);
  
  // 이벤트 통계 계산
  const eventStats = React.useMemo(() => {
    const events = Array.isArray(globalEvents) ? globalEvents : [];
    const contextCounts = events.reduce((acc, event) => {
      const contextId = event.event.split(':')[0] || 'global';
      acc[contextId] = (acc[contextId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: events.length,
      byContext: contextCounts,
      recent: events.slice(-5).length,
      lastEventTime: events.length > 0 ? events[events.length - 1].timestamp : null
    };
  }, [globalEvents]);
  
  // Context 카운트 자동 업데이트 핸들러 등록
  GlobalContext.useActionHandler('updateContextCount', ({ count }) => {
    contextCountStore.setValue(count);
  });
  
  // Context가 마운트/언마운트될 때 카운트 업데이트
  useEffect(() => {
    // 현재 페이지의 실제 컨텍스트 수: Global(1) + Local A(1) + Local B(1) + Nested 1(1) + Nested 2(1) = 5
    contextCountStore.setValue(5);
  }, [contextCountStore]);
  
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
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded border">
              <div className="text-sm font-medium text-gray-700 mb-1">Active Contexts:</div>
              <div className="text-xl font-bold text-blue-600">{contextCount}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded border">
              <div className="text-sm font-medium text-gray-700 mb-1">Total Events:</div>
              <div className="text-xl font-bold text-green-600">{eventStats.total}</div>
            </div>
          </div>
          {eventStats.total > 0 && (
            <div className="p-3 bg-gray-50 rounded border">
              <div className="text-sm font-medium text-gray-700 mb-2">📊 Event Statistics:</div>
              <div className="space-y-1">
                {Object.entries(eventStats.byContext).map(([contextId, count]) => {
                  const getContextColor = (id: string) => {
                    if (id.includes('global')) return 'text-blue-600';
                    if (id.includes('local')) return 'text-green-600';
                    if (id.includes('nested')) return 'text-purple-600';
                    return 'text-gray-600';
                  };
                  
                  const getContextIcon = (id: string) => {
                    if (id.includes('global')) return '🌍';
                    if (id.includes('local')) return '🏠';
                    if (id.includes('nested')) return '🧩';
                    return '⚡';
                  };
                  
                  return (
                    <div key={contextId} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1">
                        <span>{getContextIcon(contextId)}</span>
                        <span className="font-medium">{contextId}</span>
                      </div>
                      <span className={`font-bold ${getContextColor(contextId)}`}>{count}</span>
                    </div>
                  );
                })}
                {eventStats.lastEventTime && (
                  <div className="pt-2 mt-2 border-t border-gray-300 text-xs text-gray-600">
                    Last event: {eventStats.lastEventTime}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="p-3 bg-gray-50 rounded border">
            <div className="text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
              Recent Events:
              <div className="flex gap-1">
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">Total: {Array.isArray(globalEvents) ? globalEvents.length : 0}</span>
                {Array.isArray(globalEvents) && globalEvents.length > 5 && (
                  <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded">+{globalEvents.length - 5} more</span>
                )}
              </div>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {Array.isArray(globalEvents) && globalEvents.length > 0 ? (
                globalEvents.slice(-6).reverse().map((event, index) => {
                  const eventParts = event.event.split(':');
                  const contextId = eventParts.length > 1 ? eventParts[0] : 'global';
                  const actionName = eventParts.length > 1 ? eventParts[1] : event.event;
                  
                  // 컨텍스트별 색상 스키마
                  const getEventStyle = (contextId: string) => {
                    if (contextId.includes('global')) return 'bg-blue-50 border-blue-200 text-blue-800';
                    if (contextId.includes('local')) return 'bg-green-50 border-green-200 text-green-800';
                    if (contextId.includes('nested')) return 'bg-purple-50 border-purple-200 text-purple-800';
                    return 'bg-gray-50 border-gray-200 text-gray-800';
                  };
                  
                  const getContextIcon = (contextId: string) => {
                    if (contextId.includes('global')) return '🌍';
                    if (contextId.includes('local')) return '🏠';
                    if (contextId.includes('nested')) return '🧩';
                    return '⚡';
                  };
                  
                  return (
                    <div key={`${event.id}-${index}`} className={`flex items-center justify-between text-xs rounded p-2 border transition-all duration-300 hover:scale-[1.02] ${getEventStyle(contextId)}`}>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-sm">{getContextIcon(contextId)}</span>
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="font-medium truncate">{actionName}</div>
                          <div className="text-xs opacity-70 truncate">{contextId}</div>
                        </div>
                      </div>
                      <div className="text-xs opacity-70 ml-2 whitespace-nowrap">{event.timestamp}</div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-gray-500 italic p-3 text-center bg-white rounded border border-dashed">
                  <div className="mb-1">🎯 No events yet!</div>
                  <div>Try clicking buttons to see event propagation</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 인터랙티브 컨트롤 - 통합 패턴 사용 (강화된 피드백 포함)
function InteractiveControls() {
  const contextInfo = useContext(ContextInfoContext);
  const [lastActionInfo, setLastActionInfo] = useState<{ action: string; timestamp: number } | null>(null);
  const [buttonStates, setButtonStates] = useState<Record<string, 'idle' | 'loading' | 'success'>>({});
  
  // 버튼 상태 관리 함수
  const setButtonState = useCallback((buttonId: string, state: 'idle' | 'loading' | 'success') => {
    setButtonStates(prev => ({ ...prev, [buttonId]: state }));
    
    if (state === 'success') {
      setTimeout(() => {
        setButtonStates(prev => ({ ...prev, [buttonId]: 'idle' }));
      }, 1500); // 1.5초 후 idle로 복귀
    }
  }, []);
  
  // 액션 실행 피드백 함수
  const executeWithFeedback = useCallback(async (buttonId: string, actionName: string, actionFn: () => void) => {
    setButtonState(buttonId, 'loading');
    setLastActionInfo({ action: actionName, timestamp: Date.now() });
    
    try {
      // 약간의 지연을 추가하여 로딩 상태를 보여줌
      await new Promise(resolve => setTimeout(resolve, 200));
      actionFn();
      setButtonState(buttonId, 'success');
    } catch (error) {
      console.error('Action failed:', error);
      setButtonState(buttonId, 'idle');
    }
  }, [setButtonState]);
  
  // 각 컨텍스트 레벨에 따른 Action dispatch 함수들
  const getActionDispatcher = () => {
    if (contextInfo.level === 'Global') {
      return GlobalContext.useAction();
    } else if (contextInfo.level === 'Local') {
      return LocalContext.useAction();
    } else if (contextInfo.level.includes('Nested')) {
      return NestedContext.useAction();
    }
    return null;
  };
  
  // 버튼 클래스명 생성 함수
  const getButtonClassName = (buttonId: string, baseVariant: string) => {
    const state = buttonStates[buttonId] || 'idle';
    const baseClasses = '';
    
    switch (state) {
      case 'loading':
        return `animate-pulse opacity-70 cursor-wait`;
      case 'success':
        return `bg-green-500 text-white border-green-500 animate-bounce`;
      default:
        return baseClasses;
    }
  };
  
  // 버튼 텍스트 생성 함수
  const getButtonText = (buttonId: string, defaultText: string) => {
    const state = buttonStates[buttonId] || 'idle';
    
    switch (state) {
      case 'loading':
        return '⏳ Processing...';
      case 'success':
        return '✅ Done!';
      default:
        return defaultText;
    }
  };
  
  const handleGlobalMessage = useCallback(() => {
    executeWithFeedback('global-message', 'Global Message Update', () => {
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
      const globalDispatch = GlobalContext.useAction();
      globalDispatch('globalMessage', { message: randomMessage });
    });
  }, [executeWithFeedback]);
  
  const handleBroadcast = useCallback(() => {
    executeWithFeedback('broadcast', 'Broadcast Event', () => {
      const globalDispatch = GlobalContext.useAction();
      globalDispatch('broadcastEvent', { 
        event: 'test-broadcast', 
        data: { timestamp: Date.now(), from: contextInfo.id } 
      });
    });
  }, [contextInfo, executeWithFeedback]);
  
  const handleLocalAction = useCallback(() => {
    if (contextInfo.level.includes('Local')) {
      executeWithFeedback('local-counter', 'Local Counter +1', () => {
        const localDispatch = LocalContext.useAction();
        localDispatch('localCounter', { increment: 1 });
      });
    }
  }, [contextInfo, executeWithFeedback]);
  
  const handleRequestGlobal = useCallback(() => {
    if (contextInfo.level.includes('Local')) {
      executeWithFeedback('request-global', 'Request Global', () => {
        const localDispatch = LocalContext.useAction();
        localDispatch('requestGlobal', { request: 'Hello from unified local context' });
      });
    }
  }, [contextInfo, executeWithFeedback]);
  
  const handleNestedAction = useCallback(() => {
    if (contextInfo.level.includes('Nested')) {
      executeWithFeedback('nested-action', 'Nested Action', () => {
        const nestedDispatch = NestedContext.useAction();
        const value = `Updated at ${new Date().toLocaleTimeString()}`;
        nestedDispatch('nestedAction', { value });
      });
    }
  }, [contextInfo, executeWithFeedback]);
  
  const handleBubbleUp = useCallback(() => {
    if (contextInfo.level.includes('Nested')) {
      executeWithFeedback('bubble-up', 'Bubble Up', () => {
        const nestedDispatch = NestedContext.useAction();
        nestedDispatch('bubbleUp', { data: `Bubble from unified ${contextInfo.id}` });
      });
    }
  }, [contextInfo, executeWithFeedback]);
  
  return (
    <div className="mt-4 p-4 bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="space-y-4">
        {/* 컨텍스트 정보 섹션 */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-gray-700">Current Context:</span>
            </div>
            <Badge className="bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 text-sm font-medium px-3 py-1 shadow-sm">
              {contextInfo.level} ({contextInfo.id})
            </Badge>
          </div>
          {lastActionInfo && (
            <Badge className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 text-sm animate-pulse shadow-md px-3 py-1">
              ⚡ Last: {lastActionInfo.action}
            </Badge>
          )}
        </div>
        
        {/* 액션 버튼 그리드 */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Available Actions</div>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              size="sm" 
              variant="primary" 
              onClick={handleGlobalMessage}
              className={`${getButtonClassName('global-message', 'primary')} flex items-center justify-center gap-2 p-3 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105`}
              disabled={buttonStates['global-message'] === 'loading'}
            >
              {getButtonText('global-message', '🎲 Global Message')}
            </Button>
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={handleBroadcast}
              className={`${getButtonClassName('broadcast', 'secondary')} flex items-center justify-center gap-2 p-3 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105`}
              disabled={buttonStates['broadcast'] === 'loading'}
            >
              {getButtonText('broadcast', '📡 Broadcast')}
            </Button>
            
            {contextInfo.level.includes('Local') && (
              <>
                <Button 
                  size="sm" 
                  variant="success" 
                  onClick={handleLocalAction}
                  className={`${getButtonClassName('local-counter', 'success')} flex items-center justify-center gap-2 p-3 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105`}
                  disabled={buttonStates['local-counter'] === 'loading'}
                >
                  {getButtonText('local-counter', '🔢 Counter +1')}
                </Button>
                <Button 
                  size="sm" 
                  variant="info" 
                  onClick={handleRequestGlobal}
                  className={`${getButtonClassName('request-global', 'info')} flex items-center justify-center gap-2 p-3 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105`}
                  disabled={buttonStates['request-global'] === 'loading'}
                >
                  {getButtonText('request-global', '📤 Request')}
                </Button>
              </>
            )}
            
            {contextInfo.level.includes('Nested') && (
              <>
                <Button 
                  size="sm" 
                  variant="warning" 
                  onClick={handleNestedAction}
                  className={`${getButtonClassName('nested-action', 'warning')} flex items-center justify-center gap-2 p-3 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105`}
                  disabled={buttonStates['nested-action'] === 'loading'}
                >
                  {getButtonText('nested-action', '🧩 Nested')}
                </Button>
                <Button 
                  size="sm" 
                  variant="danger" 
                  onClick={handleBubbleUp}
                  className={`${getButtonClassName('bubble-up', 'danger')} flex items-center justify-center gap-2 p-3 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105`}
                  disabled={buttonStates['bubble-up'] === 'loading'}
                >
                  {getButtonText('bubble-up', '🫧 Bubble')}
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* 실시간 피드백 표시 */}
        {lastActionInfo && (
          <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg text-sm text-green-700 animate-slide-in-right shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>✨ <strong>{lastActionInfo.action}</strong> executed successfully</span>
              <span className="text-xs text-green-600 ml-auto">
                {new Date(lastActionInfo.timestamp).toLocaleTimeString('ko-KR')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReactContextPage() {
  return (
    <PageWithLogMonitor pageId="react-context" title="Unified Context Pattern Demo">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <div className="page-container">
        <header className="page-header">
          <h1>Unified Context Pattern Demo</h1>
          <p className="page-description">
            Experience the new Unified Context Pattern that combines Store and Action management
            in a single Provider. See how to manage multiple nested contexts with complete isolation
            and simplified cross-context communication.
          </p>
        </header>

        <GlobalContextProvider>
          <div className="space-y-6 mb-6">
            <ContextMonitor />
            
            {/* 컨텍스트 설명 */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-md font-semibold text-gray-900 mb-3">🏗️ Context Hierarchy & Event Flow</h3>
                <div className="text-sm space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-blue-600 font-medium">
                        🌍 Global Context (Event Collector)
                      </div>
                      <div className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        Receives all events
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4 space-y-2">
                    <div className="relative">
                      <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-300"></div>
                      <div className="pl-4 p-2 bg-green-50 border border-green-200 rounded">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-green-600 font-medium">
                            🏠 Local Context A
                          </div>
                          <div className="flex gap-1">
                            <div className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                              Bubbles up ↗️
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-8 mt-2 space-y-2">
                        <div className="relative">
                          <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-300"></div>
                          <div className="pl-4 p-2 bg-purple-50 border border-purple-200 rounded">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-purple-600 font-medium">
                                🧩 Nested Level 1
                              </div>
                              <div className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                                Bubbles up ↗️
                              </div>
                            </div>
                          </div>
                          
                          <div className="ml-8 mt-2">
                            <div className="p-2 bg-orange-50 border border-orange-200 rounded">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center text-orange-600 font-medium">
                                  🧩 Nested Level 2
                                </div>
                                <div className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded">
                                  Bubbles up ↗️
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative mt-3">
                      <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-300"></div>
                      <div className="pl-4 p-2 bg-green-50 border border-green-200 rounded">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-green-600 font-medium">
                            🏠 Local Context B
                          </div>
                          <div className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                            Bubbles up ↗️
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded">
                    <div className="text-xs text-gray-600">
                      <div className="font-medium mb-1">💡 Event Propagation Rules:</div>
                      <div>• Child contexts bubble events up to parent contexts</div>
                      <div>• Global context receives and logs all events</div>
                      <div>• Cross-context communication flows through global dispatcher</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* 통합 패턴 특징들 */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-md font-semibold text-gray-900 mb-3">✨ Unified Pattern Features</h3>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-gray-50 rounded border">
                    <div className="font-medium text-gray-900 mb-1">Store + Action Integration</div>
                    <div className="text-gray-600">단일 Provider에서 Store Registry와 Action Register 모두 제공</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded border">
                    <div className="font-medium text-gray-900 mb-1">Complete Isolation</div>
                    <div className="text-gray-600">각 Provider는 독립적인 Store/Action 컨텍스트 보장</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded border">
                    <div className="font-medium text-gray-900 mb-1">Simplified API</div>
                    <div className="text-gray-600">useStore, useAction, useActionHandler 통합 Hook 제공</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded border">
                    <div className="font-medium text-gray-900 mb-1">Cross-Context Communication</div>
                    <div className="text-gray-600">다른 Context Pattern 간 직접 통신 가능</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded border">
                    <div className="font-medium text-gray-900 mb-1">Type Safety</div>
                    <div className="text-gray-600">TypeScript 타입 안전성 완전 보장</div>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Unified Context Pattern Implementation</h3>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`// 1. 통합 Context Pattern 생성
const GlobalContext = createContextPattern<GlobalActions>('ReactContextGlobal');
const LocalContext = createContextPattern<LocalActions>('ReactContextLocal');
const NestedContext = createContextPattern<NestedActions>('ReactContextNested');

// 2. 통합 Provider 사용 (Store + Action)
function GlobalContextProvider({ children }) {
  return (
    <GlobalContext.Provider registryId="global-context">
      <GlobalContextSetup />
      {children}
    </GlobalContext.Provider>
  );
}

// 3. Store와 Action Handler 통합 사용
function GlobalContextSetup() {
  // Store 생성
  const messageStore = GlobalContext.useStore('global-message', 'Welcome');
  const eventStore = GlobalContext.useStore<EventEntry[]>('global-events', []);
  
  // Action Handler 등록
  GlobalContext.useActionHandler('globalMessage', ({ message }) => {
    messageStore.setValue(message);
  });
  
  GlobalContext.useActionHandler('broadcastEvent', ({ event, data }) => {
    const eventEntry = { id: Date.now(), event, data, timestamp: new Date() };
    eventStore.update(prev => [...prev, eventEntry]);
  });
  
  return null;
}

// 4. 컨텍스트 간 통신
function LocalContextSetup() {
  LocalContext.useActionHandler('requestGlobal', ({ request }) => {
    // 로컬에서 전역으로 직접 dispatch
    const globalDispatch = GlobalContext.useAction();
    globalDispatch('globalMessage', { message: \`Request: \${request}\` });
  });
}

// 5. 간편한 Action 사용
function MyComponent() {
  const dispatch = GlobalContext.useAction();
  const handleClick = () => dispatch('globalMessage', { message: 'Hello!' });
}`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </PageWithLogMonitor>
  );
}

export default ReactContextPage;