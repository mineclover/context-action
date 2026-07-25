[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / TOOL\_EXECUTION\_PROVENANCE\_SCHEMA

# Variable: TOOL\_EXECUTION\_PROVENANCE\_SCHEMA

> `const` **TOOL\_EXECUTION\_PROVENANCE\_SCHEMA**: `"context-action-tool-execution-provenance.v1"`

Defined in: [packages/tool-protocol/src/execution-provenance.ts:8](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/execution-provenance.ts#L8)

Additive lifecycle evidence for a managed tool call.

This is an audit/trace record, not a durable operation state machine. The
durable operation store remains the source of truth for cross-process claim
and reconciliation; this record only describes what the caller observed.
