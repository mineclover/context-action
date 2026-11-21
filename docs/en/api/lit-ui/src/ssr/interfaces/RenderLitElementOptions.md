[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/lit-ui/src/ssr](../README.md) / RenderLitElementOptions

# Interface: RenderLitElementOptions

Defined in: [packages/lit-ui/src/ssr.ts:24](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/ssr.ts#L24)

Options for [renderLitElement](../functions/renderLitElement.md).

## Properties

### properties?

> `optional` **properties?**: readonly `string`[]

Defined in: [packages/lit-ui/src/ssr.ts:29](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/ssr.ts#L29)

Explicit reactive property names to serialize as Lit property bindings.
Defaults to the element's `static elementProperties` map.

***

### includeAttributes?

> `optional` **includeAttributes?**: `boolean`

Defined in: [packages/lit-ui/src/ssr.ts:35](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/ssr.ts#L35)

Copy the element's current HTML attributes into the server markup.
Defaults to `true`.

***

### includeLightDom?

> `optional` **includeLightDom?**: `boolean`

Defined in: [packages/lit-ui/src/ssr.ts:44](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/ssr.ts#L44)

Serialize the element's current light DOM children inside the host tag so
`<slot>` projection survives SSR. Defaults to `true`.

The light DOM is treated as trusted server input; complex properties on
nested custom elements must still be supplied through their own SSR path.
