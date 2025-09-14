# 컨텍스트 드리븐 아키텍처 (Context-Driven Architecture)

**Context-Action 프레임워크**를 기반으로 한 문서 중심의 상태 관리 및 비즈니스 로직 아키텍처 가이드

## 개요

컨텍스트 드리븐 아키텍처는 Context-Action 프레임워크의 핵심 설계 원칙을 바탕으로, **문서 중심의 컨텍스트 분리**와 **효과적인 아티팩트 관리**를 통해 복잡한 상태 관리의 근본적 한계를 극복하는 혁신적인 아키텍처 접근법입니다.

### 핵심 철학

> **"문서가 곧 아키텍처다"** - 각 컨텍스트는 해당 도메인의 문서와 결과물을 관리하는 단위로 존재한다.

컨텍스트는 **개념에 대한 정의 단위**를 의미하며, 이 기준을 바탕으로 시각적 UI는 스토리북 컴포넌트로, 비즈니스 로직은 액션 파이프라인으로 구성됩니다.

## 컨텍스트의 정의와 분리 원칙

### 컨텍스트의 정의 단위

#### 기본 구조
- **주제 컨텍스트** (Topic Context): 큰 단위의 기능, 기획, 또는 페이지 담당
- **구성 컨텍스트** (Composition Context): 개별 기능에 대한 구현 단위
- **중첩 구조**: 하나의 구성이 다른 구성들의 주제가 될 수 있음

#### 컨텍스트 계층 구조

```
📁 도메인 컨텍스트 (Domain Context)     - 범용성 우선
  ├── 📄 비즈니스 모델 설계
  ├── 🔄 메타적 기능 구현
  └── 🌐 여러 곳에서 재사용

📁 페이지 컨텍스트 (Page Context)      - 현재 접근성 집중
  ├── 🎯 특정 인터페이스 맞춤
  ├── 👤 현재 사용자 경험 최적화
  └── 📱 페이지별 특화 기능
```

### 컨텍스트 분리 원칙

#### 1. 책임 분리 (Separation of Concerns)
- 상위 컨텍스트는 하위 컨텍스트의 기능을 대신하지 않음
- 하위 컨텍스트는 상위 컨텍스트의 데이터를 직접 사용하지 않음
- 각 컨텍스트는 명확한 단일 책임을 가짐

#### 2. 의존성 방향 (Dependency Direction)
```
상위 컨텍스트 → 하위 컨텍스트 (허용)
하위 컨텍스트 ← 상위 컨텍스트 (금지)
```

- **허용**: 하위 컨텍스트가 상위 컨텍스트의 데이터나 스타일 사용
- **금지**: 상위 컨텍스트가 하위 컨텍스트의 데이터 직접 접근
- **해결책**: 정의 자체를 상위 컨텍스트로 위임하는 방식 채택

#### 3. 이벤트 기반 위임 패턴

```typescript
// 상위 컨텍스트: 이벤트 정의
const {
  Provider: ParentActionProvider,
  useActionDispatch: useParentAction
} = createActionContext<ParentActions>('ParentContext');

// 하위 컨텍스트: 상위 이벤트 실행
function ChildComponent() {
  const parentDispatch = useParentAction();

  const handleChildAction = () => {
    // 하위 작업 수행 후 상위 이벤트 트리거
    parentDispatch('parentEvent', childData);
  };
}
```

## Context-Action 프레임워크 기반 구현

### 1. 액션 파이프라인 시스템 (ActionRegister)

Context-Action의 핵심인 `ActionRegister`는 우선순위 기반 핸들러 실행을 제공합니다.

#### 핵심 특징
- **우선순위 기반 실행**: 핸들러를 priority 순으로 정렬하여 실행
- **다중 실행 모드**: sequential, parallel, race 모드 지원
- **고급 제어**: throttle, debounce, abort 지원
- **메모리 안전성**: 자동 cleanup과 unregister 함수 관리

#### 구현 예시

