import { createToolApprovalQueue } from '@context-action/core';
import type {
  ToolApprovalSnapshot,
  ToolPolicyDecision,
  ToolPolicyInput,
} from '@context-action/react';

export type PendingToolApproval = ToolApprovalSnapshot;

type ApprovalDecision = Extract<ToolPolicyDecision, 'allow' | 'deny'>;

const approvalQueue = createToolApprovalQueue({
  idPrefix: 'approval',
  safeArgumentNames: ['path', 'theme'],
});

export function requestToolApproval(
  input: ToolPolicyInput
): Promise<ApprovalDecision> {
  return approvalQueue.request(input);
}

export function resolveToolApproval(
  id: string,
  decision: ApprovalDecision
): void {
  approvalQueue.resolve(id, decision);
}

export function denyPendingToolApprovals(): void {
  approvalQueue.denyAll();
}

export const toolApprovalStore = approvalQueue.store;
