#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const osvQueryUrl = 'https://api.osv.dev/v1/querybatch';
const batchSize = 500;
const commandTimeoutMs = 60_000;
const requestTimeoutMs = 30_000;
const maxCommandOutputBytes = 32 * 1024 * 1024;

await readFile(path.join(repositoryRoot, 'pnpm-lock.yaml'));

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repositoryRoot,
      ...options,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    const stdout = [];
    const stderr = [];
    let outputBytes = 0;
    let settled = false;
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      finish(new Error(`${command} timed out after ${commandTimeoutMs}ms`));
    }, commandTimeoutMs);

    const append = (target, chunk) => {
      outputBytes += chunk.byteLength;
      if (outputBytes > maxCommandOutputBytes) {
        child.kill('SIGKILL');
        finish(new Error(`security dependency graph exceeded ${maxCommandOutputBytes} bytes`));
        return;
      }
      target.push(chunk);
    };
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve(result);
    };

    child.stdout.on('data', (chunk) => append(stdout, chunk));
    child.stderr.on('data', (chunk) => append(stderr, chunk));
    child.on('error', (error) => finish(error));
    child.on('close', (code, signal) => {
      const result = {
        code,
        signal,
        stdout: Buffer.concat(stdout).toString('utf8'),
        stderr: Buffer.concat(stderr).toString('utf8'),
      };
      if (code !== 0) {
        finish(new Error(
          `${command} ${args.join(' ')} failed (${signal ?? `exit ${code}`})${result.stderr.trim() ? `: ${result.stderr.trim()}` : ''}`,
        ));
        return;
      }
      finish(undefined, result);
    });
  });
}

function collectPackages(value, packages) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  for (const [name, entry] of Object.entries(value)) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    if (typeof entry.version === 'string' && entry.version.length > 0) {
      packages.set(`${name}@${entry.version}`, {
        package: { name, ecosystem: 'npm' },
        version: entry.version,
      });
    }
    for (const field of [
      'dependencies',
      'devDependencies',
      'optionalDependencies',
      'peerDependencies',
    ]) {
      collectPackages(entry[field], packages);
    }
  }
}

async function installedPackages() {
  const result = await run(pnpmCommand, [
    'list',
    '--json',
    '--recursive',
    '--depth',
    'Infinity',
  ]);
  let projects;
  try {
    projects = JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`pnpm list returned invalid JSON: ${error.message}`);
  }
  if (!Array.isArray(projects)) {
    throw new Error('pnpm list must return an array of workspace projects');
  }
  const packages = new Map();
  for (const project of projects) {
    if (!project || typeof project !== 'object' || Array.isArray(project)) continue;
    for (const field of [
      'dependencies',
      'devDependencies',
      'optionalDependencies',
      'peerDependencies',
    ]) {
      collectPackages(project[field], packages);
    }
  }
  return [...packages.values()].sort((left, right) => {
    const leftKey = `${left.package.name}@${left.version}`;
    const rightKey = `${right.package.name}@${right.version}`;
    return leftKey.localeCompare(rightKey);
  });
}

async function queryBatch(queries) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const response = await fetch(osvQueryUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ queries }),
      signal: controller.signal,
    });
    const body = await response.text();
    if (!response.ok) {
      throw new Error(`OSV query failed with HTTP ${response.status}: ${body.slice(0, 512)}`);
    }
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch (error) {
      throw new Error(`OSV query returned invalid JSON: ${error.message}`);
    }
    if (!parsed || !Array.isArray(parsed.results) || parsed.results.length !== queries.length) {
      throw new Error('OSV query returned an invalid result count');
    }
    return parsed.results;
  } finally {
    clearTimeout(timer);
  }
}

const packages = await installedPackages();
const findings = [];
for (let index = 0; index < packages.length; index += batchSize) {
  const batch = packages.slice(index, index + batchSize);
  const results = await queryBatch(batch);
  for (let offset = 0; offset < results.length; offset += 1) {
    const vulnerabilities = results[offset]?.vulns;
    if (!Array.isArray(vulnerabilities)) continue;
    for (const vulnerability of vulnerabilities) {
      if (!vulnerability || typeof vulnerability.id !== 'string') continue;
      findings.push({
        id: vulnerability.id,
        name: batch[offset].package.name,
        version: batch[offset].version,
      });
    }
  }
}

const uniqueFindings = [...new Map(
  findings.map((item) => [`${item.name}@${item.version}:${item.id}`, item]),
).values()].sort((left, right) => {
  const leftKey = `${left.name}@${left.version}:${left.id}`;
  const rightKey = `${right.name}@${right.version}:${right.id}`;
  return leftKey.localeCompare(rightKey);
});

console.log(`OSV audit checked ${packages.length} npm package versions.`);
if (uniqueFindings.length > 0) {
  console.error(`OSV audit found ${uniqueFindings.length} vulnerability match(es):`);
  for (const item of uniqueFindings) {
    console.error(`  ${item.name}@${item.version}: ${item.id}`);
  }
  process.exitCode = 1;
} else {
  console.log('OSV audit found no vulnerability matches.');
}
