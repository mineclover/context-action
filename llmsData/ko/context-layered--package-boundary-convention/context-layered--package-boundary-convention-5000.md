---
document_id: context-layered--package-boundary-convention
category: context-layered
source_path: ko/context-layered/package-boundary-convention.md
character_limit: 5000
last_update: '2026-07-30T23:07:59.127Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
패키지 경계 및 코드베이스 관리 컨벤션

패키지 경계 및 코드베이스 관리 컨벤션 상태: 신규 작업과 경계 변경에 적용 범위: workspace package, example, demo, 아키텍처 근거, 문서 ownership Context-Action 저장소에서 패키지 경계는 폴더 구분만이 아니라 ownership과 의존성 경계다. 각 패키지는 하나의 주 책임, 하나의 public contract, 하나의 명확한 검증 경로를 가져야 한다. 1. 경계 규칙 1. 패키지는 하나의 응집된 책임을 소유한다. 서로 다른 책임이 필요하면 작업을 나누거나 아키텍처 decision을 먼저 기록한다. 2. 다른 패키지는 선언된 package export를 통해서만 사용한다. 상대 경로, src/, dist/, test 전용 alias로 다른 패키지를 import하지 않는다. 3. package.json이 runtime, peer, optional, development dependency의 source of truth다. 소스 import와 dependency 선언이 불일치하면 경계 결함이다. 4. exports가 public surface다. export되지 않은 파일은 implementation detail이며 패키지 간 연동 지점으로 사용하지 않는다. 5. package README는 discovery 문서다. 정식 동작·아키텍처 계약은 docs/ 아래 한 개의 authoritative guide가 소유하며 README에 두 번째 사양을 복제하지 않는다. 6. dist/, API reference, LLMS artifact, coverage, generated report는 파생 결과다. 원본과 generator를 수정하고 다시 생성하며 generated 파일을 canonical implementation으로 취급하지 않는다. 7. 패키지 경계 변경은 dependency review, focused proof, 문서 ownership 갱신을 같은 변경에 포함한다. 파일을 옮기는 것만으로 migration이 끝난 것으로 보지 않는다. 2. 현재 패키지 맵 새 패키지는 기존 패키지가 dependency 방향이나 release 요구를 위반하지 않고 책임을 소유할 수 없을 때만 추가한다. | 패키지 | 경계 역할 | 소유하는 것 | 소유하지 않는 것 | | --- | --- | --- | --- | | @context-action/core | runtime foundation | action pipeline, handler execution, validation contract, core error | React, tool transport, Zod, browser UI, store | | @context-action/tool-protocol | transport contract foundation | JSON Schema, Zod action schema, MCP/provider adapter, tool call, approval queue, 호출 idempotency/provenance/observability 계약 | React rendering, action registry internals, durable persistence, architecture policy | | @context-action/tool-durable-operations | mutation safety foundation | durable operation record, side-effect runner, HTTP/queue adapter, IndexedDB/Redis/PostgreSQL reference backend | provider-neutral tool schema, React rendering, domain별 idempotency/outbox 정책 | | @context-action/mutative-core | immutable runtime foundation | 유지보수되는 Mutative 호환 draft·patch·array engine | Context-Action adapter, React, time-travel policy | | @context-action/mutative | runtime adapter | React가 사용하는 immutable update/patch utility | action orchestration, React context | | @context-action/react | framework adapter | React context, store, hook, ref, tool integration | core policy, 문서 생성, Git 분석 | | @context-action/llms-generator | documentation generator | LLMS summary, priority, derived artifact | runtime behavior, architecture policy | | @context-action/typedoc-vitepress-sync | API documentation adapter | TypeDoc-to-VitePress 동기화 | handwritten guide, runtime code | | @context-action/style-testing | UI verification tool | style/browser 분석과 CLI | core state contract | | @context-action/live-code-editor | private integration | live editor 실험 | promotion 전 stable runtime contract

Key points:
• `core`는 `react`에 의존하지 않는다.
• `tool-protocol`은 framework-neutral이며 `core`나 `react`에 의존하지 않는다. provider/tool 경계를 소유한다.
• `tool-durable-operations`도 framework-neutral이며 `core`, `react`, `tool-protocol`에 의존하지 않는다. durable mutation recovery와 provider side-effect adapter를 소유한다.
• `react`는 `core`, `mutative`를 사용하며 `mutative`는 하위 `mutative-core` runtime만 사용하고 React type을 import하지 않는다.
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
• `utils`는 package 내부에 둔다. versioned·policy-neutral contract인 경우에만 shared extraction을 검토한다.
• 테스트는 증명하는 package와 함께 둔다. cross-package integration test는 integration host 또는 higher-level
• runtime package에 architecture/documentation tooling을 넣지 않는다.
• ownership 판단에 `dist`나 generated API를 사용하지 말고 source package와 `exports`를 추적한다.
• package 경계를 넘는 파일 이동은 TypeScript가 통과해도 API/architecture change로 취급한다.
• [ ] owner package와 primary change class가 명시되어 있다.
• [ ] responsibility/non-goal이 README 또는 정식 guide에 있다.
• [ ] source import와 runtime/peer/dev dependency가 일치한다.
• [ ] package 간...