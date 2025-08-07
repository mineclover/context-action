import { useState, useCallback, useEffect } from 'react';
import { createDeclarativeStores, useStoreValue, type StorePayloadMap, type StoreSchema } from '@context-action/react';
import { PageWithLogMonitor } from '../../components/LogMonitor/';
import { usePriorityTestManager, HandlerConfig } from './hooks';
import { ExecutionStateData } from './hooks/usePriorityExecutionState';
import { ActionTestProvider } from './context/ActionTestContext';
import styles from './PriorityTestPage.module.css';

// 기본 핸들러 설정 (점프 기능 테스트)
const DEFAULT_HANDLER_CONFIGS: HandlerConfig[] = [
  { id: 'h1', priority: 300, color: '#dc2626', label: 'Ultra High (300)', delay: 100, jumpToPriority: null, jumpToIndex: null },
  { id: 'h8', priority: 260, color: '#e11d48', label: 'Very High (260)', delay: 130, jumpToPriority: null, jumpToIndex: null },
  { id: 'h2', priority: 250, color: '#ea580c', label: 'High (250)', delay: 150, jumpToPriority: 230, jumpToIndex: null },
  { id: 'h3', priority: 230, color: '#f59e0b', label: 'High-Mid (230)', delay: 120, jumpToPriority: null, jumpToIndex: null },
  { id: 'h4', priority: 200, color: '#ca8a04', label: 'Medium (200)', delay: 120, jumpToPriority: 150, jumpToIndex: null },
  { id: 'h5', priority: 150, color: '#84cc16', label: 'Med-Low (150)', delay: 110, jumpToPriority: null, jumpToIndex: null },
  { id: 'h6', priority: 100, color: '#65a30d', label: 'Low (100)', delay: 80, jumpToPriority: null, jumpToIndex: null },
  { id: 'h7', priority: 50, color: '#0891b2', label: 'Lower (50)', delay: 90, jumpToPriority: null, jumpToIndex: null },
  { id: 'h9', priority: 20, color: '#7c3aed', label: 'Lowest (20)', delay: 70, jumpToPriority: 260, jumpToIndex: null },
];

// Priority Test Declarative Store Pattern 정의
interface PriorityTestStores extends StorePayloadMap {
  priorityCounts: Record<number, number>;
  executionState: ExecutionStateData;
}

const priorityTestSchema: StoreSchema<PriorityTestStores> = {
  priorityCounts: {
    initialValue: {},
    description: 'Priority execution counts',
    tags: ['priority', 'testing']
  },
  executionState: {
    initialValue: {
      isRunning: false,
      testResults: [],
      currentTestId: null,
      totalTests: 0,
      successfulTests: 0,
      failedTests: 0,
      abortedTests: 0,
      averageExecutionTime: 0,
      lastExecutionTime: 0,
      maxExecutionTime: 0,
      minExecutionTime: Number.MAX_VALUE
    },
    description: 'Test execution state and statistics',
    tags: ['execution', 'statistics', 'testing']
  }
};

const PriorityStores = createDeclarativeStores('PriorityTest', priorityTestSchema);

