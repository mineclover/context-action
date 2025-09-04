# `Snapshot` 인터페이스

## 1. 목적

`Snapshot` 인터페이스는 특정 시점의 스토어 상태에 대한 불변의 스냅샷을 나타냅니다. React의 `useSyncExternalStore` 훅과 호환되도록 설계되었으며, 스토어의 값뿐만 아니라 디버깅, 유효성 검사 및 성능 모니터링을 위한 메타데이터도 제공합니다.

## 2. 구조

`Snapshot` 인터페이스는 다음 속성을 가집니다.

```typescript
export interface Snapshot<T = unknown> {
  // 스냅샷 시점의 스토어 값입니다.
  value: T;

  // 스토어의 이름입니다.
  name: string;

  // 스냅샷이 생성된 타임스탬프입니다.
  lastUpdate: number;

  // 낙관적 업데이트를 위한 스냅샷 버전입니다.
  version?: number;

  // 값의 유효성 검사 상태입니다.
  isValid?: boolean;

  // 유효성 검사에 실패한 경우의 오류 메시지입니다.
  validationError?: string;

  // 스냅샷에 대한 성능 메트릭입니다.
  metrics?: {
    creationTime: number;
    sizeEstimate?: number;
    notificationCount?: number;
  };

  // 스냅샷에 대한 보안 메타데이터입니다.
  security?: {
    validated: boolean;
    sanitized?: boolean;
    trustLevel?: number;
  };
}
```

## 3. 사용 패턴

일반적으로 `Snapshot` 객체를 직접 생성하지 않습니다. `useStoreValue`와 같은 훅에서 내부적으로 사용되는 `store.getSnapshot()` 메서드에 의해 반환됩니다.

### 스냅샷에 접근하기

`getSnapshot()`을 호출하여 스토어의 현재 스냅샷을 가져올 수 있습니다.

```typescript
import { myStore } from './stores';

const snapshot = myStore.getSnapshot();

console.log('현재 값:', snapshot.value);
console.log('마지막 업데이트:', new Date(snapshot.lastUpdate));
```

### `useSyncExternalStore`와 함께 사용하기

`getSnapshot` 메서드는 사용자 정의 훅이나 고급 통합을 위해 `useSyncExternalStore`와 함께 사용하도록 설계되었습니다.

```typescript
import { useSyncExternalStore } from 'react';
import { myStore } from './stores';

const useMyCustomStoreHook = () => {
  const snapshot = useSyncExternalStore(
    myStore.subscribe,
    myStore.getSnapshot
  );

  return snapshot.value;
};
```

## 4. TypeDoc 링크

[types.ts의 Snapshot](../../../packages/react/src/stores/core/types.ts)
