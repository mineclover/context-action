[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / useStorePathSelector

# Function: useStorePathSelector()

> **useStorePathSelector**&lt;`T`&gt;(`store`, `path`, `equalityFn`): `any`

Defined in: [packages/react/src/stores/hooks/useStoreSelector.ts:337](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/hooks/useStoreSelector.ts#L337)

Store의 깊은 경로에 있는 값을 선택적으로 구독하는 유틸리티 Hook

## Type Parameters

### Generic type T

Type parameter **T**

Store의 값 타입

## Parameters

### store

[`Store`](../classes/Store.md)&lt;`T`&gt;

구독할 Store

### path

(`string` \| `number`)[]

객체 경로 (예: ['user', 'profile', 'name'])

### equalityFn

(`a`, `b`) => `boolean`

동등성 비교 함수

## Returns

`any`

경로에 있는 값

## Example

```typescript
const appStore = createStore('app', {
  user: {
    profile: { name: 'John', email: 'john@example.com' },
    settings: { theme: 'dark' }
  },
  ui: { isLoading: false }
});

// 깊은 경로의 값 선택
const userName = useStorePathSelector(appStore, ['user', 'profile', 'name']);
const userTheme = useStorePathSelector(appStore, ['user', 'settings', 'theme']);
```
