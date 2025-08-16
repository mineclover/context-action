[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / useMultiStoreSelector

# Function: useMultiStoreSelector()

> **useMultiStoreSelector**&lt;`R`&gt;(`stores`, `selector`, `equalityFn?`): `R`

Defined in: [packages/react/src/stores/hooks/useStoreSelector.ts:247](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/hooks/useStoreSelector.ts#L247)

여러 Store를 조합하여 선택적 구독하는 Hook

## Type Parameters

### Generic type R

Type parameter **R**

## Parameters

### stores

[`Store`](../classes/Store.md)&lt;`any`&gt;[]

구독할 Store들의 배열

### selector

(`values`) => `R`

여러 Store 값들을 조합하는 함수

### equalityFn?

(`a`, `b`) => `boolean`

이전 값과 새 값을 비교하는 함수

## Returns

Type parameter **R**

selector가 반환하는 값

## Example

```typescript
const userStore = createStore('user', { name: '', email: '' });
const settingsStore = createStore('settings', { theme: 'light' });
const uiStore = createStore('ui', { isLoading: false });

const dashboardData = useMultiStoreSelector(
  [userStore, settingsStore, uiStore],
  ([user, settings, ui]) => ({
    greeting: `Hello, ${user.name}!`,
    isDarkMode: settings.theme === 'dark',
    showLoader: ui.isLoading
  }),
  shallowEqual
);
```
