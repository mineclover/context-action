/**
 * @fileoverview ReactActionGuardConfigPage - 환경 설정 기반 ActionGuard 데모
 * .env 파일의 환경 변수를 활용한 설정 예시를 보여줍니다.
 */

import React, { useState, useCallback } from 'react';
import { 
  createActionContext,
  type ActionPayloadMap 
} from '@context-action/react';
import { 
  useActionGuard,
  ACTION_GUARD_CONFIG,
  CONTEXT_ACTION_CONFIG,
  createActionGuardOptions,
  GUARD_PRESETS
} from '../../hooks';

// ============================================
// Type Definitions
// ============================================

interface ConfigDemoActionMap extends ActionPayloadMap {
  envBasedAction: { message: string };
  configTestAction: { value: number };
  debugAction: { level: string };
}

// ============================================
// Context Setup
// ============================================

const { Provider, useAction, useActionHandler } = 
  createActionContext<ConfigDemoActionMap>();

// ============================================
// Demo Components
// ============================================

function EnvironmentDisplay() {
  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#f8f9fa' }}>
      <h3>🌍 현재 환경 설정</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div>
          <h4>ActionGuard 설정</h4>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li><strong>Debug 모드:</strong> {ACTION_GUARD_CONFIG.debug ? '✅ 활성화' : '❌ 비활성화'}</li>
            <li><strong>기본 디바운스 지연:</strong> {ACTION_GUARD_CONFIG.defaultDebounceDelay}ms</li>
            <li><strong>기본 스로틀 간격:</strong> {ACTION_GUARD_CONFIG.defaultThrottleInterval}ms</li>
            <li><strong>로그 레벨:</strong> {ACTION_GUARD_CONFIG.logLevel}</li>
            <li><strong>환경:</strong> {ACTION_GUARD_CONFIG.isDevelopment ? '개발' : '프로덕션'}</li>
          </ul>
        </div>
        
        <div>
          <h4>Context-Action 설정</h4>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li><strong>트레이스:</strong> {CONTEXT_ACTION_CONFIG.trace ? '✅ 활성화' : '❌ 비활성화'}</li>
            <li><strong>디버그:</strong> {CONTEXT_ACTION_CONFIG.debug ? '✅ 활성화' : '❌ 비활성화'}</li>
            <li><strong>로그 레벨:</strong> {CONTEXT_ACTION_CONFIG.logLevel}</li>
            <li><strong>로거 이름:</strong> {CONTEXT_ACTION_CONFIG.loggerName}</li>
          </ul>
        </div>
      </div>
      
      <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
        <h5>📝 환경 변수 설정 방법</h5>
        <p style={{ margin: '5px 0', fontSize: '0.9em' }}>
          <code>.env</code> 파일에서 다음 변수들을 수정할 수 있습니다:
        </p>
        <pre style={{ fontSize: '0.8em', backgroundColor: '#fff', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
{`VITE_ACTION_GUARD_DEBUG=true
VITE_ACTION_GUARD_DEFAULT_DEBOUNCE_DELAY=1000
VITE_ACTION_GUARD_DEFAULT_THROTTLE_INTERVAL=300
VITE_ACTION_GUARD_LOG_LEVEL=DEBUG`}
        </pre>
      </div>
    </div>
  );
}

function ConfigBasedDemo() {
  const [logs, setLogs] = useState<string[]>([]);
  const dispatch = useAction();
  
  // 환경 설정 기반으로 ActionGuard 생성
  const envGuard = useActionGuard<ConfigDemoActionMap>(createActionGuardOptions({
    mode: 'debounce',
    // 환경 변수가 자동으로 적용됨
  }));
  
  // 표준 프리셋 사용 (환경 변수 기반)
  const presetGuard = useActionGuard<ConfigDemoActionMap>(GUARD_PRESETS.STANDARD_DEBOUNCE);
  
  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  }, []);
  
  // 액션 핸들러
  useActionHandler('envBasedAction', ({ message }) => {
    addLog(`🌍 환경 설정 기반: ${message}`);
  });
  
  useActionHandler('configTestAction', ({ value }) => {
    addLog(`⚙️ 설정 테스트: ${value}`);
  });
  
  useActionHandler('debugAction', ({ level }) => {
    addLog(`🐛 디버그 액션: ${level}`);
  });
  
  const handleEnvAction = () => {
    const payload = { message: `디바운스 ${ACTION_GUARD_CONFIG.defaultDebounceDelay}ms 적용` };
    envGuard.executeWithGuard('envBasedAction', payload, dispatch);
  };
  
  const handlePresetAction = () => {
    const payload = { value: Math.floor(Math.random() * 100) };
    presetGuard.executeWithGuard('configTestAction', payload, dispatch);
  };
  
  const handleDebugAction = () => {
    const payload = { level: ACTION_GUARD_CONFIG.logLevel };
    if (ACTION_GUARD_CONFIG.debug) {
      envGuard.executeWithGuard('debugAction', payload, dispatch);
    } else {
      addLog('🚫 디버그 모드가 비활성화되어 있습니다');
    }
  };
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '20px' }}>
      <h3>⚙️ 환경 설정 기반 ActionGuard</h3>
      <p>환경 변수에서 읽은 설정이 자동으로 적용됩니다.</p>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
        <button 
          onClick={handleEnvAction}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px' 
          }}
        >
          환경 설정 기반 액션 ({ACTION_GUARD_CONFIG.defaultDebounceDelay}ms)
        </button>
        
        <button 
          onClick={handlePresetAction}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px' 
          }}
        >
          프리셋 기반 액션
        </button>
        
        <button 
          onClick={handleDebugAction}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: ACTION_GUARD_CONFIG.debug ? '#ffc107' : '#6c757d', 
            color: ACTION_GUARD_CONFIG.debug ? 'black' : 'white', 
            border: 'none', 
            borderRadius: '4px' 
          }}
        >
          디버그 액션 (레벨: {ACTION_GUARD_CONFIG.logLevel})
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

