# 개발 컨벤션 인덱스

이 문서는 Context-Action 저장소에서 implementation-playbook 계열 개발 컨벤션을 굳히기 위해 가장 먼저 봐야 할 중심 인덱스입니다. 문서가 많아졌기 때문에, 어떤 문서가 “원칙”, 어떤 문서가 “예제”, 어떤 문서가 “검증”인지 한 번에 묶어보는 용도로 씁니다.

## 아키텍처·품질·의도 관리 체계 한눈에 보기

Context-Action은 **핵심 3축**을 중심으로 도메인 크기에 맞게 **3단계로 점진 도입**하며, 규칙을 **CI 자동 차단 게이트**와 **권고·리뷰 규율**로 명확히 나누어 관리합니다:

- **핵심 3축 (Core 3 Axes)**:
  1. **Action Pipeline** (`@context-action/core`, `ActionContext`) — 승인(`Guard`) → 실행·결과(`Command`/`Result`) → 정산 후 관찰(`Observer`) 4-역할 파이프라인.
  2. **Reactive Store** (`@context-action/store-core`, `Store`, `TimeTravelStore`) — `handlers/`에서는 `store.getValue()`로 지연 읽기만 수행하고, `hooks/`에서 선언적으로 구독(`useStoreValue` / `useStoreSelector` / `useStorePath`).
  3. **Imperative Ref** (`RefContext`) — 고빈도 DOM, 캔버스, 커스텀 엘리먼트 제어를 리렌더 없이 수행.
- **3단계 점진 도입 사다리 (Progressive Adoption)**:
  - **Level 1 · Lite**: 단일 도메인의 `createActionContext` + `createStoreContext` + 로컬 Registry 내 `useActionHandler`.
  - **Level 2 · Headless-First Symmetric DI**: 순수 `business/` + 프레임워크 중립 `runtime/`(`ActionRegister` + `createStore` / `createStateStore`) 조립 후 React에서 `ownership="shared"`로 주입(`/foundations/react/headless-di`).
  - **Level 3 · Full 6-Layer**: `contexts / business / runtime(선택) / handlers / actions / hooks / views` 분리, `Business` vs. `Layout` 인텐트 분리, 도메인 코드·이벤트 및 명시적 상태 머신([packages/template-react](../../../packages/template-react/README.md) 스타터 및 `/patterns/implementation-playbook`).
- **CI 자동 차단 7대 규칙 (`pnpm convention:check` — `example/src` + `packages/template-react/src` 기본 검사, 외부 앱은 `--root <dir>`)**:
  1. 핸들러 등록 위치 제한 (`handlers/` 또는 `*HandlerRegistry` 바깥 등록 차단)
  2. Provider 중첩 순서 고정 (`Action → Store → Ref → HandlerRegistry`)
  3. 정식 레이어 파일명 및 단방향 import 경계 (`contexts / business / runtime / handlers / actions / hooks / views`)
  4. 비정형 `handlers/` 표면 명시 분류 (`tools/context-action-lint/layered-surface-classification.json`)
  5. `no-deprecated-effect-handler` (deprecated `use*ActionEffectHandler` / `registerEffect` 호출 차단)
  6. `no-store-access-in-actions` (`actions/` 내 런타임 Store import 및 `use*Store` / `getStore` / `setValue` / `update` 직접 변이 차단)
  7. `no-store-subscription-in-handlers` (`handlers/` 및 `*HandlerRegistry` 내 `use*StoreValue` / `use*StoreSelector` / `use*StorePath` 반응형 구독 차단; 의도적 예외는 `tools/context-action-lint/rule-exceptions.json`에 사유를 등록하고 stale/미등록 시 fail-closed)
- **권고 / 크로스-레포 규율**: 4-역할 핸들러 훅 우선 사용, `BusinessActionIntent` vs. `LayoutActionIntent` 분리(`No Mixed Payloads`), 핸들러 `useCallback` 안정화, `hooks/`에서 도메인 코드·이벤트 문자열 번역, IIC(`CA-IIC-*`), 2-Second State Rule(`CA-SPEC-EVIDENCE-001`), 통합 트라이어드(`ttsc-ex` · `oa-sdk`) 잠금.

## 작업별 시작점

