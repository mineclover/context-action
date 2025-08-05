import { useState, useCallback, useEffect, useRef } from 'react';
import { ActionProvider, useActionDispatch, useActionRegister } from '@context-action/react';
import { ActionPayloadMap } from '@context-action/core';
import { PageWithLogMonitor, useActionLoggerWithToast } from '../../components/LogMonitor/';

// 테스트용 액션 타입 정의
interface PriorityTestActions extends ActionPayloadMap {
  priorityTest: { testId: string; delay: number };
}

// 개별 핸들러 설정 타입
interface HandlerConfig {
  id: string;
  priority: number;
  color: string;
  label: string;
  delay: number;
  jumpToPriority?: number | null; // 점프할 우선순위 (null이면 점프 없음)
  jumpToIndex?: number | null; // 같은 우선순위 내에서 특정 인덱스로 점프 (0부터 시작)
}

// 실행 상태 타입
interface ExecutionState {
  handlerId: string;
  priority: number;
  status: 'pending' | 'running' | 'completed';
  startTime?: number;
  endTime?: number;
  executionOrder: number;
}

// 기본 핸들러 설정
const DEFAULT_HANDLER_CONFIGS: HandlerConfig[] = [
  { id: 'h1', priority: 1000, color: '#dc2626', label: 'Ultra High (1000)', delay: 100, jumpToPriority: null, jumpToIndex: null },
  { id: 'h2', priority: 500, color: '#ea580c', label: 'High (500) #1', delay: 150, jumpToPriority: 10, jumpToIndex: null }, // 10으로 점프
  { id: 'h3', priority: 500, color: '#ea580c', label: 'High (500) #2', delay: 200, jumpToPriority: null, jumpToIndex: null },
  { id: 'h4', priority: 100, color: '#ca8a04', label: 'Medium (100) #1', delay: 120, jumpToPriority: 50, jumpToIndex: 1 }, // P50의 두 번째 핸들러로 점프
  { id: 'h5', priority: 100, color: '#ca8a04', label: 'Medium (100) #2', delay: 130, jumpToPriority: null, jumpToIndex: null },
  { id: 'h6', priority: 100, color: '#ca8a04', label: 'Medium (100) #3', delay: 140, jumpToPriority: null, jumpToIndex: null },
  { id: 'h7', priority: 50, color: '#65a30d', label: 'Low (50) #1', delay: 80, jumpToPriority: null, jumpToIndex: null },
  { id: 'h8', priority: 50, color: '#65a30d', label: 'Low (50) #2', delay: 90, jumpToPriority: null, jumpToIndex: null },
  { id: 'h9', priority: 10, color: '#0891b2', label: 'Very Low (10)', delay: 60, jumpToPriority: null, jumpToIndex: null },
  { id: 'h10', priority: 1, color: '#7c3aed', label: 'Ultra Low (1) #1', delay: 40, jumpToPriority: null, jumpToIndex: null },
  { id: 'h11', priority: 1, color: '#7c3aed', label: 'Ultra Low (1) #2', delay: 50, jumpToPriority: null, jumpToIndex: null },
];

