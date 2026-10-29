[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / StorePathPatch

# Interface: StorePathPatch

Defined in: [packages/react/src/stores/utils/patch-affects-path.ts:4](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/utils/patch-affects-path.ts#L4)

Observation-only patch shape. No draft engine or mutable patch arrays required.

## Properties

### op

> `readonly` **op**: `string`

Defined in: [packages/react/src/stores/utils/patch-affects-path.ts:5](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/utils/patch-affects-path.ts#L5)

***

### path

> `readonly` **path**: `string` \| readonly `unknown`[]

Defined in: [packages/react/src/stores/utils/patch-affects-path.ts:7](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/utils/patch-affects-path.ts#L7)

Array segments or an RFC 6901 JSON Pointer (empty string means root).

***

### from?

> `readonly` `optional` **from?**: `string` \| readonly `unknown`[]

Defined in: [packages/react/src/stores/utils/patch-affects-path.ts:8](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/utils/patch-affects-path.ts#L8)

***

### value?

> `readonly` `optional` **value?**: `unknown`

Defined in: [packages/react/src/stores/utils/patch-affects-path.ts:9](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/utils/patch-affects-path.ts#L9)
