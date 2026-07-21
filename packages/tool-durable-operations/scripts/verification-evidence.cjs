const fs = require('node:fs');

const VERIFICATION_EVIDENCE_SCHEMA =
  'context-action/durable-operation-verification@1';

const STEP_NAMES = ['preflight', 'redis', 'integration', 'postgres', 'queue'];

function redactText(value, secrets = []) {
  let text = String(value ?? '');
  for (const secret of secrets) {
    if (typeof secret === 'string' && secret.length > 0) {
      text = text.split(secret).join('[REDACTED]');
    }
  }

  // Protect against a future smoke command accidentally printing a URL with
  // userinfo even when the exact secret was not passed to this helper.
  return text.replace(
    /\b((?:rediss?|postgres(?:ql)?):\/\/)[^\s/@]+@/gi,
    '$1[REDACTED]@'
  );
}

function parseLastJsonObject(log) {
  const lines = String(log ?? '').split(/\r?\n/).reverse();
  for (const line of lines) {
    const candidate = line.trim();
    if (!candidate.startsWith('{') || !candidate.endsWith('}')) continue;
    try {
      const value = JSON.parse(candidate);
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value;
      }
    } catch {
      // The command may have emitted diagnostics after a partial JSON line.
    }
  }
  return null;
}

function safeHost(value) {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  try {
    // Smoke commands already return host-only values. This fallback makes the
    // evidence writer safe if an older command returns a URL instead.
    const parsed = new URL(value.includes('://') ? value : `https://${value}`);
    return parsed.hostname || undefined;
  } catch {
    return undefined;
  }
}

function safeToken(value, pattern, maximum = 96) {
  if (typeof value !== 'string' || value.length === 0 || value.length > maximum) {
    return undefined;
  }
  return pattern.test(value) ? value : undefined;
}

function parseJestSummary(text) {
  const suiteMatch = String(text ?? '').match(
    /Test Suites:\s+(?:(\d+) failed,\s+)?(?:(\d+) skipped,\s+)?(?:(\d+) passed,\s+)?(\d+) total/i
  );
  const testMatch = String(text ?? '').match(
    /Tests:\s+(?:(\d+) failed,\s+)?(?:(\d+) skipped,\s+)?(?:(\d+) passed,\s+)?(\d+) total/i
  );
  if (!suiteMatch && !testMatch) return undefined;
  const numbers = match => ({
    failed: Number(match?.[1] ?? 0),
    skipped: Number(match?.[2] ?? 0),
    passed: Number(match?.[3] ?? 0),
    total: Number(match?.[4] ?? 0),
  });
  return {
    ...(suiteMatch ? { suites: numbers(suiteMatch) } : {}),
    ...(testMatch ? { tests: numbers(testMatch) } : {}),
  };
}

