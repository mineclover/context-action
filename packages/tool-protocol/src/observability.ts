import { measureToolOutputBytes } from './execution-provenance.js';
import type {
  ToolCallEvent,
  ToolCallId,
  ToolCallObserver,
  ToolCallResult,
} from './tool-protocol.js';

/** Versioned policy metadata for bounded, redacted tool observations. */
export const TOOL_OBSERVABILITY_POLICY_SCHEMA =
  'context-action-tool-observability-policy.v1' as const;

export interface ToolObservabilityPolicyOptions {
  /** Maximum UTF-8 bytes emitted by serializeToolObservabilityValue(). */
  readonly maxBytes?: number;
  /** Maximum recursive object/array depth before a value is omitted. */
  readonly maxDepth?: number;
  /** Maximum characters retained for a non-sensitive string value. */
  readonly maxStringLength?: number;
  /** Maximum array items retained per object/array node. */
  readonly maxArrayEntries?: number;
  /** Maximum object fields retained per object node. */
  readonly maxObjectEntries?: number;
  /** Suggested lifetime for an observation in a telemetry store. */
  readonly retentionMs?: number;
  /** Suggested maximum number of observations retained by a telemetry store. */
  readonly maxEntries?: number;
  /** Additional case-insensitive field names whose values must be redacted. */
  readonly redactedKeys?: readonly string[];
}

export interface ToolObservabilityPolicy {
  readonly schemaVersion: typeof TOOL_OBSERVABILITY_POLICY_SCHEMA;
  readonly maxBytes: number;
  readonly maxDepth: number;
  readonly maxStringLength: number;
  readonly maxArrayEntries: number;
  readonly maxObjectEntries: number;
  readonly retentionMs: number;
  readonly maxEntries: number;
  readonly redactedKeys: readonly string[];
}

/** Versioned metadata-only projection suitable for a telemetry sink. */
export const TOOL_OBSERVATION_SCHEMA =
  'context-action-tool-observation.v1' as const;

export interface ToolObservationContext {
  readonly source?: string;
  readonly mode?: string;
  readonly sessionId?: string;
  readonly revision?: string | number;
  readonly metadata?: unknown;
}

export interface ToolObservationRequest {
  readonly method: 'tools/call';
  readonly toolCallId?: ToolCallId;
  readonly name: string;
  /** Argument names only; argument values are intentionally never projected. */
  readonly argumentKeys: readonly string[];
}

export interface ToolObservationResult {
  readonly isError: boolean;
  readonly errorCode?: string;
  readonly retryable?: boolean;
  readonly contentTypes: readonly string[];
  readonly hasStructuredContent: boolean;
}

export interface ToolObservation {
  readonly schemaVersion: typeof TOOL_OBSERVATION_SCHEMA;
  readonly type: ToolCallEvent['type'];
  readonly toolCallId?: ToolCallId;
  readonly name: string;
  readonly context?: ToolObservationContext;
  readonly timestamp: number;
  readonly durationMs?: number;
  readonly provenance: ToolCallEvent['provenance'];
  readonly request: ToolObservationRequest;
  readonly result?: ToolObservationResult;
}

/** Versioned record delivered by the safe telemetry observer adapter. */
export const TOOL_OBSERVATION_SINK_SCHEMA =
  'context-action-tool-observation-sink.v1' as const;

export interface ToolObservationSinkRecord {
  readonly schemaVersion: typeof TOOL_OBSERVATION_SINK_SCHEMA;
  readonly observationSchemaVersion: typeof TOOL_OBSERVATION_SCHEMA;
  /** Serialized metadata-only observation; it never contains raw request/result values. */
  readonly serializedObservation: string;
  readonly policy: {
    readonly schemaVersion: typeof TOOL_OBSERVABILITY_POLICY_SCHEMA;
    readonly maxBytes: number;
    readonly retentionMs: number;
    readonly maxEntries: number;
  };
}

export type ToolObservationSink = (record: ToolObservationSinkRecord) => void;

