import {
  createToolObservabilityPolicy,
  createToolObservationSink,
  isToolObservationRetained,
  projectToolCallObservation,
  redactToolObservabilityValue,
  sanitizeToolCallDiagnostic,
  sanitizeToolCallDiagnosticReason,
  serializeToolObservabilityValue,
} from '../../src/observability';
import { createToolExecutionProvenance } from '../../src/execution-provenance';

describe('tool observability policy', () => {
  it('redacts credential and source-like fields without retaining their values', () => {
    const value = redactToolObservabilityValue({
      authorization: 'Bearer secret-token',
      access_token: 'access-secret',
      refreshToken: 'refresh-secret',
      nested: { source: 'const password = "secret";', keep: 'ok' },
    });

    expect(value).toEqual({
      authorization: '[authorization redacted]',
      access_token: '[access_token redacted]',
      refreshToken: '[refreshToken redacted]',
      nested: {
        source: '[source redacted]',
        keep: 'ok',
      },
    });
    expect(JSON.stringify(value)).not.toContain('secret-token');
    expect(JSON.stringify(value)).not.toContain('const password');
    expect(redactToolObservabilityValue({ nullable: null, enabled: false })).toEqual({
      nullable: null,
      enabled: false,
    });
  });

  it('bounds depth, collections, strings, and serialized bytes', () => {
    const policy = createToolObservabilityPolicy({
      maxBytes: 64,
      maxDepth: 1,
      maxStringLength: 4,
      maxArrayEntries: 1,
      maxObjectEntries: 1,
    });
    const value: Record<string, unknown> = {
      first: '123456789',
      second: 'hidden',
      nested: { value: 'too deep' },
      list: ['a', 'b'],
    };

    const redacted = redactToolObservabilityValue(value, policy);
    expect(redacted).toEqual({
      first: '1234… [truncated]',
      _redacted: 'additional fields redacted',
    });
    const serialized = serializeToolObservabilityValue(value, policy);
    expect(serialized).not.toContain('hidden');
    expect(new TextEncoder().encode(serialized).byteLength).toBeLessThanOrEqual(policy.maxBytes);
  });

  it('keeps the redaction marker within very small UTF-8 byte budgets', () => {
    for (const maxBytes of [1, 2, 8, 32, 64]) {
      const policy = createToolObservabilityPolicy({ maxBytes });
      const serialized = serializeToolObservabilityValue(
        { payload: 'x'.repeat(512) },
        policy,
      );
      expect(new TextEncoder().encode(serialized).byteLength).toBeLessThanOrEqual(maxBytes);
      expect(() => JSON.parse(serialized)).not.toThrow();
    }

    const diagnostic = sanitizeToolCallDiagnostic(
      {
        content: [{ type: 'text', text: 'large diagnostic' }],
        isError: true,
        error: {
          code: 'TOOL_EXECUTION_UNKNOWN',
          message: 'large diagnostic',
          details: { payload: 'x'.repeat(512) },
        },
      },
      createToolObservabilityPolicy({ maxBytes: 1 }),
    );
    expect(new TextEncoder().encode(JSON.stringify(diagnostic.error?.details)).byteLength)
      .toBeLessThanOrEqual(1);
  });

  it('marks retention expiry at the configured boundary', () => {
    const policy = createToolObservabilityPolicy({ retentionMs: 100 });
    expect(isToolObservationRetained(1_000, 1_099, policy)).toBe(true);
    expect(isToolObservationRetained(1_000, 1_100, policy)).toBe(false);
    expect(isToolObservationRetained(1_000, 900, policy)).toBe(true);
  });

  it('rejects invalid policy limits and timestamps', () => {
    expect(() => createToolObservabilityPolicy({ maxBytes: 0 })).toThrow(
      'maxBytes must be a positive safe integer'
    );
    expect(() => createToolObservabilityPolicy({ retentionMs: -1 })).toThrow(
      'retentionMs must be a non-negative safe integer'
    );
    const policy = createToolObservabilityPolicy();
    expect(() => isToolObservationRetained(Number.NaN, 1, policy)).toThrow(
      'timestamps must be finite numbers'
    );
  });

  it('supports custom redacted keys without leaking a secret value', () => {
    const policy = createToolObservabilityPolicy({ redactedKeys: ['internalId'] });
    const serialized = serializeToolObservabilityValue(
      { internalId: 'private-123', visible: 'ok' },
      policy,
    );
    expect(serialized).toContain('[internalId redacted]');
    expect(serialized).not.toContain('private-123');
    expect(serializeToolObservabilityValue({ authorization: 'still-secret' }, policy))
      .not.toContain('still-secret');
  });

  it('projects lifecycle events to metadata without retaining request or result payloads', () => {
    const event = {
      type: 'completed' as const,
      toolCallId: 'call-1',
      name: 'workspace.saveFile',
      request: {
        id: 'call-1',
        method: 'tools/call' as const,
        params: {
          name: 'workspace.saveFile',
          arguments: {
            path: 'src/App.tsx',
            source: 'const token = "secret";',
          },
        },
      },
      context: {
        source: 'local' as const,
        mode: 'direct' as const,
        sessionId: 'session-1',
        metadata: { authorization: 'Bearer secret-token', revision: 3 },
      },
      timestamp: 100,
      durationMs: 12,
      result: {
        content: [{ type: 'text' as const, text: 'raw source result' }],
        structuredContent: { source: 'raw source result' },
        isError: false,
      },
      provenance: createToolExecutionProvenance({
        ownerId: 'worker-1',
        state: 'completed',
        usedOutputBytes: 32,
        elapsedMs: 12,
      }),
    };

    const projected = projectToolCallObservation(event);
    expect(projected).toMatchObject({
      schemaVersion: 'context-action-tool-observation.v1',
      type: 'completed',
      name: 'workspace.saveFile',
      request: {
        argumentKeys: ['path', 'source'],
      },
      result: {
        isError: false,
        contentTypes: ['text'],
        hasStructuredContent: true,
      },
    });
    expect(projected.context?.metadata).toEqual({
      authorization: '[authorization redacted]',
      revision: 3,
    });
    expect(projected).not.toHaveProperty('request.params');
    expect(projected).not.toHaveProperty('result.content');
    expect(JSON.stringify(projected)).not.toContain('src/App.tsx');
    expect(JSON.stringify(projected)).not.toContain('secret-token');
    expect(JSON.stringify(projected)).not.toContain('raw source result');
  });

  it('projects unknown tool results without retaining content or structured payloads', () => {
    const projected = sanitizeToolCallDiagnostic({
      toolCallId: 'provider-call',
      content: [{ type: 'text', text: 'raw source must not persist' }],
      structuredContent: { source: 'raw source must not persist' },
      isError: true,
      error: {
        code: 'TOOL_EXECUTION_UNKNOWN',
        message: 'raw source must not persist',
        retryable: true,
        details: {
          path: 'src/App.tsx',
          source: 'raw source must not persist',
          credentials: { token: 'secret-token' },
        },
      },
    });

    expect(projected).toEqual({
      content: [
        {
          type: 'text',
          text: 'Tool execution diagnostic retained in redacted form.',
        },
      ],
      isError: true,
      error: {
        code: 'TOOL_EXECUTION_UNKNOWN',
        message: 'Tool execution diagnostic retained in redacted form.',
        retryable: true,
        details: {
          path: 'src/App.tsx',
          source: '[source redacted]',
          credentials: { token: '[token redacted]' },
        },
      },
    });
    expect(JSON.stringify(projected)).not.toContain('raw source');
    expect(JSON.stringify(projected)).not.toContain('secret-token');
    expect(projected).not.toHaveProperty('structuredContent');
    expect(projected).not.toHaveProperty('toolCallId');
    expect(
      sanitizeToolCallDiagnosticReason({
        ...projected,
        error: {
          code: 'TOOL_EXECUTION_UNKNOWN',
          message: 'raw source must not persist',
        },
      })
    ).toBe('Tool execution ended with TOOL_EXECUTION_UNKNOWN; reconcile before retrying.');
    expect(
      sanitizeToolCallDiagnosticReason({
        content: [],
        error: { code: 'raw secret code', message: 'raw message' },
      })
    ).toBe('Tool execution ended with an ambiguous outcome; reconcile before retrying.');
  });

  it('offers a sink observer that never forwards the canonical event', () => {
    const records: unknown[] = [];
    const observer = createToolObservationSink(
      (record) => records.push(record),
      createToolObservabilityPolicy({ maxBytes: 4096, retentionMs: 60_000, maxEntries: 10 }),
    );
    observer({
      type: 'completed',
      toolCallId: 'call-safe-sink',
      name: 'workspace.saveFile',
      request: {
        id: 'call-safe-sink',
        method: 'tools/call',
        params: {
          name: 'workspace.saveFile',
          arguments: {
            path: 'src/App.tsx',
            source: 'const token = "secret";',
          },
        },
      },
      timestamp: 100,
      durationMs: 4,
      result: {
        content: [{ type: 'text', text: 'raw result' }],
        structuredContent: { source: 'raw result' },
        isError: false,
      },
      provenance: createToolExecutionProvenance({
        ownerId: 'sink-test',
        state: 'completed',
        usedOutputBytes: 10,
        elapsedMs: 4,
      }),
    });

    expect(records).toHaveLength(1);
    const record = records[0] as {
      schemaVersion: string;
      serializedObservation: string;
      policy: { maxBytes: number; retentionMs: number; maxEntries: number };
    };
    expect(record.schemaVersion).toBe('context-action-tool-observation-sink.v1');
    expect(record.policy).toMatchObject({ maxBytes: 4096, retentionMs: 60_000, maxEntries: 10 });
    expect(new TextEncoder().encode(record.serializedObservation).byteLength).toBeLessThanOrEqual(
      record.policy.maxBytes,
    );
    expect(record.serializedObservation).not.toContain('src/App.tsx');
    expect(record.serializedObservation).not.toContain('const token');
    expect(record.serializedObservation).not.toContain('raw result');
    expect(JSON.parse(record.serializedObservation)).toMatchObject({
      schemaVersion: 'context-action-tool-observation.v1',
      request: { argumentKeys: ['path', 'source'] },
    });
  });
});
