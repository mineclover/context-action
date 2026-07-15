import type { ToolCallEvent } from '@context-action/react';

export type ToolTraceEntry = {
  id: string;
  kind: 'discovery' | 'call';
  name: string;
  source: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: number;
  durationMs?: number;
  toolCount?: number;
  summary?: string;
};

const MAX_TRACE_ENTRIES = 24;
let sequence = 0;
let entries: ToolTraceEntry[] = [];
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

function trimEntries(nextEntries: ToolTraceEntry[]): ToolTraceEntry[] {
  return nextEntries.slice(0, MAX_TRACE_ENTRIES);
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
  if (typeof value.path === 'string') {
    const replacementSuffix =
      typeof value.replacements === 'number'
        ? ` · ${value.replacements} replacements`
        : '';
    return `${value.path}${replacementSuffix}${revision}`;
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

export function recordToolList(toolCount: number, source = 'local'): void {
  entries = trimEntries([
    {
      id: `list-${Date.now()}-${sequence++}`,
      kind: 'discovery',
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
  const id = String(event.toolCallId ?? `${event.name}-${sequence++}`);
  const source = event.context?.source ?? 'mcp';
  const existingIndex = entries.findIndex(
    (entry) => entry.kind === 'call' && entry.id === id
  );

  if (event.type === 'started') {
    const nextEntry: ToolTraceEntry = {
      id,
      kind: 'call',
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
    const nextEntry: ToolTraceEntry = {
      id,
      kind: 'call',
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
