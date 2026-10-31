#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { retryTransientRegistryVisibility } from './registry-visibility-retry.cjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(repositoryRoot, 'releases', 'core-public-2026-10-patch-1.json');
const packageName = '@context-action/core';
const expectedRepository = 'https://github.com/mineclover/context-action';
const expectedWorkflowPath = '.github/workflows/publish-core-public-candidate.yml';
const args = new Map(process.argv.slice(2).filter(value => value !== '--').reduce((pairs, value, index, list) => {
  if (value.startsWith('--')) pairs.push([value, list[index + 1]]);
  return pairs;
}, []));
const tag = args.get('--tag');
const commit = args.get('--commit');
const output = args.get('--output');
if (!['next', 'latest'].includes(tag) || !/^[a-f0-9]{40}$/u.test(commit ?? '')) {
  throw new Error('Usage: verify-core-public-provenance.mjs --tag <next|latest> --commit <40-char SHA> [--output <path>]');
}

const plan = JSON.parse(await readFile(planPath, 'utf8'));
const version = plan.packages?.[packageName];
if (typeof version !== 'string') throw new Error(`Core public release plan is missing ${packageName}`);

function run(command, commandArgs, cwd = repositoryRoot) {
  const env = Object.fromEntries(Object.entries(process.env)
    .filter(([name]) => !name.toLowerCase().startsWith('npm_config_')));
  const result = spawnSync(command, commandArgs, { cwd, encoding: 'utf8', env });
  if (result.status !== 0) {
    throw new Error(`${command} ${commandArgs.join(' ')} failed:\n${result.stdout ?? ''}${result.stderr ?? ''}`);
  }
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

function retryMessage(label) {
  return ({ nextAttempt, delay }) => {
    console.warn(`${label}; retrying in ${delay}ms (attempt ${nextAttempt})`);
  };
}

async function readDistTags() {
  return retryTransientRegistryVisibility(async () => {
    const tags = JSON.parse(run('npm', [
      'view', packageName, 'dist-tags', '--json', '--registry=https://registry.npmjs.org',
    ]));
    if (tags?.[tag] !== version) {
      const error = new Error(`${packageName} ${tag} tag must resolve to ${version}`);
      error.retryableRegistryVisibility = true;
      throw error;
    }
    return tags;
  }, { onRetry: retryMessage('npm dist-tag has not propagated') });
}

async function readGitHead() {
  return retryTransientRegistryVisibility(async () => {
    const raw = run('npm', [
      'view', `${packageName}@${version}`, 'gitHead', '--json', '--registry=https://registry.npmjs.org',
    ]).trim();
    if (!raw || raw === 'null') return null;
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === 'string' ? parsed : null;
    } catch {
      return raw.replace(/^"|"$/gu, '') || null;
    }
  }, { onRetry: retryMessage('npm package metadata has not propagated') });
}

async function npmInstall(directory) {
  await retryTransientRegistryVisibility(async attempt => {
    const cache = await mkdtemp(path.join(directory, `.npm-cache-${attempt ?? 0}-`));
    try {
      const result = spawnSync('npm', [
        'install', '--ignore-scripts', '--no-audit', '--prefer-online',
        '--registry=https://registry.npmjs.org', '--cache', cache,
        `${packageName}@${version}`,
      ], { cwd: directory, encoding: 'utf8', env: { ...process.env } });
      if (result.status === 0) return result.stdout;
      const error = new Error(`npm install failed:\n${result.stdout ?? ''}${result.stderr ?? ''}`);
      error.code = result.error?.code;
      throw error;
    } finally {
      await rm(cache, { recursive: true, force: true });
    }
  }, { onRetry: retryMessage('npm registry propagation returned ETARGET') });
}

const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'context-action-core-provenance-'));
try {
  await readDistTags();
  const gitHead = await readGitHead();
  if (gitHead && gitHead !== commit) throw new Error(`${packageName}@${version} gitHead ${gitHead} does not match ${commit}`);

  await writeFile(path.join(temporaryDirectory, 'package.json'), `${JSON.stringify({
    name: 'context-action-core-provenance-verifier',
    private: true,
    version: '0.0.0',
    dependencies: { [packageName]: version },
  }, null, 2)}\n`);
  await npmInstall(temporaryDirectory);

  const audit = JSON.parse(await retryTransientRegistryVisibility(async () => {
    return run('npm', ['audit', 'signatures', '--json', '--include-attestations'], temporaryDirectory);
  }, { onRetry: retryMessage('npm audit signatures propagation returned ETARGET') }));
  if ((audit.invalid?.length ?? 0) > 0 || (audit.missing?.length ?? 0) > 0) {
    throw new Error('npm audit signatures reported invalid or missing attestations');
  }
  const entry = new Map((audit.verified ?? []).map(value => [`${value.name}@${value.version}`, value]))
    .get(`${packageName}@${version}`);
  const bundle = entry?.attestationBundles?.find(value => value.predicateType === 'https://slsa.dev/provenance/v1');
  if (!bundle) throw new Error(`No SLSA provenance attestation was returned for ${packageName}@${version}`);
  const statement = decodeStatement(bundle.bundle);
  const workflow = statement?.predicate?.buildDefinition?.externalParameters?.workflow;
  const sourceCommit = attestedCommit(statement);
  if (sourceCommit !== commit
    || workflow?.repository !== expectedRepository
    || workflow?.path !== expectedWorkflowPath
    || workflow?.ref !== 'refs/heads/main') {
    throw new Error(`Attested source does not match the Core public release contract for ${packageName}@${version}`);
  }

  const report = {
    schemaVersion: 'context-action-core-public-provenance.v1',
    status: 'verified',
    package: packageName,
    version,
    distTag: tag,
    candidateCommit: commit,
    gitHead: gitHead ?? null,
    provenance: { status: 'verified', sourceCommit, workflow },
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