어떤 산출물을 소유하는지 먼저 정하고 그에 맞는 경로를 선택합니다. 필요한 모든
문서를 처음부터 읽을 필요는 없습니다.

| 바꾸려는 대상 | 먼저 읽을 문서 | 이어서 사용할 것 |
| --- | --- | --- |
| 스펙·의도·Store 선택에서 코드 작성·게이트까지 한 번에 연결할 때 | [스펙 기반 코드 작성 가이드](/ko/context-layered/spec-to-code-authoring-guide) | `pnpm convention:check && pnpm docs:check` |
| package 책임, dependency, export | [패키지 경계 및 코드베이스 관리](/ko/context-layered/package-boundary-convention) | `pnpm package-boundary:check` |
| 레포지토리 API 전체 구성, 예제 라우트·데모, 관리 문서 목록 | [저장소 표면 카탈로그](/ko/context-layered/repository-surface-catalog) | `pnpm verify:surface-catalog` |
| 패키지 전반의 Store·상태 저장소 선택 기준과 사용법 | [Store별 선택 기준 및 사용법 가이드](/ko/context-layered/store-selection-and-usage-guide) | `pnpm package-boundary:check` |
| 공개 가이드, API 참조, README 경로, 생성 문서 | [문서 및 개발 관리 컨벤션](/ko/concept/documentation-development-conventions) | `pnpm docs:check` |
| 지속되는 아키텍처 경계 또는 compatibility 예외 | [아키텍처 결정 기록](/ko/context-layered/decisions/) | 연결된 package/guide와 집중 증거 |
| 기능, 버그, workflow 계약 | [스펙·이슈·문서 관리](/ko/context-layered/change-management-convention) | 변경 분류에 맞는 gate |
| UX 동작, 암묵적 합의, 설계 접근성 트레이드오프 | [상호작용 의도 계약(IIC) 컨벤션](/ko/context-layered/interaction-intent-contract) | 의도·발견 가능성·화면 기술 후속 증거 |
| `ttsc-ex` · `oa-sdk` 계약 잠금, 인텐트 분리, 레이아웃 위계 동기화 | [통합 트라이어드 자율 동기화 가이드](/ko/context-layered/triad-evidence-sync-guide) | `pnpm docs:management && pnpm llms:check && pnpm convention:check` |
| canonical example/usecase | [Implementation Convention](/ko/context-layered/implementation-convention) | `pnpm convention:check`와 example check |
| 표준 테스트 계층(`T1`–`T4`) 및 시나리오(`S1`–`S6`) | [테스트 컨벤션 및 시나리오 표준](/ko/context-layered/testing-convention) | `pnpm convention:check`와 경계별 테스트 스위트 |

PR 전 로컬 우선 검증 및 영수증 발급([Local-First Verification Policy](../../LOCAL_FIRST_VERIFICATION_POLICY.md))에는 `pnpm verify:quick`(빠른 스모크) 또는 `pnpm verify`(전체 17단계 로컬 검증)를 실행하고 `pnpm verify:receipt`로 무결성을 확인합니다. 릴리스 후보 사전 점검에는 `pnpm verify:all`을 사용하며, 이는 집중 증거를 대체하지 않고 저장소 게이트를 조합합니다.

## 문서 역할별 분류

### 1. 표준을 고정하는 문서

- [스펙 기반 코드 작성 가이드](/ko/context-layered/spec-to-code-authoring-guide)
  - IIC·3-Tier 상태 분류에서 `contexts / business / runtime / handlers / actions / hooks / views` 4-역할 파이프라인 및 검증 게이트까지 1:1로 연결하는 단일 작성 블루프린트
- [컨벤션 정합성 계획](/ko/context-layered/convention-alignment-plan)
  - 현재 상태 분류, Provider 순서, 마이그레이션 완료 조건
- [패키지 경계 및 코드베이스 관리](/ko/context-layered/package-boundary-convention)
  - package ownership, dependency 방향, package lifecycle, cleanup 규칙
- [저장소 표면 카탈로그](/ko/context-layered/repository-surface-catalog)
  - 워크스페이스 패키지 API, 정식 예제 라우트·데모, 관리 문서 체계 기본 규격 및 전체 목록 ([CA-SURFACE-CATALOG-001](/ko/context-layered/decisions/CA-SURFACE-CATALOG-001))