```typescript
// 1. 액션 타입 정의 (비즈니스 로직)
interface UserActions {
  updateProfile: { name: string; email: string };
  deleteUser: { userId: string };
  logout: void;
}

// 2. 액션 컨텍스트 생성 (비즈니스 로직 레이어)
const {
  Provider: UserActionProvider,
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('UserActions');

// 3. 비즈니스 로직 구현 (Handler 레이어)
function UserBusinessLogic({ children }) {
  const userStore = useUserStore('profile');

  // 우선순위가 높은 핸들러 (보안 검증)
  useUserActionHandler('updateProfile', useCallback(async (payload) => {
    // Step 1: 현재 상태 읽기
    const currentProfile = userStore.getValue();

    // Step 2: 비즈니스 로직 실행
    if (!validateProfile(payload)) {
      throw new Error('Invalid profile data');
    }

    // Step 3: 상태 업데이트
    userStore.setValue({
      ...currentProfile,
      ...payload,
      lastUpdated: Date.now()
    });

    // API 호출
    await saveProfile(payload);
  }, [userStore]), { priority: 100 });

  // 낮은 우선순위 핸들러 (로깅)
  useUserActionHandler('updateProfile', useCallback(async (payload) => {
    console.log('Profile updated:', payload);
    // 분석 데이터 전송
    analytics.track('profile_updated', payload);
  }, []), { priority: 0 });

  return children;
}

// 4. UI 컴포넌트 (순수 프레젠테이션)
function UserProfile() {
  const dispatch = useUserAction();
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);

  return (
    <div>
      <h1>{profile.name}</h1>
      <button onClick={() => dispatch('updateProfile', {
        name: 'New Name',
        email: 'new@email.com'
      })}>
        Update Profile
      </button>
    </div>
  );
}
```

### 2. 스토어 패턴 시스템

#### Declarative Store Pattern
Context-Action의 `createStoreContext`는 타입 안전성과 함께 선언적 스토어 관리를 제공합니다.

```typescript
// 1. 스토어 정의 (데이터 레이어)
const {
  Provider: UserStoreProvider,
  useStore: useUserStore
} = createStoreContext('UserStores', {
  profile: {
    initialValue: { name: '', email: '', isLoggedIn: false },
    strategy: 'shallow',
    description: '사용자 프로필 정보'
  },
  preferences: {
    initialValue: { theme: 'light' as const, language: 'ko' },
    strategy: 'reference'
  },
  // 직접 값도 지원 (간단한 경우)
  sessionTimeout: 30 * 60 * 1000 // 30분
});

// 2. 스토어 관리자 사용
function DataLayer({ children }) {
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');

  // 스토어 초기화 로직
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      profileStore.setValue(JSON.parse(savedProfile));
    }
  }, [profileStore]);

  return children;
}
```

### 3. Context-Layered Architecture 통합

#### 4계층 구조

```
📁 contexts/     # 🗄️ 컨텍스트 정의 (타입 정의 및 컨텍스트 생성)
├── UserActionContext.ts    # 액션 컨텍스트 정의
└── UserStoreContext.ts     # 스토어 컨텍스트 정의

📁 handlers/     # ⚙️ 핸들러 로직 (Props 기반 DI로 비즈니스 로직)
├── UserProfileHandlers.tsx # 프로필 관련 비즈니스 로직
└── UserAuthHandlers.tsx    # 인증 관련 비즈니스 로직

📁 actions/      # 🚀 액션 디스패치 (액션 발송 및 콜백)
├── useUserProfileActions.ts # 프로필 액션 hooks
└── useUserAuthActions.ts    # 인증 액션 hooks

📁 hooks/        # 🔗 스토어 구독 (스토어 값 구독)
├── useUserProfile.ts       # 프로필 상태 hooks
└── useUserPreferences.ts   # 설정 상태 hooks

📁 views/        # 🖼️ 순수 UI (이벤트 처리 및 렌더링)
├── UserProfile.tsx         # 프로필 UI 컴포넌트
└── UserSettings.tsx        # 설정 UI 컴포넌트

📄 UserPage.tsx  # 🎯 통합 지점 (핸들러 등록 및 조합)
```

#### 통합 예시

