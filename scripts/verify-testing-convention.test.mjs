import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { verifyTestingConvention } from './verify-testing-convention.mjs';

function writeFile(root, relativePath, content) {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}

function createValidFixture(root) {
  const fullSpec = [
    '# Testing Convention',
    '**Spec / Decision ID:** `CA-TESTING-CONVENTION-001`',
    'T1 T2 T3 T4',
    'S1 S2 S3 S4 S5 S6',
  ].join('\n');

  writeFile(root, 'docs/en/context-layered/testing-convention.md', fullSpec);
  writeFile(root, 'docs/ko/context-layered/testing-convention.md', fullSpec);
  writeFile(
    root,
    'docs/en/context-layered/convention-index.md',
    '[Testing](/en/context-layered/testing-convention)'
  );
  writeFile(
    root,
    'docs/ko/context-layered/convention-index.md',
    '[Testing](/ko/context-layered/testing-convention)'
  );
  writeFile(
    root,
    'docs/.vitepress/config/sidebars.ts',
    `const links = ['/en/context-layered/testing-convention', '/ko/context-layered/testing-convention'];`
  );
  const setupSource = `IS_REACT_ACT_ENVIRONMENT = true; const r = /not wrapped in act/i;`;
  writeFile(root, 'packages/react/__tests__/setup.ts', setupSource);
  writeFile(root, 'example/src/test/setup.ts', setupSource);

  for (const rel of [
    'packages/react/__tests__/patterns/testing-convention-scenarios.contract.test.tsx',
    'packages/react/__tests__/patterns/template-react.integration.test.tsx',
    'example/src/pages/patterns/implementation-playbook/CanonicalOrderExample.test.tsx',
    'example/src/pages/foundations/react/headless-di/HeadlessDiPage.test.tsx',
    'example/src/pages/foundations/react/ProviderAndHooksErgonomics.test.tsx',
    'example/src/pages/foundations/store/StoreBackendTransactionsPage.test.tsx',
    'example/src/pages/integrations/headless-interactions/HeadlessInteractionsPage.test.tsx',
  ]) {
    writeFile(root, rel, '// proof');
  }
}

test('real repository passes testing convention and hygiene verification', () => {
  const result = verifyTestingConvention();
  assert.equal(
    result.ok,
    true,
    `Expected 0 errors, got: ${result.errors.join('; ')}`
  );
  assert.equal(result.summary.specId, 'CA-TESTING-CONVENTION-001');
  assert.equal(result.summary.proofFiles, 7);
});

test('fails closed when a disabled test or research report remnant is added under packages/', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ca-testing-hygiene-'));
  try {
    createValidFixture(tempRoot);
    assert.equal(verifyTestingConvention(tempRoot).ok, true);

    writeFile(
      tempRoot,
      'packages/core/__tests__/stale.test.ts.disabled',
      '// disabled test remnant'
    );
    writeFile(
      tempRoot,
      'packages/core/TEST_FAILURE_REPORT.md',
      '# Stale Report'
    );

    const result = verifyTestingConvention(tempRoot);
    assert.equal(result.ok, false);
    assert.ok(
      result.errors.some((e) => e.includes('stale.test.ts.disabled'))
    );
    assert.ok(
      result.errors.some((e) => e.includes('TEST_FAILURE_REPORT.md'))
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('fails closed when a required scenario marker is missing from testing-convention.md', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ca-testing-spec-'));
  try {
    createValidFixture(tempRoot);
    writeFile(
      tempRoot,
      'docs/ko/context-layered/testing-convention.md',
      'CA-TESTING-CONVENTION-001 T1 T2 T3 T4 S1 S2 S3 S4 S5'
    );

    const result = verifyTestingConvention(tempRoot);
    assert.equal(result.ok, false);
    assert.ok(
      result.errors.some(
        (e) => e.includes('ko/context-layered/testing-convention.md') && e.includes('S6')
      )
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
