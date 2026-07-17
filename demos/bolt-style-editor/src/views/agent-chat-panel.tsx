import type { RefObject } from 'react';
import type {
  AgentExecutionOptions,
  EditorMessage,
} from '../hooks/use-tool-execution';
import type { ToolCall } from '../local-agent-plan';
import type { PendingToolApproval } from '../tool-approval';
import type { ToolChainRecipe } from '../tool-command-catalog';

export type AgentChatPanelProps = {
  agentMode: 'local' | 'openrouter';
  pendingApprovals: readonly PendingToolApproval[];
  messages: readonly EditorMessage[];
  messageListRef: RefObject<HTMLDivElement | null>;
  firstApprovalButtonRef: RefObject<HTMLButtonElement | null>;
  running: boolean;
  executionStatusLabel: string;
  prompt: string;
  promptRecipes: readonly ToolChainRecipe[];
  isStorageReady: boolean;
  formatSessionId: (id: string) => string;
  onResolveApproval: (id: string, decision: 'allow' | 'deny') => void;
  onExecutePrompt: (
    value: string,
    options?: AgentExecutionOptions
  ) => void | Promise<void>;
  onExecuteQuickTool: (call: ToolCall) => Promise<unknown>;
  onReconnectFolder: () => void;
  onGrantFolderAccess: () => void;
  onRefreshPreview: () => void;
  onOpenSettings: () => void;
  onOpenSimulation: () => void;
  onPromptChange: (value: string) => void;
  onCancel: () => void;
  onClose: () => void;
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
  promptRecipes,
  isStorageReady,
  formatSessionId,
  onResolveApproval,
  onExecutePrompt,
  onExecuteQuickTool,
  onReconnectFolder,
  onGrantFolderAccess,
  onRefreshPreview,
  onOpenSettings,
  onOpenSimulation,
  onPromptChange,
  onCancel,
  onClose,
}: AgentChatPanelProps) {
  return (
    <section
      aria-label="Agent chat panel"
      className="chat-panel chat-panel-floating"
      id="agent-chat-panel"
      role="region"
    >
      <div className="chat-heading">
        <div>
          <span className="panel-label">Agent</span>
          <strong>What should we change?</strong>
        </div>
        <div className="chat-heading-actions">
          <span className="agent-badge">
            {agentMode === 'openrouter'
              ? 'OPENROUTER / TOOL CALLING'
              : 'LOCAL / TOOL CALLING'}
          </span>
          <button
            aria-label="Open simulation reference"
            className="chat-reference-button"
            onClick={onOpenSimulation}
            type="button"
          >
            Reference
          </button>
          <button
            aria-label="Close agent chat"
            className="chat-close-button"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
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
              {!running && message.localRetryPrompt ? (
                <button
                  className="message-local-fallback"
                  onClick={() =>
                    void onExecutePrompt(message.localRetryPrompt!, {
                      forceLocal: true,
                    })
                  }
                  type="button"
                >
                  Use local agent &amp; retry
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
        {promptRecipes.map((recipe) => (
          <button
            aria-label={recipe.prompt}
            disabled={!isStorageReady || running}
            key={recipe.id}
            onClick={() => onPromptChange(recipe.prompt)}
            title={`${recipe.description} Chain: ${recipe.expectedChain.join(' → ')}`}
            type="button"
          >
            {recipe.title}
          </button>
        ))}
      </div>
    </section>
  );
}
