#!/usr/bin/env node

import * as path from 'node:path';

import {
  DocumentBindingValidationService,
  renderDocumentBindingValidationText,
} from './binding-validation';
import type { SemCommand } from './contracts';
import { indexDocuments } from './documents';
import { GitDiffService, renderGitDiffText } from './git-diff';
import { resolveRepositoryRoot } from './revision';
import { SemClient, SemExecutionError } from './sem-client';
import { renderWorkContextText, WorkContextService } from './work-context';

const COMMANDS: readonly SemCommand[] = ['diff', 'impact', 'blame', 'log', 'entities', 'context'];

function isSemCommand(value: string | undefined): value is SemCommand {
  return value !== undefined && COMMANDS.includes(value as SemCommand);
}

function printUsage(): void {
  process.stderr.write(
    `${[
      'Usage:',
      '  sem-doc work-context <entity> [--file <path>] [--docs-root <path>] [--budget <n>] [--depth <1|2>] [--timeout-ms <n>] [--max-output-bytes <n>] [--no-cache] [--json]',
      '  sem-doc docs index [<docs-root>] [--json]',
      '  sem-doc docs validate-bindings [<docs-root>] [--timeout-ms <n>] [--max-output-bytes <n>] [--no-cache] [--json]',
      '  sem-doc version',
      '  sem-doc diff [<path>...] [--staged] [--no-untracked] [--context <n>] [--json]',
      '  sem-doc sem-diff [sem options]',
      '  sem-doc <impact|blame|log|entities|context> [sem options]',
      '',
      'SEM_BIN may point to the sem executable. Sem-derived output is advisory only.',
    ].join('\n')}\n`
  );
}

function main(): void {
  const [command, ...args] = process.argv.slice(2);
  try {
    if (command === undefined || command === 'help' || command === '--help') {
      printUsage();
      process.exitCode = command === undefined ? 2 : 0;
      return;
    }
    if (command === 'version') {
      if (args.length > 0) throw new Error('version does not accept arguments');
      process.stdout.write(`${new SemClient().version()}\n`);
      return;
    }
    if (command === 'work-context') {
      runWorkContext(args);
      return;
    }
    if (command === 'docs') {
      runDocuments(args);
      return;
    }
    if (command === 'diff') {
      runGitDiff(args);
      return;
    }
    if (command === 'sem-diff') {
      const result = new SemClient().run('diff', args);
      if (result.stdout.length > 0) process.stdout.write(result.stdout);
      if (result.stderr.length > 0) process.stderr.write(result.stderr);
      return;
    }
    if (isSemCommand(command)) {
      const result = new SemClient().run(command, args);
      if (result.stdout.length > 0) process.stdout.write(result.stdout);
      if (result.stderr.length > 0) process.stderr.write(result.stderr);
      return;
    }
    printUsage();
    process.exitCode = 2;
  } catch (error) {
    if (error instanceof SemExecutionError && error.result?.stderr) {
      process.stderr.write(error.result.stderr);
    } else {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    }
    process.exitCode = 1;
  }
}

function runWorkContext(args: readonly string[]): void {
  const parsed = parseOptions(
    args,
    [
      '--file',
      '--docs-root',
      '--budget',
      '--depth',
      '--engine-version',
      '--timeout-ms',
      '--max-output-bytes',
    ],
    ['--json', '--no-cache']
  );
  const entity = parsed.positionals[0];
  if (entity === undefined) throw new Error('work-context requires an entity name');
  if (parsed.positionals.length > 1) {
    throw new Error('work-context accepts exactly one entity name');
  }
  const invocationCwd = process.cwd();
  const repositoryRoot = resolveRepositoryRoot(invocationCwd);
  const report = new WorkContextService({
    client: new SemClient({ binary: process.env.SEM_BIN }),
  }).analyze({
    repositoryRoot,
    entity,
    file: normalizeCliPath(parsed.options.get('--file'), invocationCwd, repositoryRoot, 'file'),
    docsRoot: normalizeCliPath(
      parsed.options.get('--docs-root'),
      invocationCwd,
      repositoryRoot,
      'docs-root'
    ),
    budget: numberOption(parsed.options, '--budget'),
    depth: numberOption(parsed.options, '--depth'),
    noCache: parsed.flags.has('--no-cache'),
    engineVersion: parsed.options.get('--engine-version'),
    timeoutMs: positiveNumberOption(parsed.options, '--timeout-ms'),
    maxOutputBytes: positiveNumberOption(parsed.options, '--max-output-bytes'),
  });
  if (parsed.flags.has('--json')) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(renderWorkContextText(report));
  }
}

