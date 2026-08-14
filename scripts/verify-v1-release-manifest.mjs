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

async function readHashedEvidence(record, label, errors) {
  if (!record || typeof record.path !== 'string' || !/^[a-f0-9]{64}$/u.test(record.sha256 ?? '')) {
    errors.push(`${label} must provide a repository-local path and SHA-256`);
    return null;
  }
  const resolved = path.resolve(repositoryRoot, record.path);
  if (resolved !== repositoryRoot && !resolved.startsWith(`${repositoryRoot}${path.sep}`)) {
    errors.push(`${label} must stay within the repository`);
    return null;
  }
  try {
    const contents = await readFile(resolved);
    if (sha256(contents) !== record.sha256) errors.push(`${label} SHA-256 does not match`);
    return JSON.parse(contents);
  } catch {
    errors.push(`${label} is missing or is not valid JSON`);
    return null;
  }
}

async function validatePromotionGovernance(governance) {
  const errors = [];
  if (!governance || typeof governance !== 'object') return ['an approved promotion-governance record'];
  if (typeof governance.commit !== 'string' || !/^[a-f0-9]{40}$/u.test(governance.commit)) {
    errors.push('a promotion-governance commit');
  }
  const evidence = await readHashedEvidence(
    { path: governance.evidence, sha256: governance.evidenceSha256 },
    'promotion-governance evidence',
    errors,
  );
  if (evidence && (evidence.commit !== governance.commit || evidence.workingTree !== 'clean' || evidence.status !== 'recorded')) {
    errors.push('strict evidence bound to the promotion-governance commit');
  }
  if (typeof governance.fingerprintSha256 !== 'string' || !/^[a-f0-9]{64}$/u.test(governance.fingerprintSha256)) {
    errors.push('a promotion-governance fingerprint');
  }
  return errors;
}

async function validatePromotedState(manifest, errors) {
  const artifactCohort = manifest.artifactCohort ?? {};
  const promotion = manifest.stablePromotion;
  if (promotion?.status !== 'promoted') {
    errors.push('Promoted manifest requires a promoted stable-promotion record');
    return;
  }
  if (!Array.isArray(manifest.requiredBeforeCertification) || manifest.requiredBeforeCertification.length !== 0) {
    errors.push('Promoted manifest must not retain certification prerequisites');
  }
  for (const error of await validatePromotionGovernance(promotion.governance)) {
    errors.push(`Promoted manifest requires ${error}`);
  }
  const registryEvidence = await readHashedEvidence(promotion.registryEvidence, 'stable-promotion registry evidence', errors);
  const provenanceEvidence = await readHashedEvidence(promotion.provenanceEvidence, 'stable-promotion provenance evidence', errors);
  if (registryEvidence?.distTag !== 'latest') errors.push('Stable-promotion registry evidence must capture latest');
  if (provenanceEvidence?.status !== 'verified' || provenanceEvidence?.sourceCommit !== artifactCohort.commit) {
    errors.push('Stable-promotion provenance evidence must verify the artifact-cohort commit');
  }
  if (promotion.consumerMatrix?.status !== 'passed' || typeof promotion.consumerMatrix?.verifier !== 'string') {
    errors.push('Stable-promotion consumer matrix must pass with a recorded verifier');
  }
  for (const [name, tag] of Object.entries(promotion.targets ?? {})) {
    const version = artifactCohort.packages?.[name];
    if (tag !== 'latest' || typeof version !== 'string') {
      errors.push(`Stable-promotion target must bind a cohort package to latest: ${name}`);
      continue;
    }
    if (registryEvidence?.packages?.[name]?.distTags?.latest !== version) {
      errors.push(`Stable-promotion registry evidence does not bind ${name}@${version} to latest`);
    }
  }
  for (const [key, patch] of Object.entries(manifest.postReleasePatches ?? {})) {
    const evidence = await readHashedEvidence(patch.registryEvidence, `post-release patch ${key} registry evidence`, errors);
    if (evidence?.packages?.[patch.package]?.version !== patch.version) {
      errors.push(`Post-release patch ${key} registry evidence does not match its package version`);
    }
    if (patch.latest && !patch.provenanceEvidence) {
      errors.push(`Latest post-release patch ${key} requires provenance evidence`);
    }
    if (patch.provenanceEvidence) {
      const provenance = await readHashedEvidence(patch.provenanceEvidence, `post-release patch ${key} provenance evidence`, errors);
      if (provenance?.status !== 'verified' || provenance?.package?.sourceCommit !== patch.sourceCommit) {
        errors.push(`Post-release patch ${key} provenance evidence is not verified for its source commit`);
      }
    }
    if (patch.latest && manifest.currentRegistryState?.packages?.[patch.package]?.distTags?.latest !== patch.version) {
      errors.push(`Current registry state does not record ${patch.package}@${patch.version} as latest`);
    }
  }
}

