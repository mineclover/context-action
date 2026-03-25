# 마이그레이션 가이드: MVVM에서 Context-Layered로

이 문서는 기존 MVVM 또는 단순 React Context 구조에서 Context-Layered Architecture로 이동할 때의 기준점을 설명합니다. 핵심은 “한 번에 전부 바꾸는 것”이 아니라, 책임 분리 기준에 맞춰 점진적으로 재배치하는 것입니다.

## 가장 큰 차이

| 관점 | 기존 MVVM/단순 구조 | Context-Layered |
|------|----------------------|-----------------|
| 초점 | 개념적 계층 | 구현 가능한 책임 계층 |
| 비즈니스 로직 | ViewModel이나 컴포넌트에 섞임 | `business`와 `handlers`로 분리 |
| 의존성 주입 | context 또는 import에 의존 | props 기반 DI 가능 |
| 실행 흐름 | 컴포넌트 중심 | handler 중심 |
| 테스트 | 컴포넌트 통합 테스트 위주 | 레이어별 테스트 가능 |

## 이전 구조와 이후 구조

### 이전

```text
src/components/checkout/
├── CheckoutModel.tsx
├── CheckoutViewModel.tsx
├── CheckoutView.tsx
└── CheckoutPerformance.tsx
```

### 이후

```text
src/pages/checkout/
├── contexts/
├── business/
├── handlers/
├── actions/
├── hooks/
├── views/
└── CheckoutPage.tsx
```

## 권장 마이그레이션 순서

### 1. Context 정의부터 분리

먼저 액션과 스토어 타입, provider 생성 코드를 `contexts/`로 옮깁니다. 이 단계에서는 동작 변경보다 “경계 분리”가 목적입니다.

### 2. 순수 로직을 `business/`로 이동

다음 항목을 순수 함수로 떼어냅니다.

- validation
- 계산 규칙
- 상태 전이 규칙
- 도메인별 파생 값 계산

이 단계가 끝나면 UI와 handler에서 계산 코드가 눈에 띄게 줄어듭니다.

### 3. side effect를 `handlers/`로 이동

API 호출, store 업데이트, ref focus, 로그 기록 같은 실행 흐름은 handler에 둡니다.

```ts
useCheckoutHandler('submit', async (payload) => {
  const current = checkoutStore.getValue();
  const result = createOrderDraft(payload, current);

  if (result.success) {
    checkoutStore.setValue(result.nextState);
    await apiClient.save(result.order);
  }
});
```

### 4. view에서 직접 dispatch 코드를 `actions/`로 감싸기

```ts
export function useCheckoutActions() {
  const dispatch = useCheckoutDispatch();

  return {
    submit: (order: OrderData) => dispatch('submit', order),
    reset: () => dispatch('reset'),
  };
}
```

이렇게 하면 view가 action 이름과 payload 모양에 덜 직접적으로 결합됩니다.

### 5. store 직접 접근을 `hooks/`로 정리

view가 여러 store를 직접 읽기 시작하면 다시 복잡도가 올라갑니다. view용 데이터 접근은 `hooks/`에 모으는 것이 좋습니다.

### 6. 최종적으로 `Page`에서 조립

provider 구성, handler 등록, 외부 의존성 주입은 페이지에서 담당하게 정리합니다.

## 마이그레이션 체크리스트

- context 생성 코드가 `contexts/`에 모였는가
- 검증과 계산 로직이 `business/`로 분리되었는가
- API 호출과 store 업데이트가 `handlers/`에 모였는가
- view는 hook과 action만 사용하도록 단순화되었는가
- 테스트가 컴포넌트 하나에 몰리지 않고 레이어별로 분산되었는가

## 흔한 실수

- `views/`에서 store를 직접 update하기
- `handlers/` 안에 검증 규칙을 길게 쓰기
- `actions/` 없이 view에서 dispatch 이름을 직접 남발하기
- `contexts/`에 runtime logic을 넣기

## 추천 후속 문서

- [React Context 마이그레이션](/ko/guide/react-context-migration)
- [Context-Layered 개요](/ko/context-layered/context-layered-guide)
- [안정성 테스트 사이클](/ko/context-layered/stability-test-cycle)
- [Canonical Order Form 예제](/ko/examples/canonical-order-form)
