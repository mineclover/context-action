# 모범 사례

Context-Action 프레임워크를 사용할 때 따라야 할 컨벤션과 모범 사례입니다.

## 네이밍 컨벤션

### 도메인 기반 리네이밍 패턴

핵심 컨벤션은 명확한 컨텍스트 분리를 위한 **도메인별 리네이밍**입니다.

#### 스토어 패턴 리네이밍
```tsx
// ✅ 권장: 도메인별 리네이밍
const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager
} = createStoreContext('User', {...});

// ❌ 지양: 직접 객체 접근
const UserStores = createStoreContext('User', {...});
const userStore = UserStores.useStore('profile'); // 도메인이 불분명
```

#### 액션 패턴 리네이밍
```tsx
// ✅ 권장: 명시적 타입을 가진 도메인별 리네이밍
const {
  Provider: UserActionProvider,
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('UserActions');

// ❌ 지양: 제네릭 이름
const {
  Provider,
  useActionDispatch,
  useActionHandler
} = createActionContext<UserActions>('UserActions');
```

### 컨텍스트 네이밍 규칙

#### 도메인 기반 네이밍
```tsx
// ✅ 권장: 명확한 도메인 구분
'UserProfile'     // 사용자 프로필 관련
'ShoppingCart'    // 쇼핑카트 관련  
'ProductCatalog'  // 상품 카탈로그 관련
'OrderManagement' // 주문 관리 관련
'AuthSystem'      // 인증 시스템 관련

// ❌ 지양: 모호한 이름
'Data'           // 너무 포괄적
'State'          // 구체적이지 않음
'App'            // 범위가 불분명 (루트 레벨에서만 사용)
'Manager'        // 역할이 불분명
```

#### 액션 vs 스토어 구분
```tsx
// 액션 컨텍스트 (행동/이벤트 중심)
'UserActions'         // 사용자 액션
'PaymentActions'      // 결제 액션
'NavigationActions'   // 내비게이션 액션

// 스토어 컨텍스트 (데이터/상태 중심)  
'UserData'           // 사용자 데이터
'PaymentData'        // 결제 데이터
'AppSettings'        // 애플리케이션 설정
```

## 파일 구조

### 권장 디렉토리 구조
```
src/
├── contexts/
│   ├── user/
│   │   ├── UserActions.tsx     # 액션 컨텍스트
│   │   ├── UserStores.tsx      # 스토어 컨텍스트
│   │   └── types.ts            # 사용자 관련 타입
│   ├── payment/
│   │   ├── PaymentActions.tsx
│   │   ├── PaymentStores.tsx
│   │   └── types.ts
│   └── index.ts                # 모든 컨텍스트 내보내기
├── components/
├── pages/
└── utils/
```

### 컨텍스트 파일 구성
```tsx
// contexts/user/UserActions.tsx
import { createActionContext } from '@context-action/react';
import type { UserActions } from './types';

export const {
  Provider: UserActionProvider,
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('UserActions');

// contexts/user/UserStores.tsx
import { createStoreContext } from '@context-action/react';
import type { UserStoreConfig } from './types';

export const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager
} = createStoreContext('User', userStoreConfig);
```

## 패턴 사용법

### 액션 패턴 모범 사례

#### 핸들러 등록
```tsx
// ✅ 권장: 안정적인 핸들러를 위해 useCallback 사용
function UserComponent() {
  useUserActionHandler('updateProfile', useCallback(async (payload) => {
    try {
      await updateUserProfile(payload);
      console.log('프로필이 성공적으로 업데이트되었습니다');
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
    }
  }, [])); // 안정적인 핸들러를 위한 빈 의존성 배열
}

// ❌ 지양: 인라인 핸들러 (재등록 발생)
function UserComponent() {
  useUserActionHandler('updateProfile', async (payload) => {
    await updateUserProfile(payload); // 매 렌더링마다 재등록
  });
}
```

#### 에러 핸들링
```tsx
// ✅ 권장: 적절한 에러 핸들링을 위해 controller.abort 사용
useActionHandler('riskyAction', (payload, controller) => {
  try {
    // 실패할 수 있는 비즈니스 로직
    processData(payload);
  } catch (error) {
    controller.abort('처리 실패', error);
  }
});
```

### 스토어 패턴 모범 사례

