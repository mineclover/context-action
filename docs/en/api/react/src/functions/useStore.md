[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / useStore

# Function: useStore()

> **useStore**\<`T`, `R`\>(`store`, `config?`): `R`

Defined in: [packages/react/src/stores/utils/store-selector.ts:52](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/utils/store-selector.ts#L52)

Store Selector Hook - 선택적 데이터 구독

## Type Parameters

### Generic type T

Type parameter **T**

Store 값 타입

### Generic type R

`R` = [`Snapshot`](../interfaces/Snapshot.md)&lt;`T`&gt;

반환 타입 (기본값: Snapshot&lt;T&gt;)

## Parameters

### store

구독할 Store 인스턴스

`undefined` | `null` | [`IStore`](../interfaces/IStore.md)&lt;`T`&gt;

### config?

`StoreSyncConfig`\<`T`, `R`\>

선택적 설정 (selector, defaultValue)

## Returns

Type parameter **R**

선택된 값 또는 스냅샷

핵심 로직 흐름:
1. store.getSnapshot() - 현재 상태 가져오기
2. selector 적용 (있을 경우) - 필요한 부분만 추출
3. useSyncExternalStore() - React와 동기화

## Implements

computed-store

## Implements

fresh-state-access

## Implements

performance-optimization

## Memberof

core-concepts

핵심 기능: selector를 사용하여 Store의 특정 부분만 구독하고 반환

## Example

```typescript
// 사용자 이름만 구독
const userName = useStoreSelector(userStore, { 
  selector: snapshot => snapshot.value.name 
});

// 계산된 값 구독
const totalPrice = useStoreSelector(cartStore, {
  selector: snapshot => snapshot.value.items.reduce((sum, item) => sum + item.price, 0)
});
```
