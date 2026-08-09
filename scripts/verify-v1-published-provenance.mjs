#!/usr/bin/env node

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(repositoryRoot, 'docs/releases/v1.0.0/release-manifest.json');
const expectedRepository = 'https://github.com/mineclover/context-action';
const expectedWorkflowPath = '.github/workflows/publish-v1-stable-candidate.yml';

function option(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function run(command, args, cwd) {
  const environment = Object.fromEntries(Object.entries(process.env).filter(([name]) =>
    !name.toLowerCase().startsWith('npm_config_')));
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', env: environment });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed:\n${result.stdout}${result.stderr}`);
  }
  return result.stdout;
}

function decodeStatement(bundle) {
  const payload = bundle?.dsseEnvelope?.payload;
  if (typeof payload !== 'string') throw new Error('SLSA attestation has no DSSE payload');
  return JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
}

function sourceCommit(statement) {
  const dependency = statement?.predicate?.buildDefinition?.resolvedDependencies?.find(candidate =>
    typeof candidate?.digest?.gitCommit === 'string');
  return dependency?.digest?.gitCommit;
}

function outputPath(value) {
  if (!value) return null;
  const resolved = path.resolve(repositoryRoot, value);
  if (resolved !== repositoryRoot && !resolved.startsWith(`${repositoryRoot}${path.sep}`)) {
    throw new Error('--output must stay within the repository');
  }
  return resolved;
}

async function main() {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const packageEntries = Object.entries(manifest.packages ?? {});
  if (packageEntries.length === 0) throw new Error('Release manifest has no package cohort');
  if (!/^[a-f0-9]{40}$/u.test(manifest.commit ?? '')) {
    throw new Error('Release manifest must record the expected 40-character source commit');
  }

  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'context-action-v1-provenance-'));
  try {
    await writeFile(path.join(temporaryDirectory, 'package.json'), `${JSON.stringify({
      name: 'context-action-v1-provenance-verifier',
      private: true,
      version: '0.0.0',
      dependencies: Object.fromEntries(packageEntries),
    }, null, 2)}\n`);
    const packageSpecs = packageEntries.map(([name, version]) => `${name}@${version}`);
    run('npm', ['install', '--ignore-scripts', '--no-audit', ...packageSpecs], temporaryDirectory);
    const audit = JSON.parse(run('npm', ['audit', 'signatures', '--json', '--include-attestations'], temporaryDirectory));
    if ((audit.invalid?.length ?? 0) > 0 || (audit.missing?.length ?? 0) > 0) {
      throw new Error(`npm audit signatures reported invalid or missing attestations: ${JSON.stringify({ invalid: audit.invalid, missing: audit.missing })}`);
    }

    const verified = new Map((audit.verified ?? []).map(entry => [`${entry.name}@${entry.version}`, entry]));
    const results = [];
    for (const [name, version] of packageEntries) {
      const entry = verified.get(`${name}@${version}`);
      if (!entry) throw new Error(`npm audit signatures did not verify ${name}@${version}`);
      const slsa = entry.attestationBundles?.find(bundle => bundle.predicateType === 'https://slsa.dev/provenance/v1');
      if (!slsa) throw new Error(`No SLSA provenance attestation was returned for ${name}@${version}`);
      const statement = decodeStatement(slsa.bundle);
      const workflow = statement?.predicate?.buildDefinition?.externalParameters?.workflow;
      const commit = sourceCommit(statement);
      if (commit !== manifest.commit
        || workflow?.repository !== expectedRepository
        || workflow?.path !== expectedWorkflowPath
        || workflow?.ref !== 'refs/heads/main') {
        throw new Error(`Attested source does not match the v1 release contract for ${name}@${version}`);
      }
      results.push({
        name,
        version,
        sourceCommit: commit,
        workflow: { repository: workflow.repository, path: workflow.path, ref: workflow.ref },
        run: statement?.predicate?.runDetails?.metadata?.invocationId ?? null,
        attestationUrl: entry.attestations?.url ?? null,
      });
    }

    const result = {
      schemaVersion: 'context-action-v1-provenance-verification.v1',
      status: 'verified',
      verifier: 'npm audit signatures --include-attestations',
      verifiedAt: new Date().toISOString(),
      sourceCommit: manifest.commit,
      packages: results,
    };
    const output = outputPath(option('--output'));
    if (output) await writeFile(output, `${JSON.stringify(result, null, 2)}\n`);
    console.log(JSON.stringify(result));
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
