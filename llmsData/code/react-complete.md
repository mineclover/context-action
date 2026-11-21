# Context-Action React Package - Complete Code

Total Files: 53
Total Lines: 8849

## Type Definitions

### actions/ActionContext.types.ts

```typescript
import {
  ActionCommandHandler,
  ActionNames,
  ActionRegister,
  ActionRegisterConfig,
  ActionEffectHandler,
  ActionGuardHandler,
  ActionObserverHandler,
  CommandConfig,
  ObserverConfig,
  ActionResult,
  ActionResultHandler,
  ActionResultMap,
  ActionPayloadMap,
  HandlerConfig,
  EffectConfig,
  GuardConfig,
  PipelineController,
} from '@context-action/core';
import { ReactNode } from 'react';
export type ActionContextHandler<T, R = void> = (
  payload: T,
  controller: PipelineController<T, R>
) => R | Promise<R> | void | Promise<void>;
export interface ActionContextConfig extends Omit<ActionRegisterConfig, 'name'> {
  schema?: NonNullable<ActionRegisterConfig['registry']>['schema'];
}
export interface ActionContextType<
  T extends ActionPayloadMap,
  TResultMap extends ActionResultMap<T> = {},
> {
  actionRegisterRef: React.RefObject<ActionRegister<T, TResultMap> | null>;
  dispatchLifecycle: ProviderDispatchLifecycle;
}
export interface ProviderShutdownOptions {
  destroyRegister?: boolean;
}
export interface ActionProviderProps<
  T extends ActionPayloadMap,
  TResultMap extends ActionResultMap<T> = {},
> {
  children: ReactNode;
  register?: ActionRegister<T, TResultMap>;
  ownership?: 'shared' | 'owned';
}
export interface ProviderDispatchLifecycle {
  run<R>(
    externalSignals: Array<AbortSignal | undefined>,
    operation: (signal: AbortSignal) => Promise<R>
  ): Promise<R>;
  scheduleHandlerCleanup(cleanup: () => void): void;
  shutdown(register: ActionRegister<any, any>, options?: ProviderShutdownOptions): Promise<void>;
}
export interface ActionContextReturn<
  T extends ActionPayloadMap,
  TResultMap extends ActionResultMap<T> = {},
> {
  Provider: React.FC<ActionProviderProps<T, TResultMap>>;
  useActionContext: () => ActionContextType<T, TResultMap>;
  useActionDispatch: () => ActionRegister<T, TResultMap>['dispatch'];
  useActionHandler: <K extends ActionNames<T>, R = ActionResult<TResultMap, K>>(
    action: K,
    handler: K extends keyof TResultMap
      ? ActionResultHandler<T[K], ActionResult<TResultMap, K>>
      : ActionContextHandler<T[K], R>,
    config?: HandlerConfig<T[K]>
  ) => void;
  useActionEffectHandler: {
    <K extends ActionNames<T>>(
      action: K,
      handler: ActionGuardHandler<T[K]>,
      config: EffectConfig<T[K]> & { effectKind: 'guard' },
    ): void;
    <K extends ActionNames<T>>(
      action: K,
      handler: ActionEffectHandler<T[K]>,
      config: EffectConfig<T[K]> & { effectKind: 'observer' },
    ): void;
  };
  useActionGuard: <K extends ActionNames<T>>(
    action: K,
    handler: ActionGuardHandler<T[K]>,
    config?: GuardConfig<T[K]>
  ) => void;
  useActionCommandHandler: <K extends ActionNames<T>>(
    action: K,
    handler: ActionCommandHandler<T[K]>,
    config?: CommandConfig<T[K]>
  ) => void;
  useActionObserver: <K extends ActionNames<T>, R = ActionResult<TResultMap, K>>(
    action: K,
    handler: ActionObserverHandler<T[K], R>,
    config?: ObserverConfig<T[K]>
  ) => void;
  useActionResultHandler: <K extends ActionNames<T> & keyof TResultMap>(
    action: K,
    handler: ActionResultHandler<T[K], ActionResult<TResultMap, K>>,
    config?: HandlerConfig<T[K]>
  ) => void;
  useActionRegister: () => ActionRegister<T, TResultMap> | null;
  useActionDispatchWithResult: () => {
    dispatch: ActionRegister<T, TResultMap>['dispatch'];
    dispatchWithResult: ActionRegister<T, TResultMap>['dispatchWithResult'];
    abortAll: () => void;
    resetAbortScope: () => void;
  };
  context: React.Context<ActionContextType<T, TResultMap> | null>;
}
```

### refs/types.ts

```typescript
export type RefTarget = unknown;
export interface RefState<T extends RefTarget = RefTarget> {
  target: T | null;
  isReady: boolean;
  isMounted: boolean;
  mountPromise: Promise<T> | null;
  mountedAt?: number;
  error?: Error | null;
  metadata?: Record<string, unknown>;
}
export interface RefOperationResult<T = unknown> {
  success: boolean;
  result?: T;
  error?: Error;
  duration?: number;
  timestamp: number;
}
export interface RefOperationOptions {
  timeout?: number;
  retries?: number;
  signal?: AbortSignal;
  priority?: number;
  operationId?: string;
  metadata?: Record<string, unknown>;
}
export type RefOperation<T extends RefTarget, R = unknown> = (
  target: T,
  options?: RefOperationOptions
) => R | Promise<R>;
export interface RefInitConfig<T extends RefTarget = RefTarget> {
  name: string;
  initialMetadata?: Record<string, unknown>;
  mountTimeout?: number;
  autoCleanup?: boolean;
  validator?: (target: unknown) => target is T;
  cleanup?: (target: T) => void | Promise<void>;
}
export type RefDefinitions = Record<string, RefInitConfig<any>>;
export type InferRefTypes<T extends RefDefinitions> = {
  [K in keyof T]: T[K] extends RefInitConfig<infer R> ? R : RefTarget;
};
```

### stores/core/types.ts

```typescript
import type { DependencyList } from 'react';
export type Listener = () => void;
export type Unsubscribe = () => void;
export type Subscribe = (listener: Listener) => Unsubscribe;
export interface Snapshot<T = unknown> {
  value: T;
  name: string;
  lastUpdate: number;
  version?: number;
  isValid?: boolean;
  validationError?: string;
  metrics?: {
    creationTime: number;
    sizeEstimate?: number;
    notificationCount?: number;
  };
  security?: {
    validated: boolean;
    sanitized?: boolean;
    trustLevel?: number;
  };
}
export interface IStore<T = unknown> {
  readonly name: string;
  subscribe: Subscribe;
  getSnapshot: () => Snapshot<T>;
  setValue: (value: T, options?: StoreSetValueOptions<T>) => void;
  update: (updater: (current: T) => T | undefined) => void;
  getValue: () => T;
  getSafeValue?: () => T;
  getListenerCount?: () => number;
  dispose?: () => void;
  registerCleanup?: (task: () => void) => () => void;
  isStoreDisposed?: () => boolean;
  getMetrics?: () => StoreMetrics;
  resetMetrics?: () => void;
  setSecurityOptions?: (options: SecurityOptions) => void;
  getSecurityOptions?: () => SecurityOptions | undefined;
  notifyPath?: (path: (string | number)[]) => void;
  notifyPaths?: (paths: (string | number)[][]) => void;
}
export interface IStoreRegistry {
  readonly name: string;
  subscribe: Subscribe;
  getSnapshot: () => Array<[string, IStore]>;
  register: (name: string, store: IStore, metadata?: StoreMetadata) => void;
  unregister: (name: string) => boolean;
  getStore: (name: string) => IStore | undefined;
  getAllStores: () => Map<string, IStore>;
  hasStore: (name: string) => boolean;
  getStoreCount: () => number;
  getStoreNames: () => string[];
  clear: () => void;
  forEach: (callback: (store: IStore, name: string) => void) => void;
  dispose?: () => void;
  isDisposed?: () => boolean;
  registerCleanup?: (task: () => void) => () => void;
  getHealthStatus?: () => {
    totalStores: number;
    healthyStores: number;
    errorStores: number;
    disposedStores: number;
    memoryUsage?: number;
  };
  performHealthCheck?: () => Promise<Map<string, boolean>>;
  setSecurityOptions?: (options: SecurityOptions) => void;
  setAutoCleanup?: (enabled: boolean) => void;
}
export interface StoreSyncConfig<T, R = Snapshot<T>> {
  defaultValue?: T;
  selector?: (snapshot: Snapshot<T>) => R;
  isEqual?: (prev: R, next: R) => boolean;
  errorBoundary?: boolean;
  suspense?: boolean;
}
export interface HookOptions<T> {
  defaultValue?: T;
  onError?: (error: Error, retryCount?: number) => undefined | boolean;
  dependencies?: DependencyList;
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  enableMetrics?: boolean;
  throttle?: number;
  debounce?: number;
}
export interface StoreSetValueOptions<T> {
  skipClone?: boolean;
  skipComparison?: boolean;
  eventHandling?: 'block' | 'transform' | 'allow';
  eventTransform?: (event: unknown) => T;
  sanitizer?: (value: T) => T;
  validator?: (value: T) => boolean | string;
}
export interface StoreMetrics {
  totalSets: number;
  totalGets: number;
  totalUpdates: number;
  totalNotifications: number;
  averageOperationTime: number;
  peakListenerCount: number;
  totalErrors: number;
}
export interface SecurityOptions {
  preventPrototypePollution?: boolean;
  preventXSS?: boolean;
  maxDepth?: number;
  maxStringLength?: number;
  allowedProperties?: RegExp;
  blockedProperties?: RegExp;
}
export interface RegistryStoreMap {
  [key: string]: unknown;  
}
export interface StoreMetadata {
  registeredAt?: number;
  name?: string;
  [key: string]: unknown;
}
export interface DynamicStoreOptions<T> {
  defaultValue?: T;
  createIfNotExists?: boolean;
  onNotFound?: (storeName: string) => void;
  securityOptions?: SecurityOptions;
  autoCleanup?: boolean;
  enableMetrics?: boolean;
}
```

### tools/ToolContext.types.ts

```typescript
import type { DispatchArgs } from '@context-action/core';
import {
  ActionHandler,
  ActionRegister,
  ActionResultHandler,
  DispatchOptions,
  ExecutionResult,
  HandlerConfig,
} from '@context-action/core';
import type {
  DurableOperationRecord,
  DurableOperationResolution,
  DurableOperationFence,
  DurableOperationStore,
} from '@context-action/tool-durable-operations';
import type {
  ActionSchemaMap,
  AnthropicToolDefinition,
  InferActionPayloadMap,
  InferActionInputMap,
  InferActionResultMap,
  MCPToolDefinition,
  ModelToolCall,
  OpenAIToolDefinition,
  ToolApprovalRequestInput,
  ToolCallContext,
  ToolCallObserver,
  ToolCallOptions,
  ToolCallRequest,
  ToolCallResult,
  ToolArguments,
  ToolIdempotencyRegistryOptions,
  ToolListRequest,
  ToolListResult,
  ToolManagementInterface,
  ToolObservabilityPolicy,
} from '@context-action/tool-protocol';
import { ReactNode } from 'react';
import type { ProviderDispatchLifecycle } from '../actions/ActionContext.types';
export type ToolValidationMode = 'strict' | 'warn' | 'silent';
export type ToolPolicyDecision = 'allow' | 'ask' | 'deny';
export type ToolPolicyInput = ToolApprovalRequestInput;
export type ToolPolicy = (
  input: ToolPolicyInput
) => ToolPolicyDecision | Promise<ToolPolicyDecision>;
export type ToolOperationRecoveryResolver = (
  record: DurableOperationRecord<ToolCallResult>,
  context?: ToolCallContext
) => DurableOperationResolution<ToolCallResult> | Promise<DurableOperationResolution<ToolCallResult>>;
export interface ToolContextConfig<TSchema extends ActionSchemaMap> {
  schema: TSchema;
  validationMode?: ToolValidationMode;
  validateOnDispatch?: boolean;
  debug?: boolean;
  allowedToolNames?: readonly string[];
  toolListPageSize?: number;
  toolPolicy?: ToolPolicy;
  onToolCall?: ToolCallObserver;
  executionOwnerId?: string;
  idempotency?: ToolIdempotencyRegistryOptions;
  durableOperationStore?: DurableOperationStore<ToolCallResult>;
  durableOperationOwnerId?: string;
  durableOperationLeaseMs?: number;
  durableDiagnosticPolicy?: ToolObservabilityPolicy;
}
type ToolSchemaName<TSchema extends ActionSchemaMap> = Extract<
  keyof TSchema,
  string
>;
export type SchemaToolCallRequest<
  TSchema extends ActionSchemaMap,
  K extends ToolSchemaName<TSchema> = ToolSchemaName<TSchema>,
> = K extends ToolSchemaName<TSchema>
  ? Omit<ToolCallRequest, 'params'> & {
      readonly params: Omit<ToolCallRequest['params'], 'name' | 'arguments'> & {
        readonly name: K;
        readonly arguments?: InferActionInputMap<TSchema>[K] & ToolArguments;
      };
    }
  : never;
export type SchemaModelToolCall<
  TSchema extends ActionSchemaMap,
  K extends ToolSchemaName<TSchema> = ToolSchemaName<TSchema>,
> = K extends ToolSchemaName<TSchema>
  ? Omit<ModelToolCall, 'name' | 'arguments'> & {
      readonly name: K;
      readonly arguments?: InferActionInputMap<TSchema>[K] & ToolArguments;
    }
  : never;
export type SchemaToolCallResult<
  TSchema extends ActionSchemaMap,
  K extends ToolSchemaName<TSchema> = ToolSchemaName<TSchema>,
> = ToolCallResult<InferActionResultMap<TSchema>[K]>;
export type SchemaDurableOperationRecord<
  TSchema extends ActionSchemaMap,
  K extends ToolSchemaName<TSchema> = ToolSchemaName<TSchema>,
> = DurableOperationRecord<SchemaToolCallResult<TSchema, K>>;
export type SchemaDurableOperationResolution<
  TSchema extends ActionSchemaMap,
  K extends ToolSchemaName<TSchema> = ToolSchemaName<TSchema>,
> = DurableOperationResolution<SchemaToolCallResult<TSchema, K>>;
export type SchemaToolOperationRecoveryResolver<
  TSchema extends ActionSchemaMap,
  K extends ToolSchemaName<TSchema> = ToolSchemaName<TSchema>,
> = (
  record: SchemaDurableOperationRecord<TSchema, K>,
  context?: ToolCallContext
) =>
  | SchemaDurableOperationResolution<TSchema, K>
  | Promise<SchemaDurableOperationResolution<TSchema, K>>;
export interface ToolRegistry<TSchema extends ActionSchemaMap>
  extends ToolManagementInterface<MCPToolDefinition> {
  readonly tools: TSchema;
  getTool<K extends keyof TSchema>(name: K): TSchema[K];
  getToolNames(): (keyof TSchema)[];
  toMCP(): MCPToolDefinition[];
  toOpenAI(): OpenAIToolDefinition[];
  toAnthropic(): AnthropicToolDefinition[];
  toMCPFiltered<K extends keyof TSchema>(toolNames: K[]): MCPToolDefinition[];
  toOpenAIFiltered<K extends keyof TSchema>(toolNames: K[]): OpenAIToolDefinition[];
  toAnthropicFiltered<K extends keyof TSchema>(toolNames: K[]): AnthropicToolDefinition[];
  listTools(request?: ToolListRequest): ToolListResult<MCPToolDefinition>;
  getToolDefinition(name: string): MCPToolDefinition | undefined;
  callTool<K extends ToolSchemaName<TSchema>>(
    request: SchemaToolCallRequest<TSchema, K>,
    options?: ToolCallOptions
  ): Promise<ToolCallResult<InferActionResultMap<TSchema>[K]>>;
  callTool(
    request: ToolCallRequest,
    options?: ToolCallOptions
  ): Promise<ToolCallResult>;
  executeModelToolCall<K extends ToolSchemaName<TSchema>>(
    call: SchemaModelToolCall<TSchema, K>,
    options?: ToolCallOptions
  ): Promise<ToolCallResult<InferActionResultMap<TSchema>[K]>>;
  executeModelToolCall(
    call: ModelToolCall,
    options?: ToolCallOptions
  ): Promise<ToolCallResult>;
  getOperationStatus<K extends ToolSchemaName<TSchema>>(
    toolName: K,
    idempotencyKey: string,
    context?: ToolCallContext
  ): Promise<SchemaDurableOperationRecord<TSchema, K> | undefined>;
  getOperationStatus(
    toolName: string,
    idempotencyKey: string,
    context?: ToolCallContext
  ): Promise<DurableOperationRecord<ToolCallResult> | undefined>;
  reconcileOperation<K extends ToolSchemaName<TSchema>>(
    toolName: K,
    idempotencyKey: string,
    resolution: SchemaDurableOperationResolution<TSchema, K>,
    context?: ToolCallContext,
    expectedFence?: DurableOperationFence | number
  ): Promise<SchemaDurableOperationRecord<TSchema, K> | undefined>;
  reconcileOperation(
    toolName: string,
    idempotencyKey: string,
    resolution: DurableOperationResolution<ToolCallResult>,
    context?: ToolCallContext,
    expectedFence?: DurableOperationFence | number
  ): Promise<DurableOperationRecord<ToolCallResult> | undefined>;
  recoverOperation<K extends ToolSchemaName<TSchema>>(
    toolName: K,
    idempotencyKey: string,
    resolver: SchemaToolOperationRecoveryResolver<TSchema, K>,
    context?: ToolCallContext
  ): Promise<SchemaDurableOperationRecord<TSchema, K> | undefined>;
  recoverOperation(
    toolName: string,
    idempotencyKey: string,
    resolver: ToolOperationRecoveryResolver,
    context?: ToolCallContext
  ): Promise<DurableOperationRecord<ToolCallResult> | undefined>;
}
export interface ToolExecutionResult<R = void> extends ExecutionResult<R> {
  validationPassed: boolean;
  validationErrors?: string[];
}
export interface ToolContextType<TSchema extends ActionSchemaMap> {
  actionRegisterRef: React.RefObject<ActionRegister<InferActionPayloadMap<TSchema>> | null>;
  registry: ToolRegistry<TSchema>;
  dispatch: ToolDispatchFunction<InferActionPayloadMap<TSchema>>;
  dispatchLifecycle: ProviderDispatchLifecycle;
}
export type ToolDispatchFunction<TPayloadMap> = <K extends Extract<keyof TPayloadMap, string>>(
  toolName: K,
  payload: TPayloadMap[K],
  options?: DispatchOptions
) => Promise<void>;
export interface DirectToolCallOptions extends ToolCallOptions {
  readonly toolCallId?: ToolCallRequest['id'];
}
export type ToolCallFunction<TInputMap, TResultMap = {}> = <K extends Extract<keyof TInputMap, string>>(
  toolName: K,
  payload: TInputMap[K],
  options?: DirectToolCallOptions
) => Promise<ToolCallResult<K extends keyof TResultMap ? TResultMap[K] : unknown>>;
export interface ToolDispatchWithResultReturn<TPayloadMap> {
  dispatch: ToolDispatchFunction<TPayloadMap>;
  dispatchWithResult: <K extends Extract<keyof TPayloadMap, string>, R = void>(
    toolName: K,
    ...args: DispatchArgs<TPayloadMap[K]>
  ) => Promise<ToolExecutionResult<R>>;
  abortAll: () => void;
}
export interface ToolContextReturn<TSchema extends ActionSchemaMap> {
  Provider: React.FC<{ children: ReactNode }>;
  useToolDispatch: () => ToolDispatchFunction<InferActionPayloadMap<TSchema>>;
  useToolCall: () => ToolCallFunction<
    InferActionInputMap<TSchema>,
    InferActionResultMap<TSchema>
  >;
  useToolHandler: <K extends Extract<keyof TSchema, string>, R = void>(
    toolName: K,
    handler: ActionHandler<InferActionPayloadMap<TSchema>[K], R>,
    config?: HandlerConfig<InferActionPayloadMap<TSchema>[K]>
  ) => void;
  useToolResultHandler: <K extends Extract<keyof TSchema, string>>(
    toolName: K,
    handler: ActionResultHandler<
      InferActionPayloadMap<TSchema>[K],
      InferActionResultMap<TSchema>[K]
    >,
    config?: HandlerConfig<InferActionPayloadMap<TSchema>[K]>
  ) => void;
  useToolRegistry: () => ToolRegistry<TSchema>;
  useToolDispatchWithResult: () => ToolDispatchWithResultReturn<InferActionPayloadMap<TSchema>>;
  useActionRegister: () => ActionRegister<InferActionPayloadMap<TSchema>> | null;
  context: React.Context<ToolContextType<TSchema> | null>;
}
```

## Implementation Code

### actions/ActionContext.tsx

```typescript
import {
  ActionCommandHandler,
  ActionEffectHandler,
  ActionGuardHandler,
  ActionHandler,
  ActionNames,
  ActionObserverHandler,
  ActionPayloadMap,
  ActionRegister,
  ActionRegisterConfig,
  ActionResult,
  ActionResultHandler,
  ActionResultMap,
  CommandConfig,
  DispatchArgs,
  DispatchOptions,
  EffectConfig,
  ExecutionResult,
  GuardConfig,
  HandlerConfig,
  ObserverConfig,
} from '@context-action/core';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useId,
  useInsertionEffect,
  useMemo,
  useRef,
} from 'react';
import type {
  ActionContextConfig,
  ActionContextReturn,
  ActionContextType,
  ActionProviderProps,
  ProviderDispatchLifecycle,
  ProviderShutdownOptions,
} from './ActionContext.types';
const useInsertionCommitEffect = useInsertionEffect;
function createProviderAbortError(): Error {
  const error = new Error('Action provider unmounted');
  error.name = 'AbortError';
  return error;
}
const ABORT_GRACE_MS = 25;
function mergeAbortSignals(signals: AbortSignal[]): {
  signal: AbortSignal;
  cleanup: () => void;
} {
  if (signals.length === 1) {
    return { signal: signals[0]!, cleanup: () => {} };
  }
  if (typeof AbortSignal.any === 'function') {
    return { signal: AbortSignal.any(signals), cleanup: () => {} };
  }
  const controller = new AbortController();
  const cleanups: Array<() => void> = [];
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      break;
    }
    const forwardAbort = () => controller.abort(signal.reason);
    signal.addEventListener('abort', forwardAbort, { once: true });
    cleanups.push(() => signal.removeEventListener('abort', forwardAbort));
  }
  return {
    signal: controller.signal,
    cleanup: () => cleanups.forEach(cleanup => cleanup()),
  };
}
export class ProviderDispatchLifecycleImpl implements ProviderDispatchLifecycle {
  private accepting = true;
  private finalized = false;
  private activeOperations = new Set<Promise<unknown>>();
  private activeExposedOperations = new Set<Promise<unknown>>();
  private controllers = new Set<AbortController>();
  private pendingHandlerCleanups: Array<() => void> = [];
  private shutdownPromise: Promise<void> | null = null;
  private runHandlerCleanup(cleanup: () => void): void {
    try {
      cleanup();
    } catch (error) {
      console.error('[ContextAction] Action handler cleanup failed.', error);
    }
  }
  run<R>(
    externalSignals: Array<AbortSignal | undefined>,
    operation: (signal: AbortSignal) => Promise<R>
  ): Promise<R> {
    if (!this.accepting) {
      const rejectedPromise = Promise.reject<R>(createProviderAbortError());
      void rejectedPromise.catch(() => {});
      return rejectedPromise;
    }
    const controller = new AbortController();
    const callerSignals = externalSignals.filter(
      (candidate): candidate is AbortSignal => Boolean(candidate),
    );
    const { signal, cleanup: cleanupSignals } = mergeAbortSignals([
      controller.signal,
      ...callerSignals,
    ]);
    this.controllers.add(controller);
    let operationPromise: Promise<R>;
    try {
      operationPromise = operation(signal);
    } catch (error) {
      operationPromise = Promise.reject(error);
    }
    this.activeOperations.add(operationPromise);
    const abortPromise = new Promise<never>((_, reject) => {
      let abortHandled = false;
      let immediateAbort = false;
      let operationSettled = false;
      let abortTimer: ReturnType<typeof setTimeout> | undefined;
      const rejectOnAbort = (immediate: boolean) => {
        if (immediateAbort) return;
        if (immediate) {
          immediateAbort = true;
          abortHandled = true;
          if (abortTimer !== undefined) clearTimeout(abortTimer);
          reject(createProviderAbortError());
          return;
        }
        if (abortHandled) return;
        abortHandled = true;
        abortTimer = setTimeout(() => {
          if (!operationSettled) reject(createProviderAbortError());
        }, ABORT_GRACE_MS);
      };
      const rejectOnProviderAbort = () => rejectOnAbort(true);
      const rejectOnCallerAbort = () => rejectOnAbort(false);
      controller.signal.addEventListener('abort', rejectOnProviderAbort, { once: true });
      callerSignals.forEach((callerSignal) => {
        callerSignal.addEventListener('abort', rejectOnCallerAbort, { once: true });
      });
      const finish = () => {
        operationSettled = true;
        if (abortTimer !== undefined) clearTimeout(abortTimer);
        controller.signal.removeEventListener('abort', rejectOnProviderAbort);
        callerSignals.forEach((callerSignal) => {
          callerSignal.removeEventListener('abort', rejectOnCallerAbort);
        });
        this.controllers.delete(controller);
        this.activeOperations.delete(operationPromise);
        cleanupSignals();
      };
      void operationPromise.then(finish, finish);
      if (controller.signal.aborted) {
        rejectOnProviderAbort();
      } else if (callerSignals.some(callerSignal => callerSignal.aborted)) {
        rejectOnCallerAbort();
      }
    });
    const exposedPromise = Promise.race([operationPromise, abortPromise]);
    this.activeExposedOperations.add(exposedPromise);
    void exposedPromise.then(
      () => this.activeExposedOperations.delete(exposedPromise),
      () => this.activeExposedOperations.delete(exposedPromise),
    );
    void exposedPromise.catch(() => {});
    return exposedPromise;
  }
  scheduleHandlerCleanup(cleanup: () => void): void {
    queueMicrotask(() => {
      if (this.finalized) {
        this.runHandlerCleanup(cleanup);
      } else if (this.accepting) {
        this.runHandlerCleanup(cleanup);
      } else {
        this.pendingHandlerCleanups.push(cleanup);
      }
    });
  }
  shutdown(register: ActionRegister<any, any>, options?: ProviderShutdownOptions): Promise<void> {
    if (this.shutdownPromise) return this.shutdownPromise;
    const destroyRegister = options?.destroyRegister !== false;
    this.accepting = false;
    this.controllers.forEach(controller => {
      if (!controller.signal.aborted) controller.abort(createProviderAbortError());
    });
    const registerShutdown = destroyRegister
      ? register.destroyAsync({ deferCleanup: true })
      : Promise.resolve();
    this.shutdownPromise = Promise.allSettled([...this.activeExposedOperations])
      .then(() => undefined);
    const finalizationPromise = (async () => {
      while (this.activeOperations.size > 0) {
        await Promise.allSettled([...this.activeOperations]);
      }
      await registerShutdown;
      const pendingHandlerCleanups = this.pendingHandlerCleanups.splice(0);
      this.finalized = true;
      pendingHandlerCleanups.forEach(cleanup => this.runHandlerCleanup(cleanup));
    })();
    void finalizationPromise.catch(() => {
      const pendingHandlerCleanups = this.pendingHandlerCleanups.splice(0);
      this.finalized = true;
      pendingHandlerCleanups.forEach(cleanup => this.runHandlerCleanup(cleanup));
    });
    return this.shutdownPromise;
  }
}
export function withProviderDispatchSignal(
  options: DispatchOptions | undefined,
  signal: AbortSignal
): DispatchOptions {
  return {
    ...options,
    signal,
    ...(!options?.signal && !options?.autoAbort
      ? { autoAbort: { enabled: true, allowHandlerAbort: true } }
      : {}),
  };
}
export function createActionContext<
  T extends ActionPayloadMap,
  TResultMap extends ActionResultMap<T> = {},
>(
  contextName: string,
  config?: ActionContextConfig
): ActionContextReturn<T, TResultMap>;
export function createActionContext<
  T extends ActionPayloadMap,
  TResultMap extends ActionResultMap<T> = {},
>(
  contextName: string,
  config?: ActionContextConfig
): ActionContextReturn<T, TResultMap> {
  if (typeof contextName !== 'string' || contextName.trim().length === 0) {
    throw new TypeError(
      'createActionContext requires a non-empty context name as its first argument.'
    );
  }
  let effectiveConfig: ActionContextConfig & Pick<ActionRegisterConfig, 'name'> = {
    ...config,
    registry: {
      ...config?.registry,
      useConcurrencyQueue: config?.registry?.useConcurrencyQueue ?? true,
    },
    name: contextName,
  };
  if (effectiveConfig.schema && !effectiveConfig.registry?.schema) {
    effectiveConfig = {
      ...effectiveConfig,
      registry: {
        ...effectiveConfig.registry,
        schema: effectiveConfig.schema,
      },
    };
  }
  const FactoryActionContext = createContext<ActionContextType<T, TResultMap> | null>(null);
  const Provider: React.FC<ActionProviderProps<T, TResultMap>> = ({
    children,
    register: externalRegister,
    ownership,
  }) => {
    const ownedRegisterRef = useRef<ActionRegister<T, TResultMap> | null>(null);
    if (!externalRegister && !ownedRegisterRef.current) {
      ownedRegisterRef.current = new ActionRegister<T, TResultMap>(effectiveConfig);
    }
    const activeRegister = externalRegister ?? ownedRegisterRef.current!;
    const shouldDestroyRegister = externalRegister ? ownership === 'owned' : true;
    const actionRegisterRef = useRef<ActionRegister<T, TResultMap> | null>(activeRegister);
    actionRegisterRef.current = activeRegister;
    const lifecycleEntryRef = useRef<{
      register: ActionRegister<T, TResultMap>;
      lifecycle: ProviderDispatchLifecycleImpl;
    } | null>(null);
    if (!lifecycleEntryRef.current || lifecycleEntryRef.current.register !== activeRegister) {
      lifecycleEntryRef.current = {
        register: activeRegister,
        lifecycle: new ProviderDispatchLifecycleImpl(),
      };
    }
    const dispatchLifecycle = lifecycleEntryRef.current.lifecycle;
    const destroyOnUnmountRef = useRef(shouldDestroyRegister);
    useInsertionCommitEffect(() => {
      destroyOnUnmountRef.current = shouldDestroyRegister;
    }, [activeRegister, shouldDestroyRegister]);
    useInsertionCommitEffect(() => {
      return () => {
        const destroyRegister = destroyOnUnmountRef.current;
        void dispatchLifecycle.shutdown(activeRegister, { destroyRegister });
        if (ownedRegisterRef.current === activeRegister && destroyRegister) {
          ownedRegisterRef.current = null;
        }
      };
    }, [activeRegister, dispatchLifecycle]);
    const contextValue = useMemo(() => ({
      actionRegisterRef,
      dispatchLifecycle,
    }), [dispatchLifecycle]);
    return (
      <FactoryActionContext.Provider value={contextValue}>
        {children}
      </FactoryActionContext.Provider>
    );
  };
  const useFactoryActionContext = (): ActionContextType<T, TResultMap> => {
    const context = useContext(FactoryActionContext);
    if (!context) {
      throw new Error('useFactoryActionContext must be used within a factory ActionContext Provider');
    }
    return context;
  };
  const useAction = (): ActionRegister<T, TResultMap>['dispatch'] => {
    const { actionRegisterRef, dispatchLifecycle } = useFactoryActionContext();
    return useCallback(<K extends ActionNames<T>>(
      action: K,
      ...args: DispatchArgs<T[K]>
    ): Promise<void> => {
      const [payload, options] = args as [T[K] | undefined, DispatchOptions | undefined];
      if (process.env.NODE_ENV === 'development') {
        console.log(`React dispatch called for '${String(action)}':`, {
          hasPayload: payload !== undefined,
          hasOptions: options !== undefined,
          timestamp: new Date().toISOString()
        });
      }
      const register = actionRegisterRef.current;
      if (!register) {
        throw new Error(
          'ActionRegister is not initialized. ' +
          'Make sure the ActionContext Provider is properly set up.'
        );
      }
      return dispatchLifecycle.run(
        [options?.signal],
        signal => register.dispatch(
          action,
          ...([payload as T[K], withProviderDispatchSignal(options, signal)] as DispatchArgs<T[K]>)
        )
      );
    }, [actionRegisterRef, dispatchLifecycle]);
  };
  const useActionHandler = <K extends ActionNames<T>, R = ActionResult<TResultMap, K>>(
    action: K,
    handler: K extends keyof TResultMap
      ? ActionResultHandler<T[K], ActionResult<TResultMap, K>>
      : ActionHandler<T[K], R>,
    config?: HandlerConfig<T[K]> | EffectConfig<T[K]>,
    registrationRole: 'legacy' | 'effect' | 'guard' | 'command' | 'observer' | 'result' = 'legacy',
  ): void => {
    const { actionRegisterRef, dispatchLifecycle } = useFactoryActionContext();
    const actionId = useId();
    const effectGenerationRef = useRef(0);
    const registrationRef = useRef<{
      register: ActionRegister<T, TResultMap>;
      action: keyof T;
      config: HandlerConfig<T[K]>;
      active: boolean;
      unregister: () => void;
    } | null>(null);
    const handlerRef = useRef(handler);
    useInsertionCommitEffect(() => {
      handlerRef.current = handler;
    }, [handler]);
    const priority = config?.priority ?? 0;
    const id = config?.id || `react_${String(action)}_${actionId}`;
    const blocking = config?.blocking;
    const scheduling = config?.scheduling;
    const errorPolicy = config?.errorPolicy;
    const once = config?.once ?? false;
    const debounce = config?.debounce;
    const throttle = config?.throttle;
    const cleanup = config?.cleanup;
    const condition = config?.condition;
    const metadata = config?.metadata;
    const when = config?.when;
    const effectKind = config && 'effectKind' in config ? config.effectKind : undefined;
    const replaceExisting = config?.replaceExisting ?? true;
    const deferredCleanup = useMemo(
      () => cleanup === undefined
        ? undefined
        : () => dispatchLifecycle.scheduleHandlerCleanup(cleanup),
      [cleanup, dispatchLifecycle]
    );
    const stableConfig = useMemo((): HandlerConfig<T[K]> => ({
      priority,
      id,
      ...(blocking !== undefined && { blocking }),
      ...(scheduling !== undefined && { scheduling }),
      ...(errorPolicy !== undefined && { errorPolicy }),
      once,
      replaceExisting,
      ...(deferredCleanup !== undefined && { cleanup: deferredCleanup }),
      ...(condition !== undefined && { condition }),
      ...(metadata !== undefined && { metadata }),
      ...(when !== undefined && { when }),
      ...(effectKind !== undefined && { effectKind }),
      ...(debounce !== undefined && { debounce }),
      ...(throttle !== undefined && { throttle })
    }), [priority, id, blocking, scheduling, errorPolicy, once, replaceExisting, deferredCleanup, condition, metadata, when, effectKind, debounce, throttle]);
    useInsertionCommitEffect(() => {
      const register = actionRegisterRef.current;
      if (!register) return;
      const generation = ++effectGenerationRef.current;
      let lease = registrationRef.current;
      if (lease && (
        lease.register !== register ||
        lease.action !== action ||
        lease.config !== stableConfig
      )) {
        lease.active = false;
        lease.unregister();
        registrationRef.current = null;
        lease = null;
      }
      if (!lease) {
        const nextLease = {
          register,
          action,
          config: stableConfig,
          active: true,
          unregister: () => {},
        };
        const wrapperHandler: ActionHandler<T[K], R> = (payload, controller) => {
          if (!nextLease.active) return;
          return (handlerRef.current as ActionHandler<T[K], R>)(payload, controller);
        };
        if (process.env.NODE_ENV === 'development') {
          console.log(`Registering handler for '${String(action)}'`);
        }
        const registerMethod = registrationRole === 'effect'
          ? register.registerEffect
          : registrationRole === 'guard'
            ? register.registerGuard
            : registrationRole === 'command'
              ? register.registerCommand
              : registrationRole === 'observer'
                ? register.registerObserver
                : registrationRole === 'result'
                  ? register.registerResult
                  : register.register;
        const registerHandler = registerMethod.bind(register) as unknown as (
          action: K,
          handler: ActionHandler<T[K], R>,
          config: HandlerConfig<T[K]>,
        ) => () => void;
        nextLease.unregister = registerHandler(action, wrapperHandler, stableConfig);
        registrationRef.current = nextLease;
        lease = nextLease;
      } else {
        lease.active = true;
      }
      if (!lease) return;
      const currentLease = lease;
      return () => {
        currentLease.active = false;
        queueMicrotask(() => {
          if (effectGenerationRef.current !== generation) return;
          dispatchLifecycle.scheduleHandlerCleanup(() => {
            if (registrationRef.current === currentLease) {
              registrationRef.current = null;
            }
            currentLease.unregister();
          });
        });
      };
      }, [
        action,
        actionRegisterRef,
        dispatchLifecycle,
        stableConfig, 
        registrationRole,
    ]);
  };
  const useFactoryActionRegister = (): ActionRegister<T, TResultMap> | null => {
    const context = useFactoryActionContext();
    return context.actionRegisterRef.current;
  };
  const useActionEffectHandler = <K extends ActionNames<T>>(
    action: K,
    handler: ActionEffectHandler<T[K]> | ActionGuardHandler<T[K]>,
    config: EffectConfig<T[K]>,
  ): void => {
    useActionHandler(action, handler as never, config, 'effect');
  };
  const useActionResultHandler = <K extends ActionNames<T> & keyof TResultMap>(
    action: K,
    handler: ActionResultHandler<T[K], ActionResult<TResultMap, K>>,
    config?: HandlerConfig<T[K]>,
  ): void => {
    useActionHandler(action, handler as never, config, 'result');
  };
  const useActionGuard = <K extends ActionNames<T>>(
    action: K,
    handler: ActionGuardHandler<T[K]>,
    config?: GuardConfig<T[K]>,
  ): void => {
    useActionHandler(action, handler as never, config, 'guard');
  };
  const useActionCommandHandler = <K extends ActionNames<T>>(
    action: K,
    handler: ActionCommandHandler<T[K]>,
    config?: CommandConfig<T[K]>,
  ): void => {
    useActionHandler(action, handler as never, config, 'command');
  };
  const useActionObserver = <K extends ActionNames<T>, R = ActionResult<TResultMap, K>>(
    action: K,
    handler: ActionObserverHandler<T[K], R>,
    config?: ObserverConfig<T[K]>,
  ): void => {
    useActionHandler(action, handler as never, config, 'observer');
  };
  const useFactoryActionDispatchWithResult = () => {
    const context = useFactoryActionContext();
    const activeControllersRef = useRef<Set<AbortController>>(new Set());
    const dispatch = useCallback(<K extends ActionNames<T>>(
      action: K,
      payload?: T[K],
      options?: DispatchOptions
    ): Promise<void> => {
      const register = context.actionRegisterRef.current;
      if (!register) {
        throw new Error('ActionRegister not initialized');
      }
      const scopeController = new AbortController();
      activeControllersRef.current.add(scopeController);
      const trackedPromise = context.dispatchLifecycle.run(
        [options?.signal, scopeController.signal],
        signal => register.dispatch(
          action,
          ...([payload as T[K], withProviderDispatchSignal(options, signal)] as DispatchArgs<T[K]>)
        )
      ).finally(() => {
        activeControllersRef.current.delete(scopeController);
      });
      void trackedPromise.catch(() => {});
      return trackedPromise;
    }, [context.actionRegisterRef, context.dispatchLifecycle]);
    const dispatchWithResult = useCallback(<K extends ActionNames<T>, R = void>(
      action: K,
      ...args: DispatchArgs<T[K]>
    ): Promise<ExecutionResult<R>> => {
      const [payload, options] = args as [T[K] | undefined, DispatchOptions | undefined];
      const register = context.actionRegisterRef.current;
      if (!register) {
        throw new Error('ActionRegister not initialized');
      }
      const scopeController = new AbortController();
      activeControllersRef.current.add(scopeController);
      const dispatchResult = register.dispatchWithResult.bind(register) as unknown as <
        ActionKey extends ActionNames<T>,
        Result = void,
      >(
        action: ActionKey,
        ...dispatchArgs: DispatchArgs<T[ActionKey]>
      ) => Promise<ExecutionResult<Result>>;
      const trackedPromise = context.dispatchLifecycle.run(
        [options?.signal, scopeController.signal],
        signal => dispatchResult<K, R>(
          action,
          ...([payload, withProviderDispatchSignal(options, signal)] as DispatchArgs<T[K]>)
        )
      ).finally(() => {
        activeControllersRef.current.delete(scopeController);
      });
      void trackedPromise.catch(() => {});
      return trackedPromise;
    }, [context.actionRegisterRef, context.dispatchLifecycle]);
    const abortAll = useCallback(() => {
      activeControllersRef.current.forEach(controller => {
        if (!controller.signal.aborted) {
          controller.abort();
        }
      });
      activeControllersRef.current.clear();
    }, []);
    const resetAbortScope = useCallback(() => {
      abortAll();
    }, [abortAll]);
    useInsertionCommitEffect(() => {
      return () => {
        queueMicrotask(abortAll);
      };
    }, [abortAll]);
    return {
      dispatch,
      dispatchWithResult,
      abortAll,
      resetAbortScope,
    };
  };
  return {
    Provider,
    useActionContext: useFactoryActionContext,
    useActionDispatch: useAction,
    useActionHandler,
    useActionEffectHandler,
    useActionGuard,
    useActionCommandHandler,
    useActionObserver,
    useActionResultHandler,
    useActionRegister: useFactoryActionRegister,
    useActionDispatchWithResult: useFactoryActionDispatchWithResult,
    context: FactoryActionContext,
  } satisfies ActionContextReturn<T, TResultMap>;
}
```

