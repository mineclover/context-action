import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const rootDirectory = path.resolve(import.meta.dirname, '..');
const approvalPath = path.join(
  rootDirectory,
  'demos/bolt-style-editor/src/tool-approval.ts'
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
const coreModuleUrl = pathToFileURL(
  path.join(rootDirectory, 'packages/core/dist/index.js')
).href;
const approval = await import(
  'data:text/javascript;base64,' +
    Buffer.from(
      outputText.replaceAll(
        "from '@context-action/core'",
        `from '${coreModuleUrl}'`
      )
    ).toString('base64')
);

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

const request = {
  id: 'approval-call-1',
  method: 'tools/call',
  params: {
    name: 'workspace.deleteFile',
    arguments: {
      path: 'secret.txt',
      source: 'do not expose this file content',
    },
  },
};
const definition = {
  name: request.params.name,
  description: 'Delete a workspace file.',
};

const allowed = approval.requestToolApproval({
  request,
  definition,
  context: {
    source: 'model',
    mode: 'agent',
    sessionId: 'session-approval',
  },
});
const pending = approval.toolApprovalStore.getSnapshot();
expect(pending.length === 1, 'Approval request should enter the pending queue.');
expect(
  pending[0].method === 'tools/call' &&
    pending[0].toolCallId === 'approval-call-1',
  'Approval state must preserve the canonical method and toolCallId.'
);
expect(
  pending[0].sessionId === 'session-approval' && pending[0].mode === 'agent',
  'Approval state must preserve session and execution mode.'
);
expect(
  pending[0].safeArgumentPreview === 'path: secret.txt',
  'Approval preview must keep safe arguments and redact source content.'
);

approval.resolveToolApproval('approval-call-1', 'allow');
expect(
  (await allowed) === 'allow',
  'Resolving an approval should settle the policy promise.'
);
expect(
  approval.toolApprovalStore.getSnapshot().length === 0,
  'Resolved approvals must leave the pending queue.'
);

const controller = new AbortController();
const cancelled = approval.requestToolApproval({
  request: { ...request, id: 'approval-call-cancelled' },
  definition,
  context: {
    source: 'model',
    mode: 'agent',
    sessionId: 'session-cancelled',
  },
  signal: controller.signal,
});
expect(
  approval.toolApprovalStore.getSnapshot().length === 1,
  'A second approval should be independently queued.'
);
controller.abort();
expect(
  (await cancelled) === 'deny',
  'Aborting an approval must resolve it as a deny decision.'
);
expect(
  approval.toolApprovalStore.getSnapshot().length === 0,
  'Cancelled approvals must leave the pending queue.'
);

console.log('Verified standalone approval lifecycle contracts.');
