import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const rootDirectory = path.resolve(import.meta.dirname, '..');
const tracePath = path.join(rootDirectory, 'example/src/lib/tool-call-trace.ts');
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
const toolProtocolModuleUrl = new URL(
  '../packages/tool-protocol/dist/index.js',
  import.meta.url
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

const provenance = (state, usedOutputBytes, elapsedMs) => ({
  schemaVersion: 'context-action-tool-execution-provenance.v1',
  phase: 'tool-call',
  ownerId: 'example-trace-verifier',
  state,
  usedOutputBytes,
  elapsedMs,
});

const request = {
  id: 'example-trace-call',
  method: 'tools/call',
  params: {
    name: 'editor.saveFile',
    arguments: { path: 'src/App.tsx', source: 'must not be retained' },
  },
};

const store = trace.createToolCallTraceStore();
const timestamp = Date.now();
store.record({
  type: 'started',
  toolCallId: request.id,
  name: request.params.name,
  request,
  context: { source: 'model', mode: 'agent', sessionId: 'example-session' },
  timestamp,
  provenance: provenance('pending', 0, 0),
});
store.record({
  type: 'completed',
  toolCallId: request.id,
  name: request.params.name,
  request,
  context: { source: 'model', mode: 'agent', sessionId: 'example-session' },
  timestamp: timestamp + 5,
  durationMs: 5,
  result: {
    isError: false,
    content: [{ type: 'text', text: 'must not be retained' }],
  },
  provenance: provenance('completed', 5, 5),
});

const [entry] = store.getSnapshot();
expect(entry?.status === 'completed', 'Example trace must resolve the lifecycle.');
expect(
  entry?.provenance?.ownerId === 'example-trace-verifier' &&
    entry.provenance.usedOutputBytes === 5,
  'Example trace must preserve additive execution provenance.'
);
expect(
  entry && !('request' in entry) && !('result' in entry),
  'Example trace must remain metadata-only and omit request/result payloads.'
);

const agent = store.startAgentTrace('model', 'example-session');
const longSummary = `provider response ${'source-token '.repeat(200)}`;
store.finishAgentTrace(agent, 'completed', longSummary);
const agentEntry = store
  .getSnapshot()
  .find((candidate) => candidate.id === agent.id);
expect(
  agentEntry?.summary !== longSummary &&
    (agentEntry?.summary?.length ?? Number.POSITIVE_INFINITY) < 200,
  'Agent summaries must use the shared bounded observability policy.'
);

const staleStore = trace.createToolCallTraceStore();
staleStore.record({
  type: 'started',
  toolCallId: 'stale-call',
  name: 'editor.getStatus',
  request,
  context: { source: 'local', mode: 'direct', sessionId: 'stale-session' },
  timestamp: timestamp - 16 * 60 * 1000,
  provenance: provenance('pending', 0, 0),
});
expect(
  staleStore.getSnapshot().length === 0,
  'Trace entries outside the shared retention window must be dropped.'
);

console.log('Verified example tool trace provenance and no-raw-payload projection.');
