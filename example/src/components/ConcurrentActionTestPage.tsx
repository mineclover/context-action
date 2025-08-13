/**
 * Concurrent Action Test Page - Simplified
 *
 * Tests simultaneous action execution, abort functionality, and pipeline behavior
 * when multiple actions with different names are running concurrently.
 */

import { createActionContext } from '@context-action/react';
import { useState, useCallback } from 'react';
import type { AppActions } from '../types/actions';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Status } from './ui/Status';

// Create typed action context with enhanced logging
const {
  Provider: ActionProvider,
  useActionDispatch,
  useActionDispatchWithResult,
  useActionHandler,
} = createActionContext<AppActions>({
  name: 'ConcurrentActionTest',
});

interface TaskStatus {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'aborted' | 'failed';
  progress: number;
  startTime?: number;
  endTime?: number;
  result?: any;
  error?: string;
  estimatedDuration?: number;
  actualDuration?: number;
}

function ConcurrentActionTestPageContent() {
  const [tasks, setTasks] = useState<TaskStatus[]>([]);
  const [taskControllers, setTaskControllers] = useState<Map<string, AbortController>>(new Map());

  const dispatch = useActionDispatch();
  const { abortAll } = useActionDispatchWithResult();

  const updateTaskProgress = useCallback((taskId: string, progress: number) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          return { 
            ...task, 
            progress
          };
        }
        return task;
      })
    );
  }, []);

  const updateTaskStatus = useCallback((taskId: string, status: TaskStatus['status'], error?: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const endTime = Date.now();
          const actualDuration = task.startTime ? endTime - task.startTime : 0;
          return { 
            ...task, 
            status, 
            endTime, 
            error,
            actualDuration 
          };
        }
        return task;
      })
    );
    
    // Clean up controller when task finishes
    if (status !== 'running') {
      setTimeout(() => {
        setTaskControllers(prev => {
          const next = new Map(prev);
          next.delete(taskId);
          return next;
        });
      }, 1000); // Give some time for any remaining operations
    }
  }, []);

  // Register enhanced action handlers with progress tracking
  useActionHandler('longRunningTaskA', async ({ taskId, duration, abortController }, controller) => {
    const steps = 40;
    const activeController = abortController || (controller as any);
    
    try {
      for (let i = 1; i <= steps; i++) {
        if (activeController?.signal?.aborted) {
          updateTaskStatus(taskId, 'aborted', 'Task was aborted');
          return;
        }
        
        const stepDelay = (duration / steps) + Math.random() * 50;
        
        try {
          await new Promise<void>((resolve, reject) => {
            if (activeController?.signal?.aborted) {
              reject(new Error('Task was aborted'));
              return;
            }
            
            const timeoutId = setTimeout(() => resolve(), stepDelay);
            
            const abortHandler = () => {
              clearTimeout(timeoutId);
              reject(new Error('Task was aborted'));
            };
            
            if (activeController?.signal) {
              activeController.signal.addEventListener('abort', abortHandler, { once: true });
            }
          });
        } catch (error) {
          if (error instanceof Error && error.message.includes('aborted')) {
            updateTaskStatus(taskId, 'aborted', 'Task was aborted');
            return;
          }
          throw error;
        }
        
        if (activeController?.signal?.aborted) {
          updateTaskStatus(taskId, 'aborted', 'Task was aborted');
          return;
        }
        
        const progress = Math.round((i / steps) * 100);
        updateTaskProgress(taskId, progress);
        
        // Only mark as completed when we reach 100%
        if (progress === 100) {
          updateTaskStatus(taskId, 'completed');
        }
      }
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('aborted'))) {
        updateTaskStatus(taskId, 'failed', error instanceof Error ? error.message : 'Unknown error');
      }
      throw error;
    }
  });

  useActionHandler('longRunningTaskB', async ({ taskId, duration, abortController }, controller) => {
    const steps = 30;
    const activeController = abortController || (controller as any);
    
    try {
      for (let i = 1; i <= steps; i++) {
        if (activeController?.signal?.aborted) {
          updateTaskStatus(taskId, 'aborted', 'Task was aborted');
          return;
        }
        
        const stepDelay = (duration / steps) + Math.random() * 80;
        
        try {
          await new Promise<void>((resolve, reject) => {
            if (activeController?.signal?.aborted) {
              reject(new Error('Task was aborted'));
              return;
            }
            
            const timeoutId = setTimeout(() => resolve(), stepDelay);
            
            const abortHandler = () => {
              clearTimeout(timeoutId);
              reject(new Error('Task was aborted'));
            };
            
            if (activeController?.signal) {
              activeController.signal.addEventListener('abort', abortHandler, { once: true });
            }
          });
        } catch (error) {
          if (error instanceof Error && error.message.includes('aborted')) {
            updateTaskStatus(taskId, 'aborted', 'Task was aborted');
            return;
          }
          throw error;
        }
        
        if (activeController?.signal?.aborted) {
          updateTaskStatus(taskId, 'aborted', 'Task was aborted');
          return;
        }
        
        const progress = Math.round((i / steps) * 100);
        updateTaskProgress(taskId, progress);
        
        // Only mark as completed when we reach 100%
        if (progress === 100) {
          updateTaskStatus(taskId, 'completed');
        }
      }
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('aborted'))) {
        updateTaskStatus(taskId, 'failed', error instanceof Error ? error.message : 'Unknown error');
      }
      throw error;
    }
  });

  useActionHandler('quickTask', async ({ taskId, duration, abortController }, controller) => {
    const steps = 10;
    const activeController = abortController || (controller as any);
    
    try {
      for (let i = 1; i <= steps; i++) {
        if (activeController?.signal?.aborted) {
          updateTaskStatus(taskId, 'aborted', 'Task was aborted');
          return;
        }
        
        const stepDelay = duration / steps;
        
        try {
          await new Promise<void>((resolve, reject) => {
            if (activeController?.signal?.aborted) {
              reject(new Error('Task was aborted'));
              return;
            }
            
            const timeoutId = setTimeout(() => resolve(), stepDelay);
            
            const abortHandler = () => {
              clearTimeout(timeoutId);
              reject(new Error('Task was aborted'));
            };
            
            if (activeController?.signal) {
              activeController.signal.addEventListener('abort', abortHandler, { once: true });
            }
          });
        } catch (error) {
          if (error instanceof Error && error.message.includes('aborted')) {
            updateTaskStatus(taskId, 'aborted', 'Task was aborted');
            return;
          }
          throw error;
        }
        
        if (activeController?.signal?.aborted) {
          updateTaskStatus(taskId, 'aborted', 'Task was aborted');
          return;
        }
        
        const progress = Math.round((i / steps) * 100);
        updateTaskProgress(taskId, progress);
        
        // Only mark as completed when we reach 100%
        if (progress === 100) {
          updateTaskStatus(taskId, 'completed');
        }
      }
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('aborted'))) {
        updateTaskStatus(taskId, 'failed', error instanceof Error ? error.message : 'Unknown error');
      }
      throw error;
    }
  });

  useActionHandler('networkRequest', async ({ endpoint, params }, controller) => {
    const taskId = `network-${Date.now()}`;
    addNetworkTask(taskId, 'networkRequest');
    
    try {
      const steps = 10;
      for (let i = 1; i <= steps; i++) {
        if ((controller as any).signal?.aborted) {
          throw new Error('Network request was aborted');
        }
        
        await new Promise((resolve) => setTimeout(resolve, 100));
        const progress = Math.round((i / steps) * 100);
        updateTaskProgress(taskId, progress);
        
        if (progress === 100) {
          updateTaskStatus(taskId, 'completed');
        }
      }
    } catch (error) {
      updateTaskStatus(taskId, 'aborted', error instanceof Error ? error.message : 'Unknown error');
    }
  });

  useActionHandler('backgroundJob', async ({ jobId, jobType, priority }, controller) => {
    const taskId = `job-${Date.now()}`;
    addBackgroundTask(taskId, 'backgroundJob');
    
    try {
      const steps = 25;
      for (let i = 1; i <= steps; i++) {
        if ((controller as any).signal?.aborted) {
          throw new Error('Background job was aborted');
        }
        
        await new Promise((resolve) => setTimeout(resolve, 80));
        const progress = Math.round((i / steps) * 100);
        updateTaskProgress(taskId, progress);
        
        if (progress === 100) {
          updateTaskStatus(taskId, 'completed');
        }
      }
    } catch (error) {
      updateTaskStatus(taskId, 'aborted', error instanceof Error ? error.message : 'Unknown error');
    }
  });

  const addNetworkTask = (taskId: string, name: string) => {
    setTasks((prev) => [
      ...prev,
      {
        id: taskId,
        name,
        status: 'running',
        progress: 0,
        startTime: Date.now(),
      },
    ]);
  };

  const addBackgroundTask = (taskId: string, name: string) => {
    setTasks((prev) => [
      ...prev,
      {
        id: taskId,
        name,
        status: 'running',
        progress: 0,
        startTime: Date.now(),
      },
    ]);
  };

  const startTask = async (taskType: string, duration: number) => {
    const taskId = `task-${Date.now()}`;
    const startTime = Date.now();
    
    // Create dedicated AbortController for this task
    const taskController = new AbortController();
    setTaskControllers(prev => new Map(prev.set(taskId, taskController)));

    setTasks((prev) => [
      ...prev,
      {
        id: taskId,
        name: taskType,
        status: 'running',
        progress: 0,
        startTime,
        estimatedDuration: duration,
      },
    ]);

    try {
      await dispatch(
        taskType as keyof AppActions,
        { taskId, duration: duration, abortController: taskController } as any,
        { signal: taskController.signal }
      );
    } catch (error) {
      updateTaskStatus(taskId, error instanceof Error && error.message.includes('aborted') ? 'aborted' : 'failed', 
        error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const abortTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    const controller = taskControllers.get(taskId);
    
    if (task && task.status === 'running' && controller) {
      updateTaskStatus(taskId, 'aborted', 'Task aborted by user');
      controller.abort('Task aborted by user');
    }
  };

  const abortAllTasks = () => {
    tasks.filter(t => t.status === 'running').forEach(task => {
      abortTask(task.id);
    });
    abortAll();
  };

  const clearCompletedTasks = () => {
    setTasks(prev => prev.filter(task => task.status !== 'completed'));
  };

  const formatDuration = (startTime?: number, endTime?: number) => {
    if (!startTime) return '-';
    const end = endTime || Date.now();
    const duration = end - startTime;
    return `${(duration / 1000).toFixed(1)}s`;
  };


  const getTaskSummary = () => {
    const running = tasks.filter(t => t.status === 'running').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const aborted = tasks.filter(t => t.status === 'aborted').length;
    const failed = tasks.filter(t => t.status === 'failed').length;
    
    return { running, completed, aborted, failed, total: tasks.length };
  };

  const summary = getTaskSummary();

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-bold mb-4">Concurrent Action Tests</h2>

        {/* Task Summary */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg mb-4 border">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            📈 Task Execution Dashboard
            {summary.running > 0 && (
              <span className="animate-pulse bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                {summary.running} Active
              </span>
            )}
          </h3>
          <div className="grid grid-cols-5 gap-4 text-sm">
            <div className="text-center p-2 bg-blue-100 rounded-lg">
              <div className="text-blue-600 font-bold text-lg">{summary.running}</div>
              <div className="text-blue-700">🔄 Running</div>
            </div>
            <div className="text-center p-2 bg-green-100 rounded-lg">
              <div className="text-green-600 font-bold text-lg">{summary.completed}</div>
              <div className="text-green-700">✅ Completed</div>
            </div>
            <div className="text-center p-2 bg-orange-100 rounded-lg">
              <div className="text-orange-600 font-bold text-lg">{summary.aborted}</div>
              <div className="text-orange-700">⏹️ Aborted</div>
            </div>
            <div className="text-center p-2 bg-red-100 rounded-lg">
              <div className="text-red-600 font-bold text-lg">{summary.failed}</div>
              <div className="text-red-700">❌ Failed</div>
            </div>
            <div className="text-center p-2 bg-gray-100 rounded-lg">
              <div className="text-gray-600 font-bold text-lg">{summary.total}</div>
              <div className="text-gray-700">📊 Total</div>
            </div>
          </div>
          
          {/* Success Rate */}
          {summary.total > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-center">
                <span className="text-sm text-gray-600">Success Rate: </span>
                <span className={`font-bold ${
                  (summary.completed / summary.total) >= 0.8 ? 'text-green-600' :
                  (summary.completed / summary.total) >= 0.6 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {Math.round((summary.completed / summary.total) * 100)}%
                </span>
                <span className="text-xs text-gray-500 ml-1">({summary.completed}/{summary.total})</span>
              </div>
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <Button onClick={() => startTask('longRunningTaskA', 8000)}>
            Task A - Data Processing (8s)
          </Button>
          <Button onClick={() => startTask('longRunningTaskB', 6000)}>
            Task B - Network Sync (6s)
          </Button>
          <Button onClick={() => startTask('quickTask', 2000)}>
            Quick Task - Validation (2s)
          </Button>
          <Button
            onClick={() =>
              dispatch('networkRequest', {
                endpoint: '/api/data',
                params: {},
              })
            }
            variant="secondary"
          >
            🔗 Network Request (1s)
          </Button>
          <Button
            onClick={() =>
              dispatch('backgroundJob', {
                jobId: 'job1',
                jobType: 'sync',
                priority: 1,
              })
            }
            variant="secondary"
          >
            ⚙️ Background Job (2s)
          </Button>
          <Button 
            onClick={abortAllTasks} 
            variant="danger"
            disabled={summary.running === 0}
          >
            ⏹️ Abort All ({summary.running})
          </Button>
        </div>

        {/* Management Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button onClick={clearCompletedTasks} variant="secondary" size="sm">
            🧹 Clear Completed ({summary.completed})
          </Button>
          <Button onClick={() => setTasks([])} variant="secondary" size="sm">
            🗑️ Clear All ({summary.total})
          </Button>
          <Button onClick={() => {
            startTask('longRunningTaskA', 5000);
            startTask('longRunningTaskB', 4000);
            startTask('quickTask', 1500);
          }} variant="secondary" size="sm">
            ⚡ Stress Test (3 concurrent)
          </Button>
        </div>
        

        {/* Task List */}
        <div className="space-y-2">
          <h3 className="font-semibold">Task Status:</h3>
          {tasks.length === 0 ? (
            <p className="text-gray-500">No tasks</p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-4 p-3 border rounded-lg bg-white"
              >
                <div className="flex-1">
                  <div className="font-medium">
                    {task.name === 'longRunningTaskA' ? '📊 Data Processing Task' :
                     task.name === 'longRunningTaskB' ? '🌐 Network Synchronization' :
                     task.name === 'quickTask' ? '✅ Quick Validation' :
                     task.name === 'networkRequest' ? '🔗 API Network Request' :
                     task.name === 'backgroundJob' ? '⚙️ Background Job Processing' :
                     task.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    <div>ID: {task.id.split('-').slice(-1)[0]}</div>
                    {task.estimatedDuration && (
                      <div className="text-xs mt-1">
                        Expected: {(task.estimatedDuration / 1000).toFixed(1)}s
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="flex-1 max-w-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-3 relative overflow-hidden">
                      <div 
                        className={`h-3 rounded-full ${
                          task.status === 'completed' ? 'bg-green-500' :
                          task.status === 'aborted' ? 'bg-orange-500' :
                          task.status === 'failed' ? 'bg-red-500' :
                          'bg-blue-500'
                        }`}
                        style={{ 
                          width: `${task.progress}%`,
                          transition: task.status === 'running' ? 'none' : 'width 0.2s ease-out'
                        }}
                      />
                      {task.status === 'running' && (
                        <div className="absolute inset-0 shimmer-effect opacity-30" />
                      )}
                    </div>
                    <span className="text-sm w-12 text-right font-mono tabular-nums">
                      {task.progress}%
                    </span>
                  </div>
                </div>

                {/* Duration */}
                <div className="text-sm text-gray-500 w-20">
                  <div>{formatDuration(task.startTime, task.endTime)}</div>
                </div>

                {/* Status */}
                <Status
                  status={
                    task.status === 'idle'
                      ? 'neutral'
                      : task.status === 'running'
                        ? 'info'
                        : task.status === 'completed'
                          ? 'safe'
                          : task.status === 'aborted'
                            ? 'warning'
                            : 'danger'
                  }
                >
                  {task.status === 'idle' ? 'Idle' :
                   task.status === 'running' ? 'Running' :
                   task.status === 'completed' ? 'Completed' :
                   task.status === 'aborted' ? 'Aborted' :
                   'Failed'}
                </Status>

                {/* Actions */}
                <div className="flex gap-1">
                  {task.status === 'running' && (
                    <Button
                      onClick={() => abortTask(task.id)}
                      variant="danger"
                      size="sm"
                    >
                      Abort
                    </Button>
                  )}
                  {task.error && (
                    <div className="text-xs text-red-600 max-w-32 truncate" title={task.error}>
                      {task.error}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

export function ConcurrentActionTestPage() {
  return (
    <ActionProvider>
      <ConcurrentActionTestPageContent />
    </ActionProvider>
  );
}

export default ConcurrentActionTestPage;
