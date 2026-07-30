---
document_id: context-layered--package-boundary-convention
category: context-layered
source_path: ko/context-layered/package-boundary-convention.md
character_limit: 1000
last_update: '2026-07-30T23:07:59.126Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
패키지 경계 및 코드베이스 관리 컨벤션

패키지 경계 및 코드베이스 관리 컨벤션 상태: 신규 작업과 경계 변경에 적용 범위: workspace package, example, demo, 아키텍처 근거, 문서 ownership Context-Action 저장소에서 패키지 경계는 폴더 구분만이 아니라 ownership과 의존성 경계다. 각 패키지는 하나의 주 책임, 하나의 public contract, 하나의 명확한 검증 경로를 가져야 한다. 1. 경계 규칙 1. 패키지는 하나의 응집된 책임을 소유한다. 서로 다른 책임이 필요하면 작업을 나누거나 아키텍처 decision을 먼저 기록한다. 2. 다른 패키지는 선언된 package export를 통해서만 사용한다. 상대 경로, src/, dist/, test 전용 a

Key points:
• `core`는 `react`에 의존하지 않는다.
• `tool-protocol`은 framework-neutral이며 `core`나 `react`에 의존하지 않는다. provider/tool 경계를 소유한다.
• `tool-durable-operations`도 framework-neutral이며 `core`, `react`, `tool-protocol`에 의존하지 않는다....