- [Mutative Core 히스토리 및 원본 참조](/ko/context-layered/mutative-core-history)
  - Mutative 소스 계보, 반영한 upstream 수정, 라이선스, 동기화 규칙
- [Implementation Convention](/ko/context-layered/implementation-convention)
  - implementation-playbook 계열 개발의 표준 규칙
- [Core Action Contracts](../../../packages/core/docs/action-contracts.md)
  - framework-neutral dispatch, lifecycle trace, action과 state 경계
- [XState & Effect 통합 계약](../../../packages/xstate/docs/xstate-effect-integration.md)
  - 분리된 `.` / `./effect` 어댑터 경계, 핵심 철학 불변 조건, Standard Schema 가드, 트랜잭션 스코프 ([CA-STATECHART-EFFECT-001](/ko/context-layered/decisions/CA-STATECHART-EFFECT-001))
- [React State Contracts](../../../packages/react/docs/state-contracts.md)
  - Store reader/writer, safe read, transaction, timeline, inspector 경계
- [스펙·이슈·문서 관리](/ko/context-layered/change-management-convention)
  - 이슈 lifecycle, 계약 추적, decision record, handoff 증거
- [상호작용 의도 계약(IIC) 컨벤션](/ko/context-layered/interaction-intent-contract)
  - 명시적 상호작용 합의, 제거한 affordance, 트레이드오프, 화면 기술 후속 증거
- [상호작용 의도 계약에서 구현까지의 흐름](/ko/context-layered/interaction-intent-implementation-flow)
  - Context-Action 레이어별 설계·구현 매핑과 집중 evidence gate
- [아키텍처 결정 기록](/ko/context-layered/decisions/)
  - package, protocol, persistence, compatibility 결정을 위한 지속 위치와 형식 ([CA-SPEC-EVIDENCE-001](/ko/context-layered/decisions/CA-SPEC-EVIDENCE-001) 및 승인된 vNext 청사진 [CA-VNEXT-ARCHITECTURE-001](/ko/context-layered/decisions/CA-VNEXT-ARCHITECTURE-001) 포함)
- [Phase 2 (`v5`) 마이그레이션 및 준비 가이드](/ko/context-layered/v5-migration-readiness)
  - `4.x` 무중단 사전 준비 레시피, `pnpm audit:v5-readiness` AST 기준선 및 Phase 2(`v5` 메이저) 진입 게이트
- [통합 트라이어드(`ttsc-ex` · `oa-sdk`) 책임 분리 및 자율 동기화 가이드](/ko/context-layered/triad-evidence-sync-guide)
  - 3대 워크스페이스 책임 경계, 생성 계약 `@evidenceReview` 잠금, 인텐트 분리 및 자율 Pull 절차
- [Tool Calling Web Studio 컨벤션](/ko/context-layered/usecase-tool-calling-web-studio)
  - tool registry, policy, workspace mutation, observable subscription, live preview 경계
- [패널 레이아웃 Preference 컨벤션](/ko/context-layered/usecase-panel-layout)
  - presentation-only 패널 상태, 범위 제한 resize, persistence, Store Context 승격 기준
- [Tool-calling Editor Architecture](/ko/concept/tool-calling-editor-architecture)
  - catalog, approval, trace, persistence, preview reference implementation 상세
- [폴더 구조](/ko/context-layered/architecture/folder-structure)
  - `contexts / business / handlers / actions / hooks / views` 책임 구분
- [핸들러 레지스트리](/ko/context-layered/architecture/handler-registry)
  - handler 등록과 분리 기준

### 2. 상태 전이와 로직 분리를 설명하는 문서

- [명시적 상태 머신](/ko/context-layered/patterns/explicit-state-machine)
  - 복잡한 async 흐름을 `상태 + 이벤트 + 전이`로 고정하는 방법
- [Context-Layered 개요](/ko/context-layered/context-layered-guide)
- [Store별 선택 기준 및 사용법 가이드](/ko/context-layered/store-selection-and-usage-guide)
  - `createStoreContext`, `createStore`, `TimeTravelStore`, `store-core`, `/backend`, `/advanced`, `RefContext`, `xstate`, `preact`, `lit`, `tool-durable-operations` 전반의 선택 매트릭스와 사용법
