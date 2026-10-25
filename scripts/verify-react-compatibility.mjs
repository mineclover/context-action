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
    '@context-action/store-core',
    '@context-action/tool-protocol',
    '@context-action/tool-durable-operations',
    '@context-action/webmcp',
    '@context-action/react',
  ]) {
    buildPackage(packageName);
  }

  const candidatePackages = [
    'core',
    'store-core',
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
    return [packageDirectory, join(consumer, tarball)];
  });
  const tarballsByPackage = new Map(candidateTarballs);

  writeFileSync(join(consumer, 'package.json'), JSON.stringify({
    name: 'context-action-react-compat-consumer',
    private: true,
    type: 'module',
  }));
  function installCandidates(packageNames) {
    execFileSync(
      'npm',
      [
        'install', '--no-save', '--ignore-scripts',
        `react@${reactVersion}`,
        `react-dom@${reactVersion}`,
        `@types/react@${reactTypesVersion}`,
        `@types/react-dom@${reactDomTypesVersion}`,
        'typescript@6.0.3',
        ...packageNames.map(name => tarballsByPackage.get(name)),
      ],
      { cwd: consumer, env: isolatedNpmEnvironment(), stdio: 'inherit' },
    );
  }
  // First prove that an ordinary install does not need any tool integration.
  installCandidates(['core', 'store-core', 'mutative-core', 'mutative', 'react']);

  writeFileSync(join(consumer, 'consumer.tsx'), `
import React from 'react';
import type { ExecutionResult } from '@context-action/core';
import { createActionContext, createStoreContext, createRefContext, useStoreValue } from '@context-action/react';
import { StoreRegistry } from '@context-action/react/advanced';
import { deepClone } from '@context-action/react/utils';

interface Actions { save: { id: string }; reset: void }
interface Results { save: { accepted: boolean } }
const Context = createActionContext<Actions, Results>('Compatibility', {
  schema: { save: { safeParse(value) { return { success: true, data: value }; } } },
});
const Stores = createStoreContext('CompatibilityStores', { count: 0 });
const Refs = createRefContext<{ input: HTMLInputElement }>('CompatibilityRefs');
const cloned: { ready: boolean } = deepClone({ ready: true });

function Consumer() {
  const count: number = useStoreValue(Stores.useStore('count'));
  const input = Refs.useRefHandler('input');
  void count;
  void input;
  Context.useActionHandler('save', async payload => ({ accepted: payload.id.length > 0 }));
  const api = Context.useActionDispatchWithResult();
  const result: Promise<ExecutionResult<Results['save']>> =
    api.dispatchWithResult('save', { id: 'compatibility' });
  void result;
  return React.createElement('div');
}

void Consumer;
void StoreRegistry;
void cloned;
`);
  writeFileSync(join(consumer, 'consumer.cts'), `
import { createActionContext, createStore, createRefContext } from '@context-action/react';
const Context = createActionContext<{ save: string }>('CommonJS', {
  schema: { save: { safeParse(value) { return { success: true, data: value }; } } },
});
const store = createStore('CommonJSStore', 0);
const refs = createRefContext<{ input: HTMLInputElement }>('CommonJSRefs');
void Context; void store; void refs;
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
    include: ['consumer.tsx', 'consumer.cts', 'integration.tsx'],
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
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { renderToString } from 'react-dom/server';
import { ActionRegister } from '@context-action/core';
import { createActionContext, createStore, createStoreContext, createRefContext, useStoreValue } from '@context-action/react';

const require = createRequire(import.meta.url);
for (const integration of ['tool-protocol', 'webmcp', 'ai-sdk', 'tool-durable-operations']) {
  assert.throws(() => require.resolve('@context-action/' + integration), { code: 'MODULE_NOT_FOUND' });
}
const cjs = require('@context-action/react');
assert.equal(typeof cjs.createActionContext, 'function');
assert.equal(typeof cjs.createRefContext, 'function');
const store = createStore('BasicStore', 0);
const actions = new ActionRegister();
const unregister = actions.register('add', value => store.setValue(store.getValue() + value));
await actions.dispatch('add', 2);
assert.equal(store.getValue(), 2);
unregister();
await actions.dispatch('add', 2);
assert.equal(store.getValue(), 2);
actions.destroy();
store.dispose();

const Context = createActionContext('CompatibilityRuntime');
const Stores = createStoreContext('BasicStores', { count: 7 });
const Refs = createRefContext('BasicRefs');
function Consumer() {
  Context.useActionEffectHandler('save', () => {});
  const count = useStoreValue(Stores.useStore('count'));
  const ref = Refs.useRefHandler('input');
  assert.equal(ref.target, null);
  return React.createElement('div', { 'data-context-action': 'ready' }, String(count));
}

const html = renderToString(
  React.createElement(Context.Provider, null,
    React.createElement(Stores.Provider, null,
      React.createElement(Refs.Provider, null, React.createElement(Consumer)))),
);
if (!html.includes('data-context-action="ready">7</div>')) {
  throw new Error('React runtime compatibility render did not produce the expected output.');
}
`);
  execFileSync(process.execPath, [join(consumer, 'consumer-runtime.mjs')], {
    cwd: consumer,
    stdio: 'inherit',
  });

  // The full workspace suite below intentionally exercises source. These
  // public-API contracts must also run against the installed production bundle,
  // before integration peers are installed, so source aliases cannot hide a
  // bundling, compiler, or transitive dependency regression.
  const packedJestConfig = join(consumer, 'jest.packed.cjs');
  writeFileSync(packedJestConfig, `
const base = require(${JSON.stringify(join(root, 'packages/react/jest.config.cjs'))});
const ordinaryAliases = Object.fromEntries(Object.entries(base.moduleNameMapper)
  .filter(([pattern]) => !pattern.startsWith('^@context-action/')));
module.exports = {
  ...base,
  rootDir: ${JSON.stringify(join(root, 'packages/react'))},
  moduleNameMapper: {
    ...ordinaryAliases,
    '^@context-action/react$': ${JSON.stringify(join(consumer, 'node_modules/@context-action/react/dist/index.cjs'))},
    '^@context-action/react/(advanced|utils|backend|webmcp)$': ${JSON.stringify(join(consumer, 'node_modules/@context-action/react/dist/$1.cjs'))},
    '^@context-action/core$': ${JSON.stringify(join(consumer, 'node_modules/@context-action/core/dist/index.cjs'))},
    '^react$': ${JSON.stringify(join(consumer, 'node_modules/react'))},
    '^react/jsx-runtime$': ${JSON.stringify(join(consumer, 'node_modules/react/jsx-runtime.js'))},
    '^react/jsx-dev-runtime$': ${JSON.stringify(join(consumer, 'node_modules/react/jsx-dev-runtime.js'))},
    '^react-dom$': ${JSON.stringify(join(consumer, 'node_modules/react-dom'))},
    '^react-dom/client$': ${JSON.stringify(join(consumer, 'node_modules/react-dom/client.js'))},
    '^react-dom/(.*)$': ${JSON.stringify(join(consumer, 'node_modules/react-dom/$1'))},
  },
};
`);
  execFileSync('pnpm', [
    '--filter', '@context-action/react', 'exec', 'jest',
    '--config', packedJestConfig, '--runInBand', '--runTestsByPath',
    ...[
      '__tests__/actions/structural-schema.test.tsx',
      '__tests__/actions/action-role-api.contract.test.tsx',
      '__tests__/provider-isolation.contract.test.tsx',
      '__tests__/public-subpaths.contract.test.tsx',
      '__tests__/stores/hooks/store-subscription.contract.test.tsx',
      '__tests__/stores/hooks/time-travel-api.contract.test.tsx',
      '__tests__/refs/ref-provider-isolation.test.tsx',
      '__tests__/refs/ref-public-api.contract.test.tsx',
      '__tests__/refs/ref-cleanup.contract.test.tsx',
      '__tests__/refs/ref-operation-cleanup.contract.test.tsx',
    ].map(file => join(root, 'packages/react', file)),
  ], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, CONTEXT_ACTION_REACT_COMPAT_VERSION: reactVersion },
  });
  console.log('Base-only packed lifecycle contracts passed against the installed production CJS bundle.');
  console.log('Base-only packed consumer passed: ESM/CJS types and runtime without integration peers.');
  // Then exercise the opt-in subpath with its peers explicitly installed.
  installCandidates(candidatePackages);
  writeFileSync(join(consumer, 'integration.tsx'), `
import { useWebMCPToolScope } from '@context-action/react/webmcp';
void useWebMCPToolScope;
`);
  execFileSync(process.execPath, [
    join(consumer, 'node_modules/typescript/bin/tsc'), '--project', join(consumer, 'tsconfig.json'),
  ], { cwd: consumer, stdio: 'inherit' });
  execFileSync(process.execPath, ['--input-type=module', '-e', `
import { useWebMCPToolScope } from '@context-action/react/webmcp';
if (typeof useWebMCPToolScope !== 'function') throw new Error('Missing opt-in WebMCP hook');
`], { cwd: consumer, stdio: 'inherit' });

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
