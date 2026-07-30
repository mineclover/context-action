---
document_id: context-layered--next-work
category: context-layered
source_path: ko/context-layered/next-work.md
character_limit: 1000
last_update: '2026-07-30T23:07:59.033Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
다음 작업과 문서 소유권

다음 작업과 문서 소유권 이 페이지는 Context-Action 아키텍처와 tool-calling 작업의 유지되는 짧은 backlog다. 의미 계약 문서, 운영 runbook, package README, 생성 API 문서가 서로 다른 TODO 목록을 갖지 않도록 한 곳에서 다음 작업을 관리한다. 문서 소유권 | 관심사 | 기준 문서 | 이 문서에 넣지 않는 것 | | --- | --- | --- | | tool 실행 의미, timeout, abort-drain, idempotency, durable recovery | Tool-calling Editor Architecture | 배포 명령과 장애 대응 | | Redis 배포, retention, rollback, 운영 절차 | Durable Operati

Key points:
• durable operation record에 lease 기반 claim/replay/complete/fail/unknown 전이와
• IndexedDB·Redis·PostgreSQL reference backend, 선택적 Redis client bridge,
• Live Code Editor recovery는 `editor.saveFile`과 `editor.saveAll`을 모두 지원한다.
•...