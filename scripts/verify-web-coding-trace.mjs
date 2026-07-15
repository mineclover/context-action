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

const calls = trace
  .toolTraceStore.getSnapshot()
  .filter((entry) => entry.kind === 'call');
expect(calls.length === 3, 'Trace should retain all three tool calls.');
expect(
  new Set(calls.map((entry) => entry.id)).size === calls.length,
  'Internal trace IDs must remain unique when provider IDs are reused.'
);
expect(
  calls.every((entry) => entry.status === 'completed'),
  'Every started call must resolve to its matching completed event.'
);
expect(
  calls.filter((entry) => entry.toolCallId === 'call_0').length === 2,
  'Protocol toolCallId should remain visible on both reused provider calls.'
);
expect(
  calls.some((entry) => entry.toolCallId === undefined),
  'Trace should preserve anonymous canonical calls without inventing a protocol ID.'
);

console.log('Verified standalone tool trace correlation contracts.');
