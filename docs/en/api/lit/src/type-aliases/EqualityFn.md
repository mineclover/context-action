[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/lit/src](../README.md) / EqualityFn

# Type Alias: EqualityFn\<Selected\>

> **EqualityFn**&lt;`Selected`&gt; = (`prev`, `next`) => `boolean`

Defined in: [packages/lit/src/types.ts:67](https://github.com/mineclover/context-action/blob/main/packages/lit/src/types.ts#L67)

Comparator determining whether two projected values are equivalent.
When it returns `true`, re-renders are suppressed.

## Type Parameters

### Selected

`Selected`

Projected output type.

## Parameters

### prev

`Selected`

### next

`Selected`

## Returns

`boolean`
