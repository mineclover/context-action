[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / StateMutationOrigin

# Type Alias: StateMutationOrigin

> **StateMutationOrigin** = `"user"` \| `"system"` \| `"network"` \| `"undo"` \| `"redo"` \| `"reset"`

Defined in: [packages/react/src/stores/core/contracts.ts:8](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/contracts.ts#L8)

Stable data contracts for the store and timeline layers.

These interfaces intentionally separate observation, mutation, and history
control so a React hook does not need to depend on a concrete Store class.
