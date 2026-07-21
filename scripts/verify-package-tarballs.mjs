#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { constants as fsConstants } from 'node:fs';
import {
  access,
  lstat,
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  realpath,
  rm,
  stat,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const forbiddenDirectoryNames = new Set([
  '__tests__',
  'coverage',
  'src',
  'test',
  'tests',
]);

async function discoverPublicPackages() {
  const packagesDirectory = path.join(repositoryRoot, 'packages');
  const entries = await readdir(packagesDirectory, { withFileTypes: true });
  const packageDirectories = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const relativeDirectory = path.posix.join('packages', entry.name);
    const manifestPath = path.join(repositoryRoot, relativeDirectory, 'package.json');

    try {
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
      if (manifest.private !== true) {
        packageDirectories.push(relativeDirectory);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  return packageDirectories.sort();
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      ...options,
      env: {
        ...process.env,
        ...options.env,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdout = [];
    const stderr = [];

    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    child.on('error', reject);
    child.on('close', (code, signal) => {
      const output = Buffer.concat(stdout).toString('utf8');
      const errorOutput = Buffer.concat(stderr).toString('utf8');

      if (code === 0) {
        resolve({ stdout: output, stderr: errorOutput });
        return;
      }

      const reason = signal ? `signal ${signal}` : `exit code ${code}`;
      reject(
        new Error(
          `${command} ${args.join(' ')} failed with ${reason}\n${errorOutput || output}`,
        ),
      );
    });
  });
}

function isInside(parentDirectory, candidatePath) {
  const relativePath = path.relative(parentDirectory, candidatePath);
  return relativePath !== '..'
    && !relativePath.startsWith(`..${path.sep}`)
    && !path.isAbsolute(relativePath);
}

function normalizeArchiveTarget(target, label, failures) {
  if (typeof target !== 'string' || target.length === 0) {
    failures.push(`${label}: target must be a non-empty string`);
    return null;
  }

  const normalizedTarget = target.replace(/^\.\//, '');
  if (
    path.posix.isAbsolute(normalizedTarget)
    || normalizedTarget === '..'
    || normalizedTarget.startsWith('../')
  ) {
    failures.push(`${label}: target escapes the package archive: ${target}`);
    return null;
  }

  return normalizedTarget;
}

function collectExportTargets(value, label, failures, targets = []) {
  if (typeof value === 'string') {
    targets.push({ label, target: value });
    return targets;
  }

  if (value === null) {
    return targets;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      collectExportTargets(item, `${label}[${index}]`, failures, targets);
    });
    return targets;
  }

  if (typeof value === 'object') {
    Object.entries(value).forEach(([key, target]) => {
      collectExportTargets(target, `${label}.${key}`, failures, targets);
    });
    return targets;
  }

  failures.push(`${label}: unsupported exports value ${JSON.stringify(value)}`);
  return targets;
}

function collectManifestTargets(packageJson, failures) {
  const targets = [];

  for (const field of ['main', 'module', 'types']) {
    if (packageJson[field] !== undefined) {
      targets.push({ label: field, target: packageJson[field] });
    }
  }

  if (typeof packageJson.bin === 'string') {
    targets.push({ label: 'bin', target: packageJson.bin });
  } else if (packageJson.bin && typeof packageJson.bin === 'object') {
    Object.entries(packageJson.bin).forEach(([name, target]) => {
      targets.push({ label: `bin.${name}`, target });
    });
  } else if (packageJson.bin !== undefined) {
    failures.push('bin: expected a string or object');
  }

  if (packageJson.exports !== undefined) {
    collectExportTargets(packageJson.exports, 'exports', failures, targets);
  }

  return targets;
}

function escapeRegularExpression(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

function targetPattern(target) {
  return new RegExp(
    `^${target.split('*').map(escapeRegularExpression).join('[^/]*')}$`,
  );
}

async function listFiles(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.posix.join(prefix, entry.name);
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(absolutePath, relativePath));
    } else {
      files.push(relativePath);
    }
  }

  return files;
}

async function assertRegularFile(packageRoot, target, label, archiveFiles, failures) {
  const normalizedTarget = normalizeArchiveTarget(target, label, failures);
  if (normalizedTarget === null) {
    return;
  }

  if (normalizedTarget.includes('*')) {
    const pattern = targetPattern(normalizedTarget);
    if (!archiveFiles.some((archivePath) => pattern.test(archivePath))) {
      failures.push(`${label}: no archive file matches ${target}`);
    }
    return;
  }

  const targetPath = path.resolve(packageRoot, ...normalizedTarget.split('/'));
  if (!isInside(packageRoot, targetPath)) {
    failures.push(`${label}: target escapes the extracted package: ${target}`);
    return;
  }

  try {
    const targetStats = await stat(targetPath);
    if (!targetStats.isFile()) {
      failures.push(`${label}: archive target is not a regular file: ${target}`);
    }
  } catch (error) {
    failures.push(`${label}: archive target is missing: ${target} (${error.message})`);
  }
}

