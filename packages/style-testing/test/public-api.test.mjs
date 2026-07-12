import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { transformSync } from '@babel/core';
import {
  DiffEngine,
  StyleExtractor,
  styleTestPlugin,
} from '../dist/index.js';

test('the Babel plugin creates stable IDs and preserves explicitly supplied IDs', () => {
  const source = `const Button = () => (\n  <button className="flex p-4">Save</button>\n);\n\nfunction Card() {\n  return <section className="fixed" data-style-test="provided-id" />;\n}`;
  const transformed = transformSync(source, {
    babelrc: false,
    configFile: false,
    filename: 'Button.tsx',
    parserOpts: { plugins: ['jsx', 'typescript'] },
    plugins: [styleTestPlugin],
  });

  assert.match(transformed?.code ?? '', /data-style-test="Button:button:2"/);
  assert.match(transformed?.code ?? '', /data-style-test="provided-id"/);
  assert.equal((transformed?.code ?? '').match(/data-style-test=/g)?.length, 2);
});

test('the extractor and diff engine agree on Tailwind-derived styles', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'style-testing-'));
  const sourcePath = path.join(directory, 'Panel.tsx');
  await writeFile(
    sourcePath,
    `export function Panel() {\n  return <section className="fixed flex p-4 bg-white" />;\n}\n`,
  );

  try {
    const extractor = new StyleExtractor();
    extractor.addSourceDirectory(directory);
    const [element] = extractor.extractExpectedStyles();

    assert.deepEqual(element?.expectedStyles, {
      position: 'fixed',
      display: 'flex',
      padding: '1rem',
      backgroundColor: 'rgb(255, 255, 255)',
    });
    assert.equal(element?.testId, 'Panel:section:2');

    const result = new DiffEngine().compare(
      element?.expectedStyles ?? {},
      {
        position: 'fixed',
        display: 'flex',
        paddingTop: '16px',
        paddingRight: '16px',
        paddingBottom: '16px',
        paddingLeft: '16px',
        backgroundColor: '#ffffff',
      },
      element?.testId ?? 'missing',
    );

    assert.equal(result.passed, true);
    assert.deepEqual(result.differences, []);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});
