# `ActionPayloadMap` 인터페이스 가이드

Context-Action 프레임워크를 위한 타입-세이프 액션 페이로드 매핑입니다.

## 목적
액션 이름과 해당 페이로드 타입을 정의하기 위한 기본 인터페이스입니다.

## 구조
```typescript
interface ActionPayloadMap {
  [actionName: string]: unknown
}
```

## 사용 패턴

### 기본 액션 정의
```typescript
interface MyActions extends ActionPayloadMap {
  // 객체 페이로드를 가진 액션
  updateUser: { id: string; name: string; email: string };
  
  // 원시 타입 페이로드를 가진 액션
  setCount: number;
  
  // 페이로드가 없는 액션
  reset: void;
  
  // 유니언 타입 페이로드를 가진 액션
  showNotification: { type: 'success'; message: string } | { type: 'error'; error: Error };
}
```

### 복잡한 페이로드 구조
```typescript
interface AppActions extends ActionPayloadMap {
  // 중첩된 객체
  updateSettings: {
    ui: { theme: 'light' | 'dark'; language: string };
    notifications: { email: boolean; push: boolean };
  };
  
  // 배열
  updateItems: Array<{ id: string; value: any }>;
  
  // 선택적 속성  
  saveData: { data: any; options?: { compress: boolean; encrypt: boolean } };
  
  // 제네릭 페이로드
  apiCall: { endpoint: string; method: 'GET' | 'POST'; body?: any };
}
```

### Void 액션
```typescript
interface SystemActions extends ActionPayloadMap {
  // 페이로드 없는 액션
  logout: void;
  refresh: void;
  clearCache: void;
  
  // 페이로드 있는 액션과 혼합
  login: { username: string; password: string };
  initialize: { config: AppConfig };
}
```

## 확장 패턴

### 인터페이스 상속
```typescript
// 기본 액션
interface BaseActions extends ActionPayloadMap {
  log: { level: 'info' | 'warn' | 'error'; message: string };
  track: { event: string; data?: any };
}

// 확장된 액션
interface UserActions extends BaseActions {
  updateProfile: { name: string; email: string };
  changePassword: { oldPassword: string; newPassword: string };
}

// ActionRegister와 함께 사용
const register = new ActionRegister<UserActions>();
register.register('log', handler);        // 기본 액션
register.register('updateProfile', handler); // 확장된 액션
```

### 모듈 구성
```typescript
// 인증 모듈
interface AuthActions extends ActionPayloadMap {
  login: { credentials: LoginCredentials };
  logout: void;
  refreshToken: { token: string };
}

// UI 모듈  
interface UIActions extends ActionPayloadMap {
  showModal: { type: string; props?: any };
  hideModal: void;
  setTheme: { theme: 'light' | 'dark' };
}

// 결합된 애플리케이션 액션
interface AppActions extends AuthActions, UIActions {
  // 앱 특정 액션
  initialize: { config: AppConfig };
  shutdown: void;
}
```

## 타입 안전성 이점

### 컴파일 타임 유효성 검사
```typescript
interface TypedActions extends ActionPayloadMap {
  updateUser: { id: string; name: string };
  deleteUser: { id: string };
}

const register = new ActionRegister<TypedActions>();

// ✅ 유효 - 올바른 페이로드 타입
register.dispatch('updateUser', { id: '123', name: 'John' });

// ❌ TypeScript 오류 - 필수 속성 누락
register.dispatch('updateUser', { id: '123' }); 

// ❌ TypeScript 오류 - 잘못된 페이로드 타입  
register.dispatch('deleteUser', { name: 'John' });

// ❌ TypeScript 오류 - 알 수 없는 액션
register.dispatch('unknownAction', {});
```

### 핸들러 타입 추론
```typescript
register.register('updateUser', (payload, controller) => {
  // payload는 자동으로 { id: string; name: string } 타입으로 추론됨
  console.log(payload.id);   // ✅ TypeScript가 존재를 앎
  console.log(payload.name); // ✅ TypeScript가 존재를 앎
  console.log(payload.age);  // ❌ TypeScript 오류 - 속성이 존재하지 않음
});
```

## 모범 사례

### 이름 지정 규칙
```typescript
interface AppActions extends ActionPayloadMap {
  // 동사-명사 패턴 사용
  updateUser: UserData;
  deleteUser: { id: string };
  createPost: PostData;
  
  // 이벤트에는 현재 시제 사용
  userUpdated: { user: User; timestamp: Date };
  postCreated: { post: Post; author: User };
  
  // 명령어에는 명령형 사용
  showNotification: NotificationData;
  hideModal: void;
  saveToStorage: { key: string; value: any };
}
```

### 페이로드 디자인
```typescript
interface WellDesignedActions extends ActionPayloadMap {
  // ✅ 구체적이고 설명적인 페이로드
  updateUserProfile: { 
    userId: string; 
    updates: Partial<UserProfile>; 
    metadata: { source: string; timestamp: Date } 
  };
  
  // ❌ 제네릭하고 불분명한 페이로드 피하기  
  doSomething: { data: any; type: string };
  
  // ✅ 변형에는 구별된 유니언 사용
  handleApiResponse: 
    | { status: 'success'; data: any }
    | { status: 'error'; error: Error }
    | { status: 'loading' };
}
```

### 모듈식 구성
```typescript
// 도메인/기능별로 분리
interface UserActions extends ActionPayloadMap {
  loginUser: LoginCredentials;
  logoutUser: void;
  updateUserProfile: UserProfileUpdate;
}

interface ProductActions extends ActionPayloadMap {
  addProduct: ProductData;
  removeProduct: { id: string };
  updateProduct: { id: string; updates: Partial<ProductData> };
}

// 메인 앱에서 결합
interface AppActions extends UserActions, ProductActions {
  initializeApp: { config: AppConfig };
}
```

## 통합

- **ActionRegister**: 파이프라인 타입 안전성을 위한 타입 매개변수
- **createActionContext**: 타입 지정된 액션을 사용한 React 통합  
- **핸들러 등록**: 자동 페이로드 타입 추론
- **디스패치 작업**: 컴파일 타임 페이로드 유효성 검사

## 링크

- **TypeDoc**: [ActionPayloadMap.md](./core/src/interfaces/ActionPayloadMap.md)
- **타입 시스템 가이드**: [액션 타입 시스템](/en/guide/patterns/action/type-system)
- **사용 예제**: [액션 예제](/en/examples/action-only)