// 메인 테스트 컴포넌트
function PriorityTest() {
  const dispatch = useActionDispatch<PriorityTestActions>();
  const actionRegister = useActionRegister<PriorityTestActions>();
  const actionLogger = useActionLoggerWithToast();
  
  const [configs, setConfigs] = useState<HandlerConfig[]>(DEFAULT_HANDLER_CONFIGS);
  const [executionStates, setExecutionStates] = useState<ExecutionState[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalHandlers, setTotalHandlers] = useState(0);
  
  const executionOrderRef = useRef(0);
  const startTimeRef = useRef<number>(0);
  const currentTestIdRef = useRef<string>('');
  const currentAbortControllerRef = useRef<{ abort: (reason?: string) => void } | null>(null);

  // 실행 상태 초기화
  const initializeExecutionStates = useCallback(() => {
    const states: ExecutionState[] = configs.map(config => ({
      handlerId: config.id,
      priority: config.priority,
      status: 'pending' as const,
      executionOrder: 0
    }));
    setExecutionStates(states);
    setTotalHandlers(configs.length);
    setCompletedCount(0);
  }, [configs]);

  // 테스트 결과 추가
  const addTestResult = useCallback((message: string) => {
    const timestamp = Date.now() - startTimeRef.current;
    setTestResults(prev => [...prev, `[${timestamp}ms] ${message}`]);
  }, []);

  // 실행 상태 업데이트
  const updateExecutionState = useCallback((handlerId: string, status: ExecutionState['status']) => {
    setExecutionStates(prev => prev.map(state => {
      if (state.handlerId === handlerId) {
        const updatedState = { ...state, status };
        
        if (status === 'running') {
          updatedState.startTime = Date.now();
          updatedState.executionOrder = ++executionOrderRef.current;
        } else if (status === 'completed') {
          updatedState.endTime = Date.now();
          setCompletedCount(prev => prev + 1);
        }
        
        return updatedState;
      }
      return state;
    }));
  }, []);

  // 액션 핸들러 등록
  useEffect(() => {
    const unregisterFunctions: (() => void)[] = [];

    configs.forEach((config) => {
      const unregister = actionRegister.register('priorityTest', 
        async ({ testId, delay }, controller) => {
          // 현재 실행 중인 테스트만 처리
          if (!testId || !testId.startsWith('test-') || testId !== currentTestIdRef.current) {
            controller.next();
            return;
          }
          
          // 외부 중단 컨트롤러 설정 (첫 번째 핸들러에서만)
          if (!currentAbortControllerRef.current) {
            currentAbortControllerRef.current = controller;
          }
          
          updateExecutionState(config.id, 'running');
          
          const timestamp = Date.now() - startTimeRef.current;
          setTestResults(prev => [...prev, `[${timestamp}ms] 🟡 ${config.label} 시작 (지연: ${config.delay}ms)`]);
          
          actionLogger.logAction('priorityTest', { testId, delay }, {
            context: `Priority Test - ${config.label}`,
            toast: { type: 'info', message: `${config.label} 실행 중...` }
          });

          try {
            // 지연 시뮬레이션
            await new Promise(resolve => setTimeout(resolve, config.delay));
            
            updateExecutionState(config.id, 'completed');
            
            const completionTimestamp = Date.now() - startTimeRef.current;
            setTestResults(prev => [...prev, `[${completionTimestamp}ms] 🟢 ${config.label} 완료`]);
            
            // Jump 처리
            if (config.jumpToPriority !== null && config.jumpToPriority !== undefined) {
              const jumpTimestamp = Date.now() - startTimeRef.current;
              const jumpTarget = config.jumpToIndex !== null && config.jumpToIndex !== undefined 
                ? `P${config.jumpToPriority}[${config.jumpToIndex}]` 
                : `P${config.jumpToPriority}`;
              setTestResults(prev => [...prev, `[${jumpTimestamp}ms] 🔄 ${config.label}에서 ${jumpTarget}로 점프`]);
              
              // 기존 jumpToPriority 사용 (첫 번째 핸들러로 점프)
              controller.jumpToPriority(config.jumpToPriority);
            } else {
              // 다음 핸들러로 진행
              controller.next();
            }
          } catch (error) {
            const errorTimestamp = Date.now() - startTimeRef.current;
            setTestResults(prev => [...prev, `[${errorTimestamp}ms] 🔴 ${config.label} 에러: ${error}`]);
            controller.abort('Handler failed');
          }
        },
        { 
          id: config.id,
          priority: config.priority, 
          blocking: true 
        }
      );
      
      unregisterFunctions.push(unregister);
    });

    return () => {
      unregisterFunctions.forEach(fn => fn());
    };
  }, [actionRegister, configs, actionLogger, updateExecutionState]);

  // 테스트 실행
  const runPriorityTest = useCallback(async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setTestResults([]);
    setCompletedCount(0);
    executionOrderRef.current = 0;
    startTimeRef.current = Date.now();
    currentAbortControllerRef.current = null; // abort controller 초기화
    
    const testId = `test-${Date.now()}`;
    currentTestIdRef.current = testId;
    
    // 실행 상태 초기화
    initializeExecutionStates();
    
    const timestamp = Date.now() - startTimeRef.current;
    setTestResults([`[${timestamp}ms] 🚀 우선순위 테스트 시작 (총 ${configs.length}개 핸들러)`]);
    
    try {
      // 액션 디스패치 (순차 실행 모드)
      await dispatch('priorityTest', { testId, delay: 0 }, { executionMode: 'sequential' });
      
      // dispatch 완료 후 처리
      const dispatchCompleteTimestamp = Date.now() - startTimeRef.current;
      setTestResults(prev => [...prev, `[${dispatchCompleteTimestamp}ms] 🏁 디스패치 완료`]);
      
      // 약간의 지연 후 완료 체크
      setTimeout(() => {
        if (completedCount >= configs.length) {
          setIsRunning(false);
          currentAbortControllerRef.current = null;
        }
      }, 200);
      
    } catch (error) {
      const errorTimestamp = Date.now() - startTimeRef.current;
      setTestResults(prev => [...prev, `[${errorTimestamp}ms] ❌ 테스트 실패: ${error}`]);
      setIsRunning(false);
      currentAbortControllerRef.current = null;
    }
  }, [dispatch, isRunning, initializeExecutionStates, completedCount, configs.length]);

  // 설정 초기화
  const resetConfigs = useCallback(() => {
    setConfigs(DEFAULT_HANDLER_CONFIGS);
    setTestResults([]);
    setExecutionStates([]);
    setIsRunning(false);
    setCompletedCount(0);
    executionOrderRef.current = 0;
    startTimeRef.current = 0;
  }, []);

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

  // 실행 중단
  const abortExecution = useCallback(() => {
    if (currentAbortControllerRef.current && isRunning) {
      currentAbortControllerRef.current.abort('사용자가 실행을 중단했습니다');
      const timestamp = Date.now() - startTimeRef.current;
      setTestResults(prev => [...prev, `[${timestamp}ms] 🛑 실행이 사용자에 의해 중단되었습니다`]);
      setIsRunning(false);
      currentAbortControllerRef.current = null;
    }
  }, [isRunning]);

  // 설정 제거
  const removeConfig = useCallback((index: number) => {
    setConfigs(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 테스트 완료 감지
  useEffect(() => {
    console.log('완료 감지 체크:', { isRunning, completedCount, totalHandlers, configs: configs.length });
    if (isRunning && completedCount > 0 && completedCount >= configs.length) {
      setTimeout(() => {
        addTestResult(`✅ 모든 핸들러 실행 완료 (${completedCount}/${configs.length})`);
        setIsRunning(false);
        currentAbortControllerRef.current = null;
      }, 100); // 약간의 지연으로 UI 업데이트 완료 대기
    }
  }, [completedCount, configs.length, isRunning, addTestResult]);

  // 컴포넌트 초기화
  useEffect(() => {
    initializeExecutionStates();
  }, [initializeExecutionStates]);

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
              disabled={isRunning}
              className={`btn ${isRunning ? 'btn-secondary' : 'btn-primary'}`}
            >
              {isRunning ? '⏳ 실행 중...' : '🚀 우선순위 테스트 실행'}
            </button>
            <button 
              onClick={resetConfigs}
              disabled={isRunning}
              className="btn btn-secondary"
            >
              🔄 설정 초기화
            </button>
            <button 
              onClick={addConfig}
              disabled={isRunning}
              className="btn btn-info"
            >
              ➕ 핸들러 추가
            </button>
            <button 
              onClick={addRandomConfig}
              disabled={isRunning}
              className="btn btn-success"
            >
              🎲 임의 핸들러
            </button>
            <button 
              onClick={abortExecution}
              disabled={!isRunning}
              className="btn btn-danger"
            >
              🛑 실행 중단
            </button>
          </div>
        </div>
        
        {/* 진행률 표시 */}
        {isRunning && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">테스트 진행률</span>
              <span className="text-sm font-medium">{completedCount}/{configs.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${configs.length > 0 ? (completedCount / configs.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 실행 상태 시각화 - 그리드 형식으로 개선 */}
      <div className="demo-card mb-6">
        <h3>📊 실행 상태 시각화</h3>
        <div className="execution-visualization">
          <div className="priority-legend mb-3">
            <div className="text-xs text-gray-600 mb-1">
              🔴 대기중 | 🟡 실행중 | 🟢 완료 | 숫자 = 실행순서
            </div>
            {isRunning && (
              <div className="text-xs text-blue-600 font-medium">
                ⚡ 현재 실행중... ({completedCount}/{configs.length} 완료)
              </div>
            )}
          </div>
          
          {/* 그리드 헤더 */}
          <div className="handler-grid-header">
            <div className="grid-cell header">ID</div>
            <div className="grid-cell header">Label</div>
            <div className="grid-cell header">Priority</div>
            <div className="grid-cell header">Delay</div>
            <div className="grid-cell header">Status</div>
            <div className="grid-cell header">Order</div>
            <div className="grid-cell header">Jump To</div>
            <div className="grid-cell header">Duration</div>
          </div>
          
          {/* 그리드 데이터 */}
          <div className="handler-grid-body">
            {configs.map((config, configIndex) => {
              const state = executionStates.find(s => s.handlerId === config.id);
              const duration = state?.startTime && state?.endTime 
                ? state.endTime - state.startTime 
                : state?.startTime 
                ? Date.now() - state.startTime 
                : 0;
              
              const statusColor = {
                pending: '#ef4444',
                running: '#eab308',
                completed: '#22c55e'
              }[state?.status || 'pending'];
              
              const statusIcon = {
                pending: '🔴',
                running: '🟡',
                completed: '🟢'
              }[state?.status || 'pending'];
              
              return (
                <div key={configIndex} className="handler-grid-row">
                  <div className="grid-cell" title={config.id}>
                    <span className="truncate">{config.id}</span>
                  </div>
                  <div className="grid-cell" title={config.label}>
                    <div 
                      className="w-3 h-3 rounded-full inline-block mr-1"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="truncate">{config.label}</span>
                  </div>
                  <div className="grid-cell priority-cell">
                    <span className="font-mono font-semibold">{config.priority}</span>
                  </div>
                  <div className="grid-cell">
                    <span className="font-mono">{config.delay}ms</span>
                  </div>
                  <div className="grid-cell status-cell">
                    <span style={{ color: statusColor }}>
                      {statusIcon} {state?.status || 'pending'}
                    </span>
                  </div>
                  <div className="grid-cell order-cell">
                    <span className="execution-order" style={{ backgroundColor: statusColor }}>
                      {state?.executionOrder || '-'}
                    </span>
                  </div>
                  <div className="grid-cell jump-cell">
                    {config.jumpToPriority !== null && config.jumpToPriority !== undefined ? (
                      <span className="jump-info">
                        P{config.jumpToPriority}
                        {config.jumpToIndex !== null && config.jumpToIndex !== undefined && `[${config.jumpToIndex}]`}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                  <div className="grid-cell duration-cell">
                    {duration > 0 ? (
                      <span className="font-mono">{duration}ms</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 우선순위 설정 - 아래쪽으로 이동 */}
      <div className="demo-card mb-6">
        <h3>⚙️ 우선순위 설정</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {configs.map((config, index) => (
            <div key={index} className="priority-config-item">
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
                    disabled={isRunning}
                  />
                  <input
                    type="number"
                    value={config.priority}
                    onChange={(e) => updateConfig(index, 'priority', parseInt(e.target.value) || 0)}
                    className="text-input text-sm"
                    placeholder="우선순위"
                    disabled={isRunning}
                  />
                  <input
                    type="number"
                    value={config.delay}
                    onChange={(e) => updateConfig(index, 'delay', parseInt(e.target.value) || 0)}
                    className="text-input text-sm"
                    placeholder="지연(ms)"
                    disabled={isRunning}
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
                    disabled={isRunning}
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
                    disabled={isRunning}
                  />
                  <input
                    type="text"
                    value={config.color}
                    onChange={(e) => updateConfig(index, 'color', e.target.value)}
                    className="text-input text-sm"
                    placeholder="색상"
                    disabled={isRunning}
                  />
                  <button
                    onClick={() => removeConfig(index)}
                    disabled={isRunning || configs.length <= 1}
                    className="btn btn-danger text-xs px-2 py-1"
                    title="이 우선순위 설정 삭제"
                  >
                    🗑️
                  </button>
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
        <div className="test-log">
          {testResults.length === 0 ? (
            <div className="text-gray-500 text-center py-4">
              테스트를 실행하면 실행 로그가 표시됩니다
            </div>
          ) : (
            <div className="log-entries max-h-64 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="log-entry">
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
        <div className="usage-guide">
          <div className="mb-4">
            <h4 className="font-semibold mb-2">기본 테스트 시나리오:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>높은 우선순위 먼저 실행</strong>: Priority 1000 → 500 → 100 → 50 → 10 → 1</li>
              <li><strong>개별 핸들러 관리</strong>: 각 핸들러는 고유 ID로 개별 관리됨</li>
              <li><strong>지연 시간 다양화</strong>: 각 핸들러마다 다른 지연 시간으로 비동기 처리 테스트</li>
              <li><strong>실행 순서 추적</strong>: 점의 숫자로 실제 실행 순서 확인</li>
            </ul>
          </div>
          
          <div className="mb-4">
            <h4 className="font-semibold mb-2">커스텀 테스트 방법:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>우선순위 값을 변경하여 다양한 조합 테스트</li>
              <li>지연 시간을 조정하여 비동기 실행 패턴 확인</li>
              <li>개별 핸들러를 추가/제거하여 다양한 시나리오 테스트</li>
              <li><strong>점프 기능</strong>: 점프P(우선순위), 점프#(인덱스) 설정으로 세밀한 점프 제어 (비워두면 점프 없음)</li>
              <li><strong>무한루프 주의</strong>: 뒤에서 앞으로 점프하는 설정 시 무한루프 가능성 있음 (🛑 중단 버튼 사용)</li>
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
              5. <strong>무한루프 방지</strong>: 뒤에서 앞으로 점프 시 중단 버튼으로 제어 가능한가?
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
      <ActionProvider config={{ name: 'PriorityTest' }}>
        <PriorityTest />
      </ActionProvider>
    </PageWithLogMonitor>
  );
}

export default PriorityTestPage;

// 스타일 추가
const styles = `
  .priority-config-item {
    padding: 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    background: #f9fafb;
  }
  
  .execution-visualization {
    min-height: 200px;
  }
  
  /* 그리드 스타일 */
  .handler-grid-header {
    display: grid;
    grid-template-columns: 100px 150px 80px 70px 100px 60px 80px 80px;
    gap: 8px;
    padding: 8px;
    background: #f3f4f6;
    border-radius: 6px 6px 0 0;
    border-bottom: 2px solid #d1d5db;
  }
  
  .handler-grid-body {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid #d1d5db;
    border-radius: 0 0 6px 6px;
  }
  
  .handler-grid-row {
    display: grid;
    grid-template-columns: 100px 150px 80px 70px 100px 60px 80px 80px;
    gap: 8px;
    padding: 8px;
    border-bottom: 1px solid #e5e7eb;
    transition: background-color 0.2s ease;
  }
  
  .handler-grid-row:hover {
    background-color: #f9fafb;
  }
  
  .handler-grid-row:last-child {
    border-bottom: none;
  }
  
  .grid-cell {
    display: flex;
    align-items: center;
    font-size: 0.75rem;
    min-height: 24px;
    overflow: hidden;
  }
  
  .grid-cell.header {
    font-weight: 600;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .priority-cell {
    justify-content: center;
    background: #fef3c7;
    border-radius: 4px;
    padding: 2px 4px;
  }
  
  .status-cell {
    font-weight: 500;
  }
  
  .order-cell {
    justify-content: center;
  }
  
  .execution-order {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    color: white;
    font-weight: bold;
    font-size: 0.6rem;
    text-shadow: 0 1px 1px rgba(0,0,0,0.5);
  }
  
  .jump-cell {
    justify-content: center;
  }
  
  .jump-info {
    background: #dbeafe;
    color: #1e40af;
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 0.65rem;
    font-weight: 500;
  }
  
  .duration-cell {
    justify-content: center;
    font-weight: 500;
  }
  
  .truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  /* 기존 스타일 유지 */
  .priority-group {
    padding: 0.5rem;
    border-left: 3px solid #e5e7eb;
    margin-left: 0.5rem;
  }
  
  .priority-group-header {
    font-size: 0.875rem;
    color: #374151;
    margin-bottom: 0.25rem;
  }
  
  .priority-dot {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    cursor: pointer;
    border: 3px solid #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    position: relative;
  }
  
  .priority-dot:hover {
    transform: scale(1.15);
    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
  }
  
  .priority-dot[data-status="running"] {
    animation: pulse 1.5s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
  
  .dot-label {
    color: white;
    font-size: 0.75rem;
    font-weight: bold;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }
  
  .test-log {
    background: #1f2937;
    color: #e5e7eb;
    border-radius: 0.5rem;
    padding: 1rem;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.875rem;
  }
  
  .log-entry {
    margin-bottom: 0.25rem;
    padding: 0.25rem 0;
    border-bottom: 1px solid #374151;
  }
  
  .log-entry:last-child {
    border-bottom: none;
  }
  
  .usage-guide h4 {
    color: #1f2937;
    font-size: 0.925rem;
  }
  
  .usage-guide ul li {
    color: #4b5563;
  }
`;

// DOM에 스타일 추가
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}