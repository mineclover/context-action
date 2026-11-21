[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/lit-ui/src/hydrate](../README.md) / hydrateLit

# Function: hydrateLit()

> **hydrateLit**(`root`, `element`): `void`

Defined in: [packages/lit-ui/src/hydrate.ts:314](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/hydrate.ts#L314)

Hydrates server-produced markup on the client.

Supported modes:
1. `root` is an element's own shadow root (or contains the Lit template
   markers produced by `renderLitTemplate`): the element's current template is
   hydrated into that root, preserving existing DOM and attaching event parts.
2. `root` contains a server-rendered custom element host for the same tag:
   the host is upgraded so its controllers and attributes connect.
3. `root` is empty: the element is mounted and rendered normally.

The function never reads a global `document`; it operates only on the supplied
root and element.

## Parameters

### root

`Element` \| `ShadowRoot`

### element

`LitElement`

## Returns

`void`
