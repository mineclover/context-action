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

async function verifyPrePublicationAudit(audit, expectedCommit) {
  const errors = [];
  if (audit?.status !== 'accepted') return ['An accepted pre-publication audit is required'];
  if (audit.rcCommit !== expectedCommit) errors.push('Pre-publication audit is not bound to the requested release commit');
  if (typeof audit.evidence !== 'string' || typeof audit.evidenceSha256 !== 'string'
    || !/^[a-f0-9]{64}$/u.test(audit.evidenceSha256)) {
    errors.push('Pre-publication audit requires an evidence path and SHA-256');
    return errors;
  }
  const resolved = path.resolve(repositoryRoot, audit.evidence);
  if (resolved !== repositoryRoot && !resolved.startsWith(`${repositoryRoot}${path.sep}`)) {
    errors.push('Pre-publication audit evidence must stay within the repository');
    return errors;
  }
  try {
    const evidence = await readFile(resolved);
    if (createHash('sha256').update(evidence).digest('hex') !== audit.evidenceSha256) {
      errors.push('Pre-publication audit evidence hash does not match');
    }
  } catch {
    errors.push('Pre-publication audit evidence is missing');
  }
  return errors;
}

async function main() {
  const expectedCommit = option('--commit');
  if (!expectedCommit || !/^[a-f0-9]{40}$/u.test(expectedCommit)) {
    throw new Error('Usage: node scripts/verify-stable-publish-authorization.mjs --commit <40-character SHA>');
  }

  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const errors = [];
  if (manifest.status !== 'candidate-approved-for-publish') {
    errors.push(`Publish requires candidate-approved-for-publish status, received ${String(manifest.status)}`);
  }
  if (manifest.commit !== expectedCommit) {
    errors.push('Manifest commit does not match the requested release commit');
  }
  if (currentCommit() !== expectedCommit) {
    errors.push('Checked-out commit does not match the requested release commit');
  }
  errors.push(...await verifyPrePublicationAudit(manifest.prePublicationAudit, expectedCommit));
  if (manifest.distTag !== null || manifest.registryEvidence !== null || manifest.audit !== null) {
    errors.push('Pre-publication authorization must not include published-artifact evidence');
  }
  if (errors.length > 0) throw new Error(errors.join('\n'));

  console.log(JSON.stringify({ status: 'authorized', commit: expectedCommit }));
}

main().catch(error => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
