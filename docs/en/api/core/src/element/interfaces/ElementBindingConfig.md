[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src/element](../README.md) / ElementBindingConfig

# Interface: ElementBindingConfig\<Props\>

Defined in: [packages/core/src/element/contracts.ts:6](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/contracts.ts#L6)

Transport configuration only; semantic validation and commit authority belong to the component.

## Extended by

- [`ElementBridgeConfig`](ElementBridgeConfig.md)

## Type Parameters

### Props

`Props` *extends* `object`

## Properties

### properties?

> `optional` **properties?**: readonly keyof `Props`[]

Defined in: [packages/core/src/element/contracts.ts:7](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/contracts.ts#L7)

***

### attributes?

> `optional` **attributes?**: `Partial`\<`Record`\<keyof `Props` & `string`, `string`\>\>

Defined in: [packages/core/src/element/contracts.ts:8](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/contracts.ts#L8)

***

### styles?

> `optional` **styles?**: `Partial`\<`Record`\<keyof `Props` & `string`, `string`\>\>

Defined in: [packages/core/src/element/contracts.ts:9](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/contracts.ts#L9)

***

### events?

> `optional` **events?**: `Record`\<`string`, `string`\>

Defined in: [packages/core/src/element/contracts.ts:10](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/contracts.ts#L10)
