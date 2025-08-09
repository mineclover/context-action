import { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { usePriorityTestStore, usePriorityActionRegister, usePriorityActionDispatch } from '../context/ActionTestContext';
import { ActionTestProvider, PriorityTestProvider } from '../context/ActionTestContext';
import { useStoreValue } from '@context-action/react';

// 간단한 핸들러 설정 타입 정의
interface HandlerConfig {
  id: string;
  priority: number;
  color: string;
  label: string;
  delay: number;
  jumpToPriority: number | null;
}

// 기본 핸들러 설정 (점프 패턴이 잘 보이도록 조정)
const DEFAULT_HANDLER_CONFIGS: HandlerConfig[] = [
  { id: 'h1', priority: 95, color: '#dc2626', label: 'Ultra High (95)', delay: 50, jumpToPriority: null },
  { id: 'h2', priority: 90, color: '#e11d48', label: 'Very High (90)', delay: 60, jumpToPriority: 70 },
  { id: 'h3', priority: 70, color: '#ea580c', label: 'High (70)', delay: 45, jumpToPriority: 25 },
  { id: 'h4', priority: 55, color: '#f59e0b', label: 'High-Mid (55)', delay: 40, jumpToPriority: 45 },
  { id: 'h5', priority: 45, color: '#ca8a04', label: 'Medium (45)', delay: 35, jumpToPriority: 15 },
  { id: 'h6', priority: 30, color: '#84cc16', label: 'Med-Low (30)', delay: 30, jumpToPriority: 10 },
  { id: 'h7', priority: 25, color: '#65a30d', label: 'Low (25)', delay: 25, jumpToPriority: null },
  { id: 'h8', priority: 15, color: '#0891b2', label: 'Lower (15)', delay: 20, jumpToPriority: 95 },
  { id: 'h9', priority: 10, color: '#7c3aed', label: 'Lowest (10)', delay: 15, jumpToPriority: null },
];

// Priority Test Declarative Store Pattern 정의
// Context-Action v7 패턴으로 Store 직접 사용 (지연 평가)

// 렌더링용 구독 컴포넌트들
const TotalExecutionCount = memo(() => {
  const priorityCountsStore = usePriorityTestStore('priorityCounts');
  const priorityCounts = useStoreValue(priorityCountsStore);
  return <>{Object.values(priorityCounts).reduce((sum, count) => sum + count, 0)}</>;
});

const SuccessRate = memo(() => {
  const executionStateStore = usePriorityTestStore('executionState');
  const executionState = useStoreValue(executionStateStore);
  return (
    <>
      {executionState.totalTests > 0 
        ? `${((executionState.successfulTests / executionState.totalTests) * 100).toFixed(1)}%` 
        : '0%'}
    </>
  );
});

const AverageExecutionTime = memo(() => {
  const executionStateStore = usePriorityTestStore('executionState');
  const executionState = useStoreValue(executionStateStore);
  return <>{executionState.averageExecutionTime || 0}ms</>;
});

const MinMaxExecutionTime = memo(() => {
  const executionStateStore = usePriorityTestStore('executionState');
  const executionState = useStoreValue(executionStateStore);
  const minTime = executionState.minExecutionTime === Number.MAX_VALUE ? 0 : executionState.minExecutionTime;
  return <>{minTime}ms ~ {executionState.maxExecutionTime || 0}ms</>;
});

const PriorityGrid = memo(({ configsWithDelay }: { configsWithDelay: HandlerConfig[] }) => {
  const priorityCountsStore = usePriorityTestStore('priorityCounts');
  const priorityCounts = useStoreValue(priorityCountsStore);
  
  return (
    <div className="flex flex-wrap gap-0.5">
      {Array.from({ length: 100 }, (_, index) => {
        const priority = index + 1;
        const count = priorityCounts[priority] || 0;
        const hasHandler = configsWithDelay.some(config => config.priority === priority);
        const config = configsWithDelay.find(c => c.priority === priority);
        
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
  );
});

// 성능 테스트용 컴포넌트 (간소화된 버전) - React.memo로 최적화
const PriorityTestInstance = memo(function PriorityTestInstance({ title, instanceId }: { title: string; instanceId?: string }) {
  const [configs, setConfigs] = useState<HandlerConfig[]>(DEFAULT_HANDLER_CONFIGS);
  const [selectedDelay, setSelectedDelay] = useState<0 | 1 | 50>(0); // 0ms, 1ms, 50ms 선택
  // 선택된 딜레이가 적용된 configs를 memoized로 계산 (불필요한 리렌더링 방지)
  const configsWithDelay = useMemo(() => {
    return configs.map(config => ({
      ...config,
      delay: selectedDelay
    }));
  }, [configs, selectedDelay]);

  // Store만 가져와서 지연 평가로 사용 - 불필요한 리렌더링 방지
  const priorityCountsStore = usePriorityTestStore('priorityCounts');
  const executionStateStore = usePriorityTestStore('executionState');

  // 간단한 테스트 상태 관리 - 완전히 독립적
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [totalTests, setTotalTests] = useState(0);
  const [successfulTests, setSuccessfulTests] = useState(0);

  // ActionRegistry 패턴을 사용한 올바른 구현
  const actionRegister = usePriorityActionRegister();

  // 핸들러 등록 함수
  const registerHandlers = useCallback(() => {
    if (!actionRegister) return;

    // 기존 핸들러 모두 해제
    actionRegister.clearAction('priorityTest');

    // 초기화 핸들러 등록 (우선순위 200 - 가장 먼저 실행)
    actionRegister.register(
      'priorityTest',
      async (payload, controller) => {
        console.log('🚀 Priority Test Started - Initializing all stores and metrics...');
        
        // Priority Counts Store 초기화 (지연 평가)
        priorityCountsStore.setValue({});
        
        // Execution State Store 완전 초기화 (지연 평가)
        executionStateStore.setValue({
          isRunning: true,
          testResults: [],
          currentTestId: payload.testId,
          totalTests: 0,
          successfulTests: 0,
          failedTests: 0,
          abortedTests: 0,
          averageExecutionTime: 0,
          lastExecutionTime: 0,
          maxExecutionTime: 0,
          minExecutionTime: Number.MAX_VALUE,
          startTime: Date.now(),
          executionTimes: []
        });
        
        console.log('✅ All stores initialized');
      },
      {
        priority: 200,
        id: 'initializer',
        tags: ['priority-test', 'initializer'],
        blocking: true
      }
    );

    // 설정된 핸들러들을 ActionRegistry에 등록
    configsWithDelay.forEach((config) => {
      actionRegister.register(
        'priorityTest',
        async (payload, controller) => {
          const handlerStartTime = Date.now(); // 핸들러 시작 시간
          
          // abortSignal 체크
          if (controller.signal?.aborted) {
            throw new Error('Operation aborted');
          }
          
          // 카운트 증가 (지연 평가)
          const currentCounts = priorityCountsStore.getValue();
          priorityCountsStore.setValue({
            ...currentCounts,
            [config.priority]: (currentCounts[config.priority] || 0) + 1
          });

          // 딜레이 적용 (abort 가능하도록 처리)
          if (config.delay > 0) {
            await new Promise((resolve, reject) => {
              const timeoutId = setTimeout(resolve, config.delay);
              
              // abortSignal이 있으면 abort 이벤트 리스너 등록
              if (controller.signal) {
                controller.signal.addEventListener('abort', () => {
                  clearTimeout(timeoutId);
                  reject(new Error('Operation aborted'));
                }, { once: true });
              }
            });
          }

          const handlerEndTime = Date.now();
          const handlerExecutionTime = handlerEndTime - handlerStartTime;
          
          console.log(`Executed: ${config.label} (P${config.priority}) - ${handlerExecutionTime}ms`);

          // 핸들러 실행 시간을 executionTimes 배열에 추가 (지연 평가)
          const currentState = executionStateStore.getValue();
          const newExecutionTimes = [...currentState.executionTimes, handlerExecutionTime];
          const newAverageTime = Math.round(newExecutionTimes.reduce((sum, time) => sum + time, 0) / newExecutionTimes.length);
          
          executionStateStore.setValue({
            ...currentState,
            executionTimes: newExecutionTimes,
            averageExecutionTime: newAverageTime,
            lastExecutionTime: handlerExecutionTime,
            maxExecutionTime: Math.max(currentState.maxExecutionTime, handlerExecutionTime),
            minExecutionTime: Math.min(currentState.minExecutionTime, handlerExecutionTime)
          });

          // 점프 로직 처리 (현재 count가 5보다 낮을 때만)
          const currentCount = currentCounts[config.priority] || 0;
          
          if (currentCount < 5 && config.jumpToPriority !== null) {
            console.log(`🔄 Priority Jump: P${config.priority} → P${config.jumpToPriority} (count: ${currentCount})`);
            controller.jumpToPriority(config.jumpToPriority);
          } else if (currentCount >= 5 && config.jumpToPriority !== null) {
            console.log(`⛔ Jump blocked: P${config.priority} count (${currentCount}) >= 5`);
          }
        },
        {
          priority: config.priority,
          id: config.id,
          tags: ['priority-test'],
          blocking: true
        }
      );
    });
  }, [actionRegister, configsWithDelay, priorityCountsStore, executionStateStore]);

  // 핸들러 등록 (configs 변경 시)
  useEffect(() => {
    registerHandlers();
  }, [registerHandlers]);

  // abort 컨트롤러 관리
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // 실제 테스트 실행 함수 - ActionRegistry 디스패치 (초기화는 우선순위 200 핸들러에서 처리)
  const runPriorityTest = useCallback(async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setTotalTests(prev => prev + 1);
    
    // abort 컨트롤러 생성
    const controller = new AbortController();
    setAbortController(controller);
    
    const startTime = Date.now();
    
    try {
      // ActionRegistry에 등록된 핸들러들이 우선순위대로 순차 실행 (초기화 핸들러부터)
      const result = await actionRegister.dispatchWithResult('priorityTest', { 
        testId: `test-${Date.now()}`, 
        delay: 0 
      }, {
        executionMode: 'sequential',
        signal: controller.signal
      });
      
      // abort 체크
      if (result.aborted) {
        console.log('Test execution aborted by user');
        setTestResults(prev => [...prev, `테스트 중단됨`].slice(-2));
        return; // 조기 종료
      }
      
      const executionTime = Date.now() - startTime;
      const resultMessage = `테스트 완료: ${configsWithDelay.length + 1}개 핸들러 (초기화 포함), ${executionTime}ms`;
      
      setTestResults(prev => [...prev, resultMessage].slice(-2)); // 최근 2개만 유지
      setSuccessfulTests(prev => prev + 1);
      
      // 실행 상태 저장 (지연 평가) - 평균 시간은 각 핸들러에서 이미 계산됨
      const currentState = executionStateStore.getValue();
      executionStateStore.setValue({
        ...currentState,
        isRunning: false,
        totalTests: totalTests + 1,
        successfulTests: successfulTests + 1
        // averageExecutionTime은 각 핸들러에서 실시간 계산되므로 여기서는 업데이트하지 않음
      });
      
    } catch (error) {
      console.error('Test execution failed:', error);
      setTestResults(prev => [...prev, `테스트 실패: ${error}`].slice(-2));
      
      // 실행 상태 에러 처리
      const currentState = executionStateStore.getValue();
      executionStateStore.setValue({
        ...currentState,
        isRunning: false
      });
    } finally {
      setIsRunning(false);
      setAbortController(null);
    }
  }, [isRunning, actionRegister, configsWithDelay.length, executionStateStore, totalTests, successfulTests]);

  // 테스트 중단 함수
  const abortTest = useCallback(() => {
    if (abortController) {
      abortController.abort();
      console.log('🛑 Test execution aborted by user');
    }
  }, [abortController]);

  // 설정 초기화
  const resetTest = useCallback(() => {
    setConfigs(DEFAULT_HANDLER_CONFIGS);
    setTestResults([]);
    setTotalTests(0);
    setSuccessfulTests(0);
    
    // Store 완전 초기화 (지연 평가) - 초기화 핸들러와 동일한 로직
    priorityCountsStore.setValue({});
    executionStateStore.setValue({
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
      minExecutionTime: Number.MAX_VALUE,
      startTime: 0,
      executionTimes: []
    });
    
    console.log('🔄 Manual reset completed - All stores and local state cleared');
  }, [priorityCountsStore, executionStateStore]);

  // 클리어 함수 (필요시 사용)
  const clearAllData = useCallback(() => {
    priorityCountsStore.setValue({});
    setTestResults([]);
    setTotalTests(0);
    setSuccessfulTests(0);
  }, [priorityCountsStore]);

  // 1부터 100까지 핸들러 일괄 추가 (중복 우선순위 제거) - 최적화된 버전
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
        // selectedDelay는 configsWithDelay에서 처리되므로 여기서는 0으로 설정
        const delay = 0;
        
        bulkConfigs.push({
          id: `bulk-${priority}`,
          priority,
          color,
          label: `P${priority}`,
          delay,
          jumpToPriority: null
        });
      }
      
      return [...prev, ...bulkConfigs];
    });
  }, []); // selectedDelay 의존성 제거로 불필요한 리렌더링 방지

  return (
    <div className="flex-1 p-4 border border-gray-200 rounded-lg bg-white">
      {/* 헤더 */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{title}</h3>
        <div className="text-xs text-gray-500">
          {instanceId && `인스턴스: ${instanceId} | `}핸들러: {configsWithDelay.length}개
        </div>
      </div>

      {/* 컨트롤 패널 */}
      <div className="mb-4">
        <div className="flex gap-2 mb-3">
          <button 
            onClick={runPriorityTest}
            disabled={isRunning}
            className="btn btn-primary text-sm px-3 py-2 flex-1"
          >
            {isRunning ? '⏳ 실행 중...' : '🚀 성능 테스트'}
          </button>
          <button 
            onClick={abortTest}
            disabled={!isRunning}
            className="btn btn-danger text-sm px-3 py-2"
            title="실행 중단"
          >
            🛑 중단
          </button>
          <button 
            onClick={resetTest}
            disabled={isRunning}
            className="btn btn-secondary text-sm px-3 py-2"
            title="전체 초기화"
          >
            🔄 리셋
          </button>
        </div>
        
        {/* 일괄 추가 버튼 */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={addBulkHandlers}
            disabled={isRunning}
            className="btn btn-warning text-xs px-3 py-2 flex-1 whitespace-nowrap"
          >
            📦 일괄 추가 (1-100)
          </button>
          <div className="text-xs text-gray-500 flex items-center whitespace-nowrap">
            현재: {configsWithDelay.length}개 핸들러
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
                disabled={isRunning}
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
          <span className="text-gray-600">설정된 핸들러:</span>
          <span className="font-medium text-blue-800">{configsWithDelay.length}개</span>
          <button
            onClick={clearAllData}
            disabled={isRunning}
            className="ml-auto btn btn-warning text-xs px-2 py-1"
            title="데이터 클리어"
          >
            🗑️ 클리어
          </button>
        </div>
        
      </div>

      {/* 성능 메트릭 */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2 text-sm">📊 성능 메트릭</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <div className="p-2 bg-blue-50 rounded text-center">
            <div className="text-xs text-blue-700 whitespace-nowrap">총 실행</div>
            <div className="text-lg font-bold text-blue-900">
              <TotalExecutionCount />
            </div>
          </div>
          <div className="p-2 bg-green-50 rounded text-center">
            <div className="text-xs text-green-700 whitespace-nowrap">상태</div>
            <div className="text-sm font-semibold text-green-900 whitespace-nowrap">
              {isRunning ? '실행 중' : '대기 중'}
            </div>
          </div>
          <div className="p-2 bg-purple-50 rounded text-center">
            <div className="text-xs text-purple-700 whitespace-nowrap">성공률</div>
            <div className="text-sm font-bold text-purple-900">
              <SuccessRate />
            </div>
          </div>
          <div className="p-2 bg-orange-50 rounded text-center">
            <div className="text-xs text-orange-700 whitespace-nowrap">평균 시간</div>
            <div className="text-sm font-bold text-orange-900">
              <AverageExecutionTime />
            </div>
          </div>
          <div className="p-2 bg-red-50 rounded text-center">
            <div className="text-xs text-red-700 whitespace-nowrap">최소~최대</div>
            <div className="text-sm font-bold text-red-900">
              <MinMaxExecutionTime />
            </div>
          </div>
        </div>
      </div>

      {/* 우선순위별 실행 카운트 (1-100 전체 표시) */}
      <div className="mb-3">
        <h4 className="font-medium text-gray-700 mb-2 text-sm">🎯 우선순위별 실행 횟수 (1-100)</h4>
        <div className="bg-gray-50 rounded p-1">
          <PriorityGrid configsWithDelay={configsWithDelay} />
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
          {(() => {
            return (!testResults || testResults.length === 0) ? (
              <div className="text-gray-500 text-center py-1 text-xs whitespace-nowrap">
                테스트 대기 중...
              </div>
            ) : (
              <div>
                {testResults.slice(-2).map((result, index) => (
                  <div key={index} className="text-xs text-gray-700 mb-1 last:mb-0 truncate">
                    {result}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
});

// Provider로 감싸진 래퍼 컴포넌트 - React.memo로 최적화
const PriorityTestInstanceWithProvider = memo(function PriorityTestInstanceWithProvider({ title, instanceId }: { title: string; instanceId?: string }) {
  // registryId를 memoized로 계산하여 불필요한 리렌더링 방지
  const registryId = useMemo(() => `priority-perf-${instanceId || 'default'}`, [instanceId]);
  
  return (
    <ActionTestProvider>
      <PriorityTestProvider registryId={registryId}>
        <PriorityTestInstance title={title} instanceId={instanceId} />
      </PriorityTestProvider>
    </ActionTestProvider>
  );
});

export default PriorityTestInstanceWithProvider;