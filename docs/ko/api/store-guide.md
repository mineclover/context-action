# `Store` 클래스 가이드

메모리 누수 방지 및 React 통합을 통한 핵심 반응형 상태 관리입니다.

## 목적
반응형 구독, 불변 상태 관리 및 포괄적인 리소스 정리를 제공하는 중앙 스토어 구현입니다.

## 클래스 구조

### 생성자
```typescript
new Store<T>(name: string, initialValue: T): Store<T>
```
- **목적**: 초기값을 가진 명명된 스토어 생성
- **용도**: 직접 인스턴스화 또는 스토어 컨텍스트 패턴을 통해

## 핵심 메서드

### 상태 접근
```typescript
getValue(): T                    // 액션 핸들러 - 현재 값 복사본
getValueUnsafe(): T             // 성능 - 직접 참조 (주의해서 사용)
getSnapshot(): Snapshot<T>      // React 통합 - 불변 스냅샷
```

### 상태 수정
```typescript
setValue(value: T, options?: StoreSetValueOptions<T>): void
update(updater: (current: T) => T): void
```

### 구독
```typescript
subscribe(listener: Listener): Unsubscribe
getListenerCount(): number
clearListeners(): void
```

## 사용 패턴

### 기본 스토어 작업
```typescript
const userStore = new Store('user', { name: '', email: '' });

// 현재 값 읽기 (액션 핸들러용)
const currentUser = userStore.getValue();

// 전체 값 업데이트
userStore.setValue({ name: 'John', email: 'john@example.com' });

// 함수로 업데이트
userStore.update(user => ({ ...user, name: 'Jane' }));
```

### React 통합
```typescript
function UserComponent() {
  const userStore = useAppStore('user');
  
  // 변경 구독 (자동 리렌더링)
  const user = useStoreValue(userStore);
  
  const updateName = (name: string) => {
    userStore.update(current => ({ ...current, name }));
  };
  
  return <div>{user.name}</div>;
}
```

### 액션 핸들러 통합
```typescript
// 스토어 통합 패턴: 읽기 → 로직 → 업데이트
useActionHandler('updateProfile', async (payload, controller) => {
  // 1단계: 현재 상태 읽기
  const currentProfile = profileStore.getValue();
  
  // 2단계: 비즈니스 로직 실행
  const updatedProfile = {
    ...currentProfile,
    ...payload,
    lastUpdated: Date.now()
  };
  
  // 3단계: 스토어 업데이트
  profileStore.setValue(updatedProfile);
});
```

### 구독 관리
```typescript
const unsubscribe = userStore.subscribe(() => {
  console.log('사용자 변경됨:', userStore.getValue());
});

// 수동 정리
unsubscribe();

// React를 사용한 자동 정리
useEffect(() => {
  const unsubscribe = userStore.subscribe(handleUserChange);
  return unsubscribe; // 언마운트 시 정리
}, [userStore]);
```

## 고급 기능

### 메모리 관리
```typescript
// 정리 작업 등록
const timer = setInterval(() => updateStats(), 1000);
const unregisterCleanup = userStore.registerCleanup(() => {
  clearInterval(timer);
  console.log('타이머 정리됨');
});

// 폐기 시 정리 작업 자동 실행
userStore.dispose();
```

### 성능 최적화
```typescript
// 성능에 중요한 스토어의 경우 복제 비활성화
userStore.setCloningEnabled(false);

// 사용자 정의 비교 로직
userStore.setCustomComparator((oldValue, newValue) => {
  return oldValue.id === newValue.id && oldValue.version === newValue.version;
});

// 비교 옵션
userStore.setComparisonOptions({
  strategy: 'shallow', // 'deep' | 'reference' | 'shallow'
  maxDepth: 2
});
```

### 알림 제어
```typescript
// 테스트/디버깅용
userStore.setNotificationMode('immediate'); // 또는 'batched'

// 현재 모드 확인
const mode = userStore.getNotificationMode();
```

## 스토어 생성 패턴

### 컨텍스트 패턴 (권장)
```typescript
const AppStores = createStoreContext('App', {
  user: { name: '', email: '' },
  settings: { theme: 'light', notifications: true }
});

function Component() {
  const userStore = AppStores.useStore('user');
  // 스토어 인스턴스는 컨텍스트에 의해 관리됨
}
```

### 직접 생성
```typescript
const userStore = new Store('user', { name: '', email: '' });

// 수동 폐기 필요
useEffect(() => {
  return () => userStore.dispose();
}, []);
```

