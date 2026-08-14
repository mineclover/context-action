#!/usr/bin/env node
'use strict';

const { execFileSync } = require('node:child_process');
const { createRequire } = require('node:module');
const {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const summaryPath = path.resolve('reports/npm-publish-summary.json');
const summary = existsSync(summaryPath)
  ? JSON.parse(readFileSync(summaryPath, 'utf8'))
  : [];
const cliArguments = process.argv.slice(2);

function optionValue(name) {
  const index = cliArguments.indexOf(name);
  if (index === -1) return undefined;
  const value = cliArguments[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`);
  return value;
}

function optionValues(name) {
  const values = [];
  for (let index = 0; index < cliArguments.length; index += 1) {
    if (cliArguments[index] !== name) continue;
    const value = cliArguments[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`);
    values.push(value);
    index += 1;
  }
  return values;
}

const packages = [
  {
    name: '@context-action/core',
    directory: 'packages/core',
    imports: [{ specifier: '@context-action/core', exports: ['ActionRegister'] }],
  },
  {
    name: '@context-action/mutative-core',
    directory: 'packages/mutative-core',
    imports: [{ specifier: '@context-action/mutative-core', exports: ['create'] }],
  },
  {
    name: '@context-action/mutative',
    directory: 'packages/mutative',
    imports: [{ specifier: '@context-action/mutative', exports: ['create'] }],
  },
  {
    name: '@context-action/tool-protocol',
    directory: 'packages/tool-protocol',
    imports: [{
      specifier: '@context-action/tool-protocol',
      exports: [
        'createActionSchema',
        'createToolApprovalQueue',
        'createToolCallFingerprint',
      ],
    }],
  },
  {
    name: '@context-action/tool-durable-operations',
    directory: 'packages/tool-durable-operations',
    imports: [{
      specifier: '@context-action/tool-durable-operations',
      exports: [
        'DURABLE_OPERATION_FENCING_CAPABILITY',
        'createDurableOperationStore',
        'createDurableSideEffectRunner',
        'hasDurableOperationFencingCapability',
      ],
      exportKinds: { DURABLE_OPERATION_FENCING_CAPABILITY: 'string' },
    }],
    cli: {
      name: 'tool-durable-write-evidence',
      arguments: consumerRoot => [
        '--input', path.join(consumerRoot, 'durable-evidence-input'),
        '--output', path.join(consumerRoot, 'durable-evidence-output'),
      ],
      output: 'Wrote sanitized durable-operation evidence to',
      verify: consumerRoot => {
        const outputDirectory = path.join(consumerRoot, 'durable-evidence-output');
        const evidence = JSON.parse(
          readFileSync(path.join(outputDirectory, 'evidence.json'), 'utf8'),
        );
        if (evidence.schemaVersion !== 'context-action/durable-operation-verification@1') {
          throw new Error('Durable evidence CLI wrote an unexpected evidence schema.');
        }
        if (!existsSync(path.join(outputDirectory, 'evidence.md'))) {
          throw new Error('Durable evidence CLI did not write evidence.md.');
        }
      },
    },
  },
  {
    name: '@context-action/react',
    directory: 'packages/react',
    imports: [
      { specifier: '@context-action/react', exports: ['createActionContext'] },
      { specifier: '@context-action/react/advanced', exports: ['StoreRegistry'] },
      { specifier: '@context-action/react/utils', exports: ['deepClone'] },
      { specifier: '@context-action/react/react18', exports: [] },
      { specifier: '@context-action/react/webmcp', exports: ['useWebMCPToolScope'] },
    ],
  },
  {
    name: '@context-action/ai-sdk',
    directory: 'packages/ai-sdk',
    imports: [{
      specifier: '@context-action/ai-sdk',
      exports: ['createAISDKToolScope'],
    }],
  },
  {
    name: '@context-action/webmcp',
    directory: 'packages/webmcp',
    imports: [
      { specifier: '@context-action/webmcp', exports: ['createWebMCPToolScope'] },
      {
        specifier: '@context-action/webmcp/profiles/chrome-legacy',
        exports: ['chromeLegacyWebMCPProfile'],
        exportKinds: { chromeLegacyWebMCPProfile: 'object' },
      },
    ],
  },
  {
    name: '@context-action/typedoc-vitepress-sync',
    directory: 'packages/typedoc-vitepress-sync',
    supportsCjs: false,
    imports: [{ specifier: '@context-action/typedoc-vitepress-sync', exports: ['TypeDocVitePressSync'] }],
    cli: { name: 'typedoc-vitepress-sync', arguments: ['--help'], output: 'Usage: typedoc-vitepress-sync' },
  },
  {
    name: '@context-action/llms-generator',
    directory: 'packages/llms-generator',
    supportsCjs: false,
    imports: [
      {
        specifier: '@context-action/llms-generator',
        exports: ['EnhancedConfigManager', 'DEFAULT_CONFIG'],
        exportKinds: { DEFAULT_CONFIG: 'object' },
      },
      { specifier: '@context-action/llms-generator/cli', exports: ['main'] },
    ],
    cli: { name: 'llms', arguments: ['--help'], output: 'LLMS Generator' },
  },
];

