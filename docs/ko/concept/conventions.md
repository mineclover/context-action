# Context-Action Framework Conventions

이 문서는 Context-Action 프레임워크의 세 가지 핵심 패턴(Actions, Stores, RefContext)을 사용할 때 따라야 할 코딩 컨벤션과 베스트 프랙티스를 정의합니다.

## 📋 목차

1. [네이밍 컨벤션](#네이밍-컨벤션)
2. [파일 구조](#파일-구조)
3. [패턴 사용법](#패턴-사용법)
4. [타입 정의](#타입-정의)
5. [코드 스타일](#코드-스타일)
6. [성능 가이드라인](#성능-가이드라인)
7. [에러 핸들링](#에러-핸들링)
8. [RefContext 컨벤션](#refcontext-컨벤션)

---

## 네이밍 컨벤션

### 🏷️ 리네이밍 패턴 (Renaming Pattern)

Context-Action 프레임워크의 핵심 컨벤션은 세 가지 패턴 모두에 대한 **도메인별 리네이밍 패턴**입니다.

#### ✅ Store Pattern 리네이밍
```tsx
// ✅ 권장: 도메인별 리네이밍
const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager
} = createDeclarativeStorePattern('User', {...});

// ❌ 지양: 직접 객체 접근
const UserStores = createDeclarativeStorePattern('User', {...});
const userStore = UserStores.useStore('profile'); // 도메인이 불분명
```

#### ✅ Action Pattern 리네이밍
```tsx
// ✅ 권장: 도메인별 리네이밍 (제네릭 타입 명시)
const {
  Provider: UserActionProvider,
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('UserActions');

// ❌ 지양: 제네릭 이름 사용
const {
  Provider,
  useActionDispatch,
  useActionHandler
} = createActionContext<UserActions>('UserActions');
```

#### ✅ RefContext Pattern 리네이밍
```tsx
// ✅ 권장: 구조분해된 API를 사용한 도메인별 리네이밍
const {
  Provider: MouseProvider,
  useRefHandler: useMouseRef
} = createRefContext<MouseRefs>('Mouse');

// ❌ 지양: 제네릭 이름 사용
const {
  Provider,
  useRefHandler
} = createRefContext<MouseRefs>('Mouse');
```

### 🎯 컨텍스트 이름 규칙

#### 도메인 기반 네이밍
```tsx
// ✅ 권장: 명확한 도메인 구분
'UserProfile'     // 사용자 프로필 관련
'ShoppingCart'    // 쇼핑카트 관련  
'ProductCatalog'  // 상품 카탈로그 관련
'OrderManagement' // 주문 관리 관련
'AuthSystem'      // 인증 시스템 관련
'MouseEvents'     // 마우스 상호작용 관련
'AnimationStates' // 애니메이션 및 성능 관련

// ❌ 지양: 모호한 이름
'Data'           // 너무 포괄적
'State'          // 구체적이지 않음
'App'            // 범위가 불분명 (루트 레벨에서만 사용)
'Manager'        // 역할이 불분명
'Refs'           // 너무 포괄적
```

#### Action vs Store vs RefContext 구분
```tsx
// Action Context (행동/이벤트 중심)
'UserActions'         // 사용자 액션들
'PaymentActions'      // 결제 액션들
'NavigationActions'   // 내비게이션 액션들

// Store Context (데이터/상태 중심)  
'UserData'           // 사용자 데이터
'ProductCatalog'     // 상품 카탈로그
'ShoppingCart'       // 쇼핑카트 상태
'AppSettings'        // 앱 설정

// RefContext (성능/DOM 중심)
'MouseInteractions'  // 마우스 이벤트 처리
'AnimationRefs'      // 애니메이션 요소 참조
'FormElements'       // 폼 DOM 요소들
'MediaControls'      // 미디어 플레이어 컨트롤
```

### 🔤 Hook 네이밍 패턴

#### Store Hook 네이밍
```tsx
// ✅ 권장: use + 도메인 + Store 패턴
const useUserStore = UserContext.useStore;
const useProductStore = ProductContext.useStore;
const useCartStore = CartContext.useStore;

// 사용 시
const profileStore = useUserStore('profile');
const wishlistStore = useUserStore('wishlist');
```

#### Action Hook 네이밍
```tsx
// ✅ 권장: use + 도메인 + Action 패턴
const useUserAction = UserContext.useActionDispatch;
const usePaymentAction = PaymentContext.useActionDispatch;
const useUserActionHandler = UserContext.useActionHandler;

// 사용 시
const dispatch = useUserAction();
useUserActionHandler('updateProfile', handler);
```

#### RefContext Hook 네이밍
```tsx
// ✅ 권장: use + 도메인 + Ref 패턴
const useMouseRef = MouseContext.useRefHandler;
const useAnimationRef = AnimationContext.useRefHandler;
const useFormRef = FormContext.useRefHandler;

// 사용 시
const cursor = useMouseRef('cursor');
const trail = useMouseRef('trail');
const container = useMouseRef('container');
```

---

## 파일 구조

### 📁 권장 디렉토리 구조

```
src/
├── contexts/           # 컨텍스트 정의
│   ├── user/
│   │   ├── user.actions.ts     # UserActions 인터페이스 + createActionContext
│   │   ├── user.stores.ts      # UserData 인터페이스 + createDeclarativeStorePattern  
│   │   └── index.ts            # 리네이밍된 exports
│   ├── product/
│   │   ├── product.actions.ts
│   │   ├── product.stores.ts
│   │   └── index.ts
│   └── index.ts        # 모든 컨텍스트 re-export
├── providers/          # Provider 컴포넌트들
│   ├── UserProvider.tsx
│   ├── ProductProvider.tsx
│   └── AppProvider.tsx         # 루트 Provider 조합
├── hooks/             # 도메인별 커스텀 훅들
│   ├── user/
│   │   ├── useUserHandlers.ts   # 액션 핸들러 모음
│   │   ├── useUserProfile.ts    # 비즈니스 로직 훅
│   │   └── index.ts
│   └── index.ts
├── types/             # 공통 타입 정의
│   ├── user.types.ts
│   ├── product.types.ts
│   └── index.ts
└── components/        # React 컴포넌트들
    ├── user/
    ├── product/
    └── common/
```

### 📄 파일명 컨벤션

#### Context 파일명
```tsx
// ✅ 권장
user.actions.ts       // 액션 컨텍스트
user.stores.ts        // 스토어 컨텍스트
payment.actions.ts    // 결제 액션
product.stores.ts     // 상품 스토어

// ❌ 지양
userContext.ts        // 모호함 (액션인지 스토어인지 불분명)
User.ts              // 대문자 시작 (컴포넌트와 혼동)
userState.ts         // "state"보다는 "stores" 선호
```

#### Provider 파일명
```tsx
// ✅ 권장
UserProvider.tsx      // 사용자 관련 프로바이더
ProductProvider.tsx   // 상품 관련 프로바이더
AppProvider.tsx       // 루트 프로바이더

// ❌ 지양  
user-provider.tsx     // kebab-case 대신 PascalCase
userProvider.tsx      // camelCase 대신 PascalCase
```

---

## 패턴 사용법

### 🎯 패턴 선택 가이드

#### Store Only Pattern
```tsx
// ✅ 사용 시기: 순수 상태 관리가 필요한 경우
// - 폼 데이터 관리
// - 설정값 저장
// - 캐시된 데이터 관리
// - UI 상태 (모달, 토글 등)

// 방법 1: 타입 추론 (현재 방식)
const {
  Provider: SettingsStoreProvider,
  useStore: useSettingsStore,
  useStoreManager: useSettingsStoreManager
} = createDeclarativeStorePattern('Settings', {
  theme: 'light' as 'light' | 'dark',
  language: 'ko',
  notifications: true
});

// 방법 2: 명시적 제네릭 타입 (새로운 방식)
interface SettingsStoreTypes {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
}

const {
  Provider: SettingsStoreProvider,
  useStore: useSettingsStore,
  useStoreManager: useSettingsStoreManager
} = createDeclarativeStorePattern<SettingsStoreTypes>('Settings', {
  theme: 'light',  // 타입이 SettingsStoreTypes에서 추론됨
  language: 'ko',
  notifications: true
});
```

#### Action Only Pattern  
```tsx
// ✅ 사용 시기: 순수 액션 디스패치가 필요한 경우
// - 이벤트 트래킹
// - 로깅 시스템
// - 알림 발송
// - API 호출 (상태 변경 없이)

const {
  Provider: AnalyticsActionProvider,
  useActionDispatch: useAnalyticsAction,
  useActionHandler: useAnalyticsActionHandler
} = createActionContext<AnalyticsActions>('Analytics');
```

#### Pattern Composition
```tsx
// ✅ 사용 시기: 액션과 상태 관리가 모두 필요한 경우  
// - 복잡한 비즈니스 로직
// - 사용자 프로필 관리
// - 쇼핑카트 시스템
// - 게임 상태 관리

function App() {
  return (
    <UserActionProvider>
      <UserStoreProvider>
        <UserProfile />
      </UserStoreProvider>
    </UserActionProvider>
  );
}
```

### 🔄 Provider 조합 패턴

#### HOC 패턴 (권장)
```tsx
// ✅ 권장: HOC를 이용한 자동 Provider 감싸기
const { withProvider: withUserStoreProvider } = createDeclarativeStorePattern('User', {...});
const { withProvider: withUserActionProvider } = createActionContext<UserActions>('UserActions');

// 여러 Provider 조합
const withUserProviders = (Component: React.ComponentType) => 
  withUserActionProvider(withUserStoreProvider(Component));

const UserProfileWithProviders = withUserProviders(UserProfile);

// 사용
function App() {
  return <UserProfileWithProviders />;
}
```

#### Manual Provider 조합
```tsx
// ✅ 수동 조합 (복잡한 의존성이 있는 경우)
function UserProvider({ children }: { children: React.ReactNode }) {
  return (
    <UserActionProvider>
      <UserStoreProvider>
        <UserAnalyticsProvider>
          {children}
        </UserAnalyticsProvider>
      </UserStoreProvider>
    </UserActionProvider>
  );
}
```

---

## 타입 정의

### 🏷️ Interface 네이밍

#### Action Payload Map
```tsx
// ✅ 권장: 도메인 + Actions 패턴 (ActionPayloadMap 확장)
interface UserActions extends ActionPayloadMap {
  updateProfile: { id: string; data: Partial<UserProfile> };
  deleteAccount: { id: string; reason?: string };
  refreshToken: void;
}

// ✅ 권장: 도메인 + Actions 패턴 (단순 인터페이스 - 미래 방식)
interface UserActions {
  updateProfile: { id: string; data: Partial<UserProfile> };
  deleteAccount: { id: string; reason?: string };
  refreshToken: void;
}

interface PaymentActions {
  processPayment: { amount: number; method: string };
  refundPayment: { transactionId: string };
  validateCard: { cardNumber: string };
}

// ❌ 지양
interface Actions { ... }           // 너무 포괄적
interface UserActionTypes { ... }   // 일관성 없는 이름
```

#### Store Data Interface
```tsx
// ✅ 권장: 도메인 + Data 패턴 또는 직관적 이름
interface UserData {
  profile: UserProfile;
  preferences: UserPreferences;
  session: UserSession;
}

interface ShoppingCartData {
  items: CartItem[];
  total: number;
  discounts: Discount[];
}

// 또는 직관적 이름
interface UserState {
  profile: UserProfile;
  preferences: UserPreferences;
}

// ❌ 지양
interface Data { ... }           // 너무 포괄적
interface UserStoreType { ... }  // 불필요한 Type 접미사
```

### 🎯 제네릭 타입 사용

```tsx
// ✅ 권장: 명확한 제네릭 타입 사용
interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface User extends BaseEntity {
  name: string;
  email: string;
}

interface Product extends BaseEntity {
  name: string;
  price: number;
  category: string;
}

// Store 정의에서 활용 - 방법 1: 타입 추론 (권장)
const {
  Provider: UserStoreProvider,
  useStore: useUserStore
} = createDeclarativeStorePattern('User', {
  users: { initialValue: [] as User[] },
  currentUser: { initialValue: null as User | null }
});

// Store 정의에서 활용 - 방법 2: 명시적 제네릭
interface UserStoreTypes {
  users: User[];
  currentUser: User | null;
}

const {
  Provider: UserStoreProvider,
  useStore: useUserStore
} = createDeclarativeStorePattern<UserStoreTypes>('User', {
  // ⚠️ 주의: 명시적 제네릭 사용 시에도 InitialStores<T> 구조 필요
  users: [],  // 직접 값 또는
  currentUser: {  // 설정 객체
    initialValue: null,
    strategy: 'reference'
  }
});

// Action 정의에서 활용 - 새로운 API (contextName 우선)
interface UserActions {
  createUser: { userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> };
  updateUser: { id: string; updates: Partial<User> };
  deleteUser: { id: string };
}

const {
  Provider: UserActionProvider,
  useActionDispatch: useUserAction
} = createActionContext<UserActions>('UserActions', {
  registry: { debug: true, maxHandlers: 10 }
});
```

---

## 코드 스타일

### ✨ 컴포넌트 패턴

#### Store 사용 패턴
```tsx
// ✅ 권장: 명확한 변수명과 구조분해
function UserProfile() {
  // Store 접근
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');
  
  // 값 구독
  const profile = useStoreValue(profileStore);
  const preferences = useStoreValue(preferencesStore);
  
  // 로컬 상태와 구분
  const [isEditing, setIsEditing] = useState(false);
  
  return (
    <div>
      <ProfileView profile={profile} preferences={preferences} />
      {isEditing && <ProfileEditor />}
    </div>
  );
}

// ❌ 지양: 혼동되는 변수명
function UserProfile() {
  const store1 = useUserStore('profile');  // 무엇인지 불분명
  const data = useStoreValue(store1);      // 구체적이지 않음
  const userState = useStoreValue(store2); // 혼동 가능
}
```

#### Action Handler 패턴
```tsx
// ✅ 권장: useCallback과 명확한 핸들러명
function UserProfile() {
  const dispatch = useUserAction();
  
  // 핸들러 등록 (useCallback 필수)
  useUserActionHandler('updateProfile', useCallback(async (payload, controller) => {
    try {
      const profileStore = storeManager.getStore('profile');
      const currentProfile = profileStore.getValue();
      
      // 비즈니스 로직 실행
      const updatedProfile = await updateUserProfile(payload.data);
      
      // 스토어 업데이트
      profileStore.setValue({ ...currentProfile, ...updatedProfile });
      
      // 성공 알림
      dispatch('showNotification', { 
        type: 'success', 
        message: '프로필이 업데이트되었습니다.' 
      });
    } catch (error) {
      controller.abort('프로필 업데이트 실패', error);
    }
  }, [dispatch, storeManager]));
  
  const handleEditProfile = () => {
    dispatch('updateProfile', {
      data: { name: 'New Name' }
    });
  };
  
  return <button onClick={handleEditProfile}>Edit Profile</button>;
}
```

### 🎨 Import 정리

```tsx
// ✅ 권장: 그룹별 import 정리
// 1. React 관련
import React, { useCallback, useState, useEffect } from 'react';

// 2. 서드파티 라이브러리
import { toast } from 'react-hot-toast';

// 3. Context-Action 프레임워크
import { useStoreValue } from '@context-action/react';

// 4. 로컬 컨텍스트 (리네이밍된 훅들)
import { 
  useUserStore, 
  useUserAction, 
  useUserActionHandler 
} from '@/contexts/user';

// 5. 컴포넌트
import { ProfileForm } from './ProfileForm';

// 6. 타입
import type { UserProfile } from '@/types/user.types';
```

---

## 성능 가이드라인

### ⚡ Store 최적화

#### Comparison Strategy 선택
```tsx
// ✅ 권장: 데이터 특성에 맞는 strategy 선택
const {
  Provider: DataStoreProvider,
  useStore: useDataStore
} = createDeclarativeStorePattern('Data', {
  // 원시값: reference (기본값)
  counter: 0,
  isLoading: false,
  
  // 객체의 속성이 변경되는 경우: shallow  
  userProfile: {
    initialValue: { name: '', email: '', age: 0 },
    strategy: 'shallow'
  },
  
  // 중첩 객체가 자주 변경되는 경우: deep
  complexForm: {
    initialValue: { nested: { deep: { values: {} } } },
    strategy: 'deep'
  },
  
  // 큰 배열이나 성능이 중요한 경우: reference
  largeDataset: {
    initialValue: [] as DataItem[],
    strategy: 'reference',
    description: '성능을 위해 reference equality 사용'
  },
  
  // 고급 비교 옵션 사용
  advancedData: {
    initialValue: { id: '', data: {}, lastUpdated: new Date() },
    comparisonOptions: {
      strategy: 'shallow',
      ignoreKeys: ['lastUpdated'], // 특정 키 무시
      maxDepth: 2,                 // 성능을 위한 깊이 제한
      enableCircularCheck: true    // 순환 참조 방지
    }
  },
  
  // 커스텀 비교 로직
  versionedData: {
    initialValue: { version: 1, content: {} },
    comparisonOptions: {
      strategy: 'custom',
      customComparator: (oldVal, newVal) => {
        // 버전 기반 비교
        return oldVal.version === newVal.version;
      }
    }
  }
});
```

#### 메모이제이션 패턴
```tsx
// ✅ 권장: useCallback으로 핸들러 메모이제이션
function UserComponent() {
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  
  // 핸들러 메모이제이션 (의존성 배열 주의)
  const updateHandler = useCallback(async (payload) => {
    profileStore.setValue({ ...profile, ...payload.data });
  }, [profile, profileStore]);
  
  useUserActionHandler('updateProfile', updateHandler);
  
  // 계산된 값 메모이제이션
  const displayName = useMemo(() => {
    return profile.firstName + ' ' + profile.lastName;
  }, [profile.firstName, profile.lastName]);
  
  return <div>{displayName}</div>;
}
```

### 🔄 Action 최적화

#### Debounce/Throttle 설정
```tsx
// ✅ 권장: 적절한 debounce/throttle 사용
useUserActionHandler('searchUsers', searchHandler, {
  debounce: 300,  // 검색은 debounce
  id: 'search-handler'
});

useUserActionHandler('trackScroll', scrollHandler, {
  throttle: 100,  // 스크롤은 throttle  
  id: 'scroll-handler'
});

useUserActionHandler('saveForm', saveHandler, {
  blocking: true,  // 중요한 액션은 blocking
  once: false,
  id: 'save-handler'
});
```

---

## 🧪 타입 테스트 및 검증

### ✅ 타입 안전성 검증

#### 컴파일 타임 타입 테스트
```tsx
// ✅ 권장: 타입 테스트 파일 작성
// src/contexts/__tests__/user.types.test.tsx

import { createDeclarativeStorePattern, createActionContext } from '@context-action/react';

// 명시적 제네릭 테스트
interface UserStores {
  profile: { id: string; name: string; email: string };
  settings: { theme: 'light' | 'dark'; language: string };
}

// 타입 안전성 검증
const ExplicitStores = createDeclarativeStorePattern<UserStores>('User', {
  profile: { id: '', name: '', email: '' },  // 타입 체크됨
  settings: {
    initialValue: { theme: 'light', language: 'en' },
    strategy: 'shallow'
  }
});

// 타입 추론 테스트
const InferredStores = createDeclarativeStorePattern('Inferred', {
  counter: 0,  // Store<number>로 추론
  user: { id: '', name: '' },  // Store<{id: string, name: string}>로 추론
  isActive: false  // Store<boolean>로 추론
});

// Action Context 타입 테스트
interface TestActions {
  updateUser: { id: string; name: string };
  deleteUser: { id: string };
  refresh: void;
}

const ActionContext = createActionContext<TestActions>('Test', {
  registry: { debug: true }
});

// 사용 패턴 검증
function TypeValidationComponent() {
  const profileStore = ExplicitStores.useStore('profile');
  const counterStore = InferredStores.useStore('counter');
  const dispatch = ActionContext.useActionDispatch();
  
  // 올바른 타입 사용 검증
  dispatch('updateUser', { id: '123', name: 'John' }); // ✅ 타입 안전
  dispatch('refresh'); // ✅ void payload
  
  return null;
}
```

#### 런타임 에러 처리 개선
```tsx
// ✅ 권장: 개발 모드 디버깅 지원
// JSON 직렬화 실패 시 자동 fallback

const DataStores = createDeclarativeStorePattern('Data', {
  // 순환 참조나 특수 타입이 포함된 데이터
  complexData: {
    initialValue: { /* BigInt, Symbol, Function 등 */ },
    comparisonOptions: {
      strategy: 'deep',
      // 개발 모드에서 JSON 직렬화 실패 로그 출력
      enableCircularCheck: true
    }
  }
});
```

### 🔍 디버깅 도구

#### 개발 모드 로깅
```tsx
// ✅ 권장: 개발 모드에서만 활성화되는 디버깅
const DebugStores = createDeclarativeStorePattern('Debug', {
  userData: {
    initialValue: { id: '', profile: {} },
    debug: true,  // 개발 모드에서 스토어 생성 로그
    comparisonOptions: {
      strategy: 'shallow',
      // 비교 실패 시 개발 모드에서만 경고 출력
    }
  }
});
```

---

## 에러 핸들링

### 🚨 Error Boundary 패턴

```tsx
// ✅ 권장: 도메인별 Error Boundary
function UserErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={<UserErrorFallback />}
      onError={(error, errorInfo) => {
        // 사용자 관련 에러 로깅
        console.error('User context error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

function UserProvider({ children }: { children: React.ReactNode }) {
  return (
    <UserActionProvider>
      <UserStoreProvider>
        <UserErrorBoundary>
          {children}
        </UserErrorBoundary>
      </UserStoreProvider>
    </UserActionProvider>
  );
}
```

### 🛡️ Action Error 처리

```tsx
// ✅ 권장: Pipeline Controller를 이용한 에러 처리
useUserActionHandler('riskyOperation', useCallback(async (payload, controller) => {
  try {
    // 1. 입력 검증
    if (!payload.data || !payload.data.id) {
      controller.abort('유효하지 않은 입력 데이터');
      return;
    }
    
    // 2. 비즈니스 로직 실행
    const result = await performRiskyOperation(payload.data);
    
    // 3. 성공 시 상태 업데이트
    const store = storeManager.getStore('userData');
    store.setValue(result);
    
    // 4. 결과 반환 (필요한 경우)
    controller.setResult(result);
    
  } catch (error) {
    // 5. 에러 처리
    if (error instanceof ValidationError) {
      controller.abort('데이터 검증 실패', error);
    } else if (error instanceof NetworkError) {
      controller.abort('네트워크 오류', error);
    } else {
      controller.abort('알 수 없는 오류가 발생했습니다', error);
    }
  }
}, [storeManager]));
```

---

## RefContext 컨벤션

### 🔧 RefContext 전용 가이드라인

#### Ref 타입 정의
```tsx
// ✅ 권장: 구체적인 HTML 요소 타입
interface MouseRefs {
  cursor: HTMLDivElement;      // 구체적인 요소 타입
  trail: HTMLDivElement;
  container: HTMLDivElement;
}

interface FormRefs {
  nameInput: HTMLInputElement;  // 입력 요소 전용 타입
  emailInput: HTMLInputElement;
  submitButton: HTMLButtonElement; // 버튼 전용 타입
  form: HTMLFormElement;       // 폼 전용 타입
}

// ❌ 지양: 구체적인 타입을 알고 있는데 제네릭 HTMLElement 사용
interface BadRefs {
  cursor: HTMLElement;         // 너무 포괄적
  input: HTMLElement;          // HTMLInputElement여야 함
}
```

#### 성능 중심 패턴
```tsx
// ✅ 권장: 비즈니스 로직을 DOM 조작과 분리
function useMousePositionLogic() {
  const cursor = useMouseRef('cursor');
  const trail = useMouseRef('trail');
  
  const updatePosition = useCallback((x: number, y: number) => {
    // 직접 DOM 조작 - 제로 리렌더링
    if (cursor.target) {
      cursor.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
    if (trail.target) {
      trail.target.style.transform = `translate3d(${x-5}px, ${y-5}px, 0)`;
    }
  }, [cursor, trail]);
  
  const getElementPosition = useCallback(() => {
    if (!cursor.target) return null;
    const rect = cursor.target.getBoundingClientRect();
    return { x: rect.left, y: rect.top };
  }, [cursor]);
  
  return { updatePosition, getElementPosition };
}

// 컴포넌트에서 사용
function MouseComponent() {
  const { updatePosition } = useMousePositionLogic();
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    updatePosition(e.clientX, e.clientY);
  }, [updatePosition]);
  
  return <div onMouseMove={handleMouseMove}>...</div>;
}
```

#### RefContext 에러 처리
```tsx
// ✅ 권장: null 체크 및 에러 처리
function SafeRefComponent() {
  const element = useMouseRef('target');
  
  const safelyUpdateElement = useCallback((value: string) => {
    // 항상 대상 존재 여부 확인
    if (!element.target) {
      console.warn('RefContext: 대상 요소가 아직 마운트되지 않음');
      return;
    }
    
    try {
      element.target.textContent = value;
    } catch (error) {
      console.error('RefContext: 요소 업데이트 실패', error);
    }
  }, [element]);
  
  // 중요한 작업에는 useWaitForRefs 사용
  const { allRefsReady } = useWaitForRefs(['target']);
  
  useEffect(() => {
    if (allRefsReady) {
      safelyUpdateElement('준비 완료!');
    }
  }, [allRefsReady, safelyUpdateElement]);
  
  return <div ref={element.setRef}>콘텐츠</div>;
}
```

### ⚡ RefContext 성능 최적화

#### 제로 리렌더링 DOM 조작
```tsx
// ✅ 권장: 성능을 위한 직접 DOM 조작
function HighPerformanceMouseTracker() {
  const cursor = useMouseRef('cursor');
  const container = useMouseRef('container');
  
  // React 리렌더링 제로 - 모든 DOM 업데이트는 직접적
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cursor.target || !container.target) return;
    
    const rect = container.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 하드웨어 가속 변환 (GPU 가속)
    cursor.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    
    // 복잡한 애니메이션을 위한 will-change 사용
    if (!cursor.target.style.willChange) {
      cursor.target.style.willChange = 'transform';
    }
  }, [cursor, container]);
  
  // 메모리 최적화를 위한 언마운트 시 will-change 정리
  useEffect(() => {
    return () => {
      if (cursor.target) {
        cursor.target.style.willChange = '';
      }
    };
  }, [cursor]);
  
  return (
    <div ref={container.setRef} onMouseMove={handleMouseMove}>
      <div 
        ref={cursor.setRef}
        style={{ transform: 'translate3d(0, 0, 0)' }} // 초기 GPU 레이어
      />
    </div>
  );
}

// ❌ 지양: 리렌더링을 유발하는 상태 주도 업데이트
function SlowMouseTracker() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const handleMouseMove = (e: React.MouseEvent) => {
    // 이것은 모든 마우스 이동에서 리렌더링을 유발
    setPosition({ x: e.clientX, y: e.clientY });
  };
  
  return (
    <div onMouseMove={handleMouseMove}>
      <div style={{ left: position.x, top: position.y }} />
    </div>
  );
}
```

---

## 📚 추가 리소스

### 관련 문서
- [Pattern Guide](./pattern-guide.md) - 상세한 패턴 사용법
- [Full Architecture Guide](./architecture-guide.md) - 완전한 아키텍처 가이드
- [Hooks Reference](./hooks-reference.md) - Hooks 참조 문서
- [API Reference](../../api/) - API 문서

### 예제 프로젝트
- [Basic Example](../../../example/) - 기본 사용 예제
- [Advanced Patterns](../../examples/) - 고급 패턴 예제

### 마이그레이션 가이드
- [Legacy Pattern Migration](./pattern-guide.md#migration-guide) - 레거시 패턴에서 마이그레이션

---

## ❓ FAQ

### Q: 언제 Store Only vs Action Only vs RefContext vs Composition을 사용해야 하나요?
- **Store Only**: 순수 상태 관리 (폼, 설정, 캐시)
- **Action Only**: 순수 이벤트 처리 (로깅, 트래킹, 알림)  
- **RefContext Only**: 고성능 DOM 조작 (애니메이션, 실시간 상호작용)
- **Composition**: 여러 패턴이 필요한 복잡한 비즈니스 로직 (사용자 관리, 상호작용형 쇼핑카트)

### Q: 리네이밍 패턴을 꼭 사용해야 하나요?
네, 리네이밍 패턴은 Context-Action 프레임워크의 핵심 컨벤션입니다. 타입 안전성과 개발자 경험을 크게 향상시킵니다.

### Q: 성능 최적화는 어떻게 해야 하나요?
1. 적절한 comparison strategy 선택
2. useCallback으로 핸들러 메모이제이션  
3. 큰 데이터는 reference strategy 사용
4. 필요시 debounce/throttle 적용
5. 성능 중요한 DOM 조작에 RefContext 사용

### Q: 에러 처리는 어떻게 해야 하나요?
1. Pipeline Controller의 abort() 메서드 사용
2. 도메인별 Error Boundary 설정
3. 적절한 에러 타입별 처리
4. 사용자 친화적 에러 메시지 제공
5. DOM 조작 전 항상 ref.target 존재 여부 확인

### Q: 명시적 제네릭과 타입 추론 중 어떤 것을 사용해야 하나요?
- **타입 추론 (권장)**: 대부분의 경우, 코드가 간결하고 타입 안전성 보장
- **명시적 제네릭**: 복잡한 타입 구조나 엄격한 타입 제약이 필요한 경우

### Q: comparisonOptions는 언제 사용해야 하나요?
1. **ignoreKeys**: 타임스탬프 등 특정 필드 변경을 무시하고 싶을 때
2. **customComparator**: 비즈니스 로직에 맞는 특별한 비교가 필요할 때
3. **maxDepth**: 성능 최적화를 위해 깊은 비교의 깊이를 제한하고 싶을 때
4. **enableCircularCheck**: 순환 참조 가능성이 있는 객체를 다룰 때

### Q: 타입 테스트는 어떻게 작성해야 하나요?
1. 명시적 제네릭과 타입 추론 모두 테스트
2. 컴파일 타임에 타입 안전성 검증
3. 에러 케이스도 주석으로 문서화
4. 실제 사용 패턴을 반영한 테스트 컴포넌트 작성
5. 컴포넌트 테스트에 RefContext 타입 검증 포함

### Q: 언제 RefContext를 일반 state 대신 사용해야 하나요?
- **RefContext 사용 시**: 직접 DOM 조작 필요, 60fps 성능 필요, 제로 리렌더링이 중요
- **일반 state 사용 시**: 데이터를 UI에 표시해야 함, 컴포넌트 리렌더링이 허용됨
- **둘 다 사용 시**: 데이터 표시와 성능 중요 작업이 함께 필요 (예: 실시간 차트)

### Q: RefContext 안전성은 어떻게 보장하나요?
1. **DOM 작업 전 항상 `ref.target` 존재 여부 확인**
   ```tsx
   const element = useMouseRef('cursor');
   
   // ✅ 올바름 - 안전한 접근
   if (element.target) {
     element.target.style.transform = 'scale(1.1)';
   }
   
   // ❌ 잘못됨 - 에러 발생 가능
   element.target.style.transform = 'scale(1.1)';
   ```

2. **여러 ref가 필요한 작업에는 `useWaitForRefs` 사용**
   ```tsx
   const { allRefsReady, waitForRefs } = useWaitForRefs(['cursor', 'container']);
   
   const performOperation = async () => {
     await waitForRefs(); // 모든 ref가 준비될 때까지 대기
     // 안전한 DOM 조작 수행
   };
   ```

3. **애니메이션과 이벤트 리스너의 적절한 정리 구현**
   ```tsx
   useEffect(() => {
     return () => {
       // 애니메이션 정리
       if (animationFrame) {
         cancelAnimationFrame(animationFrame);
       }
       // 이벤트 리스너 제거
       element.target?.removeEventListener('click', handler);
     };
   }, []);
   ```

4. **에러 경계 처리 및 경고 메시지**
   ```tsx
   if (!element.target) {
     console.warn('RefContext: 대상 요소가 아직 마운트되지 않음');
     return;
   }
   ```

### Q: RefContext 성능 최적화는 어떻게 하나요?
1. **하드웨어 가속을 위한 `translate3d()` 사용**
   ```tsx
   // ✅ 올바름 - GPU 가속
   element.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
   
   // ❌ 잘못됨 - CPU만 사용
   element.target.style.left = `${x}px`;
   element.target.style.top = `${y}px`;
   ```

2. **애니메이션을 위한 `will-change` 속성 관리**
   ```tsx
   // 애니메이션 시작 전
   element.target.style.willChange = 'transform';
   
   // 애니메이션 중
   element.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
   
   // 애니메이션 완료 후 정리 (메모리 누수 방지)
   element.target.style.willChange = '';
   ```

3. **requestAnimationFrame을 사용한 부드러운 애니메이션**
   ```tsx
   const animate = () => {
     if (element.target) {
       const x = Math.sin(Date.now() * 0.001) * 100;
       element.target.style.transform = `translate3d(${x}px, 0, 0)`;
     }
     requestAnimationFrame(animate);
   };
   ```