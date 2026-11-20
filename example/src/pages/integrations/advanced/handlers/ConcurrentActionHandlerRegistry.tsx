import React from 'react';
import type { TaskStatus } from '../contexts/ConcurrentActionsContexts';
import { useConcurrentActionHandler } from '../contexts/ConcurrentActionsContexts';

type ConcurrentActionHandlerProps = {
  readonly updateTaskProgress: (taskId: string, progress: number) => void;
  readonly updateTaskStatus: (
    taskId: string,
    status: TaskStatus['status'],
    error?: string
  ) => void;
  readonly addNetworkTask: (taskId: string, name: string) => void;
  readonly addBackgroundTask: (taskId: string, name: string) => void;
  readonly children: React.ReactNode;
};

type ProgressTaskPayload = {
  taskId: string;
  duration: number;
  abortController?: AbortController;
};

type HandlerController = {
  signal?: AbortSignal;
};

let taskSequence = 0;
function nextTaskId(prefix: string): string {
  taskSequence += 1;
  return `${prefix}-${Date.now()}-${taskSequence}`;
}

export function waitAbortable(
  delayMs: number,
  signal: AbortSignal | undefined,
  abortMessage: string
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error(abortMessage));
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    const abortHandler = () => {
      clearTimeout(timeoutId);
      reject(new Error(abortMessage));
    };

    timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', abortHandler);
      resolve();
    }, delayMs);

    signal?.addEventListener('abort', abortHandler, { once: true });
  });
}

async function runProgressTask(
  payload: ProgressTaskPayload,
  controller: HandlerController,
  steps: number,
  jitter: number,
  callbacks: Pick<
    ConcurrentActionHandlerProps,
    'updateTaskProgress' | 'updateTaskStatus'
  >
): Promise<void> {
  const activeController = payload.abortController ?? controller;

  try {
    for (let index = 1; index <= steps; index += 1) {
      if (activeController.signal?.aborted) {
        callbacks.updateTaskStatus(
          payload.taskId,
          'aborted',
          'Task was aborted'
        );
        return;
      }

      const stepDelay = payload.duration / steps + Math.random() * jitter;
      await waitAbortable(
        stepDelay,
        activeController.signal,
        'Task was aborted'
      );

      if (activeController.signal?.aborted) {
        callbacks.updateTaskStatus(
          payload.taskId,
          'aborted',
          'Task was aborted'
        );
        return;
      }

      const progress = Math.round((index / steps) * 100);
      callbacks.updateTaskProgress(payload.taskId, progress);
      if (progress === 100) {
        callbacks.updateTaskStatus(payload.taskId, 'completed');
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('aborted')) {
      callbacks.updateTaskStatus(payload.taskId, 'aborted', 'Task was aborted');
      return;
    }
    callbacks.updateTaskStatus(
      payload.taskId,
      'failed',
      error instanceof Error ? error.message : 'Unknown error'
    );
    throw error;
  }
}

function useProgressTaskHandler(
  steps: number,
  jitter: number,
  callbacks: Pick<
    ConcurrentActionHandlerProps,
    'updateTaskProgress' | 'updateTaskStatus'
  >
) {
  return React.useCallback(
    (payload: ProgressTaskPayload, controller: HandlerController) =>
      runProgressTask(payload, controller, steps, jitter, callbacks),
    [callbacks, jitter, steps]
  );
}

export function ConcurrentActionHandlerRegistry({
  updateTaskProgress,
  updateTaskStatus,
  addNetworkTask,
  addBackgroundTask,
  children,
}: ConcurrentActionHandlerProps) {
  const callbacks = React.useMemo(
    () => ({ updateTaskProgress, updateTaskStatus }),
    [updateTaskProgress, updateTaskStatus]
  );
  const taskAHandler = useProgressTaskHandler(40, 50, callbacks);
  const taskBHandler = useProgressTaskHandler(30, 80, callbacks);
  const quickTaskHandler = useProgressTaskHandler(10, 0, callbacks);

  useConcurrentActionHandler('longRunningTaskA', taskAHandler);
  useConcurrentActionHandler('longRunningTaskB', taskBHandler);
  useConcurrentActionHandler('quickTask', quickTaskHandler);

  useConcurrentActionHandler(
    'networkRequest',
    React.useCallback(
      async ({ endpoint, params }, controller) => {
        const taskId = nextTaskId('network');
        addNetworkTask(taskId, 'networkRequest');

        try {
          for (let index = 1; index <= 10; index += 1) {
            if (controller.signal?.aborted) {
              throw new Error('Network request was aborted');
            }
            await waitAbortable(
              100,
              controller.signal,
              'Network request was aborted'
            );
            if (controller.signal?.aborted) {
              throw new Error('Network request was aborted');
            }
            const progress = Math.round((index / 10) * 100);
            updateTaskProgress(taskId, progress);
            if (progress === 100) updateTaskStatus(taskId, 'completed');
          }
        } catch (error) {
          updateTaskStatus(
            taskId,
            'aborted',
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
        void endpoint;
        void params;
      },
      [addNetworkTask, updateTaskProgress, updateTaskStatus]
    )
  );

  useConcurrentActionHandler(
    'backgroundJob',
    React.useCallback(
      async ({ jobId, jobType, priority }, controller) => {
        const taskId = nextTaskId('job');
        addBackgroundTask(taskId, 'backgroundJob');

        try {
          for (let index = 1; index <= 25; index += 1) {
            if (controller.signal?.aborted) {
              throw new Error('Background job was aborted');
            }
            await waitAbortable(
              80,
              controller.signal,
              'Background job was aborted'
            );
            if (controller.signal?.aborted) {
              throw new Error('Background job was aborted');
            }
            const progress = Math.round((index / 25) * 100);
            updateTaskProgress(taskId, progress);
            if (progress === 100) updateTaskStatus(taskId, 'completed');
          }
        } catch (error) {
          updateTaskStatus(
            taskId,
            'aborted',
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
        void jobId;
        void jobType;
        void priority;
      },
      [addBackgroundTask, updateTaskProgress, updateTaskStatus]
    )
  );

  return <>{children}</>;
}
