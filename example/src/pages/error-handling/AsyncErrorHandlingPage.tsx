/**
 * Async Error Handling Example
 * 
 * 비동기 작업의 에러 처리 및 재시도 메커니즘을 보여주는 예제:
 * - Promise 기반 에러 처리
 * - 자동 재시도 로직 with exponential backoff
 * - 타임아웃 처리 및 네트워크 에러 복구
 * - 동시 작업 관리 및 에러 격리
 */

import React, { useCallback, useState } from 'react';
import {
  createStoreContext,
  createActionContext,
  useStoreValue,
  createErrorHandler,
  ErrorCategory,
  setupDevTools
} from '@context-action/react';

// DevTools 초기화
if (process.env.NODE_ENV === 'development') {
  setupDevTools({
    enabled: true,
    enablePerformanceMonitoring: true,
    autoConnectStores: true
  });
}

// 비동기 작업 상태 인터페이스
interface AsyncTask {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'success' | 'error' | 'retrying';
  result?: any;
  error?: string;
  progress: number;
  retryCount: number;
  maxRetries: number;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
}

// Store 스키마
interface AsyncStores {
  tasks: {
    active: AsyncTask[];
    history: AsyncTask[];
    concurrentLimit: number;
  };
  network: {
    isOnline: boolean;
    latency: number | null;
    errorRate: number;
  };
  ui: {
    showProgress: boolean;
    selectedTask: string | null;
  };
}

// Store Context 생성
const {
  Provider: StoreProvider,
  useStore
} = createStoreContext('AsyncErrorDemo', {
  tasks: {
    active: [],
    history: [],
    concurrentLimit: 3
  },
  network: {
    isOnline: true,
    latency: null,
    errorRate: 0
  },
  ui: {
    showProgress: true,
    selectedTask: null
  }
} as AsyncStores);

// Actions 인터페이스
interface AsyncActions {
  startTask: { 
    name: string; 
    type: 'api-call' | 'file-upload' | 'data-processing' | 'timeout-test';
    failureRate?: number;
    timeout?: number;
  };
  retryTask: { taskId: string };
  cancelTask: { taskId: string };
  clearHistory: void;
  simulateNetworkChange: { isOnline: boolean; latency?: number };
  updateErrorRate: { rate: number };
}

// Action Context 생성
const {
  Provider: ActionProvider,
  useActionDispatch,
  useActionHandler
} = createActionContext<AsyncActions>('AsyncErrorActions');

// 비동기 작업 시뮬레이터
class TaskSimulator {
  static async simulateApiCall(failureRate = 0.3, timeout = 5000): Promise<any> {
    return new Promise((resolve, reject) => {
      const shouldFail = Math.random() < failureRate;
      const delay = Math.random() * 2000 + 500; // 500-2500ms
      
      const timeoutId = setTimeout(() => {
        if (shouldFail) {
          reject(new Error('API 호출 실패: 서버에서 응답하지 않습니다'));
        } else {
          resolve({ id: Date.now(), data: `API 응답 데이터 ${Math.random().toString(36).substr(2, 5)}` });
        }
      }, delay);

      // 타임아웃 처리
      setTimeout(() => {
        clearTimeout(timeoutId);
        reject(new Error(`요청 타임아웃: ${timeout}ms 초과`));
      }, timeout);
    });
  }

  static async simulateFileUpload(failureRate = 0.2, timeout = 8000): Promise<any> {
    return new Promise((resolve, reject) => {
      const shouldFail = Math.random() < failureRate;
      const totalTime = Math.random() * 3000 + 1000; // 1-4초
      
      if (shouldFail) {
        setTimeout(() => {
          reject(new Error('파일 업로드 실패: 네트워크 연결이 불안정합니다'));
        }, totalTime * 0.5);
        return;
      }

      // 진행률 시뮬레이션
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          clearInterval(interval);
          resolve({ 
            fileId: `file-${Date.now()}`,
            size: Math.floor(Math.random() * 1000000),
            url: `https://example.com/files/${Date.now()}`
          });
        }
      }, totalTime / 10);

      // 타임아웃 처리
      setTimeout(() => {
        clearInterval(interval);
        reject(new Error(`업로드 타임아웃: ${timeout}ms 초과`));
      }, timeout);
    });
  }

  static async simulateDataProcessing(failureRate = 0.25): Promise<any> {
    return new Promise((resolve, reject) => {
      const shouldFail = Math.random() < failureRate;
      const processingTime = Math.random() * 4000 + 1000; // 1-5초
      
      setTimeout(() => {
        if (shouldFail) {
          const errorTypes = [
            '데이터 형식 오류: 잘못된 JSON 형식',
            '메모리 부족: 처리할 데이터가 너무 큽니다',
            '검증 실패: 필수 필드가 누락되었습니다'
          ];
          reject(new Error(errorTypes[Math.floor(Math.random() * errorTypes.length)]));
        } else {
          resolve({
            processed: Math.floor(Math.random() * 10000),
            summary: `${Math.floor(Math.random() * 100)} 항목 처리 완료`
          });
        }
      }, processingTime);
    });
  }
}

