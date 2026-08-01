---
document_id: context-layered--decisions--index
category: context-layered
source_path: ko/context-layered/decisions/index.md
character_limit: 5000
last_update: '2026-08-01T04:34:43.434Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
아키텍처 결정 기록

아키텍처 결정 기록 결정 기록은 지속되는 아키텍처 선택을 해당 컨벤션 가까이에 보관합니다. 이는 runtime registry가 아니며 package README나 공개 가이드를 중복하지 않습니다. 작성 시점 package 소유권 또는 의존성 방향, provider/handler/store 경계, protocol 계약, persistence·privacy 동작, 임시 compatibility 예외가 바뀌면 기록을 작성합니다. 파일명에는 CA-TOOL-PROTOCOL-001.md처럼 안정적인 ID를 사용합니다. 구현 경로가 바뀌어도 ID는 유지하고, 결정이 대체되면 후속 기록을 연결합니다. 필수 형식 구현, 집중 테스트, 권위 사용자 문서는 결정의 증거를 각각 소유합니다. 이 인덱스는 결정 자체의 지속되는 위치와 형식만 정의합니다. 기존 참조 결정 - PostgreSQL Durable Operation Adapter

Key points:
• [PostgreSQL Durable Operation Adapter](../architecture/postgres-durable-operation-adapter.md)