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

async function validatePromotionGovernance(governance) {
  const errors = [];
  if (!governance || typeof governance !== 'object') return ['an approved promotion-governance record'];
  if (typeof governance.commit !== 'string' || !/^[a-f0-9]{40}$/u.test(governance.commit)) {
    errors.push('a promotion-governance commit');
  }
  for (const [label, target, expectedHash] of [
    ['evidence', governance.evidence, governance.evidenceSha256],
  ]) {
    if (typeof target !== 'string' || typeof expectedHash !== 'string' || !/^[a-f0-9]{64}$/u.test(expectedHash)) {
      errors.push(`a hashed promotion-governance ${label} path`);
      continue;
    }
    const resolved = path.resolve(repositoryRoot, target);
    if (resolved !== repositoryRoot && !resolved.startsWith(`${repositoryRoot}${path.sep}`)) {
      errors.push(`a repository-local promotion-governance ${label} path`);
      continue;
    }
    try {
      const contents = await readFile(resolved);
      if (sha256(contents) !== expectedHash) errors.push(`a matching promotion-governance ${label} hash`);
      const evidence = JSON.parse(contents);
      if (evidence.commit !== governance.commit || evidence.workingTree !== 'clean' || evidence.status !== 'recorded') {
        errors.push('strict evidence bound to the promotion-governance commit');
      }
    } catch {
      errors.push(`an existing promotion-governance ${label}`);
    }
  }
  if (typeof governance.fingerprintSha256 !== 'string' || !/^[a-f0-9]{64}$/u.test(governance.fingerprintSha256)) {
    errors.push('a promotion-governance fingerprint');
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
  const publishedStages = new Set(['published-unapproved', 'audited', 'approved-for-stable', 'promotion-evidence-pending', 'promoted']);
  const registryEvidence = manifest.registryEvidence;
  const promotionTargets = manifest.promotionTargets ?? {};
  const registryHygiene = manifest.registryHygiene;
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
    if (manifest.distTag !== null || registryEvidence !== null) {
      errors.push('Candidate manifest must not claim published registry evidence');
    }
    if (!Array.isArray(manifest.requiredBeforeCertification) || manifest.requiredBeforeCertification.length === 0) {
      errors.push('Candidate manifest must state certification requirements');
    }
  } else if (manifest.status === 'candidate-approved-for-publish') {
    if (typeof manifest.commit !== 'string' || !/^[a-f0-9]{40}$/u.test(manifest.commit)) {
      errors.push('Publish-approved candidate requires a 40-character Git commit');
    }
    if (manifest.distTag !== null || registryEvidence !== null) {
      errors.push('Publish-approved candidate must not claim registry evidence');
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
    if (['approved-for-stable', 'promotion-evidence-pending', 'promoted'].includes(manifest.status)) {
      for (const error of await validatePromotionGovernance(manifest.promotionGovernance)) {
        errors.push(`${manifest.status} manifest requires ${error}`);
      }
      if (registryHygiene?.status !== 'cleared') {
        errors.push(`${manifest.status} manifest requires cleared registry hygiene`);
      }
    }
    if (manifest.status === 'promotion-evidence-pending') {
      if (manifest.promotionEvidence?.status !== 'pending' || typeof manifest.promotionEvidence.workflowRun !== 'string') {
        errors.push('Promotion-evidence-pending manifest requires the failed promotion workflow run record');
      }
    }
    if (manifest.status === 'promoted') {
      if (manifest.promotionEvidence?.status !== 'captured' || typeof manifest.promotionEvidence.workflowRun !== 'string') {
        errors.push('Promoted manifest requires captured promotion evidence and workflow run record');
      }
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
