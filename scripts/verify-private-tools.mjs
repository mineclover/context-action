#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const styleTestingDirectory = path.join(repositoryRoot, 'packages/style-testing');
const rootPackagePath = path.join(repositoryRoot, 'package.json');
const securityPackagePaths = [
  rootPackagePath,
  path.join(repositoryRoot, 'packages/core/package.json'),
  path.join(repositoryRoot, 'packages/react/package.json'),
  path.join(repositoryRoot, 'packages/llms-generator/package.json'),
];

const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

function run(command, args, cwd, environment = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: environment,
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('close', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      const reason = signal ? `signal ${signal}` : `exit code ${code}`;
      reject(new Error(`${command} ${args.join(' ')} failed with ${reason}`));
    });
  });
}

async function verifyPrivateToolIntegrationContract() {
  const rootPackage = JSON.parse(await readFile(rootPackagePath, 'utf8'));
  const scripts = rootPackage.scripts;
  if (scripts === null || typeof scripts !== 'object' || Array.isArray(scripts)) {
    throw new Error('Root package scripts must be an object.');
  }
  if (scripts['security:audit'] !== 'node scripts/security-audit.mjs') {
    throw new Error(
      'Root security:audit must use the repository OSV scanner script.',
    );
  }
  if (scripts['security:audit:all'] !== 'pnpm security:audit') {
    throw new Error(
      'Root security:audit:all must delegate to the repository OSV scanner script.',
    );
  }
  for (const packagePath of securityPackagePaths.slice(1)) {
    const packageManifest = JSON.parse(await readFile(packagePath, 'utf8'));
    if (packageManifest.scripts?.['security:audit'] !== 'pnpm --workspace-root security:audit') {
      throw new Error(
        `Package ${path.relative(repositoryRoot, packagePath)} must delegate security:audit to the workspace root.`,
      );
    }
  }

}

await verifyPrivateToolIntegrationContract();

await run(pnpmCommand, ['type-check'], styleTestingDirectory);
await run(pnpmCommand, ['test'], styleTestingDirectory);
console.log('Verified workspace-only tool package.');
