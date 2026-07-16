import type {
  ToolCallMode,
  ToolPolicyDecision,
  ToolPolicyInput,
} from '@context-action/react';

export type PendingToolApproval = {
  id: string;
  sessionId?: string;
  name: string;
  description: string;
  source: string;
  mode?: ToolCallMode;
  argumentKeys: string[];
  safeArgumentPreview?: string;
  createdAt: number;
};

type ApprovalDecision = Extract<ToolPolicyDecision, 'allow' | 'deny'>;

let sequence = 0;
let pending: PendingToolApproval[] = [];
const resolvers = new Map<string, (decision: ApprovalDecision) => void>();
const listeners = new Set<() => void>();
const safeArgumentNames = new Set(['path', 'theme']);

function buildSafeArgumentPreview(
  argumentsValue: Record<string, unknown> | undefined
): string | undefined {
  const entries = Object.entries(argumentsValue ?? {}).filter(
    ([name, value]) =>
      safeArgumentNames.has(name) &&
      (typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean')
  );
  if (!entries.length) return undefined;
  return entries
    .map(([name, value]) => `${name}: ${String(value).slice(0, 120)}`)
    .join(' · ');
}

function notify(): void {
  for (const listener of listeners) listener();
}

export function requestToolApproval(
  input: ToolPolicyInput
): Promise<ApprovalDecision> {
  if (input.signal?.aborted) return Promise.resolve('deny');
  const baseId = String(
    input.request.id ?? `approval-${Date.now()}-${sequence++}`
  );
  const id = pending.some((request) => request.id === baseId)
    ? `${baseId}-${sequence++}`
    : baseId;
  const approval: PendingToolApproval = {
    id,
    ...(input.context?.sessionId ? { sessionId: input.context.sessionId } : {}),
    name: input.request.params.name,
    description: input.definition.description ?? 'No description provided.',
    source: input.context?.source ?? 'model',
    ...(input.context?.mode ? { mode: input.context.mode } : {}),
    argumentKeys: Object.keys(input.request.params.arguments ?? {}),
    safeArgumentPreview: buildSafeArgumentPreview(
      input.request.params.arguments
    ),
    createdAt: Date.now(),
  };

  return new Promise((resolve) => {
    let abortHandler: (() => void) | undefined;
    const settle = (decision: ApprovalDecision) => {
      if (abortHandler && input.signal) {
        input.signal.removeEventListener('abort', abortHandler);
      }
      resolve(decision);
    };
    pending = [approval, ...pending];
    resolvers.set(id, settle);
    if (input.signal) {
      abortHandler = () => resolveToolApproval(id, 'deny');
      input.signal.addEventListener('abort', abortHandler, { once: true });
      if (input.signal.aborted) abortHandler();
    }
    notify();
  });
}

export function resolveToolApproval(
  id: string,
  decision: ApprovalDecision
): void {
  const resolver = resolvers.get(id);
  if (!resolver) return;
  resolvers.delete(id);
  pending = pending.filter((request) => request.id !== id);
  notify();
  resolver(decision);
}

export function denyPendingToolApprovals(): void {
  for (const request of [...pending]) {
    resolveToolApproval(request.id, 'deny');
  }
}

export const toolApprovalStore = {
  getSnapshot: (): PendingToolApproval[] => pending,
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