const consumerRuntimeDependencies = [
  { name: 'ai', spec: 'ai@7.0.34' },
  { name: '@types/node', spec: '@types/node@24.13.3' },
  { name: '@types/json-schema', spec: '@types/json-schema@7.0.15' },
  { name: '@types/react', spec: '@types/react@19.2.17' },
  { name: 'typescript', spec: 'typescript@6.0.3' },
];

const reactMatrix = [
  { version: '18.3.1', label: 'react-18' },
  { version: '19.2.8', label: 'react-19' },
];

const repositoryRoot = path.resolve(__dirname, '..');

function validVersion(value) {
  return typeof value === 'string'
    && /^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/u.test(value);
}

function expectedPublishedVersion({ name, directory }) {
  const entry = Array.isArray(summary)
    ? summary.find((item) => item?.packageName === name)
    : undefined;
  if (validVersion(entry?.version)) return entry.version;

  const packageManifest = JSON.parse(
    readFileSync(path.join(repositoryRoot, directory, 'package.json'), 'utf8'),
  );
  if (!validVersion(packageManifest.version)) {
    throw new Error(`Package manifest has an invalid version for ${name}: ${packageManifest.version}`);
  }
  return packageManifest.version;
}

function publishedVersion(name, tag, expectedVersion) {
  const output = execFileSync(
    'npm',
    ['view', tag ? `${name}@${tag}` : name, 'version', '--registry=https://registry.npmjs.org'],
    { encoding: 'utf8', env: { ...process.env, npm_config_loglevel: 'error' } },
  ).trim();
  if (!validVersion(output)) {
    throw new Error(`npm returned an invalid published version for ${name}: ${output}`);
  }
  if (expectedVersion && output !== expectedVersion) {
    throw new Error(
      `npm dist-tag ${tag} for ${name} still resolves to ${output}; expected ${expectedVersion}`,
    );
  }
  return output;
}

function waitForPublishedVersion(packageDefinition, tag) {
  const { name } = packageDefinition;
  const expectedVersion = expectedPublishedVersion(packageDefinition);
  const attempts = 30;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const version = publishedVersion(name, tag, expectedVersion);
      if (attempt > 1) {
        process.stdout.write(`npm metadata became visible after ${attempt} attempts.\n`);
      }
      return version;
    } catch (error) {
      if (attempt === attempts) throw error;
      process.stdout.write(`Waiting for npm metadata (${attempt}/${attempts - 1})...\n`);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10_000);
    }
  }
}

function createLocalPackageSpecs(consumerRoot, packageDefinitions) {
  const packDirectory = path.join(consumerRoot, 'local-packages');
  mkdirSync(packDirectory, { recursive: true });
  return packageDefinitions.map(({ name, directory }) => {
    execFileSync(
      'npm',
      ['run', 'prepublishOnly', '--if-present'],
      {
        cwd: path.join(repositoryRoot, directory),
        stdio: 'inherit',
        env: isolatedNpmEnvironment(),
      },
    );
    const output = execFileSync(
      'pnpm',
      ['pack', '--json', '--pack-destination', packDirectory],
      {
        cwd: path.join(repositoryRoot, directory),
        encoding: 'utf8',
        env: { ...process.env, npm_config_update_notifier: 'false' },
      },
    );
    let result;
    try {
      const parsed = JSON.parse(output);
      result = Array.isArray(parsed) ? parsed[0] : parsed;
    } catch (error) {
      throw new Error(`pnpm pack returned invalid JSON for ${name}: ${error.message}\n${output}`);
    }
    if (!result || typeof result.filename !== 'string') {
      throw new Error(`pnpm pack returned no archive for ${name}`);
    }
    const archivePath = path.resolve(packDirectory, result.filename);
    if (!archivePath.startsWith(`${path.resolve(packDirectory)}${path.sep}`)) {
      throw new Error(`pnpm pack created an archive outside the temporary directory: ${archivePath}`);
    }
    return { name, spec: `file:${archivePath}` };
  });
}

