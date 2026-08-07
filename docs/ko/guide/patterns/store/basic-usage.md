# 스토어 기본 사용법

뛰어난 타입 추론과 간단한 API를 제공하는 기본 스토어 전용 패턴.

## 가져오기
```typescript
import { useStoreValue } from '@context-action/react';
import { useUserStore, useUserStoreManager } from '../setup/stores'; // 설정 가이드에서
```

## 주요 기능
- ✅ 수동 타입 어노테이션 없이 뛰어난 타입 추론
- ✅ 스토어 관리에 집중된 간단한 API
- ✅ 직접 값 또는 설정 객체 지원
- ✅ 별도의 `createStore` 호출 불필요

## 사전 요구사항

스토어 정의, 컨텍스트 생성, 프로바이더 설정을 포함한 완전한 설정 지침은 **[기본 스토어 설정](../setup/basic-store-setup.md)** 을 참조하세요.

이 문서는 스토어 설정을 사용한 사용 패턴을 보여줍니다:
- 스토어 정의 → [타입 추론 설정](../setup/basic-store-setup.md#type-inference-configurations)
- 컨텍스트 생성 → [단일 도메인 스토어 컨텍스트](../setup/basic-store-setup.md#single-domain-store-context)
- 프로바이더 설정 → [단일 프로바이더 설정](../setup/basic-store-setup.md#single-provider-setup)

## 사용 패턴

### 기본 스토어 접근 패턴
```tsx
// 설정 가이드에서 구성된 스토어를 사용한 컴포넌트 구현
function UserProfile() {
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');
  
  const profile = useStoreValue(profileStore);
  const preferences = useStoreValue(preferencesStore);
  
  const updateProfile = () => {
    profileStore.setValue({ id: '1', name: 'John', email: 'john@example.com', role: 'user' });
  };
  
  const toggleTheme = () => {
    preferencesStore.update(prefs => ({
      ...prefs,
      theme: prefs.theme === 'light' ? 'dark' : 'light'
    }));
  };
  
  return (
    <div data-theme={preferences.theme}>
      <h2>{profile.name || 'Guest'}</h2>
      <p>테마: {preferences.theme}</p>
      <button onClick={updateProfile}>프로필 업데이트</button>
      <button onClick={toggleTheme}>테마 전환</button>
    </div>
  );
}
```

### 명시적 제네릭 타입 패턴
```tsx
// 타입 검증을 위한 설정 가이드의 UserStores 인터페이스 사용
import type { UserStores } from '../setup/basic-store-setup';

// UserStores 명세를 사용한 명시적 타입 제어로 스토어 생성
const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager
} = createStoreContext<UserStores>('User', {
  // UserStores 인터페이스에 대해 검증된 타입
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

## 프로바이더 설정

```tsx
// 설정 가이드의 UserStoreProvider 사용
import { UserStoreProvider } from '../setup/stores';

function App() {
  return (
    <UserStoreProvider>
      <UserProfile />
      <Settings />
    </UserStoreProvider>
  );
}
```

## 컴포넌트 사용법

```tsx
function UserProfile() {
  // 완벽한 타입 추론 - 수동 타입 어노테이션 불필요!
  // 설정 가이드에서 이름이 변경된 훅 사용
  const profileStore = useUserStore('profile');      // Store<UserProfile>
  const preferencesStore = useUserStore('preferences'); // Store<UserPreferences>
  const sessionStore = useUserStore('session');      // Store<UserSession>
  
  // 값 구독
  const profile = useStoreValue(profileStore);
  const preferences = useStoreValue(preferencesStore);
  const session = useStoreValue(sessionStore);
  
  const updateProfile = () => {
    profileStore.setValue({
      ...profile,
      name: 'John Doe',
      email: 'john@example.com'
    });
  };
  
  const toggleTheme = () => {
    preferencesStore.setValue({
      ...preferences,
      theme: preferences.theme === 'light' ? 'dark' : 'light'
    });
  };
  
  const logout = () => {
    sessionStore.setValue({
      isAuthenticated: false,
      permissions: [],
      lastActivity: Date.now()
    });
  };
  
  return (
    <div data-theme={preferences.theme}>
      <div>사용자: {profile.name} ({profile.email})</div>
      <div>역할: {profile.role}</div>
      <div>테마: {preferences.theme}</div>
      <div>언어: {preferences.language}</div>
      <div>인증됨: {session.isAuthenticated ? '예' : '아니오'}</div>
      
      <button onClick={updateProfile}>프로필 업데이트</button>
      <button onClick={toggleTheme}>테마 전환</button>
      <button onClick={logout}>로그아웃</button>
    </div>
  );
}
```

## 사용 가능한 훅
- `useUserStore(name)` - 이름으로 타입이 지정된 사용자 도메인 스토어 가져오기 (주요 API)
- `useUserStoreManager()` - 사용자 스토어 매니저 접근 (고급 사용)
- `useStoreInfo()` - 반응형 레지스트리 정보 가져오기 (스토어 생성·초기화 시 갱신)
- `useStoreClear()` - 모든 스토어 지우기 (설정 컨텍스트에서)

## 실제 예제

### 코드베이스의 라이브 예제
- **[할 일 목록 데모](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/TodoListDemo.tsx)** - 필터링 및 정렬이 있는 완전한 CRUD
- **[채팅 데모](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/ChatDemo.tsx)** - 실시간 메시지 상태 관리
- **[사용자 프로필 데모](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/UserProfileDemo.tsx)** - 프로필 데이터 관리
- **[스토어 기본 페이지](https://github.com/mineclover/context-action/blob/main/example/src/pages/store/StoreBasicsPage.tsx)** - 기본 스토어 작업
- **[React 프로바이더 페이지](https://github.com/mineclover/context-action/blob/main/example/src/pages/react/ReactProviderPage.tsx)** - 프로바이더 구성 패턴
- **[스토어 시나리오 인덱스](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/stores/index.ts)** - 중앙 스토어 설정

## 모범 사례

1. **타입 추론 사용**: TypeScript가 자동으로 타입을 추론하도록 하기
2. **직접 값**: 간단한 타입에는 직접 값 사용
3. **설정 객체**: 복잡한 타입에는 설정 객체 사용
4. **도메인 명명**: 컨텍스트에 설명적인 도메인 이름 사용
5. **구독 관리**: 불필요한 재렌더링 방지를 위해 실제로 필요한 스토어만 구독

```typescript
// ✅ 좋음 - 이름이 변경된 훅을 사용한 함수형 업데이트 패턴
const updateProfile = useCallback(() => {
  const profileStore = useUserStore('profile');
  profileStore.update(prev => ({
    ...prev,
    name: '업데이트된 이름',
    email: 'updated@example.com'
  }));
}, []);

// ✅ 좋음 - 이름이 변경된 훅을 사용하여 필요한 스토어만 구독
const profileName = useStoreValue(useUserStore('profile')).name; // 프로필 변경만 구독
const currentTheme = useStoreValue(useUserStore('preferences')).theme; // 테마 업데이트만
// 특정 값만 필요한 경우 모든 스토어를 구독하지 마세요
```
