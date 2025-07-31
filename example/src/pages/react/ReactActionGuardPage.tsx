/**
 * @fileoverview ReactActionGuardPage - Action Guard 훅들의 사용법 데모
 * 디바운싱, 스로틀링, 블로킹 등 액션 제어 패턴들을 보여줍니다.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { 
  createActionContext,
  type ActionPayloadMap 
} from '@context-action/react';
import { 
  useActionDebouncer, 
  useActionThrottle, 
  useActionBlock, 
  useActionGuard,
  useActionDebounceExecutor,
  useActionThrottleExecutor,
  useActionBlockExecutor,
  useActionGuardExecutor,
  GUARD_PRESETS,
  ACTION_PATTERNS,
  combineGuardPatterns
} from '../../hooks';

// ============================================
// Type Definitions
// ============================================

interface GuardDemoActionMap extends ActionPayloadMap {
  // 디바운스 테스트용
  searchQuery: { query: string };
  autoSave: { content: string };
  
  // 스로틀 테스트용
  updateMousePosition: { x: number; y: number };
  scrollHandler: { scrollY: number };
  
  // 블록 테스트용
  submitForm: { data: any };
  apiCall: { endpoint: string };
  
  // 통합 테스트용
  addToCart: { productId: string; quantity: number };
  sendMessage: { message: string };
  
  // 로그 액션
  logAction: { type: string; data?: any };
}

// ============================================
// Context Setup
// ============================================

const { Provider, useAction, useActionHandler } = 
  createActionContext<GuardDemoActionMap>();

// ============================================
// Demo Components
// ============================================

function DebounceDemo() {
  const [searchQuery, setSearchQuery] = useState('');
  const [autoSaveContent, setAutoSaveContent] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const dispatch = useAction();
  
  // 디바운서 설정
  const debouncer = useActionDebouncer<GuardDemoActionMap>({
    delay: 1000,
    debug: true
  });
  
  // 편의 executor 사용 예시
  const executeWithDebounce = useActionDebounceExecutor(dispatch, {
    delay: 500,
    debug: true
  });
  
  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  }, []);
  
  // 액션 핸들러 등록
  useActionHandler('searchQuery', ({ query }) => {
    addLog(`🔍 Search executed: "${query}"`);
  });
  
  useActionHandler('autoSave', ({ content }) => {
    addLog(`💾 Auto-save executed: ${content.length} chars`);
  });
  
  useActionHandler('logAction', ({ type, data }) => {
    addLog(`📝 ${type}: ${JSON.stringify(data)}`);
  });
  
  const handleSearch = () => {
    const payload = { query: searchQuery };
    if (debouncer.canExecute('searchQuery', payload)) {
      dispatch('searchQuery', payload);
      debouncer.markExecuted('searchQuery', payload);
    }
  };
  
  const handleAutoSave = () => {
    executeWithDebounce.executeWithDebounce('autoSave', { content: autoSaveContent });
  };
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '20px' }}>
      <h3>🎯 Debounce Demo</h3>
      <p>디바운싱은 연속된 호출에서 마지막 호출만 실행합니다.</p>
      
      <div style={{ marginBottom: '15px' }}>
        <h4>검색 디바운스 (1초)</h4>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="검색어 입력..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '8px', flex: 1 }}
          />
          <button onClick={handleSearch} style={{ padding: '8px 16px' }}>
            검색
          </button>
        </div>
        <small>빠르게 여러 번 클릭해보세요 - 1초 내 중복 클릭은 무시됩니다.</small>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <h4>자동 저장 디바운스 (500ms)</h4>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <textarea
            placeholder="내용을 입력하세요..."
            value={autoSaveContent}
            onChange={(e) => setAutoSaveContent(e.target.value)}
            style={{ padding: '8px', flex: 1, minHeight: '60px' }}
          />
          <button onClick={handleAutoSave} style={{ padding: '8px 16px' }}>
            저장
          </button>
        </div>
      </div>
      
      <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h5>실행 로그:</h5>
        {logs.length === 0 ? (
          <p style={{ color: '#666', margin: 0 }}>아직 실행된 액션이 없습니다.</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={{ fontSize: '0.9em', fontFamily: 'monospace' }}>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ThrottleDemo() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const dispatch = useAction();
  
  // 스로틀 설정
  const throttle = useActionThrottle<GuardDemoActionMap>({
    interval: 100, // 100ms 간격
    leading: true,
    trailing: true,
    debug: true
  });
  
  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  }, []);
  
  // 액션 핸들러
  useActionHandler('updateMousePosition', ({ x, y }) => {
    addLog(`🖱️ Mouse: (${x}, ${y})`);
  });
  
  useActionHandler('scrollHandler', ({ scrollY }) => {
    addLog(`📜 Scroll: ${scrollY}px`);
  });
  
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(event.clientX - rect.left);
    const y = Math.round(event.clientY - rect.top);
    
    setMousePos({ x, y });
    
    const payload = { x, y };
    if (throttle.canExecute('updateMousePosition', payload)) {
      dispatch('updateMousePosition', payload);
      throttle.markExecuted('updateMousePosition', payload);
    } else {
      // trailing이 true이므로 마지막 호출을 예약
      throttle.scheduleTrailing('updateMousePosition', payload, dispatch);
    }
  }, [dispatch, throttle]);
  
  const simulateScroll = useCallback(() => {
    const newScrollY = scrollY + 100;
    setScrollY(newScrollY);
    
    const payload = { scrollY: newScrollY };
    if (throttle.canExecute('scrollHandler', payload)) {
      dispatch('scrollHandler', payload);
      throttle.markExecuted('scrollHandler', payload);
    }
  }, [dispatch, throttle, scrollY]);
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '20px' }}>
      <h3>⚡ Throttle Demo</h3>
      <p>스로틀링은 지정된 간격으로만 실행을 허용합니다.</p>
      
      <div style={{ marginBottom: '15px' }}>
        <h4>마우스 이동 스로틀 (100ms)</h4>
        <div
          onMouseMove={handleMouseMove}
          style={{
            width: '100%',
            height: '150px',
            backgroundColor: '#e9ecef',
            border: '2px dashed #adb5bd',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'crosshair',
            position: 'relative'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div>마우스를 이 영역에서 움직여보세요</div>
            <div style={{ marginTop: '10px', fontFamily: 'monospace' }}>
              Position: ({mousePos.x}, {mousePos.y})
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <h4>스크롤 시뮬레이션</h4>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={simulateScroll} style={{ padding: '8px 16px' }}>
            스크롤 시뮬레이션 (+100px)
          </button>
          <span>현재 위치: {scrollY}px</span>
        </div>
        <small>빠르게 여러 번 클릭해보세요 - 100ms 간격으로만 실행됩니다.</small>
      </div>
      
      <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h5>실행 로그:</h5>
        {logs.length === 0 ? (
          <p style={{ color: '#666', margin: 0 }}>아직 실행된 액션이 없습니다.</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={{ fontSize: '0.9em', fontFamily: 'monospace' }}>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function BlockDemo() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFormLocked, setIsFormLocked] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const dispatch = useAction();
  
  // 블록 설정
  const blocker = useActionBlock<GuardDemoActionMap>({
    condition: () => isLoading,
    onBlocked: (actionName, payload, reason) => {
      addLog(`🛑 ${actionName} blocked: ${reason}`);
    },
    debug: true
  });
  
  // 편의 executor 사용
  const executeWithBlock = useActionBlockExecutor(dispatch, {
    condition: () => isFormLocked,
    onBlocked: (actionName) => {
      addLog(`🔒 ${actionName} blocked: Form is locked`);
    }
  });
  
  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  }, []);
  
  // 액션 핸들러
  useActionHandler('submitForm', ({ data }) => {
    addLog(`📤 Form submitted: ${JSON.stringify(data)}`);
  });
  
  useActionHandler('apiCall', ({ endpoint }) => {
    addLog(`🌐 API called: ${endpoint}`);
  });
  
  const handleSubmitForm = () => {
    const payload = { data: { name: 'John', email: 'john@example.com' } };
    if (blocker.tryExecute('submitForm', payload, dispatch)) {
      // 성공적으로 실행됨
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 2000);
    }
  };
  
  const handleApiCall = () => {
    executeWithBlock.executeWithBlock('apiCall', { endpoint: '/api/users' });
  };
  
  const handleToggleManualBlock = () => {
    if (blocker.isBlocked('submitForm')) {
      blocker.unblock('submitForm');
      addLog('🔓 Manual block removed');
    } else {
      blocker.block('submitForm', undefined, 'Manually blocked');
      addLog('🔒 Manual block applied');
    }
  };
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '20px' }}>
      <h3>🛡️ Block Demo</h3>
      <p>블로킹은 특정 조건에서 액션 실행을 완전히 차단합니다.</p>
      
      <div style={{ marginBottom: '15px' }}>
        <h4>조건부 블로킹</h4>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
          <button 
            onClick={handleSubmitForm}
            disabled={isLoading}
            style={{ 
              padding: '8px 16px',
              backgroundColor: isLoading ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            {isLoading ? '제출 중...' : '폼 제출'}
          </button>
          <span style={{ color: isLoading ? '#dc3545' : '#28a745' }}>
            {isLoading ? '🔴 로딩 중 (블록됨)' : '🟢 사용 가능'}
          </span>
        </div>
        <small>로딩 중일 때는 폼 제출이 블록됩니다.</small>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <h4>수동 블로킹</h4>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
          <button onClick={handleToggleManualBlock} style={{ padding: '8px 16px' }}>
            {blocker.isBlocked('submitForm') ? '블록 해제' : '수동 블록'}
          </button>
          <button onClick={handleSubmitForm} style={{ padding: '8px 16px' }}>
            폼 제출 시도
          </button>
        </div>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <h4>폼 잠금 블로킹</h4>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
          <button 
            onClick={() => setIsFormLocked(!isFormLocked)}
            style={{ 
              padding: '8px 16px',
              backgroundColor: isFormLocked ? '#dc3545' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            {isFormLocked ? '🔓 폼 잠금 해제' : '🔒 폼 잠금'}
          </button>
          <button onClick={handleApiCall} style={{ padding: '8px 16px' }}>
            API 호출
          </button>
        </div>
      </div>
      
      <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h5>실행 로그:</h5>
        {logs.length === 0 ? (
          <p style={{ color: '#666', margin: 0 }}>아직 실행된 액션이 없습니다.</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={{ fontSize: '0.9em', fontFamily: 'monospace' }}>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function GuardDemo() {
  const [logs, setLogs] = useState<string[]>([]);
  const dispatch = useAction();
  
  // 통합 가드 설정 - 액션별 개별 설정
  const guard = useActionGuard<GuardDemoActionMap>({
    actionConfig: {
      'addToCart': { 
        mode: 'debounce', 
        debounce: { delay: 1000 } 
      },
      'sendMessage': { 
        mode: 'throttle+block', 
        throttle: { interval: 2000, leading: true, trailing: false },
        block: { 
          condition: () => logs.length > 10,
          onBlocked: () => addLog('🛑 Too many messages sent!')
        }
      }
    },
    debug: true
  });
  
  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  }, []);
  
  // 액션 핸들러
  useActionHandler('addToCart', ({ productId, quantity }) => {
    addLog(`🛒 Added to cart: ${productId} x${quantity}`);
  });
  
  useActionHandler('sendMessage', ({ message }) => {
    addLog(`📨 Message sent: "${message}"`);
  });
  
  const handleAddToCart = (productId: string) => {
    const payload = { productId, quantity: 1 };
    guard.executeWithGuard('addToCart', payload, dispatch);
  };
  
  const handleSendMessage = () => {
    const payload = { message: `Hello ${Math.floor(Math.random() * 1000)}` };
    guard.executeWithGuard('sendMessage', payload, dispatch);
  };
  
  const handleResetGuards = () => {
    guard.resetAll();
    addLog('🔄 All guards reset');
  };
  
  const handleClearLogs = () => {
    setLogs([]);
  };
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '20px' }}>
      <h3>🎭 Integrated Guard Demo</h3>
      <p>통합 가드로 액션별 다양한 제어 패턴을 적용할 수 있습니다.</p>
      
      <div style={{ marginBottom: '15px' }}>
        <h4>장바구니 (디바운스: 1초)</h4>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button onClick={() => handleAddToCart('laptop')} style={{ padding: '8px 16px' }}>
            💻 노트북 추가
          </button>
          <button onClick={() => handleAddToCart('mouse')} style={{ padding: '8px 16px' }}>
            🖱️ 마우스 추가
          </button>
          <button onClick={() => handleAddToCart('keyboard')} style={{ padding: '8px 16px' }}>
            ⌨️ 키보드 추가
          </button>
        </div>
        <small>같은 상품을 빠르게 추가하면 디바운싱됩니다.</small>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <h4>메시지 전송 (스로틀: 2초 + 블록: 10개 초과시)</h4>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button onClick={handleSendMessage} style={{ padding: '8px 16px' }}>
            📤 메시지 전송
          </button>
          <span style={{ fontSize: '0.9em', color: '#666' }}>
            (로그 {logs.length}/10개)
          </span>
        </div>
        <small>2초 간격으로만 전송 가능하며, 10개 초과시 블록됩니다.</small>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleResetGuards} style={{ padding: '8px 16px', backgroundColor: '#ffc107', border: 'none', borderRadius: '4px' }}>
            🔄 가드 리셋
          </button>
          <button onClick={handleClearLogs} style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}>
            🧹 로그 지우기
          </button>
        </div>
      </div>
      
      <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h5>실행 로그:</h5>
        {logs.length === 0 ? (
          <p style={{ color: '#666', margin: 0 }}>아직 실행된 액션이 없습니다.</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={{ fontSize: '0.9em', fontFamily: 'monospace' }}>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PresetDemo() {
  const [logs, setLogs] = useState<string[]>([]);
  const dispatch = useAction();
  
  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  }, []);
  
  // 프리셋을 사용한 가드들
  const quickGuard = useActionGuardExecutor(dispatch, GUARD_PRESETS.QUICK_DEBOUNCE);
  const standardGuard = useActionGuardExecutor(dispatch, GUARD_PRESETS.STANDARD_DEBOUNCE);
  const throttleGuard = useActionGuardExecutor(dispatch, GUARD_PRESETS.FAST_THROTTLE);
  const formGuard = useActionGuardExecutor(dispatch, GUARD_PRESETS.FORM_PROTECTION);
  
  // 패턴 조합 예시
  const combinedGuard = useActionGuardExecutor(dispatch, combineGuardPatterns(
    ACTION_PATTERNS.shopping,
    ACTION_PATTERNS.ui
  ));
  
  // 액션 핸들러
  useActionHandler('logAction', ({ type, data }) => {
    addLog(`${type}: ${JSON.stringify(data)}`);
  });
  
  const testPreset = (presetName: string, guard: any) => {
    guard.executeWithGuard('logAction', { type: presetName, data: { timestamp: Date.now() } });
  };
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '20px' }}>
      <h3>🎨 Presets & Patterns Demo</h3>
      <p>미리 정의된 프리셋과 패턴을 사용하여 빠르게 가드를 설정할 수 있습니다.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '15px' }}>
        <button onClick={() => testPreset('Quick (500ms)', quickGuard)} style={{ padding: '8px 16px' }}>
          ⚡ Quick Debounce
        </button>
        <button onClick={() => testPreset('Standard (1s)', standardGuard)} style={{ padding: '8px 16px' }}>
          🎯 Standard Debounce
        </button>
        <button onClick={() => testPreset('Fast Throttle', throttleGuard)} style={{ padding: '8px 16px' }}>
          🚀 Fast Throttle
        </button>
        <button onClick={() => testPreset('Form Protection', formGuard)} style={{ padding: '8px 16px' }}>
          🛡️ Form Protection
        </button>
      </div>
      
      <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h5>실행 로그:</h5>
        {logs.length === 0 ? (
          <p style={{ color: '#666', margin: 0 }}>버튼을 클릭해보세요!</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={{ fontSize: '0.9em', fontFamily: 'monospace' }}>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export function ReactActionGuardPage() {
  return (
    <Provider>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1>🛡️ Action Guard Hooks Demo</h1>
          <p style={{ fontSize: '1.1em', color: '#666' }}>
            액션 실행을 제어하는 다양한 훅들의 사용법을 살펴보세요.
            디바운싱, 스로틀링, 블로킹 등을 통해 사용자 경험을 개선할 수 있습니다.
          </p>
        </div>
        
        <DebounceDemo />
        <ThrottleDemo />
        <BlockDemo />
        <GuardDemo />
        <PresetDemo />
        
        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
          <h3>📋 사용 가능한 훅들</h3>
          <ul style={{ marginBottom: '15px' }}>
            <li><strong>useActionDebouncer</strong>: 디바운싱 전용 훅</li>
            <li><strong>useActionThrottle</strong>: 스로틀링 전용 훅</li>
            <li><strong>useActionBlock</strong>: 블로킹 전용 훅</li>
            <li><strong>useActionGuard</strong>: 통합 가드 훅 (추천)</li>
            <li><strong>Executor 훅들</strong>: dispatch와 결합된 편의 훅들</li>
          </ul>
          
          <h4>🎨 미리 정의된 프리셋</h4>
          <ul style={{ marginBottom: '15px' }}>
            <li><code>GUARD_PRESETS.QUICK_DEBOUNCE</code>: 500ms 디바운싱</li>
            <li><code>GUARD_PRESETS.STANDARD_DEBOUNCE</code>: 1초 디바운싱</li>
            <li><code>GUARD_PRESETS.FAST_THROTTLE</code>: 100ms 스로틀링</li>
            <li><code>GUARD_PRESETS.FORM_PROTECTION</code>: 폼 제출 보호</li>
            <li><code>ACTION_PATTERNS.shopping</code>: 쇼핑 관련 액션 패턴</li>
          </ul>
          
          <p style={{ marginBottom: 0 }}>
            더 자세한 사용법은 <code>src/hooks/</code> 폴더의 타입 정의와 주석을 참고하세요.
          </p>
        </div>
      </div>
    </Provider>
  );
}