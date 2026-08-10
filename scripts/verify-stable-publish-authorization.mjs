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
    throw new Error('Usage: node scripts/verify-stable-publish-authorization.mjs --commit <40-character SHA>');
  }

  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const artifactCohort = manifest.artifactCohort ?? {};
  const errors = [];
  if (manifest.status !== 'candidate-approved-for-publish') {
    errors.push(`Publish requires candidate-approved-for-publish status, received ${String(manifest.status)}`);
  }
  if (artifactCohort.commit !== expectedCommit) {
    errors.push('Manifest commit does not match the requested release commit');
  }
  if (currentCommit() !== expectedCommit) {
    errors.push('Checked-out commit does not match the requested release commit');
  }
  if (artifactCohort.distTag !== null || artifactCohort.registryEvidence !== null) {
    errors.push('Pre-publication authorization must not include published-artifact evidence');
  }
  if (errors.length > 0) throw new Error(errors.join('\n'));

  console.log(JSON.stringify({ status: 'authorized', commit: expectedCommit }));
}

main().catch(error => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
