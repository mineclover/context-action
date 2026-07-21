import type {
  ToolCallEvent,
  ToolCallMode,
  ToolExecutionProvenance,
} from '@context-action/tool-protocol';
import {
  createToolObservabilityPolicy,
  isToolObservationRetained,
  serializeToolObservabilityValue,
} from '@context-action/tool-protocol';

export type ToolTraceMethod = 'tools/list' | 'tools/call' | 'agent.request';

export type ToolTraceEntry = {
  id: string;
  name: string;
  kind: 'discovery' | 'call' | 'agent';
  method: ToolTraceMethod;
  mode?: ToolCallMode;
  source: string;
  sessionId?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  durationMs?: number;
  startedAt: number;
  summary?: string;
  provenance?: ToolExecutionProvenance;
};

export const ALL_TOOL_TRACE_SESSIONS = 'all';

export type ToolTraceSessionOption = {
  value: string;
  label: string;
};

export type AgentTraceHandle = {
  id: string;
  sessionId: string;
  source: string;
  startedAt: number;
};

export type ToolCallTraceStore = {
  getSnapshot: () => ToolTraceEntry[];
  subscribe: (listener: () => void) => () => void;
  record: (event: ToolCallEvent) => void;
  recordToolList: (
    toolCount: number,
    source?: string,
    sessionId?: string
  ) => void;
  startAgentTrace: (source: string, sessionId?: string) => AgentTraceHandle;
  finishAgentTrace: (
    handle: AgentTraceHandle,
    status: Exclude<ToolTraceEntry['status'], 'running'>,
    summary: string
  ) => void;
  clear: () => void;
};

export function formatToolTraceId(id: string): string {
  return id.length > 18 ? `…${id.slice(-17)}` : id;
}

export function getToolTraceSessionOptions(
  entries: readonly ToolTraceEntry[]
): readonly ToolTraceSessionOption[] {
  const sessions = new Map<string, string>();
  for (const entry of entries) {
    if (entry.sessionId && !sessions.has(entry.sessionId)) {
      sessions.set(entry.sessionId, entry.source);
    }
  }

  return [
    { value: ALL_TOOL_TRACE_SESSIONS, label: 'All sessions' },
    ...Array.from(sessions, ([sessionId, source]) => ({
      value: sessionId,
      label: `${source} · ${formatToolTraceId(sessionId)}`,
    })),
  ];
}

export function filterToolTraceEntries(
  entries: readonly ToolTraceEntry[],
  sessionId: string
): readonly ToolTraceEntry[] {
  if (sessionId === ALL_TOOL_TRACE_SESSIONS) return entries;
  return entries.filter((entry) => entry.sessionId === sessionId);
}

export function serializeToolTrace(entries: readonly ToolTraceEntry[]): string {
  return JSON.stringify(entries, null, 2);
}

export function downloadTextFile(
  value: string,
  filename: string,
  mimeType = 'application/json'
): void {
  const blob = new Blob([value], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  window.setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(url);
  }, 0);
}

