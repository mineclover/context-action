import React, { useState, useCallback } from 'react';
import { PageWithLogMonitor } from '../../components/LogMonitor/';
import { usePriorityTestManager, HandlerConfig } from './hooks';
import { ActionTestProvider, PriorityTestProvider } from './context/ActionTestContext';
import { PriorityCountDisplay, ExecutionStateDisplay, PriorityCountGrid } from './components';

// 기본 핸들러 설정
const DEFAULT_HANDLER_CONFIGS: HandlerConfig[] = [
  { id: 'h1', priority: 300, color: '#dc2626', label: 'Ultra High', delay: 100, jumpToPriority: null, jumpToIndex: null },
  { id: 'h2', priority: 250, color: '#ea580c', label: 'High', delay: 150, jumpToPriority: null, jumpToIndex: null },
  { id: 'h3', priority: 200, color: '#ca8a04', label: 'Medium', delay: 120, jumpToPriority: null, jumpToIndex: null },
  { id: 'h4', priority: 150, color: '#84cc16', label: 'Med-Low', delay: 110, jumpToPriority: null, jumpToIndex: null },
  { id: 'h5', priority: 100, color: '#65a30d', label: 'Low', delay: 80, jumpToPriority: null, jumpToIndex: null },
  { id: 'h6', priority: 50, color: '#0891b2', label: 'Lower', delay: 90, jumpToPriority: null, jumpToIndex: null },
];

// 모듈화된 테스트 컴포넌트
function ModularPriorityTest() {
  const [configs, setConfigs] = useState<HandlerConfig[]>(DEFAULT_HANDLER_CONFIGS);
  
  const testManager = usePriorityTestManager(configs, {
    enableToast: true,
    enableConsoleLog: true
  });

  const runPriorityTest = useCallback(async () => {
    if (testManager.isRunning) return;
    await testManager.executeTest();
  }, [testManager]);

  const abortExecution = useCallback(() => {
    testManager.abortTest();
  }, [testManager]);

  const resetConfigs = useCallback(() => {
    setConfigs(DEFAULT_HANDLER_CONFIGS);
    testManager.initializeTest();
  }, [testManager]);

  // 우선순위 목록 생성 (1부터 300까지, 설정된 핸들러가 있는 것만)
  const activePriorities = Array.from({ length: 300 }, (_, i) => i + 1)
    .filter(p => {
      const hasConfig = configs.some(c => c.priority === p);
      // 실제 실행 횟수가 있거나 설정이 있는 경우만 표시
      return hasConfig;
    });

  return (
    <div className="priority-test">
      <header className="page-header">
        <h1>🧩 Modular Priority Test Components</h1>
        <p className="page-description">
          개별 훅을 사용하여 모듈화된 컴포넌트로 우선순위 테스트를 관리합니다.
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
              {testManager.isRunning ? '⏳ 실행 중...' : '🚀 테스트 실행'}
            </button>
            <button 
              onClick={abortExecution}
              disabled={!testManager.isRunning}
              className="btn btn-danger"
            >
              🛑 중단
            </button>
            <button 
              onClick={resetConfigs}
              disabled={testManager.isRunning}
              className="btn btn-secondary"
            >
              🔄 초기화
            </button>
          </div>
        </div>

        {/* 실행 상태 컴포넌트 (usePriorityTestExecutionState 훅 사용) */}
        <ExecutionStateDisplay showDetails={true} />
      </div>

      {/* 개별 우선순위 카운트 표시 (usePriorityTestTestCount 훅 사용) */}
      <div className="demo-card mb-6">
        <h3>📊 개별 우선순위 카운트 컴포넌트</h3>
        <p className="text-sm text-gray-600 mb-4">
          각 컴포넌트는 독립적으로 usePriorityTestTestCount 훅을 사용하여 특정 우선순위의 실행 횟수를 표시합니다.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {configs.map((config) => (
            <PriorityCountDisplay
              key={config.id}
              priority={config.priority}
              label={config.label}
              color={config.color}
            />
          ))}
        </div>
      </div>

      {/* 우선순위 그리드 컴포넌트 (여러 우선순위를 한 번에 표시) */}
      <div className="demo-card mb-6">
        <h3>🔢 우선순위 그리드 컴포넌트</h3>
        <p className="text-sm text-gray-600 mb-4">
          PriorityCountGrid 컴포넌트는 여러 우선순위의 카운트를 그리드 형태로 표시합니다.
        </p>
        <PriorityCountGrid 
          priorities={activePriorities}
          configs={configs}
          maxPriority={300}
        />
      </div>

      {/* 컴포넌트 구조 설명 */}
      <div className="demo-card mt-6">
        <h3>💡 컴포넌트 구조</h3>
        <div className="space-y-4 text-sm">
          <div className="p-3 bg-blue-50 rounded-lg">
            <h4 className="font-semibold mb-2">1. PriorityCountDisplay</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>단일 우선순위의 실행 횟수를 표시</li>
              <li><code>usePriorityTestTestCount(priority)</code> 훅 사용</li>
              <li>props: priority, label, color, className</li>
              <li>실시간 업데이트 지원</li>
            </ul>
          </div>
          
          <div className="p-3 bg-green-50 rounded-lg">
            <h4 className="font-semibold mb-2">2. ExecutionStateDisplay</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>전체 실행 상태와 통계를 표시</li>
              <li><code>usePriorityTestExecutionState()</code> 훅 사용</li>
              <li>props: showDetails, className</li>
              <li>성공/실패/중단 횟수, 실행 시간 통계 표시</li>
            </ul>
          </div>
          
          <div className="p-3 bg-purple-50 rounded-lg">
            <h4 className="font-semibold mb-2">3. PriorityCountGrid</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>여러 우선순위를 그리드 형태로 표시</li>
              <li>내부적으로 <code>PriorityCountCell</code> 컴포넌트 사용</li>
              <li>각 셀은 <code>usePriorityTestTestCount</code> 훅 사용</li>
              <li>props: priorities, configs, maxPriority, className</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 사용 예시 */}
      <div className="demo-card mt-6">
        <h3>📝 사용 예시</h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
{`// 1. 개별 우선순위 카운트 표시
<PriorityCountDisplay
  priority={300}
  label="Ultra High"
  color="#dc2626"
/>

// 2. 실행 상태 표시
<ExecutionStateDisplay 
  showDetails={true}
/>

// 3. 우선순위 그리드 표시
<PriorityCountGrid 
  priorities={[100, 200, 300]}
  configs={handlerConfigs}
/>

// 4. 훅 직접 사용
function MyComponent() {
  const count = usePriorityTestTestCount(250);
  const state = usePriorityTestExecutionState();
  
  return (
    <div>
      Priority 250 count: {count}
      Is running: {state.isRunning ? 'Yes' : 'No'}
    </div>
  );
}`}
        </pre>
      </div>
    </div>
  );
}

// 페이지 래퍼
function ModularPriorityTestPage() {
  return (
    <PageWithLogMonitor 
      pageId="modular-priority-test" 
      title="Modular Priority Test"
      initialConfig={{ enableToast: true, maxLogs: 100 }}
    >
      <ActionTestProvider>
        <PriorityTestProvider registryId="modular-priority-test">
          <ModularPriorityTest />
        </PriorityTestProvider>
      </ActionTestProvider>
    </PageWithLogMonitor>
  );
}

export default ModularPriorityTestPage;