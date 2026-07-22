#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const styleTestingDirectory = path.join(repositoryRoot, 'packages/style-testing');
const architectureGovernanceDirectory = path.join(
  repositoryRoot,
  'packages/architecture-governance',
);
const ciWorkflowPath = path.join(repositoryRoot, '.github/workflows/ci.yml');
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

async function verifyArchitectureIntegrationContract() {
  const githubExpression = (expression) => `$${'{' + '{'} ${expression} }}`;
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

  const expectedArchitectureScripts = {
    'arch:build':
      'pnpm --filter @context-action/architecture-governance build',
    'arch:type-check':
      'pnpm --filter @context-action/sem-foundation-contracts type-check && pnpm --filter @context-action/sem-foundation-repository type-check && pnpm --filter @context-action/architecture-governance type-check',
    'arch:check':
      'pnpm arch:build && node packages/architecture-governance/dist/cli.js check --root . --registry architecture/registry.json --sem',
    'arch:check:changed':
      'pnpm arch:build && node packages/architecture-governance/dist/cli.js check --root . --registry architecture/registry.json --sem --changed',
    'arch:check:staged':
      'pnpm arch:build && node packages/architecture-governance/dist/cli.js check --root . --registry architecture/registry.json --sem --staged',
    'arch:check:registry':
      'pnpm arch:build && node packages/architecture-governance/dist/cli.js check --root . --registry architecture/registry.json',
  };
  for (const [name, expected] of Object.entries(expectedArchitectureScripts)) {
    if (scripts[name] !== expected) {
      throw new Error(`Root package script ${name} must be: ${expected}`);
    }
  }

  const verifyAll = scripts['verify:all'];
  if (typeof verifyAll !== 'string') {
    throw new Error('Root package script verify:all must be a string.');
  }
  const verifySteps = verifyAll.split('&&').map((step) => step.trim());
  const privateToolsIndex = verifySteps.indexOf('pnpm verify:private-tools');
  const architectureIndex = verifySteps.indexOf('pnpm arch:check');
  if (
    privateToolsIndex === -1 ||
    architectureIndex === -1 ||
    architectureIndex <= privateToolsIndex
  ) {
    throw new Error(
      'verify:all must run pnpm arch:check after pnpm verify:private-tools.',
    );
  }

  const workflow = await readFile(ciWorkflowPath, 'utf8');
  if (workflow.includes('pnpm audit --audit-level high')) {
    throw new Error(
      'CI must not call pnpm audit through the retired npm audit endpoint.',
    );
  }
  if (
    !workflow.includes(
      'google/osv-scanner-action/.github/workflows/osv-scanner-reusable.yml@v2.3.8',
    )
    || !workflow.includes('--lockfile=pnpm-lock.yaml')
  ) {
    throw new Error(
      'CI security job must use the pinned OSV scanner workflow for pnpm-lock.yaml.',
    );
  }
  const workflowLines = workflow.split(/\r?\n/u).map((line) => line.trim());
  const getWorkflowStep = (name) => {
    const header = `- name: ${name}`;
    const start = workflowLines.indexOf(header);
    if (start === -1) {
      throw new Error(`Architecture CI contract is missing step: ${name}`);
    }
    const nextStepOffset = workflowLines
      .slice(start + 1)
      .findIndex((line) => line.startsWith('- name: '));
    const end = nextStepOffset === -1 ? workflowLines.length : start + 1 + nextStepOffset;
    return workflowLines.slice(start, end);
  };
  const requireStepLines = (stepName, requiredLines) => {
    const stepLines = getWorkflowStep(stepName);
    for (const line of requiredLines) {
      if (!stepLines.includes(line)) {
        throw new Error(
          `Architecture CI step ${stepName} is missing line: ${line}`,
        );
      }
    }
  };

  requireStepLines('Checkout', ['fetch-depth: 0']);
  requireStepLines('Verify full repository', ['run: pnpm verify:all']);
  requireStepLines('Report architecture change scope', [
    `if: ${githubExpression("github.event_name == 'pull_request' && always()")}`,
    'pnpm arch:build || status=$?',
    'if [[ "$status" -eq 0 ]]; then',
    '--root . \\',
    '--registry architecture/registry.json \\',
    '--sem \\',
    `--from "${githubExpression('github.event.pull_request.base.sha')}" \\`,
    `--to "${githubExpression('github.event.pull_request.head.sha')}" \\`,
    '--format markdown \\',
    '--output reports/architecture/pr-report.md || status=$?',
    'cat reports/architecture/pr-report.md >> "$GITHUB_STEP_SUMMARY"',
    'exit "$status"',
  ]);
  requireStepLines('Upload architecture report', [
    `if: ${githubExpression("github.event_name == 'pull_request' && always()")}`,
    'uses: actions/upload-artifact@v6',
    `name: architecture-report-${githubExpression('matrix.node-version')}`,
    'path: reports/architecture/pr-report.md',
    'if-no-files-found: ignore',
    'retention-days: 7',
  ]);
}

await verifyArchitectureIntegrationContract();

await run(pnpmCommand, ['type-check'], styleTestingDirectory);
await run(pnpmCommand, ['test'], styleTestingDirectory);
await run(pnpmCommand, ['type-check'], architectureGovernanceDirectory);
await run(pnpmCommand, ['test'], architectureGovernanceDirectory);
console.log('Verified workspace-only tool packages.');
