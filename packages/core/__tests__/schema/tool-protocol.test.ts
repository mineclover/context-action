import {
  TOOL_CALL_ERROR_CODES,
  createToolApprovalQueue,
  createToolCallError,
  createToolCallSuccess,
  getToolCallErrorMetadata,
  isToolCallRequest,
  isToolApprovalSnapshot,
  isToolCallResult,
  isToolListRequest,
  isToolListResult,
  listAllTools,
  stringifyToolContent,
  stringifyToolContentBlock,
  toAnthropicToolDefinitions,
  toOpenAIToolDefinitions,
  type ToolCallContext,
  type ToolCallMode,
  type ToolCallErrorCode,
  type ToolApprovalSnapshot,
  type ToolListRequest,
  type ToolManagementInterface,
  toToolCallRequest,
  toToolListRequest,
} from '../../src/tool-protocol';

describe('tool protocol context', () => {
  it('guards canonical tools/list and tools/call request shapes at runtime', () => {
    expect(isToolListRequest({ method: 'tools/list' })).toBe(true);
    expect(
      isToolListRequest({ method: 'tools/list', params: { cursor: 'offset:2' } })
    ).toBe(true);
    expect(isToolListRequest({ method: 'tools/call' })).toBe(false);
    expect(isToolListRequest(null)).toBe(false);
    expect(
      isToolListResult({
        tools: [{ name: 'workspace.readFile', inputSchema: { type: 'object' } }],
      })
    ).toBe(true);
    expect(
      isToolListResult({
        tools: [{ name: 'workspace.readFile' }],
        nextCursor: 3,
      })
    ).toBe(false);

    expect(
      isToolCallRequest({
        id: 'call-1',
        method: 'tools/call',
        params: { name: 'workspace.readFile', arguments: { path: 'index.html' } },
      })
    ).toBe(true);
    expect(
      isToolCallRequest({
        method: 'tools/call',
        params: { name: '  ', arguments: {} },
      })
    ).toBe(false);
    expect(
      isToolCallRequest({
        method: 'tools/call',
        params: { name: 'workspace.readFile', arguments: [] },
      })
    ).toBe(false);
    expect(isToolCallRequest(null)).toBe(false);

    expect(
      isToolCallResult(
        createToolCallSuccess({ path: 'index.html' }, { toolCallId: 'call-1' })
      )
    ).toBe(true);
    expect(
      isToolCallResult(
        createToolCallError('denied', {
          code: 'TOOL_POLICY_DENIED',
          toolCallId: 'call-1',
        })
      )
    ).toBe(true);
    expect(
      isToolCallResult({
        content: [{ type: 'json', json: { ok: true } }],
        isError: false,
      })
    ).toBe(true);
    expect(
      isToolCallResult({
        content: [{ type: 'json' }],
        isError: false,
      })
    ).toBe(false);
    expect(
      isToolCallResult({
        content: [{ type: 'text', text: 'failed' }],
        error: { code: '', message: 'missing code' },
      })
    ).toBe(false);
  });

  it('guards approval metadata without coupling the approval surface to execution', () => {
    const snapshot = {
      id: 'approval-1',
      method: 'tools/call',
      toolCallId: 'call-1',
      sessionId: 'session-1',
      name: 'workspace.writeFile',
      description: 'Write a workspace file.',
      source: 'model',
      mode: 'agent',
      argumentKeys: ['path', 'source'],
      safeArgumentPreview: 'path: index.html',
      createdAt: 1,
    };

    expect(isToolApprovalSnapshot(snapshot)).toBe(true);
    expect(
      isToolApprovalSnapshot({ ...snapshot, method: 'tools/list' })
    ).toBe(false);
    expect(
      isToolApprovalSnapshot({ ...snapshot, source: 'remote' })
    ).toBe(false);
    expect(
      isToolApprovalSnapshot({ ...snapshot, argumentKeys: [''] })
    ).toBe(false);
  });

  it('provides a shared approval queue lifecycle for browser and host surfaces', async () => {
    const queue = createToolApprovalQueue({
      idPrefix: 'test-approval',
      safeArgumentNames: ['path'],
    });
    let notifications = 0;
    const unsubscribe = queue.store.subscribe(() => {
      notifications += 1;
    });
    const request = {
      id: 'call-approval-1',
      method: 'tools/call' as const,
      params: {
        name: 'workspace.saveAll',
        arguments: {
          path: 'src/App.tsx',
          source: 'secret source must never enter the preview',
        },
      },
    };
    const allowed = queue.request({
      request,
      definition: {
        name: request.params.name,
        description: 'Write workspace files.',
        inputSchema: { type: 'object' },
      },
      context: {
        source: 'mcp',
        mode: 'agent',
        sessionId: 'session-approval',
      },
    });

    expect(queue.store.getSnapshot()).toEqual([
      expect.objectContaining({
        id: 'call-approval-1',
        method: 'tools/call',
        toolCallId: 'call-approval-1',
        source: 'mcp',
        mode: 'agent',
        sessionId: 'session-approval',
        argumentKeys: ['path', 'source'],
        safeArgumentPreview: 'path: src/App.tsx',
      }),
    ]);
    expect(notifications).toBe(1);

    queue.resolve('call-approval-1', 'allow');
    await expect(allowed).resolves.toBe('allow');
    expect(queue.store.getSnapshot()).toEqual([]);
    expect(notifications).toBe(2);

    const controller = new AbortController();
    const cancelled = queue.request({
      request: { ...request, id: 'call-approval-cancelled' },
      definition: {
        name: request.params.name,
        inputSchema: { type: 'object' },
      },
      context: { source: 'model', mode: 'agent' },
      signal: controller.signal,
    });
    controller.abort();
    await expect(cancelled).resolves.toBe('deny');
    expect(queue.store.getSnapshot()).toEqual([]);

    const pending = queue.request({
      request: { ...request, id: 'call-approval-unmounted' },
      definition: {
        name: request.params.name,
        inputSchema: { type: 'object' },
      },
    });
    queue.denyAll();
    await expect(pending).resolves.toBe('deny');
    expect(queue.store.getSnapshot()).toEqual([]);
    unsubscribe();
  });

  it('creates canonical discovery, model-call, and result shapes', () => {
    expect(toToolListRequest()).toEqual({ method: 'tools/list' });
    expect(toToolListRequest({ cursor: 'offset:2' })).toEqual({
      method: 'tools/list',
      params: { cursor: 'offset:2' },
    });
    expect(
      toToolCallRequest({
        id: 'model-call-1',
        name: 'workspace.readFile',
        arguments: { path: 'index.html' },
      })
    ).toEqual({
      id: 'model-call-1',
      method: 'tools/call',
      params: {
        name: 'workspace.readFile',
        arguments: { path: 'index.html' },
      },
    });
    expect(
      createToolCallSuccess(
        { path: 'index.html', revision: 3 },
        { toolCallId: 'model-call-1' }
      )
    ).toEqual({
      toolCallId: 'model-call-1',
      content: [
        {
          type: 'text',
          text: '{"path":"index.html","revision":3}',
        },
      ],
      structuredContent: { path: 'index.html', revision: 3 },
    });

    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(
      stringifyToolContent([
        { type: 'text', text: 'updated' },
        { type: 'json', json: { revision: 3 } },
      ])
    ).toBe('updated\n{"revision":3}');
    expect(
      stringifyToolContentBlock({ type: 'json', json: circular })
    ).toBe('[unserializable JSON content]');
  });

  it('collects paged tools/list results and rejects a repeated cursor', () => {
    const pages = [
      {
        tools: [{ name: 'first', inputSchema: { type: 'object' as const } }],
        nextCursor: 'offset:1',
      },
      {
        tools: [{ name: 'second', inputSchema: { type: 'object' as const } }],
      },
    ];
    const listTools = jest
      .fn()
      .mockImplementation((request: ToolListRequest) =>
        request.params?.cursor === 'offset:1' ? pages[1] : pages[0]
      );

    expect(listAllTools({ listTools })).toEqual([
      pages[0].tools[0],
      pages[1].tools[0],
    ]);
    expect(listTools).toHaveBeenCalledTimes(2);

    const repeatedCursorManager = {
      listTools: () => ({
        tools: [],
        nextCursor: 'same',
      }),
    };
    expect(() => listAllTools(repeatedCursorManager)).toThrow(
      'cursor did not advance'
    );

    const malformedManager = {
      listTools: () => ({ tools: [{ name: 'missing-input-schema' }] }),
    } as unknown as Pick<ToolManagementInterface, 'listTools'>;
    expect(() => listAllTools(malformedManager)).toThrow(
      'Invalid tools/list result'
    );
  });

  it('converts the canonical tools/list definitions without dropping schema constraints', () => {
    const inputSchema = {
      type: 'object' as const,
      properties: {
        theme: {
          type: 'string' as const,
          enum: ['violet', 'emerald'],
          minLength: 1,
        },
      },
      required: ['theme'],
      additionalProperties: false,
    };

    expect(
      toOpenAIToolDefinitions([
        {
          name: 'preview.setTheme',
          description: 'Update the preview theme.',
          inputSchema,
        },
      ])
    ).toEqual([
      {
        type: 'function',
        function: {
          name: 'preview.setTheme',
          description: 'Update the preview theme.',
          parameters: inputSchema,
        },
      },
    ]);

    expect(toAnthropicToolDefinitions([{ name: 'preview.setTheme', inputSchema }])).toEqual([
      {
        name: 'preview.setTheme',
        input_schema: inputSchema,
      },
    ]);
  });

  it('accepts numeric browser workspace revisions', () => {
    const context: ToolCallContext = {
      source: 'iframe',
      mode: 'direct',
      revision: 12,
    };

    const mode: ToolCallMode = context.mode!;
    expect(mode).toBe('direct');
    expect(context.revision).toBe(12);

    const approval: ToolApprovalSnapshot = {
      id: 'approval-1',
      method: 'tools/call',
      toolCallId: 'call-1',
      sessionId: 'session-1',
      name: 'workspace.writeFile',
      description: 'Write a workspace file.',
      source: 'model',
      mode: 'agent',
      argumentKeys: ['path', 'source'],
      safeArgumentPreview: 'path: index.html',
      createdAt: 1,
    };
    expect(approval.source).toBe('model');
    expect(approval.method).toBe('tools/call');
  });

  it('exposes stable canonical tool-call error codes', () => {
    const cancellation: ToolCallErrorCode = TOOL_CALL_ERROR_CODES.CANCELLED;

    expect(cancellation).toBe('TOOL_CANCELLED');
    expect(TOOL_CALL_ERROR_CODES).toMatchObject({
      NOT_FOUND: 'TOOL_NOT_FOUND',
      VALIDATION_FAILED: 'TOOL_VALIDATION_FAILED',
      OUTPUT_VALIDATION_FAILED: 'TOOL_OUTPUT_VALIDATION_FAILED',
      RESULT_VALIDATION_FAILED: 'TOOL_RESULT_VALIDATION_FAILED',
      POLICY_DENIED: 'TOOL_POLICY_DENIED',
      APPROVAL_REQUIRED: 'TOOL_APPROVAL_REQUIRED',
      EXECUTION_FAILED: 'TOOL_EXECUTION_FAILED',
    });
    expect(createToolCallError('failed').error?.code).toBe(
      TOOL_CALL_ERROR_CODES.EXECUTION_FAILED
    );
  });

  it('reads optional structured metadata from handler errors', () => {
    const error = Object.assign(new Error('stale revision'), {
      code: 'WORKSPACE_REVISION_CONFLICT',
      retryable: true,
      details: { expectedRevision: 3, currentRevision: 4 },
    });

    expect(getToolCallErrorMetadata(error)).toEqual({
      code: 'WORKSPACE_REVISION_CONFLICT',
      retryable: true,
      details: { expectedRevision: 3, currentRevision: 4 },
    });
  });
});
