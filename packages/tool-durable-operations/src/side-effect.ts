import type {
  DurableOperationClaim,
  DurableOperationFence,
  DurableOperationRecord,
  DurableOperationResolution,
  DurableOperationStore,
} from './durable-operation.js';
import { hasDurableOperationFencingCapability } from './durable-operation.js';

/**
 * Result of an external side-effect attempt.
 *
 * `unknown` is intentionally explicit. A network error after a request was
 * sent, a queue acknowledgement lost after enqueue, or a provider timeout
 * must not be converted into a retryable failure by guessing that nothing
 * happened.
 */
export type SideEffectOutcome<TResult, TDiagnostic = unknown> =
  | {
      readonly state: 'completed';
      readonly result: TResult;
      readonly reason?: string;
    }
  | {
      readonly state: 'failed';
      readonly reason: string;
      readonly result?: TResult;
      readonly diagnostic?: TDiagnostic;
    }
  | {
      readonly state: 'unknown';
      readonly reason: string;
      readonly diagnostic?: TDiagnostic;
    };

/** Context passed to an HTTP, queue, filesystem, or provider adapter. */
export interface SideEffectExecutionContext {
  readonly key: string;
  readonly fingerprint: string;
  readonly ownerId: string;
  readonly signal?: AbortSignal;
}

/** The payload persisted in a durable operation record. */
export interface SideEffectRecordPayload<TResult, TDiagnostic = unknown> {
  readonly result?: TResult;
  readonly diagnostic?: TDiagnostic;
}

export type SideEffectRunState =
  | 'completed'
  | 'failed'
  | 'replayed'
  | 'pending'
  | 'unknown'
  | 'conflict'
  | 'cancelled';

export interface SideEffectRunResult<TResult, TDiagnostic = unknown> {
  readonly state: SideEffectRunState;
  readonly operation?: DurableOperationRecord<
    SideEffectRecordPayload<TResult, TDiagnostic>
  >;
  readonly result?: TResult;
  readonly diagnostic?: TDiagnostic;
  readonly reason?: string;
}

export type SideEffectRecoveryState =
  | 'resolved'
  | 'pending'
  | 'completed'
  | 'failed'
  | 'unknown'
  | 'missing';

export interface SideEffectRecoveryContext<TResult, TDiagnostic = unknown> {
  readonly operation: DurableOperationRecord<
    SideEffectRecordPayload<TResult, TDiagnostic>
  >;
  readonly result?: TResult;
  readonly diagnostic?: TDiagnostic;
}

export interface SideEffectRecoveryResult<TResult, TDiagnostic = unknown> {
  readonly state: SideEffectRecoveryState;
  readonly operation?: DurableOperationRecord<
    SideEffectRecordPayload<TResult, TDiagnostic>
  >;
  readonly result?: TResult;
  readonly diagnostic?: TDiagnostic;
  readonly reason?: string;
}

/** Application-facing resolution returned by an unknown-outcome resolver. */
export type SideEffectRecoveryResolution<TResult, TDiagnostic = unknown> =
  | {
      readonly state: 'completed';
      readonly result: TResult;
      readonly diagnostic?: TDiagnostic;
      readonly reason?: string;
    }
  | {
      readonly state: 'failed';
      readonly reason: string;
      readonly result?: TResult;
      readonly diagnostic?: TDiagnostic;
    };

export type SideEffectResolver<TResult, TDiagnostic = unknown> = (
  context: SideEffectRecoveryContext<TResult, TDiagnostic>
) => Promise<SideEffectRecoveryResolution<TResult, TDiagnostic>>;

export interface DurableSideEffectRunnerOptions<TResult, TDiagnostic = unknown> {
  /** Existing durable store; the runner does not create a second state machine. */
  readonly store: DurableOperationStore<
    SideEffectRecordPayload<TResult, TDiagnostic>
  >;
  /** Stable owner identity for one worker/tab/process lifetime. */
  readonly ownerId: string;
}

