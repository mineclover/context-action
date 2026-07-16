import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

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
const trace = await import(
  'data:text/javascript;base64,' + Buffer.from(outputText).toString('base64')
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

function started(toolCallId, requestValue, sessionId, timestamp) {
  return {
    type: 'started',
    ...(toolCallId === undefined ? {} : { toolCallId }),
    name: requestValue.params.name,
    request: requestValue,
    context: { source: 'model', sessionId },
    timestamp,
  };
}

function completed(toolCallId, requestValue, sessionId, timestamp) {
  return {
    type: 'completed',
    ...(toolCallId === undefined ? {} : { toolCallId }),
    name: requestValue.params.name,
    request: requestValue,
    context: { source: 'model', sessionId },
    timestamp,
    durationMs: 4,
    result: {
      isError: false,
      structuredContent: { revision: timestamp },
      content: [{ type: 'text', text: 'ok' }],
    },
  };
}

function failed(toolCallId, requestValue, sessionId, timestamp) {
  return {
    type: 'failed',
    toolCallId,
    name: requestValue.params.name,
    request: requestValue,
    context: { source: 'model', sessionId },
    timestamp,
    durationMs: 3,
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

const firstRequest = request('call_0');
trace.recordToolCall(started('call_0', firstRequest, 'session-1', 10));
trace.recordToolCall(completed('call_0', firstRequest, 'session-1', 14));

// Providers are allowed to reuse a short call id in a later model turn.
const reusedIdRequest = request('call_0', 'workspace.listFiles');
trace.recordToolCall(
  started('call_0', reusedIdRequest, 'session-1', 20)
);
trace.recordToolCall(
  completed('call_0', reusedIdRequest, 'session-1', 24)
);

// Canonical tools/call permits an omitted request id; the request object still
// provides a stable lifecycle correlation inside the ToolContext observer.
const anonymousRequest = request(undefined, 'preview.getStatus');
trace.recordToolCall(started(undefined, anonymousRequest, 'session-2', 30));
trace.recordToolCall(
  completed(undefined, anonymousRequest, 'session-2', 35)
);

const failedRequest = request('call_failed', 'workspace.applyPatch');
trace.recordToolCall(
  started('call_failed', failedRequest, 'session-3', 40)
);
trace.recordToolCall(
  failed('call_failed', failedRequest, 'session-3', 43)
);

const calls = trace
  .toolTraceStore.getSnapshot()
  .filter((entry) => entry.kind === 'call');
expect(calls.length === 4, 'Trace should retain all four tool calls.');
expect(
  calls.every((entry) => entry.method === 'tools/call'),
  'Tool call trace entries must expose the canonical tools/call method.'
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

console.log('Verified standalone tool trace correlation contracts.');
