[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / UseStoreSelectorWithPathsOptions

# Interface: UseStoreSelectorWithPathsOptions\<R\>

Defined in: [packages/react/src/stores/hooks/useStorePath.ts:183](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/hooks/useStorePath.ts#L183)

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

> `optional` **dependsOn?**: readonly readonly (`string` \| `number`)[][]

Defined in: [packages/react/src/stores/hooks/useStorePath.ts:185](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/hooks/useStorePath.ts#L185)

Paths that the selector depends on

***

### equalityFn?

> `optional` **equalityFn?**: (`a`, `b`) => `boolean`

Defined in: [packages/react/src/stores/hooks/useStorePath.ts:187](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/hooks/useStorePath.ts#L187)

Custom equality function

#### Parameters

##### a

Type parameter **R**

##### b

Type parameter **R**

#### Returns

`boolean`
