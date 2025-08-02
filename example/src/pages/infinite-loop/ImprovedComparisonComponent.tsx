import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createStore, useStoreValue } from '@context-action/react';
import { setGlobalComparisonOptions } from '@context-action/react';

// 렌더링 카운터 훅
function useRenderCounter(name: string) {
  const renderCount = useRef(0);
  renderCount.current += 1;
  
  useEffect(() => {
    console.log(`🔄 ${name} rendered: ${renderCount.current} times`);
  });
  
  return renderCount.current;
}

// 로그 엔트리 타입
interface LogEntry {
  id: number;
  message: string;
  timestamp: Date;
}

// 개선된 비교 로직을 사용하는 컴포넌트
function ImprovedComparisonComponent({ 
  pageId, 
  comparisonStrategy 
}: { 
  pageId: string; 
  comparisonStrategy: 'reference' | 'shallow' | 'deep';
}) {
  const renderCount = useRenderCounter(`ImprovedComponent-${comparisonStrategy}`);
  
  // 스토어 생성 (전역 비교 전략 적용)
  const logsStore = useMemo(() => {
    setGlobalComparisonOptions({ strategy: comparisonStrategy });
    return createStore<LogEntry[]>(`improved-logs-${comparisonStrategy}`, []);
  }, [comparisonStrategy]);
  
  const configStore = useMemo(() => {
    return createStore<any>(`improved-config-${comparisonStrategy}`, {});
  }, [comparisonStrategy]);
  
  // ⚡ 이제 이 패턴이 개선된 비교 로직으로 안전함!
  const config = useStoreValue(configStore) ?? { 
    maxLogs: 50, 
    enableAutoCleanup: true,
    pageId, // 매번 새로운 객체 생성하지만 shallow/deep 비교로 안전
    metadata: {
      version: '1.0.0',
      features: ['logging', 'cleanup'],
      settings: {
        theme: 'light',
        language: 'ko'
      }
    }
  };
  
  // 안정적인 API 생성
  const stableAPI = useMemo(() => ({
    addLog: (message: string) => {
      const logs = logsStore.getValue();
      const newLog: LogEntry = { 
        id: Date.now(), 
        message, 
        timestamp: new Date() 
      };
      
      const updatedLogs = [...logs, newLog];
      if (updatedLogs.length > config.maxLogs) {
        updatedLogs.splice(0, updatedLogs.length - config.maxLogs);
      }
      
      logsStore.setValue(updatedLogs);
    }
  }), [logsStore, config.maxLogs]); // config.maxLogs 의존성도 이제 안전!
  
  // useEffect에서 config 사용 (이제 안전함)
  useEffect(() => {
    console.log(`🚀 ImprovedComponent (${comparisonStrategy}): useEffect triggered (render #${renderCount})`);
    
    // 이제 이 패턴도 안전함
    if (config.enableAutoCleanup) {
      stableAPI.addLog(`페이지 초기화: ${pageId} (전략: ${comparisonStrategy})`);
    }
  }, [pageId, config, stableAPI, comparisonStrategy]); // config 의존성이 이제 안전!
  
  const logs = useStoreValue(logsStore) ?? [];
  
  // 비교 전략별 색상 설정
  const getStrategyColor = () => {
    switch (comparisonStrategy) {
      case 'reference': return 'border-orange-500 bg-orange-50';
      case 'shallow': return 'border-blue-500 bg-blue-50';
      case 'deep': return 'border-purple-500 bg-purple-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };
  
  const getStrategyTextColor = () => {
    switch (comparisonStrategy) {
      case 'reference': return 'text-orange-700';
      case 'shallow': return 'text-blue-700';
      case 'deep': return 'text-purple-700';
      default: return 'text-gray-700';
    }
  };
  
  return (
    <div className={`border-2 p-4 rounded-lg ${getStrategyColor()}`}>
      <h3 className={`font-bold mb-2 ${getStrategyTextColor()}`}>
        ⚡ {comparisonStrategy.toUpperCase()} Comparison Strategy
      </h3>
      <div className="text-sm space-y-1">
        <div className={getStrategyTextColor()}>
          🔄 Render Count: <strong>{renderCount}</strong>
          {renderCount <= 3 && <span className="ml-2 text-green-600">✅ Stable</span>}
          {renderCount > 3 && renderCount <= 10 && <span className="ml-2 text-yellow-600">⚠️ Watch</span>}
          {renderCount > 10 && <span className="ml-2 text-red-600">🚨 Issue</span>}
        </div>
        <div className="text-gray-600">📝 Logs Count: {logs.length}</div>
        <div className="text-gray-600">
          🔧 Config Keys: {Object.keys(config).length}
        </div>
        <div className="text-xs text-gray-500 bg-white p-2 rounded border">
          <strong>Config Object:</strong><br/>
          <code>{JSON.stringify(config, null, 2)}</code>
        </div>
        <button 
          onClick={() => stableAPI.addLog(`Manual log ${Date.now()}`)}
          className={`px-2 py-1 rounded text-xs text-white ${
            comparisonStrategy === 'reference' ? 'bg-orange-500 hover:bg-orange-600' :
            comparisonStrategy === 'shallow' ? 'bg-blue-500 hover:bg-blue-600' :
            'bg-purple-500 hover:bg-purple-600'
          }`}
        >
          Add Log
        </button>
      </div>
    </div>
  );
}

// 비교 전략 데모 페이지
export default function ComparisonStrategyDemo({ pageId }: { pageId: string }) {
  const [remountKey, setRemountKey] = useState(0);
  const pageRenderCount = useRenderCounter('ComparisonDemo');
  
  const remountAll = () => {
    setRemountKey(prev => prev + 1);
    console.clear();
    console.log('🔄 All components remounted - observing comparison strategies');
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h2 className="text-lg font-bold text-green-800 mb-2">
          ⚡ Improved Store Comparison Logic Demo
        </h2>
        <p className="text-green-700 text-sm mb-2">
          Store의 개선된 비교 로직으로 <code>{'{ key: "value" }'}</code> 패턴이 더 이상 무한 루프를 유발하지 않습니다!
        </p>
        <div className="text-xs text-green-600">
          🔄 Demo Page Render Count: <strong>{pageRenderCount}</strong>
        </div>
      </div>
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">🎛️ Demo Controls</h3>
          <button 
            onClick={remountAll}
            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
          >
            Remount All Components
          </button>
        </div>
        <div className="text-sm text-gray-600">
          <p><strong>Page ID:</strong> {pageId}</p>
          <p><strong>Test Focus:</strong> 매번 새로운 config 객체 생성 시 각 비교 전략의 동작 관찰</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div key={`reference-${remountKey}`}>
          <ImprovedComparisonComponent 
            pageId={pageId} 
            comparisonStrategy="reference" 
          />
          <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
            <strong>Reference 전략:</strong> 참조 비교만 수행. 새로운 객체는 무조건 "다름"으로 판단하여 
            잠재적으로 더 많은 리렌더링 발생 가능.
          </div>
        </div>
        
        <div key={`shallow-${remountKey}`}>
          <ImprovedComparisonComponent 
            pageId={pageId} 
            comparisonStrategy="shallow" 
          />
          <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
            <strong>Shallow 전략:</strong> 1레벨 프로퍼티 비교. 동일한 내용의 객체는 "같음"으로 판단하여 
            불필요한 리렌더링 방지.
          </div>
        </div>
        
        <div key={`deep-${remountKey}`}>
          <ImprovedComparisonComponent 
            pageId={pageId} 
            comparisonStrategy="deep" 
          />
          <div className="mt-2 text-xs text-purple-600 bg-purple-50 p-2 rounded">
            <strong>Deep 전략:</strong> 깊은 비교 수행. 중첩 객체까지 내용을 비교하여 
            가장 정확한 변경 감지.
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-blue-800 font-bold mb-2">📊 비교 결과 관찰 포인트</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-orange-700 mb-1">🟠 Reference</h4>
            <ul className="text-gray-700 space-y-1 list-disc list-inside">
              <li>매번 새로운 객체 → 항상 변경으로 감지</li>
              <li>가장 빠른 비교 성능</li>
              <li>더 많은 리렌더링 가능성</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-700 mb-1">🔵 Shallow</h4>
            <ul className="text-gray-700 space-y-1 list-disc list-inside">
              <li>내용이 같으면 변경 없음으로 감지</li>
              <li>균형잡힌 성능</li>
              <li>대부분의 케이스에 적합</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-purple-700 mb-1">🟣 Deep</h4>
            <ul className="text-gray-700 space-y-1 list-disc list-inside">
              <li>중첩 객체까지 정확한 비교</li>
              <li>가장 정확한 변경 감지</li>
              <li>복잡한 객체에 적합</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}