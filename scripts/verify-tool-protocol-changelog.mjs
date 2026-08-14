#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
const requirePublishedRelease = process.argv.includes('--require-published-release');
const forbidUnreleased = process.argv.includes('--forbid-unreleased');
const requireReleaseDate = process.argv.includes('--require-release-date');

function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

export function changelogValidationOptions(options = {}) {
  return {
    forbidUnreleased: options.forbidUnreleased || options.requirePublishedRelease,
    requireReleaseDate:
      options.requireReleaseDate || options.forbidUnreleased || options.requirePublishedRelease,
  };
}

function isValidIsoCalendarDate(yearText, monthText, dayText) {
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth[month - 1];
}

export function assertChangelogVersion(contents, source, options = {}) {
  const heading = /^## \[([^\]]+)\](.*)$/mu.exec(contents);
  if (!heading) throw new Error(`${source} must start with a versioned release heading`);
  if (heading[1] !== packageManifest.version) {
    throw new Error(
      `${source} starts at ${heading[1]}, expected ${packageManifest.name}@${packageManifest.version}`,
    );
  }
  if (options.forbidUnreleased && /\(Unreleased\)/iu.test(heading[2])) {
    throw new Error(`${source} marks ${packageManifest.name}@${packageManifest.version} as Unreleased`);
  }
  const releaseDate = /\((\d{4})-(\d{2})-(\d{2})\)/u.exec(heading[2]);
  if (
    options.requireReleaseDate &&
    (!releaseDate || !isValidIsoCalendarDate(releaseDate[1], releaseDate[2], releaseDate[3]))
  ) {
    throw new Error(
      `${source} must include an ISO release date that is a valid calendar date for ${packageManifest.name}@${packageManifest.version}`,
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

function fetchPublishedTarball() {
  const attempts = 12;
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const publishedVersion = execFileSync(
        'npm',
        ['view', `${packageManifest.name}@${packageManifest.version}`, 'version', '--registry=https://registry.npmjs.org'],
        { encoding: 'utf8', env: { ...process.env, npm_config_loglevel: 'error' } },
      ).trim();
      const tarball = execFileSync(
        'npm',
        ['view', `${packageManifest.name}@${packageManifest.version}`, 'dist.tarball', '--registry=https://registry.npmjs.org'],
        { encoding: 'utf8', env: { ...process.env, npm_config_loglevel: 'error' } },
      ).trim();
      if (publishedVersion !== packageManifest.version || !tarball.startsWith('https://')) {
        throw new Error(`${packageManifest.name}@${packageManifest.version} is not visible with a registry tarball`);
      }
      const response = execFileSync('curl', ['--fail', '--location', '--silent', '--show-error', tarball], {
        encoding: null,
        maxBuffer: 20 * 1024 * 1024,
      });
      if (response.length === 0) throw new Error(`Registry tarball for ${packageManifest.name}@${packageManifest.version} is empty`);
      return { tarball, buffer: response, attempt };
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        process.stdout.write(`Waiting for published changelog metadata (${attempt}/${attempts - 1})...\n`);
        sleep(5_000);
      }
    }
  }
  throw lastError;
}

function main() {
  if (packageManifest.name !== `@context-action/${packageDirectoryName}`) {
    throw new Error(`Unexpected package identity: ${packageManifest.name}`);
  }
  const sourceOptions = changelogValidationOptions({
    forbidUnreleased,
    requirePublishedRelease,
    requireReleaseDate,
  });
  assertChangelogVersion(readFileSync(changelogPath, 'utf8'), changelogPath, sourceOptions);

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
      `${path.basename(archivePath)}:package/CHANGELOG.md`, sourceOptions,
    );

    if (requirePublishedRelease) {
      const published = fetchPublishedTarball();
      const registryArchivePath = path.join(destination, 'registry-package.tgz');
      writeFileSync(registryArchivePath, published.buffer);
      assertChangelogVersion(
        execFileSync('tar', ['-xOf', registryArchivePath, 'package/CHANGELOG.md'], { encoding: 'utf8' }),
        `${published.tarball}:package/CHANGELOG.md`,
        { forbidUnreleased: true, requireReleaseDate: true },
      );
      if (published.attempt > 1) process.stdout.write(`Published changelog became visible after ${published.attempt} attempts.\n`);
    }
  } finally {
    rmSync(destination, { recursive: true, force: true });
  }
  console.log(`Verified ${packageManifest.name}@${packageManifest.version} CHANGELOG source and ${requirePublishedRelease ? 'registry' : 'local'} tarball.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