function EnvironmentTestTools() {
  const [customConfig, setCustomConfig] = useState({
    delay: ACTION_GUARD_CONFIG.defaultDebounceDelay,
    debug: ACTION_GUARD_CONFIG.debug
  });
  
  const customGuard = useActionGuard<ConfigDemoActionMap>(createActionGuardOptions({
    mode: 'debounce',
    debounce: {
      delay: customConfig.delay,
      debug: customConfig.debug
    }
  }));
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '20px' }}>
      <h3>🧪 환경 설정 테스트 도구</h3>
      <p>런타임에서 설정을 변경하여 테스트해볼 수 있습니다.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            디바운스 지연 시간 (ms)
          </label>
          <input
            type="number"
            value={customConfig.delay}
            onChange={(e) => setCustomConfig(prev => ({ ...prev, delay: parseInt(e.target.value) || 1000 }))}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            min="100"
            max="5000"
            step="100"
          />
          <small style={{ color: '#666' }}>
            환경 변수 기본값: {ACTION_GUARD_CONFIG.defaultDebounceDelay}ms
          </small>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            디버그 모드
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={customConfig.debug}
              onChange={(e) => setCustomConfig(prev => ({ ...prev, debug: e.target.checked }))}
            />
            디버그 로그 출력
          </label>
          <small style={{ color: '#666' }}>
            환경 변수 기본값: {ACTION_GUARD_CONFIG.debug ? '활성화' : '비활성화'}
          </small>
        </div>
      </div>
      
      <div style={{ padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
        <h5>현재 커스텀 설정:</h5>
        <p style={{ margin: '5px 0', fontFamily: 'monospace' }}>
          지연시간: {customConfig.delay}ms, 디버그: {customConfig.debug ? '활성화' : '비활성화'}
        </p>
      </div>
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export function ReactActionGuardConfigPage() {
  return (
    <Provider>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1>⚙️ ActionGuard 환경 설정 데모</h1>
          <p style={{ fontSize: '1.1em', color: '#666' }}>
            <code>.env</code> 파일의 환경 변수를 활용하여 ActionGuard를 설정하는 방법을 살펴보세요.
          </p>
        </div>
        
        <EnvironmentDisplay />
        <ConfigBasedDemo />
        <EnvironmentTestTools />
        
        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
          <h3>🔧 환경 변수 설정 가이드</h3>
          
          <h4>1. Vite 환경 변수 규칙</h4>
          <ul>
            <li>클라이언트에서 접근할 변수는 <code>VITE_</code> 접두사 필요</li>
            <li><code>import.meta.env.VITE_YOUR_VARIABLE</code>로 접근</li>
            <li><code>import.meta.env.DEV</code>, <code>import.meta.env.PROD</code> 자동 제공</li>
          </ul>
          
          <h4>2. ActionGuard 환경 변수</h4>
          <ul>
            <li><code>VITE_ACTION_GUARD_DEBUG</code>: 디버그 모드 (true/false)</li>
            <li><code>VITE_ACTION_GUARD_DEFAULT_DEBOUNCE_DELAY</code>: 기본 디바운스 지연시간 (밀리초)</li>
            <li><code>VITE_ACTION_GUARD_DEFAULT_THROTTLE_INTERVAL</code>: 기본 스로틀 간격 (밀리초)</li>
            <li><code>VITE_ACTION_GUARD_LOG_LEVEL</code>: 로그 레벨 (TRACE, DEBUG, INFO, WARN, ERROR, NONE)</li>
          </ul>
          
          <h4>3. 사용 방법</h4>
          <pre style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '4px', overflow: 'auto' }}>
{`// 환경 설정 기반 ActionGuard 생성
import { useActionGuard, createActionGuardOptions } from './hooks';

const guard = useActionGuard(createActionGuardOptions({
  mode: 'debounce',
  // 환경 변수가 자동으로 적용됨
}));

// 또는 프리셋 사용 (환경 변수 기반)
import { GUARD_PRESETS } from './hooks';
const guard = useActionGuard(GUARD_PRESETS.STANDARD_DEBOUNCE);`}
          </pre>
        </div>
      </div>
    </Provider>
  );
}