import process from 'node:process';
import type { SemFoundationLimitValue } from '@sem-foundation/contracts';
import type { Severity } from '../contracts.js';
import { InputContractError } from '../input.js';
import {
  MAX_SEM_EVIDENCE_TEXT_CHARS,
  SUPPORTED_SEM_VERSION,
} from '../sem.js';
import { hasVisibleText, isWellFormedText } from '../text.js';

export interface CliOptions {
  command: 'check' | 'snapshot' | 'history' | 'intersect' | 'snapshot-diff' | 'context-scope';
  root: string;
  registry: string;
  useSem: boolean;
  changed: boolean;
  staged: boolean;
  from?: string;
  to?: string;
  commit?: string;
  worktree: boolean;
  left?: string;
  right?: string;
  snapshot?: string;
  manifest?: string;
  context?: string;
  maxContextDepth?: number;
  maxContextNodes?: number;
  maxContextEdges?: number;
  maxContextGroups?: number;
  contextOnLimit: 'error' | 'incomplete';
  semCommand?: string;
  semTimeoutMs?: number;
  semMaxOutputBytes?: number;
  maxAnalysisProjects?: SemFoundationLimitValue;
  maxProjectFileExtensions?: SemFoundationLimitValue;
  maxProjectFileExtensionChars?: SemFoundationLimitValue;
  maxSnapshotSymbols?: SemFoundationLimitValue;
  maxHistoryChanges?: SemFoundationLimitValue;
  maxHistoryCommits?: SemFoundationLimitValue;
  projects: string[];
  format: 'console' | 'json' | 'markdown';
  output?: string;
  failOn: Severity;
}

const singletonValueOptions = new Set([
  '--root',
  '--registry',
  '--from',
  '--to',
  '--commit',
  '--left',
  '--right',
  '--snapshot',
  '--manifest',
  '--context',
  '--sem-command',
  '--sem-timeout-ms',
  '--sem-max-output-bytes',
  '--max-analysis-projects',
  '--max-project-file-extensions',
  '--max-project-file-extension-chars',
  '--max-snapshot-symbols',
  '--max-history-changes',
  '--max-history-commits',
  '--max-context-depth',
  '--max-context-nodes',
  '--max-context-edges',
  '--max-context-groups',
  '--on-limit',
  '--format',
  '--output',
  '--fail-on',
]);

export function usage(): string {
  return `arch-verify <check|snapshot|history|intersect|snapshot-diff|context-scope> [options]

Options:
  --root <path>              Repository root (default: current directory)
  --registry <path>          Registry path (default: architecture/registry.json)
  --project <id>             Check one analysis project; repeat for multiple projects
  --sem                      Run sem ${SUPPORTED_SEM_VERSION} entities and policy-scoped impact analysis
  --changed                  Include sem diff change scope in the report
  --staged                   Analyze staged changes instead of the working tree
  --from <ref>               Start ref for a reproducible commit range
  --to <ref>                 End ref for a reproducible commit range
  --commit <ref>             Snapshot a materialized Git commit
  --worktree                 Snapshot the current worktree (default for snapshot)
  --left <path>              Left serialized symbol context/snapshot for comparison
  --right <path>             Right serialized symbol context/snapshot for comparison
  --snapshot <path>          Complete symbol snapshot for context-scope
  --manifest <path>          Revision-bound context manifest for context-scope
  --context <id>             Context manifest entry to project
  --max-context-depth <n>     Maximum SEM dependency traversal depth (default: 2)
  --max-context-nodes <n>     Maximum derived context nodes
  --max-context-edges <n>     Maximum derived context edges
  --max-context-groups <n>    Maximum derived context groups
  --on-limit <value>         error or incomplete (default: incomplete)
  --sem-command <path>       Override the sem command (or use SEM_COMMAND)
  --sem-timeout-ms <number>  Command and project impact timeout (default: 120000 or SEM_TIMEOUT_MS)
  --sem-max-output-bytes <n> Command and project impact output limit (default: 67108864 or SEM_MAX_OUTPUT_BYTES)
  --max-analysis-projects <n|unbounded>       Override Foundation analysis-project limit
  --max-project-file-extensions <n|unbounded> Override Foundation file-extension count limit
  --max-project-file-extension-chars <n|unbounded> Override Foundation extension length limit
  --max-snapshot-symbols <n|unbounded>        Override complete snapshot symbol limit
  --max-history-changes <n|unbounded>         Override history change limit
  --max-history-commits <n|unbounded>         Override history commit limit
  --format <value>           console, json, or markdown (default: console)
  --output <path>            Write report to a file instead of stdout
  --fail-on <value>          error, warning, or info (default: error)
  history requires --from and --to and emits one SEM symbol delta per first-parent commit
  history materializes snapshots for the registry analysisProjects at each commit
  snapshot emits one complete symbol snapshot for the current worktree or --commit ref
  intersect compares two serialized symbol contexts and reports their intersection
  snapshot-diff compares two complete symbol snapshots by project/file/entity identity
  context-scope projects one manifest context over a complete snapshot; library API accepts SEM evidence
  --help                     Show this help

Value options may be specified once. Repeat --project only with distinct IDs.
`;
}

