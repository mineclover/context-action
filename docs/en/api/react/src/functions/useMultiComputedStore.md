[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / useMultiComputedStore

# Function: useMultiComputedStore()

> **useMultiComputedStore**&lt;`R`&gt;(`stores`, `compute`, `config?`): `R`

Defined in: [packages/react/src/stores/hooks/useComputedStore.ts:276](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/hooks/useComputedStore.ts#L276)

여러 Store 기반 Computed Hook

## Type Parameters

### Generic type R

Type parameter **R**

## Parameters

### stores

[`Store`](../classes/Store.md)&lt;`any`&gt;[]

의존성 Store들

### compute

(`values`) => `R`

계산 함수

### config?

`ComputedStoreConfig`&lt;`R`&gt;

설정 옵션

## Returns

Type parameter **R**

계산된 값

## Example

```typescript
const userStore = createStore('user', { name: 'John', age: 30 });
const settingsStore = createStore('settings', { currency: 'USD', tax: 0.1 });
const cartStore = createStore('cart', { items: [], total: 0 });

// 여러 Store 조합
const checkoutSummary = useMultiComputedStore(
  [userStore, settingsStore, cartStore],
  ([user, settings, cart]) => ({
    customerName: user.name,
    subtotal: cart.total,
    tax: cart.total * settings.tax,
    total: cart.total * (1 + settings.tax),
    currency: settings.currency,
    itemCount: cart.items.length
  }),
  {
    equalityFn: shallowEqual,
    name: 'checkoutSummary'
  }
);
```
