import {
  TOOL_CALL_ERROR_CODES,
  createToolCallError,
  createToolCallSuccess,
  getToolCallErrorMetadata,
  type ToolCallContext,
  type ToolCallMode,
  type ToolCallErrorCode,
  toToolCallRequest,
  toToolListRequest,
} from '../../src/tool-protocol';

describe('tool protocol context', () => {
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
  });

  it('exposes stable canonical tool-call error codes', () => {
    const cancellation: ToolCallErrorCode = TOOL_CALL_ERROR_CODES.CANCELLED;

    expect(cancellation).toBe('TOOL_CANCELLED');
    expect(TOOL_CALL_ERROR_CODES).toMatchObject({
      NOT_FOUND: 'TOOL_NOT_FOUND',
      VALIDATION_FAILED: 'TOOL_VALIDATION_FAILED',
      OUTPUT_VALIDATION_FAILED: 'TOOL_OUTPUT_VALIDATION_FAILED',
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
