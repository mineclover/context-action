#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promotionGovernanceFingerprint } from './verify-v1-promotion-governance.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(repositoryRoot, 'docs/releases/v1.0.0/release-manifest.json');

function option(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function currentCommit() {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repositoryRoot, encoding: 'utf8' }).trim();
}

async function verifyPromotionGovernance(governance, checkedOutCommit) {
  const errors = [];
  if (!governance || typeof governance !== 'object') return ['Promotion requires a bound promotion-governance record'];
  if (typeof governance.commit !== 'string' || !/^[a-f0-9]{40}$/u.test(governance.commit)) {
    errors.push('Promotion governance requires an immutable evidence commit');
  }
  if (typeof governance.commit === 'string' && /^[a-f0-9]{40}$/u.test(governance.commit)) {
    try {
      execFileSync('git', ['merge-base', '--is-ancestor', governance.commit, checkedOutCommit], {
        cwd: repositoryRoot,
        stdio: 'ignore',
      });
    } catch {
      errors.push('Checked-out governance must descend from the approved governance evidence commit');
    }
  }
  if (typeof governance.evidence !== 'string' || typeof governance.evidenceSha256 !== 'string'
    || !/^[a-f0-9]{64}$/u.test(governance.evidenceSha256)) {
    errors.push('Promotion governance requires a hashed strict evidence manifest');
  } else {
    const resolved = path.resolve(repositoryRoot, governance.evidence);
    if (resolved !== repositoryRoot && !resolved.startsWith(`${repositoryRoot}${path.sep}`)) {
      errors.push('Promotion-governance evidence must stay within the repository');
    } else {
      try {
        const contents = await readFile(resolved);
        if (createHash('sha256').update(contents).digest('hex') !== governance.evidenceSha256) {
          errors.push('Promotion-governance evidence hash does not match');
        }
        const evidence = JSON.parse(contents);
        if (evidence.commit !== governance.commit || evidence.workingTree !== 'clean' || evidence.status !== 'recorded') {
          errors.push('Promotion-governance evidence is not a clean record for its declared commit');
        }
      } catch {
        errors.push('Promotion-governance evidence is missing or invalid');
      }
    }
  }
  if (typeof governance.fingerprintSha256 !== 'string' || !/^[a-f0-9]{64}$/u.test(governance.fingerprintSha256)) {
    errors.push('Promotion governance requires a fingerprint');
  } else if (await promotionGovernanceFingerprint() !== governance.fingerprintSha256) {
    errors.push('Checked-out promotion governance differs from the approved fingerprint');
  }
  if (checkedOutCommit !== currentCommit()) errors.push('Checked-out governance commit changed during authorization');
  return errors;
}

async function main() {
  const expectedCommit = option('--commit');
  const governanceCommit = option('--governance-commit');
  if (!expectedCommit || !/^[a-f0-9]{40}$/u.test(expectedCommit)
    || !governanceCommit || !/^[a-f0-9]{40}$/u.test(governanceCommit)) {
    throw new Error('Usage: node scripts/verify-v1-promotion-authorization.mjs --commit <artifact source SHA> --governance-commit <checked-out SHA>');
  }

  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const errors = [];
  if (manifest.status !== 'approved-for-stable') {
    errors.push(`Promotion requires approved-for-stable status, received ${String(manifest.status)}`);
  }
  if (manifest.commit !== expectedCommit) {
    errors.push('Manifest commit does not match the requested published-artifact source commit');
  }
  if (currentCommit() !== governanceCommit) {
    errors.push('Checked-out governance commit does not match the requested governance commit');
  }
  errors.push(...await verifyPromotionGovernance(manifest.promotionGovernance, governanceCommit));
  if (manifest.registryHygiene?.status !== 'cleared') {
    errors.push('Promotion requires cleared registry hygiene');
  }

  for (const [name, target] of Object.entries(manifest.promotionTargets ?? {})) {
    const version = manifest.packages?.[name];
    const evidence = manifest.registryEvidence?.[name];
    if (evidence?.version !== version
      || evidence?.provenance?.status !== 'verified'
      || evidence?.provenance?.sourceCommit !== expectedCommit
      || evidence?.externalConsumer?.status !== 'passed') {
      errors.push(`Promotion requires verified provenance and consumer evidence: ${name}`);
    }
    if (target !== 'latest') {
      errors.push(`Promotion target must explicitly set latest: ${name}`);
    }
  }

  if (errors.length > 0) throw new Error(errors.join('\n'));
  console.log(JSON.stringify({
    status: 'authorized', artifactCommit: expectedCommit, governanceCommit, targets: manifest.promotionTargets,
  }));
}

main().catch(error => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
