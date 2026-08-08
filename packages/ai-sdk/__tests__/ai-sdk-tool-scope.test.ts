import {
  AISDKToolExecutionError,
  createAISDKTools,
  createAISDKToolScope,
} from '../src/index';
import type {
  ModelToolCall,
  ToolCallOptions,
  ToolCallResult,
  ToolDefinition,
  ToolManagementInterface,
} from '@context-action/tool-protocol';

const searchDefinition: ToolDefinition = {
  name: 'search',
  title: 'Search catalog',
  description: 'Find catalog entries by query.',
  inputSchema: {
    type: 'object',
    properties: { query: { type: 'string' } },
    required: ['query'],
    additionalProperties: false,
  },
  outputSchema: {
    type: 'object',
    properties: { count: { type: 'number' } },
    required: ['count'],
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true },
};

const removeDefinition: ToolDefinition = {
  name: 'remove',
  description: 'Remove a catalog entry.',
  inputSchema: {
    type: 'object',
    properties: { id: { type: 'string' } },
    required: ['id'],
    additionalProperties: false,
  },
  annotations: { destructiveHint: true },
};

function createManager(
  execute: (
    call: ModelToolCall,
    options?: ToolCallOptions,
  ) => Promise<ToolCallResult> = async () => ({
    content: [{ type: 'json', json: { count: 1 } }],
    structuredContent: { count: 1 },
  }),
): ToolManagementInterface {
  const definitions = new Map([
    [searchDefinition.name, searchDefinition],
    [removeDefinition.name, removeDefinition],
  ]);
  return {
    listTools: () => ({ tools: [...definitions.values()] }),
    getToolDefinition: (name) => definitions.get(name),
    hasTool: (name) => definitions.has(name),
    callTool: async () => ({ content: [] }),
    executeModelToolCall: execute,
  };
}

function executeTool(scope: ReturnType<typeof createAISDKToolScope>, name: string, input: unknown) {
  const tool = scope.tools[name] as unknown as {
    execute: (input: unknown, options: { toolCallId: string; abortSignal?: AbortSignal }) => Promise<unknown>;
  };
  return tool.execute(input, { toolCallId: 'call-1' });
}

