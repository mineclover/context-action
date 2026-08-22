import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const optionArgs = process.argv.slice(2).filter(argument => argument !== '--');
const args = new Map();
for (let index = 0; index < optionArgs.length; index += 2) {
  args.set(optionArgs[index], optionArgs[index + 1]);
}

const reactVersion = args.get('--react-version');
const reactTypesVersion = args.get('--react-types');
const reactDomTypesVersion = args.get('--react-dom-types');
if (!reactVersion || !reactTypesVersion || !reactDomTypesVersion) {
  throw new Error('Expected --react-version, --react-types, and --react-dom-types.');
}

function buildPackage(packageName) {
  execFileSync('pnpm', ['--filter', packageName, 'build'], {
    cwd: root,
    stdio: 'inherit',
  });
}

function isolatedNpmEnvironment() {
  return Object.fromEntries(Object.entries(process.env).filter(
    ([key]) => !/^(npm_config|pnpm_config)_/iu.test(key),
  ));
}

const consumer = mkdtempSync(join(tmpdir(), 'context-action-react-compat-'));
try {
  // npm pack only includes files that already exist. Build the complete
  // runtime dependency chain so this verifier works from a clean checkout.
  for (const packageName of [
    '@context-action/mutative-core',
    '@context-action/mutative',
    '@context-action/core',
    '@context-action/tool-protocol',
    '@context-action/tool-durable-operations',
    '@context-action/webmcp',
    '@context-action/react',
  ]) {
    buildPackage(packageName);
  }

  const candidatePackages = [
    'core',
    'mutative-core',
    'mutative',
    'tool-protocol',
    'tool-durable-operations',
    'webmcp',
    'react',
  ];
  const candidateTarballs = candidatePackages.map((packageDirectory) => {
    const tarball = execFileSync(
      'npm',
      ['pack', resolve(root, 'packages', packageDirectory), '--pack-destination', consumer, '--silent'],
      { cwd: root, encoding: 'utf8' },
    ).trim().split('\n').at(-1);
    if (!tarball) throw new Error(`Failed to create ${packageDirectory} tarball.`);
    return join(consumer, tarball);
  });

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
      ...candidateTarballs,
    ],
    { cwd: consumer, env: isolatedNpmEnvironment(), stdio: 'inherit' },
  );

  writeFileSync(join(consumer, 'consumer.tsx'), `
import React from 'react';
import type { ExecutionResult } from '@context-action/core';
import { createActionContext } from '@context-action/react';
import { StoreRegistry } from '@context-action/react/advanced';
import { deepClone } from '@context-action/react/utils';
import { useWebMCPToolScope } from '@context-action/react/webmcp';

interface Actions { save: { id: string }; reset: void }
interface Results { save: { accepted: boolean } }
const Context = createActionContext<Actions, Results>('Compatibility');
const cloned: { ready: boolean } = deepClone({ ready: true });

function Consumer() {
  Context.useActionHandler('save', async payload => ({ accepted: payload.id.length > 0 }));
  const api = Context.useActionDispatchWithResult();
  const result: Promise<ExecutionResult<Results['save']>> =
    api.dispatchWithResult('save', { id: 'compatibility' });
  void result;
  return React.createElement('div');
}

void Consumer;
void StoreRegistry;
void useWebMCPToolScope;
void cloned;
`);
  writeFileSync(join(consumer, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      strict: true,
      skipLibCheck: false,
      noEmit: true,
      jsx: 'react-jsx',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
    },
    include: ['consumer.tsx'],
  }));
  execFileSync(process.execPath, [
    join(consumer, 'node_modules/typescript/bin/tsc'),
    '--project',
    join(consumer, 'tsconfig.json'),
  ], {
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

  const reactPackageRoot = join(root, 'packages/react');
  const compatibilityJestConfig = join(consumer, 'jest.compatibility.cjs');
  writeFileSync(compatibilityJestConfig, `
const base = require(${JSON.stringify(join(reactPackageRoot, 'jest.config.cjs'))});

module.exports = {
  ...base,
  rootDir: ${JSON.stringify(reactPackageRoot)},
  moduleNameMapper: {
    ...base.moduleNameMapper,
    '^react$': ${JSON.stringify(join(consumer, 'node_modules/react'))},
    '^react/jsx-runtime$': ${JSON.stringify(join(consumer, 'node_modules/react/jsx-runtime.js'))},
    '^react/jsx-dev-runtime$': ${JSON.stringify(join(consumer, 'node_modules/react/jsx-dev-runtime.js'))},
    '^react-dom$': ${JSON.stringify(join(consumer, 'node_modules/react-dom'))},
    '^react-dom/client$': ${JSON.stringify(join(consumer, 'node_modules/react-dom/client.js'))},
    '^react-dom/(.*)$': ${JSON.stringify(join(consumer, 'node_modules/react-dom/$1'))},
  },
};
`);
  execFileSync(
    'pnpm',
    [
      '--filter', '@context-action/react',
      'exec', 'jest',
      '--config', compatibilityJestConfig,
      '--runInBand',
    ],
    {
      cwd: root,
      stdio: 'inherit',
      env: {
        ...process.env,
        CONTEXT_ACTION_REACT_COMPAT_VERSION: reactVersion,
      },
    },
  );
  console.log(`React ${reactVersion} compatibility passed with @types/react ${reactTypesVersion}.`);
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
