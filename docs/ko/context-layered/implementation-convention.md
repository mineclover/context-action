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

## 구조 컨벤션 게이트

`pnpm convention:check`는 같은 feature root에 `contexts/`와 `handlers/`
디렉터리가 함께 있을 때 이를 canonical 표면으로 식별합니다. 그 아래의
직접 레이어 디렉터리만 검사하므로, 아직 마이그레이션하지 않은 advanced 및
compatibility 표면에는 canonical 명명 규칙을 일괄 적용하지 않습니다.

현재 게이트가 검사하는 내용은 다음과 같습니다.

- `contexts/` 파일은 `Context` 또는 `Contexts`로 끝납니다.
- `business/` 파일은 lower-camel 또는 kebab-case로 이름 짓고 React와
  `@context-action/*` import를 갖지 않습니다.
- `handlers/` 파일은 `*HandlerRegistry`, `*Handlers`, `*HandlerSupport`,
  `*HandlerDefinitions` 명명을 사용합니다. `index`와
  `handler-registry` 진입점은 예외로 허용합니다.
- `actions/` 파일은 `*Actions` 또는 `*ActionHandlers`로 이름 짓습니다.
- `hooks/` 파일은 `use*` 명명을 사용하며 `index`, `types` 진입점을
  허용합니다.
- `views/` 파일은 `*View`, `*Views` 또는 `*Grid` 같은 명시적 composite
  명명을 사용합니다.
- Context 모듈은 downstream 레이어를 import하지 않으며, View는 framework
  runtime·business·handler 모듈을 직접 import하지 않습니다.

파생 business 값은 View에 도달하기 전에 Hook 또는 Facade에서 계산합니다.
예를 들어 implementation-playbook의 packet과 quote preview는 Data Hook이
계산하고 View는 반환된 model만 렌더링합니다. usecase 전용 검사와 함께 다음
게이트를 실행합니다.

```bash
pnpm convention:check
pnpm --filter example check
```

현재 게이트는 canonical root 31곳을 검사하며 레이어 경로·명명 위반은
0건입니다. advanced 및 compatibility root는 마이그레이션 분류가 바뀔
때까지 이 자동 명명 범위에서 명시적으로 제외합니다.

비정형 `handlers/` 디렉터리를 조용히 무시하지 않습니다. 현재 분류와 근거는
`tools/context-action-lint/layered-surface-classification.json`에 두며, 검사기는
모든 비정형 디렉터리가 `advanced` 또는 `compatibility` 중 하나로 등록되어
있는지 확인합니다. 현재 manifest에는 advanced 비교 표면이 없고
compatibility object-context 표면 1곳이 있습니다. conditional permission,
action-based mouse, context-store mouse, enhanced context-store mouse
usecase는 canonical `contexts/`와 `handlers/` 표면에 편입되었습니다.
enhanced context-store usecase는 semantic command를 `actions/`, 순수 전이를
`business/`, Provider 조합을 `providers/`에서 분리합니다. memoization 비교도
canonical `contexts/`와 `actions/` 경계로 이동했으며 기존 model과 hook 경로는
compatibility re-export로 유지합니다.

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
- `pnpm --filter example run verify:conditional`
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
