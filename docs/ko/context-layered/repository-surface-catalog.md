# 저장소 표면 카탈로그 (API · 예제 · 관리 문서 기준 규격)

**상태:** Active  
**스펙 / 결정 ID:** `CA-SURFACE-CATALOG-001`  
**소유자:** Framework Architecture & Documentation Governance  
**정식 JSON 카탈로그:**
- [`catalog/repository-surface/api-surface.v1.json`](../../../catalog/repository-surface/api-surface.v1.json)
- [`catalog/repository-surface/example-surface.v1.json`](../../../catalog/repository-surface/example-surface.v1.json)
- [`catalog/repository-surface/document-surface.v1.json`](../../../catalog/repository-surface/document-surface.v1.json)

이 문서는 저장소 내 세 가지 핵심 표면의 **원칙**, **기본 규격(스키마·분류·검증 규칙)**, 그리고 **전체 목록**을 정의합니다.

1. **API 전체 구성**: 20개 워크스페이스 패키지(`packages/*`), 공개 `exports` 서브패스, 워크스페이스 의존성, 안정성 등급, TypeDoc 포함 범위
2. **예제가 설명하는 것**: `example/` 앱 내 13개 의미 그룹(72개 정식 라우트 전체), 독립 데모 2종(`demos/bolt-style-editor`, `examples/vanilla-js`), 7개 패키지 로컬 `examples/`, 9개 내러티브 예제 문서
3. **관리되는 문서 구조**: 13개 루트 마크다운 문서, 13개 관리 문서 영역(권한 등급·한영 쌍 정책·추적 중인 번역 공백), 파생 TypeDoc/LLMS 산출물

관련 기준 문서는 [패키지 경계 및 코드베이스 관리 컨벤션](/ko/context-layered/package-boundary-convention), [스펙·이슈·문서 관리 컨벤션](/ko/context-layered/change-management-convention), [문서 및 개발 관리 컨벤션](/ko/concept/documentation-development-conventions), ADR [CA-SURFACE-CATALOG-001](/ko/context-layered/decisions/CA-SURFACE-CATALOG-001)입니다.

---

## 1. 5대 기본 원칙

1. **원본 우선 및 비복제(Source-First Non-Duplication)**: 런타임 매니페스트(`packages/*/package.json`), TypeDoc 엔트리(`typedoc.json`), 라우트 등록(`example/src/App.tsx`), 사람이 작성한 가이드(`docs/{en,ko}/**`)가 정식 원본입니다. 카탈로그는 이를 복제하지 않고 색인·교차 검증합니다.
2. **권한 문서와 파생 산출물의 엄격한 분리**: 모든 관리 문서는 `authoritative`, `discovery`, `evidence`, `derived`, `transitional`, `historical` 중 하나로 분류합니다. 파생 산출물(`docs/api/generated`, `docs/en/api`, `api-spec.ts`, `llmsData`, `llms-*.txt`)은 직접 수정하지 않고 원본에서 재생성합니다.
3. **3개 표면의 버전 관리 스키마 대칭성**: API(`api-surface.v1.json`), 예제(`example-surface.v1.json`), 문서(`document-surface.v1.json`) 모두 버전화된 스키마, 안정적 kebab ID, 한영 설명(`en` / `ko`), 명시적 검증 게이트(`verificationGate`)를 갖습니다.
4. **한영 번역 격차의 정직한 계상**: 동기화가 강제되는 디렉터리는 `strict-paired`(미번역 0건)로 잠그고, 기존 번역 공백이 남아 있는 `guide`와 `troubleshooting`은 `tracked-partial` + `knownUnpaired` 목록으로 관리해 공백이 조용히 늘어나지 않도록 합니다.
5. **Fail-Closed 드리프트 검증**: 카탈로그 갱신 없이 패키지, export 서브패스, 워크스페이스 의존성, 정식 예제 라우트, `packages/*/examples`, 루트 `.md`, 또는 미번역 가이드가 바뀌면 `pnpm verify:surface-catalog`와 `pnpm convention:check`가 즉시 실패합니다.