#### 스토어 접근
```tsx
// ✅ 권장: 특정 스토어 구독
function UserProfile() {
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  
  return <div>{profile.name}</div>;
}

// ❌ 지양: 불필요한 스토어 접근
function UserProfile() {
  const profileStore = useUserStore('profile');
  const settingsStore = useUserStore('settings'); // 사용되지 않음
  const profile = useStoreValue(profileStore);
  
  return <div>{profile.name}</div>;
}
```

#### 스토어 업데이트
```tsx
// ✅ 권장: 복잡한 변경을 위한 함수형 업데이트
const { updateStore } = useUserStoreManager();

const updateProfile = (changes: Partial<UserProfile>) => {
  updateStore('profile', prevProfile => ({
    ...prevProfile,
    ...changes,
    updatedAt: Date.now()
  }));
};

// ✅ 허용: 간단한 변경을 위한 직접 업데이트
const setUserName = (name: string) => {
  updateStore('profile', { ...currentProfile, name });
};
```

## 타입 정의

### 액션 타입
```tsx
// ✅ 권장: ActionPayloadMap 확장
interface UserActions extends ActionPayloadMap {
  updateProfile: { name: string; email: string };
  deleteAccount: { confirmationCode: string };
  logout: void; // 페이로드 없는 액션
}

// ❌ 지양: 순수 인터페이스
interface UserActions {
  updateProfile: { name: string; email: string }; // ActionPayloadMap 누락
}
```

### 스토어 타입
```tsx
// ✅ 권장: 명확한 타입 정의
interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: number;
  updatedAt: number;
}

interface UserSettings {
  theme: 'light' | 'dark';
  notifications: boolean;
  language: string;
}

const userStoreConfig = {
  profile: { 
    initialValue: {
      id: '',
      name: '',
      email: '',
      createdAt: 0,
      updatedAt: 0
    } as UserProfile
  },
  settings: { 
    initialValue: {
      theme: 'light',
      notifications: true,
      language: 'en'
    } as UserSettings
  }
};
```

## 성능 가이드라인

### 핸들러 최적화
```tsx
// ✅ 권장: 메모이제이션된 핸들러
const optimizedHandler = useCallback(async (payload: UserActions['updateProfile']) => {
  await updateUserProfile(payload);
}, []);

useUserActionHandler('updateProfile', optimizedHandler);
```

### 스토어 구독 최적화
```tsx
// ✅ 권장: 특정 값 구독
const userName = useStoreValue(profileStore)?.name;

// ❌ 지양: 부분 데이터만 필요할 때 불필요한 전체 객체 구독
const fullProfile = useStoreValue(profileStore);
const userName = fullProfile.name; // 프로필의 모든 변경에 대해 재렌더링
```

## 패턴 조합

### Provider 계층구조
```tsx
// ✅ 권장: 논리적 provider 순서
function App() {
  return (
    <UserStoreProvider>      {/* 데이터 레이어 먼저 */}
      <UserActionProvider>   {/* 액션 레이어 두 번째 */}
        <PaymentStoreProvider>
          <PaymentActionProvider>
            <AppContent />
          </PaymentActionProvider>
        </PaymentStoreProvider>
      </UserActionProvider>
    </UserStoreProvider>
  );
}
```

### 교차 패턴 통신
```tsx
// ✅ 권장: 액션이 스토어를 업데이트
function UserComponent() {
  const { updateStore } = useUserStoreManager();
  
  useUserActionHandler('updateProfile', useCallback(async (payload) => {
    try {
      const updatedProfile = await updateUserProfile(payload);
      updateStore('profile', updatedProfile); // API 호출 후 스토어 업데이트
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
    }
  }, [updateStore]));
}
```

## 일반적인 함정

### 이런 패턴은 피하세요
```tsx
// ❌ 하지 마세요: 액션 디스패치와 직접 스토어 업데이트 혼용
function BadComponent() {
  const dispatch = useUserAction();
  const { updateStore } = useUserStoreManager();
  
  const handleUpdate = () => {
    updateStore('profile', newProfile);  // 직접 스토어 업데이트
    dispatch('updateProfile', newProfile); // 그리고 액션 디스패치 - 중복!
  };
}

// ❌ 하지 마세요: 컴포넌트 내부에서 컨텍스트 생성
function BadComponent() {
  const { Provider } = createActionContext<UserActions>('User'); // 잘못됨!
  return <Provider>...</Provider>;
}

// ❌ 하지 마세요: 자주 변경되는 의존성으로 핸들러 등록
function BadComponent({ userId }: { userId: string }) {
  useUserActionHandler('updateProfile', async (payload) => {
    await updateUserProfile(userId, payload); // userId 클로저가 자주 변경됨
  }); // useCallback과 deps의 userId 누락
}
```

