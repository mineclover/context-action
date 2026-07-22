#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(packageRoot, '../..');
const foundationPackages = [
  ['@context-action/sem-foundation-contracts', 'packages/sem-foundation'],
  ['@context-action/sem-foundation-repository', 'packages/sem-foundation-repository'],
];

const forceExternalDependencies = process.env.ARCHITECTURE_GOVERNANCE_FOUNDATION_SOURCE === 'external';
const localFoundationCopies = !forceExternalDependencies && foundationPackages.every(([, relativePath]) => (
  existsSync(path.join(repositoryRoot, relativePath, 'package.json'))
));

if (localFoundationCopies) {
  for (const [name] of foundationPackages) {
    execFileSync('pnpm', ['--filter', name, 'build'], {
      cwd: repositoryRoot,
      stdio: 'inherit',
    });
  }
  process.stdout.write('Prepared Architecture Governance with local Foundation migration copies.\n');
} else {
  const require = createRequire(import.meta.url);
  for (const [name] of foundationPackages) {
    try {
      require.resolve(name, { paths: [packageRoot] });
    } catch (error) {
      throw new Error(
        `Missing installed Foundation dependency ${name}. Install the published tooling packages before building Architecture Governance.`,
        { cause: error },
      );
    }
  }
  process.stdout.write('Prepared Architecture Governance with installed Foundation packages.\n');
}
