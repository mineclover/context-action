import type {
  ToolApprovalSnapshot,
  ToolCallId,
} from '@context-action/tool-protocol';
import type { RefObject } from 'react';
import styles from './LiveCodeEditorPage.module.css';

function formatCallId(value: ToolCallId | undefined): string {
  return value === undefined ? 'pending' : String(value);
}

export function LiveEditorToolApprovalDialog({
  approval,
  pendingCount,
  cancelRef,
  onResolve,
}: {
  approval: ToolApprovalSnapshot;
  pendingCount: number;
  cancelRef: RefObject<HTMLButtonElement | null>;
  onResolve: (decision: 'allow' | 'deny') => void;
}) {
  return (
    <div className={styles.dialogBackdrop} role="presentation">
      <div
        className={styles.confirmationDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="live-editor-tool-approval-title"
        aria-describedby="live-editor-tool-approval-description"
      >
        <span className={styles.dialogEyebrow}>Tool approval required</span>
        <h2 id="live-editor-tool-approval-title">Allow {approval.name}?</h2>
        <p id="live-editor-tool-approval-description">
          This model call will write to the user-opened local folder. The
          approval surface never displays file source content.
        </p>
        <div className={styles.approvalMetadata}>
          <span>call {formatCallId(approval.toolCallId)}</span>
          <span>
            {approval.source} · {approval.mode ?? 'agent'}
          </span>
          <span>
            {approval.argumentKeys.length
              ? `arguments · ${approval.argumentKeys.join(', ')}`
              : 'no arguments'}
          </span>
          {approval.safeArgumentPreview ? (
            <code>{approval.safeArgumentPreview}</code>
          ) : null}
        </div>
        {pendingCount > 1 ? (
          <p className={styles.approvalQueueNote}>
            {pendingCount - 1} more tool approval request
            {pendingCount === 2 ? '' : 's'} waiting.
          </p>
        ) : null}
        <div className={styles.dialogActions}>
          <button
            ref={cancelRef}
            type="button"
            className={styles.dialogSecondary}
            onClick={() => onResolve('deny')}
          >
            Deny
          </button>
          <button
            type="button"
            className={styles.dialogDanger}
            onClick={() => onResolve('allow')}
          >
            Approve write
          </button>
        </div>
      </div>
    </div>
  );
}
