#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(repositoryRoot, 'releases', 'coordinated-stable-2026-08.json');
const expectedPackages = new Set(['@context-action/core', '@context-action/react']);
const outputIndex = process.argv.indexOf('--output');
const output = outputIndex === -1 ? undefined : process.argv[outputIndex + 1];
if (!output || output.startsWith('--')) throw new Error('Usage: node scripts/promote-coordinated-stable.mjs --output <repository-relative JSON path>');
if (process.env.GITHUB_ACTIONS !== 'true') throw new Error('Coordinated stable promotion may run only in GitHub Actions');
const resolvedOutput = path.resolve(repositoryRoot, output);
if (resolvedOutput !== repositoryRoot && !resolvedOutput.startsWith(`${repositoryRoot}${path.sep}`)) {
  throw new Error('--output must stay within the repository');
}

const plan = JSON.parse(await readFile(planPath, 'utf8'));
const releaseId = String(plan.release ?? '').replace(/[^a-z0-9-]/giu, '-');
const packages = Object.entries(plan.packages ?? {});
if (
  packages.length !== expectedPackages.size
  || packages.some(([name]) => !expectedPackages.has(name))
  || plan.candidateDistTag !== 'next'
  || plan.promotionDistTag !== 'latest'
) throw new Error('Invalid coordinated stable release plan');

function npm(argumentsList) {
  return execFileSync('npm', argumentsList, { cwd: repositoryRoot, encoding: 'utf8', env: { ...process.env, npm_config_loglevel: 'error' } }).trim();
}
function tagsFor(name) {
  const value = JSON.parse(npm(['view', name, 'dist-tags', '--json', '--registry=https://registry.npmjs.org']));
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Invalid dist-tags for ${name}`);
  return value;
}
function add(name, version, tag) { npm(['dist-tag', 'add', `${name}@${version}`, tag, '--registry=https://registry.npmjs.org']); }
function remove(name, tag) { npm(['dist-tag', 'rm', name, tag, '--registry=https://registry.npmjs.org']); }
function journal(name, version) {
  const suffix = `${releaseId}-${version}`;
  return { previous: `stable-previous-${suffix}`, absent: `stable-previous-absent-${suffix}`, ready: `stable-ready-${suffix}`, completed: `stable-completed-${suffix}`, rolledBack: `stable-rolled-back-${suffix}` };
}
function predecessor(tags, entries) {
  const previous = tags[entries.previous];
  const absent = tags[entries.absent];
  if (previous && absent) throw new Error('Promotion journal has both predecessor representations');
  if (previous) return previous;
  if (absent) return null;
  return undefined;
}

const report = { schemaVersion: 'context-action-coordinated-promotion.v1', release: plan.release, startedAt: new Date().toISOString(), packages: [] };
const prepared = [];
try {
  for (const [name, version] of packages) {
    let tags = tagsFor(name);
    const entries = journal(name, version);
    if (tags.next !== version) throw new Error(`${name} next tag is not the approved candidate ${version}`);
    let prior = predecessor(tags, entries);
    if (tags[entries.ready] && tags[entries.ready] !== version) throw new Error(`${name} promotion journal is bound to another candidate`);
    if (prior === undefined) {
      if (tags.latest) add(name, tags.latest, entries.previous);
      else add(name, version, entries.absent);
      tags = tagsFor(name);
      prior = predecessor(tags, entries);
      if (prior === undefined) throw new Error(`${name} predecessor journal did not persist`);
    }
    if (!tags[entries.ready]) add(name, version, entries.ready);
    tags = tagsFor(name);
    if (tags[entries.ready] !== version) throw new Error(`${name} ready journal did not persist`);
    if (tags.latest !== version && tags.latest !== prior) throw new Error(`${name} latest changed after journal preparation`);
    prepared.push({ name, version, entries, predecessor: prior });
  }
  for (const item of prepared) {
    const tags = tagsFor(item.name);
    if (tags.latest !== item.version) {
      if (tags.latest !== item.predecessor) throw new Error(`${item.name} latest changed before promotion`);
      add(item.name, item.version, 'latest');
    }
    if (tagsFor(item.name).latest !== item.version) throw new Error(`${item.name} latest promotion did not persist`);
    add(item.name, item.version, item.entries.completed);
    if (tagsFor(item.name)[item.entries.completed] !== item.version) throw new Error(`${item.name} completion journal did not persist`);
    report.packages.push({ name: item.name, version: item.version, predecessor: item.predecessor, promoted: true });
  }
  report.status = 'promoted';
} catch (error) {
  report.status = 'failed';
  report.error = error instanceof Error ? error.message : String(error);
  for (const item of [...prepared].reverse()) {
    try {
      const tags = tagsFor(item.name);
      if (tags.latest !== item.version) continue;
      add(item.name, item.version, item.entries.rolledBack);
      if (item.predecessor) add(item.name, item.predecessor, 'latest');
      else remove(item.name, 'latest');
    } catch (rollbackError) {
      report.rollbackError ??= [];
      report.rollbackError.push(`${item.name}: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`);
    }
  }
  throw error;
} finally {
  report.completedAt = new Date().toISOString();
  await mkdir(path.dirname(resolvedOutput), { recursive: true });
  await writeFile(resolvedOutput, `${JSON.stringify(report, null, 2)}\n`);
}
