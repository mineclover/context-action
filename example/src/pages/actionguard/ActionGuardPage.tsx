import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ActionRegister, ActionPayloadMap } from '@context-action/react';
import { PageWithLogMonitor, useActionLoggerWithToast } from '../../components/LogMonitor/';
import { DemoCard, Button, Input, CodeExample, CodeBlock } from '../../components/ui';
import { toastActionRegister } from '../../components/ToastSystem/actions';

// Action Guard 액션 맵
interface ActionGuardMap extends ActionPayloadMap {
  searchInput: string;
  scrollEvent: { scrollTop: number };
  apiCall: { endpoint: string };
  buttonClick: { buttonId: string };
  formSubmit: { formData: any };
  mouseMove: { x: number; y: number };
  resize: { width: number; height: number };
}

// 디바운스 훅
function useDebounce<T extends any[]>(callback: (...args: T) => void, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
}

// 스로틀 훅
function useThrottle<T extends any[]>(callback: (...args: T) => void, delay: number) {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: T) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallRef.current;
    
    if (timeSinceLastCall >= delay) {
      lastCallRef.current = now;
      callback(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now();
        callback(...args);
      }, delay - timeSinceLastCall);
    }
  }, [callback, delay]);
}

// 블로킹 훅
function useActionBlock(duration: number = 1000) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');
  
  const blockAction = useCallback((actionName: string) => {
    if (isBlocked) {
      return false;
    }
    
    setIsBlocked(true);
    setLastAction(actionName);
    setTimeout(() => {
      setIsBlocked(false);
      setLastAction('');
    }, duration);
    
    return true;
  }, [isBlocked, duration]);
  
  return { isBlocked, lastAction, blockAction };
}

// 검색 데모
function SearchDemo() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [searchCount, setSearchCount] = useState(0);
  const [actionRegister] = useState(() => new ActionRegister<ActionGuardMap>());
  const { logAction, logSystem } = useActionLoggerWithToast();
  
  // 실제 검색 함수 (모의)
  const performSearch = useCallback((term: string) => {
    setSearchCount(prev => prev + 1);
    logAction('performSearch', { term, count: searchCount + 1 });
    // 모의 검색 결과
    const mockResults = term
      ? [`Result 1 for "${term}"`, `Result 2 for "${term}"`, `Result 3 for "${term}"`]
      : [];
    setSearchResults(mockResults);
  }, [searchCount, logAction]);
  
  // 디바운스된 검색
  const debouncedSearch = useDebounce(performSearch, 500);
  
  useEffect(() => {
    const unsubscribe = actionRegister.register('searchInput', (term, controller) => {
      logAction('searchInput', { term, debounced: true });
      debouncedSearch(term);
      controller.next();
    });
    
    return unsubscribe;
  }, [actionRegister, debouncedSearch, logAction]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    actionRegister.dispatch('searchInput', value);
  };

  return (
    <DemoCard>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Search with Debouncing</h3>
      <div className="space-y-4">
        <Input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Type to search (debounced)"
          className="w-full"
        />
        <div className="text-sm text-gray-600">
          <span>Search count: {searchCount}</span>
        </div>
        <div className="space-y-2">
          {searchResults.map((result, index) => (
            <div key={index} className="p-2 bg-gray-50 rounded border text-sm">{result}</div>
          ))}
        </div>
      </div>
    </DemoCard>
  );
}

// 스크롤 데모
function ScrollDemo() {
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollCount, setScrollCount] = useState(0);
  const [actionRegister] = useState(() => new ActionRegister<ActionGuardMap>());
  const { logAction } = useActionLoggerWithToast();
  
  const throttledScrollHandler = useThrottle((scrollTop: number) => {
    setScrollCount(prev => prev + 1);
    logAction('scrollEvent', { scrollTop, count: scrollCount + 1 });
  }, 100);
  
  useEffect(() => {
    const unsubscribe = actionRegister.register('scrollEvent', (data, controller) => {
      throttledScrollHandler(data.scrollTop);
      controller.next();
    });
    
    return unsubscribe;
  }, [actionRegister, throttledScrollHandler, logAction]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollTop(scrollTop);
    actionRegister.dispatch('scrollEvent', { scrollTop });
  };

  return (
    <DemoCard>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Scroll with Throttling</h3>
      <div 
        className="h-[200px] overflow-auto border border-gray-300 rounded-lg bg-gray-50"
        onScroll={handleScroll}
      >
        <div className="h-[1000px] p-5">
          <p>Scroll this container to see throttling in action</p>
          <p>Current scroll position: {scrollTop}px</p>
          <p>Scroll events processed: {scrollCount}</p>
          {Array.from({ length: 20 }, (_, i) => (
            <p key={i}>Scroll content line {i + 1}</p>
          ))}
        </div>
      </div>
    </DemoCard>
  );
}

