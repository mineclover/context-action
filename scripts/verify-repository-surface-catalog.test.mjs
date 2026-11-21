import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { verifyRepositorySurfaceCatalog } from './verify-repository-surface-catalog.mjs';

function writeFile(root, relativePath, contents) {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, contents, 'utf8');
}

function createValidFixture(root) {
  writeFile(root, 'README.md', '# Fixture Root\n');
  writeFile(
    root,
    'packages/core/package.json',
    JSON.stringify({
      name: '@context-action/core',
      version: '1.0.0',
      private: false,
      exports: { '.': './dist/index.js' },
    }),
  );
  writeFile(root, 'packages/core/README.md', '# Core\n');
  writeFile(root, 'packages/core/src/index.ts', 'export const ok = true;\n');
  writeFile(root, 'packages/core/docs/core.md', '# Core Docs\n');
  writeFile(root, 'packages/core/examples/demo.ts', 'export const demo = true;\n');

  writeFile(
    root,
    'example/src/App.tsx',
    [
      "import { lazy } from 'react';",
      "const HomePage = lazy(() => import('./pages/HomePage'));",
      'export function App() {',
      '  return <Route path="/" element={<HomePage />} />;',
      '}',
    ].join('\n'),
  );
  writeFile(root, 'demos/bolt-style-editor/README.md', '# Studio\n');
  writeFile(root, 'examples/vanilla-js/README.md', '# Vanilla\n');

  writeFile(root, 'docs/index.md', '# Docs\n');
  writeFile(root, 'docs/LOCAL_FIRST_VERIFICATION_POLICY.md', '# Policy\n');
  writeFile(root, 'docs/en/context-layered/guide.md', '# EN\n');
  writeFile(root, 'docs/ko/context-layered/guide.md', '# KO\n');
  writeFile(root, 'docs/en/concept/c.md', '# EN\n');
  writeFile(root, 'docs/ko/concept/c.md', '# KO\n');
  writeFile(root, 'docs/en/examples/basic.md', '# EN\n');
  writeFile(root, 'docs/ko/examples/basic.md', '# KO\n');
  writeFile(root, 'docs/en/llms/index.md', '# EN\n');
  writeFile(root, 'docs/ko/llms/index.md', '# KO\n');
  writeFile(root, 'docs/en/llms/llms-origin.txt', 'en\n');
  writeFile(root, 'docs/ko/llms/llms-origin.txt', 'ko\n');
  writeFile(root, 'docs/en/guide/start.md', '# EN\n');
  writeFile(root, 'docs/ko/guide/start.md', '# KO\n');
  writeFile(root, 'docs/en/troubleshooting/index.md', '# EN\n');
  writeFile(root, 'docs/ko/troubleshooting/index.md', '# KO\n');
  writeFile(root, 'docs/releases/index.md', '# Releases\n');
  writeFile(root, 'docs/ko/releases/index.md', '# Releases KO\n');
  writeFile(root, 'releases/RELEASE.md', '# Release Ops\n');
  writeFile(root, 'skills/README.md', '# Skills\n');
  writeFile(root, '.agents/skills/README.md', '# Agent Skills\n');

  writeFile(
    root,
    'catalog/repository-surface/api-surface.v1.json',
    JSON.stringify({
      schemaVersion: 'context-action.api-surface/v1',
      specId: 'CA-SURFACE-CATALOG-001',
      layers: ['foundation'],
      stabilities: ['stable'],
      packages: [
        {
          id: 'api-core',
          packageName: '@context-action/core',
          directory: 'packages/core',
          layer: 'foundation',
          visibility: 'public',
          stability: 'stable',
          summary: { en: 'Core runtime', ko: '코어 런타임' },
          nonGoals: ['React UI'],
          exports: [{ subpath: '.', purpose: 'Action pipeline', keySymbols: ['ActionRegister'] }],
          workspaceDependencies: [],
          workspacePeerDependencies: [],
          readme: 'packages/core/README.md',
          authoritativeDocs: ['packages/core/docs/core.md'],
          verificationGate: 'pnpm --filter @context-action/core test',
        },
      ],
    }),
  );

  writeFile(
    root,
    'catalog/repository-surface/example-surface.v1.json',
    JSON.stringify({
      schemaVersion: 'context-action.example-surface/v1',
      specId: 'CA-SURFACE-CATALOG-001',
      exampleAppGroups: [
        {
          id: 'ex-hub',
          category: 'hub',
          summary: { en: 'Hub', ko: '허브' },
          primaryApis: ['ActionRegister'],
          relatedDocs: ['docs/en/guide/start.md'],
          verificationGate: 'pnpm --filter example build',
          routes: [{ path: '/', explains: { en: 'Home', ko: '홈' } }],
        },
      ],
      standaloneDemos: [
        {
          id: 'ex-studio',
          path: 'demos/bolt-style-editor',
          status: 'verified',
          explains: { en: 'Studio', ko: '스튜디오' },
          primaryApis: ['ActionRegister'],
          verificationGate: 'pnpm web-coding:verify',
        },
      ],
      packageExamples: [
        {
          id: 'ex-pkg-core',
          packageName: '@context-action/core',
          path: 'packages/core/examples',
          status: 'verified',
          explains: { en: 'Core demos', ko: '코어 데모' },
          primaryApis: ['ActionRegister'],
          verificationGate: 'pnpm --filter @context-action/core test',
        },
      ],
      narrativeExampleDocs: [
        {
          id: 'ex-doc-basic',
          file: 'basic.md',
          enPath: 'docs/en/examples/basic.md',
          koPath: 'docs/ko/examples/basic.md',
          explains: { en: 'Basic setup', ko: '기본 설정' },
          primaryApis: ['ActionRegister'],
          relatedRoutes: ['/'],
        },
      ],
    }),
  );

  writeFile(
    root,
    'catalog/repository-surface/document-surface.v1.json',
    JSON.stringify({
      schemaVersion: 'context-action.document-surface/v1',
      specId: 'CA-SURFACE-CATALOG-001',
      authorityClasses: ['authoritative', 'discovery', 'evidence', 'derived', 'transitional', 'historical'],
      pairingPolicies: ['strict-paired', 'tracked-partial', 'single-locale', 'derived', 'not-applicable'],
      rootDocuments: [
        {
          id: 'root-readme',
          path: 'README.md',
          authorityClass: 'discovery',
          owner: 'Maintainers',
          purpose: { en: 'Root README', ko: '루트 README' },
          lifecycle: 'active',
        },
      ],
      managedAreas: [
        {
          id: 'doc-context-layered',
          authorityClass: 'authoritative',
          pairingPolicy: 'strict-paired',
          enDir: 'docs/en/context-layered',
          koDir: 'docs/ko/context-layered',
          paths: ['docs/en/context-layered', 'docs/ko/context-layered'],
          owner: 'Maintainers',
          purpose: { en: 'Conventions', ko: '컨벤션' },
          verificationGate: 'pnpm docs:check',
        },
        {
          id: 'doc-guide',
          authorityClass: 'authoritative',
          pairingPolicy: 'tracked-partial',
          enDir: 'docs/en/guide',
          koDir: 'docs/ko/guide',
          paths: ['docs/en/guide', 'docs/ko/guide'],
          knownUnpaired: { onlyEn: [], onlyKo: [] },
          owner: 'Maintainers',
          purpose: { en: 'Guides', ko: '가이드' },
          verificationGate: 'pnpm docs:check',
        },
      ],
      derivedSurfaces: [
        {
          id: 'derived-llms-txt-en-origin',
          path: 'docs/en/llms/llms-origin.txt',
          sourceOfTruth: 'docs/en/**/*.md',
          generatorCommand: 'pnpm docs:llms',
          verificationCommand: 'pnpm llms:check',
        },
      ],
    }),
  );
}

