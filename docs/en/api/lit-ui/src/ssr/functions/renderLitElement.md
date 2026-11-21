[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/lit-ui/src/ssr](../README.md) / renderLitElement

# Function: renderLitElement()

> **renderLitElement**(`element`, `options?`): `string`

Defined in: [packages/lit-ui/src/ssr.ts:226](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/ssr.ts#L226)

Renders a Lit Element instance to server markup, including its declarative
shadow root and adopted styles.

The element must already be registered with `customElements.define()`.
Reactive properties are serialized as Lit property bindings so complex
values survive SSR without attribute stringification.

## Parameters

### element

`LitElement`

### options?

[`RenderLitElementOptions`](../interfaces/RenderLitElementOptions.md)

## Returns

`string`
