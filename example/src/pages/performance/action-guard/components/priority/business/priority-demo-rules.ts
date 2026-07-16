export interface PriorityWordPayload {
  priority: number;
  word: string;
}

export interface RegisteredPriorityAction extends PriorityWordPayload {
  registered: boolean;
}

export type PriorityExecutionStatusValue =
  | 'registered'
  | 'executing'
  | 'completed';

export interface PriorityExecutionStatus extends PriorityWordPayload {
  status: PriorityExecutionStatusValue;
}

export const priorityWords = {
  1: 'Hello',
  2: 'Beautiful',
  3: 'World',
  4: 'from',
  5: 'Context-Action!',
} as const;

export function createInitialRegisteredActions(): RegisteredPriorityAction[] {
  return [];
}

export function createInitialExecutionStatus(): PriorityExecutionStatus[] {
  return [];
}

export function registerPriorityAction(
  actions: RegisteredPriorityAction[],
  payload: PriorityWordPayload
): RegisteredPriorityAction[] {
  if (actions.some((action) => action.priority === payload.priority)) {
    return actions;
  }

  return [...actions, { ...payload, registered: true }].sort(
    (left, right) => left.priority - right.priority
  );
}

export function registerPriorityStatus(
  statuses: PriorityExecutionStatus[],
  payload: PriorityWordPayload
): PriorityExecutionStatus[] {
  if (statuses.some((status) => status.priority === payload.priority)) {
    return statuses;
  }

  return [...statuses, { ...payload, status: 'registered' as const }].sort(
    (left, right) => left.priority - right.priority
  );
}

export function markAllExecuting(
  statuses: PriorityExecutionStatus[]
): PriorityExecutionStatus[] {
  return statuses.map((status) => ({ ...status, status: 'executing' }));
}

export function markPriorityCompleted(
  statuses: PriorityExecutionStatus[],
  priority: number
): PriorityExecutionStatus[] {
  return statuses.map((status) =>
    status.priority === priority ? { ...status, status: 'completed' } : status
  );
}

export function appendPriorityResult(result: string, word: string): string {
  return result ? `${result} ${word}` : word;
}