test('real repository passes repository surface catalog verification with expected counts', () => {
  const result = verifyRepositorySurfaceCatalog();
  assert.equal(result.ok, true, `Expected 0 errors, got: ${result.errors.join('; ')}`);
  assert.equal(result.summary.packages, 20);
  assert.equal(result.summary.canonicalRouteCount, 77);
  assert.equal(result.summary.packageExampleCount, 7);
  assert.equal(result.summary.narrativeDocCount, 9);
  assert.equal(result.summary.rootDocumentCount, 9);
});

test('detects API surface drift when a package or export subpath is added without cataloging', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ca-surface-api-'));
  try {
    createValidFixture(tempRoot);
    assert.equal(verifyRepositorySurfaceCatalog(tempRoot).ok, true);

    writeFile(
      tempRoot,
      'packages/core/package.json',
      JSON.stringify({
        name: '@context-action/core',
        version: '1.0.0',
        private: false,
        exports: { '.': './dist/index.js', './extra': './dist/extra.js' },
      }),
    );

    const driftResult = verifyRepositorySurfaceCatalog(tempRoot);
    assert.equal(driftResult.ok, false);
    assert.match(driftResult.errors.join('\n'), /exports.*mismatch/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('detects example surface drift for uncataloged routes or package example directories', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ca-surface-ex-'));
  try {
    createValidFixture(tempRoot);
    writeFile(
      tempRoot,
      'example/src/App.tsx',
      [
        "import { lazy } from 'react';",
        "const HomePage = lazy(() => import('./pages/HomePage'));",
        "const NewPage = lazy(() => import('./pages/NewPage'));",
        'export function App() {',
        '  return (<><Route path="/" element={<HomePage />} /><Route path="/new" element={<NewPage />} /></>);',
        '}',
      ].join('\n'),
    );

    const routeDrift = verifyRepositorySurfaceCatalog(tempRoot);
    assert.equal(routeDrift.ok, false);
    assert.match(routeDrift.errors.join('\n'), /canonicalRoutes: uncataloged entry "\/new"/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('detects document surface drift for uncataloged root markdown or untracked guide pairing drift', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ca-surface-doc-'));
  try {
    createValidFixture(tempRoot);
    writeFile(tempRoot, 'NEW_UNCATALOGED.md', '# Drift\n');
    writeFile(tempRoot, 'docs/en/guide/untranslated.md', '# New EN guide\n');

    const docDrift = verifyRepositorySurfaceCatalog(tempRoot);
    assert.equal(docDrift.ok, false);
    const joined = docDrift.errors.join('\n');
    assert.match(joined, /rootDocuments: uncataloged entry "NEW_UNCATALOGED\.md"/);
    assert.match(joined, /tracked-partial onlyEn mismatch/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
