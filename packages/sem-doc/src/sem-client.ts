import { spawnSync } from 'node:child_process';

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
  readonly deadlineAt: number;
  readonly maxOutputBytes: number;
  usedOutputBytes: number;
}

export interface SemExecutionBudgetOptions {
  readonly timeoutMs: number;
  readonly maxOutputBytes: number;
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
    this.binary = nonEmptyOption(options.binary ?? process.env.SEM_BIN ?? 'sem', 'binary');
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
      budget.usedOutputBytes +=
        Buffer.byteLength(result.stdout, 'utf8') + Buffer.byteLength(result.stderr, 'utf8');
      if (budget.usedOutputBytes > budget.maxOutputBytes) {
        throw new SemExecutionError(
          `sem command "${command}" exceeded aggregate output budget of ${budget.maxOutputBytes} bytes`,
          result
        );
      }
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
  return {
    deadlineAt: Date.now() + positiveIntegerOption(
      options.timeoutMs,
      'timeoutMs',
      MAX_SEM_CLIENT_TIMEOUT_MS,
    ),
    maxOutputBytes: positiveIntegerOption(
      options.maxOutputBytes,
      'maxOutputBytes',
      MAX_SEM_CLIENT_BUFFER_BYTES,
    ),
    usedOutputBytes: 0,
  };
}

function resolveTimeout(timeoutMs: number, budget: SemExecutionBudget | undefined): number {
  if (budget === undefined) return timeoutMs;
  const remaining = budget.deadlineAt - Date.now();
  if (remaining <= 0) {
    throw new SemExecutionError('sem aggregate timeout budget exhausted before execution');
  }
  return Math.max(1, Math.min(timeoutMs, remaining));
}

function resolveMaxBuffer(maxBufferBytes: number, budget: SemExecutionBudget | undefined): number {
  if (budget === undefined) return maxBufferBytes;
  const remaining = budget.maxOutputBytes - budget.usedOutputBytes;
  if (remaining <= 0) {
    throw new SemExecutionError('sem aggregate output budget exhausted before execution');
  }
  return Math.max(1, Math.min(maxBufferBytes, remaining));
}
