import { createActionContext } from '@context-action/react';
import type { AppActions } from '@/types/actions';

export type TaskStatus = {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'aborted' | 'failed';
  progress: number;
  startTime?: number;
  endTime?: number;
  result?: unknown;
  error?: string;
  estimatedDuration?: number;
  actualDuration?: number;
};

export const {
  Provider: ConcurrentActionsProvider,
  useActionDispatch: useConcurrentAction,
  useActionDispatchWithResult: useConcurrentActionWithResult,
  useActionHandler: useConcurrentActionHandler,
} = createActionContext<AppActions>('ConcurrentActionTest');
