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

function createManager(
  execute: (
    call: ModelToolCall,
    options?: ToolCallOptions,
  ) => Promise<ToolCallResult> = async () => ({
    content: [{ type: 'json', json: { count: 1 } }],
    structuredContent: { count: 1 },
  }),
): ToolManagementInterface {
  return {
    listTools: () => ({ tools: [searchDefinition] }),
    getToolDefinition: (name) => name === searchDefinition.name ? searchDefinition : undefined,
    hasTool: (name) => name === searchDefinition.name,
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
});