function runConsumerSmoke(consumerRoot, selectedPackages) {
  const cjsPackages = selectedPackages.filter(({ supportsCjs }) => supportsCjs !== false);
  const moduleNames = cjsPackages.flatMap(({ imports }) => imports.map(({ specifier }) => specifier));
  const expectedExports = Object.fromEntries(
    cjsPackages.flatMap(({ imports }) => imports.map(({ specifier, exports, exportKinds }) => [
      specifier,
      Object.fromEntries(exports.map(exportName => [
        exportName,
        exportKinds?.[exportName] ?? 'function',
      ])),
    ])),
  );
  if (moduleNames.length === 0) return;
  const source = `
const expected = ${JSON.stringify(expectedExports)};
for (const [name, exports] of Object.entries(expected)) {
  const module = require(name);
  for (const [exportName, expectedKind] of Object.entries(exports)) {
    if (typeof module[exportName] !== expectedKind) {
      throw new Error(name + ' export ' + exportName + ' must be a ' + expectedKind);
    }
  }
}

console.log('published tool package consumer imports passed: ' + ${JSON.stringify(moduleNames.join(', '))});
`;

  execFileSync(process.execPath, ['-e', source], {
    cwd: consumerRoot,
    stdio: 'inherit',
    env: { ...process.env },
  });
}

function runConsumerEsmSmoke(consumerRoot, selectedPackages) {
  const expectedExports = Object.fromEntries(
    selectedPackages.flatMap(({ imports }) => imports.map(({ specifier, exports, exportKinds }) => [
      specifier,
      Object.fromEntries(exports.map(exportName => [
        exportName,
        exportKinds?.[exportName] ?? 'function',
      ])),
    ])),
  );
  const source = `
const expected = ${JSON.stringify(expectedExports)};
for (const [name, exports] of Object.entries(expected)) {
  const module = await import(name);
  for (const [exportName, expectedKind] of Object.entries(exports)) {
    if (typeof module[exportName] !== expectedKind) {
      throw new Error(name + ' ESM export ' + exportName + ' must be a ' + expectedKind);
    }
  }
  if (name === '@context-action/mutative-core') {
    const result = module.create({ value: 1 }, draft => { draft.value = 2; });
    if (result.value !== 2) throw new Error('mutative-core create operation failed');
  }
  if (name === '@context-action/mutative') {
    const result = module.produce({ value: 1 }, draft => { draft.value = 2; });
    if (result.value !== 2) throw new Error('mutative produce operation failed');
  }
}

console.log('published tool package ESM imports passed: ' + Object.keys(expected).join(', '));
`;
  execFileSync(process.execPath, ['--input-type=module', '--eval', source], {
    cwd: consumerRoot,
    stdio: 'inherit',
    env: { ...process.env },
  });
}

