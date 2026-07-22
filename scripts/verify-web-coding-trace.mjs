import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const rootDirectory = path.resolve(import.meta.dirname, '..');
const tracePath = path.join(
  rootDirectory,
  'demos/bolt-style-editor/src/tool-trace.ts'
);
const require = createRequire(import.meta.url);
const typescript = require('typescript');
const source = await readFile(tracePath, 'utf8');
const { outputText } = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
  fileName: tracePath,
});
const toolProtocolModuleUrl = pathToFileURL(
  path.join(rootDirectory, 'packages/tool-protocol/dist/index.js')
).href;
const trace = await import(
  'data:text/javascript;base64,' +
    Buffer.from(
      outputText.replaceAll(
        "from '@context-action/tool-protocol'",
        `from '${toolProtocolModuleUrl}'`
      )
    ).toString('base64')
);

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

function request(id, name = 'workspace.getStatus') {
  return {
    ...(id === undefined ? {} : { id }),
    method: 'tools/call',
    params: { name, arguments: {} },
  };
}

function provenance(state, usedOutputBytes, elapsedMs) {
  return {
    schemaVersion: 'context-action-tool-execution-provenance.v1',
    phase: 'tool-call',
    ownerId: 'trace-verifier',
    state,
    usedOutputBytes,
    elapsedMs,
  };
}

function started(
  toolCallId,
  requestValue,
  sessionId,
  timestamp,
  mode = 'agent'
) {
  return {
    type: 'started',
    ...(toolCallId === undefined ? {} : { toolCallId }),
    name: requestValue.params.name,
    request: requestValue,
    context: { source: mode === 'direct' ? 'local' : 'model', mode, sessionId },
    timestamp,
    provenance: provenance('pending', 0, 0),
  };
}

function completed(
  toolCallId,
  requestValue,
  sessionId,
  timestamp,
  mode = 'agent'
) {
  return {
    type: 'completed',
    ...(toolCallId === undefined ? {} : { toolCallId }),
    name: requestValue.params.name,
    request: requestValue,
    context: { source: mode === 'direct' ? 'local' : 'model', mode, sessionId },
    timestamp,
    durationMs: 4,
    provenance: provenance('completed', 18, 4),
    result: {
      isError: false,
      structuredContent: { revision: timestamp },
      content: [{ type: 'text', text: 'ok' }],
    },
  };
}

function failed(
  toolCallId,
  requestValue,
  sessionId,
  timestamp,
  mode = 'agent'
) {
  return {
    type: 'failed',
    toolCallId,
    name: requestValue.params.name,
    request: requestValue,
    context: { source: mode === 'direct' ? 'local' : 'model', mode, sessionId },
    timestamp,
    durationMs: 3,
    provenance: provenance('failed', 0, 3),
    result: {
      isError: true,
      error: {
        code: 'WORKSPACE_REVISION_CONFLICT',
        message: 'Re-read before retrying.',
        retryable: true,
      },
      content: [{ type: 'text', text: 'Re-read before retrying.' }],
    },
  };
}

trace.recordToolList(23, 'local', 'session-discovery');
const timestampBase = Date.now();

const firstRequest = request('call_0');
trace.recordToolCall(started('call_0', firstRequest, 'session-1', timestampBase + 10));
trace.recordToolCall(completed('call_0', firstRequest, 'session-1', timestampBase + 14));

// Providers are allowed to reuse a short call id in a later model turn.
const reusedIdRequest = request('call_0', 'workspace.listFiles');
trace.recordToolCall(
  started('call_0', reusedIdRequest, 'session-1', timestampBase + 20)
);
trace.recordToolCall(
  completed('call_0', reusedIdRequest, 'session-1', timestampBase + 24)
);

// Canonical tools/call permits an omitted request id; the request object still
// provides a stable lifecycle correlation inside the ToolContext observer.
const anonymousRequest = request(undefined, 'preview.getStatus');
trace.recordToolCall(started(undefined, anonymousRequest, 'session-2', timestampBase + 30));
trace.recordToolCall(
  completed(undefined, anonymousRequest, 'session-2', timestampBase + 35)
);

const failedRequest = request('call_failed', 'workspace.applyPatch');
trace.recordToolCall(
  started('call_failed', failedRequest, 'session-3', timestampBase + 40)
);
trace.recordToolCall(
  failed('call_failed', failedRequest, 'session-3', timestampBase + 43)
);

