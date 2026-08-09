#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

function optionValue(name, { required = false } = {}) {
  const values = [];
  for (let index = 2; index < process.argv.length; index += 1) {
    if (process.argv[index] !== name) continue;
    const value = process.argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`);
    values.push(value);
    index += 1;
  }
  if (values.length > 1) throw new Error(`${name} may be provided once`);
  if (required && values.length === 0) throw new Error(`${name} is required`);
  return values[0];
}

function npmJson(argumentsList) {
  const output = execFileSync('npm', argumentsList, {
    encoding: 'utf8',
    env: { ...process.env, npm_config_loglevel: 'error' },
  });
  return JSON.parse(output);
}

async function capturePackage(name, tag, consumerStatus) {
  const version = execFileSync(
    'npm',
    ['view', `${name}@${tag}`, 'version', '--registry=https://registry.npmjs.org'],
    { encoding: 'utf8', env: { ...process.env, npm_config_loglevel: 'error' } },
  ).trim();
  const [distTags, dist, time] = [
    npmJson(['view', name, 'dist-tags', '--json', '--registry=https://registry.npmjs.org']),
    npmJson(['view', `${name}@${version}`, 'dist', '--json', '--registry=https://registry.npmjs.org']),
    npmJson(['view', name, 'time', '--json', '--registry=https://registry.npmjs.org']),
  ];
  if (!dist?.tarball || !dist?.integrity) throw new Error(`npm metadata is incomplete for ${name}@${version}`);
  const response = await fetch(dist.tarball);
  if (!response.ok) throw new Error(`Could not download ${name}@${version} tarball: HTTP ${response.status}`);
  const tarball = Buffer.from(await response.arrayBuffer());
  return {
    version,
    integrity: dist.integrity,
    tarball: dist.tarball,
    sha256: createHash('sha256').update(tarball).digest('hex'),
    publishedAt: typeof time?.[version] === 'string' ? time[version] : null,
    distTags,
    // npm package metadata does not authenticate a provenance subject. Record
    // this explicitly as pending until an operator verifies the npm attestation.
    provenance: { status: 'pending-verification', sourceCommit: null },
    externalConsumer: { status: consumerStatus },
  };
}

async function main() {
  const tag = optionValue('--tag', { required: true });
  const packageNames = optionValue('--packages', { required: true }).split(',').filter(Boolean);
  const output = optionValue('--output', { required: true });
  const consumerStatus = optionValue('--consumer-status') ?? 'not-run';
  if (!/^[a-z][a-z0-9._-]*$/u.test(tag)) throw new Error(`Invalid npm dist-tag: ${tag}`);
  if (!['passed', 'failed', 'not-run'].includes(consumerStatus)) throw new Error('Invalid --consumer-status');
  if (packageNames.length === 0) throw new Error('--packages must contain at least one package');

  const packages = Object.fromEntries(await Promise.all(
    packageNames.map(async name => [name, await capturePackage(name, tag, consumerStatus)]),
  ));
  const report = {
    schemaVersion: 'context-action-published-release-evidence.v1',
    capturedAt: new Date().toISOString(),
    distTag: tag,
    packages,
    notes: [
      'Tarball SHA-256 and registry metadata were read after publication.',
      'Provenance status remains pending until the npm attestation source commit is independently verified.',
    ],
  };
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Captured published registry evidence in ${output}`);
}

main().catch(error => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
