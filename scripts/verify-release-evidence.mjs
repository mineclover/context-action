#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schemaPath = path.join(repositoryRoot, 'release-evidence', 'schema.json');

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function readOption(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function isDateTime(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function isDigest(value) {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}

function fail(errors, message) {
  errors.push(message);
}

function currentCommit() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repositoryRoot, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

async function verifyFile(root, relativePath, expectedHash, errors, label) {
  const target = path.resolve(root, relativePath);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
    fail(errors, `${label} path escapes evidence directory: ${relativePath}`);
    return;
  }
  try {
    const resolved = await realpath(target);
    if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
      fail(errors, `${label} resolves outside the evidence directory: ${relativePath}`);
      return;
    }
    const contents = await readFile(resolved);
    if (sha256(contents) !== expectedHash) fail(errors, `${label} hash does not match: ${relativePath}`);
  } catch {
    fail(errors, `${label} is missing: ${relativePath}`);
  }
}

async function main() {
  const file = readOption('--file');
  if (!file) throw new Error('Usage: node scripts/verify-release-evidence.mjs --file <manifest.json> [--require-success]');
  const manifestPath = path.resolve(repositoryRoot, file);
  const root = path.dirname(manifestPath);
  const errors = [];
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read manifest: ${error.message}`);
  }
  const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(manifest)) {
    for (const error of validate.errors ?? []) {
      fail(errors, `Schema ${error.instancePath || '/'} ${error.message ?? 'is invalid'}`);
    }
  }
  const commands = Array.isArray(manifest.commands) ? manifest.commands : [];
  const hasFailedCommand = commands.some(command => command?.status === 'failed');
  if (manifest.status === 'failed' && !hasFailedCommand) {
    fail(errors, 'Failed manifest status requires at least one failed command');
  }
  if (manifest.status === 'recorded' && (commands.length === 0 || hasFailedCommand)) {
    fail(errors, 'Recorded manifest status requires one or more passing commands');
  }
  if (manifest.status === 'not-certified' && commands.length > 0) {
    fail(errors, 'Not-certified manifest status cannot contain command results');
  }
  for (const command of commands) {
    if (!command || typeof command !== 'object' || !isDigest(command.log?.sha256) || typeof command.log?.path !== 'string') {
      fail(errors, 'Command entry has an invalid log descriptor');
      continue;
    }
    if (!Number.isInteger(command.exitCode) || command.exitCode < 0 || !['passed', 'failed'].includes(command.status) || !isDateTime(command.startedAt) || !isDateTime(command.completedAt)) {
      fail(errors, `Command entry is invalid: ${command.id ?? '<unknown>'}`);
    }
    if ((command.status === 'passed') !== (command.exitCode === 0)) {
      fail(errors, `Command status does not match exit code: ${command.id ?? '<unknown>'}`);
    }
    await verifyFile(root, command.log.path, command.log.sha256, errors, `Command log (${command.id ?? '<unknown>'})`);
  }
  for (const artifact of Array.isArray(manifest.artifacts) ? manifest.artifacts : []) {
    if (!artifact || typeof artifact !== 'object' || !isDigest(artifact.sha256) || typeof artifact.path !== 'string') {
      fail(errors, 'Artifact entry has an invalid hash descriptor');
      continue;
    }
    await verifyFile(root, artifact.path, artifact.sha256, errors, `Artifact (${artifact.path})`);
    try {
      const metadata = await stat(path.join(root, artifact.path));
      if (metadata.size !== artifact.bytes) fail(errors, `Artifact size does not match: ${artifact.path}`);
    } catch { /* Missing artifacts are reported by verifyFile. */ }
  }
  const requireSuccess = process.argv.includes('--require-success');
  if (requireSuccess) {
    if (!['recorded', 'certified'].includes(manifest.status)) fail(errors, 'Strict verification requires successfully recorded commands');
    if (manifest.workingTree !== 'clean') fail(errors, 'Strict verification requires a clean working tree');
    if (commands.length === 0) fail(errors, 'Strict verification requires at least one command');
    for (const command of commands) if (command.status !== 'passed' || command.exitCode !== 0) fail(errors, `Strict verification rejects failed command: ${command.id}`);
    if (!/^[a-f0-9]{40}$/u.test(manifest.commit ?? '')) {
      fail(errors, 'Strict verification requires a 40-character Git commit');
    } else if (currentCommit() !== manifest.commit) {
      fail(errors, 'Strict verification requires the current checkout to match the evidence commit');
    }
  }
  if (errors.length > 0) {
    console.error(JSON.stringify({ status: 'invalid', errors }, null, 2));
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify({ status: 'ok', file: path.relative(repositoryRoot, manifestPath) }));
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 2;
});
