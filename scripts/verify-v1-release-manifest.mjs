#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

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
  const validate = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
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
  if (manifest.status === 'candidate-unapproved') {
    if (manifest.commit !== null) errors.push('Candidate manifest must not claim an immutable release commit');
    if (!Array.isArray(manifest.requiredBeforeCertification) || manifest.requiredBeforeCertification.length === 0) {
      errors.push('Candidate manifest must state certification requirements');
    }
  } else {
    if (typeof manifest.commit !== 'string' || !/^[a-f0-9]{40}$/u.test(manifest.commit)) {
      errors.push('Certified or published manifest requires a 40-character Git commit');
    }
    for (const surface of stableSurfaces) {
      if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(packages[surface])) {
        errors.push(`Certified stable surface requires an exact SemVer version: ${surface}`);
      }
    }
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
