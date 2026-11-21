[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src/element](../README.md) / ElementBridgeContract

# Interface: ElementBridgeContract\<Props, Element, Handle\>

Defined in: [packages/core/src/element/contracts.ts:18](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/contracts.ts#L18)

Transport configuration only; semantic validation and commit authority belong to the component.

## Extends

- [`ElementBridgeConfig`](ElementBridgeConfig.md)\<`Props`, `Element`, `Handle`\>

## Type Parameters

### Props

`Props` *extends* `object`

### Element

`Element` *extends* `HTMLElement` = `HTMLElement`

### Handle

`Handle` = `Element`

## Properties

### properties?

> `optional` **properties?**: readonly keyof `Props`[]

Defined in: [packages/core/src/element/contracts.ts:7](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/contracts.ts#L7)

#### Inherited from

[`ElementBridgeConfig`](ElementBridgeConfig.md).[`properties`](ElementBridgeConfig.md#properties)

***

### attributes?

> `optional` **attributes?**: `Partial`\<`Record`\<keyof `Props` & `string`, `string`\>\>

Defined in: [packages/core/src/element/contracts.ts:8](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/contracts.ts#L8)

#### Inherited from

[`ElementBridgeConfig`](ElementBridgeConfig.md).[`attributes`](ElementBridgeConfig.md#attributes)

***

### styles?

> `optional` **styles?**: `Partial`\<`Record`\<keyof `Props` & `string`, `string`\>\>

Defined in: [packages/core/src/element/contracts.ts:9](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/contracts.ts#L9)

#### Inherited from

[`ElementBridgeConfig`](ElementBridgeConfig.md).[`styles`](ElementBridgeConfig.md#styles)

***

### events?

> `optional` **events?**: `Record`\<`string`, `string`\>

Defined in: [packages/core/src/element/contracts.ts:10](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/contracts.ts#L10)

#### Inherited from

[`ElementBridgeConfig`](ElementBridgeConfig.md).[`events`](ElementBridgeConfig.md#events)

***

### createHandle?

> `optional` **createHandle?**: [`ImperativeHandleFactory`](../type-aliases/ImperativeHandleFactory.md)\<`Element`, `Handle`\>

Defined in: [packages/core/src/element/contracts.ts:15](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/contracts.ts#L15)

#### Inherited from

[`ElementBridgeConfig`](ElementBridgeConfig.md).[`createHandle`](ElementBridgeConfig.md#createhandle)

***

### tagName

> **tagName**: `string`

Defined in: [packages/core/src/element/contracts.ts:20](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/contracts.ts#L20)
