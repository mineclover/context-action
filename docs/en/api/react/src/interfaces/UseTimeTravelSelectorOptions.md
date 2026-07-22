[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / UseTimeTravelSelectorOptions

# Interface: UseTimeTravelSelectorOptions\<R\>

Defined in: [packages/react/src/stores/hooks/useTimeTravelPath.ts:188](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/hooks/useTimeTravelPath.ts#L188)

Hook for subscribing to multiple paths with a selector

## Example

```tsx
const fullName = useTimeTravelSelector(
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

> `optional` **dependsOn?**: `StorePath`[]

Defined in: [packages/react/src/stores/hooks/useTimeTravelPath.ts:190](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/hooks/useTimeTravelPath.ts#L190)

Paths that the selector depends on

***

### equalityFn?

> `optional` **equalityFn?**: (`a`, `b`) => `boolean`

Defined in: [packages/react/src/stores/hooks/useTimeTravelPath.ts:192](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/hooks/useTimeTravelPath.ts#L192)

Custom equality function

#### Parameters

##### a

Type parameter **R**

##### b

Type parameter **R**

#### Returns

`boolean`
