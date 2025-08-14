# Context-Action Framework Conventions

이 문서는 Context-Action 프레임워크를 사용할 때 따라야 할 코딩 컨벤션과 베스트 프랙티스를 정의합니다.

## 📋 목차

1. [네이밍 컨벤션](#네이밍-컨벤션)
2. [파일 구조](#파일-구조)
3. [패턴 사용법](#패턴-사용법)
4. [타입 정의](#타입-정의)
5. [코드 스타일](#코드-스타일)
6. [성능 가이드라인](#성능-가이드라인)
7. [에러 핸들링](#에러-핸들링)

---

## 네이밍 컨벤션

### 🏷️ 리네이밍 패턴 (Renaming Pattern)

Context-Action 프레임워크의 핵심 컨벤션은 **도메인별 리네이밍 패턴**입니다.

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
// ✅ 권장: 도메인별 리네이밍
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

### 🎯 컨텍스트 이름 규칙

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

#### Action vs Store 구분
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

const {
  Provider: SettingsStoreProvider,
  useStore: useSettingsStore,
  useStoreManager: useSettingsStoreManager
} = createDeclarativeStorePattern('Settings', {
  theme: 'light' as 'light' | 'dark',
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
// ✅ 권장: 도메인 + Actions 패턴
interface UserActions extends ActionPayloadMap {
  updateProfile: { id: string; data: Partial<UserProfile> };
  deleteAccount: { id: string; reason?: string };
  refreshToken: void;
}

interface PaymentActions extends ActionPayloadMap {
  processPayment: { amount: number; method: string };
  refundPayment: { transactionId: string };
  validateCard: { cardNumber: string };
}

// ❌ 지양
interface Actions extends ActionPayloadMap { ... }  // 너무 포괄적
interface UserActionTypes { ... }                  // ActionPayloadMap 미확장
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

// Store 정의에서 활용
const createUserStore = () => createDeclarativeStorePattern('User', {
  users: { initialValue: [] as User[] },
  currentUser: { initialValue: null as User | null }
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

## 📚 추가 리소스

### 관련 문서
- [Pattern Guide](./packages/react/docs/PATTERN_GUIDE.md) - 상세한 패턴 사용법
- [Full Architecture Guide](./docs/en/guide/full.md) - 완전한 아키텍처 가이드
- [API Reference](./docs/api/) - API 문서

### 예제 프로젝트
- [Basic Example](./example/) - 기본 사용 예제
- [Advanced Patterns](./docs/examples/) - 고급 패턴 예제

### 마이그레이션 가이드
- [Legacy Pattern Migration](./packages/react/docs/PATTERN_GUIDE.md#migration-guide) - 레거시 패턴에서 마이그레이션

---

## ❓ FAQ

### Q: 언제 Store Only vs Action Only vs Composition을 사용해야 하나요?
- **Store Only**: 순수 상태 관리 (폼, 설정, 캐시)
- **Action Only**: 순수 이벤트 처리 (로깅, 트래킹, 알림)  
- **Composition**: 복잡한 비즈니스 로직 (사용자 관리, 쇼핑카트)

### Q: 리네이밍 패턴을 꼭 사용해야 하나요?
네, 리네이밍 패턴은 Context-Action 프레임워크의 핵심 컨벤션입니다. 타입 안전성과 개발자 경험을 크게 향상시킵니다.

### Q: 성능 최적화는 어떻게 해야 하나요?
1. 적절한 comparison strategy 선택
2. useCallback으로 핸들러 메모이제이션  
3. 큰 데이터는 reference strategy 사용
4. 필요시 debounce/throttle 적용

### Q: 에러 처리는 어떻게 해야 하나요?
1. Pipeline Controller의 abort() 메서드 사용
2. 도메인별 Error Boundary 설정
3. 적절한 에러 타입별 처리
4. 사용자 친화적 에러 메시지 제공