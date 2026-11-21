[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/preact-ui/src](../README.md) / PreactElementConfig

# Interface: PreactElementConfig\<Input, Expose\>

Defined in: [packages/preact-ui/src/custom-element.ts:82](https://github.com/mineclover/context-action/blob/main/packages/preact-ui/src/custom-element.ts#L82)

## Type Parameters

### Input

`Input`

### Expose

`Expose` *extends* `object` = `Record`\<`never`, `never`\>

## Methods

### setup()

> **setup**(`element`, `context`): [`PreactElementLifecycle`](PreactElementLifecycle.md)\<`Input`, `Expose`\>

Defined in: [packages/preact-ui/src/custom-element.ts:107](https://github.com/mineclover/context-action/blob/main/packages/preact-ui/src/custom-element.ts#L107)

Factory invoked on element construction to set up signals, views, and handlers

#### Parameters

##### element

`HTMLElement`

##### context

`PreactElementContext`

#### Returns

[`PreactElementLifecycle`](PreactElementLifecycle.md)\<`Input`, `Expose`\>

## Properties

### tagName

> **tagName**: `string`

Defined in: [packages/preact-ui/src/custom-element.ts:87](https://github.com/mineclover/context-action/blob/main/packages/preact-ui/src/custom-element.ts#L87)

Custom Element tag name (must contain a hyphen, e.g. 'my-widget')

***

### style?

> `optional` **style?**: `string`

Defined in: [packages/preact-ui/src/custom-element.ts:89](https://github.com/mineclover/context-action/blob/main/packages/preact-ui/src/custom-element.ts#L89)

Scoped CSS string injected into the ShadowRoot

***

### observedAttributes?

> `optional` **observedAttributes?**: readonly `string`[]

Defined in: [packages/preact-ui/src/custom-element.ts:91](https://github.com/mineclover/context-action/blob/main/packages/preact-ui/src/custom-element.ts#L91)

List of HTML attributes to observe via attributeChangedCallback

***

### upgradeProperties?

> `optional` **upgradeProperties?**: readonly `string`[]

Defined in: [packages/preact-ui/src/custom-element.ts:97](https://github.com/mineclover/context-action/blob/main/packages/preact-ui/src/custom-element.ts#L97)

Public properties that may have been assigned before custom-element
definition. They are replayed through their prototype setters exactly
once before the first connection session mounts.

***

### formAssociated?

> `optional` **formAssociated?**: `boolean`

Defined in: [packages/preact-ui/src/custom-element.ts:99](https://github.com/mineclover/context-action/blob/main/packages/preact-ui/src/custom-element.ts#L99)

When true, marks the custom element as Form-Associated (FACE) and enables ElementInternals

***

### hydrateShadowRoot?

> `optional` **hydrateShadowRoot?**: `boolean`

Defined in: [packages/preact-ui/src/custom-element.ts:105](https://github.com/mineclover/context-action/blob/main/packages/preact-ui/src/custom-element.ts#L105)

Hydrates a declarative Shadow DOM containing exactly one
`[data-preact-root]`. This is opt-in; arbitrary existing ShadowRoot
children are never adopted by the default mount path.