/** Verify each selected package's public declarations from the tarballs a consumer installs. */
function runConsumerTypecheck(consumerRoot, selectedPackages) {
  const names = new Set(selectedPackages.map(({ name }) => name));
  const statements = [];
  const esmOnlyStatements = [];
  if (names.has('@context-action/core')) {
    statements.push(`
import { ActionRegister } from '@context-action/core';
const register = new ActionRegister();
const shutdown: Promise<void> = register.destroyAsync({ deferCleanup: true });
void shutdown;
`);
  }
  if (names.has('@context-action/mutative-core')) {
    statements.push(`
import { create, type Draft as CoreDraft } from '@context-action/mutative-core';
type MutativeCoreState = { value: number };
const mutativeCoreResult = create({ value: 1 }, (draft: CoreDraft<MutativeCoreState>) => {
  draft.value = 2;
});
void mutativeCoreResult;
`);
  }
  if (names.has('@context-action/mutative')) {
    statements.push(`
import { produce, createTimeTravel, type Draft as MutativeDraft } from '@context-action/mutative';
type MutativeState = { value: number };
const mutativeResult = produce({ value: 1 }, (draft: MutativeDraft<MutativeState>) => {
  draft.value = 2;
});
void mutativeResult;
void createTimeTravel;
`);
  }
  if (names.has('@context-action/react')) {
    statements.push(`
import { createActionContext } from '@context-action/react';
import { StoreRegistry } from '@context-action/react/advanced';
import { deepClone } from '@context-action/react/utils';
import type { React18Options } from '@context-action/react/react18';
import { useWebMCPToolScope } from '@context-action/react/webmcp';
const actions = createActionContext('consumer-check');
const react18Options: React18Options = { enableConcurrent: true };
void actions;
void StoreRegistry;
void deepClone;
void react18Options;
void useWebMCPToolScope;
`);
  }
  if (names.has('@context-action/tool-protocol')) {
    statements.push(`
import { createActionSchema, createToolApprovalQueue, type ToolCallOptions, type ToolDefinition, type ToolInteractionHandler } from '@context-action/tool-protocol';
const interaction: ToolInteractionHandler = async () => 'approved';
const callOptions: ToolCallOptions = { interaction };
const definition: ToolDefinition = {
  name: 'consumer-check',
  description: 'Verifies packed public declarations.',
  inputSchema: { type: 'object' },
};
const approvalQueue = createToolApprovalQueue();
void createActionSchema;
void approvalQueue;
void callOptions;
void definition;
`);
  }
  if (names.has('@context-action/ai-sdk')) {
    statements.push(`
import { createAISDKToolScope } from '@context-action/ai-sdk';
void createAISDKToolScope;
`);
  }
  if (names.has('@context-action/webmcp')) {
    statements.push(`
import { createWebMCPToolScope, type WebMCPToolScopeOptions } from '@context-action/webmcp';
import { chromeLegacyWebMCPProfile } from '@context-action/webmcp/profiles/chrome-legacy';
const scope: WebMCPToolScopeOptions = { sessionId: 'consumer-check', toolNames: [] };
void scope;
void createWebMCPToolScope;
void chromeLegacyWebMCPProfile;
`);
  }
  if (names.has('@context-action/typedoc-vitepress-sync')) {
    esmOnlyStatements.push(`
import { TypeDocVitePressSync, type SyncConfig } from '@context-action/typedoc-vitepress-sync';
const syncConfig: SyncConfig = { sourceDir: 'typedoc', targetDir: 'vitepress' };
void syncConfig;
void TypeDocVitePressSync;
`);
  }
  if (names.has('@context-action/llms-generator')) {
    esmOnlyStatements.push(`
import { EnhancedConfigManager, DEFAULT_CONFIG } from '@context-action/llms-generator';
import { main as llmsCliMain } from '@context-action/llms-generator/cli';
void EnhancedConfigManager;
void DEFAULT_CONFIG;
void llmsCliMain;
`);
  }
  if (statements.length === 0 && esmOnlyStatements.length === 0) return;
  for (const extension of ['mts', 'cts']) {
    const source = [
      ...statements,
      ...(extension === 'mts' ? esmOnlyStatements : []),
    ].join('\n');
    if (source.length === 0) continue;
    const sourcePath = path.join(consumerRoot, `index.${extension}`);
    writeFileSync(sourcePath, source);
    execFileSync(
      process.execPath,
      [path.join(consumerRoot, 'node_modules/typescript/bin/tsc'), '--noEmit', '--strict', '--types', 'node', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--target', 'ES2022', sourcePath],
      { cwd: consumerRoot, stdio: 'inherit', env: { ...process.env } },
    );
  }
}

function runConsumerCliSmoke(consumerRoot, selectedPackages) {
  for (const { name, cli } of selectedPackages) {
    if (!cli) continue;
    const manifestPath = path.join(consumerRoot, 'node_modules', ...name.split('/'), 'package.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const relativeEntry = typeof manifest.bin === 'string' ? manifest.bin : manifest.bin?.[cli.name];
    if (typeof relativeEntry !== 'string') {
      throw new Error(`${name} does not expose the expected ${cli.name} binary`);
    }
    const executable = path.join(
      consumerRoot,
      'node_modules',
      '.bin',
      process.platform === 'win32' ? `${cli.name}.cmd` : cli.name,
    );
    if (!existsSync(executable)) throw new Error(`${name} did not install the expected ${cli.name} binary shim`);
    const argumentsList = typeof cli.arguments === 'function'
      ? cli.arguments(consumerRoot)
      : cli.arguments;
    const output = execFileSync(executable, argumentsList, {
      cwd: consumerRoot,
      encoding: 'utf8',
      env: { ...process.env },
      shell: process.platform === 'win32',
    });
    if (!output.includes(cli.output)) {
      throw new Error(`${name} ${cli.name} smoke output did not include ${JSON.stringify(cli.output)}`);
    }
    cli.verify?.(consumerRoot);
  }
}

function packageDirectoryForEntry(entryPath, expectedName) {
  let directory = path.dirname(realpathSync(entryPath));
  while (directory !== path.dirname(directory)) {
    const manifestPath = path.join(directory, 'package.json');
    if (existsSync(manifestPath)) {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      if (manifest.name === expectedName) return { directory, manifest };
    }
    directory = path.dirname(directory);
  }
  throw new Error(`Could not locate ${expectedName} from resolved entry ${entryPath}`);
}

function installedPackageDirectory(consumerRoot, packageName) {
  return realpathSync(path.join(consumerRoot, 'node_modules', ...packageName.split('/')));
}

/**
 * Verify the dependency graph from each packed package's own resolution
 * context. Installing every candidate as a top-level exact dependency is not
 * enough: an incompatible packed range lets npm install an older stable copy
 * below the dependent package while top-level import smokes still pass.
 */
function runContextActionDependencyResolutionSmoke(consumerRoot, selectedPackages) {
  const selected = new Map(selectedPackages.map(({ name }) => {
    const directory = installedPackageDirectory(consumerRoot, name);
    const manifest = JSON.parse(readFileSync(path.join(directory, 'package.json'), 'utf8'));
    if (manifest.name !== name || !validVersion(manifest.version)) {
      throw new Error(`Installed cohort package has an invalid identity: ${name}`);
    }
    return [name, { directory, manifest }];
  }));

  for (const [dependentName, dependent] of selected) {
    const dependentRequire = createRequire(path.join(dependent.directory, 'package.json'));
    for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
      const dependencies = dependent.manifest[field];
      if (!dependencies || typeof dependencies !== 'object') continue;
      for (const [dependencyName, declaredRange] of Object.entries(dependencies)) {
        const expected = selected.get(dependencyName);
        if (!expected) continue;

        let resolved;
        try {
          resolved = packageDirectoryForEntry(
            dependentRequire.resolve(dependencyName),
            dependencyName,
          );
        } catch (error) {
          throw new Error(
            `${dependentName} packed ${field}.${dependencyName}=${JSON.stringify(declaredRange)} ` +
            `could not resolve the selected cohort candidate ${expected.manifest.version}: ` +
            `${error instanceof Error ? error.message : String(error)}`,
          );
        }

        if (realpathSync(resolved.directory) !== expected.directory ||
            resolved.manifest.name !== dependencyName ||
            resolved.manifest.version !== expected.manifest.version) {
          throw new Error(
            `${dependentName} packed ${field}.${dependencyName}=${JSON.stringify(declaredRange)} ` +
            `resolved ${resolved.manifest.name ?? dependencyName}@${resolved.manifest.version ?? 'unknown'} ` +
            `from ${resolved.directory}; expected the selected cohort candidate ` +
            `${dependencyName}@${expected.manifest.version} from ${expected.directory}. ` +
            'The packed dependency range does not accept the exact candidate, or npm did not resolve the cohort as one graph.',
          );
        }
      }
    }
  }
}

/** Ensure the root durable-operations declarations do not require browser libs. */
function runNodeOnlyDurableTypecheck(consumerRoot, selectedPackages) {
  if (!selectedPackages.some(({ name }) => name === '@context-action/tool-durable-operations')) {
    return;
  }

  const source = `
import {
  DURABLE_OPERATION_FENCING_CAPABILITY,
  createDurableOperationStore,
  createRedisDurableOperationBackend,
  hasDurableOperationFencingCapability,
  type DurableOperationBackend,
  type DurableOperationFence,
  type IndexedDbDurableOperationBackendOptions,
} from '@context-action/tool-durable-operations';

const indexedDbOptions: IndexedDbDurableOperationBackendOptions = {};
const fence: DurableOperationFence = {
  incarnation: 'consumer-incarnation',
  revision: 1,
};
const backend: DurableOperationBackend = {
  read: () => undefined,
  list: () => [],
  compareAndSet: (_key, expectedFence, _next) => {
    const observedFence: DurableOperationFence | undefined = expectedFence;
    void observedFence;
    return true;
  },
};
const store = createDurableOperationStore(backend);
const capability: typeof DURABLE_OPERATION_FENCING_CAPABILITY = store.fencingCapability;
const isFenced: boolean = hasDurableOperationFencingCapability(store);
void indexedDbOptions;
void fence;
void capability;
void isFenced;
void createRedisDurableOperationBackend;
`;

  for (const extension of ['mts', 'cts']) {
    const sourcePath = path.join(consumerRoot, `durable-node-consumer.${extension}`);
    writeFileSync(sourcePath, source);
    execFileSync(
      process.execPath,
      [
        path.join(consumerRoot, 'node_modules/typescript/bin/tsc'),
        '--noEmit',
        '--strict',
        '--skipLibCheck', 'false',
        '--lib', 'ES2022',
        '--types', 'node',
        '--module', 'NodeNext',
        '--moduleResolution', 'NodeNext',
        '--target', 'ES2022',
        sourcePath,
      ],
      { cwd: consumerRoot, stdio: 'inherit', env: { ...process.env } },
    );
  }
}

function installReactVersion(consumerRoot, version, npmConfigPath) {
  execFileSync(
    'npm',
    [
      'install', `react@${version}`, `react-dom@${version}`,
      '--no-audit', '--no-fund', '--no-package-lock', '--ignore-scripts',
      '--userconfig', npmConfigPath, '--registry=https://registry.npmjs.org',
    ],
    { cwd: consumerRoot, stdio: 'inherit', env: isolatedNpmEnvironment() },
  );
}

function runReactSsrMatrix(consumerRoot, selectedPackages, npmConfigPath) {
  if (!selectedPackages.some(({ name }) => name === '@context-action/react')) return;
  const source = `
const React = require('react');
const { renderToString } = require('react-dom/server');
const { createActionContext } = require('@context-action/react');
const context = createActionContext('published-consumer-ssr');
const html = renderToString(React.createElement(context.Provider, null, React.createElement('span', null, 'ok')));
if (!html.includes('ok')) throw new Error('React SSR did not render the consumer tree');
console.log('React SSR consumer passed with React ' + React.version);
`;
  for (const entry of reactMatrix) {
    installReactVersion(consumerRoot, entry.version, npmConfigPath);
    execFileSync(process.execPath, ['-e', source], {
      cwd: consumerRoot,
      stdio: 'inherit',
      env: { ...process.env },
    });
  }
}

function isolatedNpmEnvironment() {
  return Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) => !/^(npm_config|pnpm_config)_/iu.test(key),
    ),
  );
}

