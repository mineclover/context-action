/**
 * Concurrent Action Test Page
 *
 * Tests simultaneous action execution, abort functionality, and pipeline behavior
 * when multiple actions with different names are running concurrently.
 *
 * Features:
 * - Multiple actions running simultaneously
 * - Individual and bulk abort functionality
 * - Progress tracking for each action
 * - Pipeline interaction testing
 * - Performance monitoring
 */

import { createActionContext } from '@context-action/react';
import { useEffect, useRef, useState } from 'react';
import type { AppActions } from '../types/actions';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Status } from './ui/Status';

// Create typed action context with enhanced logging
const {
  Provider: ActionProvider,
  useActionDispatchWithResult,
  useActionRegister,
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
}

interface ExecutionLog {
  timestamp: number;
  action: string;
  event: string;
  details: string;
}

export function ConcurrentActionTestPage() {
  const [tasks, setTasks] = useState<TaskStatus[]>([]);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [globalAbortCount, setGlobalAbortCount] = useState(0);

  const { dispatch, abortAll, resetAbortScope } = useActionDispatchWithResult();
  const register = useActionRegister();

  const tasksRef = useRef<TaskStatus[]>([]);
  const logsRef = useRef<ExecutionLog[]>([]);

  // Update refs when state changes
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    logsRef.current = executionLogs;
  }, [executionLogs]);

  // Helper to add execution log
  const addLog = (action: string, event: string, details: string) => {
    const newLog: ExecutionLog = {
      timestamp: Date.now(),
      action,
      event,
      details,
    };
    setExecutionLogs((prev) => [...prev.slice(-19), newLog]); // Keep last 20 logs
  };

  // Helper to update task status
  const updateTask = (taskId: string, updates: Partial<TaskStatus>) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
    );
  };

  // Helper to create or update task
  const createOrUpdateTask = (
    taskId: string,
    name: string,
    updates: Partial<TaskStatus> = {}
  ) => {
    setTasks((prev) => {
      const existingIndex = prev.findIndex((task) => task.id === taskId);
      const baseTask: TaskStatus = {
        id: taskId,
        name,
        status: 'idle',
        progress: 0,
        ...updates,
      };

      if (existingIndex >= 0) {
        const newTasks = [...prev];
        newTasks[existingIndex] = { ...newTasks[existingIndex], ...updates };
        return newTasks;
      } else {
        return [...prev, baseTask];
      }
    });
  };

  // Register action handlers
  useEffect(() => {
    if (!register) return;

    const unregisterFunctions: (() => void)[] = [];

    // Long running task A handler
    unregisterFunctions.push(
      register.register(
        'longRunningTaskA',
        async ({ taskId, duration }, controller) => {
          const taskName = `Task A (${duration}ms)`;
          addLog(
            'longRunningTaskA',
            'started',
            `Task ID: ${taskId}, Duration: ${duration}ms`
          );

          createOrUpdateTask(taskId, taskName, {
            status: 'running',
            startTime: Date.now(),
            progress: 0,
          });

          try {
            const steps = Math.max(10, Math.floor(duration / 100));

            for (let i = 0; i <= steps; i++) {
              // Check for abort by trying a small operation
              try {
                const progress = (i / steps) * 100;
                updateTask(taskId, { progress });

                await new Promise((resolve) =>
                  setTimeout(resolve, duration / steps)
                );
              } catch (_error) {
                addLog(
                  'longRunningTaskA',
                  'aborted',
                  `Task ${taskId} aborted at step ${i}/${steps}`
                );
                updateTask(taskId, {
                  status: 'aborted',
                  endTime: Date.now(),
                  progress: (i / steps) * 100,
                });
                return;
              }
            }

            addLog(
              'longRunningTaskA',
              'completed',
              `Task ${taskId} completed successfully`
            );
            updateTask(taskId, {
              status: 'completed',
              endTime: Date.now(),
              progress: 100,
              result: `Task A completed in ${duration}ms`,
            });
          } catch (error) {
            addLog(
              'longRunningTaskA',
              'failed',
              `Task ${taskId} failed: ${error}`
            );
            updateTask(taskId, {
              status: 'failed',
              endTime: Date.now(),
              error: String(error),
            });
          }
        }
      )
    );

    // Long running task B handler
    unregisterFunctions.push(
      register.register(
        'longRunningTaskB',
        async ({ taskId, duration }, controller) => {
          const taskName = `Task B (${duration}ms)`;
          addLog(
            'longRunningTaskB',
            'started',
            `Task ID: ${taskId}, Duration: ${duration}ms`
          );

          createOrUpdateTask(taskId, taskName, {
            status: 'running',
            startTime: Date.now(),
            progress: 0,
          });

          try {
            const steps = Math.max(5, Math.floor(duration / 200));

            for (let i = 0; i <= steps; i++) {
              try {
                const progress = (i / steps) * 100;
                updateTask(taskId, { progress });

                // Simulate heavier processing
                await new Promise((resolve) =>
                  setTimeout(resolve, duration / steps)
                );
              } catch (_error) {
                addLog(
                  'longRunningTaskB',
                  'aborted',
                  `Task ${taskId} aborted at step ${i}/${steps}`
                );
                updateTask(taskId, {
                  status: 'aborted',
                  endTime: Date.now(),
                  progress: (i / steps) * 100,
                });
                return;
              }

              // Try to dispatch another action during execution (pipeline interaction test)
              if (i === Math.floor(steps / 2)) {
                addLog(
                  'longRunningTaskB',
                  'pipeline-interaction',
                  `Task ${taskId} dispatching secondary action at 50% progress`
                );

                // This tests if we can dispatch other actions while one is running
                try {
                  await dispatch('apiCallSecondary', {
                    endpoint: '/api/secondary',
                    params: { triggeredBy: taskId, step: i },
                  });
                } catch (err) {
                  addLog(
                    'longRunningTaskB',
                    'pipeline-interaction-failed',
                    `Secondary dispatch failed: ${err}`
                  );
                }
              }
            }

            addLog(
              'longRunningTaskB',
              'completed',
              `Task ${taskId} completed successfully`
            );
            updateTask(taskId, {
              status: 'completed',
              endTime: Date.now(),
              progress: 100,
              result: `Task B completed in ${duration}ms with pipeline interaction`,
            });
          } catch (error) {
            addLog(
              'longRunningTaskB',
              'failed',
              `Task ${taskId} failed: ${error}`
            );
            updateTask(taskId, {
              status: 'failed',
              endTime: Date.now(),
              error: String(error),
            });
          }
        }
      )
    );

    // Long running task C handler
    unregisterFunctions.push(
      register.register(
        'longRunningTaskC',
        async ({ taskId, duration }, controller) => {
          const taskName = `Task C (${duration}ms)`;
          addLog(
            'longRunningTaskC',
            'started',
            `Task ID: ${taskId}, Duration: ${duration}ms`
          );

          createOrUpdateTask(taskId, taskName, {
            status: 'running',
            startTime: Date.now(),
            progress: 0,
          });

          try {
            const steps = Math.max(20, Math.floor(duration / 50));

            for (let i = 0; i <= steps; i++) {
              try {
                const progress = (i / steps) * 100;
                updateTask(taskId, { progress });

                await new Promise((resolve) =>
                  setTimeout(resolve, duration / steps)
                );
              } catch (_error) {
                addLog(
                  'longRunningTaskC',
                  'aborted',
                  `Task ${taskId} aborted at step ${i}/${steps}`
                );
                updateTask(taskId, {
                  status: 'aborted',
                  endTime: Date.now(),
                  progress: (i / steps) * 100,
                });
                return;
              }
            }

            addLog(
              'longRunningTaskC',
              'completed',
              `Task ${taskId} completed successfully`
            );
            updateTask(taskId, {
              status: 'completed',
              endTime: Date.now(),
              progress: 100,
              result: `Task C completed in ${duration}ms`,
            });
          } catch (error) {
            addLog(
              'longRunningTaskC',
              'failed',
              `Task ${taskId} failed: ${error}`
            );
            updateTask(taskId, {
              status: 'failed',
              endTime: Date.now(),
              error: String(error),
            });
          }
        }
      )
    );

    // API call handlers for pipeline interaction testing
    unregisterFunctions.push(
      register.register('apiCallSecondary', async ({ endpoint, params }) => {
        addLog(
          'apiCallSecondary',
          'started',
          `Calling ${endpoint} with params: ${JSON.stringify(params)}`
        );

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 100));

        addLog(
          'apiCallSecondary',
          'completed',
          `API call to ${endpoint} completed`
        );
      })
    );

    // Background job handler
    unregisterFunctions.push(
      register.register(
        'backgroundJob',
        async ({ jobId, jobType, priority }, controller) => {
          const taskName = `Background Job (${jobType}, Priority: ${priority})`;
          addLog(
            'backgroundJob',
            'started',
            `Job ID: ${jobId}, Type: ${jobType}, Priority: ${priority}`
          );

          createOrUpdateTask(jobId, taskName, {
            status: 'running',
            startTime: Date.now(),
            progress: 0,
          });

          try {
            const duration = 1000 + priority * 500; // Higher priority = longer duration
            const steps = 10;

            for (let i = 0; i <= steps; i++) {
              try {
                const progress = (i / steps) * 100;
                updateTask(jobId, { progress });

                await new Promise((resolve) =>
                  setTimeout(resolve, duration / steps)
                );
              } catch (_error) {
                addLog(
                  'backgroundJob',
                  'aborted',
                  `Job ${jobId} aborted at step ${i}/${steps}`
                );
                updateTask(jobId, {
                  status: 'aborted',
                  endTime: Date.now(),
                  progress: (i / steps) * 100,
                });
                return;
              }
            }

            addLog('backgroundJob', 'completed', `Job ${jobId} completed`);
            updateTask(jobId, {
              status: 'completed',
              endTime: Date.now(),
              progress: 100,
              result: `Background job ${jobType} completed`,
            });
          } catch (error) {
            addLog('backgroundJob', 'failed', `Job ${jobId} failed: ${error}`);
            updateTask(jobId, {
              status: 'failed',
              endTime: Date.now(),
              error: String(error),
            });
          }
        }
      )
    );

    return () => {
      unregisterFunctions.forEach((unregister) => unregister());
    };
  }, [register]);

  // Action execution functions
  const runSingleTask = async (taskType: 'A' | 'B' | 'C', duration: number) => {
    const taskId = `task-${taskType.toLowerCase()}-${Date.now()}`;
    const actionMap = {
      A: 'longRunningTaskA',
      B: 'longRunningTaskB',
      C: 'longRunningTaskC',
    } as const;

    addLog(
      actionMap[taskType],
      'dispatched',
      `Dispatching ${taskType} with duration ${duration}ms`
    );

    try {
      await dispatch(actionMap[taskType], { taskId, duration });
    } catch (error) {
      addLog(
        actionMap[taskType],
        'dispatch-error',
        `Failed to dispatch: ${error}`
      );
    }
  };

  const runMultipleTasks = async () => {
    const timestamp = Date.now();
    addLog(
      'multiple-tasks',
      'started',
      'Starting concurrent execution of tasks A, B, and C'
    );

    // Reset abort scope for new batch
    resetAbortScope();

    // Dispatch all three tasks concurrently
    const promises = [
      dispatch('longRunningTaskA', {
        taskId: `concurrent-a-${timestamp}`,
        duration: 2000,
      }),
      dispatch('longRunningTaskB', {
        taskId: `concurrent-b-${timestamp}`,
        duration: 3000,
      }),
      dispatch('longRunningTaskC', {
        taskId: `concurrent-c-${timestamp}`,
        duration: 1500,
      }),
    ];

    try {
      await Promise.all(promises);
      addLog('multiple-tasks', 'completed', 'All concurrent tasks completed');
    } catch (error) {
      addLog('multiple-tasks', 'error', `Concurrent execution error: ${error}`);
    }
  };

  const runPipelineInteractionTest = async () => {
    const timestamp = Date.now();
    addLog('pipeline-test', 'started', 'Testing pipeline interactions');

    // Start a background job
    const backgroundPromise = dispatch('backgroundJob', {
      jobId: `bg-job-${timestamp}`,
      jobType: 'data-processing',
      priority: 2,
    });

    // Wait a bit then start Task B which will trigger secondary actions
    setTimeout(() => {
      dispatch('longRunningTaskB', {
        taskId: `pipeline-test-${timestamp}`,
        duration: 2000,
      });
    }, 500);

    try {
      await backgroundPromise;
    } catch (error) {
      addLog('pipeline-test', 'error', `Pipeline test error: ${error}`);
    }
  };

  const abortAllTasks = () => {
    const runningTasks = tasks.filter((task) => task.status === 'running');
    addLog(
      'abort',
      'triggered',
      `Aborting ${runningTasks.length} running tasks`
    );

    abortAll();
    setGlobalAbortCount((prev) => prev + 1);
  };

  const resetAbortScopeHandler = () => {
    addLog(
      'abort-scope',
      'reset',
      'Creating new abort scope for future actions'
    );
    resetAbortScope();
  };

  const clearLogs = () => {
    setExecutionLogs([]);
    setTasks([]);
  };

  // Statistics
  const runningTasks = tasks.filter((task) => task.status === 'running');
  const completedTasks = tasks.filter((task) => task.status === 'completed');
  const abortedTasks = tasks.filter((task) => task.status === 'aborted');
  const failedTasks = tasks.filter((task) => task.status === 'failed');

  return (
    <div className="concurrent-action-test-page">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-gray-900">
            Concurrent Action Test
          </h1>
          <p className="mt-2 text-gray-600">
            Test simultaneous action execution, abort functionality, and
            pipeline interactions
          </p>
        </header>

        {/* Control Panel */}
        <Card title="Control Panel">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Button onClick={() => runSingleTask('A', 2000)} variant="primary">
              Run Task A (2s)
            </Button>
            <Button onClick={() => runSingleTask('B', 3000)} variant="primary">
              Run Task B (3s)
            </Button>
            <Button onClick={() => runSingleTask('C', 1500)} variant="primary">
              Run Task C (1.5s)
            </Button>
            <Button onClick={runMultipleTasks} variant="success">
              Run All Concurrent
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Button onClick={runPipelineInteractionTest} variant="secondary">
              Pipeline Interaction Test
            </Button>
            <Button
              onClick={abortAllTasks}
              variant="danger"
              disabled={runningTasks.length === 0}
            >
              Abort All ({runningTasks.length})
            </Button>
            <Button onClick={resetAbortScopeHandler} variant="warning">
              Reset Abort Scope
            </Button>
            <Button onClick={clearLogs} variant="secondary">
              Clear Logs
            </Button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-blue-600">
                {runningTasks.length}
              </div>
              <div className="text-gray-500">Running</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-600">
                {completedTasks.length}
              </div>
              <div className="text-gray-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-yellow-600">
                {abortedTasks.length}
              </div>
              <div className="text-gray-500">Aborted</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-red-600">
                {failedTasks.length}
              </div>
              <div className="text-gray-500">Failed</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-purple-600">
                {globalAbortCount}
              </div>
              <div className="text-gray-500">Global Aborts</div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Task Status */}
          <Card title="Task Status">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {tasks.length === 0 ? (
                <p className="text-gray-500">No tasks running</p>
              ) : (
                tasks
                  .slice(-10)
                  .reverse()
                  .map((task) => (
                    <div
                      key={task.id}
                      className="border rounded-lg p-3 bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-sm">{task.name}</h4>
                          <p className="text-xs text-gray-500">ID: {task.id}</p>
                        </div>
                        <Status
                          status={
                            task.status === 'completed'
                              ? 'safe'
                              : task.status === 'running'
                                ? 'warning'
                                : task.status === 'aborted'
                                  ? 'danger'
                                  : task.status === 'failed'
                                    ? 'danger'
                                    : 'neutral'
                          }
                        >
                          {task.status}
                        </Status>
                      </div>

                      {task.status === 'running' && (
                        <div className="mb-2">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{Math.round(task.progress)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {task.result && (
                        <p className="text-xs text-green-600 mt-2">
                          {task.result}
                        </p>
                      )}

                      {task.error && (
                        <p className="text-xs text-red-600 mt-2">
                          {task.error}
                        </p>
                      )}

                      {task.startTime && task.endTime && (
                        <p className="text-xs text-gray-500 mt-2">
                          Duration: {task.endTime - task.startTime}ms
                        </p>
                      )}
                    </div>
                  ))
              )}
            </div>
          </Card>

          {/* Execution Logs */}
          <Card title="Execution Logs">
            <div className="space-y-1 max-h-96 overflow-y-auto font-mono text-xs">
              {executionLogs.length === 0 ? (
                <p className="text-gray-500">No logs available</p>
              ) : (
                executionLogs
                  .slice(-20)
                  .reverse()
                  .map((log, index) => (
                    <div
                      key={`${log.timestamp}-${index}`}
                      className="border-l-2 border-gray-200 pl-3 py-1"
                    >
                      <div className="flex justify-between items-start">
                        <span
                          className={`font-medium ${
                            log.event.includes('completed')
                              ? 'text-green-600'
                              : log.event.includes('aborted')
                                ? 'text-yellow-600'
                                : log.event.includes('failed') ||
                                    log.event.includes('error')
                                  ? 'text-red-600'
                                  : log.event.includes('started')
                                    ? 'text-blue-600'
                                    : 'text-gray-600'
                          }`}
                        >
                          {log.action}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-gray-600">
                        <strong>{log.event}:</strong> {log.details}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </Card>
        </div>

        {/* Test Information */}
        <Card title="Test Information">
          <div className="prose prose-sm max-w-none">
            <h4>What this test demonstrates:</h4>
            <ul>
              <li>
                <strong>Concurrent Execution:</strong> Multiple actions with
                different names running simultaneously
              </li>
              <li>
                <strong>Abort Functionality:</strong> Individual and bulk
                abortion of running actions
              </li>
              <li>
                <strong>Pipeline Interactions:</strong> Actions dispatching
                other actions during execution
              </li>
              <li>
                <strong>Progress Tracking:</strong> Real-time progress updates
                and status monitoring
              </li>
              <li>
                <strong>Error Handling:</strong> Graceful handling of failures
                and aborts
              </li>
              <li>
                <strong>Scope Management:</strong> resetAbortScope() creates new
                abort contexts
              </li>
            </ul>

            <h4>Key Insights:</h4>
            <ul>
              <li>
                Actions with different names can run concurrently without
                interference
              </li>
              <li>abortAll() affects all actions in the current abort scope</li>
              <li>resetAbortScope() creates a new scope for future actions</li>
              <li>
                Actions can dispatch other actions during their execution (Task
                B → API Secondary)
              </li>
              <li>
                Individual action progress and lifecycle can be tracked
                independently
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function ConcurrentActionTestPageWithProvider() {
  return (
    <ActionProvider>
      <ConcurrentActionTestPage />
    </ActionProvider>
  );
}
