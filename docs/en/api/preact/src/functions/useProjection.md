[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/preact/src](../README.md) / useProjection

# Function: useProjection()

> **useProjection**\<`State`, `Projected`\>(`sourceSignal`, `selector`): `ReadonlySignal`&lt;`Projected`&gt;

Defined in: [packages/preact/src/projection.ts:21](https://github.com/mineclover/context-action/blob/main/packages/preact/src/projection.ts#L21)

Projects a slice of state from a source signal into a memoized, fine-grained ReadonlySignal.
Computation re-evaluates only when the accessed signals change.

## Type Parameters

### State

`State`

### Projected

`Projected`

## Parameters

### sourceSignal

`ReadonlySignal`&lt;`State`&gt;

### selector

(`state`) => `Projected`

## Returns

`ReadonlySignal`&lt;`Projected`&gt;
