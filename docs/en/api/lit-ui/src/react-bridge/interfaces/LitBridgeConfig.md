[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/lit-ui/src/react-bridge](../README.md) / LitBridgeConfig

# Interface: LitBridgeConfig\<Props, Element, Handle\>

Defined in: [packages/lit-ui/src/react-bridge.ts:8](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/react-bridge.ts#L8)

## Extends

- `ElementBridgeConfig`\<`Props`, `Element`, `Handle`\>

## Extended by

- [`LitBridgeOptions`](LitBridgeOptions.md)

## Type Parameters

### Props

`Props` *extends* `object`

### Element

`Element` *extends* `HTMLElement` = `any`

### Handle

`Handle` = `any`

## Properties

### properties?

> `optional` **properties?**: readonly keyof `Props`[]

Defined in: [packages/core/dist/element-DPioFL7C.d.ts:7](https://github.com/mineclover/context-action/blob/main/packages/core/dist/element-DPioFL7C.d.ts#L7)

#### Inherited from

`ElementBridgeConfig.properties`

***

### attributes?

> `optional` **attributes?**: `Partial`\<`Record`\<keyof `Props` & `string`, `string`\>\>

Defined in: [packages/core/dist/element-DPioFL7C.d.ts:8](https://github.com/mineclover/context-action/blob/main/packages/core/dist/element-DPioFL7C.d.ts#L8)

#### Inherited from

`ElementBridgeConfig.attributes`

***

### styles?

> `optional` **styles?**: `Partial`\<`Record`\<keyof `Props` & `string`, `string`\>\>

Defined in: [packages/core/dist/element-DPioFL7C.d.ts:9](https://github.com/mineclover/context-action/blob/main/packages/core/dist/element-DPioFL7C.d.ts#L9)

#### Inherited from

`ElementBridgeConfig.styles`

***

### events?

> `optional` **events?**: `Record`\<`string`, `string`\>

Defined in: [packages/core/dist/element-DPioFL7C.d.ts:10](https://github.com/mineclover/context-action/blob/main/packages/core/dist/element-DPioFL7C.d.ts#L10)

#### Inherited from

[`LitBridgeOptions`](LitBridgeOptions.md).[`events`](LitBridgeOptions.md#events)

***

### createHandle?

> `optional` **createHandle?**: [`ImperativeHandleFactory`](../../type-aliases/ImperativeHandleFactory.md)\<`Element`, `Handle`\>

Defined in: [packages/core/dist/element-DPioFL7C.d.ts:13](https://github.com/mineclover/context-action/blob/main/packages/core/dist/element-DPioFL7C.d.ts#L13)

#### Inherited from

`ElementBridgeConfig.createHandle`