### actions/index.ts

```typescript
export { 
  createActionContext
} from './ActionContext';
export type {
  ActionContextConfig,
  ActionContextType,
  ActionContextReturn,
  ActionProviderProps,
  ProviderShutdownOptions,
} from './ActionContext.types';
export type {
  ActionPayloadMap,
  ActionHandler,
  HandlerConfig,
  PipelineController,
  ActionRegisterConfig
} from '@context-action/core';
```

### actions/react-helpers.ts

```typescript
import type {
  ActionHandler,
  ActionNames,
  ActionPayloadMap,
  ActionRegister,
  HandlerConfig,
  ResolvedHandlerConfig,
  UnregisterFunction,
} from '@context-action/core';
import { resolveHandlerConfig } from '@context-action/core';
export function createActionHandler<T extends ActionPayloadMap, K extends ActionNames<T>>(
  registry: ActionRegister<T>,
  action: K,
  handler: ActionHandler<T[K]>,
  config?: HandlerConfig<T[K]>,
): {
  register: () => UnregisterFunction;
  unregister: () => void;
  registerWithCleanup: () => () => void;
  config: ResolvedHandlerConfig<T[K]>;
} {
  const handlerId = config?.id
    ?? `react_${String(action)}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const registrationConfig: HandlerConfig<T[K]> = { ...config, id: handlerId };
  const finalConfig: ResolvedHandlerConfig<T[K]> = resolveHandlerConfig(
    registrationConfig,
    handlerId,
  );
  let unregister: UnregisterFunction | undefined;
  const unregisterCurrent = (): void => {
    unregister?.();
    unregister = undefined;
  };
  return {
    register: () => {
      unregisterCurrent();
      unregister = registry.register(action, handler, registrationConfig);
      return unregister;
    },
    unregister: unregisterCurrent,
    registerWithCleanup: () => {
      unregisterCurrent();
      unregister = registry.register(action, handler, registrationConfig);
      return unregisterCurrent;
    },
    config: finalConfig,
  };
}
export const ReactDevUtils = {
  enableDebugMode(): void {
    if (typeof window !== 'undefined') {
      (window as typeof window & { __CONTEXT_ACTION_REACT_DEBUG__?: boolean })
        .__CONTEXT_ACTION_REACT_DEBUG__ = true;
    }
  },
  disableDebugMode(): void {
    if (typeof window !== 'undefined') {
      (window as typeof window & { __CONTEXT_ACTION_REACT_DEBUG__?: boolean })
        .__CONTEXT_ACTION_REACT_DEBUG__ = false;
    }
  },
  isDebugMode(): boolean {
    return typeof window !== 'undefined'
      && Boolean((window as typeof window & { __CONTEXT_ACTION_REACT_DEBUG__?: boolean })
        .__CONTEXT_ACTION_REACT_DEBUG__);
  },
  log(component: string, action: string, message: string, data?: unknown): void {
    if (this.isDebugMode()) console.log(`🎯 [React-ActionRegister] [${component}] ${action}: ${message}`, data ?? '');
  },
  getStats<T extends ActionPayloadMap>(registry: ActionRegister<T>): {
    totalHandlers: number;
    reactHandlers: number;
    registryInfo: ReturnType<ActionRegister<T>['getRegistryInfo']>;
  } {
    const registryInfo = registry.getRegistryInfo();
    let reactHandlers = 0;
    registry.getRegisteredActions().forEach((action) => {
      registry.getActionStats(action as ActionNames<T>)?.handlersByPriority.forEach((group) => {
        group.handlers.forEach((handler) => {
          if (handler.id.includes('react')) reactHandlers += 1;
        });
      });
    });
    return { totalHandlers: registryInfo.totalHandlers, reactHandlers, registryInfo };
  },
};
export class ReactActionError extends Error {
  public readonly timestamp = Date.now();
  public constructor(
    message: string,
    public readonly action: string,
    public readonly payload?: unknown,
    public readonly handlerId?: string,
    originalError?: Error,
  ) {
    super(message);
    this.name = 'ReactActionError';
    if (originalError?.stack) this.stack = originalError.stack;
  }
  static fromActionError(
    originalError: Error,
    action: string,
    payload?: unknown,
    handlerId?: string,
  ): ReactActionError {
    return new ReactActionError(
      `Action '${action}' failed: ${originalError.message}`,
      action,
      payload,
      handlerId,
      originalError,
    );
  }
}
export function isReactActionError(error: unknown): error is ReactActionError {
  return error instanceof ReactActionError;
}
```

### advanced.ts

```typescript
export { StoreRegistry } from './stores/core/StoreRegistry';
export type { 
  DynamicStoreOptions,
  HookOptions,
  StoreSyncConfig
} from './stores/core/types';
export { useComputedStore } from './stores/hooks/useComputedStore';
export { useLocalStore } from './stores/hooks/useLocalStore';
export * from './utils';
export {
  ContextActionError,
  ContextActionErrorType,
  handleError as handleContextActionError
} from './stores/utils/error-handling';
export {
  StoreErrorBoundary,
  withStoreErrorBoundary,
  createStoreErrorBoundary
} from './stores/components/StoreErrorBoundary';
export type {
  StoreErrorBoundaryProps,
  StoreErrorBoundaryState
} from './stores/components/StoreErrorBoundary';
export { createActionContext } from './actions/ActionContext';
export type { ActionContextConfig, ActionContextReturn } from './actions/ActionContext.types';
```

### backend.ts

```typescript
export {
  BackendStore,
  createBackendStore,
} from './stores/core/BackendStore';
export type {
  BackendPatchListener,
  BackendStoreOptions,
  BackendStoreSetValueOptions,
} from './stores/core/BackendStore';
export type {
  HistoryEntryId,
  ReadonlyStateSnapshot,
  StateBackend,
  StateMutationMeta,
  StateMutationOrigin,
  StatePatch,
  StateReader,
  StateTransition,
  StateWriter,
  TimelineBackend,
  TransactionBackend,
  TransactionBatchControl,
  StateSnapshot,
  TransactionParticipantBackend,
  TransactionMeta,
  TransactionOptions,
  TransactionParticipant,
  TransactionHandle,
  TransactionCoordinatorPort,
} from '@context-action/store-core';
```

### index.ts

```typescript
export { createActionContext } from './actions/ActionContext';
export type { 
  ActionContextConfig,
  ActionContextReturn,
  ActionContextType,
  ActionProviderProps,
  ProviderShutdownOptions,
} from './actions/ActionContext.types';
export { createStore, Store, type PatchAwareListener } from './stores/core/Store';
export {
  createTimeTravelStore,
  TimeTravelStore,
  isTimeTravelStore
} from './stores/core/TimeTravelStore';
export type { TimeTravelStoreOptions } from './stores/core/TimeTravelStore';
export { useStoreValue } from './stores/hooks/useStoreValue';
export { useStoreSelector } from './stores/hooks/useStoreSelector';
export { useStorePath, useStoreSelectorWithPaths } from './stores/hooks/useStorePath';
export type { PatchAwareStore, StorePathPatch, StorePath, UseStorePathOptions, UseStoreSelectorWithPathsOptions } from './stores/hooks/useStorePath';
export { useTimeTravelControls } from './stores/hooks/useTimeTravelControls';
export { useStoreTransactionInspector } from './stores/hooks/useStoreTransactionInspector';
export type { TimeTravelControlsState } from './stores/hooks/useTimeTravelControls';
export { useTimeTravelPath, useTimeTravelSelector } from './stores/hooks/useTimeTravelPath';
export type { UseTimeTravelPathOptions, UseTimeTravelSelectorOptions } from './stores/hooks/useTimeTravelPath';
export type { IStore, Snapshot } from './stores/core/types';
export type { StoreReader, StoreWriter, TimelineReader, TimelineWriter } from './stores/core/contracts';
export { StoreTransactionCoordinator } from './stores/core/StoreTransactionCoordinator';
export type { StoreTransactionEvent, StoreTransactionEventPhase, StoreTransactionHandle, StoreTransactionInspectorSink, StoreTransactionInspectorSnapshot, StoreTransactionListener, StoreTransactionMeta, StoreTransactionOptions, StoreTransactionParticipant, StoreTransactionRecord } from './stores/core/StoreTransactionCoordinator';
export { bindActionTransactions } from './stores/core/ActionTransactionBridge';
export type { ActionTransactionBridgeOptions, DispatchTraceSource } from './stores/core/ActionTransactionBridge';
export type { Patches, TravelPatches } from '@context-action/mutative';
export { StoreErrorBoundary } from './stores/components/StoreErrorBoundary';
export type { StoreErrorBoundaryProps } from './stores/components/StoreErrorBoundary';
export { createStoreContext, StoreManager, asStoreValue } from './stores/patterns/declarative-store-pattern-v2';
export type {
  InitialStores,
  StoreConfig,
  ExplicitStoreValue,
  WithProviderConfig,
  ExternalStoresMap,
  StoreManagerOptions,
  StoreProviderProps,
  StoreContextReturn,
} from './stores/patterns/declarative-store-pattern-v2';
export { createTimeTravelStoreContext, TimeTravelStoreManager } from './stores/patterns/time-travel-store-pattern';
export type {
  TimeTravelStoreConfig,
  TimeTravelInitialStores,
  TimeTravelControlsState as TimeTravelContextControlsState,
  InferTimeTravelStoreTypes
} from './stores/patterns/time-travel-store-pattern';
export { createRefContext } from './refs/createRefContext';
export type { RefContextReturn, CreateRefContextOptions } from './refs/createRefContext';
export type { RefTarget, RefOperationOptions, RefOperationResult } from './refs/types';
export type {
  ActionCommandController,
  ActionCommandHandler,
  ActionPayloadMap,
  ActionHandler,
  CommandConfig,
  HandlerConfig,
  PipelineController,
  ActionRegisterConfig,
  ExecutionMode,
  UnregisterFunction
} from '@context-action/core';
export { ActionRegister } from '@context-action/core';
export {
  createActionHandler,
  ReactDevUtils,
  ReactActionError,
  isReactActionError,
} from './actions/react-helpers';
```

### refs/createRefContext.ts

```typescript
import React, { createContext, useContext, useMemo, useRef, useCallback, ReactNode, useInsertionEffect } from 'react';
import type { 
  RefTarget, 
  RefOperation, 
  RefOperationOptions, 
  RefOperationResult,
  RefDefinitions,
  InferRefTypes
} from './types';
import { useRefMount, useRefOperation, useRefPolling as useRefPollingHook, useRefMountState, useOnMountStateChange, useRefMountChecker, type InternalRefState, type RefPollingOptions } from './hooks';
import { ErrorHandlers } from '../stores/utils/error-handling';
import { disposeRefState, refDisposedError, waitForRefMount } from './ref-state';
export interface RefContextReturn<T> {
  Provider: React.FC<{ children: ReactNode }>;
  useRefHandler: <K extends keyof T>(refName: K) => {
    setRef: (target: T[K] | null) => void;
    target: T[K] | null;
    waitForMount: () => Promise<T[K]>;
    withTarget: <Result>(
      operation: RefOperation<T[K] & RefTarget, Result>,
      options?: RefOperationOptions
    ) => Promise<RefOperationResult<Result>>;
    isMounted: boolean;
    isWaitingForMount: boolean;
    onMount: (callback: (target: T[K]) => void) => () => void;
    executeIfMounted: <Result>(
      operation: (target: T[K] & RefTarget) => Result
    ) => Result | null;
  };
  useWaitForRefs: () => {
    <K extends keyof T>(...refNames: K[]): Promise<Pick<T, K>>;
    <K extends keyof T>(timeout: number, ...refNames: K[]): Promise<Pick<T, K>>;
  };
  useGetAllRefs: () => () => Partial<T>;
  useRefPolling: () => <K extends keyof T>(
    refName: K,
    options?: RefPollingOptions
  ) => {
    promise: Promise<T[K]>;
    cancel: () => void;
    isMounted: () => boolean;
  };
  useRefMountState: <K extends keyof T>(refName: K) => {
    isMounted: boolean;
    isWaitingForMount: boolean;
    mountedTarget: T[K] | null;
  };
  useOnMountStateChange: <K extends keyof T>(
    refName: K,
    callback: (mounted: boolean, target: T[K] | null) => void
  ) => void;
  useRefMountChecker: <K extends keyof T>(refName: K) => () => {
    isMounted: boolean;
    isWaitingForMount: boolean;
    target: T[K] | null;
  };
  contextName: string;
  refDefinitions?: T extends RefDefinitions ? T : undefined;
}
export interface CreateRefContextOptions {
  defaultMountTimeout?: number;
  disableTimeout?: boolean;
}
export function createRefContext<T extends object>(
  contextName: string,
  options?: CreateRefContextOptions
): RefContextReturn<T>;
export function createRefContext<T extends RefDefinitions>(
  contextName: string,
  refDefinitions: T,
  options?: CreateRefContextOptions
): RefContextReturn<InferRefTypes<T>>;
export function createRefContext<T extends object | RefDefinitions>(
  contextName: string,
  refDefinitionsOrOptions?: T extends RefDefinitions ? T : CreateRefContextOptions,
  optionsWhenDefs?: CreateRefContextOptions
): T extends RefDefinitions 
  ? RefContextReturn<InferRefTypes<T>>
  : RefContextReturn<T> {
  const refDefinitions = (typeof refDefinitionsOrOptions === 'object' && 
    refDefinitionsOrOptions !== null &&
    Object.values(refDefinitionsOrOptions as object).some(
      (value: unknown) => value !== null && typeof value === 'object' && 'name' in value
    )) ? (refDefinitionsOrOptions as unknown) as T extends RefDefinitions ? T : undefined : undefined;
  const options = refDefinitions ? optionsWhenDefs : refDefinitionsOrOptions as CreateRefContextOptions | undefined;
  const hasDefinitions = Boolean(refDefinitions);
  interface RefContextValue {
    refsMapRef: React.MutableRefObject<Map<string, InternalRefState<RefTarget>>>;
    definitionsRef: React.MutableRefObject<T extends RefDefinitions ? T : undefined>;
    optionsRef: React.MutableRefObject<CreateRefContextOptions | undefined>;
    getRefState: (refName: string) => InternalRefState<RefTarget>;
    setRefTarget: (refName: string, target: RefTarget) => void;
  }
  const RefContext = createContext<RefContextValue | null>(null);
  const Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const refsMapRef = useRef<Map<string, InternalRefState<RefTarget>>>(null!);
    if (!refsMapRef.current) {
      const map = new Map<string, InternalRefState<RefTarget>>();
      if (hasDefinitions && refDefinitions) {
        Object.keys(refDefinitions).forEach((refName) => {
          map.set(refName, createInitialRefState());
        });
      }
      refsMapRef.current = map;
    }
    const definitionsRef = useRef<T extends RefDefinitions ? T : undefined>(
      refDefinitions as T extends RefDefinitions ? T : undefined
    );
    const optionsRef = useRef<CreateRefContextOptions | undefined>(options);
    const disposedRef = useRef(false);
    useInsertionEffect(() => {
      return () => {
        disposedRef.current = true;
        if (refsMapRef.current) {
          refsMapRef.current.forEach(disposeRefState);
          refsMapRef.current.clear();
        }
      };
    }, []);
    const getRefState = useCallback((refName: string) => {
      if (disposedRef.current) throw refDisposedError();
      return getOrCreateRefState(refsMapRef.current, refName);
    }, []);
    const setRefTarget = useCallback((refName: string, target: RefTarget) => {
      if (disposedRef.current) return;
      const refState = getOrCreateRefState(refsMapRef.current, refName);
      if (target === null) {
        refState.target = null;
        refState.isMounted = false;
        [...refState.listeners].forEach(listener => listener());
      } else {
        refState.target = target;
        refState.isMounted = true;
        refState.mountResolvers.forEach(resolve => resolve(target));
        refState.mountResolvers.clear();
        refState.mountRejectors.clear();
        refState.mountPromise = null;
        [...refState.mountCallbacks].forEach(callback => {
          try {
            callback(target);
          } catch (error) {
            ErrorHandlers.ref(
              'Error in mount callback',
              { 
                refName: String(refName),
                targetType: typeof target
              },
              error instanceof Error ? error : undefined
            );
          }
        });
        [...refState.listeners].forEach(listener => listener());
      }
    }, []);
    const contextValue = useMemo<RefContextValue>(() => ({
      refsMapRef,
      definitionsRef,
      optionsRef,
      getRefState,
      setRefTarget
    }), [getRefState, setRefTarget]);
    return React.createElement(
      RefContext.Provider,
      { value: contextValue },
      children
    );
  };
  const useRefContext = () => {
    const context = useContext(RefContext);
    if (!context) {
      throw new Error(
        `useRefHandler must be used within ${contextName}.Provider. ` +
        `Wrap your component with <${contextName}.Provider>`
      );
    }
    return context;
  };
  const useRefHandler = <K extends keyof T>(refName: K) => {
    const { getRefState, setRefTarget, definitionsRef, optionsRef } = useRefContext();
    const refNameStr = String(refName);
    const refState = getRefState(refNameStr);
    const { isMounted, isWaitingForMount } = useRefMountState(refState);
    const { waitForMount, onMount } = useRefMount(
      refState, 
      refNameStr, 
      optionsRef, 
      definitionsRef
    );
    const { withTarget, executeIfMounted } = useRefOperation(refState);
    const setRef = useCallback((target: T[K] | null) => {
      setRefTarget(refNameStr, target);
    }, [refNameStr, setRefTarget]);
    return useMemo(() => ({
      setRef,
      get target(): T[K] | null {
        return refState.target as T[K] | null;
      },
      waitForMount: waitForMount as () => Promise<T[K]>,
      withTarget: withTarget as <Result>(
        operation: RefOperation<T[K] & RefTarget, Result>,
        options?: RefOperationOptions
      ) => Promise<RefOperationResult<Result>>,
      isMounted,
      isWaitingForMount,
      onMount: onMount as (callback: (target: T[K]) => void) => () => void,
      executeIfMounted: executeIfMounted as <Result>(
        operation: (target: T[K] & RefTarget) => Result
      ) => Result | null
    }), [refState, setRef, waitForMount, withTarget, executeIfMounted, onMount, isMounted, isWaitingForMount]);
  };
  const useWaitForRefs = () => {
    const { getRefState } = useRefContext();
    return useCallback(async <K extends keyof T>(...args: [number, ...K[]] | K[]): Promise<Pick<T, K>> => {
      let timeout: number | undefined;
      let refNames: K[];
      if (typeof args[0] === 'number') {
        timeout = args[0];
        refNames = args.slice(1) as K[];
      } else {
        timeout = 1000; 
        refNames = args as K[];
      }
      const group = new AbortController();
      try {
        const results = await Promise.all(refNames.map(async refName => {
          const name = String(refName);
          const target = await waitForRefMount(getRefState(name), name, timeout, group.signal);
          return [refName, target] as const;
        }));
        return Object.fromEntries(results) as Pick<T, K>;
      } finally {
        group.abort();
      }
    }, [getRefState]);
  };
  const useGetAllRefs = () => {
    const { refsMapRef } = useRefContext();
    return useCallback((): Partial<T> => {
      const result: Partial<T> = {} as Partial<T>;
      refsMapRef.current.forEach((refState, refName) => {
        if (refState.target !== null && refState.isMounted) {
          (result as unknown as Record<string, unknown>)[String(refName)] = refState.target;
        }
      });
      return result;
    }, [refsMapRef]);
  };
  const useRefPolling = () => {
    const { getRefState } = useRefContext();
    const createPolling = useRefPollingHook();
    return useCallback(<K extends keyof T>(
      refName: K,
      options: RefPollingOptions = {}
    ) => {
      const refNameStr = String(refName);
      const refState = getRefState(refNameStr);
      return createPolling(refState, refNameStr, options) as {
        promise: Promise<T[K]>;
        cancel: () => void;
        isMounted: () => boolean;
      };
    }, [getRefState, createPolling]);
  };
  const useRefMountStateHook = <K extends keyof T>(refName: K) => {
    const { getRefState } = useRefContext();
    const refState = getRefState(String(refName));
    return useRefMountState(refState) as {
      isMounted: boolean;
      isWaitingForMount: boolean;
      mountedTarget: T[K] | null;
    };
  };
  const useOnMountStateChangeHook = <K extends keyof T>(
    refName: K,
    callback: (mounted: boolean, target: T[K] | null) => void
  ) => {
    const { getRefState } = useRefContext();
    const refState = getRefState(String(refName));
    useOnMountStateChange(refState as InternalRefState<T[K]>, callback);
  };
  const useRefMountCheckerHook = <K extends keyof T>(refName: K) => {
    const { getRefState } = useRefContext();
    const refState = getRefState(String(refName));
    return useRefMountChecker(refState) as () => {
      isMounted: boolean;
      isWaitingForMount: boolean;
      target: T[K] | null;
    };
  };
  return {
    Provider,
    useRefHandler,
    useWaitForRefs,
    useGetAllRefs,
    useRefPolling,
    useRefMountState: useRefMountStateHook,
    useOnMountStateChange: useOnMountStateChangeHook,
    useRefMountChecker: useRefMountCheckerHook,
    contextName,
    refDefinitions
  } as T extends RefDefinitions 
    ? RefContextReturn<InferRefTypes<T>>
    : RefContextReturn<T>;
}
function createInitialRefState<T>(): InternalRefState<T> {
  return {
    target: null,
    isMounted: false,
    mountPromise: null,
    mountResolvers: new Set(),
    mountRejectors: new Set(),
    operationInProgress: false,
    listeners: new Set(),
    mountCallbacks: new Set()
  };
}
function getOrCreateRefState<T>(
  refsMap: Map<string, InternalRefState<T>>,
  refName: string
): InternalRefState<T> {
  if (!refsMap.has(refName)) {
    refsMap.set(refName, createInitialRefState());
  }
  return refsMap.get(refName)!;
}
```

### refs/helpers.ts

```typescript
import type { 
  RefInitConfig, 
  RefTarget
} from './types';
export function customRef<T extends RefTarget>(
  config: Partial<RefInitConfig<T>> & { 
    name: string;
    cleanup?: (target: T) => void | Promise<void>;
  }
): RefInitConfig<T> {
  return {
    autoCleanup: true,
    ...config
  } as RefInitConfig<T>;
}
```

### refs/hooks/index.ts

```typescript
export { useRefMount, type InternalRefState } from './useRefMount';
export { useRefOperation } from './useRefOperation';
export { useRefPolling, type RefPollingOptions, type RefPollingReturn } from './useRefPolling';
export { useRefMountState, useOnMountStateChange, useRefMountChecker } from './useRefMountState';
```

### refs/hooks/useRefMount.ts

```typescript
import { useCallback } from 'react';
import type { RefDefinitions, RefInitConfig } from '../types';
import type { CreateRefContextOptions } from '../createRefContext';
import { type InternalRefState, waitForRefMount } from '../ref-state';
export type { InternalRefState } from '../ref-state';
export function useRefMount<T>(
  refState: InternalRefState<T>,
  refNameStr: string,
  optionsRef: React.MutableRefObject<CreateRefContextOptions | undefined>,
  definitionsRef: React.MutableRefObject<RefDefinitions | undefined>
) {
  const waitForMount = useCallback(async (): Promise<T> => {
    const globalOptions = optionsRef.current;
    const refConfig = definitionsRef.current?.[refNameStr] as RefInitConfig | undefined;
    let timeoutMs: number | undefined;
    if (globalOptions?.disableTimeout) {
      timeoutMs = undefined;
    } else if (refConfig?.mountTimeout !== undefined) {
      timeoutMs = refConfig.mountTimeout;
    } else if (globalOptions?.defaultMountTimeout !== undefined) {
      timeoutMs = globalOptions.defaultMountTimeout;
    }
    return waitForRefMount(refState, refNameStr, timeoutMs !== undefined && timeoutMs > 0 ? timeoutMs : undefined);
  }, [refState, refNameStr, optionsRef, definitionsRef]);
  const onMount = useCallback((callback: (target: T) => void) => {
    if (refState.disposed) return () => {};
    refState.mountCallbacks.add(callback);
    if (refState.isMounted && refState.target) {
      callback(refState.target);
    }
    return () => {
      refState.mountCallbacks.delete(callback);
    };
  }, [refState]);
  return {
    waitForMount,
    onMount,
    isMounted: refState.isMounted,
    isWaitingForMount: !refState.isMounted && refState.mountPromise !== null
  };
}
```

### refs/hooks/useRefMountState.ts

```typescript
import { useEffect, useSyncExternalStore, useCallback, useRef } from 'react';
import type { InternalRefState } from './useRefMount';
export function useRefMountState<T>(refState: InternalRefState<T>): {
  isMounted: boolean;
  isWaitingForMount: boolean;
  mountedTarget: T | null;
} {
  const subscribe = useCallback((callback: () => void) => {
    if (!refState) return () => {};
    refState.listeners.add(callback);
    return () => {
      refState.listeners.delete(callback);
    };
  }, [refState]);
  const cachedSnapshotRef = useRef<{
    isMounted: boolean;
    isWaitingForMount: boolean;
    mountedTarget: T | null;
  } | undefined>(undefined);
  const getSnapshot = useCallback(() => {
    if (!refState) {
      const snapshot = {
        isMounted: false,
        isWaitingForMount: false,
        mountedTarget: null as T | null
      };
      cachedSnapshotRef.current = snapshot;
      return snapshot;
    }
    const isWaitingForMount = !refState.isMounted && refState.mountPromise !== null;
    const newSnapshot = {
      isMounted: refState.isMounted,
      isWaitingForMount,
      mountedTarget: refState.isMounted ? refState.target : null as T | null
    };
    if (cachedSnapshotRef.current &&
        cachedSnapshotRef.current.isMounted === newSnapshot.isMounted &&
        cachedSnapshotRef.current.isWaitingForMount === newSnapshot.isWaitingForMount &&
        cachedSnapshotRef.current.mountedTarget === newSnapshot.mountedTarget) {
      return cachedSnapshotRef.current;
    }
    cachedSnapshotRef.current = newSnapshot;
    return newSnapshot;
  }, [refState]);
  const serverSnapshotRef = useRef({
    isMounted: false,
    isWaitingForMount: false,
    mountedTarget: null as T | null
  });
  const getServerSnapshot = useCallback(() => {
    return serverSnapshotRef.current;
  }, []);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
export function useOnMountStateChange<T>(
  refState: InternalRefState<T>,
  callback: (mounted: boolean, target: T | null) => void
): void {
  const { isMounted, mountedTarget } = useRefMountState(refState);
  const stableCallback = useCallback(callback, [callback]);
  useEffect(() => {
    stableCallback(isMounted, mountedTarget);
  }, [isMounted, mountedTarget, stableCallback]);
}
export function useRefMountChecker<T>(refState: InternalRefState<T>) {
  return useCallback(() => {
    return {
      isMounted: refState.isMounted,
      isWaitingForMount: !refState.isMounted && refState.mountPromise !== null,
      target: refState.target
    };
  }, [refState]);
}
```

### refs/hooks/useRefOperation.ts

```typescript
import { useCallback } from 'react';
import type { RefOperation, RefOperationOptions, RefOperationResult, RefTarget } from '../types';
import { type InternalRefState, onRefDisposed, refAbortError, waitForRefMount } from '../ref-state';
export function useRefOperation<T>(refState: InternalRefState<T>) {
  const withTarget = useCallback(async <Result>(
    operation: RefOperation<T & RefTarget, Result>,
    options?: RefOperationOptions,
  ): Promise<RefOperationResult<Result>> => {
    const controller = new AbortController();
    const externalSignal = options?.signal;
    const forwardAbort = () => controller.abort(refAbortError(externalSignal!));
    if (externalSignal?.aborted) forwardAbort();
    else externalSignal?.addEventListener('abort', forwardAbort, { once: true });
    const removeDisposal = onRefDisposed(refState, error => controller.abort(error));
    let startedAt: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onAbort = () => {
      if (timer !== undefined) clearTimeout(timer);
      rejectAbort(refAbortError(controller.signal));
    };
    let rejectAbort!: (error: Error) => void;
    const aborted = new Promise<never>((_, reject) => { rejectAbort = reject; });
    controller.signal.addEventListener('abort', onAbort, { once: true });
    if (controller.signal.aborted) onAbort();
    try {
      if (controller.signal.aborted) throw refAbortError(controller.signal);
      const execution = (refState.operationTail ?? Promise.resolve()).then(async () => {
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
  }, [refState]);
  const executeIfMounted = useCallback(<Result>(
    operation: (target: T & RefTarget) => Result,
  ): Result | null => {
    if (!refState.disposed && refState.isMounted && refState.target !== null) {
      try { return operation(refState.target); }
      catch (error) { console.error('Error in executeIfMounted:', error); }
    }
    return null;
  }, [refState]);
  return { withTarget, executeIfMounted };
}
```

### refs/hooks/useRefPolling.ts

```typescript
import { useCallback } from 'react';
import { type InternalRefState, onRefDisposed } from '../ref-state';
export interface RefPollingOptions {
  interval?: number;
  timeout?: number;
  onTick?: (elapsed: number, isMounted: boolean) => void;
  onTimeout?: (elapsed: number) => void;
  onSuccess?: (elapsed: number, target: unknown) => void;
}
export interface RefPollingReturn<T> {
  promise: Promise<T>;
  cancel: () => void;
  isMounted: () => boolean;
}
export function useRefPolling() {
  const createPolling = useCallback(<T>(
    refState: InternalRefState<T>,
    refName: string,
    options: RefPollingOptions = {}
  ): RefPollingReturn<T> => {
    const {
      interval = 100,
      timeout,
      onTick,
      onTimeout,
      onSuccess
    } = options;
    let settled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let removeDisposal = () => {};
    const startTime = Date.now();
    let resolve!: (target: T) => void;
    let reject!: (error: Error) => void;
    const promise = new Promise<T>((onResolve, onReject) => { resolve = onResolve; reject = onReject; });
    const cleanup = () => {
      if (intervalId !== null) clearInterval(intervalId);
      if (timeoutId !== null) clearTimeout(timeoutId);
      intervalId = null;
      timeoutId = null;
      removeDisposal();
    };
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    const check = () => {
      if (settled) return;
      const elapsed = Date.now() - startTime;
      try { onTick?.(elapsed, refState.isMounted && refState.target !== null); }
      catch (error) { console.error('Error in polling onTick callback:', error); }
      if (settled) return;
      if (refState.isMounted && refState.target !== null) {
        const target = refState.target;
        settled = true;
        cleanup();
        try { onSuccess?.(elapsed, target); }
        catch (error) { console.error('Error in polling onSuccess callback:', error); }
        resolve(target);
      }
    };
    removeDisposal = onRefDisposed(refState, fail);
    if (!settled && timeout !== undefined && timeout > 0) {
      timeoutId = setTimeout(() => {
        if (settled) return;
        fail(new Error(`Polling timeout after ${timeout}ms for ref '${refName}'`));
        try { onTimeout?.(Date.now() - startTime); }
        catch (error) { console.error('Error in polling onTimeout callback:', error); }
      }, timeout);
    }
    check();
    if (!settled) intervalId = setInterval(check, interval);
    void promise.catch(() => {});
    const cancel = () => { fail(new Error('Polling cancelled')); };
    const isMounted = () => {
      return !refState.disposed && refState.isMounted && refState.target !== null;
    };
    return {
      promise,
      cancel,
      isMounted
    };
  }, []);
  return createPolling;
}
```

### refs/ref-state.ts

```typescript
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
```

### stores/components/StoreErrorBoundary.tsx

```typescript
import React, { Component, ReactNode, ErrorInfo } from 'react';
import {
  ContextActionError,
  ContextActionErrorType,
  ErrorHandlers,
  getErrorStatistics,
} from '../utils/error-handling';
export interface StoreErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: ContextActionError, errorInfo: ErrorInfo) => ReactNode);
  onError?: (error: ContextActionError, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}
export interface StoreErrorBoundaryState {
  hasError: boolean;
  error: ContextActionError | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}
export class StoreErrorBoundary extends Component<StoreErrorBoundaryProps, StoreErrorBoundaryState> {
  constructor(props: StoreErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }
  static getDerivedStateFromError(error: Error): Partial<StoreErrorBoundaryState> {
    const contextActionError = error instanceof ContextActionError ? error : null;
    return {
      hasError: true,
      error: contextActionError,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (error instanceof ContextActionError) {
      const contextActionError = error;
      this.setState({ errorInfo });
      this.props.onError?.(contextActionError, errorInfo);
    } else {
      const errorContext = {
        component: 'StoreErrorBoundary',
        stack: error.stack,
        componentStack: errorInfo.componentStack
      };
      let contextActionError: ContextActionError;
      try {
        contextActionError = ErrorHandlers.store(
          `Unhandled error in Store component: ${error.message}`,
          errorContext,
          error
        );
      } catch (caughtError) {
        contextActionError =
          caughtError instanceof ContextActionError
            ? caughtError
            : new ContextActionError(
                ContextActionErrorType.STORE_ERROR,
                `Unhandled error in Store component: ${error.message}`,
                errorContext,
                error
              );
      }
      this.setState({ 
        error: contextActionError,
        errorInfo 
      });
      this.props.onError?.(contextActionError, errorInfo);
    }
  }
  componentDidUpdate(prevProps: StoreErrorBoundaryProps) {
    const { hasError } = this.state;
    const { resetOnPropsChange, resetKeys } = this.props;
    if (hasError && resetOnPropsChange) {
      if (resetKeys) {
        const previousResetKeys = prevProps.resetKeys;
        const hasResetKeyChanged =
          previousResetKeys === undefined ||
          previousResetKeys.length !== resetKeys.length ||
          resetKeys.some((key, index) => !Object.is(key, previousResetKeys[index]));
        if (hasResetKeyChanged) {
          this.resetErrorBoundary();
        }
      } else if (prevProps !== this.props) {
        this.resetErrorBoundary();
      }
    }
  }
  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };
  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;
    if (hasError) {
      if (fallback) {
        if (typeof fallback === 'function') {
          if (!error || !errorInfo) {
            return null;
          }
          return fallback(error, errorInfo);
        }
        return fallback;
      }
      return this.renderDefaultFallback();
    }
    return children;
  }
  private renderDefaultFallback(): ReactNode {
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
      return this.renderDevelopmentFallback();
    } else {
      return this.renderProductionFallback();
    }
  }
  private renderDevelopmentFallback(): ReactNode {
    const { error, errorInfo, errorId } = this.state;
    const stats = getErrorStatistics();
    return (
      <div style={{
        padding: '20px',
        margin: '20px',
        border: '2px solid #ff6b6b',
        borderRadius: '8px',
        backgroundColor: '#ffe0e0',
        fontFamily: 'monospace'
      }}>
        <h2 style={{ color: '#d63031', margin: '0 0 10px 0' }}>
          🚨 Store Error Boundary
        </h2>
        <div style={{ marginBottom: '15px' }}>
          <strong>Error ID:</strong> {errorId}
        </div>
        {error && (
          <div style={{ marginBottom: '15px' }}>
            <strong>Error Type:</strong> {error.type}<br />
            <strong>Message:</strong> {error.message}<br />
            <strong>Timestamp:</strong> {new Date(error.timestamp).toISOString()}
          </div>
        )}
        {error?.context && (
          <div style={{ marginBottom: '15px' }}>
            <strong>Context:</strong>
            <pre style={{ 
              background: '#f8f9fa', 
              padding: '10px', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {JSON.stringify(error.context, null, 2)}
            </pre>
          </div>
        )}
        <div style={{ marginBottom: '15px' }}>
          <strong>Error Statistics:</strong><br />
          Total Errors: {stats.totalErrors}<br />
          Recent Errors: {stats.recentErrors.length}
        </div>
        {errorInfo && (
          <details style={{ marginBottom: '15px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Component Stack
            </summary>
            <pre style={{ 
              background: '#f8f9fa', 
              padding: '10px', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '11px',
              whiteSpace: 'pre-wrap'
            }}>
              {errorInfo.componentStack}
            </pre>
          </details>
        )}
        <button
          onClick={this.resetErrorBoundary}
          style={{
            padding: '8px 16px',
            backgroundColor: '#00b894',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }
  private renderProductionFallback(): ReactNode {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        margin: '20px 0'
      }}>
        <h3 style={{ color: '#6c757d', margin: '0 0 10px 0' }}>
          Something went wrong
        </h3>
        <p style={{ color: '#6c757d', margin: '0 0 15px 0' }}>
          We're sorry, but something unexpected happened. Please try again.
        </p>
        <button
          onClick={this.resetErrorBoundary}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }
}
/**
 * Enhanced HOC for automatic Store Error Boundary wrapping with security
 * 
 * @template P - Component props type
 * @param WrappedComponent - Component to wrap with error boundary
 * @param errorBoundaryProps - Error boundary configuration
 * @returns Enhanced component with comprehensive error handling
 */
export function withStoreErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<StoreErrorBoundaryProps, 'children'>
): React.ComponentType<P> {
  const WithStoreErrorBoundaryComponent = (props: P) => (
    <StoreErrorBoundary 
      {...errorBoundaryProps}
    >
      <WrappedComponent {...props} />
    </StoreErrorBoundary>
  );
  WithStoreErrorBoundaryComponent.displayName = 
    `withStoreErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
  return WithStoreErrorBoundaryComponent;
}
/**
 * 특정 Store와 연결된 에러 경계 생성 헬퍼
 */
export function createStoreErrorBoundary(
  storeName: string,
  customFallback?: ReactNode
): React.ComponentType<{ children: ReactNode }> {
  return ({ children }) => (
    <StoreErrorBoundary
      fallback={customFallback}
      onError={(error, errorInfo) => {
        console.group(`Store Error in ${storeName}`);
        console.error('Error:', error);
        console.error('Component Stack:', errorInfo.componentStack);
        console.groupEnd();
      }}
      resetKeys={[storeName]}
    >
      {children}
    </StoreErrorBoundary>
  );
}
```

### stores/core/ActionTransactionBridge.ts

```typescript
import type { ActionDispatchTrace, ActionDispatchTraceListener } from '@context-action/core';
import type {
  TransactionCoordinatorPort,
  TransactionHandle,
  TransactionParticipant,
} from '@context-action/store-core';
export interface DispatchTraceSource {
  subscribeDispatchTrace(listener: ActionDispatchTraceListener): () => void;
}
export interface ActionTransactionBridgeOptions {
  getParticipants(event: ActionDispatchTrace): readonly TransactionParticipant[];
}
export function bindActionTransactions(
  source: DispatchTraceSource,
  coordinator: TransactionCoordinatorPort,
  options: ActionTransactionBridgeOptions,
): () => void {
  const pending = new Map<string, TransactionHandle>();
  const unsubscribe = source.subscribeDispatchTrace(event => {
    if (event.phase === 'started') {
      const participants = options.getParticipants(event);
      if (participants.length === 0) return;
      const handle = coordinator.begin(participants, {
        ...(event.transactionId === undefined ? {} : { transactionId: event.transactionId }),
        actionId: event.dispatchId,
        ...(event.origin === undefined ? {} : { origin: event.origin }),
        label: event.label ?? event.action,
      });
      pending.set(event.dispatchId, handle);
      return;
    }
    const handle = pending.get(event.dispatchId);
    if (!handle) return;
    pending.delete(event.dispatchId);
    if (event.status === 'completed' || event.status === 'completed_with_errors') handle.commit();
    else handle.rollback();
  });
  return () => {
    unsubscribe();
    for (const handle of pending.values()) handle.rollback();
    pending.clear();
  };
}
```

### stores/core/BackendStore.ts

```typescript
import type { StateBackend, StateMutationMeta, StatePatch } from '@context-action/store-core';
import { ErrorHandlers } from '../utils/error-handling';
import type { IStore, Listener, Snapshot, StoreSetValueOptions, Unsubscribe } from './types';
export type BackendPatchListener<Patch = StatePatch> = (patches: readonly Patch[] | null) => void;
interface PendingPatchNotification<Patch> {
  patches: readonly Patch[] | null;
  resolved: boolean;
}
function normalizeUnsubscribe(candidate: unknown): Unsubscribe {
  return typeof candidate === 'function' ? candidate as Unsubscribe : () => {};
}
export interface BackendStoreOptions {
  readonly ownership?: 'shared' | 'owned';
}
export type BackendStoreSetValueOptions<T> = StoreSetValueOptions<T> & {
  readonly meta?: StateMutationMeta;
};
export class BackendStore<T = unknown, Patch = StatePatch> implements IStore<T> {
  public readonly name: string;
  private readonly backend: StateBackend<T, Patch>;
  private readonly ownership: 'shared' | 'owned';
  private readonly listeners = new Set<Listener>();
  private readonly patchListeners = new Set<BackendPatchListener<Patch>>();
  private readonly unsubscribeBackend: Unsubscribe;
  private readonly unsubscribeBackendPatches: Unsubscribe;
  private backendSnapshot: ReturnType<StateBackend<T>['getSnapshot']>;
  private backendSnapshotVersion: number;
  private backendSnapshotLastUpdate: number;
  private backendSnapshotValue: T;
  private snapshot: Snapshot<T>;
  private disposed = false;
  private lastPatches: readonly Patch[] | null = null;
  private readonly hasPatchChannel: boolean;
  private hasReadFallbackPatches = false;
  private lastFallbackPatches: readonly Patch[] | null = null;
  private readonly pendingPatchNotifications: PendingPatchNotification<Patch>[] = [];
  private readonly orphanPatchNotifications: Array<readonly Patch[] | null> = [];
  private orphanPatchFlushScheduled = false;
  private listenerDispatchDepth = 0;
  private patchFlushScheduled = false;
  constructor(name: string, backend: StateBackend<T, Patch>, options: BackendStoreOptions = {}) {
    this.name = name;
    this.backend = backend;
    this.ownership = options.ownership ?? 'shared';
    this.backendSnapshot = backend.getSnapshot();
    this.backendSnapshotVersion = this.backendSnapshot.version;
    this.backendSnapshotLastUpdate = this.backendSnapshot.lastUpdate;
    this.backendSnapshotValue = this.backendSnapshot.value;
    this.snapshot = this.toSnapshot(this.backendSnapshot);
    const subscribeWithPatches = backend.subscribeWithPatches;
    this.hasPatchChannel = typeof subscribeWithPatches === 'function';
    let unsubscribeBackendPatches: Unsubscribe = () => {};
    let unsubscribeBackend: Unsubscribe = () => {};
    try {
      unsubscribeBackendPatches = typeof subscribeWithPatches === 'function'
        ? normalizeUnsubscribe(subscribeWithPatches.call(backend, (patches) => {
            this.capturePatchNotification(patches);
          }))
        : (() => {});
      unsubscribeBackend = normalizeUnsubscribe(backend.subscribe(() => {
        if (this.disposed) return;
        let nextBackendSnapshot: ReturnType<StateBackend<T>['getSnapshot']>;
        try {
          nextBackendSnapshot = backend.getSnapshot();
        } catch (error) {
          this.reportListenerError('Backend snapshot read error', error);
          return;
        }
        if (
          nextBackendSnapshot !== this.backendSnapshot ||
          nextBackendSnapshot.version !== this.backendSnapshotVersion ||
          nextBackendSnapshot.lastUpdate !== this.backendSnapshotLastUpdate ||
          !Object.is(nextBackendSnapshot.value, this.backendSnapshotValue)
        ) {
          this.backendSnapshot = nextBackendSnapshot;
          this.backendSnapshotVersion = nextBackendSnapshot.version;
          this.backendSnapshotLastUpdate = nextBackendSnapshot.lastUpdate;
          this.backendSnapshotValue = nextBackendSnapshot.value;
          this.snapshot = this.toSnapshot(nextBackendSnapshot);
        }
        let fallbackPatches: readonly Patch[] | null = null;
        if (!this.hasPatchChannel) {
          try {
            const candidate = backend.getLastPatches?.() ?? null;
            if (!this.hasReadFallbackPatches || !Object.is(candidate, this.lastFallbackPatches)) {
              fallbackPatches = candidate;
            }
            this.lastFallbackPatches = candidate;
            this.hasReadFallbackPatches = true;
          } catch (error) {
            this.reportListenerError('Backend patch read error', error);
          }
        }
        const pendingPatchNotification: PendingPatchNotification<Patch> = {
          patches: fallbackPatches,
          resolved: !this.hasPatchChannel,
        };
        if (this.orphanPatchNotifications.length > 0) {
          pendingPatchNotification.patches = this.orphanPatchNotifications.shift() ?? null;
          pendingPatchNotification.resolved = true;
        }
        this.pendingPatchNotifications.push(pendingPatchNotification);
        this.listenerDispatchDepth += 1;
        try {
          for (const listener of [...this.listeners]) {
            try {
              listener();
            } catch (error) {
              this.reportListenerError('Backend store listener error', error);
            }
          }
        } finally {
          this.listenerDispatchDepth -= 1;
        }
        if (pendingPatchNotification.resolved) {
          this.flushPatchNotifications(true);
        } else {
          this.schedulePatchFlush();
        }
      }));
    } catch (error) {
      try {
        unsubscribeBackendPatches();
      } catch {
      }
      throw error;
    }
    this.unsubscribeBackendPatches = unsubscribeBackendPatches;
    this.unsubscribeBackend = unsubscribeBackend;
  }
  subscribe = (listener: Listener): Unsubscribe => {
    if (typeof listener !== 'function') {
      throw new TypeError('Store subscriber must be a function.');
    }
    if (this.disposed) return () => {};
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  subscribeWithPatches = (listener: BackendPatchListener<Patch>): Unsubscribe => {
    if (typeof listener !== 'function') {
      throw new TypeError('Patch subscriber must be a function.');
    }
    if (this.disposed) return () => {};
    this.patchListeners.add(listener);
    return () => this.patchListeners.delete(listener);
  };
  getSnapshot = (): Snapshot<T> => this.snapshot;
  getValue = (): T => this.backendSnapshot.value;
  getSafeValue = (): T => {
    return this.backend.getSafeValue
      ? this.backend.getSafeValue()
      : this.backendSnapshot.value;
  };
  getLastPatches = (): readonly Patch[] | null => this.lastPatches;
  setValue = (value: T, options?: BackendStoreSetValueOptions<T>): void => {
    if (this.disposed) return;
    const meta = (options as BackendStoreSetValueOptions<T> | undefined)?.meta;
    this.backend.setValue(value, meta);
  };
  update = (updater: (current: T) => T | undefined, meta?: StateMutationMeta): void => {
    if (this.disposed) return;
    this.backend.update(updater, meta);
  };
  getListenerCount = (): number => this.listeners.size + this.patchListeners.size;
  isStoreDisposed = (): boolean => this.disposed;
  dispose = (): void => {
    if (this.disposed) return;
    this.disposed = true;
    try {
      this.unsubscribeBackendPatches();
    } catch (error) {
      this.reportListenerError('Backend patch unsubscribe error', error);
    }
    try {
      this.unsubscribeBackend();
    } catch (error) {
      this.reportListenerError('Backend unsubscribe error', error);
    }
    this.listeners.clear();
    this.patchListeners.clear();
    if (this.ownership === 'owned') {
      try {
        this.backend.dispose?.();
      } catch (error) {
        this.reportListenerError('Owned backend disposal error', error);
      }
    }
  };
  private reportListenerError(message: string, error: unknown): void {
    try {
      ErrorHandlers.store(
        message,
        { storeName: this.name },
        error instanceof Error ? error : undefined,
      );
    } catch {
    }
  }
  private capturePatchNotification(patches: readonly Patch[] | null): void {
    if (this.disposed) return;
    let pending: PendingPatchNotification<Patch> | undefined;
    if (this.listenerDispatchDepth > 0) {
      for (let index = this.pendingPatchNotifications.length - 1; index >= 0; index -= 1) {
        const candidate = this.pendingPatchNotifications[index];
        if (candidate && !candidate.resolved) {
          pending = candidate;
          break;
        }
      }
    }
    pending ??= this.pendingPatchNotifications.find((entry) => !entry.resolved);
    if (pending) {
      pending.patches = patches;
      pending.resolved = true;
      this.schedulePatchFlush();
      return;
    }
    this.orphanPatchNotifications.push(patches);
    this.scheduleOrphanPatchFlush();
  }
  private scheduleOrphanPatchFlush(): void {
    if (this.orphanPatchFlushScheduled) return;
    this.orphanPatchFlushScheduled = true;
    queueMicrotask(() => {
      this.orphanPatchFlushScheduled = false;
      if (this.disposed) {
        this.orphanPatchNotifications.length = 0;
        return;
      }
      while (this.orphanPatchNotifications.length > 0) {
        this.deliverPatchNotification(this.orphanPatchNotifications.shift() ?? null);
      }
    });
  }
  private schedulePatchFlush(): void {
    if (this.patchFlushScheduled) return;
    this.patchFlushScheduled = true;
    queueMicrotask(() => {
      this.patchFlushScheduled = false;
      if (this.disposed) {
        this.pendingPatchNotifications.length = 0;
        this.orphanPatchNotifications.length = 0;
        this.orphanPatchFlushScheduled = false;
        this.listenerDispatchDepth = 0;
        return;
      }
      this.flushPatchNotifications(false);
    });
  }
  private flushPatchNotifications(onlyResolved: boolean): void {
    if (onlyResolved) {
      while (this.pendingPatchNotifications.length > 0) {
        const pending = this.pendingPatchNotifications[0];
        if (!pending?.resolved) return;
        this.pendingPatchNotifications.shift();
        this.deliverPatchNotification(pending.patches);
      }
      return;
    }
    while (this.pendingPatchNotifications.length > 0) {
      const pending = this.pendingPatchNotifications[0];
      if (!pending) return;
      this.pendingPatchNotifications.shift();
      const patches = pending.resolved ? pending.patches : null;
      pending.resolved = true;
      pending.patches = patches;
      this.deliverPatchNotification(patches);
    }
  }
  private deliverPatchNotification(patches: readonly Patch[] | null): void {
    this.lastPatches = patches;
    for (const listener of [...this.patchListeners]) {
      try {
        listener(patches);
      } catch (error) {
        this.reportListenerError('Backend store patch listener error', error);
      }
    }
  }
  private toSnapshot(source: ReturnType<StateBackend<T>['getSnapshot']>): Snapshot<T> {
    return {
      value: source.value,
      name: source.name || this.name,
      version: source.version,
      lastUpdate: source.lastUpdate,
    };
  }
}
export function createBackendStore<T, Patch = StatePatch>(
  name: string,
  backend: StateBackend<T, Patch>,
  options?: BackendStoreOptions,
): BackendStore<T, Patch> {
  return new BackendStore(name, backend, options);
}
```

### stores/core/contracts.ts

```typescript
import type {
  HistoryEntryId as CoreHistoryEntryId,
  StateMutationMeta as BackendMutationMeta,
  StateMutationOrigin as CoreMutationOrigin,
  StateReader,
  StateSnapshot,
  StateTransition as BackendStateTransition,
  TimelineBackend,
  TransactionParticipantBackend,
} from '@context-action/store-core';
export type StateMutationOrigin = CoreMutationOrigin;
export interface StateMutationMeta extends Pick<BackendMutationMeta, 'transactionId' | 'actionId' | 'origin' | 'label'> {}
export interface ReadonlyStateSnapshot<T> extends StateSnapshot<T> {}
export interface StoreReader<T> extends StateReader<T, ReadonlyStateSnapshot<T>> {}
export interface StoreWriter<T> {
  setValue(value: T, meta?: StateMutationMeta): void;
  update(updater: (current: T) => T | undefined, meta?: StateMutationMeta): void;
}
export interface TimelineReader<T> extends StoreReader<T>, Pick<TimelineBackend<T>, 'canUndo' | 'canRedo' | 'getPosition' | 'getHistoryLength'> {}
export type HistoryEntryId = CoreHistoryEntryId;
export interface TransactionBackend<T = unknown> extends TransactionParticipantBackend<T> {
  beginBatch(meta?: StateMutationMeta, options?: { deferNotification?: boolean }): void;
  undo(steps?: number, meta?: StateMutationMeta): void;
  redo(steps?: number, meta?: StateMutationMeta): void;
  goToHistoryEntry(entryId: HistoryEntryId, meta?: StateMutationMeta): void;
}
export interface StateTransition<T> extends Omit<BackendStateTransition<T>, 'meta'> {
  readonly meta: StateMutationMeta;
}
export interface TimelineWriter {
  undo(steps?: number): void;
  redo(steps?: number): void;
  goTo(position: number): void;
  reset(): void;
}
```

### stores/core/frame-scheduler.ts

```typescript
export interface FrameHandle {
  cancel(): void;
}
export function scheduleFrame(callback: (timestamp: number) => void): FrameHandle {
  const animationFrameHost =
    typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
      ? window
      : globalThis;
  if (typeof animationFrameHost.requestAnimationFrame === 'function') {
    const id = animationFrameHost.requestAnimationFrame(callback);
    return {
      cancel: () => animationFrameHost.cancelAnimationFrame?.(id),
    };
  }
  const id = setTimeout(() => callback(Date.now()), 0);
  return { cancel: () => clearTimeout(id) };
}
```

### stores/core/Store.ts

```typescript
import { type Patches, produceWithPatches, safeGet, safeSet } from '@context-action/mutative';
import {
  ComparisonOptions,
  compareValues
} from '../utils/comparison';
import { ErrorHandlers } from '../utils/error-handling';
import { TypeGuards } from '../utils/type-guards';
import { type FrameHandle, scheduleFrame } from './frame-scheduler';
import type { IStore, Listener, Snapshot, StoreSetValueOptions, Unsubscribe } from './types';
export type PatchAwareListener = (patches: Patches | null) => void;
function deepFreeze<T>(obj: T, seen = new WeakSet<object>()): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (seen.has(obj)) {
    return obj;
  }
  const proto = Object.getPrototypeOf(obj);
  if (proto !== Object.prototype && proto !== Array.prototype && proto !== null) {
    return obj;
  }
  seen.add(obj);
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    const value = (obj as Record<string, unknown>)[key];
    if (value !== null && typeof value === 'object') {
      deepFreeze(value, seen);
    }
  }
  return obj;
}
export class Store<T = unknown> implements IStore<T> {
  private listeners = new Set<Listener>();
  private patchAwareListeners = new Set<PatchAwareListener>();
  private _lastPatches: Patches | null = null;
  protected _value: T;
  protected _snapshot: Snapshot<T>;
  private _lastClonedValue: T | null = null;
  private _lastClonedVersion = 0;
  private _version = 0;
  private isUpdating = false;
  private updateQueue: Array<() => void> = [];
  private notificationMode: 'batched' | 'immediate' = 'batched';
  private pendingNotification = false;
  private animationFrameId: FrameHandle | null = null;
  private pendingUpdatesCount = 0; 
  private pendingPatches: Patches | null = null;
  private cleanupTasks = new Set<() => void>();
  private isDisposed = false;
  private errorCount = 0;
  private lastErrorTime = 0;
  private readonly MAX_ERROR_COUNT = 5;
  private readonly ERROR_RESET_TIME = 60000; 
  private subscriptionRegistry = new WeakMap<() => void, {
    subscribedAt: number;
    errorCount: number;
  }>();
  public readonly name: string;
  private customComparator: ((oldValue: T, newValue: T) => boolean) | undefined;
  private comparisonOptions: Partial<ComparisonOptions<T>> | undefined;
  private cloningEnabled: boolean = true;
  constructor(name: string, initialValue: T) {
    this.name = name;
    this._value = safeSet(initialValue, true);
    this._snapshot = this._createSnapshot();
  }
  subscribe = (listener: Listener): Unsubscribe => {
    if (this.isDisposed) {
      console.warn(`Cannot subscribe to disposed store "${this.name}"`);
      return () => {};
    }
    const enhancedListener = () => {
      if (this.isDisposed) return;
      try {
        listener();
        if (this.errorCount > 0) {
          this.errorCount = 0;
        }
      } catch (error) {
        this._handleListenerError(error, enhancedListener);
      }
    };
    this.subscriptionRegistry.set(enhancedListener, {
      subscribedAt: Date.now(),
      errorCount: 0,
    });
    this.listeners.add(enhancedListener);
    return () => {
      this.listeners.delete(enhancedListener);
      this.subscriptionRegistry.delete(enhancedListener);
    };
  };
  subscribeWithPatches = (listener: PatchAwareListener): Unsubscribe => {
    if (this.isDisposed) {
      console.warn(`Cannot subscribe to disposed store "${this.name}"`);
      return () => {};
    }
    this.patchAwareListeners.add(listener);
    return () => this.patchAwareListeners.delete(listener);
  };
  getLastPatches(): Patches | null {
    return this._lastPatches;
  }
  getSnapshot = (): Snapshot<T> => {
    return this._snapshot;
  };
  getValue(): T {
    const valueType = typeof this._value;
    if (valueType !== 'object' || this._value === null) {
      return this._value;
    }
    if (this.cloningEnabled) {
      if (this._lastClonedVersion === this._version && this._lastClonedValue !== null) {
        return this._lastClonedValue;
      }
      const cloned = safeGet(this._value, this.cloningEnabled);
      this._lastClonedValue = deepFreeze(cloned);
      this._lastClonedVersion = this._version;
      return this._lastClonedValue;
    }
    return this._value;
  }
  getSafeValue(): T {
    return deepFreeze(safeGet(this._value, true));
  }
  setValue(value: T, options?: StoreSetValueOptions<T>): void {
    if (this.isDisposed) return;
    if (TypeGuards.isObject(value)) {
      if (!TypeGuards.isRefState(value) && TypeGuards.isSuspiciousEventObject(value)) {
        const eventHandling = options?.eventHandling || 'block';
        const hasEventTarget = TypeGuards.hasTargetProperty(value);
        const hasPreventDefault = TypeGuards.isEventLike(value);
        const isEvent = TypeGuards.isDOMEvent(value);
        switch (eventHandling) {
          case 'allow':
            break;
          case 'transform':
            if (options?.eventTransform) {
              try {
                value = options.eventTransform(value);
              } catch (error) {
                ErrorHandlers.store(
                  'Event transformation failed in Store.setValue',
                  {
                    storeName: this.name,
                    valueType: typeof value,
                    error: error instanceof Error ? error.message : String(error)
                  }
                );
                return;
              }
            } else {
              ErrorHandlers.store(
                'Event transformation requested but no transform function provided',
                { storeName: this.name, valueType: typeof value }
              );
              return;
            }
            break;
          default:
            ErrorHandlers.store(
              'Event object detected in Store.setValue - this may cause memory leaks',
              {
                storeName: this.name,
                valueType: typeof value,
                constructorName: value?.constructor?.name,
                isEvent,
                hasTargetProperty: hasEventTarget,
                hasPreventDefault,
                problematicProperties: TypeGuards.findProblematicProperties(value)
              }
            );
            return;
        }
      }
    }
    const safeValue = options?.skipClone ? value : safeSet(value, this.cloningEnabled);
    let hasChanged = true;
    if (!options?.skipComparison) {
      hasChanged = this._compareValues(this._value, safeValue);
    }
    if (hasChanged && !this.isDisposed) {
      if (this.patchAwareListeners.size > 0 &&
          TypeGuards.isObject(this._value) &&
          TypeGuards.isObject(safeValue)) {
        try {
          const [, patches] = produceWithPatches(
            this._value,
            (draft) => {
              const draftKeys = Object.keys(draft as object);
              const valueKeys = Object.keys(safeValue as object);
              for (const key of draftKeys) {
                if (Object.getOwnPropertyDescriptor(safeValue, key) === undefined) {
                  delete (draft as Record<string, unknown>)[key];
                }
              }
              for (const key of valueKeys) {
                (draft as Record<string, unknown>)[key] = (safeValue as Record<string, unknown>)[key];
              }
            }
          );
          this._lastPatches = patches;
        } catch {
          this._lastPatches = null;
        }
      } else {
        this._lastPatches = null;
      }
      if (this.isDisposed) return;
      this._value = safeValue;
      this._version++;
      this._snapshot = this._createSnapshot();
      this._scheduleNotification();
    }
  }
  update(updater: (current: T) => T | undefined): void {
    if (this.isDisposed) return;
    if (this.isUpdating) {
      this.updateQueue.push(() => this.update(updater));
      return;
    }
    try {
      this.isUpdating = true;
      let updatedValue: T;
      let patches: Patches | null = null;
      try {
        const [nextState, capturedPatches] = produceWithPatches(
          this._value,
          (draft): T | undefined => {
            const result = updater(draft as T);
            if (result !== undefined) {
              return result;
            }
            return undefined;
          }
        );
        updatedValue = nextState as T;
        patches = capturedPatches;
      } catch (mutativeError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Store] Mutative update failed, falling back to safe copy method', mutativeError);
        }
        const safeCurrentValue = safeGet(this._value, this.cloningEnabled);
        try {
          const [nextState, capturedPatches] = produceWithPatches(
            safeCurrentValue,
            (draft): T | undefined => {
              const result = updater(draft as T);
              if (result !== undefined) {
                return result;
              }
              return undefined;
            }
          );
          updatedValue = nextState as T;
          patches = capturedPatches;
        } catch (secondMutativeError) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[Store] Mutative completely failed, using direct update (immutability not guaranteed)', secondMutativeError);
          }
          try {
            const result = updater(safeCurrentValue);
            updatedValue = result !== undefined ? result : safeCurrentValue;
          } catch (updaterError) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('[Store] Updater function threw an error, update aborted', updaterError);
            }
            return;
          }
          patches = null; 
        }
      }
      if (this.isDisposed) return;
      if (TypeGuards.isObject(updatedValue)) {
        if (!TypeGuards.isRefState(updatedValue) && TypeGuards.isSuspiciousEventObject(updatedValue)) {
          const hasEventTarget = TypeGuards.hasTargetProperty(updatedValue);
          const hasPreventDefault = TypeGuards.isEventLike(updatedValue);
          const isEvent = TypeGuards.isDOMEvent(updatedValue);
          ErrorHandlers.store(
            'Event object detected in Store.update result - this may cause memory leaks',
            {
              storeName: this.name,
              updatedValueType: typeof updatedValue,
              constructorName: updatedValue?.constructor?.name,
              isEvent,
              hasTargetProperty: hasEventTarget,
              hasPreventDefault,
              problematicProperties: TypeGuards.findProblematicProperties(updatedValue)
            }
          );
          return;
        }
      }
      if (this._compareValues(this._value, updatedValue) && !this.isDisposed) {
        this._lastPatches = patches;
        this._value = updatedValue;
        this._version++;
        this._snapshot = this._createSnapshot();
        this._scheduleNotification();
      }
    } finally {
      this.isUpdating = false;
      if (this.updateQueue.length > 0) {
        const nextUpdate = this.updateQueue.shift();
        if (nextUpdate) {
          Promise.resolve().then(nextUpdate);
        }
      }
    }
  }
  getListenerCount(): number {
    return this.listeners.size + this.patchAwareListeners.size;
  }
  clearListeners(): void {
    this.listeners.clear();
    this.patchAwareListeners.clear();
  }
  notifyPath(path: (string | number)[]): void {
    if (this.isDisposed) return;
    const currentValue = this._getValueAtPath(path);
    const syntheticPatch: Patches = [{
      op: 'replace',
      path: path,
      value: currentValue
    }];
    this._lastPatches = syntheticPatch;
    this._scheduleNotification();
  }
  notifyPaths(paths: (string | number)[][]): void {
    if (this.isDisposed) return;
    if (paths.length === 0) return;
    const syntheticPatches: Patches = paths.map(path => ({
      op: 'replace' as const,
      path: path,
      value: this._getValueAtPath(path)
    }));
    this._lastPatches = syntheticPatches;
    this._scheduleNotification();
  }
  private _getValueAtPath(path: (string | number)[]): unknown {
    let current: unknown = this._value;
    for (const segment of path) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = (current as Record<string | number, unknown>)[segment];
    }
    return current;
  }
  registerCleanup(task: () => void): () => void {
    if (this.isDisposed) {
      console.warn(`Store "${this.name}" is already disposed, cleanup task ignored`);
      return () => {};
    }
    this.cleanupTasks.add(task);
    return () => this.cleanupTasks.delete(task);
  }
  dispose(): void {
    if (this.isDisposed) {
      return; 
    }
    this.isDisposed = true;
    try {
      this.cleanupTasks.forEach(task => {
        try {
          task();
        } catch (error) {
          ErrorHandlers.store(
            'Error during cleanup task execution',
            { storeName: this.name },
            error instanceof Error ? error : undefined
          );
        }
      });
      this.cleanupTasks.clear();
      this.subscriptionRegistry = new WeakMap();
      this.clearListeners();
      if (this.animationFrameId !== null) {
        this.animationFrameId.cancel();
        this.animationFrameId = null;
      }
      this.pendingNotification = false;
      this.pendingPatches = null;
      this.pendingUpdatesCount = 0;
      this.updateQueue.length = 0;
    } catch (error) {
      ErrorHandlers.store(
        'Critical error during store disposal',
        { storeName: this.name },
        error instanceof Error ? error : undefined
      );
    }
  }
  isStoreDisposed(): boolean {
    return this.isDisposed;
  }
  setCustomComparator(comparator: (oldValue: T, newValue: T) => boolean): void {
    this.customComparator = comparator;
  }
  setComparisonOptions(options: Partial<ComparisonOptions<T>>): void {
    this.comparisonOptions = options;
  }
  setCloningEnabled(enabled: boolean): void {
    this.cloningEnabled = enabled;
  }
  isCloningEnabled(): boolean {
    return this.cloningEnabled;
  }
  protected _compareValues(oldValue: T, newValue: T): boolean {
    let result: boolean;
    try {
      if (this.customComparator) {
        const areEqual = this.customComparator(oldValue, newValue);
        result = !areEqual; 
      }
      else if (this.comparisonOptions) {
        const areEqual = compareValues(oldValue, newValue, this.comparisonOptions);
        result = !areEqual;
      }
      else {
        const areEqual = compareValues(oldValue, newValue, { strategy: 'reference' });
        result = !areEqual;
      }
    } catch (error) {
      ErrorHandlers.store(
        'Error during value comparison, falling back to reference comparison',
        { storeName: this.name },
        error instanceof Error ? error : undefined
      );
      result = !Object.is(oldValue, newValue);
    }
    return result;
  }
  protected _createSnapshot(): Snapshot<T> {
    const clonedValue = safeGet(this._value, this.cloningEnabled);
    const frozenValue = this.cloningEnabled ? deepFreeze(clonedValue) : clonedValue;
    return {
      value: frozenValue,
      name: this.name,
      lastUpdate: Date.now()
    };
  }
  protected _scheduleNotification(): void {
    if (this.isDisposed) return;
    if (this.notificationMode === 'immediate') {
      this._notifyListeners();
    } else {
      this._scheduleWithRAF();
    }
  }
  private _scheduleWithRAF(): void {
    this.pendingUpdatesCount++;
    this.pendingPatches = this.pendingUpdatesCount === 1
      ? this._lastPatches
      : this.pendingPatches && this._lastPatches
        ? this.pendingPatches.concat(this._lastPatches)
        : null;
    if (!this.pendingNotification) {
      this.pendingNotification = true;
      this.animationFrameId = scheduleFrame(() => {
        this._executeNotification();
      });
    }
  }
  private _executeNotification(): void {
    this.pendingNotification = false;
    this.animationFrameId = null;
    this._lastPatches = this.pendingPatches;
    this.pendingPatches = null;
    const batchedUpdates = this.pendingUpdatesCount;
    this.pendingUpdatesCount = 0;
    this._notifyListeners();
    if (process.env.NODE_ENV === 'development' && batchedUpdates > 1) {
      console.debug(`[Store:${this.name}] Batched ${batchedUpdates} updates in single frame`);
    }
  }
  private _handleListenerError(error: unknown, enhancedListener: () => void): void {
    const now = Date.now();
    if (now - this.lastErrorTime > this.ERROR_RESET_TIME) {
      this.errorCount = 0;
    }
    this.errorCount++;
    this.lastErrorTime = now;
    const metadata = this.subscriptionRegistry.get(enhancedListener);
    if (metadata) {
      metadata.errorCount++;
    }
    try {
      ErrorHandlers.store(
        'Error in store listener execution',
        { 
          storeName: this.name,
          listenerCount: this.listeners.size,
          errorCount: this.errorCount,
          subscriptionAge: metadata ? now - metadata.subscribedAt : 'unknown'
        },
        error instanceof Error ? error : undefined
      );
    } catch {
    }
    if (metadata && metadata.errorCount >= 3) {
      console.warn(
        `Removing problematic listener from store "${this.name}" after ${metadata.errorCount} errors`
      );
      this.listeners.delete(enhancedListener);
      this.subscriptionRegistry.delete(enhancedListener);
    }
    if (this.errorCount >= this.MAX_ERROR_COUNT) {
      console.error(
        `Store "${this.name}" disabled due to excessive errors (${this.errorCount})`
      );
      this.clearListeners();
    }
  }
  private _notifyListeners(): void {
    if (this.isDisposed) return;
    const notifiedPatches = this._lastPatches;
    for (const listener of [...this.listeners]) {
      if (this.isDisposed) return;
      if (!this.listeners.has(listener)) continue;
      listener(); 
    }
    for (const listener of [...this.patchAwareListeners]) {
      if (this.isDisposed) return;
      if (!this.patchAwareListeners.has(listener)) continue;
      try {
        listener(notifiedPatches);
      } catch (error) {
        try {
          ErrorHandlers.store(
            'Error in patch-aware listener execution',
            { storeName: this.name },
            error instanceof Error ? error : undefined
          );
        } catch {
        }
      }
    }
  }
}
export function createStore<T>(name: string, initialValue: T): Store<T> {
  const store = new Store<T>(name, initialValue);
  return store;
}
```

### stores/core/StoreRegistry.ts

```typescript
import type { IStore, IStoreRegistry, Listener, Unsubscribe } from './types';
export interface StoreMetadata {
  registeredAt: number;
  name: string;
  debug?: boolean;
}
export class StoreRegistry implements IStoreRegistry {
  private stores = new Map<string, IStore<any>>();
  private metadata = new WeakMap<IStore<any>, StoreMetadata>();
  private listeners = new Set<Listener>();
  private _snapshot: Array<[string, IStore<any>]> = [];
  public readonly name: string;
  constructor(name: string = 'default') {
    this.name = name;
  }
  subscribe(listener: Listener): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  register(name: string, store: IStore<any>, metadata?: Partial<StoreMetadata>): void {
    this.stores.set(name, store);
    if (metadata) {
      this.metadata.set(store, {
        registeredAt: Date.now(),
        name,
        ...metadata
      });
    }
    this._updateSnapshot();
    this._notifyListeners();
  }
  unregister(name: string): boolean {
    const store = this.stores.get(name);
    if (!store) {
      return false;
    }
    this.stores.delete(name);
    this._updateSnapshot();
    this._notifyListeners();
    return true;
  }
  getStore(name: string): IStore<any> | undefined {
    return this.stores.get(name);
  }
  hasStore(name: string): boolean {
    return this.stores.has(name);
  }
  getStoreNames(): string[] {
    return Array.from(this.stores.keys());
  }
  getAllStores(): Map<string, IStore<any>> {
    return new Map(this.stores);
  }
  getStoreMetadata(nameOrStore: string | IStore<any>): StoreMetadata | undefined {
    const store = typeof nameOrStore === 'string' ? this.stores.get(nameOrStore) : nameOrStore;
    return store ? this.metadata.get(store) : undefined;
  }
  updateStoreMetadata(nameOrStore: string | IStore<any>, metadata: Partial<StoreMetadata>): boolean {
    const store = typeof nameOrStore === 'string' ? this.stores.get(nameOrStore) : nameOrStore;
    if (!store) {
      return false;
    }
    const currentMetadata = this.metadata.get(store);
    this.metadata.set(store, {
      registeredAt: Date.now(),
      name: typeof nameOrStore === 'string' ? nameOrStore : currentMetadata?.name || 'unknown',
      ...currentMetadata,
      ...metadata
    });
    return true;
  }
  getSnapshot(): Array<[string, IStore<any>]> {
    return this._snapshot;
  }
  clear(): void {
    this.stores.clear();
    this._updateSnapshot();
    this._notifyListeners();
  }
  dispose(): void {
    this.clear();
    this.listeners.clear();
  }
  getStoreCount(): number {
    return this.stores.size;
  }
  forEach(callback: (store: IStore<any>, name: string) => void): void {
    this.stores.forEach((store, name) => {
      callback(store, name);
    });
  }
  getStats() {
    return {
      totalStores: this.stores.size,
      storeNames: this.getStoreNames(),
      registryName: this.name
    };
  }
  private _updateSnapshot(): void {
    this._snapshot = Array.from(this.stores.entries());
  }
  private _notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in registry listener:', error);
      }
    });
  }
}
export const globalStoreRegistry = new StoreRegistry('global');
```

### stores/core/StoreTransactionCoordinator.ts

```typescript
import { ErrorHandlers } from '../utils/error-handling';
import type {
  TransactionCoordinatorPort,
  TransactionHandle,
  TransactionMeta,
  TransactionOptions,
  TransactionParticipant,
  TransactionParticipantBackend,
} from '@context-action/store-core';
import type { HistoryEntryId, StateMutationMeta, TransactionBackend } from './contracts';
type TimeTravelTransitionMeta = StateMutationMeta;
const activeTransactionStores = new WeakSet<TransactionParticipantBackend>();
export interface StoreTransactionMeta extends TransactionMeta {}
export type StoreTransactionOptions = TransactionOptions;
export interface StoreTransactionParticipant<T = unknown> extends TransactionParticipant<T> {
  readonly store: TransactionBackend<T>;
}
export interface StoreTransactionRecord {
  readonly meta: StoreTransactionMeta;
  readonly participants: readonly {
    readonly name: string;
    readonly before: number;
    readonly after: number;
  }[];
}
export type StoreTransactionEventPhase = 'started' | 'committed' | 'rolled_back' | 'undone' | 'redone';
export interface StoreTransactionEvent {
  readonly phase: StoreTransactionEventPhase;
  readonly record: StoreTransactionRecord;
}
export type StoreTransactionListener = (event: StoreTransactionEvent) => void;
export interface StoreTransactionInspectorSnapshot {
  readonly version: number;
  readonly position: number;
  readonly historyLength: number;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly latest?: StoreTransactionRecord;
}
export interface StoreTransactionInspectorSink {
  write(snapshot: StoreTransactionInspectorSnapshot): void;
}
type StoredStoreTransactionRecord = Omit<StoreTransactionRecord, 'participants'> & {
  readonly participants: readonly {
    readonly name: string;
    readonly store: TransactionParticipantBackend;
    readonly before: number;
    readonly after: number;
    readonly beforeEntryId: HistoryEntryId;
    readonly afterEntryId: HistoryEntryId;
    readonly changed: boolean;
  }[];
};
export interface StoreTransactionHandle extends TransactionHandle {
  readonly meta: StoreTransactionMeta;
}
export class StoreTransactionCoordinator implements TransactionCoordinatorPort {
  private sequence = 0;
  private position = 0;
  private history: StoredStoreTransactionRecord[] = [];
  private readonly activeStores = new Set<TransactionParticipantBackend>();
  private readonly listeners = new Set<StoreTransactionListener>();
  private inspectorVersion = 0;
  private inspectorSnapshot: StoreTransactionInspectorSnapshot = {
    version: 0,
    position: 0,
    historyLength: 0,
    canUndo: false,
    canRedo: false,
  };
  subscribe(listener: StoreTransactionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  serializeHistory(): string {
    return JSON.stringify(this.getHistory());
  }
  getInspectorSnapshot(): StoreTransactionInspectorSnapshot {
    return this.inspectorSnapshot;
  }
  bindInspector(sink: StoreTransactionInspectorSink): () => void {
    try {
      sink.write(this.getInspectorSnapshot());
    } catch (error) {
      this.reportListenerError(error);
    }
    return this.subscribe(() => {
      try {
        sink.write(this.getInspectorSnapshot());
      } catch (error) {
        this.reportListenerError(error);
      }
    });
  }
  private reportListenerError(error: unknown): void {
    try {
      ErrorHandlers.store('Transaction listener error', undefined, error instanceof Error ? error : undefined);
    } catch {}
  }
  private updateInspectorSnapshot(): void {
    this.inspectorVersion += 1;
    const latest = this.history[this.history.length - 1];
    this.inspectorSnapshot = {
      version: this.inspectorVersion,
      position: this.position,
      historyLength: this.history.length,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      ...(latest && { latest: this.snapshot(latest) }),
    };
  }
  private emit(
    phase: StoreTransactionEventPhase,
    record: StoreTransactionRecord,
    snapshotAlreadyUpdated = false,
  ): void {
    const snapshot = this.snapshot(record);
    if (!snapshotAlreadyUpdated) {
      this.updateInspectorSnapshot();
    }
    for (const listener of [...this.listeners]) {
      try {
        listener({ phase, record: snapshot });
      } catch (error) {
        this.reportListenerError(error);
      }
    }
  }
  private snapshot(record: StoreTransactionRecord): StoreTransactionRecord {
    return {
      meta: { ...record.meta },
      participants: record.participants.map(({ name, before, after }) => ({ name, before, after })),
    };
  }
  begin(
    participants: readonly TransactionParticipant[],
    options: StoreTransactionOptions = {},
  ): StoreTransactionHandle {
    const id = `tx_${++this.sequence}`;
    const meta = { ...options, id } satisfies StoreTransactionMeta;
    const unique = participants.map(({ name, store, batchControl }) => ({
      name,
      store,
      batchControl: batchControl ?? store,
    }));
    if (unique.length === 0) throw new Error('A transaction requires at least one participant');
    const participantNames = new Set<string>();
    const participantStores = new Set<TransactionParticipantBackend>();
    for (const participant of unique) {
      if (participantNames.has(participant.name)) {
        throw new Error(`Duplicate transaction participant name "${participant.name}"`);
      }
      if (participantStores.has(participant.store)) {
        throw new Error(`Store "${participant.store.name}" is registered more than once in the transaction`);
      }
      participantNames.add(participant.name);
      participantStores.add(participant.store);
      if (this.activeStores.has(participant.store) || activeTransactionStores.has(participant.store)) {
        throw new Error(`Store "${participant.store.name}" already participates in an active transaction`);
      }
    }
    if (unique.some(participant => participant.store.isStoreDisposed())) {
      throw new Error('A transaction cannot include a disposed store');
    }
    const before = unique.map(participant => ({
      ...participant,
      position: participant.store.getPosition(),
      beforeEntryId: participant.store.getHistoryEntryId(),
    }));
    const started: typeof unique = [];
    try {
      for (const participant of unique) {
        participant.batchControl.beginBatch(meta, { deferNotification: true });
        started.push(participant);
      }
    } catch (error) {
      const cleanup = (operation: () => void) => {
        try { operation(); } catch (cleanupError) { this.reportListenerError(cleanupError); }
      };
      for (const participant of [...started].reverse()) cleanup(() => participant.batchControl.cancelBatch());
      for (const participant of started) cleanup(() => participant.batchControl.resumeNotifications());
      for (const participant of started) {
        cleanup(() => participant.batchControl.flushNotifications());
      }
      throw error;
    }
    for (const participant of unique) {
      this.activeStores.add(participant.store);
      activeTransactionStores.add(participant.store);
    }
    this.emit('started', { meta, participants: before.map(({ name, position }) => ({ name, before: position, after: position })) });
    let closed = false;
    const endBatches = () => {
      for (const participant of [...unique].reverse()) participant.batchControl.endBatch();
    };
    const cancelBatches = () => {
      for (const participant of [...unique].reverse()) {
        if (participant.store.isStoreDisposed()) continue;
        try {
          participant.batchControl.cancelBatch();
        } catch (error) {
          this.reportListenerError(error);
        }
      }
    };
    const flushBatches = () => {
      for (const participant of unique) {
        try {
          participant.batchControl.resumeNotifications();
        } catch (cleanupError) {
          this.reportListenerError(cleanupError);
        }
      }
      for (const participant of unique) {
        try {
          participant.batchControl.flushNotifications();
        } catch (cleanupError) {
          this.reportListenerError(cleanupError);
        }
      }
    };
    return {
      meta,
      commit: () => {
        if (closed) return;
        closed = true;
        try {
          const disposed = unique.find(participant => participant.store.isStoreDisposed());
          if (disposed) throw new Error(`Store "${disposed.store.name}" is disposed`);
          endBatches();
          const record = {
            meta,
            participants: before.map(participant => ({
                name: participant.name,
                store: participant.store,
                before: participant.position,
                after: participant.store.getPosition(),
                beforeEntryId: participant.beforeEntryId,
                afterEntryId: participant.store.getHistoryEntryId(),
                changed: participant.beforeEntryId !== participant.store.getHistoryEntryId(),
              })),
          };
          const hasChanged = record.participants.some(participant => participant.changed);
          if (hasChanged) {
            this.history = this.history.slice(0, this.position);
            this.history.push(record);
            this.position += 1;
            this.updateInspectorSnapshot();
          }
          flushBatches();
          if (hasChanged) {
            this.emit('committed', record, true);
          }
        } catch (error) {
          cancelBatches();
          flushBatches();
          throw error;
        } finally {
          for (const participant of unique) {
            this.activeStores.delete(participant.store);
            activeTransactionStores.delete(participant.store);
          }
        }
      },
      rollback: () => {
        if (closed) return;
        closed = true;
        try {
          cancelBatches();
          flushBatches();
          this.emit('rolled_back', { meta, participants: before.map(({ name, position }) => ({ name, before: position, after: position })) });
        } finally {
          for (const participant of unique) {
            this.activeStores.delete(participant.store);
            activeTransactionStores.delete(participant.store);
          }
        }
      },
    };
  }
  async run<R>(
    participants: readonly TransactionParticipant[],
    callback: (meta: StoreTransactionMeta) => R | Promise<R>,
    options: StoreTransactionOptions = {},
  ): Promise<R> {
    const handle = this.begin(participants, options);
    try {
      const result = await callback(handle.meta);
      handle.commit();
      return result;
    } catch (error) {
      handle.rollback();
      throw error;
    }
  }
  canUndo(): boolean {
    return this.position > 0 && this.canMoveRecord(this.history[this.position - 1]!, 'undo');
  }
  canRedo(): boolean {
    return this.position < this.history.length && this.canMoveRecord(this.history[this.position]!, 'redo');
  }
  getPosition(): number { return this.position; }
  getHistory(): readonly StoreTransactionRecord[] { return this.history.map(record => this.snapshot(record)); }
  undo(): void {
    if (!this.canUndo()) return;
    const record = this.history[this.position - 1]!;
    this.assertAtPositions(record, 'after');
    this.applyPositions(record, 'undo', () => {
      this.position -= 1;
      this.updateInspectorSnapshot();
    });
    this.emit('undone', record, true);
  }
  redo(): void {
    if (!this.canRedo()) return;
    const record = this.history[this.position]!;
    this.assertAtPositions(record, 'before');
    this.applyPositions(record, 'redo', () => {
      this.position += 1;
      this.updateInspectorSnapshot();
    });
    this.emit('redone', record, true);
  }
  private applyPositions(
    record: StoredStoreTransactionRecord,
    origin: 'undo' | 'redo',
    onApplied: () => void,
  ): void {
    const participants = record.participants.map(({ store }) => store);
    const metadata = { ...record.meta, origin } satisfies TimeTravelTransitionMeta;
    const started: TransactionParticipantBackend[] = [];
    try {
      for (const store of participants) {
        store.beginBatch(metadata, { deferNotification: true });
        started.push(store);
      }
    } catch (error) {
      for (const store of [...started].reverse()) {
        try {
          store.cancelBatch();
        } catch (cleanupError) {
          this.reportListenerError(cleanupError);
        }
      }
      for (const store of started) {
        try {
          store.resumeNotifications();
        } catch (cleanupError) {
          this.reportListenerError(cleanupError);
        }
        try {
          store.flushNotifications();
        } catch (cleanupError) {
          this.reportListenerError(cleanupError);
        }
      }
      throw error;
    }
    let applied = false;
    let ended = false;
    try {
      for (const participant of participants) {
        const participantRecord = record.participants.find(({ store }) => store === participant)!;
        if (!participantRecord.changed) continue;
        if (origin === 'undo' ? !participant.canUndo() : !participant.canRedo()) {
          throw new Error(`Transaction ${record.meta.id} cannot ${origin} retained history on store "${participant.name}"`);
        }
        const targetEntryId = origin === 'undo' ? participantRecord.beforeEntryId : participantRecord.afterEntryId;
        if (!participant.hasHistoryEntry(targetEntryId)) {
          throw new Error(`Transaction ${record.meta.id} cannot ${origin} retained history on store "${participant.name}"`);
        }
        participant.goToHistoryEntry(targetEntryId, metadata);
      }
      applied = true;
      for (const store of [...participants].reverse()) {
        store.endBatch();
      }
      ended = true;
      onApplied();
    } finally {
      if (!ended) {
        for (const store of [...participants].reverse()) {
          try {
            if (applied) store.endBatch();
            else if (!store.isStoreDisposed()) store.cancelBatch();
          } catch (cleanupError) {
            this.reportListenerError(cleanupError);
          }
        }
      }
      for (const store of participants) {
        try {
          store.resumeNotifications();
        } catch (cleanupError) {
          this.reportListenerError(cleanupError);
        }
        try {
          store.flushNotifications();
        } catch (cleanupError) {
          this.reportListenerError(cleanupError);
        }
      }
    }
  }
  private assertAtPositions(record: StoredStoreTransactionRecord, side: 'before' | 'after'): void {
    for (const participant of record.participants) {
      const expectedEntryId = participant[`${side}EntryId`];
      if (participant.store.isStoreDisposed() || participant.store.getHistoryEntryId() !== expectedEntryId) {
        throw new Error(`Transaction ${record.meta.id} conflicts with external history on store "${participant.name}"`);
      }
    }
  }
  private canMoveRecord(record: StoredStoreTransactionRecord, direction: 'undo' | 'redo'): boolean {
    return record.participants.every(participant =>
      !participant.changed
      || (!participant.store.isStoreDisposed()
        && participant.store.hasHistoryEntry(direction === 'undo' ? participant.beforeEntryId : participant.afterEntryId))
    );
  }
}
```

### stores/core/TimeTravelStore.ts

```typescript
import { createTimeTravel, type Patches, safeGet, TimeTravel, type TimeTravelControls, type TimeTravelOptions, type TimeTravelTransitionMeta } from '@context-action/mutative';
import type { IStore, Listener, Snapshot, StoreSetValueOptions, Unsubscribe } from './types';
export type PatchAwareListener = (patches: Patches | null) => void;
function validateHistoryStep(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative safe integer`);
  }
}
function validateHistoryPosition(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError('History position must be a non-negative safe integer');
  }
}
import { ErrorHandlers } from '../utils/error-handling';
import { TypeGuards } from '../utils/type-guards';
import { type FrameHandle, scheduleFrame } from './frame-scheduler';
export interface TimeTravelStoreOptions<T> {
  maxHistory?: number;
  mutable?: boolean;
  isEqual?: (a: T, b: T) => boolean;
  notificationMode?: 'batched' | 'immediate';
  readMode?: 'reference' | 'safe';
}
export class TimeTravelStore<T = unknown> implements IStore<T> {
  public readonly name: string;
  private timeTravel: TimeTravel<T, false, true>;
  private listeners = new Set<Listener>();
  private patchAwareListeners = new Set<PatchAwareListener>();
  private _snapshot: Snapshot<T>;
  private _lastPatches: Patches | null = null;
  private _lastTransitionMeta: TimeTravelTransitionMeta | undefined;
  private isDisposed = false;
  private cleanupTasks = new Set<() => void>();
  private customComparator?: (a: T, b: T) => boolean;
  private cloningEnabled = false;
  private notificationMode: 'batched' | 'immediate' = 'immediate';
  private pendingNotification = false;
  private animationFrameId: FrameHandle | null = null;
  private pendingPatches: Patches | null = null;
  private unsubscribeTimeTravel: Unsubscribe = () => {};
  private notificationHoldDepth = 0;
  private notificationDeferred = false;
  constructor(
    name: string,
    initialValue: T,
    options: TimeTravelStoreOptions<T> = {}
  ) {
    this.name = name;
    this.customComparator = options.isEqual;
    this.notificationMode = options.notificationMode ?? 'immediate';
    this.cloningEnabled = options.readMode === 'safe';
    const timeTravelOptions: TimeTravelOptions<false, true> = {
      maxHistory: options.maxHistory ?? 50,
      mutable: options.mutable ?? true,
      autoArchive: true,
    };
    this.timeTravel = createTimeTravel(initialValue, timeTravelOptions);
    this.unsubscribeTimeTravel = this.timeTravel.subscribe((_state, travelPatches, _position, changedPatches, metadata) => {
      const transitionPatches = (changedPatches ?? travelPatches.patches.flat()) as Patches;
      this._lastPatches = transitionPatches;
      this._lastTransitionMeta = metadata;
      if (process.env.NODE_ENV === 'development') {
        console.log(`[TimeTravelStore:${this.name}] TimeTravel notified - patches:`, transitionPatches.length, 'listeners:', this.listeners.size);
      }
      this._updateSnapshot();
      if (this.notificationHoldDepth > 0) {
        this.pendingPatches = this.pendingPatches
          ? this.pendingPatches.concat(transitionPatches)
          : transitionPatches;
        this.notificationDeferred = true;
        return;
      }
      this._scheduleNotification(transitionPatches);
    });
    this._snapshot = this._createSnapshot();
  }
  subscribe = (listener: Listener): Unsubscribe => {
    if (this.isDisposed) {
      console.warn(`Cannot subscribe to disposed store "${this.name}"`);
      return () => {};
    }
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  subscribeWithPatches = (listener: PatchAwareListener): Unsubscribe => {
    if (this.isDisposed) {
      console.warn(`Cannot subscribe to disposed store "${this.name}"`);
      return () => {};
    }
    this.patchAwareListeners.add(listener);
    return () => this.patchAwareListeners.delete(listener);
  };
  getLastPatches(): Patches | null {
    return this._lastPatches;
  }
  getLastTransitionMeta(): TimeTravelTransitionMeta | undefined {
    return this._lastTransitionMeta;
  }
  getSnapshot = (): Snapshot<T> => this._snapshot;
  getValue(): T {
    const value = this.timeTravel.getState();
    return this.cloningEnabled ? safeGet(value, true) : value;
  }
  getSafeValue(): T {
    return safeGet(this.timeTravel.getState(), true);
  }
  setValue(value: T, options?: StoreSetValueOptions<T>): void {
    if (this.isDisposed) return;
    if (TypeGuards.isObject(value)) {
      if (!TypeGuards.isRefState(value) && TypeGuards.isSuspiciousEventObject(value)) {
        const eventHandling = options?.eventHandling || 'block';
        if (eventHandling === 'block') {
          ErrorHandlers.store(
            'Event object detected in TimeTravelStore.setValue',
            { storeName: this.name }
          );
          return;
        }
        if (eventHandling === 'transform' && options?.eventTransform) {
          value = options.eventTransform(value);
        }
      }
    }
    if (!options?.skipComparison) {
      const currentValue = this.timeTravel.getState();
      if (this._areEqual(currentValue, value)) {
        return;
      }
    }
    if (process.env.NODE_ENV === 'development') {
      console.log(`[TimeTravelStore:${this.name}] setValue - position before: ${this.timeTravel.getPosition()}`);
    }
    this.timeTravel.setState(value);
    if (process.env.NODE_ENV === 'development') {
      console.log(`[TimeTravelStore:${this.name}] setValue complete - position after: ${this.timeTravel.getPosition()}`);
    }
  }
  update(updater: (current: T) => T | undefined): void {
    if (this.isDisposed) return;
    this.timeTravel.setState((draft): T | undefined => {
      const result = updater(draft as T);
      if (result !== undefined) {
        return result;
      }
      return undefined;
    });
  }
  beginBatch(metadata?: TimeTravelTransitionMeta, options: { deferNotification?: boolean } = {}): void {
    if (this.isDisposed) throw new Error(`Store "${this.name}" is disposed`);
    this.timeTravel.beginBatch(metadata);
    if (options.deferNotification) this.notificationHoldDepth += 1;
  }
  endBatch(): void {
    if (this.isDisposed) throw new Error(`Store "${this.name}" is disposed`);
    this.timeTravel.endBatch();
  }
  cancelBatch(): void {
    if (this.isDisposed) throw new Error(`Store "${this.name}" is disposed`);
    this.timeTravel.cancelBatch();
  }
  resumeNotifications(): void {
    if (this.notificationHoldDepth > 0) this.notificationHoldDepth -= 1;
  }
  flushNotifications(): void {
    if (this.isDisposed || this.notificationHoldDepth > 0 || !this.notificationDeferred) return;
    this.notificationDeferred = false;
    this._scheduleNotification();
  }
  batch<R>(callback: () => R, metadata?: TimeTravelTransitionMeta): R {
    if (this.isDisposed) throw new Error(`Store "${this.name}" is disposed`);
    return this.timeTravel.batch(callback, metadata);
  }
  getListenerCount(): number {
    return this.listeners.size + this.patchAwareListeners.size;
  }
  clearListeners(): void {
    this.listeners.clear();
    this.patchAwareListeners.clear();
  }
  dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    if (this.animationFrameId !== null) {
      this.animationFrameId.cancel();
      this.animationFrameId = null;
    }
    this.pendingNotification = false;
    this.pendingPatches = null;
    this.notificationHoldDepth = 0;
    this.notificationDeferred = false;
    this.unsubscribeTimeTravel();
    this.unsubscribeTimeTravel = () => {};
    this.cleanupTasks.forEach((task) => {
      try {
        task();
      } catch {
        ErrorHandlers.store('Cleanup task error', { storeName: this.name });
      }
    });
    this.cleanupTasks.clear();
    this.listeners.clear();
    this.patchAwareListeners.clear();
  }
  registerCleanup(task: () => void): () => void {
    if (this.isDisposed) return () => {};
    this.cleanupTasks.add(task);
    return () => this.cleanupTasks.delete(task);
  }
  isStoreDisposed(): boolean {
    return this.isDisposed;
  }
  undo(steps = 1, metadata?: TimeTravelTransitionMeta): void {
    if (this.isDisposed) return;
    validateHistoryStep(steps, 'Undo steps');
    if (process.env.NODE_ENV === 'development') {
      console.log(`[TimeTravelStore:${this.name}] undo(${steps}) - position before: ${this.timeTravel.getPosition()}, canBack: ${this.timeTravel.canBack()}`);
    }
    this.timeTravel.back(steps, metadata ?? { origin: 'undo' });
    if (process.env.NODE_ENV === 'development') {
      console.log(`[TimeTravelStore:${this.name}] undo complete - position after: ${this.timeTravel.getPosition()}`);
    }
  }
  redo(steps = 1, metadata?: TimeTravelTransitionMeta): void {
    if (this.isDisposed) return;
    validateHistoryStep(steps, 'Redo steps');
    if (process.env.NODE_ENV === 'development') {
      console.log(`[TimeTravelStore:${this.name}] redo(${steps}) - position before: ${this.timeTravel.getPosition()}, canForward: ${this.timeTravel.canForward()}`);
    }
    this.timeTravel.forward(steps, metadata ?? { origin: 'redo' });
    if (process.env.NODE_ENV === 'development') {
      console.log(`[TimeTravelStore:${this.name}] redo complete - position after: ${this.timeTravel.getPosition()}`);
    }
  }
  canUndo(): boolean {
    if (this.isDisposed) return false;
    return this.timeTravel.canBack();
  }
  canRedo(): boolean {
    if (this.isDisposed) return false;
    return this.timeTravel.canForward();
  }
  goTo(position: number, metadata?: TimeTravelTransitionMeta): void {
    if (this.isDisposed) return;
    validateHistoryPosition(position);
    this.timeTravel.go(position, metadata);
  }
  reset(): void {
    if (this.isDisposed) return;
    this.timeTravel.reset();
  }
  getHistory(): readonly T[] {
    if (this.isDisposed) return [];
    return this.timeTravel.getHistory();
  }
  getPosition(): number {
    if (this.isDisposed) return 0;
    return this.timeTravel.getPosition();
  }
  getHistoryLength(): number {
    if (this.isDisposed) return 0;
    return this.timeTravel.getHistoryLength();
  }
  getHistoryEntryId(): number {
    if (this.isDisposed) return -1;
    return this.timeTravel.getHistoryEntryId();
  }
  hasHistoryEntry(entryId: number): boolean {
    return !this.isDisposed && this.timeTravel.hasHistoryEntry(entryId);
  }
  goToHistoryEntry(entryId: number, metadata?: TimeTravelTransitionMeta): void {
    if (this.isDisposed) throw new Error(`Store "${this.name}" is disposed`);
    this.timeTravel.goToHistoryEntry(entryId, metadata);
  }
  getTimeTravelControls(): TimeTravelControls<T, false> {
    const store = this;
    return {
      get position() { return store.getPosition(); },
      getHistory: () => store.getHistory() as readonly (T extends (...args: unknown[]) => infer R ? R : T)[],
      get patches() { return store.isStoreDisposed() ? { patches: [], inversePatches: [] } : store.timeTravel.getPatches(); },
      back: (amount = 1) => store.undo(amount),
      forward: (amount = 1) => store.redo(amount),
      reset: () => store.reset(),
      go: (position) => store.goTo(position),
      canBack: () => store.canUndo(),
      canForward: () => store.canRedo(),
    };
  }
  notifyPath(path: (string | number)[]): void {
    if (this.isDisposed) return;
    const currentValue = this._getValueAtPath(path);
    const patch = [{
      op: 'replace',
      path: path,
      value: currentValue
    }] as Patches;
    this._lastPatches = patch;
    if (this.notificationHoldDepth > 0) {
      this.pendingPatches = this.pendingPatches
        ? this.pendingPatches.concat(patch)
        : patch;
      this.notificationDeferred = true;
      return;
    }
    this._scheduleNotification(patch);
  }
  notifyPaths(paths: (string | number)[][]): void {
    if (this.isDisposed) return;
    if (paths.length === 0) return;
    const patches = paths.map(path => ({
      op: 'replace' as const,
      path: path,
      value: this._getValueAtPath(path)
    })) as Patches;
    this._lastPatches = patches;
    if (this.notificationHoldDepth > 0) {
      this.pendingPatches = this.pendingPatches
        ? this.pendingPatches.concat(patches)
        : patches;
      this.notificationDeferred = true;
      return;
    }
    this._scheduleNotification(patches);
  }
  private _getValueAtPath(path: (string | number)[]): unknown {
    let current: unknown = this.timeTravel.getState();
    for (const segment of path) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = (current as Record<string | number, unknown>)[segment];
    }
    return current;
  }
  setCloningEnabled(enabled: boolean): void {
    this.cloningEnabled = enabled;
  }
  isCloningEnabled(): boolean {
    return this.cloningEnabled;
  }
  setCustomComparator(comparator: (a: T, b: T) => boolean): void {
    this.customComparator = comparator;
  }
  private _createSnapshot(): Snapshot<T> {
    const value = this.cloningEnabled
      ? safeGet(this.timeTravel.getState(), true)
      : this.timeTravel.getState();
    return {
      value,
      name: this.name,
      lastUpdate: Date.now(),
    };
  }
  private _updateSnapshot(): void {
    this._snapshot = this._createSnapshot();
  }
  private _scheduleNotification(patches?: Patches): void {
    if (this.isDisposed) return;
    if (patches) {
      this.pendingPatches = this.pendingPatches
        ? this.pendingPatches.concat(patches)
        : patches;
    }
    if (this.notificationMode === 'immediate') {
      this._executeNotification();
      return;
    }
    if (!this.pendingNotification) {
      this.pendingNotification = true;
      this.animationFrameId = scheduleFrame(() => {
        this.pendingNotification = false;
        this.animationFrameId = null;
        this._executeNotification();
      });
    }
  }
  private _executeNotification(): void {
    if (this.isDisposed) return;
    if (this.pendingPatches) {
      this._lastPatches = this.pendingPatches;
      this.pendingPatches = null;
    }
    const notifiedPatches = this._lastPatches;
    for (const listener of [...this.listeners]) {
      if (this.isDisposed) return;
      if (!this.listeners.has(listener)) continue;
      try {
        listener();
      } catch {
        try {
          ErrorHandlers.store('Listener error', { storeName: this.name });
        } catch {
        }
      }
    }
    for (const listener of [...this.patchAwareListeners]) {
      if (this.isDisposed) return;
      if (!this.patchAwareListeners.has(listener)) continue;
      try {
        listener(notifiedPatches);
      } catch {
        try {
          ErrorHandlers.store('Patch-aware listener error', { storeName: this.name });
        } catch {
        }
      }
    }
  }
  private _areEqual(a: T, b: T): boolean {
    if (this.customComparator) {
      return this.customComparator(a, b);
    }
    return Object.is(a, b);
  }
}
export function createTimeTravelStore<T>(
  name: string,
  initialValue: T,
  options?: TimeTravelStoreOptions<T>
): TimeTravelStore<T> {
  return new TimeTravelStore(name, initialValue, options);
}
export function isTimeTravelStore<T>(store: IStore<T>): store is TimeTravelStore<T> {
  return store instanceof TimeTravelStore;
}
```

### stores/hooks/useComputedStore.ts

```typescript
import { useCallback, useRef } from 'react';
import type { Store } from '../core/Store';
import { useSafeStoreSubscription } from '../utils/sync-external-store-utils';
import { defaultEqualityFn } from './useStoreSelector';
export interface ComputedStoreConfig<R> {
  equalityFn?: (a: R, b: R) => boolean;
  debug?: boolean;
  name?: string;
  initialValue?: R;
  onError?: (error: Error) => void;
  debounceMs?: number;
  enableCache?: boolean;
  cacheSize?: number;
}
export function useComputedStore<T, R>(
  store: Store<T>,
  compute: (value: T) => R,
  config: ComputedStoreConfig<R> = {}
): R {
  const {
    equalityFn = defaultEqualityFn,
    debug = false,
    name = 'computed',
    onError,
    debounceMs,
    enableCache = false,
    cacheSize = 10,
    initialValue
  } = config;
  const computeRef = useRef(compute);
  const cacheRef = useRef<Map<T, R>>(new Map());
  const lastComputedRef = useRef<R | undefined>(undefined);
  const lastInputRef = useRef<T | undefined>(undefined);
  const lastInputValidRef = useRef(false);
  const cacheIdentityRef = useRef<{ compute: (value: T) => R; enableCache: boolean }>({
    compute,
    enableCache,
  });
  if (
    cacheIdentityRef.current.compute !== compute ||
    cacheIdentityRef.current.enableCache !== enableCache
  ) {
    cacheRef.current.clear();
    lastInputValidRef.current = false;
    cacheIdentityRef.current = { compute, enableCache };
  }
  computeRef.current = compute;
  const getCachedValue = useCallback((input: T): R | undefined => {
    if (!enableCache) return undefined;
    if (
      lastInputValidRef.current &&
      lastInputRef.current === input &&
      lastComputedRef.current !== undefined
    ) {
      return lastComputedRef.current;
    }
    for (const [cachedInput, cachedOutput] of cacheRef.current) {
      if (defaultEqualityFn(cachedInput, input)) {
        if (debug) {
          console.debug(`useComputedStore [${name}]: Using cached value`);
        }
        return cachedOutput;
      }
    }
    return undefined;
  }, [enableCache, debug, name]);
  const setCachedValue = useCallback((input: T, output: R) => {
    if (!enableCache) return;
    lastInputRef.current = input;
    lastInputValidRef.current = true;
    lastComputedRef.current = output;
    cacheRef.current.set(input, output);
    if (cacheRef.current.size > cacheSize) {
      const firstKey = cacheRef.current.keys().next().value;
      if (firstKey !== undefined) {
        cacheRef.current.delete(firstKey);
      }
    }
    if (debug) {
      console.debug(`useComputedStore [${name}]: Cache updated`, {
        cacheSize: cacheRef.current.size,
        input,
        output
      });
    }
  }, [enableCache, cacheSize, debug, name]);
  const computeSelector = useCallback((value: T): R => {
    try {
      const cached = getCachedValue(value);
      if (cached !== undefined) {
        return cached;
      }
      const startTime = debug ? performance.now() : 0;
      const result = computeRef.current(value);
      if (debug) {
        const duration = performance.now() - startTime;
        console.debug(`useComputedStore [${name}]: Computed in ${duration.toFixed(2)}ms`, {
          input: value,
          result
        });
      }
      setCachedValue(value, result);
      lastComputedRef.current = result;
      return result;
    } catch (error) {
      if (onError) {
        onError(error as Error);
        const fallbackValue = lastComputedRef.current !== undefined
          ? lastComputedRef.current
          : initialValue as R;
        return fallbackValue;
      }
      if (debug) {
        console.error(`useComputedStore [${name}]: Error in computation:`, error);
      }
      throw error;
    }
  }, [getCachedValue, setCachedValue, debug, name, onError, initialValue]);
  const computedValue = useSafeStoreSubscription(
    store,
    computeSelector,
    {
      equalityFn,
      debounce: debounceMs,
      debug,
      name: `computed-${name}`,
      initialValue
    }
  );
  return computedValue as R;
}
```

### stores/hooks/useLocalStore.ts

```typescript
import { useInsertionEffect, useRef } from 'react';
import { createStore, Store } from '../core/Store';
import type { Snapshot } from '../core/types';
import { useStoreValue } from './useStoreValue';
let localStoreCounter = 0;
export function useLocalStore<T>(
  initialValue: T,
  name?: string
): Snapshot<T> & { store: Store<T> } {
  const storeRef = useRef<Store<T> | null>(null);
  if (!storeRef.current) {
    const storeName = name || `localStore_${++localStoreCounter}`;
    storeRef.current = createStore(storeName, initialValue);
  }
  const store = storeRef.current;
  useInsertionEffect(() => {
    return () => {
      store.dispose();
      if (storeRef.current === store) {
        storeRef.current = null;
      }
    };
  }, [store]);
  const value = useStoreValue(store);
  return {
    value,
    name: store.name,
    lastUpdate: store.getSnapshot().lastUpdate,
    store
  };
}
```

### stores/hooks/useStorePath.ts

```typescript
import { useCallback, useRef, useSyncExternalStore } from 'react';
import type { Snapshot, Unsubscribe } from '../core/types';
import { patchesAffectPath, type StorePathPatch } from '../utils/patch-affects-path';
import { createPathSignature, createPathsSignature } from '../utils/path-signature';
import { defaultEqualityFn } from './useStoreSelector';
export type { StorePathPatch } from '../utils/patch-affects-path';
export interface PatchAwareStore<T> {
  getValue(): T;
  getSnapshot?: () => Snapshot<T>;
  subscribe(listener: () => void): Unsubscribe;
  subscribeWithPatches(listener: (patches: readonly StorePathPatch[] | null) => void): Unsubscribe;
}
export type StorePath = (string | number)[];
export interface UseStorePathOptions<R> {
  equalityFn?: (a: R, b: R) => boolean;
}
function getValueAtPath<T, R>(obj: T, path: Readonly<StorePath>): R {
  let current: unknown = obj;
  for (const key of path) {
    if (current === null || current === undefined) {
      return undefined as R;
    }
    current = (current as Record<string | number, unknown>)[key];
  }
  return current as R;
}
function readStoreValue<T>(store: PatchAwareStore<T>): T {
  return store.getSnapshot ? store.getSnapshot().value : store.getValue();
}
export function useStorePath<T, R = unknown>(
  store: PatchAwareStore<T>,
  path: Readonly<StorePath>,
  options: UseStorePathOptions<R> = {}
): R {
  const { equalityFn } = options;
  const pathSignature = createPathSignature(path);
  const stablePathRef = useRef<{ signature: string; path: StorePath }>({
    signature: pathSignature,
    path: [...path],
  });
  if (stablePathRef.current.signature !== pathSignature) {
    stablePathRef.current = { signature: pathSignature, path: [...path] };
  }
  const stablePath = stablePathRef.current.path;
  const cacheRef = useRef<{ value: R; initialized: boolean; pathSignature: string; store: PatchAwareStore<T> }>({
    value: undefined as R,
    initialized: false,
    pathSignature: '',
    store,
  });
  if (cacheRef.current.pathSignature !== pathSignature || cacheRef.current.store !== store) {
    cacheRef.current = { value: undefined as R, initialized: false, pathSignature, store };
  }
  const subscribe = useCallback(
    (callback: () => void) => {
      return store.subscribeWithPatches((patches) => {
        if (patchesAffectPath(patches, stablePath)) {
          callback();
        }
      });
    },
    [store, stablePath]
  );
  const getSnapshot = useCallback((): R => {
    const storeValue = readStoreValue(store);
    const currentValue = getValueAtPath<T, R>(storeValue, stablePath);
    if (!cacheRef.current.initialized) {
      cacheRef.current = { value: currentValue, initialized: true, pathSignature, store };
      return currentValue;
    }
    const prevValue = cacheRef.current.value;
    if (equalityFn) {
      if (equalityFn(prevValue, currentValue)) {
        return prevValue;
      }
    } else {
      if (Object.is(prevValue, currentValue)) {
        return prevValue;
      }
    }
    cacheRef.current.value = currentValue;
    return currentValue;
  }, [store, stablePath, pathSignature, equalityFn]);
  const getServerSnapshot = useCallback((): R => {
    return getValueAtPath<T, R>(readStoreValue(store), stablePath);
  }, [store, stablePath]);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
export interface UseStoreSelectorWithPathsOptions<R> {
  dependsOn?: readonly Readonly<StorePath>[];
  equalityFn?: (a: R, b: R) => boolean;
}
export function useStoreSelectorWithPaths<T, R>(
  store: PatchAwareStore<T>,
  selector: (value: T) => R,
  options: UseStoreSelectorWithPathsOptions<R> = {}
): R {
  const { dependsOn, equalityFn = defaultEqualityFn } = options;
  const depsKey = createPathsSignature(dependsOn);
  const stablePathsRef = useRef<{
    signature: string | null;
    paths: StorePath[] | undefined;
  }>({
    signature: depsKey,
    paths: dependsOn?.map((path) => [...path]),
  });
  if (stablePathsRef.current.signature !== depsKey) {
    stablePathsRef.current = {
      signature: depsKey,
      paths: dependsOn?.map((path) => [...path]),
    };
  }
  const stablePaths = stablePathsRef.current.paths;
  const cacheRef = useRef<{
    value: R;
    depsKey: string | null;
    store: PatchAwareStore<T>;
  } | undefined>(undefined);
  if (cacheRef.current && (cacheRef.current.depsKey !== depsKey || cacheRef.current.store !== store)) {
    cacheRef.current = undefined;
  }
  const subscribe = useCallback(
    (callback: () => void) => {
      if (!stablePaths) {
        return store.subscribe(callback);
      }
      return store.subscribeWithPatches((patches) => {
        const affected = stablePaths.some(path => patchesAffectPath(patches, path));
        if (affected) {
          callback();
        }
      });
    },
    [store, stablePaths]
  );
  const getSnapshot = useCallback((): R => {
    const storeValue = readStoreValue(store);
    const currentValue = selector(storeValue);
    const cached = cacheRef.current;
    if (cached?.store === store && cached.depsKey === depsKey) {
      const prevValue = cached.value;
      if (equalityFn(prevValue, currentValue)) {
        return prevValue;
      }
    }
    cacheRef.current = { value: currentValue, depsKey, store };
    return currentValue;
  }, [store, selector, equalityFn, depsKey]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
```

### stores/hooks/useStoreSelector.ts

```typescript
import { useSyncExternalStore, useCallback, useRef } from 'react';
import type { Store } from '../core/Store';
import { equalityFunctions } from '../utils/sync-external-store-utils';
export const defaultEqualityFn = equalityFunctions.smart; 
export const shallowEqual = equalityFunctions.shallow;
export const deepEqual = equalityFunctions.deep;
export function useStoreSelector<T, R>(
  store: Store<T>,
  selector: (value: T) => R,
  equalityFn: (a: R, b: R) => boolean = defaultEqualityFn
): R {
  "use memo";
  const previousValueRef = useRef<{ store: Store<T>; value: R } | undefined>(undefined);
  const subscribe = useCallback((callback: () => void) => {
    return store.subscribe(callback);
  }, [store]);
  const getSnapshot = useCallback((): R => {
    try {
      const storeValue = store.getSnapshot().value;
      const selectedValue = selector(storeValue);
      const previous = previousValueRef.current;
      if (previous?.store === store && equalityFn(previous.value, selectedValue)) {
        return previous.value;
      }
      previousValueRef.current = { store, value: selectedValue };
      return selectedValue;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('useStoreSelector: Error in selector function:', error);
      }
      throw error;
    }
  }, [store, selector, equalityFn]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
```

### stores/hooks/useStoreTransactionInspector.ts

```typescript
import { useCallback, useSyncExternalStore } from 'react';
import type {
  StoreTransactionCoordinator,
  StoreTransactionInspectorSnapshot,
} from '../core/StoreTransactionCoordinator';
export function useStoreTransactionInspector(
  coordinator: StoreTransactionCoordinator,
): StoreTransactionInspectorSnapshot {
  const subscribe = useCallback(
    (callback: () => void) => coordinator.subscribe(() => callback()),
    [coordinator],
  );
  const getSnapshot = useCallback(
    () => coordinator.getInspectorSnapshot(),
    [coordinator],
  );
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
```

### stores/hooks/useStoreValue.ts

```typescript
import { useMemo } from 'react';
import type { IStore } from '../core/types';
import { useSafeStoreSubscription } from '../utils/sync-external-store-utils';
import { defaultEqualityFn, shallowEqual } from './useStoreSelector';
export interface StoreValueOptions<R> {
  equalityFn?: (a: R, b: R) => boolean;
  condition?: () => boolean;
  debounce?: number;
  throttle?: number;
  initialValue?: R;
  debug?: boolean;
  name?: string;
}
type StoreValueOf<S extends IStore<any>> = ReturnType<S['getValue']>;
export function useStoreValue<S extends IStore<any>>(
  store: S,
  options?: StoreValueOptions<StoreValueOf<S>>
): StoreValueOf<S>;
export function useStoreValue<S extends IStore<any>>(
  store: S | undefined | null,
  options?: StoreValueOptions<StoreValueOf<S>>
): StoreValueOf<S> | undefined;
export function useStoreValue<S extends IStore<any>, R>(
  store: S,
  selector: (value: StoreValueOf<S>) => R,
  options?: StoreValueOptions<R>
): R;
export function useStoreValue<S extends IStore<any>, R>(
  store: S | undefined | null,
  selector: (value: StoreValueOf<S>) => R,
  options?: StoreValueOptions<R>
): R | undefined;
export function useStoreValue<T, R>(
  store: IStore<T> | undefined | null,
  selectorOrOptions?: ((value: T) => R) | StoreValueOptions<T>,
  options?: StoreValueOptions<R>
): T | R | undefined {
  "use memo";
  const selector = typeof selectorOrOptions === 'function' ? selectorOrOptions : undefined;
  const finalOptions = (typeof selectorOrOptions === 'function' ? options : selectorOrOptions) || {};
  const {
    equalityFn = defaultEqualityFn,
    condition,
    debounce,
    throttle,
    initialValue,
    debug = false,
    name = store?.name || 'unknown'
  } = finalOptions;
  const subscriptionOptions = {
    debug,
    name,
    equalityFn: equalityFn as (a: R, b: R) => boolean,
    initialValue: initialValue as R,
    ...(debounce !== undefined && { debounce }),
    ...(throttle !== undefined && { throttle }),
    ...(condition && { condition })
  };
  const value = useSafeStoreSubscription(
    store,
    selector,
    subscriptionOptions
  );
  return value;
}
export function useStoreValues<T, S extends Record<string, (value: T) => any>>(
  store: IStore<T> | undefined | null,
  selectors: S
): { [K in keyof S]: ReturnType<S[K]> } | undefined {
  "use memo";
  const selectorFunction = useMemo(() => {
    return (value: T) => {
      const result = {} as { [K in keyof S]: ReturnType<S[K]> };
      for (const [key, selector] of Object.entries(selectors)) {
        result[key as keyof S] = selector(value);
      }
      return result;
    };
  }, [selectors]);
  const storeValue = useSafeStoreSubscription(
    store,
    selectorFunction,
    {
      equalityFn: shallowEqual,
      name: `${store?.name || 'unknown'}-values`
    }
  ) as { [K in keyof S]: ReturnType<S[K]> } | undefined;
  return store ? storeValue : undefined;
}
```

### stores/hooks/useTimeTravelControls.ts

```typescript
import { useSyncExternalStore, useCallback, useMemo, useRef } from 'react';
import { TimeTravelStore } from '../core/TimeTravelStore';
interface TimeTravelState {
  canUndo: boolean;
  canRedo: boolean;
  position: number;
  historyLength: number;
}
export interface TimeTravelControlsState extends TimeTravelState {
  undo: (steps?: number) => void;
  redo: (steps?: number) => void;
  goTo: (position: number) => void;
  reset: () => void;
}
const SERVER_SNAPSHOT: TimeTravelState = {
  canUndo: false,
  canRedo: false,
  position: 0,
  historyLength: 1,
};
export function useTimeTravelControls<T>(
  store: TimeTravelStore<T>
): TimeTravelControlsState {
  const cacheRef = useRef<TimeTravelState | null>(null);
  const subscribe = useCallback(
    (callback: () => void) => {
      return store.subscribe(callback);
    },
    [store]
  );
  const getSnapshot = useCallback((): TimeTravelState => {
    const canUndo = store.canUndo();
    const canRedo = store.canRedo();
    const position = store.getPosition();
    const historyLength = store.getHistoryLength();
    const cached = cacheRef.current;
    if (
      cached &&
      cached.canUndo === canUndo &&
      cached.canRedo === canRedo &&
      cached.position === position &&
      cached.historyLength === historyLength
    ) {
      return cached;
    }
    const newState: TimeTravelState = { canUndo, canRedo, position, historyLength };
    cacheRef.current = newState;
    return newState;
  }, [store]);
  const getServerSnapshot = useCallback(() => SERVER_SNAPSHOT, []);
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const controls = useMemo(
    () => ({
      undo: (steps?: number) => store.undo(steps),
      redo: (steps?: number) => store.redo(steps),
      goTo: (position: number) => store.goTo(position),
      reset: () => store.reset(),
    }),
    [store]
  );
  return {
    ...state,
    ...controls,
  };
}
```

### stores/hooks/useTimeTravelPath.ts

```typescript
import { useCallback, useRef, useSyncExternalStore } from 'react';
import { TimeTravelStore } from '../core/TimeTravelStore';
import { patchesAffectPath } from '../utils/patch-affects-path';
import { createPathSignature, createPathsSignature } from '../utils/path-signature';
import { defaultEqualityFn } from './useStoreSelector';
export type StorePath = (string | number)[];
export interface UseTimeTravelPathOptions<R> {
  equalityFn?: (a: R, b: R) => boolean;
}
function getValueAtPath<T, R>(obj: T, path: StorePath): R {
  let current: unknown = obj;
  for (const key of path) {
    if (current === null || current === undefined) {
      return undefined as R;
    }
    current = (current as Record<string | number, unknown>)[key];
  }
  return current as R;
}
export function useTimeTravelPath<T, R = unknown>(
  store: TimeTravelStore<T>,
  path: StorePath,
  options: UseTimeTravelPathOptions<R> = {}
): R {
  const { equalityFn } = options;
  const pathSignature = createPathSignature(path);
  const stablePathRef = useRef<{ signature: string; path: StorePath }>({
    signature: pathSignature,
    path: [...path],
  });
  if (stablePathRef.current.signature !== pathSignature) {
    stablePathRef.current = { signature: pathSignature, path: [...path] };
  }
  const stablePath = stablePathRef.current.path;
  const cacheRef = useRef<{ value: R; initialized: boolean; pathSignature: string; store: TimeTravelStore<T> }>({
    value: undefined as R,
    initialized: false,
    pathSignature,
    store,
  });
  if (cacheRef.current.pathSignature !== pathSignature || cacheRef.current.store !== store) {
    cacheRef.current = { value: undefined as R, initialized: false, pathSignature, store };
  }
  const subscribe = useCallback(
    (callback: () => void) => {
      return store.subscribeWithPatches((patches) => {
        if (patchesAffectPath(patches, stablePath)) {
          callback();
        }
      });
    },
    [store, stablePath]
  );
  const getSnapshot = useCallback((): R => {
    const storeValue = store.getSnapshot().value;
    const currentValue = getValueAtPath<T, R>(storeValue, stablePath);
    if (!cacheRef.current.initialized) {
      cacheRef.current = { value: currentValue, initialized: true, pathSignature, store };
      return currentValue;
    }
    const prevValue = cacheRef.current.value;
    if (equalityFn) {
      if (equalityFn(prevValue, currentValue)) {
        return prevValue;
      }
    } else {
      if (Object.is(prevValue, currentValue)) {
        return prevValue;
      }
    }
    cacheRef.current.value = currentValue;
    return currentValue;
  }, [store, stablePath, pathSignature, equalityFn]);
  const getServerSnapshot = useCallback((): R => {
    return getValueAtPath<T, R>(store.getSnapshot().value, stablePath);
  }, [store, stablePath]);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
export interface UseTimeTravelSelectorOptions<R> {
  dependsOn?: StorePath[];
  equalityFn?: (a: R, b: R) => boolean;
}
export function useTimeTravelSelector<T, R>(
  store: TimeTravelStore<T>,
  selector: (value: T) => R,
  options: UseTimeTravelSelectorOptions<R> = {}
): R {
  const { dependsOn, equalityFn = defaultEqualityFn } = options;
  const cacheRef = useRef<{ store: TimeTravelStore<T>; value: R } | undefined>(undefined);
  const depsKey = createPathsSignature(dependsOn);
  const stablePathsRef = useRef<{
    signature: string | null;
    paths: StorePath[] | undefined;
  }>({
    signature: depsKey,
    paths: dependsOn?.map((path) => [...path]),
  });
  if (stablePathsRef.current.signature !== depsKey) {
    stablePathsRef.current = {
      signature: depsKey,
      paths: dependsOn?.map((path) => [...path]),
    };
  }
  const stablePaths = stablePathsRef.current.paths;
  const subscribe = useCallback(
    (callback: () => void) => {
      if (!stablePaths) {
        return store.subscribe(callback);
      }
      return store.subscribeWithPatches((patches) => {
        const affected = stablePaths.some(path => patchesAffectPath(patches, path));
        if (affected) {
          callback();
        }
      });
    },
    [store, stablePaths]
  );
  const getSnapshot = useCallback((): R => {
    const storeValue = store.getSnapshot().value;
    const currentValue = selector(storeValue);
    if (cacheRef.current?.store === store) {
      const prevValue = cacheRef.current.value;
      if (equalityFn(prevValue, currentValue)) {
        return prevValue;
      }
    }
    cacheRef.current = { store, value: currentValue };
    return currentValue;
  }, [store, selector, equalityFn]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
```

### stores/patterns/declarative-store-pattern-v2.tsx

```typescript
import React, { createContext, ReactNode, useContext, useInsertionEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { StoreErrorBoundary } from '../components/StoreErrorBoundary';
import type { Store } from '../core/Store';
import { createStore } from '../core/Store';
import { StoreRegistry } from '../core/StoreRegistry';
import type { ComparisonOptions } from '../utils/comparison';
import {
  type ExplicitStoreValue,
  isExplicitStoreValue,
  isStoreConfigShape,
} from './store-definition';
const STORE_CONFIG_KEYS = new Set<PropertyKey>([
  'initialValue',
  'strategy',
  'compareStrategy',
  'description',
  'debug',
  'tags',
  'version',
  'comparisonOptions',
]);
export interface StoreConfig<T = any> {
  initialValue: T;
  strategy?: 'reference' | 'shallow' | 'deep';
  compareStrategy?: 'reference' | 'shallow' | 'deep';
  description?: string;
  debug?: boolean;
  tags?: string[];
  version?: string;
  comparisonOptions?: Partial<ComparisonOptions<T>>;
}
export type InitialStores<T extends Record<string, any>> = {
  [K in keyof T]: StoreConfig<T[K]> | ExplicitStoreValue<T[K]> | T[K];
};
export type StoreDefinitions = Record<string, StoreConfig<any> | ExplicitStoreValue<any> | any>;
type InferStoreDefinitionValue<T> =
  T extends ExplicitStoreValue<infer V>
    ? V
    : T extends { initialValue: infer V }
      ? Exclude<keyof T, keyof StoreConfig<any>> extends never
        ? V
        : T
      : T;
export type InferStoreTypes<T extends StoreDefinitions> = {
  readonly [K in keyof T]: InferStoreDefinitionValue<T[K]> extends (...args: unknown[]) => unknown
      ? never  
      : InferStoreDefinitionValue<T[K]> extends readonly unknown[]
        ? InferStoreDefinitionValue<T[K]>  
        : InferStoreDefinitionValue<T[K]> extends unknown[]
          ? InferStoreDefinitionValue<T[K]>  
          : InferStoreDefinitionValue<T[K]> extends Date | RegExp | Error
            ? InferStoreDefinitionValue<T[K]>  
            : InferStoreDefinitionValue<T[K]> extends Record<string, unknown>
              ? InferStoreDefinitionValue<T[K]>  
              : InferStoreDefinitionValue<T[K]>;  
};
export type StoreSchema<T extends Record<string, any>> = InitialStores<T>;
export type ExternalStoresMap<T extends Record<string, any>> = {
  [K in keyof T]?: Store<T[K]>;
};
export interface StoreManagerOptions<T extends Record<string, any>> {
  externalStores?: ExternalStoresMap<T>;
  externalOwnership?: 'shared' | 'owned';
}
export interface StoreProviderProps<T extends Record<string, any> = Record<string, any>> {
  children: ReactNode;
  registryId?: string;
  manager?: StoreManager<T>;
  stores?: ExternalStoresMap<T>;
  ownership?: 'shared' | 'owned';
}
export class StoreManager<T extends Record<string, any>> {
  public readonly registry: StoreRegistry;
  public readonly initialStores: InitialStores<T>;
  public readonly stores = new Map<keyof T, Store<any>>();
  private readonly externalStoreKeys = new Set<keyof T>();
  private readonly externalOwnership: 'shared' | 'owned';
  private lifecycle: 'active' | 'disposed' = 'active';
  private version = 0;
  private infoVersion = 0;
  private readonly listeners = new Set<() => void>();
  private readonly infoListeners = new Set<() => void>();
  private infoNotificationScheduled = false;
  constructor(
    public readonly name: string,
    initialStores: InitialStores<T>,
    options?: StoreManagerOptions<T>
  ) {
    this.registry = new StoreRegistry(name);
    this.initialStores = initialStores;
    this.externalOwnership = options?.externalOwnership ?? 'shared';
    if (options?.externalStores) {
      for (const [rawKey, externalStore] of Object.entries(options.externalStores)) {
        if (!externalStore) continue;
        const key = rawKey as keyof T;
        this.externalStoreKeys.add(key);
        this.stores.set(key, externalStore);
        this.registry.register(String(key), externalStore, {
          name: String(key),
        });
      }
      if (this.externalStoreKeys.size > 0) {
        this.infoVersion += 1;
      }
    }
  }
  getStore<K extends keyof T>(storeName: K): Store<T[K]> {
    if (this.lifecycle === 'disposed') {
      throw new Error(`StoreManager "${this.name}" is disposed`);
    }
    const existing = this.stores.get(storeName);
    if (existing) {
      return existing;
    }
    const storeConfig = this.initialStores[storeName];
    let initialValue: T[K];
    let strategy: 'reference' | 'shallow' | 'deep' = 'reference';
    let description: string | undefined;
    let debug = false;
    let tags: string[] = ['declarative'];
    let version: string | undefined;
    let comparisonOptions: StoreConfig<T[K]>['comparisonOptions'];
    if (isExplicitStoreValue(storeConfig)) {
      initialValue = storeConfig.value as T[K];
      tags = ['declarative', strategy];
    } else if (isStoreConfigShape(storeConfig, STORE_CONFIG_KEYS)) {
      const config = storeConfig as StoreConfig<T[K]>;
      initialValue = config.initialValue;
      strategy = config.strategy ?? config.compareStrategy ?? 'reference';
      description = config.description;
      debug = config.debug || false;
      tags = config.tags ? ['declarative', ...config.tags] : ['declarative', strategy];
      version = config.version;
      comparisonOptions = config.comparisonOptions;
    } else {
      initialValue = storeConfig as T[K];
      tags = ['declarative', strategy];
    }
    const store = createStore(String(storeName), initialValue);
    const finalComparisonOptions = {
      strategy,
      ...comparisonOptions
    };
    store.setComparisonOptions(finalComparisonOptions);
    const metadata = {
      name: String(storeName),
      tags,
      description: description || `Store: ${String(storeName)}`,
      debug,
      ...(version !== undefined && { version })
    };
    this.registry.register(String(storeName), store, metadata);
    if (debug && process.env.NODE_ENV === 'development') {
      console.log(`🏪 Store context store created: ${String(storeName)}`, {
        strategy,
        tags,
        version,
        description,
        hasCustomComparison: !!comparisonOptions?.customComparator,
        ignoreKeys: comparisonOptions?.ignoreKeys
      });
    }
    this.stores.set(storeName, store);
    this.infoVersion += 1;
    this.scheduleInfoNotification();
    return store;
  }
  clear(): void {
    if (this.lifecycle === 'disposed') {
      throw new Error(`StoreManager "${this.name}" is disposed`);
    }
    const keysToDispose: Array<keyof T> = [];
    this.stores.forEach((_store, key) => {
      const isSharedExternal =
        this.externalOwnership === 'shared' && this.externalStoreKeys.has(key);
      if (!isSharedExternal) {
        keysToDispose.push(key);
      }
    });
    for (const key of keysToDispose) {
      const store = this.stores.get(key);
      store?.dispose();
      this.registry.unregister(String(key));
      this.stores.delete(key);
    }
    this.version += 1;
    this.infoVersion += 1;
    this.listeners.forEach(listener => listener());
    this.scheduleInfoNotification();
  }
  dispose(): void {
    if (this.lifecycle === 'disposed') return;
    this.lifecycle = 'disposed';
    this.stores.forEach((store, key) => {
      if (this.externalOwnership === 'owned' || !this.externalStoreKeys.has(key)) {
        store.dispose();
      }
    });
    this.stores.clear();
    this.listeners.clear();
    this.infoListeners.clear();
    this.registry.dispose();
  }
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  getVersion(): number {
    return this.version;
  }
  subscribeInfo(listener: () => void): () => void {
    this.infoListeners.add(listener);
    return () => this.infoListeners.delete(listener);
  }
  getInfoVersion(): number {
    return this.infoVersion;
  }
  private scheduleInfoNotification(): void {
    if (this.infoNotificationScheduled) return;
    this.infoNotificationScheduled = true;
    queueMicrotask(() => {
      this.infoNotificationScheduled = false;
      if (this.lifecycle === 'disposed') return;
      this.infoListeners.forEach(listener => listener());
    });
  }
  getInfo() {
    return {
      name: this.name,
      storeCount: this.stores.size,
      availableStores: Object.keys(this.initialStores)
    };
  }
}
function areExternalStoresEqual<T extends Record<string, any>>(
  prev: ExternalStoresMap<T> | undefined,
  next: ExternalStoresMap<T> | undefined
): boolean {
  if (prev === next) return true;
  if (!prev || !next) return false;
  const prevKeys = Object.keys(prev).filter(key => prev[key] !== undefined);
  const nextKeys = Object.keys(next).filter(key => next[key] !== undefined);
  if (prevKeys.length !== nextKeys.length) return false;
  return nextKeys.every(key => prev[key] === next[key]);
}
interface StoreContextValue<T extends Record<string, any>> {
  managerRef: React.RefObject<StoreManager<T> | null>;
}
export interface StoreContextReturn<T extends Record<string, any>> {
  readonly Provider: (props: StoreProviderProps<T>) => React.JSX.Element;
  readonly useStore: <K extends keyof T>(storeName: K) => Store<T[K]>;
  readonly useStoreManager: () => StoreManager<T>;
  readonly useStoreInfo: () => {
    name: string;
    storeCount: number;
    availableStores: string[];
  };
  readonly useStoreClear: () => () => void;
  readonly withProvider: <P extends {}>(
    Component: React.ComponentType<P>,
    config?: WithProviderConfig
  ) => React.FC<P>;
  readonly contextName: string;
  readonly initialStores: InitialStores<T>;
}
export function createStoreContext<T extends StoreDefinitions>(
  contextName: string,
  storeDefinitions: T
): StoreContextReturn<InferStoreTypes<T>>;
export function createStoreContext<T extends Record<string, any>>(
  contextName: string,
  initialStores: InitialStores<T>
): StoreContextReturn<T>;
export function createStoreContext(
  contextName: string,
  initialStores: Record<string, any>
): StoreContextReturn<any>;
export function createStoreContext<T extends Record<string, any> | StoreDefinitions>(
  contextName: string,
  initialStores: T extends StoreDefinitions ? T : InitialStores<T>
): StoreContextReturn<any> {
  return createStoreContextImpl(contextName, initialStores as any) as any;
}
function createStoreContextImpl<T extends Record<string, any>>(
  contextName: string,
  initialStores: InitialStores<T>
): StoreContextReturn<T> {
  const StoreContext = createContext<StoreContextValue<T> | null>(null);
  function Provider({
    children,
    registryId,
    manager: externalManager,
    stores: externalStores,
    ownership,
  }: StoreProviderProps<T>) {
    const effectiveRegistryId = registryId || contextName;
    const ownedManagerRef = useRef<StoreManager<T> | null>(null);
    const ownedStoresEntryRef = useRef<{
      stores: ExternalStoresMap<T>;
      registryId: string;
      ownership: 'shared' | 'owned';
      manager: StoreManager<T>;
    } | null>(null);
    let activeManager: StoreManager<T>;
    if (externalManager) {
      activeManager = externalManager;
    } else if (externalStores) {
      const resolvedExternalOwnership: 'shared' | 'owned' = ownership ?? 'shared';
      const currentEntry = ownedStoresEntryRef.current;
      if (
        !currentEntry ||
        currentEntry.registryId !== effectiveRegistryId ||
        currentEntry.ownership !== resolvedExternalOwnership ||
        !areExternalStoresEqual(currentEntry.stores, externalStores)
      ) {
        ownedStoresEntryRef.current = {
          stores: externalStores,
          registryId: effectiveRegistryId,
          ownership: resolvedExternalOwnership,
          manager: new StoreManager(effectiveRegistryId, initialStores, {
            externalStores,
            externalOwnership: resolvedExternalOwnership,
          }),
        };
      }
      activeManager = ownedStoresEntryRef.current!.manager;
    } else {
      if (!ownedManagerRef.current) {
        ownedManagerRef.current = new StoreManager(effectiveRegistryId, initialStores);
      }
      activeManager = ownedManagerRef.current;
    }
    const shouldDisposeManager = externalManager ? ownership === 'owned' : true;
    const disposeOnUnmountRef = useRef(shouldDisposeManager);
    useInsertionEffect(() => {
      disposeOnUnmountRef.current = shouldDisposeManager;
    }, [activeManager, shouldDisposeManager]);
    const activeManagerRef = useRef<StoreManager<T> | null>(activeManager);
    activeManagerRef.current = activeManager;
    useInsertionEffect(() => {
      return () => {
        const shouldDispose = disposeOnUnmountRef.current;
        if (shouldDispose) {
          activeManager.dispose();
        }
        if (ownedManagerRef.current === activeManager && shouldDispose) {
          ownedManagerRef.current = null;
        }
        if (ownedStoresEntryRef.current?.manager === activeManager) {
          ownedStoresEntryRef.current = null;
        }
        if (activeManagerRef.current === activeManager && shouldDispose) {
          activeManagerRef.current = null;
        }
      };
    }, [activeManager]);
    const contextValue = useMemo(
      () => ({ managerRef: activeManagerRef }),
      [activeManager]
    );
    return (
      <StoreContext.Provider value={contextValue}>
        {children}
      </StoreContext.Provider>
    );
  }
  function useStore<K extends keyof T>(storeName: K): Store<T[K]> {
    const context = useContext(StoreContext);
    if (!context?.managerRef.current) {
      throw new Error(
        `useStore must be used within ${contextName}.Provider. ` +
        `Wrap your component with <${contextName}.Provider>`
      );
    }
    const manager = context.managerRef.current;
    const subscribe = useMemo(() => manager.subscribe.bind(manager), [manager]);
    const getVersion = useMemo(() => manager.getVersion.bind(manager), [manager]);
    useSyncExternalStore(subscribe, getVersion, getVersion);
    return manager.getStore(storeName);
  }
  function useStoreManager(): StoreManager<T> {
    const context = useContext(StoreContext);
    if (!context?.managerRef.current) {
      throw new Error(
        `useStoreManager must be used within ${contextName}.Provider`
      );
    }
    return context.managerRef.current;
  }
  function useStoreInfo() {
    const manager = useStoreManager();
    useSyncExternalStore(
      listener => manager.subscribeInfo(listener),
      () => manager.getInfoVersion(),
      () => manager.getInfoVersion(),
    );
    return manager.getInfo();
  }
  function useStoreClear() {
    const manager = useStoreManager();
    return () => manager.clear();
  }
  function withProvider<P extends {}>(
    Component: React.ComponentType<P>,
    config?: WithProviderConfig
  ): React.FC<P> {
    const registryId = config?.registryId || contextName;
    const WithStoreProvider = (props: P) => {
      const managerRef = useRef<StoreManager<T> | null>(null);
      if (!managerRef.current) {
        managerRef.current = new StoreManager(registryId, initialStores);
      }
      useInsertionEffect(() => {
        const manager = managerRef.current;
        return () => {
          if (config?.autoCleanup === false) return;
          manager?.dispose();
          if (managerRef.current === manager) managerRef.current = null;
        };
      }, []);
      const provider = (
        <StoreContext.Provider value={{ managerRef }}>
          <Component {...props} />
        </StoreContext.Provider>
      );
      return config?.errorBoundary ? (
        <StoreErrorBoundary>{provider}</StoreErrorBoundary>
      ) : provider;
    };
    WithStoreProvider.displayName = 
      config?.displayName || `with${contextName}Provider(${Component.displayName || Component.name})`;
    return WithStoreProvider;
  }
  return {
    Provider,
    useStore,        
    useStoreManager, 
    useStoreInfo,
    useStoreClear,
    withProvider,
    contextName,
    initialStores
  } as const;
}
export type InferInitialStores<T> = T extends StoreDefinitions ? InferStoreTypes<T> : never;
export interface WithProviderConfig {
  displayName?: string;
  registryId?: string;
  autoCleanup?: boolean;
  errorBoundary?: boolean;
}
export type StoreValues<T extends Record<string, any>> = {
  [K in keyof T]: InferStoreDefinitionValue<T[K]>;
};
export type { ExplicitStoreValue } from './store-definition';
export { asStoreValue } from './store-definition';
```

### stores/patterns/store-definition.ts

```typescript
const explicitStoreValueMarker = Symbol('context-action.explicit-store-value');
export interface ExplicitStoreValue<T> {
  readonly value: T;
  readonly [explicitStoreValueMarker]: true;
}
export function asStoreValue<T>(value: T): ExplicitStoreValue<T> {
  return {
    value,
    [explicitStoreValueMarker]: true,
  };
}
export function isExplicitStoreValue(value: unknown): value is ExplicitStoreValue<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Partial<ExplicitStoreValue<unknown>>)[explicitStoreValueMarker] === true
  );
}
export function isStoreConfigShape(
  value: unknown,
  allowedKeys: ReadonlySet<PropertyKey>
): value is { initialValue: unknown } {
  if (typeof value !== 'object' || value === null || isExplicitStoreValue(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    return false;
  }
  if (Object.getOwnPropertyDescriptor(value, 'initialValue') === undefined) {
    return false;
  }
  return Reflect.ownKeys(value).every((key) => allowedKeys.has(key));
}
```

### stores/patterns/time-travel-store-pattern.tsx

```typescript
import type { Patches } from '@context-action/mutative';
import React, { createContext, ReactNode, useCallback, useContext, useInsertionEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { StoreErrorBoundary } from '../components/StoreErrorBoundary';
import { createStore, Store } from '../core/Store';
import { StoreRegistry } from '../core/StoreRegistry';
import { createTimeTravelStore, isTimeTravelStore, TimeTravelStore } from '../core/TimeTravelStore';
import type { StorePath } from '../hooks/useTimeTravelPath';
import { compareValues, type ComparisonOptions } from '../utils/comparison';
import { createPathSignature, createPathsSignature } from '../utils/path-signature';
import { patchesAffectPath } from '../utils/patch-affects-path';
import {
  type ExplicitStoreValue,
  isExplicitStoreValue,
  isStoreConfigShape,
} from './store-definition';
const TIME_TRAVEL_STORE_CONFIG_KEYS = new Set<PropertyKey>([
  'initialValue',
  'timeTravel',
  'maxHistory',
  'mutable',
  'strategy',
  'description',
  'debug',
  'tags',
  'version',
  'comparisonOptions',
  'readMode',
]);
function getValueAtPath<T, R>(obj: T, path: StorePath): R {
  let current: unknown = obj;
  for (const key of path) {
    if (current === null || current === undefined) return undefined as R;
    current = (current as Record<string | number, unknown>)[key];
  }
  return current as R;
}
export interface TimeTravelStoreConfig<T = any> {
  initialValue: T;
  timeTravel?: boolean;
  maxHistory?: number;
  mutable?: boolean;
  strategy?: 'reference' | 'shallow' | 'deep';
  description?: string;
  debug?: boolean;
  tags?: string[];
  version?: string;
  comparisonOptions?: Partial<ComparisonOptions<T>>;
  readMode?: 'reference' | 'safe';
}
export type TimeTravelInitialStores<T extends Record<string, any>> = {
  [K in keyof T]: TimeTravelStoreConfig<T[K]> | ExplicitStoreValue<T[K]> | T[K];
};
export interface TimeTravelControlsState {
  canUndo: boolean;
  canRedo: boolean;
  position: number;
  historyLength: number;
  undo: (steps?: number) => void;
  redo: (steps?: number) => void;
  goTo: (position: number) => void;
  reset: () => void;
}
export type InferTimeTravelStoreTypes<T extends Record<string, any>> = {
  readonly [K in keyof T]: T[K] extends ExplicitStoreValue<infer V>
    ? V
    : T[K] extends { initialValue: infer V }
      ? Exclude<keyof T[K], keyof TimeTravelStoreConfig<any>> extends never
        ? V
        : T[K]
      : T[K] extends (...args: unknown[]) => unknown
        ? never
        : T[K];
};
export class TimeTravelStoreManager<T extends Record<string, any>> {
  public readonly registry: StoreRegistry;
  public readonly initialStores: TimeTravelInitialStores<T>;
  public readonly stores = new Map<keyof T, Store<any> | TimeTravelStore<any>>();
  private lifecycle: 'active' | 'disposed' = 'active';
  private version = 0;
  private infoVersion = 0;
  private readonly listeners = new Set<() => void>();
  private readonly infoListeners = new Set<() => void>();
  private infoNotificationScheduled = false;
  constructor(
    public readonly name: string,
    initialStores: TimeTravelInitialStores<T>,
    private readonly defaultMaxHistory: number = 50
  ) {
    this.registry = new StoreRegistry(name);
    this.initialStores = initialStores;
  }
  getStore<K extends keyof T>(storeName: K): Store<T[K]> | TimeTravelStore<T[K]> {
    if (this.lifecycle === 'disposed') {
      throw new Error(`TimeTravelStoreManager "${this.name}" is disposed`);
    }
    const existing = this.stores.get(storeName);
    if (existing) {
      return existing;
    }
    const storeConfig = this.initialStores[storeName];
    let initialValue: T[K];
    let enableTimeTravel = true; 
    let maxHistory = this.defaultMaxHistory;
    let mutable = false;
    let strategy: 'reference' | 'shallow' | 'deep' = 'reference';
    let description: string | undefined;
    let debug = false;
    let tags: string[] = ['time-travel'];
    let version: string | undefined;
    let comparisonOptions: TimeTravelStoreConfig<T[K]>['comparisonOptions'];
    if (isExplicitStoreValue(storeConfig)) {
      initialValue = storeConfig.value as T[K];
      tags = ['time-travel', strategy];
    } else if (isStoreConfigShape(storeConfig, TIME_TRAVEL_STORE_CONFIG_KEYS)) {
      const config = storeConfig as TimeTravelStoreConfig<T[K]>;
      initialValue = config.initialValue;
      enableTimeTravel = config.timeTravel !== false; 
      maxHistory = config.maxHistory ?? this.defaultMaxHistory;
      mutable = config.mutable ?? false;
      strategy = config.strategy || 'reference';
      description = config.description;
      debug = config.debug || false;
      tags = enableTimeTravel
        ? (config.tags ? ['time-travel', ...config.tags] : ['time-travel', strategy])
        : (config.tags ? ['store', ...config.tags] : ['store', strategy]);
      version = config.version;
      comparisonOptions = config.comparisonOptions;
    } else {
      initialValue = storeConfig as T[K];
      tags = ['time-travel', strategy];
    }
    let store: Store<T[K]> | TimeTravelStore<T[K]>;
    if (enableTimeTravel) {
      store = createTimeTravelStore(String(storeName), initialValue, {
        maxHistory,
        mutable,
        readMode: (storeConfig && isStoreConfigShape(storeConfig, TIME_TRAVEL_STORE_CONFIG_KEYS))
          ? (storeConfig as TimeTravelStoreConfig<T[K]>).readMode ?? 'safe'
          : 'safe',
        isEqual: comparisonOptions?.customComparator ?? (
          (comparisonOptions?.strategy ?? strategy) === 'reference'
            ? undefined
            : (previous, next) => compareValues(previous, next, {
                ...comparisonOptions,
                strategy: comparisonOptions?.strategy ?? strategy,
              })
        ),
      });
    } else {
      store = createStore(String(storeName), initialValue);
      store.setComparisonOptions({
        strategy,
        ...comparisonOptions,
      });
    }
    const metadata = {
      name: String(storeName),
      tags,
      description: description || `${enableTimeTravel ? 'TimeTravelStore' : 'Store'}: ${String(storeName)}`,
      debug,
      ...(version !== undefined && { version }),
    };
    this.registry.register(String(storeName), store as any, metadata);
    if (debug && process.env.NODE_ENV === 'development') {
      console.log(`${enableTimeTravel ? '🕰️ Time travel' : '📦 Regular'} store created: ${String(storeName)}`, {
        timeTravel: enableTimeTravel,
        ...(enableTimeTravel && { maxHistory }),
        mutable,
        strategy,
        tags,
      });
    }
    this.stores.set(storeName, store);
    this.infoVersion += 1;
    this.scheduleInfoNotification();
    return store;
  }
  hasTimeTravel<K extends keyof T>(storeName: K): boolean {
    const store = this.getStore(storeName);
    return isTimeTravelStore(store);
  }
  clear(): void {
    if (this.lifecycle === 'disposed') {
      throw new Error(`TimeTravelStoreManager "${this.name}" is disposed`);
    }
    this.stores.forEach(store => store.dispose());
    this.registry.clear();
    this.stores.clear();
    this.version += 1;
    this.infoVersion += 1;
    this.listeners.forEach(listener => listener());
    this.scheduleInfoNotification();
  }
  dispose(): void {
    if (this.lifecycle === 'disposed') return;
    this.lifecycle = 'disposed';
    this.stores.forEach(store => store.dispose());
    this.stores.clear();
    this.listeners.clear();
    this.infoListeners.clear();
    this.registry.dispose();
  }
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  getVersion(): number {
    return this.version;
  }
  subscribeInfo(listener: () => void): () => void {
    this.infoListeners.add(listener);
    return () => this.infoListeners.delete(listener);
  }
  getInfoVersion(): number {
    return this.infoVersion;
  }
  private scheduleInfoNotification(): void {
    if (this.infoNotificationScheduled) return;
    this.infoNotificationScheduled = true;
    queueMicrotask(() => {
      this.infoNotificationScheduled = false;
      if (this.lifecycle === 'disposed') return;
      this.infoListeners.forEach(listener => listener());
    });
  }
  getInfo() {
    return {
      name: this.name,
      storeCount: this.stores.size,
      availableStores: Object.keys(this.initialStores),
    };
  }
}
interface TimeTravelStoreContextValue<T extends Record<string, any>> {
  managerRef: React.RefObject<TimeTravelStoreManager<T> | null>;
}
export function createTimeTravelStoreContext<T extends Record<string, any>>(
  contextName: string,
  initialStores: TimeTravelInitialStores<T>,
  options?: { defaultMaxHistory?: number }
) {
  const defaultMaxHistory = options?.defaultMaxHistory ?? 50;
  const StoreContext = createContext<TimeTravelStoreContextValue<T> | null>(null);
  function Provider({
    children,
    registryId,
  }: {
    children: ReactNode;
    registryId?: string;
  }) {
    const effectiveRegistryId = registryId || contextName;
    const managerRef = useRef<TimeTravelStoreManager<T> | null>(null);
    if (!managerRef.current) {
      managerRef.current = new TimeTravelStoreManager(
        effectiveRegistryId,
        initialStores,
        defaultMaxHistory
      );
    }
    useInsertionEffect(() => {
      const manager = managerRef.current;
      return () => {
        manager?.dispose();
        if (managerRef.current === manager) managerRef.current = null;
      };
    }, []);
    return (
      <StoreContext.Provider value={{ managerRef }}>
        {children}
      </StoreContext.Provider>
    );
  }
  function useStore<K extends keyof T>(storeName: K): Store<T[K]> | TimeTravelStore<T[K]> {
    const context = useContext(StoreContext);
    if (!context?.managerRef.current) {
      throw new Error(
        `useStore must be used within ${contextName}.Provider. ` +
        `Wrap your component with <${contextName}.Provider>`
      );
    }
    const manager = context.managerRef.current;
    const subscribe = useMemo(() => manager.subscribe.bind(manager), [manager]);
    const getVersion = useMemo(() => manager.getVersion.bind(manager), [manager]);
    useSyncExternalStore(subscribe, getVersion, getVersion);
    return manager.getStore(storeName);
  }
  function useTimeTravelStore<K extends keyof T>(storeName: K): TimeTravelStore<T[K]> {
    const store = useStore(storeName);
    if (!isTimeTravelStore(store)) {
      throw new Error(
        `useTimeTravelStore: Store "${String(storeName)}" does not have time travel enabled. ` +
        `Use useStore() instead, or set timeTravel: true in the store config.`
      );
    }
    return store;
  }
  function useTimeTravelControls<K extends keyof T>(storeName: K): TimeTravelControlsState {
    const store = useStore(storeName);
    if (!isTimeTravelStore(store)) {
      throw new Error(
        `useTimeTravelControls: Store "${String(storeName)}" does not have time travel enabled. ` +
        `Set timeTravel: true in the store config to use undo/redo.`
      );
    }
    const cacheRef = useRef<{
      canUndo: boolean;
      canRedo: boolean;
      position: number;
      historyLength: number;
    } | null>(null);
    const subscribe = useCallback(
      (callback: () => void) => store.subscribe(callback),
      [store]
    );
    const getSnapshot = useCallback(() => {
      const canUndo = store.canUndo();
      const canRedo = store.canRedo();
      const position = store.getPosition();
      const historyLength = store.getHistory().length;
      const cached = cacheRef.current;
      if (
        cached &&
        cached.canUndo === canUndo &&
        cached.canRedo === canRedo &&
        cached.position === position &&
        cached.historyLength === historyLength
      ) {
        return cached;
      }
      const newState = { canUndo, canRedo, position, historyLength };
      cacheRef.current = newState;
      return newState;
    }, [store]);
    const getServerSnapshot = useCallback(
      () => ({ canUndo: false, canRedo: false, position: 0, historyLength: 1 }),
      []
    );
    const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    const controls = useMemo(
      () => ({
        undo: (steps?: number) => store.undo(steps),
        redo: (steps?: number) => store.redo(steps),
        goTo: (position: number) => store.goTo(position),
        reset: () => store.reset(),
      }),
      [store]
    );
    return { ...state, ...controls };
  }
  function useStorePath<K extends keyof T, R = unknown>(
    storeName: K,
    path: StorePath
  ): R {
    const store = useStore(storeName);
    const pathSignature = createPathSignature(path);
    const stablePathRef = useRef<{ signature: string; path: StorePath }>({
      signature: pathSignature,
      path: [...path],
    });
    if (stablePathRef.current.signature !== pathSignature) {
      stablePathRef.current = { signature: pathSignature, path: [...path] };
    }
    const stablePath = stablePathRef.current.path;
    const cacheRef = useRef<{ value: R; initialized: boolean; pathSignature: string }>({
      value: undefined as R,
      initialized: false,
      pathSignature,
    });
    if (cacheRef.current.pathSignature !== pathSignature) {
      cacheRef.current = { value: undefined as R, initialized: false, pathSignature };
    }
    const subscribe = useCallback(
      (callback: () => void) => {
        if (isTimeTravelStore(store)) {
          return store.subscribeWithPatches((patches: Patches | null) => {
            if (patchesAffectPath(patches, stablePath)) {
              callback();
            }
          });
        }
        return store.subscribe(callback);
      },
      [store, stablePath]
    );
    const getSnapshot = useCallback((): R => {
      const storeValue = store.getSnapshot().value;
      const currentValue = getValueAtPath<T[K], R>(storeValue, stablePath);
      if (!cacheRef.current.initialized) {
        cacheRef.current = { value: currentValue, initialized: true, pathSignature };
        return currentValue;
      }
      if (Object.is(cacheRef.current.value, currentValue)) {
        return cacheRef.current.value;
      }
      cacheRef.current.value = currentValue;
      return currentValue;
    }, [store, stablePath, pathSignature]);
    const getServerSnapshot = useCallback((): R => {
      return getValueAtPath<T[K], R>(store.getSnapshot().value, stablePath);
    }, [store, stablePath]);
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  }
  function useStoreSelector<K extends keyof T, R>(
    storeName: K,
    selector: (value: T[K]) => R,
    options: { dependsOn?: StorePath[]; equalityFn?: (a: R, b: R) => boolean } = {}
  ): R {
    const store = useStore(storeName);
    const { dependsOn, equalityFn } = options;
    const cacheRef = useRef<R | undefined>(undefined);
    const depsKey = createPathsSignature(dependsOn);
    const stablePathsRef = useRef<{
      signature: string | null;
      paths: StorePath[] | undefined;
    }>({
      signature: depsKey,
      paths: dependsOn?.map((path) => [...path]),
    });
    if (stablePathsRef.current.signature !== depsKey) {
      stablePathsRef.current = {
        signature: depsKey,
        paths: dependsOn?.map((path) => [...path]),
      };
    }
    const stablePaths = stablePathsRef.current.paths;
    const subscribe = useCallback(
      (callback: () => void) => {
        if (!stablePaths) {
          return store.subscribe(callback);
        }
        if (isTimeTravelStore(store)) {
          return store.subscribeWithPatches((patches: Patches | null) => {
            const affected = stablePaths.some(path => patchesAffectPath(patches, path));
            if (affected) callback();
          });
        }
        return store.subscribe(callback);
      },
      [store, stablePaths]
    );
    const getSnapshot = useCallback((): R => {
      const currentValue = selector(store.getSnapshot().value);
      if (cacheRef.current !== undefined) {
        if (equalityFn ? equalityFn(cacheRef.current, currentValue) : Object.is(cacheRef.current, currentValue)) {
          return cacheRef.current;
        }
      }
      cacheRef.current = currentValue;
      return currentValue;
    }, [store, selector, equalityFn]);
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  }
  function useStoreManager(): TimeTravelStoreManager<T> {
    const context = useContext(StoreContext);
    if (!context?.managerRef.current) {
      throw new Error(
        `useStoreManager must be used within ${contextName}.Provider`
      );
    }
    return context.managerRef.current;
  }
  function useStoreInfo() {
    const manager = useStoreManager();
    useSyncExternalStore(
      listener => manager.subscribeInfo(listener),
      () => manager.getInfoVersion(),
      () => manager.getInfoVersion(),
    );
    return manager.getInfo();
  }
  function useStoreClear() {
    const manager = useStoreManager();
    return () => manager.clear();
  }
  function withProvider<P extends {}>(
    Component: React.ComponentType<P>,
    config?: {
      displayName?: string;
      registryId?: string;
      autoCleanup?: boolean;
      errorBoundary?: boolean;
    }
  ): React.FC<P> {
    const registryId = config?.registryId || contextName;
    const WithTimeTravelStoreProvider = (props: P) => {
      const managerRef = useRef<TimeTravelStoreManager<T> | null>(null);
      if (!managerRef.current) {
        managerRef.current = new TimeTravelStoreManager(
          registryId,
          initialStores,
          defaultMaxHistory
        );
      }
      useInsertionEffect(() => {
        const manager = managerRef.current;
        return () => {
          if (config?.autoCleanup === false) return;
          manager?.dispose();
          if (managerRef.current === manager) managerRef.current = null;
        };
      }, []);
      const provider = (
        <StoreContext.Provider value={{ managerRef }}>
          <Component {...props} />
        </StoreContext.Provider>
      );
      return config?.errorBoundary ? (
        <StoreErrorBoundary>{provider}</StoreErrorBoundary>
      ) : provider;
    };
    WithTimeTravelStoreProvider.displayName =
      config?.displayName ||
      `with${contextName}TimeTravelProvider(${Component.displayName || Component.name})`;
    return WithTimeTravelStoreProvider;
  }
  return {
    Provider,
    useStore,
    useTimeTravelStore,
    useStorePath,
    useStoreSelector,
    useTimeTravelControls,
    useStoreManager,
    useStoreInfo,
    useStoreClear,
    withProvider,
    contextName,
    initialStores,
  } as const;
}
```

### stores/utils/comparison.ts

```typescript
export type ComparisonStrategy = 'reference' | 'shallow' | 'deep' | 'custom';
export type CustomComparator<T = unknown> = (oldValue: T, newValue: T) => boolean;
export interface ComparisonOptions<T = unknown> {
  strategy: ComparisonStrategy;
  customComparator?: CustomComparator<T>;
  maxDepth?: number;
  ignoreKeys?: string[];
  enableCircularCheck?: boolean;
}
const DEFAULT_COMPARISON_OPTIONS: ComparisonOptions = {
  strategy: 'reference',
  maxDepth: 5,
  enableCircularCheck: true,
};
let globalComparisonOptions: ComparisonOptions = { ...DEFAULT_COMPARISON_OPTIONS };
export function setGlobalComparisonOptions(options: Partial<ComparisonOptions>): void {
  globalComparisonOptions = { ...DEFAULT_COMPARISON_OPTIONS, ...options };
}
export function getGlobalComparisonOptions(): ComparisonOptions {
  return { ...globalComparisonOptions };
}
export function referenceEquals<T>(oldValue: T, newValue: T): boolean {
  const result = Object.is(oldValue, newValue);
  return result;
}
export function shallowEquals<T>(oldValue: T, newValue: T, ignoreKeys: string[] = []): boolean {
  if (Object.is(oldValue, newValue)) {
    return true;
  }
  if (oldValue == null || newValue == null) {
    const result = oldValue === newValue;
    return result;
  }
  if (typeof oldValue !== 'object' || typeof newValue !== 'object') {
    const result = oldValue === newValue;
    return result;
  }
  if (Array.isArray(oldValue) !== Array.isArray(newValue)) {
    return false;
  }
  if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    if (oldValue.length !== newValue.length) {
      return false;
    }
    for (let i = 0; i < oldValue.length; i++) {
      if (!Object.is(oldValue[i], newValue[i])) {
        return false;
      }
    }
    return true;
  }
  const oldKeys = Object.keys(oldValue as Record<string, unknown>).filter(key => !ignoreKeys.includes(key));
  const newKeys = Object.keys(newValue as Record<string, unknown>).filter(key => !ignoreKeys.includes(key));
  if (oldKeys.length !== newKeys.length) {
    return false;
  }
  for (const key of oldKeys) {
    if (!newKeys.includes(key)) {
      return false;
    }
    if (!Object.is((oldValue as Record<string, unknown>)[key], (newValue as Record<string, unknown>)[key])) {
      return false;
    }
  }
  return true;
}
export function deepEquals<T>(
  oldValue: T, 
  newValue: T, 
  options: {
    maxDepth?: number;
    ignoreKeys?: string[];
    enableCircularCheck?: boolean;
  } = {}
): boolean {
  const { maxDepth = 5, ignoreKeys = [], enableCircularCheck = true } = options;
  const visitedPairs = enableCircularCheck ? new WeakMap<object, WeakSet<object>>() : null;
  function deepCompare(a: unknown, b: unknown, depth: number, path = ''): boolean {
    if (depth > maxDepth) {
      return Object.is(a, b);
    }
    if (Object.is(a, b)) {
      return true;
    }
    if (a == null || b == null) {
      return a === b;
    }
    if (typeof a !== typeof b) {
      return false;
    }
    if (typeof a !== 'object') {
      return a === b;
    }
    if (visitedPairs && typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
      if (visitedPairs.has(a)) {
        const pairedSet = visitedPairs.get(a)!;
        if (pairedSet.has(b)) {
          return true;
        }
      }
      if (!visitedPairs.has(a)) {
        visitedPairs.set(a, new WeakSet());
      }
      visitedPairs.get(a)!.add(b);
      if (!visitedPairs.has(b)) {
        visitedPairs.set(b, new WeakSet());
      }
      visitedPairs.get(b)!.add(a);
    }
    if ((a instanceof Date) !== (b instanceof Date)) {
      return false;
    }
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }
    if ((a instanceof RegExp) !== (b instanceof RegExp)) {
      return false;
    }
    if (a instanceof RegExp && b instanceof RegExp) {
      return a.toString() === b.toString();
    }
    if ((a instanceof Map) !== (b instanceof Map)) {
      return false;
    }
    if (a instanceof Map && b instanceof Map) {
      if (a.size !== b.size) {
        return false;
      }
      for (const [key, value] of a) {
        if (!b.has(key) || !deepCompare(value, b.get(key), depth + 1, `${path}[Map]`)) {
          return false;
        }
      }
      return true;
    }
    if ((a instanceof Set) !== (b instanceof Set)) {
      return false;
    }
    if (a instanceof Set && b instanceof Set) {
      if (a.size !== b.size) {
        return false;
      }
      const bItems = [...b];
      const matched = new Array<boolean>(bItems.length).fill(false);
      for (const item of a) {
        if (b.has(item)) {
          const exactIdx = bItems.findIndex((candidate, idx) => !matched[idx] && Object.is(candidate, item));
          if (exactIdx !== -1) {
            matched[exactIdx] = true;
            continue;
          }
        }
        let found = false;
        for (let idx = 0; idx < bItems.length; idx++) {
          if (!matched[idx] && deepCompare(item, bItems[idx], depth + 1, `${path}[Set]`)) {
            matched[idx] = true;
            found = true;
            break;
          }
        }
        if (!found) {
          return false;
        }
      }
      return true;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        return false;
      }
      for (let i = 0; i < a.length; i++) {
        if (!deepCompare(a[i], b[i], depth + 1, `${path}[${i}]`)) {
          return false;
        }
      }
      return true;
    }
    if (Array.isArray(a) || Array.isArray(b)) {
      return false;
    }
    const aKeys = Object.keys(a as Record<string, unknown>).filter(key => !ignoreKeys.includes(key));
    const bKeys = Object.keys(b as Record<string, unknown>).filter(key => !ignoreKeys.includes(key));
    if (aKeys.length !== bKeys.length) {
      return false;
    }
    for (const key of aKeys) {
      if (!bKeys.includes(key)) {
        return false;
      }
      if (!deepCompare((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key], depth + 1, `${path}.${key}`)) {
        return false;
      }
    }
    return true;
  }
  const result = deepCompare(oldValue, newValue, 0);
  return result;
}
export function compareValues<T>(
  oldValue: T, 
  newValue: T, 
  options: Partial<ComparisonOptions<T>> = {}
): boolean {
  const finalOptions = { ...globalComparisonOptions, ...options };
  const { strategy, customComparator, maxDepth, ignoreKeys, enableCircularCheck } = finalOptions;
  let result: boolean;
  try {
    switch (strategy) {
      case 'reference':
        result = referenceEquals(oldValue, newValue);
        break;
      case 'shallow':
        result = shallowEquals(oldValue, newValue, ignoreKeys);
        break;
      case 'deep': {
        const deepOptions = {
          ...(maxDepth !== undefined && { maxDepth }),
          ...(ignoreKeys !== undefined && { ignoreKeys }),
          ...(enableCircularCheck !== undefined && { enableCircularCheck })
        };
        result = deepEquals(oldValue, newValue, deepOptions);
        break;
      }
      case 'custom':
        if (!customComparator) {
          result = referenceEquals(oldValue, newValue);
        } else {
          result = customComparator(oldValue, newValue);
        }
        break;
      default:
        result = referenceEquals(oldValue, newValue);
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[CompareValues] Comparison failed, falling back to reference equality:', error);
    }
    result = referenceEquals(oldValue, newValue);
  }
  return result;
}
```

### stores/utils/error-handling.ts

```typescript
export enum ContextActionErrorType {
  STORE_ERROR = 'STORE_ERROR',
  ACTION_ERROR = 'ACTION_ERROR',
  REF_ERROR = 'REF_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CIRCULAR_REFERENCE_ERROR = 'CIRCULAR_REFERENCE_ERROR'
}
export class ContextActionError extends Error {
  public readonly type: ContextActionErrorType;
  public readonly context: Record<string, unknown> | undefined;
  public readonly timestamp: number;
  constructor(
    type: ContextActionErrorType,
    message: string,
    context?: Record<string, unknown>,
    originalError?: Error
  ) {
    super(message);
    this.name = 'ContextActionError';
    this.type = type;
    this.context = context ?? undefined;
    this.timestamp = Date.now();
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ContextActionError);
    }
    if (originalError) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }
  }
}
export enum ErrorLogLevel {
  SILENT = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4
}
export interface ErrorHandlingConfig {
  logLevel: ErrorLogLevel;
  throwOnError: boolean;
  enableStackTrace: boolean;
  maxLogEntries: number;
  suppressRepeatedErrors: boolean;
  logErrors: boolean;
}
const isDevEnvironment =
  typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
const defaultErrorConfig: ErrorHandlingConfig = {
  logLevel: isDevEnvironment ? ErrorLogLevel.DEBUG : ErrorLogLevel.ERROR,
  throwOnError: isDevEnvironment,
  enableStackTrace: true,
  maxLogEntries: 100,
  suppressRepeatedErrors: true,
  logErrors: true
};
let currentErrorConfig: ErrorHandlingConfig = { ...defaultErrorConfig };
interface ErrorLogEntry {
  error: ContextActionError;
  count: number;
  lastOccurred: number;
}
const errorLog: ErrorLogEntry[] = [];
const errorSignatures: Map<string, ErrorLogEntry> = new Map();
interface GlobalErrorBoundary {
  reportError(error: ContextActionError): void;
}
export function setErrorHandlingConfig(config: Partial<ErrorHandlingConfig>): void {
  currentErrorConfig = { ...currentErrorConfig, ...config };
}
export function getErrorHandlingConfig(): ErrorHandlingConfig {
  return { ...currentErrorConfig };
}
function createErrorSignature(error: ContextActionError): string {
  return `${error.type}:${error.message}:${error.context?.component || 'unknown'}`;
}
export function handleError(
  type: ContextActionErrorType,
  message: string,
  context?: Record<string, unknown>,
  originalError?: Error
): ContextActionError {
  const error = new ContextActionError(type, message, context, originalError);
  logError(error);
  if (currentErrorConfig.throwOnError) {
    throw error;
  }
  return error;
}
function logError(error: ContextActionError): void {
  const signature = createErrorSignature(error);
  if (currentErrorConfig.suppressRepeatedErrors) {
    const existingEntry = errorSignatures.get(signature);
    if (existingEntry) {
      existingEntry.count++;
      existingEntry.lastOccurred = Date.now();
      if (existingEntry.count % 10 === 0) {
        console.warn(
          `[Context-Action] Repeated error occurred ${existingEntry.count} times:`,
          error
        );
      }
      return;
    }
  }
  const logEntry: ErrorLogEntry = {
    error,
    count: 1,
    lastOccurred: Date.now()
  };
  errorLog.push(logEntry);
  errorSignatures.set(signature, logEntry);
  if (errorLog.length > currentErrorConfig.maxLogEntries) {
    const removedEntry = errorLog.shift();
    if (removedEntry) {
      const removedSignature = createErrorSignature(removedEntry.error);
      errorSignatures.delete(removedSignature);
    }
  }
  const globalWithBoundary = globalThis as typeof globalThis & {
    globalErrorBoundary?: GlobalErrorBoundary;
  };
  if (globalWithBoundary.globalErrorBoundary) {
    globalWithBoundary.globalErrorBoundary.reportError(error);
  }
  switch (currentErrorConfig.logLevel) {
    case ErrorLogLevel.DEBUG:
      console.debug('[Context-Action] Debug:', error);
      break;
    case ErrorLogLevel.INFO:
      console.info('[Context-Action] Info:', error);
      break;
    case ErrorLogLevel.WARN:
      console.warn('[Context-Action] Warning:', error);
      break;
    case ErrorLogLevel.ERROR:
      console.error('[Context-Action] Error:', error);
      if (currentErrorConfig.enableStackTrace && error.stack) {
        console.error('Stack trace:', error.stack);
      }
      break;
    case ErrorLogLevel.SILENT:
      break;
  }
}
function safeStringifyContext(context?: Record<string, unknown>): string {
  try {
    return JSON.stringify(context, null, 2) ?? 'undefined';
  } catch {
    return '[Unserializable context]';
  }
}
export const ErrorHandlers = {
  store: (message: string, context?: Record<string, unknown>, originalError?: Error) => {
    const enhancedMessage = `[Store Error] ${message}\nContext: ${safeStringifyContext(context)}`;
    return handleError(ContextActionErrorType.STORE_ERROR, enhancedMessage, context, originalError);
  },
  action: (message: string, context?: Record<string, unknown>, originalError?: Error) => {
    const enhancedMessage = `[Action Error] ${message}\nContext: ${safeStringifyContext(context)}`;
    return handleError(ContextActionErrorType.ACTION_ERROR, enhancedMessage, context, originalError);
  },
  ref: (message: string, context?: Record<string, unknown>, originalError?: Error) => {
    const enhancedMessage = `[Ref Error] ${message}\nContext: ${safeStringifyContext(context)}`;
    return handleError(ContextActionErrorType.REF_ERROR, enhancedMessage, context, originalError);
  },
  validation: (message: string, context?: Record<string, unknown>, originalError?: Error) => {
    const enhancedMessage = `[Validation Error] ${message}\nContext: ${safeStringifyContext(context)}`;
    return handleError(ContextActionErrorType.VALIDATION_ERROR, enhancedMessage, context, originalError);
  },
  initialization: (message: string, context?: Record<string, unknown>, originalError?: Error) => {
    const enhancedMessage = `[Initialization Error] ${message}\nContext: ${safeStringifyContext(context)}`;
    return handleError(ContextActionErrorType.INITIALIZATION_ERROR, enhancedMessage, context, originalError);
  },
  timeout: (message: string, context?: Record<string, unknown>, originalError?: Error) => {
    const enhancedMessage = `[Timeout Error] ${message}\nContext: ${safeStringifyContext(context)}`;
    return handleError(ContextActionErrorType.TIMEOUT_ERROR, enhancedMessage, context, originalError);
  },
  circularReference: (message: string, context?: Record<string, unknown>, originalError?: Error) =>
    handleError(ContextActionErrorType.CIRCULAR_REFERENCE_ERROR, message, context, originalError)
} as const;
export interface ErrorStatistics {
  totalErrors: number;
  errorsByType: Record<ContextActionErrorType, number>;
  mostFrequentErrors: Array<{
    signature: string;
    count: number;
    lastOccurred: number;
  }>;
  recentErrors: ContextActionError[];
}
export function getErrorStatistics(): ErrorStatistics {
  const errorsByType = Object.values(ContextActionErrorType).reduce((acc, type) => {
    acc[type] = 0;
    return acc;
  }, {} as Record<ContextActionErrorType, number>);
  errorLog.forEach(entry => {
    errorsByType[entry.error.type] += entry.count;
  });
  const mostFrequentErrors = Array.from(errorSignatures.entries())
    .map(([signature, entry]) => ({
      signature,
      count: entry.count,
      lastOccurred: entry.lastOccurred
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const recentErrors = errorLog
    .slice(-10)
    .map(entry => entry.error);
  return {
    totalErrors: errorLog.reduce((sum, entry) => sum + entry.count, 0),
    errorsByType,
    mostFrequentErrors,
    recentErrors
  };
}
```

### stores/utils/json-pointer.ts

```typescript
export type JsonPointerPath = (string | number)[];
export function escapeSegment(segment: string | number): string {
  if (typeof segment === 'number') {
    return String(segment);
  }
  return segment.replace(/~/g, '~0').replace(/\
}
export function unescapeSegment(segment: string): string {
  return segment.replace(/~1/g, '/').replace(/~0/g, '~');
}
export function pathToPointer(path: JsonPointerPath): string {
  if (path.length === 0) return '';
  return `/${path.map(escapeSegment).join('/')}`;
}
export function pointerToPath(pointer: string): string[] {
  if (pointer === '') return [];
  if (!pointer.startsWith('/')) {
    throw new Error(`Invalid JSON Pointer: must start with '/' or be empty string`);
  }
  return pointer.slice(1).split('/').map(unescapeSegment);
}
export function isPointerPrefix(prefix: string, pointer: string): boolean {
  if (prefix === pointer) return true;
  if (prefix === '') return true; 
  return pointer.startsWith(`${prefix}/`);
}
export function arePointersRelated(pointer1: string, pointer2: string): boolean {
  return isPointerPrefix(pointer1, pointer2) || isPointerPrefix(pointer2, pointer1);
}
export const pathToKey = pathToPointer;
export const isPathPrefix = isPointerPrefix;
```

### stores/utils/patch-affects-path.ts

```typescript
export type StorePathSegment = string | number;
export interface StorePathPatch {
  readonly op: string;
  readonly path: readonly unknown[] | string;
  readonly from?: readonly unknown[] | string;
  readonly value?: unknown;
}
function isPrefix(prefix: readonly string[], value: readonly string[]): boolean {
  return prefix.length <= value.length && prefix.every((segment, index) => segment === value[index]);
}
function normalizePatchPath(path: unknown): readonly string[] | null {
  if (typeof path === 'string') {
    if (path === '') return [];
    if (!path.startsWith('/') || /~(?:[^01]|$)/.test(path)) return null;
    return path.slice(1).split('/').map(segment => segment.replace(/~1/g, '/').replace(/~0/g, '~'));
  }
  if (!Array.isArray(path)) return null;
  const segments: string[] = [];
  for (const segment of path) {
    if (typeof segment !== 'string' && typeof segment !== 'number') return null;
    segments.push(String(segment));
  }
  return segments;
}
function affectsTarget(path: readonly string[], target: readonly string[], structural: boolean): boolean {
  if (isPrefix(path, target) || isPrefix(target, path)) return true;
  return (structural || path[path.length - 1] === 'length') && isPrefix(path.slice(0, -1), target);
}
export function patchesAffectPath(
  patches: readonly StorePathPatch[] | null,
  targetPath: readonly StorePathSegment[],
): boolean {
  if (!patches || patches.length === 0) return true;
  const target = targetPath.map(String);
  for (const patch of patches) {
    const path = normalizePatchPath(patch.path);
    if (path === null) return true;
    switch (patch.op) {
      case 'add':
      case 'remove':
      case 'copy':
      case 'move':
        if (affectsTarget(path, target, true)) return true;
        if (patch.op === 'move') {
          const source = normalizePatchPath(patch.from);
          if (source === null || affectsTarget(source, target, true)) return true;
        }
        break;
      case 'replace':
      case 'test':
        if (affectsTarget(path, target, false)) return true;
        break;
      default:
        return true;
    }
  }
  return false;
}
```

### stores/utils/path-signature.ts

```typescript
export type PathSegment = string | number;
function serializeNumber(value: number): string {
  if (Number.isNaN(value)) return 'NaN';
  if (value === Infinity) return 'Infinity';
  if (value === -Infinity) return '-Infinity';
  if (Object.is(value, -0)) return '-0';
  return String(value);
}
export function createPathSignature(path: readonly PathSegment[]): string {
  return JSON.stringify(
    path.map((segment) =>
      typeof segment === 'number'
        ? ['number', serializeNumber(segment)]
        : ['string', segment]
    )
  );
}
export function createPathsSignature(
  paths: readonly (readonly PathSegment[])[] | undefined
): string | null {
  if (!paths) return null;
  return JSON.stringify(paths.map(createPathSignature).sort());
}
```

### stores/utils/provider-composition.ts

```typescript
import React from 'react';
export type ProviderComponent = React.ComponentType<{ children: React.ReactNode }>;
export function composeProviders(
  ...providers: ProviderComponent[]
): ProviderComponent {
  return ({ children }: { children: React.ReactNode }) => {
    return providers.reduceRight(
      (children, Provider) => React.createElement(Provider, null, children),
      children
    );
  };
}
```

### stores/utils/sync-external-store-utils.ts

```typescript
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { IStore, Snapshot } from '../core/types';
import { deepEquals, referenceEquals, shallowEquals } from './comparison';
export interface EnhancedSubscriptionOptions {
  debounce?: number;
  throttle?: number;
  condition?: () => boolean;
  debug?: boolean;
  name?: string;
}
interface SelectedServerSnapshotCache<T, R> {
  store: IStore<T>;
  sourceSnapshot: Snapshot<T>;
  selector: ((value: T) => R) | undefined;
  equalityFn: ((a: R, b: R) => boolean) | undefined;
  value: R | T;
}
export function useSafeStoreSubscription<T, R = T>(
  store: IStore<T> | undefined | null,
  selector?: (value: T) => R,
  options: EnhancedSubscriptionOptions & {
    equalityFn?: (a: R, b: R) => boolean;
    initialValue?: R;
  } = {}
): R | T | undefined {
  const { initialValue, equalityFn, debounce, throttle, condition, debug, name } = options;
  const subscribe = useCallback((callback: () => void) => {
    if (!store) return () => {};
    return store.subscribe(callback);
  }, [store]);
  const getSnapshot = useCallback((): R | T | undefined => {
    if (!store) return initialValue;
    const snapshot = store.getSnapshot();
    const value = selector ? selector(snapshot.value) : snapshot.value;
    return value as R | T;
  }, [store, selector, initialValue]);
  const cachedSnapshotRef = useRef<{
    store: IStore<T> | undefined | null;
    value: R | T | undefined;
  } | undefined>(undefined);
  const stableGetSnapshot = useCallback((): R | T | undefined => {
    const currentSnapshot = getSnapshot();
    const cached = cachedSnapshotRef.current;
    if (store && equalityFn && cached?.store === store) {
      if (equalityFn(cached.value as R, currentSnapshot as R)) {
        return cached.value;
      }
    }
    cachedSnapshotRef.current = { store, value: currentSnapshot };
    return currentSnapshot;
  }, [getSnapshot, equalityFn, store]);
  const serverSnapshotCacheRef = useRef<SelectedServerSnapshotCache<T, R> | undefined>(undefined);
  const getServerSnapshot = useCallback((): R | T | undefined => {
    if (!store) return initialValue;
    const sourceSnapshot = store.getSnapshot();
    const cached = serverSnapshotCacheRef.current;
    if (
      cached &&
      cached.store === store &&
      cached.sourceSnapshot === sourceSnapshot &&
      cached.selector === selector &&
      cached.equalityFn === equalityFn
    ) {
      return cached.value;
    }
    const selectedValue = selector
      ? selector(sourceSnapshot.value)
      : sourceSnapshot.value;
    const value =
      cached &&
      cached.store === store &&
      cached.selector === selector &&
      cached.equalityFn === equalityFn &&
      equalityFn?.(cached.value as R, selectedValue as R)
        ? cached.value
        : selectedValue;
    serverSnapshotCacheRef.current = {
      store,
      sourceSnapshot,
      selector,
      equalityFn,
      value,
    };
    return value;
  }, [store, selector, initialValue, equalityFn]);
  const currentValue = useSyncExternalStore(
    subscribe,
    equalityFn ? stableGetSnapshot : getSnapshot,
    getServerSnapshot
  );
  useEffect(() => {
    serverSnapshotCacheRef.current = undefined;
  });
  const [visibleValue, setVisibleValue] = useState(currentValue);
  const lastVisibleAtRef = useRef(0);
  useEffect(() => {
    const delay = Math.max(debounce ?? 0, throttle ?? 0);
    if (!condition && delay <= 0) return;
    if (condition && !condition()) return;
    if (delay <= 0) {
      lastVisibleAtRef.current = Date.now();
      setVisibleValue(currentValue);
      return;
    }
    const elapsed = Date.now() - lastVisibleAtRef.current;
    const wait = throttle && elapsed < throttle
      ? throttle - elapsed
      : debounce ?? 0;
    const timer = setTimeout(() => {
      lastVisibleAtRef.current = Date.now();
      setVisibleValue(currentValue);
      if (debug && name) {
        console.debug(`[${name}] Delayed store value committed after ${wait}ms`);
      }
    }, Math.max(0, wait));
    return () => clearTimeout(timer);
  }, [condition, currentValue, debounce, debug, name, throttle]);
  return debounce || throttle || condition ? visibleValue : currentValue;
}
export const equalityFunctions = {
  reference: <T>(a: T, b: T): boolean => referenceEquals(a, b),
  shallow: <T>(a: T, b: T): boolean => shallowEquals(a, b),
  deep: <T>(a: T, b: T): boolean => deepEquals(a, b),
  smart: <T>(a: T, b: T): boolean => {
    if (referenceEquals(a, b)) return true;
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
      return false;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => {
        const bItem = b[index];
        if (typeof item === 'object' && item !== null && typeof bItem === 'object' && bItem !== null) {
          return shallowEquals(item, bItem);
        }
        return referenceEquals(item, bItem);
      });
    }
    return shallowEquals(a, b);
  }
};
```

### stores/utils/type-guards.ts

```typescript
export interface RefState {
  target: unknown;
  isReady: boolean;
  isMounted: boolean;
  mountPromise: Promise<unknown> | null;
}
export function isRefState(value: unknown): value is RefState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    'target' in candidate &&
    'isReady' in candidate &&
    'isMounted' in candidate &&
    'mountPromise' in candidate &&
    typeof candidate.isReady === 'boolean' &&
    typeof candidate.isMounted === 'boolean'
  );
}
export function isDOMEvent(value: unknown): value is Event {
  return typeof Event !== 'undefined' && value instanceof Event;
}
export function isEventLike(value: unknown): value is { preventDefault: () => void } {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return (
    typeof (value as Record<string, unknown>).preventDefault === 'function'
  );
}
export function hasTargetProperty(value: unknown): value is { target: unknown } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'target' in value
  );
}
export function isDOMElement(value: unknown): value is Element {
  return typeof Element !== 'undefined' && value instanceof Element;
}
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function isSuspiciousEventObject(value: unknown, checkNested = true): boolean {
  if (!isObject(value) || isRefState(value)) {
    return false;
  }
  if (isEventLikeObject(value)) {
    return true;
  }
  if (checkNested) {
    for (const key in value) {
      if (Object.getOwnPropertyDescriptor(value, key) !== undefined) {
        const nestedValue = value[key];
        if (isEventLikeObject(nestedValue)) {
          return true;
        }
      }
    }
  }
  return false;
}
function isEventLikeObject(value: unknown): boolean {
  if (!isObject(value)) {
    return false;
  }
  const hasEventTarget = hasTargetProperty(value);
  const hasPreventDefault = isEventLike(value);
  const isEvent = isDOMEvent(value);
  const hasEventType = 'type' in value && typeof value.type === 'string';
  const hasEventProperties = hasEventType && (hasEventTarget || hasPreventDefault);
  const hasReactMarkers = ('nativeEvent' in value) || ('persist' in value) || ('$$typeof' in value) || ('_reactInternalFiber' in value) || ('_owner' in value);
  const constructorName = value?.constructor?.name;
  const hasEventConstructor = constructorName ? (
    constructorName.includes('Event') || 
    constructorName === 'SyntheticEvent' ||
    constructorName.includes('MouseEvent') ||
    constructorName.includes('KeyboardEvent') ||
    constructorName.includes('TouchEvent') ||
    constructorName.includes('FocusEvent') ||
    constructorName.includes('SubmitEvent')
  ) : false;
  return isEvent || hasEventProperties || hasReactMarkers || hasEventConstructor;
}
export function findProblematicProperties(value: unknown): string[] {
  if (!isObject(value)) {
    return [];
  }
  const problematicKeys: string[] = [];
  for (const key in value) {
    if (Object.getOwnPropertyDescriptor(value, key) !== undefined) {
      const prop = value[key];
      if (isDOMElement(prop) || isDOMEvent(prop) || (isObject(prop) && hasTargetProperty(prop))) {
        problematicKeys.push(key);
      }
    }
  }
  return problematicKeys;
}
export const TypeGuards = {
  isRefState,
  isDOMEvent,
  isEventLike,
  hasTargetProperty,
  isDOMElement,
  isObject,
  isSuspiciousEventObject,
  findProblematicProperties
} as const;
```

### stores/utils/type-helpers.ts

```typescript
import type { Store } from '../core/Store';
export type StoreValue<S> = S extends Store<infer T> ? T : never;
export type StoresValues<S extends readonly Store<any>[]> = {
  [K in keyof S]: StoreValue<S[K]>
};
export type StoreRecordValues<S extends Record<string, Store<any>>> = {
  [K in keyof S]: StoreValue<S[K]>
};
export type StoreSelector<T, R> = (value: T) => R;
export type EqualityFunction<T> = (a: T, b: T) => boolean;
export type StoreListener = () => void;
export type StoreUpdater<T> = (current: T) => T;
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends (infer U)[]
    ? DeepReadonlyArray<U>
    : T[P] extends object
    ? DeepReadonly<T[P]>
    : T[P];
};
interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}
export interface StoreInitConfig<T> {
  name: string;
  initialValue: T;
  validateValue?: (value: unknown) => value is T;
  transformValue?: (value: unknown) => T;
}
```

### tools/index.ts

```typescript
export { createToolContext } from './ToolContext';
export type {
  ToolContextConfig,
  ToolPolicy,
  ToolPolicyDecision,
  ToolPolicyInput,
  ToolContextReturn,
  ToolContextType,
  DirectToolCallOptions,
  ToolRegistry,
  SchemaToolCallRequest,
  SchemaModelToolCall,
  SchemaToolCallResult,
  SchemaDurableOperationRecord,
  SchemaDurableOperationResolution,
  SchemaToolOperationRecoveryResolver,
  ToolCallFunction,
  ToolDispatchFunction,
  ToolDispatchWithResultReturn,
  ToolExecutionResult,
  ToolOperationRecoveryResolver,
  ToolValidationMode,
} from './ToolContext.types';
```

### tools/tool-registry.ts

```typescript
import type {
  ActionSchemaMap,
  ModelToolCall,
  ToolCallContext,
  ToolCallOptions,
  ToolCallRequest,
  ToolCallResult,
  ToolListRequest,
} from '@context-action/tool-protocol';
import {
  isToolListRequest,
  toAnthropicToolDefinitions,
  toOpenAIToolDefinitions,
  toToolCallRequest,
} from '@context-action/tool-protocol';
import type {
  DurableOperationRecord,
  DurableOperationResolution,
  DurableOperationFence,
} from '@context-action/tool-durable-operations';
import type {
  ToolOperationRecoveryResolver,
  ToolRegistry,
} from './ToolContext.types';
export type ToolCallExecutor = (
  request: ToolCallRequest,
  options?: ToolCallOptions
) => Promise<ToolCallResult>;
export type ToolOperationStatusReader = (
  toolName: string,
  idempotencyKey: string,
  context?: ToolCallContext
) => Promise<DurableOperationRecord<ToolCallResult> | undefined>;
export type ToolOperationReconciler = (
  toolName: string,
  idempotencyKey: string,
  resolution: DurableOperationResolution<ToolCallResult>,
  context: ToolCallContext | undefined,
  expectedFence: DurableOperationFence
) => Promise<DurableOperationRecord<ToolCallResult> | undefined>;
const TOOL_LIST_CURSOR_PREFIX = 'offset:';
function encodeToolListCursor(offset: number): string {
  return `${TOOL_LIST_CURSOR_PREFIX}${offset}`;
}
function parseToolListCursor(cursor: string, toolCount: number): number {
  if (!cursor.startsWith(TOOL_LIST_CURSOR_PREFIX)) {
    throw new Error('Invalid tools/list cursor.');
  }
  const offset = Number(cursor.slice(TOOL_LIST_CURSOR_PREFIX.length));
  if (!Number.isInteger(offset) || offset < 0 || offset > toolCount) {
    throw new Error('Invalid tools/list cursor.');
  }
  return offset;
}
export function createToolRegistry<TSchema extends ActionSchemaMap>(
  schema: TSchema,
  executeToolCall: ToolCallExecutor,
  allowedToolNames?: readonly string[],
  toolListPageSize?: number,
  getOperationStatus?: ToolOperationStatusReader,
  reconcileOperation?: ToolOperationReconciler
): ToolRegistry<TSchema> {
  if (
    toolListPageSize !== undefined &&
    (!Number.isInteger(toolListPageSize) || toolListPageSize <= 0)
  ) {
    throw new Error('toolListPageSize must be a positive integer.');
  }
  const catalog = Object.freeze({ ...schema }) as TSchema;
  const allowedNames = allowedToolNames ? new Set(allowedToolNames) : undefined;
  const toolNames = Object.freeze(Object.keys(catalog).filter(
    name => !allowedNames || allowedNames.has(name)
  ) as (keyof TSchema)[]);
  const hasOwnTool = (name: string): boolean =>
    Object.getOwnPropertyDescriptor(catalog, name) !== undefined &&
    (!allowedNames || allowedNames.has(name));
  const getExportableTool = <K extends keyof TSchema>(name: K): TSchema[K] => {
    if (!hasOwnTool(String(name))) {
      throw new Error(`Tool "${String(name)}" is not available in registry`);
    }
    const tool = catalog[name];
    if (!tool) {
      throw new Error(`Tool "${String(name)}" is not available in registry`);
    }
    return tool;
  };
  const listTools = (request?: ToolListRequest) => {
    if (request !== undefined && !isToolListRequest(request)) {
      throw new Error('Invalid tools/list request.');
    }
    if (!request || toolListPageSize === undefined) {
      return { tools: toolNames.map(name => catalog[name]!.toMCP()) };
    }
    const start = request.params?.cursor
      ? parseToolListCursor(request.params.cursor, toolNames.length)
      : 0;
    const end = Math.min(start + toolListPageSize, toolNames.length);
    return {
      tools: toolNames.slice(start, end).map(name => catalog[name]!.toMCP()),
      ...(end < toolNames.length ? { nextCursor: encodeToolListCursor(end) } : {}),
    };
  };
  const callTool = ((
    request: ToolCallRequest,
    options?: ToolCallOptions
  ): Promise<ToolCallResult> => executeToolCall(request, options)) as ToolRegistry<
    TSchema
  >['callTool'];
  const executeModelToolCall = ((
    call: ModelToolCall,
    options?: ToolCallOptions
  ): Promise<ToolCallResult> => executeToolCall(toToolCallRequest(call), {
    ...options,
    context: {
      ...options?.context,
      source: options?.context?.source ?? 'model',
      mode: options?.context?.mode ?? 'agent',
    },
  })) as ToolRegistry<TSchema>['executeModelToolCall'];
  const readOperationStatus = (async (
    toolName: string,
    idempotencyKey: string,
    context?: ToolCallContext
  ): Promise<DurableOperationRecord<ToolCallResult> | undefined> => {
    if (!hasOwnTool(toolName)) return undefined;
    return getOperationStatus?.(toolName, idempotencyKey, context);
  }) as ToolRegistry<TSchema>['getOperationStatus'];
  const reconcileDurableOperation = (async (
    toolName: string,
    idempotencyKey: string,
    resolution: DurableOperationResolution<ToolCallResult>,
    context?: ToolCallContext,
    expectedFence?: DurableOperationFence | number
  ): Promise<DurableOperationRecord<ToolCallResult> | undefined> => {
    if (!hasOwnTool(toolName)) return undefined;
    if (!reconcileOperation) return undefined;
    if (typeof expectedFence !== 'object' || expectedFence === null) {
      throw new Error(
        'Tool operation reconciliation requires a full { incarnation, revision } ' +
        'fifth-argument fence or recoverOperation(); omitted and numeric legacy ' +
        'fences fail closed.'
      );
    }
    return reconcileOperation(
      toolName,
      idempotencyKey,
      resolution,
      context,
      expectedFence
    );
  }) as ToolRegistry<TSchema>['reconcileOperation'];
  const recoverDurableOperation = (async (
    toolName: string,
    idempotencyKey: string,
    resolver: ToolOperationRecoveryResolver,
    context?: ToolCallContext
  ): Promise<DurableOperationRecord<ToolCallResult> | undefined> => {
    if (!hasOwnTool(toolName)) return undefined;
    if (typeof resolver !== 'function') {
      throw new TypeError('Tool operation recovery resolver must be a function.');
    }
    const record = await getOperationStatus?.(toolName, idempotencyKey, context);
    if (record?.state !== 'unknown') return record;
    if (!reconcileOperation) return record;
    const resolution = await resolver(record, context);
    return reconcileOperation(
      toolName,
      idempotencyKey,
      resolution,
      context,
      { incarnation: record.incarnation, revision: record.revision }
    );
  }) as ToolRegistry<TSchema>['recoverOperation'];
  return {
    tools: catalog,
    getTool<K extends keyof TSchema>(name: K): TSchema[K] {
      if (Object.getOwnPropertyDescriptor(catalog, String(name)) === undefined) {
        throw new Error(`Tool "${String(name)}" not found in registry`);
      }
      return getExportableTool(name);
    },
    hasTool(name: string): boolean {
      return hasOwnTool(name);
    },
    listTools,
    getToolDefinition(name: string) {
      if (!hasOwnTool(name)) return undefined;
      return catalog[name]?.toMCP();
    },
    callTool,
    executeModelToolCall,
    getOperationStatus: readOperationStatus,
    reconcileOperation: reconcileDurableOperation,
    recoverOperation: recoverDurableOperation,
    getToolNames(): (keyof TSchema)[] {
      return [...toolNames];
    },
    toMCP() {
      return listTools().tools;
    },
    toOpenAI() {
      return toOpenAIToolDefinitions(listTools().tools);
    },
    toAnthropic() {
      return toAnthropicToolDefinitions(listTools().tools);
    },
    toMCPFiltered<K extends keyof TSchema>(names: K[]) {
      return names.map(name => getExportableTool(name).toMCP());
    },
    toOpenAIFiltered<K extends keyof TSchema>(names: K[]) {
      return toOpenAIToolDefinitions(names.map(name => getExportableTool(name).toMCP()));
    },
    toAnthropicFiltered<K extends keyof TSchema>(names: K[]) {
      return toAnthropicToolDefinitions(names.map(name => getExportableTool(name).toMCP()));
    },
  };
}
```

### tools/ToolContext.tsx

```typescript
import {
  ActionHandler,
  ActionRegister,
  ActionResultHandler,
  DispatchArgs,
  DispatchOptions,
  HandlerConfig,
} from '@context-action/core';
import {
  type DurableOperationClaim,
  hasDurableOperationFencingCapability,
} from '@context-action/tool-durable-operations';
import type {
  ToolCallContext,
  ToolCallEvent,
  ToolCallRequest,
  ToolCallResult,
  ToolIdempotencyRegistry,
} from '@context-action/tool-protocol';
import {
  ActionSchemaMap,
  createToolCallError,
  createToolCallFingerprint,
  createToolCallSuccess,
  createToolExecutionProvenance,
  createToolIdempotencyRegistry,
  createToolOperationKey,
  getToolCallErrorMetadata,
  InferActionPayloadMap,
  InferActionInputMap,
  InferActionResultMap,
  isToolCallRequest,
  isValidToolIdempotencyKey,
  measureToolOutputBytes,
  sanitizeToolCallDiagnostic,
  sanitizeToolCallDiagnosticReason,
  TOOL_CALL_ERROR_CODES,
  withToolCallId,
} from '@context-action/tool-protocol';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useId,
  useInsertionEffect,
  useMemo,
  useRef,
} from 'react';
import {
  ProviderDispatchLifecycleImpl,
  withProviderDispatchSignal,
} from '../actions/ActionContext';
import type {
  DirectToolCallOptions,
  ToolCallFunction,
  ToolContextConfig,
  ToolContextReturn,
  ToolContextType,
  ToolExecutionResult,
  ToolPolicy,
  ToolRegistry,
} from './ToolContext.types';
import {
  createToolRegistry,
  type ToolCallExecutor,
  type ToolOperationReconciler,
  type ToolOperationStatusReader,
} from './tool-registry';
const DEFAULT_DURABLE_OPERATION_LEASE_MS = 5 * 60 * 1000;
const MAX_DURABLE_ABORT_PERSISTENCE_WAIT_MS = 1000;
const MAX_TOOL_CALL_TIMEOUT_MS = 2_147_483_647;
type DurablePersistenceOutcome =
  | { readonly persisted: true }
  | { readonly persisted: false; readonly error: unknown };
