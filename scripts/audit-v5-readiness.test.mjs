import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { auditV5Readiness } from './audit-v5-readiness.mjs';

const execFileAsync = promisify(execFile);
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scriptPath = path.join(repositoryRoot, 'scripts', 'audit-v5-readiness.mjs');

async function runCli(args) {
  try {
    const result = await execFileAsync(process.execPath, [scriptPath, ...args], {
      cwd: repositoryRoot,
    });
    return { code: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    return { code: error.code ?? 1, stdout: error.stdout ?? '', stderr: error.stderr ?? '' };
  }
}

test('packages/template-react passes --strict-template with zero blocking findings', async () => {
  const result = await runCli(['--strict-template', '--json']);
  assert.equal(result.code, 0, result.stderr);

  const report = JSON.parse(result.stdout);
  assert.equal(report.strictPassed, true);
  assert.equal(report.scopes.template.blockingTotal, 0);
  assert.deepEqual(report.scopes.template.counts, {
    deprecatedApis: 0,
    rootSubpathImports: 0,
    manualImmediateDispatches: 0,
    implicitStoreNotificationMode: report.scopes.template.counts.implicitStoreNotificationMode,
  });
});

test('AST scanner accurately classifies all v5 readiness categories and ignores comments/strings', async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'ca-v5-audit-'));
  try {
    const srcDir = path.join(tempRoot, 'packages/template-react/src');
    await mkdir(srcDir, { recursive: true });

    await writeFile(
      path.join(srcDir, 'sample.tsx'),
      [
        "import { createActionContext, createRefContext, createStoreContext } from '@context-action/react';",
        '',
        '// Comment should be ignored: createRefContext useActionDispatchWithResult { immediate: true }',
        "const literalShouldBeIgnored = 'useActionEffectHandler compareStrategy StoreSchema';",
        '',
        'const ActionCtx = createActionContext<{ go: void }>("Sample", {});',
        'const { useActionDispatchWithResult: useScopedResult } = ActionCtx;',
        '',
        'const Stores = createStoreContext("Stores", {',
        '  plain: 0,',
        "  explicit: { initialValue: 1, notificationMode: 'batched' },",
        "  legacyAlias: { initialValue: 2, compareStrategy: 'deep' },",
        '});',
        '',
        'export function trigger(dispatch: any) {',
        '  void literalShouldBeIgnored;',
        '  void useScopedResult;',
        '  void Stores;',
        '  void createRefContext;',
        "  dispatch('go', undefined, { immediate: true });",
        "  dispatch('go', undefined, { immediate: false });",
        '}',
        '',
      ].join('\n'),
      'utf8'
    );

    const report = auditV5Readiness({ root: tempRoot, strictTemplate: true });
    assert.equal(report.strictPassed, false);
    assert.equal(report.totals.deprecatedApis, 2);
    assert.equal(report.totals.rootSubpathImports, 1);
    assert.equal(report.totals.manualImmediateDispatches, 1);
    assert.equal(report.totals.implicitStoreNotificationMode, 2);

    const cliResult = await runCli(['--root', tempRoot, '--strict-template', '--json']);
    assert.equal(cliResult.code, 1);
    assert.match(cliResult.stderr, /blocking finding/);
    const cliReport = JSON.parse(cliResult.stdout);
    assert.equal(cliReport.strictPassed, false);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test('AST scanner passes --strict-template on synthetic v5-ready consumer code', async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'ca-v5-audit-clean-'));
  try {
    const srcDir = path.join(tempRoot, 'src');
    await mkdir(srcDir, { recursive: true });

    await writeFile(
      path.join(srcDir, 'clean.ts'),
      [
        "import { createActionContext, createStoreContext } from '@context-action/react';",
        "import { createRefContext } from '@context-action/react/refs';",
        "import { createTimeTravelStore } from '@context-action/react/time-travel';",
        '',
        "export const Actions = createActionContext<{ reset: void }>('Clean', {",
        "  actions: { reset: { queue: 'immediate' } },",
        '});',
        "export const Stores = createStoreContext('Stores', {",
        "  count: { initialValue: 0, notificationMode: 'immediate' },",
        '});',
        "export const History = createTimeTravelStore('history', { v: 1 }, { notificationMode: 'batched' });",
        "export const Refs = createRefContext('Refs', { input: { name: 'input' } });",
        '',
      ].join('\n'),
      'utf8'
    );

    const cliResult = await runCli(['--root', tempRoot, '--strict-template', '--json']);
    assert.equal(cliResult.code, 0, cliResult.stderr);
    const cliReport = JSON.parse(cliResult.stdout);
    assert.equal(cliReport.strictPassed, true);
    assert.equal(cliReport.blockingTotal, 0);
    assert.equal(cliReport.informationalTotal, 0);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});
