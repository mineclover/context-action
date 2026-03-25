# Context-Layered 폴더 구조

이 문서는 Context-Layered Architecture를 프로젝트 폴더 구조로 어떻게 풀어내는지 설명합니다. 핵심은 “기술별 분리”가 아니라 “책임별 분리”입니다.

## 권장 구조

```text
pages/checkout/
├── contexts/
├── business/
├── handlers/
├── actions/
├── hooks/
├── views/
└── CheckoutPage.tsx
```

## 레이어별 상세 역할

### 1. `contexts/`

여기에는 타입 정의와 context 생성만 둡니다.

```ts
export interface CheckoutStores {
  'checkout-data': CheckoutData;
  'validation-state': ValidationState;
}

export interface CheckoutActions extends ActionPayloadMap {
  validate: CheckoutData;
  submit: OrderData;
  reset: void;
}
```

이 레이어는 구조의 경계를 정하는 곳입니다. handler 등록이나 business logic 구현은 넣지 않는 것이 좋습니다.

### 2. `business/`

순수 비즈니스 로직을 둡니다.

- validation 규칙
- 가격 계산
- 상태 전이 규칙
- 파생 데이터 계산

여기 함수는 가능하면 입력만으로 결과가 결정되도록 유지하세요.

### 3. `handlers/`

실행 흐름과 side effect를 담당합니다.

- 최신 store 값 읽기
- business 함수 호출
- store 업데이트
- API 호출
- ref focus나 scroll 같은 imperative 작업

즉, “실제로 일이 일어나는 곳”이지만, UI 표현은 하지 않습니다.

### 4. `actions/`

view가 직접 `dispatch('someAction', payload)`를 남발하지 않도록, 의미 있는 함수로 감싸는 레이어입니다.

```ts
export function useCheckoutActions() {
  const dispatch = useCheckoutDispatch();

  return {
    validate: (data: CheckoutData) => dispatch('validate', data),
    submit: (order: OrderData) => dispatch('submit', order),
  };
}
```

### 5. `hooks/`

store를 view 친화적인 형태로 구독하는 레이어입니다.

```ts
export function useCheckoutData() {
  return {
    checkout: useStoreValue(checkoutStore),
    validation: useStoreValue(validationStore),
    isFormValid: useStoreValue(validationStore, (state) => state.isValid),
  };
}
```

### 6. `views/`

렌더링과 입력 전달만 담당합니다.

- 폼 렌더링
- 버튼 클릭
- 입력 값 전달
- 상태 표시

가격 계산, 검증 규칙, API 호출은 view 안에 넣지 않는 편이 좋습니다.

### 7. `Page`

최상위 페이지는 provider 구성과 handler 등록을 담당합니다.

```tsx
export default function CheckoutPage() {
  useCheckoutValidateHandler({ moduleId: 'main', apiClient, validator });
  useCheckoutSubmitHandler({ moduleId: 'main', apiClient, validator });

  return (
    <CheckoutStoreProvider>
      <CheckoutActionProvider>
        <CheckoutView />
      </CheckoutActionProvider>
    </CheckoutStoreProvider>
  );
}
```

## 구조를 이렇게 나누는 이유

- 새 기능 추가 시 어느 폴더에 들어가야 할지 명확합니다.
- 리뷰할 때 “이 로직이 왜 view에 있지?” 같은 혼선을 줄일 수 있습니다.
- 테스트 범위를 레이어 기준으로 나누기 쉽습니다.
- 같은 기능 안에서도 business, UI, orchestration을 병렬 작업하기 좋습니다.

## 실무 팁

- `business/` 함수는 React hook에 의존하지 않게 유지하세요.
- `handlers/`는 store와 외부 의존성을 읽되, 계산은 `business/`에 위임하세요.
- `hooks/`는 view에 필요한 파생 값을 만들되, 상태를 바꾸지 마세요.
- `views/`는 복잡한 조건문보다 상태 표현에 집중하게 하세요.

## 함께 읽으면 좋은 문서

- [Context-Layered 개요](/ko/context-layered/context-layered-guide)
- [핸들러 레지스트리](/ko/context-layered/architecture/handler-registry)
- [안정성 테스트 사이클](/ko/context-layered/stability-test-cycle)
- [Canonical Order Form 예제](/ko/examples/canonical-order-form)
