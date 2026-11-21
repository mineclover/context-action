[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/preact-ui/src/react-bridge](../README.md) / CustomElementBridgeOptions

# Interface: CustomElementBridgeOptions\<Props, Element, Handle\>

Defined in: [packages/preact-ui/src/react-bridge.ts:8](https://github.com/mineclover/context-action/blob/main/packages/preact-ui/src/react-bridge.ts#L8)

## Extends

- `ElementBridgeContract`\<`Props`, `Element`, `Handle`\>

## Type Parameters

### Props

`Props` *extends* `Record`\<`string`, `any`\>

### Element

`Element` *extends* `HTMLElement` = `HTMLElement`

### Handle

`Handle` = `Element`

## Properties

### properties?

> `optional` **properties?**: readonly keyof `Props`[]

Defined in: [packages/core/dist/element-DPioFL7C.d.ts:7](https://github.com/mineclover/context-action/blob/main/packages/core/dist/element-DPioFL7C.d.ts#L7)

#### Inherited from

`ElementBridgeContract.properties`

***

### attributes?

> `optional` **attributes?**: `Partial`\<`Record`\<keyof `Props` & `string`, `string`\>\>

Defined in: [packages/core/dist/element-DPioFL7C.d.ts:8](https://github.com/mineclover/context-action/blob/main/packages/core/dist/element-DPioFL7C.d.ts#L8)

#### Inherited from

`ElementBridgeContract.attributes`

***

### styles?

> `optional` **styles?**: `Partial`\<`Record`\<keyof `Props` & `string`, `string`\>\>

Defined in: [packages/core/dist/element-DPioFL7C.d.ts:9](https://github.com/mineclover/context-action/blob/main/packages/core/dist/element-DPioFL7C.d.ts#L9)

#### Inherited from

`ElementBridgeContract.styles`

***

### events?

> `optional` **events?**: `Record`\<`string`, `string`\>

Defined in: [packages/core/dist/element-DPioFL7C.d.ts:10](https://github.com/mineclover/context-action/blob/main/packages/core/dist/element-DPioFL7C.d.ts#L10)

#### Inherited from

[`LitBridgeOptions`](../../../../lit-ui/src/react-bridge/interfaces/LitBridgeOptions.md).[`events`](../../../../lit-ui/src/react-bridge/interfaces/LitBridgeOptions.md#events)

***

### createHandle?

> `optional` **createHandle?**: [`ImperativeHandleFactory`](../../../../lit-ui/src/type-aliases/ImperativeHandleFactory.md)\<`Element`, `Handle`\>

Defined in: [packages/core/dist/element-DPioFL7C.d.ts:13](https://github.com/mineclover/context-action/blob/main/packages/core/dist/element-DPioFL7C.d.ts#L13)

#### Inherited from

`ElementBridgeContract.createHandle`

***

### tagName

> **tagName**: `string`

Defined in: [packages/core/dist/element-DPioFL7C.d.ts:16](https://github.com/mineclover/context-action/blob/main/packages/core/dist/element-DPioFL7C.d.ts#L16)

#### Inherited from

`ElementBridgeContract.tagName`
