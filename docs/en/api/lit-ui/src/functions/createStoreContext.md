[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/lit-ui/src](../README.md) / createStoreContext

# Function: createStoreContext()

> **createStoreContext**&lt;`T`&gt;(`name`): `Context`\<`symbol`, `ReadableStore`&lt;`T`&gt;\>

Defined in: [packages/lit-ui/src/context.ts:78](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/context.ts#L78)

Factory function creating a strongly-typed W3C Context token for a named Context-Action store.

Distinct store names yield isolated contexts. Identical store names across different
modules or micro-frontend bundles share the same underlying global Symbol.

## Type Parameters

### Generic type T

`T` = `unknown`

State type managed by the store.

## Parameters

### name

`string`

Unique name of the store domain (e.g. 'cart', 'auth', 'theme').

## Returns

`Context`\<`symbol`, `ReadableStore`&lt;`T`&gt;\>

A Context token for the named ReadableStore.

## Example

```typescript
export const cartStoreContext = createStoreContext<CartState>('cart');
```

## Implements

store-integration-pattern

## Memberof

api-terms
