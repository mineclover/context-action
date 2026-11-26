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

const EMPTY_ERRORS: readonly unknown[] = Object.freeze([]);

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
      let errors: unknown[] | undefined;

      // Phase 1: Guards (admission checks & payload modifiers)
      // addEntry / unregister / consumeOnce replace bucket arrays via copy-on-write,
      // so iterating the captured array reference is snapshot-safe with zero copies.
      const guardList = guards.get(action);
      if (guardList && guardList.length > 0) {
        const guardController: SyncGuardController<TActions[K]> = {
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
        };
        for (let i = 0; i < guardList.length; i++) {
          const entry = guardList[i]!;
          if (entry.once) consumeOnce(guards, action, entry);
          try {
            entry.handler(currentPayload, guardController);
          } catch (error) {
            aborted = true;
            abortReason = error instanceof Error ? error.message : String(error);
            if (!errors) errors = [];
            errors.push(error);
          }
          if (aborted) break;
        }
      }

      // Phase 2: Execution handlers
      if (!aborted) {
        const handlerList = handlers.get(action);
        if (handlerList && handlerList.length > 0) {
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
          for (let i = 0; i < handlerList.length; i++) {
            const entry = handlerList[i]!;
            if (entry.once) consumeOnce(handlers, action, entry);
            try {
              const ret = entry.handler(currentPayload, execController);
              if (ret !== undefined) result = ret as TResult;
            } catch (error) {
              if (!errors) errors = [];
              errors.push(error);
              break;
            }
            if (aborted) break;
          }
        }
      }

      const success = !aborted && !errors;

      // Phase 3: Observers
      const observerList = observers.get(action);
      if (observerList && observerList.length > 0) {
        for (let i = 0; i < observerList.length; i++) {
          const entry = observerList[i]!;
          if (entry.when === 'success' && !success) continue;
          if (entry.when === 'failure' && success) continue;
          if (entry.once) consumeOnce(observers, action, entry);
          try {
            entry.handler(currentPayload, {
              success,
              aborted,
              abortReason,
              result,
              errors: errors ? [...errors] : EMPTY_ERRORS,
            });
          } catch {
            // Observer errors do not invalidate prior committed results.
          }
        }
      }

      return {
        success,
        aborted,
        abortReason,
        payload: currentPayload,
        result,
        errors: errors ?? EMPTY_ERRORS,
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
