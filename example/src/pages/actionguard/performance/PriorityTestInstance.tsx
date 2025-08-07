import { useState, useCallback, useEffect } from 'react';
import { usePriorityTestManager, HandlerConfig, PriorityTestProvider } from '../hooks';
import { ActionTestProvider } from '../context/ActionTestContext';
import styles from './PriorityTestInstance.module.css';

// 기본 핸들러 설정 (점프 패턴이 잘 보이도록 조정)
const DEFAULT_HANDLER_CONFIGS: HandlerConfig[] = [
  { id: 'h1', priority: 95, color: '#dc2626', label: 'Ultra High (95)', delay: 50, jumpToPriority: null, jumpToIndex: null },
  { id: 'h2', priority: 90, color: '#e11d48', label: 'Very High (90)', delay: 60, jumpToPriority: 70, jumpToIndex: null },
  { id: 'h3', priority: 70, color: '#ea580c', label: 'High (70)', delay: 45, jumpToPriority: null, jumpToIndex: null },
  { id: 'h4', priority: 55, color: '#f59e0b', label: 'High-Mid (55)', delay: 40, jumpToPriority: 45, jumpToIndex: null },
  { id: 'h5', priority: 45, color: '#ca8a04', label: 'Medium (45)', delay: 35, jumpToPriority: 15, jumpToIndex: null },
  { id: 'h6', priority: 30, color: '#84cc16', label: 'Med-Low (30)', delay: 30, jumpToPriority: null, jumpToIndex: null },
  { id: 'h7', priority: 25, color: '#65a30d', label: 'Low (25)', delay: 25, jumpToPriority: null, jumpToIndex: null },
  { id: 'h8', priority: 15, color: '#0891b2', label: 'Lower (15)', delay: 20, jumpToPriority: 95, jumpToIndex: null },
  { id: 'h9', priority: 10, color: '#7c3aed', label: 'Lowest (10)', delay: 15, jumpToPriority: null, jumpToIndex: null },
];

// Priority Test Declarative Store Pattern 정의
// Store는 usePriorityTestManager 내부에서 자동 관리됨

