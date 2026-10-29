---
document_id: context-layered--package-boundary-convention
category: context-layered
source_path: ko/context-layered/package-boundary-convention.md
character_limit: 5000
last_update: '2026-10-25T07:23:14.376Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
패키지 경계 및 코드베이스 관리 컨벤션

패키지 경계 및 코드베이스 관리 컨벤션 상태: 신규 작업과 경계 변경에 적용 범위: workspace package, example, demo, 결정 기록, 문서 ownership Context-Action 저장소에서 패키지 경계는 폴더 구분만이 아니라 ownership과 의존성 경계다. 각 패키지는 하나의 주 책임, 하나의 public contract, 하나의 명확한 검증 경로를 가져야 한다. 1. 경계 규칙 1. 패키지는 하나의 응집된 책임을 소유한다. 서로 다른 책임이 필요하면 작업을 나누거나 아키텍처 decision을 먼저 기록한다. 2. 다른 패키지는 선언된 package export를 통해서만 사용한다. 상대 경로, src/, dist/, test 전용 alias로 다른 패키지를 import하지 않는다. 3. package.json이 runtime, peer, optional, development dependency의 source of truth다. 소스 import와 dependency 선언이 불일치하면 경계 결함이다. 4. exports가 public surface다. export되지 않은 파일은 implementation detail이며 패키지 간 연동 지점으로 사용하지 않는다. 5. package README는 discovery 문서다. 정식 동작·아키텍처 계약은 docs/ 아래 한 개의 authoritative guide가 소유하며 README에 두 번째 사양을 복제하지 않는다. 6. dist/, API reference, LLMS artifact, coverage, generated report는 파생 결과다. 원본과 generator를 수정하고 다시 생성하며 generated 파일을 canonical implementation으로 취급하지 않는다. 7. 패키지 경계 변경은 dependency review, focused proof, 문서 ownership 갱신을 같은 변경에 포함한다. 파일을 옮기는 것만으로 migration이 끝난 것으로 보지 않는다. 2. 현재 패키지 맵 새 패키지는 기존 패키지가 dependency 방향이나 release 요구를 위반하지 않고 책임을 소유할 수 없을 때만 추가한다. | 패키지 | 경계 역할 | 소유하는 것 | 소유하지 않는 것 | | --- | --- | --- | --- | | @context-action/core | runtime foundation 및 선택적 host transport | 기본: action pipeline, handler execution, validation contract, core error; 선택적 /element DOM 전달·/element/react host 수명 | 기본 entry의 DOM/React, tool transport, Zod, renderer 소유권, store | | @context-action/tool-protocol | transport contract foundation | JSON Schema, Zod action schema, MCP/provider adapter, tool call, approval queue, 호출 idempotency/provenance/observability 계약 | React rendering, action registry internals, durable persistence, architecture policy | | @context-action/ai-sdk | provider adapter | AI SDK ToolSet 변환, turn별 tool scope, model-call correlation, native approval/error adaptation | action 실행, React rendering, provider credential, durable persistence | | @context-action/tool-durable-operations | mutation safety foundation | durable operation record, side-effect runner, HTTP/queue adapter, IndexedDB/Redis/PostgreSQL reference backend | provider-neutral tool schema, React rendering, domain별 idempotency/outbox 정책 | | @context-action/mutative-core | immutable runtime foundation | 유지보수되는 Mutative 호환 draft·patch·array engine | Context-Action adapter, React, time-travel policy | | @context-action/mutative | runtime adapter | React가 사용하는 immutable update/patch utility | action orchestration, React context | | @context-action/react | framework adapter | React context, store, hook, ref, tool integration | core policy, 문서 생성, Git 분석 | | @context-action/preact | public preview framework adapter | Core 계약 위의 Preact dispatch context와 읽기 전용 Signals projection | DOM root ownership, SSR 렌더링, 업무 상태, React 통합 | | @context-action/prea

Key points:
• `core`는 `react`에 의존하지 않는다.
• `tool-protocol`은 framework-neutral이며 `core`나 `react`에 의존하지 않는다. provider/tool 경계를 소유한다.
• `ai-sdk`는 얇은 선택적 provider adapter다. `tool-protocol`에 의존하고 `ai`를 필수 peer로 요구하지만 React, core 실행, provider credential, application model client에는 의존하지 않는다.
• `tool-durable-operations`도 framework-neutral이며 `core`, `react`, `tool-protocol`에 의존하지 않는다. durable mutation recovery와 provider side-effect adapter를 소유한다.
• `react`는 `core`, `mutative`를 사용하며 `mutative`는 하위 `mutative-core` runtime만 사용하고 React type을 import하지 않는다.
• `preact`는 framework-neutral `core` action 계약을 사용하고 Preact Context와 읽기 전용 Signals adapter만 제공한다. `preact-ui`는 `preact`를 사용하며 DOM root, template, SSR/hydration, disposal을 소유한다. 두 package 모두 0.1.x 공개 preview이며 React adapter와 독립된 release 계약을 가진다.
• `preact-ui`는 별도 export로 선택적 React bridge를 제공할 수 있지만 runtime 계약에서 React를 필수 dependency로 만들지 않는다.
• `mutative-core`는 upstream 호환성을 유지하며 Context-Action adapter나 React에 의존하지 않는다.
• 문서 generator는 소스·문서를 읽을 수 있지만 runtime package가 generator에 의존하지 않는다.
• example과 demo는 그래프의 leaf다. 패키지가 example/demo를 import하지 않는다.
• adapter의 `freeze`는 core `enableAutoFreeze`로 전달하고 `strict`와
• patch consumer는 Set의 `replace` patch를 보존하고, 문자열이 아닌 Map key나
• core 변경 후 adapter와 time-travel 테스트에서 이 동작을 회귀 검증한다.
• **추가:** ID, owner, stability, 주 책임, public/private 결정, dependency graph, export, focused test, README,
• **병합:** release cadence, owner, dependency 방향, public contract가 같을 때만 병합한다. source/test를 함께
• **분리:** independent release contract가 생기거나 upward dependency가 생기거나 runtime/analysis/docs가
• **폐기:** README에 replacement와 removal condition을 남기고 새 cross-package consumer를 막으며 accidental
• 중복 구현은 canonical owner를 정하고 필요한 경우 re-export/migration path를 만든 뒤 제거한다.
• `utils`는 package 내부에 둔다. versioned·policy-neutral contract인 경우에만 shared...