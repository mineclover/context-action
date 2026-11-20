import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { transformSync } from '@babel/core';
import {
  DiffEngine,
  Reporter,
  resolveTailwindClasses,
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

test('reports shorthand mismatches, preserves transparent alpha colors, avoids NaN% and NaNrem', () => {
  const engine = new DiffEngine({ tolerance: 0 });
  const shorthandMismatch = engine.compare(
    { padding: '2rem', backgroundColor: '#FFF', color: 'rgba(0, 0, 0, 0)' },
    {
      paddingTop: '16px',
      paddingRight: '16px',
      paddingBottom: '16px',
      paddingLeft: '16px',
      backgroundColor: 'rgb(255, 255, 255)',
      color: 'rgb(0, 0, 0)',
    },
    'box:1'
  );
  assert.equal(shorthandMismatch.passed, false);
  assert.deepEqual(
    shorthandMismatch.differences.map((d) => d.property),
    ['padding', 'color']
  );

  const md = new Reporter().toMarkdown([]);
  assert.equal(md.includes('Pass Rate: 0.0%'), true);
  assert.equal(md.includes('NaN'), false);

  const resolved = resolveTailwindClasses('p-px p-[12px] p-auto m-foo');
  assert.equal(resolved.padding, '12px');
  assert.equal(resolved.margin, undefined);
  assert.equal(JSON.stringify(resolved).includes('NaN'), false);
});