// 성능 테스트용 컴포넌트 (간소화된 버전)
function PriorityTestInstance({ title, instanceId }: { title: string; instanceId?: string }) {
  const [configs, setConfigs] = useState<HandlerConfig[]>(DEFAULT_HANDLER_CONFIGS);
  const [selectedDelay, setSelectedDelay] = useState<0 | 1 | 50>(0); // 0ms, 1ms, 50ms 선택

  // 선택된 딜레이에 따라 기존 핸들러 딜레이 덮어쓰기
  const overrideExistingDelays = useCallback(() => {
    setConfigs(prev => prev.map(config => ({
      ...config,
      delay: selectedDelay
    })));
  }, [selectedDelay]);

  // 딜레이 선택 변경 시 자동으로 기존 핸들러 딜레이 적용
  useEffect(() => {
    overrideExistingDelays();
  }, [selectedDelay, overrideExistingDelays]);

  // 간소화된 우선순위 테스트 매니저 사용 (Store는 내부에서 자동 관리)
  const testManager = usePriorityTestManager(configs, {
    enableToast: false, // 성능 테스트에서는 토스트 비활성화
    enableConsoleLog: false // 성능 테스트에서는 콘솔 로그 최소화
  });

  // Store 값들은 testManager를 통해 접근
  const priorityCounts = testManager.getAllCounts();
  const executionState = {
    isRunning: testManager.isRunning,
    averageExecutionTime: testManager.averageExecutionTime,
    totalTests: testManager.totalTests,
    successfulTests: testManager.successfulTests
  };

  // 테스트 실행
  const runPriorityTest = useCallback(async () => {
    if (testManager.isRunning) return;
    
    await testManager.executeTest(); // 각 핸들러는 개별 config.delay 사용
  }, [testManager]);

  // 설정 초기화
  const resetTest = useCallback(() => {
    setConfigs(DEFAULT_HANDLER_CONFIGS);
    testManager.initializeTest();
  }, [testManager]);

  // 실행 중단
  const abortExecution = useCallback(() => {
    testManager.abortTest();
  }, [testManager]);

  // 1부터 100까지 핸들러 일괄 추가 (중복 우선순위 제거)
  const addBulkHandlers = useCallback(() => {
    setConfigs(prev => {
      const bulkConfigs: HandlerConfig[] = [];
      const colors = ['#dc2626', '#ea580c', '#ca8a04', '#65a30d', '#0891b2', '#7c3aed', '#8b5cf6', '#f59e0b'];
      
      // 현재 설정에서 이미 사용 중인 우선순위 추출
      const existingPriorities = new Set(prev.map(config => config.priority));
      
      for (let priority = 1; priority <= 100; priority++) {
        // 이미 존재하는 우선순위는 건너뛰기
        if (existingPriorities.has(priority)) {
          continue;
        }
        
        const color = colors[priority % colors.length];
        const delay = selectedDelay; // 선택된 딜레이 적용: 0ms, 1ms, 또는 50ms
        
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
  }, [selectedDelay]);

  return (
    <div className="flex-1 p-4 border border-gray-200 rounded-lg bg-white">
      {/* 헤더 */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{title}</h3>
        <div className="text-xs text-gray-500">
          {instanceId && `인스턴스: ${instanceId} | `}핸들러: {configs.length}개
        </div>
      </div>

      {/* 컨트롤 패널 */}
      <div className="mb-4">
        <div className="flex gap-2 mb-3">
          <button 
            onClick={runPriorityTest}
            disabled={testManager.isRunning}
            className={`btn text-sm px-3 py-2 flex-1 ${testManager.isRunning ? 'btn-secondary' : 'btn-primary'}`}
          >
            {testManager.isRunning ? '⏳ 실행 중...' : '🚀 성능 테스트'}
          </button>
          <button 
            onClick={abortExecution}
            disabled={!testManager.isRunning}
            className="btn btn-danger text-sm px-2 py-2"
          >
            🛑
          </button>
          <button 
            onClick={resetTest}
            disabled={testManager.isRunning}
            className="btn btn-secondary text-sm px-2 py-2"
          >
            🔄
          </button>
        </div>
        
        {/* 일괄 추가 버튼 */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={addBulkHandlers}
            disabled={testManager.isRunning}
            className="btn btn-warning text-xs px-3 py-2 flex-1 whitespace-nowrap"
          >
            📦 일괄 추가 (1-100)
          </button>
          <div className="text-xs text-gray-500 flex items-center whitespace-nowrap">
            현재: {configs.length}개 핸들러
          </div>
        </div>

        {/* 딜레이 설정 버튼 (0ms, 1ms, 50ms) */}
        <div className="flex items-center gap-2 mb-3 p-2 bg-purple-50 rounded text-xs">
          <span className="text-gray-600 font-medium">딜레이:</span>
          <div className="flex gap-1">
            {[0, 1, 50].map((delay) => (
              <button
                key={delay}
                onClick={() => setSelectedDelay(delay as 0 | 1 | 50)}
                disabled={testManager.isRunning}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  selectedDelay === delay
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-purple-600 border border-purple-300 hover:bg-purple-100'
                }`}
              >
                {delay}ms
              </button>
            ))}
          </div>
          <span className="text-gray-500 ml-auto text-xs">
            ⚡ 자동: {selectedDelay}ms
          </span>
        </div>

        {/* 핸들러 상태 정보 */}
        <div className="flex gap-2 mb-3 p-2 bg-blue-50 rounded text-xs">
          <span className="text-gray-600">등록된 핸들러:</span>
          <span className="font-medium text-blue-800">{testManager.registeredHandlers?.size || 0}개</span>
          <button
            onClick={testManager.unregisterAllHandlers}
            disabled={testManager.isRunning}
            className="ml-auto btn btn-warning text-xs px-2 py-1"
            title="모든 핸들러 해제"
          >
            🗑️ 해제
          </button>
        </div>
        
      </div>

      {/* 성능 메트릭 */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2 text-sm">📊 성능 메트릭</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="p-2 bg-blue-50 rounded text-center">
            <div className="text-xs text-blue-700 whitespace-nowrap">총 실행</div>
            <div className="text-lg font-bold text-blue-900">
              {Object.values(priorityCounts).reduce((sum, count) => sum + count, 0)}
            </div>
          </div>
          <div className="p-2 bg-green-50 rounded text-center">
            <div className="text-xs text-green-700 whitespace-nowrap">상태</div>
            <div className="text-sm font-semibold text-green-900 whitespace-nowrap">
              {testManager.isRunning ? '실행 중' : '대기 중'}
            </div>
          </div>
          <div className="p-2 bg-purple-50 rounded text-center">
            <div className="text-xs text-purple-700 whitespace-nowrap">성공률</div>
            <div className="text-sm font-bold text-purple-900">
              {executionState.totalTests > 0 
                ? `${((executionState.successfulTests / executionState.totalTests) * 100).toFixed(1)}%` 
                : '0%'}
            </div>
          </div>
          <div className="p-2 bg-orange-50 rounded text-center">
            <div className="text-xs text-orange-700 whitespace-nowrap">평균 시간</div>
            <div className="text-sm font-bold text-orange-900">
              {executionState.averageExecutionTime}ms
            </div>
          </div>
        </div>
      </div>

      {/* 우선순위별 실행 카운트 (1-100 전체 표시) */}
      <div className="mb-3">
        <h4 className="font-medium text-gray-700 mb-2 text-sm">🎯 우선순위별 실행 횟수 (1-100)</h4>
        <div className="bg-gray-50 rounded p-1">
          <div className="flex flex-wrap gap-0.5">
            {Array.from({ length: 100 }, (_, index) => {
              const priority = index + 1;
              const count = priorityCounts[priority] || 0;
              const hasHandler = configs.some(config => config.priority === priority);
              const config = configs.find(c => c.priority === priority);
              
              // 실행 횟수에 따른 배경색 계산
              const getBackgroundStyle = () => {
                if (hasHandler) {
                  // 핸들러가 있는 경우: 실행 횟수에 따른 파란색 농도
                  if (count === 0) return { backgroundColor: '#dbeafe', borderColor: '#93c5fd' }; // 연한 파란색
                  if (count <= 2) return { backgroundColor: '#bfdbfe', borderColor: '#60a5fa' }; // 중간 파란색
                  if (count <= 5) return { backgroundColor: '#93c5fd', borderColor: '#3b82f6' }; // 진한 파란색
                  return { backgroundColor: '#60a5fa', borderColor: '#2563eb' }; // 매우 진한 파란색
                } else if (count > 0) {
                  // 점프로 실행된 경우: 실행 횟수에 따른 노란색 농도
                  if (count <= 2) return { backgroundColor: '#fef3c7', borderColor: '#fbbf24' }; // 연한 노란색
                  if (count <= 5) return { backgroundColor: '#fde68a', borderColor: '#f59e0b' }; // 중간 노란색
                  if (count <= 10) return { backgroundColor: '#fbbf24', borderColor: '#d97706' }; // 진한 노란색
                  return { backgroundColor: '#f59e0b', borderColor: '#b45309' }; // 매우 진한 노란색
                } else {
                  // 미실행
                  return { backgroundColor: '#ffffff', borderColor: '#d1d5db' };
                }
              };

              const backgroundStyle = getBackgroundStyle();
              
              return (
                <div 
                  key={priority} 
                  className="flex flex-col items-center justify-center text-xs rounded border"
                  style={{ 
                    width: '18px', 
                    height: '26px',
                    minWidth: '18px',
                    backgroundColor: backgroundStyle.backgroundColor,
                    borderColor: backgroundStyle.borderColor
                  }}
                  title={`P${priority}: ${count}회${hasHandler ? ' (핸들러)' : ''}`}
                >
                  <div 
                    className="leading-none font-medium" 
                    style={{ 
                      color: hasHandler && config ? config.color : '#666',
                      fontSize: '7px'
                    }}
                  >
                    {priority}
                  </div>
                  <div className="leading-none font-mono font-bold" style={{ fontSize: '8px' }}>
                    {count > 0 ? (count > 9 ? '9+' : count) : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-1 flex items-center gap-4">
          <div className="flex items-center whitespace-nowrap">
            <span className="inline-block w-2 h-2 border border-blue-300 mr-1" style={{backgroundColor: '#dbeafe'}}></span>핸들러
          </div>
          <div className="flex items-center whitespace-nowrap">
            <span className="inline-block w-2 h-2 border border-yellow-500 mr-1" style={{backgroundColor: '#fbbf24'}}></span>점프 실행
          </div>
          <div className="text-gray-400 whitespace-nowrap">
            실행 횟수에 따라 색상 농도 변화
          </div>
        </div>
      </div>

      {/* 실행 로그 (최근 2개만) */}
      <div>
        <h4 className="font-medium text-gray-700 mb-1 text-sm whitespace-nowrap">📋 실행 로그</h4>
        <div className="bg-gray-50 rounded p-2 h-12 overflow-hidden">
          {testManager.testResults.length === 0 ? (
            <div className="text-gray-500 text-center py-1 text-xs whitespace-nowrap">
              테스트 대기 중...
            </div>
          ) : (
            <div>
              {testManager.testResults.slice(-2).map((result, index) => (
                <div key={index} className="text-xs text-gray-700 mb-1 last:mb-0 truncate">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Provider로 감싸진 래퍼 컴포넌트
function PriorityTestInstanceWithProvider({ title, instanceId }: { title: string; instanceId?: string }) {
  return (
    <ActionTestProvider>
      <PriorityTestProvider registryId={`priority-perf-${instanceId || 'default'}`}>
        <PriorityTestInstance title={title} instanceId={instanceId} />
      </PriorityTestProvider>
    </ActionTestProvider>
  );
}

export default PriorityTestInstanceWithProvider;