# 코드 패턴 (Code Patterns)

설정, 액션 디스패치, 스토어 반응성, 비동기 파이프라인, 고빈도 DOM `RefContext` 전반을 다루는 Context-Action 패턴 디렉터리 및 적정 구현 레시피 안내입니다.

> 언제 **Level 1 Lite**, **Level 2 Headless-First Symmetric DI**, **Level 3 Full 6-Layer**를 고를지와 CI가 강제하는 컨벤션은 [모범 사례](./best-practices.md)에서 먼저 확인하세요.

---

## 상황별 적정 패턴 선택표

| 필요한 동작 | 권장 패턴 / 레시피 | 참고 문서 |
|---|---|---|
| 단일 도메인 React 위젯 (`1` Action + `1` Store + `Registry`) | Level 1 · Lite | [모범 사례 — Level 1](./best-practices.md#level-1--lite-단일-도메인-쿠폰-위젯) · [기본 설정 예제](../examples/basic-setup.md) |
| React 없이도 실행되고 언마운트/재마운트 간 상태를 유지하는 엔진 | Level 2 · Headless-First Symmetric DI (`ownership="shared"`) | [모범 사례 — Level 2](./best-practices.md#level-2--headless-first-symmetric-di-actionregister--createstore--shared-provider) |
| `BusinessActionIntent`와 `LayoutActionIntent`가 분리된 복합 피처 | Level 3 · Full 6-Layer (`contexts/business/handlers/actions/hooks/views`) | [표준 주문 폼 예제](../examples/canonical-order-form.md) |
| 조기 캐시 히트 반환, 검증 결과, 중단 사유(`abortReason`) 수신 | `dispatchWithResult()` + `controller.return(...)` / `controller.abort(...)` | [디스패치 패턴](./patterns/action/dispatch-patterns.md) |
| 실행 중인 비동기 핸들러 취소·리셋 또는 실시간 진행 스텝 기록 | `dispatch(..., { immediate: true })` 큐 선점 | [모범 사례 — 큐 우회](./best-practices.md#_3-직렬-큐-교착을-막기-위해--immediate-true-를-활용하세요) |
| Store 리렌더 없이 포커스·60fps 스크롤·DOM 직접 제어 | `createRefContext` (`useWaitForRefs`) | [RefContext 설정](./patterns/setup/ref-context-setup.md) · [Ref 기본 사용법](./patterns/ref/basic-usage.md) |

---

## 카테고리별 패턴 모음

### 설정 및 컨텍스트 경계 (Setup)
- [설정 개요](./patterns/setup/index.md) — 프로바이더 선택 및 경계 구성
- [기본 액션 설정](./patterns/setup/basic-action-setup.md) — `createActionContext`로 타입 안전한 액션 계약 구성
- [기본 스토어 설정](./patterns/setup/basic-store-setup.md) — `createStoreContext`로 도메인 스토어 번들 구성
- [RefContext 설정](./patterns/setup/ref-context-setup.md) — 명령형 DOM 및 외부 핸들 컨테이너
- [다중 컨텍스트 설정](./patterns/setup/multi-context-setup.md) — 비즈니스와 레이아웃 컨텍스트 조합
- [Provider 조합 설정](./patterns/setup/provider-composition-setup.md) — `composeProviders`를 활용한 깔끔한 루트 구성

### 액션 파이프라인 및 핸들러 등록 (Action)
- [액션 패턴 개요](./patterns/action/index.md)
- [기본 액션 사용법](./patterns/action/basic-usage.md) — 페이로드 맵 정의 및 기본 디스패치
- [디스패치 접근 패턴](./patterns/action/dispatch-access.md) — `useActionDispatch`, `useActionDispatchWithResult`, 4-역할 핸들러 훅
- [디스패치 패턴](./patterns/action/dispatch-patterns.md) — 우선순위 실행, `dispatchWithResult()`, 동시성 옵션
- [핸들러 상태 접근](./patterns/action/handler-state-access.md) — 오래된 클로저 없는 지연 조회(`store.getValue()`)
- [등록 패턴](./patterns/action/register-patterns.md) — 핸들러 등록 및 생명주기 정리
- [타입 시스템](./patterns/action/type-system.md) — `ActionPayloadMap`, 결과 타입 추론 및 제네릭 활용
- [고급 패턴](./patterns/action/advanced-patterns.md) — 가드, 우선순위 점프(`controller.jumpToPriority`), 중단 처리

### 스토어 반응성 및 구독 (Store)
- [기본 스토어 사용법](./patterns/store/basic-usage.md) — Store 생성, 조회 및 불변 업데이트
- [useStoreValue 패턴](./patterns/store/useStoreValue-patterns.md) — 뷰 컴포넌트에서의 안전한 셀렉터 구독
- [경로 기반 구독](./patterns/store/path-based-subscription.md) — `useStorePath`를 통한 세밀한 부분 구독
- [useStoreManager API](./patterns/store/useStoreManager-api.md) — 핸들러 설정 계층에서 스토어 레지스트리 접근
- [스토어 설정](./patterns/store/store-configuration.md) — 비교기, 동등성 검사, `batched` vs `immediate` 알림 모드

### 비동기 실행 및 동시성 (Async)
- [비동기 패턴 개요](./patterns/async/index.md)
- [실시간 상태 접근](./patterns/async/real-time-state-access.md) — `await` 경계를 넘는 최신 Store 스냅샷 조회
- [대기 후 실행](./patterns/async/wait-then-execute.md) — 디바운스, Ref 대기, 취소 가능한 비동기 흐름

### 명령형 DOM 및 RefContext (Ref)
- [RefContext 기본 사용법](./patterns/ref/basic-usage.md) — `useRefHandler`, `waitForRefs`, 비반응형 애니메이션·스크롤 루프
- [React Refs 아키텍처 가이드](../concept/react-refs-guide.md) — `RefContext`와 `Store` 선택 기준

---

## 런타임 테스트 체크리스트

- **Store의 기본 RAF 배칭(`batched` 모드)을 고려하세요**: Fake timer 테스트에서는 `16ms` 틱으로 RAF 배치를 플러시하고, 실제 타이머 통합 테스트에서는 `waitFor(...)`로 화면 반영을 확인한 뒤 다음 클릭으로 진행하세요. ([안정성 및 테스트 사이클](../context-layered/stability-test-cycle.md))
- **Guard 중단·검증 실패 추적은 `{ when: 'always' }`** 옵션을 지정한 Observer로 단언하세요.
- **`business/` 순수 전이 함수부터 헤드리스로 검증**한 뒤 React 통합 테스트를 올리면 원인 추적이 훨씬 빨라집니다.
