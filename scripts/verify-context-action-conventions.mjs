import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

const checks = [
  ['Context-Layered layout', 'scripts/check-context-layered-conventions.mjs'],
  [
    'documentation management',
    'scripts/verify-documentation-management.mjs',
  ],
  ['example use-case recipe', 'scripts/verify-live-usecase-conventions.mjs'],
  [
    'MCP/function-calling catalog',
    'scripts/verify-mcp-function-calling-catalog.mjs',
  ],
  ['integration profile catalog', 'scripts/verify-integration-profile-catalog.mjs'],
  [
    'standalone Web Studio boundaries',
    'scripts/verify-web-coding-conventions.mjs',
  ],
  ['Mutative upstream baseline', 'scripts/verify-mutative-upstream.mjs'],
  ['Mutative upstream verifier tests', 'scripts/verify-mutative-upstream.test.mjs', ['--test']],
];

for (const [label, relativeScript, argumentsList = []] of checks) {
  console.log(`\n[Context-Action convention] ${label}`);
  const result = spawnSync(
    process.execPath,
    [...argumentsList, path.join(repositoryRoot, relativeScript)],
    { cwd: repositoryRoot, stdio: 'inherit' }
  );

  if (result.error) {
    throw new Error(
      `Could not run ${relativeScript}: ${result.error.message}`
    );
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('\nVerified Context-Action convention and use-case boundaries.');
