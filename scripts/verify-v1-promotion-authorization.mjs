#!/usr/bin/env node

import { createHash } from 'node:crypto';
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

async function verifyAcceptedAudit(audit, expectedCommit) {
  const errors = [];
  if (audit?.status !== 'accepted') return ['Promotion requires an accepted independent published-artifact audit'];
  if (typeof audit.reviewer !== 'string' || audit.reviewer.trim().length === 0) {
    errors.push('Accepted audit requires a named independent reviewer');
  }
  if (audit.reviewedCommit !== expectedCommit) {
    errors.push('Accepted audit must bind the requested release commit');
  }
  for (const [label, target, expectedHash] of [
    ['report', audit.report, audit.reportSha256],
    ['evidence', audit.evidence, audit.evidenceSha256],
  ]) {
    if (typeof target !== 'string' || typeof expectedHash !== 'string' || !/^[a-f0-9]{64}$/u.test(expectedHash)) {
      errors.push(`Accepted audit requires a hashed ${label} path`);
      continue;
    }
    const resolved = path.resolve(repositoryRoot, target);
    if (resolved !== repositoryRoot && !resolved.startsWith(`${repositoryRoot}${path.sep}`)) {
      errors.push(`Accepted audit ${label} must stay within the repository`);
      continue;
    }
    try {
      const contents = await readFile(resolved);
      if (createHash('sha256').update(contents).digest('hex') !== expectedHash) {
        errors.push(`Accepted audit ${label} hash does not match`);
      }
    } catch {
      errors.push(`Accepted audit ${label} is missing`);
    }
  }
  return errors;
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
  errors.push(...await verifyAcceptedAudit(manifest.audit, expectedCommit));

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
