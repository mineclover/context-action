#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import * as path from 'node:path';

import {
  DocumentBindingValidationService,
  renderDocumentBindingValidationText,
} from './binding-validation';
import {
  type ContextScopeKind,
  createContextScope,
  createContextScopeFromReports,
  parseContextScopeManifest,
  renderContextScopeText,
} from './context-scope';
import {
  type ContextScopeBranchHistoryInput,
  compareContextScopeBranches,
  renderContextScopeBranchComparisonText,
} from './context-scope-branch';
import {
  diffContextScopes,
  renderContextScopeDiffText,
} from './context-scope-diff';
import {
  ContextScopeHistoryService,
  readContextScopeHistoryStream,
  renderContextScopeHistoryText,
} from './context-scope-history';
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
      '  sem-doc work-context <entity> [--file <path>] [--docs-root <path>] [--budget <n>] [--depth <1|2>] [--timeout-ms <n>] [--max-output-bytes <n>] [--include-node-modules-surface] [--no-cache] [--json]',
      '  sem-doc context-scope <entity> [--manifest <path>] [--context-id <id>] [--kind <screen|api|transaction|workflow|document>] [--label <text>] --project-id <id> [--file <path>] [--docs-root <path>] [--depth <1|2>] [--max-nodes <n>] [--max-edges <n>] [--max-anchors <n>] [--include-node-modules-surface] [--json]',
      '  sem-doc context-scope-diff <before.json> <after.json> [--json]',
      '  sem-doc context-scope-history <from> <to> <entity> --project-id <id> [--file <path>] [--docs-root <path>] [--max-commits <n>] [--timeout-ms <n>] [--max-output-bytes <n>] [--aggregate-timeout-ms <n>] [--aggregate-max-output-bytes <n>] [--commit-timeout-ms <n>] [--commit-max-output-bytes <n>] [--include-node-modules-surface] [--output <path>] [--json]',
      '  sem-doc context-scope-compare <left-history.json|ndjson> <right-history.json|ndjson> [--json]',
      '  sem-doc docs index [<docs-root>] [--json]',
      '  sem-doc docs validate-bindings [<docs-root>] [--timeout-ms <n>] [--max-output-bytes <n>] [--no-cache] [--strict] [--json]',
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
    if (command === 'context-scope') {
      runContextScope(args);
      return;
    }
    if (command === 'context-scope-diff') {
      runContextScopeDiff(args);
      return;
    }
    if (command === 'context-scope-history') {
      void runContextScopeHistory(args).catch((error: unknown) => {
        process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
        process.exitCode = 1;
      });
      return;
    }
    if (command === 'context-scope-compare' || command === 'context-scope-intersect') {
      runContextScopeBranchCompare(args);
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
    ['--json', '--no-cache', '--include-node-modules-surface']
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
    includeNodeModulesSurface: parsed.flags.has('--include-node-modules-surface'),
  });
  if (parsed.flags.has('--json')) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(renderWorkContextText(report));
  }
}

