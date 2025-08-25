# withProvider 패턴

스토어 전용 패턴에서 자동 프로바이더 래핑을 위한 `withProvider`를 사용한 고차 컴포넌트 패턴.

## 사전 요구사항

이 패턴을 사용하기 전에 스토어 컨텍스트를 설정해야 합니다. 완전한 설정을 위해 다음 가이드를 참조하세요:

- **[기본 스토어 설정](../setup/basic-store-setup.md)** - 스토어 컨텍스트 생성 패턴
- **[프로바이더 구성 설정](../setup/provider-composition-setup.md)** - 고급 프로바이더 구성 유틸리티

## 개요

HOC (고차 컴포넌트) 패턴은 자동 프로바이더 래핑을 제공하여 컴포넌트 트리에서 수동 프로바이더 구성의 필요성을 제거합니다.

## 기본 HOC 사용법

```tsx
// 완전한 스토어 컨텍스트 설정
const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useStoreManager: useAppStoreManager,
  withProvider: withAppStoreProvider
} = createDeclarativeStorePattern('App', {
  user: {
    initialValue: { id: '', name: '', email: '' },
    strategy: 'shallow' as const
  },
  settings: {
    initialValue: { theme: 'light' as const, notifications: true },
    strategy: 'shallow' as const
  }
});

// HOC로 자동 프로바이더 래핑
const AppWithStores = withAppStoreProvider(App);

// 수동 프로바이더 래핑 없이 어디서든 사용
function Root() {
  return <AppWithStores />;
}
```

## 고급 HOC 설정

```tsx
// 커스텀 레지스트리 ID와 함께
const AppWithCustomStores = withAppStoreProvider(App, {
  registryId: 'custom-app-stores'
});

// 초기화 콜백과 함께
const AppWithInitializedStores = withAppStoreProvider(App, {
  registryId: 'initialized-stores',
  onMount: (storeManager) => {
    // 스토어 매니저 메소드를 사용하여 마운트 시 스토어 초기화
    const userStore = storeManager.getStore('user');
    const settingsStore = storeManager.getStore('settings');
    
    userStore.setValue({ id: 'default', name: 'Guest', email: 'guest@example.com' });
    settingsStore.update(prev => ({ ...prev, theme: 'dark' }));
  }
});
```

## 다중 HOC 구성

```tsx
// 완전한 설정으로 여러 스토어 컨텍스트 생성
const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager,
  withProvider: withUserStoreProvider
} = createDeclarativeStorePattern('User', {
  profile: {
    initialValue: { id: '', name: '', email: '' },
    strategy: 'shallow' as const
  },
  preferences: {
    initialValue: { theme: 'light' as const, notifications: true },
    strategy: 'shallow' as const
  }
});

const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useStoreManager: useAppStoreManager,
  withProvider: withAppStoreProvider  
} = createDeclarativeStorePattern('App', {
  navigation: {
    initialValue: { currentPage: 'home', history: [] },
    strategy: 'shallow' as const
  },
  modal: {
    initialValue: { isOpen: false, type: undefined, data: undefined },
    strategy: 'shallow' as const
  }
});

// 여러 HOC 구성
const AppWithAllStores = withUserStoreProvider(
  withAppStoreProvider(App)
);

// 또는 내장된 composeProviders 유틸리티 사용 (권장)
import { composeProviders } from '@context-action/react';

// 먼저 프로바이더를 구성
const AllStoreProviders = composeProviders([
  UserStoreProvider,
  AppStoreProvider
]);

// 그 다음 구성된 프로바이더와 함께 HOC를 사용하거나 프로바이더 구성을 직접 사용
function AppRoot() {
  return (
    <AllStoreProviders>
      <App />
    </AllStoreProviders>
  );
}
```

## 조건부 HOC 패턴

