#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageOption = process.argv.indexOf('--package');
const packageDirectoryName = packageOption === -1 ? 'tool-protocol' : process.argv[packageOption + 1];
if (!/^[a-z0-9-]+$/u.test(packageDirectoryName ?? '')) {
  throw new Error('Usage: node scripts/verify-tool-protocol-changelog.mjs [--package <package-directory>]');
}
const packageDirectory = path.join(repositoryRoot, 'packages', packageDirectoryName);
const packageManifest = JSON.parse(readFileSync(path.join(packageDirectory, 'package.json'), 'utf8'));
const changelogPath = path.join(packageDirectory, 'CHANGELOG.md');

function assertChangelogVersion(contents, source, { requirePublishedRelease = false } = {}) {
  const heading = /^## \[([^\]]+)\](.*)$/mu.exec(contents);
  if (!heading) throw new Error(`${source} must start with a versioned release heading`);
  if (heading[1] !== packageManifest.version) {
    throw new Error(
      `${source} starts at ${heading[1]}, expected ${packageManifest.name}@${packageManifest.version}`,
    );
  }
  if (requirePublishedRelease && /\(Unreleased\)/iu.test(heading[2])) {
    throw new Error(`${source} marks published ${packageManifest.name}@${packageManifest.version} as Unreleased`);
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
  if (packageManifest.name !== `@context-action/${packageDirectoryName}`) {
    throw new Error(`Unexpected package identity: ${packageManifest.name}`);
  }
  const requirePublishedRelease = process.argv.includes('--require-published-release');
  if (requirePublishedRelease) {
    const publishedVersion = execFileSync(
      'npm', ['view', `${packageManifest.name}@${packageManifest.version}`, 'version', '--registry=https://registry.npmjs.org'],
      { encoding: 'utf8', env: { ...process.env, npm_config_loglevel: 'error' } },
    ).trim();
    if (publishedVersion !== packageManifest.version) {
      throw new Error(`${packageManifest.name}@${packageManifest.version} is not published for release-state verification`);
    }
  }
  assertChangelogVersion(readFileSync(changelogPath, 'utf8'), changelogPath, { requirePublishedRelease });

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
      `${path.basename(archivePath)}:package/CHANGELOG.md`, { requirePublishedRelease },
    );
  } finally {
    rmSync(destination, { recursive: true, force: true });
  }
  console.log(`Verified ${packageManifest.name}@${packageManifest.version} CHANGELOG source and tarball.`);
}

main();
