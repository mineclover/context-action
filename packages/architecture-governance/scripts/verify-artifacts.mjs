#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const packageManifest = JSON.parse(
  await readFile(path.join(packageRoot, 'package.json'), 'utf8'),
);
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const artifactCommandTimeoutMs = 30_000;
const publicGovernanceGuideUrl =
  'https://github.com/mineclover/context-action/blob/main/architecture/governance-guide.md';
const standaloneNpmEnvironment = Object.fromEntries(
  Object.entries(process.env).filter(
    ([key]) => !key.toLowerCase().startsWith('npm_'),
  ),
);

const result = spawnSync(
  npmCommand,
  ['pack', '--dry-run', '--json', '--ignore-scripts'],
  {
    cwd: packageRoot,
    env: standaloneNpmEnvironment,
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
    timeout: artifactCommandTimeoutMs,
    windowsHide: true,
  },
);
if (result.error) {
  throw new Error(`Cannot inspect package artifacts: ${result.error.message}`);
}
if (result.status !== 0) {
  throw new Error(
    `npm pack --dry-run failed with exit ${result.status}: ${result.stderr.trim()}`,
  );
}

let packResults;
try {
  packResults = JSON.parse(result.stdout);
} catch (error) {
  throw new Error(`npm pack returned invalid JSON: ${error.message}`);
}
if (!Array.isArray(packResults) || packResults.length !== 1) {
  throw new Error('npm pack must return exactly one package description.');
}
const packResult = packResults[0];
if (!packResult || !Array.isArray(packResult.files)) {
  throw new Error('npm pack result must include a files array.');
}

const packedFiles = new Map(
  packResult.files.map((file) => [file.path, file]),
);
const requiredArtifacts = new Set([
  'README.md',
  'package.json',
  packageManifest.main,
  packageManifest.types,
  packageManifest.bin['arch-verify'],
  packageManifest.exports['./schemas/architecture-registry'],
  packageManifest.exports['./schemas/policy-set'],
  packageManifest.exports['./schemas/verification-report'],
  packageManifest.exports['./schemas/symbol-snapshot'],
  packageManifest.exports['./schemas/symbol-history'],
  packageManifest.exports['./schemas/symbol-snapshot-diff'],
]);
for (const artifact of requiredArtifacts) {
  const normalizedArtifact = artifact.replace(/^\.\//u, '');
  if (!packedFiles.has(normalizedArtifact)) {
    throw new Error(`Required package artifact is missing: ${normalizedArtifact}`);
  }
}

const packageReadme = await readFile(path.join(packageRoot, 'README.md'), 'utf8');
if (!packageReadme.includes(publicGovernanceGuideUrl)) {
  throw new Error(
    `Package README must link to the public governance guide: ${publicGovernanceGuideUrl}`,
  );
}

const rootExport = packageManifest.exports['.'];
for (const target of [rootExport.import, rootExport.types]) {
  const normalizedTarget = target.replace(/^\.\//u, '');
  if (!packedFiles.has(normalizedTarget)) {
    throw new Error(`Root export target is missing from package: ${normalizedTarget}`);
  }
}

for (const file of packedFiles.values()) {
  const allowed = file.path === 'README.md'
    || file.path === 'LICENSE'
    || file.path === 'package.json'
    || file.path.startsWith('dist/')
    || file.path.startsWith('schemas/');
  if (!allowed) {
    throw new Error(`Unexpected package artifact: ${file.path}`);
  }
}

const cliArtifact = packedFiles.get(
  packageManifest.bin['arch-verify'].replace(/^\.\//u, ''),
);
if ((cliArtifact.mode & 0o111) === 0) {
  throw new Error('Packed arch-verify CLI must be executable.');
}

const library = await import(
  pathToFileURL(path.join(packageRoot, packageManifest.main)).href
);
if (typeof library.verifyArchitecture !== 'function') {
  throw new Error('Built root export must expose verifyArchitecture.');
}
if (
  packageManifest.dependencies?.['@ataraxy-labs/sem']
  !== library.SUPPORTED_SEM_VERSION
) {
  throw new Error(
    `Packed package must depend on @ataraxy-labs/sem ${library.SUPPORTED_SEM_VERSION}.`,
  );
}
if (packageManifest.devDependencies?.['@ataraxy-labs/sem'] !== undefined) {
  throw new Error('@ataraxy-labs/sem must not be a development-only dependency.');
}

for (const subpath of [
  './schemas/architecture-registry',
  './schemas/policy-set',
  './schemas/verification-report',
  './schemas/symbol-snapshot',
  './schemas/symbol-history',
  './schemas/symbol-snapshot-diff',
  './schemas/context-manifest',
  './schemas/context-scope',
]) {
  const target = packageManifest.exports[subpath];
  try {
    JSON.parse(await readFile(path.join(packageRoot, target), 'utf8'));
  } catch (error) {
    throw new Error(`Cannot parse exported schema ${subpath}: ${error.message}`);
  }
}

const cliPath = path.join(packageRoot, packageManifest.bin['arch-verify']);
const cliResult = spawnSync(process.execPath, [cliPath, '--help'], {
  cwd: packageRoot,
  encoding: 'utf8',
  maxBuffer: 1024 * 1024,
  timeout: artifactCommandTimeoutMs,
  windowsHide: true,
});
if (cliResult.error || cliResult.status !== 0) {
  const failureDetails = [
    cliResult.error?.message,
    cliResult.error?.code ? `code ${cliResult.error.code}` : undefined,
    cliResult.signal ? `signal ${cliResult.signal}` : undefined,
    cliResult.status !== null && cliResult.status !== undefined
      ? `exit ${cliResult.status}`
      : undefined,
    cliResult.stderr?.trim(),
  ].filter(Boolean).join('; ');
  throw new Error(
    `Built arch-verify CLI help failed: ${failureDetails || 'unknown failure'}`,
  );
}
if (!cliResult.stdout.startsWith('arch-verify <check|snapshot|history|intersect|snapshot-diff|context-scope> [options]')) {
  throw new Error('Built arch-verify CLI returned unexpected help output.');
}

console.log(
  `Verified ${packedFiles.size} architecture-governance package artifacts.`,
);
