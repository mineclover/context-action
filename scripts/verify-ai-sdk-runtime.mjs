import assert from 'node:assert/strict';
import { createAISDKToolScope } from '../packages/ai-sdk/dist/index.js';

const definition = {
  name: 'remove',
  description: 'Remove an item.',
  inputSchema: {
    type: 'object',
    properties: { id: { type: 'string' } },
    required: ['id'],
    additionalProperties: false,
  },
};

const calls = [];
const manager = {
  listTools: () => ({ tools: [definition] }),
  getToolDefinition: name => (name === definition.name ? definition : undefined),
  hasTool: name => name === definition.name,
  callTool: async () => ({ content: [] }),
  executeModelToolCall: async call => {
    calls.push(call);
    return {
      content: [{ type: 'json', json: { removed: call.arguments.id } }],
      structuredContent: { removed: call.arguments.id },
    };
  },
};

const scope = createAISDKToolScope(manager, {
  sessionId: 'integration-session',
  toolNames: ['remove'],
  needsApproval: ({ input, toolName }) =>
    toolName === 'remove' && input.id === 'asset-1',
});

const tool = scope.tools.remove;
assert.equal(typeof tool.needsApproval, 'function');

// AI SDK v7 invokes needsApproval(input, context) with the raw validated input.
// Calling the real dynamicTool output here protects the adapter from drifting
// toward the `{ args }` callback shape used by other tool APIs.
assert.equal(
  await tool.needsApproval({ id: 'asset-1' }, { toolCallId: 'call-1' }),
  true,
);

const result = await tool.execute(
  { id: 'asset-1' },
  { toolCallId: 'call-1' },
);
assert.deepEqual(result, { removed: 'asset-1' });
assert.deepEqual(calls, [{ id: 'call-1', name: 'remove', arguments: { id: 'asset-1' } }]);

console.log('AI SDK runtime integration passed');
