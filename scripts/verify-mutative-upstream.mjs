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
  mkdirSync,
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
const approvedUpstream = {
  name: 'mutative',
  version: '1.3.0',
  gitHead: '01945e3274e9730706799e4d432c22248a6bdeb1',
  repository: 'git+https://github.com/unadlib/mutative.git',
};
const sourceCategories = new Set(['unchanged', 'modified', 'added', 'removed']);

function compareSourcePaths(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

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
    .sort(([left], [right]) => compareSourcePaths(left, right))
    .map(([filePath, digest]) => `${filePath}\0${digest}\n`)
    .join('');
  return sha256(canonical);
}

function sourceInventory(root) {
  const files = collectSourceFiles(root);
  return {
    sourceTreeSha256: sourceTreeHash(files),
    files: Object.fromEntries([...files.entries()].sort(([left], [right]) => compareSourcePaths(left, right))),
  };
}

function parseArgs(argv = process.argv.slice(2)) {
  let mode = 'check';
  let manifestPath = defaultManifestPath;
  let repository = repositoryRoot;
  let packageName;
  let packageVersion;
  let registry;
  const argumentValue = (index, argument) => {
    const value = argv[index];
    if (!value || value.startsWith('--')) throw new Error(`${argument} requires a value`);
    return value;
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--check') {
      mode = 'check';
    } else if (argument === '--inventory') {
      mode = 'inventory';
    } else if (argument === '--manifest') {
      manifestPath = path.resolve(argumentValue(++index, argument));
    } else if (argument === '--root') {
      repository = path.resolve(argumentValue(++index, argument));
    } else if (argument === '--package') {
      packageName = argumentValue(++index, argument);
    } else if (argument === '--version') {
      packageVersion = argumentValue(++index, argument);
    } else if (argument === '--registry') {
      registry = argumentValue(++index, argument);
    } else if (argument === '--update') {
      throw new Error('Source update is intentionally disabled; use --inventory and review the lock file manually.');
    } else if (argument === '--help' || argument === '-h') {
      mode = 'help';
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  if (mode === 'check' && (packageName || packageVersion)) {
    throw new Error('--package and --version are inventory-only; check must use the reviewed lock baseline.');
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
  if (upstream.version !== approvedUpstream.version) {
    throw new Error(`${source} upstream.version must match the reviewed ${approvedUpstream.version} baseline`);
  }
  if (upstream.gitHead !== approvedUpstream.gitHead) {
    throw new Error(`${source} upstream.gitHead must match the reviewed ${approvedUpstream.gitHead} source commit`);
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

function validateSyncManifest(sync, lock, repository, source = 'upstream-sync.json') {
  if (!sync || typeof sync !== 'object' || Array.isArray(sync)
    || sync.schemaVersion !== lockSchemaVersion) {
    throw new Error(`${source} must use ${lockSchemaVersion}`);
  }
  for (const field of ['name', 'version', 'gitHead']) {
    if (sync.upstream?.[field] !== lock.upstream[field]) {
      throw new Error(`${source} upstream.${field} must match the reviewed upstream lock`);
    }
  }
  for (const field of ['repository', 'branch', 'commit']) {
    if (typeof lock.maintainedFork?.[field] !== 'string'
      || sync.maintainedFork?.[field] !== lock.maintainedFork[field]) {
      throw new Error(`${source} maintainedFork.${field} must match the reviewed upstream lock`);
    }
  }
  if (!/^[a-f0-9]{40}$/u.test(sync.maintainedFork.commit)) {
    throw new Error(`${source} maintainedFork.commit must be an immutable Git commit`);
  }
  for (const field of ['package', 'versionLine']) {
    if (sync.adapter?.[field] !== lock.adapter?.[field]) {
      throw new Error(`${source} adapter.${field} must match the reviewed upstream lock`);
    }
  }
  if (sync.adapter.package !== '@context-action/mutative'
    || sync.adapter.versionLine !== '0.8.x') {
    throw new Error(`${source} must preserve the scoped adapter 0.8.x patch line`);
  }
  if (!Array.isArray(sync.localPatchContracts) || sync.localPatchContracts.length === 0) {
    throw new Error(`${source} must retain the maintained local patch contracts`);
  }
  const contracts = new Set();
  for (const contract of sync.localPatchContracts) {
    if (typeof contract?.id !== 'string' || contracts.has(contract.id)
      || !Array.isArray(contract.files) || contract.files.length === 0
      || !Array.isArray(contract.tests) || contract.tests.length === 0) {
      throw new Error(`${source} must define unique patch contracts with source files and tests`);
    }
    contracts.add(contract.id);
    for (const file of contract.files) {
      if (!Object.hasOwn(lock.local.files, file)) {
        throw new Error(`${source} patch ${contract.id} names a source missing from the lock: ${file}`);
      }
    }
    for (const testPath of contract.tests) {
      if (typeof testPath !== 'string'
        || !testPath.startsWith('packages/mutative-core/__tests__/')
        || testPath.includes('..')
        || !existsSync(path.join(repository, testPath))) {
        throw new Error(`${source} patch ${contract.id} names a missing regression test: ${testPath}`);
      }
    }
  }
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
    const registryMetadata = JSON.parse(execFileSync('npm', [
      'view', `${name}@${version}`, 'name', 'version', 'gitHead', 'dist.integrity', 'repository', '--json',
    ], { cwd: temporaryDirectory, encoding: 'utf8', env: environment, stdio: ['ignore', 'pipe', 'pipe'] }));
    if (registryMetadata.name !== name || registryMetadata.version !== version
      || registryMetadata.repository?.url !== approvedUpstream.repository
      || !/^[a-f0-9]{40}$/u.test(registryMetadata.gitHead ?? '')) {
      throw new Error(`Registry metadata does not identify the upstream ${name}@${version} source`);
    }
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
    const archiveIntegrity = sha512Integrity(archive);
    if (registryMetadata['dist.integrity'] !== archiveIntegrity) {
      throw new Error(`npm archive integrity does not match registry metadata for ${name}@${version}`);
    }
    const entries = execFileSync('tar', ['-tzf', archivePath], { encoding: 'utf8' })
      .split(/\r?\n/u)
      .filter(Boolean);
    for (const entry of entries) {
      if (!entry.startsWith('package/') || entry.includes('../') || entry.startsWith('/') || entry.includes('\\')) {
        throw new Error(`Unsafe npm archive entry: ${entry}`);
      }
    }
    const extractDirectory = path.join(temporaryDirectory, 'extract');
    mkdirSync(extractDirectory);
    execFileSync('tar', ['-xzf', archivePath, '-C', extractDirectory, '--no-same-owner']);
    const packageDirectory = path.join(extractDirectory, 'package');
    const packageManifest = JSON.parse(readFileSync(path.join(packageDirectory, 'package.json'), 'utf8'));
    if (packageManifest.name !== name || packageManifest.version !== version) {
      throw new Error(`npm archive manifest is ${packageManifest.name}@${packageManifest.version}, expected ${name}@${version}`);
    }
    return {
      archive,
      archiveIntegrity,
      gitHead: registryMetadata.gitHead,
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
  const paths = [...new Set([...Object.keys(upstreamFiles), ...Object.keys(localFiles)])].sort(compareSourcePaths);
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

function buildInventory({ name, version, gitHead, archiveIntegrity, upstreamInventory, localInventory, registry }) {
  return {
    schemaVersion: lockSchemaVersion,
    upstream: {
      name,
      version,
      gitHead,
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
  if (manifest.upstream.gitHead !== actualInventory.upstream.gitHead) {
    errors.push(`upstream gitHead drift: expected ${manifest.upstream.gitHead}, actual ${actualInventory.upstream.gitHead}`);
  }
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
  if (manifest) {
    const syncPath = path.join(options.repository, 'packages', 'mutative-core', 'upstream-sync.json');
    const sync = JSON.parse(readFileSync(syncPath, 'utf8'));
    validateSyncManifest(sync, manifest, options.repository, syncPath);
  }
  const name = options.packageName ?? manifest?.upstream.name ?? 'mutative';
  const version = options.packageVersion ?? manifest?.upstream.version ?? '1.3.0';
  if (name !== 'mutative') throw new Error(`Only the upstream mutative package is supported, received ${name}`);
  const upstream = acquireUpstream({ name, version, registry: options.registry ?? manifest?.upstream.registry });
  try {
    const upstreamInventory = sourceInventory(path.join(upstream.packageDirectory, 'src'));
    const localRoot = path.join(options.repository, 'packages', 'mutative-core', 'src');
    const localInventory = sourceInventory(localRoot);
    const actualInventory = {
      upstream: { gitHead: upstream.gitHead, tarballIntegrity: upstream.archiveIntegrity, sourceTreeSha256: upstreamInventory.sourceTreeSha256, files: upstreamInventory.files },
      local: { sourceTreeSha256: localInventory.sourceTreeSha256, files: sourceComparison(upstreamInventory, localInventory) },
    };
    if (options.mode === 'inventory') {
      console.log(JSON.stringify(buildInventory({
        name,
        version,
        gitHead: upstream.gitHead,
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
    const changes = Object.entries(actualInventory.local.files)
      .filter(([, entry]) => entry.category !== 'unchanged')
      .map(([filePath, entry]) => ({ path: filePath, ...entry }));
    console.log(JSON.stringify({
      status: 'ok',
      upstream: { name, version, gitHead: upstream.gitHead, tarballIntegrity: upstream.archiveIntegrity, sourceTreeSha256: upstreamInventory.sourceTreeSha256 },
      local: { sourceTreeSha256: localInventory.sourceTreeSha256, categories, changes },
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
  validateSyncManifest,
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    run(parseArgs());
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
