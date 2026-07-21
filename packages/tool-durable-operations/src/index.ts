/**
 * Durable operation records and external side-effect adapters.
 *
 * This package owns mutation safety after a tool call has crossed into an
 * external system. Provider-neutral schemas, discovery, and lifecycle event
 * contracts remain in @context-action/tool-protocol.
 */

export {
  createDurableOperationStore,
  isDurableOperationState,
} from './durable-operation.js';

export type {
  DurableOperationBackend,
  DurableOperationClaim,
  DurableOperationClaimOptions,
  DurableOperationClaimStatus,
  DurableOperationRecord,
  DurableOperationListOptions,
  DurableOperationListPage,
  DurableOperationResolution,
  DurableOperationState,
  DurableOperationStore,
  DurableOperationStoreOptions,
} from './durable-operation.js';

export { createDurableSideEffectRunner } from './side-effect.js';

export type {
  DurableSideEffectRunner,
  DurableSideEffectRunnerOptions,
  SideEffectExecutionContext,
  SideEffectOutcome,
  SideEffectRecordPayload,
  SideEffectRecoveryContext,
  SideEffectRecoveryOptions,
  SideEffectRecoveryResolution,
  SideEffectRecoveryResult,
  SideEffectRecoveryState,
  SideEffectResolver,
  SideEffectRunOptions,
  SideEffectRunResult,
  SideEffectRunState,
} from './side-effect.js';

export { runHttpSideEffect } from './http-side-effect.js';

export type {
  HttpSideEffectRequest,
  HttpSideEffectResponseHandler,
  HttpSideEffectRunOptions,
} from './http-side-effect.js';

export { runQueueSideEffect } from './queue-side-effect.js';

export type {
  QueueSideEffectAcknowledgementHandler,
  QueueSideEffectEnqueue,
  QueueSideEffectRunOptions,
} from './queue-side-effect.js';

export { createIndexedDbDurableOperationBackend } from './indexeddb-operation-backend.js';

export type {
  IndexedDbDurableOperationBackendOptions,
} from './indexeddb-operation-backend.js';

export {
  createIoredisDurableOperationClient,
  createNodeRedisDurableOperationClient,
  createRedisDurableOperationBackend,
  REDIS_DURABLE_OPERATION_CAS_SCRIPT,
} from './redis-operation-backend.js';

export type {
  DurableOperationRedisClient,
  DurableOperationRedisEvalOptions,
  DurableOperationRedisMaybePromise,
  IoredisDurableOperationClient,
  NodeRedisDurableOperationClient,
  RedisDurableOperationBackendOptions,
} from './redis-operation-backend.js';

export {
  createPostgresDurableOperationBackend,
  createPostgresDurableOperationSchemaSql,
  POSTGRES_DURABLE_OPERATION_SCHEMA_SQL,
} from './postgres-operation-backend.js';

export type {
  PostgresDurableOperationBackendOptions,
  PostgresDurableOperationClient,
  PostgresDurableOperationMaybePromise,
  PostgresDurableOperationQueryResult,
} from './postgres-operation-backend.js';
