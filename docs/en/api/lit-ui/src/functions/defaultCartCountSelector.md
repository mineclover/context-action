[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/lit-ui/src](../README.md) / defaultCartCountSelector

# Function: defaultCartCountSelector()

> **defaultCartCountSelector**(`state`): `number`

Defined in: [packages/lit-ui/src/components/cart-badge.ts:53](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/cart-badge.ts#L53)

Default projection selector that extracts total quantity from diverse cart store state structures:
- Primitive numbers (e.g. `5`)
- State objects with `totalCount`, `count`, or `total` numerical fields
- State objects with `items` arrays containing quantity numbers or objects (`{ quantity: n }`)

## Parameters

### state

`unknown`

## Returns

`number`