---

## 2. 기본 규격

### 패키지 계층 및 안정성 등급 (`api-surface.v1.json`)

| 계층 (`layer`) | 역할 | 사용 안정성 등급 (`stability`) |
| --- | --- | --- |
| `foundation` | Zero/최소 의존성 코어 계약 및 엔진 (`core`, `store-core`, `mutative-core`, `tool-protocol`, `tool-durable-operations`) | `stable`, `public-preview` |
| `framework-adapter` | 프레임워크 바인딩 (`react`, `mutative`, `lit`, `preact`) | `stable`, `public-preview` |
| `ui-runtime` | DOM 루트 소유권, 웹 컴포넌트, FACE, SSR/하이드레이션 (`lit-ui`, `preact-ui`) | `public-preview` |
| `integration-adapter` | 외부 프로토콜·런타임 어댑터 (`ai-sdk`, `webmcp`, `xstate`) | `public-preview` |
| `tooling` | 빌드·문서·스타일 검증 도구 (`llms-generator`, `typedoc-vitepress-sync`, `style-testing`) | `tooling`, `private` |
| `private-host-support` | 비공개 데모·스타터 지원 (`live-code-editor`, `openrouter-browser-storage`, `template-react`) | `private` |

### 문서 권한 분류 및 한영 쌍 정책 (`document-surface.v1.json`)

| 권한 분류 (`authorityClass`) | 역할 |
| --- | --- |
| `authoritative` | 정식 사양, 아키텍처 컨벤션 또는 사용자 가이드 |
| `discovery` | 정식 문서로 안내하는 루트 README, 에이전트 가이드, 인덱스 |
| `evidence` | 불변 릴리스 계획, v1 감사·런북 기록, 검증 증거 |
| `derived` | 기계 생성 산출물 (`TypeDoc`, `typedoc-vitepress-sync`, `llms-generator`) |
| `transitional` | 통합 전까지 유지되는 과도기 문서 |
| `historical` | 특정 시점 보존 스냅샷 (`CHANGELOG.md`, `OPTIMIZATION_ANALYSIS.md`, `STORE_GUIDE.md`) |

| 쌍 정책 (`pairingPolicy`) | 검증 규칙 |
| --- | --- |
| `strict-paired` | `enDir`과 `koDir`의 `.md` 파일이 1:1 일치 (미번역 0건) |
| `tracked-partial` | `onlyEn`·`onlyKo` 실제 집합이 `knownUnpaired` 선언과 1:1 일치해야 통과 |
| `single-locale` | 단일 언어 정본 (`releases/`, `docs/releases/`, `packages/*/docs/`) |
| `derived` | 명시된 `sourceOfTruth`와 생성 명령에 결속된 파생물 |
| `not-applicable` | 기계 스키마·스킬 파일 (`catalog/`, `skills/`, `.agents/skills/`, `tasks/`) |

### 표면 변경 시 갱신 절차

1. 정식 원본(`package.json`, `typedoc.json`, `example/src/App.tsx`, `docs/`)을 먼저 수정합니다.
2. `catalog/repository-surface/*.v1.json`과 필요한 경우 이 기준 문서(`docs/{en,ko}/context-layered/repository-surface-catalog.md`)를 함께 갱신합니다.
3. 마크다운 문서를 수정했으면 `pnpm build:llms-generator && pnpm llms:sync-docs --changed-files path1.md,path2.md` (쉼표 구분)를 실행합니다.
4. `pnpm verify:surface-catalog && pnpm convention:check && pnpm docs:check`로 검증합니다.

---

## 3. 표면 1: 레포지토리 API 전체 구성 (20개 패키지)

`packages/*/package.json` 기준 전체 20개 워크스페이스 패키지 목록입니다 (`package.json`이 없는 로컬 잔여 디렉터리는 제외).