- [Usecase 및 Recipe Profile](/ko/context-layered/usecase-recipe-profile)
  - 전체 구조를 상위 개념에서 설명
- [Integration Profile](/ko/context-layered/integration-profiles)
  - 외부 도메인 lifecycle·소유권·호환성·증빙을 versioned catalog로 공급
- [마이그레이션 가이드](/ko/context-layered/migration-guide)
  - 기존 코드에서 이 구조로 옮기는 기준

### 3. 실제 구현을 보여주는 문서

- [Canonical Order Form 예제](/ko/examples/canonical-order-form)
  - base canonical example
- [Access Request Playbook 예제](/ko/examples/access-request-playbook)
  - approval/review workflow 예제
- [Incident Escalation Playbook 예제](/ko/examples/incident-escalation-playbook)
  - incident/escalation workflow 예제
- [Renewal Risk Review Playbook 예제](/ko/examples/renewal-risk-review-playbook)
  - renewal/customer-success workflow 예제
- [Playbook 시나리오 라이브러리](/ko/examples/implementation-playbook-scenarios)
  - 아직 full demo가 아니어도 같은 skill로 확장할 시나리오 모음

### 4. 검증 기준을 고정하는 문서

- [문서 및 개발 관리 컨벤션](/ko/concept/documentation-development-conventions)
  - 문서 소유권, LLMS 동기화, 패키지 빌드 순서, 스니펫 컴파일 검증 및 문서 게이트(`pnpm docs:check`)
- [Local-First 검증 정책](../../LOCAL_FIRST_VERIFICATION_POLICY.md)
  - 단일 로컬 검증 엔트리(`pnpm verify`, `pnpm verify:quick`)와 RFC 8785 서명 영수증 규칙(`pnpm verify:receipt`)
- [안정성 테스트 사이클](/ko/context-layered/stability-test-cycle)
  - 설계 계약, 구현 패턴, 시나리오, 스트레스 테스트를 어떻게 나누는지
- [테스트 컨벤션 및 시나리오 표준](/ko/context-layered/testing-convention)
  - `T1`–`T4` 테스트 계층, `S1`–`S6` 표준 시나리오 및 `CA-TESTING-CONVENTION-001` 실행 증명 매트릭스
- [다음 작업과 문서 소유권](/ko/context-layered/next-work)
  - 후속 작업과 기준 문서를 한 곳에서 관리하는 backlog

저장소 컨벤션 및 표면 카탈로그 게이트는 다음 명령으로 실행합니다:

```bash
pnpm convention:check
```

(`pnpm convention:check`는 `node scripts/verify-context-action-conventions.mjs`를 실행하며 Context-Layered 경계, example use-case recipe, MCP/function-calling catalog, integration-profile catalog, `pnpm verify:surface-catalog` 저장소 표면 카탈로그, standalone Web Studio action 경계를 함께 검사합니다.) standalone build·filesystem·provider·preview·browser release 검사는 `pnpm web-coding:verify`로 수행합니다.

## 강제 범위: CI 강제 게이트 vs. 권고 / 크로스-레포 규칙

이 인덱스의 모든 규칙이 동일한 자동화 수준으로 강제되지는 않습니다:

| 구분 | 해당 컨벤션 | 검증 방식 |
| --- | --- | --- |
| **레포 내 CI 강제 (`CI-Enforced`)** | `package-boundary-convention`, `repository-surface-catalog` (`CA-SURFACE-CATALOG-001`), `documentation-development-conventions`, `implementation-convention` (`example/src` + `packages/template-react/src` 대상 7대 구조·AST 규칙 및 fail-closed `layered-surface-classification.json` / `rule-exceptions.json`), `change-management-convention`, `LOCAL_FIRST_VERIFICATION_POLICY` | 자동 스크립트 및 PR CI: `pnpm package-boundary:check`, `pnpm verify:surface-catalog`, `pnpm convention:check`(외부 소비자는 `--root <dir>`), `pnpm docs:check`, `pnpm verify:doc-snippets`, `pnpm change:traceability`, `pnpm verify:quick` / `pnpm verify:receipt` |
| **권고 / 크로스-레포 (`Advisory / Cross-Repo`)** | 4-역할 훅(`Guard`/`Command`/`Observer`/`Result`), `BusinessActionIntent` vs. `LayoutActionIntent` 분리, 도메인 이벤트, `interaction-intent-contract`(IIC 체크리스트), 2-Second State Rule(`CA-SPEC-EVIDENCE-001`), `triad-evidence-sync-guide`(`ttsc-ex` · `oa-sdk`), `usecase-panel-layout` | 설계·PR 리뷰 가이드, `packages/template-react` 표준 스타터 참조 및 인접 워크스페이스 도구 기준; `context-action` 로컬 CI는 저장소 내 문서/컨벤션 정합성만 검증 |

