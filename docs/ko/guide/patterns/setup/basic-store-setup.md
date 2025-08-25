# 기본 스토어 설정

Context-Action 프레임워크를 위한 공유 스토어 컨텍스트 설정 패턴입니다.

## 임포트
```typescript
import { createDeclarativeStorePattern, useStoreValue } from '@context-action/react';
```

## 타입 정의

### 일반적인 스토어 패턴
```typescript
// 사용자 도메인 스토어
interface UserStores {
  profile: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user' | 'guest';
  };
  preferences: {
    theme: 'light' | 'dark';
    language: 'en' | 'ko' | 'ja' | 'zh';
    notifications: boolean;
  };
  session: {
    isAuthenticated: boolean;
    permissions: string[];
    lastActivity: number;
  };
}

// 제품 도메인 스토어
interface ProductStores {
  catalog: Product[];
  categories: Category[];
  filters: {
    category?: string;
    priceRange?: { min: number; max: number };
    searchTerm?: string;
    sortBy?: 'name' | 'price' | 'rating';
  };
  cart: {
    items: CartItem[];
    total: number;
    discounts: Discount[];
  };
}

// UI 상태 스토어
interface UIStores {
  modal: {
    isOpen: boolean;
    type?: string;
    data?: any;
  };
  loading: {
    global: boolean;
    operations: Record<string, boolean>;
  };
  notifications: {
    items: Notification[];
    maxVisible: number;
  };
  navigation: {
    currentRoute: string;
    history: string[];
    params: Record<string, any>;
  };
}

// 폼 상태 스토어
interface FormStores {
  contactForm: {
    name: string;
    email: string;
    message: string;
    errors: Record<string, string>;
    isSubmitting: boolean;
  };
  searchForm: {
    query: string;
    filters: SearchFilters;
    results: SearchResult[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
    };
  };
}
```

### 타입 추론 구성
```typescript
// 간단한 값 구성 (자동 타입 추론)
const simpleStoreConfig = {
  counter: 0,
  userName: '',
  isLoggedIn: false,
  items: [] as string[],
  settings: { theme: 'light' as const, language: 'en' as const }
};

// 스토어 옵션이 포함된 구성
const advancedStoreConfig = {
  // 간단한 직접 값
  counter: 0,
  userName: '',
  
  // 구성이 포함된 복잡한 객체
  user: {
    initialValue: { id: '', name: '', email: '' },
    strategy: 'shallow' as const,
    description: '사용자 프로필 데이터'
  },
  
  // 적절한 타이핑이 포함된 배열
  todos: {
    initialValue: [] as Todo[],
    strategy: 'shallow' as const,
    description: '할 일 목록 항목'
  },
  
  // 깊은 비교가 포함된 중첩 객체
  preferences: {
    initialValue: {
      theme: 'light' as 'light' | 'dark',
      notifications: true,
      language: 'en'
    },
    strategy: 'deep' as const,
    description: '사용자 기본 설정'
  }
};
```

## 컨텍스트 생성 패턴

### 단일 도메인 스토어 컨텍스트
```typescript
// 특정 도메인을 위한 기본 스토어 컨텍스트
const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager,
  withProvider: withUserStoreProvider
} = createDeclarativeStorePattern('User', {
  profile: {
    initialValue: { id: '', name: '', email: '', role: 'guest' as const },
    strategy: 'shallow' as const
  },
  preferences: {
    initialValue: { theme: 'light' as const, language: 'en', notifications: true },
    strategy: 'shallow' as const
  },
  session: {
    initialValue: { isAuthenticated: false, permissions: [], lastActivity: 0 },
    strategy: 'shallow' as const
  }
});
```

### 다중 도메인 스토어 설정
```typescript
// 사용자 도메인
const UserStoreContext = createDeclarativeStorePattern('User', {
  profile: { id: '', name: '', email: '', role: 'guest' as const },
  preferences: { theme: 'light' as const, language: 'en', notifications: true },
  session: { isAuthenticated: false, permissions: [], lastActivity: 0 }
});

// 제품 도메인
const ProductStoreContext = createDeclarativeStorePattern('Product', {
  catalog: [] as Product[],
  categories: [] as Category[],
  filters: {
    initialValue: {},
    strategy: 'shallow' as const
  },
  cart: {
    initialValue: { items: [], total: 0, discounts: [] },
    strategy: 'shallow' as const
  }
});

// UI 도메인
const UIStoreContext = createDeclarativeStorePattern('UI', {
  modal: { isOpen: false, type: undefined, data: undefined },
  loading: { 
    initialValue: { global: false, operations: {} },
    strategy: 'shallow' as const
  },
  notifications: {
    initialValue: { items: [], maxVisible: 5 },
    strategy: 'shallow' as const
  }
});

// 프로바이더와 훅 추출
export const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager
} = UserStoreContext;

export const {
  Provider: ProductStoreProvider,
  useStore: useProductStore,
  useStoreManager: useProductStoreManager
} = ProductStoreContext;

export const {
  Provider: UIStoreProvider,
  useStore: useUIStore,
  useStoreManager: useUIStoreManager
} = UIStoreContext;
```