## 고급 베스트 프랙티스

### 액션 핸들러 상태 접근

#### ⚠️ 중요: 스토어 값 클로저 함정 피하기

액션 핸들러 내부에서 스토어 값에 접근할 때, **컴포넌트 스코프의 값을 절대 사용하지 마세요**. 클로저 함정이 발생합니다:

```tsx
// ❌ 잘못됨: 핸들러에서 컴포넌트 스코프 값 사용
function UserComponent() {
  const userStore = useUserStore('profile');
  const user = useStoreValue(userStore); // 이 값이 클로저에 갇힘!
  
  useUserActionHandler('updateUser', async (payload) => {
    // 🚨 버그: 이 'user'는 핸들러 등록 시점의 값, 현재 시점이 아님!
    if (user.isActive) {  // 오래된 값!
      await updateUserAPI(payload);
    }
  });
}

// ✅ 올바름: 핸들러 내부에서 스토어 값에 직접 접근
function UserComponent() {
  const userStore = useUserStore('profile');
  const user = useStoreValue(userStore); // 컴포넌트 렌더링용으로만 사용
  
  useUserActionHandler('updateUser', useCallback(async (payload) => {
    // ✅ 항상 스토어에서 최신 상태를 가져옴
    const currentUser = userStore.getValue(); // 실시간 값!
    
    if (currentUser.isActive) {
      await updateUserAPI(payload);
    }
  }, [userStore])); // 의존성에는 스토어 참조만 포함
}
```

#### 실시간 상태 접근 패턴

```tsx
// ✅ 패턴 1: 간단한 확인을 위한 직접 store getValue()
useActionHandler('conditionalAction', async (payload) => {
  const currentState = someStore.getValue();
  
  if (currentState.isReady) {
    // 액션 실행
  }
});

// ✅ 패턴 2: 여러 스토어 조정
useActionHandler('complexAction', async (payload) => {
  const userState = userStore.getValue();
  const settingsState = settingsStore.getValue();
  const uiState = uiStore.getValue();
  
  // 모든 현재 상태를 사용하여 의사결정
  if (userState.isLoggedIn && settingsState.apiEnabled && !uiState.isLoading) {
    // 복잡한 로직 실행
  }
});

// ✅ 패턴 3: 상태 검증 및 업데이트
useActionHandler('validateAndUpdate', async (payload) => {
  const current = dataStore.getValue();
  
  // 현재 상태 검증
  if (current.version !== payload.expectedVersion) {
    throw new Error('버전 불일치');
  }
  
  // 현재 상태를 기준으로 업데이트
  dataStore.setValue({
    ...current,
    ...payload.updates,
    version: current.version + 1
  });
});
```

### useEffect 의존성 베스트 프랙티스

#### 스토어와 Dispatch 참조는 안정적

Context-Action 프레임워크는 스토어 인스턴스와 dispatch 함수가 안정적인 참조를 갖도록 보장합니다:

```tsx
// ✅ 이것들은 useEffect 의존성에서 생략해도 안전
function MyComponent() {
  const userStore = useUserStore('profile');  // 안정적인 참조
  const dispatch = useUserAction();           // 안정적인 참조
  const user = useStoreValue(userStore);
  
  useEffect(() => {
    if (user.needsSync) {
      dispatch('syncUser', { id: user.id });
      userStore.setValue({ ...user, lastSyncAttempt: Date.now() });
    }
  }, [user.needsSync, user.id]); // userStore나 dispatch 포함하지 않음
  
  // 대안: 명시적으로 포함해도 됨 (해롭지 않음)
  useEffect(() => {
    if (user.needsSync) {
      dispatch('syncUser', { id: user.id });
    }
  }, [user.needsSync, user.id, dispatch, userStore]); // 이것도 괜찮음
}
```

#### 의존성 배열 가이드라인

```tsx
// ✅ 포함: 실제로 변경되고 동작에 영향을 주는 값들
useEffect(() => {
  if (user.isActive) {
    startPolling();
  }
}, [user.isActive]); // 파생된 값들 포함

// ✅ 생략: 안정적인 참조들 (하지만 포함해도 해롭지 않음)
const stableRef = userStore;
const stableDispatch = dispatch;

useEffect(() => {
  // 이것들은 deps에 포함할 필요 없지만, 포함해도 됨
  stableRef.setValue(newValue);
  stableDispatch('action', payload);
}, []); // 빈 deps 괜찮음

// ❌ 피하기: 특정 속성만 중요할 때 전체 객체 포함
useEffect(() => {
  updateUI();
}, [user]); // 모든 user 변경에 재실행

// ✅ 더 좋음: 관련된 속성만 포함
useEffect(() => {
  updateUI();
}, [user.theme, user.language]); // 이것들이 변경될 때만 재실행
```

