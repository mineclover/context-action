#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const identifierPattern = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function usage(message) {
  if (message) console.error(`Error: ${message}\n`);
  console.error(`Usage: node scripts/write-release-evidence.mjs --release <name> --stage <stage> [options]

Options:
  --command <id=command>  Run a command and preserve its output in logs/<id>.log (repeatable)
  --artifact <path>       Copy an existing output into artifacts/ and record its SHA-256 (repeatable)
  --output <directory>    Evidence directory (default: release-evidence/<stage>)
  --commit <sha>          Commit to record; must equal git HEAD
  --require-clean         Refuse to create evidence from a dirty source tree
  --roadmap-revision <id> Roadmap revision (default: v1-r3)
  --note <text>           Additional manifest note (repeatable)`);
  process.exitCode = 2;
}

function readOptions(argv) {
  const options = { commands: [], artifacts: [], notes: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const name = argv[index];
    if (!name.startsWith('--')) return { error: `Unexpected argument: ${name}` };
    if (name === '--require-clean') {
      options.requireClean = true;
      continue;
    }
    const value = argv[index + 1];
    if (value === undefined || value.startsWith('--')) return { error: `Missing value for ${name}` };
    index += 1;
    switch (name) {
      case '--release': options.release = value; break;
      case '--stage': options.stage = value; break;
      case '--command': options.commands.push(value); break;
      case '--artifact': options.artifacts.push(value); break;
      case '--output': options.output = value; break;
      case '--commit': options.commit = value; break;
      case '--roadmap-revision': options.roadmapRevision = value; break;
      case '--note': options.notes.push(value); break;
      default: return { error: `Unknown option: ${name}` };
    }
  }
  return { options };
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function timestamp() {
  return new Date().toISOString();
}

function commandVersion(command, args) {
  const result = spawnSync(command, args, { cwd: repositoryRoot, encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() || null : null;
}

function gitCommit() {
  return commandVersion('git', ['rev-parse', 'HEAD']) ?? 'unknown';
}

function workingTree() {
  const result = spawnSync('git', ['status', '--porcelain'], { cwd: repositoryRoot, encoding: 'utf8' });
  if (result.status !== 0) return 'unknown';
  return result.stdout.length === 0 ? 'clean' : 'dirty';
}

function parseCommand(value, seenIds) {
  const equalsAt = value.indexOf('=');
  if (equalsAt <= 0 || equalsAt === value.length - 1) {
    throw new Error(`Command must be written as <id>=<command>: ${value}`);
  }
  const id = value.slice(0, equalsAt);
  const command = value.slice(equalsAt + 1);
  if (!identifierPattern.test(id)) throw new Error(`Invalid command id: ${id}`);
  if (seenIds.has(id)) throw new Error(`Duplicate command id: ${id}`);
  seenIds.add(id);
  return { id, command };
}

function runCommand(command) {
  return new Promise(resolve => {
    const startedAt = timestamp();
    const started = Date.now();
    const child = spawn(command, { cwd: repositoryRoot, shell: true, env: process.env });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { output += chunk; });
    child.on('error', error => { output += `${error.stack ?? error.message}\n`; });
    child.on('close', code => resolve({
      startedAt,
      completedAt: timestamp(),
      durationMs: Date.now() - started,
      exitCode: typeof code === 'number' && code >= 0 ? code : 1,
      output,
    }));
  });
}

async function copyArtifact(source, outputDirectory, index) {
  const resolved = path.resolve(repositoryRoot, source);
  const sourcePath = await realpath(resolved);
  if (sourcePath !== repositoryRoot && !sourcePath.startsWith(`${repositoryRoot}${path.sep}`)) {
    throw new Error(`Artifact must stay within the repository: ${source}`);
  }
  const metadata = await stat(sourcePath);
  if (!metadata.isFile()) throw new Error(`Artifact is not a file: ${source}`);
  const fileName = `${String(index + 1).padStart(2, '0')}-${path.basename(sourcePath)}`;
  const relativePath = path.posix.join('artifacts', fileName);
  const destination = path.join(outputDirectory, relativePath);
  await copyFile(sourcePath, destination);
  const contents = await readFile(destination);
  return {
    sourcePath: path.relative(repositoryRoot, sourcePath) || path.basename(sourcePath),
    path: relativePath,
    sha256: sha256(contents),
    bytes: metadata.size,
  };
}

async function main() {
  const parsed = readOptions(process.argv.slice(2).filter(argument => argument !== '--'));
  if (parsed.error) return usage(parsed.error);
  const { options } = parsed;
  if (!options.release) return usage('--release is required');
  if (!options.stage || !identifierPattern.test(options.stage)) {
    return usage('--stage is required and must be a safe path segment');
  }

  let commands;
  try {
    const seenIds = new Set();
    commands = options.commands.map(value => parseCommand(value, seenIds));
  } catch (error) {
    return usage(error.message);
  }

  const outputDirectory = path.resolve(repositoryRoot, options.output ?? path.join('release-evidence', options.stage));
  const evidenceRoot = path.join(repositoryRoot, 'release-evidence');
  if (!outputDirectory.startsWith(`${evidenceRoot}${path.sep}`)) {
    return usage('--output must stay under release-evidence/');
  }
  if (existsSync(outputDirectory)) {
    return usage(`Refusing to overwrite existing evidence directory: ${path.relative(repositoryRoot, outputDirectory)}`);
  }
  // Evidence files are created in the repository. Capture the source snapshot
  // before creating them so a clean RC can produce a strict evidence bundle.
  const sourceWorkingTree = workingTree();
  const sourceCommit = gitCommit();
  if (options.requireClean && sourceWorkingTree !== 'clean') {
    throw new Error('Strict release evidence requires a clean working tree');
  }
  if (options.commit && options.commit !== sourceCommit) {
    throw new Error(`--commit must match git HEAD (${sourceCommit})`);
  }

  try {
    await mkdir(path.join(outputDirectory, 'logs'), { recursive: true });
    await mkdir(path.join(outputDirectory, 'artifacts'), { recursive: true });
    const commandEntries = [];
    for (const { id, command } of commands) {
      const result = await runCommand(command);
      const logPath = path.join(outputDirectory, 'logs', `${id}.log`);
      await writeFile(logPath, result.output, 'utf8');
      commandEntries.push({
        id,
        command,
        startedAt: result.startedAt,
        completedAt: result.completedAt,
        durationMs: result.durationMs,
        exitCode: result.exitCode,
        status: result.exitCode === 0 ? 'passed' : 'failed',
        log: { path: path.posix.join('logs', `${id}.log`), sha256: sha256(result.output) },
      });
    }
    const artifacts = [];
    for (const [index, artifact] of options.artifacts.entries()) {
      artifacts.push(await copyArtifact(artifact, outputDirectory, index));
    }
    const hasFailure = commandEntries.some(entry => entry.status === 'failed');
    const manifest = {
      schemaVersion: 'context-action-release-evidence.v1',
      release: options.release,
      stage: options.stage,
      commit: sourceCommit,
      roadmapRevision: options.roadmapRevision ?? 'v1-r3',
      status: hasFailure ? 'failed' : commands.length === 0 ? 'not-certified' : 'recorded',
      generatedAt: timestamp(),
      workingTree: sourceWorkingTree,
      environment: {
        node: process.version,
        pnpm: commandVersion('pnpm', ['--version']),
        typescript: commandVersion('node', ['-p', "require('./node_modules/typescript/package.json').version"]),
      },
      commands: commandEntries,
      artifacts,
      notes: options.notes.length > 0
        ? options.notes
        : ['Recorded by scripts/write-release-evidence.mjs; command logs and copied artifacts are hashed.'],
    };
    await writeFile(path.join(outputDirectory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    console.log(`Wrote release evidence to ${path.relative(repositoryRoot, outputDirectory)}`);
    if (hasFailure) process.exitCode = 1;
  } catch (error) {
    await rm(outputDirectory, { recursive: true, force: true });
    throw error;
  }
}

main().catch(error => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
