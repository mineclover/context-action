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
  toolCallId?: string;
  sessionId?: string;
  kind: 'discovery' | 'call' | 'agent';
  method: ToolTraceMethod;
  mode?: ToolCallMode;
  name: string;
  source: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: number;
  durationMs?: number;
  toolCount?: number;
  retryable?: boolean;
  summary?: string;
  provenance?: ToolExecutionProvenance;
  argumentsText?: string;
  resultText?: string;
};

/** Export-safe projection; local UI diagnostics never cross copy/download sinks. */
export type ToolTraceExportEntry = Omit<
  ToolTraceEntry,
  'argumentsText' | 'resultText'
>;

const MAX_TRACE_ENTRIES = 24;
const TRACE_OBSERVABILITY_POLICY = createToolObservabilityPolicy({
  maxBytes: 2_400,
  maxEntries: MAX_TRACE_ENTRIES,
});
const TRACE_EXPORT_POLICY = createToolObservabilityPolicy({
  maxBytes: 8 * 1024,
  maxEntries: MAX_TRACE_ENTRIES,
});
let sequence = 0;
let entries: ToolTraceEntry[] = [];
const listeners = new Set<() => void>();
const activeTraceIdsByRequest = new WeakMap<object, string>();
const activeTraceIdsByCorrelation = new Map<string, string[]>();

export type AgentTraceHandle = {
  id: string;
  sessionId: string;
  source: string;
  startedAt: number;
};

export function createToolSessionId(): string {
  return `session-${Date.now()}-${sequence++}`;
}

function notify(): void {
  for (const listener of listeners) listener();
}

function trimEntries(nextEntries: ToolTraceEntry[]): ToolTraceEntry[] {
  const now = Date.now();
  return nextEntries
    .filter((entry) =>
      isToolObservationRetained(
        entry.startedAt,
        now,
        TRACE_OBSERVABILITY_POLICY
      )
    )
    .slice(0, TRACE_OBSERVABILITY_POLICY.maxEntries);
}

function nextTraceId(): string {
  return `trace-${Date.now()}-${sequence++}`;
}

function protocolToolCallId(event: ToolCallEvent): string | undefined {
  return event.toolCallId === undefined ? undefined : String(event.toolCallId);
}

function correlationKey(
  event: ToolCallEvent,
  toolCallId: string | undefined
): string {
  return `${event.context?.sessionId ?? 'no-session'}:${event.name}:${toolCallId ?? 'anonymous'}`;
}

function addActiveTraceId(key: string, traceId: string): void {
  const activeIds = activeTraceIdsByCorrelation.get(key) ?? [];
  activeIds.push(traceId);
  activeTraceIdsByCorrelation.set(key, activeIds);
}

function removeActiveTraceId(key: string, traceId: string): void {
  const activeIds = activeTraceIdsByCorrelation.get(key);
  if (!activeIds) return;
  const remaining = activeIds.filter((id) => id !== traceId);
  if (remaining.length) activeTraceIdsByCorrelation.set(key, remaining);
  else activeTraceIdsByCorrelation.delete(key);
}

function resolveTraceId(event: ToolCallEvent): {
  traceId: string;
  toolCallId?: string;
} {
  const toolCallId = protocolToolCallId(event);
  const key = correlationKey(event, toolCallId);
  if (event.type === 'started') {
    const traceId = nextTraceId();
    activeTraceIdsByRequest.set(event.request, traceId);
    addActiveTraceId(key, traceId);
    return {
      traceId,
      ...(toolCallId !== undefined ? { toolCallId } : {}),
    };
  }

  const requestTraceId = activeTraceIdsByRequest.get(event.request);
  const fallbackTraceId = activeTraceIdsByCorrelation.get(key)?.[0];
  const traceId = requestTraceId ?? fallbackTraceId ?? nextTraceId();
  activeTraceIdsByRequest.delete(event.request);
  removeActiveTraceId(key, traceId);
  return {
    traceId,
    ...(toolCallId !== undefined ? { toolCallId } : {}),
  };
}

