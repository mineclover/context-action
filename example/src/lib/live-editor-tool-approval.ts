import { createToolApprovalQueue } from '@context-action/core';
import type {
  ToolApprovalSnapshot,
  ToolPolicyDecision,
  ToolPolicyInput,
} from '@context-action/react';

export type LiveEditorPendingToolApproval = ToolApprovalSnapshot;

type ApprovalDecision = Extract<ToolPolicyDecision, 'allow' | 'deny'>;

const approvalQueue = createToolApprovalQueue({
  idPrefix: 'live-editor-approval',
  safeArgumentNames: ['path'],
});

export function requestLiveEditorToolApproval(
  input: ToolPolicyInput
): Promise<ApprovalDecision> {
  return approvalQueue.request(input);
}

export function resolveLiveEditorToolApproval(
  id: string,
  decision: ApprovalDecision
): void {
  approvalQueue.resolve(id, decision);
}

export function denyAllLiveEditorToolApprovals(): void {
  approvalQueue.denyAll();
}

export const liveEditorToolApprovalStore = approvalQueue.store;
