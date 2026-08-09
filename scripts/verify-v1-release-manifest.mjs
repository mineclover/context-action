#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(repositoryRoot, 'docs/releases/v1.0.0/release-manifest.json');
const schemaPath = path.join(repositoryRoot, 'docs/releases/v1.0.0/release-manifest.schema.json');

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function validateAcceptedAudit(audit, manifestCommit) {
  const errors = [];
  if (audit?.status !== 'accepted') return ['Independent published-artifact audit is not accepted'];
  if (typeof audit.reviewer !== 'string' || audit.reviewer.trim().length === 0) {
    errors.push('Accepted audit requires a named independent reviewer');
  }
  if (audit.reviewedCommit !== manifestCommit) {
    errors.push('Accepted audit must bind the provenance-attested manifest commit');
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
      if (sha256(await readFile(resolved)) !== expectedHash) {
        errors.push(`Accepted audit ${label} hash does not match`);
      }
    } catch {
      errors.push(`Accepted audit ${label} is missing`);
    }
  }
  return errors;
}

async function validateAcceptedPrePublicationAudit(audit, manifestCommit) {
  const errors = [];
  if (audit?.status !== 'accepted') return ['accepted pre-publication audit is required'];
  if (audit.rcCommit !== manifestCommit) {
    errors.push('pre-publication audit must bind the manifest commit');
  }
  if (typeof audit.evidence !== 'string' || typeof audit.evidenceSha256 !== 'string'
    || !/^[a-f0-9]{64}$/u.test(audit.evidenceSha256)) {
    errors.push('pre-publication audit requires an evidence path and SHA-256');
    return errors;
  }
  const resolved = path.resolve(repositoryRoot, audit.evidence);
  if (resolved !== repositoryRoot && !resolved.startsWith(`${repositoryRoot}${path.sep}`)) {
    errors.push('pre-publication audit evidence must stay within the repository');
    return errors;
  }
  try {
    if (sha256(await readFile(resolved)) !== audit.evidenceSha256) {
      errors.push('pre-publication audit evidence hash does not match');
    }
  } catch {
    errors.push('pre-publication audit evidence is missing');
  }
  return errors;
}

async function validateReleaseApproval(approval, manifestCommit) {
  const errors = [];
  if (approval?.status !== 'accepted') return ['G0/G1 release approval is not accepted'];
  if (typeof approval.owner !== 'string' || approval.owner.trim().length === 0) {
    errors.push('Accepted release approval requires a named owner');
  }
  if (approval.reviewedCommit !== manifestCommit) {
    errors.push('Accepted release approval must bind the provenance-attested manifest commit');
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
      if (sha256(await readFile(resolved)) !== expectedHash) {
        errors.push(`Accepted release approval ${label} hash does not match`);
      }
    } catch {
      errors.push(`Accepted release approval ${label} is missing`);
    }
  }
  return errors;
}