| 패키지 | 계층 | 공개성 / 안정성 | 공개 `exports` | 워크스페이스 의존성 (+Peer) | TypeDoc 포함 |
| --- | --- | --- | --- | --- | --- |
| `@context-action/core` (`1.3.1`) | `foundation` | `public` / `stable` | `.`, `./element`, `./element/react` | 없음 | 예 (`.`만 포함) |
| `@context-action/store-core` (`0.1.4`) | `foundation` | `public` / `stable` | `.` | 없음 | 아니오 |
| `@context-action/mutative-core` (`0.8.14`) | `foundation` | `public` / `stable` | `.` | 없음 | 아니오 |
| `@context-action/tool-protocol` (`1.0.2`) | `foundation` | `public` / `stable` | `.` | 없음 | 예 (`.`) |
| `@context-action/tool-durable-operations` (`0.2.0`) | `foundation` | `public` / `public-preview` | `.` | 없음 | 예 (`.`) |
| `@context-action/react` (`4.0.7`) | `framework-adapter` | `public` / `stable` | `.`, `./backend`, `./advanced`, `./utils`, `./webmcp` | `core`, `mutative`, `store-core` (+peer: `tool-protocol`, `webmcp`) | 예 (`.`, `./webmcp`) |
| `@context-action/mutative` (`0.8.15`) | `framework-adapter` | `public` / `stable` | `.` | `mutative-core`, `store-core` | 아니오 |
| `@context-action/lit` (`0.1.4`) | `framework-adapter` | `public` / `public-preview` | `.` | `core` | 아니오 |
| `@context-action/preact` (`0.1.3`) | `framework-adapter` | `public` / `public-preview` | `.` | `core` | 아니오 |
| `@context-action/lit-ui` (`0.1.4`) | `ui-runtime` | `public` / `public-preview` | `.`, `./react-bridge`, `./ssr`, `./hydrate` | `core`, `lit` | 아니오 |
| `@context-action/preact-ui` (`0.2.1`) | `ui-runtime` | `public` / `public-preview` | `.`, `./react-bridge`, `./ssr` | `core`, `preact` | 아니오 |
| `@context-action/ai-sdk` (`0.1.0`) | `integration-adapter` | `public` / `public-preview` | `.` | `tool-protocol` | 예 (`.`) |
| `@context-action/webmcp` (`0.1.2`) | `integration-adapter` | `public` / `public-preview` | `.`, `./profiles/chrome-legacy` | `tool-protocol` | 예 (`.`) |
| `@context-action/xstate` (`0.1.0`) | `integration-adapter` | `public` / `public-preview` | `.`, `./effect` | `core`, `store-core` | 아니오 |
| `@context-action/llms-generator` (`0.8.7`) | `tooling` | `public` / `tooling` | `.`, `./cli` | 없음 | 아니오 |
| `@context-action/typedoc-vitepress-sync` (`0.8.8`) | `tooling` | `public` / `tooling` | `.`, `./cli` | 없음 | 아니오 |
| `@context-action/style-testing` (`0.1.0`) | `tooling` | `private` / `private` | `.`, `./babel-plugin` | 없음 | 아니오 |
| `@context-action/live-code-editor` (`0.0.0`) | `private-host-support` | `private` / `private` | `.` | 없음 | 아니오 |
| `@context-action/openrouter-browser-storage` (`0.0.0`) | `private-host-support` | `private` / `private` | `.` | 없음 | 아니오 |
| `@context-action/template-react` (`1.0.0`) | `private-host-support` | `private` / `private` | `(없음)` | `core`, `react` | 아니오 |

