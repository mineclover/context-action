[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/mutative/src](../README.md) / MutativeStateBackendOptions

# Interface: MutativeStateBackendOptions

Defined in: [packages/mutative/src/backend.ts:22](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L22)

## Properties

### cloneOnSet?

> `readonly` `optional` **cloneOnSet?**: `boolean`

Defined in: [packages/mutative/src/backend.ts:24](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L24)

Clone incoming values before storing them. Defaults to true.

***

### readMode?

> `readonly` `optional` **readMode?**: [`MutativeReadMode`](../type-aliases/MutativeReadMode.md)

Defined in: [packages/mutative/src/backend.ts:26](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L26)

Clone values exposed through snapshots. Defaults to true.

***

### strict?

> `readonly` `optional` **strict?**: `boolean`

Defined in: [packages/mutative/src/backend.ts:28](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L28)

Forwarded to the Mutative draft engine.

***

### enableAutoFreeze?

> `readonly` `optional` **enableAutoFreeze?**: `boolean`

Defined in: [packages/mutative/src/backend.ts:30](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L30)

Enable automatic freezing in the Mutative draft engine.

***

### patchesOptions?

> `readonly` `optional` **patchesOptions?**: `object`

Defined in: [packages/mutative/src/backend.ts:32](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L32)

Patch path and array options.

#### pathAsArray?

> `optional` **pathAsArray?**: `boolean`

The default value is `true`. If it's `true`, the path will be an array, otherwise it is a string.

#### arrayLengthAssignment?

> `optional` **arrayLengthAssignment?**: `boolean`

The default value is `true`. If it's `true`, the array length will be included in the patches, otherwise no include array length.

***

### onListenerError?

> `readonly` `optional` **onListenerError?**: (`error`) => `void`

Defined in: [packages/mutative/src/backend.ts:34](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L34)

Observe listener failures without changing the mutation result.

#### Parameters

##### error

`unknown`

#### Returns

`void`