// API 블로킹 데모
function ApiBlockingDemo() {
  const [apiCalls, setApiCalls] = useState<string[]>([]);
  const [actionRegister] = useState(() => new ActionRegister<ActionGuardMap>());
  const { isBlocked, lastAction, blockAction } = useActionBlock(2000);
  const { logAction, logSystem } = useActionLoggerWithToast();
  
  useEffect(() => {
    const unsubscribe = actionRegister.register('apiCall', (data, controller) => {
      if (blockAction('apiCall')) {
        // 로그 기록
        logAction('apiCall', { endpoint: data.endpoint, blocked: false });
        
        // 직접 Toast 발생
        logSystem(`🍞 Dispatching success toast for: ${data.endpoint}`);
        toastActionRegister.dispatch('addToast', {
          type: 'success',
          title: '🌐 API 호출',
          message: `${data.endpoint} 호출 성공!`
        });
        logSystem('🍞 Toast dispatch completed');
        
        setApiCalls(prev => [...prev, `API Call to ${data.endpoint} at ${new Date().toLocaleTimeString()}`]);
        controller.next();
      } else {
        // 로그 기록
        logAction('apiCall', { endpoint: data.endpoint, blocked: true });
        
        // 직접 Toast 발생
        logSystem(`🍞 Dispatching error toast for: ${data.endpoint}`);
        toastActionRegister.dispatch('addToast', {
          type: 'error',
          title: '🚫 API 차단',
          message: `${data.endpoint} 호출이 차단되었습니다`
        });
        logSystem('🍞 Toast dispatch completed (error)');
        
        logSystem('API call blocked due to rate limiting');
      }
    });
    
    return unsubscribe;
  }, [actionRegister, blockAction, logAction, logSystem]);

  const handleApiCall = (endpoint: string) => {
    actionRegister.dispatch('apiCall', { endpoint });
  };

  return (
    <DemoCard>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">API Call Blocking</h3>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => handleApiCall('/api/users')}
            disabled={isBlocked}
            variant="primary"
            size="sm"
          >
            Call /api/users
          </Button>
          <Button 
            onClick={() => handleApiCall('/api/posts')}
            disabled={isBlocked}
            variant="primary"
            size="sm"
          >
            Call /api/posts
          </Button>
          <Button 
            onClick={() => handleApiCall('/api/comments')}
            disabled={isBlocked}
            variant="primary"
            size="sm"
          >
            Call /api/comments
          </Button>
        </div>
        {isBlocked && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
            <span>Blocked for 2 seconds (Last action: {lastAction})</span>
          </div>
        )}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Recent API Calls:</h4>
          {apiCalls.map((call, index) => (
            <div key={index} className="p-2 bg-gray-50 rounded border text-sm">{call}</div>
          ))}
        </div>
      </div>
    </DemoCard>
  );
}

// 마우스 이벤트 데모
function MouseEventDemo() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [moveCount, setMoveCount] = useState(0);
  const [actionRegister] = useState(() => new ActionRegister<ActionGuardMap>());
  const { logAction } = useActionLoggerWithToast();
  
  const throttledMouseHandler = useThrottle((x: number, y: number) => {
    setMoveCount(prev => prev + 1);
    logAction('mouseMove', { x, y, count: moveCount + 1 });
  }, 50);
  
  useEffect(() => {
    const unsubscribe = actionRegister.register('mouseMove', (data, controller) => {
      throttledMouseHandler(data.x, data.y);
      controller.next();
    });
    
    return unsubscribe;
  }, [actionRegister, throttledMouseHandler, logAction]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePosition({ x, y });
    actionRegister.dispatch('mouseMove', { x, y });
  };

  return (
    <DemoCard>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Mouse Events with Throttling</h3>
      <div 
        className="h-[200px] border-2 border-gray-300 relative bg-gray-100 rounded-lg overflow-hidden"
        onMouseMove={handleMouseMove}
      >
        <div className="absolute top-2 left-2 text-sm text-gray-600 bg-white bg-opacity-90 p-2 rounded">
          <p>Mouse Position: ({mousePosition.x}, {mousePosition.y})</p>
          <p>Move events processed: {moveCount}</p>
        </div>
        <div 
          className="absolute w-2.5 h-2.5 bg-red-500 rounded-full pointer-events-none transition-all duration-75"
          style={{
            left: mousePosition.x - 5,
            top: mousePosition.y - 5,
          }}
        />
      </div>
    </DemoCard>
  );
}

