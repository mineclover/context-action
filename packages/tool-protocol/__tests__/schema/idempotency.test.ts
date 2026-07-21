import {
  createToolCallFingerprint,
  createToolIdempotencyRegistry,
  createToolOperationKey,
  isValidToolIdempotencyKey,
} from '../../src/idempotency';

describe('tool idempotency primitives', () => {
  it('replays the same promise and detects a fingerprint conflict', async () => {
    let executions = 0;
    const registry = createToolIdempotencyRegistry<string>();
    const create = async () => {
      executions += 1;
      return 'done';
    };

    const owner = registry.claim('mutation-1', 'fingerprint-a', create);
    const replay = registry.claim('mutation-1', 'fingerprint-a', create);
    const conflict = registry.claim('mutation-1', 'fingerprint-b', create);

    expect(owner.status).toBe('owner');
    expect(replay.status).toBe('replay');
    expect(replay.promise).toBe(owner.promise);
    expect(conflict.status).toBe('conflict');
    await expect(owner.promise).resolves.toBe('done');
    expect(executions).toBe(1);
  });

  it('bounds settled entries and expires them without evicting pending work', async () => {
    let now = 0;
    const registry = createToolIdempotencyRegistry({
      retentionMs: 10,
      maxEntries: 1,
      now: () => now,
    });
    const resolved = Promise.resolve('done');
    let releasePending!: () => void;
    const pending = new Promise<string>(resolve => {
      releasePending = () => resolve('pending-done');
    });

    const firstClaim = registry.claim('first', 'a', () => pending);
    const secondClaim = registry.claim('second', 'b', () => resolved);
    expect(registry.size).toBe(2);

    await secondClaim.promise;
    expect(registry.size).toBe(1);
    expect(registry.claim('first', 'a', async () => 'duplicate').status).toBe('replay');
    releasePending();
    await firstClaim.promise;
    await Promise.resolve();
    expect(registry.size).toBe(1);

    now = 11;
    expect(registry.size).toBe(0);
  });

  it('creates stable fingerprints without retaining argument values', () => {
    expect(createToolCallFingerprint('save', { b: 2, a: 1 })).toBe(
      createToolCallFingerprint('save', { a: 1, b: 2 })
    );
    expect(createToolCallFingerprint('save', { a: 1 })).not.toBe(
      createToolCallFingerprint('save', { a: 2 })
    );
  });

  it('allows a new owner after retention expiry and supports explicit clearing', async () => {
    let now = 0;
    let executions = 0;
    const registry = createToolIdempotencyRegistry({
      retentionMs: 10,
      now: () => now,
    });
    const create = async () => {
      executions += 1;
      return executions;
    };

    const first = registry.claim('save-1', 'fingerprint', create);
    await expect(first.promise).resolves.toBe(1);
    now = 11;
    const second = registry.claim('save-1', 'fingerprint', create);
    expect(second.status).toBe('owner');
    await expect(second.promise).resolves.toBe(2);

    registry.clear('save-1');
    const third = registry.claim('save-1', 'fingerprint', create);
    expect(third.status).toBe('owner');
    await expect(third.promise).resolves.toBe(3);
  });

  it('replays a rejected execution instead of starting a second mutation', async () => {
    let executions = 0;
    const registry = createToolIdempotencyRegistry<string>();
    const create = async () => {
      executions += 1;
      throw new Error('indeterminate mutation');
    };

    const owner = registry.claim('save-2', 'fingerprint', create);
    const replay = registry.claim('save-2', 'fingerprint', create);
    await expect(owner.promise).rejects.toThrow('indeterminate mutation');
    await expect(replay.promise).rejects.toThrow('indeterminate mutation');
    expect(executions).toBe(1);
  });

  it('rejects invalid registry configuration and claim inputs', () => {
    expect(() => createToolIdempotencyRegistry({ retentionMs: -1 })).toThrow(
      'retentionMs'
    );
    expect(() => createToolIdempotencyRegistry({ maxEntries: 0 })).toThrow(
      'maxEntries'
    );

    const registry = createToolIdempotencyRegistry();
    expect(() => registry.claim('', 'fingerprint', async () => 'done')).toThrow(
      'Idempotency key'
    );
    expect(() => registry.claim('key', '', async () => 'done')).toThrow(
      'Idempotency fingerprint'
    );
  });

  it('validates caller-supplied idempotency keys', () => {
    expect(isValidToolIdempotencyKey('mutation-1')).toBe(true);
    expect(isValidToolIdempotencyKey('')).toBe(false);
    expect(isValidToolIdempotencyKey('x'.repeat(257))).toBe(false);
    expect(isValidToolIdempotencyKey(1)).toBe(false);
  });

  it('builds a session-isolated durable operation key', () => {
    expect(createToolOperationKey('workspace.save', 'save-1', 'session-a')).toBe(
      '["session-a","workspace.save","save-1"]'
    );
    expect(createToolOperationKey('workspace.save', 'save-1')).toBe(
      '["default","workspace.save","save-1"]'
    );
    expect(() => createToolOperationKey('workspace.save', '')).toThrow(
      'Idempotency key'
    );
  });
});
