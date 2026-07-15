import { createToolContext, type ToolRegistry } from '@context-action/react';
import {
  type KeyboardEvent,
  type ReactNode,
  type UIEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  buildFileTree,
  collectDirectoryPaths,
  type FileTreeEntry,
} from './file-tree';
import {
  type AgentRunResult,
  DEFAULT_OPENROUTER_SETTINGS,
  OpenRouterRequestError,
  type OpenRouterSettings,
  readOpenRouterSettings,
  runOpenRouterAgent,
  saveOpenRouterSettings,
} from './openrouter';
import {
  denyPendingToolApprovals,
  requestToolApproval,
  resolveToolApproval,
  toolApprovalStore,
} from './tool-approval';
import { type BoltStyleToolSchema, boltStyleToolSchema } from './tool-schema';
import {
  clearToolTrace,
  finishAgentTrace,
  recordToolCall,
  recordToolList,
  startAgentTrace,
  toolTraceStore,
} from './tool-trace';
import {
  BrowserWorkspace,
  buildPreviewDocument,
  findPreviewHtmlFile,
  findPreviewStylesheetFile,
  type PreviewBridgeMessage,
  type WorkspaceFile,
} from './workspace';
import {
  BrowserWorkspaceFileSystemAdapter,
  type ImportedFolder,
} from './workspace-filesystem';
import { WebCodingWorkspaceRepository } from './workspace-storage';

const {
  Provider: BoltStyleToolProvider,
  useToolHandler: useBoltStyleToolHandler,
  useToolRegistry: useBoltStyleToolRegistry,
} = createToolContext('BoltStyleWebEditor', {
  schema: boltStyleToolSchema,
  debug: true,
  onToolCall: recordToolCall,
  toolPolicy: ({ context, definition, request, signal }) => {
    const isPromptAgentCall = context?.metadata?.interaction === 'prompt';
    if (
      definition.annotations?.readOnlyHint === true ||
      (context?.source === 'local' && !isPromptAgentCall)
    ) {
      return 'allow';
    }
    return requestToolApproval({ request, definition, context, signal });
  },
});

type BoltStyleRegistry = ToolRegistry<BoltStyleToolSchema>;

type Message = {
  role: 'user' | 'assistant';
  text: string;
  tools?: string[];
  tone?: 'error' | 'cancelled';
  retryPrompt?: string;
  retryTool?: ToolCall;
};

type ToolCall = {
  name: string;
  arguments: Record<string, unknown>;
};

const revisionGuardedWorkspaceTools = new Set([
  'workspace.createFile',
  'workspace.deleteFile',
  'workspace.writeFile',
  'workspace.applyPatch',
  'workspace.revertFile',
]);

const localMutationToolNames = new Set([
  ...revisionGuardedWorkspaceTools,
  'workspace.saveAll',
  'workspace.disconnectFolder',
  'preview.setTheme',
  'preview.addFeature',
  'preview.updateHero',
]);

const localFileListingToolNames = new Set([
  'workspace.applyPatch',
  'workspace.deleteFile',
  'workspace.writeFile',
  'workspace.revertFile',
]);

const localTextInspectionToolNames = new Set([
  'workspace.applyPatch',
  'workspace.writeFile',
  'workspace.revertFile',
]);

type ToolExecutionOutcome = {
  ok: boolean;
  message?: string;
};

const themeTokens = {
  violet: { accent: '#8b5cf6', soft: '#f0eaff' },
  emerald: { accent: '#10b981', soft: '#e7fbf3' },
  amber: { accent: '#f59e0b', soft: '#fff5dc' },
  rose: { accent: '#f43f5e', soft: '#ffedf0' },
} as const;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character] ?? character;
  });
}

type SyntaxToken = {
  className?: string;
  value: string;
};

function pushPlainToken(tokens: SyntaxToken[], value: string) {
  if (value) tokens.push({ value });
}

function tokenizeHtmlTag(tag: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  let tagNameSeen = false;
  let cursor = 0;
  const parts = /(<\/?|\/?>|[A-Za-z][\w:-]*|=|"[^"\n]*"|'[^'\n]*')/g;
  let match = parts.exec(tag);

  while (match) {
    pushPlainToken(tokens, tag.slice(cursor, match.index));
    const value = match[0];
    const className =
      value.startsWith('"') || value.startsWith("'")
        ? 'syntax-string'
        : value.startsWith('<') || value.endsWith('>')
          ? 'syntax-tag'
          : !tagNameSeen && value !== '=' && !value.startsWith('/')
            ? 'syntax-tag'
            : value === '='
              ? undefined
              : 'syntax-attribute';
    if (className === 'syntax-tag' && /^[A-Za-z]/.test(value)) {
      tagNameSeen = true;
    }
    tokens.push({ className, value });
    cursor = match.index + value.length;
    match = parts.exec(tag);
  }
  pushPlainToken(tokens, tag.slice(cursor));
  return tokens;
}

function highlightHtmlLine(line: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  let cursor = 0;
  const parts = /<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*>/g;
  let match = parts.exec(line);

  while (match) {
    pushPlainToken(tokens, line.slice(cursor, match.index));
    if (match[0].startsWith('<!--')) {
      tokens.push({ className: 'syntax-comment', value: match[0] });
    } else {
      tokens.push(...tokenizeHtmlTag(match[0]));
    }
    cursor = match.index + match[0].length;
    match = parts.exec(line);
  }
  pushPlainToken(tokens, line.slice(cursor));
  return tokens;
}

function highlightScriptLine(
  line: string,
  language: WorkspaceFile['language']
): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  let cursor = 0;
  const parts =
    language === 'css'
      ? /(\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:important|from|to|and|or|not)\b|\b\d+(?:\.\d+)?\b|[A-Za-z_$][\w$]*(?=\())/g
      : /(\/\*[\s\S]*?\*\/|\/\/.*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:const|let|var|function|return|if|else|for|while|new|true|false|null|undefined|async|await|class|this|import|export)\b|\b\d+(?:\.\d+)?\b|[A-Za-z_$][\w$]*(?=\())/g;
  let match = parts.exec(line);

  while (match) {
    pushPlainToken(tokens, line.slice(cursor, match.index));
    const value = match[0];
    const className =
      value.startsWith('/*') || value.startsWith('//')
        ? 'syntax-comment'
        : value.startsWith('"') ||
            value.startsWith("'") ||
            value.startsWith('`')
          ? 'syntax-string'
          : /^\d/.test(value)
            ? 'syntax-number'
            : /^(const|let|var|function|return|if|else|for|while|new|true|false|null|undefined|async|await|class|this|import|export|important|from|to|and|or|not)$/.test(
                  value
                )
              ? 'syntax-keyword'
              : 'syntax-function';
    tokens.push({ className, value });
    cursor = match.index + value.length;
    match = parts.exec(line);
  }
  pushPlainToken(tokens, line.slice(cursor));
  return tokens;
}

function highlightSourceLine(
  line: string,
  language: WorkspaceFile['language']
): SyntaxToken[] {
  if (language === 'html') return highlightHtmlLine(line);
  if (language === 'css' || language === 'javascript') {
    return highlightScriptLine(line, language);
  }
  return [{ value: line }];
}

function resultText(result: {
  isError?: boolean;
  error?: {
    code?: string;
    message?: string;
    retryable?: boolean;
    details?: unknown;
  };
  content?: Array<{ text?: string }>;
  structuredContent?: unknown;
}): string {
  if (result.isError) {
    const message =
      result.error?.message?.trim() ||
      result.content
        ?.map((block) => block.text?.trim())
        .find((text): text is string => Boolean(text));
    const code = result.error?.code ? `[${result.error.code}] ` : '';
    const details = result.error?.details;
    const detailText =
      details === undefined ? '' : `\n${JSON.stringify(details, null, 2)}`;
    return `${code}${message || 'Tool call failed.'}${detailText}`;
  }
  return JSON.stringify(
    result.structuredContent !== undefined ? result.structuredContent : {},
    null,
    2
  );
}

function throwIfAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) return;
  const reason = signal.reason;
  throw reason instanceof Error
    ? reason
    : new DOMException('Execution cancelled.', 'AbortError');
}

function assertExpectedWorkspaceRevision(
  workspace: BrowserWorkspace,
  expectedRevision?: number
): void {
  if (expectedRevision === undefined) return;
  const currentRevision = workspace.getSnapshot().revision;
  if (expectedRevision !== currentRevision) {
    throw new Error(
      `Workspace revision mismatch: expected ${expectedRevision}, current ${currentRevision}. Re-read the workspace before applying the mutation.`
    );
  }
}

function applyTextPatch(
  source: string,
  search: string,
  replace: string,
  occurrence: 'first' | 'all'
): { source: string; replacements: number } {
  if (occurrence === 'all') {
    const parts = source.split(search);
    const replacements = parts.length - 1;
    if (!replacements) {
      throw new Error('Patch search text was not found in the file.');
    }
    return { source: parts.join(replace), replacements };
  }

  const index = source.indexOf(search);
  if (index < 0) {
    throw new Error('Patch search text was not found in the file.');
  }
  return {
    source: `${source.slice(0, index)}${replace}${source.slice(index + search.length)}`,
    replacements: 1,
  };
}

function isPreviewBridgeMessage(value: unknown): value is PreviewBridgeMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as {
    type?: unknown;
    revision?: unknown;
    message?: unknown;
  };
  return (
    typeof message.revision === 'number' &&
    (message.type === 'context-action.preview.ready' ||
      (message.type === 'context-action.preview.error' &&
        typeof message.message === 'string'))
  );
}

function useModalDialog<T extends HTMLElement>(onClose: () => void) {
  const dialogRef = useRef<T>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousActiveElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousBodyOverflow = document.body.style.overflow;
    const focusableSelector =
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';
    const getFocusableElements = () =>
      Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));

    getFocusableElements()[0]?.focus();
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (!focusableElements.length) return;
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      if (previousActiveElement?.isConnected) previousActiveElement.focus();
    };
  }, []);

  return dialogRef;
}

