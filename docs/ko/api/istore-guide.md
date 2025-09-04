# `IStore` 인터페이스

## 1. 목적

`IStore` 인터페이스는 `@context-action/react` 라이브러리에서 스토어에 대한 계약을 정의합니다. 값 가져오기 및 설정, 변경 구독, 스토어의 생명주기 관리를 포함하여 상태 관리를 위한 표준 메서드 세트를 제공합니다. React의 `useSyncExternalStore` 훅과 호환되도록 설계되었습니다.

## 2. 구조

`IStore` 인터페이스는 다음 속성과 메서드를 가집니다.

```typescript
export interface IStore<T = unknown> {
  // 스토어의 고유한 이름입니다.
  readonly name: string;

  // 스토어의 변경 사항을 구독합니다.
  subscribe: (listener: Listener) => Unsubscribe;

  // 스토어 상태의 불변 스냅샷을 가져옵니다.
  getSnapshot: () => Snapshot<T>;

  // 스토어의 값을 설정합니다.
  setValue: (value: T, options?: StoreSetValueOptions<T>) => void;

  // 업데이터 함수를 사용하여 스토어의 값을 업데이트합니다.
  update: (updater: (current: T) => T) => void;

  // 스토어의 현재 값을 가져옵니다.
  getValue: () => T;

  // 활성 리스너 수를 가져옵니다.
  getListenerCount?: () => number;

  // 스토어와 해당 리소스를 폐기합니다.
  dispose?: () => void;

  // ... 그리고 클린업, 메트릭, 보안을 위한 기타 고급 메서드.
}
```

## 3. 사용 패턴

일반적으로 `IStore` 인터페이스를 직접 구현하지 않습니다. 대신 `IStore`를 구현하는 `Store` 클래스의 인스턴스를 생성합니다.

### 스토어 생성하기

```typescript
import { Store } from '@context-action/react';

const myStore: IStore<number> = new Store('myStore', 0);
```

### 스토어와 상호 작용하기

스토어 인스턴스가 있으면 해당 메서드를 사용하여 상태를 관리할 수 있습니다.

```typescript
// 값 설정
myStore.setValue(10);

// 값 업데이트
myStore.update(currentValue => currentValue + 1);

// 값 가져오기
const currentValue = myStore.getValue(); // 11

// 변경 구독
const unsubscribe = myStore.subscribe(() => {
  console.log('스토어가 변경되었습니다!');
});
```

## 4. TypeDoc 링크

[types.ts의 IStore](../../../packages/react/src/stores/core/types.ts)
