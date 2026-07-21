const {
  createVerificationEvidence,
  formatVerificationEvidenceMarkdown,
  parseLastJsonObject,
  redactText,
} = require('../../scripts/verification-evidence.cjs');

describe('durable-operation verification evidence', () => {
  it('parses the last JSON result and redacts endpoint credentials', () => {
    const log = [
      'diagnostic: redis://user:secret@cache.internal:6380',
      JSON.stringify({ status: 'ok', redisUrl: 'cache.internal', redisVersion: '7.4.9' }),
    ].join('\n');

    expect(redactText(log, ['redis://user:secret@cache.internal:6380'])).not.toContain('secret');
    expect(parseLastJsonObject(log)).toMatchObject({ status: 'ok', redisUrl: 'cache.internal' });
  });

  it('creates a bounded record without raw command output or credentials', () => {
    const fs = require('node:fs');
    const os = require('node:os');
    const path = require('node:path');
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'durable-evidence-'));
    fs.writeFileSync(
      path.join(directory, 'redis.log'),
      JSON.stringify({
        status: 'ok',
        redisUrl: 'cache.internal',
        redisVersion: '7.4.9',
        checks: ['atomic-claim'],
        diagnostic: 'redis://user:secret@cache.internal:6380',
      })
    );
    fs.writeFileSync(
      path.join(directory, 'preflight.log'),
      JSON.stringify({
        status: 'ok',
        environment: 'staging',
        redisProtocol: 'redis:',
        redisHost: 'cache.internal',
        postgresVariable: 'POSTGRES_URL',
        postgresProtocol: 'postgres:',
        postgresHost: 'db.internal',
        diagnostic: 'postgres://user:secret@db.internal:5432/app',
      })
    );
    fs.writeFileSync(
      path.join(directory, 'integration.log'),
      'Test Suites: 1 skipped, 8 passed, 9 total\nTests: 2 skipped, 43 passed, 45 total\n'
    );

    const evidence = createVerificationEvidence({
      inputDirectory: directory,
      environment: 'staging',
      commitSha: 'abc123',
      runId: '42',
      operator: 'ci-bot',
      outcomes: { redis: 'success', integration: 'success' },
      secrets: [
        'redis://user:secret@cache.internal:6380',
        'postgres://user:secret@db.internal:5432/app',
      ],
    });
    const serialized = JSON.stringify(evidence);
    expect(evidence.schemaVersion).toBe('context-action/durable-operation-verification@1');
    expect(evidence.checks.redis.result).toMatchObject({
      status: 'ok',
      redisHost: 'cache.internal',
      redisVersion: '7.4.9',
      checks: ['atomic-claim'],
    });
    expect(evidence.checks.preflight.result).toMatchObject({
      postgresVariable: 'POSTGRES_URL',
      postgresHost: 'db.internal',
    });
    expect(evidence.checks.integration.result).toMatchObject({
      status: 'ok',
      suites: { skipped: 1, passed: 8, total: 9 },
      tests: { skipped: 2, passed: 43, total: 45 },
    });
    expect(serialized).not.toContain('secret');
    expect(serialized).not.toContain('diagnostic');
    expect(formatVerificationEvidenceMarkdown(evidence)).toContain('Endpoint credentials and raw command output: omitted');
  });
});
