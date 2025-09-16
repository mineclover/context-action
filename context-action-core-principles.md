# Context-Action Framework Core Principles

> 이 문서는 Context-Action 프레임워크의 핵심 원칙과 패턴을 정리한 임시 문서입니다.

## 🎯 핵심 철학

### 1. 비즈니스 로직의 완전한 분리
- **모든 로직을 Context-Action 시스템으로 위임**
- 컴포넌트는 순수하게 UI 렌더링에만 집중
- Props 의존성을 극단적으로 최소화

### 2. 단방향 의존성 원칙
- **상위 컨텍스트는 하위 컨텍스트를 모른다**
- **하위 컨텍스트가 상위 컨텍스트 데이터를 활용**
- 느슨한 결합과 높은 재사용성 확보

## 📋 Props 사용 원칙

### ✅ Props를 써도 되는 경우

#### 1. 디자인 시스템과 컴포넌트 조합
```typescript
// UI 컴포넌트의 시각적 속성
<Button variant="primary" size="large">Submit</Button>
<Card className="shadow-lg">...</Card>
<Modal isOpen={true} onClose={handleClose} />
```

#### 2. 컴포넌트의 고유 식별자 교환
```typescript
// 컴포넌트를 구분하기 위한 식별자
<UserProfile userId="user-123" />
<ProductCard productId="prod-456" />
<OrderSummary orderId="order-789" />

// 실제 사용 예시
function UserProfile({ userId }: { userId: string }) {
  // Context-Action으로 해당 사용자 데이터 처리
  const userStore = useUserStore('profiles');
  const currentUser = useStoreValue(userStore);

  useEffect(() => {
    if (currentUser?.id !== userId) {
      dispatch('loadUser', { userId }); // Props로 받은 ID로 데이터 로드
    }
  }, [userId, currentUser?.id, dispatch]);

  return <div>User: {currentUser?.name}</div>;
}
```

#### 3. 외부 라이브러리와의 인터페이스
```typescript
// 외부 라이브러리가 요구하는 Props
<ReactMarkdown content={markdownText} />
<DatePicker value={selectedDate} onChange={handleDateChange} />
```

### ❌ Props를 쓰면 안 되는 경우

#### 1. Context-Action 로직에 props 개입
```typescript
// ❌ 비즈니스 로직을 props로 주입
<UserHandlers
  userStore={userStore}
  onUserUpdate={handleUpdate}
  config={businessConfig}
/>

// ✅ Context-Action이 모든 로직 처리
<UserHandlers />  // 필요한 데이터는 context/store에서
```

#### 2. 상태나 액션을 props로 전달
```typescript
// ❌ 상태를 props로 내려보내기
<UserProfile user={user} onUpdate={handleUpdate} />

// ✅ Context-Action으로 상태 관리
<UserProfile userId="user-123" />  // 식별자만 props로
```

#### 3. 컴포넌트 간 데이터 통신을 props로 처리
```typescript
// ❌ Props로 데이터 전달
<ParentComponent>
  <ChildA onDataChange={handleDataFromA} />
  <ChildB data={dataFromA} />
</ParentComponent>

// ✅ Context-Action으로 데이터 공유
<ParentComponent>
  <ChildA />  // Context-Action으로 데이터 공유
  <ChildB />  // Context-Action으로 데이터 접근
</ParentComponent>
```

### 💡 Props 사용 판단 기준

**Props를 써도 되는 경우:**
- 컴포넌트의 **시각적 특성** (variant, size, className)
- 컴포넌트의 **고유 식별자** (userId, productId, orderId)
- **외부 라이브러리** 인터페이스 요구사항
- **순수 UI 컴포넌트**의 설정값

**Props를 쓰면 안 되는 경우:**
- **비즈니스 로직** 관련 데이터
- **상태 관리** 관련 데이터
- **액션 핸들러**나 콜백 함수
- **컴포넌트 간 통신**을 위한 데이터

## 🏗️ Context 분리 기준

### 1. 페이지별 분리
```typescript
- UserProfileContext  // 사용자 프로필 페이지
- ShoppingCartContext // 장바구니 페이지
- CheckoutContext     // 체크아웃 페이지
```

### 2. 기능별 분리
```typescript
- AuthenticationContext // 인증 기능
- PaymentContext       // 결제 기능
- NotificationContext  // 알림 기능
```

### 3. 기능 구성별 분리
```typescript
- ValidationContext    // 검증 로직들
- DataSyncContext     // 데이터 동기화
- ErrorHandlingContext // 에러 처리
```

## 🔗 데이터 흐름 패턴

### Provider 계층 구조
```tsx
// 상위 → 하위 순서로 Provider 배치
<UserContextProvider>          {/* 상위: 사용자 정보 */}
  <AuthContextProvider>        {/* 중간: 인증 상태 */}
    <PaymentContextProvider>   {/* 하위: 결제 (User + Auth 데이터 활용) */}
      <App />
    </PaymentContextProvider>
  </AuthContextProvider>
</UserContextProvider>
```

