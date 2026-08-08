import {
  createWebMCPToolScope,
  type WebMCPRegistrationOptions,
  type WebMCPToolDefinition,
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
  description: 'Search the catalog.',
  inputSchema: {
    type: 'object',
    properties: { query: { type: 'string' } },
    required: ['query'],
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true },
};

const saveDefinition: ToolDefinition = {
  name: 'save',
  description: 'Save the catalog.',
  inputSchema: { type: 'object' },
};

function createManager(
  execute: (
    call: ModelToolCall,
    options?: ToolCallOptions,
  ) => Promise<ToolCallResult> = async () => ({
    content: [{ type: 'json', json: { count: 1 } }],
    structuredContent: { count: 1 },
  }),
  hasTool = (name: string) => name === searchDefinition.name || name === saveDefinition.name,
): ToolManagementInterface {
  return {
    listTools: () => ({ tools: [searchDefinition, saveDefinition] }),
    getToolDefinition: (name) => name === searchDefinition.name
      ? searchDefinition
      : name === saveDefinition.name ? saveDefinition : undefined,
    hasTool,
    callTool: async () => ({ content: [] }),
    executeModelToolCall: execute,
  };
}

describe('createWebMCPToolScope', () => {
  it('is inert when WebMCP is not available, so non-browser consumers remain safe', async () => {
    const scope = await createWebMCPToolScope(createManager(), {
      sessionId: 'page-session',
      toolNames: ['search'],
      document: {},
    });

    expect(scope).toMatchObject({ supported: false, activeTools: [] });
    expect(() => scope.dispose()).not.toThrow();
  });

  it('registers only the explicit canonical scope and forwards execution to the manager', async () => {
    const registered: Array<{ tool: WebMCPToolDefinition; options?: WebMCPRegistrationOptions }> = [];
    const executeModelToolCall = jest.fn(async () => ({
      content: [{ type: 'json' as const, json: { count: 2 } }],
      structuredContent: { count: 2 },
    }));
    const scope = await createWebMCPToolScope(createManager(executeModelToolCall), {
      sessionId: 'page-session',
      toolNames: ['search'],
      exposedTo: ['https://agent.example'],
      document: {
        modelContext: {
          registerTool: async (tool, options) => { registered.push({ tool, options }); },
        },
      },
    });

    expect(scope).toMatchObject({ supported: true, activeTools: ['search'] });
    expect(registered).toHaveLength(1);
    expect(registered[0]?.tool).toMatchObject({
      name: 'search',
      description: 'Search the catalog.',
      inputSchema: searchDefinition.inputSchema,
      annotations: { readOnlyHint: true },
    });
    expect(registered[0]?.options?.exposedTo).toEqual(['https://agent.example']);

    await expect(registered[0]!.tool.execute({ query: 'coffee' })).resolves.toEqual({ count: 2 });
    expect(executeModelToolCall).toHaveBeenCalledWith(expect.objectContaining({
      name: 'search',
      arguments: { query: 'coffee' },
    }), expect.objectContaining({
      context: expect.objectContaining({
        source: 'model',
        mode: 'agent',
        sessionId: 'page-session',
        metadata: { transport: 'webmcp' },
      }),
    }));
    scope.dispose();
  });

  it('returns canonical errors as structured WebMCP results', async () => {
    const registered: WebMCPToolDefinition[] = [];
    const scope = await createWebMCPToolScope(createManager(async () => ({
      content: [{ type: 'text', text: 'permission denied' }],
      isError: true,
      error: { code: 'TOOL_POLICY_DENIED', message: 'permission denied' },
    })), {
      sessionId: 'page-session',
      toolNames: ['search'],
      document: {
        modelContext: { registerTool: async (tool) => { registered.push(tool); } },
      },
    });

    await expect(registered[0]!.execute({ query: 'coffee' })).resolves.toEqual({
      isError: true,
      content: [{ type: 'text', text: 'permission denied' }],
      error: { code: 'TOOL_POLICY_DENIED', message: 'permission denied' },
    });
    scope.dispose();
  });

  it('unregisters registrations through its signal and validates exposed origins', async () => {
    let registrationSignal: AbortSignal | undefined;
    const scope = await createWebMCPToolScope(createManager(), {
      sessionId: 'page-session',
      toolNames: ['search'],
      document: {
        modelContext: {
          registerTool: async (_tool, options) => { registrationSignal = options?.signal; },
        },
      },
    });
    expect(registrationSignal?.aborted).toBe(false);
    scope.dispose();
    expect(registrationSignal?.aborted).toBe(true);

    await expect(createWebMCPToolScope(createManager(), {
      sessionId: 'page-session',
      toolNames: ['search'],
      exposedTo: ['http://insecure.example'],
      document: { modelContext: { registerTool: async () => {} } },
    })).rejects.toThrow('requires a secure origin');
  });

  it('rejects a missing tool before registering any browser capability', async () => {
    const registerTool = jest.fn(async () => {});
    await expect(createWebMCPToolScope(createManager(), {
      sessionId: 'page-session',
      toolNames: ['missing'],
      document: { modelContext: { registerTool } },
    })).rejects.toThrow('unavailable tool');
    expect(registerTool).not.toHaveBeenCalled();
  });

  it('uses a unique scope call ID without enabling idempotency by default', async () => {
    const calls: Array<{ id: string; options?: ToolCallOptions }> = [];
    const registered: WebMCPToolDefinition[] = [];
    const document = {
      modelContext: {
        registerTool: async (tool: WebMCPToolDefinition) => { registered.push(tool); },
      },
    };
    const manager = createManager(async (call, options) => {
      calls.push({ id: call.id, options });
      return { content: [] };
    });

    const first = await createWebMCPToolScope(manager, {
      sessionId: 'same-session', toolNames: ['search'], document,
    });
    const second = await createWebMCPToolScope(manager, {
      sessionId: 'same-session', toolNames: ['search'], document,
    });
    await registered[0]!.execute({ query: 'first' });
    await registered[1]!.execute({ query: 'different-input' });

    expect(calls.map(call => call.id)).toHaveLength(2);
    expect(calls[0]?.id).not.toBe(calls[1]?.id);
    expect(calls.map(call => call.options?.idempotencyKey)).toEqual([undefined, undefined]);
    first.dispose();
    second.dispose();
  });

  it('accepts an explicit domain idempotency key and forwards a cancellable hook', async () => {
    const registered: WebMCPToolDefinition[] = [];
    const beforeExecute = jest.fn();
    const executeModelToolCall = jest.fn(async () => ({ content: [] }));
    const scope = await createWebMCPToolScope(createManager(executeModelToolCall), {
      sessionId: 'page-session',
      toolNames: ['search'],
      getIdempotencyKey: () => 'order:42',
      beforeExecute,
      document: { modelContext: { registerTool: async tool => { registered.push(tool); } } },
    });
    await registered[0]!.execute({ query: 'coffee' });

    expect(beforeExecute).toHaveBeenCalledWith(expect.objectContaining({
      toolName: 'search', sessionId: 'page-session',
      signal: expect.any(AbortSignal),
    }));
    expect(executeModelToolCall).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
      idempotencyKey: 'order:42',
    }));
    scope.dispose();
  });

  it('stops registering further tools when its signal aborts while registration is pending', async () => {
    const controller = new AbortController();
    let releaseFirst: (() => void) | undefined;
    const firstRegistration = new Promise<void>(resolve => { releaseFirst = resolve; });
    const registerTool = jest.fn(async () => {
      await firstRegistration;
    });
    const pendingScope = createWebMCPToolScope(createManager(), {
      sessionId: 'page-session',
      toolNames: ['search', 'save'],
      signal: controller.signal,
      document: { modelContext: { registerTool } },
    });

    await Promise.resolve();
    controller.abort('page removed');
    releaseFirst?.();
    const scope = await pendingScope;

    expect(registerTool).toHaveBeenCalledTimes(1);
    expect(scope.activeTools).toEqual([]);
  });

  it('does not expose definitions that the manager marks unavailable', async () => {
    const registerTool = jest.fn(async () => {});
    await expect(createWebMCPToolScope(createManager(undefined, () => false), {
      sessionId: 'page-session',
      toolNames: ['search'],
      document: { modelContext: { registerTool } },
    })).rejects.toThrow('unavailable tool');
    expect(registerTool).not.toHaveBeenCalled();
  });

  it('maps the current Draft title and annotations without leaking canonical-only hints', async () => {
    const registered: WebMCPToolDefinition[] = [];
    const definition: ToolDefinition = {
      ...searchDefinition,
      title: 'Catalog search',
      annotations: {
        readOnlyHint: true,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
        untrustedContentHint: true,
      },
    };
    const manager = createManager();
    manager.getToolDefinition = () => definition;
    const scope = await createWebMCPToolScope(manager, {
      sessionId: 'page-session', toolNames: ['search'],
      document: { modelContext: { registerTool: async tool => { registered.push(tool); } } },
    });
    expect(registered[0]).toMatchObject({
      title: 'Catalog search',
      annotations: { readOnlyHint: true, untrustedContentHint: true },
    });
    scope.dispose();
  });

  it('preflights invalid definitions before the first browser registration', async () => {
    const registerTool = jest.fn(async () => {});
    const invalid: ToolDefinition = { ...searchDefinition, name: 'invalid tool', description: '' };
    const manager = createManager();
    manager.getToolDefinition = () => invalid;
    manager.hasTool = () => true;
    await expect(createWebMCPToolScope(manager, {
      sessionId: 'page-session', toolNames: ['invalid tool'],
      document: { modelContext: { registerTool } },
    })).rejects.toThrow('tool name');
    expect(registerTool).not.toHaveBeenCalled();
  });

  it('rejects an empty description before the first browser registration', async () => {
    const registerTool = jest.fn(async () => {});
    const invalid: ToolDefinition = { ...searchDefinition, description: '' };
    const manager = createManager();
    manager.getToolDefinition = () => invalid;
    await expect(createWebMCPToolScope(manager, {
      sessionId: 'page-session', toolNames: ['search'],
      document: { modelContext: { registerTool } },
    })).rejects.toThrow('non-empty description');
    expect(registerTool).not.toHaveBeenCalled();
  });

  it('supports explicit structured-result and rejected-promise error modes', async () => {
    const registered: WebMCPToolDefinition[] = [];
    const manager = createManager(async () => ({
      content: [{ type: 'text', text: 'denied' }], isError: true,
      error: { code: 'DENIED', message: 'denied' },
    }));
    const scope = await createWebMCPToolScope(manager, {
      sessionId: 'page-session', toolNames: ['search'], errorMode: 'throw',
      document: { modelContext: { registerTool: async tool => { registered.push(tool); } } },
    });
    await expect(registered[0]!.execute({ query: 'coffee' })).rejects.toThrow('denied');
    scope.dispose();
  });

  it('cancels beforeExecute when a scope is disposed', async () => {
    const registered: WebMCPToolDefinition[] = [];
    let invocationSignal: AbortSignal | undefined;
    let release: (() => void) | undefined;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const scope = await createWebMCPToolScope(createManager(), {
      sessionId: 'page-session', toolNames: ['search'],
      beforeExecute: async invocation => {
        invocationSignal = invocation.signal;
        await gate;
      },
      document: { modelContext: { registerTool: async tool => { registered.push(tool); } } },
    });
    const execution = registered[0]!.execute({ query: 'coffee' });
    await Promise.resolve();
    scope.dispose();
    expect(invocationSignal?.aborted).toBe(true);
    release?.();
    await expect(execution).rejects.toThrow('disposed');
  });
});