> [!NOTE]
> **TypeDoc 커버리지 공백**: 현재 `typedoc.json`은 **공개 패키지 16개 중 6개**의 7개 엔트리(`core`, `tool-protocol`, `ai-sdk`, `webmcp`, `tool-durable-operations`, `react` `.` 및 `./webmcp`)만 API 참조로 생성합니다. 나머지 10개 공개 패키지(`store-core`, `xstate`, `lit`, `lit-ui`, `preact`, `preact-ui`, `mutative`, `mutative-core`, `llms-generator`, `typedoc-vitepress-sync`)와 `@context-action/core/element`, `@context-action/react/backend`, `@context-action/react/advanced` 같은 서브패스는 TypeDoc에 편입되기 전까지 `api-surface.v1.json`에서 명시적으로 추적합니다.

### 3.1 계층별 패키지 용도 요약

- **Foundation (`5`)**: `core`(액션 파이프라인 + 선택적 `./element` DOM/호스트 전송), `store-core`(프레임워크 중립 상태/타임라인/트랜잭션 계약 + `createStateStore`), `mutative-core`(`mutative@1.3.0` 호환 불변 draft·patch 엔진), `tool-protocol`(Zod/JSON Schema 도구, MCP/프로바이더 어댑터, 승인 큐, 멱등성, 관측 정책), `tool-durable-operations`(lease/claim 부작용 복구 + IndexedDB/Redis/PostgreSQL 기준 백엔드).
- **Framework Adapters (`4`)**: `react`(React 18/19 Action/Store/TimeTravel/Ref 컨텍스트, 훅, 트랜잭션, `./backend`, `./advanced`, `./webmcp`), `mutative`(`TimeTravel` + `MutativeStateBackend`/`MutativeTimelineBackend`), `lit`(`StoreController`, `ActionController`, `ControllerScope`), `preact`(`createDispatchContext`, `connectSourceSignal`, `createSourceContext`, `useProjection`).
- **UI Runtimes (`2`)**: `lit-ui`(Lit 웹 컴포넌트, W3C Context Protocol, FACE, `./react-bridge`, `./ssr`, `./hydrate`), `preact-ui`(소유된 Preact DOM 루트, `mountPreact`/`hydratePreact`, `createDisposalScope`, `./react-bridge`, `./ssr`).
- **Integration Adapters (`3`)**: `xstate`(`.`의 XState v5/v6 액터 브리지 + `./effect`의 Effect v4 / `@xstate/effect` / Standard Schema v1 / 트랜잭션 스코프), `ai-sdk`(AI SDK v7 턴 범위 `ToolSet` 어댑터), `webmcp`(allowlist 기반 `document.modelContext` 브라우저 어댑터).
- **Tooling (`3`)**: `llms-generator`(LLMS 요약·우선순위·불일치 탐지), `typedoc-vitepress-sync`(TypeDoc-to-VitePress API 문서·사이드바 동기화), `style-testing`(비공개 Playwright 스타일 추출 및 Babel 플러그인).
- **Private Host Support (`3`)**: `live-code-editor`(라이브 에디터 워크스페이스 스냅샷·iframe 미리보기 브리지), `openrouter-browser-storage`(데모용 API 키 브라우저 저장소), `template-react`(Context-Layered + Astryx 스타터 템플릿).

패키지 전반의 상태 저장소 선택 기준과 구체적인 사용법은 [Store별 선택 기준 및 사용법 가이드](./store-selection-and-usage-guide.md)를 참고하세요.

---

## 4. 표면 2: 예제가 설명하는 것

### 4.1 `example/` React 앱 (13개 의미 그룹 · 72개 정식 라우트)

`example/src/App.tsx`는 총 116개 `<Route>`(레거시 리다이렉트 44개 포함)를 선언하며, `scripts/example-route-impact.mjs`가 인덱싱하는 **72개 정식 라우트**를 13개 의미 그룹으로 관리합니다.

