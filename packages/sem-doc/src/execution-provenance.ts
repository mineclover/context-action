/**
 * Stable, serialized execution evidence shared by work-context and history
 * projections. This is intentionally separate from SemExecutionBudget: a
 * budget is mutable runtime state, while provenance is an immutable report.
 */
export type ExecutionProvenancePhase = 'work-context' | 'context-scope-history';

export type ExecutionProvenanceState = 'completed' | 'failed' | 'cancelled' | 'unknown';

export interface ExecutionProvenance {
  readonly phase: ExecutionProvenancePhase;
  /** Logical caller/operation owner, never a process id or secret. */
  readonly ownerId: string;
  readonly state: ExecutionProvenanceState;
  readonly timeoutMs: number;
  readonly maxOutputBytes: number;
  readonly usedOutputBytes: number;
  /** Wall-clock elapsed duration measured by the producer, in milliseconds. */
  readonly elapsedMs: number;
}

export interface ExecutionProvenanceOptions {
  readonly phase: ExecutionProvenancePhase;
  readonly ownerId: string;
  readonly state: ExecutionProvenanceState;
  readonly timeoutMs: number;
  readonly maxOutputBytes: number;
  readonly usedOutputBytes: number;
  readonly elapsedMs: number;
}

const EXECUTION_PHASES = new Set<ExecutionProvenancePhase>([
  'work-context',
  'context-scope-history',
]);
const EXECUTION_STATES = new Set<ExecutionProvenanceState>([
  'completed',
  'failed',
  'cancelled',
  'unknown',
]);
const MAX_OWNER_ID_LENGTH = 256;

export function createExecutionProvenance(
  options: ExecutionProvenanceOptions,
): ExecutionProvenance {
  validatePhase(options.phase, 'phase');
  const ownerId = canonicalOwnerId(options.ownerId, 'ownerId');
  validateState(options.state, 'state');
  const timeoutMs = positiveInteger(options.timeoutMs, 'timeoutMs');
  const maxOutputBytes = positiveInteger(options.maxOutputBytes, 'maxOutputBytes');
  const usedOutputBytes = nonNegativeInteger(options.usedOutputBytes, 'usedOutputBytes');
  if (usedOutputBytes > maxOutputBytes) {
    throw new TypeError('usedOutputBytes must not exceed maxOutputBytes');
  }
  const elapsedMs = nonNegativeInteger(options.elapsedMs, 'elapsedMs');
  return {
    phase: options.phase,
    ownerId,
    state: options.state,
    timeoutMs,
    maxOutputBytes,
    usedOutputBytes,
    elapsedMs,
  };
}

/** Strictly validates a serialized provenance record before it crosses a SSOT boundary. */
export function parseExecutionProvenance(
  value: unknown,
  path = 'execution',
): ExecutionProvenance {
  if (!isRecord(value)) throw new TypeError(`${path} must be an object`);
  const allowed = [
    'phase',
    'ownerId',
    'state',
    'timeoutMs',
    'maxOutputBytes',
    'usedOutputBytes',
    'elapsedMs',
  ];
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) throw new TypeError(`${path} contains unknown field: ${unknown[0]}`);
  validatePhase(value.phase, `${path}.phase`);
  const ownerId = canonicalOwnerId(value.ownerId, `${path}.ownerId`);
  validateState(value.state, `${path}.state`);
  const timeoutMs = positiveInteger(value.timeoutMs, `${path}.timeoutMs`);
  const maxOutputBytes = positiveInteger(value.maxOutputBytes, `${path}.maxOutputBytes`);
  const usedOutputBytes = nonNegativeInteger(value.usedOutputBytes, `${path}.usedOutputBytes`);
  if (usedOutputBytes > maxOutputBytes) {
    throw new TypeError(`${path}.usedOutputBytes must not exceed ${path}.maxOutputBytes`);
  }
  const elapsedMs = nonNegativeInteger(value.elapsedMs, `${path}.elapsedMs`);
  return {
    phase: value.phase,
    ownerId,
    state: value.state,
    timeoutMs,
    maxOutputBytes,
    usedOutputBytes,
    elapsedMs,
  } as ExecutionProvenance;
}

function validatePhase(value: unknown, path: string): asserts value is ExecutionProvenancePhase {
  if (typeof value !== 'string' || !EXECUTION_PHASES.has(value as ExecutionProvenancePhase)) {
    throw new TypeError(`${path} is invalid`);
  }
}

function validateState(value: unknown, path: string): asserts value is ExecutionProvenanceState {
  if (typeof value !== 'string' || !EXECUTION_STATES.has(value as ExecutionProvenanceState)) {
    throw new TypeError(`${path} is invalid`);
  }
}

function canonicalOwnerId(value: unknown, path: string): string {
  if (typeof value !== 'string') throw new TypeError(`${path} must be text`);
  const normalized = value.trim();
  if (normalized.length === 0 || normalized.length > MAX_OWNER_ID_LENGTH || normalized.includes('\0')) {
    throw new TypeError(`${path} must be visible text within ${MAX_OWNER_ID_LENGTH} characters`);
  }
  if (value !== normalized) throw new TypeError(`${path} must be canonical text`);
  return normalized;
}

function positiveInteger(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new TypeError(`${path} must be a positive safe integer`);
  }
  return value;
}

function nonNegativeInteger(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${path} must be a non-negative safe integer`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