describe('createAISDKToolScope', () => {
  it('constrains advertised tools to the explicit ContextScope-derived names', () => {
    const scope = createAISDKToolScope(createManager(), {
      sessionId: 'session-1',
      toolNames: ['search'],
    });

    expect(scope.activeTools).toEqual(['search']);
    expect(Object.keys(scope.tools)).toEqual(['search']);
    expect((scope.tools.search as { outputSchema?: unknown }).outputSchema)
      .toBeUndefined();
  });

  it('rejects unavailable tools before a model generation begins', () => {
    expect(() => createAISDKToolScope(createManager(), {
      sessionId: 'session-1',
      toolNames: ['missing'],
    })).toThrow('unavailable tool');
  });

  it('requires an explicit tool scope for every generation', () => {
    expect(() => createAISDKToolScope(createManager(), {
      sessionId: 'session-1',
    } as unknown as Parameters<typeof createAISDKToolScope>[1]))
      .toThrow('toolNames must be an array');
  });

  it('rejects an empty session identity before a model generation begins', () => {
    expect(() => createAISDKToolScope(createManager(), {
      sessionId: '   ',
      toolNames: ['search'],
    })).toThrow('sessionId');
  });

  it('rejects control characters in a session identity before a model generation begins', () => {
    expect(() => createAISDKToolScope(createManager(), {
      sessionId: 'session\n1',
      toolNames: ['search'],
    })).toThrow('sessionId');
  });

  it('rejects a registry definition that does not match the scoped name', () => {
    const manager = createManager();
    const getToolDefinition = manager.getToolDefinition;
    manager.getToolDefinition = (name) => name === 'search'
      ? removeDefinition
      : getToolDefinition(name);

    expect(() => createAISDKToolScope(manager, {
      sessionId: 'session-1',
      toolNames: ['search'],
    })).toThrow('mismatched definition');
  });

  it('forwards provider call identity, abort signal, scope context, and default replay key', async () => {
    const execute = jest.fn(async () => ({
      content: [{ type: 'json' as const, json: { count: 1 } }],
      structuredContent: { count: 1 },
    }));
    const controller = new AbortController();
    const scope = createAISDKToolScope(createManager(execute), {
      sessionId: 'session-1',
      toolNames: ['search'],
      context: { metadata: { requestId: 'request-1' } },
      callOptions: { timeout: 500, maxOutputBytes: 2048 },
    });
    const tool = scope.tools.search as unknown as {
      execute: (input: unknown, options: { toolCallId: string; abortSignal?: AbortSignal }) => Promise<unknown>;
    };

    await expect(tool.execute({ query: 'camera' }, {
      toolCallId: 'provider-call-1',
      abortSignal: controller.signal,
    })).resolves.toEqual({ count: 1 });

    expect(execute).toHaveBeenCalledWith(
      {
        id: 'provider-call-1',
        name: 'search',
        arguments: { query: 'camera' },
      },
      expect.objectContaining({
        signal: controller.signal,
        idempotencyKey: 'provider-call-1',
        timeout: 500,
        maxOutputBytes: 2048,
        context: {
          metadata: { requestId: 'request-1' },
          source: 'model',
          mode: 'agent',
          sessionId: 'session-1',
        },
      }),
    );
  });

  it('allows a domain operation identity to replace the default provider call key', async () => {
    const execute = jest.fn(async (
      _call: ModelToolCall,
      _options?: ToolCallOptions,
    ) => ({ content: [] }));
    const scope = createAISDKToolScope(createManager(execute), {
      sessionId: 'session-1',
      toolNames: ['remove'],
      getIdempotencyKey: ({ toolName, input }) => `${toolName}:${(input as { id: string }).id}`,
    });

    await executeTool(scope, 'remove', { id: 'asset-1' });
    expect(execute.mock.calls[0]?.[1]).toMatchObject({
      idempotencyKey: 'remove:asset-1',
    });
  });

  it('allows an explicit undefined idempotency key to disable replay protection', async () => {
    const execute = jest.fn(async (
      _call: ModelToolCall,
      _options?: ToolCallOptions,
    ) => ({ content: [] }));
    const scope = createAISDKToolScope(createManager(execute), {
      sessionId: 'session-1',
      toolNames: ['remove'],
      getIdempotencyKey: () => undefined,
    });

    await executeTool(scope, 'remove', { id: 'asset-1' });
    expect(execute.mock.calls[0]?.[1]).toMatchObject({
      idempotencyKey: undefined,
    });
  });

  it('retains an output schema when errors are configured to throw', () => {
    const scope = createAISDKToolScope(createManager(), {
      sessionId: 'session-1',
      toolNames: ['search'],
      errorMode: 'throw',
    });

    expect((scope.tools.search as { outputSchema?: unknown }).outputSchema)
      .toEqual(searchDefinition.outputSchema);
  });

  it('rejects an invalid provider tool call identity before execution', async () => {
    const execute = jest.fn(async () => ({ content: [] }));
    const scope = createAISDKToolScope(createManager(execute), {
      sessionId: 'session-1',
      toolNames: ['search'],
    });
    const tool = scope.tools.search as unknown as {
      execute: (input: unknown, options: { toolCallId: string }) => Promise<unknown>;
    };

    await expect(tool.execute({ query: 'camera' }, { toolCallId: 'bad\ncall' }))
      .rejects.toThrow('toolCallId');
    expect(execute).not.toHaveBeenCalled();
  });

  it('preserves canonical failures as structured model results by default', async () => {
    const scope = createAISDKToolScope(createManager(async () => ({
      content: [{ type: 'text', text: 'permission denied' }],
      isError: true,
      error: { code: 'TOOL_POLICY_DENIED', message: 'permission denied' },
    })), {
      sessionId: 'session-1',
      toolNames: ['remove'],
    });

    await expect(executeTool(scope, 'remove', { id: 'asset-1' })).resolves.toEqual({
      tool: 'remove',
      status: 'error',
      error: { code: 'TOOL_POLICY_DENIED', message: 'permission denied' },
      message: 'permission denied',
    });
  });

  it('can expose canonical failures as AI SDK tool errors', async () => {
    const scope = createAISDKToolScope(createManager(async () => ({
      content: [{ type: 'text', text: 'permission denied' }],
      isError: true,
      error: { code: 'TOOL_POLICY_DENIED', message: 'permission denied' },
    })), {
      sessionId: 'session-1',
      toolNames: ['remove'],
      errorMode: 'throw',
    });

    await expect(executeTool(scope, 'remove', { id: 'asset-1' }))
      .rejects.toBeInstanceOf(AISDKToolExecutionError);
  });

  it('maps adapter approval policy to the AI SDK generation-level approval gate', async () => {
    const scope = createAISDKToolScope(createManager(), {
      sessionId: 'session-1',
      toolNames: ['remove'],
      needsApproval: ({ definition, input }) =>
        definition.annotations?.destructiveHint === true &&
        (input as { id: string }).id === 'asset-1',
    });
    expect(scope.toolApproval).toBeDefined();
    await expect(scope.toolApproval?.({
      toolCall: { toolName: 'remove', input: { id: 'asset-1' } },
    })).resolves.toBe('user-approval');
    await expect(scope.toolApproval?.({
      toolCall: { toolName: 'remove', input: { id: 'asset-2' } },
    })).resolves.toBe('not-applicable');
  });

  it('rejects approval policies passed to the tools-only helper', () => {
    expect(() => createAISDKTools(createManager(), {
      sessionId: 'session-1',
      toolNames: ['remove'],
      needsApproval: true,
      // JavaScript callers can still provide this field, so cover the runtime guard.
    } as unknown as Parameters<typeof createAISDKTools>[1]))
      .toThrow('createAISDKTools cannot preserve toolApproval');
  });
});