| 그룹 ID | 포함 라우트 (개수) | 설명하는 핵심 주제 | 주요 API | 검증 게이트 |
| --- | --- | --- | --- | --- |
| `ex-app-hub` | `/`, `/demos`, 6개 `/catalog/*`, 3개 `/overview/*` (**11**) | 진입 홈, 영역별 카탈로그, MCP/함수 호출 카탈로그 레지스트리, 핵심 개념 개요 | `createActionContext`, `createStoreContext`, `ToolContext` | `pnpm --filter example check && pnpm --filter example build` |
| `ex-app-foundations-core` | `/foundations/core/basics`, `/foundations/core/advanced` (**2**) | 프레임워크 중립 `ActionRegister` 페이로드 타입, 우선순위 실행, 비동기 모드 및 중단 처리 | `ActionRegister`, `executeParallel`, `executeSequential`, `executeRace` | `pnpm --filter example test && pnpm --filter example build` |
| `ex-app-foundations-store` | `/foundations/store/basics`, `immutability-test`, `time-travel`, `time-travel-context` (**4**) | Store 반응성, Mutative 불변성 보장, `TimeTravelStore` 및 `createTimeTravelStoreContext` undo/redo | `createStore`, `createTimeTravelStore`, `createTimeTravelStoreContext`, `useTimeTravelControls` | `pnpm --filter example test && pnpm --filter example build` |
| `ex-app-foundations-react` | `/foundations/react/provider`, `context`, `hooks`, `useActionWithResult`, `imperativeRef` (**5**) | 분리된 Provider, 다중 컨텍스트 격리, 선택적 구독 훅, `dispatchWithResult`, `useImperativeHandle + RefContext` | `createActionContext`, `createStoreContext`, `createRefContext`, `useStoreValue`, `useStoreSelector`, `dispatchWithResult` | `pnpm --filter example test && pnpm --filter example build` |
| `ex-app-performance-action-guard` | `/performance/action-guard`, `showcase`, `search`, `scroll`, `api-blocking`, `throttle-comparison`, `advanced-filtering` (**7**) | 디바운스, 스로틀, 중복 API 요청 차단, 취소 가능한 검색, 우선순위 점프 및 필터링 | `ActionGuard`, `ActionRegister`, `PipelineController` | `pnpm --filter example check && pnpm --filter example test` |
| `ex-app-performance-priority` | `/performance/priority/advanced`, `/performance/priority/demo` (**2**) | 다중 핸들러 우선순위 스케줄링 벤치마크 및 실시간 실행 순서 튜닝 | `ActionRegister`, `useActionHandler` | `pnpm --filter example build` |
| `ex-app-performance-mouse-events` | `/performance/mouse-events`, `legacy`, `reactive`, `non-reactive`, `context-store-action`, `canvas-ref-demo`, `context-store` (**7**) | 120fps 포인터 부하에서 반응형 Store 구독 vs 리렌더링 0회 `RefContext` 직접 DOM/Canvas 제어 비교 | `createStoreContext`, `createRefContext`, `createActionContext` | `pnpm --filter example verify:mouse-action && verify:mouse-pattern && verify:mouse-enhanced` |
| `ex-app-performance-memoization` | `/performance`, `/performance/memoization/{demo,analysis,guidelines}` (**4**) | 핸들러 재등록 방지를 위한 `useCallback` 메모이제이션과 React Compiler 안정성 기준 | `useActionHandler`, `createActionContext` | `pnpm --filter example build` |
| `ex-app-patterns-conditional` | `/patterns/conditional`, `permissions`, `form-validation`, `workflow-steps`, `feature-toggle` (**5**) | 조건부 파이프라인 가드: RBAC 권한, 다단계 폼 검증, 순차 워크플로 단계, 피처 토글 | `useActionHandler`, `PipelineController`, `ActionGuard` | `pnpm --filter example verify:conditional` |
| `ex-app-patterns-architecture` | `/patterns/business-logic`, `layered-architecture`, `/patterns/implementation-playbook` + `scenarios`, `access-request`, `incident-escalation`, `renewal-risk-review` (**7**) | 순수 비즈니스 함수 분리, 6계층 Context-Layered 구조, Canonical Order Form 및 Implementation Playbook 도메인 워크플로 | `createActionContext`, `createStoreContext`, `useActionHandler`, `useStoreValue` | `pnpm convention:check && pnpm --filter example verify:usecase` |
| `ex-app-patterns-pipeline-refs` | `/patterns/pipeline/flow-control`, `/patterns/refs`, `waitforrefs-performance`, `use-ref-mount-state-test`, `canvas` (**5**) | 동적 `PipelineController`(`abort`/`skip`/`jumpToPriority`/`modifyPayload`)와 `waitForRefs`/`useRefMountState` DOM/Canvas 제어 | `PipelineController`, `createRefContext`, `waitForRefs`, `useRefMountState` | `pnpm --filter example build` |
| `ex-app-integrations` | `/integrations/action-lifecycle`, `react-aria-reference`, `preact-web-components`, `lit-web-components`, `business/chat`, `advanced/form-builder`, `advanced/concurrent-actions` (**7**) | Action Lifecycle Workbench, React Aria 계층형 하이드레이션, Preact/Lit 웹 컴포넌트 브리지, 실시간 채팅, 동적 폼 빌더, 동시성 격리 | `ActionRegister`, `@context-action/core/element`, `preact-ui/react-bridge`, `lit-ui/react-bridge` | `pnpm verify:react-aria-reference-hydration && pnpm verify:element-interop && pnpm --filter example test` |
| `ex-app-utilities` | `/utilities/dev-tools/{logger,toast-config,warning-demo,store-scenarios}`, `source-directory`, `testing/enhanced-search` (**6**) | LogMonitor 트레이싱, 토스트 설정, 경고 진단, 스토어 비교 벤치마크, 소스 링크 디렉터리, 취소형 검색 테스트 하네스 | `ActionRegister`, `createStoreContext`, `createActionContext` | `pnpm --filter example check && pnpm --filter example build` |