```tsx
// 기능 플래그에 기반한 조건부 프로바이더 래핑
function createConditionalHOC(condition: boolean) {
  return condition 
    ? withAppStoreProvider
    : (Component: React.ComponentType) => Component; // 통과
}

// 조건부 HOC 사용
const featureEnabled = process.env.FEATURE_STORES === 'true';
const ConditionalApp = createConditionalHOC(featureEnabled)(App);

// 여러 조건을 가진 고급 조건부 구성
function createAdvancedConditionalProviders(features: {
  userManagement: boolean;
  appFeatures: boolean;
}) {
  const providers = [];
  
  if (features.userManagement) {
    providers.push(UserStoreProvider);
  }
  
  if (features.appFeatures) {
    providers.push(AppStoreProvider);
  }
  
  return providers.length > 0 
    ? composeProviders(providers)
    : ({ children }: { children: React.ReactNode }) => <>{children}</>;
}
```

## 지연 HOC 패턴

```tsx
// 코드 분할을 위한 지연 로드 스토어 프로바이더
const LazyStoreProvider = lazy(() => 
  import('./stores/AppStores').then(module => ({
    default: module.withAppStoreProvider(App)
  }))
);

function LazyApp() {
  return (
    <Suspense fallback={<div>스토어 로딩 중...</div>}>
      <LazyStoreProvider />
    </Suspense>
  );
}

// 대안: 프로바이더 구성과 함께 지연 로드
const LazyComposedStores = lazy(() =>
  import('./stores').then(module => {
    const { UserStoreProvider, AppStoreProvider } = module;
    const ComposedProviders = composeProviders([UserStoreProvider, AppStoreProvider]);
    
    return {
      default: ({ children }: { children: React.ReactNode }) => (
        <ComposedProviders>{children}</ComposedProviders>
      )
    };
  })
);

function LazyComposedApp() {
  return (
    <Suspense fallback={<div>스토어 컨텍스트 로딩 중...</div>}>
      <LazyComposedStores>
        <App />
      </LazyComposedStores>
    </Suspense>
  );
}
```

## Props 전달이 있는 HOC

```tsx
interface AppProps {
  userId: string;
  theme: 'light' | 'dark';
}

// props에 기반하여 스토어를 초기화하는 HOC
function createPropsInitializedHOC<T extends Record<string, any>>(
  withProvider: (component: React.ComponentType<T>, config?: any) => React.ComponentType<T>
) {
  return (Component: React.ComponentType<T>) => {
    return withProvider((props: T) => {
      const appStoreManager = useAppStoreManager();
      
      useEffect(() => {
        // 스토어 매니저를 사용하여 props에 기반한 스토어 초기화
        if ('userId' in props) {
          const userStore = appStoreManager.getStore('user');
          userStore.update(prev => ({ ...prev, id: props.userId }));
        }
        if ('theme' in props) {
          const settingsStore = appStoreManager.getStore('settings');
          settingsStore.update(prev => ({ ...prev, theme: props.theme }));
        }
      }, [props, appStoreManager]);
      
      return <Component {...props} />;
    });
  };
}

const AppWithPropsInit = createPropsInitializedHOC(withAppStoreProvider)(App);

// props와 함께 사용
function Root() {
  return (
    <AppWithPropsInit 
      userId="user123" 
      theme="dark" 
    />
  );
}

// 대안: 프로바이더 구성과 직접 props 통합
function AppWithDirectProps({ userId, theme }: AppProps) {
  return (
    <AllStoreProviders>
      <PropsInitializer userId={userId} theme={theme} />
      <App userId={userId} theme={theme} />
    </AllStoreProviders>
  );
}

function PropsInitializer({ userId, theme }: AppProps) {
  const appStoreManager = useAppStoreManager();
  
  useEffect(() => {
    const userStore = appStoreManager.getStore('user');
    const settingsStore = appStoreManager.getStore('settings');
    
    userStore.update(prev => ({ ...prev, id: userId }));
    settingsStore.update(prev => ({ ...prev, theme }));
  }, [userId, theme, appStoreManager]);
  
  return null; // 이 컴포넌트는 초기화만 처리
}
```

