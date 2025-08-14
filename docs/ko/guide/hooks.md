# React 훅

Context-Action은 액션 디스패칭과 스토어 관리를 위한 React 훅을 제공합니다.

## 필수 훅

가장 자주 사용할 핵심 훅들입니다.

### 액션 훅

#### `createActionContext<T>()`
모든 액션 관련 훅을 생성하는 팩토리 함수.

```tsx
import { createActionContext } from '@context-action/react';

interface UserActions {
  updateProfile: { name: string; email: string };
  logout: void;
}

const { 
  Provider: UserActionProvider,
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('UserActions');
```

#### `useActionDispatch()`
핸들러에 액션을 디스패치하는 주요 훅.

```tsx
function UserComponent() {
  const dispatch = useUserAction();
  
  const handleUpdate = () => {
    dispatch('updateProfile', { 
      name: '홍길동', 
      email: 'hong@example.com' 
    });
  };
  
  return <button onClick={handleUpdate}>프로필 업데이트</button>;
}
```

#### `useActionHandler()`
액션 핸들러를 등록하는 주요 훅.

```tsx
function UserComponent() {
  const dispatch = useUserAction();
  
  // updateProfile 액션에 대한 핸들러 등록
  useUserActionHandler('updateProfile', useCallback(async (payload) => {
    try {
      await updateUserProfile(payload);
      console.log('프로필이 성공적으로 업데이트되었습니다');
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
    }
  }, []));
  
  return <div>사용자 프로필 컴포넌트</div>;
}
```

### 스토어 훅

#### `createDeclarativeStorePattern<T>()`
모든 스토어 관련 훅을 생성하는 팩토리 함수.

```tsx
import { createDeclarativeStorePattern } from '@context-action/react';

const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager
} = createDeclarativeStorePattern('User', {
  profile: { initialValue: { id: '', name: '', email: '' } },
  settings: { initialValue: { theme: 'light', notifications: true } }
});
```

#### `useStoreValue<T>(store)`
스토어 변경 사항을 구독하는 주요 훅.

```tsx
import { useStoreValue } from '@context-action/react';

function UserProfile() {
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  
  return (
    <div>
      <h1>{profile.name}</h1>
      <p>{profile.email}</p>
    </div>
  );
}
```

#### `useStore(name)`
이름으로 스토어에 접근하는 주요 훅.

```tsx
function UserSettings() {
  const profileStore = useUserStore('profile');
  const settingsStore = useUserStore('settings');
  
  const profile = useStoreValue(profileStore);
  const settings = useStoreValue(settingsStore);
  
  return (
    <div>
      <p>사용자: {profile.name}</p>
      <p>테마: {settings.theme}</p>
    </div>
  );
}
```

## 유틸리티 훅

고급 시나리오를 위한 추가 훅들.

### 스토어 관리

#### `useStoreManager()`
프로그래밍 방식으로 스토어를 업데이트하는 훅.

```tsx
function UserManager() {
  const { updateStore, resetStore } = useUserStoreManager();
  
  const updateUserName = (newName: string) => {
    updateStore('profile', prevProfile => ({
      ...prevProfile,
      name: newName
    }));
  };
  
  const resetProfile = () => {
    resetStore('profile');
  };
  
  return (
    <div>
      <button onClick={() => updateUserName('새로운 이름')}>
        이름 업데이트
      </button>
      <button onClick={resetProfile}>
        프로필 재설정
      </button>
    </div>
  );
}
```

### 고급 액션 훅

#### `useActionDispatchWithResult()`
디스패치와 결과 수집 기능을 모두 제공하는 훅.

```tsx
function AdvancedUserComponent() {
  const { 
    dispatch, 
    dispatchWithResult, 
    abortAll 
  } = useActionDispatchWithResult();
  
  const handleAsyncAction = async () => {
    try {
      const result = await dispatchWithResult('updateProfile', {
        name: '홍길동',
        email: 'hong@example.com'
      });
      
      if (result.success) {
        console.log('모든 핸들러가 성공적으로 완료되었습니다');
      } else {
        console.error('일부 핸들러가 실패했습니다:', result.errors);
      }
    } catch (error) {
      console.error('액션 실패:', error);
    }
  };
  
  return (
    <div>
      <button onClick={handleAsyncAction}>
        결과와 함께 업데이트
      </button>
      <button onClick={abortAll}>
        모든 액션 중단
      </button>
    </div>
  );
}
```

## 사용 가이드라인

### 모범 사례

1. **핸들러에 useCallback 사용**:
```tsx
useUserActionHandler('updateProfile', useCallback(async (payload) => {
  // 핸들러 로직
}, [])); // 안정적인 핸들러를 위한 빈 의존성 배열
```

2. **필요할 때 패턴 조합**:
```tsx
function App() {
  return (
    <UserStoreProvider>
      <UserActionProvider>
        <UserComponent />
      </UserActionProvider>
    </UserStoreProvider>
  );
}
```

3. **타입 안전한 스토어 접근**:
```tsx
const profileStore = useUserStore('profile'); // 타입 안전
const profile = useStoreValue(profileStore);   // 타입 안전
```

### 성능 팁

- 스토어 구독은 실제 값 변경 시에만 다시 렌더링됩니다
- 전체 상태를 구독하는 대신 특정 스토어 구독을 사용하세요
- 핸들러 등록은 최소한의 다시 렌더링에 최적화되어 있습니다
- 액션 디스패칭은 자동으로 메모이제이션됩니다