async function main() {
  const [manifestSource, schemaSource] = await Promise.all([
    readFile(manifestPath, 'utf8'),
    readFile(schemaPath, 'utf8'),
  ]);
  const manifest = JSON.parse(manifestSource);
  const schema = JSON.parse(schemaSource);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const errors = [];
  if (!validate(manifest)) {
    errors.push(...(validate.errors ?? []).map(error => `Schema ${error.instancePath || '/'} ${error.message}`));
  }

  const artifactCohort = manifest.artifactCohort ?? {};
  const packages = artifactCohort.packages ?? {};
  const stableSurfaces = Array.isArray(manifest.stableSurfaces) ? manifest.stableSurfaces : [];
  const experimentalSurfaces = Array.isArray(manifest.experimentalSurfaces) ? manifest.experimentalSurfaces : [];
  const registryEvidence = artifactCohort.registryEvidence;

  for (const surface of stableSurfaces) {
    if (typeof packages[surface] !== 'string') errors.push(`Stable surface is missing a cohort package version: ${surface}`);
  }
  for (const surface of experimentalSurfaces) {
    if (stableSurfaces.includes(surface)) errors.push(`Surface cannot be both stable and experimental: ${surface}`);
  }
  // The v1 manifest is immutable historical evidence. Current package
  // dependency floors intentionally evolve in later coordinated releases and
  // are validated by the active release-plan verifier instead.

  const publishedStages = new Set(['published-unapproved', 'audited', 'approved-for-stable', 'promotion-evidence-pending', 'promoted']);
  if (manifest.status === 'candidate-unapproved') {
    if (artifactCohort.commit !== null || artifactCohort.distTag !== null || registryEvidence !== null) {
      errors.push('Candidate manifest must not claim an immutable artifact cohort');
    }
    if (!Array.isArray(manifest.requiredBeforeCertification) || manifest.requiredBeforeCertification.length === 0) {
      errors.push('Candidate manifest must state certification requirements');
    }
  } else if (publishedStages.has(manifest.status)) {
    if (typeof artifactCohort.commit !== 'string' || !/^[a-f0-9]{40}$/u.test(artifactCohort.commit)) {
      errors.push('Published manifest requires a 40-character artifact-cohort commit');
    }
    if (typeof artifactCohort.distTag !== 'string' || !/^[a-z][a-z0-9._-]*$/u.test(artifactCohort.distTag)) {
      errors.push('Published manifest requires a valid artifact-cohort dist-tag');
    }
    for (const [name, version] of Object.entries(packages)) {
      const evidence = registryEvidence?.[name];
      if (!evidence || evidence.version !== version || evidence.distTags?.[artifactCohort.distTag] !== version) {
        errors.push(`Artifact cohort is missing registry evidence bound to ${name}@${version}`);
        continue;
      }
      if (evidence.provenance?.status !== 'verified' || evidence.provenance?.sourceCommit !== artifactCohort.commit) {
        errors.push(`Artifact cohort provenance must verify the cohort commit: ${name}`);
      }
      if (evidence.externalConsumer?.status !== 'passed') errors.push(`Artifact cohort consumer matrix must pass: ${name}`);
    }
    if (manifest.status === 'promoted') await validatePromotedState(manifest, errors);
  } else if (manifest.status !== 'candidate-approved-for-publish') {
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
