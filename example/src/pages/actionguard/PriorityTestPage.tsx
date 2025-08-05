import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ActionProvider, useActionDispatch, useActionRegister } from '@context-action/react';
import { ActionPayloadMap } from '@context-action/core';
import { PageWithLogMonitor, useActionLoggerWithToast } from '../../components/LogMonitor/';

// 테스트용 액션 타입 정의
interface PriorityTestActions extends ActionPayloadMap {
  priorityTest: { testId: string; delay: number };
}

// 우선순위 설정 타입
interface PriorityConfig {
  priority: number;
  color: string;
  label: string;
  delay: number;
  count: number; // 같은 우선순위 핸들러 개수
}

// 실행 상태 타입
interface ExecutionState {
  priority: number;
  handlerIndex: number;
  status: 'pending' | 'running' | 'completed';
  startTime?: number;
  endTime?: number;
  executionOrder: number;
}

// 기본 우선순위 설정
const DEFAULT_PRIORITY_CONFIGS: PriorityConfig[] = [
  { priority: 1000, color: '#dc2626', label: 'Ultra High (1000)', delay: 100, count: 1 },
  { priority: 500, color: '#ea580c', label: 'High (500)', delay: 150, count: 2 },
  { priority: 500, color: '#ea580c', label: 'High (500) - Duplicate', delay: 200, count: 1 },
  { priority: 100, color: '#ca8a04', label: 'Medium (100)', delay: 120, count: 3 },
  { priority: 50, color: '#65a30d', label: 'Low (50)', delay: 80, count: 2 },
  { priority: 50, color: '#65a30d', label: 'Low (50) - Duplicate', delay: 90, count: 1 },
  { priority: 10, color: '#0891b2', label: 'Very Low (10)', delay: 60, count: 1 },
  { priority: 1, color: '#7c3aed', label: 'Ultra Low (1)', delay: 40, count: 2 },
];