export interface SideEffectRunOptions<TResult, TDiagnostic = unknown> {
  readonly key: string;
  readonly fingerprint: string;
  readonly leaseMs?: number;
  readonly signal?: AbortSignal;
  /** Optional bounded diagnostic retained when cancellation wins the race. */
  readonly abortDiagnostic?: TDiagnostic;
  readonly execute: (
    context: SideEffectExecutionContext
  ) => Promise<SideEffectOutcome<TResult, TDiagnostic>>;
  /** Classify a thrown adapter error. The default is `unknown`. */
  readonly onError?: (
    error: unknown,
    context: SideEffectExecutionContext
  ) => SideEffectOutcome<TResult, TDiagnostic> | Promise<SideEffectOutcome<TResult, TDiagnostic>>;
}

export interface SideEffectRecoveryOptions {
  readonly expectedFence?: DurableOperationFence;
  /** Optional audit identity; defaults to the runner owner. */
  readonly reconcilerId?: string;
}

export interface DurableSideEffectRunner<TResult, TDiagnostic = unknown> {
  run(
    options: SideEffectRunOptions<TResult, TDiagnostic>
  ): Promise<SideEffectRunResult<TResult, TDiagnostic>>;
  recover(
    key: string,
    resolver: SideEffectResolver<TResult, TDiagnostic>,
    options?: SideEffectRecoveryOptions
  ): Promise<SideEffectRecoveryResult<TResult, TDiagnostic>>;
  get(
    key: string
  ): Promise<DurableOperationRecord<SideEffectRecordPayload<TResult, TDiagnostic>> | undefined>;
}

function assertText(value: string, label: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`${label} must be a non-empty string.`);
  }
}

function reasonFromError(error: unknown): string {
  const reason = error instanceof Error ? error.message : String(error);
  const normalized = reason.trim();
  if (normalized.length === 0) return 'side-effect adapter threw without a reason';
  return normalized.slice(0, 512);
}

function payloadForOutcome<TResult, TDiagnostic>(
  outcome: SideEffectOutcome<TResult, TDiagnostic>
): SideEffectRecordPayload<TResult, TDiagnostic> | undefined {
  if (outcome.state === 'completed') return { result: outcome.result };
  if (outcome.state === 'failed') {
    return {
      ...(outcome.result === undefined ? {} : { result: outcome.result }),
      ...(outcome.diagnostic === undefined ? {} : { diagnostic: outcome.diagnostic }),
    };
  }
  return outcome.diagnostic === undefined ? undefined : { diagnostic: outcome.diagnostic };
}

function runResultFromRecord<TResult, TDiagnostic>(
  state: SideEffectRunState,
  operation: DurableOperationRecord<SideEffectRecordPayload<TResult, TDiagnostic>>
): SideEffectRunResult<TResult, TDiagnostic> {
  return {
    state,
    operation,
    ...(operation.result?.result === undefined ? {} : { result: operation.result.result }),
    ...(operation.result?.diagnostic === undefined
      ? {}
      : { diagnostic: operation.result.diagnostic }),
    ...(operation.reason === undefined ? {} : { reason: operation.reason }),
  };
}

function recoveryResultFromRecord<TResult, TDiagnostic>(
  state: SideEffectRecoveryState,
  operation: DurableOperationRecord<SideEffectRecordPayload<TResult, TDiagnostic>>
): SideEffectRecoveryResult<TResult, TDiagnostic> {
  return {
    state,
    operation,
    ...(operation.result?.result === undefined ? {} : { result: operation.result.result }),
    ...(operation.result?.diagnostic === undefined
      ? {}
      : { diagnostic: operation.result.diagnostic }),
    ...(operation.reason === undefined ? {} : { reason: operation.reason }),
  };
}

function validateOutcome<TResult, TDiagnostic>(
  outcome: SideEffectOutcome<TResult, TDiagnostic>
): void {
  if (!outcome || typeof outcome !== 'object') {
    throw new TypeError('Side-effect adapter must return a tagged outcome.');
  }
  if (outcome.state !== 'completed' && outcome.state !== 'failed' && outcome.state !== 'unknown') {
    throw new TypeError('Side-effect adapter returned an invalid outcome state.');
  }
  if ((outcome.state === 'failed' || outcome.state === 'unknown') &&
      (typeof outcome.reason !== 'string' || outcome.reason.trim().length === 0)) {
    throw new TypeError('Side-effect failed/unknown outcomes require a reason.');
  }
}