type DurableAbortSettlement =
  | { readonly safe: true; readonly winner: 'known-terminal' | 'unknown' }
  | { readonly safe: false; readonly error: unknown };
function abortError(signal: AbortSignal): Error {
  const reason = signal.reason;
  if (reason instanceof Error) return reason;
  const error = new Error('Tool call cancelled.');
  error.name = 'AbortError';
  return error;
}
function awaitWithAbort<T>(
  promise: PromiseLike<T>,
  signal?: AbortSignal
): Promise<T> {
  if (!signal) return Promise.resolve(promise);
  if (signal.aborted) return Promise.reject(abortError(signal));
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const cleanup = () => signal.removeEventListener('abort', onAbort);
    const onAbort = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(abortError(signal));
    };
    signal.addEventListener('abort', onAbort, { once: true });
    Promise.resolve(promise).then(
      value => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(value);
      },
      error => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      }
    );
  });
}
class ToolCallTimeoutError extends Error {
  override name = 'ToolCallTimeoutError';
  constructor(public readonly timeoutMs: number) {
    super(`Tool call timed out after ${timeoutMs}ms.`);
    Object.setPrototypeOf(this, ToolCallTimeoutError.prototype);
  }
}
interface ToolCallTimeoutState {
  readonly signal: AbortSignal;
  readonly timeoutMs: number;
  readonly cleanup: () => void;
}
function createToolCallTimeout(timeout: number | undefined): ToolCallTimeoutState | undefined {
  if (timeout === undefined) return undefined;
  if (!Number.isSafeInteger(timeout) || timeout < 0 || timeout > MAX_TOOL_CALL_TIMEOUT_MS) {
    throw new RangeError(
      `Tool call timeout must be a safe integer between 0 and ${MAX_TOOL_CALL_TIMEOUT_MS}ms.`
    );
  }
  const controller = new AbortController();
  const timeoutError = new ToolCallTimeoutError(timeout);
  const timer = setTimeout(() => controller.abort(timeoutError), timeout);
  return {
    signal: controller.signal,
    timeoutMs: timeout,
    cleanup: () => clearTimeout(timer),
  };
}
function mergeToolCallSignals(
  signals: readonly (AbortSignal | undefined)[]
): { signal?: AbortSignal; cleanup: () => void } {
  const activeSignals = signals.filter(
    (signal): signal is AbortSignal => signal !== undefined
  );
  if (activeSignals.length === 0) return { cleanup: () => {} };
  if (activeSignals.length === 1) {
    return { signal: activeSignals[0], cleanup: () => {} };
  }
  if (typeof AbortSignal.any === 'function') {
    return { signal: AbortSignal.any(activeSignals), cleanup: () => {} };
  }
  const controller = new AbortController();
  const listeners = activeSignals.map(signal => {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return undefined;
    }
    const listener = () => {
      if (!controller.signal.aborted) controller.abort(signal.reason);
    };
    signal.addEventListener('abort', listener, { once: true });
    return () => signal.removeEventListener('abort', listener);
  });
  return {
    signal: controller.signal,
    cleanup: () => listeners.forEach(listener => listener?.()),
  };
}
function isToolCallTimeoutError(error: unknown): error is ToolCallTimeoutError {
  return error instanceof ToolCallTimeoutError;
}
function validateOptionalOutputBudget(maxOutputBytes: number | undefined): void {
  if (maxOutputBytes !== undefined
    && (!Number.isSafeInteger(maxOutputBytes) || maxOutputBytes <= 0)) {
    throw new RangeError('Tool call maxOutputBytes must be a positive safe integer.');
  }
}
function validateOptionalExecutionOwnerId(ownerId: string | undefined, label = 'executionOwnerId'): void {
  if (ownerId === undefined) return;
  const normalized = ownerId.trim();
  if (normalized.length === 0 || normalized.length > 256 || normalized.includes('\0')) {
    throw new TypeError(`${label} must be visible text within 256 characters.`);
  }
}
function provenanceStateForResult(
  result: ToolCallResult,
): 'completed' | 'failed' | 'cancelled' | 'unknown' {
  if (!result.isError) return 'completed';
  const code = result.error?.code;
  if (code === TOOL_CALL_ERROR_CODES.TIMEOUT
    || code === TOOL_CALL_ERROR_CODES.EXECUTION_ABORTED
    || code === TOOL_CALL_ERROR_CODES.EXECUTION_UNKNOWN) {
    return 'unknown';
  }
  if (code === TOOL_CALL_ERROR_CODES.CANCELLED) return 'cancelled';
  return 'failed';
}
function enforceToolOutputBudget(
  result: ToolCallResult,
  maxOutputBytes: number | undefined,
  toolCallId: ToolCallRequest['id'],
): ToolCallResult {
  if (maxOutputBytes === undefined) return result;
  const usedOutputBytes = measureToolOutputBytes({
    content: result.content,
    ...(result.structuredContent === undefined
      ? {}
      : { structuredContent: result.structuredContent }),
  });
  if (usedOutputBytes <= maxOutputBytes) return result;
  return createToolCallError(
    `Tool call output exceeded the ${maxOutputBytes}-byte limit.`,
    {
      code: TOOL_CALL_ERROR_CODES.OUTPUT_LIMIT_EXCEEDED,
      retryable: false,
      toolCallId,
      details: { maxOutputBytes, usedOutputBytes },
    }
  );
}
function observedToolOutputBytes(result: ToolCallResult): number {
  const details = result.error?.details;
  if (details && typeof details === 'object' && !Array.isArray(details)) {
    const usedOutputBytes = (details as Record<string, unknown>).usedOutputBytes;
    if (typeof usedOutputBytes === 'number' && Number.isSafeInteger(usedOutputBytes)
      && usedOutputBytes >= 0) {
      return usedOutputBytes;
    }
  }
  return measureToolOutputBytes({
    content: result.content,
    ...(result.structuredContent === undefined
      ? {}
      : { structuredContent: result.structuredContent }),
  });
}
export function createToolContext<TSchema extends ActionSchemaMap>(
  contextName: string,
  config: ToolContextConfig<TSchema>
): ToolContextReturn<TSchema> {
  type TPayloadMap = InferActionPayloadMap<TSchema>;
  type TInputMap = InferActionInputMap<TSchema>;
  const {
    schema: configuredSchema,
    validationMode = 'strict',
    validateOnDispatch = true,
    debug = false,
    allowedToolNames: configuredAllowedToolNames,
    toolListPageSize,
    toolPolicy,
    onToolCall,
    executionOwnerId,
    idempotency,
    durableOperationStore,
    durableOperationOwnerId,
    durableOperationLeaseMs = DEFAULT_DURABLE_OPERATION_LEASE_MS,
    durableDiagnosticPolicy,
  } = config;
  const schema = Object.freeze({ ...configuredSchema }) as TSchema;
  const allowedToolNames = configuredAllowedToolNames === undefined
    ? undefined
    : Object.freeze([...new Set(configuredAllowedToolNames)]);
  if (
    durableOperationLeaseMs !== undefined &&
    (!Number.isFinite(durableOperationLeaseMs) || durableOperationLeaseMs <= 0)
  ) {
    throw new RangeError('durableOperationLeaseMs must be a positive finite number.');
  }
  validateOptionalExecutionOwnerId(durableOperationOwnerId, 'durableOperationOwnerId');
  validateOptionalExecutionOwnerId(executionOwnerId);
  if (durableOperationStore && !hasDurableOperationFencingCapability(durableOperationStore)) {
    throw new TypeError(
      'durableOperationStore must declare incarnation-revision fencing capability.'
    );
  }
  const ToolReactContext = createContext<ToolContextType<TSchema> | null>(null);
  const Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const providerInstanceId = useId();
    const durableOwnerId = durableOperationOwnerId ?? `${contextName}:${providerInstanceId}`;
    const actionRegisterRef = useRef<ActionRegister<TPayloadMap> | null>(null);
    const dispatchLifecycleRef = useRef<ProviderDispatchLifecycleImpl | null>(null);
    const idempotencyRegistryRef = useRef<ToolIdempotencyRegistry<ToolCallResult> | null>(null);
    if (!actionRegisterRef.current) {
      actionRegisterRef.current = new ActionRegister<TPayloadMap>({
        name: contextName,
        registry: {
          schema: schema as ActionSchemaMap,
          validationMode,
          validateOnDispatch,
          useConcurrencyQueue: true,
        },
      });
    }
    if (!dispatchLifecycleRef.current) {
      dispatchLifecycleRef.current = new ProviderDispatchLifecycleImpl();
    }
    if (!idempotencyRegistryRef.current) {
      idempotencyRegistryRef.current = createToolIdempotencyRegistry<ToolCallResult>(
        idempotency
      );
    }
    const dispatchLifecycle = dispatchLifecycleRef.current;
    useInsertionEffect(() => {
      const register = actionRegisterRef.current;
      if (!register) {
        throw new Error('Tool provider resources were not initialized before commit.');
      }
      return () => {
        void dispatchLifecycle.shutdown(register);
        if (actionRegisterRef.current === register) {
          actionRegisterRef.current = null;
        }
        if (dispatchLifecycleRef.current === dispatchLifecycle) {
          dispatchLifecycleRef.current = null;
        }
        idempotencyRegistryRef.current = null;
      };
    }, [dispatchLifecycle]);
    const dispatch = useMemo(() => {
      return <K extends Extract<keyof TPayloadMap, string>>(
        toolName: K,
        payload: TPayloadMap[K],
        options?: DispatchOptions
      ): Promise<void> => {
        if (debug) {
          console.log(`[${contextName}] Dispatching tool '${String(toolName)}':`, payload);
        }
        const register = actionRegisterRef.current;
        if (!register) {
          throw new Error(`ActionRegister not initialized in ${contextName}`);
        }
        const trackedPromise = dispatchLifecycle.run(
          [options?.signal],
          signal => register.dispatch(
            toolName as Extract<keyof TPayloadMap, string>,
            ...([payload, withProviderDispatchSignal(options, signal)] as DispatchArgs<TPayloadMap[K]>)
          )
        );
        void trackedPromise.catch(() => {});
        return trackedPromise;
      };
    }, [dispatchLifecycle]);
    const executeToolCall = useMemo<ToolCallExecutor>(() => {
      return async (request, options) => {
        if (!isToolCallRequest(request)) {
          const rawRequest = request as unknown as {
            id?: unknown;
          } | null;
          const rawId = rawRequest?.id;
          const toolCallId =
            typeof rawId === 'string' ||
            (typeof rawId === 'number' && Number.isFinite(rawId))
              ? rawId
              : undefined;
          return createToolCallError('Invalid tools/call request.', {
            code: TOOL_CALL_ERROR_CODES.VALIDATION_FAILED,
            ...(toolCallId === undefined ? {} : { toolCallId }),
          });
        }
        const startedAt = Date.now();
        const idempotencyKey = options?.idempotencyKey;
        if (idempotencyKey !== undefined && !isValidToolIdempotencyKey(idempotencyKey)) {
          return createToolCallError(
            'Tool call idempotencyKey must be a non-empty string of at most 256 characters.',
            {
              code: TOOL_CALL_ERROR_CODES.INVALID_OPTIONS,
              retryable: false,
              toolCallId: request.id,
            }
          );
        }
        let timeoutState: ToolCallTimeoutState | undefined;
        try {
          timeoutState = createToolCallTimeout(options?.timeout);
          validateOptionalOutputBudget(options?.maxOutputBytes);
          validateOptionalExecutionOwnerId(options?.executionOwnerId);
        } catch (error) {
          timeoutState?.cleanup();
          return createToolCallError(
            error instanceof Error ? error.message : String(error),
            {
              code: TOOL_CALL_ERROR_CODES.INVALID_OPTIONS,
              retryable: false,
              toolCallId: request.id,
            }
          );
        }
        const signalState = mergeToolCallSignals([
          options?.signal,
          timeoutState?.signal,
        ]);
        const callSignal = signalState.signal;
        const context: ToolCallContext = options?.context ?? { source: 'mcp' };
        const provenanceOwnerId = options?.executionOwnerId ?? executionOwnerId ?? durableOwnerId;
        const toolName = request.params.name as keyof TPayloadMap;
        const hasOwnTool = Object.getOwnPropertyDescriptor(schema, request.params.name) !== undefined;
        const tool = hasOwnTool ? schema[request.params.name] : undefined;
        const emit = (event: ToolCallEvent): void => {
          try {
            onToolCall?.(event);
          } catch (error) {
            if (debug) console.warn(`[${contextName}] Tool observer failed`, error);
          }
        };
        emit({
          type: 'started',
          toolCallId: request.id,
          name: request.params.name,
          request,
          context,
          timestamp: startedAt,
          provenance: createToolExecutionProvenance({
            ownerId: provenanceOwnerId,
            state: 'pending',
            ...(options?.timeout === undefined ? {} : { timeoutMs: options.timeout }),
            ...(options?.maxOutputBytes === undefined ? {} : { maxOutputBytes: options.maxOutputBytes }),
            usedOutputBytes: 0,
            elapsedMs: 0,
          }),
        });
        const finish = (result: ToolCallResult): ToolCallResult => {
          timeoutState?.cleanup();
          signalState.cleanup();
          const normalized = withToolCallId(result, request.id);
          const usedOutputBytes = observedToolOutputBytes(normalized);
          const finalResult = normalized;
          const elapsedMs = Math.max(0, Date.now() - startedAt);
          emit({
            type: finalResult.isError ? 'failed' : 'completed',
            toolCallId: request.id,
            name: request.params.name,
            request,
            context,
            timestamp: Date.now(),
            durationMs: elapsedMs,
            result: finalResult,
            provenance: createToolExecutionProvenance({
              ownerId: provenanceOwnerId,
              state: provenanceStateForResult(finalResult),
              ...(options?.timeout === undefined ? {} : { timeoutMs: options.timeout }),
              ...(options?.maxOutputBytes === undefined ? {} : { maxOutputBytes: options.maxOutputBytes }),
              usedOutputBytes,
              elapsedMs,
            }),
          });
          return finalResult;
        };
        const timeoutResult = (): ToolCallResult => createToolCallError(
          `Tool call timed out after ${timeoutState!.timeoutMs}ms.`,
          {
            code: TOOL_CALL_ERROR_CODES.TIMEOUT,
            retryable: true,
            toolCallId: request.id,
            details: {
              timeoutMs: timeoutState!.timeoutMs,
              executionState: 'detached',
            },
          }
        );
        if (!tool) {
          return finish(createToolCallError(
            `Tool "${request.params.name}" not found in registry`,
            { code: TOOL_CALL_ERROR_CODES.NOT_FOUND, toolCallId: request.id }
          ));
        }
        if (allowedToolNames && !allowedToolNames.includes(request.params.name)) {
          return finish(createToolCallError(
            `Tool "${request.params.name}" is not allowed in this registry`,
            { code: TOOL_CALL_ERROR_CODES.NOT_ALLOWED, toolCallId: request.id }
          ));
        }
        let executionArguments = request.params.arguments ?? {};
        if (validateOnDispatch && validationMode === 'strict') {
          const validation = tool.safeParse(request.params.arguments ?? {});
          if (!validation.success) {
            return finish(createToolCallError(
              `Tool "${request.params.name}" arguments failed validation`,
              {
                code: TOOL_CALL_ERROR_CODES.VALIDATION_FAILED,
                toolCallId: request.id,
                details: { issues: validation.error.issues },
              }
            ));
          }
          executionArguments = validation.data as Record<string, unknown>;
        }
        if (toolPolicy) {
          let decision: Awaited<ReturnType<ToolPolicy>>;
          let policySignal: AbortSignal | undefined;
          try {
            decision = await awaitWithAbort(
              dispatchLifecycle.run(
                [options?.signal, timeoutState?.signal],
                signal => {
                  policySignal = signal;
                  return awaitWithAbort(
                    Promise.resolve().then(() =>
                      toolPolicy({
                        request,
                        definition: tool.toMCP(),
                        context,
                        signal,
                      })
                    ),
                    signal
                  );
                }
              ),
              callSignal
            );
          } catch (error) {
            if (timeoutState && (timeoutState.signal.aborted || isToolCallTimeoutError(error))) {
              return finish(timeoutResult());
            }
            if (options?.signal?.aborted) {
              return finish(createToolCallError(
                'Tool call cancelled while waiting for policy.',
                {
                  code: TOOL_CALL_ERROR_CODES.CANCELLED,
                  retryable: true,
                  toolCallId: request.id,
                }
              ));
            }
            if (
              !options?.signal?.aborted &&
              (policySignal?.aborted ||
                (policySignal === undefined &&
                  error instanceof Error &&
                  error.name === 'AbortError'))
            ) {
              return finish(createToolCallError(
                error instanceof Error ? error.message : 'Tool provider unmounted.',
                {
                  code: TOOL_CALL_ERROR_CODES.EXECUTION_ABORTED,
                  retryable: true,
                  toolCallId: request.id,
                  details: { executionState: 'detached' },
                }
              ));
            }
            return finish(createToolCallError(
              error instanceof Error ? error.message : String(error),
              {
                code: TOOL_CALL_ERROR_CODES.POLICY_FAILED,
                toolCallId: request.id,
                retryable: true,
              }
            ));
          }
          if (decision === 'ask' && options?.interaction) {
            let interactionSignal: AbortSignal | undefined;
            try {
              const interactionDecision = await awaitWithAbort(
                dispatchLifecycle.run(
                  [options?.signal, timeoutState?.signal],
                  signal => {
                    interactionSignal = signal;
                    return awaitWithAbort(
                      options.interaction!({
                        kind: 'approval',
                        call: {
                          ...(request.id === undefined ? {} : { id: request.id }),
                          name: request.params.name,
                          arguments: request.params.arguments ?? {},
                        },
                        request,
                        definition: tool.toMCP(),
                        context,
                        signal,
                      }),
                      signal
                    );
                  }
                ),
                callSignal,
              );
              decision = interactionDecision === 'approved' ? 'allow' : 'deny';
            } catch (error) {
              if (timeoutState && (timeoutState.signal.aborted || isToolCallTimeoutError(error))) {
                return finish(timeoutResult());
              }
              if (options?.signal?.aborted) {
                return finish(createToolCallError('Tool call cancelled while waiting for interaction.', {
                  code: TOOL_CALL_ERROR_CODES.CANCELLED,
                  retryable: true,
                  toolCallId: request.id,
                }));
              }
              if (
                !options?.signal?.aborted &&
                (interactionSignal?.aborted ||
                  (interactionSignal === undefined &&
                    error instanceof Error &&
                    error.name === 'AbortError'))
              ) {
                return finish(createToolCallError(
                  error instanceof Error ? error.message : 'Tool provider unmounted.',
                  {
                    code: TOOL_CALL_ERROR_CODES.EXECUTION_ABORTED,
                    retryable: true,
                    toolCallId: request.id,
                    details: { executionState: 'detached' },
                  }
                ));
              }
              return finish(createToolCallError(
                error instanceof Error ? error.message : String(error),
                {
                  code: TOOL_CALL_ERROR_CODES.POLICY_FAILED,
                  retryable: true,
                  toolCallId: request.id,
                },
              ));
            }
          }
          if (decision !== 'allow') {
            return finish(createToolCallError(
              decision === 'ask'
                ? `Approval required for tool "${request.params.name}"`
                : `Tool "${request.params.name}" was denied by policy`,
              {
                code: decision === 'ask'
                  ? TOOL_CALL_ERROR_CODES.APPROVAL_REQUIRED
                  : TOOL_CALL_ERROR_CODES.POLICY_DENIED,
                retryable: decision === 'ask',
                toolCallId: request.id,
              }
            ));
          }
        }
        const register = actionRegisterRef.current;
        if (!register) {
          return finish(createToolCallError(`ActionRegister not initialized in ${contextName}`, {
            code: TOOL_CALL_ERROR_CODES.REGISTRY_NOT_READY,
            toolCallId: request.id,
            retryable: true,
          }));
        }
        const payload = executionArguments as TPayloadMap[typeof toolName];
        const operationKey = idempotencyKey === undefined
          ? undefined
          : createToolOperationKey(
              request.params.name,
              idempotencyKey,
              context.sessionId
            );
        const fingerprint = idempotencyKey === undefined
          ? undefined
          : createToolCallFingerprint(request.params.name, request.params.arguments ?? {});
        let durableAbortTransition: Promise<DurableAbortSettlement> | undefined;
        const storeFailureResult = (
          error: unknown,
          persistenceUncertain = false
        ): ToolCallResult => createToolCallError(
          `Durable operation state could not be persisted: ${
            error instanceof Error ? error.message : String(error)
          }`,
          {
            code: TOOL_CALL_ERROR_CODES.IDEMPOTENCY_STORE_FAILED,
            retryable: true,
            toolCallId: request.id,
            details: {
              ...(operationKey === undefined ? {} : { operationKey }),
              ...(persistenceUncertain
                ? {
                    persistenceState: 'uncertain',
                    automaticRetrySafe: false,
                  }
                : {}),
            },
          }
        );
        const unknownOperationResult = (): ToolCallResult => createToolCallError(
          `Operation "${request.params.name}" has an unknown outcome and requires reconciliation.`,
          {
            code: TOOL_CALL_ERROR_CODES.IDEMPOTENCY_UNKNOWN,
            retryable: false,
            toolCallId: request.id,
            details: {
              state: 'unknown',
              automaticRetrySafe: false,
            },
          }
        );
        const storedResultForDurability = (result: ToolCallResult): ToolCallResult => {
          if (result.toolCallId === undefined) return result;
          const { toolCallId: _toolCallId, ...withoutToolCallId } = result;
          return withoutToolCallId;
        };
        const transitionOutcome = (
          transition: () => unknown | PromiseLike<unknown>
        ): Promise<DurablePersistenceOutcome> => Promise.resolve()
          .then(transition)
          .then(
            () => ({ persisted: true as const }),
            error => ({ persisted: false as const, error })
          );
        const performExecution = async (
          signal: AbortSignal
        ): Promise<ToolCallResult> => {
          try {
            const execution = await register.dispatchWithResult(
              toolName as Extract<keyof TPayloadMap, string>,
              ...([
                payload,
                withProviderDispatchSignal({ signal }, signal),
              ] as DispatchArgs<TPayloadMap[typeof toolName]>)
            );
            if (!execution.success) {
              const validationMessage =
                execution.validation && !execution.validation.passed
                  ? execution.validation.errors.join('; ')
                  : undefined;
              const failedHandler = execution.failedResults.find(
                ({ error }) => Boolean(error?.message)
              );
              const lifecycleError = execution.errors.find(
                ({ error }) => Boolean(error?.message)
              );
              const handlerError = failedHandler?.error ?? lifecycleError?.error;
              const handlerMetadata = getToolCallErrorMetadata(handlerError);
              const executionMessage =
                execution.abortReason ??
                validationMessage ??
                failedHandler?.error.message ??
                lifecycleError?.error.message ??
                `Tool "${request.params.name}" failed`;
              const timedOut = timeoutState?.signal.aborted === true && !execution.aborted;
              const externallyCancelled = options?.signal?.aborted === true;
              return createToolCallError(executionMessage, {
                code: timedOut
                  ? TOOL_CALL_ERROR_CODES.TIMEOUT
                  : externallyCancelled
                  ? TOOL_CALL_ERROR_CODES.CANCELLED
                  : handlerMetadata.code ??
                    (execution.validation && !execution.validation.passed
                      ? TOOL_CALL_ERROR_CODES.VALIDATION_FAILED
                      : execution.aborted
                        ? TOOL_CALL_ERROR_CODES.EXECUTION_ABORTED
                        : TOOL_CALL_ERROR_CODES.EXECUTION_FAILED),
                retryable:
                  timedOut ||
                  externallyCancelled ||
                  handlerMetadata.retryable === true ||
                  (handlerMetadata.retryable === undefined && execution.aborted),
                details: timedOut
                  ? {
                      timeoutMs: timeoutState!.timeoutMs,
                      executionState: 'detached',
                    }
                  : handlerMetadata.details ??
                    (failedHandler
                      ? {
                          handlerId: failedHandler.handlerId,
                          message: failedHandler.error.message,
                        }
                      : undefined),
              });
            }
            const output =
              execution.result ??
              (execution.successResults.length === 0
                ? undefined
                : execution.successResults.length === 1
                  ? execution.successResults[0]
                  : execution.successResults);
            const outputValidation = tool.safeParseOutput?.(output);
            if (outputValidation && !outputValidation.success) {
              return createToolCallError(
                `Tool "${request.params.name}" returned an invalid result`,
                {
                  code: TOOL_CALL_ERROR_CODES.OUTPUT_VALIDATION_FAILED,
                  details: { issues: outputValidation.error.issues },
                }
              );
            }
            const normalizedOutput = outputValidation?.success
              ? outputValidation.data
              : output;
            return createToolCallSuccess(normalizedOutput);
          } catch (error) {
            const errorMetadata = getToolCallErrorMetadata(error);
            const timedOut = timeoutState !== undefined && (
              timeoutState.signal.aborted || isToolCallTimeoutError(error)
            );
            const externallyCancelled = options?.signal?.aborted === true;
            const providerAborted =
              !timedOut &&
              !externallyCancelled &&
              (signal.aborted || (error instanceof Error && error.name === 'AbortError'));
            return createToolCallError(
              timedOut
                ? `Tool call timed out after ${timeoutState!.timeoutMs}ms.`
                : error instanceof Error ? error.message : String(error),
              {
                code: timedOut
                  ? TOOL_CALL_ERROR_CODES.TIMEOUT
                  : externallyCancelled
                  ? TOOL_CALL_ERROR_CODES.CANCELLED
                  : providerAborted
                  ? TOOL_CALL_ERROR_CODES.EXECUTION_ABORTED
                  : errorMetadata.code ?? TOOL_CALL_ERROR_CODES.EXECUTION_FAILED,
                retryable:
                  timedOut ||
                  externallyCancelled ||
                  providerAborted ||
                  errorMetadata.retryable === true,
                ...(timedOut
                  ? {
                      details: {
                        timeoutMs: timeoutState!.timeoutMs,
                        executionState: 'detached',
                      },
                    }
                  : providerAborted
                  ? { details: { executionState: 'detached' } }
                  : errorMetadata.details === undefined
                  ? {}
                  : { details: errorMetadata.details }),
              }
            );
          }
        };
        const runLogicalOperation = async (
          operationSignal: AbortSignal
        ): Promise<ToolCallResult> => {
          const performExecutionWithBudget = async (): Promise<ToolCallResult> =>
            enforceToolOutputBudget(
              await performExecution(operationSignal),
              options?.maxOutputBytes,
              request.id,
            );
          if (!durableOperationStore || !operationKey || !fingerprint) {
            return performExecutionWithBudget();
          }
          let operationAborted = operationSignal.aborted;
          let resolveOperationAbort: (() => void) | undefined;
          let beginOwnedAbort: (() => void) | undefined;
          const operationAbortPromise = operationAborted
            ? Promise.resolve()
            : new Promise<void>(resolve => {
                resolveOperationAbort = resolve;
              });
          const onOperationAbort = (): void => {
            operationAborted = true;
            resolveOperationAbort?.();
            beginOwnedAbort?.();
          };
          if (!operationAborted) {
            operationSignal.addEventListener('abort', onOperationAbort, { once: true });
          }
          const cleanupOperationAbort = (): void => {
            operationSignal.removeEventListener('abort', onOperationAbort);
          };
          const abortResultForSignal = (): ToolCallResult => {
            if (timeoutState?.signal.aborted) return timeoutResult();
            if (options?.signal?.aborted) {
              const message = abortError(options.signal).message;
              return createToolCallError(message.trim() ? message : 'Tool call cancelled.', {
                code: TOOL_CALL_ERROR_CODES.CANCELLED,
                retryable: true,
                toolCallId: request.id,
              });
            }
            const message = abortError(operationSignal).message;
            return createToolCallError(
              message.trim() ? message : 'Tool execution was aborted.',
              {
                code: TOOL_CALL_ERROR_CODES.EXECUTION_ABORTED,
                retryable: true,
                toolCallId: request.id,
                details: { executionState: 'detached' },
              }
            );
          };
          const boundDetachedAbortTransition = (
            transition: Promise<DurablePersistenceOutcome>
          ): Promise<DurablePersistenceOutcome> => {
            const waitMs = Math.max(
              1,
              Math.min(
                durableOperationLeaseMs,
                MAX_DURABLE_ABORT_PERSISTENCE_WAIT_MS
              )
            );
            return new Promise(resolve => {
              let settled = false;
              const finish = (outcome: DurablePersistenceOutcome): void => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                resolve(outcome);
              };
              const timer = setTimeout(() => {
                finish({
                  persisted: false,
                  error: new Error(
                    `Detached durable abort persistence did not settle within ${waitMs}ms.`
                  ),
                });
              }, waitMs);
              void transition.then(finish);
            });
          };
          const claimPromise = Promise.resolve().then(() =>
            durableOperationStore.claim(
              operationKey,
              fingerprint,
              durableOwnerId,
              { leaseMs: durableOperationLeaseMs }
            )
          );
          const claimRace = await Promise.race([
            claimPromise.then(
              claim => ({ kind: 'claim' as const, claim }),
              error => ({ kind: 'error' as const, error })
            ),
            operationAbortPromise.then(() => ({ kind: 'abort' as const })),
          ]);
          if (claimRace.kind === 'abort') {
            cleanupOperationAbort();
            idempotencyRegistryRef.current?.clear(operationKey);
            const abortResult = abortResultForSignal();
            void claimPromise.then(
              lateClaim => {
                if (lateClaim.status !== 'owner') return;
                const transition = transitionOutcome(() => {
                  const storedAbortResult = storedResultForDurability(abortResult);
                  const durableDiagnostic = sanitizeToolCallDiagnostic(
                    storedAbortResult,
                    durableDiagnosticPolicy
                  );
                  return durableOperationStore.markUnknown(
                    operationKey,
                    durableOwnerId,
                    sanitizeToolCallDiagnosticReason(abortResult),
                    durableDiagnostic,
                    lateClaim.fence
                  );
                });
                void boundDetachedAbortTransition(transition).then(outcome => {
                  if (!outcome.persisted && debug) {
                    console.warn(
                      `[${contextName}] Detached durable abort transition failed`,
                      outcome.error
                    );
                  }
                });
              },
              error => {
                if (debug) {
                  console.warn(`[${contextName}] Detached durable claim failed`, error);
                }
              }
            );
            return abortResult;
          }
          if (claimRace.kind === 'error') {
            cleanupOperationAbort();
            idempotencyRegistryRef.current?.clear(operationKey);
            return storeFailureResult(claimRace.error);
          }
          const durableClaim: DurableOperationClaim<ToolCallResult> = claimRace.claim;
          if (durableClaim.status === 'conflict') {
            cleanupOperationAbort();
            return createToolCallError(
              `Idempotency key was already used for a different "${request.params.name}" operation.`,
              {
                code: TOOL_CALL_ERROR_CODES.IDEMPOTENCY_CONFLICT,
                retryable: false,
              }
            );
          }
          if (durableClaim.status === 'pending') {
            cleanupOperationAbort();
            idempotencyRegistryRef.current?.clear(operationKey);
            return createToolCallError(
              `Operation "${request.params.name}" is already running in another owner.`,
              {
                code: TOOL_CALL_ERROR_CODES.IDEMPOTENCY_PENDING,
                retryable: true,
                details: {
                  state: durableClaim.record.state,
                  ownerId: durableClaim.record.ownerId,
                  leaseExpiresAt: durableClaim.record.leaseExpiresAt,
                },
              }
            );
          }
          if (durableClaim.status === 'unknown') {
            cleanupOperationAbort();
            idempotencyRegistryRef.current?.clear(operationKey);
            return createToolCallError(
              `Operation "${request.params.name}" has an unknown outcome and requires reconciliation.`,
              {
                code: TOOL_CALL_ERROR_CODES.IDEMPOTENCY_UNKNOWN,
                retryable: false,
                details: {
                  state: durableClaim.record.state,
                  reason: durableClaim.record.reason,
                  automaticRetrySafe: false,
                },
              }
            );
          }
          if (durableClaim.status === 'replay') {
            cleanupOperationAbort();
            if (durableClaim.record.result === undefined) {
              idempotencyRegistryRef.current?.clear(operationKey);
              return unknownOperationResult();
            }
            return durableClaim.record.result;
          }
          let terminalTransition: Promise<DurablePersistenceOutcome> | undefined;
          let terminalResult: ToolCallResult | undefined;
          let terminalWritesUnknown = false;
          const createAbortSettlement = (
            abortTransition: Promise<DurablePersistenceOutcome>,
            competingTerminal: Promise<DurablePersistenceOutcome> | undefined,
            competingTerminalWritesUnknown: boolean
          ): Promise<DurableAbortSettlement> => {
            const waitMs = Math.max(
              1,
              Math.min(
                durableOperationLeaseMs,
                MAX_DURABLE_ABORT_PERSISTENCE_WAIT_MS
              )
            );
            return new Promise(resolve => {
              let settled = false;
              let abortOutcome: DurablePersistenceOutcome | undefined;
              let terminalOutcome: DurablePersistenceOutcome | undefined;
              const finish = (outcome: DurableAbortSettlement): void => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                cleanupOperationAbort();
                resolve(outcome);
              };
              const evaluate = (): void => {
                if (abortOutcome?.persisted) {
                  finish({ safe: true, winner: 'unknown' });
                  return;
                }
                if (terminalOutcome?.persisted) {
                  finish({
                    safe: true,
                    winner: competingTerminalWritesUnknown
                      ? 'unknown'
                      : 'known-terminal',
                  });
                  return;
                }
                if (
                  abortOutcome &&
                  !abortOutcome.persisted &&
                  (
                    competingTerminal === undefined ||
                    (terminalOutcome !== undefined && !terminalOutcome.persisted)
                  )
                ) {
                  finish({ safe: false, error: abortOutcome.error });
                }
              };
              const timer = setTimeout(() => {
                finish({
                  safe: false,
                  error: new Error(
                    `Durable abort persistence did not settle within ${waitMs}ms.`
                  ),
                });
              }, waitMs);
              void abortTransition.then(outcome => {
                abortOutcome = outcome;
                evaluate();
              });
              void competingTerminal?.then(outcome => {
                terminalOutcome = outcome;
                evaluate();
              });
            });
          };
          const beginAbortTransition = (): void => {
            if (durableAbortTransition) return;
            idempotencyRegistryRef.current?.clear(operationKey);
            const rawAbortTransition = transitionOutcome(() => {
              const result = abortResultForSignal();
              const storedResult = storedResultForDurability(result);
              const durableDiagnostic = sanitizeToolCallDiagnostic(
                storedResult,
                durableDiagnosticPolicy
              );
              return durableOperationStore.markUnknown(
                operationKey,
                durableOwnerId,
                sanitizeToolCallDiagnosticReason(result),
                durableDiagnostic,
                durableClaim.fence
              );
            });
            durableAbortTransition = createAbortSettlement(
              rawAbortTransition,
              terminalTransition,
              terminalWritesUnknown
            );
            void durableAbortTransition.then(outcome => {
              if (!outcome.safe && debug) {
                console.warn(
                  `[${contextName}] Durable abort transition failed`,
                  outcome.error
                );
              }
            });
          };
          beginOwnedAbort = beginAbortTransition;
          if (operationAborted) beginAbortTransition();
          const settleAbortedOperation = async (): Promise<ToolCallResult> => {
            beginAbortTransition();
            const settlement = await durableAbortTransition!;
            if (!settlement.safe) {
              return storeFailureResult(settlement.error, true);
            }
            if (settlement.winner === 'known-terminal' && terminalResult) {
              return terminalResult;
            }
            return unknownOperationResult();
          };
          if (operationAborted) return settleAbortedOperation();
          const execution = performExecutionWithBudget();
          const executionRace = await Promise.race([
            execution.then(result => ({ kind: 'result' as const, result })),
            operationAbortPromise.then(() => ({ kind: 'abort' as const })),
          ]);
          if (executionRace.kind === 'abort') return settleAbortedOperation();
          terminalResult = executionRace.result;
          if (operationAborted) return settleAbortedOperation();
          const code = terminalResult.error?.code;
          const ambiguous =
            code === TOOL_CALL_ERROR_CODES.TIMEOUT ||
            code === TOOL_CALL_ERROR_CODES.CANCELLED ||
            code === TOOL_CALL_ERROR_CODES.EXECUTION_ABORTED ||
            code === TOOL_CALL_ERROR_CODES.EXECUTION_UNKNOWN;
          terminalWritesUnknown = ambiguous;
          const storedResult = storedResultForDurability(terminalResult);
          const durableDiagnostic = terminalResult.isError
            ? sanitizeToolCallDiagnostic(storedResult, durableDiagnosticPolicy)
            : storedResult;
          terminalTransition = transitionOutcome(() => {
            if (ambiguous) {
              return durableOperationStore.markUnknown(
                operationKey,
                durableOwnerId,
                sanitizeToolCallDiagnosticReason(terminalResult!),
                durableDiagnostic,
                durableClaim.fence
              );
            }
            if (terminalResult!.isError) {
              return durableOperationStore.fail(
                operationKey,
                durableOwnerId,
                sanitizeToolCallDiagnosticReason(terminalResult!),
                durableDiagnostic,
                durableClaim.fence
              );
            }
            return durableOperationStore.complete(
              operationKey,
              durableOwnerId,
              storedResult,
              durableClaim.fence
            );
          });
          const terminalRace = await Promise.race([
            terminalTransition.then(outcome => ({
              kind: 'terminal' as const,
              outcome,
            })),
            operationAbortPromise.then(() => ({ kind: 'abort' as const })),
          ]);
          if (terminalRace.kind === 'abort') return settleAbortedOperation();
          if (terminalRace.outcome.persisted) {
            cleanupOperationAbort();
            if (ambiguous) idempotencyRegistryRef.current?.clear(operationKey);
            return terminalResult;
          }
          if (durableAbortTransition) return settleAbortedOperation();
          cleanupOperationAbort();
          idempotencyRegistryRef.current?.clear(operationKey);
          if (debug) {
            console.warn(
              `[${contextName}] Durable operation transition failed`,
              terminalRace.outcome.error
            );
          }
          return storeFailureResult(terminalRace.outcome.error, true);
        };
        const runProviderScopedOperation = (): Promise<ToolCallResult> =>
          dispatchLifecycle.run(
            [options?.signal, timeoutState?.signal],
            runLogicalOperation
          );
        try {
          const idempotencyClaim = operationKey === undefined
            ? undefined
            : idempotencyRegistryRef.current!.claim(
                operationKey,
                fingerprint!,
                runProviderScopedOperation
              );
          if (idempotencyClaim?.status === 'conflict') {
            return finish(createToolCallError(
              `Idempotency key was already used for a different "${request.params.name}" operation.`,
              {
                code: TOOL_CALL_ERROR_CODES.IDEMPOTENCY_CONFLICT,
                retryable: false,
                toolCallId: request.id,
              }
            ));
          }
          const result = await awaitWithAbort(
            idempotencyClaim?.promise ?? runProviderScopedOperation(),
            callSignal
          );
          return finish(withToolCallId(result, request.id));
        } catch (error) {
          const errorMetadata = getToolCallErrorMetadata(error);
          const timedOut = timeoutState !== undefined && (
            timeoutState.signal.aborted || isToolCallTimeoutError(error)
          );
          const externallyCancelled = options?.signal?.aborted === true;
          const providerAborted =
            !timedOut &&
            !externallyCancelled &&
            error instanceof Error &&
            error.name === 'AbortError';
          if (
            (timedOut || externallyCancelled || providerAborted) &&
            durableAbortTransition
          ) {
            const settlement = await durableAbortTransition;
            if (!settlement.safe) {
              return finish(storeFailureResult(settlement.error, true));
            }
          }
          return finish(createToolCallError(
            timedOut
              ? `Tool call timed out after ${timeoutState!.timeoutMs}ms.`
              : error instanceof Error ? error.message : String(error),
            {
              code: timedOut
                ? TOOL_CALL_ERROR_CODES.TIMEOUT
                : externallyCancelled
                ? TOOL_CALL_ERROR_CODES.CANCELLED
                : providerAborted
                ? TOOL_CALL_ERROR_CODES.EXECUTION_ABORTED
                : errorMetadata.code ?? TOOL_CALL_ERROR_CODES.EXECUTION_FAILED,
              retryable:
                timedOut ||
                externallyCancelled ||
                providerAborted ||
                errorMetadata.retryable === true,
              ...(timedOut
                ? {
                    details: {
                      timeoutMs: timeoutState!.timeoutMs,
                      executionState: 'detached',
                    },
                  }
                : providerAborted
                ? { details: { executionState: 'detached' } }
                : errorMetadata.details === undefined
                ? {}
                : { details: errorMetadata.details }),
              toolCallId: request.id,
            }
          ));
        }
      };
    }, [
      dispatchLifecycle,
      durableOwnerId,
    ]);
    const getOperationStatus = useMemo<ToolOperationStatusReader>(
      () => async (toolName, idempotencyKey, context) => {
        if (!durableOperationStore) return undefined;
        const key = createToolOperationKey(
          toolName,
          idempotencyKey,
          context?.sessionId
        );
        return durableOperationStore.get(key);
      },
      []
    );
    const reconcileOperation = useMemo<ToolOperationReconciler>(
      () => async (toolName, idempotencyKey, resolution, context, expectedFence) => {
        if (!durableOperationStore) return undefined;
        const key = createToolOperationKey(
          toolName,
          idempotencyKey,
          context?.sessionId
        );
        return durableOperationStore.resolveUnknown(
          key,
          durableOwnerId,
          resolution,
          expectedFence
        );
      },
      [durableOwnerId]
    );
    const registry = useMemo(
      () => createToolRegistry(
        schema,
        executeToolCall,
        allowedToolNames,
        toolListPageSize,
        getOperationStatus,
        reconcileOperation
      ),
      [executeToolCall, getOperationStatus, reconcileOperation]
    );
    const contextValue = useMemo(
      () => ({
        actionRegisterRef,
        registry,
        dispatch,
        dispatchLifecycle,
      }),
      [dispatch, dispatchLifecycle, registry]
    );
    return (
      <ToolReactContext.Provider value={contextValue}>{children}</ToolReactContext.Provider>
    );
  };
  const useToolContext = (): ToolContextType<TSchema> => {
    const context = useContext(ToolReactContext);
    if (!context) {
      throw new Error(
        `useToolContext must be used within a ${contextName} ToolContext Provider`
      );
    }
    return context;
  };
  const useToolDispatch = () => {
    const { dispatch: contextDispatch } = useToolContext();
    return contextDispatch;
  };
  const useToolCall = (): ToolCallFunction<TInputMap, InferActionResultMap<TSchema>> => {
    const { registry } = useToolContext();
    const hookId = useId();
    const sequenceRef = useRef(0);
    return useMemo(() => (
      <K extends Extract<keyof TInputMap, string>>(
        toolName: K,
        payload: TInputMap[K],
        options?: DirectToolCallOptions
      ): Promise<ToolCallResult<
        K extends keyof InferActionResultMap<TSchema>
          ? InferActionResultMap<TSchema>[K]
          : unknown
      >> => {
        const { toolCallId, context, ...callOptions } = options ?? {};
        const name = String(toolName);
        const id = toolCallId ?? `${contextName}:direct:${hookId}:${++sequenceRef.current}`;
        const params = payload === undefined
          ? { name }
          : { name, arguments: payload as Record<string, unknown> };
        type TResult = K extends keyof InferActionResultMap<TSchema>
          ? InferActionResultMap<TSchema>[K]
          : unknown;
        return registry.callTool(
          { id, method: 'tools/call', params },
          {
            ...callOptions,
            context: {
              ...context,
              source: context?.source ?? 'local',
              mode: context?.mode ?? 'direct',
            },
          }
        ) as Promise<ToolCallResult<TResult>>;
      }
    ), [hookId, registry]);
  };
  const useRegisteredToolHandler = <K extends Extract<keyof TSchema, string>, R = void>(
    toolName: K,
    handler: ActionHandler<TPayloadMap[K], R>,
    handlerConfig: HandlerConfig<TPayloadMap[K]> | undefined,
    registrationRole: 'legacy' | 'result',
  ): void => {
    const { actionRegisterRef, dispatchLifecycle } = useToolContext();
    const handlerId = useId();
    const effectGenerationRef = useRef(0);
    const registrationRef = useRef<{
      register: ActionRegister<TPayloadMap>;
      toolName: keyof TPayloadMap;
      config: HandlerConfig<TPayloadMap[K]>;
      active: boolean;
      unregister: () => void;
    } | null>(null);
    const handlerRef = useRef(handler);
    useInsertionEffect(() => {
      handlerRef.current = handler;
    }, [handler]);
    const priority = handlerConfig?.priority ?? 0;
    const id = handlerConfig?.id || `tool_${String(toolName)}_${handlerId}`;
    const blocking = handlerConfig?.blocking;
    const scheduling = handlerConfig?.scheduling;
    const errorPolicy = handlerConfig?.errorPolicy;
    const once = handlerConfig?.once ?? false;
    const debounce = handlerConfig?.debounce;
    const throttle = handlerConfig?.throttle;
    const cleanup = handlerConfig?.cleanup;
    const condition = handlerConfig?.condition;
    const stableHandlerConfig = useMemo((): HandlerConfig<TPayloadMap[K]> => ({
      priority,
      id,
      ...(blocking !== undefined && { blocking }),
      ...(scheduling !== undefined && { scheduling }),
      ...(errorPolicy !== undefined && { errorPolicy }),
      once,
      replaceExisting: true,
      ...(cleanup !== undefined && {
        cleanup: () => dispatchLifecycle.scheduleHandlerCleanup(cleanup),
      }),
      ...(condition !== undefined && { condition }),
      ...(debounce !== undefined && { debounce }),
      ...(throttle !== undefined && { throttle }),
    }), [
      priority,
      id,
      blocking,
      scheduling,
      errorPolicy,
      once,
      cleanup,
      condition,
      debounce,
      throttle,
      dispatchLifecycle,
    ]);
    useInsertionEffect(() => {
      const register = actionRegisterRef.current;
      if (!register) return;
      const generation = ++effectGenerationRef.current;
      const normalizedToolName = toolName as K;
      let lease = registrationRef.current;
      if (lease && (
        lease.register !== register ||
        lease.toolName !== normalizedToolName ||
        lease.config !== stableHandlerConfig
      )) {
        lease.active = false;
        lease.unregister();
        registrationRef.current = null;
        lease = null;
      }
      if (!lease) {
        const nextLease = {
          register,
          toolName: normalizedToolName,
          config: stableHandlerConfig,
          active: true,
          unregister: () => {},
        };
        if (debug) {
          console.log(`[${contextName}] Registering handler for tool '${String(toolName)}'`);
        }
        const wrapperHandler: ActionHandler<TPayloadMap[K], R> = (payload, controller) => {
          if (!nextLease.active) return;
          return handlerRef.current(payload, controller);
        };
        nextLease.unregister = registrationRole === 'result'
          ? (register as unknown as {
              registerResult: (
                action: K,
                handler: ActionResultHandler<TPayloadMap[K], unknown>,
                config?: HandlerConfig<TPayloadMap[K]>,
              ) => () => void;
            }).registerResult(
              normalizedToolName,
              wrapperHandler as ActionResultHandler<TPayloadMap[K], unknown>,
              stableHandlerConfig,
            )
          : register.register(
              normalizedToolName,
              wrapperHandler as ActionHandler<TPayloadMap[K], unknown>,
              stableHandlerConfig,
            );
        registrationRef.current = nextLease;
        lease = nextLease;
      } else {
        lease.active = true;
      }
      const currentLease = lease;
      return () => {
        currentLease.active = false;
        queueMicrotask(() => {
          if (effectGenerationRef.current !== generation) return;
          dispatchLifecycle.scheduleHandlerCleanup(() => {
            if (registrationRef.current === currentLease) {
              registrationRef.current = null;
            }
            currentLease.unregister();
          });
        });
      };
    }, [toolName, actionRegisterRef, dispatchLifecycle, stableHandlerConfig, registrationRole]);
  };
  const useToolHandler = <K extends Extract<keyof TSchema, string>, R = void>(
    toolName: K,
    handler: ActionHandler<TPayloadMap[K], R>,
    handlerConfig?: HandlerConfig<TPayloadMap[K]>
  ): void => useRegisteredToolHandler(toolName, handler, handlerConfig, 'legacy');
  const useToolResultHandler = <K extends Extract<keyof TSchema, string>>(
    toolName: K,
    handler: ActionResultHandler<TPayloadMap[K], InferActionResultMap<TSchema>[K]>,
    handlerConfig?: HandlerConfig<TPayloadMap[K]>
  ): void => useRegisteredToolHandler(
    toolName,
    handler as unknown as ActionHandler<TPayloadMap[K], InferActionResultMap<TSchema>[K]>,
    handlerConfig,
    'result',
  );
  const useToolRegistry = (): ToolRegistry<TSchema> => {
    const { registry: contextRegistry } = useToolContext();
    return contextRegistry;
  };
  const useToolDispatchWithResult = () => {
    const { actionRegisterRef, dispatchLifecycle } = useToolContext();
    const activeControllersRef = useRef<Set<AbortController>>(new Set());
    const cleanupGenerationRef = useRef(0);
    useEffect(() => {
      const generation = ++cleanupGenerationRef.current;
      const activeControllers = activeControllersRef.current;
      return () => {
        queueMicrotask(() => {
          if (cleanupGenerationRef.current !== generation) return;
          activeControllers.forEach((controller) => {
            if (!controller.signal.aborted) controller.abort();
          });
          activeControllers.clear();
        });
      };
    }, []);
    const dispatch = useMemo(() => {
      return <K extends Extract<keyof TPayloadMap, string>>(
        toolName: K,
        payload: TPayloadMap[K],
        options?: DispatchOptions
      ): Promise<void> => {
        const register = actionRegisterRef.current;
        if (!register) {
          throw new Error(`ActionRegister not initialized in ${contextName}`);
        }
        const scopeController = new AbortController();
        activeControllersRef.current.add(scopeController);
        const trackedPromise = dispatchLifecycle.run(
          [options?.signal, scopeController.signal],
          signal => register.dispatch(
            toolName as Extract<keyof TPayloadMap, string>,
            ...([payload, withProviderDispatchSignal(options, signal)] as DispatchArgs<TPayloadMap[K]>)
          )
        ).finally(() => {
          activeControllersRef.current.delete(scopeController);
        });
        void trackedPromise.catch(() => {});
        return trackedPromise;
      };
    }, [actionRegisterRef, dispatchLifecycle]);
    const dispatchWithResult = useMemo(() => {
      return <K extends Extract<keyof TPayloadMap, string>, R = void>(
        toolName: K,
        ...args: DispatchArgs<TPayloadMap[K]>
      ): Promise<ToolExecutionResult<R>> => {
        const [payload, options] = args as [TPayloadMap[K] | undefined, DispatchOptions | undefined];
        const register = actionRegisterRef.current;
        if (!register) {
          throw new Error(`ActionRegister not initialized in ${contextName}`);
        }
        const scopeController = new AbortController();
        activeControllersRef.current.add(scopeController);
        const trackedPromise = dispatchLifecycle
          .run(
            [options?.signal, scopeController.signal],
            signal => register.dispatchWithResult<Extract<K, string>, R>(
              toolName as Extract<K, string>,
              ...([payload, withProviderDispatchSignal(options, signal)] as DispatchArgs<TPayloadMap[K]>)
            )
          )
          .then((result) => {
            const validationPassed = result.validation?.passed ?? true;
            return {
              ...result,
              validationPassed,
              ...(!validationPassed && result.validation
                ? { validationErrors: result.validation.errors }
                : {}),
            };
          })
          .finally(() => {
            activeControllersRef.current.delete(scopeController);
          });
        void trackedPromise.catch(() => {});
        return trackedPromise;
      };
    }, [actionRegisterRef, dispatchLifecycle]);
    const abortAll = useMemo(() => {
      return () => {
        activeControllersRef.current.forEach((controller) => {
          if (!controller.signal.aborted) {
            controller.abort();
          }
        });
        activeControllersRef.current.clear();
      };
    }, []);
    return { dispatch, dispatchWithResult, abortAll };
  };
  const useActionRegister = (): ActionRegister<TPayloadMap> | null => {
    const { actionRegisterRef } = useToolContext();
    return actionRegisterRef.current;
  };
  return {
    Provider,
    useToolDispatch,
    useToolCall,
    useToolHandler,
    useToolResultHandler,
    useToolRegistry,
    useToolDispatchWithResult,
    useActionRegister,
    context: ToolReactContext,
  };
}
```

### tools/useWebMCPToolScope.ts

```typescript
import {
  createWebMCPToolScope,
  type WebMCPToolScope,
  type WebMCPDocument,
  type WebMCPToolScopeOptions,
} from '@context-action/webmcp';
import type { ToolManagementInterface } from '@context-action/tool-protocol';
import { useEffect, useRef, useState } from 'react';
export interface WebMCPToolScopeState {
  readonly supported: boolean;
  readonly activeTools: readonly string[];
  readonly error?: Error;
}
const INITIAL_SCOPE_STATE: WebMCPToolScopeState = {
  supported: false,
  activeTools: [],
};
function mergeSignals(
  external: AbortSignal | undefined,
  lifecycle: AbortSignal,
): { signal: AbortSignal; dispose: () => void } {
  if (!external) return { signal: lifecycle, dispose: () => {} };
  if (typeof AbortSignal.any === 'function') {
    return { signal: AbortSignal.any([external, lifecycle]), dispose: () => {} };
  }
  const controller = new AbortController();
  const abort = (signal: AbortSignal) => () => controller.abort(signal.reason);
  const abortExternal = abort(external);
  const abortLifecycle = abort(lifecycle);
  if (external.aborted) abortExternal();
  else external.addEventListener('abort', abortExternal, { once: true });
  if (lifecycle.aborted) abortLifecycle();
  else lifecycle.addEventListener('abort', abortLifecycle, { once: true });
  return {
    signal: controller.signal,
    dispose: () => {
      external.removeEventListener('abort', abortExternal);
      lifecycle.removeEventListener('abort', abortLifecycle);
    },
  };
}
export function useWebMCPToolScope<TDocument = WebMCPDocument>(
  manager: ToolManagementInterface | null | undefined,
  options: WebMCPToolScopeOptions<TDocument>,
): WebMCPToolScopeState {
  const [state, setState] = useState<WebMCPToolScopeState>(INITIAL_SCOPE_STATE);
  const toolNamesKey = options.toolNames.join('\u0000');
  const exposedToKey = (options.exposedTo ?? []).join('\u0000');
  const executionOptionsRef = useRef({
    context: options.context,
    callOptions: options.callOptions,
    getIdempotencyKey: options.getIdempotencyKey,
    afterExecute: options.afterExecute,
    onObserverError: options.onObserverError,
    interaction: options.interaction,
    errorMode: options.errorMode,
    getExecutionOptions: options.getExecutionOptions,
  });
  executionOptionsRef.current = {
    context: options.context,
    callOptions: options.callOptions,
    getIdempotencyKey: options.getIdempotencyKey,
    afterExecute: options.afterExecute,
    onObserverError: options.onObserverError,
    interaction: options.interaction,
    errorMode: options.errorMode,
    getExecutionOptions: options.getExecutionOptions,
  };
  useEffect(() => {
    if (!manager) {
      setState(INITIAL_SCOPE_STATE);
      return;
    }
    const lifecycleController = new AbortController();
    const mergedSignal = mergeSignals(options.signal, lifecycleController.signal);
    const scopeOptions: WebMCPToolScopeOptions<TDocument> = {
      sessionId: options.sessionId,
      toolNames: options.toolNames,
      document: options.document,
      profile: options.profile,
      exposedTo: options.exposedTo,
      signal: mergedSignal.signal,
      getExecutionOptions: invocation => {
        const { getExecutionOptions, ...current } = executionOptionsRef.current;
        return {
          ...current,
          ...getExecutionOptions?.(invocation),
        };
      },
    };
    let disposed = false;
    let scope: WebMCPToolScope | undefined;
    void createWebMCPToolScope(manager, scopeOptions).then((nextScope) => {
      if (disposed) {
        nextScope.dispose();
        return;
      }
      scope = nextScope;
      setState({
        supported: nextScope.supported,
        activeTools: nextScope.activeTools,
      });
    }, (error: unknown) => {
      if (!disposed) {
        setState({
          supported: false,
          activeTools: [],
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    });
    return () => {
      disposed = true;
      lifecycleController.abort(new Error('WebMCP scope disposed'));
      mergedSignal.dispose();
      scope?.dispose();
    };
  }, [
    manager,
    options.sessionId,
    options.document,
    options.profile,
    options.signal,
    toolNamesKey,
    exposedToKey,
  ]);
  return state;
}
```

### utils.ts

```typescript
export {
  deepClone,
  safeGet,
  safeSet,
  MutativeUtils,
  produce
} from '@context-action/mutative';
export { 
  compareValues,
  setGlobalComparisonOptions,
  getGlobalComparisonOptions
} from './stores/utils/comparison';
export type {
  ComparisonOptions,
  ComparisonStrategy,
  CustomComparator
} from './stores/utils/comparison';
export type {
  StoreValue,
  StoresValues,
  StoreRecordValues,
  StoreSelector,
  EqualityFunction,
  StoreListener,
  StoreUpdater,
  DeepReadonly,
  StoreInitConfig,
  PartialBy,
  RequiredBy
} from './stores/utils/type-helpers';
export {
  composeProviders
} from './stores/utils/provider-composition';
export type {
  ProviderComponent
} from './stores/utils/provider-composition';
```

### webmcp.ts

```typescript
export { useWebMCPToolScope } from './tools/useWebMCPToolScope';
export type { WebMCPToolScopeState } from './tools/useWebMCPToolScope';
```
