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
assert.equal(typeof scope.toolApproval, 'function');

// Generation-level approval is the AI SDK v7 contract. Calling the adapter's
// returned policy directly protects the `{ toolCall: { toolName, input } }`
// shape passed to generateText/streamText.
assert.equal(
  await scope.toolApproval({
    toolCall: { toolName: 'remove', input: { id: 'asset-1' } },
  }),
  'user-approval',
);

const result = await tool.execute(
  { id: 'asset-1' },
  { toolCallId: 'call-1' },
);
assert.deepEqual(result, { removed: 'asset-1' });
assert.deepEqual(calls, [{ id: 'call-1', name: 'remove', arguments: { id: 'asset-1' } }]);

console.log('AI SDK runtime integration passed');
