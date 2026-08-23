---
document_id: context-layered--integration-profiles
category: context-layered
source_path: ko/context-layered/integration-profiles.md
character_limit: 1000
last_update: '2026-08-23T04:57:50.659Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Integration Profile

Integration Profile Integration Profile은 외부 도메인이 Context-Action을 사용할 때 따르는 버전 있는 컨벤션입니다. @context-action/core에 도메인 타입이나 업무 규칙을 넣지 않고, lifecycle·상태 소유권·호환성·증빙 조건을 catalog로 공급합니다. Lifecycle draft → registered → verified → supported → deprecated - draft: 제안만 있고 consumer 계약은 아직 없습니다. - registered: action/state 소유권 manifest와 consumer가 정해졌습니다. - verified: 필요한 consumer lifecycle 증빙이 통과했습니다.

Key points:
• **draft**: 제안만 있고 consumer 계약은 아직 없습니다.
• **registered**: action/state 소유권 manifest와 consumer가 정해졌습니다.
• **verified**: 필요한 consumer lifecycle 증빙이 통과했습니다.
• **supported**: 호환성·릴리즈 증빙에 포함됩니다.
• **deprecated**: 대체...