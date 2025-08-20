[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / useComputedStoreInstance

# Function: useComputedStoreInstance()

> **useComputedStoreInstance**&lt;`R`&gt;(`dependencies`, `compute`, `config?`): [`Store`](../classes/Store.md)&lt;`R`&gt;

Defined in: [packages/react/src/stores/hooks/useComputedStore.ts:547](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/hooks/useComputedStore.ts#L547)

Computed Store 인스턴스를 생성하는 Hook

계산된 값을 실제 Store 인스턴스로 반환하여 다른 곳에서 구독할 수 있게 합니다.

## Type Parameters

### Generic type R

Type parameter **R**

## Parameters

### dependencies

[`Store`](../classes/Store.md)&lt;`any`&gt;[]

의존성 Store들

### compute

(`values`) => `R`

계산 함수

### config?

`ComputedStoreConfig`&lt;`R`&gt;

설정 옵션

## Returns

[`Store`](../classes/Store.md)&lt;`R`&gt;

계산된 값을 가진 Store 인스턴스

## Example

```typescript
const userStore = createStore('user', { name: 'John', score: 85 });
const settingsStore = createStore('settings', { showBadges: true });

// Computed Store 인스턴스 생성
const userBadgeStore = useComputedStoreInstance(
  [userStore, settingsStore],
  ([user, settings]) => {
    if (!settings.showBadges) return null;
    
    return {
      name: user.name,
      level: user.score >= 80 ? 'expert' : 'beginner',
      badge: user.score >= 90 ? '🏆' : user.score >= 70 ? '🥉' : '📖'
    };
  },
  { name: 'userBadge' }
);

// 다른 컴포넌트에서 구독 가능
function BadgeDisplay() {
  const badge = useStoreValue(userBadgeStore);
  return badge ? <div>{badge.badge} {badge.name}</div> : null;
}
```