### 4.2 독립 데모 (2종) 및 패키지 로컬 예제 (7종)

| 구분 | 경로 | 상태 | 설명하는 내용 | 검증 게이트 |
| --- | --- | --- | --- | --- |
| 독립 데모 | `demos/bolt-style-editor` | `verified` | Tool-Calling Web Studio (`tool-protocol`, `ai-sdk`, `tool-durable-operations`, IndexedDB, 승인 큐, 제한된 트레이스, iframe 미리보기) | `pnpm web-coding:verify` |
| 독립 데모 | `examples/vanilla-js` | `reference` | React나 번들러 없이 `@context-action/core`를 사용하는 순수 HTML/JS 카운터·Todo 예제 | `pnpm build:core` |
| 패키지 예제 | `packages/core/examples` | `verified` | 코어 `ActionRegister` 데모 및 `./element` 기반 Vue·Svelte·Angular 호스트 복사형 예제 | `pnpm verify:element-hosts && pnpm verify:element-interop` |
| 패키지 예제 | `packages/lit-ui/examples` | `verified` | DSD SSR 하이드레이션 검증 하네스 및 ElementInternals FACE 예외 진단 플레이그라운드 | `pnpm --filter @context-action/lit-ui test:browser` |
| 패키지 예제 | `packages/preact-ui/examples` | `verified` | Projected Order 6계층 워크스페이스, Layer Panel 계약 재사용, 모듈형 Signals 웹 컴포넌트, SSR | `pnpm --filter @context-action/preact-ui test:browser` |
| 패키지 예제 | `packages/react/examples` | `verified` | 패키지 수준 훅, RefContext(`GameUI`/`SimpleForm`), 선언적/통합 Store 패턴 예제 | `pnpm --filter @context-action/react test` |
| 패키지 예제 | `packages/mutative/examples` | `experimental` | 워크스페이스 전용 `travels@3` + `mutative@2` 호환성 프로토타입 (`travels-v3`) | `pnpm --filter @context-action/mutative test:travels-v3` |
| 패키지 예제 | `packages/llms-generator/examples` | `reference` | `LLMSGenerator` 및 `CategoryMinimumGenerator` TS/JS 프로그래밍 API 사용 예제 | `pnpm --filter @context-action/llms-generator test` |
| 패키지 예제 | `packages/typedoc-vitepress-sync/examples` | `reference` | `TypeDocVitePressSync` Node.js 기본·고급 설정 예제 | `pnpm --filter @context-action/typedoc-vitepress-sync test` |