const directRequest = request('call_direct', 'workspace.getStatus');
trace.recordToolCall(
  started('call_direct', directRequest, 'session-direct', timestampBase + 50, 'direct')
);
trace.recordToolCall(
  completed('call_direct', directRequest, 'session-direct', timestampBase + 54, 'direct')
);

const calls = trace
  .toolTraceStore.getSnapshot()
  .filter((entry) => entry.kind === 'call');
expect(calls.length === 5, 'Trace should retain all five tool calls.');
expect(
  calls.every((entry) => entry.method === 'tools/call'),
  'Tool call trace entries must expose the canonical tools/call method.'
);
expect(
  calls.filter((entry) => entry.mode === 'agent').length === 4,
  'Agent tool calls must preserve the canonical agent execution mode.'
);
const directEntry = calls.find(
  (entry) => entry.toolCallId === 'call_direct'
);
expect(
  directEntry?.mode === 'direct' && directEntry.source === 'local',
  'Direct tool calls must preserve the canonical direct execution mode.'
);
const discoveryEntry = trace
  .toolTraceStore.getSnapshot()
  .find((entry) => entry.kind === 'discovery');
expect(
  discoveryEntry?.method === 'tools/list',
  'Discovery trace entries must expose the canonical tools/list method.'
);
expect(
  new Set(calls.map((entry) => entry.id)).size === calls.length,
  'Internal trace IDs must remain unique when provider IDs are reused.'
);
expect(
  calls.every((entry) => entry.status === 'completed' || entry.status === 'failed'),
  'Every started call must resolve to a completed or failed lifecycle event.'
);
expect(
  calls.every(
    (entry) =>
      entry.provenance?.schemaVersion ===
        'context-action-tool-execution-provenance.v1' &&
      entry.provenance.ownerId === 'trace-verifier'
  ),
  'Trace projections must preserve validated execution provenance.'
);
expect(
  calls.every((entry) => !('request' in entry) && !('result' in entry)),
  'Trace projections must not retain canonical request or result payloads.'
);
expect(
  calls.filter((entry) => entry.toolCallId === 'call_0').length === 2,
  'Protocol toolCallId should remain visible on both reused provider calls.'
);
expect(
  calls.some((entry) => entry.toolCallId === undefined),
  'Trace should preserve anonymous canonical calls without inventing a protocol ID.'
);
const failedEntry = calls.find((entry) => entry.toolCallId === 'call_failed');
expect(
  failedEntry?.status === 'failed' && failedEntry.retryable === true,
  'Failed trace entries must preserve retryability for recovery UI.'
);

const sensitiveRequest = request('call_sensitive', 'workspace.applyPatch');
sensitiveRequest.params.arguments = { source: 'raw source must not export' };
trace.recordToolCall(
  started('call_sensitive', sensitiveRequest, 'session-sensitive', timestampBase + 60)
);
const sensitiveCompleted = completed(
  'call_sensitive',
  sensitiveRequest,
  'session-sensitive',
  timestampBase + 64
);
sensitiveCompleted.result.content = [
  { type: 'text', text: 'raw result must not export' },
];
trace.recordToolCall(
  sensitiveCompleted
);
const exportedEntries = trace.projectToolTraceEntriesForExport(
  trace.toolTraceStore.getSnapshot()
);
expect(
  exportedEntries.every(
    (entry) => !('argumentsText' in entry) && !('resultText' in entry)
  ),
  'Exported trace entries must omit request arguments and result content.'
);
expect(
  !trace
    .serializeToolTraceEntriesForExport(trace.toolTraceStore.getSnapshot())
    .includes('raw source must not export') &&
    !trace
      .serializeToolTraceEntriesForExport(trace.toolTraceStore.getSnapshot())
      .includes('raw result must not export'),
  'Serialized trace exports must not contain raw request or result payloads.'
);
const serializedExport = trace.serializeToolTraceEntriesForExport(
  trace.toolTraceStore.getSnapshot()
);
expect(
  new TextEncoder().encode(serializedExport).byteLength <= 8 * 1024,
  'Serialized trace exports must respect the bounded telemetry byte policy.'
);

console.log('Verified standalone tool trace correlation contracts.');
