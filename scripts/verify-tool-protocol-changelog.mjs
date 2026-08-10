#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageDirectory = path.join(repositoryRoot, 'packages', 'tool-protocol');
const packageManifest = JSON.parse(readFileSync(path.join(packageDirectory, 'package.json'), 'utf8'));
const changelogPath = path.join(packageDirectory, 'CHANGELOG.md');

function assertChangelogVersion(contents, source) {
  const heading = /^## \[([^\]]+)\]/mu.exec(contents);
  if (!heading) throw new Error(`${source} must start with a versioned release heading`);
  if (heading[1] !== packageManifest.version) {
    throw new Error(
      `${source} starts at ${heading[1]}, expected ${packageManifest.name}@${packageManifest.version}`,
    );
  }
}

function packedArchivePath(output, destination) {
  const parsed = JSON.parse(output);
  const result = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!result || typeof result.filename !== 'string') {
    throw new Error('pnpm pack did not return an archive filename');
  }
  const archivePath = path.resolve(destination, result.filename);
  if (!archivePath.startsWith(`${path.resolve(destination)}${path.sep}`)) {
    throw new Error(`pnpm pack produced an archive outside the temporary directory: ${archivePath}`);
  }
  return archivePath;
}

function main() {
  if (packageManifest.name !== '@context-action/tool-protocol') {
    throw new Error(`Unexpected package identity: ${packageManifest.name}`);
  }
  assertChangelogVersion(readFileSync(changelogPath, 'utf8'), changelogPath);

  const destination = mkdtempSync(path.join(os.tmpdir(), 'context-action-tool-protocol-pack-'));
  try {
    const archivePath = packedArchivePath(
      execFileSync('pnpm', ['pack', '--json', '--pack-destination', destination], {
        cwd: packageDirectory,
        encoding: 'utf8',
        env: { ...process.env, npm_config_update_notifier: 'false' },
      }),
      destination,
    );
    assertChangelogVersion(
      execFileSync('tar', ['-xOf', archivePath, 'package/CHANGELOG.md'], { encoding: 'utf8' }),
      `${path.basename(archivePath)}:package/CHANGELOG.md`,
    );
  } finally {
    rmSync(destination, { recursive: true, force: true });
  }
  console.log(`Verified ${packageManifest.name}@${packageManifest.version} CHANGELOG source and tarball.`);
}

main();