function main() {
  const local = cliArguments.includes('--local');
  const cohortOnly = cliArguments.includes('--cohort-only');
  const tag = optionValue('--tag');
  if (tag && !/^[a-z][a-z0-9._-]*$/u.test(tag)) throw new Error(`Invalid npm dist-tag: ${tag}`);
  const packageTags = new Map(optionValues('--package-tag').map((entry) => {
    const separator = entry.lastIndexOf('=');
    const name = entry.slice(0, separator);
    const packageTag = entry.slice(separator + 1);
    if (separator <= 0 || !/^[a-z][a-z0-9._-]*$/u.test(packageTag)) {
      throw new Error('--package-tag must use <package-name>=<dist-tag>');
    }
    return [name, packageTag];
  }));
  const localPackageNames = new Set(optionValues('--local-package'));
  const requestedPackages = optionValue('--packages')?.split(',').filter(Boolean);
  const selectedPackages = requestedPackages
    ? packages.filter(({ name }) => requestedPackages.includes(name))
    : packages;
  if (selectedPackages.length === 0 || (requestedPackages && selectedPackages.length !== requestedPackages.length)) {
    throw new Error('Requested published consumer packages must be known package names');
  }
  for (const name of packageTags.keys()) {
    if (!selectedPackages.some(packageDefinition => packageDefinition.name === name)) {
      throw new Error(`--package-tag references a package outside the consumer matrix: ${name}`);
    }
  }
  for (const name of localPackageNames) {
    if (!selectedPackages.some(packageDefinition => packageDefinition.name === name)) {
      throw new Error(`--local-package references a package outside the consumer matrix: ${name}`);
    }
  }
  const consumerRoot = mkdtempSync(path.join(os.tmpdir(), 'context-action-tool-consumer-'));
  try {
    const localPackageDefinitions = local
      ? selectedPackages
      : selectedPackages.filter(({ name }) => localPackageNames.has(name));
    const localPackageSpecs = localPackageDefinitions.length > 0
      ? createLocalPackageSpecs(consumerRoot, localPackageDefinitions)
      : [];
    const packageSpecs = selectedPackages.map((packageDefinition) => {
      const { name } = packageDefinition;
      if (local || localPackageNames.has(name)) {
        const localPackage = localPackageSpecs.find(candidate => candidate.name === name);
        if (!localPackage) throw new Error(`Could not pack local consumer package ${name}`);
        return localPackage;
      }
      const version = waitForPublishedVersion(packageDefinition, packageTags.get(name) ?? tag);
      return { name, spec: `${name}@${version}` };
    });
    if (!cohortOnly) packageSpecs.push(...consumerRuntimeDependencies);

    writeFileSync(
      path.join(consumerRoot, 'package.json'),
      JSON.stringify(
        {
          name: 'context-action-tool-consumer-smoke',
          private: true,
          allowScripts: [],
          dependencies: Object.fromEntries(packageSpecs.map(({ name, spec }) => [
            name,
            spec.startsWith(`${name}@`) ? spec.slice(name.length + 1) : spec,
          ])),
        },
        null,
        2,
      ),
    );
    const npmConfigPath = path.join(consumerRoot, '.npmrc');
    const npmAuth = process.env.NODE_AUTH_TOKEN
      ? '//registry.npmjs.org/:_authToken=$' + '{NODE_AUTH_TOKEN}\n'
      : '';
    writeFileSync(npmConfigPath, `${npmAuth}ignore-scripts=true\naudit=false\nfund=false\n`);
    execFileSync(
      'npm',
      [
        'install',
        '--no-audit',
        '--no-fund',
        '--no-package-lock',
        '--ignore-scripts',
        '--userconfig',
        npmConfigPath,
        '--registry=https://registry.npmjs.org',
      ],
      {
        cwd: consumerRoot,
        stdio: 'inherit',
        env: isolatedNpmEnvironment(),
      },
    );
    runContextActionDependencyResolutionSmoke(consumerRoot, selectedPackages);
    if (cohortOnly) {
      process.stdout.write(
        `Packed cohort dependency resolution passed: ${packageSpecs.map(({ spec }) => spec).join(', ')}\n`,
      );
      return;
    }
    runConsumerSmoke(consumerRoot, selectedPackages);
    runConsumerEsmSmoke(consumerRoot, selectedPackages);
    runConsumerTypecheck(consumerRoot, selectedPackages);
    runConsumerCliSmoke(consumerRoot, selectedPackages);
    runNodeOnlyDurableTypecheck(consumerRoot, selectedPackages);
    runReactSsrMatrix(consumerRoot, selectedPackages, npmConfigPath);
    process.stdout.write(
      `${local ? 'Local tarball' : 'Published'} tool package consumer matrix passed (supported CJS, ESM, NodeNext declarations, published CLIs, React 18/19 SSR): ${packageSpecs.map(({ spec }) => spec).join(', ')}\n`,
    );
  } finally {
    rmSync(consumerRoot, { recursive: true, force: true });
  }
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  packageDirectoryForEntry,
  runContextActionDependencyResolutionSmoke,
};
