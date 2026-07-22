[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / packages/tool-durable-operations/src

# packages/tool-durable-operations/src

## Interfaces

- [DurableOperationRecord](interfaces/DurableOperationRecord.md)
- [DurableOperationClaim](interfaces/DurableOperationClaim.md)
- [DurableOperationClaimOptions](interfaces/DurableOperationClaimOptions.md)
- [DurableOperationListOptions](interfaces/DurableOperationListOptions.md)
- [DurableOperationListPage](interfaces/DurableOperationListPage.md)
- [DurableOperationBackend](interfaces/DurableOperationBackend.md)
- [DurableOperationStoreOptions](interfaces/DurableOperationStoreOptions.md)
- [DurableOperationStore](interfaces/DurableOperationStore.md)
- [HttpSideEffectRunOptions](interfaces/HttpSideEffectRunOptions.md)
- [IndexedDbDurableOperationBackendOptions](interfaces/IndexedDbDurableOperationBackendOptions.md)
- [PostgresDurableOperationClient](interfaces/PostgresDurableOperationClient.md)
- [PostgresDurableOperationQueryResult](interfaces/PostgresDurableOperationQueryResult.md)
- [PostgresDurableOperationBackendOptions](interfaces/PostgresDurableOperationBackendOptions.md)
- [QueueSideEffectRunOptions](interfaces/QueueSideEffectRunOptions.md)
- [DurableOperationRedisEvalOptions](interfaces/DurableOperationRedisEvalOptions.md)
- [DurableOperationRedisClient](interfaces/DurableOperationRedisClient.md)
- [NodeRedisDurableOperationClient](interfaces/NodeRedisDurableOperationClient.md)
- [IoredisDurableOperationClient](interfaces/IoredisDurableOperationClient.md)
- [RedisDurableOperationBackendOptions](interfaces/RedisDurableOperationBackendOptions.md)
- [SideEffectExecutionContext](interfaces/SideEffectExecutionContext.md)
- [SideEffectRecordPayload](interfaces/SideEffectRecordPayload.md)
- [SideEffectRunResult](interfaces/SideEffectRunResult.md)
- [SideEffectRecoveryContext](interfaces/SideEffectRecoveryContext.md)
- [SideEffectRecoveryResult](interfaces/SideEffectRecoveryResult.md)
- [DurableSideEffectRunnerOptions](interfaces/DurableSideEffectRunnerOptions.md)
- [SideEffectRunOptions](interfaces/SideEffectRunOptions.md)
- [SideEffectRecoveryOptions](interfaces/SideEffectRecoveryOptions.md)
- [DurableSideEffectRunner](interfaces/DurableSideEffectRunner.md)

## Type Aliases

- [DurableOperationState](type-aliases/DurableOperationState.md)
- [DurableOperationClaimStatus](type-aliases/DurableOperationClaimStatus.md)
- [DurableOperationResolution](type-aliases/DurableOperationResolution.md)
- [HttpSideEffectResponseHandler](type-aliases/HttpSideEffectResponseHandler.md)
- [HttpSideEffectRequest](type-aliases/HttpSideEffectRequest.md)
- [PostgresDurableOperationMaybePromise](type-aliases/PostgresDurableOperationMaybePromise.md)
- [QueueSideEffectEnqueue](type-aliases/QueueSideEffectEnqueue.md)
- [QueueSideEffectAcknowledgementHandler](type-aliases/QueueSideEffectAcknowledgementHandler.md)
- [DurableOperationRedisMaybePromise](type-aliases/DurableOperationRedisMaybePromise.md)
- [SideEffectOutcome](type-aliases/SideEffectOutcome.md)
- [SideEffectRunState](type-aliases/SideEffectRunState.md)
- [SideEffectRecoveryState](type-aliases/SideEffectRecoveryState.md)
- [SideEffectRecoveryResolution](type-aliases/SideEffectRecoveryResolution.md)
- [SideEffectResolver](type-aliases/SideEffectResolver.md)

## Functions

- [createDurableOperationStore](functions/createDurableOperationStore.md)
- [isDurableOperationState](functions/isDurableOperationState.md)
- [runHttpSideEffect](functions/runHttpSideEffect.md)
- [createIndexedDbDurableOperationBackend](functions/createIndexedDbDurableOperationBackend.md)
- [createPostgresDurableOperationSchemaSql](functions/createPostgresDurableOperationSchemaSql.md)
- [createPostgresDurableOperationBackend](functions/createPostgresDurableOperationBackend.md)
- [runQueueSideEffect](functions/runQueueSideEffect.md)
- [createNodeRedisDurableOperationClient](functions/createNodeRedisDurableOperationClient.md)
- [createIoredisDurableOperationClient](functions/createIoredisDurableOperationClient.md)
- [createRedisDurableOperationBackend](functions/createRedisDurableOperationBackend.md)
- [createDurableSideEffectRunner](functions/createDurableSideEffectRunner.md)

## Variables

- [POSTGRES\_DURABLE\_OPERATION\_SCHEMA\_SQL](variables/POSTGRES_DURABLE_OPERATION_SCHEMA_SQL.md)
- [REDIS\_DURABLE\_OPERATION\_CAS\_SCRIPT](variables/REDIS_DURABLE_OPERATION_CAS_SCRIPT.md)
