import type { ToolCallEvent } from '@context-action/react';

export type ToolTraceEntry = {
  id: string;
  name: string;
  source: string;
  sessionId?: string;
  status: 'running' | 'completed' | 'failed';
  durationMs?: number;
  startedAt: number;
  summary?: string;
};

export type ToolCallTraceStore = {
  getSnapshot: () => ToolTraceEntry[];
  subscribe: (listener: () => void) => () => void;
  record: (event: ToolCallEvent) => void;
  clear: () => void;
};

export function formatToolTraceId(id: string): string {
  return id.length > 18 ? `…${id.slice(-17)}` : id;
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
  let entries: ToolTraceEntry[] = [];
  const listeners = new Set<() => void>();

  const notify = (): void => {
    for (const listener of listeners) listener();
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
            source,
            ...(sessionId ? { sessionId } : {}),
            status: 'running',
            startedAt: event.timestamp,
          }
        : {
            id,
            name: event.name,
            source,
            ...(sessionId ? { sessionId } : {}),
            status: event.type === 'failed' ? 'failed' : 'completed',
            startedAt: event.timestamp - event.durationMs,
            durationMs: event.durationMs,
            summary: resultSummary(event),
          };

    entries = (
      existingIndex >= 0
        ? entries.map((entry, index) =>
            index === existingIndex ? nextEntry : entry
          )
        : [nextEntry, ...entries]
    ).slice(0, maxEntries);
    notify();
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
    clear,
  };
}
