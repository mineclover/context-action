#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultRepositoryRoot = path.resolve(scriptDirectory, '..');

const REQUIRED_TIER_MARKERS = ['T1', 'T2', 'T3', 'T4'];
const REQUIRED_SCENARIO_MARKERS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];

const CANONICAL_PROOF_FILES = [
  'packages/react/__tests__/patterns/testing-convention-scenarios.contract.test.tsx',
  'packages/react/__tests__/patterns/template-react.integration.test.tsx',
  'example/src/pages/patterns/implementation-playbook/CanonicalOrderExample.test.tsx',
  'example/src/pages/foundations/react/headless-di/HeadlessDiPage.test.tsx',
  'example/src/pages/foundations/react/ProviderAndHooksErgonomics.test.tsx',
  'example/src/pages/foundations/store/StoreBackendTransactionsPage.test.tsx',
  'example/src/pages/integrations/headless-interactions/HeadlessInteractionsPage.test.tsx',
];

const BANNED_PACKAGE_REMNANTS = new Set([
  'ACTIONREGISTER_IMPROVEMENTS.md',
  'CONCURRENCY_TEST_REPORT.md',
  'IMPROVEMENT_GUIDE.md',
  'TEST_FAILURE_REPORT.md',
  'TEST_MANAGEMENT_GUIDE.md',
  'TEST_SCENARIOS_SUMMARY.md',
  'bundle-analysis.md',
  'TEST_STRUCTURE.md',
]);

const BANNED_PACKAGE_RELATIVE_REMNANTS = new Set([
  'packages/core/MIGRATION_GUIDE.md',
]);

function toPosix(relativePath) {
  return relativePath.split(path.sep).join('/');
}

function readIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

function scanPackageHygiene(repositoryRoot, errors) {
  const packagesDir = path.join(repositoryRoot, 'packages');
  if (!fs.existsSync(packagesDir)) return;

  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
        continue;
      }

      const relPath = toPosix(path.relative(repositoryRoot, fullPath));
      if (entry.name.endsWith('.disabled')) {
        errors.push(`disabled test or leftover file forbidden: ${relPath}`);
      }
      if (
        BANNED_PACKAGE_REMNANTS.has(entry.name) ||
        BANNED_PACKAGE_RELATIVE_REMNANTS.has(relPath)
      ) {
        errors.push(`legacy research/report remnant forbidden: ${relPath}`);
      }
    }
  };

  visit(packagesDir);
}

export function verifyTestingConvention(
  repositoryRoot = defaultRepositoryRoot
) {
  const errors = [];

  // 1. Verify EN/KO canonical testing-convention specs
  for (const [locale, relPath] of [
    ['en', 'docs/en/context-layered/testing-convention.md'],
    ['ko', 'docs/ko/context-layered/testing-convention.md'],
  ]) {
    const content = readIfExists(path.join(repositoryRoot, relPath));
    if (content === null) {
      errors.push(`missing canonical testing convention doc (${locale}): ${relPath}`);
      continue;
    }
    if (!content.includes('CA-TESTING-CONVENTION-001')) {
      errors.push(`${relPath}: missing CA-TESTING-CONVENTION-001 spec id`);
    }
    for (const marker of REQUIRED_TIER_MARKERS) {
      if (!new RegExp(`\\b${marker}\\b`).test(content)) {
        errors.push(`${relPath}: missing required test tier marker ${marker}`);
      }
    }
    for (const marker of REQUIRED_SCENARIO_MARKERS) {
      if (!new RegExp(`\\b${marker}\\b`).test(content)) {
        errors.push(
          `${relPath}: missing required canonical scenario marker ${marker}`
        );
      }
    }
  }

  // 2. Verify convention-index discovery links and VitePress sidebars
  for (const [relPath, expectedLink] of [
    [
      'docs/en/context-layered/convention-index.md',
      '/en/context-layered/testing-convention',
    ],
    [
      'docs/ko/context-layered/convention-index.md',
      '/ko/context-layered/testing-convention',
    ],
    [
      'docs/.vitepress/config/sidebars.ts',
      '/en/context-layered/testing-convention',
    ],
    [
      'docs/.vitepress/config/sidebars.ts',
      '/ko/context-layered/testing-convention',
    ],
  ]) {
    const content = readIfExists(path.join(repositoryRoot, relPath));
    if (content === null) {
      errors.push(`missing navigation/index file: ${relPath}`);
    } else if (!content.includes(expectedLink)) {
      errors.push(`${relPath}: missing link ${expectedLink}`);
    }
  }

  // 3. Verify strict React act() environment setups
  for (const relPath of [
    'packages/react/__tests__/setup.ts',
    'example/src/test/setup.ts',
  ]) {
    const content = readIfExists(path.join(repositoryRoot, relPath));
    if (content === null) {
      errors.push(`missing test setup file: ${relPath}`);
      continue;
    }
    if (!content.includes('IS_REACT_ACT_ENVIRONMENT')) {
      errors.push(`${relPath}: must enable IS_REACT_ACT_ENVIRONMENT`);
    }
    if (!content.includes('not wrapped in act')) {
      errors.push(`${relPath}: must fail on "not wrapped in act" diagnostics`);
    }
  }

  // 4. Verify all canonical proof suites exist
  for (const relPath of CANONICAL_PROOF_FILES) {
    if (!fs.existsSync(path.join(repositoryRoot, relPath))) {
      errors.push(`missing canonical proof test file: ${relPath}`);
    }
  }

  // 5. Enforce clean packages/ hygiene (no .disabled or legacy research reports)
  scanPackageHygiene(repositoryRoot, errors);

  return {
    ok: errors.length === 0,
    errors,
    summary: {
      specId: 'CA-TESTING-CONVENTION-001',
      tiers: REQUIRED_TIER_MARKERS,
      scenarios: REQUIRED_SCENARIO_MARKERS,
      proofFiles: CANONICAL_PROOF_FILES.length,
    },
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const result = verifyTestingConvention();
  if (!result.ok) {
    console.error('Testing convention verification failed:');
    for (const error of result.errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }
  console.log(
    JSON.stringify({
      status: 'ok',
      ...result.summary,
    })
  );
}