### 하위 컨텍스트에서 상위 데이터 활용
```typescript
function PaymentHandlers() {
  // 상위 컨텍스트들의 데이터 가져오기
  const userStore = useUserStore('profile');    // 상위 User 데이터
  const authStore = useAuthStore('session');    // 상위 Auth 데이터
  const paymentStore = usePaymentStore('card'); // 현재 Payment 데이터

  const processPaymentHandler = useCallback(async (payload) => {
    const user = userStore.getValue();
    const session = authStore.getValue();
    const card = paymentStore.getValue();

    // 모든 데이터를 조합해서 처리
    await processPayment({
      userId: user.id,
      sessionToken: session.token,
      cardInfo: card,
      ...payload
    });
  }, [userStore, authStore, paymentStore]);

  usePaymentActionHandler('processPayment', processPaymentHandler, {
    priority: 100,
    id: 'payment-process-handler',
    blocking: true
  });
}
```

## ⚙️ Handler 등록 베스트 프랙티스

### 1. Hook 방식 (기본)
```typescript
// 정적 등록 - React hooks 규칙 준수
usePriorityTestActionHandler('priorityTest', handler, {
  priority: 100,
  id: 'user-login-handler',  // 명확한 ID로 중복 방지
  blocking: true
});
```

### 2. Register 객체 방식 (고급)
```typescript
// 등록 여부 명확히 제어
const register = usePriorityTestActionRegister();

React.useEffect(() => {
  const unregister = register.register('priorityTest', handler, {
    priority: 100,
    id: 'user-login-handler',  // ID로 중복 등록 방지
    blocking: true
  });

  return unregister;  // cleanup에서 해제
}, []);
```

### 3. Handler ID 전략
```typescript
// 명확하고 유니크한 식별자 사용
{
  id: 'user-auth-login',       // 영역-기능-액션
  id: 'payment-process-card',  // 의미있는 네이밍
  id: 'validation-email-check' // 중복 방지 가능
}
```

## 🚫 자주 하는 실수들

### 1. React Hooks 규칙 위반
```typescript
// ❌ 루프 안에서 hook 호출
configs.forEach(config => {
  useActionHandler(action, handler); // React 규칙 위반
});

// ❌ 조건부 Hook 호출
if (shouldRegister) {
  useActionHandler(action, handler); // React 규칙 위반
}

// ✅ 정적 hook 호출
useActionHandler('action', handler, { id: 'static-handler' });
```

### 2. 의존성 역전
```typescript
// ❌ 상위가 하위 컨텍스트 참조
function UserContext() {
  const paymentStore = usePaymentStore();  // ❌ 의존성 역전
}

// ✅ 하위가 상위 컨텍스트 참조
function PaymentContext() {
  const userStore = useUserStore('profile');  // ✅ 올바른 방향
}
```

### 3. Props 과다 사용
```typescript
// ❌ Context-Action 영역에 props 개입
<Handlers
  store1={store1}
  store2={store2}
  config1={config1}
  // 끝없는 props
/>

// ✅ Context-Action이 모든 로직 처리
<Handlers />
```

## 🎯 실무 적용 예시

### 전자상거래 앱 구조
```typescript
// 계층 구조와 데이터 흐름
1. AppContext              // 앱 전역 설정
2. ├── UserContext         // 사용자 정보
3. ├── AuthContext         // 인증 상태 (User 데이터 활용)
4. └── ├── ProductContext  // 상품 (User 데이터 활용)
5.     ├── CartContext     // 장바구니 (User + Product 활용)
6.     └── PaymentContext  // 결제 (User + Auth + Cart 활용)
```

### 각 레이어의 역할
- **UserContext**: 사용자 기본 정보 관리
- **AuthContext**: 인증 상태 + 사용자 권한 (User 데이터 조합)
- **ProductContext**: 상품 정보 + 사용자 맞춤 추천 (User 데이터 조합)
- **CartContext**: 장바구니 + 사용자별 설정 (User + Product 조합)
- **PaymentContext**: 결제 처리 (모든 상위 데이터 조합)

## 💡 핵심 이점

### 1. 높은 재사용성
- 상위 컨텍스트는 하위를 모르므로 독립적으로 재사용 가능
- 새로운 하위 컨텍스트 추가 시 상위 수정 불필요

### 2. 쉬운 테스트
- 상위 컨텍스트만 Mock하면 하위 컨텍스트 테스트 가능
- 의존성이 명확하여 테스트 시나리오 작성 용이

### 3. 확장성
- 새로운 기능 추가 시 기존 구조에 영향 최소화
- 계층적 구조로 복잡성 관리 용이

### 4. 유지보수성
- 단방향 의존성으로 변경 영향도 예측 가능
- 비즈니스 로직이 컴포넌트에서 분리되어 수정 용이