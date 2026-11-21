[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/preact-ui/src](../README.md) / definePreactElement

# Function: definePreactElement()

> **definePreactElement**\<`Input`, `Expose`\>(`config`): [`PreactCustomElementConstructor`](../type-aliases/PreactCustomElementConstructor.md)\<`Input`, `Expose`\>

Defined in: [packages/preact-ui/src/custom-element.ts:277](https://github.com/mineclover/context-action/blob/main/packages/preact-ui/src/custom-element.ts#L277)

Optional convenience factory for a Preact Custom Element shell.

This helper owns a ShadowRoot renderer and FACE forwarding. It does not
infer a component's public input/event semantics or connection-session
resources; component-specific adapters must define those contracts.

`expose` members are validated against the element prototype chain at
construction time. A reserved member throws a `TypeError` before any public
member is installed, and `onDestroy` is invoked so setup-owned resources are
released.

## Type Parameters

### Input

`Input`

### Expose

`Expose` *extends* `object` & [`ExposeContract`](../type-aliases/ExposeContract.md)&lt;`Expose`&gt; = `Record`\<`never`, `never`\>

## Parameters

### config

[`PreactElementConfig`](../interfaces/PreactElementConfig.md)\<`Input`, `Expose`\>

## Returns

[`PreactCustomElementConstructor`](../type-aliases/PreactCustomElementConstructor.md)\<`Input`, `Expose`\>
