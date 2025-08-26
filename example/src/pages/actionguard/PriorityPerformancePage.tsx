/**
 * @fileoverview Priority Performance Demo Page
 * Context-Action framework의 우선순위 기반 성능 최적화 데모
 */

import { useCallback, useState, useEffect, useMemo } from 'react';
import { PageWithLogMonitor } from '../../components/LogMonitor';
import { createActionContext } from '@context-action/react';
import { Badge, Card, CardContent } from '../../components/ui';

// Task 데이터 타입
interface TaskData {
  name: string;
  payload?: Record<string, unknown>;
  executionTime?: number;
  timestamp?: number;
}

// Priority Performance 관련 액션 타입 정의
interface PriorityActions {
  executeHighPriority: { taskId: string; data: TaskData };
  executeMediumPriority: { taskId: string; data: TaskData };
  executeLowPriority: { taskId: string; data: TaskData };
  batchExecute: { tasks: Array<{ id: string; priority: 'high' | 'medium' | 'low'; data: TaskData }> };
  clearTasks: void;
  measurePerformance: { operation: string; duration: number };
}

// Action Context 생성
const { Provider: PriorityProvider, useActionDispatch, useActionHandler } = 
  createActionContext<PriorityActions>('Priority');

// 메인 컴포넌트
export function PriorityPerformanceBasicPage() {
  return (
    <PageWithLogMonitor
      pageId="priority-performance"
      title="Priority Performance Demo"
      initialConfig={{ enableToast: true, maxLogs: 100 }}
    >
      <div className="page-container">
        <header className="page-header">
          <h1>🚀 Priority Performance Demo</h1>
          <p className="page-description">
            Context-Action 프레임워크의 <strong>우선순위 기반 성능 최적화</strong> 시스템입니다.
            Action Handler의 우선순위 실행, 배치 처리, 성능 측정을 통한 최적화 전략을 보여줍니다.
          </p>
          
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline" className="bg-red-50 text-red-800">
              🔥 고우선순위
            </Badge>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
              ⚡ 중우선순위
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-800">
              💧 저우선순위
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-800">
              📊 성능 측정
            </Badge>
          </div>
        </header>

        <PriorityProvider>
          <PriorityPerformanceDemo />
        </PriorityProvider>
      </div>
    </PageWithLogMonitor>
  );
}

