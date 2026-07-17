import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import { PageWithLogMonitor } from '@/components/LogMonitor';
import { LiveEditorDocumentManager } from '../../../lib/live-code-editor-bridge';
import { LiveEditorWorkspaceRepository } from '../../../lib/live-code-editor-storage';
import {
  createWorkspaceFile,
  LiveEditorWorkspaceManager,
} from '../../../lib/live-code-editor-workspace';
import { formatLiveWebCodingTraceId } from '../../../lib/live-web-coding-trace';
import { formatModelName } from '../../../lib/openrouter-models';
import { createToolCallSessionId } from '../../../lib/tool-call-trace';
import { formatToolResultText } from '../../../lib/tool-result-format';
import { useLiveEditorDocumentActions } from '../live-code-editor/actions/useLiveEditorDocumentActions';
import { useLiveEditorProviderSettings } from '../live-code-editor/actions/useLiveEditorProviderSettings';
import { LiveCodeEditorPreviewFrame } from '../live-code-editor/LiveCodeEditorPreviewFrame';
import { useLiveWebCodingAgentExecution } from './actions/useLiveWebCodingAgentExecution';
import { useLiveWebCodingToolActions } from './actions/useLiveWebCodingToolActions';
import { useLiveWebCodingTraceActions } from './actions/useLiveWebCodingTraceActions';
import { useLiveWebCodingWorkspaceActions } from './actions/useLiveWebCodingWorkspaceActions';
import {
  LIVE_WEB_WORKSPACE_ID,
  LiveWebCodingToolHandlers,
} from './handlers/LiveWebCodingToolHandlers';
import { useLiveWebCodingObservables } from './hooks/useLiveWebCodingObservables';
import styles from './LiveWebCodingPage.module.css';
import { LiveWebCodingToolProvider } from './LiveWebCodingToolchain';

const WEB_WORKSPACE_ID = LIVE_WEB_WORKSPACE_ID;
const WEB_WORKSPACE_ROOT = 'live-web-coding-demo';

const defaultWebFiles = [
  createWorkspaceFile(
    'index.html',
    `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Realtime Web Coding</title>
    <link rel="stylesheet" href="./style.css" />
    <script src="./script.js" defer></script>
  </head>
  <body>
    <main class="page-shell">
      <span class="eyebrow">tool calling / live preview</span>
      <section class="hero">
        <div>
          <p class="kicker">Context-Action playground</p>
          <h1 id="hero-title">Build a tiny web, one tool call at a time.</h1>
          <p id="hero-subtitle">Chat with the workspace, then watch the sandbox update immediately.</p>
        </div>
        <button id="hero-button" class="hero-button" type="button">Try the interaction</button>
      </section>
      <section id="feature-grid" class="feature-grid">
        <article class="feature-card"><strong>1. Discover</strong><span>web.getWorkspace lists the editable files.</span></article>
        <article class="feature-card"><strong>2. Mutate</strong><span>web.applyPatch applies a bounded change.</span></article>
        <article class="feature-card"><strong>3. Render</strong><span>The parent waits for iframe acknowledgement.</span></article>
      </section>
      <section class="cta"><strong id="cta-title">The preview is the result.</strong><span id="cta-copy">Try a quick tool from the panel.</span></section>
    </main>
  </body>
</html>`
  ),
  createWorkspaceFile(
    'style.css',
    `:root {
  --accent: #6d5dfc;
  --accent-soft: #eeedff;
  --ink: #172033;
  --muted: #667085;
  --canvas: #f7f8fc;
}

* { box-sizing: border-box; }
body { margin: 0; background: var(--canvas); color: var(--ink); font-family: Inter, system-ui, sans-serif; }
.page-shell { display: grid; gap: 22px; max-width: 720px; margin: 0 auto; padding: 34px 22px 48px; }
.eyebrow, .kicker { color: var(--accent); font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
.hero { display: flex; align-items: end; justify-content: space-between; gap: 18px; border: 1px solid #e0e4ed; border-radius: 18px; padding: 24px; background: white; box-shadow: 0 14px 35px rgba(23, 32, 51, .08); }
.hero h1 { max-width: 520px; margin: 8px 0; font-size: clamp(28px, 5vw, 48px); letter-spacing: -.06em; line-height: 1; }
.hero p { margin: 0; color: var(--muted); line-height: 1.6; }
.hero-button { border: 0; border-radius: 999px; padding: 11px 15px; background: var(--accent); color: white; cursor: pointer; font-weight: 800; white-space: nowrap; }
.feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.feature-card, .cta { display: grid; gap: 7px; border: 1px solid #e0e4ed; border-radius: 14px; padding: 16px; background: white; }
.feature-card strong, .cta strong { color: var(--accent); }
.feature-card span, .cta span { color: var(--muted); font-size: 13px; line-height: 1.5; }
.cta { background: var(--accent-soft); }
@media (max-width: 580px) { .hero { align-items: start; flex-direction: column; } .feature-grid { grid-template-columns: 1fr; } }
`
  ),
  createWorkspaceFile(
    'script.js',
    `const button = document.querySelector('#hero-button');
const ctaCopy = document.querySelector('#cta-copy');

button?.addEventListener('click', () => {
  ctaCopy.textContent = 'The iframe received a real click from the generated page.';
  button.textContent = 'Interaction received';
});
`
  ),
];