### 4.3 내러티브 예제 가이드 (`docs/{en,ko}/examples/*.md`, 한영 9쌍)

1. `basic-setup.md` (`/foundations/react/provider`) — Action-Only + Store-Only 기본 조합 설정
2. `action-only.md` (`/foundations/core/basics`) — 스토어 상태 없는 순수 커맨드/이벤트 디스패치
3. `store-only.md` (`/foundations/store/basics`) — 액션 파이프라인 없는 순수 반응형 상태·선택자 구독
4. `pattern-composition.md` (`/patterns/layered-architecture`) — MVVM 계층별 Action + Store 조합
5. `canonical-order-form.md` (`/patterns/implementation-playbook`) — Canonical Order Form 표준 구현 워크스루
6. `access-request-playbook.md` (`/patterns/implementation-playbook/access-request`) — 승인형 Workspace Access Request 패킷 워크플로
7. `incident-escalation-playbook.md` (`/patterns/implementation-playbook/incident-escalation`) — 운영 Incident Escalation 패킷 워크플로
8. `renewal-risk-review-playbook.md` (`/patterns/implementation-playbook/renewal-risk-review`) — 고객 성공 Renewal Risk Review 워크플로
9. `implementation-playbook-scenarios.md` (`/patterns/implementation-playbook/scenarios`) — 도메인 확장용 Playbook 시나리오 라이브러리

---

## 5. 표면 3: 관리되는 문서 구조

### 5.1 루트 마크다운 문서 (13개)

| 파일 | 권한 등급 | 수명주기 | 소유자 | 역할 |
| --- | --- | --- | --- | --- |
| `README.md`, `README.en.md`, `README.ko.md` | `discovery` | `active` | Framework Maintainers | GitHub 기본 진입 및 다국어 탐색용 README |
| `AGENTS.md`, `CLAUDE.md`, `gemini.md` | `discovery` | `active` | Framework Maintainers | AI 에이전트 작업 지침, 빌드 순서, 표면 카탈로그·Local-First 검증 규칙 |
| `CONTRIBUTING.md`, `DEVELOPMENT.md` | `discovery` | `active` | Framework Maintainers | 기여자 온보딩, 모노레포 개발 환경 및 워크플로 안내 |
| `SECURITY.md` | `authoritative` | `active` | Security & Release Maintainers | 지원 릴리스 라인 보안 범위 및 취약점 보고 정책 |
| `ECOSYSTEM.md` | `transitional` | `transitional` | Documentation Maintainers | 최신 LLMS·경계 문서와 함께 유지되는 과도기 생태계 개요 |
| `CHANGELOG.md` | `historical` | `historical` | Release Engineering | 패키지별 CHANGELOG 분리 이전의 모노레포 변경 이력 |
| `OPTIMIZATION_ANALYSIS.md` | `historical` | `historical` | Framework Core | 특정 시점의 번들/성능 최적화 분석 스냅샷 |
| `REACT_COMPILER_MIGRATION.md` | `historical` | `historical` | Framework React | React 19.2 및 React Compiler 기준선 전환 메모 |

### 5.2 관리 문서 영역 (13개 영역)

