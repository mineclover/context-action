#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultOutput = 'reports/release/v1.0.0/package-inventory.json';
const candidates = new Map([
  ['@context-action/core', 'stable-1x'],
  ['@context-action/react', 'stable-1x'],
  ['@context-action/tool-protocol', 'supporting-stable'],
  ['@context-action/ai-sdk', 'experimental-or-supporting-stable'],
  ['@context-action/webmcp', 'experimental'],
  ['@context-action/tool-durable-operations', 'decision-needed'],
  ['@context-action/mutative', 'decision-needed'],
  ['@context-action/mutative-core', 'decision-needed'],
  ['@context-action/llms-generator', 'internal'],
  ['@context-action/typedoc-vitepress-sync', 'internal'],
]);

function readOption(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function run(command, args) {
  return new Promise(resolve => {
    const child = spawn(command, args, { cwd: repositoryRoot, stdio: ['ignore', 'pipe', 'pipe'] });
    const stdout = [];
    const stderr = [];
    child.stdout.on('data', chunk => stdout.push(chunk));
    child.stderr.on('data', chunk => stderr.push(chunk));
    child.on('error', error => resolve({ code: 1, stdout: '', stderr: error.message }));
    child.on('close', code => resolve({
      code: code ?? 1,
      stdout: Buffer.concat(stdout).toString('utf8').trim(),
      stderr: Buffer.concat(stderr).toString('utf8').trim(),
    }));
  });
}

function collectSubpaths(value, subpath, conditions = [], targets = []) {
  if (typeof value === 'string') {
    targets.push({ subpath, conditions, target: value });
    return targets;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectSubpaths(item, subpath, [...conditions, `[${index}]`], targets));
  } else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([condition, target]) => collectSubpaths(target, subpath, [...conditions, condition], targets));
  }
  return targets;
}

async function publishedVersion(packageName) {
  const result = await run('pnpm', ['view', packageName, 'version', '--json']);
  if (result.code === 0) {
    try {
      return { status: 'published', version: JSON.parse(result.stdout) };
    } catch {
      return { status: 'query-error', detail: 'Registry returned non-JSON version output' };
    }
  }
  if (/\bE404\b/.test(result.stderr)) return { status: 'not-found' };
  return { status: 'query-error', detail: result.stderr || result.stdout || `exit ${result.code}` };
}

async function main() {
  const output = path.resolve(repositoryRoot, readOption('--output', defaultOutput));
  const workspacePackages = (await readdir(path.join(repositoryRoot, 'packages'), { withFileTypes: true }))
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
  const packages = [];
  for (const directory of workspacePackages) {
    let manifest;
    try {
      manifest = JSON.parse(await readFile(path.join(repositoryRoot, 'packages', directory, 'package.json'), 'utf8'));
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    if (manifest.private === true) continue;
    const exports = Object.entries(manifest.exports ?? {}).flatMap(([subpath, value]) => collectSubpaths(value, subpath));
    packages.push({
      name: manifest.name,
      directory: path.posix.join('packages', directory),
      sourceVersion: manifest.version,
      candidateClassification: candidates.get(manifest.name) ?? 'decision-needed',
      requiredDecision: 'Approve final v1 scope and target version; candidate classifications are not a release approval.',
      published: await publishedVersion(manifest.name),
      runtime: {
        engines: manifest.engines ?? {},
        peerDependencies: manifest.peerDependencies ?? {},
      },
      packageFields: {
        main: manifest.main ?? null,
        module: manifest.module ?? null,
        types: manifest.types ?? null,
        sideEffects: manifest.sideEffects ?? null,
      },
      exports,
    });
  }
  packages.sort((left, right) => left.name.localeCompare(right.name));
  const inventory = {
    schemaVersion: 'context-action-release-inventory.v1',
    release: 'context-action-v1.0.0',
    generatedAt: new Date().toISOString(),
    source: {
      workspace: 'pnpm-workspace.yaml',
      versioning: 'lerna-independent',
      registry: 'https://registry.npmjs.org/',
    },
    packages,
  };
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');
  console.log(`Wrote inventory for ${packages.length} publishable packages to ${path.relative(repositoryRoot, output)}`);
}

main().catch(error => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