### 팩토리 패턴
```typescript
function createUserStore(initialUser: User) {
  const store = new Store('user', initialUser);
  
  // 스토어 구성
  store.setComparisonOptions({ strategy: 'shallow' });
  
  // 정리 등록
  store.registerCleanup(() => {
    console.log('사용자 스토어 폐기됨');
  });
  
  return store;
}
```

## 상태 업데이트 전략

### 불변 업데이트 (기본값)
```typescript
// 복제와 함께 setValue (안전)
userStore.setValue({ ...user, name: 'Updated' });

// Immer 통합과 함께 update
userStore.update(draft => {
  draft.name = 'Updated'; // Immer가 불변성 처리
});
```

### 성능 업데이트
```typescript
// 신뢰할 수 있는 업데이트를 위해 복제 비활성화
userStore.setCloningEnabled(false);
userStore.setValue(newUserObject); // 직접 참조 (더 빠름)

// 안전을 위해 다시 활성화
userStore.setCloningEnabled(true);
```

### 조건부 업데이트
```typescript
userStore.setValue(newUser, {
  skipNotification: false,          // 알림 제어
  forceUpdate: false,              // 값이 같더라도 강제 업데이트
  customComparator: (old, new) => old.id !== new.id
});
```

## 통합 패턴

### 액션 핸들러와 함께
```typescript
// 핸들러에서 현재 상태 읽기
const handleUserUpdate = async (payload: UserUpdate) => {
  const currentUser = userStore.getValue();
  const updatedUser = { ...currentUser, ...payload };
  userStore.setValue(updatedUser);
};
```

### React 컴포넌트와 함께
```typescript
function UserProfile() {
  const userStore = AppStores.useStore('user');
  const user = useStoreValue(userStore);
  
  return (
    <div>
      <input 
        value={user.name}
        onChange={(e) => userStore.update(u => ({ ...u, name: e.target.value }))}
      />
    </div>
  );
}
```

### 사용자 정의 훅과 함께
```typescript
function useUserActions() {
  const userStore = AppStores.useStore('user');
  
  return {
    updateName: (name: string) => userStore.update(u => ({ ...u, name })),
    updateEmail: (email: string) => userStore.update(u => ({ ...u, email })),
    reset: () => userStore.setValue({ name: '', email: '' })
  };
}
```

## 리소스 관리

### 자동 정리
```typescript
const store = new Store('data', []);

// 정리할 리소스 등록
const interval = setInterval(() => fetchData(), 5000);
store.registerCleanup(() => clearInterval(interval));

const websocket = new WebSocket('ws://...');
store.registerCleanup(() => websocket.close());

// 모든 정리 작업은 폐기 시 실행
store.dispose(); // 인터벌 정리, 웹소켓 닫기, 리스너 제거
```

### 메모리 누수 방지
```typescript
// 스토어가 폐기되었는지 확인
if (store.isStoreDisposed()) {
  console.warn('스토어가 이미 폐기되었습니다');
  return;
}

// 리스너 수 모니터링
console.log('활성 리스너:', store.getListenerCount());

// 모든 리스너 수동으로 정리
store.clearListeners();
```

### React 컴포넌트 통합
```typescript
function DataComponent() {
  const [store] = useState(() => new Store('local', initialData));
  
  // 자동 폐기 on unmount
  useEffect(() => {
    return () => store.dispose();
  }, [store]);
  
  const data = useStoreValue(store);
  return <div>{data.length} items</div>;
}
```

## 성능 고려 사항

- **getValue()**: 복사본 생성 (핸들러에 안전)
- **getValueUnsafe()**: 직접 참조 (성능에 중요한 경우에만)
- **update()**: 안전한 변형을 위해 Immer 사용
- **setValue()**: 구성 가능한 복제 및 비교
- **subscribe()**: 효율적인 리스너 관리와 정리
- **dispose()**: 완벽한 리소스 정리

## 오류 처리

```typescript
// 오류 처리를 통한 안전한 구독
const unsubscribe = store.subscribe(() => {
  try {
    handleStoreChange(store.getValue());
  } catch (error) {
    console.error('스토어 변경 핸들러 오류:', error);
  }
});

// 작업 전에 폐기 여부 확인
function updateStore(value: T) {
  if (store.isStoreDisposed()) {
    console.warn('폐기된 스토어는 업데이트할 수 없습니다');
    return;
  }
  
  store.setValue(value);
}
```

## 링크

- **TypeDoc**: [Store.md](./react/src/classes/Store.md)
- **useStoreValue 가이드**: [useStoreValue 가이드](./usestorevalue-guide.md)
- **스토어 패턴**: [스토어 패턴](/en/guide/patterns/store/)
