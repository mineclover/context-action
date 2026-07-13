# Implementation Playbook 표준 컨벤션

이 문서는 implementation-playbook에서 정리한 구조를 저장소 전반에서 재사용할 수 있도록 고정한 표준 컨벤션입니다. 목표는 “예제가 잘 보이는 것”이 아니라, 복잡한 로직이 늘어나도 같은 방식으로 설계, 구현, 테스트, 문서화할 수 있게 만드는 데 있습니다.

## 언제 이 컨벤션을 쓰는가

다음 조건 중 둘 이상이 보이면 이 컨벤션을 권장합니다.

- 입력 검증과 후속 처리 흐름이 분리되어야 한다
- 비동기 단계가 2개 이상 존재한다
- 성공/실패/리셋/재시도 상태가 모두 필요하다
- activity log, analytics, ref focus 같은 side effect가 함께 움직인다
- 문서, 예제, 테스트를 같은 계약으로 묶어야 한다

작은 기능은 business 또는 view 파일 수를 줄일 수 있지만, action handler 등록은 아래 Handler Registry 규칙을 항상 따릅니다.

## 표준 폴더 구조

```text
scenario/
├── ScenarioExample.tsx
├── ScenarioExamplePage.tsx
├── contexts/
│   └── ScenarioContexts.tsx
├── business/
│   ├── scenarioDraft.ts
│   ├── scenarioValidation.ts
│   ├── scenarioResult.ts
│   ├── scenarioActivity.ts
│   ├── scenarioStateMachine.ts
│   └── scenarioBusiness.ts
├── handlers/
│   ├── ScenarioHandlers.tsx
│   ├── scenarioHandlerSupport.ts
│   ├── useScenarioDraftHandlers.tsx
│   └── useScenarioSubmissionHandlers.tsx
├── actions/
│   └── useScenarioActions.ts
├── hooks/
│   └── useScenarioData.ts
└── views/
    └── ScenarioView.tsx
```

## 레이어별 책임

### `contexts/`

- Action, Store, Ref 경계를 정의한다
- 초기 상태를 둔다
- 상태 타입은 여기서 import해서 조립한다

### `business/`

- 순수 함수만 둔다
- draft 기본값
- validation issue 계산
- 결과 계산
- activity event 정의
- 명시적 상태 전이 함수

문자열 문구, DOM focus, analytics 호출은 넣지 않습니다.

### `handlers/`

- 최신 store 값을 읽는다
- `business` 순수 함수를 호출한다
- state machine 전이를 적용한다
- ref focus, scroll, logging 같은 side effect를 조율한다

핸들러는 관심사별로 쪼갭니다.

- `useScenarioDraftHandlers`
- `useScenarioSubmissionHandlers`
- 필요하면 `useScenarioApprovalHandlers`, `useScenarioSyncHandlers` 등으로 분리

단일 handler 기능을 포함한 모든 handler는 도메인 Handler Registry를 통해 등록합니다. Page, View, Context 파일은 Registry를 마운트·조합만 하며 `use*ActionHandler`를 직접 호출하지 않습니다.

### `actions/`

- view가 쓰는 dispatch helper만 둔다
- payload shaping 정도만 허용한다

### `hooks/`

- store 구독
- view 전용 파생값 계산
- state machine 상태를 화면용 label/message로 해석

### `views/`

- 렌더링과 입력 전달만 담당한다
- validation 규칙, quote 계산, 상태 전이 로직을 직접 품지 않는다

## 명시적 상태 머신 규칙

복잡한 async 흐름은 `status string` 하나로 끝내지 말고, 명시적 상태 머신으로 고정합니다.

최소 규칙:

- 상태는 workflow phase로 이름 짓는다
- 이벤트는 user intent 또는 system outcome으로 이름 짓는다
- 전이 함수는 순수 함수로 유지한다
- side effect는 handler에서 실행한다
- view는 상태를 해석한 결과만 렌더링한다

자세한 개념은 [명시적 상태 머신](/ko/context-layered/patterns/explicit-state-machine) 문서를 봅니다.

## activity log 규칙

activity log는 화면용 문자열을 바로 push하지 않습니다.

1. `business/scenarioActivity.ts`에서 도메인 이벤트를 정의
2. handler는 이벤트를 append
3. `scenarioHandlerSupport.ts`에서 화면용 text와 tone으로 매핑

이렇게 해야 로그, analytics, 테스트가 같은 이벤트를 기준으로 움직입니다.

## 테스트 규칙

최소 검증은 다음 네 가지를 고정합니다.

1. invalid submit 시 field error와 focus 이동
2. valid submit 시 결과 계산과 success 상태 전이
3. success 이후 draft 변경 시 idle 또는 다음 대기 상태로 복귀
4. reset 시 baseline 상태 복원

추천 명령:

- `pnpm test:canonical-example`
- `pnpm --dir example type-check`
- `pnpm --dir example build:fast`
- `pnpm docs:build`

## 문서 규칙

새 시나리오를 추가하면 최소한 다음도 같이 맞춥니다.

- 예제 설명 문서
- state machine 문서 연결
- PatternsOverview 또는 scenario library에서 진입 링크
- source registration

## 권장 읽기 순서

1. `contexts`
2. `business/draft`
3. `business/validation`
4. `business/result`
5. `business/stateMachine`
6. `handlers/submission`
7. `handlers/support`
8. `actions`
9. `hooks`
10. `views`
11. integration point

## 관련 자료

- [Canonical Order Form 예제](/ko/examples/canonical-order-form)
- [명시적 상태 머신](/ko/context-layered/patterns/explicit-state-machine)
- [안정성 테스트 사이클](/ko/context-layered/stability-test-cycle)
- repo-local skill: `skills/context-action-implementation-playbook/SKILL.md`
