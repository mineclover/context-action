import type {
  DurableSideEffectRunner,
  SideEffectExecutionContext,
  SideEffectOutcome,
  SideEffectRunResult,
  SideEffectRunOptions,
} from './side-effect.js';

/** Injected queue publish/enqueue boundary. */
export type QueueSideEffectEnqueue<TMessage, TAcknowledgement> = (
  message: TMessage,
  context: SideEffectExecutionContext
) => TAcknowledgement | Promise<TAcknowledgement>;

/** Provider-owned acknowledgement classifier for a queue publish. */
export type QueueSideEffectAcknowledgementHandler<
  TAcknowledgement,
  TResult,
  TDiagnostic = unknown
> = (
  acknowledgement: TAcknowledgement,
  context: SideEffectExecutionContext
) => SideEffectOutcome<TResult, TDiagnostic> | Promise<SideEffectOutcome<TResult, TDiagnostic>>;

export interface QueueSideEffectRunOptions<
  TMessage,
  TAcknowledgement,
  TResult,
  TDiagnostic = unknown
> extends Omit<SideEffectRunOptions<TResult, TDiagnostic>, 'execute' | 'onError'> {
  /** Existing durable runner; this bridge does not create another store. */
  readonly runner: DurableSideEffectRunner<TResult, TDiagnostic>;
  /** Message passed to the injected queue publisher. */
  readonly message: TMessage;
  /** Queue SDK or transport enqueue function. */
  readonly enqueue: QueueSideEffectEnqueue<TMessage, TAcknowledgement>;
  /** Provider-specific acknowledgement classification. */
  readonly onAcknowledgement: QueueSideEffectAcknowledgementHandler<
    TAcknowledgement,
    TResult,
    TDiagnostic
  >;
  /** Optional classification for errors known to happen before enqueue. */
  readonly onError?: SideEffectRunOptions<TResult, TDiagnostic>['onError'];
}

/**
 * Publish one queue message through an existing durable side-effect runner.
 *
 * Queue acknowledgement semantics are provider-owned: an acknowledgement may
 * be authoritative `completed`, a confirmed pre-enqueue rejection `failed`,
 * or ambiguous `unknown`. This helper never retries or infers completion from
 * an SDK return shape; the runner owns claim, replay, unknown, and recovery.
 */
export function runQueueSideEffect<
  TMessage,
  TAcknowledgement,
  TResult,
  TDiagnostic = unknown
>(
  options: QueueSideEffectRunOptions<TMessage, TAcknowledgement, TResult, TDiagnostic>
): Promise<SideEffectRunResult<TResult, TDiagnostic>> {
  if (!options?.runner || typeof options.runner.run !== 'function') {
    throw new TypeError('A queue side-effect durable runner is required.');
  }
  if (typeof options.enqueue !== 'function') {
    throw new TypeError('Queue side-effect enqueue must be a function.');
  }
  if (typeof options.onAcknowledgement !== 'function') {
    throw new TypeError('Queue side-effect onAcknowledgement must be a function.');
  }

  return options.runner.run({
    key: options.key,
    fingerprint: options.fingerprint,
    ...(options.leaseMs === undefined ? {} : { leaseMs: options.leaseMs }),
    ...(options.signal === undefined ? {} : { signal: options.signal }),
    ...(options.abortDiagnostic === undefined
      ? {}
      : { abortDiagnostic: options.abortDiagnostic }),
    execute: async context => {
      const acknowledgement = await options.enqueue(options.message, context);
      return options.onAcknowledgement(acknowledgement, context);
    },
    ...(options.onError === undefined ? {} : { onError: options.onError }),
  });
}
