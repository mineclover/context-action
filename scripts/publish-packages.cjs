#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { dirname } = require('node:path');
const {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');

if (process.env.GITHUB_ACTIONS !== 'true') {
  throw new Error('Direct package publication is disabled. Use an approved GitHub Actions release workflow.');
}

const argumentsList = process.argv.slice(2).filter((argument) => argument !== '--');

function optionValues(name) {
  const values = [];
  for (let index = 0; index < argumentsList.length; index += 1) {
    if (argumentsList[index] !== name) continue;
    const value = argumentsList[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`);
    values.push(value);
    index += 1;
  }
  return values;
}

function positionalArguments() {
  const positional = [];
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === '--require-all-unpublished' || argument === '--resume-matching-existing') continue;
    if (argument.startsWith('--')) {
      index += 1;
      continue;
    }
    positional.push(argument);
  }
  return positional;
}

const summaryOption = optionValues('--summary-file');
if (summaryOption.length > 1) throw new Error('--summary-file may be provided once');
const distTagOption = optionValues('--dist-tag');
if (distTagOption.length > 1) throw new Error('--dist-tag may be provided once');
const scopes = optionValues('--scope');
const requireAllUnpublishedCount = argumentsList
  .filter(argument => argument === '--require-all-unpublished').length;
if (requireAllUnpublishedCount > 1) throw new Error('--require-all-unpublished may be provided once');
const requireAllUnpublished = requireAllUnpublishedCount === 1;
const resumeMatchingExistingCount = argumentsList
  .filter(argument => argument === '--resume-matching-existing').length;
if (resumeMatchingExistingCount > 1) throw new Error('--resume-matching-existing may be provided once');
const resumeMatchingExisting = resumeMatchingExistingCount === 1;
const [summaryArgument] = positionalArguments();
const summaryFile = summaryOption[0] ?? summaryArgument ?? path.join('reports', 'npm-publish-summary.json');
const distTag = distTagOption[0];
if (distTag && !/^[a-z][a-z0-9._-]*$/u.test(distTag)) {
  throw new Error(`Invalid npm dist-tag: ${distTag}`);
}
for (const scope of scopes) {
  if (!/^@context-action\/[a-z0-9-]+$/u.test(scope)) {
    throw new Error(`Invalid package scope: ${scope}`);
  }
}
if (new Set(scopes).size !== scopes.length) throw new Error('Each --scope package must be unique');
if (requireAllUnpublished && scopes.length === 0) {
  throw new Error('--require-all-unpublished requires at least one --scope package');
}
if (resumeMatchingExisting && !requireAllUnpublished) {
  throw new Error('--resume-matching-existing requires --require-all-unpublished');
}
if (scopes.length === 0) {
  throw new Error('Publication requires at least one explicit --scope package');
}

mkdirSync(dirname(summaryFile), { recursive: true });

function commandSucceeded(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    env: { ...process.env },
    ...options,
  });
  return result.status === 0 ? result : undefined;
}

let activeArtifactRoot;

function publishScopedPackages() {
  if (!distTag) throw new Error('Scoped publishing requires --dist-tag');
  const listResult = commandSucceeded('pnpm', ['exec', 'lerna', 'list', '--all', '--json']);
  if (!listResult) throw new Error('Could not read the Lerna package list for scoped publishing');
  const packages = JSON.parse(listResult.stdout);
  const selected = scopes.map((name) => {
    const packageEntry = packages.find((entry) => entry.name === name);
    if (!packageEntry) throw new Error(`Requested package is not publishable: ${name}`);
    return packageEntry;
  });
  const selectedPackages = selected.map((packageEntry) => ({
    packageEntry,
    manifest: JSON.parse(readFileSync(path.join(packageEntry.location, 'package.json'), 'utf8')),
  }));
  for (const { packageEntry, manifest } of selectedPackages) {
    if (manifest.name !== packageEntry.name || !scopes.includes(manifest.name)) {
      throw new Error(`Selected package identity changed before publication: ${packageEntry.name}`);
    }
  }
  const summary = [];
  const writeSummary = () => {
    const temporarySummary = `${summaryFile}.tmp-${process.pid}`;
    writeFileSync(temporarySummary, `${JSON.stringify(summary, null, 2)}\n`);
    renameSync(temporarySummary, summaryFile);
  };

  function publishedVersions(manifest) {
    const attempts = 3;
    let lastFailure;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const result = spawnSync(
        'npm',
        ['view', manifest.name, 'versions', '--json', '--registry=https://registry.npmjs.org'],
        { encoding: 'utf8', env: { ...process.env } },
      );
      if (result.status === 0) {
        let parsed;
        try {
          parsed = JSON.parse(result.stdout);
        } catch (error) {
          throw new Error(`npm returned invalid version metadata for ${manifest.name}: ${error.message}`);
        }
        const versions = Array.isArray(parsed) ? parsed : typeof parsed === 'string' ? [parsed] : undefined;
        if (!versions || versions.some(version => typeof version !== 'string')) {
          throw new Error(`npm returned invalid version metadata for ${manifest.name}`);
        }
        return new Set(versions);
      }
      const npmError = `${result.stderr ?? ''}\n${result.stdout ?? ''}`;
      if (/\bE404\b/u.test(npmError)) return new Set();
      lastFailure = result;
      if (attempt < attempts) {
        process.stderr.write(
          `Could not verify published versions for ${manifest.name} (${attempt}/${attempts}); retrying.\n`,
        );
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5_000);
      }
    }
    const detail = lastFailure?.stderr?.trim() || `exit code ${String(lastFailure?.status)}`;
    throw new Error(`Could not verify published versions for ${manifest.name}: ${detail}`);
  }

  function registryIntegrity(manifest) {
    const result = spawnSync(
      'npm',
      [
        'view',
        `${manifest.name}@${manifest.version}`,
        'dist.integrity',
        '--json',
        '--registry=https://registry.npmjs.org',
      ],
      { encoding: 'utf8', env: { ...process.env } },
    );
    if (result.status !== 0) {
      const detail = result.stderr?.trim() || `exit code ${String(result.status)}`;
      throw new Error(`Could not read registry integrity for ${manifest.name}@${manifest.version}: ${detail}`);
    }
    let integrity;
    try {
      integrity = JSON.parse(result.stdout);
    } catch (error) {
      throw new Error(
        `npm returned invalid integrity metadata for ${manifest.name}@${manifest.version}: ${error.message}`,
      );
    }
    if (typeof integrity !== 'string' || !/^sha512-[A-Za-z0-9+/]+={0,2}$/u.test(integrity)) {
      throw new Error(`npm returned invalid integrity metadata for ${manifest.name}@${manifest.version}`);
    }
    return integrity;
  }

  function packArtifact(packageEntry, manifest, artifactRoot) {
    const packageArtifactDirectory = path.join(
      artifactRoot,
      manifest.name.replace(/^@context-action\//u, ''),
    );
    mkdirSync(packageArtifactDirectory, { recursive: true });
    const prepublish = spawnSync(
      'npm',
      ['run', 'prepublishOnly', '--if-present'],
      { cwd: packageEntry.location, encoding: 'utf8', env: { ...process.env } },
    );
    if (prepublish.status !== 0) {
      const detail = prepublish.stderr?.trim() || `exit code ${String(prepublish.status)}`;
      throw new Error(`Could not run prepublishOnly for ${manifest.name}@${manifest.version}: ${detail}`);
    }
    const pack = spawnSync(
      'npm',
      ['pack', '--json', '--pack-destination', packageArtifactDirectory],
      { cwd: packageEntry.location, encoding: 'utf8', env: { ...process.env } },
    );
    if (pack.status !== 0) {
      const detail = pack.stderr?.trim() || `exit code ${String(pack.status)}`;
      throw new Error(`Could not pack ${manifest.name}@${manifest.version}: ${detail}`);
    }
    let metadata;
    try {
      metadata = JSON.parse(pack.stdout);
    } catch (error) {
      throw new Error(`npm returned invalid pack metadata for ${manifest.name}: ${error.message}`);
    }
    const packed = Array.isArray(metadata) && metadata.length === 1 ? metadata[0] : undefined;
    const filename = packed?.filename;
    if (typeof filename !== 'string' || path.basename(filename) !== filename
      || packed.name !== manifest.name || packed.version !== manifest.version) {
      throw new Error(`npm returned invalid pack metadata for ${manifest.name}`);
    }
    const artifactPath = path.join(packageArtifactDirectory, filename);
    const packedManifestResult = spawnSync(
      'tar',
      ['-xOf', artifactPath, 'package/package.json'],
      { cwd: packageEntry.location, encoding: 'utf8', env: { ...process.env } },
    );
    if (packedManifestResult.status !== 0) {
      const detail = packedManifestResult.stderr?.trim()
        || `exit code ${String(packedManifestResult.status)}`;
      throw new Error(`Could not inspect packed manifest for ${manifest.name}: ${detail}`);
    }
    let packedManifest;
    try {
      packedManifest = JSON.parse(packedManifestResult.stdout);
    } catch (error) {
      throw new Error(`Packed manifest is invalid for ${manifest.name}: ${error.message}`);
    }
    if (packedManifest.name !== manifest.name || packedManifest.version !== manifest.version) {
      throw new Error(
        `Packed package identity changed for ${manifest.name}@${manifest.version}`,
      );
    }
    const integrity = `sha512-${createHash('sha512').update(readFileSync(artifactPath)).digest('base64')}`;
    return { artifactPath, integrity };
  }

  const publicationState = new Map();

  if (requireAllUnpublished) {
    const alreadyPublished = [];
    const lookupFailures = [];
    for (const { manifest } of selectedPackages) {
      try {
        if (publishedVersions(manifest).has(manifest.version)) {
          alreadyPublished.push(`${manifest.name}@${manifest.version}`);
        }
      } catch (error) {
        lookupFailures.push(error.message);
      }
    }
    if (lookupFailures.length > 0) {
      summary.push(...selectedPackages.map(({ manifest }) => ({
        packageName: manifest.name,
        version: manifest.version,
        status: 'preflight-failed',
        remediation: 'Retry only after registry metadata is healthy; no registry mutation was attempted.',
      })));
      writeSummary();
      throw new Error(`Scoped publication preflight failed closed: ${lookupFailures.join('; ')}`);
    }
    if (alreadyPublished.length > 0) {
      if (resumeMatchingExisting) {
        activeArtifactRoot = mkdtempSync(path.join(tmpdir(), 'context-action-publish-'));
        const verificationFailures = [];
        for (const { packageEntry, manifest } of selectedPackages) {
          try {
            const artifact = packArtifact(packageEntry, manifest, activeArtifactRoot);
            const published = alreadyPublished.includes(`${manifest.name}@${manifest.version}`);
            if (published) {
              const publishedIntegrity = registryIntegrity(manifest);
              if (publishedIntegrity !== artifact.integrity) {
                throw new Error(
                  `Registry artifact integrity does not match the approved source for ${manifest.name}@${manifest.version}`,
                );
              }
            }
            publicationState.set(manifest.name, { ...artifact, published });
          } catch (error) {
            verificationFailures.push(error.message);
          }
        }
        if (verificationFailures.length > 0 || publicationState.size !== selectedPackages.length) {
          summary.push(...selectedPackages.map(({ manifest }) => ({
            packageName: manifest.name,
            version: manifest.version,
            status: alreadyPublished.includes(`${manifest.name}@${manifest.version}`)
              ? 'existing-integrity-unverified'
              : 'unpublished',
            remediation: 'Retry only from the same approved source after registry and pack verification succeed; no registry mutation was attempted.',
          })));
          writeSummary();
          throw new Error(`Strict publication recovery failed closed: ${verificationFailures.join('; ')}`);
        }
      } else {
        summary.push(...selectedPackages.map(({ manifest }) => ({
          packageName: manifest.name,
          version: manifest.version,
          status: alreadyPublished.includes(`${manifest.name}@${manifest.version}`)
            ? 'already-published'
            : 'unpublished',
          remediation: 'Bump the complete approved cohort to new versions before retrying strict publication.',
        })));
        writeSummary();
        throw new Error(
          `Refusing scoped publication because approved versions already exist: ${alreadyPublished.join(', ')}`,
        );
      }
    } else {
      activeArtifactRoot = mkdtempSync(path.join(tmpdir(), 'context-action-publish-'));
      try {
        for (const { packageEntry, manifest } of selectedPackages) {
          publicationState.set(manifest.name, {
            ...packArtifact(packageEntry, manifest, activeArtifactRoot),
            published: false,
          });
        }
      } catch (error) {
        summary.push(...selectedPackages.map(({ manifest }) => ({
          packageName: manifest.name,
          version: manifest.version,
          status: 'artifact-preflight-failed',
          remediation: 'Fix deterministic package creation before retrying; no registry mutation was attempted.',
        })));
        writeSummary();
        throw error;
      }
    }
  }

  function ensureDistTag(manifest, packageDirectory) {
    let tags;
    const attempts = 12;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const tagsResult = commandSucceeded(
        'npm',
        ['view', manifest.name, 'dist-tags', '--json', '--registry=https://registry.npmjs.org'],
      );
      if (tagsResult) {
        tags = JSON.parse(tagsResult.stdout);
        break;
      }
      if (attempt < attempts) {
        process.stdout.write(`Waiting for npm dist-tags (${attempt}/${attempts - 1})...\n`);
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10_000);
      }
    }
    if (!tags) throw new Error(`Could not read dist-tags for ${manifest.name}`);
    if (tags[distTag] === manifest.version) return;
    const add = spawnSync(
      'npm',
      [
        'dist-tag',
        'add',
        `${manifest.name}@${manifest.version}`,
        distTag,
        '--registry=https://registry.npmjs.org',
      ],
      { cwd: packageDirectory, stdio: 'inherit', env: { ...process.env } },
    );
    if (add.status !== 0) {
      throw new Error(`Could not assign ${distTag} to ${manifest.name}@${manifest.version}`);
    }
    process.stdout.write(`Assigned ${distTag} to ${manifest.name}@${manifest.version}.\n`);
  }

  for (const { packageEntry, manifest } of selectedPackages) {
    const strictState = publicationState.get(manifest.name);
    if (strictState?.published) {
      const existingRecord = {
        packageName: manifest.name,
        version: manifest.version,
        status: 'existing-integrity-verified',
        integrity: strictState.integrity,
      };
      summary.push(existingRecord);
      writeSummary();
      try {
        ensureDistTag(manifest, packageEntry.location);
      } catch (error) {
        existingRecord.status = 'existing-integrity-verified-dist-tag-failed';
        existingRecord.remediation = 'Retry the same approved source after registry dist-tag access is restored.';
        writeSummary();
        throw error;
      }
      continue;
    }
    if (!requireAllUnpublished) {
      const published = commandSucceeded(
        'npm',
        ['view', `${manifest.name}@${manifest.version}`, 'version', '--registry=https://registry.npmjs.org'],
      );
      if (published?.stdout.trim() === manifest.version) {
        process.stdout.write(`${manifest.name}@${manifest.version} is already published; skipping.\n`);
        summary.push({ packageName: manifest.name, version: manifest.version, status: 'already-published' });
        writeSummary();
        ensureDistTag(manifest, packageEntry.location);
        continue;
      }
    }

    const publish = spawnSync(
      'npm',
      [
        'publish',
        ...(strictState ? [strictState.artifactPath] : []),
        '--access',
        'public',
        '--tag',
        distTag,
        '--provenance',
        '--registry=https://registry.npmjs.org',
      ],
      { cwd: packageEntry.location, stdio: 'inherit', env: { ...process.env } },
    );
    if (publish.status !== 0) {
      summary.push({
        packageName: manifest.name,
        version: manifest.version,
        status: 'publish-failed',
        ...(strictState ? { integrity: strictState.integrity } : {}),
        remediation: requireAllUnpublished
          ? 'Retry the same approved source with --resume-matching-existing; existing artifacts must match before publication resumes.'
          : 'Inspect registry state before retrying publication.',
      });
      writeSummary();
      throw new Error(`${manifest.name}@${manifest.version} failed to publish`);
    }
    const publishedRecord = {
      packageName: manifest.name,
      version: manifest.version,
      status: 'published',
      ...(strictState ? { integrity: strictState.integrity } : {}),
    };
    summary.push(publishedRecord);
    writeSummary();
    try {
      ensureDistTag(manifest, packageEntry.location);
    } catch (error) {
      publishedRecord.status = 'published-dist-tag-failed';
      publishedRecord.remediation = 'The version exists; inspect registry tags and bump the full strict cohort before retrying.';
      writeSummary();
      throw error;
    }
  }

  writeSummary();
}

try {
  publishScopedPackages();
} finally {
  if (activeArtifactRoot) {
    const resolvedArtifactRoot = path.resolve(activeArtifactRoot);
    const expectedParent = path.resolve(tmpdir());
    if (
      path.dirname(resolvedArtifactRoot) !== expectedParent
      || !path.basename(resolvedArtifactRoot).startsWith('context-action-publish-')
    ) {
      process.stderr.write(`Refusing to clean unexpected artifact directory: ${resolvedArtifactRoot}\n`);
    } else {
      try {
        rmSync(resolvedArtifactRoot, { recursive: true });
      } catch (error) {
        process.stderr.write(`Could not clean temporary publication artifacts: ${error.message}\n`);
      }
    }
  }
}
