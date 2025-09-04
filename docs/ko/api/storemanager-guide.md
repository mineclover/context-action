# `StoreManager` (StoreRegistry) 가이드

**참고:** `StoreManager` 클래스는 `StoreRegistry`로 이름이 변경되었습니다. 이 가이드는 `StoreRegistry`를 참조합니다.

## 1. 목적

`StoreRegistry`는 애플리케이션의 모든 `Store` 인스턴스를 관리하기 위한 중앙 집중식 컨테이너입니다. 스토어를 등록, 등록 해제 및 검색하는 메서드를 제공하여 전역 또는 컴포넌트 수준에서 상태 관리를 위한 핵심 구성 요소가 됩니다.

## 2. 구조

`StoreRegistry` 클래스는 `IStoreRegistry` 인터페이스를 구현하고 다음 핵심 메서드를 제공합니다.

```typescript
export class StoreRegistry implements IStoreRegistry {
  // 새 스토어를 등록합니다.
  register(name: string, store: IStore<any>, metadata?: Partial<StoreMetadata>): void;

  // 스토어를 등록 해제합니다.
  unregister(name: string): boolean;

  // 이름으로 스토어를 검색합니다.
  getStore(name: string): IStore<any> | undefined;

  // 모든 스토어를 Map으로 검색합니다.
  getAllStores(): Map<string, IStore<any>>;

  // 레지스트리에서 모든 스토어를 지웁니다.
  clear(): void;

  // 레지스트리의 변경 사항을 구독합니다.
  subscribe(listener: Listener): Unsubscribe;

  // ... 기타 유틸리티 메서드
}
```

## 3. 사용 패턴

`StoreRegistry`는 일반적으로 특히 대규모 애플리케이션에서 스토어의 생명주기를 관리하는 데 사용됩니다.

### 전역 레지스트리

라이브러리는 애플리케이션 전체에서 접근할 수 있는 스토어를 관리하는 데 사용할 수 있는 `globalStoreRegistry` 인스턴스를 내보냅니다.

```typescript
import { globalStoreRegistry, Store } from '@context-action/react';

const userStore = new Store({ initialValue: { name: 'Guest' } });
const themeStore = new Store({ initialValue: 'light' });

// 전역 레지스트리에 스토어 등록
globalStoreRegistry.register('user', userStore);
globalStoreRegistry.register('theme', themeStore);

// 나중에 스토어 검색
const retrievedUserStore = globalStoreRegistry.getStore('user');
```

### 사용자 정의 레지스트리

자신만의 `StoreRegistry` 인스턴스를 생성하여 특정 기능이나 컴포넌트 트리 내에서와 같이 특정 스토어 컬렉션을 관리할 수 있습니다.

```typescript
import { StoreRegistry, Store } from '@context-action/react';

const featureRegistry = new StoreRegistry('my-feature');

const productStore = new Store({ initialValue: [] });
featureRegistry.register('products', productStore);

// 이제 `productStore`는 전역 레지스트리와 별도로 관리됩니다.
```

### 변경 사항 구독하기

레지스트리를 구독하여 스토어가 추가되거나 제거될 때마다 알림을 받을 수 있습니다.

```typescript
const unsubscribe = globalStoreRegistry.subscribe(() => {
  console.log('스토어 레지스트리가 변경되었습니다!');
  console.log('현재 스토어 이름:', globalStoreRegistry.getStoreNames());
});

// 나중에 수신을 중지하려면
unsubscribe();
```

## 4. TypeDoc 링크

[StoreRegistry.ts의 StoreRegistry](../../../packages/react/src/stores/core/StoreRegistry.ts)
