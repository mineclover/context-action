#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const governedFiles = [
  '.github/workflows/publish-maintenance-patch.yml',
  'docs/releases/v1.0.0/release-manifest.schema.json',
  'package.json',
  'scripts/verify-v1-promotion-authorization.mjs',
  'scripts/verify-v1-promotion-governance.mjs',
  'scripts/verify-v1-published-provenance.mjs',
  'scripts/verify-published-tool-consumers.cjs',
  'scripts/verify-v1-release-manifest.mjs',
  'scripts/verify-v1-release-workflows.mjs',
  'scripts/verify-tool-protocol-changelog.mjs',
];

export async function promotionGovernanceFingerprint() {
  const digest = createHash('sha256');
  for (const file of governedFiles) {
    digest.update(`${file}\0`);
    digest.update(await readFile(path.join(repositoryRoot, file)));
    digest.update('\0');
  }
  return digest.digest('hex');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify({ files: governedFiles, sha256: await promotionGovernanceFingerprint() }));
}