| 영역 ID | 경로 | 권한 등급 | 쌍 정책 | 비고 / 추적 중인 공백 |
| --- | --- | --- | --- | --- |
| `doc-context-layered` | `docs/{en,ko}/context-layered` | `authoritative` | `strict-paired` | 미번역 0건; 컨벤션, IIC, ADR(`CA-*`), 본 카탈로그 포함 |
| `doc-concept` | `docs/{en,ko}/concept` | `authoritative` | `strict-paired` | 미번역 0건; 아키텍처, 파이프라인, 훅 레퍼런스, 에디터 구조, 문서 규칙 |
| `doc-examples` | `docs/{en,ko}/examples` | `authoritative` | `strict-paired` | 미번역 0건; 9개 내러티브 예제 가이드 |
| `doc-llms` | `docs/{en,ko}/llms` (`.md`) | `authoritative` | `strict-paired` | 미번역 0건 (`llms-*.txt`는 `derivedSurfaces`로 분리 관리) |
| `doc-guide` | `docs/{en,ko}/guide` | `authoritative` | `tracked-partial` | 영문 전용 18개 (`index.md`, `patterns/action/react-integration.md`, `patterns/store/*` 12개, `pipeline/advanced-filtering.md`, `test-sync-demo.md`, `troubleshooting.md`, `type-inference.md`); 국문 전용 4개 (`action-handlers.md`, `action-pipeline.md`, `architecture.md`, `hooks.md`) |
| `doc-troubleshooting` | `docs/{en,ko}/troubleshooting` | `authoritative` | `tracked-partial` | 영문 전용 1개 (`infinite-loop-issues.md`); 국문 전용 0개 |
| `doc-docs-root` | `docs/index.md`, `LOCAL_FIRST_VERIFICATION_POLICY.md`, `STORE_GUIDE.md` | `authoritative` | `single-locale` | `STORE_GUIDE.md`는 역사적 참고 문서로 명시 |
| `doc-releases-v1` | `docs/releases`, `docs/ko/releases` | `evidence` | `single-locale` | v1.0.0 감사, 범위, 런북, 릴리스 매니페스트 |
| `doc-releases-ops` | `releases/` | `evidence` | `single-locale` | `RELEASE.md`, 코호트 JSON 계획, 공개 프리뷰 릴리스 노트 |
| `doc-package-docs` | `packages/*/README.md`, `CHANGELOG.md`, `UNRELEASED.md`, `docs/*.md` | `authoritative` | `single-locale` | 패키지별 탐색 문서 및 세부 계약 |
| `doc-catalogs` | `catalog/` | `authoritative` | `not-applicable` | `integration-profiles/*.json` + `repository-surface/*.v1.json` |
| `doc-skills` | `skills/` (`.agents/skills/` gitignored 미러) | `authoritative` | `not-applicable` | 저장소 로컬 Implementation Playbook 스킬 문서 |
| `doc-design-tasks` | `design-docs/`, `tasks/` | `historical` | `not-applicable` | 아카이브된 설계 명세 및 작업 기록 |

### 5.3 파생 / 생성 산출물 (10개 출력)

- `docs/api/generated` (`pnpm docs:api`) ← `typedoc.json` + export된 TypeScript 소스/JSDoc
- `docs/en/api` 및 `docs/.vitepress/config/api-spec.ts` (`pnpm docs:sync`) ← `docs/api/generated` + `typedoc-vitepress-sync`
- `llmsData` (`pnpm llms:sync-docs --changed-files path1.md,path2.md`) ← `docs/{en,ko}/**/*.md`
- `docs/{en,ko}/llms/llms-origin.txt`, `llms-500chars.txt`, `llms-minimal.txt` (`llms-generate`) ← `llmsData/{en,ko}/**`

---

## 6. 검증 명령

```bash
# API·예제·문서 3개 카탈로그의 1:1 구조 정합성 검증
pnpm verify:surface-catalog

# 카탈로그 드리프트 탐지 회귀 테스트
node --test scripts/verify-repository-surface-catalog.test.mjs

# 저장소 전체 컨벤션 검사 (표면 카탈로그 검증 포함)
pnpm convention:check

# 문서 관리, LLMS 정합성, VitePress 빌드 검사
pnpm docs:check
```
