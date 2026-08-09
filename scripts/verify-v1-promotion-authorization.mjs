#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(repositoryRoot, 'docs/releases/v1.0.0/release-manifest.json');

function option(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function currentCommit() {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repositoryRoot, encoding: 'utf8' }).trim();
}

async function main() {
  const expectedCommit = option('--commit');
  if (!expectedCommit || !/^[a-f0-9]{40}$/u.test(expectedCommit)) {
    throw new Error('Usage: node scripts/verify-v1-promotion-authorization.mjs --commit <40-character SHA>');
  }

  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const errors = [];
  if (manifest.status !== 'approved-for-stable') {
    errors.push(`Promotion requires approved-for-stable status, received ${String(manifest.status)}`);
  }
  if (manifest.commit !== expectedCommit || currentCommit() !== expectedCommit) {
    errors.push('Requested, manifest, and checked-out commits must match');
  }
  if (manifest.audit?.status !== 'accepted') {
    errors.push('Promotion requires an accepted independent published-artifact audit');
  }

  for (const [name, version] of Object.entries(manifest.packages ?? {})) {
    const evidence = manifest.registryEvidence?.[name];
    if (evidence?.version !== version
      || evidence?.provenance?.status !== 'verified'
      || evidence?.provenance?.sourceCommit !== expectedCommit
      || evidence?.externalConsumer?.status !== 'passed') {
      errors.push(`Promotion requires verified provenance and consumer evidence: ${name}`);
    }
    if (manifest.promotionTargets?.[name] !== 'latest') {
      errors.push(`Promotion target must explicitly set latest: ${name}`);
    }
  }

  if (errors.length > 0) throw new Error(errors.join('\n'));
  console.log(JSON.stringify({ status: 'authorized', commit: expectedCommit, targets: manifest.promotionTargets }));
}

main().catch(error => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