// 비동기 작업 관리 로직
function AsyncTaskManager({ children }: { children: React.ReactNode }) {
  const tasksStore = useStore('tasks');
  const networkStore = useStore('network');

  // 통합 에러 핸들러
  const errorHandler = createErrorHandler({
    onError: async (error, context) => {
      console.error('🚨 Async Error:', error.message, context);
    }
  });

  // Exponential backoff 계산
  const calculateBackoffDelay = (retryCount: number): number => {
    return Math.min(1000 * Math.pow(2, retryCount), 30000); // 최대 30초
  };

  // 작업 시작 액션
  useActionHandler('startTask', useCallback(async (payload) => {
    const { name, type, failureRate = 0.3, timeout = 5000 } = payload;
    
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newTask: AsyncTask = {
      id: taskId,
      name,
      status: 'running',
      progress: 0,
      retryCount: 0,
      maxRetries: 3,
      startTime: new Date()
    };

    // 동시 실행 제한 확인
    const currentTasks = tasksStore.getValue();
    const runningTasks = currentTasks.active.filter(t => t.status === 'running').length;
    
    if (runningTasks >= currentTasks.concurrentLimit) {
      await errorHandler.handleError(new Error('동시 실행 한도 초과: 다른 작업이 완료될 때까지 기다려주세요'), {
        context: 'task-limit',
        category: ErrorCategory.VALIDATION
      });
      return;
    }

    // 작업 목록에 추가
    tasksStore.update(state => ({
      ...state,
      active: [...state.active, newTask]
    }));

    try {
      let result;
      
      // 작업 유형에 따른 시뮬레이션
      switch (type) {
        case 'api-call':
          result = await TaskSimulator.simulateApiCall(failureRate, timeout);
          break;
        case 'file-upload':
          result = await TaskSimulator.simulateFileUpload(failureRate, timeout);
          break;
        case 'data-processing':
          result = await TaskSimulator.simulateDataProcessing(failureRate);
          break;
        case 'timeout-test':
          result = await TaskSimulator.simulateApiCall(0, 1000); // 1초 타임아웃 테스트
          break;
        default:
          result = await TaskSimulator.simulateApiCall(failureRate, timeout);
      }

      // 성공 처리
      const endTime = new Date();
      const duration = endTime.getTime() - newTask.startTime!.getTime();

      tasksStore.update(state => ({
        ...state,
        active: state.active.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                status: 'success' as const, 
                result, 
                progress: 100, 
                endTime, 
                duration 
              }
            : task
        )
      }));

      // 잠시 후 히스토리로 이동
      setTimeout(() => {
        tasksStore.update(state => {
          const completedTask = state.active.find(t => t.id === taskId);
          if (completedTask) {
            return {
              ...state,
              active: state.active.filter(t => t.id !== taskId),
              history: [completedTask, ...state.history.slice(0, 49)] // 최대 50개 유지
            };
          }
          return state;
        });
      }, 3000);

    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - newTask.startTime!.getTime();

      // 에러 처리
      tasksStore.update(state => ({
        ...state,
        active: state.active.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                status: 'error' as const, 
                error: (error as Error).message, 
                endTime, 
                duration 
              }
            : task
        )
      }));

      // 자동 재시도 (네트워크 에러인 경우)
      const currentTask = tasksStore.getValue().active.find(t => t.id === taskId);
      if (currentTask && currentTask.retryCount < currentTask.maxRetries) {
        const isNetworkError = (error as Error).message.includes('네트워크') || 
                              (error as Error).message.includes('타임아웃') ||
                              (error as Error).message.includes('응답하지');
        
        if (isNetworkError) {
          const backoffDelay = calculateBackoffDelay(currentTask.retryCount);
          
          setTimeout(() => {
            // 재시도 실행
            const retryDispatch = async () => {
              try {
                const dispatch = useActionDispatch();
                await dispatch('retryTask', { taskId });
              } catch (retryError) {
                console.error('Auto-retry failed:', retryError);
              }
            };
            retryDispatch();
          }, backoffDelay);
        }
      }

      await errorHandler.handleError(error as Error, {
        context: `async-task-${type}`,
        category: ErrorCategory.ASYNC
      });
    }
  }, [tasksStore, errorHandler]));

  // 재시도 액션
  useActionHandler('retryTask', useCallback(async (payload) => {
    const { taskId } = payload;
    const task = tasksStore.getValue().active.find(t => t.id === taskId);
    
    if (!task || task.status !== 'error') {
      return;
    }

    if (task.retryCount >= task.maxRetries) {
      await errorHandler.handleError(new Error('최대 재시도 횟수 초과'), {
        context: 'retry-limit',
        category: ErrorCategory.VALIDATION
      });
      return;
    }

    // 재시도 상태로 변경
    tasksStore.update(state => ({
      ...state,
      active: state.active.map(t => 
        t.id === taskId 
          ? { 
              ...t, 
              status: 'retrying' as const, 
              retryCount: t.retryCount + 1,
              error: undefined 
            }
          : t
      )
    }));

    // 백오프 지연 후 재실행
    const backoffDelay = calculateBackoffDelay(task.retryCount);
    
    setTimeout(async () => {
      tasksStore.update(state => ({
        ...state,
        active: state.active.map(t => 
          t.id === taskId ? { ...t, status: 'running' as const } : t
        )
      }));

      // 원래 작업 재실행 (간단히 API 호출로 시뮬레이션)
      try {
        const result = await TaskSimulator.simulateApiCall(0.2, 5000); // 재시도 시 성공률 높임
        
        const endTime = new Date();
        const duration = endTime.getTime() - task.startTime!.getTime();

        tasksStore.update(state => ({
          ...state,
          active: state.active.map(t => 
            t.id === taskId 
              ? { 
                  ...t, 
                  status: 'success' as const, 
                  result, 
                  progress: 100,
                  endTime,
                  duration
                }
              : t
          )
        }));

      } catch (error) {
        tasksStore.update(state => ({
          ...state,
          active: state.active.map(t => 
            t.id === taskId 
              ? { ...t, status: 'error' as const, error: (error as Error).message }
              : t
          )
        }));

        await errorHandler.handleError(error as Error, {
          context: 'retry-failed',
          category: ErrorCategory.ASYNC
        });
      }
    }, backoffDelay);

  }, [tasksStore, errorHandler]));

  // 작업 취소 액션
  useActionHandler('cancelTask', useCallback(async (payload) => {
    const { taskId } = payload;
    
    tasksStore.update(state => ({
      ...state,
      active: state.active.filter(t => t.id !== taskId)
    }));
  }, [tasksStore]));

  // 히스토리 클리어 액션
  useActionHandler('clearHistory', useCallback(async () => {
    tasksStore.update(state => ({ ...state, history: [] }));
  }, [tasksStore]));

  // 네트워크 상태 시뮬레이션 액션
  useActionHandler('simulateNetworkChange', useCallback(async (payload) => {
    const { isOnline, latency } = payload;
    
    networkStore.update(state => ({
      ...state,
      isOnline,
      latency: latency || null
    }));
  }, [networkStore]));

  // 에러율 업데이트 액션
  useActionHandler('updateErrorRate', useCallback(async (payload) => {
    const { rate } = payload;
    
    networkStore.update(state => ({ ...state, errorRate: rate }));
  }, [networkStore]));

  return <>{children}</>;
}

