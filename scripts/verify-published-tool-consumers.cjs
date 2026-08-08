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
    imports: [{
      specifier: '@context-action/react/tools',
      exports: ['createToolContext'],
    }],
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
    imports: [{
      specifier: '@context-action/webmcp',
      exports: ['createWebMCPToolScope'],
    }],
  },
];

const consumerRuntimeDependencies = [
  { name: 'react', spec: 'react@19.2.8' },
  { name: 'ai', spec: 'ai@7.0.34' },
  { name: 'typescript', spec: 'typescript@6.0.3' },
];

const repositoryRoot = path.resolve(__dirname, '..');

function validVersion(value) {
  return typeof value === 'string'
    && /^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/u.test(value);
}

function publishedVersion(name) {
  const entry = Array.isArray(summary)
    ? summary.find((item) => item?.packageName === name)
    : undefined;
  if (validVersion(entry?.version)) return entry.version;

  const output = execFileSync(
    'npm',
    ['view', name, 'version', '--registry=https://registry.npmjs.org'],
    { encoding: 'utf8', env: { ...process.env, npm_config_loglevel: 'error' } },
  ).trim();
  if (!validVersion(output)) {
    throw new Error(`npm returned an invalid published version for ${name}: ${output}`);
  }
  return output;
}

function waitForPublishedVersion(spec) {
  const attempts = 30;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      publishedVersion(spec);
      if (attempt > 1) {
        process.stdout.write(`npm metadata became visible after ${attempt} attempts.\n`);
      }
      return;
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

function runConsumerSmoke(consumerRoot, packageSpecs) {
  const moduleNames = packages.flatMap(({ imports }) => imports.map(({ specifier }) => specifier));
  const expectedExports = Object.fromEntries(
    packages.flatMap(({ imports }) => imports.map(({ specifier, exports }) => [specifier, exports])),
  );
  const source = `
const expected = ${JSON.stringify(expectedExports)};
for (const [name, exports] of Object.entries(expected)) {
  const module = require(name);
  for (const exportName of exports) {
    if (typeof module[exportName] !== 'function') {
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

/** Verify the public declarations from the same tarballs a consumer installs.
 * This specifically guards WebMCP's dependency on the newest tool-protocol
 * contract rather than relying on workspace declaration resolution. */
function runLocalConsumerTypecheck(consumerRoot) {
  const sourcePath = path.join(consumerRoot, 'index.ts');
  writeFileSync(sourcePath, `
import type {
  ToolCallOptions,
  ToolDefinition,
  ToolInteractionHandler,
} from '@context-action/tool-protocol';
import type { WebMCPToolScopeOptions } from '@context-action/webmcp';

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
void callOptions;
void scope;
`);
  execFileSync(
    process.execPath,
    [path.join(consumerRoot, 'node_modules/typescript/bin/tsc'), '--noEmit', '--strict', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--target', 'ES2022', sourcePath],
    { cwd: consumerRoot, stdio: 'inherit', env: { ...process.env } },
  );
}

function isolatedNpmEnvironment() {
  return Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) => !/^(npm_config|pnpm_config)_/iu.test(key),
    ),
  );
}

function main() {
  const local = process.argv.includes('--local');
  const consumerRoot = mkdtempSync(path.join(os.tmpdir(), 'context-action-tool-consumer-'));
  try {
    const packageSpecs = local
      ? createLocalPackageSpecs(consumerRoot)
      : packages.map(({ name }) => {
          const version = publishedVersion(name);
          return { name, spec: `${name}@${version}` };
        });
    if (!local) packageSpecs.forEach(({ spec }) => waitForPublishedVersion(spec));
    packageSpecs.push(...consumerRuntimeDependencies);

    writeFileSync(
      path.join(consumerRoot, 'package.json'),
      JSON.stringify(
        {
          name: 'context-action-tool-consumer-smoke',
          private: true,
          allowScripts: [],
        },
        null,
        2,
      ),
    );
    const npmConfigPath = path.join(consumerRoot, '.npmrc');
    writeFileSync(npmConfigPath, 'ignore-scripts=true\naudit=false\nfund=false\n');
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
        ...packageSpecs.map(({ spec }) => spec),
      ],
      {
        cwd: consumerRoot,
        stdio: 'inherit',
        env: isolatedNpmEnvironment(),
      },
    );
    runConsumerSmoke(consumerRoot, packageSpecs);
    if (local) runLocalConsumerTypecheck(consumerRoot);
    process.stdout.write(
      `${local ? 'Local tarball' : 'Published'} tool package consumer smoke test passed: ${packageSpecs.map(({ spec }) => spec).join(', ')}\n`,
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
