---
document_id: context-layered--architecture--durable-operation-operations
category: context-layered
source_path: ko/context-layered/architecture/durable-operation-operations.md
character_limit: 5000
last_update: '2026-07-20T17:57:58.103Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Durable Operation 운영 Runbook

Durable Operation 운영 Runbook 이 문서는 Tool-calling editor architecture guide의 의미론적 계약을 실제 Redis 배포 검증과 @context-action/react recovery 경계에 적용하기 위한 운영 문서다. 위 guide가 semantic SSOT다. 이 페이지에는 배포·장애·resolver 운영 절차만 두며, package README가 durable state machine을 다시 복사하지 않고 이 문서로 연결하도록 한다. 경계와 사전 조건 - @context-action/tool-protocol이 durable-operation 상태 머신과 Redis backend를 소유한다. - @context-action/react가 ToolContext와 getOperationStatus()/recoverOperation() registry surface를 소유한다. - 애플리케이션이 domain status query, compensation 결정, downstream idempotency/outbox 동작을 소유한다. - mutation을 실행할 수 있는 모든 process에서 Redis에 접근할 수 있어야 한다. staging/production에서는 TLS URL과 ACL user를 사용하고 credential을 로그에 출력하지 않는다. 배포 검증 배포가 실제 사용하는 Redis endpoint에 public API smoke check를 실행한다. 명령은 고유한 key prefix를 만들고 종료 시 자신의 record를 정리한다. 출력에서 다음 네 검사가 모두 status: "ok" 안에 포함되어야 한다. - 두 store instance 간 atomic claim - 두 번째 owner 없이 completed result replay - revision 검증을 거친 unknown record resolution - terminal record retention prune 두 번째 gate로 전체 integration suite도 실행한다. 이 suite는 8개 동시 owner, lease 만료/reclaim, recovery, bounded retention cleanup을 검증한다. repository CI는 Redis 7로 smoke command와 이 suite를 실행한다. 다만 TLS, ACL 권한, failover, 실제 latency와 연결성은 CI가 증명할 수 없는 배포 속성이므로 staging 또는 production endpoint에서도 별도로 통과시켜야 한다. 검증 증거 기록 대상 환경마다 짧은 evidence record를 하나씩 남긴다. 로컬 Redis 7 컨테이너는 계약을 재현하는 데 유용하지만 staging/production gate를 충족하지는 않는다. | 항목 | 필수 값 | | --- | --- | | 환경 | local, staging, production 중 하나 | | Commit | 애플리케이션의 정확한 commit SHA | | Redis version | 운영자에게 안전한 version 확인 결과의 major/minor | | Endpoint | hostname/port만 기록하고 full URL·credential은 기록하지 않음 | | Smoke | 실행 시각과 status: "ok" | | Integration | 실행 시각과 passed/skipped 개수 | | Operator | 담당자 또는 automation run ID | | Rollback | 승인된 application/backend rollback 판단 | 원본 CI·command 출력은 repository가 아닌 보호된 deployment record에 첨부한다. 어느 gate라도 실패하면 배포를 unverified로 표시하고 원인과 rollback 판단이 기록될 때까지 mutation traffic을 fail-closed로 유지한다. 필수 runtime 설정 | 설정 | 규칙 | | --- | --- | | REDISURL | secret/configuration system에서 주입하고 commit·로그에 남기지 않는다. | | keyPrefix | application/environment별 prefix를 사용하며 무관한 application과 공유하지 않는다. | | durableOperationOwnerId | 한 worker/process 수명 동안 안정적이고 동시 worker 사이에서는 유일해야 한다. | | durableOperationLeaseMs | 정상 handler critical section보다 길게 잡되 큰 값으로 만료를 숨기지 않는다. | | retentionMs | provider retry/reconciliation 창보다 길게 두고 terminal record를 scheduler로 정리한다. | | prunePageSize / maxPrunePages | 한 번의 cleanup을 bounded하게 유지하고 큰 catalog는 여러 번 실행한다. | Redis가 unavailable이면 cross-process durability가 필요한 mutation은 retryable TOOLIDEMPOTENCYSTOREFAILED로 fail closed해야 한다. mutation에 대해 Provider-local memory guard로 조용히 fallback하지 않는다. Observability retention과 redaction ToolCallEvent.provenance는 안전한 숫자·lifecycle evidence지만 event의 ca

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
• retention 기간보다 빠르게 증가하는 operation catalog
• `registry.getOperationStatus(toolName, key, context)`로 record를 읽는다.
• `pending`이면 lease가 끝날 때까지 기다리거나 owner를 조사한다. 같은 key로
• `completed` 또는 `failed`면 기록된 결과를 replay하고 종료한다.
• `unknown`이면 application resolver를 넘겨 `registry.recoverOperation()`을
• resolver가 completed/failed resolution을 반환하면 관찰한 revision으로 atomic
• 진짜 새 logical operation이 필요하면 새 idempotency key를 만들고 기존 record는