import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ActionRegister, ActionPayloadMap } from '@context-action/react';

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
  
  // 실제 검색 함수 (모의)
  const performSearch = useCallback((term: string) => {
    setSearchCount(prev => prev + 1);
    // 모의 검색 결과
    const mockResults = term
      ? [`Result 1 for "${term}"`, `Result 2 for "${term}"`, `Result 3 for "${term}"`]
      : [];
    setSearchResults(mockResults);
  }, []);
  
  // 디바운스된 검색
  const debouncedSearch = useDebounce(performSearch, 500);
  
  useEffect(() => {
    const unsubscribe = actionRegister.register('searchInput', (term, controller) => {
      debouncedSearch(term);
      controller.next();
    });
    
    return unsubscribe;
  }, [actionRegister, debouncedSearch]);
  
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    actionRegister.dispatch('searchInput', value);
  }, [actionRegister]);
  
  return (
    <div className="demo-card">
      <h3>Search with Debouncing</h3>
      <p>Search input is debounced by 500ms to prevent excessive API calls.</p>
      
      <div className="search-demo">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Type to search..."
          className="text-input"
        />
        
        <div className="search-stats">
          <span>Search calls: {searchCount}</span>
        </div>
        
        <div className="search-results">
          {searchResults.map((result, index) => (
            <div key={index} className="search-result">
              {result}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 스크롤 데모
function ScrollDemo() {
  const [scrollEvents, setScrollEvents] = useState(0);
  const [throttledEvents, setThrottledEvents] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [actionRegister] = useState(() => new ActionRegister<ActionGuardMap>());
  
  const handleScrollEvent = useCallback((scrollTop: number) => {
    setThrottledEvents(prev => prev + 1);
    setScrollPosition(scrollTop);
  }, []);
  
  const throttledScrollHandler = useThrottle(handleScrollEvent, 100);
  
  useEffect(() => {
    const unsubscribe = actionRegister.register('scrollEvent', ({ scrollTop }, controller) => {
      throttledScrollHandler(scrollTop);
      controller.next();
    });
    
    return unsubscribe;
  }, [actionRegister, throttledScrollHandler]);
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollEvents(prev => prev + 1);
    actionRegister.dispatch('scrollEvent', { scrollTop });
  }, [actionRegister]);
  
  return (
    <div className="demo-card">
      <h3>Scroll with Throttling</h3>
      <p>Scroll events are throttled to fire at most once every 100ms.</p>
      
      <div className="scroll-stats">
        <div>Raw scroll events: {scrollEvents}</div>
        <div>Throttled events: {throttledEvents}</div>
        <div>Scroll position: {scrollPosition}px</div>
      </div>
      
      <div className="scroll-container" onScroll={handleScroll}>
        <div className="scroll-content">
          {Array.from({ length: 50 }, (_, i) => (
            <div key={i} className="scroll-item">
              Scroll item {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// API 호출 블로킹 데모
function ApiBlockingDemo() {
  const [apiCalls, setApiCalls] = useState<Array<{ endpoint: string; timestamp: string }>>([]);
  const { isBlocked, lastAction, blockAction } = useActionBlock(2000);
  const [actionRegister] = useState(() => new ActionRegister<ActionGuardMap>());
  
  useEffect(() => {
    const unsubscribe = actionRegister.register('apiCall', ({ endpoint }, controller) => {
      if (!blockAction(`API: ${endpoint}`)) {
        controller.abort('API call blocked - too frequent');
        return;
      }
      
      // 모의 API 호출
      setApiCalls(prev => [...prev, {
        endpoint,
        timestamp: new Date().toLocaleTimeString()
      }]);
      
      controller.next();
    });
    
    return unsubscribe;
  }, [actionRegister, blockAction]);
  
  const handleApiCall = useCallback((endpoint: string) => {
    actionRegister.dispatch('apiCall', { endpoint });
  }, [actionRegister]);
  
  return (
    <div className="demo-card">
      <h3>API Call Blocking</h3>
      <p>API calls are blocked for 2 seconds after each successful call.</p>
      
      <div className="api-controls">
        <button 
          onClick={() => handleApiCall('/users')} 
          className={`btn ${isBlocked ? 'btn-secondary' : 'btn-primary'}`}
          disabled={isBlocked}
        >
          Call /users API
        </button>
        <button 
          onClick={() => handleApiCall('/posts')} 
          className={`btn ${isBlocked ? 'btn-secondary' : 'btn-primary'}`}
          disabled={isBlocked}
        >
          Call /posts API
        </button>
        <button 
          onClick={() => handleApiCall('/comments')} 
          className={`btn ${isBlocked ? 'btn-secondary' : 'btn-primary'}`}
          disabled={isBlocked}
        >
          Call /comments API
        </button>
      </div>
      
      {isBlocked && (
        <div className="blocking-status">
          🚫 Blocked: {lastAction} (cooling down...)
        </div>
      )}
      
      <div className="api-log">
        <h4>API Call Log:</h4>
        {apiCalls.length === 0 ? (
          <div className="log-empty">No API calls made yet</div>
        ) : (
          apiCalls.slice(-5).map((call, index) => (
            <div key={index} className="api-call-entry">
              <span className="api-endpoint">{call.endpoint}</span>
              <span className="api-timestamp">{call.timestamp}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// 마우스 이벤트 데모
function MouseEventDemo() {
  const [mouseEvents, setMouseEvents] = useState(0);
  const [throttledEvents, setThrottledEvents] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [actionRegister] = useState(() => new ActionRegister<ActionGuardMap>());
  
  const handleMouseMove = useCallback((x: number, y: number) => {
    setThrottledEvents(prev => prev + 1);
    setMousePosition({ x, y });
  }, []);
  
  const throttledMouseHandler = useThrottle(handleMouseMove, 50);
  
  useEffect(() => {
    const unsubscribe = actionRegister.register('mouseMove', ({ x, y }, controller) => {
      throttledMouseHandler(x, y);
      controller.next();
    });
    
    return unsubscribe;
  }, [actionRegister, throttledMouseHandler]);
  
  const handleMouseMoveEvent = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMouseEvents(prev => prev + 1);
    actionRegister.dispatch('mouseMove', { x, y });
  }, [actionRegister]);
  
  return (
    <div className="demo-card">
      <h3>Mouse Events with Throttling</h3>
      <p>Mouse move events are throttled to fire at most once every 50ms.</p>
      
      <div className="mouse-stats">
        <div>Raw mouse events: {mouseEvents}</div>
        <div>Throttled events: {throttledEvents}</div>
        <div>Position: ({mousePosition.x}, {mousePosition.y})</div>
      </div>
      
      <div className="mouse-area" onMouseMove={handleMouseMoveEvent}>
        <div 
          className="mouse-cursor" 
          style={{ 
            left: mousePosition.x - 5, 
            top: mousePosition.y - 5 
          }}
        />
        <div className="mouse-instructions">
          Move your mouse in this area
        </div>
      </div>
    </div>
  );
}

function ActionGuardPage() {
  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Action Guard System</h1>
        <p className="page-description">
          Learn how to implement debouncing, throttling, and action blocking patterns
          to optimize user experience and prevent excessive action execution.
        </p>
      </header>

      <div className="demo-grid">
        <SearchDemo />
        <ScrollDemo />
        <ApiBlockingDemo />
        <MouseEventDemo />
        
        {/* Action Guard 개념 */}
        <div className="demo-card info-card">
          <h3>Action Guard Patterns</h3>
          <ul className="guard-pattern-list">
            <li>
              <strong>Debouncing:</strong> 연속된 이벤트에서 마지막 이벤트만 처리 (검색, 입력 유효성 검사)
            </li>
            <li>
              <strong>Throttling:</strong> 지정된 주기마다 이벤트 처리 (스크롤, 마우스 이벤트)
            </li>
            <li>
              <strong>Blocking:</strong> 일정 시간 동안 중복 실행 방지 (API 호출, 폼 제출)
            </li>
            <li>
              <strong>Rate Limiting:</strong> 시간당 최대 실행 횟수 제한
            </li>
          </ul>
        </div>
        
        {/* 사용 사례 */}
        <div className="demo-card info-card">
          <h3>Use Cases</h3>
          <ul className="use-case-list">
            <li>✓ 검색 입력 최적화</li>
            <li>✓ API 호출 빈도 제어</li>
            <li>✓ 스크롤 성능 개선</li>
            <li>✓ 버튼 연행 클릭 방지</li>
            <li>✓ 마우스 이벤트 최적화</li>
            <li>✓ 리사이징 이벤트 제어</li>
          </ul>
        </div>
      </div>

      {/* 코드 예제 */}
      <div className="code-example">
        <h3>Action Guard Implementation</h3>
        <pre className="code-block">
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
        </pre>
      </div>
    </div>
  );
}

export default ActionGuardPage;