### 상태 이슈 디버깅

#### 상태 모니터링 기법

```tsx
// ✅ 상태 변경을 추적하기 위한 디버그 로깅 추가
useActionHandler('debugAction', async (payload) => {
  const beforeState = store.getValue();
  console.log('이전:', beforeState);
  
  // 업데이트 수행
  store.setValue(newValue);
  
  const afterState = store.getValue();
  console.log('이후:', afterState);
  
  // 상태 변경 확인
  if (beforeState === afterState) {
    console.warn('상태가 예상대로 변경되지 않았습니다!');
  }
});

// ✅ 복잡한 상태 추적을 위한 디버그 유틸리티 생성
const createStateLogger = (storeName: string, store: Store<any>) => ({
  logCurrent: () => console.log(`${storeName}:`, store.getValue()),
  logChange: (action: string) => {
    const before = store.getValue();
    return (after: any) => {
      console.log(`${storeName} ${action}:`, { before, after });
    };
  }
});
```

#### 일반적인 디버깅 시나리오

```tsx
// 🔍 디버그: 상태 변경 시 컴포넌트가 리렌더링되지 않음
function DebuggingComponent() {
  const store = useStore('data');
  const value = useStoreValue(store);
  
  // 구독을 확인하기 위한 로깅 추가
  useEffect(() => {
    console.log('컴포넌트 리렌더링됨, 값:', value);
  });
  
  // 스토어 업데이트가 작동하는지 확인
  const testUpdate = () => {
    console.log('업데이트 전:', store.getValue());
    store.setValue({ ...store.getValue(), timestamp: Date.now() });
    console.log('업데이트 후:', store.getValue());
  };
  
  return (
    <div>
      <div>현재 값: {JSON.stringify(value)}</div>
      <button onClick={testUpdate}>업데이트 테스트</button>
    </div>
  );
}

// 🔍 디버그: 액션 핸들러가 실행되지 않음
function DebuggingActions() {
  useActionHandler('testAction', useCallback(async (payload) => {
    console.log('핸들러가 페이로드로 실행됨:', payload);
    
    // 에러를 캐치하기 위한 try-catch 추가
    try {
      // 여기에 로직
    } catch (error) {
      console.error('핸들러 에러:', error);
      throw error; // 에러 전파를 유지하기 위해 재throw
    }
  }, []));
  
  const dispatch = useActionDispatch();
  
  const testDispatch = () => {
    console.log('testAction 디스패치 중...');
    dispatch('testAction', { test: true });
  };
  
  return <button onClick={testDispatch}>액션 테스트</button>;
}
```

### 프로덕션 디버깅 및 컴포넌트 생명주기 관리

#### 치명적 이슈: 중복 액션 핸들러 등록

**문제**: 동일한 액션 핸들러를 여러 번 등록하면 예측할 수 없는 동작이 발생합니다.

```tsx
// ❌ 잘못된 예: 중복 핸들러 등록
useActionHandler('updateResults', async (payload) => {
  store.setValue(payload.data);
});
useActionHandler('updateResults', async (payload) => {  // 중복!
  store.setValue(payload.data);  // 첫 번째 핸들러를 덮어씁니다
});

// ✅ 올바른 예: 단일 핸들러 등록
const updateResultsHandler = useCallback(async (payload) => {
  store.setValue(payload.data);
}, [store]);
useActionHandler('updateResults', updateResultsHandler);
```

**디버깅 팁**: `grep -n "useActionHandler.*'actionName'" src/**/*.tsx`

#### 처리 상태로 경쟁 조건 방지하기

**문제**: 빠른 버튼 클릭으로 인한 경쟁 조건과 상태 불일치가 발생합니다.