// 메인 테스트 컴포넌트
function PriorityTest() {
  // Declarative Store Pattern을 사용한 풍부한 상태 관리
  const priorityCountsStore = PriorityStores.useStore('priorityCounts'); // 자동 타입 추론: Store<Record<number, number>>
  const executionStateStore = PriorityStores.useStore('executionState'); // 자동 타입 추론: Store<ExecutionStateData>
  
  const priorityCounts = useStoreValue(priorityCountsStore);
  const executionState = useStoreValue(executionStateStore);
  
  const [configs, setConfigs] = useState<HandlerConfig[]>(DEFAULT_HANDLER_CONFIGS);
  const [bulkDelayValue, setBulkDelayValue] = useState<number>(100);

  // 모듈화된 우선순위 테스트 매니저 사용 (필수 Store 전달)
  const testManager = usePriorityTestManager(configs, priorityCountsStore, {
    executionStateStore,
    executionActionRegister: undefined, // 필요시 ActionRegister 전달
    enableToast: true,
    enableConsoleLog: true
  });

  // 테스트 실행
  const runPriorityTest = useCallback(async () => {
    if (testManager.isRunning) return;
    
    await testManager.executeTest(100); // 기본 지연 100ms (개별 설정은 config.delay 사용)
  }, [testManager]);

  // 설정 초기화
  const resetConfigs = useCallback(() => {
    setConfigs(DEFAULT_HANDLER_CONFIGS);
    testManager.initializeTest();
  }, [testManager]);

  // 우선순위 설정 업데이트
  const updateConfig = useCallback((index: number, field: keyof HandlerConfig, value: number | string | null) => {
    setConfigs(prev => prev.map((config, i) => 
      i === index ? { ...config, [field]: value } : config
    ));
  }, []);

  // 설정 추가
  const addConfig = useCallback(() => {
    const newConfig: HandlerConfig = {
      id: `h${Date.now()}`,
      priority: 100,
      color: '#6b7280',
      label: `Custom (100)`,
      delay: 100,
      jumpToPriority: null,
      jumpToIndex: null
    };
    setConfigs(prev => [...prev, newConfig]);
  }, []);

  // 임의 값으로 핸들러 추가
  const addRandomConfig = useCallback(() => {
    const priorities = [1000, 500, 100, 50, 10, 1];
    const colors = ['#dc2626', '#ea580c', '#ca8a04', '#65a30d', '#0891b2', '#7c3aed'];
    const randomPriority = priorities[Math.floor(Math.random() * priorities.length)];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomDelay = Math.floor(Math.random() * 300) + 50; // 50-350ms
    
    const newConfig: HandlerConfig = {
      id: `random-${Date.now()}`,
      priority: randomPriority,
      color: randomColor,
      label: `Random (${randomPriority})`,
      delay: randomDelay,
      jumpToPriority: Math.random() > 0.7 ? priorities[Math.floor(Math.random() * priorities.length)] : null,
      jumpToIndex: null
    };
    setConfigs(prev => [...prev, newConfig]);
  }, []);

  // 1부터 300까지 핸들러 일괄 추가 (중복 우선순위 제거)
  const addBulkHandlers = useCallback(() => {
    setConfigs(prev => {
      const bulkConfigs: HandlerConfig[] = [];
      const colors = ['#dc2626', '#ea580c', '#ca8a04', '#65a30d', '#0891b2', '#7c3aed', '#8b5cf6', '#f59e0b'];
      
      // 현재 설정에서 이미 사용 중인 우선순위 추출
      const existingPriorities = new Set(prev.map(config => config.priority));
      
      for (let priority = 1; priority <= 300; priority++) {
        // 이미 존재하는 우선순위는 건너뛰기
        if (existingPriorities.has(priority)) {
          continue;
        }
        
        const color = colors[priority % colors.length];
        const delay = Math.floor(Math.random() * 100) + 20; // 20-120ms
        
        bulkConfigs.push({
          id: `bulk-${priority}`,
          priority,
          color,
          label: `P${priority}`,
          delay,
          jumpToPriority: null,
          jumpToIndex: null
        });
      }
      
      return [...prev, ...bulkConfigs];
    });
  }, []);

  // 실행 중단
  const abortExecution = useCallback(() => {
    testManager.abortTest();
  }, [testManager]);

  // 설정 제거
  const removeConfig = useCallback((index: number) => {
    setConfigs(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 모든 핸들러의 지연 시간 일괄 수정
  const updateAllDelays = useCallback(() => {
    setConfigs(prev => prev.map(config => ({
      ...config,
      delay: bulkDelayValue
    })));
  }, [bulkDelayValue]);


  return (
    <div className="priority-test">
      <header className="page-header">
        <h1>Priority Execution Order Test</h1>
        <p className="page-description">
          우선순위별 액션 핸들러 실행 순서를 시각적으로 테스트합니다.
          같은 우선순위를 가진 핸들러들의 실행 순서도 확인할 수 있습니다.
        </p>
      </header>

      {/* 컨트롤 패널 */}
      <div className="demo-card mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3>🎮 테스트 컨트롤</h3>
          <div className="flex gap-2">
            <button 
              onClick={runPriorityTest}
              disabled={testManager.isRunning}
              className={`btn ${testManager.isRunning ? 'btn-secondary' : 'btn-primary'}`}
            >
              {testManager.isRunning ? '⏳ 실행 중...' : '🚀 우선순위 테스트 실행'}
            </button>
            <button 
              onClick={abortExecution}
              disabled={!testManager.isRunning}
              className="btn btn-danger"
            >
              🛑 실행 중단
            </button>
            <button 
              onClick={resetConfigs}
              disabled={testManager.isRunning}
              className="btn btn-secondary"
            >
              🔄 설정 초기화
            </button>
            <button 
              onClick={addConfig}
              disabled={testManager.isRunning}
              className="btn btn-info"
            >
              ➕ 핸들러 추가
            </button>
            <button 
              onClick={addRandomConfig}
              disabled={testManager.isRunning}
              className="btn btn-success"
            >
              🎲 임의 핸들러
            </button>
            <button 
              onClick={addBulkHandlers}
              disabled={testManager.isRunning}
              className="btn btn-warning"
            >
              📦 일괄 추가 (1-300)
            </button>
          </div>
        </div>

        {/* 일괄 지연 수정 컨트롤 */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">⏱️ 일괄 지연 수정:</span>
          <input
            type="number"
            value={bulkDelayValue}
            onChange={(e) => setBulkDelayValue(parseInt(e.target.value) || 0)}
            className="text-input w-20 text-sm"
            placeholder="ms"
            min="0"
            max="5000"
            disabled={testManager.isRunning}
          />
          <span className="text-xs text-gray-500">ms</span>
          <button
            onClick={updateAllDelays}
            disabled={testManager.isRunning}
            className="btn btn-secondary text-sm px-3 py-1"
          >
            🔄 모든 지연 시간 적용
          </button>
          <span className="text-xs text-gray-500">
            현재 {configs.length}개 핸들러의 지연 시간을 {bulkDelayValue}ms로 일괄 변경
          </span>
        </div>

        {/* 핸들러 관리 컨트롤 */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">🎛️ 핸들러 관리:</span>
          <button
            onClick={testManager.registerHandlers}
            disabled={testManager.isRunning}
            className="btn btn-info text-sm px-3 py-1"
          >
            🔄 핸들러 재등록
          </button>
          <button
            onClick={testManager.unregisterAllHandlers}
            disabled={testManager.isRunning}
            className="btn btn-warning text-sm px-3 py-1"
          >
            🗑️ 모든 핸들러 해제
          </button>
          <span className="text-xs text-gray-500">
            등록된 핸들러: {testManager.registeredHandlers?.size || 0}개
          </span>
          <div className="text-xs text-gray-600 max-w-md">
            핸들러 ID: {Array.from(testManager.registeredHandlers || []).join(', ') || '없음'}
          </div>
        </div>
        
        {/* 실행 통계 표시 */}
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">📊 실행 통계</span>
            <span className="text-sm font-medium text-indigo-600">
              테스트 ID: {executionState.currentTestId || 'None'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-2 rounded shadow-sm">
              <div className="text-green-600 font-semibold">✅ 성공</div>
              <div className="text-lg font-bold text-green-700">{executionState.successfulTests}</div>
            </div>
            <div className="bg-white p-2 rounded shadow-sm">
              <div className="text-red-600 font-semibold">❌ 실패</div>
              <div className="text-lg font-bold text-red-700">{executionState.failedTests}</div>
            </div>
            <div className="bg-white p-2 rounded shadow-sm">
              <div className="text-orange-600 font-semibold">⛔ 중단</div>
              <div className="text-lg font-bold text-orange-700">{executionState.abortedTests}</div>
            </div>
            <div className="bg-white p-2 rounded shadow-sm">
              <div className="text-blue-600 font-semibold">📈 총 테스트</div>
              <div className="text-lg font-bold text-blue-700">{executionState.totalTests}</div>
            </div>
          </div>
          
          {executionState.totalTests > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-xs">
              <div className="bg-white p-2 rounded shadow-sm">
                <div className="text-purple-600 font-semibold">⚡ 평균 시간</div>
                <div className="text-lg font-bold text-purple-700">{executionState.averageExecutionTime}ms</div>
              </div>
              <div className="bg-white p-2 rounded shadow-sm">
                <div className="text-teal-600 font-semibold">🚀 최대 시간</div>
                <div className="text-lg font-bold text-teal-700">{executionState.maxExecutionTime}ms</div>
              </div>
              <div className="bg-white p-2 rounded shadow-sm">
                <div className="text-cyan-600 font-semibold">⚡ 최소 시간</div>
                <div className="text-lg font-bold text-cyan-700">
                  {executionState.minExecutionTime === Number.MAX_VALUE ? 0 : executionState.minExecutionTime}ms
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-2 text-xs text-gray-600">
            등록된 핸들러: {testManager.getRegisteredCount()}개 | 
            카운팅 총합: {testManager.getTotalExecutionCount()}회
            {executionState.totalTests > 0 && (
              <> | 성공률: {((executionState.successfulTests / executionState.totalTests) * 100).toFixed(1)}%</>
            )}
          </div>
        </div>
      </div>

      {/* 우선순위별 실행 카운트 시각화 */}
      <div className="demo-card mb-6">
        <h3>📊 우선순위별 실행 카운트 시각화</h3>
        <div className={styles.priorityCountVisualization}>
          <div className={styles.priorityLegend}>
            <div className="text-xs text-gray-600 mb-1">
              각 우선순위별 실행 횟수를 실시간으로 표시합니다. 무한루프 시 카운트가 계속 증가합니다.
            </div>
            {testManager.isRunning && (
              <div className="text-xs text-blue-600 font-medium">
                ⚡ 현재 실행중... (총 실행 횟수: {Object.values(priorityCounts).reduce((sum, count) => sum + count, 0)})
              </div>
            )}
          </div>
          
          {/* 우선순위 그리드 (flex wrap) */}
          <div className={styles.priorityCountGrid}>
            {Array.from({ length: 300 }, (_, index) => {
              const priority = index + 1;
              const count = priorityCounts[priority] || 0;
              const hasHandlers = configs.some(config => config.priority === priority);
              
              // 핸들러가 없고 카운트도 0인 경우 표시하지 않음 (너무 많은 빈 셀 방지)
              if (!hasHandlers && count === 0) return null;
              
              return (
                <div 
                  key={priority} 
                  className={`${styles.priorityCountCell} ${hasHandlers ? styles.hasHandlers : ''} ${count > 0 ? styles.active : ''}`}
                  title={`Priority ${priority}: ${count}회 실행${hasHandlers ? ' (핸들러 있음)' : ''}`}
                >
                  <div className={styles.priorityNumber}>{priority}</div>
                  <div className={styles.countNumber}>{count > 0 ? count : ''}</div>
                </div>
              );
            }).filter(Boolean)}
          </div>
        </div>
      </div>

      {/* 우선순위 설정 - 아래쪽으로 이동 */}
      <div className="demo-card mb-6">
        <h3>⚙️ 우선순위 설정</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {configs.map((config, index) => (
            <div key={index} className={styles.priorityConfigItem}>
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <div className="flex-1 grid grid-cols-6 gap-2">
                  <input
                    type="text"
                    value={config.label}
                    onChange={(e) => updateConfig(index, 'label', e.target.value)}
                    className="text-input text-sm"
                    placeholder="라벨"
                    disabled={testManager.isRunning}
                  />
                  <input
                    type="number"
                    value={config.priority}
                    onChange={(e) => updateConfig(index, 'priority', parseInt(e.target.value) || 0)}
                    className="text-input text-sm"
                    placeholder="우선순위"
                    disabled={testManager.isRunning}
                  />
                  <input
                    type="number"
                    value={config.delay}
                    onChange={(e) => updateConfig(index, 'delay', parseInt(e.target.value) || 0)}
                    className="text-input text-sm"
                    placeholder="지연(ms)"
                    disabled={testManager.isRunning}
                  />
                  <input
                    type="number"
                    value={config.jumpToPriority || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : null;
                      updateConfig(index, 'jumpToPriority', value);
                    }}
                    className="text-input text-sm"
                    placeholder="점프P"
                    disabled={testManager.isRunning}
                  />
                  <input
                    type="number"
                    value={config.jumpToIndex || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : null;
                      updateConfig(index, 'jumpToIndex', value);
                    }}
                    className="text-input text-sm"
                    placeholder="점프#"
                    disabled={testManager.isRunning}
                  />
                  <input
                    type="text"
                    value={config.color}
                    onChange={(e) => updateConfig(index, 'color', e.target.value)}
                    className="text-input text-sm"
                    placeholder="색상"
                    disabled={testManager.isRunning}
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={() => testManager.unregisterHandler(`priority-${config.priority}`)}
                      disabled={testManager.isRunning || !testManager.registeredHandlers?.has(`priority-${config.priority}`)}
                      className="btn btn-warning text-xs px-1 py-1"
                      title="이 핸들러 해제"
                    >
                      🚫
                    </button>
                    <button
                      onClick={() => removeConfig(index)}
                      disabled={testManager.isRunning || configs.length <= 1}
                      className="btn btn-danger text-xs px-1 py-1"
                      title="이 우선순위 설정 삭제"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                ID: {config.id} | 우선순위: {config.priority} | 지연: {config.delay}ms | 색상: {config.color}
                {config.jumpToPriority !== null && config.jumpToPriority !== undefined && (
                  <span className="text-blue-600 font-medium"> | 점프 → P{config.jumpToPriority}{config.jumpToIndex !== null && config.jumpToIndex !== undefined ? `[${config.jumpToIndex}]` : ''}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 테스트 결과 로그 */}
      <div className="demo-card mt-6">
        <h3>📋 실행 로그</h3>
        <div className={styles.testLog}>
          {testManager.testResults.length === 0 ? (
            <div className="text-gray-500 text-center py-4">
              테스트를 실행하면 실행 로그가 표시됩니다
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {testManager.testResults.map((result, index) => (
                <div key={index} className={styles.logEntry}>
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 사용법 안내 */}
      <div className="demo-card mt-6">
        <h3>💡 사용법 및 테스트 패턴</h3>
        <div className={styles.usageGuide}>
          <div className="mb-4">
            <h4 className="font-semibold mb-2">기본 테스트 시나리오:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>높은 우선순위 먼저 실행</strong>: Priority 300 → 250 → 200 → 150 → 100 → 50 → 20 → 10 → 1</li>
              <li><strong>개별 핸들러 관리</strong>: 각 핸들러는 고유 ID로 개별 관리됨</li>
              <li><strong>지연 시간 다양화</strong>: 각 핸들러마다 다른 지연 시간으로 비동기 처리 테스트</li>
              <li><strong>우선순위 그리드 시각화</strong>: Flex wrap으로 자동 줄바꿈되는 우선순위별 실행 카운트</li>
            </ul>
          </div>
          
          <div className="mb-4">
            <h4 className="font-semibold mb-2">커스텀 테스트 방법:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>우선순위 값을 변경하여 다양한 조합 테스트</li>
              <li>지연 시간을 조정하여 비동기 실행 패턴 확인</li>
              <li>개별 핸들러를 추가/제거하여 다양한 시나리오 테스트</li>
              <li><strong>점프 기능</strong>: 점프P(우선순위), 점프#(인덱스) 설정으로 세밀한 점프 제어 (비워두면 점프 없음)</li>
              <li><strong>점프 제한</strong>: 각 핸들러는 최대 4번까지만 점프 가능 (무한루프 방지)</li>
              <li><strong>무한루프 주의</strong>: 뒤에서 앞으로 점프하는 설정 시 4번 제한 후 자동 중단</li>
              <li>극단적인 값(0, 1000, -100 등)으로 경계 조건 테스트</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-3 rounded">
            <p className="text-sm">
              <strong>📌 주요 확인 포인트:</strong><br/>
              1. 높은 숫자의 우선순위가 먼저 실행되는가?<br/>
              2. 개별 핸들러들이 우선순위 순서대로 실행되는가?<br/>
              3. 지연이 있는 비동기 핸들러도 우선순위가 올바르게 적용되는가?<br/>
              4. <strong>점프 기능</strong>이 제대로 동작하여 지정된 우선순위로 이동하는가?<br/>
              5. <strong>점프 제한</strong>: 각 핸들러가 4번 실행 후 자동으로 점프를 중단하는가?<br/>
              6. <strong>무한루프 방지</strong>: 점프 제한으로 인해 무한루프가 자동 차단되는가?
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 페이지 래퍼
function PriorityTestPage() {
  return (
    <PageWithLogMonitor 
      pageId="priority-test" 
      title="Priority Execution Test"
      initialConfig={{ enableToast: true, maxLogs: 100 }}
    >
      <ActionTestProvider>
        <PriorityStores.Provider registryId="priority-test">
          <PriorityTest />
        </PriorityStores.Provider>
      </ActionTestProvider>
    </PageWithLogMonitor>
  );
}

export default PriorityTestPage;