const DEFAULT_MAX_BYTES = 8 * 1024;
const DEFAULT_MAX_DEPTH = 6;
const DEFAULT_MAX_STRING_LENGTH = 512;
const DEFAULT_MAX_ARRAY_ENTRIES = 32;
const DEFAULT_MAX_OBJECT_ENTRIES = 64;
const DEFAULT_RETENTION_MS = 15 * 60 * 1000;
const DEFAULT_MAX_ENTRIES = 256;
const DEFAULT_REDACTED_KEYS = [
  'accesskey',
  'apikey',
  'authorization',
  'cookie',
  'password',
  'privatekey',
  'replace',
  'search',
  'secret',
  'source',
  'token',
] as const;
const DEFAULT_REDACTED_FRAGMENTS = [
  'accesskey',
  'apikey',
  'authorization',
  'cookie',
  'password',
  'privatekey',
  'secret',
  'token',
] as const;

export const DEFAULT_TOOL_OBSERVABILITY_POLICY: ToolObservabilityPolicy =
  createToolObservabilityPolicy();

/** Creates a validated policy without creating a store or a second state machine. */
export function createToolObservabilityPolicy(
  options: ToolObservabilityPolicyOptions = {},
): ToolObservabilityPolicy {
  const redactedKeys = normalizeRedactedKeys(
    [...DEFAULT_REDACTED_KEYS, ...(options.redactedKeys ?? [])],
  );
  return {
    schemaVersion: TOOL_OBSERVABILITY_POLICY_SCHEMA,
    maxBytes: positiveSafeInteger(options.maxBytes ?? DEFAULT_MAX_BYTES, 'maxBytes'),
    maxDepth: nonNegativeSafeInteger(options.maxDepth ?? DEFAULT_MAX_DEPTH, 'maxDepth'),
    maxStringLength: positiveSafeInteger(
      options.maxStringLength ?? DEFAULT_MAX_STRING_LENGTH,
      'maxStringLength',
    ),
    maxArrayEntries: positiveSafeInteger(
      options.maxArrayEntries ?? DEFAULT_MAX_ARRAY_ENTRIES,
      'maxArrayEntries',
    ),
    maxObjectEntries: positiveSafeInteger(
      options.maxObjectEntries ?? DEFAULT_MAX_OBJECT_ENTRIES,
      'maxObjectEntries',
    ),
    retentionMs: nonNegativeSafeInteger(
      options.retentionMs ?? DEFAULT_RETENTION_MS,
      'retentionMs',
    ),
    maxEntries: positiveSafeInteger(options.maxEntries ?? DEFAULT_MAX_ENTRIES, 'maxEntries'),
    redactedKeys,
  };
}

/**
 * Returns a bounded JSON-compatible value with sensitive fields removed.
 * Cycles, unsupported values, deep branches, and excess collection entries are
 * represented by explicit markers rather than throwing or leaking raw input.
 */
export function redactToolObservabilityValue(
  value: unknown,
  policy: ToolObservabilityPolicy = DEFAULT_TOOL_OBSERVABILITY_POLICY,
): unknown {
  return redactValue(value, undefined, 0, new WeakSet<object>(), policy);
}

/** Serializes an observation within the policy byte budget. */
export function serializeToolObservabilityValue(
  value: unknown,
  policy: ToolObservabilityPolicy = DEFAULT_TOOL_OBSERVABILITY_POLICY,
): string {
  const redacted = redactToolObservabilityValue(value, policy);
  let serialized: string;
  try {
    serialized = JSON.stringify(redacted, null, 2) ?? 'null';
  } catch {
    serialized = JSON.stringify({
      _redacted: 'unserializable observability value',
    });
  }
  if (measureToolOutputBytes(serialized) <= policy.maxBytes) return serialized;
  return boundedObservabilityMarker(policy.maxBytes);
}

/**
 * Projects a canonical lifecycle event without copying request arguments,
 * result content, structured payloads, or error messages into the sink value.
 *
 * The returned object is metadata-only but still needs to be serialized with
 * `serializeToolObservabilityValue()` before crossing a telemetry boundary so
 * the configured byte, depth, and collection limits are applied.
 */
