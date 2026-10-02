#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { retryTransientRegistryVisibility } from './registry-visibility-retry.cjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(repositoryRoot, 'releases', 'preact-public-2026-10.json');
const expectedRepository = 'https://github.com/mineclover/context-action';
const expectedWorkflowPath = '.github/workflows/publish-preact-public-candidate.yml';

function option(name, { required = false } = {}) {
  const index = process.argv.indexOf(name);
  if (index < 0) {
    if (required) throw new Error(`${name} is required`);
    return undefined;
  }
  const value = process.argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`);
  return value;
}

const tag = option('--tag', { required: true });
const commit = option('--commit', { required: true });
const output = option('--output');
if (!['next', 'latest'].includes(tag) || !/^[a-f0-9]{40}$/u.test(commit)) {
  throw new Error('Usage: verify-preact-public-provenance.mjs --tag <next|latest> --commit <40-char SHA> [--output <path>]');
}

const plan = JSON.parse(await readFile(planPath, 'utf8'));
const packages = Object.entries(plan.packages ?? {});
if (JSON.stringify(packages.map(([name]) => name))
  !== JSON.stringify(['@context-action/preact', '@context-action/preact-ui'])) {
  throw new Error('Preact public release plan must contain the exact package order');
}

function run(command, args, cwd) {
  const env = Object.fromEntries(Object.entries(process.env)
    .filter(([name]) => !name.toLowerCase().startsWith('npm_config_')));
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', env });
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed:\n${result.stdout}${result.stderr}`);
  return result.stdout;
}

function decodeStatement(bundle) {
  const payload = bundle?.dsseEnvelope?.payload;
  if (typeof payload !== 'string') throw new Error('SLSA attestation has no DSSE payload');
  return JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
}

function attestedCommit(statement) {
  return statement?.predicate?.buildDefinition?.resolvedDependencies
    ?.find(value => typeof value?.digest?.gitCommit === 'string')?.digest?.gitCommit;
}

async function npmInstall(directory) {
  await retryTransientRegistryVisibility(async attempt => {
    const cache = await mkdtemp(path.join(directory, `.npm-cache-${attempt ?? 0}-`));
    try {
      const result = spawnSync('npm', [
        'install', '--ignore-scripts', '--no-audit', '--prefer-online',
        '--registry=https://registry.npmjs.org', '--cache', cache,
        ...packages.map(([name, version]) => `${name}@${version}`),
      ], { cwd: directory, encoding: 'utf8', env: { ...process.env } });
      if (result.status === 0) return result.stdout;
      const error = new Error(`npm install failed:\n${result.stdout}${result.stderr}`);
      error.code = result.error?.code;
      throw error;
    } finally {
      await rm(cache, { recursive: true, force: true });
    }
  }, {
    onRetry: ({ attempt, nextAttempt, delay }) => {
      console.warn(`npm registry propagation returned ETARGET; retrying in ${delay}ms (attempt ${nextAttempt})`);
    },
  });
}

const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'context-action-preact-provenance-'));
try {
  await writeFile(path.join(temporaryDirectory, 'package.json'), `${JSON.stringify({
    name: 'context-action-preact-provenance-verifier',
    private: true,
    version: '0.0.0',
    dependencies: Object.fromEntries(packages),
  }, null, 2)}\n`);
  await npmInstall(temporaryDirectory);
  const audit = JSON.parse(run('npm', ['audit', 'signatures', '--json', '--include-attestations'], temporaryDirectory));
  if ((audit.invalid?.length ?? 0) > 0 || (audit.missing?.length ?? 0) > 0) {
    throw new Error('npm audit signatures reported invalid or missing attestations');
  }
  const verified = new Map((audit.verified ?? []).map(entry => [`${entry.name}@${entry.version}`, entry]));
  const results = [];
  for (const [name, version] of packages) {
    const tags = JSON.parse(execFileSync('npm', ['view', name, 'dist-tags', '--json', '--registry=https://registry.npmjs.org'], {
      cwd: repositoryRoot,
      encoding: 'utf8',
    }));
    if (tags?.[tag] !== version) throw new Error(`${name} ${tag} tag must resolve to ${version}`);
    const entry = verified.get(`${name}@${version}`);
    const bundle = entry?.attestationBundles?.find(value => value.predicateType === 'https://slsa.dev/provenance/v1');
    if (!bundle) throw new Error(`No SLSA provenance attestation was returned for ${name}@${version}`);
    const statement = decodeStatement(bundle.bundle);
    const workflow = statement?.predicate?.buildDefinition?.externalParameters?.workflow;
    if (attestedCommit(statement) !== commit
      || workflow?.repository !== expectedRepository
      || workflow?.path !== expectedWorkflowPath
      || workflow?.ref !== 'refs/heads/main') {
      throw new Error(`Attested source does not match the public Preact release contract for ${name}@${version}`);
    }
    results.push({ name, version, sourceCommit: commit, workflow });
  }
  const report = {
    schemaVersion: 'context-action-preact-public-provenance.v1',
    status: 'verified',
    candidateCommit: commit,
    distTag: tag,
    packages: results,
  };
  if (output) {
    const outputPath = path.resolve(repositoryRoot, output);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  }
  console.log(JSON.stringify(report));
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