function runContextScope(args: readonly string[]): void {
  const parsed = parseOptions(
    args,
    ['--manifest', '--context-id', '--kind', '--label', '--project-id', '--file', '--docs-root', '--budget', '--depth', '--engine-version', '--timeout-ms', '--max-output-bytes', '--max-nodes', '--max-edges', '--max-anchors'],
    ['--json', '--no-cache', '--include-node-modules-surface'],
  );
  const entity = parsed.positionals[0];
  const manifestPath = parsed.options.get('--manifest');
  if (manifestPath === undefined && entity === undefined) throw new Error('context-scope requires an entity name or --manifest');
  if (manifestPath !== undefined && parsed.positionals.length > 0) {
    throw new Error('context-scope does not accept an entity when --manifest is used');
  }
  if (manifestPath === undefined && parsed.positionals.length > 1) {
    throw new Error('context-scope accepts exactly one entity name');
  }
  const projectId = requiredVisibleOption(parsed.options, '--project-id');
  const contextId = optionalVisibleOption(parsed.options, '--context-id');
  const label = optionalVisibleOption(parsed.options, '--label');
  const kind = parseContextScopeKind(parsed.options.get('--kind'));
  const maxNodes = positiveNumberOption(parsed.options, '--max-nodes');
  const maxEdges = positiveNumberOption(parsed.options, '--max-edges');
  const maxAnchors = positiveNumberOption(parsed.options, '--max-anchors');
  const invocationCwd = process.cwd();
  const repositoryRoot = resolveRepositoryRoot(invocationCwd);
  const analysis = {
    repositoryRoot,
    file: normalizeCliPath(parsed.options.get('--file'), invocationCwd, repositoryRoot, 'file'),
    docsRoot: normalizeCliPath(parsed.options.get('--docs-root'), invocationCwd, repositoryRoot, 'docs-root'),
    budget: numberOption(parsed.options, '--budget'),
    depth: numberOption(parsed.options, '--depth'),
    noCache: parsed.flags.has('--no-cache'),
    engineVersion: parsed.options.get('--engine-version'),
    timeoutMs: positiveNumberOption(parsed.options, '--timeout-ms'),
    maxOutputBytes: positiveNumberOption(parsed.options, '--max-output-bytes'),
    includeNodeModulesSurface: parsed.flags.has('--include-node-modules-surface'),
  };
  const workContextService = new WorkContextService({ client: new SemClient({ binary: process.env.SEM_BIN }) });
  const normalizedManifestPath = manifestPath === undefined
    ? undefined
    : normalizeCliPath(manifestPath, invocationCwd, repositoryRoot, 'manifest');
  const manifest = normalizedManifestPath === undefined ? undefined : parseContextScopeManifest(
    JSON.parse(readFileSync(path.resolve(repositoryRoot, normalizedManifestPath), 'utf8')),
  );
  const reports = manifest === undefined
    ? [workContextService.analyze({ ...analysis, entity: entity! })]
    : manifest.anchors.map((anchor) => workContextService.analyze({
      ...analysis,
      entity: anchor.entity,
      ...(anchor.file === undefined ? {} : { file: anchor.file }),
    }));
  const scope = manifest === undefined ? createContextScope(reports[0]!, {
    projectId,
    ...(contextId === undefined ? {} : { contextId }),
    ...(kind === undefined ? {} : { kind }),
    ...(label === undefined ? {} : { label }),
    ...(maxNodes === undefined ? {} : { maxNodes }),
    ...(maxEdges === undefined ? {} : { maxEdges }),
    ...(maxAnchors === undefined ? {} : { maxAnchors }),
  }) : createContextScopeFromReports(reports, {
    projectId,
    contextId: manifest.id,
    kind: manifest.kind,
    ...(manifest.label === undefined ? {} : { label: manifest.label }),
    manifest,
    ...(maxNodes === undefined ? {} : { maxNodes }),
    ...(maxEdges === undefined ? {} : { maxEdges }),
    ...(maxAnchors === undefined ? {} : { maxAnchors }),
  });
  process.stdout.write(
    parsed.flags.has('--json')
      ? `${JSON.stringify(scope, null, 2)}\n`
      : renderContextScopeText(scope),
  );
}

function runContextScopeDiff(args: readonly string[]): void {
  const parsed = parseOptions(args, [], ['--json']);
  if (parsed.positionals.length !== 2) throw new Error('context-scope-diff requires before.json and after.json');
  const before = JSON.parse(readFileSync(path.resolve(parsed.positionals[0]!), 'utf8')) as unknown;
  const after = JSON.parse(readFileSync(path.resolve(parsed.positionals[1]!), 'utf8')) as unknown;
  const diff = diffContextScopes(before, after);
  process.stdout.write(parsed.flags.has('--json')
    ? `${JSON.stringify(diff, null, 2)}\n`
    : renderContextScopeDiffText(diff));
}

