import type {
  ToolPolicyDecision,
  ToolPolicyInput,
} from '@context-action/react';

export type PendingToolApproval = {
  id: string;
  name: string;
  description: string;
  source: string;
  argumentKeys: string[];
  createdAt: number;
};

type ApprovalDecision = Extract<ToolPolicyDecision, 'allow' | 'deny'>;

let sequence = 0;
let pending: PendingToolApproval[] = [];
const resolvers = new Map<string, (decision: ApprovalDecision) => void>();
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

export function requestToolApproval(
  input: ToolPolicyInput
): Promise<ApprovalDecision> {
  const baseId = String(
    input.request.id ?? `approval-${Date.now()}-${sequence++}`
  );
  const id = pending.some((request) => request.id === baseId)
    ? `${baseId}-${sequence++}`
    : baseId;
  const approval: PendingToolApproval = {
    id,
    name: input.request.params.name,
    description: input.definition.description ?? 'No description provided.',
    source: input.context?.source ?? 'model',
    argumentKeys: Object.keys(input.request.params.arguments ?? {}),
    createdAt: Date.now(),
  };

  return new Promise((resolve) => {
    pending = [approval, ...pending];
    resolvers.set(id, resolve);
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