## 모범 사례

1. **단일 책임**: 각 HOC는 하나의 관심사를 처리해야 함
2. **Props 보존**: props가 제대로 전달되는지 확인
3. **타입 안전성**: HOC 구성을 통해 타입 안전성 유지
4. **성능**: HOC를 사용하여 프로바이더 지옥을 피하고 성능 향상
5. **구성**: 복잡한 시나리오를 위해 여러 HOC 구성
6. **지연 로딩**: 큰 애플리케이션을 위해 코드 분할과 함께 사용
7. **설정**: 복잡한 설정을 위해 설정 객체 사용

## 프로바이더 구성과의 통합

withProvider 패턴은 **[프로바이더 구성 설정](../setup/provider-composition-setup.md)** 의 프로바이더 구성 유틸리티와 완벽하게 작동합니다:

### HOC + 구성 하이브리드 패턴

```tsx
// 복잡한 다중 도메인 설정을 위해 프로바이더 구성 사용
const BusinessProviders = composeProviders([
  UserStoreProvider,
  ProductStoreProvider,
  OrderStoreProvider
]);

const UIProviders = composeProviders([
  ThemeStoreProvider,
  ModalStoreProvider,
  NotificationStoreProvider
]);

// 그 다음 컴포넌트 레벨 통합을 위해 HOC 사용
const AppWithBusinessLogic = withBusinessProviders(BusinessApp);
const AppWithUIFeatures = withUIProviders(UIApp);

// 또는 두 접근법 구성
function CompleteApp() {
  return (
    <BusinessProviders>
      <UIProviders>
        <App />
      </UIProviders>
    </BusinessProviders>
  );
}
```

### 프로바이더 구성을 사용한 환경 기반 HOC

```tsx
// 환경별 HOC를 위해 프로바이더 구성 패턴 활용
import { createEnvironmentProviders } from '../setup/provider-composition-setup';

function createEnvironmentHOC(environment: 'development' | 'production' | 'test') {
  const EnvironmentProviders = createEnvironmentProviders(environment);
  
  return (Component: React.ComponentType) => {
    return (props: any) => (
      <EnvironmentProviders>
        <Component {...props} />
      </EnvironmentProviders>
    );
  };
}

const DevelopmentApp = createEnvironmentHOC('development')(App);
const ProductionApp = createEnvironmentHOC('production')(App);
```

## HOC 패턴 사용 시기

- **깔끔한 컴포넌트 트리**: 깊은 프로바이더 중첩 피하기
- **재사용 가능한 컴포넌트**: 일관된 스토어 설정이 필요한 컴포넌트  
- **테스팅**: 자동 프로바이더 래핑으로 컴포넌트 테스트가 쉬워짐
- **큰 애플리케이션**: 복잡한 프로바이더 계층 구조 단순화
- **팀 개발**: 팀 전체에서 스토어 설정 표준화
- **컴포넌트 라이브러리**: 필요한 프로바이더와 함께 컴포넌트 패키징
- **마이크로 프론트엔드**: 컴포넌트 경계 내에서 프로바이더 설정 캡슐화

## 관련 패턴

이 withProvider 패턴은 다음과 통합됩니다:

- **[프로바이더 구성 설정](../setup/provider-composition-setup.md)** - 고급 구성 유틸리티와 패턴
- **[기본 스토어 설정](../setup/basic-store-setup.md)** - 스토어 컨텍스트 생성 패턴  
- **[다중 컨텍스트 설정](../setup/multi-context-setup.md)** - 복잡한 다중 도메인 아키텍처
- **[MVVM 아키텍처](../architecture/mvvm.md)** - 레이어 기반 프로바이더 조직
- **[도메인 컨텍스트 아키텍처](../architecture/domain-context.md)** - 도메인별 프로바이더 그룹화