async function runContextScopeHistory(args: readonly string[]): Promise<void> {
  const parsed = parseOptions(
    args,
    ['--project-id', '--context-id', '--kind', '--label', '--file', '--docs-root', '--budget', '--depth', '--engine-version', '--timeout-ms', '--max-output-bytes', '--aggregate-timeout-ms', '--aggregate-max-output-bytes', '--commit-timeout-ms', '--commit-max-output-bytes', '--max-commits', '--max-nodes', '--max-edges', '--output'],
    ['--json', '--no-cache', '--no-first-parent', '--include-node-modules-surface'],
  );
  if (parsed.positionals.length !== 3) throw new Error('context-scope-history requires <from> <to> <entity>');
  const invocationCwd = process.cwd();
  const repositoryRoot = resolveRepositoryRoot(invocationCwd);
  const report = await new ContextScopeHistoryService().analyze({
    repositoryRoot,
    from: parsed.positionals[0]!,
    to: parsed.positionals[1]!,
    entity: parsed.positionals[2]!,
    projectId: requiredVisibleOption(parsed.options, '--project-id'),
    contextId: optionalVisibleOption(parsed.options, '--context-id'),
    kind: parseContextScopeKind(parsed.options.get('--kind')),
    label: optionalVisibleOption(parsed.options, '--label'),
    file: normalizeCliPath(parsed.options.get('--file'), invocationCwd, repositoryRoot, 'file'),
    docsRoot: normalizeCliPath(parsed.options.get('--docs-root'), invocationCwd, repositoryRoot, 'docs-root'),
    budget: numberOption(parsed.options, '--budget'),
    depth: numberOption(parsed.options, '--depth') as 1 | 2 | undefined,
    engineVersion: parsed.options.get('--engine-version'),
    timeoutMs: positiveNumberOption(parsed.options, '--timeout-ms'),
    maxOutputBytes: positiveNumberOption(parsed.options, '--max-output-bytes'),
    aggregateTimeoutMs: positiveNumberOption(parsed.options, '--aggregate-timeout-ms'),
    aggregateMaxOutputBytes: positiveNumberOption(parsed.options, '--aggregate-max-output-bytes'),
    commitTimeoutMs: positiveNumberOption(parsed.options, '--commit-timeout-ms'),
    commitMaxOutputBytes: positiveNumberOption(parsed.options, '--commit-max-output-bytes'),
    maxCommits: positiveNumberOption(parsed.options, '--max-commits'),
    maxNodes: positiveNumberOption(parsed.options, '--max-nodes'),
    maxEdges: positiveNumberOption(parsed.options, '--max-edges'),
    outputPath: normalizeCliPath(parsed.options.get('--output'), invocationCwd, repositoryRoot, 'output'),
    noCache: parsed.flags.has('--no-cache'),
    includeNodeModulesSurface: parsed.flags.has('--include-node-modules-surface'),
    firstParent: !parsed.flags.has('--no-first-parent'),
  });
  process.stdout.write(parsed.flags.has('--json')
    ? `${JSON.stringify(report, null, 2)}\n`
    : renderContextScopeHistoryText(report));
}

function runContextScopeBranchCompare(args: readonly string[]): void {
  const parsed = parseOptions(args, [], ['--json']);
  if (parsed.positionals.length !== 2) {
    throw new Error('context-scope-compare requires left and right history files');
  }
  const left = loadContextScopeBranchHistory(parsed.positionals[0]!);
  const right = loadContextScopeBranchHistory(parsed.positionals[1]!);
  const comparison = compareContextScopeBranches(left, right);
  process.stdout.write(parsed.flags.has('--json')
    ? `${JSON.stringify(comparison, null, 2)}\n`
    : renderContextScopeBranchComparisonText(comparison));
}

function loadContextScopeBranchHistory(filePath: string): ContextScopeBranchHistoryInput {
  const absolute = path.resolve(filePath);
  const content = readFileSync(absolute, 'utf8');
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    if (!parsed.base || !Array.isArray(parsed.entries)) {
      throw new Error(`${filePath} is not a ContextScope history report`);
    }
    return parsed as unknown as ContextScopeBranchHistoryInput;
  } catch (error) {
    if (error instanceof Error && error.message.includes('is not a ContextScope history report')) {
      throw error;
    }
  }
  const records = readContextScopeHistoryStream(absolute);
  const base = records.find((record) => record.recordType === 'base');
  if (base === undefined) throw new Error(`${filePath} history stream has no base record`);
  return {
    base: { commit: base.commit, scope: base.scope },
    entries: records
      .filter((record) => record.recordType === 'entry')
      .map((record) => ({
        commit: record.commit,
        parent: record.parent,
        subject: record.subject,
        scope: record.scope,
        diff: record.diff,
      })),
  };
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
    ['--json', '--no-cache', '--strict']
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
    strict: parsed.flags.has('--strict'),
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
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a positive integer`);
  }
  return parsed;
}

function parseContextScopeKind(value: string | undefined): ContextScopeKind | undefined {
  if (value === undefined) return undefined;
  if (value === 'screen' || value === 'api' || value === 'transaction'
    || value === 'workflow' || value === 'document') return value;
  throw new Error('--kind must be screen, api, transaction, workflow, or document');
}

function requiredVisibleOption(options: ReadonlyMap<string, string>, key: string): string {
  const value = optionalVisibleOption(options, key);
  if (value === undefined) throw new Error(`${key} is required for stable ContextScope identity`);
  return value;
}

function optionalVisibleOption(
  options: ReadonlyMap<string, string>,
  key: string,
): string | undefined {
  const value = options.get(key);
  if (value === undefined) return undefined;
  const normalized = value.trim();
  if (normalized.length === 0 || normalized.length > 4096 || normalized.includes('\0')) {
    throw new Error(`${key} must be visible text within 4096 characters`);
  }
  return normalized;
}

main();
