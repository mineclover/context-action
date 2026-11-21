import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  generateLlmsBundles,
  syncLlmsBundles,
} from './sync-llms-bundles.mjs';

function writeDoc(root, relativePath, contents) {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, contents, 'utf8');
}

function createFixtureDocs(root) {
  writeDoc(
    root,
    'docs/en/context-layered/conventions.md',
    [
      '---',
      'title: Conventions',
      '---',
      '',
      '# Conventions',
      '',
      'Authoritative layer separation rules.',
      '',
      '## Layer Boundaries',
      '',
      'Keep domain handlers isolated.',
      '',
    ].join('\n'),
  );
  writeDoc(
    root,
    'docs/en/guide/getting-started.md',
    [
      '# Getting Started',
      '',
      'Install `@context-action/react` and create an ActionContext.',
      '',
      '## Setup',
      '',
      '```ts',
      'const ctx = createActionContext("demo");',
      '```',
      '',
    ].join('\n'),
  );
  writeDoc(
    root,
    'docs/en/llms/index.md',
    '# LLMS Resources\n\nShould not be included in generated bundles.\n',
  );
  writeDoc(
    root,
    'docs/ko/context-layered/conventions.md',
    [
      '# 컨벤션',
      '',
      '계층 분리 규칙을 설명합니다.',
      '',
      '## 레이어 경계',
      '',
      '도메인 핸들러를 UI와 분리합니다.',
      '',
    ].join('\n'),
  );
  writeDoc(
    root,
    'docs/ko/llms/index.md',
    '# LLMS 리소스\n\n번들에 재포함되면 안 됩니다.\n',
  );
}

test('writes deterministic LLMS bundles, excludes docs/*/llms, and passes check', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ca-llms-bundles-'));
  try {
    createFixtureDocs(tempRoot);

    const writeResult = syncLlmsBundles({ repositoryRoot: tempRoot, write: true });
    assert.equal(writeResult.ok, true);
    assert.equal(writeResult.written.length, 6);
    assert.deepEqual(writeResult.summaryByLocale, { en: 2, ko: 1 });

    const minimalEn = fs.readFileSync(
      path.join(tempRoot, 'docs/en/llms/llms-minimal.txt'),
      'utf8',
    );
    const originEn = fs.readFileSync(
      path.join(tempRoot, 'docs/en/llms/llms-origin.txt'),
      'utf8',
    );
    const chars500En = fs.readFileSync(
      path.join(tempRoot, 'docs/en/llms/llms-500chars.txt'),
      'utf8',
    );

    assert.equal(minimalEn.includes(tempRoot), false);
    assert.equal(minimalEn.includes('docs/en/llms/index.md'), false);
    assert.match(minimalEn, /docs\/en\/context-layered\/conventions\.md/);
    assert.match(minimalEn, /docs\/en\/guide\/getting-started\.md/);

    assert.equal(
      originEn.match(/===================\[ DOC: en\/context-layered\/conventions\.md \]===/g)
        ?.length,
      1,
    );
    assert.equal(
      originEn.match(/===================\[ DOC: en\/guide\/getting-started\.md \]===/g)
        ?.length,
      1,
    );
    assert.equal(originEn.includes('Should not be included'), false);
    assert.match(chars500En, /# Conventions/);

    const secondPass = generateLlmsBundles(tempRoot);
    assert.deepEqual(
      secondPass.outputs.map((item) => item.content),
      writeResult.outputs.map((item) => item.content),
    );

    const checkResult = syncLlmsBundles({ repositoryRoot: tempRoot, write: false });
    assert.equal(checkResult.ok, true);
    assert.equal(checkResult.drifted.length, 0);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('detects drift when a source doc or generated bundle changes', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ca-llms-drift-'));
  try {
    createFixtureDocs(tempRoot);
    syncLlmsBundles({ repositoryRoot: tempRoot, write: true });

    writeDoc(
      tempRoot,
      'docs/en/guide/getting-started.md',
      '# Getting Started\n\nUpdated content after generation.\n',
    );

    const sourceDrift = syncLlmsBundles({ repositoryRoot: tempRoot, write: false });
    assert.equal(sourceDrift.ok, false);
    assert.ok(
      sourceDrift.drifted.some(
        (item) => item.relativePath === 'docs/en/llms/llms-origin.txt',
      ),
    );

    syncLlmsBundles({ repositoryRoot: tempRoot, write: true });
    fs.writeFileSync(
      path.join(tempRoot, 'docs/ko/llms/llms-minimal.txt'),
      'stale manual edit\n',
      'utf8',
    );

    const bundleDrift = syncLlmsBundles({ repositoryRoot: tempRoot, write: false });
    assert.equal(bundleDrift.ok, false);
    assert.deepEqual(bundleDrift.drifted, [
      { relativePath: 'docs/ko/llms/llms-minimal.txt', reason: 'out-of-sync' },
    ]);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
