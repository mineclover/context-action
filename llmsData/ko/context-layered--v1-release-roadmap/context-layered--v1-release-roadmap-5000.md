---
document_id: context-layered--v1-release-roadmap
category: context-layered
source_path: ko/context-layered/v1-release-roadmap.md
character_limit: 5000
last_update: '2026-08-09T02:32:10.354Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Action v1.0 릴리스 로드맵

Context-Action v1.0 릴리스 로드맵 --- status: draft canonical: false translationOf: docs/en/context-layered/v1-release-roadmap.md syncedAtCommit: 0d6047b99961a33ef0d09704ae39c577d3b89cd8 roadmapRevision: v1-r2 --- 릴리스 원칙: v1.0.0은 버전 번호 변경이 아니라 공개 계약의 동결이다. 1. 목표와 계획 원칙 v1.0.0은 Context-Action이 1.x 전체에서 아래 약속을 지킬 수 있을 때만 준비된 것으로 판단한다. > 공개 API, 런타임 의미론, 수명주기 동작, 패키지 호환성이 문서화되어 있고 서로 > 일치하며, 소비자 관점에서 재현 가능한 증거로 검증되어 있다. 이 문서는 그 상태에 도달하기 위해 필요한 단일 개발 계획이다. 레거시 제거, 계약 결정, 구현 안정화, 패키지 검증, 문서화, 릴리스 운영을 하나의 로드맵으로 관리한다. 코드가 merge되었다는 사실만으로 작업이 끝나지 않는다. 계약, 테스트, 소비자 영향, 문서가 함께 정렬될 때 완료된다. 변경 불가 순서 호환성을 깨는 정리는 반드시 v1.0 공개 API 동결 전에 끝낸다. Deprecated 또는 legacy 표면은 0.9.x 안정화 라인에서 아래 셋 중 하나만 선택할 수 있다. 1. 동결 전에 제거하고 migration 경로를 제공한다. 2. 1.x에서 지원할 공개 계약으로 유지한다. 3. 명시적인 experimental package 또는 subpath로 격리한다. 일시적인 compatibility shim을 v1.0에 남긴다면 1.x 유지보수 의무로 취급한다. 릴리스 게이트를 통과하는 데 필요하지 않은 신규 기능, 신규 adapter, 대규모 리팩터링, 검증되지 않은 성능 작업은 이 계획의 범위가 아니다. 2. 현재 릴리스 기준선 - 기준 커밋: 0d6047b99961a33ef0d09704ae39c577d3b89cd8 (fix: harden execution metrics and WebMCP scope lifecycle) - 로드맵 리비전: v1-r2 - 버전 전략: Lerna independent - 증거 상태: source와 focused test는 검토했지만 전체 release gate를 하나의 evidence bundle로 인증하지 않았다. - 현재 판정: NOT READY 아래 상태는 기준 커밋의 현황을 설명할 뿐, CI 실행 또는 외부 consumer 인증 완료를 주장하지 않는다. 이 기준선에 연결된 CI status/workflow 결과는 release evidence로 기록되어 있지 않다. | Gate | 현재 상태 | 기준선 판단 | | --- | --- | --- | | G0 Scope/versioning | partial | independent versioning은 설정되어 있으나 package/subpath 분류가 열려 있다. | | G1 Public API | partial | role API hardening은 존재하나 legacy retain/remove 결정이 열려 있다. | | G2 Core execution | implemented-unverified | role-conflict, atomic-once, guard semantics, observer aggregation 회귀 검증이 존재한다. | | G3 Lifecycle/metrics | implemented-unverified | cancellation metrics, retry cancellation, observer/lifecycle 작업이 존재한다. | | G4 React contract | partial | WebMCP generic/resolver 처리와 hook test는 있으나 전체 matrix 증거가 없다. | | G5 Tool adapters | partial | WebMCP hardening은 있으나 안정성 분류와 전체 boundary 증거가 열려 있다. | | G6 Consumer packages | partial | 검증 script는 있으나 기준선을 인증하는 release evidence bundle이 없다. | | G7 Docs/migration | partial | roadmap/API docs는 있으나 v1 release 문서 세트가 완성되지 않았다. | | G8 Independent audit | not-started | fresh-context audit 증거가 없다. | | G9 Security/supply chain | partial | 저장소 security audit은 있으나 release별 supply-chain 증거가 열려 있다. | 3. 운영 모델과 이슈 상태 이 문서는 규범적인 릴리스 계획이며 릴리스 정책이 바뀔 때만 수정한다. 실시간 delivery board는 v1.0 GitHub Project다. Project가 만들어지기 전까지는 docs/releases/v1.0.0/status.md가 commit되는 mirror 역할을 한다. readiness 상태와 command evidence는 이 계획이 아니라 release status 및 release-evidence/v1.0.0-/manifest.json에 둔다. 독립적으로 검증 가능한 이슈 하나를 하나의 작업 단위로 만들고 아래 milestone에 배정한다. 릴리스 상태는 merge된 PR 수가 아니라 증거의 상태로 판단한다. | 작업 상태 | 의미 | 완료에 필요한 증거 | | --- | --- | --- | | inventory | 표면을 발견했지만 결정하지 않음 | o

Key points:
• **기준 커밋:** `0d6047b99961a33ef0d09704ae39c577d3b89cd8`
• **로드맵 리비전:** `v1-r2`
• **버전 전략:** Lerna `independent`
• **증거 상태:** source와 focused test는 검토했지만 전체 release gate를 하나의
• **현재 판정:** `NOT READY`
• Severity: P0 | P1 | P2
• Milestone:
• Affected public contract:
• Current behavior and reproduction:
• Expected 1.0 contract:
• Chosen resolution:
• Compatibility and migration impact:
• Test / package / documentation evidence:
• Owner and status:
• M1부터 및 public export/declaration 변경마다 API-surface diff
• M0부터 및 관련 package/build/dependency 변경마다 packed-consumer smoke와 dependency check
• M1부터 및 public change마다 documentation과 migration fixture
• release train 전체의 security와 supply-chain check
• HEAD SHA, Node, pnpm, TypeScript, React, package version, 마지막 publish
• publish 대상 package마다 export와 package metadata snapshot을 만들고, 마지막
• export, alias, deprecated type, runtime branch, compatibility subpath, example,
• Core, React, tool adapter, lifecycle, consumer risk를 바탕으로 P0/P1 risk
• 실제 검증 명령과 baseline 결과를 기록한다. `pnpm release:check`, package
• stable/experimental package 분류, 지원 runtime matrix, ESM/CJS/SSR/browser
• Core 의미론을 동결한다. role identity, cross-role ID 충돌, `once`, guard
• abort, timeout, queued work, debounce, retry, detached observer,
• canonical Tool Protocol 순서와 지원할 AI SDK/WebMCP profile을 결정한다.
• legacy 항목마다 **제거**, **1.x 계약으로 유지**, **experimental로 격리** 중 하나를
• role replacement, guard filter, fail-closed guard, 두 dispatch API의 parity,
• sequential, parallel, race의 결정론적 ordering과 diagnostics를 검증한다. result
• 모든 execution mode와 concurrent dispatch에서 invocation 전 atomic `once` claim을
• 다음 race attempt 전 retry abort-and-drain을 강제하고 queue wait, debounce,
• 정확히 한 번 cleanup과 일관된 telemetry 정의를 가진 하나의
• unsafe generic escape hatch 없이 Core config와 result-map type이 React hook까지
• handler...