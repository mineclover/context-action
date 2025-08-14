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
} = createDeclarativeStorePattern('User', {...});

// ❌ 지양: 직접 객체 접근
const UserStores = createDeclarativeStorePattern('User', {...});
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
import { createDeclarativeStorePattern } from '@context-action/react';
import type { UserStoreConfig } from './types';

export const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager
} = createDeclarativeStorePattern('User', userStoreConfig);
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