## 팀 컨벤션으로 굳힐 때 읽는 순서

### 아키텍처 합의용

1. [Implementation Convention](/ko/context-layered/implementation-convention)
2. [스펙·이슈·문서 관리](/ko/context-layered/change-management-convention)
3. [상호작용 의도 계약(IIC) 컨벤션](/ko/context-layered/interaction-intent-contract)
4. [상호작용 의도 계약에서 구현까지의 흐름](/ko/context-layered/interaction-intent-implementation-flow)
5. [통합 트라이어드(`ttsc-ex` · `oa-sdk`) 책임 분리 및 자율 동기화 가이드](/ko/context-layered/triad-evidence-sync-guide)
6. [명시적 상태 머신](/ko/context-layered/patterns/explicit-state-machine)
7. [안정성 테스트 사이클](/ko/context-layered/stability-test-cycle)

여러 Store를 변경하는 stateful action은 [Core Action
Contracts](../../../packages/core/docs/action-contracts.md)와 [React State
Contracts](../../../packages/react/docs/state-contracts.md)를 함께 읽습니다. Core는
dispatch trace만 발행하고 Store ownership을 추론하지 않으며, React 계층이 명시적인
participant를 가진 transaction을 시작합니다.

### 구현자 온보딩용

1. [Canonical Order Form 예제](/ko/examples/canonical-order-form)
2. [Access Request Playbook 예제](/ko/examples/access-request-playbook)
3. [Incident Escalation Playbook 예제](/ko/examples/incident-escalation-playbook)
4. [Renewal Risk Review Playbook 예제](/ko/examples/renewal-risk-review-playbook)

### 새 시나리오 설계용

1. [Playbook 시나리오 라이브러리](/ko/examples/implementation-playbook-scenarios)
2. [Implementation Convention](/ko/context-layered/implementation-convention)
3. [통합 트라이어드 자율 동기화 가이드](/ko/context-layered/triad-evidence-sync-guide)
4. repo-local skills: `.agents/skills/context-action-implementation-playbook/SKILL.md`, `skills/context-action-implementation-playbook/SKILL.md`

### Tool-calling web studio 설계용

1. [Tool Calling Web Studio 컨벤션](/ko/context-layered/usecase-tool-calling-web-studio)
2. [스펙·이슈·문서 관리](/ko/context-layered/change-management-convention)
3. [패널 레이아웃 Preference 컨벤션](/ko/context-layered/usecase-panel-layout)
4. [Tool-calling Editor Architecture](/ko/concept/tool-calling-editor-architecture)
5. [Standalone Web Studio README](../../../demos/bolt-style-editor/README.md)

## 스타터 템플릿 및 예제 앱과 같이 볼 때

문서만 보지 말고 표준 스타터 템플릿과 라이브 예제 앱도 함께 확인하는 것이 좋습니다.

- `@context-action/template-react` 표준 스타터 (`packages/template-react/src/features/order-workspace/`)
- `/patterns/implementation-playbook`
- `/patterns/implementation-playbook/access-request`
- `/patterns/implementation-playbook/incident-escalation`
- `/patterns/implementation-playbook/renewal-risk-review`
- `/foundations/react/headless-di`
- standalone `/web-coding/` release

## 한 줄 요약

먼저 source of truth를 고르고, 그 경계에 맞는 최소 변경을 한 뒤, 필요한
파생물만 갱신하고 해당 경계를 증명하는 gate를 실행합니다.
