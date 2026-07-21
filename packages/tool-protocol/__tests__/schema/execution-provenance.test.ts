import {
  createToolExecutionProvenance,
  measureToolOutputBytes,
  parseToolExecutionProvenance,
} from '../../src/execution-provenance';

describe('tool execution provenance', () => {
  it('creates and parses a canonical lifecycle record without payload text', () => {
    const record = createToolExecutionProvenance({
      ownerId: 'worker-a',
      state: 'completed',
      timeoutMs: 1000,
      maxOutputBytes: 4096,
      usedOutputBytes: 42,
      elapsedMs: 7,
    });

    expect(parseToolExecutionProvenance(JSON.parse(JSON.stringify(record)))).toEqual(record);
    expect(record).toEqual(expect.objectContaining({
      schemaVersion: 'context-action-tool-execution-provenance.v1',
      phase: 'tool-call',
      ownerId: 'worker-a',
      state: 'completed',
      usedOutputBytes: 42,
      elapsedMs: 7,
    }));
    expect(JSON.stringify(record)).not.toContain('secret-payload');
  });

  it('rejects unknown fields and invalid numeric evidence', () => {
    const record = {
      schemaVersion: 'context-action-tool-execution-provenance.v1',
      phase: 'tool-call',
      ownerId: 'worker-a',
      state: 'unknown',
      usedOutputBytes: 2,
      elapsedMs: 3,
    };
    expect(() => parseToolExecutionProvenance({ ...record, extra: true })).toThrow(
      'contains unknown field: extra'
    );
    expect(() => parseToolExecutionProvenance({ ...record, elapsedMs: -1 })).toThrow(
      'elapsedMs must be a non-negative safe integer'
    );
    expect(() => parseToolExecutionProvenance({ ...record, ownerId: ' worker-a' })).toThrow(
      'ownerId must be canonical text'
    );
  });

  it('allows an immediate timeout budget of zero', () => {
    expect(createToolExecutionProvenance({
      ownerId: 'worker-a',
      state: 'unknown',
      timeoutMs: 0,
      usedOutputBytes: 0,
      elapsedMs: 0,
    }).timeoutMs).toBe(0);
  });

  it('measures UTF-8 output bytes without exposing the value in the record', () => {
    expect(measureToolOutputBytes({ text: '한글' })).toBeGreaterThan(
      measureToolOutputBytes({ text: 'a' })
    );
  });
});