```typescript
// contexts/UserContexts.ts
export const {
  Provider: UserActionProvider,
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('UserActions');

export const {
  Provider: UserStoreProvider,
  useStore: useUserStore
} = createStoreContext('UserStores', {
  profile: { name: '', email: '', isLoggedIn: false },
  preferences: { theme: 'light' as const }
});

// handlers/UserProfileHandlers.tsx - Props 기반 DI 패턴
interface UserProfileHandlersProps {
  profileStore: Store<UserProfile>;
  preferencesStore: Store<UserPreferences>;
}

export function UserProfileHandlers({
  profileStore,
  preferencesStore,
  children
}: UserProfileHandlersProps & { children: ReactNode }) {

  useUserActionHandler('updateProfile', useCallback(async (payload) => {
    const currentProfile = profileStore.getValue();
    const preferences = preferencesStore.getValue();

    // 비즈니스 규칙 적용
    const updatedProfile = applyBusinessRules(payload, preferences);

    profileStore.setValue(updatedProfile);
    await syncWithServer(updatedProfile);
  }, [profileStore, preferencesStore]));

  return children;
}

// UserPage.tsx - 통합 지점
export function UserPage() {
  return (
    <UserActionProvider>
      <UserStoreProvider>
        <UserPageContent />
      </UserStoreProvider>
    </UserActionProvider>
  );
}

function UserPageContent() {
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');

  return (
    <UserProfileHandlers
      profileStore={profileStore}
      preferencesStore={preferencesStore}
    >
      <UserProfileView />
      <UserSettingsView />
    </UserProfileHandlers>
  );
}
```

## 디자인 시스템 통합

### CVA 기반 컴포넌트 스타일링

각 컨텍스트의 컴포넌트는 **CVA (Class Variance Authority)**를 통해 디자인 시스템과 통합됩니다.

#### 구현 원칙

1. **스타일 파라미터와 인터랙션 파라미터 분리**
   ```typescript
   interface ButtonProps {
     // 스타일 파라미터
     variant: 'primary' | 'secondary' | 'danger';
     size: 'sm' | 'md' | 'lg';

     // 인터랙션 파라미터
     onClick: () => void;
     disabled?: boolean;
   }
   ```

2. **인터랙션에 의한 스타일 변경 제어**
   ```typescript
   const buttonVariants = cva(
     "button-base", // 기본 스타일
     {
       variants: {
         variant: {
           primary: "bg-blue-500 text-white",
           secondary: "bg-gray-200 text-gray-800",
           danger: "bg-red-500 text-white"
         },
         size: {
           sm: "px-2 py-1 text-sm",
           md: "px-4 py-2 text-base",
           lg: "px-6 py-3 text-lg"
         }
       }
     }
   );

   // 인터랙션은 스타일 props를 변경
   const [variant, setVariant] = useState<'primary' | 'secondary'>('primary');

   const handleInteraction = () => {
     // 직접 스타일을 바꾸지 않고 파라미터를 변경
     setVariant(prev => prev === 'primary' ? 'secondary' : 'primary');
   };
   ```

### 디자인 토큰 시스템

#### Base Layer
```css
/* 색상 토큰화 */
:root {
  --color-primary-50: #eff6ff;
  --color-primary-500: #3b82f6;
  --color-primary-900: #1e3a8a;

  /* 간격 시스템 */
  --space-1: 0.25rem;
  --space-4: 1rem;
  --space-8: 2rem;

  /* 타이포그래피 */
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
}
```

#### Extend Layer
```typescript
// 헤드리스 컴포넌트
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cardVariants({ variant, className })}
        {...props}
      />
    );
  }
);

const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm",
  {
    variants: {
      variant: {
        default: "border-border",
        destructive: "border-red-200 bg-red-50",
        success: "border-green-200 bg-green-50"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
```

## 비즈니스 로직 관리

### 데이터 흐름 및 검증 시스템

#### 1. 데이터 정의 및 타입 시스템

```typescript
// 도메인 데이터 정의
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'moderator';
  createdAt: Date;
  updatedAt: Date;
}

// 비즈니스 규칙 검증
class UserProfileValidator {
  static validate(profile: Partial<UserProfile>): ValidationResult {
    const errors: string[] = [];

    if (profile.name && profile.name.length < 2) {
      errors.push('Name must be at least 2 characters');
    }

    if (profile.email && !this.isValidEmail(profile.email)) {
      errors.push('Invalid email format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
```

