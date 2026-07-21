import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const REQUIRED_FILES = [
  'package.json',
  'packages/tool-durable-operations/package.json',
  'packages/tool-durable-operations/scripts/verify-durable-operation-env.mjs',
  'packages/tool-durable-operations/scripts/verify-redis.mjs',
  'packages/tool-durable-operations/scripts/verify-postgres.mjs',
  'packages/tool-durable-operations/scripts/verify-queue-side-effect.mjs',
  'packages/tool-durable-operations/scripts/write-verification-evidence.mjs',
  'packages/tool-durable-operations/spec/durable-operation-verification-evidence.schema.json',
  'scripts/verify-durable-operation-evidence-schema.mjs',
];

export const REQUIRED_PACKAGE_SCRIPTS = [
  { packagePath: 'package.json', name: 'tool-durable:verify:env' },
  { packagePath: 'package.json', name: 'tool-durable:verify:redis' },
  { packagePath: 'package.json', name: 'tool-durable:verify:postgres' },
  { packagePath: 'package.json', name: 'tool-durable:verify:queue' },
  { packagePath: 'package.json', name: 'tool-durable:verify:evidence' },
  { packagePath: 'packages/tool-durable-operations/package.json', name: 'test' },
  { packagePath: 'packages/tool-durable-operations/package.json', name: 'verify:redis' },
  { packagePath: 'packages/tool-durable-operations/package.json', name: 'verify:postgres' },
  { packagePath: 'packages/tool-durable-operations/package.json', name: 'verify:queue' },
  { packagePath: 'packages/tool-durable-operations/package.json', name: 'verify:env' },
];

export const REQUIRED_WORKFLOW_MARKERS = [
  'workflow_dispatch:',
  'default: staging',
  'options:',
  '          - staging',
  '          - production',
  'environment:',
  'name: durable-${{ inputs.environment }}',
  'REDIS_URL: ${{ secrets.REDIS_URL }}',
  'DATABASE_URL: ${{ secrets.DATABASE_URL }}',
  'DURABLE_OPERATION_ENVIRONMENT: ${{ inputs.environment }}',
  'pnpm tool-durable:verify:env',
  'pnpm tool-durable:verify:redis',
  'pnpm --filter @context-action/tool-durable-operations test',
  'pnpm tool-durable:verify:postgres',
  'pnpm tool-durable:verify:queue',
  'reports/durable-operation/raw',
  'reports/durable-operation/evidence',
  'packages/tool-durable-operations/scripts/write-verification-evidence.mjs',
  'pnpm tool-durable:verify:evidence',
  'path: reports/durable-operation/evidence',
  'retention-days: 14',
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function inspectDurableOperationWorkflow({ rootDirectory = root } = {}) {
  const targetWorkflowPath = path.join(
    rootDirectory,
    '.github/workflows/verify-durable-operations.yml'
  );
  assert(fs.existsSync(targetWorkflowPath), 'durable-operation verification workflow is missing');
  const workflow = fs.readFileSync(targetWorkflowPath, 'utf8');
  const missingMarkers = REQUIRED_WORKFLOW_MARKERS.filter(
    (marker) => !workflow.includes(marker)
  );
  assert(
    missingMarkers.length === 0,
    `durable-operation workflow is missing contract markers: ${missingMarkers.join(', ')}`
  );

  const missingFiles = REQUIRED_FILES.filter(
    (file) => !fs.existsSync(path.join(rootDirectory, file))
  );
  assert(
    missingFiles.length === 0,
    `durable-operation workflow references missing files: ${missingFiles.join(', ')}`
  );

  const missingScripts = [];
  for (const { packagePath, name } of REQUIRED_PACKAGE_SCRIPTS) {
    const manifestPath = path.join(rootDirectory, packagePath);
    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch {
      missingScripts.push(`${packagePath}#${name}`);
      continue;
    }
    if (typeof manifest.scripts?.[name] !== 'string' || !manifest.scripts[name].trim()) {
      missingScripts.push(`${packagePath}#${name}`);
    }
  }
  assert(
    missingScripts.length === 0,
    `durable-operation workflow references missing package scripts: ${missingScripts.join(', ')}`
  );

  // Raw command logs may remain in the run log, but the uploaded artifact must
  // be restricted to the sanitized evidence directory.
  assert(
    !/path:\s*reports\/durable-operation\/raw/.test(workflow),
    'durable-operation workflow must not upload raw command logs'
  );
  return {
    workflowPath: path.relative(rootDirectory, targetWorkflowPath),
    requiredFiles: REQUIRED_FILES.length,
    requiredMarkers: REQUIRED_WORKFLOW_MARKERS.length,
    requiredScripts: REQUIRED_PACKAGE_SCRIPTS.length,
  };
}

function main() {
  const result = inspectDurableOperationWorkflow();
  console.log(
    `Verified durable-operation workflow contract (${result.requiredMarkers} markers, ${result.requiredFiles} files, ${result.requiredScripts} scripts).`
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'durable-operation workflow contract is invalid');
    process.exitCode = 2;
  }
}
