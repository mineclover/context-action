[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/xstate/src](../README.md) / StatechartSnapshotPort

# Interface: StatechartSnapshotPort\<TValue, TContext\>

Defined in: [packages/xstate/src/contracts.ts:10](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/contracts.ts#L10)

Structural snapshot contract exposed by XState v5, XState v6, and `@xstate/effect` actors.

## Type Parameters

### TValue

`TValue` = `unknown`

### TContext

`TContext` = `unknown`

## Methods

### can()?

> `optional` **can**(`event`): `boolean`

Defined in: [packages/xstate/src/contracts.ts:15](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/contracts.ts#L15)

#### Parameters

##### event

[`StatechartEventLike`](StatechartEventLike.md)

#### Returns

`boolean`

***

### matches()?

> `optional` **matches**(`stateValue`): `boolean`

Defined in: [packages/xstate/src/contracts.ts:16](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/contracts.ts#L16)

#### Parameters

##### stateValue

`unknown`

#### Returns

`boolean`

***

### hasTag()?

> `optional` **hasTag**(`tag`): `boolean`

Defined in: [packages/xstate/src/contracts.ts:17](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/contracts.ts#L17)

#### Parameters

##### tag

`string`

#### Returns

`boolean`

## Properties

### value

> `readonly` **value**: `TValue`

Defined in: [packages/xstate/src/contracts.ts:11](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/contracts.ts#L11)

***

### context

> `readonly` **context**: `TContext`

Defined in: [packages/xstate/src/contracts.ts:12](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/contracts.ts#L12)

***

### status?

> `readonly` `optional` **status?**: `"active"` \| `"done"` \| `"error"` \| `"stopped"`

Defined in: [packages/xstate/src/contracts.ts:13](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/contracts.ts#L13)

***

### error?

> `readonly` `optional` **error?**: `unknown`

Defined in: [packages/xstate/src/contracts.ts:14](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/contracts.ts#L14)
