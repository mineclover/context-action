#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(repositoryRoot, 'docs/releases/v1.0.0/release-manifest.json');
const schemaPath = path.join(repositoryRoot, 'docs/releases/v1.0.0/release-manifest.schema.json');

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
  if (manifest.status === 'candidate-unapproved') {
    if (manifest.commit !== null) errors.push('Candidate manifest must not claim an immutable release commit');
    if (manifest.distTag !== null || registryEvidence !== null || audit !== null) {
      errors.push('Candidate manifest must not claim published registry evidence or audit approval');
    }
    if (!Array.isArray(manifest.requiredBeforeCertification) || manifest.requiredBeforeCertification.length === 0) {
      errors.push('Candidate manifest must state certification requirements');
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
        if (evidence.provenance?.status !== 'verified' || evidence.provenance?.sourceCommit !== manifest.commit) {
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
    if (['audited', 'approved-for-stable', 'promoted'].includes(manifest.status)
      && audit?.status !== 'accepted') {
      errors.push(`${manifest.status} manifest requires an accepted independent audit`);
    }
    if (manifest.status === 'promoted') {
      for (const surface of stableSurfaces) {
        if (registryEvidence?.[surface]?.distTags?.latest !== packages[surface]) {
          errors.push(`Promoted stable surface must be tagged latest: ${surface}`);
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
