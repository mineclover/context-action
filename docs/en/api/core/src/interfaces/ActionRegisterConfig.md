[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionRegisterConfig

# Interface: ActionRegisterConfig

Defined in: [packages/core/src/types.ts:219](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/core/src/types.ts#L219)

## Properties

### name?

> `optional` **name**: `string`

Defined in: [packages/core/src/types.ts:221](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/core/src/types.ts#L221)

Name identifier for this ActionRegister instance

***

### registry?

> `optional` **registry**: `object`

Defined in: [packages/core/src/types.ts:224](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/core/src/types.ts#L224)

Registry-specific configuration options

#### debug?

> `optional` **debug**: `boolean`

Debug mode for registry operations

#### autoCleanup?

> `optional` **autoCleanup**: `boolean`

Auto-cleanup configuration for one-time handlers

#### maxHandlers?

> `optional` **maxHandlers**: `number`

Maximum number of handlers per action

#### defaultExecutionMode?

> `optional` **defaultExecutionMode**: [`ExecutionMode`](../type-aliases/ExecutionMode.md)

Default execution mode for actions
