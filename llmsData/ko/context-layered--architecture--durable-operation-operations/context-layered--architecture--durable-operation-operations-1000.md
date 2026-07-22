---
document_id: context-layered--architecture--durable-operation-operations
category: context-layered
source_path: ko/context-layered/architecture/durable-operation-operations.md
character_limit: 1000
last_update: '2026-07-20T17:57:58.102Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Durable Operation 운영 Runbook

Durable Operation 운영 Runbook 이 문서는 Tool-calling editor architecture guide의 의미론적 계약을 실제 Redis 배포 검증과 @context-action/react recovery 경계에 적용하기 위한 운영 문서다. 위 guide가 semantic SSOT다. 이 페이지에는 배포·장애·resolver 운영 절차만 두며, package README가 durable state machine을 다시 복사하지 않고 이 문서로 연결하도록 한다. 경계와 사전 조건 - @context-action/tool-protocol이 durable-operation 상태 머신과 Redis backend를 소유

Key points:
• `@context-action/tool-protocol`이 durable-operation 상태 머신과 Redis backend를 소유한다.
• `@context-action/react`가 `ToolContext`와
• 애플리케이션이 domain status query, compensation 결정, downstream
• mutation을...