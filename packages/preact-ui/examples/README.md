# 실행 예제

규칙은 [컨벤션](../docs/01-dom-ownership.md), API 의미는 [API 문서](../docs/03-api.md)가 정본입니다. 이 폴더는 실행 가능한 소비/구현 사례만 관리합니다.

```text
index.html + main.tsx
├─ shared/counter-model.ts                 Core Action + Native domain state
├─ template-island/mount-counter.tsx        Template clone + two shared-state islands
├─ web-component/counter-element.tsx        Standard component API + private Preact renderer
└─ projected-order/                         Context-Layered Signals 프로젝션 & 비즈니스 훅 표준 레퍼런스
   ├─ business/                             순수 비즈니스 로직 (FSM, 검증, 계산 공식)
   ├─ contexts/                             Preact Dispatch & Source Context 주입
   ├─ handlers/                             ActionRegister & 모델 오케스트레이션
   ├─ projections/                          useOrderProjection (Signal computed 파생 뷰모델)
   ├─ actions/                              useOrderActions (Semantic Action Intent 훅)
   ├─ views/                                OrderSummaryView + OrderWorkspaceView
   └─ mount-order-workspace.tsx             mountPreact 기반 호스트 마운트 컨트롤러
```

Template의 두 패널은 하나의 모델을 공유합니다. 한쪽의 Increment는 두 패널의 값에 반영됩니다. "두 Island 해제"는 View → source connection → model 순서로 해제합니다. Custom Element는 독립 상태이며 연결 해제/재연결로 그 값이 초기화되지 않아야 합니다.

## 실행

Node 24.11 이상, pnpm 10.30.3 기준입니다. 현재 lockfile 완료 여부는 [검증 기록](../docs/04-validation.md)을 먼저 확인합니다.

```sh
# 초기 템플릿 통합 단계: 새 의존성을 해석하고 변경된 lockfile을 검토/커밋
pnpm install --no-frozen-lockfile
pnpm --filter @context-action/core build
pnpm --filter @context-action/preact build
pnpm --filter @context-action/preact-ui build
pnpm --filter @context-action/preact-ui examples:dev
```

개발 서버가 출력한 주소를 엽니다. `examples:build`는 예제용 번들을 `example-dist`에 만듭니다. 이 번들은 npm 라이브러리의 dist와 별개입니다.

Root 내부를 검색하는 코드는 해당 Owner의 구현 또는 렌더링 테스트에만 둡니다. 외부 Host 코드는 Controller, property, event로 통신합니다. 예제의 모델은 reference fixture이며 Core의 새 Store API가 아닙니다.
