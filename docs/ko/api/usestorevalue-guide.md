# `useStoreValue` 훅 가이드

타입 안전성을 갖춘 반응형 스토어 값 구독을 위한 필수 훅입니다.

## 목적
자동 리렌더링, 셀렉터 지원 및 널-세이프 접근을 통해 스토어 값을 구독하기 위한 주요 React 훅입니다.

## 함수 시그니처

### 기본 사용법
```typescript
useStoreValue<T>(store: Store<T>, options?: StoreValueOptions<T>): T
```
- **목적**: 전체 스토어 값 구독
- **반환**: 자동 리렌더링을 통한 현재 스토어 값

### 널-세이프 접근
```typescript
useStoreValue<T>(store: undefined | null | Store<T>, options?: StoreValueOptions<T>): undefined | T
```
- **목적**: 선택적/조건부 스토어 안전하게 처리
- **반환**: 스토어가 null/undefined일 경우 `undefined`, 그렇지 않을 경우 값

### 셀렉터 패턴
```typescript
useStoreValue<T, R>(store: Store<T>, selector: (value: T) => R, options?: StoreValueOptions<R>): R
```
- **목적**: 스토어에서 파생/계산된 값 구독
- **반환**: 셀렉터 함수를 사용하여 변환된 값

### 널 안전성을 갖춘 셀렉터
```typescript
useStoreValue<T, R>(store: undefined | null | Store<T>, selector: (value: T) => R, options?: StoreValueOptions<R>): undefined | R
```
- **목적**: 셀렉터 패턴과 널-세이프 접근 결합
- **반환**: `undefined` 또는 셀렉터 결과

## 핵심 기능

### 반응형 구독
```typescript
function UserProfile() {
  const userStore = useUserStore('profile');
  const user = useStoreValue(userStore); // 변경 시 자동 리렌더링
  
  return <div>이름: {user.name}</div>;
}
```

### 셀렉터 성능
```typescript
function UserEmail() {
  const userStore = useUserStore('profile');
  // 이메일이 변경될 때만 리렌더링되며, 다른 사용자 필드는 변경되지 않음
  const email = useStoreValue(userStore, user => user.email);
  
  return <div>이메일: {email}</div>;
}
```

### 널-세이프 패턴
```typescript
function ConditionalProfile({ userStore }: { userStore?: Store<User> }) {
  const user = useStoreValue(userStore); // 스토어가 null이면 undefined 반환
  
  if (!user) return <div>사용자가 로드되지 않았습니다</div>;
  return <div>사용자: {user.name}</div>;
}
```

## 사용 패턴

### 직접 스토어 값
```typescript
const AppStores = createStoreContext('App', {
  counter: 0,
  user: { name: '', email: '' }
});

function Counter() {
  const counterStore = AppStores.useStore('counter');
  const count = useStoreValue(counterStore);
  
  return <div>카운트: {count}</div>;
}
```

### 복합 객체 접근
```typescript
function UserInfo() {
  const userStore = AppStores.useStore('user');
  const user = useStoreValue(userStore);
  
  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

### 최적화된 셀렉터
```typescript
function UserName() {
  const userStore = AppStores.useStore('user');
  // 이름이 변경될 때만 리렌더링되며, 이메일은 변경되지 않음
  const name = useStoreValue(userStore, user => user.name);
  
  return <h1>{name}</h1>;
}

function UserStatus() {
  const userStore = AppStores.useStore('user');
  // 파생된 상태 계산
  const isComplete = useStoreValue(userStore, user => 
    user.name.length > 0 && user.email.includes('@')
  );
  
  return <div>프로필: {isComplete ? '완료' : '미완료'}</div>;
}
```

### 목록 처리
```typescript
const ListStores = createStoreContext('List', {
  items: [] as Array<{ id: string; name: string; active: boolean }>
});

function ActiveItemCount() {
  const itemsStore = ListStores.useStore('items');
  const activeCount = useStoreValue(itemsStore, items => 
    items.filter(item => item.active).length
  );
  
  return <div>활성 항목: {activeCount}</div>;
}

function ItemNames() {
  const itemsStore = ListStores.useStore('items');
  const names = useStoreValue(itemsStore, items => 
    items.map(item => item.name)
  );
  
  return <ul>{names.map(name => <li key={name}>{name}</li>)}</ul>;
}
```

### 조건부 렌더링
```typescript
function ProfileSection() {
  const userStore = AppStores.useStore('user');
  const hasUser = useStoreValue(userStore, user => 
    user.name.length > 0
  );
  
  if (!hasUser) {
    return <div>프로필을 완성해주세요</div>;
  }
  
  return <UserProfile />;
}
```

### 오류 경계
```typescript
function SafeUserDisplay() {
  const userStore = AppStores.useStore('user');
  const displayName = useStoreValue(userStore, user => {
    try {
      return user.name || '익명';
    } catch {
      return '사용자 로드 오류';
    }
  });
  
  return <div>{displayName}</div>;
}
```

### 다중 스토어 조정
```typescript
function UserDashboard() {
  const userStore = AppStores.useStore('user');
  const settingsStore = AppStores.useStore('settings');
  
  const user = useStoreValue(userStore);
  const theme = useStoreValue(settingsStore, settings => settings.theme);
  
  return (
    <div className={`dashboard ${theme}`}>
      <h1>환영합니다, {user.name}님</h1>
    </div>
  );
}
```

## 성능 최적화

### 셀렉터 이점
```typescript
// ❌ 사용자 변경 시 리렌더링
const user = useStoreValue(userStore);
return <div>{user.email}</div>;

