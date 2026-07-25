import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';

const schemaPath = path.resolve(
  'packages/tool-durable-operations/spec/durable-operation-verification-evidence.schema.json',
);
const evidencePath = path.resolve(
  process.argv.includes('--file')
    ? process.argv[process.argv.indexOf('--file') + 1]
    : 'reports/durable-operation/evidence/evidence.json',
);

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
const requireSuccess = process.argv.includes('--require-success');
const ajv = new Ajv2020({ strict: true, validateFormats: false });
const validate = ajv.compile(schema);
if (!validate(evidence)) {
  console.error(JSON.stringify({ status: 'invalid', file: evidencePath, errors: validate.errors }, null, 2));
  process.exit(2);
}

if (requireSuccess) {
  const incomplete = Object.entries(evidence.checks)
    .filter(([, check]) =>
      check.outcome !== 'success' ||
      check.available !== true ||
      check.status !== 'ok' ||
      check.result?.status !== 'ok'
    )
    .map(([name, check]) => ({
      name,
      outcome: check.outcome,
      available: check.available,
      status: check.status,
      resultStatus: check.result?.status ?? null,
    }));

  if (incomplete.length > 0) {
    console.error(JSON.stringify({
      status: 'incomplete',
      file: evidencePath,
      checks: incomplete,
    }, null, 2));
    process.exit(3);
  }
}

console.log(JSON.stringify({ status: 'ok', schemaVersion: evidence.schemaVersion, file: evidencePath }));
