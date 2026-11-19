export interface SyncGuardController<TPayload = unknown> {
  abort(reason?: string): void;
  modifyPayload(updater: TPayload | ((prev: TPayload) => TPayload)): void;
  getPayload(): TPayload;
}

export interface SyncResultController<TPayload = unknown, TResult = unknown>
  extends SyncGuardController<TPayload> {
  setResult(value: TResult): void;
  getResult(): TResult | undefined;
}

export interface SyncObserverMeta<TResult = unknown> {
  readonly success: boolean;
  readonly aborted: boolean;
  readonly abortReason?: string | undefined;
  readonly result: TResult | undefined;
  readonly errors: readonly unknown[];
}

export interface SyncDispatchOutcome<TPayload = unknown, TResult = unknown> {
  readonly success: boolean;
  readonly aborted: boolean;
  readonly abortReason?: string | undefined;
  readonly payload: TPayload;
  readonly result: TResult | undefined;
  readonly errors: readonly unknown[];
}

export interface SyncHandlerConfig {
  readonly priority?: number;
  readonly id?: string;
  readonly once?: boolean;
}

export interface SyncObserverConfig extends SyncHandlerConfig {
  readonly when?: 'success' | 'failure' | 'always';
}

export interface SyncActionPipeline<
  TActions extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly name: string;
  registerGuard<K extends keyof TActions & string>(
    action: K,
    handler: (payload: TActions[K], controller: SyncGuardController<TActions[K]>) => void,
    config?: SyncHandlerConfig,
  ): () => void;
  register<K extends keyof TActions & string, TResult = unknown>(
    action: K,
    handler: (
      payload: TActions[K],
      controller: SyncResultController<TActions[K], TResult>,
    ) => TResult | undefined,
    config?: SyncHandlerConfig,
  ): () => void;
  registerObserver<K extends keyof TActions & string, TResult = unknown>(
    action: K,
    handler: (payload: TActions[K], meta: SyncObserverMeta<TResult>) => void,
    config?: SyncObserverConfig,
  ): () => void;
  dispatch<K extends keyof TActions & string, TResult = unknown>(
    action: K,
    payload?: TActions[K],
  ): SyncDispatchOutcome<TActions[K], TResult>;
  destroy(): void;
}

interface InternalEntry {
  readonly id: string;
  readonly seq: number;
  readonly priority: number;
  readonly when: 'success' | 'failure' | 'always';
  readonly once: boolean;
  // biome-ignore lint/suspicious/noExplicitAny: heterogeneous typed handler registry.
  readonly handler: (...args: any[]) => unknown;
}

export function createSyncActionPipeline<
  TActions extends Record<string, unknown> = Record<string, unknown>,
>(name: string): SyncActionPipeline<TActions> {
  const guards = new Map<string, InternalEntry[]>();
  const handlers = new Map<string, InternalEntry[]>();
  const observers = new Map<string, InternalEntry[]>();
  let nextSeq = 1;
  let destroyed = false;

  function addEntry(
    phaseMap: Map<string, InternalEntry[]>,
    action: string,
    // biome-ignore lint/suspicious/noExplicitAny: heterogeneous typed handler registry.
    handler: (...args: any[]) => unknown,
    config: SyncObserverConfig = {},
  ): () => void {
    if (destroyed) throw new Error(`SyncActionPipeline '${name}' is destroyed`);
    if (typeof handler !== 'function') throw new TypeError('Handler must be a function');
    const bucket = phaseMap.get(action) ?? [];
    const entry: InternalEntry = {
      id: config.id ?? `${action}-${nextSeq}`,
      seq: nextSeq++,
      priority: config.priority ?? 0,
      when: config.when ?? 'success',
      once: Boolean(config.once),
      handler,
    };
    const next = [...bucket, entry].sort(
      (a, b) => b.priority - a.priority || a.seq - b.seq,
    );
    phaseMap.set(action, next);
    return () => {
      const current = phaseMap.get(action);
      if (!current) return;
      phaseMap.set(
        action,
        current.filter(item => item !== entry),
      );
    };
  }

  function consumeOnce(
    phaseMap: Map<string, InternalEntry[]>,
    action: string,
    entry: InternalEntry,
  ): void {
    if (!entry.once) return;
    const list = phaseMap.get(action);
    if (list) {
      phaseMap.set(
        action,
        list.filter(item => item !== entry),
      );
    }
  }

  return {
    name,
    registerGuard(action, handler, config) {
      return addEntry(guards, action, handler, config);
    },
    register(action, handler, config) {
      return addEntry(handlers, action, handler, config);
    },
    registerObserver(action, handler, config) {
      return addEntry(observers, action, handler, config);
    },
    dispatch<K extends keyof TActions & string, TResult = unknown>(
      action: K,
      initialPayload?: TActions[K],
    ): SyncDispatchOutcome<TActions[K], TResult> {
      if (destroyed) throw new Error(`SyncActionPipeline '${name}' is destroyed`);
      let currentPayload = initialPayload as TActions[K];
      let aborted = false;
      let abortReason: string | undefined;
      let result: TResult | undefined;
      const errors: unknown[] = [];

      // Phase 1: Guards (admission checks & payload modifiers)
      for (const entry of [...(guards.get(action) ?? [])]) {
        consumeOnce(guards, action, entry);
        let entryAborted = false;
        const guardController: SyncGuardController<TActions[K]> = {
          abort(reason?: string) {
            aborted = true;
            entryAborted = true;
            abortReason = reason;
          },
          modifyPayload(updater) {
            currentPayload =
              typeof updater === 'function'
                ? (updater as (prev: TActions[K]) => TActions[K])(currentPayload)
                : updater;
          },
          getPayload() {
            return currentPayload;
          },
        };
        try {
          entry.handler(currentPayload, guardController);
        } catch (error) {
          aborted = true;
          abortReason = error instanceof Error ? error.message : String(error);
          errors.push(error);
        }
        if (aborted || entryAborted) break;
      }

      // Phase 2: Execution handlers
      if (!aborted) {
        for (const entry of [...(handlers.get(action) ?? [])]) {
          consumeOnce(handlers, action, entry);
          const execController: SyncResultController<TActions[K], TResult> = {
            abort(reason?: string) {
              aborted = true;
              abortReason = reason;
            },
            modifyPayload(updater) {
              currentPayload =
                typeof updater === 'function'
                  ? (updater as (prev: TActions[K]) => TActions[K])(currentPayload)
                  : updater;
            },
            getPayload() {
              return currentPayload;
            },
            setResult(value: TResult) {
              result = value;
            },
            getResult() {
              return result;
            },
          };
          try {
            const ret = entry.handler(currentPayload, execController);
            if (ret !== undefined) result = ret as TResult;
          } catch (error) {
            errors.push(error);
            break;
          }
          if (aborted) break;
        }
      }

      const success = !aborted && errors.length === 0;

      // Phase 3: Observers
      for (const entry of [...(observers.get(action) ?? [])]) {
        consumeOnce(observers, action, entry);
        if (entry.when === 'success' && !success) continue;
        if (entry.when === 'failure' && success) continue;
        try {
          entry.handler(currentPayload, {
            success,
            aborted,
            abortReason,
            result,
            errors: [...errors],
          });
        } catch {
          // Observer errors do not invalidate prior committed results.
        }
      }

      return {
        success,
        aborted,
        abortReason,
        payload: currentPayload,
        result,
        errors,
      };
    },
    destroy() {
      destroyed = true;
      guards.clear();
      handlers.clear();
      observers.clear();
    },
  };
}