function runDocuments(args: readonly string[]): void {
  const [subcommand, ...rest] = args;
  if (subcommand === 'validate-bindings') {
    runDocumentBindingValidation(rest);
    return;
  }
  if (subcommand !== 'index') {
    throw new Error('docs supports: docs index, docs validate-bindings');
  }
  const parsed = parseOptions(rest, []);
  if (parsed.positionals.length > 1) {
    throw new Error('docs index accepts at most one docs root');
  }
  const invocationCwd = process.cwd();
  const repositoryRoot = resolveRepositoryRoot(invocationCwd);
  const docsRoot = normalizeCliPath(
    parsed.positionals[0] ?? 'managed',
    invocationCwd,
    repositoryRoot,
    'docs-root'
  );
  const index = indexDocuments(path.resolve(repositoryRoot, docsRoot ?? 'managed'));
  process.stdout.write(
    parsed.flags.has('--json')
      ? `${JSON.stringify(index, null, 2)}\n`
      : `Indexed ${index.files} documents, ${index.definitions.length} definitions, ${index.references.length} references.\n`
  );
}

function runDocumentBindingValidation(args: readonly string[]): void {
  const parsed = parseOptions(
    args,
    ['--engine-version', '--timeout-ms', '--max-output-bytes'],
    ['--json', '--no-cache']
  );
  if (parsed.positionals.length > 1) {
    throw new Error('docs validate-bindings accepts at most one docs root');
  }
  const invocationCwd = process.cwd();
  const repositoryRoot = resolveRepositoryRoot(invocationCwd);
  const docsRoot = normalizeCliPath(
    parsed.positionals[0] ?? 'managed',
    invocationCwd,
    repositoryRoot,
    'docs-root'
  );
  const report = new DocumentBindingValidationService({
    client: new SemClient({ binary: process.env.SEM_BIN }),
  }).analyze({
    repositoryRoot,
    docsRoot: docsRoot ?? 'managed',
    noCache: parsed.flags.has('--no-cache'),
    engineVersion: parsed.options.get('--engine-version'),
    timeoutMs: positiveNumberOption(parsed.options, '--timeout-ms'),
    maxOutputBytes: positiveNumberOption(parsed.options, '--max-output-bytes'),
  });
  process.stdout.write(
    parsed.flags.has('--json')
      ? `${JSON.stringify(report, null, 2)}\n`
      : renderDocumentBindingValidationText(report)
  );
  if (!report.valid) process.exitCode = 1;
}

function runGitDiff(args: readonly string[]): void {
  const parsed = parseOptions(args, ['--context'], ['--json', '--staged', '--no-untracked']);
  const context = numberOption(parsed.options, '--context');
  const invocationCwd = process.cwd();
  const repositoryRoot = resolveRepositoryRoot(invocationCwd);
  const report = new GitDiffService().analyze({
    repositoryRoot,
    paths: parsed.positionals.map(
      (value) => normalizeCliPath(value, invocationCwd, repositoryRoot, 'path') as string
    ),
    staged: parsed.flags.has('--staged'),
    includeUntracked: parsed.flags.has('--staged') ? false : !parsed.flags.has('--no-untracked'),
    ...(context === undefined ? {} : { contextLines: context }),
  });
  process.stdout.write(
    parsed.flags.has('--json') ? `${JSON.stringify(report, null, 2)}\n` : renderGitDiffText(report)
  );
}

function normalizeCliPath(
  value: string | undefined,
  invocationCwd: string,
  repositoryRoot: string,
  label: string
): string | undefined {
  if (value === undefined) return undefined;
  const absolute = path.resolve(invocationCwd, value);
  const relative = path.relative(repositoryRoot, absolute);
  if (relative.length === 0) return '.';
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label} must remain inside the Git repository: ${value}`);
  }
  return relative.replaceAll(path.sep, '/');
}

interface ParsedOptions {
  readonly positionals: readonly string[];
  readonly flags: ReadonlySet<string>;
  readonly options: ReadonlyMap<string, string>;
}

function parseOptions(
  args: readonly string[],
  valueOptions: readonly string[],
  flagOptions: readonly string[] = ['--json']
): ParsedOptions {
  const positions: string[] = [];
  const flags = new Set<string>();
  const options = new Map<string, string>();
  const valueOptionSet = new Set(valueOptions);
  const flagOptionSet = new Set(flagOptions);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('--')) {
      positions.push(arg);
      continue;
    }
    if (valueOptionSet.has(arg)) {
      const value = args[index + 1];
      if (value === undefined || value.startsWith('--')) throw new Error(`${arg} requires a value`);
      options.set(arg, value);
      index += 1;
    } else if (flagOptionSet.has(arg)) {
      flags.add(arg);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  return { positionals: positions, flags, options };
}

function numberOption(options: ReadonlyMap<string, string>, key: string): number | undefined {
  const value = options.get(key);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0)
    throw new Error(`${key} must be a non-negative integer`);
  return parsed;
}

function positiveNumberOption(
  options: ReadonlyMap<string, string>,
  key: string
): number | undefined {
  const value = options.get(key);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a positive integer`);
  }
  return parsed;
}

main();