// 작업 제어 패널
function TaskControlPanel() {
  const dispatch = useActionDispatch();
  const networkStore = useStore('network');
  const network = useStoreValue(networkStore);

  const taskTypes = [
    { value: 'api-call', label: '🌐 API 호출', failureRate: 0.3 },
    { value: 'file-upload', label: '📁 파일 업로드', failureRate: 0.2 },
    { value: 'data-processing', label: '⚙️ 데이터 처리', failureRate: 0.25 },
    { value: 'timeout-test', label: '⏱️ 타임아웃 테스트', failureRate: 1.0 }
  ];

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🎛️ 작업 제어 패널</h3>
      
      {/* 네트워크 상태 */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2">네트워크 상태</h4>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={network.isOnline}
              onChange={(e) => dispatch('simulateNetworkChange', { 
                isOnline: e.target.checked,
                latency: network.latency || 100 
              })}
              className="rounded"
            />
            <span className="text-sm">온라인</span>
          </label>
          <div className="flex items-center space-x-2">
            <span className="text-sm">에러율:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={network.errorRate}
              onChange={(e) => dispatch('updateErrorRate', { rate: parseFloat(e.target.value) })}
              className="w-20"
            />
            <span className="text-sm w-12">{(network.errorRate * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* 작업 시작 버튼들 */}
      <div className="grid grid-cols-2 gap-2">
        {taskTypes.map((taskType) => (
          <button
            key={taskType.value}
            onClick={() => dispatch('startTask', { 
              name: taskType.label,
              type: taskType.value as any,
              failureRate: Math.max(taskType.failureRate, network.errorRate)
            })}
            disabled={!network.isOnline && taskType.value !== 'data-processing'}
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {taskType.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// 작업 상태 모니터
function TaskStatusMonitor() {
  const tasksStore = useStore('tasks');
  const tasks = useStoreValue(tasksStore);
  const dispatch = useActionDispatch();

  const getStatusColor = (status: AsyncTask['status']) => {
    switch (status) {
      case 'running': return 'text-blue-600 bg-blue-100';
      case 'success': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'retrying': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: AsyncTask['status']) => {
    switch (status) {
      case 'running': return '🏃';
      case 'success': return '✅';
      case 'error': return '❌';
      case 'retrying': return '🔄';
      default: return '⏸️';
    }
  };

  return (
    <div className="space-y-4">
      {/* 활성 작업 */}
      {tasks.active.length > 0 && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              🏃 활성 작업 ({tasks.active.length}/{tasks.concurrentLimit})
            </h3>
          </div>
          
          <div className="space-y-3">
            {tasks.active.map((task) => (
              <div key={task.id} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getStatusIcon(task.status)}</span>
                    <span className="font-medium">{task.name}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                  
                  <div className="flex space-x-1">
                    {task.status === 'error' && task.retryCount < task.maxRetries && (
                      <button
                        onClick={() => dispatch('retryTask', { taskId: task.id })}
                        className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                      >
                        재시도
                      </button>
                    )}
                    {task.status === 'running' && (
                      <button
                        onClick={() => dispatch('cancelTask', { taskId: task.id })}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        취소
                      </button>
                    )}
                  </div>
                </div>
                
                {task.error && (
                  <div className="text-sm text-red-700 bg-red-50 p-2 rounded">
                    {task.error}
                  </div>
                )}
                
                {task.result && (
                  <div className="text-sm text-green-700 bg-green-50 p-2 rounded">
                    성공: {JSON.stringify(task.result, null, 2)}
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-2 flex justify-between">
                  <span>재시도: {task.retryCount}/{task.maxRetries}</span>
                  <span>
                    {task.duration 
                      ? `실행시간: ${task.duration}ms`
                      : `시작: ${task.startTime?.toLocaleTimeString()}`
                    }
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 히스토리 */}
      {tasks.history.length > 0 && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              📋 작업 히스토리 ({tasks.history.length})
            </h3>
            <button
              onClick={() => dispatch('clearHistory')}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              클리어
            </button>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tasks.history.slice(0, 10).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <span>{getStatusIcon(task.status)}</span>
                  <span className="text-sm font-medium">{task.name}</span>
                  <span className={`px-1.5 py-0.5 text-xs rounded ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {task.duration ? `${task.duration}ms` : '진행중'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function AsyncErrorHandlingPage() {
  return (
    <StoreProvider>
      <ActionProvider>
        <AsyncTaskManager>
          <div className="p-6 max-w-6xl mx-auto">
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                ⚡ Async Error Handling
              </h1>
              <p className="text-lg text-gray-600">
                비동기 작업의 에러 처리, 재시도 메커니즘, 타임아웃 처리를 실습해보세요.
                다양한 실패 시나리오와 자동 복구 패턴을 체험할 수 있습니다.
              </p>
            </header>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <TaskControlPanel />
              </div>
              <div className="lg:col-span-2">
                <TaskStatusMonitor />
              </div>
            </div>

            {/* 패턴 설명 */}
            <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">
                💡 구현된 패턴들
              </h3>
              <div className="grid gap-4 md:grid-cols-2 text-sm text-yellow-700">
                <div>
                  <h4 className="font-medium">에러 처리 패턴</h4>
                  <ul className="mt-1 space-y-1">
                    <li>• Exponential Backoff 재시도 로직</li>
                    <li>• 타임아웃 기반 요청 취소</li>
                    <li>• 동시 실행 제한 및 큐 관리</li>
                    <li>• 네트워크 상태 기반 에러 분류</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium">사용자 경험</h4>
                  <ul className="mt-1 space-y-1">
                    <li>• 실시간 작업 상태 피드백</li>
                    <li>• 자동/수동 재시도 옵션</li>
                    <li>• 작업 히스토리 및 통계</li>
                    <li>• 에러 원인별 구체적 메시지</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </AsyncTaskManager>
      </ActionProvider>
    </StoreProvider>
  );
}