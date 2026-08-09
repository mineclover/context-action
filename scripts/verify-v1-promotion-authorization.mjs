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

async function verifyAcceptedAudit(audit, expectedCommit) {
  const errors = [];
  if (audit?.status !== 'accepted') return ['Promotion requires an accepted independent published-artifact audit'];
  if (typeof audit.reviewer !== 'string' || audit.reviewer.trim().length === 0) {
    errors.push('Accepted audit requires a named independent reviewer');
  }
  if (audit.reviewedCommit !== expectedCommit) {
    errors.push('Accepted audit must bind the requested release commit');
  }
  const review = audit.review;
  if (!review || typeof review !== 'object'
    || typeof review.login !== 'string' || review.login.trim().length === 0
    || typeof review.pullRequest !== 'number' || !Number.isInteger(review.pullRequest) || review.pullRequest <= 0
    || typeof review.reviewId !== 'number' || !Number.isInteger(review.reviewId) || review.reviewId <= 0
    || typeof review.reviewCommit !== 'string' || !/^[a-f0-9]{40}$/u.test(review.reviewCommit)
    || review.decision !== 'APPROVED') {
    errors.push('Accepted audit requires a GitHub approval identity, PR, review ID, commit, and APPROVED decision');
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

async function verifyReleaseApproval(approval, expectedCommit, governance) {
  const errors = [];
  if (approval?.status !== 'accepted') return ['Promotion requires an accepted G0/G1 release approval'];
  if (typeof approval.owner !== 'string' || approval.owner.trim().length === 0) {
    errors.push('Accepted release approval requires a named owner');
  }
  if (approval.reviewedCommit !== expectedCommit) {
    errors.push('Accepted release approval must bind the requested release commit');
  }
  if (!governance || approval.promotionGovernanceCommit !== governance.commit
    || approval.promotionGovernanceEvidenceSha256 !== governance.evidenceSha256
    || approval.promotionGovernanceFingerprintSha256 !== governance.fingerprintSha256) {
    errors.push('Accepted release approval must bind the exact promotion-governance commit, evidence hash, and fingerprint');
  }
  const files = [
    ['record', approval.record, approval.recordSha256],
    ['scope', 'docs/releases/v1.0.0/scope.md', approval.scopeSha256],
    ['contract candidates', 'docs/releases/v1.0.0/contract-candidates.md', approval.contractSha256],
    ['legacy ledger', 'docs/releases/v1.0.0/legacy-ledger.md', approval.legacyLedgerSha256],
  ];
  for (const [label, target, expectedHash] of files) {
    if (typeof target !== 'string' || typeof expectedHash !== 'string' || !/^[a-f0-9]{64}$/u.test(expectedHash)) {
      errors.push(`Accepted release approval requires a hashed ${label} path`);
      continue;
    }
    const resolved = path.resolve(repositoryRoot, target);
    if (resolved !== repositoryRoot && !resolved.startsWith(`${repositoryRoot}${path.sep}`)) {
      errors.push(`Accepted release approval ${label} must stay within the repository`);
      continue;
    }
    try {
      const contents = await readFile(resolved);
      if (createHash('sha256').update(contents).digest('hex') !== expectedHash) {
        errors.push(`Accepted release approval ${label} hash does not match`);
      }
    } catch {
      errors.push(`Accepted release approval ${label} is missing`);
    }
  }
  return errors;
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
  errors.push(...await verifyAcceptedAudit(manifest.audit, expectedCommit));
  errors.push(...await verifyReleaseApproval(manifest.releaseApproval, expectedCommit, manifest.promotionGovernance));
  errors.push(...await verifyPromotionGovernance(manifest.promotionGovernance, governanceCommit));
  if (manifest.registryHygiene?.status !== 'cleared') {
    errors.push('Promotion requires cleared registry hygiene');
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
  console.log(JSON.stringify({
    status: 'authorized', artifactCommit: expectedCommit, governanceCommit, targets: manifest.promotionTargets,
  }));
}

main().catch(error => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
