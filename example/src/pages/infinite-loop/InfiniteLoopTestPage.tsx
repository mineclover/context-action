import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createStore, useStoreValue } from '@context-action/react';
import { LogLevel } from '@context-action/logger';
import ComparisonStrategyDemo from './ImprovedComparisonComponent';

// 로그 엔트리 타입 정의
interface LogEntry {
  id: number;
  message: string;
  timestamp: Date;
}

// 렌더링 카운터 훅
function useRenderCounter(name: string) {
  const renderCount = useRef(0);
  renderCount.current += 1;
  
  useEffect(() => {
    console.log(`🔄 ${name} rendered: ${renderCount.current} times`);
  });
  
  return renderCount.current;
}

// 무한 루프를 유발하는 나쁜 컴포넌트
function BadInfiniteLoopComponent({ pageId }: { pageId: string }) {
  const renderCount = useRenderCounter('BadComponent');
  
  // ❌ 나쁨: 매번 새로운 스토어 생성
  const logsStore = useMemo(() => createStore<LogEntry[]>('bad-logs', []), []);
  const configStore = useMemo(() => createStore<any>('bad-config', {}), []);
  
  // ❌ 나쁨: 매번 새로운 객체 생성
  const config = useStoreValue(configStore) ?? { 
    maxLogs: 50, 
    enableAutoCleanup: true,
    pageId // ❌ pageId가 변경되면 새로운 객체
  };
  
  // ❌ 나쁨: config를 의존성으로 사용
  const stableAPI = useMemo(() => ({
    addLog: (message: string) => {
      const logs = logsStore.getValue();
      const newLog = { id: Date.now(), message, timestamp: new Date() };
      logsStore.setValue([...logs, newLog]);
    }
  }), [logsStore, config]); // ❌ config 의존성이 불안정
  
  // ❌ 위험: useEffect에서 직접 store 조작
  useEffect(() => {
    console.log(`🚨 BadComponent: useEffect triggered (render #${renderCount})`);
    
    // ❌ 직접 store 조작이 무한 루프 유발
    const initLog = { 
      id: Date.now(), 
      message: `페이지 초기화: ${pageId}`, 
      timestamp: new Date() 
    };
    logsStore.setValue([initLog]); // 이것이 무한 루프를 유발함
  }, [pageId, logsStore, config, stableAPI]); // ❌ 불안정한 의존성들
  
  const logs = useStoreValue(logsStore) ?? [];
  
  return (
    <div className="border-2 border-red-500 p-4 rounded-lg bg-red-50">
      <h3 className="text-red-700 font-bold mb-2">❌ Bad Component (Infinite Loop)</h3>
      <div className="text-sm space-y-1">
        <div className="text-red-600">🔄 Render Count: <strong>{renderCount}</strong></div>
        <div className="text-gray-600">📝 Logs Count: {logs.length}</div>
        <div className="text-gray-600">🔧 Config: {JSON.stringify(config)}</div>
        <button 
          onClick={() => stableAPI.addLog(`Manual log ${Date.now()}`)}
          className="bg-red-500 text-white px-2 py-1 rounded text-xs"
        >
          Add Log
        </button>
        {renderCount > 10 && (
          <div className="text-red-800 font-bold animate-pulse">
            ⚠️ INFINITE LOOP DETECTED! Render count &gt; 10
          </div>
        )}
      </div>
    </div>
  );
}

// 무한 루프가 없는 좋은 컴포넌트
function GoodStableComponent({ pageId }: { pageId: string }) {
  const renderCount = useRenderCounter('GoodComponent');
  
  // ✅ 좋음: 안정적인 스토어 생성
  const logsStore = useMemo(() => createStore<LogEntry[]>('good-logs', []), []);
  const configStore = useMemo(() => createStore<any>('good-config', {}), []);
  
  // ✅ 좋음: fallback config를 useMemo로 안정화
  const fallbackConfig = useMemo(() => ({ 
    maxLogs: 50, 
    enableAutoCleanup: true,
    pageId 
  }), [pageId]); // ✅ pageId만 의존성으로
  
  const config = useStoreValue(configStore) ?? fallbackConfig;
  
  // ✅ 좋음: 안정적인 의존성 사용
  const stableAPI = useMemo(() => ({
    addLog: (message: string) => {
      const logs = logsStore.getValue();
      const newLog = { id: Date.now(), message, timestamp: new Date() };
      const maxLogs = fallbackConfig.maxLogs;
      const updatedLogs = [...logs, newLog];
      if (updatedLogs.length > maxLogs) {
        updatedLogs.splice(0, updatedLogs.length - maxLogs);
      }
      logsStore.setValue(updatedLogs);
    }
  }), [logsStore, fallbackConfig]); // ✅ fallbackConfig는 안정적
  
  // ✅ 안전: useEffect에서 직접 store 조작 피하기
  useEffect(() => {
    console.log(`✅ GoodComponent: useEffect triggered (render #${renderCount})`);
    
    // ✅ 안전: API를 통한 로그 추가
    stableAPI.addLog(`페이지 초기화: ${pageId}`);
    
    return () => {
      console.log(`✅ GoodComponent: cleanup (render #${renderCount})`);
    };
  }, [pageId, stableAPI]); // ✅ 안정적인 의존성만
  
  const logs = useStoreValue(logsStore) ?? [];
  
  return (
    <div className="border-2 border-green-500 p-4 rounded-lg bg-green-50">
      <h3 className="text-green-700 font-bold mb-2">✅ Good Component (Stable)</h3>
      <div className="text-sm space-y-1">
        <div className="text-green-600">🔄 Render Count: <strong>{renderCount}</strong></div>
        <div className="text-gray-600">📝 Logs Count: {logs.length}</div>
        <div className="text-gray-600">🔧 Config: {JSON.stringify(config)}</div>
        <button 
          onClick={() => stableAPI.addLog(`Manual log ${Date.now()}`)}
          className="bg-green-500 text-white px-2 py-1 rounded text-xs"
        >
          Add Log
        </button>
        {renderCount <= 3 && (
          <div className="text-green-800 font-bold">
            ✅ STABLE: Normal render count
          </div>
        )}
      </div>
    </div>
  );
}