function ActionGuardPage() {
  return (
    <PageWithLogMonitor 
      pageId="action-guard" 
      title="Action Guard System"
      initialConfig={{ enableToast: true, maxLogs: 100 }}
    >
      <div className="page-container">
        <header className="page-header">
          <h1>Action Guard System</h1>
          <p className="page-description">
            Learn how to implement debouncing, throttling, and action blocking patterns
            to optimize user experience and prevent excessive action execution.
          </p>
        </header>

        <div className="space-y-6">
          <SearchDemo />
          <ScrollDemo />
          <ApiBlockingDemo />
          <MouseEventDemo />
          
          {/* Action Guard 개념 */}
          <DemoCard variant="info">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Action Guard Patterns</h3>
            <ul className="space-y-4 text-sm text-gray-700">
              <li className="space-y-2">
                <strong className="text-gray-900 font-semibold">Debouncing:</strong> 연속된 이벤트에서 마지막 이벤트만 처리 (검색, 입력 유효성 검사)
              </li>
              <li className="space-y-2">
                <strong className="text-gray-900 font-semibold">Throttling:</strong> 지정된 주기마다 이벤트 처리 (스크롤, 마우스 이벤트)
              </li>
              <li className="space-y-2">
                <strong className="text-gray-900 font-semibold">Blocking:</strong> 일정 시간 동안 중복 실행 방지 (API 호출, 폼 제출)
              </li>
              <li className="space-y-2">
                <strong className="text-gray-900 font-semibold">Rate Limiting:</strong> 시간당 최대 실행 횟수 제한
              </li>
            </ul>
          </DemoCard>
          
          {/* 사용 사례 */}
          <DemoCard variant="info">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Use Cases</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">✓ 검색 입력 최적화</li>
              <li className="flex items-start gap-2">✓ API 호출 빈도 제어</li>
              <li className="flex items-start gap-2">✓ 스크롤 성능 개선</li>
              <li className="flex items-start gap-2">✓ 버튼 연행 클릭 방지</li>
              <li className="flex items-start gap-2">✓ 마우스 이벤트 최적화</li>
              <li className="flex items-start gap-2">✓ 리사이징 이벤트 제어</li>
            </ul>
          </DemoCard>
        </div>

        {/* 코드 예제 */}
        <CodeExample title="Action Guard Implementation">
          <CodeBlock>
{`// 1. 디바운스 훅
const useDebounce = (callback, delay) => {
  const timeoutRef = useRef();
  return useCallback((...args) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
};

// 2. 스로틀 훅
const useThrottle = (callback, delay) => {
  const lastCallRef = useRef(0);
  return useCallback((...args) => {
    const now = Date.now();
    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now;
      callback(...args);
    }
  }, [callback, delay]);
};

// 3. 액션 블로킹
const useActionBlock = (duration = 1000) => {
  const [isBlocked, setIsBlocked] = useState(false);
  
  const blockAction = useCallback((actionName) => {
    if (isBlocked) return false;
    setIsBlocked(true);
    setTimeout(() => setIsBlocked(false), duration);
    return true;
  }, [isBlocked, duration]);
  
  return { isBlocked, blockAction };
};

// 4. ActionRegister와 통합
actionRegister.register('searchInput', (term, controller) => {
  debouncedSearch(term);
  controller.next();
});`}
          </CodeBlock>
        </CodeExample>
      </div>
    </PageWithLogMonitor>
  );
}

export default ActionGuardPage;