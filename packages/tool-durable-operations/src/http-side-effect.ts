import type {
  DurableSideEffectRunner,
  SideEffectExecutionContext,
  SideEffectOutcome,
  SideEffectRunResult,
  SideEffectRunOptions,
} from './side-effect.js';

/**
 * The application-owned response classification for an HTTP mutation.
 *
 * HTTP status alone is not a universal exactly-once signal: a provider may
 * return a 5xx after applying a mutation. The response handler must therefore
 * classify the provider's authoritative acknowledgement as `completed`, a
 * confirmed pre-effect rejection as `failed`, or an ambiguous response as
 * `unknown`.
 */
export type HttpSideEffectResponseHandler<TResult, TDiagnostic = unknown> = (
  response: Response,
  context: SideEffectExecutionContext
) =>
  | SideEffectOutcome<TResult, TDiagnostic>
  | Promise<SideEffectOutcome<TResult, TDiagnostic>>;

export type HttpSideEffectRequest = (
  context: SideEffectExecutionContext
) => Response | Promise<Response>;

export interface HttpSideEffectRunOptions<TResult, TDiagnostic = unknown>
  extends Omit<
    SideEffectRunOptions<TResult, TDiagnostic>,
    'execute' | 'onError'
  > {
  /** Existing durable runner; this adapter does not create another store. */
  readonly runner: DurableSideEffectRunner<TResult, TDiagnostic>;
  /** Injected fetch/request function so browser, server, and test transports share the contract. */
  readonly request: HttpSideEffectRequest;
  /** Provider-specific authoritative response classification. */
  readonly onResponse: HttpSideEffectResponseHandler<TResult, TDiagnostic>;
  /** Optional classification for errors known to have happened before transmission. */
  readonly onError?: SideEffectRunOptions<TResult, TDiagnostic>['onError'];
}

/**
 * Execute one HTTP mutation through an existing durable side-effect runner.
 *
 * The helper deliberately does not infer `failed` from a non-2xx response and
 * does not retry. A request error defaults to the runner's `unknown` outcome;
 * callers may classify a provider-confirmed pre-send rejection with `onError`.
 * The same key/fingerprint is replayed by the underlying runner and an abort
 * that wins while the request is in flight is retained as `unknown`.
 */
export function runHttpSideEffect<TResult, TDiagnostic = unknown>(
  options: HttpSideEffectRunOptions<TResult, TDiagnostic>
): Promise<SideEffectRunResult<TResult, TDiagnostic>> {
  if (!options?.runner || typeof options.runner.run !== 'function') {
    throw new TypeError('An HTTP side-effect durable runner is required.');
  }
  if (typeof options.request !== 'function') {
    throw new TypeError('HTTP side-effect request must be a function.');
  }
  if (typeof options.onResponse !== 'function') {
    throw new TypeError('HTTP side-effect onResponse must be a function.');
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
      const response = await options.request(context);
      return options.onResponse(response, context);
    },
    ...(options.onError === undefined ? {} : { onError: options.onError }),
  });
}
