#!/usr/bin/env node

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const expectedRepository = 'https://github.com/mineclover/context-action';
const expectedWorkflowPath = '.github/workflows/publish-maintenance-patch.yml';

function option(name, { required = false } = {}) {
  const index = process.argv.indexOf(name);
  const value = index === -1 ? undefined : process.argv[index + 1];
  if (index !== -1 && (!value || value.startsWith('--'))) throw new Error(`${name} requires a value`);
  if (required && !value) throw new Error(`${name} is required`);
  return value;
}

function run(command, argumentsList, cwd) {
  const environment = Object.fromEntries(Object.entries(process.env).filter(([name]) =>
    !name.toLowerCase().startsWith('npm_config_')));
  const result = spawnSync(command, argumentsList, { cwd, encoding: 'utf8', env: environment });
  if (result.status !== 0) throw new Error(`${command} ${argumentsList.join(' ')} failed:\n${result.stdout}${result.stderr}`);
  return result.stdout;
}

function decodeStatement(bundle) {
  const payload = bundle?.dsseEnvelope?.payload;
  if (typeof payload !== 'string') throw new Error('SLSA attestation has no DSSE payload');
  return JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
}

function attestedSourceCommit(statement) {
  return statement?.predicate?.buildDefinition?.resolvedDependencies?.find(entry =>
    typeof entry?.digest?.gitCommit === 'string')?.digest?.gitCommit;
}

const packageName = option('--package', { required: true });
const version = option('--version', { required: true });
const sourceCommit = option('--source-commit', { required: true });
const output = option('--output', { required: true });
if (!/^@context-action\/[a-z0-9-]+$/u.test(packageName)
  || !/^\d+\.\d+\.\d+$/u.test(version)
  || !/^[a-f0-9]{40}$/u.test(sourceCommit)) {
  throw new Error('Invalid maintenance provenance contract input');
}

const outputPath = path.resolve(output);
function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

async function verifyAttestation() {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'context-action-maintenance-provenance-'));
  try {
  await writeFile(path.join(temporaryDirectory, 'package.json'), `${JSON.stringify({
    name: 'context-action-maintenance-provenance-verifier', private: true, version: '0.0.0',
    dependencies: { [packageName]: version },
  }, null, 2)}\n`);
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', `${packageName}@${version}`], temporaryDirectory);
  const audit = JSON.parse(run('npm', ['audit', 'signatures', '--json', '--include-attestations'], temporaryDirectory));
  if ((audit.invalid?.length ?? 0) > 0 || (audit.missing?.length ?? 0) > 0) {
    throw new Error(`npm audit signatures reported invalid or missing attestations: ${JSON.stringify({ invalid: audit.invalid, missing: audit.missing })}`);
  }
  const entry = (audit.verified ?? []).find(candidate => candidate?.name === packageName && candidate?.version === version);
  if (!entry) throw new Error(`npm audit signatures did not verify ${packageName}@${version}`);
  const slsa = entry.attestationBundles?.find(bundle => bundle.predicateType === 'https://slsa.dev/provenance/v1');
  if (!slsa) throw new Error(`No SLSA provenance attestation was returned for ${packageName}@${version}`);
  const statement = decodeStatement(slsa.bundle);
  const workflow = statement?.predicate?.buildDefinition?.externalParameters?.workflow;
  const attestedCommit = attestedSourceCommit(statement);
  if (attestedCommit !== sourceCommit
    || workflow?.repository !== expectedRepository
    || workflow?.path !== expectedWorkflowPath
    || workflow?.ref !== 'refs/heads/main') {
    throw new Error(`Attested source does not match the maintenance release contract for ${packageName}@${version}`);
  }
  const evidence = {
    schemaVersion: 'context-action-maintenance-provenance.v1',
    status: 'verified',
    verifier: 'npm audit signatures --include-attestations',
    verifiedAt: new Date().toISOString(),
    package: {
      name: packageName,
      version,
      sourceCommit: attestedCommit,
      workflow: { repository: workflow.repository, path: workflow.path, ref: workflow.ref },
      run: statement?.predicate?.runDetails?.metadata?.invocationId ?? null,
      attestationUrl: entry.attestations?.url ?? null,
    },
  };
    return evidence;
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

const attempts = 12;
let evidence;
let lastError;
for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    evidence = await verifyAttestation();
    if (attempt > 1) process.stdout.write(`Published provenance became visible after ${attempt} attempts.\n`);
    break;
  } catch (error) {
    lastError = error;
    if (attempt < attempts) {
      process.stdout.write(`Waiting for published provenance (${attempt}/${attempts - 1})...\n`);
      sleep(5_000);
    }
  }
}
if (!evidence) throw lastError;
await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(evidence));