function valueAfter(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    throw new InputContractError(`${option} requires a value`);
  }
  return value;
}

function positiveIntegerAfter(args: string[], index: number, option: string): number {
  const value = valueAfter(args, index, option);
  if (!/^[1-9]\d*$/.test(value)) {
    throw new InputContractError(`${option} requires a canonical base-10 positive integer`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new InputContractError(`${option} requires a safe positive integer`);
  }
  return parsed;
}

function limitAfter(args: string[], index: number, option: string): SemFoundationLimitValue {
  const value = valueAfter(args, index, option);
  return value === 'unbounded' ? value : positiveIntegerAfter(args, index, option);
}

function semRefAfter(args: string[], index: number, option: string): string {
  const value = valueAfter(args, index, option);
  if (value.includes('\0')) {
    throw new InputContractError(`${option} must not contain null bytes`);
  }
  if (!isWellFormedText(value)) {
    throw new InputContractError(`${option} must contain well-formed Unicode`);
  }
  if (value.length > MAX_SEM_EVIDENCE_TEXT_CHARS) {
    throw new InputContractError(
      `${option} exceeds ${MAX_SEM_EVIDENCE_TEXT_CHARS} character limit`,
    );
  }
  if (!hasVisibleText(value)) {
    throw new InputContractError(`${option} must contain visible text`);
  }
  return value;
}

export function parseArgs(argv: string[]): CliOptions | 'help' {
  if (argv.includes('--help') || argv.includes('-h')) return 'help';
  const command = argv[0];
  if (command !== 'check' && command !== 'snapshot' && command !== 'history' && command !== 'intersect' && command !== 'snapshot-diff' && command !== 'context-scope') {
    throw new InputContractError(`Unsupported command: ${command ?? '(missing)'}`);
  }
  const options: CliOptions = {
    command,
    root: process.cwd(),
    registry: 'architecture/registry.json',
    useSem: command === 'history' || command === 'snapshot',
    changed: false,
    staged: false,
    worktree: false,
    contextOnLimit: 'incomplete',
    projects: [],
    format: 'console',
    failOn: 'error',
  };
  const seenSingletonOptions = new Set<string>();
  for (let index = 1; index < argv.length; index += 1) {
    const option = argv[index];
    if (option && singletonValueOptions.has(option)) {
      if (seenSingletonOptions.has(option)) {
        throw new InputContractError(`Duplicate option is not allowed: ${option}`);
      }
      seenSingletonOptions.add(option);
    }
    if (option === '--root') options.root = valueAfter(argv, index++, option);
    else if (option === '--registry') options.registry = valueAfter(argv, index++, option);
    else if (option === '--project') options.projects.push(valueAfter(argv, index++, option));
    else if (option === '--sem') options.useSem = true;
    else if (option === '--changed') options.changed = true;
    else if (option === '--staged') {
      options.changed = true;
      options.staged = true;
    }
    else if (option === '--from') {
      options.changed = true;
      options.from = semRefAfter(argv, index++, option);
    }
    else if (option === '--to') {
      options.changed = true;
      options.to = semRefAfter(argv, index++, option);
    }
    else if (option === '--commit') options.commit = semRefAfter(argv, index++, option);
    else if (option === '--worktree') options.worktree = true;
    else if (option === '--left') options.left = valueAfter(argv, index++, option);
    else if (option === '--right') options.right = valueAfter(argv, index++, option);
    else if (option === '--snapshot') options.snapshot = valueAfter(argv, index++, option);
    else if (option === '--manifest') options.manifest = valueAfter(argv, index++, option);
    else if (option === '--context') options.context = valueAfter(argv, index++, option);
    else if (option === '--max-context-depth') options.maxContextDepth = positiveIntegerAfter(argv, index++, option);
    else if (option === '--max-context-nodes') options.maxContextNodes = positiveIntegerAfter(argv, index++, option);
    else if (option === '--max-context-edges') options.maxContextEdges = positiveIntegerAfter(argv, index++, option);
    else if (option === '--max-context-groups') options.maxContextGroups = positiveIntegerAfter(argv, index++, option);
    else if (option === '--on-limit') {
      const value = valueAfter(argv, index++, option);
      if (value !== 'error' && value !== 'incomplete') {
        throw new InputContractError(`${option} must be error or incomplete`);
      }
      options.contextOnLimit = value;
    }
    else if (option === '--sem-command') options.semCommand = valueAfter(argv, index++, option);
    else if (option === '--sem-timeout-ms') {
      options.semTimeoutMs = positiveIntegerAfter(argv, index++, option);
    }
    else if (option === '--sem-max-output-bytes') {
      options.semMaxOutputBytes = positiveIntegerAfter(argv, index++, option);
    }
    else if (option === '--max-analysis-projects') {
      options.maxAnalysisProjects = limitAfter(argv, index++, option);
    }
    else if (option === '--max-project-file-extensions') {
      options.maxProjectFileExtensions = limitAfter(argv, index++, option);
    }
    else if (option === '--max-project-file-extension-chars') {
      options.maxProjectFileExtensionChars = limitAfter(argv, index++, option);
    }
    else if (option === '--max-snapshot-symbols') {
      options.maxSnapshotSymbols = limitAfter(argv, index++, option);
    }
    else if (option === '--max-history-changes') {
      options.maxHistoryChanges = limitAfter(argv, index++, option);
    }
    else if (option === '--max-history-commits') {
      options.maxHistoryCommits = limitAfter(argv, index++, option);
    }
    else if (option === '--format') {
      const format = valueAfter(argv, index++, option);
      if (format !== 'console' && format !== 'json' && format !== 'markdown') {
        throw new InputContractError(`Unsupported format: ${format}`);
      }
      options.format = format;
    } else if (option === '--output') options.output = valueAfter(argv, index++, option);
    else if (option === '--fail-on') {
      const threshold = valueAfter(argv, index++, option);
      if (threshold !== 'error' && threshold !== 'warning' && threshold !== 'info') {
        throw new InputContractError(`Unsupported fail threshold: ${threshold}`);
      }
      options.failOn = threshold;
    } else {
      throw new InputContractError(`Unknown option: ${option}`);
    }
  }
  if (options.semCommand && !options.useSem) {
    throw new InputContractError('--sem-command requires --sem');
  }
  if ((options.semTimeoutMs || options.semMaxOutputBytes) && !options.useSem) {
    throw new InputContractError('--sem-timeout-ms and --sem-max-output-bytes require --sem');
  }
  if (options.changed && !options.useSem) {
    throw new InputContractError('--changed requires --sem');
  }
  const hasContractLimitOverride = options.maxAnalysisProjects !== undefined
    || options.maxProjectFileExtensions !== undefined
    || options.maxProjectFileExtensionChars !== undefined
    || options.maxSnapshotSymbols !== undefined
    || options.maxHistoryChanges !== undefined
    || options.maxHistoryCommits !== undefined;
  if (hasContractLimitOverride && command !== 'history' && command !== 'snapshot') {
    throw new InputContractError(
      'contract limit overrides require the history or snapshot command',
    );
  }
  if (
    (options.maxHistoryChanges !== undefined || options.maxHistoryCommits !== undefined)
    && command !== 'history'
  ) {
    throw new InputContractError('--max-history-* overrides require the history command');
  }
  if (options.staged && (options.from || options.to)) {
    throw new InputContractError('--staged cannot be combined with --from or --to');
  }
  if (options.worktree && options.commit) {
    throw new InputContractError('--worktree cannot be combined with --commit');
  }
  if ((options.from && !options.to) || (!options.from && options.to)) {
    throw new InputContractError('--from and --to must be provided together');
  }
  if (new Set(options.projects).size !== options.projects.length) {
    throw new InputContractError('Duplicate --project values are not allowed');
  }
  if (command !== 'intersect' && command !== 'snapshot-diff' && (options.left || options.right)) {
    throw new InputContractError('--left and --right require the intersect or snapshot-diff command');
  }
  if (command !== 'snapshot' && (options.commit || options.worktree)) {
    throw new InputContractError('--commit and --worktree require the snapshot command');
  }
  if (command === 'history') {
    if (!options.from || !options.to) {
      throw new InputContractError('history requires both --from and --to');
    }
    if (options.staged || options.projects.length > 0) {
      throw new InputContractError('history does not accept --staged or --project');
    }
  }
  const contextLimitProvided = options.maxContextDepth !== undefined
    || options.maxContextNodes !== undefined
    || options.maxContextEdges !== undefined
    || options.maxContextGroups !== undefined
    || options.contextOnLimit !== 'incomplete';
  if (command !== 'context-scope' && (options.snapshot || options.manifest || options.context || contextLimitProvided)) {
    throw new InputContractError('--snapshot, --manifest, --context, and context limits require the context-scope command');
  }
  if (command === 'context-scope' && (!options.snapshot || !options.manifest || !options.context)) {
    throw new InputContractError('context-scope requires --snapshot, --manifest, and --context');
  }
  if (command === 'context-scope' && (
    options.registry !== 'architecture/registry.json'
    || options.useSem
    || options.changed
    || options.staged
    || options.from
    || options.to
    || options.commit
    || options.worktree
    || options.semCommand
    || options.semTimeoutMs
    || options.semMaxOutputBytes
    || options.projects.length > 0
    || options.failOn !== 'error'
  )) {
    throw new InputContractError(
      'context-scope accepts only --root, --snapshot, --manifest, --context, context limits, --format, and --output',
    );
  }
  if (command === 'snapshot') {
    if (options.staged || options.from || options.to || options.changed) {
      throw new InputContractError('snapshot accepts --commit or --worktree, not change-range options');
    }
  }
  if (command === 'intersect' || command === 'snapshot-diff') {
    if (!options.left || !options.right) {
      throw new InputContractError(`${command} requires both --left and --right`);
    }
    if (
      options.registry !== 'architecture/registry.json'
      || options.projects.length > 0
      || options.useSem
      || options.changed
      || options.staged
      || options.from
      || options.to
      || options.commit
      || options.worktree
      || options.semCommand
      || options.semTimeoutMs
      || options.semMaxOutputBytes
      || hasContractLimitOverride
      || options.failOn !== 'error'
    ) {
      throw new InputContractError(
        `${command} accepts only --root, --left, --right, --format, and --output`,
      );
    }
  }
  return options;
}
