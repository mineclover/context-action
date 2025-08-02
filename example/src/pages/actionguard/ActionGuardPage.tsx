import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ActionRegister, ActionPayloadMap } from '@context-action/react';
import { PageWithLogMonitor, useActionLogger } from '../../components/LogMonitor';

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
  const { logAction, logSystem } = useActionLogger();
  
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
    <div className="demo-card">
      <h3>Search with Debouncing</h3>
      <div className="search-container">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Type to search (debounced)"
          className="search-input"
        />
        <div className="search-stats">
          <span>Search count: {searchCount}</span>
        </div>
        <div className="search-results">
          {searchResults.map((result, index) => (
            <div key={index} className="search-result">{result}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 스크롤 데모
function ScrollDemo() {
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollCount, setScrollCount] = useState(0);
  const [actionRegister] = useState(() => new ActionRegister<ActionGuardMap>());
  const { logAction } = useActionLogger();
  
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
    <div className="demo-card">
      <h3>Scroll with Throttling</h3>
      <div 
        className="scroll-container"
        onScroll={handleScroll}
        style={{ height: '200px', overflow: 'auto', border: '1px solid #ccc' }}
      >
        <div style={{ height: '1000px', padding: '20px' }}>
          <p>Scroll this container to see throttling in action</p>
          <p>Current scroll position: {scrollTop}px</p>
          <p>Scroll events processed: {scrollCount}</p>
          {Array.from({ length: 20 }, (_, i) => (
            <p key={i}>Scroll content line {i + 1}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

// API 블로킹 데모
function ApiBlockingDemo() {
  const [apiCalls, setApiCalls] = useState<string[]>([]);
  const [actionRegister] = useState(() => new ActionRegister<ActionGuardMap>());
  const { isBlocked, lastAction, blockAction } = useActionBlock(2000);
  const { logAction, logSystem } = useActionLogger();
  
  useEffect(() => {
    const unsubscribe = actionRegister.register('apiCall', (data, controller) => {
      if (blockAction('apiCall')) {
        logAction('apiCall', { endpoint: data.endpoint, blocked: false });
        setApiCalls(prev => [...prev, `API Call to ${data.endpoint} at ${new Date().toLocaleTimeString()}`]);
        controller.next();
      } else {
        logAction('apiCall', { endpoint: data.endpoint, blocked: true });
        logSystem('API call blocked due to rate limiting');
      }
    });
    
    return unsubscribe;
  }, [actionRegister, blockAction, logAction, logSystem]);

  const handleApiCall = (endpoint: string) => {
    actionRegister.dispatch('apiCall', { endpoint });
  };

  return (
    <div className="demo-card">
      <h3>API Call Blocking</h3>
      <div className="api-controls">
        <button 
          onClick={() => handleApiCall('/api/users')}
          disabled={isBlocked}
          className="btn btn-primary"
        >
          Call /api/users
        </button>
        <button 
          onClick={() => handleApiCall('/api/posts')}
          disabled={isBlocked}
          className="btn btn-primary"
        >
          Call /api/posts
        </button>
        <button 
          onClick={() => handleApiCall('/api/comments')}
          disabled={isBlocked}
          className="btn btn-primary"
        >
          Call /api/comments
        </button>
      </div>
      {isBlocked && (
        <div className="block-status">
          <span>Blocked for 2 seconds (Last action: {lastAction})</span>
        </div>
      )}
      <div className="api-calls">
        <h4>Recent API Calls:</h4>
        {apiCalls.map((call, index) => (
          <div key={index} className="api-call">{call}</div>
        ))}
      </div>
    </div>
  );
}

// 마우스 이벤트 데모
function MouseEventDemo() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [moveCount, setMoveCount] = useState(0);
  const [actionRegister] = useState(() => new ActionRegister<ActionGuardMap>());
  const { logAction } = useActionLogger();
  
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
    <div className="demo-card">
      <h3>Mouse Events with Throttling</h3>
      <div 
        className="mouse-area"
        onMouseMove={handleMouseMove}
        style={{ 
          height: '200px', 
          border: '2px solid #ccc', 
          position: 'relative',
          backgroundColor: '#f5f5f5'
        }}
      >
        <div className="mouse-info">
          <p>Mouse Position: ({mousePosition.x}, {mousePosition.y})</p>
          <p>Move events processed: {moveCount}</p>
        </div>
        <div 
          className="mouse-pointer"
          style={{
            position: 'absolute',
            left: mousePosition.x - 5,
            top: mousePosition.y - 5,
            width: '10px',
            height: '10px',
            backgroundColor: 'red',
            borderRadius: '50%',
            pointerEvents: 'none'
          }}
        />
      </div>
    </div>
  );
}

function ActionGuardPage() {
  return (
    <PageWithLogMonitor pageId="action-guard" title="Action Guard System">
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
    </PageWithLogMonitor>
  );
}

export default ActionGuardPage;