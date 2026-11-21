[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/lit-ui/src/react-bridge](../README.md) / createLitElementBridge

# Function: createLitElementBridge()

## Call Signature

> **createLitElementBridge**\<`Props`, `Element`, `Handle`\>(`tagName`, `config?`): [`LitElementComponent`](../type-aliases/LitElementComponent.md)\<`Props`, `Element`, `Handle`\>

Defined in: [packages/lit-ui/src/react-bridge.ts:22](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/react-bridge.ts#L22)

### Type Parameters

#### Props

`Props` *extends* `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\>

#### Element

`Element` *extends* `HTMLElement` = `HTMLElement`

#### Handle

`Handle` = `Element`

### Parameters

#### tagName

`string`

#### config?

[`LitBridgeConfig`](../interfaces/LitBridgeConfig.md)\<`Props`, `Element`, `Handle`\>

### Returns

[`LitElementComponent`](../type-aliases/LitElementComponent.md)\<`Props`, `Element`, `Handle`\>

## Call Signature

> **createLitElementBridge**\<`Props`, `Element`, `Handle`\>(`options`): [`LitElementComponent`](../type-aliases/LitElementComponent.md)\<`Props`, `Element`, `Handle`\>

Defined in: [packages/lit-ui/src/react-bridge.ts:28](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/react-bridge.ts#L28)

### Type Parameters

#### Props

`Props` *extends* `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\>

#### Element

`Element` *extends* `HTMLElement` = `HTMLElement`

#### Handle

`Handle` = `Element`

### Parameters

#### options

[`LitBridgeOptions`](../interfaces/LitBridgeOptions.md)\<`Props`, `Element`, `Handle`\>

### Returns

[`LitElementComponent`](../type-aliases/LitElementComponent.md)\<`Props`, `Element`, `Handle`\>
