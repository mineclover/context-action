[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / UseStoreSelectorWithPathsOptions

# Interface: UseStoreSelectorWithPathsOptions\<R\>

Defined in: [packages/react/src/stores/hooks/useStorePath.ts:207](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/hooks/useStorePath.ts#L207)

Hook for subscribing to multiple paths with a selector

## Example

```tsx
const fullName = useStoreSelector(
  store,
  (state) => `${state.user.firstName} ${state.user.lastName}`,
  { dependsOn: [['user', 'firstName'], ['user', 'lastName']] }
);
```

## Type Parameters

### Generic type R

Type parameter **R**

## Properties

### dependsOn?

> `optional` **dependsOn?**: [`StorePath`](../type-aliases/StorePath.md)[]

Defined in: [packages/react/src/stores/hooks/useStorePath.ts:209](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/hooks/useStorePath.ts#L209)

Paths that the selector depends on

***

### equalityFn?

> `optional` **equalityFn?**: (`a`, `b`) => `boolean`

Defined in: [packages/react/src/stores/hooks/useStorePath.ts:211](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/hooks/useStorePath.ts#L211)

Custom equality function

#### Parameters

##### a

Type parameter **R**

##### b

Type parameter **R**

#### Returns

`boolean`
