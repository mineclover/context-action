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
const ajv = new Ajv2020({ strict: true, validateFormats: false });
const validate = ajv.compile(schema);
if (!validate(evidence)) {
  console.error(JSON.stringify({ status: 'invalid', file: evidencePath, errors: validate.errors }, null, 2));
  process.exit(2);
}
console.log(JSON.stringify({ status: 'ok', schemaVersion: evidence.schemaVersion, file: evidencePath }));
