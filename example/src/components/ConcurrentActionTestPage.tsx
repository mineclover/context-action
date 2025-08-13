/**
 * Concurrent Action Test Page - Simplified
 *
 * Tests simultaneous action execution, abort functionality, and pipeline behavior
 * when multiple actions with different names are running concurrently.
 */

import { createActionContext } from '@context-action/react';
import { useState } from 'react';
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
}

export function ConcurrentActionTestPage() {
  const [tasks, setTasks] = useState<TaskStatus[]>([]);

  const dispatch = useActionDispatch();
  const { abortAll, resetAbortScope } = useActionDispatchWithResult();

  // Register simplified action handlers
  useActionHandler('longRunningTaskA', async ({ taskId, duration }) => {
    // Simulate long running task
    for (let i = 0; i <= 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, duration / 10));
    }
    // Don't return anything (void)
  });

  useActionHandler('longRunningTaskB', async ({ taskId, duration }) => {
    // Simulate long running task
    for (let i = 0; i <= 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, duration / 10));
    }
    // Don't return anything (void)
  });

  useActionHandler('quickTask', async ({ taskId, duration }) => {
    await new Promise((resolve) => setTimeout(resolve, duration));
    // Don't return anything (void)
  });

  useActionHandler('networkRequest', async ({ endpoint, params }) => {
    // Simulate network request
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Don't return anything (void)
  });

  useActionHandler('backgroundJob', async ({ jobId, jobType, priority }) => {
    // Simulate background job
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // Don't return anything (void)
  });

  const startTask = async (taskType: string, duration: number) => {
    const taskId = `task-${Date.now()}`;

    setTasks((prev) => [
      ...prev,
      {
        id: taskId,
        name: taskType,
        status: 'running',
        progress: 0,
        startTime: Date.now(),
      },
    ]);

    try {
      await dispatch(
        taskType as keyof AppActions,
        { taskId, duration: duration } as any
      );

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: 'completed',
                progress: 100,
                endTime: Date.now(),
              }
            : task
        )
      );
    } catch (error) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
              }
            : task
        )
      );
    }
  };

  return (
    <ActionProvider>
      <div className="space-y-6">
        <Card>
          <h2 className="text-xl font-bold mb-4">Concurrent Action Tests</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <Button onClick={() => startTask('longRunningTaskA', 3000)}>
              Start Task A (3s)
            </Button>
            <Button onClick={() => startTask('longRunningTaskB', 2000)}>
              Start Task B (2s)
            </Button>
            <Button onClick={() => startTask('quickTask', 500)}>
              Quick Task (0.5s)
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
              Network Request
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
              Background Job
            </Button>
            <Button onClick={abortAll} variant="danger">
              Abort All
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Running Tasks:</h3>
            {tasks.length === 0 ? (
              <p className="text-gray-500">No tasks running</p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <span>
                    {task.name} ({task.id})
                  </span>
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
                  />
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </ActionProvider>
  );
}

export default ConcurrentActionTestPage;
