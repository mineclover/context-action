import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const reactVersion = args.get('--react-version');
const reactTypesVersion = args.get('--react-types');
const reactDomTypesVersion = args.get('--react-dom-types');
if (!reactVersion || !reactTypesVersion || !reactDomTypesVersion) {
  throw new Error('Expected --react-version, --react-types, and --react-dom-types.');
}

const consumer = mkdtempSync(join(tmpdir(), 'context-action-react-compat-'));
try {
  const coreTarball = execFileSync(
    'npm',
    ['pack', resolve(root, 'packages/core'), '--pack-destination', consumer, '--silent'],
    { cwd: root, encoding: 'utf8' },
  ).trim().split('\n').at(-1);
  const reactTarball = execFileSync(
    'npm',
    ['pack', resolve(root, 'packages/react'), '--pack-destination', consumer, '--silent'],
    { cwd: root, encoding: 'utf8' },
  ).trim().split('\n').at(-1);
  if (!coreTarball || !reactTarball) throw new Error('Failed to create package tarballs.');

  writeFileSync(join(consumer, 'package.json'), JSON.stringify({
    name: 'context-action-react-compat-consumer',
    private: true,
    type: 'module',
  }));
  execFileSync(
    'npm',
    [
      'install', '--no-save', '--ignore-scripts',
      `react@${reactVersion}`,
      `react-dom@${reactVersion}`,
      `@types/react@${reactTypesVersion}`,
      `@types/react-dom@${reactDomTypesVersion}`,
      'typescript@6.0.3',
      join(consumer, coreTarball),
      join(consumer, reactTarball),
    ],
    { cwd: consumer, stdio: 'inherit' },
  );

  writeFileSync(join(consumer, 'consumer.tsx'), `
import React from 'react';
import type { ExecutionResult } from '@context-action/core';
import { createActionContext } from '@context-action/react';

interface Actions { save: { id: string }; reset: void }
interface Results { save: { accepted: boolean } }
const Context = createActionContext<Actions, Results>('Compatibility');

function Consumer() {
  Context.useActionHandler('save', async payload => ({ accepted: payload.id.length > 0 }));
  const api = Context.useActionDispatchWithResult();
  const result: Promise<ExecutionResult<Results['save']>> =
    api.dispatchWithResult('save', { id: 'compatibility' });
  void result;
  return React.createElement('div');
}

void Consumer;
`);
  writeFileSync(join(consumer, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      strict: true,
      skipLibCheck: true,
      noEmit: true,
      jsx: 'react-jsx',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
    },
    include: ['consumer.tsx'],
  }));
  execFileSync(join(consumer, 'node_modules/.bin/tsc'), ['--project', join(consumer, 'tsconfig.json')], {
    cwd: consumer,
    stdio: 'inherit',
  });
  writeFileSync(join(consumer, 'consumer-runtime.mjs'), `
import React from 'react';
import { renderToString } from 'react-dom/server';
import { createActionContext } from '@context-action/react';

const Context = createActionContext('CompatibilityRuntime');
function Consumer() {
  Context.useActionEffectHandler('save', () => {});
  return React.createElement('div', { 'data-context-action': 'ready' }, 'ready');
}

const html = renderToString(
  React.createElement(Context.Provider, null, React.createElement(Consumer)),
);
if (!html.includes('data-context-action="ready"')) {
  throw new Error('React runtime compatibility render did not produce the expected output.');
}
`);
  execFileSync(process.execPath, [join(consumer, 'consumer-runtime.mjs')], {
    cwd: consumer,
    stdio: 'inherit',
  });
  console.log(`React ${reactVersion} compatibility passed with @types/react ${reactTypesVersion}.`);
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
