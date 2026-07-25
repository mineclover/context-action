[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / DurableOperationState

# Type Alias: DurableOperationState

> **DurableOperationState** = `"pending"` \| `"completed"` \| `"failed"` \| `"unknown"`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:9](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L9)

Framework-neutral durable operation contracts.

A durable store owns the record, not the handler Promise. This distinction
makes the contract usable across browser tabs, worker processes, and server
hosts where an in-memory Promise cannot be shared.