#### 2. API 통합 및 상태 관리

```typescript
// API 서비스 정의
class UserAPIService {
  static async updateProfile(profile: UserProfile): Promise<UserProfile> {
    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });

    if (!response.ok) {
      throw new UserAPIError(`Update failed: ${response.statusText}`);
    }

    return response.json();
  }
}

// 액션 핸들러에서 API 사용
useUserActionHandler('updateProfile', useCallback(async (payload, controller) => {
  try {
    // 1. 유효성 검증
    const validation = UserProfileValidator.validate(payload);
    if (!validation.isValid) {
      controller.abort('Validation failed', validation.errors);
      return;
    }

    // 2. 현재 상태 읽기
    const currentProfile = profileStore.getValue();

    // 3. API 호출
    const updatedProfile = await UserAPIService.updateProfile({
      ...currentProfile,
      ...payload,
      updatedAt: new Date()
    });

    // 4. 상태 업데이트
    profileStore.setValue(updatedProfile);

    // 5. 결과 설정
    controller.setResult(updatedProfile);
  } catch (error) {
    controller.abort('Update failed', error);
  }
}, [profileStore]));
```

#### 3. 상태 시나리오 정의

```typescript
// 사용자 여정 상태 정의
type UserJourneyState =
  | 'unauthenticated'
  | 'authenticating'
  | 'profile_incomplete'
  | 'profile_complete'
  | 'email_verification_required'
  | 'account_suspended';

// 상태 전환 로직
const UserJourneyMachine = {
  transitions: {
    unauthenticated: ['authenticating'],
    authenticating: ['profile_incomplete', 'profile_complete', 'account_suspended'],
    profile_incomplete: ['profile_complete', 'email_verification_required'],
    profile_complete: ['unauthenticated', 'account_suspended'],
    email_verification_required: ['profile_complete', 'unauthenticated'],
    account_suspended: ['unauthenticated']
  },

  canTransition(from: UserJourneyState, to: UserJourneyState): boolean {
    return this.transitions[from]?.includes(to) ?? false;
  }
};

// 상태 기반 UI 렌더링
function UserInterfaceController() {
  const journeyStore = useUserStore('journeyState');
  const journeyState = useStoreValue(journeyStore);

  switch (journeyState) {
    case 'unauthenticated':
      return <LoginForm />;
    case 'authenticating':
      return <LoadingSpinner />;
    case 'profile_incomplete':
      return <ProfileSetupForm />;
    case 'profile_complete':
      return <Dashboard />;
    case 'email_verification_required':
      return <EmailVerificationPrompt />;
    case 'account_suspended':
      return <SuspensionNotice />;
    default:
      return <ErrorFallback />;
  }
}
```

## 아키텍처 장점

### 1. 디자인 컴포넌트 관측성

- **스토리북 통합**: 모든 컴포넌트를 스토리북에서 시각적으로 확인
- **파라미터 기반 제어**: 스타일 변화를 예측 가능한 파라미터로 제어
- **이벤트 추적**: 컴포넌트에서 발생하는 모든 이벤트를 명시적으로 관리

### 2. 명확한 이벤트 드리븐 아키텍처

- **액션 파이프라인**: 모든 이벤트가 ActionRegister를 통해 처리
- **우선순위 제어**: 비즈니스 로직의 실행 순서를 명확하게 정의
- **에러 처리**: 통합된 에러 핸들링 및 복구 메커니즘

### 3. 업데이트 격리 및 제어

- **불변성 보장**: Store의 safeGet/safeSet으로 데이터 불변성 확보
- **리렌더링 최적화**: useSyncExternalStore 기반 정확한 변경 감지
- **메모리 관리**: 자동 cleanup과 dispose 패턴으로 메모리 누수 방지

### 4. 로직 투명화

