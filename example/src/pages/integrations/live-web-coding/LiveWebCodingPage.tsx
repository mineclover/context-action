import { createToolContext } from '@context-action/react';
import type { ModelMessage } from 'ai';
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { Link } from 'react-router-dom';
import { PageWithLogMonitor } from '@/components/LogMonitor';
import { LiveEditorDocumentManager } from '../../../lib/live-code-editor-bridge';
import { normalizeWorkspacePath } from '../../../lib/live-code-editor-filesystem';
import { LiveEditorWorkspaceRepository } from '../../../lib/live-code-editor-storage';
import {
  createWorkspaceFile,
  LiveEditorWorkspaceManager,
} from '../../../lib/live-code-editor-workspace';
import { applyLiveEditorTextPatch } from '../../../lib/live-editor-text-patch';
import { liveWebCodingToolsSchema } from '../../../lib/live-web-coding-tools-schema';
import {
  clearLiveWebCodingTrace,
  formatLiveWebCodingTraceId,
  liveWebCodingTraceStore,
  recordLiveWebCodingToolCall,
} from '../../../lib/live-web-coding-trace';
import { createBrowserOpenRouterToolRunner } from '../../../lib/openrouter-ai-sdk';
import {
  saveOpenRouterApiKey,
  useStoredOpenRouterApiKey,
} from '../../../lib/openrouter-api-key';
import {
  formatModelName,
  getFreeModelsWithTools,
  type OpenRouterModel,
} from '../../../lib/openrouter-models';
import {
  createToolCallSessionId,
  serializeToolTrace,
  writeClipboardText,
} from '../../../lib/tool-call-trace';
import { LiveCodeEditorPreviewFrame } from '../live-code-editor/LiveCodeEditorPreviewFrame';
import styles from './LiveWebCodingPage.module.css';

const WEB_WORKSPACE_ID = 'live-web-coding-demo';
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