function formatTraceJson(value: unknown): string {
  return serializeToolObservabilityValue(value, TRACE_OBSERVABILITY_POLICY);
}

export function projectToolTraceEntriesForExport(
  traceEntries: readonly ToolTraceEntry[]
): readonly ToolTraceExportEntry[] {
  return traceEntries.map(
    ({ argumentsText: _argumentsText, resultText: _resultText, ...entry }) =>
      entry
  );
}

export function serializeToolTraceEntriesForExport(
  traceEntries: readonly ToolTraceEntry[]
): string {
  return serializeToolObservabilityValue(
    projectToolTraceEntriesForExport(traceEntries),
    TRACE_EXPORT_POLICY
  );
}

function resultTraceValue(
  event: Extract<ToolCallEvent, { type: 'completed' | 'failed' }>
): unknown {
  if (event.result.isError) {
    return {
      isError: true,
      error: event.result.error,
      content: event.result.content,
    };
  }
  return event.result.structuredContent ?? event.result.content;
}

function resultSummary(
  event: Extract<ToolCallEvent, { type: 'completed' | 'failed' }>
): string {
  if (event.type === 'failed' || event.result.isError) {
    return event.result.error?.code ?? 'tool error';
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
  if (Array.isArray(value.files))
    return `${value.files.length} files${revision}`;
  if (
    typeof value.rootName === 'string' &&
    typeof value.fileCount === 'number' &&
    typeof value.storageMode === 'string' &&
    value.preview === 'synced'
  ) {
    return `reset ${value.rootName} · ${value.fileCount} files${revision}`;
  }
  if (Array.isArray(value.savedPaths)) {
    const deletedCount = Array.isArray(value.deletedPaths)
      ? value.deletedPaths.length
      : 0;
    const pendingSuffix =
      value.checkpointUpdated === false ? ' · newer changes pending' : '';
    return `${value.savedPaths.length} saved${deletedCount ? ` · ${deletedCount} deleted` : ''}${pendingSuffix}${revision}`;
  }
  if (typeof value.fileCount === 'number' && Array.isArray(value.skipped)) {
    return `${value.fileCount} files reloaded · ${value.skipped.length} skipped${revision}`;
  }
  if (typeof value.path === 'string') {
    const replacementSuffix =
      typeof value.replacements === 'number'
        ? ` · ${value.replacements} replacements`
        : '';
    return `${value.path}${replacementSuffix}${revision}`;
  }
  if (typeof value.fromPath === 'string' && typeof value.toPath === 'string') {
    return `${value.fromPath} → ${value.toPath}${revision}`;
  }
  if (typeof value.theme === 'string') return `theme ${value.theme}${revision}`;
  if (
    value.filesystem &&
    typeof value.filesystem === 'object' &&
    !Array.isArray(value.filesystem)
  ) {
    const filesystem = value.filesystem as Record<string, unknown>;
    return `${String(filesystem.mode ?? 'filesystem')}${revision}`;
  }
  if (typeof value.status === 'string')
    return `status ${value.status}${revision}`;
  if (typeof value.preview === 'string') {
    return `preview ${value.preview}${revision}`;
  }
  return 'tool result received';
}

export function recordToolList(
  toolCount: number,
  source = 'local',
  sessionId?: string
): void {
  entries = trimEntries([
    {
      id: `list-${Date.now()}-${sequence++}`,
      ...(sessionId ? { sessionId } : {}),
      kind: 'discovery',
      method: 'tools/list',
      name: 'tools/list',
      source,
      status: 'completed',
      startedAt: Date.now(),
      durationMs: 0,
      toolCount,
      summary: `${toolCount} tools available`,
    },
    ...entries,
  ]);
  notify();
}

export function recordToolCall(event: ToolCallEvent): void {
  const traceIdentity = resolveTraceId(event);
  const id = traceIdentity.traceId;
  const source = event.context?.source ?? 'mcp';
  const mode = event.context?.mode;
  const sessionId = event.context?.sessionId;
  const existingIndex = entries.findIndex(
    (entry) => entry.kind === 'call' && entry.id === id
  );

  if (event.type === 'started') {
    const nextEntry: ToolTraceEntry = {
      id,
      ...(traceIdentity.toolCallId !== undefined
        ? { toolCallId: traceIdentity.toolCallId }
        : {}),
      ...(sessionId ? { sessionId } : {}),
      kind: 'call',
      method: 'tools/call',
      ...(mode ? { mode } : {}),
      name: event.name,
      source,
      status: 'running',
      startedAt: event.timestamp,
      provenance: event.provenance,
      argumentsText: formatTraceJson(event.request.params.arguments ?? {}),
    };
    entries = trimEntries(
      existingIndex >= 0
        ? entries.map((entry, index) =>
            index === existingIndex ? nextEntry : entry
          )
        : [nextEntry, ...entries]
    );
  } else {
    const nextEntry: ToolTraceEntry = {
      id,
      ...(traceIdentity.toolCallId !== undefined
        ? { toolCallId: traceIdentity.toolCallId }
        : {}),
      ...(sessionId ? { sessionId } : {}),
      kind: 'call',
      method: 'tools/call',
      ...(mode ? { mode } : {}),
      name: event.name,
      source,
      status: event.type === 'failed' ? 'failed' : 'completed',
      startedAt: event.timestamp - event.durationMs,
      durationMs: event.durationMs,
      ...(event.result.isError && event.result.error?.retryable !== undefined
        ? { retryable: event.result.error.retryable }
        : {}),
      summary: resultSummary(event),
      provenance: event.provenance,
      argumentsText: formatTraceJson(event.request.params.arguments ?? {}),
      resultText: formatTraceJson(resultTraceValue(event)),
    };
    entries = trimEntries(
      existingIndex >= 0
        ? entries.map((entry, index) =>
            index === existingIndex ? nextEntry : entry
          )
        : [nextEntry, ...entries]
    );
  }
  notify();
}

function upsertAgentTrace(entry: ToolTraceEntry): void {
  const existingIndex = entries.findIndex(
    (candidate) => candidate.kind === 'agent' && candidate.id === entry.id
  );
  entries = trimEntries(
    existingIndex >= 0
      ? entries.map((candidate, index) =>
          index === existingIndex ? entry : candidate
        )
      : [entry, ...entries]
  );
  notify();
}

export function startAgentTrace(source: string): AgentTraceHandle {
  const startedAt = Date.now();
  const handle = {
    id: `agent-${startedAt}-${sequence++}`,
    sessionId: createToolSessionId(),
    source,
    startedAt,
  };
  upsertAgentTrace({
    id: handle.id,
    sessionId: handle.sessionId,
    kind: 'agent',
    method: 'agent.request',
    mode: 'agent',
    name: 'agent.request',
    source,
    status: 'running',
    startedAt,
  });
  return handle;
}

export function finishAgentTrace(
  handle: AgentTraceHandle,
  status: Exclude<ToolTraceEntry['status'], 'running'>,
  summary: string
): void {
  upsertAgentTrace({
    id: handle.id,
    sessionId: handle.sessionId,
    kind: 'agent',
    method: 'agent.request',
    mode: 'agent',
    name: 'agent.request',
    source: handle.source,
    status,
    startedAt: handle.startedAt,
    durationMs: Math.max(0, Date.now() - handle.startedAt),
    summary,
  });
}

export function clearToolTrace(): void {
  if (!entries.length) return;
  entries = [];
  notify();
}

export const toolTraceStore = {
  getSnapshot: (): ToolTraceEntry[] => entries,
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
