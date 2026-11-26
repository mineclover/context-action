import type {
  RefOperation,
  RefOperationOptions,
  RefOperationResult,
  RefTarget,
} from './types';

/** Internal resources owned by one Ref Provider entry. */
export interface InternalRefState<T> {
  target: T | null;
  isMounted: boolean;
  mountPromise: Promise<T> | null;
  mountResolvers: Set<(target: T) => void>;
  mountRejectors: Set<(error: Error) => void>;
  operationInProgress: boolean;
  listeners: Set<() => void>;
  mountCallbacks: Set<(target: T) => void>;
  disposed?: boolean;
  disposalListeners?: Set<(error: Error) => void>;
  pendingMounts?: Set<Promise<T>>;
  operationTail?: Promise<void>;
}

export function refDisposedError(): Error {
  return new Error('Context provider unmounted');
}

export function refAbortError(signal: AbortSignal): Error {
  return signal.reason instanceof Error ? signal.reason : new Error('Operation aborted');
}

export function onRefDisposed<T>(state: InternalRefState<T>, listener: (error: Error) => void): () => void {
  if (state.disposed) {
    listener(refDisposedError());
    return () => {};
  }
  (state.disposalListeners ??= new Set()).add(listener);
  return () => { state.disposalListeners?.delete(listener); };
}

export function disposeRefState<T>(state: InternalRefState<T>): void {
  if (state.disposed) return;
  state.disposed = true;
  const error = refDisposedError();
  for (const reject of [...state.mountRejectors]) reject(error);
  for (const listener of [...(state.disposalListeners ?? [])]) listener(error);
  state.mountResolvers.clear();
  state.mountRejectors.clear();
  state.pendingMounts?.clear();
  state.disposalListeners?.clear();
  state.mountPromise = null;
  state.mountCallbacks.clear();
  state.listeners.clear();
  state.target = null;
  state.isMounted = false;
}

/** Each waiter owns its deadline and abort subscription. A timeout must never
 * reject another caller's wait or leave its resolver in the shared ref state. */
export function waitForRefMount<T>(
  state: InternalRefState<T>,
  name: string,
  timeout?: number,
  signal?: AbortSignal,
): Promise<T> {
  if (state.disposed || signal?.aborted) {
    const rejected = Promise.reject<T>(state.disposed ? refDisposedError() : refAbortError(signal!));
    void rejected.catch(() => {});
    return rejected;
  }
  if (state.isMounted && state.target !== null) return Promise.resolve(state.target);

  let resolve!: (target: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((onResolve, onReject) => { resolve = onResolve; reject = onReject; });
  let settled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let removeDisposal = () => {};
  const cleanup = () => {
    const wasWaiting = !state.isMounted && state.mountPromise !== null;
    if (timer !== undefined) clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
    removeDisposal();
    state.mountResolvers.delete(onMount);
    state.mountRejectors.delete(onError);
    state.pendingMounts?.delete(promise);
    state.mountPromise = state.pendingMounts?.values().next().value ?? null;
    if (wasWaiting && state.mountPromise === null && !state.disposed) {
      for (const listener of [...state.listeners]) listener();
    }
  };
  const onMount = (target: T) => {
    if (settled) return;
    settled = true;
    cleanup();
    resolve(target);
  };
  const onError = (error: Error) => {
    if (settled) return;
    settled = true;
    cleanup();
    reject(error);
  };
  const onAbort = () => { onError(refAbortError(signal!)); };

  const wasWaiting = state.mountPromise !== null;
  (state.pendingMounts ??= new Set()).add(promise);
  state.mountPromise ??= promise;
  state.mountResolvers.add(onMount);
  state.mountRejectors.add(onError);
  if (timeout !== undefined) {
    timer = setTimeout(() => onError(new Error(`Mount timeout after ${timeout}ms for ref '${name}'`)), timeout);
  }
  signal?.addEventListener('abort', onAbort, { once: true });
  removeDisposal = onRefDisposed(state, onError);
  void promise.catch(() => {});
  if (!wasWaiting && !settled) {
    for (const listener of [...state.listeners]) listener();
  }
  return promise;
}

export function createInitialRefState<T>(): InternalRefState<T> {
  return {
    target: null,
    isMounted: false,
    mountPromise: null,
    mountResolvers: new Set(),
    mountRejectors: new Set(),
    operationInProgress: false,
    listeners: new Set(),
    mountCallbacks: new Set(),
  };
}

export function getOrCreateRefState<T>(
  refsMap: Map<string, InternalRefState<T>>,
  refName: string,
): InternalRefState<T> {
  let entry = refsMap.get(refName);
  if (!entry) {
    entry = createInitialRefState<T>();
    refsMap.set(refName, entry);
  }
  return entry;
}

export async function executeRefOperation<T, Result>(
  refState: InternalRefState<T>,
  operation: RefOperation<T & RefTarget, Result>,
  options?: RefOperationOptions,
): Promise<RefOperationResult<Result>> {
  const controller = new AbortController();
  const externalSignal = options?.signal;
  const forwardAbort = () => controller.abort(refAbortError(externalSignal!));
  if (externalSignal?.aborted) forwardAbort();
  else externalSignal?.addEventListener('abort', forwardAbort, { once: true });
  const removeDisposal = onRefDisposed(refState, error => controller.abort(error));
  let startedAt: number | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let rejectAbort!: (error: Error) => void;
  const aborted = new Promise<never>((_, reject) => { rejectAbort = reject; });
  const onAbort = () => {
    if (timer !== undefined) clearTimeout(timer);
    rejectAbort(refAbortError(controller.signal));
  };
  controller.signal.addEventListener('abort', onAbort, { once: true });
  if (controller.signal.aborted) onAbort();

  try {
    if (controller.signal.aborted) throw refAbortError(controller.signal);
    const execution = (refState.operationTail ?? Promise.resolve()).then(async () => {
      // Re-read the target after earlier operations settle. A queued operation
      // must not retain an obsolete target or run after cancellation/disposal.
      const target = await waitForRefMount(refState, 'operation', undefined, controller.signal);
      if (controller.signal.aborted) throw refAbortError(controller.signal);
      refState.operationInProgress = true;
      startedAt = Date.now();
      if (options?.timeout) {
        timer = setTimeout(() => controller.abort(new Error('Operation timed out')), options.timeout);
      }
      try {
        return await operation(target as T & RefTarget, { ...options, signal: controller.signal });
      } finally {
        // A timed-out/non-cooperative operation still owns the serialization
        // slot until its actual promise settles; JavaScript cannot force-stop it.
        refState.operationInProgress = false;
        if (timer !== undefined) clearTimeout(timer);
      }
    });
    refState.operationTail = execution.then(() => undefined, () => undefined);
    const result = await Promise.race([execution, aborted]);
    return { success: true, result, duration: Date.now() - startedAt!, timestamp: Date.now() };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
      ...(startedAt !== undefined && { duration: Date.now() - startedAt }),
      timestamp: Date.now(),
    };
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    externalSignal?.removeEventListener('abort', forwardAbort);
    controller.signal.removeEventListener('abort', onAbort);
    removeDisposal();
    void aborted.catch(() => {});
  }
}

export function runIfRefMounted<T, Result>(
  refState: InternalRefState<T>,
  operation: (target: T & RefTarget) => Result,
): Result | null {
  if (!refState.disposed && refState.isMounted && refState.target !== null) {
    try {
      return operation(refState.target);
    } catch (error) {
      console.error('Error in executeIfMounted:', error);
    }
  }
  return null;
}
