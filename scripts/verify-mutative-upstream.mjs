#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lockPath = path.join(root, 'packages/mutative-core/upstream-sync.json');
const lock = JSON.parse(await readFile(lockPath, 'utf8'));
const errors = [];

if (lock.schemaVersion !== 'context-action-mutative-upstream-lock.v1') errors.push('unsupported upstream lock schema');
if (lock.upstream?.name !== 'mutative' || lock.upstream?.version !== '1.3.0') errors.push('upstream baseline must be mutative@1.3.0');
if (!/^[a-f0-9]{40}$/u.test(lock.upstream?.gitHead ?? '')) errors.push('upstream gitHead must be an immutable 40-character SHA');
if (!/^0\.8\.x$/u.test(lock.adapter?.versionLine ?? '')) errors.push('scoped adapter must remain on the maintained 0.8.x patch line');
if (!/^[a-f0-9]{40}$/u.test(lock.maintainedFork?.commit ?? '')) errors.push('maintained fork commit must be immutable');

for (const patch of lock.localPatchContracts ?? []) {
  if (!patch.id || !patch.category || !Array.isArray(patch.files) || patch.files.length === 0) {
    errors.push('every local patch contract needs an id, category, and file list');
    continue;
  }
  for (const relative of patch.files) {
    try { await readFile(path.join(root, 'packages/mutative-core/src', relative)); }
    catch { errors.push(`${patch.id}: missing source file ${relative}`); }
  }
  for (const relative of patch.tests ?? []) {
    try { await readFile(path.join(root, relative)); }
    catch { errors.push(`${patch.id}: missing regression test ${relative}`); }
  }
}

if (errors.length) {
  console.error(`Mutative upstream lock failed:\n${errors.map(error => `- ${error}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    status: 'ok',
    upstream: `${lock.upstream.name}@${lock.upstream.version}`,
    upstreamGitHead: lock.upstream.gitHead,
    maintainedForkCommit: lock.maintainedFork.commit,
    localPatchContracts: lock.localPatchContracts.length,
    adapterVersionLine: lock.adapter.versionLine,
  }));
}