// 메인 테스트 컴포넌트
function PriorityTest() {
  const dispatch = useActionDispatch<PriorityTestActions>();
  const actionRegister = useActionRegister<PriorityTestActions>();
  const actionLogger = useActionLoggerWithToast();
  
  const [configs, setConfigs] = useState<PriorityConfig[]>(DEFAULT_PRIORITY_CONFIGS);
  const [executionStates, setExecutionStates] = useState<ExecutionState[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [currentTestId, setCurrentTestId] = useState<string>('');
  
  const executionOrderRef = useRef(0);
  const startTimeRef = useRef<number>(0);

  // 실행 상태 초기화
  const initializeExecutionStates = useCallback(() => {
    const states: ExecutionState[] = [];
    configs.forEach((config) => {
      for (let i = 0; i < config.count; i++) {
        states.push({
          priority: config.priority,
          handlerIndex: i,
          status: 'pending',
          executionOrder: 0
        });
      }
    });
    setExecutionStates(states);
  }, [configs]);

  // 테스트 결과 추가
  const addTestResult = useCallback((message: string) => {
    const timestamp = Date.now() - startTimeRef.current;
    setTestResults(prev => [...prev, `[${timestamp}ms] ${message}`]);
  }, []);

  // 실행 상태 업데이트
  const updateExecutionState = useCallback((priority: number, handlerIndex: number, status: ExecutionState['status']) => {
    setExecutionStates(prev => prev.map(state => {
      if (state.priority === priority && state.handlerIndex === handlerIndex) {
        const updatedState = { ...state, status };
        
        if (status === 'running') {
          updatedState.startTime = Date.now();
          updatedState.executionOrder = ++executionOrderRef.current;
        } else if (status === 'completed') {
          updatedState.endTime = Date.now();
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
      for (let i = 0; i < config.count; i++) {
        const handlerIndex = i;
        
        const unregister = actionRegister.register('priorityTest', 
          async ({ testId, delay }, controller) => {
            if (testId !== currentTestId) return;
            
            const priorityLabel = `P${config.priority}-${handlerIndex}`;
            
            // 실행 시작
            updateExecutionState(config.priority, handlerIndex, 'running');
            addTestResult(`🟡 ${priorityLabel} 시작 (지연: ${config.delay}ms)`);
            
            actionLogger.logAction('priorityTest', { testId, delay }, {
              context: `Priority Test - ${priorityLabel}`,
              toast: { type: 'info', message: `${priorityLabel} 실행 중...` }
            });

            try {
              // 지연 시뮬레이션
              await new Promise(resolve => setTimeout(resolve, config.delay));
              
              // 실행 완료
              updateExecutionState(config.priority, handlerIndex, 'completed');
              addTestResult(`🟢 ${priorityLabel} 완료`);
              
              controller.next();
            } catch (error) {
              addTestResult(`🔴 ${priorityLabel} 에러: ${error}`);
              controller.abort('Handler failed');
            }
          },
          { priority: config.priority }
        );
        
        unregisterFunctions.push(unregister);
      }
    });

    return () => {
      unregisterFunctions.forEach(fn => fn());
    };
  }, [actionRegister, configs, currentTestId, updateExecutionState, addTestResult, actionLogger]);

  // 테스트 실행
  const runPriorityTest = useCallback(async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setTestResults([]);
    executionOrderRef.current = 0;
    startTimeRef.current = Date.now();
    
    const testId = `test-${Date.now()}`;
    setCurrentTestId(testId);
    
    // 실행 상태 초기화
    initializeExecutionStates();
    
    addTestResult('🚀 우선순위 테스트 시작');
    
    try {
      // 액션 디스패치
      await dispatch('priorityTest', { testId, delay: 0 });
      
      // 모든 핸들러 완료 대기
      setTimeout(() => {
        addTestResult('✅ 모든 핸들러 실행 완료');
        setIsRunning(false);
      }, 5000); // 최대 5초 대기
      
    } catch (error) {
      addTestResult(`❌ 테스트 실패: ${error}`);
      setIsRunning(false);
    }
  }, [dispatch, isRunning, initializeExecutionStates, addTestResult]);

  // 설정 초기화
  const resetConfigs = useCallback(() => {
    setConfigs(DEFAULT_PRIORITY_CONFIGS);
    setTestResults([]);
    setExecutionStates([]);
    setIsRunning(false);
  }, []);

  // 우선순위 설정 업데이트
  const updateConfig = useCallback((index: number, field: keyof PriorityConfig, value: number | string) => {
    setConfigs(prev => prev.map((config, i) => 
      i === index ? { ...config, [field]: value } : config
    ));
  }, []);

  // 설정 추가
  const addConfig = useCallback(() => {
    const newConfig: PriorityConfig = {
      priority: 100,
      color: '#6b7280',
      label: `Custom (100)`,
      delay: 100,
      count: 1
    };
    setConfigs(prev => [...prev, newConfig]);
  }, []);

  // 설정 제거
  const removeConfig = useCallback((index: number) => {
    setConfigs(prev => prev.filter((_, i) => i !== index));
  }, []);

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
              className="btn btn-outline"
            >
              🔄 설정 초기화
            </button>
            <button 
              onClick={addConfig}
              disabled={isRunning}
              className="btn btn-outline"
            >
              ➕ 우선순위 추가
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 우선순위 설정 */}
        <div className="demo-card">
          <h3>⚙️ 우선순위 설정</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {configs.map((config, index) => (
              <div key={index} className="priority-config-item">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  <div className="flex-1 grid grid-cols-4 gap-2">
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
                      value={config.count}
                      onChange={(e) => updateConfig(index, 'count', Math.max(1, parseInt(e.target.value) || 1))}
                      className="text-input text-sm"
                      placeholder="개수"
                      disabled={isRunning}
                    />
                    <button
                      onClick={() => removeConfig(index)}
                      disabled={isRunning || configs.length <= 1}
                      className="btn btn-small btn-danger"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  우선순위: {config.priority} | 지연: {config.delay}ms | 핸들러 수: {config.count}개
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 실행 상태 시각화 */}
        <div className="demo-card">
          <h3>📊 실행 상태 시각화</h3>
          <div className="execution-visualization">
            <div className="priority-legend mb-4">
              <div className="text-xs text-gray-600 mb-2">
                🔴 대기중 | 🟡 실행중 | 🟢 완료
              </div>
            </div>
            
            <div className="priority-grid">
              {configs.map((config, configIndex) => (
                <div key={configIndex} className="priority-group mb-3">
                  <div className="priority-group-header">
                    <span className="text-sm font-medium">
                      Priority {config.priority} ({config.delay}ms delay)
                    </span>
                  </div>
                  <div className="priority-dots flex gap-2 mt-1">
                    {Array.from({ length: config.count }, (_, handlerIndex) => {
                      const state = executionStates.find(s => 
                        s.priority === config.priority && s.handlerIndex === handlerIndex
                      );
                      
                      const statusColor = {
                        pending: '#ef4444',     // 빨간색
                        running: '#eab308',     // 노란색  
                        completed: '#22c55e'    // 초록색
                      }[state?.status || 'pending'];
                      
                      return (
                        <div
                          key={handlerIndex}
                          className="priority-dot"
                          style={{ backgroundColor: statusColor }}
                          title={`P${config.priority}-${handlerIndex} | ${state?.status || 'pending'} | 실행순서: ${state?.executionOrder || 0}`}
                        >
                          <span className="dot-label">
                            {state?.executionOrder || '?'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
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
              <li><strong>같은 우선순위 처리</strong>: Priority 500이 2개, Priority 100이 3개, Priority 50이 3개</li>
              <li><strong>지연 시간 다양화</strong>: 각 핸들러마다 다른 지연 시간으로 비동기 처리 테스트</li>
              <li><strong>실행 순서 추적</strong>: 점의 숫자로 실제 실행 순서 확인</li>
            </ul>
          </div>
          
          <div className="mb-4">
            <h4 className="font-semibold mb-2">커스텀 테스트 방법:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>우선순위 값을 변경하여 다양한 조합 테스트</li>
              <li>지연 시간을 조정하여 비동기 실행 패턴 확인</li>
              <li>핸들러 개수를 늘려서 같은 우선순위 내 실행 순서 테스트</li>
              <li>극단적인 값(0, 1000, -100 등)으로 경계 조건 테스트</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-3 rounded">
            <p className="text-sm">
              <strong>📌 주요 확인 포인트:</strong><br/>
              1. 높은 숫자의 우선순위가 먼저 실행되는가?<br/>
              2. 같은 우선순위끼리는 등록 순서대로 실행되는가?<br/>
              3. 지연이 있는 비동기 핸들러도 우선순위가 올바르게 적용되는가?
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
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .priority-dot:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
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