[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/lit-ui/src](../README.md) / LitCartBadge

# Class: LitCartBadge

Defined in: [packages/lit-ui/src/components/cart-badge.ts:91](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/cart-badge.ts#L91)

Reference Custom Element for displaying a dynamic shopping cart badge.

Supports two consumption paradigms:
1. Direct property assignment: `.store=${cartStore}` and `.register=${actionRegister}`.
2. W3C Context Protocol: automatically injects `cartStoreContext` and `actionRegisterContext`
   from ancestor providers across Shadow DOM boundaries.

## Extends

- `LitElement`

## Constructors

### Constructor

> **new LitCartBadge**(): `LitCartBadge`

Defined in: [packages/lit-ui/src/components/cart-badge.ts:323](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/cart-badge.ts#L323)

#### Returns

`LitCartBadge`

#### Overrides

`LitElement.constructor`

## Other

### store?

> `optional` **store?**: `ReadableStore`&lt;`any`&gt;

Defined in: [packages/lit-ui/src/components/cart-badge.ts:231](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/cart-badge.ts#L231)

Explicit ReadableStore instance passed directly to this component.
If provided, overrides context-based store resolution.

***

### register?

> `optional` **register?**: `ActionRegister`\<`any`, \{ \}\>

Defined in: [packages/lit-ui/src/components/cart-badge.ts:238](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/cart-badge.ts#L238)

Explicit ActionRegister instance passed directly to this component.
If provided, overrides context-based action register resolution.

***

### selector?

> `optional` **selector?**: `Selector`\<`any`, `number`\>

Defined in: [packages/lit-ui/src/components/cart-badge.ts:244](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/cart-badge.ts#L244)

Custom projection selector for deriving the total quantity from store state.

***

### equalityFn?

> `optional` **equalityFn?**: `EqualityFn`&lt;`number`&gt;

Defined in: [packages/lit-ui/src/components/cart-badge.ts:250](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/cart-badge.ts#L250)

Custom equality comparator function used for selective projection memoization.

***

### storeContext?

> `optional` **storeContext?**: `object`

Defined in: [packages/lit-ui/src/components/cart-badge.ts:256](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/cart-badge.ts#L256)

Optional custom W3C Context token for resolving a cart store from ancestor providers.

***

### actionContext?

> `optional` **actionContext?**: `object`

Defined in: [packages/lit-ui/src/components/cart-badge.ts:262](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/cart-badge.ts#L262)

Optional custom W3C Context token for resolving an ActionRegister from ancestor providers.

***

### value

> **value**: `number` \| `undefined` = `undefined`

Defined in: [packages/lit-ui/src/components/cart-badge.ts:268](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/cart-badge.ts#L268)

Static numerical count override. If defined, overrides both store and context values.

***

### maxCount

> **maxCount**: `number` = `99`

Defined in: [packages/lit-ui/src/components/cart-badge.ts:274](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/cart-badge.ts#L274)

Maximum count displayed before truncating with a '+' suffix (e.g. 99 -> '99+').

***

### hideZero

> **hideZero**: `boolean` = `false`

Defined in: [packages/lit-ui/src/components/cart-badge.ts:280](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/cart-badge.ts#L280)

When true, hides the badge completely when count is 0.

***

### label

> **label**: `string` = `'Cart'`

Defined in: [packages/lit-ui/src/components/cart-badge.ts:286](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/cart-badge.ts#L286)

Label text rendered next to the count. Defaults to 'Cart'.

***

### actionName?

> `optional` **actionName?**: `string`

Defined in: [packages/lit-ui/src/components/cart-badge.ts:292](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/cart-badge.ts#L292)

Optional action name dispatched on click through the configured ActionRegister.

***

### actionPayload?

> `optional` **actionPayload?**: `unknown`

Defined in: [packages/lit-ui/src/components/cart-badge.ts:298](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/cart-badge.ts#L298)

Optional payload passed when dispatching actionName.

***

### disabled

> **disabled**: `boolean` = `false`

Defined in: [packages/lit-ui/src/components/cart-badge.ts:304](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/cart-badge.ts#L304)

Whether the badge button is disabled.

***

### variant

> **variant**: `"primary"` \| `"secondary"` \| `"accent"` \| `"danger"` = `'primary'`

Defined in: [packages/lit-ui/src/components/cart-badge.ts:310](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/cart-badge.ts#L310)

Visual variant: 'primary' | 'secondary' | 'accent' | 'danger'

***

### count

#### Get Signature

> **get** **count**(): `number`

Defined in: [packages/lit-ui/src/components/cart-badge.ts:380](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/cart-badge.ts#L380)

Derives the current total count from direct override, direct store, or context store.

##### Returns

`number`

#### Set Signature

> **set** **count**(`val`): `void`

Defined in: [packages/lit-ui/src/components/cart-badge.ts:409](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/cart-badge.ts#L409)

##### Parameters

###### val

`number` \| `undefined`

##### Returns

`void`

***

### isPending

#### Get Signature

> **get** **isPending**(): `boolean`

Defined in: [packages/lit-ui/src/components/cart-badge.ts:422](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/cart-badge.ts#L422)

Indicates whether an action dispatch is currently in flight.

##### Returns

`boolean`

## rendering

### render()

> **render**(): *typeof* `nothing` \| `TemplateResult`&lt;`1`&gt;

Defined in: [packages/lit-ui/src/components/cart-badge.ts:479](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/cart-badge.ts#L479)

Invoked on each update to perform rendering tasks. This method may return
any value renderable by lit-html's `ChildPart` - typically a
`TemplateResult`. Setting properties inside this method will *not* trigger
the element to update.

#### Returns

*typeof* `nothing` \| `TemplateResult`&lt;`1`&gt;

#### Overrides

`LitElement.render`

## styles

### styles

> `static` **styles**: `CSSResult`

Defined in: [packages/lit-ui/src/components/cart-badge.ts:92](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/cart-badge.ts#L92)

Array of styles to apply to the element. The styles should be defined
using the css tag function, via constructible stylesheets, or
imported from native CSS module scripts.

Note on Content Security Policy:

Element styles are implemented with `<style>` tags when the browser doesn't
support adopted StyleSheets. To use such `<style>` tags with the style-src
CSP directive, the style-src value must either include 'unsafe-inline' or
`nonce-<base64-value>` with `<base64-value>` replaced be a server-generated
nonce.

To provide a nonce to use on generated `<style>` elements, set
`window.litNonce` to a server-generated nonce in your page's HTML, before
loading application code:

```html
<script>
  // Generated and unique per request:
  window.litNonce = 'a1b2c3d4';
</script>
```

#### Nocollapse

#### Overrides

`LitElement.styles`

## updates

### willUpdate()

> **willUpdate**(`changedProperties`): `void`

Defined in: [packages/lit-ui/src/components/cart-badge.ts:339](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/cart-badge.ts#L339)

Invoked before `update()` to compute values needed during the update.

Implement `willUpdate` to compute property values that depend on other
properties and are used in the rest of the update process.

```ts
willUpdate(changedProperties) {
  // only need to check changed properties for an expensive computation.
  if (changedProperties.has('firstName') || changedProperties.has('lastName')) {
    this.sha = computeSHA(`${this.firstName} ${this.lastName}`);
  }
}

render() {
  return html`SHA: ${this.sha}`;
}
```

#### Parameters

##### changedProperties

`PropertyValueMap`&lt;`LitCartBadge`&gt;

#### Returns

`void`

#### Overrides

`LitElement.willUpdate`

***

### updated()

> **updated**(`changedProperties`): `void`

Defined in: [packages/lit-ui/src/components/cart-badge.ts:429](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/cart-badge.ts#L429)

Invoked whenever the element is updated. Implement to perform
post-updating tasks via DOM APIs, for example, focusing an element.

Setting properties inside this method will trigger the element to update
again after this update cycle completes.

#### Parameters

##### changedProperties

`PropertyValueMap`&lt;`LitCartBadge`&gt;

#### Returns

`void`

#### Overrides

`LitElement.updated`
