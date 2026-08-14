import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const rootDirectory = path.resolve(import.meta.dirname, '..');
const approvalPath = path.join(
  rootDirectory,
  'example/src/lib/live-editor-tool-approval.ts'
);
const require = createRequire(import.meta.url);
const typescript = require('typescript');
const source = await readFile(approvalPath, 'utf8');
const { outputText } = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
  fileName: approvalPath,
});
const toolProtocolModuleUrl = pathToFileURL(
  path.join(rootDirectory, 'packages/tool-protocol/dist/index.js')
).href;
const approval = await import(
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

const request = {
  id: 'live-editor-save-1',
  method: 'tools/call',
  params: {
    name: 'editor.saveFile',
    arguments: {
      path: 'src/App.tsx',
      source: 'secret source must not enter the approval preview',
    },
  },
};
const definition = {
  name: request.params.name,
  description: 'Write one text file to the opened local folder.',
};

const allowed = approval.requestLiveEditorToolApproval({
  request,
  definition,
  context: {
    source: 'model',
    mode: 'agent',
    sessionId: 'live-editor-session',
  },
});
const pending = approval.liveEditorToolApprovalStore.getSnapshot();
expect(pending.length === 1, 'A model filesystem write should enter approval.');
expect(
  pending[0].method === 'tools/call' &&
    pending[0].toolCallId === 'live-editor-save-1' &&
    pending[0].id !== pending[0].toolCallId &&
    pending[0].name === 'editor.saveFile',
  'Approval must preserve the canonical save call while using a queue-lifetime ID.'
);
expect(
  pending[0].source === 'model' &&
    pending[0].mode === 'agent' &&
    pending[0].sessionId === 'live-editor-session',
  'Approval must preserve model source, execution mode, and session.'
);
expect(
  pending[0].safeArgumentPreview === 'path: src/App.tsx' &&
    !String(pending[0].safeArgumentPreview).includes('secret'),
  'Approval preview must show path but redact source content.'
);

approval.resolveLiveEditorToolApproval(pending[0].id, 'allow');
expect(
  (await allowed) === 'allow',
  'Explicit approval should release the pending filesystem write.'
);
expect(
  approval.liveEditorToolApprovalStore.getSnapshot().length === 0,
  'Resolved approval must leave no pending request.'
);

const controller = new AbortController();
const cancelled = approval.requestLiveEditorToolApproval({
  request: { ...request, id: 'live-editor-save-cancelled' },
  definition,
  context: { source: 'model', mode: 'agent' },
  signal: controller.signal,
});
controller.abort();
expect(
  (await cancelled) === 'deny',
  'Aborting a model filesystem write must deny the approval.'
);
expect(
  approval.liveEditorToolApprovalStore.getSnapshot().length === 0,
  'Cancelled approval must leave no pending request.'
);

const unmounted = approval.requestLiveEditorToolApproval({
  request: { ...request, id: 'live-editor-save-unmounted' },
  definition,
  context: { source: 'model', mode: 'agent' },
});
approval.denyAllLiveEditorToolApprovals();
expect(
  (await unmounted) === 'deny',
  'Unmount cleanup must deny every pending filesystem write.'
);
expect(
  approval.liveEditorToolApprovalStore.getSnapshot().length === 0,
  'Unmount cleanup must leave no pending request.'
);

console.log('Verified Live Code Editor filesystem approval lifecycle.');