function safeResult(step, parsed, text, outcome) {
  if (step !== 'integration' && (!parsed || typeof parsed !== 'object')) {
    return undefined;
  }
  const result = {
    status: parsed?.status === 'ok' ? 'ok' : 'unknown',
  };

  if (step === 'preflight') {
    result.environment = safeToken(parsed.environment, /^[a-z-]+$/i, 32);
    result.redisProtocol = safeToken(parsed.redisProtocol, /^rediss?:$/i, 8);
    result.redisHost = safeHost(parsed.redisHost);
    result.postgresVariable = safeToken(
      parsed.postgresVariable,
      /^(?:DATABASE_URL|POSTGRES_URL)$/,
      16
    );
    result.postgresProtocol = safeToken(
      parsed.postgresProtocol,
      /^postgres(?:ql)?:$/i,
      12
    );
    result.postgresHost = safeHost(parsed.postgresHost);
  } else if (step === 'redis') {
    result.redisHost = safeHost(parsed.redisUrl ?? parsed.redisHost);
    result.redisVersion = safeToken(parsed.redisVersion, /^[a-z0-9().+/_ -]+$/i, 64);
    result.checks = Array.isArray(parsed.checks)
      ? parsed.checks.filter(value => /^[a-z0-9:_-]{1,96}$/i.test(value))
      : [];
  } else if (step === 'postgres') {
    result.postgresHost = safeHost(parsed.postgresHost ?? parsed.postgresUrl);
    result.postgresVersion = safeToken(
      parsed.postgresVersion,
      /^[a-z0-9().+/_ -]+$/i,
      64
    );
    result.postgresIsolation = safeToken(
      parsed.postgresIsolation,
      /^[a-z0-9_ -]+$/i,
      64
    );
    result.checks = Array.isArray(parsed.checks)
      ? parsed.checks.filter(value => /^[a-z0-9:_-]{1,96}$/i.test(value))
      : [];
  } else if (step === 'queue') {
    result.checks = Array.isArray(parsed.checks)
      ? parsed.checks.filter(value => /^[a-z0-9:_-]{1,96}$/i.test(value))
      : [];
  } else if (step === 'integration') {
    const summary = parseJestSummary(text);
    if (!summary) return undefined;
    result.status = outcome === 'success' ? 'ok' : 'unknown';
    if (summary.suites) result.suites = summary.suites;
    if (summary.tests) result.tests = summary.tests;
  }

  return result;
}

function readStepLog(inputDirectory, step, secrets) {
  const path = `${inputDirectory}/${step}.log`;
  let raw = '';
  try {
    raw = fs.readFileSync(path, 'utf8');
  } catch {
    return { parsed: null, available: false };
  }
  const sanitized = redactText(raw, secrets);
  return {
    parsed: parseLastJsonObject(sanitized),
    text: sanitized,
    available: true,
  };
}

function createVerificationEvidence({
  inputDirectory,
  environment,
  commitSha,
  runId,
  operator,
  startedAt,
  completedAt,
  outcomes = {},
  secrets = [],
}) {
  const checks = {};
  for (const step of STEP_NAMES) {
    const { parsed, text, available } = readStepLog(inputDirectory, step, secrets);
    const outcome = outcomes[step] ?? 'unknown';
    checks[step] = {
      outcome,
      available,
      status: parsed?.status === 'ok' ? 'ok' : 'unknown',
      result: safeResult(step, parsed, text, outcome),
    };
  }

  return {
    schemaVersion: VERIFICATION_EVIDENCE_SCHEMA,
    generatedAt: completedAt ?? new Date().toISOString(),
    target: {
      environment: environment || 'unknown',
      commitSha: commitSha || 'unknown',
      runId: runId || 'unknown',
      operator: operator || 'automation',
      startedAt: startedAt || undefined,
    },
    credentialPolicy: 'host-only; endpoint credentials and raw command output omitted',
    checks,
  };
}

function formatVerificationEvidenceMarkdown(evidence) {
  const lines = [
    '# Durable operation verification',
    '',
    `- Environment: ${evidence.target.environment}`,
    `- Commit: ${evidence.target.commitSha}`,
    `- Run: ${evidence.target.runId}`,
    `- Operator: ${evidence.target.operator}`,
    `- Evidence schema: ${evidence.schemaVersion}`,
    '- Endpoint credentials and raw command output: omitted',
    '',
    '## Checks',
    '',
    '| Check | Outcome | Parsed status |',
    '| --- | --- | --- |',
  ];
  for (const [name, check] of Object.entries(evidence.checks)) {
    lines.push(`| ${name} | ${check.outcome} | ${check.status} |`);
  }
  lines.push('', '## Safe command results', '');
  lines.push('```json', JSON.stringify(evidence.checks, null, 2), '```', '');
  return lines.join('\n');
}

module.exports = {
  VERIFICATION_EVIDENCE_SCHEMA,
  redactText,
  parseLastJsonObject,
  createVerificationEvidence,
  formatVerificationEvidenceMarkdown,
};
