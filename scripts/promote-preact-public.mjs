#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(repositoryRoot, 'releases', 'preact-public-2026-10.json');

function option(name, { required = false } = {}) {
  const index = process.argv.indexOf(name);
  if (index < 0) {
    if (required) throw new Error(`${name} is required`);
    return undefined;
  }
  const value = process.argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`);
  return value;
}

const releaseCommit = option('--commit', { required: true });
const output = option('--output', { required: true });
if (!/^[a-f0-9]{40}$/u.test(releaseCommit)) throw new Error('--commit must be a 40-character SHA');

const plan = JSON.parse(await readFile(planPath, 'utf8'));
const packages = Object.entries(plan.packages ?? {});
if (JSON.stringify(packages.map(([name]) => name))
  !== JSON.stringify(['@context-action/preact', '@context-action/preact-ui'])) {
  throw new Error('Preact promotion plan must contain the exact dependency order');
}

function npmJson(args) {
  return JSON.parse(execFileSync('npm', [...args, '--registry=https://registry.npmjs.org'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env: { ...process.env, npm_config_loglevel: 'error' },
  }));
}

const registryOrigin = 'https://registry.npmjs.org';

async function tagsFor(name) {
  // `npm view` reads the package document, whose CDN propagation can lag a
  // successful dist-tag mutation. Read the dedicated tag document directly
  // and cache-bust the request so promotion dist-tags are observed from their
  // authoritative registry route.
  try {
    const response = await fetch(
      `${registryOrigin}/-/package/${encodeURIComponent(name)}/dist-tags?cacheBust=${Date.now()}`,
      { headers: { accept: 'application/json', 'cache-control': 'no-cache', pragma: 'no-cache' } },
    );
    if (response.ok) {
      const value = await response.json();
      if (value && typeof value === 'object' && !Array.isArray(value)) return value;
    }
  } catch {
    // fallback to npm view if authoritative fetch fails
  }
  return npmJson(['view', name, 'dist-tags', '--json']);
}

async function tagValue(name, tag) {
  const tags = await tagsFor(name);
  const value = tags?.[tag];
  if (value !== undefined && typeof value !== 'string') {
    throw new Error(`${name} ${tag} tag is not a string`);
  }
  return value;
}

async function waitForTagValue(name, tag, expected, attempts = 5, delayMs = 500) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const value = await tagValue(name, tag);
    if (value === expected) return value;
    if (attempt < attempts) await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  return tagValue(name, tag);
}

function mutateTag(name, version, tag) {
  execFileSync('npm', ['dist-tag', 'add', `${name}@${version}`, tag, '--registry=https://registry.npmjs.org'], {
    cwd: repositoryRoot,
    stdio: 'inherit',
    env: { ...process.env, npm_config_loglevel: 'error' },
  });
}

function removeTag(name, tag) {
  execFileSync('npm', ['dist-tag', 'rm', name, tag, '--registry=https://registry.npmjs.org'], {
    cwd: repositoryRoot,
    stdio: 'inherit',
    env: { ...process.env, npm_config_loglevel: 'error' },
  });
}

const previous = new Map();
const changed = [];
for (const [name, version] of packages) {
  const candidate = await tagValue(name, 'next');
  if (candidate !== version) {
    throw new Error(`${name} next tag must resolve to ${version}; received ${candidate ?? 'absent'}`);
  }
  previous.set(name, await tagValue(name, 'latest'));
}

try {
  for (const [name, version] of packages) {
    const observedLatest = await tagValue(name, 'latest');
    if (observedLatest !== previous.get(name)) {
      throw new Error(
        `${name} latest changed after preflight; expected ${previous.get(name) ?? 'absent'}, `
          + `received ${observedLatest ?? 'absent'}`,
      );
    }
    mutateTag(name, version, 'latest');
    changed.push(name);
    const verifiedLatest = await waitForTagValue(name, 'latest', version);
    if (verifiedLatest !== version) {
      throw new Error(`${name} latest tag did not resolve to ${version} after mutation`);
    }
  }
  const report = {
    schemaVersion: 'context-action-preact-public-promotion.v1',
    status: 'promoted',
    releaseCommit,
    workflowEventSha: process.env.GITHUB_SHA ?? null,
    packages: Object.fromEntries(await Promise.all(packages.map(async ([name, version]) => [name, {
      version,
      previousLatest: previous.get(name) ?? null,
      latest: await tagValue(name, 'latest'),
      next: await tagValue(name, 'next'),
    }]))),
    promotedAt: new Date().toISOString(),
  };
  await mkdir(path.dirname(path.resolve(repositoryRoot, output)), { recursive: true });
  await writeFile(path.resolve(repositoryRoot, output), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Promoted Preact public preview to latest; evidence written to ${output}`);
} catch (error) {
  for (const name of changed.reverse()) {
    const prior = previous.get(name);
    try {
      const current = await waitForTagValue(name, 'latest', plan.packages[name], 3, 1000);
      if (current !== plan.packages[name]) {
        console.error(
          `Refusing rollback for ${name}: latest changed to ${current ?? 'absent'} `
            + `after promotion candidate ${plan.packages[name]}.`,
        );
        continue;
      }
      if (prior) mutateTag(name, prior, 'latest');
      else removeTag(name, 'latest');
    } catch (rollbackError) {
      console.error(`Rollback failed for ${name}: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`);
    }
  }
  throw error;
}
