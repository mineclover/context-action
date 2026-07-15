import type { ToolCallEvent } from '@context-action/react';

export type LiveEditorTraceEntry = {
  id: string;
  name: string;
  source: string;
  status: 'running' | 'completed' | 'failed';
  durationMs?: number;
  startedAt: number;
  summary?: string;
};

const MAX_TRACE_ENTRIES = 16;
let entries: LiveEditorTraceEntry[] = [];
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

function trimEntries(
  nextEntries: LiveEditorTraceEntry[]
): LiveEditorTraceEntry[] {
  return nextEntries.slice(0, MAX_TRACE_ENTRIES);
}

function resultSummary(
  event: Extract<ToolCallEvent, { type: 'completed' | 'failed' }>
): string {
  if (event.type === 'failed' || event.result.isError) {
    return (
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
  if (typeof value.scenario === 'string') {
    return `scenario ${value.scenario}${revision}${previewSuffix}`;
  }
  if (revision || previewSuffix) {
    return `${revision}${previewSuffix}`.replace(/^ · /, '');
  }
  return 'tool result received';
}

export function recordLiveEditorToolCall(event: ToolCallEvent): void {
  const id = String(event.toolCallId ?? `${event.name}-${Date.now()}`);
  const source = event.context?.source ?? 'mcp';
  const existingIndex = entries.findIndex((entry) => entry.id === id);

  if (event.type === 'started') {
    const nextEntry: LiveEditorTraceEntry = {
      id,
      name: event.name,
      source,
      status: 'running',
      startedAt: event.timestamp,
    };
    entries = trimEntries(
      existingIndex >= 0
        ? entries.map((entry, index) =>
            index === existingIndex ? nextEntry : entry
          )
        : [nextEntry, ...entries]
    );
  } else {
    const nextEntry: LiveEditorTraceEntry = {
      id,
      name: event.name,
      source,
      status: event.type === 'failed' ? 'failed' : 'completed',
      startedAt: event.timestamp - event.durationMs,
      durationMs: event.durationMs,
      summary: resultSummary(event),
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

export const liveEditorTraceStore = {
  getSnapshot: (): LiveEditorTraceEntry[] => entries,
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
