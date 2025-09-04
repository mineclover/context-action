# `StoreConfig` 인터페이스

## 1. 목적

`StoreConfig` 인터페이스는 `ManagedStore` 인스턴스를 생성할 때, 일반적으로 고차 컴포넌트(HOC) 패턴 내에서 또는 `createManagedStore` 팩토리 함수를 사용할 때 구성 옵션을 제공하는 데 사용됩니다. 스토어의 ID와 `StoreRegistry`와의 관계에 대한 필수 속성을 정의합니다.

## 2. 구조

`StoreConfig` 인터페이스는 다음 속성을 가집니다.

```typescript
export interface StoreConfig<T = unknown> {
  // 스토어의 고유한 이름입니다.
  name: string;

  // 스토어의 초기값입니다.
  initialValue: T;

  // 스토어를 등록할 StoreRegistry 인스턴스입니다.
  registry?: StoreRegistry;

  // 생성 시 스토어를 자동으로 등록할지 여부입니다. 기본값은 true입니다.
  autoRegister?: boolean;
}
```

## 3. 사용 패턴

`StoreConfig`는 주로 `createManagedStore`와 함께 사용하여 레지스트리에 자동으로 등록할 수 있는 스토어를 생성합니다.

### 관리형 스토어 생성하기

이 패턴은 스토어 생성 및 등록 로직을 캡슐화하려는 경우에 유용합니다.

```typescript
import { createManagedStore, StoreConfig, globalStoreRegistry } from '@context-action/react';

const userStoreConfig: StoreConfig<{ name: string }> = {
  name: 'user',
  initialValue: { name: 'Guest' },
  registry: globalStoreRegistry,
  autoRegister: true,
};

const userStore = createManagedStore(userStoreConfig);

// 이제 userStore는 globalStoreRegistry에 자동으로 등록됩니다.
```

### HOC에서 사용하기

여기서는 자세히 설명하지 않지만, `StoreConfig`는 컴포넌트에 스토어를 제공하는 HOC에서 사용하도록 설계되어 유연하고 구성 가능한 상태 관리를 허용합니다.

## 4. TypeDoc 링크

[Store.ts의 StoreConfig](../../../packages/react/src/stores/core/Store.ts)