async function classifyError<TResult, TDiagnostic>(
  error: unknown,
  context: SideEffectExecutionContext,
  onError:
    | SideEffectRunOptions<TResult, TDiagnostic>['onError']
    | undefined
): Promise<SideEffectOutcome<TResult, TDiagnostic>> {
  if (!onError) return { state: 'unknown', reason: reasonFromError(error) };
  try {
    return await onError(error, context);
  } catch (classificationError) {
    return {
      state: 'unknown',
      reason: `side-effect error classification failed: ${reasonFromError(classificationError)}`,
    };
  }
}

function outcomeFromClaim<TResult, TDiagnostic>(
  claim: DurableOperationClaim<SideEffectRecordPayload<TResult, TDiagnostic>>
): SideEffectRunResult<TResult, TDiagnostic> | undefined {
  switch (claim.status) {
    case 'replay':
      return runResultFromRecord('replayed', claim.record);
    case 'pending':
      return runResultFromRecord('pending', claim.record);
    case 'unknown':
      return runResultFromRecord('unknown', claim.record);
    case 'conflict':
      return runResultFromRecord('conflict', claim.record);
    case 'owner':
      return undefined;
  }
}

/**
 * Execute an external side effect behind an existing durable operation store.
 *
 * This helper owns only claim/execute/transition orchestration. It does not
 * persist a second state machine and it never retries an ambiguous effect.
 */