// ✅ 이메일 변경 시에만 리렌더링
const email = useStoreValue(userStore, user => user.email);
return <div>{email}</div>;
```

### 메모화된 셀렉터
```typescript
const emailSelector = useCallback((user: User) => user.email, []);

function UserEmail() {
  const userStore = AppStores.useStore('user');
  const email = useStoreValue(userStore, emailSelector);
  
  return <div>{email}</div>;
}
```

### 복잡한 계산
```typescript
function ExpensiveComputation() {
  const dataStore = AppStores.useStore('data');
  const result = useStoreValue(dataStore, useMemo(() => 
    (data: DataType) => {
      // 데이터 변경 시에만 비용이 많이 드는 계산 실행
      return data.items.reduce((sum, item) => sum + item.value, 0);
    }, []
  ));
  
  return <div>총계: {result}</div>;
}
```

## 타입 안전성 이점

### 자동 타입 추론
```typescript
const UserStores = createStoreContext('User', {
  profile: { name: '', email: '', age: 25 }
});

function TypedComponent() {
  const profileStore = UserStores.useStore('profile');
  const profile = useStoreValue(profileStore); // { name: string; email: string; age: number } 타입으로 지정됨
  
  // TypeScript는 이러한 속성이 존재함을 앎
  return (
    <div>
      <div>{profile.name}</div>     {/* ✅ string */}
      <div>{profile.age}</div>      {/* ✅ number */}
      {/* <div>{profile.id}</div>   ❌ TypeScript 오류 */}
    </div>
  );
}
```

### 셀렉터 타입 안전성
```typescript
function TypedSelector() {
  const profileStore = UserStores.useStore('profile');
  
  // TypeScript는 반환 타입을 string으로 추론
  const name = useStoreValue(profileStore, profile => profile.name);
  
  // TypeScript는 반환 타입을 boolean으로 추론
  const isAdult = useStoreValue(profileStore, profile => profile.age >= 18);
  
  return <div>{name}은(는) {isAdult ? '성인' : '미성년자'}입니다</div>;
}
```

## 모범 사례

### 단일 책임
```typescript
// ✅ 훅 호출당 하나의 값
const name = useStoreValue(userStore, user => user.name);
const email = useStoreValue(userStore, user => user.email);

// ❌ 필요하지 않은 경우 셀렉터에서 복잡한 객체 피하기
const userInfo = useStoreValue(userStore, user => ({ 
  name: user.name, 
  email: user.email,
  computed: someExpensiveCalculation(user)
}));
```

### 널 안전성 패턴
```typescript
function SafeComponent({ optionalStore }: { optionalStore?: Store<User> }) {
  const user = useStoreValue(optionalStore);
  
  if (!user) return <div>로딩 중...</div>;
  
  return <div>사용자: {user.name}</div>;
}
```

### 컴포넌트 세분성
```typescript
// ✅ 작고 집중된 컴포넌트
function UserName() {
  const name = useStoreValue(userStore, user => user.name);
  return <h1>{name}</h1>;
}

function UserEmail() {
  const email = useStoreValue(userStore, user => user.email);
  return <p>{email}</p>;
}

// 사용자 변경 시 리렌더링되는 하나의 큰 컴포넌트보다 좋음
```

## 일반적인 패턴

### 로딩 상태
```typescript
function UserProfile() {
  const userStore = AppStores.useStore('user');
  const user = useStoreValue(userStore);
  const isLoading = useStoreValue(userStore, user => !user.name);
  
  if (isLoading) return <div>로딩 중...</div>;
  return <div>환영합니다, {user.name}님</div>;
}
```

### 조건부 표시
```typescript
function AdminPanel() {
  const userStore = AppStores.useStore('user');
  const isAdmin = useStoreValue(userStore, user => user.role === 'admin');
  
  if (!isAdmin) return null;
  
  return <div>관리자 제어판</div>;
}
```

### 폼 통합
```typescript
function ProfileForm() {
  const userStore = AppStores.useStore('user');
  const user = useStoreValue(userStore);
  
  return (
    <form>
      <input 
        type="text" 
        value={user.name}
        onChange={(e) => userStore.update(u => ({ ...u, name: e.target.value }))}
      />
      <input 
        type="email" 
        value={user.email}
        onChange={(e) => userStore.update(u => ({ ...u, email: e.target.value }))}
      />
    </form>
  );
}
```

## 통합

- **스토어 시스템**: 반응형 스토어 구독을 위한 주요 훅
- **React 컨텍스트**: Context-Action 패턴과의 원활한 통합
- **타입 안전성**: 스토어 타입에서 자동 TypeScript 추론
- **성능**: 지능형 구독 관리를 통한 최적화된 리렌더링

## 링크

- **TypeDoc**: [useStoreValue.md](./react/src/functions/useStoreValue.md)
- **스토어 가이드**: [Store 클래스 가이드](./store-guide.md)
- **패턴 가이드**: [스토어 패턴](/en/guide/patterns/store/)