### 명시적 제네릭 타입 패턴
```typescript
// 명시적 타입 제어가 필요한 경우
interface ExplicitUserStores {
  profile: UserProfile;
  preferences: UserPreferences;
  session: UserSession;
}

const {
  Provider: ExplicitUserStoreProvider,
  useStore: useExplicitUserStore,
  useStoreManager: useExplicitUserStoreManager
} = createDeclarativeStorePattern<ExplicitUserStores>('ExplicitUser', {
  profile: {
    initialValue: { id: '', name: '', email: '', role: 'guest' },
    strategy: 'shallow'
  },
  preferences: {
    initialValue: { theme: 'light', language: 'en', notifications: true },
    strategy: 'shallow'  
  },
  session: {
    initialValue: { isAuthenticated: false, permissions: [], lastActivity: 0 },
    strategy: 'shallow'
  }
});
```

## 프로바이더 설정 패턴

### 단일 프로바이더 설정
```typescript
// 기본 단일 스토어 프로바이더
function App() {
  return (
    <UserStoreProvider>
      <AppContent />
    </UserStoreProvider>
  );
}
```

### 다중 프로바이더 설정
```typescript
// 수동 중첩 방식
function App() {
  return (
    <UserStoreProvider>
      <ProductStoreProvider>
        <UIStoreProvider>
          <AppContent />
        </UIStoreProvider>
      </ProductStoreProvider>
    </UserStoreProvider>
  );
}

// composeProviders 유틸리티 사용 (권장)
import { composeProviders } from '@context-action/react';

const StoreProviders = composeProviders([
  UserStoreProvider,
  ProductStoreProvider,
  UIStoreProvider
]);

function App() {
  return (
    <StoreProviders>
      <AppContent />
    </StoreProviders>
  );
}
```

### HOC 패턴 설정
```typescript
// 자동 래핑을 위한 withProvider HOC 사용
const AppWithStores = withUserStoreProvider(
  withProductStoreProvider(
    withUIStoreProvider(AppContent)
  )
);

function App() {
  return <AppWithStores />;
}

// 또는 compose 유틸리티와 함께
import { compose } from '@context-action/react';

const AppWithAllStores = compose(
  withUserStoreProvider,
  withProductStoreProvider,
  withUIStoreProvider
)(AppContent);

function App() {
  return <AppWithAllStores />;
}
```

### 조건부 스토어 설정
```typescript
// 기능에 따른 조건부 스토어 프로바이더
interface StoreConfig {
  features: {
    userManagement: boolean;
    shopping: boolean;
    analytics: boolean;
  };
}

function AppWithStoreConfig({ config }: { config: StoreConfig }) {
  const providers = [];
  
  // 항상 UI 스토어 포함
  providers.push(UIStoreProvider);
  
  if (config.features.userManagement) {
    providers.push(UserStoreProvider);
  }
  
  if (config.features.shopping) {
    providers.push(ProductStoreProvider);
  }
  
  const ConditionalStoreProviders = composeProviders(providers);
  
  return (
    <ConditionalStoreProviders>
      <AppContent />
    </ConditionalStoreProviders>
  );
}
```

## 내보내기 패턴

### 명명된 내보내기 (권장)
```typescript
// stores/UserStores.ts
export interface UserStores {
  profile: UserProfile;
  preferences: UserPreferences;
  session: UserSession;
}

export const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager,
  withProvider: withUserStoreProvider
} = createDeclarativeStorePattern('User', {
  profile: { id: '', name: '', email: '', role: 'guest' as const },
  preferences: { theme: 'light' as const, language: 'en', notifications: true },
  session: { isAuthenticated: false, permissions: [], lastActivity: 0 }
});

// 쉬운 임포트를 위한 재내보내기
export {
  UserStoreProvider,
  useUserStore,
  useUserStoreManager,
  withUserStoreProvider
};
```

