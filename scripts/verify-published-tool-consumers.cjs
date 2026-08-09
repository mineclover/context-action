#!/usr/bin/env node
'use strict';

const { execFileSync } = require('node:child_process');
const {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
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
      exports: ['createActionSchema', 'createToolCallFingerprint'],
    }],
  },
  {
    name: '@context-action/tool-durable-operations',
    directory: 'packages/tool-durable-operations',
    imports: [{
      specifier: '@context-action/tool-durable-operations',
      exports: ['createDurableOperationStore', 'createDurableSideEffectRunner'],
    }],
  },
  {
    name: '@context-action/react',
    directory: 'packages/react',
    imports: [
      { specifier: '@context-action/react', exports: ['createActionContext'] },
      { specifier: '@context-action/react/tools', exports: ['createToolContext'] },
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
      { specifier: '@context-action/webmcp/profiles/chrome-legacy', exports: ['chromeLegacyWebMCPProfile'] },
    ],
  },
];

const consumerRuntimeDependencies = [
  { name: 'ai', spec: 'ai@7.0.34' },
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

function publishedVersion(name, tag) {
  const entry = Array.isArray(summary)
    ? summary.find((item) => item?.packageName === name)
    : undefined;
  if (validVersion(entry?.version)) return entry.version;

  const output = execFileSync(
    'npm',
    ['view', tag ? `${name}@${tag}` : name, 'version', '--registry=https://registry.npmjs.org'],
    { encoding: 'utf8', env: { ...process.env, npm_config_loglevel: 'error' } },
  ).trim();
  if (!validVersion(output)) {
    throw new Error(`npm returned an invalid published version for ${name}: ${output}`);
  }
  return output;
}

function waitForPublishedVersion(name, tag) {
  const attempts = 30;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const version = publishedVersion(name, tag);
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

function createLocalPackageSpecs(consumerRoot) {
  const packDirectory = path.join(consumerRoot, 'local-packages');
  mkdirSync(packDirectory, { recursive: true });
  return packages.map(({ name, directory }) => {
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
  const moduleNames = selectedPackages.flatMap(({ imports }) => imports.map(({ specifier }) => specifier));
  const expectedExports = Object.fromEntries(
    selectedPackages.flatMap(({ imports }) => imports.map(({ specifier, exports }) => [specifier, exports])),
  );
  const source = `
const expected = ${JSON.stringify(expectedExports)};
for (const [name, exports] of Object.entries(expected)) {
  const module = require(name);
  for (const exportName of exports) {
    if (typeof module[exportName] !== 'function' && typeof module[exportName] !== 'object') {
      throw new Error(name + ' is missing export ' + exportName);
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
    selectedPackages.flatMap(({ imports }) => imports.map(({ specifier, exports }) => [specifier, exports])),
  );
  const source = `
const expected = ${JSON.stringify(expectedExports)};
for (const [name, exports] of Object.entries(expected)) {
  const module = await import(name);
  for (const exportName of exports) {
    if (typeof module[exportName] !== 'function' && typeof module[exportName] !== 'object') {
      throw new Error(name + ' is missing ESM export ' + exportName);
    }
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

/** Verify the public declarations from the same tarballs a consumer installs.
 * This specifically guards WebMCP's dependency on the newest tool-protocol
 * contract rather than relying on workspace declaration resolution. */
function runConsumerTypecheck(consumerRoot, selectedPackages) {
  const names = new Set(selectedPackages.map(({ name }) => name));
  if (!names.has('@context-action/core')
    || !names.has('@context-action/react')
    || !names.has('@context-action/tool-protocol')
    || !names.has('@context-action/webmcp')) return;
  const source = `
import { ActionRegister } from '@context-action/core';
import { createActionContext } from '@context-action/react';
import type {
  ToolCallOptions,
  ToolDefinition,
  ToolInteractionHandler,
} from '@context-action/tool-protocol';
import { createWebMCPToolScope, type WebMCPToolScopeOptions } from '@context-action/webmcp';
import { chromeLegacyWebMCPProfile } from '@context-action/webmcp/profiles/chrome-legacy';

const interaction: ToolInteractionHandler = async () => 'approved';
const callOptions: ToolCallOptions = { interaction };
const definition: ToolDefinition = {
  name: 'consumer-check',
  description: 'Verifies packed public declarations.',
  inputSchema: { type: 'object' },
  transports: { webmcp: { untrustedContentHint: true } },
};
const scope: WebMCPToolScopeOptions = {
  sessionId: 'consumer-check',
  toolNames: [definition.name],
  interaction,
};
const register = new ActionRegister();
const actions = createActionContext('consumer-check');
void callOptions;
void scope;
void createWebMCPToolScope;
void chromeLegacyWebMCPProfile;
void register;
void actions;
`;
  for (const extension of ['mts', 'cts']) {
    const sourcePath = path.join(consumerRoot, `index.${extension}`);
    writeFileSync(sourcePath, source);
    execFileSync(
      process.execPath,
      [path.join(consumerRoot, 'node_modules/typescript/bin/tsc'), '--noEmit', '--strict', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--target', 'ES2022', sourcePath],
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
  const tag = optionValue('--tag');
  if (tag && !/^[a-z][a-z0-9._-]*$/u.test(tag)) throw new Error(`Invalid npm dist-tag: ${tag}`);
  const requestedPackages = optionValue('--packages')?.split(',').filter(Boolean);
  const selectedPackages = requestedPackages
    ? packages.filter(({ name }) => requestedPackages.includes(name))
    : packages;
  if (selectedPackages.length === 0 || (requestedPackages && selectedPackages.length !== requestedPackages.length)) {
    throw new Error('Requested published consumer packages must be known package names');
  }
  const consumerRoot = mkdtempSync(path.join(os.tmpdir(), 'context-action-tool-consumer-'));
  try {
    const packageSpecs = local
      ? createLocalPackageSpecs(consumerRoot).filter(({ name }) => selectedPackages.some(pkg => pkg.name === name))
      : selectedPackages.map(({ name }) => {
          const version = waitForPublishedVersion(name, tag);
          return { name, spec: `${name}@${version}` };
        });
    packageSpecs.push(...consumerRuntimeDependencies);

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
          overrides: local
            ? Object.fromEntries(packageSpecs
              .filter(({ name }) => name.startsWith('@context-action/'))
              .map(({ name, spec }) => [name, spec]))
            : undefined,
        },
        null,
        2,
      ),
    );
    const npmConfigPath = path.join(consumerRoot, '.npmrc');
    const npmAuth = process.env.NODE_AUTH_TOKEN
      ? '//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}\n'
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
    runConsumerSmoke(consumerRoot, selectedPackages);
    runConsumerEsmSmoke(consumerRoot, selectedPackages);
    runConsumerTypecheck(consumerRoot, selectedPackages);
    runReactSsrMatrix(consumerRoot, selectedPackages, npmConfigPath);
    process.stdout.write(
      `${local ? 'Local tarball' : 'Published'} tool package consumer matrix passed (CJS, ESM, NodeNext declarations, React 18/19 SSR): ${packageSpecs.map(({ spec }) => spec).join(', ')}\n`,
    );
  } finally {
    rmSync(consumerRoot, { recursive: true, force: true });
  }
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
}