const themeTokens = {
  violet: { accent: '#6d5dfc', soft: '#eeedff' },
  emerald: { accent: '#0f9f78', soft: '#e7f8f2' },
  amber: { accent: '#d97706', soft: '#fff4dc' },
  rose: { accent: '#e0527a', soft: '#ffedf2' },
  sky: { accent: '#0b83c6', soft: '#e8f6ff' },
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

const {
  Provider: LiveWebCodingToolProvider,
  useToolHandler: useLiveWebCodingToolHandler,
  useToolRegistry: useLiveWebCodingToolRegistry,
} = createToolContext('LiveWebCodingTools', {
  schema: liveWebCodingToolsSchema,
  debug: true,
  onToolCall: recordLiveWebCodingToolCall,
});

type WebToolRegistry = ReturnType<typeof useLiveWebCodingToolRegistry>;

const revisionGuardedWebTools = new Set([
  'web.writeFile',
  'web.applyPatch',
  'web.setTheme',
  'web.addFeature',
  'web.updateHero',
]);

function serializeWorkspace(manager: LiveEditorWorkspaceManager) {
  const snapshot = manager.getSnapshot();
  return {
    activePath: snapshot.activePath,
    rootName: snapshot.rootName,
    revision: snapshot.revision,
    files: snapshot.files.map((file) => ({
      path: file.path,
      isText: file.isText,
      size: file.size,
    })),
  };
}

function inferWebWorkspacePath(prompt: string): string | null {
  const explicitPath = prompt.match(
    /(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.(?:html?|css|m?js|json|md|txt)(?=\b|[^A-Za-z0-9_.-])/i
  )?.[0];
  if (explicitPath) return explicitPath;
  if (/\bstyle/i.test(prompt)) return 'style.css';
  if (/\bscript/i.test(prompt)) return 'script.js';
  return 'index.html';
}

function inferQuotedWebPatch(
  prompt: string
): { path: string; search: string; replace: string } | null {
  if (!/(replace|change|edit|update|바꾸|바꿔|변경|수정|교체)/i.test(prompt)) {
    return null;
  }
  const quotedValues = Array.from(
    prompt.matchAll(/["“]([^"”]+)["”]/g),
    (match) => match[1]?.trim()
  ).filter((value): value is string => Boolean(value));
  if (quotedValues.length < 2) return null;
  const [search, replace] = quotedValues;
  if (!search || !replace) return null;
  return {
    path: inferWebWorkspacePath(prompt) ?? 'index.html',
    search,
    replace,
  };
}

function assertExpectedWebRevision(
  manager: LiveEditorWorkspaceManager,
  expectedRevision?: number
): void {
  if (expectedRevision === undefined) return;
  const currentRevision = manager.getSnapshot().revision;
  if (expectedRevision !== currentRevision) {
    throw new Error(
      `Workspace revision mismatch: expected ${expectedRevision}, current ${currentRevision}. Re-read the workspace before applying the mutation.`
    );
  }
}

function WebCodingToolHandlers({
  manager,
  documentManager,
  repository,
  children,
}: {
  manager: LiveEditorWorkspaceManager;
  documentManager: LiveEditorDocumentManager;
  repository: LiveEditorWorkspaceRepository;
  children: ReactNode;
}) {
  const updateFileAndWait = async (
    path: string,
    source: string,
    options?: { expectedRevision?: number; signal?: AbortSignal }
  ) => {
    if (options?.signal?.aborted)
      throw new Error('Workspace update cancelled.');
    assertExpectedWebRevision(manager, options?.expectedRevision);
    const normalizedPath = normalizeWorkspacePath(path);
    const current = manager
      .getSnapshot()
      .files.find((file) => file.path === normalizedPath);
    if (current && !current.isText) {
      throw new Error(
        `${normalizedPath} is binary and cannot be edited as text.`
      );
    }

    const nextWorkspace = manager.updateFile(normalizedPath, source);
    await repository.saveTextFile(
      WEB_WORKSPACE_ID,
      normalizedPath,
      source,
      current?.mimeType
    );
    if (options?.signal?.aborted)
      throw new Error('Workspace update cancelled.');
    const activeDocument = documentManager.getSnapshot();
    const nextDocument = documentManager.update(
      activeDocument.file === normalizedPath ? { source } : {}
    );
    const preview = await documentManager.waitForRendered(
      nextDocument.revision,
      2_000,
      options?.signal
    );
    return { path: normalizedPath, revision: nextWorkspace.revision, preview };
  };

  useLiveWebCodingToolHandler('web.getWorkspace', () =>
    serializeWorkspace(manager)
  );

  useLiveWebCodingToolHandler('web.readFile', ({ path }) => {
    const file = manager
      .getSnapshot()
      .files.find(
        (candidate) => candidate.path === normalizeWorkspacePath(path)
      );
    if (!file) throw new Error(`Workspace file not found: ${path}`);
    if (!file.isText)
      throw new Error(`${path} is binary and cannot be read as text.`);
    return {
      path: file.path,
      source: file.source,
      revision: manager.getSnapshot().revision,
    };
  });

  useLiveWebCodingToolHandler<'web.writeFile', unknown>(
    'web.writeFile',
    ({ path, source, expectedRevision }, controller) =>
      updateFileAndWait(path, source, {
        expectedRevision,
        signal: controller.signal,
      })
  );

  useLiveWebCodingToolHandler<'web.applyPatch', unknown>(
    'web.applyPatch',
    async (
      { path, search, replace, occurrence, expectedRevision },
      controller
    ) => {
      assertExpectedWebRevision(manager, expectedRevision);
      const normalizedPath = normalizeWorkspacePath(path);
      const file = manager
        .getSnapshot()
        .files.find((candidate) => candidate.path === normalizedPath);
      if (!file) throw new Error(`Workspace file not found: ${normalizedPath}`);
      if (!file.isText)
        throw new Error(
          `${normalizedPath} is binary and cannot be patched as text.`
        );
      const patch = applyLiveEditorTextPatch(
        file.source,
        search,
        replace,
        occurrence
      );
      if (patch.source.length > 100_000) {
        throw new Error('Patched source exceeds the 100,000 character limit.');
      }
      return {
        replacements: patch.replacements,
        ...(await updateFileAndWait(normalizedPath, patch.source, {
          expectedRevision,
          signal: controller.signal,
        })),
      };
    }
  );

  useLiveWebCodingToolHandler<'web.setTheme', unknown>(
    'web.setTheme',
    async ({ theme, expectedRevision }, controller) => {
      assertExpectedWebRevision(manager, expectedRevision);
      const cssFile = manager
        .getSnapshot()
        .files.find((file) => file.path === 'style.css');
      if (!cssFile) throw new Error('style.css is required for theme changes.');
      const tokens = themeTokens[theme];
      if (!/--accent:\s*#[0-9a-f]+;/i.test(cssFile.source)) {
        throw new Error('style.css does not expose an --accent token.');
      }
      if (!/--accent-soft:\s*#[0-9a-f]+;/i.test(cssFile.source)) {
        throw new Error('style.css does not expose an --accent-soft token.');
      }
      const source = cssFile.source
        .replace(/--accent:\s*#[0-9a-f]+;/i, `--accent: ${tokens.accent};`)
        .replace(
          /--accent-soft:\s*#[0-9a-f]+;/i,
          `--accent-soft: ${tokens.soft};`
        );
      return {
        theme,
        ...(await updateFileAndWait('style.css', source, {
          expectedRevision,
          signal: controller.signal,
        })),
      };
    }
  );

  useLiveWebCodingToolHandler<'web.addFeature', unknown>(
    'web.addFeature',
    async ({ title, description, expectedRevision }, controller) => {
      assertExpectedWebRevision(manager, expectedRevision);
      const htmlFile = manager
        .getSnapshot()
        .files.find((file) => file.path === 'index.html');
      if (!htmlFile)
        throw new Error('index.html is required for feature cards.');
      if (
        !/<section\s+id="feature-grid"\s+class="feature-grid">[\s\S]*?<\/section>/i.test(
          htmlFile.source
        )
      ) {
        throw new Error(
          'index.html does not expose the feature-grid insertion target.'
        );
      }
      const card = `<article class="feature-card"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(description)}</span></article>`;
      const source = htmlFile.source.replace(
        /(<section\s+id="feature-grid"\s+class="feature-grid">[\s\S]*?)(<\/section>)/i,
        `$1${card}$2`
      );
      return {
        title,
        ...(await updateFileAndWait('index.html', source, {
          expectedRevision,
          signal: controller.signal,
        })),
      };
    }
  );

  useLiveWebCodingToolHandler<'web.updateHero', unknown>(
    'web.updateHero',
    async ({ title, subtitle, expectedRevision }, controller) => {
      assertExpectedWebRevision(manager, expectedRevision);
      const htmlFile = manager
        .getSnapshot()
        .files.find((file) => file.path === 'index.html');
      if (!htmlFile)
        throw new Error('index.html is required for hero changes.');
      if (
        !/<h1\b[^>]*id="hero-title"[^>]*>[\s\S]*?<\/h1>/i.test(htmlFile.source)
      ) {
        throw new Error('index.html does not expose a hero title target.');
      }
      if (
        !/<p\b[^>]*id="hero-subtitle"[^>]*>[\s\S]*?<\/p>/i.test(htmlFile.source)
      ) {
        throw new Error('index.html does not expose a hero subtitle target.');
      }
      const source = htmlFile.source
        .replace(
          /(<h1\b[^>]*id="hero-title"[^>]*>)[\s\S]*?(<\/h1>)/i,
          `$1${escapeHtml(title)}$2`
        )
        .replace(
          /(<p\b[^>]*id="hero-subtitle"[^>]*>)[\s\S]*?(<\/p>)/i,
          `$1${escapeHtml(subtitle)}$2`
        );
      return {
        title,
        ...(await updateFileAndWait('index.html', source, {
          expectedRevision,
          signal: controller.signal,
        })),
      };
    }
  );

  useLiveWebCodingToolHandler('web.runPreview', () => ({
    workspace: serializeWorkspace(manager),
    preview: documentManager.getPreviewStatus(),
  }));

  return <>{children}</>;
}

function callToolResultText(result: {
  isError?: boolean;
  error?: { message?: string };
  structuredContent?: unknown;
}) {
  if (result.isError) return result.error?.message ?? 'Tool call failed.';
  return JSON.stringify(result.structuredContent ?? {}, null, 2);
}

async function runLocalPrompt(
  registry: WebToolRegistry,
  prompt: string,
  signal?: AbortSignal,
  sessionId?: string
): Promise<{ toolNames: string[]; response: string }> {
  registry.listTools({ method: 'tools/list' });
  const executeLocalModelCall = (
    name: string,
    argumentsValue: Record<string, unknown>
  ) =>
    registry.executeModelToolCall(
      {
        id: `local-model-${Date.now()}-${name}`,
        name,
        arguments: argumentsValue,
      },
      {
        context: {
          source: 'model',
          ...(sessionId ? { sessionId } : {}),
          metadata: { interaction: 'prompt', provider: 'local-fallback' },
        },
        signal,
      }
    );
  const normalized = prompt.toLowerCase();
  const calls: Array<{
    name: string;
    arguments: Record<string, unknown>;
  }> = [];
  const textPatch = inferQuotedWebPatch(prompt);

  if (textPatch) {
    calls.push({
      name: 'web.applyPatch',
      arguments: { ...textPatch, occurrence: 'first' },
    });
  }

  if (/(보라|purple|violet)/i.test(normalized)) {
    calls.push({ name: 'web.setTheme', arguments: { theme: 'violet' } });
  } else if (/(초록|green|emerald|mint)/i.test(normalized)) {
    calls.push({ name: 'web.setTheme', arguments: { theme: 'emerald' } });
  } else if (/(주황|amber|orange)/i.test(normalized)) {
    calls.push({ name: 'web.setTheme', arguments: { theme: 'amber' } });
  } else if (/(분홍|rose|pink)/i.test(normalized)) {
    calls.push({ name: 'web.setTheme', arguments: { theme: 'rose' } });
  }

  if (/(기능|feature|카드|추가)/i.test(normalized)) {
    calls.push({
      name: 'web.addFeature',
      arguments: {
        title: 'AI generated feature',
        description: 'A new card was added through a controlled web tool call.',
      },
    });
  }

  if (/(제목|hero|랜딩|landing)/i.test(normalized)) {
    calls.push({
      name: 'web.updateHero',
      arguments: {
        title: 'A live page shaped by conversation.',
        subtitle:
          'The chat selected tools, the workspace changed, and the iframe acknowledged the revision.',
      },
    });
  }

  if (calls.length === 0) {
    calls.push({ name: 'web.getWorkspace', arguments: {} });
  }

  const toolNames: string[] = [];
  let plannedRevision: number | undefined;
  const workspaceResult = await executeLocalModelCall('web.getWorkspace', {});
  if (!workspaceResult.isError) {
    const workspace = workspaceResult.structuredContent;
    if (
      workspace &&
      typeof workspace === 'object' &&
      !Array.isArray(workspace) &&
      typeof (workspace as { revision?: unknown }).revision === 'number'
    ) {
      plannedRevision = (workspace as { revision: number }).revision;
    }
  }
  for (const call of calls) {
    if (signal?.aborted) throw new Error('Execution cancelled.');
    const argumentsValue =
      revisionGuardedWebTools.has(call.name) &&
      call.arguments.expectedRevision === undefined &&
      plannedRevision !== undefined
        ? { ...call.arguments, expectedRevision: plannedRevision }
        : call.arguments;
    const result = await executeLocalModelCall(call.name, argumentsValue);
    if (signal?.aborted) throw new Error('Execution cancelled.');
    toolNames.push(call.name);
    if (result.isError) {
      return { toolNames, response: callToolResultText(result) };
    }
    if (revisionGuardedWebTools.has(call.name)) {
      const nextWorkspace = await executeLocalModelCall('web.getWorkspace', {});
      const nextRevision = nextWorkspace.structuredContent;
      if (
        !nextWorkspace.isError &&
        nextRevision &&
        typeof nextRevision === 'object' &&
        !Array.isArray(nextRevision) &&
        typeof (nextRevision as { revision?: unknown }).revision === 'number'
      ) {
        plannedRevision = (nextRevision as { revision: number }).revision;
      }
    }
  }
  return {
    toolNames,
    response: `로컬 demo agent가 ${toolNames.join(', ')}를 호출하고 preview 동기화를 기다렸습니다.`,
  };
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
  const registry = useLiveWebCodingToolRegistry();
  const trace = useSyncExternalStore(
    liveWebCodingTraceStore.subscribe,
    liveWebCodingTraceStore.getSnapshot,
    liveWebCodingTraceStore.getSnapshot
  );
  const workspaceSnapshot = useSyncExternalStore(
    (listener) => manager.subscribe(() => listener()),
    manager.getSnapshot,
    manager.getSnapshot
  );
  const documentSnapshot = useSyncExternalStore(
    (listener) => documentManager.subscribe(() => listener()),
    documentManager.getSnapshot,
    documentManager.getSnapshot
  );
  const apiKey = useStoredOpenRouterApiKey();
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [prompt, setPrompt] = useState(
    '보라색 테마로 바꾸고 기능 카드를 하나 추가해줘'
  );
  const [messages, setMessages] = useState<
    Array<{ role: 'user' | 'assistant'; text: string; tools?: string[] }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [traceCopied, setTraceCopied] = useState(false);
  const [status, setStatus] = useState('IndexedDB workspace loading…');
  const [error, setError] = useState('');
  const executionControllerRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      executionControllerRef.current?.abort();
    },
    []
  );

  useEffect(() => {
    let active = true;
    void repository
      .ensureWorkspace(WEB_WORKSPACE_ID, defaultWebFiles, WEB_WORKSPACE_ROOT)
      .then((persisted) => {
        if (!active) return;
        manager.replaceFiles(persisted.files, {
          rootName: persisted.metadata.rootName,
          storageMode: 'indexed-db',
          activePath: persisted.metadata.activePath || 'index.html',
        });
        const entry = persisted.files.find(
          (file) => file.path === 'index.html'
        );
        if (entry) {
          documentManager.update({
            file: 'index.html',
            source: entry.source,
            exampleId: 'realtime-web-coding',
          });
        }
        setStatus(`${persisted.files.length} files persisted · iframe ready`);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Workspace load failed.'
          );
        }
      });
    return () => {
      active = false;
    };
  }, [documentManager, manager, repository]);

  useEffect(() => {
    let active = true;
    setStatus('Loading tool-capable models…');
    void getFreeModelsWithTools()
      .then((freeModels) => {
        if (!active) return;
        setModels(freeModels);
        setSelectedModel((current) => current || freeModels[0]?.id || '');
        setStatus((current) =>
          current.startsWith('Loading') ? 'Local tools ready' : current
        );
      })
      .catch(() => {
        if (active) setStatus('Local tools ready · model list unavailable');
      });
    return () => {
      active = false;
    };
  }, []);

  const runner = useMemo(
    () =>
      apiKey
        ? createBrowserOpenRouterToolRunner({
            apiKey,
            referer: window.location.origin,
          })
        : null,
    [apiKey]
  );

  const beginExecution = () => {
    const controller = new AbortController();
    executionControllerRef.current = controller;
    return controller;
  };

  const finishExecution = (controller: AbortController) => {
    if (executionControllerRef.current === controller) {
      executionControllerRef.current = null;
    }
    setLoading(false);
  };

  const cancelExecution = () => {
    const controller = executionControllerRef.current;
    if (controller && !controller.signal.aborted) controller.abort();
  };

  const copyTrace = async () => {
    if (!trace.length) return;
    try {
      await writeClipboardText(serializeToolTrace(trace));
      setTraceCopied(true);
      window.setTimeout(() => setTraceCopied(false), 1600);
    } catch {
      setError('웹 코딩 trace를 복사하지 못했습니다.');
    }
  };

  const sendPrompt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextPrompt = prompt.trim();
    if (!nextPrompt || loading) return;
    const controller = beginExecution();
    const sessionId = createToolCallSessionId();
    setLoading(true);
    setError('');
    setMessages((current) => [...current, { role: 'user', text: nextPrompt }]);
    try {
      if (runner && selectedModel) {
        const response = await runner.generate({
          model: selectedModel,
          messages: [
            {
              role: 'system',
              content:
                'You are a realtime web coding assistant. Inspect the workspace before editing. Use web.setTheme, web.addFeature, web.updateHero, web.applyPatch, or web.writeFile to make the requested change. When read results include a workspace revision, pass it as expectedRevision for mutations. The user expects a visible HTML/CSS/JS preview update.',
            },
            { role: 'user', content: nextPrompt },
          ] satisfies ModelMessage[],
          registry,
          signal: controller.signal,
          sessionId,
        });
        if (controller.signal.aborted) {
          throw new Error('Execution cancelled.');
        }
        setMessages((current) => [
          ...current,
          {
            role: 'assistant',
            text:
              response.text ||
              `AI tool loop completed ${response.toolCallCount} call(s).`,
            tools: [`OpenRouter · ${response.toolCallCount} tool call(s)`],
          },
        ]);
      } else {
        const local = await runLocalPrompt(
          registry,
          nextPrompt,
          controller.signal,
          sessionId
        );
        setMessages((current) => [
          ...current,
          { role: 'assistant', text: local.response, tools: local.toolNames },
        ]);
      }
      if (controller.signal.aborted) {
        throw new Error('Execution cancelled.');
      }
      setPrompt('');
    } catch (requestError) {
      if (controller.signal.aborted) {
        setMessages((current) => [
          ...current,
          {
            role: 'assistant',
            text: 'Execution cancelled. No toolchain success was reported.',
          },
        ]);
        setError('');
      } else {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Realtime web coding request failed.'
        );
      }
    } finally {
      finishExecution(controller);
    }
  };

  const runTool = async (name: string, args: Record<string, unknown>) => {
    const controller = beginExecution();
    const sessionId = createToolCallSessionId();
    setLoading(true);
    setError('');
    try {
      const guardedArgs =
        revisionGuardedWebTools.has(name) && args.expectedRevision === undefined
          ? { ...args, expectedRevision: workspaceSnapshot.revision }
          : args;
      const result = await registry.callTool(
        {
          id: `palette-${Date.now()}`,
          method: 'tools/call',
          params: { name, arguments: guardedArgs },
        },
        {
          context: { source: 'local', sessionId },
          signal: controller.signal,
        }
      );
      if (controller.signal.aborted) {
        throw new Error('Execution cancelled.');
      }
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: result.isError
            ? callToolResultText(result)
            : `${name} completed and the iframe acknowledged the revision.`,
          tools: [name],
        },
      ]);
    } catch (toolError) {
      if (controller.signal.aborted) {
        setMessages((current) => [
          ...current,
          {
            role: 'assistant',
            text: 'Execution cancelled. No tool success was reported.',
          },
        ]);
        setError('');
      } else {
        setError(
          toolError instanceof Error ? toolError.message : 'Tool failed.'
        );
      }
    } finally {
      finishExecution(controller);
    }
  };

  const selectFile = (path: string) => {
    const file = workspaceSnapshot.files.find(
      (candidate) => candidate.path === path
    );
    if (!file?.isText) return;
    manager.setActivePath(path);
    documentManager.update({ file: path, source: file.source });
  };

  const resetDemoWorkspace = async () => {
    if (
      loading ||
      isResetting ||
      workspaceSnapshot.storageMode !== 'indexed-db'
    ) {
      return;
    }
    if (
      !window.confirm(
        'Reset the live web coding demo to its built-in files? Current demo edits will be replaced.'
      )
    ) {
      return;
    }

    setIsResetting(true);
    setError('');
    try {
      const persisted = await repository.replaceWorkspace(
        WEB_WORKSPACE_ID,
        createDefaultWebWorkspaceBlobFiles(),
        { rootName: WEB_WORKSPACE_ROOT }
      );
      manager.replaceFiles(persisted.files, {
        rootName: persisted.metadata.rootName,
        storageMode: 'indexed-db',
        activePath: 'index.html',
      });
      const entry = persisted.files.find((file) => file.path === 'index.html');
      if (entry) {
        documentManager.update({
          file: entry.path,
          source: entry.source,
          exampleId: 'realtime-web-coding',
          scenario: 'success',
        });
      }
      clearLiveWebCodingTrace();
      setMessages([]);
      setStatus(`${persisted.files.length} demo files restored · iframe ready`);
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : 'Demo workspace reset failed.'
      );
    } finally {
      setIsResetting(false);
    }
  };

  const activeFile = workspaceSnapshot.files.find(
    (file) => file.path === workspaceSnapshot.activePath
  );
  const toolDefinitions = registry.listTools().tools;

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
                  {runner && selectedModel ? 'AI' : 'LOCAL'}
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
                      saveOpenRouterApiKey(event.target.value)
                    }
                  />
                </label>
                {models.length > 0 && (
                  <label>
                    <span>Model</span>
                    <select
                      value={selectedModel}
                      onChange={(event) => setSelectedModel(event.target.value)}
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
                      onClick={clearLiveWebCodingTrace}
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      className={styles.toolTraceClear}
                      aria-label="Copy web coding tool trace"
                      disabled={!trace.length}
                      onClick={() => void copyTrace()}
                    >
                      {traceCopied ? 'Copied' : 'Copy'}
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
                              : ''
                        }`}
                        key={entry.id}
                        title={`toolCallId: ${entry.id}${entry.sessionId ? ` · sessionId: ${entry.sessionId}` : ''}`}
                      >
                        <span
                          aria-hidden="true"
                          className={styles.toolTraceMark}
                        >
                          {entry.status === 'failed'
                            ? '×'
                            : entry.status === 'running'
                              ? '…'
                              : '✓'}
                        </span>
                        <span className={styles.toolTraceCopy}>
                          <code>{entry.name}</code>
                          <small>
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
              {error && <p className={styles.error}>{error}</p>}
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
                    onClick={() => void resetDemoWorkspace()}
                    disabled={
                      loading ||
                      isResetting ||
                      workspaceSnapshot.storageMode !== 'indexed-db'
                    }
                    title="Restore the built-in live web coding files"
                  >
                    {isResetting ? 'Resetting…' : 'Reset demo workspace'}
                  </button>
                  <span className={styles.workspaceStatus}>{status}</span>
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
                    onClick={() => selectFile(file.path)}
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
                  onRendered={(revision) =>
                    documentManager.markRendered(revision)
                  }
                />
              </div>
            </section>
          </section>

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
      <WebCodingToolHandlers
        manager={manager}
        documentManager={documentManager}
        repository={repository}
      >
        <LiveWebCodingWorkbench
          manager={manager}
          documentManager={documentManager}
          repository={repository}
        />
      </WebCodingToolHandlers>
    </LiveWebCodingToolProvider>
  );
}

export default LiveWebCodingPage;
