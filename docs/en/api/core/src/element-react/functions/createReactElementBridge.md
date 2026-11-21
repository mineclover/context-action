[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src/element-react](../README.md) / createReactElementBridge

# Function: createReactElementBridge()

> **createReactElementBridge**\<`Props`, `Element`, `Handle`\>(`React`, `options`, `assignmentErrors?`): [`ReactElementComponent`](../type-aliases/ReactElementComponent.md)\<`Props`, `Element`, `Handle`\>

Defined in: [packages/core/src/bridges/react-element/create-react-element-bridge.ts:12](https://github.com/mineclover/context-action/blob/main/packages/core/src/bridges/react-element/create-react-element-bridge.ts#L12)

Opt-in host adapter; inject the consuming runtime rather than importing another hook dispatcher.

## Type Parameters

### Props

`Props` *extends* `object` = `Record`\<`string`, `unknown`\>

### Element

`Element` *extends* `HTMLElement` = `HTMLElement`

### Handle

`Handle` = `Element`

## Parameters

### React

*typeof* `React`

### options

[`ElementBridgeContract`](../../element/interfaces/ElementBridgeContract.md)\<`Props`, `Element`, `Handle`\>

### assignmentErrors?

`"ignore"` \| `"throw"`

## Returns

[`ReactElementComponent`](../type-aliases/ReactElementComponent.md)\<`Props`, `Element`, `Handle`\>