async function verifyPackage(relativePackageDirectory) {
  const packageDirectory = path.join(repositoryRoot, relativePackageDirectory);
  const sourceManifest = JSON.parse(
    await readFile(path.join(packageDirectory, 'package.json'), 'utf8'),
  );
  const sourceLicense = await readFile(path.join(packageDirectory, 'LICENSE'));
  const packageName = sourceManifest.name ?? relativePackageDirectory;
  const temporaryDirectory = await mkdtemp(
    path.join(os.tmpdir(), 'context-action-package-'),
  );
  const failures = [];

  console.log(`\n${packageName}`);

  try {
    const packDirectory = path.join(temporaryDirectory, 'pack');
    const extractDirectory = path.join(temporaryDirectory, 'extract');
    const pnpmCacheDirectory = path.join(temporaryDirectory, 'pnpm-cache');
    await Promise.all([
      mkdir(packDirectory),
      mkdir(extractDirectory),
      mkdir(pnpmCacheDirectory),
    ]);

    const { stdout } = await run(
      'pnpm',
      ['pack', '--json', '--pack-destination', packDirectory],
      {
        cwd: packageDirectory,
        env: {
          pnpm_config_cache: pnpmCacheDirectory,
          npm_config_update_notifier: 'false',
        },
      },
    );
    let packResult;
    try {
      const parsed = JSON.parse(stdout);
      packResult = Array.isArray(parsed) ? parsed[0] : parsed;
    } catch (error) {
      throw new Error(`pnpm pack returned invalid JSON: ${error.message}\n${stdout}`);
    }

    if (!packResult || typeof packResult !== 'object' || typeof packResult.filename !== 'string') {
      throw new Error('pnpm pack returned an invalid result');
    }

    const archivePath = path.resolve(packDirectory, packResult.filename);
    const realPackDirectory = await realpath(packDirectory);
    const realArchivePath = await realpath(archivePath);
    if (!isInside(realPackDirectory, realArchivePath)) {
      throw new Error(`pnpm pack created an archive outside the temporary directory: ${archivePath}`);
    }
    await access(realArchivePath, fsConstants.R_OK);
    await run('tar', ['-xzf', realArchivePath, '-C', extractDirectory]);

    const packageRoot = path.join(extractDirectory, 'package');
    const packageRootStats = await lstat(packageRoot);
    if (!packageRootStats.isDirectory()) {
      throw new Error('archive does not contain a package/ directory');
    }

    const archiveFiles = await listFiles(packageRoot);
    const packedManifestPath = path.join(packageRoot, 'package.json');
    const packedManifest = JSON.parse(await readFile(packedManifestPath, 'utf8'));

    if (packedManifest.name !== sourceManifest.name) {
      failures.push(
        `package.json: packed name ${JSON.stringify(packedManifest.name)} does not match source ${JSON.stringify(sourceManifest.name)}`,
      );
    }
    if (packedManifest.version !== sourceManifest.version) {
      failures.push(
        `package.json: packed version ${JSON.stringify(packedManifest.version)} does not match source ${JSON.stringify(sourceManifest.version)}`,
      );
    }
    if (packedManifest.license !== sourceManifest.license) {
      failures.push(
        `package.json: packed license ${JSON.stringify(packedManifest.license)} does not match source ${JSON.stringify(sourceManifest.license)}`,
      );
    }

    for (const dependencyField of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
      const dependencies = packedManifest[dependencyField];
      if (!dependencies || typeof dependencies !== 'object') continue;
      for (const [dependencyName, version] of Object.entries(dependencies)) {
        if (typeof version === 'string' && version.startsWith('workspace:')) {
          failures.push(
            `package.json: packed ${dependencyField}.${dependencyName} retains workspace protocol ${version}`,
          );
        }
      }
    }

    const packedLicensePath = path.join(packageRoot, 'LICENSE');
    try {
      const packedLicense = await readFile(packedLicensePath);
      if (!packedLicense.equals(sourceLicense)) {
        failures.push('LICENSE: content is not byte-identical to the package source LICENSE');
      }
    } catch (error) {
      failures.push(`LICENSE: missing or unreadable (${error.message})`);
    }

    try {
      const readmeStats = await stat(path.join(packageRoot, 'README.md'));
      if (!readmeStats.isFile()) {
        failures.push('README.md: archive entry is not a regular file');
      }
    } catch (error) {
      failures.push(`README.md: missing or unreadable (${error.message})`);
    }

    for (const archivePath of archiveFiles) {
      const forbiddenDirectory = archivePath
        .split('/')
        .slice(0, -1)
        .find((directoryName) => forbiddenDirectoryNames.has(directoryName));
      if (forbiddenDirectory) {
        failures.push(
          `forbidden archive directory "${forbiddenDirectory}": ${archivePath}`,
        );
      }
    }

    const targets = collectManifestTargets(packedManifest, failures);
    for (const { label, target } of targets) {
      await assertRegularFile(packageRoot, target, label, archiveFiles, failures);
    }

    if (failures.length === 0) {
      console.log(
        `  ✓ ${path.basename(realArchivePath)} (${archiveFiles.length} files, ${targets.length} manifest targets)`,
      );
    }
  } catch (error) {
    failures.push(error.stack ?? error.message);
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true });
  }

  return failures.map((failure) => `${packageName}: ${failure}`);
}

const packagesToVerify = await discoverPublicPackages();
const failures = [];

for (const packageDirectory of packagesToVerify) {
  failures.push(...await verifyPackage(packageDirectory));
}

if (failures.length > 0) {
  console.error(`\nPackage tarball verification failed with ${failures.length} error(s):`);
  failures.forEach((failure) => console.error(`  ✗ ${failure}`));
  process.exitCode = 1;
} else {
  console.log(
    `\nVerified ${packagesToVerify.length} npm package tarballs against their package publication contracts.`,
  );
}
