---
document_id: context-layered--architecture--durable-operation-operations
category: context-layered
source_path: ko/context-layered/architecture/durable-operation-operations.md
character_limit: 2000
last_update: '2026-07-20T17:57:58.102Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Durable Operation 운영 Runbook

Durable Operation 운영 Runbook 이 문서는 Tool-calling editor architecture guide의 의미론적 계약을 실제 Redis 배포 검증과 @context-action/react recovery 경계에 적용하기 위한 운영 문서다. 위 guide가 semantic SSOT다. 이 페이지에는 배포·장애·resolver 운영 절차만 두며, package README가 durable state machine을 다시 복사하지 않고 이 문서로 연결하도록 한다. 경계와 사전 조건 - @context-action/tool-protocol이 durable-operation 상태 머신과 Redis backend를 소유한다. - @context-action/react가 ToolContext와 getOperationStatus()/recoverOperation() registry surface를 소유한다. - 애플리케이션이 domain status query, compensation 결정, downstream idempotency/outbox 동작을 소유한다. - mutation을 실행할 수 있는 모든 process에서 Redis에 접근할 수 있어야 한다. staging/production에서는 TLS URL과 ACL user를 사용하고 credential을 로그에 출력하지 않는다. 배포 검증 배포가 실제 사용하는 Redis endpoint에 public API smoke check를 실행한다. 명령은 고유한 key prefix를 만들고 종료 시 자신의 record를 정리한다. 출력에서 다음 네 검사가 모두 status: "ok" 안에 포함되어야 한다. - 두 store instance 간 atomic claim - 두 번째 owner 없이 completed result replay - revision 검증을 거친 unknown record resolution - termi

Key points:
• `@context-action/tool-protocol`이 durable-operation 상태 머신과 Redis backend를 소유한다.
• `@context-action/react`가 `ToolContext`와
• 애플리케이션이 domain status query, compensation 결정, downstream
• mutation을 실행할 수 있는 모든 process에서 Redis에 접근할 수 있어야 한다.
• 두 store instance 간 atomic claim
• 두 번째 owner 없이 completed result replay
• revision 검증을 거친 `unknown` record resolution
• terminal record retention prune
• `TOOL_IDEMPOTENCY_STORE_FAILED` 비율과 Redis command latency
• `TOOL_IDEMPOTENCY_UNKNOWN` 개수와 age
• lease보다 오래된 pending record
• 반복되는 CAS contention 또는 prune 실패
• retention 기간보다 빠르게 증가하는 operation...