export function projectToolCallObservation(
  event: ToolCallEvent,
  policy: ToolObservabilityPolicy = DEFAULT_TOOL_OBSERVABILITY_POLICY,
): ToolObservation {
  const context = event.context === undefined
    ? undefined
    : {
        ...(event.context.source === undefined ? {} : { source: event.context.source }),
        ...(event.context.mode === undefined ? {} : { mode: event.context.mode }),
        ...(event.context.sessionId === undefined ? {} : { sessionId: event.context.sessionId }),
        ...(event.context.revision === undefined ? {} : { revision: event.context.revision }),
        ...(event.context.metadata === undefined
          ? {}
          : { metadata: redactToolObservabilityValue(event.context.metadata, policy) }),
      };
  const result = event.type === 'completed' || event.type === 'failed'
    ? (() => {
        const errorCode = event.result.error?.code;
        return {
          isError: event.result.isError === true,
          ...(typeof errorCode === 'string' && /^[A-Za-z0-9._:-]{1,128}$/.test(errorCode)
            ? { errorCode }
            : {}),
          ...(event.result.error?.retryable === undefined
            ? {}
            : { retryable: event.result.error.retryable }),
          contentTypes: event.result.content.map((content) => content.type),
          hasStructuredContent: event.result.structuredContent !== undefined,
        } satisfies ToolObservationResult;
      })()
    : undefined;
  const argumentKeys = Object.keys(event.request.params.arguments ?? {}).sort();
  const boundedArgumentKeys = argumentKeys.slice(0, policy.maxArrayEntries);
  if (argumentKeys.length > policy.maxArrayEntries) {
    boundedArgumentKeys.push('[additional argument names redacted]');
  }
  const observation: ToolObservation = {
    schemaVersion: TOOL_OBSERVATION_SCHEMA,
    type: event.type,
    ...(event.toolCallId === undefined ? {} : { toolCallId: event.toolCallId }),
    name: event.name,
    ...(context === undefined ? {} : { context }),
    timestamp: event.timestamp,
    ...('durationMs' in event ? { durationMs: event.durationMs } : {}),
    provenance: event.provenance,
    request: {
      method: 'tools/call',
      ...(event.toolCallId === undefined ? {} : { toolCallId: event.toolCallId }),
      name: event.request.params.name,
      argumentKeys: boundedArgumentKeys,
    },
    ...(result === undefined ? {} : { result }),
  };
  return observation;
}

/**
 * Creates an observer that crosses a telemetry boundary with a safe record.
 * The callback never receives the canonical ToolCallEvent, request arguments,
 * result content, or error messages. Apply the sink's retention/deletion job
 * to the policy metadata supplied in the record.
 */
export function createToolObservationSink(
  sink: ToolObservationSink,
  policy: ToolObservabilityPolicy = DEFAULT_TOOL_OBSERVABILITY_POLICY,
): ToolCallObserver {
  return (event) => {
    const observation = projectToolCallObservation(event, policy);
    sink({
      schemaVersion: TOOL_OBSERVATION_SINK_SCHEMA,
      observationSchemaVersion: TOOL_OBSERVATION_SCHEMA,
      serializedObservation: serializeToolObservabilityValue(observation, policy),
      policy: {
        schemaVersion: policy.schemaVersion,
        maxBytes: policy.maxBytes,
        retentionMs: policy.retentionMs,
        maxEntries: policy.maxEntries,
      },
    });
  };
}

const REDACTED_TOOL_DIAGNOSTIC_MESSAGE =
  'Tool execution diagnostic retained in redacted form.';

/**
 * Creates the durable projection for an ambiguous or failed tool result.
 *
 * Successful results must remain lossless so a retry can replay them. An
 * An error result is diagnostic evidence instead: keep the error code and a
 * bounded/redacted details object, but never persist canonical content or
 * structured payloads that may contain source text or credentials.
 */
export function sanitizeToolCallDiagnostic(
  result: ToolCallResult,
  policy: ToolObservabilityPolicy = DEFAULT_TOOL_OBSERVABILITY_POLICY,
): ToolCallResult {
  const details = result.error?.details;
  const projected = details === undefined
    ? undefined
    : parseRedactedDiagnosticDetails(details, policy);
  return {
    content: [{ type: 'text', text: REDACTED_TOOL_DIAGNOSTIC_MESSAGE }],
    isError: true,
    ...(result.error === undefined
      ? {}
      : {
          error: {
            code: result.error.code,
            message: REDACTED_TOOL_DIAGNOSTIC_MESSAGE,
            ...(result.error.retryable === undefined
              ? {}
              : { retryable: result.error.retryable }),
            ...(projected === undefined ? {} : { details: projected }),
          },
        }),
  };
}

