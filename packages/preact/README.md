# @context-action/preact

Context-Action의 Action 계약과 외부 상태를 Preact View에 연결하는 **공개 preview adapter**입니다. React API 전체를 이식하거나 Core의 Store를 새로 정의하지 않습니다. 현재 Core 공개 API에는 Store 구현이 없습니다.

## 책임

`createDispatchContext`는 Host가 제공한 Core `ActionDispatcher`를 Preact Context에 전달합니다. Register 생성·Handler 등록·파괴는 Host 책임입니다.

`connectSourceSignal`은 `getSnapshot / subscribe` 계약을 읽기 전용 Signal로 투영합니다. 연결은 즉시 구독하므로 컴포넌트 render 안에서 만들지 않고, UI/세션의 종료 시점에 `dispose()`합니다. 원본 Source를 파괴하거나 Signal에서 원본으로 역방향 쓰기를 하지 않습니다.

`createSourceContext`와 `useProjection`은 컴포넌트 트리 하위로 신호를 공급하고, 원본 신호로부터 미세 단위 파생 읽기 전용 신호(`ReadonlySignal<T>`)를 투영(Projection)할 수 있도록 지원합니다.

```text
Host-owned ActionRegister → createDispatchContext → use<Domain>Actions  → View
Host-owned ReadableSource → connectSourceSignal  → use<Domain>Projection → Fine-grained Signal → View
```

## 시작 경로

[구조와 적용 가이드](../preact-ui/docs/02-integration-guide.md) → [공개 API](../preact-ui/docs/03-api.md) → [실행 예제](../preact-ui/examples/README.md).

마운트와 DOM 관리는 [`@context-action/preact-ui`](../preact-ui/README.md)가 담당합니다. 이 패키지는 DOM Root를 생성하거나 소유하지 않습니다.

## 공개 preview 상태

`@context-action/preact@0.1.0`은 공개 preview 후보입니다. `private: false`와
`publishConfig.access: public`을 사용하며, Core/React 안정 cohort와 분리된
Preact 공개 cohort에서 보호된 workflow로 배포합니다. 0.x 계약이므로 API와
지원 범위는 1.0 승격 전 변경될 수 있습니다.

```sh
pnpm add @context-action/preact preact @preact/signals
```

의존성·lockfile·빌드·packed consumer 검증 상태와 재현 명령은
[검증 기록](../preact-ui/docs/04-validation.md)과 [Preact 공개 preview 릴리즈 계획](../../releases/PREACT_PUBLIC_0.1.0.md)을
참조합니다. 이 패키지는 DOM root를 소유하지 않으므로 렌더링·hydration이
필요한 소비자는 [`@context-action/preact-ui`](../preact-ui/README.md)를 함께
설치해야 합니다.