export function createDurableSideEffectRunner<TResult, TDiagnostic = unknown>(
  options: DurableSideEffectRunnerOptions<TResult, TDiagnostic>
): DurableSideEffectRunner<TResult, TDiagnostic> {
  if (!options?.store) {
    throw new TypeError('A durable operation store is required.');
  }
  if (!hasDurableOperationFencingCapability(options.store)) {
    throw new TypeError(
      'A durable operation store with incarnation-revision fencing is required.'
    );
  }
  assertText(options.ownerId, 'Side-effect ownerId');

  const run = async (
    input: SideEffectRunOptions<TResult, TDiagnostic>
  ): Promise<SideEffectRunResult<TResult, TDiagnostic>> => {
    assertText(input.key, 'Side-effect key');
    assertText(input.fingerprint, 'Side-effect fingerprint');
    if (typeof input.execute !== 'function') {
      throw new TypeError('Side-effect execute must be a function.');
    }
    if (input.signal?.aborted) {
      return { state: 'cancelled', reason: 'side-effect was cancelled before claim' };
    }

    const claim = await options.store.claim(input.key, input.fingerprint, options.ownerId, {
      ...(input.leaseMs === undefined ? {} : { leaseMs: input.leaseMs }),
    });
    if (input.signal?.aborted) {
      return {
        state: 'cancelled',
        operation: claim.record,
        reason: 'side-effect was cancelled before execution',
      };
    }
    const existing = outcomeFromClaim(claim);
    if (existing) return existing;

    const context: SideEffectExecutionContext = {
      key: input.key,
      fingerprint: input.fingerprint,
      ownerId: options.ownerId,
      ...(input.signal === undefined ? {} : { signal: input.signal }),
    };
    const executePromise = Promise.resolve().then(() => input.execute(context));
    let outcome: SideEffectOutcome<TResult, TDiagnostic>;

    if (!input.signal) {
      try {
        outcome = await executePromise;
      } catch (error) {
        outcome = await classifyError(error, context, input.onError);
      }
    } else {
      let abortHandler: (() => void) | undefined;
      const abortPromise = new Promise<{ readonly aborted: true }>((resolve) => {
        const onAbort = () => resolve({ aborted: true });
        abortHandler = onAbort;
        input.signal!.addEventListener('abort', onAbort, { once: true });
        if (input.signal!.aborted) onAbort();
      });
      const settled = await Promise.race([
        executePromise.then(
          value => ({ value } as const),
          error => ({ error } as const)
        ),
        abortPromise,
      ]);
      if (abortHandler) input.signal.removeEventListener('abort', abortHandler);
      if ('aborted' in settled) {
        // The adapter may ignore AbortSignal. Keep its Promise observed so a
        // late rejection cannot become an unhandled rejection, but do not
        // wait for it or guess that the external effect was not applied.
        void executePromise.catch(() => undefined);
        const operation = await options.store.markUnknown(
          input.key,
          options.ownerId,
          'side-effect caller cancelled while execution was in flight',
          input.abortDiagnostic === undefined ? undefined : { diagnostic: input.abortDiagnostic },
          claim.fence
        );
        return runResultFromRecord('unknown', operation);
      }
      if ('error' in settled) {
        outcome = await classifyError(settled.error, context, input.onError);
      } else {
        outcome = settled.value;
      }
    }

    try {
      validateOutcome(outcome);
    } catch (error) {
      const operation = await options.store.markUnknown(
        input.key,
        options.ownerId,
        `side-effect adapter returned an invalid outcome: ${reasonFromError(error)}`,
        undefined,
        claim.fence
      );
      return runResultFromRecord('unknown', operation);
    }
    const payload = payloadForOutcome(outcome);
    if (outcome.state === 'completed') {
      const operation = await options.store.complete(
        input.key,
        options.ownerId,
        payload ?? {},
        claim.fence
      );
      return runResultFromRecord('completed', operation);
    }
    if (outcome.state === 'failed') {
      const operation = await options.store.fail(
        input.key,
        options.ownerId,
        outcome.reason,
        payload,
        claim.fence
      );
      return runResultFromRecord('failed', operation);
    }
    const operation = await options.store.markUnknown(
      input.key,
      options.ownerId,
      outcome.reason,
      payload,
      claim.fence
    );
    return runResultFromRecord('unknown', operation);
  };

  const recover = async (
    key: string,
    resolver: SideEffectResolver<TResult, TDiagnostic>,
    recoveryOptions: SideEffectRecoveryOptions = {}
  ): Promise<SideEffectRecoveryResult<TResult, TDiagnostic>> => {
    assertText(key, 'Side-effect key');
    if (typeof resolver !== 'function') throw new TypeError('Side-effect resolver must be a function.');
    const operation = await options.store.get(key);
    if (!operation) return { state: 'missing' };
    if (operation.state !== 'unknown') {
      return recoveryResultFromRecord(operation.state, operation);
    }
    if (recoveryOptions.expectedFence && (
      recoveryOptions.expectedFence.incarnation !== operation.incarnation ||
      recoveryOptions.expectedFence.revision !== operation.revision
    )) {
      throw new Error(`Durable operation "${key}" fence is stale.`);
    }
    const resolution = await resolver({
      operation,
      ...(operation.result?.result === undefined ? {} : { result: operation.result.result }),
      ...(operation.result?.diagnostic === undefined
        ? {}
        : { diagnostic: operation.result.diagnostic }),
    });
    const storedResolution: DurableOperationResolution<
      SideEffectRecordPayload<TResult, TDiagnostic>
    > = resolution.state === 'completed'
      ? {
          state: 'completed',
          result: {
            result: resolution.result,
            ...(resolution.diagnostic === undefined
              ? {}
              : { diagnostic: resolution.diagnostic }),
          },
          ...(resolution.reason === undefined ? {} : { reason: resolution.reason }),
        }
      : {
          state: 'failed',
          reason: resolution.reason,
          ...(resolution.result === undefined && resolution.diagnostic === undefined
            ? {}
            : {
                result: {
                  ...(resolution.result === undefined ? {} : { result: resolution.result }),
                  ...(resolution.diagnostic === undefined
                    ? {}
                    : { diagnostic: resolution.diagnostic }),
                },
              }),
        };
    const reconciled = await options.store.resolveUnknown(
      key,
      recoveryOptions.reconcilerId ?? options.ownerId,
      storedResolution,
      recoveryOptions.expectedFence ?? {
        incarnation: operation.incarnation,
        revision: operation.revision,
      }
    );
    return recoveryResultFromRecord('resolved', reconciled);
  };

  return {
    run,
    recover,
    get: async key => {
      assertText(key, 'Side-effect key');
      return options.store.get(key);
    },
  };
}
