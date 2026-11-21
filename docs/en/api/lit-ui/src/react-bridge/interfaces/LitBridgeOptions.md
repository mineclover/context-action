[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/lit-ui/src/react-bridge](../README.md) / LitBridgeOptions

# Interface: LitBridgeOptions\<Props, Element, Handle\>

Defined in: [packages/lit-ui/src/react-bridge.ts:16](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/react-bridge.ts#L16)

## Extends

- [`LitBridgeConfig`](LitBridgeConfig.md)\<`Props`, `Element`, `Handle`\>.`ElementBridgeContract`\<`Props`, `Element`, `Handle`\>

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

Defined in: [packages/core/dist/element-DPioFL7C.d.ts:7](https://github.com/mineclover/context-action/blob/main/packages/core/dist/element-DPioFL7C.d.ts#L7)

#### Inherited from

[`LitBridgeConfig`](LitBridgeConfig.md).[`properties`](LitBridgeConfig.md#properties)

***

### attributes?

> `optional` **attributes?**: `Partial`\<`Record`\<keyof `Props` & `string`, `string`\>\>

Defined in: [packages/core/dist/element-DPioFL7C.d.ts:8](https://github.com/mineclover/context-action/blob/main/packages/core/dist/element-DPioFL7C.d.ts#L8)

#### Inherited from

[`LitBridgeConfig`](LitBridgeConfig.md).[`attributes`](LitBridgeConfig.md#attributes)

***

### styles?

> `optional` **styles?**: `Partial`\<`Record`\<keyof `Props` & `string`, `string`\>\>

Defined in: [packages/core/dist/element-DPioFL7C.d.ts:9](https://github.com/mineclover/context-action/blob/main/packages/core/dist/element-DPioFL7C.d.ts#L9)

#### Inherited from

[`LitBridgeConfig`](LitBridgeConfig.md).[`styles`](LitBridgeConfig.md#styles)

***

### events?

> `optional` **events?**: `Record`\<`string`, `string`\>

Defined in: [packages/core/dist/element-DPioFL7C.d.ts:10](https://github.com/mineclover/context-action/blob/main/packages/core/dist/element-DPioFL7C.d.ts#L10)

#### Inherited from

[`LitBridgeConfig`](LitBridgeConfig.md).[`events`](LitBridgeConfig.md#events)

***

### createHandle?

> `optional` **createHandle?**: [`ImperativeHandleFactory`](../../type-aliases/ImperativeHandleFactory.md)\<`Element`, `Handle`\>

Defined in: [packages/core/dist/element-DPioFL7C.d.ts:13](https://github.com/mineclover/context-action/blob/main/packages/core/dist/element-DPioFL7C.d.ts#L13)

#### Inherited from

[`LitBridgeConfig`](LitBridgeConfig.md).[`createHandle`](LitBridgeConfig.md#createhandle)

***

### tagName

> **tagName**: `string`

Defined in: [packages/core/dist/element-DPioFL7C.d.ts:16](https://github.com/mineclover/context-action/blob/main/packages/core/dist/element-DPioFL7C.d.ts#L16)

#### Inherited from

`ElementBridgeContract.tagName`
