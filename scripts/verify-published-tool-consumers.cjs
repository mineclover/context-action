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
    name: '@context-action/tool-protocol',
    directory: 'packages/tool-protocol',
    exports: ['createActionSchema', 'createToolCallFingerprint'],
  },
  {
    name: '@context-action/tool-durable-operations',
    directory: 'packages/tool-durable-operations',
    exports: ['createDurableOperationStore', 'createDurableSideEffectRunner'],
  },
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
  const moduleNames = packageSpecs.map(({ name }) => name);
  const expectedExports = Object.fromEntries(
    packages.map(({ name, exports }) => [name, exports]),
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
