# useStoreManager API

`useStoreManager` 훅은 선언적 스토어 패턴에서 고급 스토어 관리 시나리오를 위한 내부 StoreManager 인스턴스에 대한 저레벨 접근을 제공합니다.

## 사전 요구사항

기본 스토어 설정과 컨텍스트 생성은 **[기본 스토어 설정](../setup/basic-store-setup.md)** 을 참조하세요.

이 문서는 스토어 설정을 사용한 API 사용법을 보여줍니다:
- 스토어 설정 → [타입 추론 설정](../setup/basic-store-setup.md#type-inference-configurations)
- 컨텍스트 생성 → [단일 도메인 스토어 컨텍스트](../setup/basic-store-setup.md#single-domain-store-context)

## 기본 사용법

### 스토어 매니저 가져오기

```tsx
import { createDeclarativeStorePattern, useStoreValue } from '@context-action/react';

// 설정 가이드에서 확립된 스토어 패턴 사용
const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager
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

function MyComponent() {
  const manager = useUserStoreManager();
  
  // 설정 패턴을 사용하여 스토어 인스턴스를 직접 가져오기
  const profileStore = manager.getStore('profile');
  const preferencesStore = manager.getStore('preferences');
  
  // 여기서 컴포넌트 로직
}
```

### 스토어 작업

```tsx
function UserManager() {
  const manager = useUserStoreManager();
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  
  const updateUserName = (newName: string) => {
    const profileStore = manager.getStore('profile');
    const currentProfile = profileStore.getValue();
    profileStore.setValue({ ...currentProfile, name: newName });
  };
  
  const updateUserEmail = (newEmail: string) => {
    const profileStore = manager.getStore('profile');
    profileStore.update(current => ({ ...current, email: newEmail }));
  };
  
  return (
    <div>
      <input 
        value={profile.name}
        onChange={e => updateUserName(e.target.value)}
      />
      <input 
        value={profile.email}
        onChange={e => updateUserEmail(e.target.value)}
      />
    </div>
  );
}
```

## API 참조

### manager.getStore(storeName)

이름으로 타입이 지정된 스토어 인스턴스를 가져옵니다. 이것은 스토어에 접근하는 주요 메소드입니다.

```tsx
const manager = useUserStoreManager();

// 완전한 타입 안전성을 가진 스토어 인스턴스 가져오기
const profileStore = manager.getStore('profile');     // Store<UserProfile>
const preferencesStore = manager.getStore('preferences'); // Store<UserPreferences>
const sessionStore = manager.getStore('session');     // Store<UserSession>

// 스토어 메소드 직접 사용
const currentProfile = profileStore.getValue();
profileStore.setValue(newProfile);
profileStore.update(profile => ({ ...profile, name: 'John' }));
```

### 스토어 인스턴스 메소드

스토어 인스턴스를 가져온 후에는 다음 메소드를 사용할 수 있습니다:

```tsx
const profileStore = manager.getStore('profile');

// 현재 값 가져오기
const currentProfile = profileStore.getValue();

// 새 값을 직접 설정
profileStore.setValue({ id: '123', name: 'John', email: 'john@example.com', role: 'user' });

// 함수로 업데이트
profileStore.update(current => ({
  ...current,
  name: 'John Doe'
}));

// 변경사항 구독
const unsubscribe = profileStore.subscribe((newValue, previousValue) => {
  console.log('프로필 변경됨:', { newValue, previousValue });
});

// 초기값으로 재설정
profileStore.reset();
```

### 매니저 유틸리티 메소드

```tsx
const manager = useUserStoreManager();

// 매니저 정보 가져오기
const info = manager.getInfo();
console.log(info); // { name: 'User', storeCount: 3, availableStores: ['profile', 'preferences', 'session'] }

// 모든 스토어 지우기 (고급 사용 사례)
manager.clear();
```

## 고급 패턴

### 벌크 스토어 작업

```tsx
function BulkOperations() {
  const manager = useUserStoreManager();
  
  const handleBulkUpdate = async () => {
    // 순서대로 여러 스토어 업데이트
    const profileStore = manager.getStore('profile');
    const preferencesStore = manager.getStore('preferences');
    const sessionStore = manager.getStore('session');
    
    profileStore.setValue({ id: '123', name: 'John Doe', email: 'john@example.com', role: 'user' });
    preferencesStore.update(current => ({ ...current, theme: 'dark' }));
    sessionStore.update(current => ({ 
      ...current, 
      isAuthenticated: true,
      lastActivity: Date.now()
    }));
  };
  
  const handleResetAll = () => {
    // 모든 스토어를 초기값으로 재설정
    const profileStore = manager.getStore('profile');
    const preferencesStore = manager.getStore('preferences');
    const sessionStore = manager.getStore('session');
    
    profileStore.reset();
    preferencesStore.reset();
    sessionStore.reset();
  };
  
  return (
    <div>
      <button onClick={handleBulkUpdate}>모두 업데이트</button>
      <button onClick={handleResetAll}>모두 재설정</button>
    </div>
  );
}
```

### 조건부 스토어 업데이트

```tsx
function ConditionalUpdates() {
  const manager = useUserStoreManager();
  
  const updateProfileIfValid = (newProfile: UserProfile) => {
    const profileStore = manager.getStore('profile');
    const currentProfile = profileStore.getValue();
    
    // 프로필이 다른 경우에만 업데이트
    if (JSON.stringify(currentProfile) !== JSON.stringify(newProfile)) {
      profileStore.setValue(newProfile);
    }
  };
  
  const updatePreferencesIfAllowed = (newPreferences: UserPreferences) => {
    const profileStore = manager.getStore('profile');
    const preferencesStore = manager.getStore('preferences');
    const profile = profileStore.getValue();
    
    // 사용자가 권한을 가진 경우에만 업데이트
    if (profile.role === 'admin') {
      preferencesStore.setValue(newPreferences);
    }
  };
  
  return (
    <div>
      {/* 컴포넌트 JSX */}
    </div>
  );
}
```

### 검증이 있는 스토어 매니저

```tsx
function ValidatedStoreManager() {
  const manager = useUserStoreManager();
  
  const updateProfileWithValidation = (updates: Partial<UserProfile>) => {
    const profileStore = manager.getStore('profile');
    const currentProfile = profileStore.getValue();
    const newProfile = { ...currentProfile, ...updates };
    
    // 업데이트 전 검증
    if (isValidProfile(newProfile)) {
      profileStore.setValue(newProfile);
      return { success: true };
    } else {
      return { success: false, error: '유효하지 않은 프로필 데이터' };
    }
  };
  
  const updatePreferencesWithDefaults = (preferences: Partial<UserPreferences>) => {
    const preferencesStore = manager.getStore('preferences');
    preferencesStore.update(current => ({
      // 먼저 기본값 적용
      theme: 'light',
      notifications: true,
      language: 'en',
      // 그 다음 업데이트 적용
      ...current,
      ...preferences
    }));
  };
  
  return (
    <div>
      {/* 컴포넌트 JSX */}
    </div>
  );
}
```

## 액션과의 통합

스토어 매니저는 복잡한 비즈니스 로직을 위해 액션 컨텍스트와 완벽하게 작동합니다:

```tsx
// 스토어 매니저를 사용한 액션 핸들러
function UserActions() {
  const manager = useUserStoreManager();
  
  useEventActionHandler('updateUserProfile', async (payload) => {
    const profileStore = manager.getStore('profile');
    const preferencesStore = manager.getStore('preferences');
    const currentProfile = profileStore.getValue();
    
    // 비즈니스 로직
    const updatedProfile = await processUserUpdate(currentProfile, payload);
    
    // 스토어 업데이트
    profileStore.setValue(updatedProfile);
    preferencesStore.update(preferences => ({
      ...preferences,
      language: updatedProfile.role === 'admin' ? 'en' : preferences.language
    }));
  });
  
  return null; // 이것은 로직 전용 컴포넌트
}
```

## 성능 고려사항

### 배치 업데이트

```tsx
function OptimizedUpdates() {
  const manager = useUserStoreManager();
  
  const handleBatchUpdate = () => {
    // 이러한 업데이트는 순서대로 발생하지만 최적화됨
    React.unstable_batchedUpdates(() => {
      const profileStore = manager.getStore('profile');
      const preferencesStore = manager.getStore('preferences');
      const sessionStore = manager.getStore('session');
      
      profileStore.setValue(newProfile);
      preferencesStore.setValue(newPreferences);
      sessionStore.setValue(newSession);
    });
  };
  
  return (
    <button onClick={handleBatchUpdate}>
      여러 스토어 업데이트
    </button>
  );
}
```

### 메모이제이션된 업데이트

```tsx
function MemoizedUpdates() {
  const manager = useUserStoreManager();
  
  const updateProfileMemoized = useCallback((updates: Partial<UserProfile>) => {
    const profileStore = manager.getStore('profile');
    profileStore.update(current => ({ ...current, ...updates }));
  }, [manager]);
  
  const resetProfileMemoized = useCallback(() => {
    const profileStore = manager.getStore('profile');
    profileStore.reset();
  }, [manager]);
  
  return (
    <UserForm 
      onUpdate={updateProfileMemoized}
      onReset={resetProfileMemoized}
    />
  );
}
```

## 오류 처리

### 안전한 스토어 작업

```tsx
function SafeStoreManager() {
  const manager = useUserStoreManager();
  
  const safeUpdateStore = <K extends keyof UserStores>(
    storeName: K, 
    value: UserStores[K]
  ) => {
    try {
      const store = manager.getStore(storeName);
      store.setValue(value);
      return { success: true };
    } catch (error) {
      console.error(`스토어 ${String(storeName)} 업데이트 실패:`, error);
      return { success: false, error };
    }
  };
  
  const safeGetStoreValue = <K extends keyof UserStores>(storeName: K) => {
    try {
      const store = manager.getStore(storeName);
      return { success: true, value: store.getValue() };
    } catch (error) {
      console.error(`스토어 ${String(storeName)} 가져오기 실패:`, error);
      return { success: false, error };
    }
  };
  
  return (
    <div>
      {/* 컴포넌트 JSX */}
    </div>
  );
}
```

## TypeScript 지원

스토어 매니저는 완전한 타입 안전성을 제공합니다:

```tsx
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
}

interface UserPreferences {
  theme: 'light' | 'dark';
  language: 'en' | 'ko' | 'ja' | 'zh';
  notifications: boolean;
}

interface UserSession {
  isAuthenticated: boolean;
  permissions: string[];
  lastActivity: number;
}

const {
  useStoreManager: useUserStoreManager
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

function TypeSafeComponent() {
  const manager = useUserStoreManager();
  
  // TypeScript는 각 스토어의 정확한 타입을 알고 있음
  const updateProfile = (profile: UserProfile) => {
    const profileStore = manager.getStore('profile'); // Store<UserProfile> 반환
    profileStore.setValue(profile); // ✅ 타입 안전
    // profileStore.setValue('invalid'); // ❌ TypeScript 오류
  };
  
  const getProfileData = () => {
    const profileStore = manager.getStore('profile'); // Store<UserProfile> 반환
    return profileStore.getValue(); // UserProfile 반환
  };
  
  return <div>{/* 컴포넌트 JSX */}</div>;
}
```

## 모범 사례

### 1. 복잡한 상태에 함수형 업데이트 사용

```tsx
const manager = useUserStoreManager();

// ✅ 좋음: 함수형 업데이트
const sessionStore = manager.getStore('session');
sessionStore.update(session => ({
  ...session,
  permissions: session.permissions.includes('read') 
    ? session.permissions 
    : [...session.permissions, 'read']
}));

// ❌ 피해야 함: 현재 상태를 별도로 읽기
const session = sessionStore.getValue();
sessionStore.setValue({
  ...session,
  permissions: [...session.permissions, 'read']
});
```

### 2. 성능을 위해 useCallback과 결합

```tsx
const manager = useUserStoreManager();

const updateProfileName = useCallback((name: string) => {
  const profileStore = manager.getStore('profile');
  profileStore.update(profile => ({ ...profile, name }));
}, [manager]);
```

### 3. 관련 업데이트에 스토어 매니저 사용

```tsx
const manager = useUserStoreManager();

const handleUserLogin = useCallback(async (credentials) => {
  const user = await login(credentials);
  
  // 관련 스토어를 함께 업데이트
  const profileStore = manager.getStore('profile');
  const sessionStore = manager.getStore('session');
  
  profileStore.setValue({ id: user.id, name: user.name, email: user.email, role: user.role });
  sessionStore.update(session => ({
    ...session,
    isAuthenticated: true,
    lastActivity: Date.now(),
    permissions: user.permissions
  }));
}, [manager]);
```

### 4. useStore 훅보다 직접 스토어 접근을 선호

```tsx
// ✅ 좋음: 여러 작업에 매니저 사용
const manager = useUserStoreManager();
const profileStore = manager.getStore('profile');
const preferencesStore = manager.getStore('preferences');

// 효율적으로 여러 작업 수행
profileStore.setValue(newProfile);
preferencesStore.update(preferences => ({ ...preferences, language: 'en' }));

// ❌ 덜 효율적: 여러 훅 호출
const profileStore = useUserStore('profile');
const preferencesStore = useUserStore('preferences');
```

## 실제 예제

- [사용자 프로필 관리](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/UserProfileDemo.tsx)
- [쇼핑 카트 작업](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/CartDemo.tsx)
- [설정 패널](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/SettingsDemo.tsx)

## 스토어 매니저 사용 시기

### 스토어 매니저를 사용해야 하는 경우:
- **여러 스토어 작업**: 하나의 함수에서 여러 스토어를 업데이트해야 할 때
- **고급 스토어 로직**: 직접 스토어 접근이 필요한 복잡한 상태 조작
- **성능 최적화**: 배치 작업이나 여러 훅 호출 피하기
- **액션 핸들러**: 여러 스토어에 걸친 비즈니스 로직
- **커스텀 스토어 유틸리티**: 재사용 가능한 스토어 조작 함수 구축

### 일반 훅을 사용해야 하는 경우:
- **간단한 상태 접근**: 단일 스토어 읽기나 업데이트만
- **컴포넌트 렌더링**: 반응형 UI 업데이트를 위한 `useStoreValue` 사용
- **기본 작업**: 간단한 setValue/getValue 작업

## 관련 문서

- [기본 스토어 사용법](./basic-usage.md) - 기본 스토어 패턴
- [useStoreValue 패턴](./useStoreValue-patterns.md) - 고급 훅 패턴
- [withProvider 패턴](./withProvider-pattern.md) - 고차 컴포넌트 패턴
- [액션 통합](../action/basic-usage.md) - 액션과의 통합