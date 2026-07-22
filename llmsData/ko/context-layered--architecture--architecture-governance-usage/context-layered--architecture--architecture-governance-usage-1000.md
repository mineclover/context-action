---
document_id: context-layered--architecture--architecture-governance-usage
category: context-layered
source_path: ko/context-layered/architecture/architecture-governance-usage.md
character_limit: 1000
last_update: '2026-07-20T17:25:11.392Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
아키텍처 거버넌스 사용 방법

아키텍처 거버넌스 사용 방법 이 문서는 저장소 checkout부터 재현 가능한 Architecture Governance 심볼 catalog를 만드는 가장 짧은 경로를 설명합니다. 개념은 아키텍처 거버넌스 개요를, 전체 API와 계약은 package README를 참고하세요. 이 도구는 Context-Action convention을 repository-local authored rule과 evidence로 검증하는 PoC입니다. 범용 architecture analyzer나 문서 생성기로 사용하지 않으며, 작업 컨텍스트와 document binding의 심볼 컨텍스트 SSOT는 별도 패키지인 sem-doc이 유지합니다. 1. 저장소 준