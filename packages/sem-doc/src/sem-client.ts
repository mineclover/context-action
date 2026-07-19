import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import * as path from 'node:path';

import type { SemCommand } from './contracts';

export const DEFAULT_SEM_CLIENT_TIMEOUT_MS = 30_000;
export const DEFAULT_SEM_CLIENT_MAX_BUFFER_BYTES = 32 * 1024 * 1024;
export const MAX_SEM_CLIENT_TIMEOUT_MS = 60 * 60 * 1000;
export const MAX_SEM_CLIENT_BUFFER_BYTES = 1024 * 1024 * 1024;

export interface SemClientOptions {
  readonly binary?: string;
  readonly prefixArgs?: readonly string[];
  readonly cwd?: string;
  readonly timeoutMs?: number;
  readonly maxBufferBytes?: number;
  readonly env?: Readonly<Record<string, string | undefined>>;
}

export interface SemRunOptions {
  readonly cwd?: string;
  readonly timeoutMs?: number;
  readonly maxBufferBytes?: number;
  readonly env?: Readonly<Record<string, string | undefined>>;
  readonly budget?: SemExecutionBudget;
}

/** Aggregate deadline/output budget shared by a composed sem-doc operation. */
export interface SemExecutionBudget {
  /** Requested aggregate timeout, before command-level remaining-time clipping. */
  readonly timeoutMs: number;
  readonly deadlineAt: number;
  /** Requested aggregate output ceiling. */
  readonly maxOutputBytes: number;
  readonly parent?: SemExecutionBudget;
  usedOutputBytes: number;
}

export interface SemExecutionBudgetOptions {
  readonly timeoutMs: number;
  readonly maxOutputBytes: number;
  readonly parent?: SemExecutionBudget;
}

export interface SemCommandResult {
  readonly command: SemCommand | 'version';
  readonly args: readonly string[];
  readonly stdout: string;
  readonly stderr: string;
  readonly status: number | null;
  readonly signal: NodeJS.Signals | null;
}

export class SemConfigurationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'SemConfigurationError';
  }
}

export class SemExecutionError extends Error {
  public constructor(
    message: string,
    public readonly result?: SemCommandResult,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = 'SemExecutionError';
  }
}

export class SemOutputError extends Error {
  public constructor(
    message: string,
    public readonly result: SemCommandResult,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = 'SemOutputError';
  }
}

/** Executes sem as an external, read-only analysis engine. */
export class SemClient {
  private readonly binary: string;
  private readonly prefixArgs: readonly string[];
  private readonly cwd?: string;
  private readonly timeoutMs: number;
  private readonly maxBufferBytes: number;
  private readonly env: Readonly<Record<string, string | undefined>>;

  public constructor(options: SemClientOptions = {}) {
    this.binary = nonEmptyOption(
      options.binary ?? process.env.SEM_BIN ?? defaultSemBinary(),
      'binary',
    );
    this.prefixArgs = [...(options.prefixArgs ?? [])];
    this.cwd = options.cwd;
    this.timeoutMs = positiveIntegerOption(
      options.timeoutMs ?? DEFAULT_SEM_CLIENT_TIMEOUT_MS,
      'timeoutMs',
      MAX_SEM_CLIENT_TIMEOUT_MS,
    );
    this.maxBufferBytes = positiveIntegerOption(
      options.maxBufferBytes ?? DEFAULT_SEM_CLIENT_MAX_BUFFER_BYTES,
      'maxBufferBytes',
      MAX_SEM_CLIENT_BUFFER_BYTES,
    );
    this.env = { ...(options.env ?? {}) };
  }

  public run(
    command: SemCommand,
    args: readonly string[] = [],
    options: SemRunOptions = {}
  ): SemCommandResult {
    return this.execute(command, [command, ...args], options);
  }

  /** Reads the external sem version for provenance recording. */
  public version(options: SemRunOptions = {}): string {
    const result = this.execute('version', ['--version'], options);
    const output = `${result.stdout}\n${result.stderr}`.trim();
    const version = output.match(/\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?/u)?.[0];
    const firstLine = output.split('\n')[0]?.trim() ?? '';
    return version ?? (firstLine.length > 0 ? firstLine : 'unknown');
  }