// 데모 컴포넌트
function PriorityPerformanceDemo() {
  const dispatch = useActionDispatch();
  const [taskQueue, setTaskQueue] = useState<Array<{
    id: string;
    priority: 'high' | 'medium' | 'low';
    name: string;
    status: 'pending' | 'executing' | 'completed';
    startTime?: number;
    endTime?: number;
    duration?: number;
  }>>([]);
  
  const [performanceMetrics, setPerformanceMetrics] = useState<Array<{
    operation: string;
    duration: number;
    timestamp: number;
  }>>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState({ high: 0, medium: 0, low: 0 });

  // Action Handlers 등록 (우선순위 순서대로)
  useActionHandler('executeHighPriority', useCallback(async (payload, controller) => {
    const startTime = performance.now();
    
    // 고우선순위 작업 시뮬레이션 (빠른 처리)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    setTaskQueue(prev => prev.map(task => 
      task.id === payload.taskId 
        ? { ...task, status: 'completed', startTime, endTime, duration }
        : task
    ));
    
    setProcessedCount(prev => ({ ...prev, high: prev.high + 1 }));
    dispatch('measurePerformance', { operation: 'High Priority Task', duration });
  }, [dispatch]), { priority: 1 }); // 높은 우선순위

  useActionHandler('executeMediumPriority', useCallback(async (payload, controller) => {
    const startTime = performance.now();
    
    // 중우선순위 작업 시뮬레이션 (보통 처리)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 150));
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    setTaskQueue(prev => prev.map(task => 
      task.id === payload.taskId 
        ? { ...task, status: 'completed', startTime, endTime, duration }
        : task
    ));
    
    setProcessedCount(prev => ({ ...prev, medium: prev.medium + 1 }));
    dispatch('measurePerformance', { operation: 'Medium Priority Task', duration });
  }, [dispatch]), { priority: 2 }); // 중간 우선순위

  useActionHandler('executeLowPriority', useCallback(async (payload, controller) => {
    const startTime = performance.now();
    
    // 저우선순위 작업 시뮬레이션 (느린 처리)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 300));
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    setTaskQueue(prev => prev.map(task => 
      task.id === payload.taskId 
        ? { ...task, status: 'completed', startTime, endTime, duration }
        : task
    ));
    
    setProcessedCount(prev => ({ ...prev, low: prev.low + 1 }));
    dispatch('measurePerformance', { operation: 'Low Priority Task', duration });
  }, [dispatch]), { priority: 3 }); // 낮은 우선순위

  useActionHandler('measurePerformance', useCallback(async (payload, controller) => {
    setPerformanceMetrics(prev => [{
      operation: payload.operation,
      duration: payload.duration,
      timestamp: Date.now()
    }, ...prev].slice(0, 50));
  }, []));

  useActionHandler('clearTasks', useCallback(async (_, controller) => {
    setTaskQueue([]);
    setPerformanceMetrics([]);
    setProcessedCount({ high: 0, medium: 0, low: 0 });
  }, []));

  // 작업 추가 함수들
  const addHighPriorityTask = useCallback(() => {
    const taskId = `high_${Date.now()}`;
    const newTask = {
      id: taskId,
      priority: 'high' as const,
      name: `긴급 작업 #${processedCount.high + taskQueue.filter(t => t.priority === 'high').length + 1}`,
      status: 'pending' as const
    };
    
    setTaskQueue(prev => [...prev, newTask]);
    dispatch('executeHighPriority', { taskId, data: { name: newTask.name } });
  }, [dispatch, processedCount.high, taskQueue]);

  const addMediumPriorityTask = useCallback(() => {
    const taskId = `medium_${Date.now()}`;
    const newTask = {
      id: taskId,
      priority: 'medium' as const,
      name: `일반 작업 #${processedCount.medium + taskQueue.filter(t => t.priority === 'medium').length + 1}`,
      status: 'pending' as const
    };
    
    setTaskQueue(prev => [...prev, newTask]);
    dispatch('executeMediumPriority', { taskId, data: { name: newTask.name } });
  }, [dispatch, processedCount.medium, taskQueue]);

  const addLowPriorityTask = useCallback(() => {
    const taskId = `low_${Date.now()}`;
    const newTask = {
      id: taskId,
      priority: 'low' as const,
      name: `배경 작업 #${processedCount.low + taskQueue.filter(t => t.priority === 'low').length + 1}`,
      status: 'pending' as const
    };
    
    setTaskQueue(prev => [...prev, newTask]);
    dispatch('executeLowPriority', { taskId, data: { name: newTask.name } });
  }, [dispatch, processedCount.low, taskQueue]);

  const addBatchTasks = useCallback(() => {
    const batchSize = 5;
    const tasks: Array<{
      id: string;
      priority: 'high' | 'medium' | 'low';
      name: string;
      status: 'pending';
    }> = [];
    
    for (let i = 0; i < batchSize; i++) {
      const priorities: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'low'];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const taskId = `batch_${priority}_${Date.now()}_${i}`;
      
      const newTask = {
        id: taskId,
        priority,
        name: `배치 ${priority} #${i + 1}`,
        status: 'pending' as const
      };
      
      tasks.push(newTask);
    }
    
    setTaskQueue(prev => [...prev, ...tasks]);
    
    // 각 우선순위별로 작업 실행
    tasks.forEach(task => {
      if (task.priority === 'high') {
        dispatch('executeHighPriority', { taskId: task.id, data: { name: task.name } });
      } else if (task.priority === 'medium') {
        dispatch('executeMediumPriority', { taskId: task.id, data: { name: task.name } });
      } else {
        dispatch('executeLowPriority', { taskId: task.id, data: { name: task.name } });
      }
    });
  }, [dispatch]);

  // 성능 통계 계산
  const performanceStats = useMemo(() => {
    const highPriorityMetrics = performanceMetrics.filter(m => m.operation === 'High Priority Task');
    const mediumPriorityMetrics = performanceMetrics.filter(m => m.operation === 'Medium Priority Task');
    const lowPriorityMetrics = performanceMetrics.filter(m => m.operation === 'Low Priority Task');
    
    const avgDuration = (metrics: typeof performanceMetrics) => {
      if (metrics.length === 0) return 0;
      return metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
    };
    
    return {
      high: {
        count: highPriorityMetrics.length,
        avgDuration: avgDuration(highPriorityMetrics)
      },
      medium: {
        count: mediumPriorityMetrics.length,
        avgDuration: avgDuration(mediumPriorityMetrics)
      },
      low: {
        count: lowPriorityMetrics.length,
        avgDuration: avgDuration(lowPriorityMetrics)
      },
      total: performanceMetrics.length
    };
  }, [performanceMetrics]);

  return (
    <div className="space-y-6">
      {/* 컨트롤 패널 */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🎛️ 작업 생성 컨트롤</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={addHighPriorityTask}
              className="px-4 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors text-sm"
            >
              🔥 긴급 작업 추가
            </button>
            
            <button
              onClick={addMediumPriorityTask}
              className="px-4 py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors text-sm"
            >
              ⚡ 일반 작업 추가
            </button>
            
            <button
              onClick={addLowPriorityTask}
              className="px-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors text-sm"
            >
              💧 배경 작업 추가
            </button>
            
            <button
              onClick={addBatchTasks}
              className="px-4 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors text-sm"
            >
              📦 배치 작업 (5개)
            </button>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => dispatch('clearTasks')}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
            >
              🗑️ 모두 지우기
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 성능 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm text-gray-600 mb-2">🔥 고우선순위</h4>
            <div className="text-2xl font-bold text-red-600">
              {performanceStats.high.count}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              평균 {performanceStats.high.avgDuration.toFixed(1)}ms
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm text-gray-600 mb-2">⚡ 중우선순위</h4>
            <div className="text-2xl font-bold text-yellow-600">
              {performanceStats.medium.count}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              평균 {performanceStats.medium.avgDuration.toFixed(1)}ms
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm text-gray-600 mb-2">💧 저우선순위</h4>
            <div className="text-2xl font-bold text-blue-600">
              {performanceStats.low.count}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              평균 {performanceStats.low.avgDuration.toFixed(1)}ms
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm text-gray-600 mb-2">📊 전체 작업</h4>
            <div className="text-2xl font-bold text-green-600">
              {performanceStats.total}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              큐: {taskQueue.length}개
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 작업 큐 */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 작업 큐 상태</h3>
          
          <div className="max-h-96 overflow-y-auto">
            {taskQueue.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <div className="mb-2">📋</div>
                <div>작업 큐가 비어있습니다</div>
                <div className="text-sm">위 버튼을 클릭하여 작업을 추가해보세요!</div>
              </div>
            ) : (
              <div className="space-y-2">
                {taskQueue.map((task) => (
                  <div 
                    key={task.id}
                    className={`flex justify-between items-center p-3 rounded-lg border ${{
                      high: 'border-red-200 bg-red-50',
                      medium: 'border-yellow-200 bg-yellow-50',
                      low: 'border-blue-200 bg-blue-50'
                    }[task.priority]}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${{
                        high: 'bg-red-500 text-white',
                        medium: 'bg-yellow-500 text-white',
                        low: 'bg-blue-500 text-white'
                      }[task.priority]}`}>
                        {{
                          high: '🔥 HIGH',
                          medium: '⚡ MED',
                          low: '💧 LOW'
                        }[task.priority]}
                      </span>
                      
                      <span className="font-medium text-sm">{task.name}</span>
                      
                      <span className={`px-2 py-1 rounded text-xs ${{
                        pending: 'bg-gray-100 text-gray-700',
                        executing: 'bg-orange-100 text-orange-700 animate-pulse',
                        completed: 'bg-green-100 text-green-700'
                      }[task.status]}`}>
                        {{
                          pending: '⏳ 대기',
                          executing: '🔄 실행중',
                          completed: '✅ 완료'
                        }[task.status]}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-500 font-mono">
                      {task.duration !== undefined ? `${task.duration.toFixed(1)}ms` : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 성능 분석 */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 성능 분석</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-blue-600 mb-3">우선순위별 처리 시간</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                  <span className="text-sm text-red-700">🔥 고우선순위</span>
                  <span className="font-mono text-sm text-red-800">
                    {performanceStats.high.avgDuration.toFixed(1)}ms 평균
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                  <span className="text-sm text-yellow-700">⚡ 중우선순위</span>
                  <span className="font-mono text-sm text-yellow-800">
                    {performanceStats.medium.avgDuration.toFixed(1)}ms 평균
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span className="text-sm text-blue-700">💧 저우선순위</span>
                  <span className="font-mono text-sm text-blue-800">
                    {performanceStats.low.avgDuration.toFixed(1)}ms 평균
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-green-600 mb-3">🛠️ 최적화 포인트</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• <strong>Handler 우선순위</strong>: priority 옵션으로 실행 순서 제어</li>
                <li>• <strong>배치 처리</strong>: 동시 작업 처리로 처리량 향상</li>
                <li>• <strong>성능 측정</strong>: 실시간 모니터링 및 병목점 식별</li>
                <li>• <strong>큐 관리</strong>: 작업 상태 추적 및 리소스 최적화</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PriorityPerformanceBasicPage;