function createDefaultWebWorkspaceBlobFiles() {
  return defaultWebFiles.map((file) => ({
    path: file.path,
    blob: new Blob([file.source], { type: file.mimeType }),
    mimeType: file.mimeType,
    size: file.size,
  }));
}

function createWebPatchSample(
  file: ReturnType<LiveEditorWorkspaceManager['getActiveFile']>
): { search: string; replace: string } | null {
  if (!file?.isText) return null;

  if (file.path.toLowerCase().endsWith('.html')) {
    const heroTitle = file.source
      .match(/<h1\b[^>]*id="hero-title"[^>]*>([^<]+)<\/h1>/i)?.[1]
      ?.trim();
    if (heroTitle) {
      return { search: heroTitle, replace: `${heroTitle} · patched` };
    }
  }

  if (file.path.toLowerCase().endsWith('.css')) {
    const accent = file.source.match(/(--accent:\s*)(#[0-9a-f]+)(;)/i)?.[2];
    if (accent) {
      const nextAccent =
        accent.toLowerCase() === '#6d5dfc' ? '#0f9f78' : '#6d5dfc';
      return { search: accent, replace: nextAccent };
    }
  }

  const fallbackLine = file.source
    .split('\n')
    .find((line) => line.trim().length > 0 && !/^<!doctype/i.test(line.trim()));
  return fallbackLine
    ? { search: fallbackLine, replace: `${fallbackLine} ` }
    : null;
}

function LiveWebCodingWorkbench({
  manager,
  documentManager,
  repository,
}: {
  manager: LiveEditorWorkspaceManager;
  documentManager: LiveEditorDocumentManager;
  repository: LiveEditorWorkspaceRepository;
}) {
  const {
    document: documentSnapshot,
    trace,
    workspace: workspaceSnapshot,
  } = useLiveWebCodingObservables({ manager, documentManager });
  const documentActions = useLiveEditorDocumentActions({
    documentManager,
    workspaceManager: manager,
  });
  const { updateDocument } = documentActions.commands;
  const { markRendered } = documentActions.preview;
  const traceActions = useLiveWebCodingTraceActions(trace);
  const providerSettings = useLiveEditorProviderSettings();
  const { apiKey, models, selectedModel } = providerSettings;
  const [prompt, setPrompt] = useState(
    '보라색 테마로 바꾸고 기능 카드를 하나 추가해줘'
  );
  const [directLoading, setDirectLoading] = useState(false);
  const [resetConfirmationOpen, setResetConfirmationOpen] = useState(false);
  const [interactionError, setInteractionError] = useState('');
  const directControllerRef = useRef<AbortController | null>(null);
  const resetCancelButtonRef = useRef<HTMLButtonElement>(null);
  const toolActions = useLiveWebCodingToolActions({
    workspaceRevision: workspaceSnapshot.revision,
  });
  const consumePrompt = useCallback(() => setPrompt(''), []);
  const agentExecution = useLiveWebCodingAgentExecution({
    apiKey,
    selectedModel,
    toolActions,
    onPromptConsumed: consumePrompt,
  });
  const {
    appendAssistantMessage,
    cancel: cancelAgentExecution,
    error: agentError,
    loading: agentLoading,
    messages,
    resetConversation,
    run,
  } = agentExecution;
  const workspaceActions = useLiveWebCodingWorkspaceActions({
    manager,
    updateDocument,
    repository,
    workspaceId: WEB_WORKSPACE_ID,
    rootName: WEB_WORKSPACE_ROOT,
    seedFiles: defaultWebFiles,
    createResetFiles: createDefaultWebWorkspaceBlobFiles,
    entryPath: 'index.html',
    exampleId: 'realtime-web-coding',
    onResetConversation: resetConversation,
    onClearTrace: traceActions.commands.clear,
  });
  const loading = agentLoading || directLoading;
  const displayError =
    agentError ||
    interactionError ||
    workspaceActions.error ||
    providerSettings.error ||
    traceActions.error;

  useEffect(() => {
    if (!resetConfirmationOpen) return;
    resetCancelButtonRef.current?.focus();
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setResetConfirmationOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetConfirmationOpen]);

  useEffect(
    () => () => {
      directControllerRef.current?.abort();
    },
    []
  );

  const cancelExecution = () => {
    const controller = directControllerRef.current;
    if (controller && !controller.signal.aborted) controller.abort();
    cancelAgentExecution();
  };

  const sendPrompt = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextPrompt = prompt.trim();
    if (!nextPrompt || loading) return;
    setInteractionError('');
    void run(nextPrompt);
  };

  const runTool = async (name: string, args: Record<string, unknown>) => {
    if (loading) return;
    const controller = new AbortController();
    const sessionId = createToolCallSessionId();
    directControllerRef.current = controller;
    setDirectLoading(true);
    setInteractionError('');
    try {
      const result = await toolActions.callDirectTool(name, args, {
        sessionId,
        signal: controller.signal,
      });
      if (controller.signal.aborted) {
        throw new Error('Execution cancelled.');
      }
      appendAssistantMessage({
        role: 'assistant',
        text: result.isError
          ? formatToolResultText(result, 'Tool call failed.')
          : `${name} completed and the iframe acknowledged the revision.`,
        tools: [name],
      });
    } catch (toolError) {
      if (controller.signal.aborted) {
        appendAssistantMessage({
          role: 'assistant',
          text: 'Execution cancelled. No toolchain success was reported.',
        });
        setInteractionError('');
      } else {
        setInteractionError(
          toolError instanceof Error ? toolError.message : 'Tool failed.'
        );
      }
    } finally {
      if (directControllerRef.current === controller) {
        directControllerRef.current = null;
      }
      setDirectLoading(false);
    }
  };

  const requestResetDemoWorkspace = () => {
    if (loading || !workspaceActions.canReset) {
      return;
    }
    setResetConfirmationOpen(true);
  };

  const resetDemoWorkspace = () => {
    setResetConfirmationOpen(false);
    void workspaceActions.commands.reset();
  };

  const activeFile = workspaceSnapshot.files.find(
    (file) => file.path === workspaceSnapshot.activePath
  );
  const toolDefinitions = toolActions.toolDefinitions;

  return (
    <PageWithLogMonitor pageId="live-web-coding" title="Realtime Web Coding">
      <main className={styles.page}>
        <div className={styles.shell}>
          <header className={styles.hero}>
            <div>
              <span className={styles.eyebrow}>
                AI chat × MCP-style tools × iframe
              </span>
              <h1>Realtime web coding.</h1>
              <p>
                간단한 HTML/CSS/JS workspace를 열어두고, 채팅이 선택한 tool
                call이 화면에 즉시 반영되는 과정을 확인합니다.
              </p>
            </div>
            <div className={styles.heroMeta}>
              <span>bolt.diy-inspired</span>
              <span>browser local</span>
              <span>sandbox preview</span>
            </div>
          </header>

          <section
            className={styles.contract}
            aria-label="Tool execution contract"
          >
            <div>
              <strong>tools/list</strong>
              <span>사용 가능한 web tools를 노출</span>
            </div>
            <div>
              <strong>model / local agent</strong>
              <span>자연어를 tool arguments로 변환</span>
            </div>
            <div>
              <strong>tools/call</strong>
              <span>부모 registry가 파일을 수정</span>
            </div>
            <div>
              <strong>iframe result</strong>
              <span>새 revision을 렌더링하고 확인</span>
            </div>
          </section>

          <section
            className={styles.studio}
            aria-label="Realtime web coding studio"
          >
            <aside className={styles.chatPane}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelKicker}>AI coding chat</span>
                  <h2>무엇을 바꿀까요?</h2>
                </div>
                <span className={styles.statusDot}>
                  {apiKey && selectedModel ? 'AI' : 'LOCAL'}
                </span>
              </div>

              <div className={styles.providerControls}>
                <label>
                  <span>OpenRouter key (선택)</span>
                  <input
                    type="password"
                    value={apiKey}
                    placeholder="없으면 local demo agent"
                    onChange={(event) =>
                      providerSettings.commands.saveApiKey(event.target.value)
                    }
                  />
                </label>
                {models.length > 0 && (
                  <label>
                    <span>Model</span>
                    <select
                      value={selectedModel}
                      onChange={(event) =>
                        providerSettings.commands.selectModel(
                          event.target.value
                        )
                      }
                    >
                      {models.map((model) => (
                        <option key={model.id} value={model.id}>
                          {formatModelName(model)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              <div className={styles.chatMessages} aria-live="polite">
                {messages.length === 0 && (
                  <div className={styles.emptyMessage}>
                    <strong>Try a prompt</strong>
                    <span>
                      “보라색 테마로 바꾸고 기능 카드를 하나 추가해줘”
                    </span>
                  </div>
                )}
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`${styles.message} ${message.role === 'user' ? styles.messageUser : styles.messageAssistant}`}
                  >
                    <span className={styles.messageRole}>
                      {message.role === 'user' ? 'YOU' : 'AGENT'}
                    </span>
                    <p>{message.text}</p>
                    {message.tools?.map((tool) => (
                      <code key={tool}>{tool}</code>
                    ))}
                  </div>
                ))}
              </div>

              <div
                className={styles.toolTrace}
                aria-label="Web coding tool execution trace"
              >
                <div className={styles.toolTraceHeader}>
                  <strong>Tool execution trace</strong>
                  <div className={styles.toolTraceActions}>
                    <button
                      type="button"
                      className={styles.toolTraceClear}
                      aria-label="Clear web coding tool trace"
                      disabled={!trace.length}
                      onClick={traceActions.commands.clear}
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      className={styles.toolTraceClear}
                      aria-label="Copy web coding tool trace"
                      disabled={!trace.length}
                      onClick={() => void traceActions.commands.copy()}
                    >
                      {traceActions.traceCopied ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      type="button"
                      className={styles.toolTraceClear}
                      aria-label="Download web coding tool trace"
                      disabled={!trace.length}
                      onClick={traceActions.commands.download}
                    >
                      Download
                    </button>
                    <span>{trace.length}</span>
                  </div>
                </div>
                <div className={styles.toolTraceRows}>
                  {trace.length === 0 ? (
                    <span className={styles.toolTraceEmpty}>
                      tools/list ready · waiting for a tools/call event
                    </span>
                  ) : (
                    trace.slice(0, 6).map((entry) => (
                      <div
                        className={`${styles.toolTraceRow} ${
                          entry.status === 'failed'
                            ? styles.toolTraceRowFailed
                            : entry.status === 'running'
                              ? styles.toolTraceRowRunning
                              : entry.status === 'cancelled'
                                ? styles.toolTraceRowCancelled
                                : ''
                        }`}
                        key={entry.id}
                        title={`toolCallId: ${entry.id}${entry.sessionId ? ` · sessionId: ${entry.sessionId}` : ''}`}
                      >
                        <span
                          aria-hidden="true"
                          className={styles.toolTraceMark}
                        >
                          {entry.status === 'failed' ||
                          entry.status === 'cancelled'
                            ? '×'
                            : entry.status === 'running'
                              ? '…'
                              : '✓'}
                        </span>
                        <span className={styles.toolTraceCopy}>
                          <code>{entry.name}</code>
                          <small>
                            {entry.method}
                            {entry.mode ? ` · ${entry.mode}` : ''} ·{' '}
                            {formatLiveWebCodingTraceId(entry.id)} ·{' '}
                            {entry.source}
                            {entry.sessionId
                              ? ` · ${formatLiveWebCodingTraceId(entry.sessionId)}`
                              : ''}
                            {entry.durationMs !== undefined
                              ? ` · ${entry.durationMs}ms`
                              : ''}
                            {entry.summary ? ` · ${entry.summary}` : ''}
                          </small>
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <form className={styles.chatForm} onSubmit={sendPrompt}>
                <textarea
                  aria-label="Realtime web coding prompt"
                  value={prompt}
                  rows={3}
                  placeholder="예: 초록 테마로 바꾸고 새로운 기능 카드를 추가해줘"
                  disabled={loading}
                  onChange={(event) => setPrompt(event.target.value)}
                />
                <button
                  className={loading ? styles.chatFormCancelButton : undefined}
                  type={loading ? 'button' : 'submit'}
                  disabled={loading ? false : !prompt.trim()}
                  onClick={loading ? cancelExecution : undefined}
                >
                  {loading ? 'Cancel execution' : 'Send to agent'}
                </button>
              </form>
              {displayError && <p className={styles.error}>{displayError}</p>}
            </aside>

            <section className={styles.workspacePane}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelKicker}>Tool palette</span>
                  <h2>작은 명령을 직접 실행</h2>
                </div>
                <div className={styles.workspaceHeaderActions}>
                  <button
                    type="button"
                    className={styles.workspaceResetButton}
                    onClick={requestResetDemoWorkspace}
                    disabled={loading || !workspaceActions.canReset}
                    title="Restore the built-in live web coding files"
                  >
                    {workspaceActions.isResetting
                      ? 'Resetting…'
                      : 'Reset demo workspace'}
                  </button>
                  <span className={styles.workspaceStatus}>
                    {workspaceActions.status}
                  </span>
                </div>
              </div>
              <div className={styles.toolGrid}>
                {toolDefinitions.map((tool) => (
                  <button
                    type="button"
                    key={tool.name}
                    className={styles.toolCard}
                    disabled={loading}
                    onClick={() => {
                      if (tool.name === 'web.setTheme')
                        void runTool(tool.name, { theme: 'emerald' });
                      if (tool.name === 'web.addFeature')
                        void runTool(tool.name, {
                          title: 'Palette feature',
                          description: 'Added by a visible tool card.',
                        });
                      if (tool.name === 'web.updateHero')
                        void runTool(tool.name, {
                          title: 'A tool changed this page.',
                          subtitle: 'The workspace and preview stay in sync.',
                        });
                      if (
                        tool.name === 'web.getWorkspace' ||
                        tool.name === 'web.runPreview'
                      )
                        void runTool(tool.name, {});
                      if (tool.name === 'web.readFile')
                        void runTool(tool.name, { path: 'index.html' });
                      if (
                        tool.name === 'web.applyPatch' &&
                        activeFile?.isText
                      ) {
                        const sample = createWebPatchSample(activeFile);
                        if (sample) {
                          void runTool(tool.name, {
                            path: activeFile.path,
                            ...sample,
                            occurrence: 'first',
                            expectedRevision: workspaceSnapshot.revision,
                          });
                        }
                      }
                    }}
                  >
                    <code>{tool.name}</code>
                    <span>{tool.description}</span>
                  </button>
                ))}
              </div>

              <div className={styles.fileBar}>
                <strong>workspace / {workspaceSnapshot.rootName}</strong>
                <span>
                  {workspaceSnapshot.files.length} files · active{' '}
                  {workspaceSnapshot.activePath}
                </span>
              </div>
              <div className={styles.fileTabs}>
                {workspaceSnapshot.files.map((file) => (
                  <button
                    key={file.path}
                    type="button"
                    className={
                      file.path === workspaceSnapshot.activePath
                        ? styles.fileTabActive
                        : styles.fileTab
                    }
                    onClick={() =>
                      workspaceActions.commands.selectFile(file.path)
                    }
                  >
                    {file.path}
                  </button>
                ))}
              </div>
              <div className={styles.codePreviewGrid}>
                <div className={styles.codePanel}>
                  <div className={styles.codeHeader}>
                    <span>{activeFile?.mimeType ?? 'text/plain'}</span>
                    <span>revision {documentSnapshot.revision}</span>
                  </div>
                  <pre>{activeFile?.source ?? documentSnapshot.source}</pre>
                </div>
                <LiveCodeEditorPreviewFrame
                  document={documentSnapshot}
                  workspaceFiles={workspaceSnapshot.files}
                  entryPath="index.html"
                  onRendered={markRendered}
                />
              </div>
            </section>
          </section>

          {resetConfirmationOpen && (
            <div
              className={styles.dialogBackdrop}
              role="presentation"
              onMouseDown={(event) => {
                if (event.currentTarget === event.target) {
                  setResetConfirmationOpen(false);
                }
              }}
            >
              <div
                className={styles.confirmationDialog}
                role="dialog"
                aria-modal="true"
                aria-labelledby="realtime-reset-workspace-title"
                aria-describedby="realtime-reset-workspace-description"
              >
                <span className={styles.dialogEyebrow}>Approval required</span>
                <h2 id="realtime-reset-workspace-title">
                  Reset realtime workspace?
                </h2>
                <p id="realtime-reset-workspace-description">
                  Current IndexedDB edits and chat history will be replaced with
                  the built-in web coding files. This does not write to a
                  connected local folder.
                </p>
                <div className={styles.dialogActions}>
                  <button
                    ref={resetCancelButtonRef}
                    type="button"
                    className={styles.dialogSecondary}
                    onClick={() => setResetConfirmationOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.dialogDanger}
                    onClick={() => void resetDemoWorkspace()}
                  >
                    Reset workspace
                  </button>
                </div>
              </div>
            </div>
          )}

          <footer className={styles.footer}>
            <span>
              canonical store: Dexie · execution owner: parent registry ·
              runtime: sandbox iframe
            </span>
            <Link to="/integrations/live-code-editor">
              기존 Live Code Editor 열기 →
            </Link>
          </footer>
        </div>
      </main>
    </PageWithLogMonitor>
  );
}

function LiveWebCodingPage() {
  const manager = useMemo(
    () =>
      new LiveEditorWorkspaceManager(defaultWebFiles, {
        activePath: 'index.html',
      }),
    []
  );
  const repository = useMemo(() => new LiveEditorWorkspaceRepository(), []);
  const documentManager = useMemo(
    () =>
      new LiveEditorDocumentManager({
        exampleId: 'realtime-web-coding',
        file: 'index.html',
        source:
          defaultWebFiles.find((file) => file.path === 'index.html')?.source ??
          '',
        scenario: 'success',
      }),
    []
  );

  return (
    <LiveWebCodingToolProvider>
      <LiveWebCodingToolHandlers
        manager={manager}
        documentManager={documentManager}
        repository={repository}
      >
        <LiveWebCodingWorkbench
          manager={manager}
          documentManager={documentManager}
          repository={repository}
        />
      </LiveWebCodingToolHandlers>
    </LiveWebCodingToolProvider>
  );
}

export default LiveWebCodingPage;
