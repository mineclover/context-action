/**
 * Additive lifecycle evidence for a managed tool call.
 *
 * This is an audit/trace record, not a durable operation state machine. The
 * durable operation store remains the source of truth for cross-process claim
 * and reconciliation; this record only describes what the caller observed.
 */
export const TOOL_EXECUTION_PROVENANCE_SCHEMA =
  'context-action-tool-execution-provenance.v1' as const;

export type ToolExecutionProvenanceState =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'unknown';

export interface ToolExecutionProvenance {
  readonly schemaVersion: typeof TOOL_EXECUTION_PROVENANCE_SCHEMA;
  readonly phase: 'tool-call';
  /** Logical owner for the caller/worker lifetime, never a secret or payload. */
  readonly ownerId: string;
  readonly state: ToolExecutionProvenanceState;
  /** Configured wall-clock limit, when the caller supplied one. */
  readonly timeoutMs?: number;
  /** Configured output limit, when the caller supplied one. */
  readonly maxOutputBytes?: number;
  /** UTF-8 bytes observed at the tool result boundary. */
  readonly usedOutputBytes: number;
  /** Wall-clock elapsed time measured by the caller, in milliseconds. */
  readonly elapsedMs: number;
}

export interface ToolExecutionProvenanceOptions {
  readonly ownerId: string;
  readonly state: ToolExecutionProvenanceState;
  readonly timeoutMs?: number;
  readonly maxOutputBytes?: number;
  readonly usedOutputBytes: number;
  readonly elapsedMs: number;
}

const TOOL_EXECUTION_STATES = new Set<ToolExecutionProvenanceState>([
  'pending',
  'completed',
  'failed',
  'cancelled',
  'unknown',
]);
const MAX_OWNER_ID_LENGTH = 256;

export function createToolExecutionProvenance(
  options: ToolExecutionProvenanceOptions,
): ToolExecutionProvenance {
  const ownerId = canonicalOwnerId(options.ownerId, 'ownerId');
  validateState(options.state, 'state');
  const timeoutMs = optionalNonNegativeInteger(options.timeoutMs, 'timeoutMs');
  const maxOutputBytes = optionalPositiveInteger(options.maxOutputBytes, 'maxOutputBytes');
  const usedOutputBytes = nonNegativeInteger(options.usedOutputBytes, 'usedOutputBytes');
  const elapsedMs = nonNegativeInteger(options.elapsedMs, 'elapsedMs');
  return {
    schemaVersion: TOOL_EXECUTION_PROVENANCE_SCHEMA,
    phase: 'tool-call',
    ownerId,
    state: options.state,
    ...(timeoutMs === undefined ? {} : { timeoutMs }),
    ...(maxOutputBytes === undefined ? {} : { maxOutputBytes }),
    usedOutputBytes,
    elapsedMs,
  };
}

/** Strictly validates a provenance record before it is persisted or exported. */
export function parseToolExecutionProvenance(
  value: unknown,
  path = 'provenance',
): ToolExecutionProvenance {
  if (!isRecord(value)) throw new TypeError(`${path} must be an object`);
  const allowed = new Set([
    'schemaVersion',
    'phase',
    'ownerId',
    'state',
    'timeoutMs',
    'maxOutputBytes',
    'usedOutputBytes',
    'elapsedMs',
  ]);
  const unknown = Object.keys(value).find((key) => !allowed.has(key));
  if (unknown !== undefined) throw new TypeError(`${path} contains unknown field: ${unknown}`);
  if (value.schemaVersion !== TOOL_EXECUTION_PROVENANCE_SCHEMA) {
    throw new TypeError(`${path}.schemaVersion is invalid`);
  }
  if (value.phase !== 'tool-call') throw new TypeError(`${path}.phase is invalid`);
  const ownerId = canonicalOwnerId(value.ownerId, `${path}.ownerId`, true);
  validateState(value.state, `${path}.state`);
  const timeoutMs = optionalNonNegativeInteger(value.timeoutMs, `${path}.timeoutMs`);
  const maxOutputBytes = optionalPositiveInteger(value.maxOutputBytes, `${path}.maxOutputBytes`);
  const usedOutputBytes = nonNegativeInteger(value.usedOutputBytes, `${path}.usedOutputBytes`);
  const elapsedMs = nonNegativeInteger(value.elapsedMs, `${path}.elapsedMs`);
  return {
    schemaVersion: TOOL_EXECUTION_PROVENANCE_SCHEMA,
    phase: 'tool-call',
    ownerId,
    state: value.state,
    ...(timeoutMs === undefined ? {} : { timeoutMs }),
    ...(maxOutputBytes === undefined ? {} : { maxOutputBytes }),
    usedOutputBytes,
    elapsedMs,
  } as ToolExecutionProvenance;
}

/** Measures the serialized result surface without retaining its content in provenance. */
export function measureToolOutputBytes(value: unknown): number {
  let serialized: string;
  try {
    serialized = JSON.stringify(value) ?? '';
  } catch {
    serialized = String(value);
  }
  if (typeof TextEncoder === 'function') {
    return new TextEncoder().encode(serialized).byteLength;
  }
  // jsdom and older browser workers may not expose TextEncoder. Count the
  // percent-encoded UTF-8 representation without introducing a Node Buffer
  // dependency into this browser-safe package.
  const encoded = encodeURIComponent(serialized);
  let bytes = 0;
  for (let index = 0; index < encoded.length; index += 1, bytes += 1) {
    if (encoded[index] === '%') index += 2;
  }
  return bytes;
}

function validateState(
  value: unknown,
  path: string,
): asserts value is ToolExecutionProvenanceState {
  if (typeof value !== 'string' || !TOOL_EXECUTION_STATES.has(value as ToolExecutionProvenanceState)) {
    throw new TypeError(`${path} is invalid`);
  }
}

function canonicalOwnerId(value: unknown, path: string, strict = false): string {
  if (typeof value !== 'string') throw new TypeError(`${path} must be text`);
  const normalized = value.trim();
  if (normalized.length === 0 || normalized.length > MAX_OWNER_ID_LENGTH || normalized.includes('\0')) {
    throw new TypeError(`${path} must be visible text within ${MAX_OWNER_ID_LENGTH} characters`);
  }
  if (strict && value !== normalized) throw new TypeError(`${path} must be canonical text`);
  return normalized;
}

function optionalPositiveInteger(value: unknown, path: string): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new TypeError(`${path} must be a positive safe integer`);
  }
  return value;
}

function optionalNonNegativeInteger(value: unknown, path: string): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${path} must be a non-negative safe integer`);
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
