[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src/element](../README.md) / ElementBridgeConfig

# Interface: ElementBridgeConfig\<Props, Element, Handle\>

Defined in: [packages/core/src/element/contracts.ts:13](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/contracts.ts#L13)

Transport configuration only; semantic validation and commit authority belong to the component.

## Extends

- [`ElementBindingConfig`](ElementBindingConfig.md)&lt;`Props`&gt;

## Extended by

- [`ElementBridgeContract`](ElementBridgeContract.md)

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

[`ElementBindingConfig`](ElementBindingConfig.md).[`properties`](ElementBindingConfig.md#properties)

***

### attributes?

> `optional` **attributes?**: `Partial`\<`Record`\<keyof `Props` & `string`, `string`\>\>

Defined in: [packages/core/src/element/contracts.ts:8](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/contracts.ts#L8)

#### Inherited from

[`ElementBindingConfig`](ElementBindingConfig.md).[`attributes`](ElementBindingConfig.md#attributes)

***

### styles?

> `optional` **styles?**: `Partial`\<`Record`\<keyof `Props` & `string`, `string`\>\>

Defined in: [packages/core/src/element/contracts.ts:9](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/contracts.ts#L9)

#### Inherited from

[`ElementBindingConfig`](ElementBindingConfig.md).[`styles`](ElementBindingConfig.md#styles)

***

### events?

> `optional` **events?**: `Record`\<`string`, `string`\>

Defined in: [packages/core/src/element/contracts.ts:10](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/contracts.ts#L10)

#### Inherited from

[`ElementBindingConfig`](ElementBindingConfig.md).[`events`](ElementBindingConfig.md#events)

***

### createHandle?

> `optional` **createHandle?**: [`ImperativeHandleFactory`](../type-aliases/ImperativeHandleFactory.md)\<`Element`, `Handle`\>

Defined in: [packages/core/src/element/contracts.ts:15](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/contracts.ts#L15)