// 메인 테스트 페이지
export default function InfiniteLoopTestPage() {
  const [mounted, setMounted] = useState(false);
  const [componentType, setComponentType] = useState<'bad' | 'good' | 'improved'>('good');
  const [pageId, setPageId] = useState('test-page-1');
  const [autoRemount, setAutoRemount] = useState(false);
  const pageRenderCount = useRenderCounter('TestPage');
  
  // 자동 리마운트 기능
  useEffect(() => {
    if (autoRemount && mounted) {
      const interval = setInterval(() => {
        setMounted(false);
        setTimeout(() => setMounted(true), 100);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [autoRemount, mounted]);
  
  const clearConsole = useCallback(() => {
    console.clear();
    console.log('🧹 Console cleared - Starting fresh test');
  }, []);
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h1 className="text-2xl font-bold text-blue-800 mb-2">
          🧪 Infinite Loop Test Environment
        </h1>
        <p className="text-blue-700">
          이 페이지는 React + Store 통합에서 발생할 수 있는 무한 루프 패턴을 테스트하고 비교할 수 있는 환경입니다.
        </p>
        <div className="text-sm text-blue-600 mt-2">
          🔄 Page Render Count: <strong>{pageRenderCount}</strong>
        </div>
      </div>
      
      {/* 컨트롤 패널 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">🎛️ Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 컴포넌트 타입 선택 */}
          <div>
            <label className="block text-sm font-medium mb-1">Component Type</label>
            <select 
              value={componentType} 
              onChange={(e) => setComponentType(e.target.value as 'bad' | 'good' | 'improved')}
              className="w-full p-2 border rounded"
            >
              <option value="good">✅ Good (Stable)</option>
              <option value="bad">❌ Bad (Infinite Loop)</option>
              <option value="improved">⚡ Improved (Smart Comparison)</option>
            </select>
          </div>
          
          {/* 마운트 컨트롤 */}
          <div>
            <label className="block text-sm font-medium mb-1">Mount Control</label>
            <button 
              onClick={() => setMounted(!mounted)}
              className={`w-full p-2 rounded font-medium ${
                mounted 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {mounted ? 'Unmount' : 'Mount'}
            </button>
          </div>
          
          {/* 페이지 ID 변경 */}
          <div>
            <label className="block text-sm font-medium mb-1">Page ID</label>
            <input 
              type="text" 
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="test-page-1"
            />
          </div>
          
          {/* 유틸리티 */}
          <div>
            <label className="block text-sm font-medium mb-1">Utilities</label>
            <div className="space-y-1">
              <button 
                onClick={clearConsole}
                className="w-full p-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
              >
                Clear Console
              </button>
              <label className="flex items-center text-sm">
                <input 
                  type="checkbox" 
                  checked={autoRemount}
                  onChange={(e) => setAutoRemount(e.target.checked)}
                  className="mr-1"
                />
                Auto Remount (3s)
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* 경고 및 설명 */}
      {componentType === 'bad' && mounted && (
        <div className="bg-red-100 border border-red-300 rounded-lg p-4">
          <h3 className="text-red-800 font-bold mb-2">⚠️ WARNING</h3>
          <p className="text-red-700 text-sm">
            "Bad Component"를 마운트하면 의도적으로 무한 루프가 발생합니다. 
            브라우저가 느려질 수 있으니 개발자 도구 콘솔을 열어서 로그를 확인하세요.
          </p>
          <div className="mt-2 text-xs text-red-600">
            • Render count가 급속히 증가합니다<br/>
            • 콘솔에 useEffect 호출 로그가 계속 출력됩니다<br/>
            • React DevTools에서 "Maximum update depth exceeded" 경고가 나타날 수 있습니다
          </div>
        </div>
      )}
      
      {/* 컴포넌트 렌더링 영역 */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">🖼️ Component Under Test</h2>
        
        {mounted ? (
          <div>
            {componentType === 'bad' ? (
              <BadInfiniteLoopComponent pageId={pageId} />
            ) : componentType === 'improved' ? (
              <ComparisonStrategyDemo pageId={pageId} />
            ) : (
              <GoodStableComponent pageId={pageId} />
            )}
          </div>
        ) : (
          <div className="border-2 border-gray-300 border-dashed rounded-lg p-8 text-center text-gray-500">
            Component is unmounted. Click "Mount" to test.
          </div>
        )}
      </div>
      
      {/* 설명 섹션 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">📚 What to Look For</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-red-700 mb-2">❌ Bad Component Issues:</h3>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>Render count increases rapidly (&gt;10)</li>
              <li>Console shows repeated useEffect calls</li>
              <li>Browser becomes unresponsive</li>
              <li>Memory usage increases</li>
              <li>React DevTools shows warnings</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-green-700 mb-2">✅ Good Component Benefits:</h3>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>Stable render count (&le;3)</li>
              <li>Clean useEffect lifecycle</li>
              <li>Predictable performance</li>
              <li>No memory leaks</li>
              <li>No React warnings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}