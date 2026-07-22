[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolIdempotencyClaimStatus

# Type Alias: ToolIdempotencyClaimStatus

> **ToolIdempotencyClaimStatus** = `"owner"` \| `"replay"` \| `"conflict"`

Defined in: packages/tool-protocol/src/idempotency.ts:10

Small, framework-neutral idempotency primitives for managed tool calls.

The registry intentionally stores an in-flight/completed promise rather than
request arguments. It is a bounded in-memory guard for one process/provider
lifetime; durable exactly-once guarantees require an application-owned
persistent store at the mutation boundary.