- **파이프라인 제어**: abort, jump, priority 등으로 실행 흐름 제어
- **결과 수집**: dispatchWithResult로 모든 핸들러 결과 추적
- **디버깅 지원**: 개발 모드에서 상세한 로깅 및 성능 모니터링

### 5. 구현 단순화

- **선언적 API**: createActionContext, createStoreContext로 간단한 설정
- **타입 안전성**: TypeScript를 통한 컴파일 타임 에러 방지
- **자동 추론**: 초기값 기반 타입 자동 추론

### 6. 점진적 개발 가능성

- **컨텍스트 격리**: 독립적인 컨텍스트로 부분적 개발 및 테스트
- **단계적 마이그레이션**: 기존 코드에서 점진적으로 전환 가능
- **확장성**: 새로운 컨텍스트와 핸들러를 쉽게 추가

## 구현 가이드라인

### 1. 컨텍스트 설계

```typescript
// ✅ 올바른 컨텍스트 분리
// 도메인 컨텍스트 (범용)
const UserDomainContext = createActionContext<UserDomainActions>('UserDomain');
const ProductDomainContext = createActionContext<ProductActions>('ProductDomain');

// 페이지 컨텍스트 (특화)
const CheckoutPageContext = createActionContext<CheckoutActions>('CheckoutPage');
const ProfilePageContext = createActionContext<ProfileActions>('ProfilePage');

// ❌ 잘못된 의존성
// 도메인이 페이지 컨텍스트를 사용하지 않아야 함
```

### 2. 핸들러 등록 패턴

```typescript
// ✅ 올바른 핸들러 등록
function UserBusinessLogic({ children }) {
  const userStore = useUserStore('profile');

  // 우선순위 기반 핸들러 등록
  useUserActionHandler('updateProfile', useCallback(async (payload) => {
    // 비즈니스 로직 구현
  }, [userStore]), { priority: 100, id: 'update-profile-handler' });

  return children;
}

// ❌ 컴포넌트에서 직접 비즈니스 로직 처리
function UserComponent() {
  const handleUpdate = async (data) => {
    // 컴포넌트에 비즈니스 로직이 있으면 안됨
  };
}
```

### 3. 스토어 사용 패턴

```typescript
// ✅ 올바른 스토어 사용
function DataAccessComponent() {
  const userStore = useUserStore('profile');
  const user = useStoreValue(userStore); // 반응적 구독

  const handleUpdate = () => {
    const currentUser = userStore.getValue(); // 현재 값 읽기
    // 비즈니스 로직 처리
    userStore.setValue({ ...currentUser, updated: true });
  };
}

// ❌ 잘못된 직접 접근
const user = userStore.getValue(); // 컴포넌트 렌더링에서 직접 사용 금지
```

### 4. 에러 처리 패턴

```typescript
// ✅ 통합 에러 처리
useUserActionHandler('riskyOperation', useCallback(async (payload, controller) => {
  try {
    const result = await riskyAPICall(payload);
    controller.setResult(result);
  } catch (error) {
    // 컨트롤러를 통한 에러 전파
    controller.abort('Operation failed', error);
  }
}, []), { priority: 100 });

// ❌ 에러 무시
useUserActionHandler('riskyOperation', useCallback(async (payload) => {
  try {
    await riskyAPICall(payload);
  } catch (error) {
    // 에러를 무시하면 안됨
  }
}, []), { priority: 100 });
```

## 결론

컨텍스트 드리븐 아키텍처는 Context-Action 프레임워크의 강력한 기능을 기반으로 하여:

1. **문서 중심 설계**로 명확한 도메인 분리
2. **액션 파이프라인**으로 예측 가능한 비즈니스 로직 처리
3. **선언적 스토어 패턴**으로 안전한 상태 관리
4. **컨텍스트 격리**로 유지보수성 향상

이를 통해 대규모 애플리케이션에서도 **관측 가능하고**, **유지보수 가능하며**, **점진적 개발이 가능한** 아키텍처를 구현할 수 있습니다.

이 아키텍처는 단순히 기술적 해결책이 아니라, **문서와 코드가 일치하는 살아있는 아키텍처**를 만들어 팀의 협업과 프로젝트의 지속가능한 발전을 지원합니다.