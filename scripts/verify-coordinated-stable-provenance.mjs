#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(repositoryRoot, 'releases', 'coordinated-stable-2026-08.json');
const expectedRepository = 'https://github.com/mineclover/context-action';
const expectedWorkflowPath = '.github/workflows/publish-coordinated-stable-candidate.yml';
const expectedPackages = new Set(['@context-action/core', '@context-action/react']);

function option(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function run(command, argumentsList, cwd) {
  const environment = Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.toLowerCase().startsWith('npm_config_')));
  const result = spawnSync(command, argumentsList, { cwd, encoding: 'utf8', env: environment });
  if (result.status !== 0) throw new Error(`${command} ${argumentsList.join(' ')} failed:\n${result.stdout}${result.stderr}`);
  return result.stdout;
}

function decodeStatement(bundle) {
  const payload = bundle?.dsseEnvelope?.payload;
  if (typeof payload !== 'string') throw new Error('SLSA attestation has no DSSE payload');
  return JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
}

function attestedCommit(statement) {
  return statement?.predicate?.buildDefinition?.resolvedDependencies?.find(value => typeof value?.digest?.gitCommit === 'string')?.digest?.gitCommit;
}

const tag = option('--tag');
const commit = option('--commit');
const output = option('--output');
if (!['next', 'latest'].includes(tag) || !/^[a-f0-9]{40}$/u.test(commit ?? '')) {
  throw new Error('Usage: node scripts/verify-coordinated-stable-provenance.mjs --tag <next|latest> --commit <40-char SHA> [--output <path>]');
}

const plan = JSON.parse(await readFile(planPath, 'utf8'));
const packages = Object.entries(plan.packages ?? {});
if (packages.length !== expectedPackages.size || packages.some(([name]) => !expectedPackages.has(name))) {
  throw new Error('Coordinated stable release plan must contain the exact Core and React cohort');
}
const provenanceCommits = plan.provenanceCommits ?? {};
if (
  Object.keys(provenanceCommits).length !== expectedPackages.size
  || Object.entries(provenanceCommits).some(([name, sourceCommit]) =>
    !expectedPackages.has(name) || !/^[a-f0-9]{40}$/u.test(sourceCommit)
  )
) {
  throw new Error('Coordinated stable release plan must bind every package to an immutable provenance commit');
}
const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'context-action-coordinated-provenance-'));
try {
  await writeFile(path.join(temporaryDirectory, 'package.json'), `${JSON.stringify({
    name: 'context-action-coordinated-provenance-verifier', private: true, version: '0.0.0', dependencies: Object.fromEntries(packages),
  }, null, 2)}\n`);
  run('npm', ['install', '--ignore-scripts', '--no-audit', ...packages.map(([name, version]) => `${name}@${version}`)], temporaryDirectory);
  const audit = JSON.parse(run('npm', ['audit', 'signatures', '--json', '--include-attestations'], temporaryDirectory));
  if ((audit.invalid?.length ?? 0) > 0 || (audit.missing?.length ?? 0) > 0) throw new Error('npm audit signatures reported invalid or missing attestations');
  const verified = new Map((audit.verified ?? []).map(entry => [`${entry.name}@${entry.version}`, entry]));
  const results = [];
  for (const [name, version] of packages) {
    const tags = JSON.parse(execFileSync('npm', ['view', name, 'dist-tags', '--json', '--registry=https://registry.npmjs.org'], { cwd: repositoryRoot, encoding: 'utf8' }));
    if (tags?.[tag] !== version) throw new Error(`${name} ${tag} tag must resolve to ${version}`);
    const entry = verified.get(`${name}@${version}`);
    const bundle = entry?.attestationBundles?.find(value => value.predicateType === 'https://slsa.dev/provenance/v1');
    if (!bundle) throw new Error(`No SLSA provenance attestation was returned for ${name}@${version}`);
    const statement = decodeStatement(bundle.bundle);
    const workflow = statement?.predicate?.buildDefinition?.externalParameters?.workflow;
    const sourceCommit = provenanceCommits[name];
    if (attestedCommit(statement) !== sourceCommit || workflow?.repository !== expectedRepository || workflow?.path !== expectedWorkflowPath || workflow?.ref !== 'refs/heads/main') {
      throw new Error(`Attested source does not match the coordinated release contract for ${name}@${version}`);
    }
    results.push({ name, version, sourceCommit, workflow });
  }
  const report = { schemaVersion: 'context-action-coordinated-provenance.v1', status: 'verified', candidateCommit: commit, packages: results };
  if (output) await writeFile(path.join(repositoryRoot, output), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report));
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
