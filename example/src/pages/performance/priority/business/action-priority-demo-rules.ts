import type {
  ActionPriorityDemoHandlerResult,
  ActionPriorityDemoStores,
} from '../contexts/ActionPriorityDemoContexts';

export function appendExecutionResult(
  results: ActionPriorityDemoStores['executionResults'],
  result: ActionPriorityDemoHandlerResult
): ActionPriorityDemoStores['executionResults'] {
  return [...results, result];
}

export function resetExecutionResults(): ActionPriorityDemoStores['executionResults'] {
  return [];
}

export function isValidCredentials(
  username: string,
  password: string
): boolean {
  return username === 'admin' && password === 'password';
}

export function createHandlerResult(input: {
  id: string;
  priority: number;
  step: string;
  result: unknown;
  startedAt: number;
  finishedAt: number;
}): ActionPriorityDemoHandlerResult {
  return {
    id: input.id,
    priority: input.priority,
    step: input.step,
    result: input.result,
    timestamp: input.finishedAt,
    duration: input.finishedAt - input.startedAt,
  };
}
