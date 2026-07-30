---
document_id: context-layered--next-work
category: context-layered
source_path: ko/context-layered/next-work.md
character_limit: 2000
last_update: '2026-07-30T23:07:59.033Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
다음 작업과 문서 소유권

다음 작업과 문서 소유권 이 페이지는 Context-Action 아키텍처와 tool-calling 작업의 유지되는 짧은 backlog다. 의미 계약 문서, 운영 runbook, package README, 생성 API 문서가 서로 다른 TODO 목록을 갖지 않도록 한 곳에서 다음 작업을 관리한다. 문서 소유권 | 관심사 | 기준 문서 | 이 문서에 넣지 않는 것 | | --- | --- | --- | | tool 실행 의미, timeout, abort-drain, idempotency, durable recovery | Tool-calling Editor Architecture | 배포 명령과 장애 대응 | | Redis 배포, retention, rollback, 운영 절차 | Durable Operation Runbook | 새로운 protocol 의미 | | package API와 consumer quickstart | package README.md | 두 번째 state-machine 명세 | | Durable mutation 실행, side-effect adapter, backend 운영 | @context-action/tool-durable-operations와 Durable Operation Runbook | provider-neutral tool schema 또는 domain outbox 정책 | | 공개 TypeScript signature | TypeDoc 출력과 typedoc-vitepress-sync | 손으로 작성한 동작 주장 | | 짧은 요약 | llmsData/와 llms-generator | 수동 backlog 결정 | 계약이 바뀌면 먼저 소유 문서를 수정하고, 그 다음 영문/국문 문서와 생성 artifact를 갱신한다. Package README는 전체 계약을 복사하지 말고 소유 문서로 링크한다. mutation 대상 인벤토리 다음 side-effect 도입 후보를 저장소 안에서 다시 분류한 결과는 다음과 같다. | 표면 | 분

Key points:
• durable operation record에 lease 기반 claim/replay/complete/fail/unknown 전이와
• IndexedDB·Redis·PostgreSQL reference backend, 선택적 Redis client bridge,
• Live Code Editor recovery는 `editor.saveFile`과 `editor.saveAll`을 모두 지원한다.
• `TOOL_EXECUTION_UNKNOWN` 진단 결과는 정제 후 durable record에 보존되어
• repository CI workflow가 Redis 7과 PostgreSQL 16 service container에서
• 로컬 tarball consumer smoke가 아직 공개되지 않은 tool package를 packed
• LSP 수준의 정확한 reference 위치, unsaved overlay, CodeAction.
• `@samchon/graph`, `@ttsc/graph` 같은 compiler-resolved graph provider.
• ContextScope 시각화용 renderer/bubble editor. 먼저 직렬화 scope와 결정적 집합
• provider 자체 idempotency 또는...