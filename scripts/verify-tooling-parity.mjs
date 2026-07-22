#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const consumerRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const toolingRoot = path.resolve(
  process.env.DOCUMENTATION_TOOLING_ROOT ?? path.join(consumerRoot, '..', 'context-action-documentation-tooling'),
);
const manifest = JSON.parse(await readFile(path.join(consumerRoot, 'source-of-truth.json'), 'utf8'));
const ignoredDirectories = new Set(['.git', 'coverage', 'dist', 'node_modules']);
const ignoredFiles = new Set(manifest.migrationCopyExceptions ?? []);

async function collectFiles(root, current = '') {
  const directory = path.join(root, current);
  const entries = await readdir(directory, { withFileTypes: true });
  const files = new Map();
  for (const entry of entries) {
    const relative = path.join(current, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        for (const [nestedPath, digest] of await collectFiles(root, relative)) {
          files.set(nestedPath, digest);
        }
      }
      continue;
    }
    if (!entry.isFile() || (current === '' && ignoredFiles.has(entry.name))) continue;
    const content = await readFile(path.join(root, relative));
    files.set(relative.split(path.sep).join('/'), createHash('sha256').update(content).digest('hex'));
  }
  return files;
}

async function directoryExists(directory) {
  try {
    return (await stat(directory)).isDirectory();
  } catch {
    return false;
  }
}

if (!(await directoryExists(toolingRoot))) {
  console.log(`Tooling parity skipped: ${toolingRoot} is not available.`);
  process.exit(0);
}

const toolingSourceOfTruth = path.join(toolingRoot, 'scripts/verify-source-of-truth.mjs');
if (!(await stat(toolingSourceOfTruth).then((entry) => entry.isFile()).catch(() => false))) {
  throw new Error(`Tooling source-of-truth verifier is missing: ${toolingSourceOfTruth}`);
}
const toolingManifest = JSON.parse(
  await readFile(path.join(toolingRoot, 'source-of-truth.json'), 'utf8'),
);
if (JSON.stringify(manifest.semContract) !== JSON.stringify(toolingManifest.semContract)) {
  throw new Error(
    'Consumer and tooling source-of-truth manifests must declare the same SEM contract before cutover.',
  );
}
const consumerCanonical = new Map(
  (manifest.canonicalPackages ?? []).map((entry) => [entry.name, entry]),
);
const toolingCanonical = new Map(
  (toolingManifest.canonicalPackages ?? []).map((entry) => [entry.name, entry]),
);
for (const [name, consumerEntry] of consumerCanonical) {
  const toolingEntry = toolingCanonical.get(name);
  if (!toolingEntry || toolingEntry.path !== consumerEntry.path) {
    throw new Error(`Consumer/tooling canonical package path mismatch for ${name}.`);
  }
  if (consumerEntry.owner !== toolingManifest.repository?.name) {
    throw new Error(`${name} must remain owned by the tooling repository in the consumer manifest.`);
  }
}
execFileSync(process.execPath, [toolingSourceOfTruth], {
  cwd: toolingRoot,
  stdio: 'inherit',
});

const failures = [];
let comparedFiles = 0;
for (const entry of manifest.canonicalPackages ?? []) {
  const consumerPackage = path.join(consumerRoot, entry.path);
  const toolingPackage = path.join(toolingRoot, entry.path);
  if (!(await directoryExists(toolingPackage))) {
    failures.push(`${entry.name}: tooling package is missing at ${entry.path}`);
    continue;
  }

  const consumerFiles = await collectFiles(consumerPackage);
  const toolingFiles = await collectFiles(toolingPackage);
  const allPaths = new Set([...consumerFiles.keys(), ...toolingFiles.keys()]);
  for (const relativePath of [...allPaths].sort()) {
    comparedFiles += 1;
    const consumerDigest = consumerFiles.get(relativePath);
    const toolingDigest = toolingFiles.get(relativePath);
    if (!consumerDigest) failures.push(`${entry.name}: missing in consumer copy: ${relativePath}`);
    else if (!toolingDigest) failures.push(`${entry.name}: missing in tooling source: ${relativePath}`);
    else if (consumerDigest !== toolingDigest) failures.push(`${entry.name}: content drift: ${relativePath}`);
  }
}

if (failures.length > 0) {
  throw new Error([
    'Tooling migration-copy parity failed:',
    ...failures.map((failure) => `- ${failure}`),
    'README.md and package.json are intentionally excluded because migration metadata differs.',
  ].join('\n'));
}

console.log(`Tooling migration-copy parity verified: ${manifest.canonicalPackages.length} packages, ${comparedFiles} files.`);