async function main() {
  const [manifestSource, schemaSource, reactPackageSource] = await Promise.all([
    readFile(manifestPath, 'utf8'),
    readFile(schemaPath, 'utf8'),
    readFile(path.join(repositoryRoot, 'packages/react/package.json'), 'utf8'),
  ]);
  const manifest = JSON.parse(manifestSource);
  const schema = JSON.parse(schemaSource);
  const reactPackage = JSON.parse(reactPackageSource);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const errors = [];
  if (!validate(manifest)) {
    errors.push(...(validate.errors ?? []).map(error => `Schema ${error.instancePath || '/'} ${error.message}`));
  }
  const packages = manifest.packages && typeof manifest.packages === 'object'
    ? manifest.packages
    : {};
  const stableSurfaces = Array.isArray(manifest.stableSurfaces) ? manifest.stableSurfaces : [];
  const experimentalSurfaces = Array.isArray(manifest.experimentalSurfaces)
    ? manifest.experimentalSurfaces
    : [];
  for (const surface of stableSurfaces) {
    if (typeof packages[surface] !== 'string') {
      errors.push(`Stable surface is missing a package version: ${surface}`);
    }
  }
  for (const surface of experimentalSurfaces) {
    if (stableSurfaces.includes(surface)) errors.push(`Surface cannot be both stable and experimental: ${surface}`);
  }

  const packageEntries = Object.entries(packages);
  const publishedStages = new Set(['published-unapproved', 'audited', 'approved-for-stable', 'promoted']);
  const registryEvidence = manifest.registryEvidence;
  const audit = manifest.audit;
  const releaseApproval = manifest.releaseApproval;
  const prePublicationAudit = manifest.prePublicationAudit;
  const promotionTargets = manifest.promotionTargets ?? {};
  const testedExternalDependencies = manifest.testedExternalDependencies ?? {};
  const reactDependencies = reactPackage.dependencies ?? {};

  for (const [name, details] of Object.entries(testedExternalDependencies)) {
    if (reactDependencies[name] !== details.supportedRange) {
      errors.push(`Tested external dependency range differs from React package: ${name}`);
    }
  }
  for (const name of Object.keys(reactDependencies)) {
    if (!name.startsWith('@context-action/')) continue;
    if (Object.hasOwn(packages, name)) {
      if (reactDependencies[name] !== `^${packages[name]}`) {
        errors.push(`Release cohort dependency range differs from React package: ${name}`);
      }
      continue;
    }
    if (!Object.hasOwn(testedExternalDependencies, name)) {
      errors.push(`React runtime dependency is missing a release classification: ${name}`);
    }
  }
  for (const name of Object.keys(promotionTargets)) {
    if (!Object.hasOwn(packages, name)) errors.push(`Promotion target is not in the release cohort: ${name}`);
  }

  if (manifest.status === 'candidate-unapproved') {
    if (manifest.commit !== null) errors.push('Candidate manifest must not claim an immutable release commit');
    if (prePublicationAudit !== null || manifest.distTag !== null || registryEvidence !== null || audit !== null) {
      errors.push('Candidate manifest must not claim published registry evidence or audit approval');
    }
    if (!Array.isArray(manifest.requiredBeforeCertification) || manifest.requiredBeforeCertification.length === 0) {
      errors.push('Candidate manifest must state certification requirements');
    }
  } else if (manifest.status === 'candidate-approved-for-publish') {
    if (typeof manifest.commit !== 'string' || !/^[a-f0-9]{40}$/u.test(manifest.commit)) {
      errors.push('Publish-approved candidate requires a 40-character Git commit');
    }
    for (const error of await validateAcceptedPrePublicationAudit(prePublicationAudit, manifest.commit)) {
      errors.push(`Publish-approved candidate requires ${error}`);
    }
    if (manifest.distTag !== null || registryEvidence !== null || audit !== null) {
      errors.push('Publish-approved candidate must not claim registry evidence or a published-artifact audit');
    }
  } else if (manifest.status === 'published-pending-provenance') {
    if (typeof manifest.commit !== 'string' || !/^[a-f0-9]{40}$/u.test(manifest.commit)) {
      errors.push('Published pending-provenance manifest requires a 40-character observed source commit');
    }
    if (typeof manifest.distTag !== 'string' || !/^[a-z][a-z0-9._-]*$/u.test(manifest.distTag)) {
      errors.push('Published pending-provenance manifest requires a valid distTag');
    }
    if (!registryEvidence || typeof registryEvidence !== 'object') {
      errors.push('Published pending-provenance manifest requires registry evidence for every package');
    } else {
      for (const [name, version] of packageEntries) {
        const evidence = registryEvidence[name];
        if (!evidence || typeof evidence !== 'object') {
          errors.push(`Published pending-provenance manifest is missing registry evidence: ${name}`);
          continue;
        }
        if (evidence.version !== version) errors.push(`Registry evidence version differs from manifest: ${name}`);
        if (evidence.distTags?.[manifest.distTag] !== version) {
          errors.push(`Registry evidence does not bind ${name}@${version} to ${manifest.distTag}`);
        }
        if (evidence.provenance?.status !== 'pending-verification'
          || evidence.provenance?.sourceCommit !== manifest.commit) {
          errors.push(`Published pending-provenance manifest requires an observed, unverified source commit: ${name}`);
        }
        if (evidence.externalConsumer?.status !== 'passed') {
          errors.push(`Published consumer matrix must pass: ${name}`);
        }
      }
    }
    if (audit !== null) errors.push('Published pending-provenance manifest must not claim an independent audit');
  } else if (publishedStages.has(manifest.status)) {
    if (typeof manifest.commit !== 'string' || !/^[a-f0-9]{40}$/u.test(manifest.commit)) {
      errors.push('Certified or published manifest requires a 40-character Git commit');
    }
    if (typeof manifest.distTag !== 'string' || !/^[a-z][a-z0-9._-]*$/u.test(manifest.distTag)) {
      errors.push('Published manifest requires a valid distTag');
    }
    if (!registryEvidence || typeof registryEvidence !== 'object') {
      errors.push('Published manifest requires registry evidence for every package');
    } else {
      for (const [name, version] of packageEntries) {
        const evidence = registryEvidence[name];
        if (!evidence || typeof evidence !== 'object') {
          errors.push(`Published manifest is missing registry evidence: ${name}`);
          continue;
        }
        if (evidence.version !== version) errors.push(`Registry evidence version differs from manifest: ${name}`);
        if (evidence.distTags?.[manifest.distTag] !== version) {
          errors.push(`Registry evidence does not bind ${name}@${version} to ${manifest.distTag}`);
        }
        if (typeof version === 'string' && version.includes('-') && evidence.distTags?.latest === version) {
          errors.push(`Prerelease package must not be tagged latest: ${name}@${version}`);
        }
        if (evidence.provenance?.status !== 'verified'
          || evidence.provenance?.sourceCommit !== manifest.commit
          || evidence.provenance?.verification?.verifier !== 'npm audit signatures --include-attestations'
          || typeof evidence.provenance?.verification?.evidence !== 'string') {
          errors.push(`Registry provenance must verify the manifest commit: ${name}`);
        }
        if (evidence.externalConsumer?.status !== 'passed') {
          errors.push(`Published consumer matrix must pass: ${name}`);
        }
      }
    }
    for (const surface of stableSurfaces) {
      if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(packages[surface])) {
        errors.push(`Certified stable surface requires an exact SemVer version: ${surface}`);
      }
    }
    if (['audited', 'approved-for-stable', 'promoted'].includes(manifest.status)) {
      for (const error of await validateAcceptedAudit(audit, manifest.commit)) {
        errors.push(`${manifest.status} manifest requires ${error}`);
      }
    }
    if (['approved-for-stable', 'promoted'].includes(manifest.status)) {
      for (const error of await validateReleaseApproval(releaseApproval, manifest.commit)) {
        errors.push(`${manifest.status} manifest requires ${error}`);
      }
    }
    if (manifest.status === 'promoted') {
      for (const [name, tag] of Object.entries(promotionTargets)) {
        if (registryEvidence?.[name]?.distTags?.[tag] !== packages[name]) {
          errors.push(`Promoted package must be tagged ${tag}: ${name}`);
        }
      }
    }
  } else {
    errors.push(`Unsupported release manifest status: ${String(manifest.status)}`);
  }
  if (errors.length > 0) {
    console.error(JSON.stringify({ status: 'invalid', errors }, null, 2));
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify({ status: 'ok', manifest: path.relative(repositoryRoot, manifestPath), stage: manifest.status }));
}

main().catch(error => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
