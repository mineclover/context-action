import type { RefObject } from 'react';
import type { EditorMessage } from '../hooks/use-tool-execution';
import type { ToolCall } from '../local-agent-plan';
import type { PendingToolApproval } from '../tool-approval';

export type AgentChatPanelProps = {
  agentMode: 'local' | 'openrouter';
  pendingApprovals: readonly PendingToolApproval[];
  messages: readonly EditorMessage[];
  messageListRef: RefObject<HTMLDivElement | null>;
  firstApprovalButtonRef: RefObject<HTMLButtonElement | null>;
  running: boolean;
  executionStatusLabel: string;
  prompt: string;
  isStorageReady: boolean;
  formatSessionId: (id: string) => string;
  onResolveApproval: (id: string, decision: 'allow' | 'deny') => void;
  onExecutePrompt: (value: string) => void | Promise<void>;
  onExecuteQuickTool: (call: ToolCall) => Promise<unknown>;
  onReconnectFolder: () => void;
  onGrantFolderAccess: () => void;
  onRefreshPreview: () => void;
  onOpenSettings: () => void;
  onPromptChange: (value: string) => void;
  onCancel: () => void;
};

export function AgentChatPanel({
  agentMode,
  pendingApprovals,
  messages,
  messageListRef,
  firstApprovalButtonRef,
  running,
  executionStatusLabel,
  prompt,
  isStorageReady,
  formatSessionId,
  onResolveApproval,
  onExecutePrompt,
  onExecuteQuickTool,
  onReconnectFolder,
  onGrantFolderAccess,
  onRefreshPreview,
  onOpenSettings,
  onPromptChange,
  onCancel,
}: AgentChatPanelProps) {
  return (
    <section className="chat-panel">
      <div className="chat-heading">
        <div>
          <span className="panel-label">Agent</span>
          <strong>What should we change?</strong>
        </div>
        <span className="agent-badge">
          {agentMode === 'openrouter'
            ? 'OPENROUTER / TOOL CALLING'
            : 'LOCAL / TOOL CALLING'}
        </span>
      </div>
      {pendingApprovals.length ? (
        <section
          aria-label="Pending tool approvals"
          aria-live="assertive"
          className="approval-panel"
          role="region"
        >
          <div className="approval-heading">
            <span className="approval-dot" />
            <strong>Approval required</strong>
            <span>{pendingApprovals.length}</span>
          </div>
          {pendingApprovals.map((approval) => (
            <div className="approval-request" key={approval.id}>
              <strong>{approval.name}</strong>
              <p>{approval.description}</p>
              <small>
                {approval.toolCallId !== undefined
                  ? `call ${String(approval.toolCallId)} · `
                  : ''}
                {approval.argumentKeys.length
                  ? `arguments · ${approval.argumentKeys.join(', ')}`
                  : 'no arguments'}{' '}
                · {approval.source}
                {approval.mode ? ` · mode ${approval.mode}` : ''}
                {approval.sessionId
                  ? ` · session ${formatSessionId(approval.sessionId)}`
                  : ''}
              </small>
              {approval.safeArgumentPreview ? (
                <code className="approval-argument-preview">
                  {approval.safeArgumentPreview}
                </code>
              ) : null}
              <div className="approval-actions">
                <button
                  aria-label={`Deny ${approval.name}`}
                  className="approval-deny"
                  onClick={() => onResolveApproval(approval.id, 'deny')}
                  type="button"
                >
                  Deny
                </button>
                <button
                  aria-label={`Approve ${approval.name}`}
                  className="approval-allow"
                  ref={
                    approval.id === pendingApprovals[0]?.id
                      ? firstApprovalButtonRef
                      : undefined
                  }
                  onClick={() => onResolveApproval(approval.id, 'allow')}
                  type="button"
                >
                  Approve
                </button>
              </div>
            </div>
          ))}
        </section>
      ) : null}
      <div
        aria-label="Agent conversation"
        aria-live="polite"
        className="message-list"
        ref={messageListRef}
        role="log"
      >
        {messages.map((message, index) => (
          <div
            className={`message message-${message.role}${message.tone ? ` message-${message.tone}` : ''}`}
            key={`${message.role}-${index}`}
          >
            <span className="message-avatar">
              {message.role === 'assistant' ? '✦' : 'You'}
            </span>
            <div>
              <p>{message.text}</p>
              {message.tools?.length ? (
                <div className="message-tools">
                  {message.tools.map((tool, toolIndex) => (
                    <span key={`${tool}-${toolIndex}`}>{tool}</span>
                  ))}
                </div>
              ) : null}
              {!running && (message.retryPrompt || message.retryTool) ? (
                <button
                  className="message-retry"
                  onClick={() => {
                    if (message.retryPrompt) {
                      void onExecutePrompt(message.retryPrompt);
                    } else if (message.retryTool) {
                      void onExecuteQuickTool(message.retryTool);
                    }
                  }}
                  type="button"
                >
                  {message.retryLabel ?? 'Retry'}
                </button>
              ) : null}
              {!running && message.folderAction === 'reconnect' ? (
                <button
                  className="message-reconnect"
                  onClick={() => void onReconnectFolder()}
                  type="button"
                >
                  Reconnect folder
                </button>
              ) : null}
              {!running && message.folderAction === 'grant' ? (
                <button
                  className="message-reconnect"
                  onClick={() => void onGrantFolderAccess()}
                  type="button"
                >
                  Grant folder access
                </button>
              ) : null}
              {!running && message.previewAction ? (
                <button
                  className="message-reconnect"
                  onClick={onRefreshPreview}
                  type="button"
                >
                  Refresh preview
                </button>
              ) : null}
              {!running && message.openSettings ? (
                <button
                  className="message-settings"
                  onClick={() => onOpenSettings()}
                  type="button"
                >
                  Open provider settings
                </button>
              ) : null}
            </div>
          </div>
        ))}
        {running ? (
          <div aria-live="polite" className="running-line" role="status">
            <span className="pulse-dot" /> {executionStatusLabel}…
            {pendingApprovals.length ? (
              <span className="running-hint">Choose Approve or Deny above</span>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="composer-wrap">
        <textarea
          aria-label="Web studio prompt"
          disabled={!isStorageReady}
          onChange={(event) => onPromptChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void onExecutePrompt(prompt);
            }
          }}
          placeholder="Ask the local agent to change the page…"
          value={prompt}
        />
        <button
          aria-keyshortcuts={running ? 'Escape' : undefined}
          className={`send-button ${running ? 'send-button-cancel' : ''}`}
          disabled={!isStorageReady}
          onClick={() => (running ? onCancel() : void onExecutePrompt(prompt))}
          title={
            running ? 'Cancel current agent execution (Escape)' : undefined
          }
          type="button"
        >
          {running ? 'Cancel' : 'Send'} <span>{running ? '×' : '↗'}</span>
        </button>
      </div>
      <div className="prompt-recipes-heading">Try a tool-chain recipe</div>
      <div aria-label="Tool-chain prompt recipes" className="prompt-chips">
        {[
          'Make it emerald',
          'Add a feature card',
          'Update the hero',
          'Show workspace status',
          'Create notes.md',
          'Rename index.html to landing.html',
          'Download current file',
          'Save to folder',
          'Reload folder',
          'Disconnect folder',
          'Reset demo workspace',
        ].map((example) => (
          <button
            disabled={!isStorageReady || running}
            key={example}
            onClick={() => onPromptChange(example)}
            type="button"
          >
            {example}
          </button>
        ))}
      </div>
    </section>
  );
}