```tsx
// ✅ 경쟁 조건을 방지하기 위한 처리 상태 추가
const stores = createStoreContext('Demo', {
  data: initialData,
  isProcessing: false  // 처리 상태 추가
});

const criticalActionHandler = useCallback(async (payload) => {
  const currentProcessing = isProcessingStore.getValue();
  
  if (currentProcessing) {
    console.warn('액션이 이미 진행 중입니다. 요청을 무시합니다');
    return; // 조기 반환으로 경쟁 조건 방지
  }
  
  isProcessingStore.setValue(true);
  try {
    await performCriticalOperation(payload);
  } finally {
    isProcessingStore.setValue(false); // 항상 처리 상태 해제
  }
}, [isProcessingStore]);

useActionHandler('criticalAction', criticalActionHandler);

// ✅ 처리 상태를 반영하는 UI
function ActionButton() {
  const isProcessing = useStoreValue(isProcessingStore);
  const dispatch = useActionDispatch();
  
  return (
    <button
      onClick={() => dispatch('criticalAction', payload)}
      disabled={isProcessing}
    >
      {isProcessing ? '⏳ 처리 중...' : '액션 실행'}
    </button>
  );
}
```

#### RefContext를 사용한 안전한 컴포넌트 언마운트

**문제**: 컴포넌트 언마운트가 수동 ref 정리와 충돌합니다.

```tsx
// ❌ 잘못된 예: 컴포넌트 useEffect에서 수동 ref 정리
function Component() {
  const elementRef = useRefHandler('element');
  
  useEffect(() => {
    return () => {
      elementRef.setRef(null); // 이는 액션 핸들러 정리와 충돌합니다
    };
  }, []);
  
  return <div ref={elementRef.setRef} />;
}

// ✅ 올바른 예: 관심사 분리 - React는 DOM을, 액션은 상태를 처리
function Component() {
  const elementRef = useRefHandler('element');
  
  useEffect(() => {
    console.log('컴포넌트 마운트됨');
    return () => console.log('컴포넌트 언마운트 중');
    // React가 DOM 정리를 자동으로 처리하도록 함
  }, []);
  
  return <div ref={elementRef.setRef} />;
}

// ✅ 액션 핸들러가 상태와 ref 조정을 관리
const unmountElementHandler = useCallback(async () => {
  const isCurrentlyMounted = isMountedStore.getValue();
  
  if (isCurrentlyMounted) {
    isMountedStore.setValue(false); // 먼저 상태 업데이트
    
    // React가 컴포넌트를 언마운트한 후 ref 상태 확인
    setTimeout(() => {
      const currentRef = elementRef.target;
      if (currentRef) {
        elementRef.setRef(null); // 필요한 경우에만 수동 정리
      }
    }, 50);
  }
}, [isMountedStore, elementRef]);

useActionHandler('unmountElement', unmountElementHandler);
```

#### 프로덕션 디버깅 기법

**상태 모니터링**: 프로덕션 이슈 진단을 위한 포괄적 상태 모니터링:

```tsx
// ✅ 다차원 상태 모니터링
const debugStores = createStoreContext('Debug', {
  actionLog: [] as string[],
  errorCount: 0,
  operationTimes: {} as Record<string, number>
});

const addLogHandler = useCallback(async ({ message }) => {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = `[${timestamp}] ${message}`;
  
  actionLogStore.update(prev => [
    ...prev.slice(-49), // 최근 50개 항목 유지
    logEntry
  ]);
}, [actionLogStore]);

useActionHandler('addLog', addLogHandler);
```

**에러 복구**: 자동 재시도 로직으로 우아한 에러 복구:

```tsx
// ✅ 지수 백오프를 사용한 자동 재시도
const reliableActionHandler = useCallback(async (payload) => {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      await performOperation(payload);
      return; // 성공
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) throw error; // 최종 실패
      
      const delay = 100 * Math.pow(2, attempt - 1); // 지수 백오프
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}, []);

useActionHandler('reliableAction', reliableActionHandler);
```

**스트레스 테스트**: 간헐적 이슈를 재현하기 위해 프로덕션 조건을 시뮬레이션:

```tsx
// ✅ 간단한 스트레스 테스트 헬퍼
function StressTester({ children }: { children: ReactNode }) {
  const [isStressTesting, setIsStressTesting] = useState(false);
  
  useEffect(() => {
    if (!isStressTesting) return;
    
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 사이클당 30% 확률
        // 빠른 사용자 행동을 시뮬레이션하는 랜덤 액션 트리거
        const actions = ['mount', 'unmount', 'waitForRef'];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        console.log(`🎯 스트레스 테스트: ${randomAction}`);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [isStressTesting]);
  
  return (
    <div>
      <button onClick={() => setIsStressTesting(!isStressTesting)}>
        {isStressTesting ? '🛑 중지' : '🎯 시작'} 스트레스 테스트
      </button>
      {children}
    </div>
  );
}
```