export async function writeClipboardText(value: string): Promise<void> {
  const clipboard = navigator.clipboard;
  if (clipboard?.writeText) {
    try {
      await Promise.race([
        clipboard.writeText(value),
        new Promise<never>((_, reject) => {
          window.setTimeout(
            () => reject(new Error('Clipboard access timed out.')),
            350
          );
        }),
      ]);
      return;
    } catch {
      // Fall through to the synchronous browser copy path.
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.width = '1px';
  textarea.style.height = '1px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } finally {
    textarea.remove();
  }
  if (!copied) throw new Error('Clipboard access is unavailable.');
}

let sessionSequence = 0;

export function createToolCallSessionId(): string {
  return `session-${Date.now()}-${sessionSequence++}`;
}

function trimSummary(value: string): string {
  return value.length > 140 ? `${value.slice(0, 137)}…` : value;
}

function resultSummary(
  event: Extract<ToolCallEvent, { type: 'completed' | 'failed' }>
): string {
  if (event.type === 'failed' || event.result.isError) {
    return trimSummary(
      event.result.error?.code ?? event.result.error?.message ?? 'tool error'
    );
  }

  const structured = event.result.structuredContent;
  if (
    !structured ||
    typeof structured !== 'object' ||
    Array.isArray(structured)
  ) {
    return 'tool result received';
  }

  const value = structured as Record<string, unknown>;
  const revision =
    typeof value.revision === 'number' ? ` · revision ${value.revision}` : '';
  const preview = value.preview;
  const previewSuffix =
    preview && typeof preview === 'object' && !Array.isArray(preview)
      ? (() => {
          const previewValue = preview as Record<string, unknown>;
          return typeof previewValue.state === 'string'
            ? ` · preview ${previewValue.state}`
            : '';
        })()
      : '';

  if (typeof value.replacements === 'number') {
    return `${value.replacements} replacements${revision}${previewSuffix}`;
  }
  if (Array.isArray(value.files)) {
    return `${value.files.length} files${revision}`;
  }
  if (typeof value.path === 'string') {
    return `${value.path}${revision}${previewSuffix}`;
  }
  if (typeof value.theme === 'string') {
    return `theme ${value.theme}${revision}${previewSuffix}`;
  }
  if (typeof value.scenario === 'string') {
    return `scenario ${value.scenario}${revision}${previewSuffix}`;
  }
  if (typeof value.title === 'string') {
    return `title updated${revision}${previewSuffix}`;
  }
  if (revision || previewSuffix) {
    return `${revision}${previewSuffix}`.replace(/^ · /, '');
  }
  return 'tool result received';
}

export function createToolCallTraceStore(maxEntries = 16): ToolCallTraceStore {
  const observabilityPolicy = createToolObservabilityPolicy({
    maxBytes: 2_400,
    maxEntries,
    maxStringLength: 140,
  });
  let entries: ToolTraceEntry[] = [];
  const listeners = new Set<() => void>();

  const notify = (): void => {
    for (const listener of listeners) listener();
  };

  const sanitizeTraceText = (value: string): string => {
    const serialized = serializeToolObservabilityValue(
      value,
      observabilityPolicy
    );
    try {
      const parsed: unknown = JSON.parse(serialized);
      return typeof parsed === 'string'
        ? parsed
        : '[observability summary redacted]';
    } catch {
      return '[observability summary redacted]';
    }
  };

  const trimEntries = (nextEntries: ToolTraceEntry[]): ToolTraceEntry[] => {
    const now = Date.now();
    return nextEntries
      .filter((entry) =>
        isToolObservationRetained(entry.startedAt, now, observabilityPolicy)
      )
      .slice(0, observabilityPolicy.maxEntries);
  };

  const upsertEntry = (entry: ToolTraceEntry): void => {
    const existingIndex = entries.findIndex(
      (candidate) => candidate.id === entry.id
    );
    entries = trimEntries([
      ...(existingIndex >= 0
        ? entries.map((candidate, index) =>
            index === existingIndex ? entry : candidate
          )
        : [entry]),
    ]);
    notify();
  };

  const recordToolList = (
    toolCount: number,
    source = 'system',
    sessionId?: string
  ): void => {
    const startedAt = Date.now();
    const entry: ToolTraceEntry = {
      id: `list-${startedAt}-${sessionSequence++}`,
      name: 'tools/list',
      kind: 'discovery',
      method: 'tools/list',
      source,
      ...(sessionId ? { sessionId } : {}),
      status: 'completed',
      startedAt,
      durationMs: 0,
      summary: `${toolCount} tools available`,
    };
    entries = trimEntries([entry, ...entries]);
    notify();
  };

  const record = (event: ToolCallEvent): void => {
    const id = String(event.toolCallId ?? `${event.name}-${Date.now()}`);
    const source = event.context?.source ?? 'mcp';
    const sessionId = event.context?.sessionId;
    const existingIndex = entries.findIndex((entry) => entry.id === id);
    const nextEntry: ToolTraceEntry =
      event.type === 'started'
        ? {
            id,
            name: event.name,
            kind: 'call',
            method: 'tools/call',
            ...(event.context?.mode ? { mode: event.context.mode } : {}),
            source,
            ...(sessionId ? { sessionId } : {}),
            status: 'running',
            startedAt: event.timestamp,
            provenance: event.provenance,
          }
        : {
            id,
            name: event.name,
            kind: 'call',
            method: 'tools/call',
            ...(event.context?.mode ? { mode: event.context.mode } : {}),
            source,
            ...(sessionId ? { sessionId } : {}),
            status: event.type === 'failed' ? 'failed' : 'completed',
            startedAt: event.timestamp - event.durationMs,
            durationMs: event.durationMs,
            summary: sanitizeTraceText(resultSummary(event)),
            provenance: event.provenance,
          };

    entries = trimEntries(
      existingIndex >= 0
        ? entries.map((entry, index) =>
            index === existingIndex ? nextEntry : entry
          )
        : [nextEntry, ...entries]
    );
    notify();
  };

  const startAgentTrace = (
    source: string,
    sessionId = createToolCallSessionId()
  ): AgentTraceHandle => {
    const startedAt = Date.now();
    const handle: AgentTraceHandle = {
      id: `agent-${startedAt}-${sessionSequence++}`,
      sessionId,
      source,
      startedAt,
    };
    upsertEntry({
      id: handle.id,
      name: 'agent.request',
      kind: 'agent',
      method: 'agent.request',
      mode: 'agent',
      source,
      sessionId,
      status: 'running',
      startedAt,
    });
    return handle;
  };

  const finishAgentTrace = (
    handle: AgentTraceHandle,
    status: Exclude<ToolTraceEntry['status'], 'running'>,
    summary: string
  ): void => {
    upsertEntry({
      id: handle.id,
      name: 'agent.request',
      kind: 'agent',
      method: 'agent.request',
      mode: 'agent',
      source: handle.source,
      sessionId: handle.sessionId,
      status,
      startedAt: handle.startedAt,
      durationMs: Math.max(0, Date.now() - handle.startedAt),
      summary: sanitizeTraceText(summary),
    });
  };

  const clear = (): void => {
    if (!entries.length) return;
    entries = [];
    notify();
  };

  return {
    getSnapshot: () => entries,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    record,
    recordToolList,
    startAgentTrace,
    finishAgentTrace,
    clear,
  };
}
