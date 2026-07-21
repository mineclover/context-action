import fs from 'node:fs';
import path from 'node:path';
import evidenceModule from './verification-evidence.cjs';

const {
  createVerificationEvidence,
  formatVerificationEvidenceMarkdown,
} = evidenceModule;

function readOption(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const inputDirectory = path.resolve(
  readOption('--input', 'reports/durable-operation/raw')
);
const outputDirectory = path.resolve(
  readOption('--output', 'reports/durable-operation/evidence')
);

fs.mkdirSync(outputDirectory, { recursive: true });

const evidence = createVerificationEvidence({
  inputDirectory,
  environment: process.env.TARGET_ENVIRONMENT,
  commitSha: process.env.COMMIT_SHA,
  runId: process.env.RUN_ID,
  operator: process.env.OPERATOR,
  startedAt: process.env.STARTED_AT,
  completedAt: process.env.COMPLETED_AT,
  outcomes: {
    preflight: process.env.PREFLIGHT_RESULT,
    redis: process.env.REDIS_RESULT,
    integration: process.env.INTEGRATION_RESULT,
    postgres: process.env.POSTGRES_RESULT,
    queue: process.env.QUEUE_RESULT,
  },
  secrets: [
    process.env.REDIS_URL,
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
  ].filter(Boolean),
});

fs.writeFileSync(
  path.join(outputDirectory, 'evidence.json'),
  `${JSON.stringify(evidence, null, 2)}\n`,
  'utf8'
);
fs.writeFileSync(
  path.join(outputDirectory, 'evidence.md'),
  formatVerificationEvidenceMarkdown(evidence),
  'utf8'
);

console.log(`Wrote sanitized durable-operation evidence to ${outputDirectory}`);