function OpenRouterSettingsDialog({
  initialSettings,
  onClose,
  onSave,
}: {
  initialSettings: OpenRouterSettings;
  onClose: () => void;
  onSave: (settings: OpenRouterSettings) => void;
}) {
  const [draft, setDraft] = useState(initialSettings);
  const [showKey, setShowKey] = useState(false);
  const dialogRef = useModalDialog<HTMLElement>(onClose);

  return (
    <div
      className="settings-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <section
        aria-labelledby="openrouter-settings-title"
        aria-modal="true"
        className="settings-dialog"
        ref={dialogRef}
        role="dialog"
      >
        <div className="settings-heading">
          <div>
            <span className="panel-label">Provider settings</span>
            <h2 id="openrouter-settings-title">OpenRouter API</h2>
          </div>
          <button
            aria-label="Close OpenRouter settings"
            className="settings-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <p className="settings-intro">
          Save a user-owned key for direct browser requests. The local agent
          remains available when no key is configured.
        </p>

        <label className="settings-field">
          <span>OpenRouter API key</span>
          <div className="secret-input-wrap">
            <input
              autoFocus
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  apiKey: event.target.value,
                }))
              }
              placeholder="sk-or-v1-…"
              type={showKey ? 'text' : 'password'}
              value={draft.apiKey}
            />
            <button
              className="reveal-button"
              onClick={() => setShowKey((current) => !current)}
              type="button"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>

        <label className="settings-field">
          <span>Model ID</span>
          <input
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                model: event.target.value,
              }))
            }
            placeholder="openai/gpt-4o-mini"
            value={draft.model}
          />
        </label>

        <label className="settings-field">
          <span>Chat completions endpoint</span>
          <input
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                endpoint: event.target.value,
              }))
            }
            value={draft.endpoint}
          />
        </label>

        <div className="settings-note">
          <span className="status-dot" />
          Stored in this browser origin and sent directly to the configured
          endpoint. It is not committed to the repository.
        </div>

        <div className="settings-actions">
          <button
            className="settings-reset"
            onClick={() =>
              setDraft({
                ...DEFAULT_OPENROUTER_SETTINGS,
                apiKey: '',
              })
            }
            type="button"
          >
            Clear key
          </button>
          <div>
            <button className="settings-cancel" onClick={onClose} type="button">
              Cancel
            </button>
            <button
              className="settings-save"
              onClick={() => {
                onSave(draft);
                onClose();
              }}
              type="button"
            >
              Save settings
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function CreateWorkspaceFileDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (path: string, source: string) => Promise<ToolExecutionOutcome>;
}) {
  const [path, setPath] = useState('notes.md');
  const [source, setSource] = useState('# New workspace file\n');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const dialogRef = useModalDialog<HTMLFormElement>(onClose);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || !path.trim()) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const outcome = await onCreate(path, source);
      if (outcome.ok) onClose();
      else setErrorMessage(outcome.message?.trim() || 'File creation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="settings-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <form
        aria-labelledby="create-file-title"
        aria-modal="true"
        className="settings-dialog create-file-dialog"
        onSubmit={(event) => void handleSubmit(event)}
        ref={dialogRef}
        role="dialog"
      >
        <div className="settings-heading">
          <div>
            <span className="panel-label">Workspace</span>
            <h2 id="create-file-title">New file</h2>
          </div>
          <button
            aria-label="Close new file dialog"
            className="settings-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <p className="settings-intro">
          Create a text file in the browser workspace. The new file becomes the
          active tab and is included in the next folder save.
        </p>
        <label className="settings-field">
          <span>File path</span>
          <input
            autoFocus
            aria-label="New file path"
            onChange={(event) => setPath(event.target.value)}
            placeholder="src/notes.md"
            value={path}
          />
        </label>
        <label className="settings-field">
          <span>Initial source</span>
          <textarea
            aria-label="Initial file source"
            className="create-file-source"
            onChange={(event) => setSource(event.target.value)}
            rows={8}
            value={source}
          />
        </label>
        {errorMessage ? (
          <p className="create-file-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <div className="settings-note">
          <span className="status-dot" />
          Text files only · paths are normalized by workspace.createFile.
        </div>
        <div className="settings-actions">
          <span />
          <div>
            <button className="settings-cancel" onClick={onClose} type="button">
              Cancel
            </button>
            <button
              className="settings-save"
              disabled={submitting || !path.trim()}
              type="submit"
            >
              {submitting ? 'Creating…' : 'Create file'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function inferWorkspacePath(prompt: string): string | null {
  const explicitPath = prompt.match(
    /(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.(?:html?|css|m?js|json|md|txt|tsx?|jsx?)(?=\b|[^A-Za-z0-9_.-])/i
  )?.[0];
  if (explicitPath) return explicitPath;
  if (/\breadme\b/i.test(prompt)) return 'README.md';
  if (/\bindex\b/i.test(prompt)) return 'index.html';
  if (/\bstyles?\b/i.test(prompt)) return 'styles.css';
  if (/\bapp\b/i.test(prompt)) return 'app.js';
  if (/\bnotes?\b/i.test(prompt)) return 'notes.md';
  return null;
}

function inferQuotedTextPatch(
  prompt: string,
  requestedPath: string | null
): { path: string; search: string; replace: string } | null {
  if (!/(replace|change|edit|update|바꾸|바꿔|변경|수정|교체)/i.test(prompt)) {
    return null;
  }
  const quotedValues = Array.from(
    prompt.matchAll(/["“]([^"”]+)["”]/g),
    (match) => match[1]?.trim() ?? ''
  ).filter(Boolean);
  const values = quotedValues.filter((value) => value !== requestedPath);
  if (values.length < 2) return null;
  const [search, replace] = values;
  return {
    path: requestedPath ?? 'index.html',
    search,
    replace,
  };
}

function promptToToolCalls(prompt: string): ToolCall[] {
  const normalized = prompt.toLowerCase();
  const calls: ToolCall[] = [];
  const deleteRequest =
    /(delete|remove|삭제|지워)/i.test(prompt) && /(file|파일)/i.test(prompt);
  const saveRequest = /(save|persist|저장|폴더에 반영|파일시스템)/i.test(
    prompt
  );
  const disconnectRequest =
    /(disconnect|unlink|연결 해제|연결을 해제|폴더 해제)/i.test(prompt) &&
    /(folder|directory|폴더|디렉터리)/i.test(prompt);
  const statusRequest =
    /(status|상태|folder sync|폴더 연결|저장 가능|writable)/i.test(prompt);
  const requestedPath = inferWorkspacePath(prompt);
  const textPatch = inferQuotedTextPatch(prompt, requestedPath);

  if (statusRequest && !textPatch && !saveRequest) {
    return [{ name: 'workspace.getStatus', arguments: {} }];
  }

  if (textPatch) {
    calls.push({
      name: 'workspace.applyPatch',
      arguments: { ...textPatch, occurrence: 'first' },
    });
  }

  if (deleteRequest && requestedPath) {
    calls.push({
      name: 'workspace.deleteFile',
      arguments: { path: requestedPath },
    });
  }

  if (deleteRequest && !requestedPath) {
    return [{ name: 'workspace.listFiles', arguments: {} }];
  }

  if (/(create|new|생성|만들)/i.test(prompt) && /(file|파일)/i.test(prompt)) {
    calls.push({
      name: 'workspace.createFile',
      arguments: {
        path: requestedPath ?? 'notes.md',
        source:
          '# New workspace file\n\nCreated through the typed workspace.createFile tool.\n',
      },
    });
  }

  const theme =
    normalized.includes('emerald') || normalized.includes('green')
      ? 'emerald'
      : normalized.includes('amber') || normalized.includes('orange')
        ? 'amber'
        : normalized.includes('rose') || normalized.includes('pink')
          ? 'rose'
          : normalized.includes('violet') ||
              normalized.includes('purple') ||
              prompt.includes('보라')
            ? 'violet'
            : null;

  if (theme) {
    calls.push({ name: 'preview.setTheme', arguments: { theme } });
  }

  if (/(feature|card|section|기능|카드)/i.test(prompt)) {
    calls.push({
      name: 'preview.addFeature',
      arguments: {
        title: 'Conversation-driven feature',
        description:
          'A new card was added through a typed Context-Action tool call.',
      },
    });
  }

  if (/(hero|title|landing|제목|랜딩)/i.test(prompt)) {
    calls.push({
      name: 'preview.updateHero',
      arguments: {
        title: 'A page shaped by conversation.',
        subtitle:
          'The agent selected tools, changed the workspace, and refreshed the preview.',
      },
    });
  }

  if (saveRequest) {
    calls.push({ name: 'workspace.saveAll', arguments: {} });
  }

  if (disconnectRequest) {
    calls.push({ name: 'workspace.disconnectFolder', arguments: {} });
  }

  return calls.length > 0
    ? calls
    : [{ name: 'workspace.listFiles', arguments: {} }];
}

function buildLocalAgentPlan(prompt: string): ToolCall[] {
  const requestedCalls = promptToToolCalls(prompt);
  const mutationCalls = requestedCalls.filter((call) =>
    localMutationToolNames.has(call.name)
  );
  if (!mutationCalls.length) return requestedCalls;

  const preflightCalls: ToolCall[] = [
    { name: 'workspace.getStatus', arguments: {} },
  ];
  const fileCall = mutationCalls.find((call) =>
    localFileListingToolNames.has(call.name)
  );
  const path = fileCall?.arguments.path;
  if (typeof path === 'string' && path.trim()) {
    preflightCalls.push({ name: 'workspace.listFiles', arguments: {} });
    if (fileCall && localTextInspectionToolNames.has(fileCall.name)) {
      preflightCalls.push({
        name: 'workspace.readFile',
        arguments: { path },
      });
    }
  }
  return [...preflightCalls, ...requestedCalls];
}

function readResultRevision(
  result: { structuredContent?: unknown },
  fallback: number
): number {
  const structured = result.structuredContent;
  if (
    !structured ||
    typeof structured !== 'object' ||
    Array.isArray(structured) ||
    typeof (structured as { revision?: unknown }).revision !== 'number'
  ) {
    return fallback;
  }
  return (structured as { revision: number }).revision;
}

async function runLocalAgent(
  registry: BoltStyleRegistry,
  workspace: BrowserWorkspace,
  prompt: string,
  signal?: AbortSignal
): Promise<AgentRunResult> {
  const listedTools = registry.listTools({ method: 'tools/list' });
  recordToolList(listedTools.tools.length, 'local');
  const calls = buildLocalAgentPlan(prompt);
  let plannedRevision = workspace.getSnapshot().revision;
  const toolNames: string[] = [];

  for (const call of calls) {
    throwIfAborted(signal);
    const argumentsValue =
      revisionGuardedWorkspaceTools.has(call.name) &&
      call.arguments.expectedRevision === undefined
        ? { ...call.arguments, expectedRevision: plannedRevision }
        : call.arguments;
    const result = await registry.callTool(
      {
        id: `local-${Date.now()}-${call.name}`,
        method: 'tools/call',
        params: { name: call.name, arguments: argumentsValue },
      },
      {
        context: { source: 'local', metadata: { interaction: 'prompt' } },
        signal,
      }
    );
    throwIfAborted(signal);
    toolNames.push(call.name);
    if (result.isError) {
      return {
        toolNames,
        response: resultText(result),
        failed: true,
        retryable: result.error?.retryable,
      };
    }
    plannedRevision = readResultRevision(
      result,
      revisionGuardedWorkspaceTools.has(call.name)
        ? workspace.getSnapshot().revision
        : plannedRevision
    );
  }

  return {
    toolNames,
    response:
      toolNames.length === 1 &&
      toolNames[0] === 'workspace.listFiles' &&
      /(delete|remove|삭제|지워)/i.test(prompt) &&
      /(file|파일)/i.test(prompt) &&
      !inferWorkspacePath(prompt)
        ? 'Which file should I delete? Include a path such as README.md.'
        : `Local agent inspected the workspace, called ${toolNames.join(', ')}${toolNames.some((name) => name.startsWith('preview.') || revisionGuardedWorkspaceTools.has(name)) ? ' and refreshed the sandbox preview.' : '.'}`,
  };
}

function ToolHandlers({
  workspace,
  fileSystemAdapter,
  children,
}: {
  workspace: BrowserWorkspace;
  fileSystemAdapter: BrowserWorkspaceFileSystemAdapter;
  children: ReactNode;
}) {
  const workspaceResultMeta = (snapshot = workspace.getSnapshot()) => {
    return {
      activePath: snapshot.activePath,
      revision: snapshot.revision,
    };
  };

  useBoltStyleToolHandler('workspace.getStatus', () => {
    const snapshot = workspace.getSnapshot();
    const dirtyPaths = workspace.getDirtyFiles().map((file) => file.path);
    const folderLinked = fileSystemAdapter.hasWritableFolder;
    return {
      rootName: snapshot.rootName,
      activePath: snapshot.activePath,
      revision: snapshot.revision,
      storageMode: snapshot.storageMode,
      preview: snapshot.preview,
      fileCount: snapshot.files.length,
      dirtyPaths,
      deletedPaths: workspace.getDeletedPaths(),
      filesystem: {
        mode: folderLinked ? 'local-folder' : 'browser-only',
        folderLinked,
        saveAllAvailable: folderLinked,
      },
    };
  });

  useBoltStyleToolHandler('workspace.listFiles', () => {
    const snapshot = workspace.getSnapshot();
    const dirtyPaths = new Set(
      workspace.getDirtyFiles().map((file) => file.path)
    );
    return {
      activePath: snapshot.activePath,
      revision: snapshot.revision,
      dirty: workspace.isDirty(),
      deletedPaths: workspace.getDeletedPaths(),
      files: snapshot.files.map(
        ({ path, language, source, kind, mimeType, blob }) => ({
          path,
          language,
          size: blob?.size ?? source.length,
          kind: kind ?? 'text',
          mimeType,
          dirty: dirtyPaths.has(path),
        })
      ),
    };
  });

  useBoltStyleToolHandler('workspace.readFile', ({ path }) => {
    const file = workspace.getFile(path);
    if (file.kind === 'asset') {
      throw new Error(`Binary asset cannot be returned as text: ${file.path}`);
    }
    return {
      path: file.path,
      source: file.source,
      revision: workspace.getSnapshot().revision,
    };
  });

  useBoltStyleToolHandler<'workspace.createFile', unknown>(
    'workspace.createFile',
    async ({ path, source, expectedRevision }, controller) => {
      assertExpectedWorkspaceRevision(workspace, expectedRevision);
      const snapshot = workspace.createFile(path, source);
      await workspace.waitForPreviewRevision(
        snapshot.revision,
        2500,
        controller.signal
      );
      return {
        path: snapshot.activePath,
        activePath: snapshot.activePath,
        language: workspace.getFile(snapshot.activePath).language,
        revision: snapshot.revision,
        preview: 'synced',
      };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler<'workspace.deleteFile', unknown>(
    'workspace.deleteFile',
    async ({ path, expectedRevision }, controller) => {
      assertExpectedWorkspaceRevision(workspace, expectedRevision);
      const file = workspace.getFile(path);
      const snapshot = workspace.deleteFile(file.path);
      await workspace.waitForPreviewRevision(
        snapshot.revision,
        2500,
        controller.signal
      );
      return {
        path: file.path,
        activePath: snapshot.activePath,
        revision: snapshot.revision,
        preview: 'synced',
      };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler<'workspace.writeFile', unknown>(
    'workspace.writeFile',
    async ({ path, source, expectedRevision }, controller) => {
      assertExpectedWorkspaceRevision(workspace, expectedRevision);
      const file = workspace.getFile(path);
      if (file.kind === 'asset') {
        throw new Error(
          `Binary asset cannot be replaced as text: ${file.path}`
        );
      }
      const snapshot = workspace.updateFile(file.path, source, {
        coalesce: false,
      });
      await workspace.waitForPreviewRevision(
        snapshot.revision,
        2500,
        controller.signal
      );
      return {
        path: file.path,
        revision: snapshot.revision,
        activePath: snapshot.activePath,
        preview: 'synced',
      };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler<'workspace.saveAll', unknown>(
    'workspace.saveAll',
    async (_, controller) => {
      if (!fileSystemAdapter.hasWritableFolder) {
        throw new Error(
          'No writable folder is open. Open a local folder before saving files.'
        );
      }
      if (controller.signal?.aborted) throw new Error('Save cancelled.');
      const saveRevision = workspace.getSnapshot().revision;
      const dirtyFiles = workspace.getDirtyFiles();
      const deletedPaths = workspace.getDeletedPaths();
      if (dirtyFiles.length === 0 && deletedPaths.length === 0) {
        return {
          savedPaths: [],
          deletedPaths: [],
          activePath: workspace.getSnapshot().activePath,
          revision: workspace.getSnapshot().revision,
        };
      }

      await fileSystemAdapter.writeFiles(dirtyFiles);
      if (controller.signal?.aborted) throw new Error('Save cancelled.');
      await fileSystemAdapter.removeFiles(deletedPaths);
      if (controller.signal?.aborted) throw new Error('Save cancelled.');
      const checkpointUpdated =
        await workspace.markSavedIfRevision(saveRevision);
      return {
        savedPaths: dirtyFiles.map((file) => file.path),
        deletedPaths,
        activePath: workspace.getSnapshot().activePath,
        revision: workspace.getSnapshot().revision,
        checkpointUpdated,
      };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler<'workspace.disconnectFolder', unknown>(
    'workspace.disconnectFolder',
    async () => {
      await fileSystemAdapter.disconnectFolder();
      const snapshot = workspace.getSnapshot();
      return {
        activePath: snapshot.activePath,
        revision: snapshot.revision,
        storageMode:
          snapshot.storageMode === 'loading' ? 'memory' : snapshot.storageMode,
        filesystem: {
          mode: 'browser-only' as const,
          folderLinked: false as const,
          saveAllAvailable: false as const,
        },
      };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler<'workspace.applyPatch', unknown>(
    'workspace.applyPatch',
    async (
      { path, search, replace, occurrence, expectedRevision },
      controller
    ) => {
      assertExpectedWorkspaceRevision(workspace, expectedRevision);
      const file = workspace.getFile(path);
      if (file.kind === 'asset') {
        throw new Error(`Binary asset cannot be patched as text: ${file.path}`);
      }
      const patch = applyTextPatch(file.source, search, replace, occurrence);
      if (patch.source.length > 80_000) {
        throw new Error('Patched source exceeds the 80,000 character limit.');
      }
      const snapshot = workspace.updateFile(file.path, patch.source, {
        coalesce: false,
      });
      await workspace.waitForPreviewRevision(
        snapshot.revision,
        2500,
        controller.signal
      );
      return {
        path: file.path,
        replacements: patch.replacements,
        revision: snapshot.revision,
        activePath: snapshot.activePath,
        preview: 'synced',
      };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler<'workspace.revertFile', unknown>(
    'workspace.revertFile',
    async ({ path, expectedRevision }, controller) => {
      assertExpectedWorkspaceRevision(workspace, expectedRevision);
      const file = workspace.getFile(path);
      const snapshot = workspace.revertFile(file.path);
      await workspace.waitForPreviewRevision(
        snapshot.revision,
        2500,
        controller.signal
      );
      return {
        path: file.path,
        activePath: snapshot.activePath,
        revision: snapshot.revision,
        preview: 'synced',
      };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler<'preview.setTheme', unknown>(
    'preview.setTheme',
    async ({ theme }, controller) => {
      const file = findPreviewStylesheetFile(workspace.getSnapshot().files);
      if (!file)
        throw new Error('No CSS stylesheet was found in the workspace.');
      const tokens = themeTokens[theme];
      const hasThemeTokens =
        /--accent:\s*#[0-9a-f]+;/i.test(file.source) ||
        /--accent-soft:\s*#[0-9a-f]+;/i.test(file.source);
      if (!hasThemeTokens) {
        throw new Error(
          `The stylesheet does not expose supported theme tokens: ${file.path}`
        );
      }
      const source = file.source
        .replace(/--accent:\s*#[0-9a-f]+;/i, `--accent: ${tokens.accent};`)
        .replace(
          /--accent-soft:\s*#[0-9a-f]+;/i,
          `--accent-soft: ${tokens.soft};`
        );
      if (source === file.source) {
        const current = workspace.getSnapshot();
        await workspace.waitForPreviewRevision(
          current.revision,
          2500,
          controller.signal
        );
        return {
          theme,
          ...workspaceResultMeta(current),
          preview: 'synced' as const,
        };
      }
      const snapshot = workspace.updateFile(file.path, source, {
        coalesce: false,
      });
      await workspace.waitForPreviewRevision(
        snapshot.revision,
        2500,
        controller.signal
      );
      return {
        theme,
        ...workspaceResultMeta(snapshot),
        preview: 'synced',
      };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler<'preview.addFeature', unknown>(
    'preview.addFeature',
    async ({ title, description }, controller) => {
      const file = findPreviewHtmlFile(workspace.getSnapshot().files);
      if (!file)
        throw new Error('No HTML entry file was found in the workspace.');
      const card = `<article class="feature-card"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(description)}</span></article>`;
      if (!file.source.includes('<!-- feature-slot -->')) {
        throw new Error(
          `The HTML entry file does not expose a feature slot: ${file.path}`
        );
      }
      const source = file.source.replace(
        '<!-- feature-slot -->',
        () => `${card}\n        <!-- feature-slot -->`
      );
      const snapshot = workspace.updateFile(file.path, source, {
        coalesce: false,
      });
      await workspace.waitForPreviewRevision(
        snapshot.revision,
        2500,
        controller.signal
      );
      return {
        title,
        ...workspaceResultMeta(snapshot),
        preview: 'synced',
      };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler<'preview.updateHero', unknown>(
    'preview.updateHero',
    async ({ title, subtitle }, controller) => {
      const file = findPreviewHtmlFile(workspace.getSnapshot().files);
      if (!file)
        throw new Error('No HTML entry file was found in the workspace.');
      if (!/<h1\b[^>]*id=["']hero-title["'][^>]*>/i.test(file.source)) {
        throw new Error(
          `The HTML entry file has no hero title target: ${file.path}`
        );
      }
      if (!/<p\b[^>]*id=["']hero-subtitle["'][^>]*>/i.test(file.source)) {
        throw new Error(
          `The HTML entry file has no hero subtitle target: ${file.path}`
        );
      }
      const source = file.source
        .replace(
          /(<h1\b[^>]*id=["']hero-title["'][^>]*>)[\s\S]*?(<\/h1>)/i,
          (_match, opening, closing) =>
            `${opening}${escapeHtml(title)}${closing}`
        )
        .replace(
          /(<p\b[^>]*id=["']hero-subtitle["'][^>]*>)[\s\S]*?(<\/p>)/i,
          (_match, opening, closing) =>
            `${opening}${escapeHtml(subtitle)}${closing}`
        );
      const snapshot = workspace.updateFile(file.path, source, {
        coalesce: false,
      });
      await workspace.waitForPreviewRevision(
        snapshot.revision,
        2500,
        controller.signal
      );
      return {
        title,
        ...workspaceResultMeta(snapshot),
        preview: 'synced',
      };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler('preview.getStatus', () => {
    const snapshot = workspace.getSnapshot();
    return {
      revision: snapshot.revision,
      status: snapshot.preview.status,
      message: snapshot.preview.message,
      runtime: 'sandbox iframe',
    };
  });

  return <>{children}</>;
}

function FileTreeEntryView({
  entry,
  depth,
  expandedPaths,
  activePath,
  dirtyPaths,
  disabled,
  onToggle,
  onSelect,
}: {
  entry: FileTreeEntry;
  depth: number;
  expandedPaths: ReadonlySet<string>;
  activePath: string;
  dirtyPaths: ReadonlySet<string>;
  disabled: boolean;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
}) {
  const indentation = { paddingLeft: `${12 + depth * 15}px` };

  if (entry.kind === 'directory') {
    const expanded = expandedPaths.has(entry.path);
    return (
      <div key={entry.path}>
        <button
          aria-expanded={expanded}
          className="directory-row"
          disabled={disabled}
          onClick={() => onToggle(entry.path)}
          style={indentation}
          type="button"
        >
          <span className="directory-chevron" aria-hidden="true">
            {expanded ? '⌄' : '›'}
          </span>
          <span className="directory-icon" aria-hidden="true">
            ▱
          </span>
          <span>{entry.name}</span>
        </button>
        {expanded
          ? entry.children.map((child) => (
              <FileTreeEntryView
                activePath={activePath}
                depth={depth + 1}
                disabled={disabled}
                dirtyPaths={dirtyPaths}
                entry={child}
                expandedPaths={expandedPaths}
                key={child.path}
                onSelect={onSelect}
                onToggle={onToggle}
              />
            ))
          : null}
      </div>
    );
  }

  return (
    <button
      className={`file-row ${entry.path === activePath ? 'file-row-active' : ''} ${dirtyPaths.has(entry.path) ? 'file-row-dirty' : ''}`}
      disabled={disabled}
      onClick={() => onSelect(entry.path)}
      style={indentation}
      title={entry.path}
      type="button"
    >
      <FileIcon file={entry.file} />
      <span>{entry.name}</span>
      {dirtyPaths.has(entry.path) ? (
        <span
          aria-label="Unsaved changes"
          className="file-dirty-dot"
          title="Unsaved changes"
        >
          •
        </span>
      ) : null}
    </button>
  );
}

function FileTree({
  files,
  activePath,
  dirtyPaths,
  disabled,
  onSelect,
}: {
  files: readonly WorkspaceFile[];
  activePath: string;
  dirtyPaths: ReadonlySet<string>;
  disabled: boolean;
  onSelect: (path: string) => void;
}) {
  const entries = useMemo(() => buildFileTree(files), [files]);
  const directoryPaths = collectDirectoryPaths(entries);
  const directorySignature = directoryPaths.join('\u0000');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    () => new Set(directoryPaths)
  );

  useEffect(() => {
    setExpandedPaths(new Set(directoryPaths));
  }, [directorySignature]);

  const toggleDirectory = (path: string) => {
    setExpandedPaths((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  return (
    <div className="file-tree">
      {entries.map((entry) => (
        <FileTreeEntryView
          activePath={activePath}
          depth={0}
          disabled={disabled}
          dirtyPaths={dirtyPaths}
          entry={entry}
          expandedPaths={expandedPaths}
          key={entry.path}
          onSelect={onSelect}
          onToggle={toggleDirectory}
        />
      ))}
    </div>
  );
}

function FileIcon({ file }: { file: WorkspaceFile }) {
  const color =
    file.language === 'html'
      ? 'orange'
      : file.language === 'css'
        ? 'blue'
        : file.language === 'javascript'
          ? 'yellow'
          : 'gray';
  return <span className={`file-icon file-icon-${color}`} aria-hidden="true" />;
}

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTraceId(id: string): string {
  return id.length > 18 ? `…${id.slice(-17)}` : id;
}

function getCursorPosition(source: string, offset: number) {
  const safeOffset = Math.max(0, Math.min(offset, source.length));
  const beforeCursor = source.slice(0, safeOffset);
  const lines = beforeCursor.split('\n');
  return {
    line: lines.length,
    column: (lines.at(-1)?.length ?? 0) + 1,
  };
}

function findTextMatches(source: string, query: string): number[] {
  const normalizedQuery = query.toLocaleLowerCase();
  if (!normalizedQuery) return [];

  const normalizedSource = source.toLocaleLowerCase();
  const matches: number[] = [];
  let cursor = 0;
  while (cursor <= normalizedSource.length - normalizedQuery.length) {
    const index = normalizedSource.indexOf(normalizedQuery, cursor);
    if (index < 0) break;
    matches.push(index);
    cursor = index + Math.max(normalizedQuery.length, 1);
  }
  return matches;
}

type WorkspaceSearchMatch = {
  path: string;
  line: number;
  preview: string;
};

type WorkspaceSearchFocusRequest = {
  path: string;
  line: number;
  requestId: number;
};

function findWorkspaceMatches(
  files: readonly WorkspaceFile[],
  query: string
): WorkspaceSearchMatch[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [];

  const matches: WorkspaceSearchMatch[] = [];
  for (const file of files) {
    if (file.kind === 'asset') continue;
    for (const [index, sourceLine] of file.source.split('\n').entries()) {
      if (!sourceLine.toLocaleLowerCase().includes(normalizedQuery)) continue;
      matches.push({
        path: file.path,
        line: index + 1,
        preview: sourceLine.trim().slice(0, 120) || '(blank line)',
      });
      if (matches.length >= 80) return matches;
    }
  }
  return matches;
}

function WorkspaceSearchPanel({
  files,
  onClose,
  onQueryChange,
  onSelect,
  query,
}: {
  files: readonly WorkspaceFile[];
  onClose: () => void;
  onQueryChange: (query: string) => void;
  onSelect: (match: WorkspaceSearchMatch) => void;
  query: string;
}) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const matches = useMemo(
    () => findWorkspaceMatches(files, query),
    [files, query]
  );

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  return (
    <section aria-label="Search workspace" className="workspace-search-panel">
      <div className="workspace-search-toolbar">
        <span className="workspace-search-icon" aria-hidden="true">
          ⌕
        </span>
        <input
          ref={searchInputRef}
          aria-label="Search workspace files"
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              onClose();
            }
          }}
          placeholder="Search all workspace files…"
          type="search"
          value={query}
        />
        <span className="workspace-search-count">
          {query.trim()
            ? `${matches.length}${matches.length === 80 ? '+' : ''}`
            : 'Type to search'}
        </span>
        <button
          aria-label="Close workspace search"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
      </div>
      {query.trim() ? (
        <div className="workspace-search-results">
          {matches.length ? (
            matches.map((match, index) => (
              <button
                className="workspace-search-result"
                key={`${match.path}-${match.line}-${index}`}
                onClick={() => onSelect(match)}
                type="button"
              >
                <span>
                  {match.path}:{match.line}
                </span>
                <code>{match.preview}</code>
              </button>
            ))
          ) : (
            <div className="workspace-search-empty">No matching lines</div>
          )}
        </div>
      ) : null}
    </section>
  );
}

function CodeEditor({
  file,
  disabled = false,
  focusRequest,
  onFocusRequestConsumed,
  onOpenWorkspaceSearch,
  onChange,
}: {
  file: WorkspaceFile;
  disabled?: boolean;
  focusRequest?: WorkspaceSearchFocusRequest;
  onFocusRequestConsumed?: () => void;
  onOpenWorkspaceSearch?: () => void;
  onChange: (source: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const findInputRef = useRef<HTMLInputElement>(null);
  const [findOpen, setFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [findIndex, setFindIndex] = useState(0);
  const [cursorOffset, setCursorOffset] = useState(0);
  const highlightedSource = useMemo(
    () =>
      file.source
        .split('\n')
        .map((line) => highlightSourceLine(line, file.language)),
    [file.language, file.source]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    const highlight = highlightRef.current;
    if (!textarea || !highlight) return;
    textarea.scrollTop = 0;
    textarea.scrollLeft = 0;
    highlight.scrollTop = 0;
    highlight.scrollLeft = 0;
    textarea.setSelectionRange(0, 0);
    setCursorOffset(0);
    setFindOpen(false);
    setFindQuery('');
  }, [file.path]);

  useEffect(() => {
    const textarea = textareaRef.current;
    const highlight = highlightRef.current;
    if (!textarea || !highlight || !focusRequest) return;

    const lines = file.source.split('\n');
    const lineIndex = Math.max(
      0,
      Math.min(focusRequest.line - 1, lines.length - 1)
    );
    const lineStart = lines
      .slice(0, lineIndex)
      .reduce((offset, line) => offset + line.length + 1, 0);
    const lineEnd = lineStart + (lines[lineIndex]?.length ?? 0);
    textarea.focus();
    textarea.setSelectionRange(lineStart, lineEnd);
    setCursorOffset(lineStart);
    const lineHeight = Number.parseFloat(
      window.getComputedStyle(textarea).lineHeight
    );
    textarea.scrollTop = Math.max(
      0,
      lineIndex * (Number.isFinite(lineHeight) ? lineHeight : 19) - 38
    );
    highlight.scrollTop = textarea.scrollTop;
    onFocusRequestConsumed?.();
  }, [file.path, focusRequest?.requestId]);

  const matches = useMemo(
    () => findTextMatches(file.source, findQuery),
    [file.source, findQuery]
  );
  const cursorPosition = getCursorPosition(file.source, cursorOffset);

  const updateCursor = (textarea: HTMLTextAreaElement) => {
    setCursorOffset(textarea.selectionStart);
  };

  const selectMatch = (requestedIndex: number) => {
    if (!matches.length) return;
    const nextIndex = (requestedIndex + matches.length) % matches.length;
    const start = matches[nextIndex];
    const end = start + findQuery.length;
    setFindIndex(nextIndex);
    textareaRef.current?.focus();
    textareaRef.current?.setSelectionRange(start, end);
    if (textareaRef.current) updateCursor(textareaRef.current);
  };

  const openFind = () => {
    const textarea = textareaRef.current;
    const selectedText = textarea
      ? textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)
      : '';
    setFindQuery(selectedText.length <= 80 ? selectedText : '');
    setFindIndex(0);
    setFindOpen(true);
    window.requestAnimationFrame(() => findInputRef.current?.focus());
  };

  const closeFind = () => {
    setFindOpen(false);
    textareaRef.current?.focus();
  };

  const syncScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;
    const highlight = highlightRef.current;
    if (!highlight) return;
    highlight.scrollTop = textarea.scrollTop;
    highlight.scrollLeft = textarea.scrollLeft;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const modifierKey = event.metaKey || event.ctrlKey;
    if (
      modifierKey &&
      event.shiftKey &&
      event.key.toLowerCase() === 'f' &&
      onOpenWorkspaceSearch
    ) {
      event.preventDefault();
      onOpenWorkspaceSearch();
      return;
    }
    if (modifierKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      openFind();
      return;
    }
    if (modifierKey && event.key.toLowerCase() === 'g' && findOpen) {
      event.preventDefault();
      selectMatch(findIndex + (event.shiftKey ? -1 : 1));
      return;
    }
    if (event.key === 'Escape' && findOpen) {
      event.preventDefault();
      closeFind();
      return;
    }
    if (event.key !== 'Tab') return;
    event.preventDefault();
    const textarea = event.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextSource = `${file.source.slice(0, start)}  ${file.source.slice(end)}`;
    onChange(nextSource);
    setCursorOffset(start + 2);
    window.requestAnimationFrame(() => {
      textareaRef.current?.setSelectionRange(start + 2, start + 2);
    });
  };

  return (
    <>
      <div className="code-header">
        <span>{file.language}</span>
        <span>
          Ln {cursorPosition.line}, Col {cursorPosition.column} ·{' '}
          {file.source.split('\n').length} lines
        </span>
      </div>
      <div className="code-scroll">
        <pre ref={highlightRef} aria-hidden="true" className="code-highlight">
          {highlightedSource.map((line, index) => (
            <span className="code-line" key={`${file.path}-highlight-${index}`}>
              <span className="line-number">
                {String(index + 1).padStart(2, '0')}
              </span>
              <code>
                {line.length > 0
                  ? line.map((token, tokenIndex) => (
                      <span
                        className={token.className}
                        key={`${file.path}-${index}-${tokenIndex}`}
                      >
                        {token.value}
                      </span>
                    ))
                  : ' '}
              </code>
            </span>
          ))}
        </pre>
        <textarea
          ref={textareaRef}
          aria-label={`Edit ${file.path}`}
          aria-keyshortcuts="Control+F Meta+F Control+G Meta+G Control+Shift+F Meta+Shift+F"
          className="code-input"
          disabled={disabled}
          onChange={(event) => {
            updateCursor(event.currentTarget);
            onChange(event.target.value);
          }}
          onClick={(event) => updateCursor(event.currentTarget)}
          onKeyDown={handleKeyDown}
          onKeyUp={(event) => updateCursor(event.currentTarget)}
          onSelect={(event) => updateCursor(event.currentTarget)}
          onScroll={syncScroll}
          spellCheck={false}
          value={file.source}
          wrap="off"
        />
        {findOpen ? (
          <div className="code-find-bar" role="search">
            <span className="code-find-icon" aria-hidden="true">
              /
            </span>
            <input
              ref={findInputRef}
              aria-label="Find in file"
              onChange={(event) => {
                setFindQuery(event.target.value);
                setFindIndex(0);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  selectMatch(findIndex + (event.shiftKey ? -1 : 1));
                }
                if (event.key === 'Escape') {
                  event.preventDefault();
                  closeFind();
                }
              }}
              placeholder="Find"
              value={findQuery}
            />
            <span className="code-find-count">
              {findQuery
                ? `${matches.length ? findIndex + 1 : 0}/${matches.length}`
                : 'Find'}
            </span>
            <button
              aria-label="Find previous"
              disabled={!matches.length}
              onClick={() => selectMatch(findIndex - 1)}
              type="button"
            >
              ↑
            </button>
            <button
              aria-label="Find next"
              disabled={!matches.length}
              onClick={() => selectMatch(findIndex + 1)}
              type="button"
            >
              ↓
            </button>
            <button aria-label="Close find" onClick={closeFind} type="button">
              ×
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}

function EditorWorkbench({
  workspace,
  fileSystemAdapter,
}: {
  workspace: BrowserWorkspace;
  fileSystemAdapter: BrowserWorkspaceFileSystemAdapter;
}) {
  const registry = useBoltStyleToolRegistry();
  const snapshot = useSyncExternalStore(
    workspace.subscribe,
    workspace.getSnapshot,
    workspace.getSnapshot
  );
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const expectedPreviewRevisionRef = useRef(snapshot.revision);
  useEffect(() => {
    expectedPreviewRevisionRef.current = snapshot.revision;
  }, [snapshot.revision]);
  useEffect(() => {
    const handlePreviewMessage = (event: MessageEvent<unknown>) => {
      const iframeWindow = iframeRef.current?.contentWindow;
      if (!iframeWindow || event.source !== iframeWindow) return;
      if (!isPreviewBridgeMessage(event.data)) return;
      if (event.data.revision !== expectedPreviewRevisionRef.current) return;

      if (event.data.type === 'context-action.preview.ready') {
        workspace.setPreviewStatus(event.data.revision, 'synced');
      } else {
        workspace.setPreviewStatus(
          event.data.revision,
          'error',
          event.data.message
        );
      }
    };

    window.addEventListener('message', handlePreviewMessage);
    return () => window.removeEventListener('message', handlePreviewMessage);
  }, [workspace]);
  const [prompt, setPrompt] = useState(
    '보라색 테마로 바꾸고 기능 카드를 추가해줘'
  );
  const [running, setRunning] = useState(false);
  const executionControllerRef = useRef<AbortController | null>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Describe a change and I will turn it into visible workspace tool calls.',
    },
  ]);
  useEffect(() => {
    const messageList = messageListRef.current;
    if (!messageList) return;
    messageList.scrollTop = messageList.scrollHeight;
  }, [messages.length, running]);
  const [openRouterSettings, setOpenRouterSettings] = useState(
    readOpenRouterSettings
  );
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateFile, setShowCreateFile] = useState(false);
  const [workspaceSearchOpen, setWorkspaceSearchOpen] = useState(false);
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState('');
  const workspaceSearchRequestRef = useRef(0);
  const [workspaceSearchFocus, setWorkspaceSearchFocus] =
    useState<WorkspaceSearchFocusRequest | null>(null);
  const [openingFolder, setOpeningFolder] = useState(false);
  const [saving, setSaving] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const traceEntries = useSyncExternalStore(
    toolTraceStore.subscribe,
    toolTraceStore.getSnapshot,
    toolTraceStore.getSnapshot
  );
  const pendingApprovals = useSyncExternalStore(
    toolApprovalStore.subscribe,
    toolApprovalStore.getSnapshot,
    toolApprovalStore.getSnapshot
  );
  const hasWritableFolder = useSyncExternalStore(
    fileSystemAdapter.subscribe,
    () => fileSystemAdapter.hasWritableFolder,
    () => false
  );

  const activeFile =
    snapshot.files.find((file) => file.path === snapshot.activePath) ??
    snapshot.files[0];
  const dirtyPaths = useMemo(
    () => new Set(workspace.getDirtyFiles().map((file) => file.path)),
    [snapshot, workspace]
  );
  const deletedPaths = useMemo(
    () => workspace.getDeletedPaths(),
    [snapshot, workspace]
  );
  const hasUnsavedChanges = dirtyPaths.size > 0 || deletedPaths.length > 0;
  const canRevertActiveFile = dirtyPaths.has(activeFile.path);
  const canDeleteActiveFile =
    snapshot.files.length > 1 &&
    (activeFile.language !== 'html' ||
      snapshot.files.some(
        (file) => file.path !== activeFile.path && file.language === 'html'
      ));
  const assetUrls = useMemo(() => {
    const urls: Record<string, string> = {};
    for (const file of snapshot.files) {
      if (file.kind === 'asset' && file.blob) {
        urls[file.path] = URL.createObjectURL(file.blob);
      }
    }
    return urls;
  }, [snapshot.files]);
  useEffect(() => {
    return () => {
      for (const url of Object.values(assetUrls)) URL.revokeObjectURL(url);
    };
  }, [assetUrls]);
  const previewDocument = useMemo(
    () => buildPreviewDocument(snapshot.files, assetUrls, snapshot.revision),
    [assetUrls, snapshot.files, snapshot.revision]
  );
  const toolNames = registry.getToolNames().map(String);
  const [selectedToolName, setSelectedToolName] = useState(
    () => toolNames[0] ?? ''
  );
  const [toolFilter, setToolFilter] = useState('');
  const [previewRefreshToken, setPreviewRefreshToken] = useState(0);
  const visibleToolNames = useMemo(() => {
    const query = toolFilter.trim().toLowerCase();
    return query
      ? toolNames.filter((name) => name.toLowerCase().includes(query))
      : toolNames;
  }, [toolFilter, toolNames]);
  useEffect(() => {
    if (visibleToolNames.includes(selectedToolName)) return;
    setSelectedToolName(visibleToolNames[0] ?? '');
  }, [selectedToolName, visibleToolNames]);
  const selectedToolDefinition = selectedToolName
    ? registry.getToolDefinition(selectedToolName)
    : undefined;
  const isStorageReady = snapshot.storageMode !== 'loading';
  const storageLabel =
    snapshot.storageMode === 'indexed-db'
      ? 'Dexie · IndexedDB'
      : snapshot.storageMode === 'loading'
        ? 'Loading workspace'
        : 'Memory fallback';
  const previewStatusLabel =
    snapshot.preview.status === 'synced'
      ? 'synced'
      : snapshot.preview.status === 'error'
        ? 'runtime error'
        : 'waiting';
  const studioStatus = running
    ? 'Running tool chain'
    : snapshot.storageMode === 'loading'
      ? 'Loading workspace'
      : snapshot.preview.status === 'error'
        ? 'Preview error'
        : hasUnsavedChanges
          ? hasWritableFolder
            ? 'Unsaved folder changes'
            : 'Unsaved browser changes'
          : 'Ready';
  const studioStatusTone = running
    ? 'running'
    : snapshot.preview.status === 'error'
      ? 'error'
      : hasUnsavedChanges
        ? 'dirty'
        : 'ready';

  useEffect(() => {
    if (!hasWritableFolder || !hasUnsavedChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, hasWritableFolder]);

  const refreshPreview = () => {
    if (!isStorageReady) return;
    workspace.setPreviewStatus(snapshot.revision, 'waiting');
    setPreviewRefreshToken((current) => current + 1);
  };

  useEffect(() => {
    folderInputRef.current?.setAttribute('webkitdirectory', '');
  }, []);

  const importFolder = async (imported: ImportedFolder, verb = 'Opened') => {
    await workspace.importFolder(imported);
    const skippedMessage = imported.skipped.length
      ? ` Skipped ${imported.skipped.length} unsupported or oversized file(s).`
      : '';
    const syncMessage = fileSystemAdapter.hasWritableFolder
      ? ' Folder sync is enabled for Save.'
      : ' Changes are saved to the browser workspace.';
    setMessages((current) => [
      ...current,
      {
        role: 'assistant',
        text: `${verb} ${imported.rootName} with ${imported.files.length} file(s).${syncMessage}${skippedMessage}`,
      },
    ]);
  };

  const handleFolderInput = async (fileList: FileList | null) => {
    if (!fileList) return;
    setOpeningFolder(true);
    try {
      await importFolder(await fileSystemAdapter.importFileList(fileList));
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text:
            error instanceof Error ? error.message : 'Folder import failed.',
        },
      ]);
    } finally {
      setOpeningFolder(false);
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
  };

  const handleOpenFolder = async () => {
    if (openingFolder || !isStorageReady) return;
    const picker = (
      window as Window & {
        showDirectoryPicker?: unknown;
      }
    ).showDirectoryPicker;
    if (!picker) {
      folderInputRef.current?.click();
      return;
    }

    setOpeningFolder(true);
    try {
      await importFolder(await fileSystemAdapter.pickFolder());
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text:
            error instanceof Error ? error.message : 'Folder import failed.',
        },
      ]);
    } finally {
      setOpeningFolder(false);
    }
  };

  const handleReloadFolder = async () => {
    if (
      openingFolder ||
      !isStorageReady ||
      !hasWritableFolder ||
      (workspace.isDirty() &&
        !window.confirm(
          'Reload the connected folder and discard unsaved browser workspace changes?'
        ))
    ) {
      return;
    }

    setOpeningFolder(true);
    try {
      await importFolder(await fileSystemAdapter.reloadFolder(), 'Reloaded');
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text:
            error instanceof Error ? error.message : 'Folder reload failed.',
        },
      ]);
    } finally {
      setOpeningFolder(false);
    }
  };

  const handleDisconnectFolder = async () => {
    if (
      openingFolder ||
      !isStorageReady ||
      !hasWritableFolder ||
      (workspace.isDirty() &&
        !window.confirm(
          'Disconnect the folder and keep changes only in the browser workspace?'
        ))
    ) {
      return;
    }

    await executeQuickTool({
      name: 'workspace.disconnectFolder',
      arguments: {},
    });
  };

  const saveWorkspace = async () => {
    if (saving || !isStorageReady || !workspace.isDirty()) return;
    const dirtyFiles = workspace.getDirtyFiles();
    const deletedPaths = workspace.getDeletedPaths();
    setSaving(true);
    try {
      if (fileSystemAdapter.hasWritableFolder) {
        const saveRevision = workspace.getSnapshot().revision;
        await fileSystemAdapter.writeFiles(dirtyFiles);
        await fileSystemAdapter.removeFiles(deletedPaths);
        const checkpointUpdated =
          await workspace.markSavedIfRevision(saveRevision);
        setMessages((current) => [
          ...current,
          {
            role: 'assistant',
            text: checkpointUpdated
              ? `Saved ${dirtyFiles.length} file(s)${deletedPaths.length ? ` and deleted ${deletedPaths.length} file(s)` : ''} in the selected folder and browser workspace.`
              : `Wrote ${dirtyFiles.length} file(s)${deletedPaths.length ? ` and deleted ${deletedPaths.length} file(s)` : ''} to the selected folder, but newer editor changes remain pending.`,
          },
        ]);
      } else {
        await workspace.markSaved();
      }
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: error instanceof Error ? error.message : 'Save failed.',
        },
      ]);
    } finally {
      setSaving(false);
    }
  };

  const downloadActiveFile = () => {
    const blob =
      activeFile.kind === 'asset' && activeFile.blob
        ? activeFile.blob
        : new Blob([activeFile.source], {
            type: activeFile.mimeType ?? 'text/plain',
          });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = activeFile.path.split('/').pop() ?? 'workspace-file';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    window.setTimeout(() => {
      anchor.remove();
      URL.revokeObjectURL(url);
    }, 0);
    setMessages((current) => [
      ...current,
      { role: 'assistant', text: `Downloaded ${activeFile.path}.` },
    ]);
  };

  useEffect(() => {
    const handleSaveShortcut = (event: globalThis.KeyboardEvent) => {
      if (
        !(event.metaKey || event.ctrlKey) ||
        event.key.toLowerCase() !== 's' ||
        showSettings ||
        showCreateFile
      ) {
        return;
      }
      event.preventDefault();
      void saveWorkspace();
    };

    window.addEventListener('keydown', handleSaveShortcut);
    return () => window.removeEventListener('keydown', handleSaveShortcut);
  }, [isStorageReady, saving, showCreateFile, showSettings, workspace]);

  const cancelExecution = () => {
    denyPendingToolApprovals();
    const controller = executionControllerRef.current;
    if (controller && !controller.signal.aborted) controller.abort();
  };

  const executePrompt = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || running) return;
    const controller = new AbortController();
    executionControllerRef.current = controller;
    const agentTrace = startAgentTrace(
      openRouterSettings.apiKey ? 'openrouter' : 'local'
    );
    setPrompt('');
    setMessages((current) => [...current, { role: 'user', text: trimmed }]);
    setRunning(true);
    try {
      const result = openRouterSettings.apiKey
        ? await runOpenRouterAgent(
            registry,
            trimmed,
            openRouterSettings,
            controller.signal
          )
        : await runLocalAgent(registry, workspace, trimmed, controller.signal);
      throwIfAborted(controller.signal);
      finishAgentTrace(
        agentTrace,
        result.failed ? 'failed' : 'completed',
        result.failed
          ? 'tool call failed'
          : `${result.toolNames.length} tool call(s)`
      );
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: result.response,
          tools: result.toolNames,
          ...(result.failed
            ? {
                tone: 'error' as const,
                ...(result.retryable === false ? {} : { retryPrompt: trimmed }),
              }
            : {}),
        },
      ]);
    } catch (error) {
      finishAgentTrace(
        agentTrace,
        controller.signal.aborted ? 'cancelled' : 'failed',
        controller.signal.aborted
          ? 'cancelled'
          : error instanceof OpenRouterRequestError
            ? error.code
            : 'agent request failed'
      );
      const retryable =
        !(error instanceof OpenRouterRequestError) || error.retryable;
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: controller.signal.aborted
            ? 'Execution cancelled.'
            : error instanceof Error
              ? error.message
              : 'Request failed.',
          tone: controller.signal.aborted ? 'cancelled' : 'error',
          ...(controller.signal.aborted || !retryable
            ? {}
            : { retryPrompt: trimmed }),
        },
      ]);
    } finally {
      if (executionControllerRef.current === controller) {
        executionControllerRef.current = null;
      }
      setRunning(false);
    }
  };

  const executeQuickTool = async (
    call: ToolCall
  ): Promise<ToolExecutionOutcome> => {
    if (running) {
      return {
        ok: false,
        message: 'Another tool execution is already running.',
      };
    }
    const controller = new AbortController();
    executionControllerRef.current = controller;
    setRunning(true);
    try {
      const result = await registry.callTool(
        {
          id: `palette-${Date.now()}`,
          method: 'tools/call',
          params: { name: call.name, arguments: call.arguments },
        },
        { context: { source: 'local' }, signal: controller.signal }
      );
      throwIfAborted(controller.signal);
      const message = result.isError
        ? resultText(result)
        : call.name === 'workspace.disconnectFolder'
          ? 'Disconnected the local folder. Future saves stay in the browser workspace until another folder is opened.'
          : `Executed ${call.name}. Preview revision acknowledged.`;
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: message,
          tools: [call.name],
          ...(result.isError
            ? {
                tone: 'error' as const,
                ...(result.error?.retryable === false
                  ? {}
                  : { retryTool: call }),
              }
            : {}),
        },
      ]);
      return result.isError ? { ok: false, message } : { ok: true };
    } catch (error) {
      const message = controller.signal.aborted
        ? 'Execution cancelled.'
        : error instanceof Error && error.message.trim()
          ? error.message
          : 'Tool execution failed.';
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: message,
          tools: [call.name],
          tone: controller.signal.aborted ? 'cancelled' : 'error',
          ...(controller.signal.aborted ? {} : { retryTool: call }),
        },
      ]);
      return { ok: false, message };
    } finally {
      if (executionControllerRef.current === controller) {
        executionControllerRef.current = null;
      }
      setRunning(false);
    }
  };

  const createWorkspaceFile = (path: string, source: string) =>
    executeQuickTool({
      name: 'workspace.createFile',
      arguments: { path, source },
    });

  const deleteActiveFile = () => {
    if (!canDeleteActiveFile || running) return;
    if (!window.confirm(`Delete ${activeFile.path} from this workspace?`)) {
      return;
    }
    void executeQuickTool({
      name: 'workspace.deleteFile',
      arguments: { path: activeFile.path },
    });
  };

  const revertActiveFile = () => {
    if (!canRevertActiveFile || running) return;
    if (
      !window.confirm(
        `Discard unsaved changes in ${activeFile.path}? Undo can restore this session's edit.`
      )
    ) {
      return;
    }
    void executeQuickTool({
      name: 'workspace.revertFile',
      arguments: { path: activeFile.path },
    });
  };

  const paletteCallFor = (name: string): ToolCall | null => {
    switch (name) {
      case 'workspace.getStatus':
      case 'workspace.listFiles':
      case 'preview.getStatus':
        return { name, arguments: {} };
      case 'workspace.readFile':
        return { name, arguments: { path: activeFile.path } };
      case 'workspace.createFile':
        return {
          name,
          arguments: {
            path: 'notes.md',
            source: '# Created from the tool palette\n',
          },
        };
      case 'workspace.deleteFile':
        return { name, arguments: { path: 'README.md' } };
      case 'workspace.writeFile':
        return {
          name,
          arguments: { path: activeFile.path, source: activeFile.source },
        };
      case 'workspace.saveAll':
        return { name, arguments: {} };
      case 'workspace.disconnectFolder':
        return { name, arguments: {} };
      case 'workspace.applyPatch': {
        if (activeFile.kind === 'asset') return null;
        const line = activeFile.source
          .split('\n')
          .find((value) => value.trim());
        if (!line) return null;
        return {
          name,
          arguments: {
            path: activeFile.path,
            search: line,
            replace: `${line}  `,
            occurrence: 'first',
            expectedRevision: snapshot.revision,
          },
        };
      }
      case 'workspace.revertFile':
        return { name, arguments: { path: activeFile.path } };
      case 'preview.setTheme':
        return { name, arguments: { theme: 'violet' } };
      case 'preview.addFeature':
        return {
          name,
          arguments: {
            title: 'Palette feature',
            description: 'Added from the visible tool palette.',
          },
        };
      case 'preview.updateHero':
        return {
          name,
          arguments: {
            title: 'A page shaped by a tool call.',
            subtitle: 'The visible registry can update the hero copy directly.',
          },
        };
      default:
        return null;
    }
  };

  const runSelectedTool = async () => {
    if (!selectedToolName || !selectedToolDefinition) return;
    const call = paletteCallFor(selectedToolName);
    if (!call) return;
    if (
      selectedToolDefinition.annotations?.destructiveHint === true &&
      !window.confirm(`Run the destructive sample for ${selectedToolName}?`)
    ) {
      return;
    }
    await executeQuickTool(call);
  };

  const closeWorkspaceSearch = () => {
    setWorkspaceSearchOpen(false);
    setWorkspaceSearchQuery('');
  };

  return (
    <div className="studio-shell">
      <header className="studio-topbar">
        <div className="brand-lockup">
          <span className="brand-mark">✦</span>
          <span>Context-Action</span>
          <span className="brand-divider">/</span>
          <strong>Web Studio</strong>
        </div>
        <div className="topbar-center">
          <span className="workspace-name">{snapshot.rootName}</span>
          <span className="mode-chip">
            <span className="status-dot" />
            {openRouterSettings.apiKey ? 'OpenRouter' : 'Local agent'}
          </span>
          <span className="storage-chip">{storageLabel}</span>
          {hasWritableFolder ? (
            <span className="folder-sync-chip">folder sync</span>
          ) : null}
          <span className="contract-chip">tools/list · {toolNames.length}</span>
        </div>
        <div className="topbar-actions">
          <button
            aria-label="Open OpenRouter settings"
            className="settings-trigger"
            onClick={() => setShowSettings(true)}
            type="button"
          >
            ⚙ Settings
          </button>
          <a
            href="https://github.com/mineclover/context-action"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <a
            href="https://mineclover.github.io/context-action/example/integrations/live-web-coding"
            target="_blank"
            rel="noreferrer"
          >
            Full demo ↗
          </a>
        </div>
      </header>

      <div className="studio-workspace">
        <aside className="studio-sidebar">
          <div className="explorer-heading">
            <div className="panel-label">Explorer</div>
            <div className="explorer-actions">
              <button
                aria-label="Create new workspace file"
                className="new-file-button"
                disabled={openingFolder || !isStorageReady || running}
                onClick={() => setShowCreateFile(true)}
                title="Create a new text file"
                type="button"
              >
                + New
              </button>
              {hasWritableFolder ? (
                <>
                  <button
                    aria-label="Reload connected workspace folder"
                    className="refresh-folder-button"
                    disabled={openingFolder || !isStorageReady || running}
                    onClick={() => void handleReloadFolder()}
                    title="Re-read files from the connected folder"
                    type="button"
                  >
                    {openingFolder ? 'Reloading…' : 'Reload'}
                  </button>
                  <button
                    aria-label="Disconnect linked workspace folder"
                    className="disconnect-folder-button"
                    disabled={openingFolder || !isStorageReady || running}
                    onClick={() => void handleDisconnectFolder()}
                    title="Keep the browser workspace but stop local folder sync"
                    type="button"
                  >
                    Disconnect
                  </button>
                </>
              ) : null}
              <button
                className="open-folder-button"
                disabled={openingFolder || !isStorageReady || running}
                onClick={() => void handleOpenFolder()}
                type="button"
              >
                {openingFolder ? 'Opening…' : 'Open'}
              </button>
            </div>
            <input
              ref={folderInputRef}
              accept=".avif,.css,.gif,.htm,.html,.ico,.jpeg,.jpg,.js,.json,.mjs,.md,.otf,.png,.svg,.ts,.tsx,.ttf,.txt,.wasm,.webp,.woff,.woff2"
              aria-label="Choose workspace folder"
              className="folder-input"
              multiple
              onChange={(event) => void handleFolderInput(event.target.files)}
              type="file"
            />
          </div>
          <div className="tree-root">
            <span>⌄</span> {snapshot.rootName}
          </div>
          <FileTree
            activePath={snapshot.activePath}
            disabled={!isStorageReady}
            dirtyPaths={dirtyPaths}
            files={snapshot.files}
            onSelect={(path) => workspace.setActivePath(path)}
          />

          <div className="sidebar-section-heading">
            <span>Tools</span>
            <span className="count-badge">
              {visibleToolNames.length === toolNames.length
                ? toolNames.length
                : `${visibleToolNames.length}/${toolNames.length}`}
            </span>
          </div>
          <label className="tool-filter">
            <span className="sr-only">Filter tools</span>
            <input
              aria-label="Filter tools"
              disabled={!isStorageReady}
              onChange={(event) => setToolFilter(event.target.value)}
              placeholder="Filter tools…"
              type="search"
              value={toolFilter}
            />
            {toolFilter ? (
              <button
                aria-label="Clear tool filter"
                onClick={() => setToolFilter('')}
                type="button"
              >
                ×
              </button>
            ) : null}
          </label>
          <div className="tool-palette">
            {visibleToolNames.length ? (
              visibleToolNames.map((name) => (
                <button
                  className={`tool-row ${name === selectedToolName ? 'tool-row-selected' : ''}`}
                  data-tool-name={name}
                  disabled={!isStorageReady || running}
                  key={name}
                  onClick={() => setSelectedToolName(name)}
                  type="button"
                >
                  <span className="tool-glyph">
                    {name.startsWith('preview') ? '◈' : '◇'}
                  </span>
                  <span>{name}</span>
                </button>
              ))
            ) : (
              <div className="tool-filter-empty">No matching tools</div>
            )}
          </div>
          {selectedToolDefinition ? (
            <section
              aria-label="Selected tool definition"
              className="tool-inspector"
            >
              <div className="tool-inspector-heading">
                <span>Definition</span>
                <span className="tool-inspector-format">MCP</span>
              </div>
              <strong>{selectedToolDefinition.name}</strong>
              <p>{selectedToolDefinition.description}</p>
              <div className="tool-annotations">
                {Object.entries(selectedToolDefinition.annotations ?? {})
                  .filter(([, value]) => Boolean(value))
                  .map(([key]) => (
                    <span key={key}>{key}</span>
                  ))}
              </div>
              <button
                className="tool-run-button"
                disabled={
                  !isStorageReady ||
                  running ||
                  !paletteCallFor(selectedToolName)
                }
                onClick={() => void runSelectedTool()}
                type="button"
              >
                {selectedToolDefinition.annotations?.destructiveHint
                  ? 'Run destructive sample'
                  : 'Run sample'}
              </button>
              <div className="tool-schema-label">Input schema</div>
              <pre>
                {JSON.stringify(selectedToolDefinition.inputSchema, null, 2)}
              </pre>
              {selectedToolDefinition.outputSchema ? (
                <>
                  <div className="tool-schema-label">Output schema</div>
                  <pre>
                    {JSON.stringify(
                      selectedToolDefinition.outputSchema,
                      null,
                      2
                    )}
                  </pre>
                </>
              ) : null}
            </section>
          ) : null}
          <div className="trace-section">
            <div className="sidebar-section-heading">
              <span>Execution trace</span>
              <span className="trace-heading-actions">
                <button
                  aria-label="Clear execution trace"
                  className="trace-clear-button"
                  disabled={!traceEntries.length}
                  onClick={clearToolTrace}
                  type="button"
                >
                  Clear
                </button>
                <span className="count-badge">{traceEntries.length}</span>
              </span>
            </div>
            <div aria-label="Tool execution trace" className="trace-list">
              {traceEntries.length ? (
                traceEntries.slice(0, 8).map((entry) => (
                  <div
                    className={`trace-row trace-row-${entry.status}`}
                    key={entry.id}
                    title={
                      entry.kind === 'call'
                        ? `toolCallId ${entry.id}`
                        : entry.kind === 'agent'
                          ? `agent request · ${entry.source}`
                          : 'tools/list discovery'
                    }
                  >
                    <span className="trace-mark" aria-hidden="true">
                      {entry.status === 'running'
                        ? '…'
                        : entry.status === 'failed'
                          ? '!'
                          : entry.status === 'cancelled'
                            ? '↶'
                            : '✓'}
                    </span>
                    <span className="trace-copy">
                      <strong>{entry.name}</strong>
                      <small>
                        {entry.kind === 'discovery'
                          ? entry.summary
                          : [
                              entry.kind === 'agent'
                                ? 'agent'
                                : formatTraceId(entry.id),
                              entry.source,
                              `${entry.durationMs ?? 0}ms`,
                              entry.summary,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                      </small>
                    </span>
                  </div>
                ))
              ) : (
                <div className="trace-empty">
                  tools/list ready · waiting for a call
                </div>
              )}
            </div>
          </div>
        </aside>

        <main className="studio-main">
          <div className="editor-toolbar">
            <div className="editor-tabs">
              {snapshot.files.map((file) => (
                <button
                  className={`editor-tab ${file.path === snapshot.activePath ? 'editor-tab-active' : ''}`}
                  key={file.path}
                  onClick={() => workspace.setActivePath(file.path)}
                  type="button"
                >
                  <FileIcon file={file} />
                  {file.path}
                  {dirtyPaths.has(file.path) ? (
                    <span
                      aria-label="Unsaved changes"
                      className="tab-dirty-dot"
                      title="Unsaved changes"
                    >
                      •
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
            <div className="editor-controls">
              <button
                aria-keyshortcuts="Control+Shift+F Meta+Shift+F"
                aria-label={
                  workspaceSearchOpen
                    ? 'Close workspace search'
                    : 'Search workspace'
                }
                className={`editor-action editor-search ${workspaceSearchOpen ? 'editor-search-active' : ''}`}
                disabled={!isStorageReady || running}
                onClick={() => {
                  if (workspaceSearchOpen) {
                    closeWorkspaceSearch();
                  } else {
                    setWorkspaceSearchOpen(true);
                    setWorkspaceSearchQuery('');
                  }
                }}
                title="Search all workspace files (⌘/Ctrl+Shift+F)"
                type="button"
              >
                {workspaceSearchOpen ? 'Close search' : 'Search'}
              </button>
              <button
                aria-label="Undo last edit"
                className="editor-action"
                disabled={!isStorageReady || !workspace.canUndo()}
                onClick={() => workspace.undo()}
                type="button"
              >
                ↶ Undo
              </button>
              <button
                aria-label="Redo last edit"
                className="editor-action"
                disabled={!isStorageReady || !workspace.canRedo()}
                onClick={() => workspace.redo()}
                type="button"
              >
                ↷ Redo
              </button>
              <button
                aria-label={`Delete ${activeFile.path}`}
                className="editor-delete"
                disabled={!isStorageReady || running || !canDeleteActiveFile}
                onClick={deleteActiveFile}
                title="Delete the active file through workspace.deleteFile"
                type="button"
              >
                Delete
              </button>
              <button
                aria-label={`Revert ${activeFile.path}`}
                className="editor-revert"
                disabled={!isStorageReady || running || !canRevertActiveFile}
                onClick={revertActiveFile}
                title="Discard active file changes through workspace.revertFile"
                type="button"
              >
                Revert
              </button>
              <button
                aria-label={`Download ${activeFile.path}`}
                className="editor-download"
                disabled={!isStorageReady || running}
                onClick={downloadActiveFile}
                title="Download the active source or Blob asset"
                type="button"
              >
                Download
              </button>
              <button
                aria-keyshortcuts="Control+S Meta+S"
                className="editor-save"
                disabled={!isStorageReady || saving || !workspace.isDirty()}
                onClick={() => void saveWorkspace()}
                title={
                  hasWritableFolder
                    ? 'Write dirty files to the selected folder and IndexedDB'
                    : 'Mark the current browser workspace checkpoint as saved'
                }
                type="button"
              >
                {saving
                  ? 'Saving…'
                  : hasWritableFolder
                    ? 'Save to folder'
                    : 'Save'}
              </button>
              <span
                className={`save-status ${workspace.isDirty() ? 'save-status-dirty' : ''}`}
              >
                <span className="status-dot" />
                {workspace.isDirty() ? 'Unsaved changes' : 'Saved'}
              </span>
              <span className="revision-label">
                revision {snapshot.revision}
              </span>
            </div>
          </div>
          {workspaceSearchOpen ? (
            <WorkspaceSearchPanel
              files={snapshot.files}
              onClose={closeWorkspaceSearch}
              onQueryChange={setWorkspaceSearchQuery}
              onSelect={(match) => {
                workspace.setActivePath(match.path);
                workspaceSearchRequestRef.current += 1;
                setWorkspaceSearchFocus({
                  path: match.path,
                  line: match.line,
                  requestId: workspaceSearchRequestRef.current,
                });
                closeWorkspaceSearch();
              }}
              query={workspaceSearchQuery}
            />
          ) : null}
          <section className="code-editor" aria-label="Workspace source">
            {activeFile.kind === 'asset' ? (
              <>
                <div className="code-header">
                  <span>{activeFile.language}</span>
                  <span>preview asset · read-only</span>
                </div>
                <div className="asset-placeholder">
                  <div className="asset-placeholder-icon">◇</div>
                  <strong>{activeFile.path}</strong>
                  <span>
                    {activeFile.mimeType ?? 'binary asset'} ·{' '}
                    {formatFileSize(activeFile.blob?.size ?? 0)}
                  </span>
                  <p>
                    This Blob is preserved in the browser workspace and
                    available to the sandbox preview. Binary assets are not
                    edited as text.
                  </p>
                </div>
              </>
            ) : (
              <CodeEditor
                disabled={!isStorageReady || running}
                file={activeFile}
                focusRequest={
                  activeFile.path === workspaceSearchFocus?.path
                    ? workspaceSearchFocus
                    : undefined
                }
                onFocusRequestConsumed={() => setWorkspaceSearchFocus(null)}
                onOpenWorkspaceSearch={() => {
                  setWorkspaceSearchOpen(true);
                  setWorkspaceSearchQuery('');
                }}
                onChange={(source) =>
                  workspace.updateFile(activeFile.path, source)
                }
              />
            )}
          </section>

          <section className="chat-panel">
            <div className="chat-heading">
              <div>
                <span className="panel-label">Agent</span>
                <strong>What should we change?</strong>
              </div>
              <span className="agent-badge">LOCAL / TOOL CALLING</span>
            </div>
            {pendingApprovals.length ? (
              <section
                aria-label="Pending tool approvals"
                className="approval-panel"
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
                      {approval.argumentKeys.length
                        ? `arguments · ${approval.argumentKeys.join(', ')}`
                        : 'no arguments'}{' '}
                      · {approval.source}
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
                        onClick={() => resolveToolApproval(approval.id, 'deny')}
                        type="button"
                      >
                        Deny
                      </button>
                      <button
                        aria-label={`Approve ${approval.name}`}
                        className="approval-allow"
                        onClick={() =>
                          resolveToolApproval(approval.id, 'allow')
                        }
                        type="button"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            ) : null}
            <div className="message-list" ref={messageListRef}>
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
                        {message.tools.map((tool) => (
                          <span key={tool}>{tool}</span>
                        ))}
                      </div>
                    ) : null}
                    {!running && (message.retryPrompt || message.retryTool) ? (
                      <button
                        className="message-retry"
                        onClick={() => {
                          if (message.retryPrompt) {
                            void executePrompt(message.retryPrompt);
                          } else if (message.retryTool) {
                            void executeQuickTool(message.retryTool);
                          }
                        }}
                        type="button"
                      >
                        Retry
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
              {running ? (
                <div className="running-line">
                  <span className="pulse-dot" /> executing typed tool call…
                </div>
              ) : null}
            </div>
            <div className="composer-wrap">
              <textarea
                aria-label="Web studio prompt"
                disabled={!isStorageReady}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void executePrompt(prompt);
                  }
                }}
                placeholder="Ask the local agent to change the page…"
                value={prompt}
              />
              <button
                className={`send-button ${running ? 'send-button-cancel' : ''}`}
                disabled={!isStorageReady}
                onClick={() =>
                  running ? cancelExecution() : void executePrompt(prompt)
                }
                type="button"
              >
                {running ? 'Cancel' : 'Send'} <span>{running ? '×' : '↗'}</span>
              </button>
            </div>
            <div className="prompt-recipes-heading">
              Try a tool-chain recipe
            </div>
            <div
              aria-label="Tool-chain prompt recipes"
              className="prompt-chips"
            >
              {[
                'Make it emerald',
                'Add a feature card',
                'Update the hero',
                'Show workspace status',
                'Create notes.md',
                'Save to folder',
                'Disconnect folder',
              ].map((example) => (
                <button
                  disabled={!isStorageReady || running}
                  key={example}
                  onClick={() => setPrompt(example)}
                  type="button"
                >
                  {example}
                </button>
              ))}
            </div>
          </section>
        </main>

        <aside className="preview-panel">
          <div className="preview-toolbar">
            <div>
              <span className="panel-label">Preview</span>
              <strong>localhost · sandbox</strong>
            </div>
            <span
              className={`preview-status preview-status-${snapshot.preview.status}`}
            >
              <span className="status-dot" /> {previewStatusLabel}
            </span>
          </div>
          <div className="browser-frame">
            <div className="browser-chrome">
              <div className="browser-dots">
                <span />
                <span />
                <span />
              </div>
              <div className="address-bar">
                preview://{snapshot.rootName}/{activeFile.path}
              </div>
              <button
                aria-label="Refresh preview"
                className="refresh-button"
                disabled={!isStorageReady}
                onClick={refreshPreview}
                title="Reload the current workspace revision"
                type="button"
              >
                ↻
              </button>
            </div>
            <iframe
              className="preview-iframe"
              ref={iframeRef}
              sandbox="allow-scripts"
              srcDoc={previewDocument}
              title="Live generated web preview"
              key={previewRefreshToken}
            />
          </div>
          <div className="preview-footer">
            <div>
              <span className="panel-label">Runtime</span>
              <strong>Parent registry → iframe</strong>
            </div>
            <div className={`sync-row sync-row-${snapshot.preview.status}`}>
              <span className="status-dot" /> revision {snapshot.revision}{' '}
              {snapshot.preview.status === 'synced'
                ? 'acknowledged'
                : snapshot.preview.status === 'error'
                  ? (snapshot.preview.message ?? 'failed')
                  : 'pending acknowledgement'}
            </div>
          </div>
        </aside>
      </div>

      <footer className="studio-statusbar">
        <span className={`statusbar-state statusbar-state-${studioStatusTone}`}>
          <span className="status-dot" /> {studioStatus}
        </span>
        <span>
          {openRouterSettings.apiKey
            ? `OpenRouter · ${openRouterSettings.model}`
            : `Context-Action ToolContext · ${storageLabel}`}
        </span>
        <span>Persistent browser workspace</span>
        <span className="statusbar-spacer" />
        <span>HTML · CSS · JS</span>
      </footer>
      {showSettings ? (
        <OpenRouterSettingsDialog
          initialSettings={openRouterSettings}
          onClose={() => setShowSettings(false)}
          onSave={(settings) =>
            setOpenRouterSettings(saveOpenRouterSettings(settings))
          }
        />
      ) : null}
      {showCreateFile ? (
        <CreateWorkspaceFileDialog
          onClose={() => setShowCreateFile(false)}
          onCreate={createWorkspaceFile}
        />
      ) : null}
    </div>
  );
}

function ToolRuntime() {
  const [repository] = useState(() => new WebCodingWorkspaceRepository());
  const [workspace] = useState(() => new BrowserWorkspace(repository));
  const [fileSystemAdapter] = useState(
    () =>
      new BrowserWorkspaceFileSystemAdapter({
        getDirectoryHandle: () => repository.getDirectoryHandle(),
        setDirectoryHandle: (handle) => repository.setDirectoryHandle(handle),
        clearDirectoryHandle: () => repository.clearDirectoryHandle(),
      })
  );
  useEffect(() => {
    void (async () => {
      await workspace.hydrate();
      if (workspace.getSnapshot().storageMode === 'indexed-db') {
        await fileSystemAdapter.restorePersistedFolder();
      }
    })();
  }, [fileSystemAdapter, workspace]);
  return (
    <ToolHandlers workspace={workspace} fileSystemAdapter={fileSystemAdapter}>
      <EditorWorkbench
        workspace={workspace}
        fileSystemAdapter={fileSystemAdapter}
      />
    </ToolHandlers>
  );
}

export function BoltStyleEditor() {
  return (
    <BoltStyleToolProvider>
      <ToolRuntime />
    </BoltStyleToolProvider>
  );
}
