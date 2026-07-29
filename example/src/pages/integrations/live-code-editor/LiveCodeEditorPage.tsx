import {
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import { PageWithLogMonitor } from '@/components/LogMonitor';
import { LiveEditorDocumentManager } from '../../../lib/live-code-editor-bridge';
import { BrowserFileSystemWorkspaceAdapter } from '../../../lib/live-code-editor-filesystem';
import {
  LIVE_EDITOR_WORKSPACE_ROOT,
  LiveEditorWorkspaceRepository,
} from '../../../lib/live-code-editor-storage';
import {
  createWorkspaceFile,
  LiveEditorWorkspaceManager,
} from '../../../lib/live-code-editor-workspace';
import {
  denyAllLiveEditorToolApprovals,
  resolveLiveEditorToolApproval,
} from '../../../lib/live-editor-tool-approval';
import { useLiveEditorDocumentActions } from './actions/useLiveEditorDocumentActions';
import { useLiveEditorWorkspaceActions } from './actions/useLiveEditorWorkspaceActions';
import { useLiveEditorToolApprovalObservables } from './hooks/useLiveEditorToolApprovalObservables';
import { useLiveEditorWorkspaceObservables } from './hooks/useLiveEditorWorkspaceObservables';
import styles from './LiveCodeEditorPage.module.css';
import { LiveCodeEditorPreviewFrame } from './LiveCodeEditorPreviewFrame';
import { LiveEditorAIToolbar } from './LiveEditorAIToolbar';
import { LiveEditorToolApprovalDialog } from './LiveEditorToolApprovalDialog';
import { LiveEditorToolchainProvider } from './LiveEditorToolchain';
import { LiveUsecaseProviders } from './usecase/LiveUsecaseHandlerRegistry';
import { LiveUsecaseRecipe } from './usecase/LiveUsecaseRecipe';

type ExampleId = 'pipeline' | 'tools' | 'store' | 'usecase' | 'web';
type ScenarioId = 'success' | 'invalid' | 'blocked';

interface ExampleDefinition {
  label: string;
  file: string;
  description: string;
  code: string;
}

interface PreviewEvent {
  label: string;
  time: string;
  status: 'success' | 'blocked' | 'error';
}

const examples: Record<ExampleId, ExampleDefinition> = {
  pipeline: {
    label: 'Action pipeline',
    file: 'checkout-action.ts',
    description: '우선순위 handler와 abort 경계를 편집해 봅니다.',
    code: `import { createActionContext } from '@context-action/react';

const Checkout = createActionContext<CheckoutActions>('Checkout');

function CheckoutLogic() {
  const dispatch = Checkout.useActionDispatch();

  Checkout.useActionHandler('submit', validateCart, {
    id: 'validate-cart',
    priority: 100,
    blocking: true,
  });

  Checkout.useActionHandler('submit', async ({ cartId }, controller) => {
    const result = await reserveInventory(cartId);
    if (!result.ok) controller.abort('재고 부족');
    return result;
  }, { id: 'reserve-inventory', priority: 60, blocking: true });

  return <button onClick={() => void dispatch('submit', { cartId: 'cart-42' })}>
    Submit
  </button>;
}

function CheckoutApp() {
  return <Checkout.Provider><CheckoutLogic /></Checkout.Provider>;
}`,
  },
  tools: {
    label: 'ToolContext',
    file: 'ui-tools.tsx',
    description: '툴 호출을 UI action으로 연결하는 흐름입니다.',
    code: `import { z } from 'zod';
import { createToolContext } from '@context-action/react/tools';
import { createActionSchema, defineAction } from '@context-action/tool-protocol';

const uiToolSchema = createActionSchema({
  set_theme: defineAction({
    name: 'set_theme',
    description: 'Apply a UI theme',
    parameters: z.object({ theme: z.string() }),
  }, z),
});

const { Provider, useToolCall, useToolHandler } = createToolContext('UITools', {
  schema: uiToolSchema,
});

function ThemeButton() {
  const callTool = useToolCall();
  useToolHandler('set_theme', ({ theme }) => {
    document.documentElement.dataset.theme = theme;
    return { applied: theme };
  }, { id: 'theme-switcher' });

  return <button onClick={() => void callTool('set_theme', { theme: 'violet' })}>
    Apply violet theme
  </button>;
}

export function App() {
  return <Provider><ThemeButton /></Provider>;
}`,
  },
  store: {
    label: 'Store selector',
    file: 'cart-store.ts',
    description: '선택 구독으로 필요한 값만 렌더링합니다.',
    code: `import { createStore } from '@context-action/react';

const cartStore = createStore({
  items: [],
  coupon: null,
});

const total = useStoreSelector(
  cartStore,
  (state) => state.items.reduce(sumItems, 0),
);

cartStore.setState((state) => ({
  ...state,
  coupon: 'WELCOME10',
}));`,
  },
  usecase: {
    label: 'Usecase boundary',
    file: 'access-request-recipe.tsx',
    description:
      'Contract, runtime, facade, recipe를 하나의 feature scope에서 연결합니다.',
    code: `// contract: typed intent + state
type AccessRequestAction =
  | { type: 'submitRequest' }
  | { type: 'changeReason'; reason: string };

// runtime: Context-Action orchestration
const AccessRequest = createActionContext<AccessRequestActions>(
  'AccessRequest',
);
const Stores = createStoreContext('AccessRequestStores', {
  workflow: { initialValue: initialWorkflow },
});

// facade: stable commands + view model
const vm = useAccessRequestFacade();

// recipe: Astryx props, no business rules
<Drawer isOpen={vm.isOpen} onClose={vm.commands.close}>
  <Textarea
    value={vm.reason}
    onChange={vm.commands.changeReason}
  />
  <Button isLoading={vm.isBusy} onClick={vm.commands.submit} />
    </Drawer>`,
  },
  web: {
    label: 'Web starter',
    file: 'index.html',
    description:
      'HTML, CSS, JS를 한 workspace에서 편집하고 sandbox iframe으로 실행합니다.',
    code: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Context-Action workspace</title>
    <link rel="stylesheet" href="./style.css" />
  </head>
  <body>
    <main class="card">
      <span class="eyebrow">live workspace</span>
      <h1>Build in the browser.</h1>
      <p>Edit index.html, style.css, or script.js and watch the sandbox update.</p>
      <button id="counter" type="button">Clicked 0 times</button>
    </main>
    <script src="./script.js"></script>
  </body>
</html>`,
  },
};

const defaultWorkspaceFiles = (
  Object.values(examples) as ExampleDefinition[]
).map((example) => createWorkspaceFile(example.file, example.code));

defaultWorkspaceFiles.push(
  createWorkspaceFile(
    'style.css',
    `:root {
  color-scheme: light;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  background: #eef0ff;
  color: #20263a;
}

body {
  display: grid;
  min-height: 100vh;
  margin: 0;
  place-items: center;
  background: radial-gradient(circle at top, #ffffff, #eef0ff 70%);
}

.card {
  display: grid;
  gap: 0.9rem;
  width: min(100% - 2rem, 28rem);
  padding: 2rem;
  border: 1px solid #d9dcf5;
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 18px 55px rgba(76, 67, 160, 0.14);
}

.eyebrow {
  color: #635bce;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1,
p {
  margin: 0;
}

h1 {
  font-size: clamp(1.65rem, 5vw, 2.4rem);
  letter-spacing: -0.05em;
}

p {
  color: #667085;
  line-height: 1.6;
}

button {
  width: fit-content;
  border: 0;
  border-radius: 0.6rem;
  padding: 0.7rem 1rem;
  background: #635bce;
  color: white;
  cursor: pointer;
  font: inherit;
  font-weight: 800;
}

button:hover {
  background: #4d45ad;
}`
  ),
  createWorkspaceFile(
    'script.js',
    `const counter = document.querySelector('#counter');
let count = 0;

counter?.addEventListener('click', () => {
  count += 1;
  if (counter) counter.textContent = \`Clicked \${count} times\`;
});`
  )
);

const webStarterPaths = new Set(['index.html', 'style.css', 'script.js']);

function createDefaultWorkspaceBlobFiles() {
  return defaultWorkspaceFiles.map((file) => ({
    path: file.path,
    blob: new Blob([file.source], { type: file.mimeType }),
    mimeType: file.mimeType,
    size: file.size,
  }));
}

function getEditorTokenClass(token: string): string {
  if (/^(?:<!--|\/\*|\/\/)/.test(token)) return 'comment';
  if (/^<\/?[A-Za-z]/.test(token)) return 'tag';
  if (/^["'`]/.test(token)) return 'string';
  if (/^\d/.test(token)) return 'number';
  return 'keyword';
}

function highlightEditorSource(source: string, filePath: string): ReactNode {
  const extension = filePath.split('.').pop()?.toLowerCase();
  if (
    !extension ||
    !['html', 'htm', 'css', 'js', 'jsx', 'ts', 'tsx', 'json'].includes(
      extension
    )
  ) {
    return source;
  }

  const tokenPattern =
    /<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|\/\/[^\n]*|<\/?[A-Za-z][^>]*>|`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:async|await|class|const|constructor|else|export|extends|function|from|if|import|interface|new|null|return|throw|true|false|type|typeof|undefined|let|var|while|for|in|of|this|interface|implements|public|private|readonly)\b|\b\d+(?:\.\d+)?\b/g;
  const output: ReactNode[] = [];
  let cursor = 0;
  let tokenIndex = 0;
  for (const match of source.matchAll(tokenPattern)) {
    const token = match[0];
    const start = match.index ?? cursor;
    if (start > cursor) output.push(source.slice(cursor, start));
    output.push(
      <span
        key={`token-${tokenIndex}`}
        className={`token-${getEditorTokenClass(token)}`}
      >
        {token}
      </span>
    );
    tokenIndex += 1;
    cursor = start + token.length;
  }
  if (cursor < source.length) output.push(source.slice(cursor));
  return output;
}

function findWorkspaceEntryPath(
  files: readonly { path: string }[],
  storageMode: 'memory' | 'indexed-db'
): string | undefined {
  if (storageMode !== 'indexed-db') return undefined;
  const htmlFiles = files.filter((file) =>
    file.path.toLowerCase().endsWith('.html')
  );
  return (
    htmlFiles.find(
      (file) => file.path.split('/').pop()?.toLowerCase() === 'index.html'
    )?.path ?? htmlFiles[0]?.path
  );
}

const scenarioLabels: Record<ScenarioId, string> = {
  success: 'happy path',
  invalid: 'invalid input',
  blocked: 'policy blocked',
};

const baseEvents: Record<ScenarioId, PreviewEvent[]> = {
  success: [
    { label: 'input-validation passed', time: '0.4ms', status: 'success' },
    { label: 'policy-guard passed', time: '1.2ms', status: 'success' },
    {
      label: 'business-operation completed',
      time: '18.6ms',
      status: 'success',
    },
    { label: 'audit-log recorded', time: '19.0ms', status: 'success' },
  ],
  invalid: [
    { label: 'input-validation rejected', time: '0.3ms', status: 'error' },
    {
      label: 'dispatch aborted: invalid payload',
      time: '0.5ms',
      status: 'error',
    },
  ],
  blocked: [
    { label: 'input-validation passed', time: '0.4ms', status: 'success' },
    { label: 'policy-guard blocked', time: '1.4ms', status: 'blocked' },
    {
      label: 'dispatch aborted: policy guard',
      time: '1.6ms',
      status: 'blocked',
    },
  ],
};

function LiveCodeEditorContent() {
  const workspaceManager = useMemo(
    () =>
      new LiveEditorWorkspaceManager(defaultWorkspaceFiles, {
        activePath: examples.pipeline.file,
      }),
    []
  );
  const documentManager = useMemo(
    () =>
      new LiveEditorDocumentManager({
        exampleId: 'pipeline',
        file: examples.pipeline.file,
        source: examples.pipeline.code,
        scenario: 'success',
      }),
    []
  );
  const filesystemAdapter = useMemo(
    () => new BrowserFileSystemWorkspaceAdapter(),
    []
  );
  const workspaceRepository = useMemo(
    () => new LiveEditorWorkspaceRepository(),
    []
  );
  const {
    document: documentSnapshot,
    filesystem: filesystemCapabilities,
    workspace: workspaceSnapshot,
  } = useLiveEditorWorkspaceObservables({
    workspaceManager,
    documentManager,
    filesystemAdapter,
  });
  const documentActions = useLiveEditorDocumentActions({
    documentManager,
    workspaceManager,
  });
  const { getResetSource, resetSource, setScenario, setSource } =
    documentActions.commands;
  const { markError, markRendered } = documentActions.preview;
  const isShowcaseWorkspace =
    workspaceSnapshot.storageMode === 'memory' ||
    workspaceSnapshot.rootName === LIVE_EDITOR_WORKSPACE_ROOT;
  const activeExample = isShowcaseWorkspace
    ? (Object.keys(examples) as ExampleId[]).find(
        (exampleId) => examples[exampleId].file === documentSnapshot.file
      )
    : undefined;
  const getExampleIdForPath = useCallback(
    (path: string): string =>
      isShowcaseWorkspace
        ? ((Object.keys(examples) as ExampleId[]).find(
            (exampleId) => examples[exampleId].file === path
          ) ?? 'workspace')
        : 'workspace',
    [isShowcaseWorkspace]
  );
  const workspaceActions = useLiveEditorWorkspaceActions({
    workspaceManager,
    documentManager,
    workspaceRepository,
    filesystemAdapter,
    workspaceSnapshot,
    isShowcaseWorkspace,
    workspaceRoot: LIVE_EDITOR_WORKSPACE_ROOT,
    seedFiles: defaultWorkspaceFiles,
    createResetFiles: createDefaultWorkspaceBlobFiles,
    findEntryPath: findWorkspaceEntryPath,
    getExampleIdForPath,
  });
  const {
    activeFile: activeWorkspaceFile,
    workspaceMessage,
    isResetting,
  } = workspaceActions;
  const {
    openWorkspace,
    handleDirectoryInputChange,
    requestResetWorkspace: canRequestResetWorkspace,
    resetWorkspace: resetWorkspaceCommand,
    selectPath,
    saveWorkspaceFile,
    saveAllWorkspaceFiles,
    reconcileRecoveredPaths,
  } = workspaceActions.commands;
  const code = documentSnapshot.source;
  const scenario = documentSnapshot.scenario as ScenarioId;
  const workspaceEntryPath = findWorkspaceEntryPath(
    workspaceSnapshot.files,
    workspaceSnapshot.storageMode
  );
  const previewEntryPath =
    isShowcaseWorkspace && !webStarterPaths.has(documentSnapshot.file)
      ? undefined
      : workspaceEntryPath;
  const [isRunning, setIsRunning] = useState(false);
  const [runState, setRunState] = useState<'ready' | 'running' | ScenarioId>(
    'ready'
  );
  const [copied, setCopied] = useState(false);
  const [resetConfirmationOpen, setResetConfirmationOpen] = useState(false);
  const directoryInputRef = useRef<HTMLInputElement>(null);
  const resetCancelButtonRef = useRef<HTMLButtonElement>(null);
  const approvalCancelButtonRef = useRef<HTMLButtonElement>(null);
  const { pendingApprovals } = useLiveEditorToolApprovalObservables();

  useEffect(() => {
    if (!resetConfirmationOpen) return;
    resetCancelButtonRef.current?.focus();
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setResetConfirmationOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetConfirmationOpen]);

  useEffect(() => {
    if (pendingApprovals.length === 0) return;
    approvalCancelButtonRef.current?.focus();
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        const approval = pendingApprovals[0];
        if (approval) resolveLiveEditorToolApproval(approval.id, 'deny');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingApprovals]);

  useEffect(
    () => () => {
      denyAllLiveEditorToolApprovals();
    },
    []
  );

  const currentExample: ExampleDefinition = activeExample
    ? examples[activeExample]
    : {
        label: documentSnapshot.file,
        file: documentSnapshot.file,
        description: activeWorkspaceFile?.isText
          ? 'File loaded from the persistent browser workspace.'
          : 'Binary asset stored in the workspace; select a text file to edit.',
        code: activeWorkspaceFile?.initialSource ?? code,
      };
  const highlightedCode = useMemo(
    () => highlightEditorSource(code, currentExample.file),
    [code, currentExample.file]
  );
  const lineNumbers = useMemo(
    () => code.split('\n').map((_, index) => index + 1),
    [code]
  );
  const events = baseEvents[scenario];

  const selectExample = (nextExample: ExampleId) => {
    selectPath(examples[nextExample].file);
    setScenario('success');
    setRunState('ready');
  };

  const requestResetWorkspace = () => {
    if (canRequestResetWorkspace()) setResetConfirmationOpen(true);
  };

  const resetWorkspace = async () => {
    setResetConfirmationOpen(false);
    const didReset = await resetWorkspaceCommand();
    if (didReset) setRunState('ready');
  };

  const runPreview = () => {
    setIsRunning(true);
    setRunState('running');
    window.setTimeout(() => {
      setIsRunning(false);
      setRunState(scenario);
    }, 420);
  };

  const resetCode = () => {
    resetSource();
    setRunState('ready');
  };

  const copyCode = async () => {
    await navigator.clipboard?.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  const handleEditorKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      void saveWorkspaceFile();
      return;
    }
    if (event.key !== 'Tab') return;
    event.preventDefault();
    const target = event.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const nextCode = `${code.slice(0, start)}  ${code.slice(end)}`;
    setSource(nextCode);
    window.requestAnimationFrame(() => {
      target.selectionStart = start + 2;
      target.selectionEnd = start + 2;
    });
  };

  const resultMessage =
    runState === 'ready'
      ? 'Run preview를 누르면 현재 scenario가 action pipeline을 통과합니다.'
      : runState === 'running'
        ? '현재 코드를 기반으로 preview를 실행 중입니다…'
        : runState === 'success'
          ? '완료됨 · 4개 handler 결과를 수집했습니다.'
          : runState === 'invalid'
            ? '중단됨 · 입력 검증 실패가 후속 handler를 막았습니다.'
            : '중단됨 · policy guard가 비즈니스 작업 전에 요청을 차단했습니다.';

  return (
    <LiveEditorToolchainProvider
      manager={documentManager}
      workspaceManager={workspaceManager}
      filesystemAdapter={filesystemAdapter}
      getExampleIdForPath={getExampleIdForPath}
      getResetSource={getResetSource}
    >
      <PageWithLogMonitor pageId="live-code-editor" title="Live Code Editor">
        <main className={styles.page}>
          <div className={styles.shell}>
            <section className={styles.hero}>
              <div>
                <span className={styles.eyebrow}>
                  Context-Action / Astryx baseline
                </span>
                <h1>Live code, visible behavior.</h1>
                <p>
                  현재 예제 환경의 action, tool, store 계약을 작은 브라우저
                  workbench로 옮겼습니다. 코드를 편집하고, scenario를 바꾸고,
                  같은 화면에서 실행 trace를 확인하세요.
                </p>
              </div>
              <div
                className={styles.environment}
                aria-label="Current environment"
              >
                <span>React 19.2</span>
                <span>Vite 8.1</span>
                <span>pnpm 10.30</span>
                <span>@context-action/react</span>
                <span>Astryx neutral</span>
              </div>
            </section>

            <LiveEditorAIToolbar
              filesystemAdapter={filesystemAdapter}
              onRecoveredPaths={reconcileRecoveredPaths}
            />

            <section
              className={styles.workbench}
              aria-label="Live code editor workbench"
            >
              <div className={styles.toolbar}>
                <div className={styles.toolbarGroup}>
                  <label htmlFor="example-select">Example</label>
                  <select
                    id="example-select"
                    className={styles.select}
                    value={activeExample ?? ''}
                    onChange={(event) =>
                      selectExample(event.target.value as ExampleId)
                    }
                  >
                    {!activeExample && (
                      <option value="" disabled>
                        Workspace file (select from tree)
                      </option>
                    )}
                    {Object.entries(examples).map(([id, example]) => (
                      <option key={id} value={id}>
                        {example.label} · {example.file}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.toolbarActions}>
                  <button
                    type="button"
                    className={styles.toolbarButton}
                    onClick={resetCode}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className={styles.toolbarButton}
                    onClick={copyCode}
                  >
                    {copied ? 'Copied' : 'Copy code'}
                  </button>
                  <button
                    type="button"
                    className={`${styles.toolbarButton} ${styles.runButton}`}
                    onClick={runPreview}
                    disabled={isRunning}
                  >
                    {isRunning ? 'Running…' : '▶ Run preview'}
                  </button>
                </div>
              </div>

              <div className={styles.body}>
                <section className={styles.editorPane} aria-label="Code editor">
                  <div className={styles.workspaceBar}>
                    <div className={styles.workspaceHeader}>
                      <strong>Code workspace</strong>
                      <span>
                        {workspaceSnapshot.storageMode} ·{' '}
                        {filesystemCapabilities.isWritable
                          ? 'folder writable'
                          : 'IndexedDB auto-save'}
                      </span>
                    </div>
                    <div className={styles.workspaceActions}>
                      <button
                        type="button"
                        className={styles.workspaceButton}
                        onClick={() => {
                          if (filesystemCapabilities.supportsDirectoryPicker) {
                            void openWorkspace();
                          } else {
                            directoryInputRef.current?.click();
                          }
                        }}
                        disabled={!filesystemCapabilities.isSupported}
                      >
                        {filesystemCapabilities.supportsDirectoryPicker
                          ? 'Open folder'
                          : 'Import folder'}
                      </button>
                      <button
                        type="button"
                        className={styles.workspaceButton}
                        onClick={requestResetWorkspace}
                        disabled={
                          !isShowcaseWorkspace ||
                          workspaceSnapshot.storageMode !== 'indexed-db' ||
                          isResetting
                        }
                        title="Restore the built-in examples in IndexedDB"
                      >
                        {isResetting ? 'Resetting…' : 'Reset examples'}
                      </button>
                      <button
                        type="button"
                        className={styles.workspaceButton}
                        onClick={() => void saveWorkspaceFile()}
                        disabled={
                          workspaceSnapshot.storageMode !== 'indexed-db' ||
                          !filesystemCapabilities.isWritable ||
                          !activeWorkspaceFile?.isText ||
                          !workspaceSnapshot.dirtyPaths.includes(
                            workspaceSnapshot.activePath
                          )
                        }
                        title="Write the active file back to the opened folder (Ctrl/Cmd+S)"
                      >
                        Save file
                      </button>
                      <button
                        type="button"
                        className={styles.workspaceButton}
                        onClick={() => void saveAllWorkspaceFiles()}
                        disabled={
                          workspaceSnapshot.storageMode !== 'indexed-db' ||
                          !filesystemCapabilities.isWritable ||
                          workspaceSnapshot.dirtyPaths.length === 0
                        }
                        title="Write all dirty text files back to the opened folder"
                      >
                        Save all
                      </button>
                      <input
                        ref={(node) => {
                          directoryInputRef.current = node;
                          node?.setAttribute('webkitdirectory', '');
                          node?.setAttribute('directory', '');
                        }}
                        className={styles.hiddenFileInput}
                        type="file"
                        multiple
                        aria-label="Import workspace folder"
                        onChange={(event) =>
                          void handleDirectoryInputChange(event)
                        }
                      />
                    </div>
                    <div className={styles.workspaceMessage}>
                      {workspaceMessage}
                    </div>
                    <div
                      className={styles.fileTree}
                      aria-label="Workspace files"
                    >
                      {workspaceSnapshot.files.map((file) => (
                        <button
                          type="button"
                          key={file.path}
                          className={`${styles.fileTreeItem} ${
                            file.path === workspaceSnapshot.activePath
                              ? styles.fileTreeItemActive
                              : ''
                          }`}
                          onClick={() => selectPath(file.path)}
                        >
                          <span>{file.path}</span>
                          {filesystemCapabilities.isWritable &&
                            workspaceSnapshot.dirtyPaths.includes(
                              file.path
                            ) && (
                              <span
                                aria-label="not saved to filesystem"
                                title="Not saved to the opened folder"
                              >
                                ●
                              </span>
                            )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.tabs}>
                    <button
                      type="button"
                      className={`${styles.tab} ${styles.activeTab}`}
                    >
                      {currentExample.file}
                    </button>
                    <span className={styles.tab}>
                      {activeWorkspaceFile?.isText
                        ? activeWorkspaceFile.mimeType
                        : 'binary'}
                    </span>
                  </div>
                  <div className={styles.editor}>
                    <div className={styles.lineNumbers} aria-hidden="true">
                      {lineNumbers.map((line) => (
                        <div key={line}>{line}</div>
                      ))}
                    </div>
                    <div
                      className={styles.codeSurface}
                      style={{
                        minHeight: `${Math.max(470, lineNumbers.length * 21)}px`,
                      }}
                    >
                      <pre className={styles.highlightLayer} aria-hidden="true">
                        {highlightedCode || '\u00a0'}
                      </pre>
                      <textarea
                        aria-label={`${currentExample.file} source editor`}
                        className={styles.codeInput}
                        spellCheck={false}
                        aria-keyshortcuts="Control+S Meta+S"
                        value={code}
                        disabled={activeWorkspaceFile?.isText === false}
                        onChange={(event) => setSource(event.target.value)}
                        onKeyDown={handleEditorKeyDown}
                      />
                    </div>
                  </div>
                  <div className={styles.statusbar}>
                    <span>UTF-8 · LF</span>
                    <span>
                      {code.split('\n').length} lines · editable ·{' '}
                      {filesystemCapabilities.isWritable &&
                      workspaceSnapshot.dirtyPaths.includes(
                        workspaceSnapshot.activePath
                      )
                        ? 'folder pending'
                        : 'IndexedDB saved'}
                    </span>
                  </div>
                </section>

                <section
                  className={styles.previewPane}
                  aria-label="Live preview"
                >
                  <div className={styles.previewHeader}>
                    <h2>Live preview</h2>
                    <span className={styles.liveBadge}>safe runner</span>
                  </div>
                  <div className={styles.previewContent}>
                    <div className={styles.previewCard}>
                      {activeExample === 'usecase' ? (
                        <LiveUsecaseProviders>
                          <LiveUsecaseRecipe />
                        </LiveUsecaseProviders>
                      ) : (
                        <>
                          <div className={styles.previewCardHeader}>
                            <div>
                              <h3>{currentExample.label}</h3>
                              <p>{currentExample.description}</p>
                            </div>
                            <span>browser demo</span>
                          </div>
                          <LiveCodeEditorPreviewFrame
                            document={documentSnapshot}
                            workspaceFiles={workspaceSnapshot.files}
                            entryPath={previewEntryPath}
                            onRendered={markRendered}
                            onError={markError}
                          />
                          <div
                            className={styles.scenarioBar}
                            aria-label="Preview scenarios"
                          >
                            {(Object.keys(scenarioLabels) as ScenarioId[]).map(
                              (candidate) => (
                                <button
                                  type="button"
                                  key={candidate}
                                  className={`${styles.scenarioButton} ${
                                    scenario === candidate
                                      ? styles.scenarioButtonActive
                                      : ''
                                  }`}
                                  onClick={() => setScenario(candidate)}
                                >
                                  {scenarioLabels[candidate]}
                                </button>
                              )
                            )}
                          </div>
                          <button
                            type="button"
                            className={styles.previewRun}
                            onClick={runPreview}
                            disabled={isRunning}
                          >
                            {isRunning
                              ? 'Dispatching action…'
                              : 'Run current scenario'}
                          </button>

                          <div className={styles.output}>
                            <div className={styles.outputHeader}>
                              <span>dispatch output</span>
                              <span className={styles.outputState}>
                                {runState}
                              </span>
                            </div>
                            <div className={styles.eventList}>
                              {runState === 'ready' ||
                              runState === 'running' ? (
                                <div className={styles.event}>
                                  <span className={styles.eventDot} />
                                  <span>
                                    {runState === 'running'
                                      ? 'dispatching…'
                                      : 'waiting for run'}
                                  </span>
                                  <span className={styles.eventTime}>—</span>
                                </div>
                              ) : (
                                events.map((event) => (
                                  <div
                                    className={styles.event}
                                    key={event.label}
                                  >
                                    <span
                                      className={`${styles.eventDot} ${
                                        event.status === 'blocked'
                                          ? styles.eventDotBlocked
                                          : event.status === 'error'
                                            ? styles.eventDotError
                                            : ''
                                      }`}
                                    />
                                    <span>{event.label}</span>
                                    <span className={styles.eventTime}>
                                      {event.time}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                          <div
                            className={`${styles.resultBox} ${
                              runState === 'blocked'
                                ? styles.resultBoxBlocked
                                : runState === 'invalid'
                                  ? styles.resultBoxError
                                  : ''
                            }`}
                          >
                            {resultMessage}
                          </div>
                        </>
                      )}
                    </div>

                    <div className={styles.notes}>
                      <div className={styles.note}>
                        <strong>Action pipeline</strong>
                        <span>
                          priority + blocking으로 실행 경계를 확인합니다.
                        </span>
                      </div>
                      <div className={styles.note}>
                        <strong>Typed result</strong>
                        <span>
                          dispatch 결과와 abort reason을 함께 노출합니다.
                        </span>
                      </div>
                      <div className={styles.note}>
                        <strong>Local only</strong>
                        <span>
                          이 데모는 외부 API 없이 브라우저에서 동작합니다.
                        </span>
                      </div>
                    </div>
                    <p className={styles.footnote}>
                      코드는 편집 가능한 예제 계약이고 preview는 안전한 시나리오
                      runner입니다. 실제 애플리케이션에서는 handler를 서비스
                      로직에 연결해 사용합니다.{' '}
                      <Link to="/integrations/action-lifecycle">
                        Lifecycle workbench 보기 →
                      </Link>{' '}
                      ·{' '}
                      <Link to="/patterns/implementation-playbook/access-request">
                        전체 playbook 보기 →
                      </Link>
                    </p>
                  </div>
                </section>
              </div>
            </section>
          </div>
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
                aria-labelledby="reset-workspace-title"
                aria-describedby="reset-workspace-description"
              >
                <span className={styles.dialogEyebrow}>Approval required</span>
                <h2 id="reset-workspace-title">Reset example workspace?</h2>
                <p id="reset-workspace-description">
                  Current browser edits will be replaced with the built-in
                  Context-Action examples. This does not write to a connected
                  local folder.
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
                    onClick={() => void resetWorkspace()}
                  >
                    Reset examples
                  </button>
                </div>
              </div>
            </div>
          )}
          {pendingApprovals[0] && (
            <LiveEditorToolApprovalDialog
              approval={pendingApprovals[0]}
              pendingCount={pendingApprovals.length}
              cancelRef={approvalCancelButtonRef}
              onResolve={(decision) => {
                const approval = pendingApprovals[0];
                if (approval) {
                  resolveLiveEditorToolApproval(approval.id, decision);
                }
              }}
            />
          )}
        </main>
      </PageWithLogMonitor>
    </LiveEditorToolchainProvider>
  );
}

export default LiveCodeEditorContent;