  private execute(
    command: SemCommand | 'version',
    commandArgs: readonly string[],
    options: SemRunOptions
  ): SemCommandResult {
    const budget = options.budget;
    const timeoutMs = resolveTimeout(
      positiveIntegerOption(
        options.timeoutMs ?? this.timeoutMs,
        'timeoutMs',
        MAX_SEM_CLIENT_TIMEOUT_MS,
      ),
      budget,
    );
    const maxBufferBytes = resolveMaxBuffer(
      positiveIntegerOption(
        options.maxBufferBytes ?? this.maxBufferBytes,
        'maxBufferBytes',
        MAX_SEM_CLIENT_BUFFER_BYTES,
      ),
      budget,
    );
    const child = spawnSync(this.binary, [...this.prefixArgs, ...commandArgs], {
      cwd: options.cwd ?? this.cwd,
      encoding: 'utf8',
      env: {
        ...process.env,
        ...this.env,
        ...options.env,
      },
      maxBuffer: maxBufferBytes,
      timeout: timeoutMs,
    });
    const result: SemCommandResult = {
      command,
      args: [...commandArgs.slice(1)],
      stdout: child.stdout ?? '',
      stderr: child.stderr ?? '',
      status: child.status,
      signal: child.signal,
    };

    if (budget !== undefined) {
      const outputBytes =
        Buffer.byteLength(result.stdout, 'utf8') + Buffer.byteLength(result.stderr, 'utf8');
      chargeExecutionBudget(budget, outputBytes, result, command);
    }

    if (child.error) {
      throw new SemExecutionError(
        `Failed to execute sem command "${command}": ${child.error.message}`,
        result,
        { cause: child.error }
      );
    }
    if (child.status !== 0) {
      const detail = result.stderr.trim() || `process exited with status ${String(result.status)}`;
      throw new SemExecutionError(`sem command "${command}" failed: ${detail}`, result);
    }
    return result;
  }

  public runJson<TPayload>(
    command: SemCommand,
    args: readonly string[] = [],
    options: SemRunOptions = {}
  ): TPayload {
    const result = this.run(command, args, options);
    try {
      return JSON.parse(result.stdout) as TPayload;
    } catch (error) {
      throw new SemOutputError(`sem command "${command}" returned invalid JSON`, result, {
        cause: error,
      });
    }
  }
}

/**
 * Resolve the workspace-installed sem executable before falling back to PATH.
 *
 * Work-context commands intentionally run sem from the Git repository root. A
 * pnpm-provided `./node_modules/.bin` entry is relative to the package cwd and
 * therefore stops resolving after that cwd changes. The package-local absolute
 * path keeps the default CLI usable without requiring SEM_BIN.
 */
function defaultSemBinary(): string {
  const extension = process.platform === 'win32' ? '.cmd' : '';
  let directory = __dirname;
  while (true) {
    const candidate = path.join(directory, 'node_modules', '.bin', `sem${extension}`);
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  return 'sem';
}

function nonEmptyOption(value: string, name: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) throw new SemConfigurationError(`${name} must not be empty`);
  return normalized;
}

function positiveIntegerOption(value: number, name: string, maximum: number): number {
  if (!Number.isSafeInteger(value) || value <= 0 || value > maximum) {
    throw new SemConfigurationError(
      `${name} must be a safe integer between 1 and ${maximum}`,
    );
  }
  return value;
}

export function createSemExecutionBudget(options: SemExecutionBudgetOptions): SemExecutionBudget {
  const timeoutMs = positiveIntegerOption(
    options.timeoutMs,
    'timeoutMs',
    MAX_SEM_CLIENT_TIMEOUT_MS,
  );
  const maxOutputBytes = positiveIntegerOption(
    options.maxOutputBytes,
    'maxOutputBytes',
    MAX_SEM_CLIENT_BUFFER_BYTES,
  );
  return {
    timeoutMs,
    deadlineAt: Date.now() + timeoutMs,
    maxOutputBytes,
    ...(options.parent === undefined ? {} : { parent: options.parent }),
    usedOutputBytes: 0,
  };
}

function resolveTimeout(timeoutMs: number, budget: SemExecutionBudget | undefined): number {
  if (budget === undefined) return timeoutMs;
  const remaining = budget.deadlineAt - Date.now();
  if (remaining <= 0) {
    throw new SemExecutionError('sem execution timeout budget exhausted before execution');
  }
  const parentTimeout = budget.parent === undefined
    ? timeoutMs
    : resolveTimeout(timeoutMs, budget.parent);
  return Math.max(1, Math.min(timeoutMs, remaining, parentTimeout));
}

function resolveMaxBuffer(maxBufferBytes: number, budget: SemExecutionBudget | undefined): number {
  if (budget === undefined) return maxBufferBytes;
  const remaining = budget.maxOutputBytes - budget.usedOutputBytes;
  if (remaining <= 0) {
    throw new SemExecutionError('sem execution output budget exhausted before execution');
  }
  const parentBuffer = budget.parent === undefined
    ? maxBufferBytes
    : resolveMaxBuffer(maxBufferBytes, budget.parent);
  return Math.max(1, Math.min(maxBufferBytes, remaining, parentBuffer));
}

function chargeExecutionBudget(
  budget: SemExecutionBudget,
  outputBytes: number,
  result: SemCommandResult,
  command: SemCommand | 'version',
): void {
  budget.usedOutputBytes += outputBytes;
  if (budget.usedOutputBytes > budget.maxOutputBytes) {
    throw new SemExecutionError(
      `sem command "${command}" exceeded execution output budget of ${budget.maxOutputBytes} bytes`,
      result,
    );
  }
  if (budget.parent !== undefined) chargeExecutionBudget(budget.parent, outputBytes, result, command);
}
