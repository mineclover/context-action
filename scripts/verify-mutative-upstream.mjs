#!/usr/bin/env node

/**
 * Verify the vendored Mutative core against the immutable upstream 1.3.0
 * source snapshot.  This verifier deliberately never writes source files (or
 * the lock file).  Use --inventory to produce a candidate lock document, then
 * review and commit that document before running --check in CI.
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultManifestPath = path.join(repositoryRoot, 'packages', 'mutative-core', 'upstream-lock.json');
const lockSchemaVersion = 'context-action-mutative-upstream-lock.v1';
const sourceCategories = new Set(['unchanged', 'modified', 'added', 'removed']);

function normalizeSource(contents) {
  return contents.replace(/\r\n?/gu, '\n');
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function sha512Integrity(value) {
  return `sha512-${createHash('sha512').update(value).digest('base64')}`;
}

function relativePath(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join('/');
}

function collectSourceFiles(root) {
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    throw new Error(`Source root does not exist: ${root}`);
  }
  const files = new Map();
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const filePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(filePath);
      } else if (entry.isFile()) {
        const contents = readFileSync(filePath, 'utf8');
        files.set(relativePath(root, filePath), sha256(normalizeSource(contents)));
      } else {
        throw new Error(`Unsupported source entry (expected a regular file): ${filePath}`);
      }
    }
  };
  visit(root);
  return files;
}

function sourceTreeHash(files) {
  const canonical = [...files.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([filePath, digest]) => `${filePath}\0${digest}\n`)
    .join('');
  return sha256(canonical);
}

function sourceInventory(root) {
  const files = collectSourceFiles(root);
  return {
    sourceTreeSha256: sourceTreeHash(files),
    files: Object.fromEntries([...files.entries()].sort(([left], [right]) => left.localeCompare(right))),
  };
}

function parseArgs(argv = process.argv.slice(2)) {
  let mode = 'check';
  let manifestPath = defaultManifestPath;
  let repository = repositoryRoot;
  let packageName;
  let packageVersion;
  let registry;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--check') {
      mode = 'check';
    } else if (argument === '--inventory') {
      mode = 'inventory';
    } else if (argument === '--manifest') {
      manifestPath = path.resolve(argv[++index] ?? '');
    } else if (argument === '--root') {
      repository = path.resolve(argv[++index] ?? '');
    } else if (argument === '--package') {
      packageName = argv[++index];
    } else if (argument === '--version') {
      packageVersion = argv[++index];
    } else if (argument === '--registry') {
      registry = argv[++index];
    } else if (argument === '--update') {
      throw new Error('Source update is intentionally disabled; use --inventory and review the lock file manually.');
    } else if (argument === '--help' || argument === '-h') {
      mode = 'help';
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return {
    mode,
    manifestPath,
    repository,
    packageName,
    packageVersion,
    registry,
  };
}

function usage() {
  return [
    'Usage: node scripts/verify-mutative-upstream.mjs [--check|--inventory]',
    '',
    'Options:',
    '  --check                 Verify the committed upstream lock (default).',
    '  --inventory             Print a reviewed lock-file candidate; never writes files.',
    '  --manifest <path>       Lock path (default packages/mutative-core/upstream-lock.json).',
    '  --root <path>           Repository root (default current repository).',
    '  --package <name>        Override package name (inventory only).',
    '  --version <version>     Override package version (inventory only).',
    '  --registry <url>        Override npm registry (default registry.npmjs.org).',
  ].join('\n');
}

function readLockManifest(manifestPath) {
  if (!existsSync(manifestPath)) {
    throw new Error(`Mutative upstream lock is missing: ${manifestPath}`);
  }
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot parse Mutative upstream lock ${manifestPath}: ${error.message}`);
  }
  validateManifestShape(manifest, manifestPath);
  return manifest;
}

function validateManifestShape(manifest, source = 'upstream-lock.json') {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error(`${source} must contain a JSON object`);
  }
  if (manifest.schemaVersion !== lockSchemaVersion) {
    throw new Error(`${source} schemaVersion must be ${lockSchemaVersion}`);
  }
  const upstream = manifest.upstream;
  if (!upstream || typeof upstream !== 'object') {
    throw new Error(`${source} must define an upstream object`);
  }
  if (upstream.name !== 'mutative') {
    throw new Error(`${source} upstream.name must be mutative`);
  }
  if (!/^\d+\.\d+\.\d+$/u.test(upstream.version ?? '')) {
    throw new Error(`${source} upstream.version must be a stable semantic version`);
  }
  if (upstream.sourceRoot !== 'src') {
    throw new Error(`${source} upstream.sourceRoot must be src`);
  }
  if (!/^sha512-[A-Za-z0-9+/]+={0,2}$/u.test(upstream.tarballIntegrity ?? '')) {
    throw new Error(`${source} upstream.tarballIntegrity must be an npm sha512 integrity string`);
  }
  if (!/^[a-f0-9]{64}$/u.test(upstream.sourceTreeSha256 ?? '')) {
    throw new Error(`${source} upstream.sourceTreeSha256 must be a SHA-256 digest`);
  }
  validateHashMap(upstream.files, `${source} upstream.files`);

  const local = manifest.local;
  if (!local || typeof local !== 'object') {
    throw new Error(`${source} must define a local object`);
  }
  if (local.sourceRoot !== 'src') {
    throw new Error(`${source} local.sourceRoot must be src`);
  }
  if (!/^[a-f0-9]{64}$/u.test(local.sourceTreeSha256 ?? '')) {
    throw new Error(`${source} local.sourceTreeSha256 must be a SHA-256 digest`);
  }
  validateLocalFiles(local.files, upstream.files, `${source} local.files`);
}

function validateHashMap(files, source) {
  if (!files || typeof files !== 'object' || Array.isArray(files)) {
    throw new Error(`${source} must be an object keyed by source-relative path`);
  }
  for (const [filePath, digest] of Object.entries(files)) {
    if (!/^[-A-Za-z0-9_./]+\.ts$/u.test(filePath) || filePath.startsWith('/') || filePath.includes('..')) {
      throw new Error(`${source} contains an unsafe source path: ${filePath}`);
    }
    if (!/^[a-f0-9]{64}$/u.test(digest)) {
      throw new Error(`${source}.${filePath} must be a SHA-256 digest`);
    }
  }
}

function normalizeFileEntries(files) {
  if (Array.isArray(files)) {
    return Object.fromEntries(files.map((entry) => [entry.path, entry]));
  }
  return files;
}

function validateLocalFiles(files, upstreamFiles, source) {
  const entries = normalizeFileEntries(files);
  if (!entries || typeof entries !== 'object' || Array.isArray(entries)) {
    throw new Error(`${source} must be an object keyed by source-relative path`);
  }
  const expectedPaths = new Set([...Object.keys(upstreamFiles), ...Object.keys(entries)]);
  for (const [filePath, entry] of Object.entries(entries)) {
    if (!/^[-A-Za-z0-9_./]+\.ts$/u.test(filePath) || filePath.startsWith('/') || filePath.includes('..')) {
      throw new Error(`${source} contains an unsafe source path: ${filePath}`);
    }
    if (!entry || typeof entry !== 'object' || !sourceCategories.has(entry.category)) {
      throw new Error(`${source}.${filePath}.category must be unchanged, modified, added, or removed`);
    }
    if (entry.upstreamSha256 !== null && !/^[a-f0-9]{64}$/u.test(entry.upstreamSha256 ?? '')) {
      throw new Error(`${source}.${filePath}.upstreamSha256 must be a SHA-256 digest or null`);
    }
    if (entry.localSha256 !== null && !/^[a-f0-9]{64}$/u.test(entry.localSha256 ?? '')) {
      throw new Error(`${source}.${filePath}.localSha256 must be a SHA-256 digest or null`);
    }
    expectedPaths.delete(filePath);
  }
  // Every upstream and local source path must appear in the explicit category
  // manifest. This prevents silently accepting a newly added upstream file.
  if (expectedPaths.size > 0) {
    throw new Error(`${source} is missing explicit entries: ${[...expectedPaths].sort().join(', ')}`);
  }
}

function acquireUpstream({ name, version, registry }) {
  const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), 'context-action-mutative-upstream-'));
  try {
    const npmArguments = [
      'pack',
      '--ignore-scripts',
      '--silent',
      '--pack-destination',
      temporaryDirectory,
      `${name}@${version}`,
    ];
    const environment = {
      ...process.env,
      npm_config_ignore_scripts: 'true',
      npm_config_loglevel: 'error',
    };
    if (registry) environment.npm_config_registry = registry;
    execFileSync('npm', npmArguments, {
      cwd: temporaryDirectory,
      encoding: 'utf8',
      env: environment,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const archives = readdirSync(temporaryDirectory).filter((entry) => entry.endsWith('.tgz'));
    if (archives.length !== 1) {
      throw new Error(`Expected exactly one npm archive, found ${archives.length}`);
    }
    const archivePath = path.join(temporaryDirectory, archives[0]);
    const archive = readFileSync(archivePath);
    const entries = execFileSync('tar', ['-tzf', archivePath], { encoding: 'utf8' })
      .split(/\r?\n/u)
      .filter(Boolean);
    for (const entry of entries) {
      if (!entry.startsWith('package/') || entry.includes('../') || entry.startsWith('/') || entry.includes('\\')) {
        throw new Error(`Unsafe npm archive entry: ${entry}`);
      }
    }
    const extractDirectory = path.join(temporaryDirectory, 'extract');
    execFileSync('mkdir', ['-p', extractDirectory]);
    execFileSync('tar', ['-xzf', archivePath, '-C', extractDirectory, '--no-same-owner']);
    const packageDirectory = path.join(extractDirectory, 'package');
    const packageManifest = JSON.parse(readFileSync(path.join(packageDirectory, 'package.json'), 'utf8'));
    if (packageManifest.name !== name || packageManifest.version !== version) {
      throw new Error(`npm archive manifest is ${packageManifest.name}@${packageManifest.version}, expected ${name}@${version}`);
    }
    return {
      archive,
      archiveIntegrity: sha512Integrity(archive),
      packageDirectory,
      temporaryDirectory,
    };
  } catch (error) {
    rmSync(temporaryDirectory, { recursive: true, force: true });
    throw error;
  }
}

function sourceComparison(upstreamInventory, localInventory) {
  const upstreamFiles = upstreamInventory.files;
  const localFiles = localInventory.files;
  const paths = [...new Set([...Object.keys(upstreamFiles), ...Object.keys(localFiles)])].sort((left, right) => left.localeCompare(right));
  const files = {};
  for (const filePath of paths) {
    const upstreamSha256 = upstreamFiles[filePath] ?? null;
    const localSha256 = localFiles[filePath] ?? null;
    const category = upstreamSha256 === null
      ? 'added'
      : localSha256 === null
        ? 'removed'
        : upstreamSha256 === localSha256
          ? 'unchanged'
          : 'modified';
    files[filePath] = { category, upstreamSha256, localSha256 };
  }
  return files;
}

function buildInventory({ name, version, archiveIntegrity, upstreamInventory, localInventory, registry }) {
  return {
    schemaVersion: lockSchemaVersion,
    upstream: {
      name,
      version,
      registry: registry ?? 'https://registry.npmjs.org',
      tarballIntegrity: archiveIntegrity,
      sourceRoot: 'src',
      sourceTreeSha256: upstreamInventory.sourceTreeSha256,
      files: upstreamInventory.files,
    },
    local: {
      sourceRoot: 'src',
      sourceTreeSha256: localInventory.sourceTreeSha256,
      files: sourceComparison(upstreamInventory, localInventory),
    },
  };
}

function compareHashMap(expected, actual, source) {
  const expectedKeys = Object.keys(expected).sort();
  const actualKeys = Object.keys(actual).sort();
  const errors = [];
  if (expectedKeys.join('\0') !== actualKeys.join('\0')) {
    errors.push(`${source} file set drift: expected [${expectedKeys.join(', ')}], actual [${actualKeys.join(', ')}]`);
  }
  for (const filePath of new Set([...expectedKeys, ...actualKeys])) {
    if (expected[filePath] !== actual[filePath]) {
      errors.push(`${source}.${filePath} drift: expected ${expected[filePath] ?? '<missing>'}, actual ${actual[filePath] ?? '<missing>'}`);
    }
  }
  return errors;
}

function compareManifest(manifest, actualInventory) {
  const errors = [];
  if (manifest.upstream.tarballIntegrity !== actualInventory.upstream.tarballIntegrity) {
    errors.push(`upstream tarball integrity drift: expected ${manifest.upstream.tarballIntegrity}, actual ${actualInventory.upstream.tarballIntegrity}`);
  }
  if (manifest.upstream.sourceTreeSha256 !== actualInventory.upstream.sourceTreeSha256) {
    errors.push(`upstream source tree drift: expected ${manifest.upstream.sourceTreeSha256}, actual ${actualInventory.upstream.sourceTreeSha256}`);
  }
  errors.push(...compareHashMap(manifest.upstream.files, actualInventory.upstream.files, 'upstream.files'));
  if (manifest.local.sourceTreeSha256 !== actualInventory.local.sourceTreeSha256) {
    errors.push(`local source tree drift: expected ${manifest.local.sourceTreeSha256}, actual ${actualInventory.local.sourceTreeSha256}`);
  }
  const expectedLocalFiles = normalizeFileEntries(manifest.local.files);
  const actualLocalFiles = actualInventory.local.files;
  const expectedPaths = Object.keys(expectedLocalFiles).sort();
  const actualPaths = Object.keys(actualLocalFiles).sort();
  if (expectedPaths.join('\0') !== actualPaths.join('\0')) {
    errors.push(`local patch manifest file set drift: expected [${expectedPaths.join(', ')}], actual [${actualPaths.join(', ')}]`);
  }
  for (const filePath of new Set([...expectedPaths, ...actualPaths])) {
    const expected = expectedLocalFiles[filePath];
    const actual = actualLocalFiles[filePath];
    if (!expected || !actual) continue;
    for (const field of ['category', 'upstreamSha256', 'localSha256']) {
      if (expected[field] !== actual[field]) {
        errors.push(`local.files.${filePath}.${field} drift: expected ${expected[field] ?? '<missing>'}, actual ${actual[field] ?? '<missing>'}`);
      }
    }
  }
  return errors;
}

function run(options) {
  if (options.mode === 'help') {
    console.log(usage());
    return;
  }
  const manifest = options.mode === 'check' ? readLockManifest(options.manifestPath) : null;
  const name = options.packageName ?? manifest?.upstream.name ?? 'mutative';
  const version = options.packageVersion ?? manifest?.upstream.version ?? '1.3.0';
  if (name !== 'mutative') throw new Error(`Only the upstream mutative package is supported, received ${name}`);
  const upstream = acquireUpstream({ name, version, registry: options.registry ?? manifest?.upstream.registry });
  try {
    const upstreamInventory = sourceInventory(path.join(upstream.packageDirectory, 'src'));
    const localRoot = path.join(options.repository, 'packages', 'mutative-core', 'src');
    const localInventory = sourceInventory(localRoot);
    const actualInventory = {
      upstream: { tarballIntegrity: upstream.archiveIntegrity, sourceTreeSha256: upstreamInventory.sourceTreeSha256, files: upstreamInventory.files },
      local: { sourceTreeSha256: localInventory.sourceTreeSha256, files: sourceComparison(upstreamInventory, localInventory) },
    };
    if (options.mode === 'inventory') {
      console.log(JSON.stringify(buildInventory({
        name,
        version,
        archiveIntegrity: upstream.archiveIntegrity,
        upstreamInventory,
        localInventory,
        registry: options.registry ?? manifest?.upstream.registry,
      }), null, 2));
      return;
    }
    const errors = compareManifest(manifest, actualInventory);
    if (errors.length > 0) {
      throw new Error(`Mutative upstream lock verification failed:\n${errors.map((error) => `- ${error}`).join('\n')}`);
    }
    const categories = Object.values(actualInventory.local.files).reduce((counts, entry) => {
      counts[entry.category] = (counts[entry.category] ?? 0) + 1;
      return counts;
    }, {});
    console.log(JSON.stringify({
      status: 'ok',
      upstream: { name, version, tarballIntegrity: upstream.archiveIntegrity, sourceTreeSha256: upstreamInventory.sourceTreeSha256 },
      local: { sourceTreeSha256: localInventory.sourceTreeSha256, categories },
    }));
  } finally {
    rmSync(upstream.temporaryDirectory, { recursive: true, force: true });
  }
}

export {
  buildInventory,
  collectSourceFiles,
  compareManifest,
  normalizeFileEntries,
  normalizeSource,
  parseArgs,
  sha256,
  sourceComparison,
  sourceInventory,
  sourceTreeHash,
  validateManifestShape,
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    run(parseArgs());
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
