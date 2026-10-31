import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const verifier = await readFile(join(repositoryRoot, 'scripts/verify-core-public-provenance.mjs'), 'utf8');

test('Core provenance verifier is bound to npm attestation verification', () => {
  assert.match(verifier, /retryTransientRegistryVisibility/);
  assert.match(verifier, /npm.*audit.*signatures.*include-attestations/s);
  assert.match(verifier, /attestationBundles/);
  assert.match(verifier, /https:\/\/slsa\.dev\/provenance\/v1/);
  assert.match(verifier, /sourceCommit/);
});

test('Core provenance verifier binds the approved workflow and main ref', () => {
  assert.match(verifier, /https:\/\/github\.com\/mineclover\/context-action/);
  assert.match(verifier, /\.github\/workflows\/publish-core-public-candidate\.yml/);
  assert.match(verifier, /refs\/heads\/main/);
});