### 배럴 내보내기
```typescript
// stores/index.ts - 배럴 내보내기 파일
export * from './UserStores';
export * from './ProductStores';
export * from './UIStores';
export * from './FormStores';

// 컴포넌트에서 사용
import {
  useUserStore,
  useProductStore,
  useUIStore
} from '../stores';
```

### 스토어 번들 내보내기
```typescript
// stores/StoreContexts.ts - 모든 스토어 컨텍스트를 하나의 파일에
export const UserStoreContext = createDeclarativeStorePattern('User', userConfig);
export const ProductStoreContext = createDeclarativeStorePattern('Product', productConfig);
export const UIStoreContext = createDeclarativeStorePattern('UI', uiConfig);

// 사용
import { UserStoreContext, ProductStoreContext } from '../stores/StoreContexts';

const useUser = UserStoreContext.useStore;
const useProduct = ProductStoreContext.useStore;
```

## 모범 사례

### 타입 조직
1. **도메인 주도 타입**: 비즈니스 도메인별로 스토어 그룹화
2. **일관된 구조**: 일관된 속성 네이밍 및 구조 사용
3. **타입 안전성**: 리터럴 타입에는 `as const` 사용하고 적절한 배열 타이핑
4. **초기값**: 모든 스토어에 합리적인 기본값 제공

### 컨텍스트 구성
1. **전략 선택**: 객체에는 'shallow', 중첩 구조에는 'deep' 사용
2. **성능**: 리렌더링에 대한 비교 전략의 영향 고려
3. **초기값**: 초기값을 예상 데이터 타입과 일치시키기
4. **설명**: 복잡한 스토어 구성에 설명 추가

### 프로바이더 조직
1. **논리적 그룹화**: 관련된 스토어 프로바이더들을 함께 그룹화
2. **프로바이더 순서**: 종속성에 따른 프로바이더 순서 (독립적 → 종속적)
3. **구성**: 수동 중첩보다 `composeProviders` 선호
4. **HOC 사용**: 컴포넌트 수준 프로바이더 래핑을 위해 HOC 패턴 사용

## 스토어 액세스 패턴

### 기본 스토어 액세스
```typescript
// 구성된 스토어를 사용하는 컴포넌트
function UserProfile() {
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');
  
  const profile = useStoreValue(profileStore);
  const preferences = useStoreValue(preferencesStore);
  
  const updateProfile = (newData: Partial<UserProfile>) => {
    profileStore.update(current => ({ ...current, ...newData }));
  };
  
  return (
    <div>
      <h1>{profile.name}</h1>
      <p>테마: {preferences.theme}</p>
      <button onClick={() => updateProfile({ name: '새 이름' })}>
        업데이트
      </button>
    </div>
  );
}
```

### 매니저 기반 액세스
```typescript
// 복잡한 작업을 위한 스토어 매니저 사용
function UserManagement() {
  const userManager = useUserStoreManager();
  
  const resetAllUserData = () => {
    const profileStore = userManager.getStore('profile');
    const preferencesStore = userManager.getStore('preferences');
    const sessionStore = userManager.getStore('session');
    
    profileStore.setValue({ id: '', name: '', email: '', role: 'guest' });
    preferencesStore.setValue({ theme: 'light', language: 'en', notifications: true });
    sessionStore.setValue({ isAuthenticated: false, permissions: [], lastActivity: 0 });
  };
  
  return (
    <button onClick={resetAllUserData}>
      모든 데이터 재설정
    </button>
  );
}
```

## 일반적인 패턴 참조

이 설정 파일은 다음을 위한 재사용 가능한 패턴을 제공합니다:

- **[스토어 기본 사용법](../store/basic-usage.md)** - UserStores 패턴 사용
- **[스토어 성능 패턴](../store/performance-patterns.md)** - 최적화된 구성 사용
- **[useStoreValue 패턴](../store/useStoreValue-patterns.md)** - 액세스 패턴 사용
- **[MVVM 아키텍처](../architecture/mvvm.md)** - 도메인 스토어 분리 사용
- **[도메인 컨텍스트 아키텍처](../architecture/domain-context.md)** - 다중 도메인 스토어 사용

## 관련 설정 가이드

- **[기본 액션 설정](./basic-action-setup.md)** - 액션 컨텍스트 설정 패턴
- **[다중 컨텍스트 설정](./multi-context-setup.md)** - 복잡한 아키텍처 설정
- **[프로바이더 구성](../store/withProvider-pattern.md)** - 고급 프로바이더 패턴