/** Returns a stable non-payload reason safe to persist beside an error record. */
export function sanitizeToolCallDiagnosticReason(result: ToolCallResult): string {
  const code = result.error?.code;
  if (typeof code === 'string' && /^[A-Za-z0-9._:-]{1,128}$/.test(code)) {
    return `Tool execution ended with ${code}; reconcile before retrying.`;
  }
  return 'Tool execution ended with an ambiguous outcome; reconcile before retrying.';
}

/** Returns whether an observation is still within the configured retention window. */
export function isToolObservationRetained(
  observedAt: number,
  now: number,
  policy: ToolObservabilityPolicy = DEFAULT_TOOL_OBSERVABILITY_POLICY,
): boolean {
  if (!Number.isFinite(observedAt) || !Number.isFinite(now)) {
    throw new RangeError('Observation timestamps must be finite numbers.');
  }
  return now < observedAt || now - observedAt < policy.retentionMs;
}

function redactValue(
  value: unknown,
  key: string | undefined,
  depth: number,
  seen: WeakSet<object>,
  policy: ToolObservabilityPolicy,
): unknown {
  if (key !== undefined && shouldRedactKey(key, policy)) {
    return `[${key} redacted]`;
  }
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : '[number redacted]';
  }
  if (typeof value === 'bigint') return '[bigint redacted]';
  if (typeof value === 'string') {
    return value.length > policy.maxStringLength
      ? `${value.slice(0, policy.maxStringLength)}… [truncated]`
      : value;
  }
  if (typeof value !== 'object') return `[${typeof value} redacted]`;
  if (depth >= policy.maxDepth) return '[depth redacted]';
  if (seen.has(value)) return '[circular redacted]';
  seen.add(value);

  if (Array.isArray(value)) {
    const output = value
      .slice(0, policy.maxArrayEntries)
      .map((entry) => redactValue(entry, undefined, depth + 1, seen, policy));
    if (value.length > policy.maxArrayEntries) output.push('[additional entries redacted]');
    seen.delete(value);
    return output;
  }

  const output: Record<string, unknown> = {};
  const entries = Object.entries(value).slice(0, policy.maxObjectEntries);
  for (const [entryKey, entryValue] of entries) {
    output[entryKey] = redactValue(entryValue, entryKey, depth + 1, seen, policy);
  }
  if (Object.keys(value).length > policy.maxObjectEntries) {
    output._redacted = 'additional fields redacted';
  }
  seen.delete(value);
  return output;
}

function normalizeRedactedKeys(keys: readonly string[]): readonly string[] {
  if (!Array.isArray(keys)) throw new TypeError('redactedKeys must be an array.');
  const normalized = [...new Set(keys.map((key) => {
    if (typeof key !== 'string') throw new TypeError('redactedKeys must contain strings.');
    return normalizeKey(key);
  }).filter(Boolean))].sort();
  return normalized;
}

function parseRedactedDiagnosticDetails(
  details: unknown,
  policy: ToolObservabilityPolicy,
): unknown {
  const serialized = serializeToolObservabilityValue({ details }, policy);
  try {
    const parsed: unknown = JSON.parse(serialized);
    if (isRecord(parsed) && parsed.details !== undefined) {
      return parsed.details;
    }
    return parsed;
  } catch {
    // serializeToolObservabilityValue() always returns JSON, but keep a small
    // primitive fallback if a custom runtime violates that assumption.
    return 0;
  }
}

/**
 * Returns a JSON value that still fits the configured byte budget. The
 * diagnostic marker is intentionally progressively reduced for very small
 * budgets; returning an oversized marker would violate the same contract that
 * caused the payload to be redacted.
 */
function boundedObservabilityMarker(maxBytes: number): string {
  const candidates = [
    JSON.stringify({ _redacted: 'observability payload exceeded byte limit' }),
    JSON.stringify('[observability payload redacted]'),
    '{}',
    '0',
  ];
  return candidates.find((candidate) => measureToolOutputBytes(candidate) <= maxBytes) ?? '0';
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/[-_\s]/g, '');
}

function shouldRedactKey(key: string, policy: ToolObservabilityPolicy): boolean {
  const normalized = normalizeKey(key);
  return policy.redactedKeys.includes(normalized) ||
    DEFAULT_REDACTED_FRAGMENTS.some((fragment) => normalized.includes(fragment));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function positiveSafeInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive safe integer.`);
  }
  return value;
}

function nonNegativeSafeInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative safe integer.`);
  }
  return value;
}
